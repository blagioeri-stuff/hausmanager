import { COMPONENT_TYPES } from './component-types';
import type { RawComponent, EnrichedComponent, ReserveSummary, ReserveProjectionRow } from '@/types';

export function enrichComponent(
  component: RawComponent,
  currentYear: number = new Date().getFullYear()
): EnrichedComponent {
  const typeDef = COMPONENT_TYPES[component.typeKey];
  if (!typeDef) throw new Error(`Unknown component type: ${component.typeKey}`);

  // plannedRenovationCostChf overrides customCostChf overrides type default
  const effectiveCostChf =
    component.plannedRenovationCostChf ?? component.customCostChf ?? typeDef.defaultCostChf;
  const effectiveLifetimeYrs = component.customLifetimeYrs ?? typeDef.defaultLifetimeYrs;

  // plannedRenovationYear overrides calculated replacement year
  const replacementYear =
    component.plannedRenovationYear ?? (component.buildYear + effectiveLifetimeYrs);
  const yearsRemaining = replacementYear - currentYear;
  const ageYears = currentYear - component.buildYear;
  const ageRatio = Math.min(Math.max(ageYears / effectiveLifetimeYrs, 0), 1);

  // renovationPlanned = false with no manual year/cost → exclude from cost projections
  const hasManualRenovation =
    !component.renovationPlanned &&
    component.plannedRenovationYear !== null &&
    component.plannedRenovationCostChf !== null;
  const includeInCosts = component.renovationPlanned !== false || hasManualRenovation;

  const annualSavingsChf = includeInCosts ? effectiveCostChf / effectiveLifetimeYrs : 0;
  const totalReserveNeededChf = includeInCosts ? annualSavingsChf * Math.max(yearsRemaining, 0) : 0;
  // SOLL: what should have been saved up by now (proportional to age)
  const sollReserveChf = includeInCosts ? effectiveCostChf * Math.min(ageYears / effectiveLifetimeYrs, 1) : 0;

  const statusColor: 'green' | 'yellow' | 'red' =
    ageRatio < 0.5 ? 'green' : ageRatio < 0.8 ? 'yellow' : 'red';

  return {
    ...component,
    typeDef,
    effectiveCostChf,
    effectiveLifetimeYrs,
    replacementYear,
    yearsRemaining,
    ageYears,
    ageRatio,
    annualSavingsChf,
    totalReserveNeededChf,
    sollReserveChf,
    statusColor,
  };
}

/**
 * Compute sollReserveChf for a component at a given target year,
 * correctly resetting to 0 after each renovation cycle.
 *
 * Before first replacement: age-proportional from original build year.
 * After first replacement: cycle-based (resets to 0 at each renewal).
 */
function computeSollAtYear(component: RawComponent, targetYear: number): number {
  const typeDef = COMPONENT_TYPES[component.typeKey];
  const effectiveCostChf =
    component.plannedRenovationCostChf ?? component.customCostChf ?? typeDef.defaultCostChf;
  const effectiveLifetimeYrs = component.customLifetimeYrs ?? typeDef.defaultLifetimeYrs;
  const firstReplacementYear =
    component.plannedRenovationYear ?? (component.buildYear + effectiveLifetimeYrs);

  if (targetYear < firstReplacementYear) {
    const ageYears = Math.max(0, targetYear - component.buildYear);
    return effectiveCostChf * Math.min(ageYears / effectiveLifetimeYrs, 1);
  } else {
    // After first renewal: SOLL resets to 0, grows proportionally in each cycle
    const yearsAfterFirst = targetYear - firstReplacementYear;
    const yearInCycle = yearsAfterFirst % effectiveLifetimeYrs;
    return effectiveCostChf * (yearInCycle / effectiveLifetimeYrs);
  }
}

/**
 * Enrich a component as it would appear at a specific target year,
 * correctly handling post-renovation cycles (SOLL resets to 0 at each renewal).
 */
export function enrichComponentAtYear(
  component: RawComponent,
  targetYear: number
): EnrichedComponent {
  const typeDef = COMPONENT_TYPES[component.typeKey];
  const effectiveCostChf =
    component.plannedRenovationCostChf ?? component.customCostChf ?? typeDef.defaultCostChf;
  const effectiveLifetimeYrs = component.customLifetimeYrs ?? typeDef.defaultLifetimeYrs;
  const firstReplacementYear =
    component.plannedRenovationYear ?? (component.buildYear + effectiveLifetimeYrs);

  if (targetYear >= firstReplacementYear) {
    // Compute which cycle we're in and create a virtual component starting at that cycle's build year
    const yearsAfterFirst = targetYear - firstReplacementYear;
    const cyclesPassed = Math.floor(yearsAfterFirst / effectiveLifetimeYrs);
    const virtualBuildYear = firstReplacementYear + cyclesPassed * effectiveLifetimeYrs;
    return enrichComponent(
      {
        ...component,
        buildYear: virtualBuildYear,
        plannedRenovationYear: null,
        customCostChf: effectiveCostChf,
        plannedRenovationCostChf: null,
      },
      targetYear
    );
  }

  return enrichComponent(component, targetYear);
}

export function computeReserveSummary(
  enriched: EnrichedComponent[],
  istReserveChf: number = 0
): ReserveSummary {
  const totalAnnualSavingsChf = enriched.reduce((sum, c) => sum + c.annualSavingsChf, 0);
  const totalReserveNeededChf = enriched.reduce((sum, c) => sum + c.totalReserveNeededChf, 0);
  const totalSollReserveChf = enriched.reduce((sum, c) => sum + c.sollReserveChf, 0);

  const deckungsgradPct =
    totalSollReserveChf > 0 ? (istReserveChf / totalSollReserveChf) * 100 : null;

  const sorted = [...enriched]
    .filter((c) => c.yearsRemaining >= 0)
    .sort((a, b) => a.replacementYear - b.replacementYear);

  const nextReplacement = sorted[0] ?? null;
  const componentsDueIn10Years = sorted.filter((c) => c.yearsRemaining <= 10);

  return {
    totalAnnualSavingsChf,
    totalReserveNeededChf,
    totalSollReserveChf,
    istReserveChf,
    deckungsgradPct,
    componentCount: enriched.length,
    nextReplacementComponent: nextReplacement,
    nextReplacementYear: nextReplacement?.replacementYear ?? null,
    componentsDueIn10Years,
  };
}

export function buildReserveProjection(
  enriched: EnrichedComponent[],
  horizonYears: number = 15,
  istReserveChf: number = 0,
  annualContribution: number = 0
): ReserveProjectionRow[] {
  const currentYear = new Date().getFullYear();
  const annualTotal = enriched.reduce((sum, c) => sum + c.annualSavingsChf, 0);
  const startingBalance = enriched.reduce((sum, c) => sum + c.sollReserveChf, 0);

  const rawComponents = enriched as unknown as RawComponent[];

  // Split expenditures into user-planned vs lifetime-calculated per year
  // Skip components where renovation is not planned and no manual year/cost is set
  const plannedByYear = new Map<number, number>();
  const calculatedByYear = new Map<number, number>();
  for (const c of enriched) {
    const hasManualRenovation =
      !c.renovationPlanned &&
      c.plannedRenovationYear !== null &&
      c.plannedRenovationCostChf !== null;
    if (!c.renovationPlanned && !hasManualRenovation) continue; // excluded from cost projections
    const isPlanned = c.plannedRenovationYear !== null;
    const target = isPlanned ? plannedByYear : calculatedByYear;
    const existing = target.get(c.replacementYear) ?? 0;
    target.set(c.replacementYear, existing + c.effectiveCostChf);
  }

  const rows: ReserveProjectionRow[] = [];
  let cumulativeExpenditure = 0;
  let runningBalance = startingBalance;
  let istBalance = istReserveChf;

  for (let i = 0; i <= horizonYears; i++) {
    const year = currentYear + i;
    const expenditurePlanned = plannedByYear.get(year) ?? 0;
    const expenditureCalculated = calculatedByYear.get(year) ?? 0;
    const expenditure = expenditurePlanned + expenditureCalculated;
    const accumulated = Math.round(annualTotal * i);
    cumulativeExpenditure += expenditure;
    const balance = accumulated - cumulativeExpenditure;

    if (i > 0) {
      runningBalance = runningBalance + annualTotal - expenditure;
      istBalance = istBalance + annualContribution - expenditure;
    }

    // SOLL balance: sum of per-component SOLL at this year (resets after renovation)
    const sollBalance = Math.round(
      rawComponents.reduce((s, c) => s + computeSollAtYear(c, year), 0)
    );

    rows.push({
      year,
      accumulated,
      expenditure: Math.round(expenditure),
      expenditurePlanned: Math.round(expenditurePlanned),
      expenditureCalculated: Math.round(expenditureCalculated),
      balance: Math.round(balance),
      runningBalance: Math.round(runningBalance),
      sollBalance,
      istBalance: Math.round(istBalance),
    });
  }

  return rows;
}

/**
 * Returns raw components that have an expenditure (replacement) due in the given year.
 * Correctly handles repeated cycles after the first renovation.
 */
export function getExpenditureComponentsForYear(
  rawComponents: RawComponent[],
  year: number
): RawComponent[] {
  return rawComponents.filter((c) => {
    const typeDef = COMPONENT_TYPES[c.typeKey];
    if (!typeDef) return false;
    const effectiveLifetimeYrs = c.customLifetimeYrs ?? typeDef.defaultLifetimeYrs;
    const firstReplacementYear =
      c.plannedRenovationYear ?? (c.buildYear + effectiveLifetimeYrs);
    if (firstReplacementYear === year) return true;
    const yearsAfterFirst = year - firstReplacementYear;
    return yearsAfterFirst > 0 && yearsAfterFirst % effectiveLifetimeYrs === 0;
  });
}
