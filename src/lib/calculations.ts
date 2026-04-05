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

  const annualSavingsChf = effectiveCostChf / effectiveLifetimeYrs;
  const totalReserveNeededChf = annualSavingsChf * Math.max(yearsRemaining, 0);
  // SOLL: what should have been saved up by now (proportional to age)
  const sollReserveChf = effectiveCostChf * Math.min(ageYears / effectiveLifetimeYrs, 1);

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

export function enrichComponentAtYear(
  component: RawComponent,
  targetYear: number
): EnrichedComponent {
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
  horizonYears: number = 40,
  istReserveChf: number = 0,
  annualContribution: number = 0
): ReserveProjectionRow[] {
  const currentYear = new Date().getFullYear();
  const annualTotal = enriched.reduce((sum, c) => sum + c.annualSavingsChf, 0);
  // Starting balance = total SOLL reserve (what should be in the account today)
  const startingBalance = enriched.reduce((sum, c) => sum + c.sollReserveChf, 0);

  const expendituresByYear = new Map<number, number>();
  for (const c of enriched) {
    const existing = expendituresByYear.get(c.replacementYear) ?? 0;
    expendituresByYear.set(c.replacementYear, existing + c.effectiveCostChf);
  }

  // For sollBalance per year: re-enrich each component at that year
  const rawComponents = enriched as unknown as RawComponent[];

  const rows: ReserveProjectionRow[] = [];
  let cumulativeExpenditure = 0;
  let runningBalance = startingBalance;
  let istBalance = istReserveChf;

  for (let i = 0; i <= horizonYears; i++) {
    const year = currentYear + i;
    const expenditure = expendituresByYear.get(year) ?? 0;
    const accumulated = Math.round(annualTotal * i);
    cumulativeExpenditure += expenditure;
    const balance = accumulated - cumulativeExpenditure;

    if (i > 0) {
      runningBalance = runningBalance + annualTotal - expenditure;
      istBalance = istBalance + annualContribution - expenditure;
    }

    // SOLL balance: sum of sollReserveChf for each component at this year
    const sollBalance = Math.round(
      rawComponents.reduce((s, c) => s + enrichComponentAtYear(c, year).sollReserveChf, 0)
    );

    rows.push({
      year,
      accumulated,
      expenditure: Math.round(expenditure),
      balance: Math.round(balance),
      runningBalance: Math.round(runningBalance),
      sollBalance,
      istBalance: Math.round(istBalance),
    });
  }

  return rows;
}
