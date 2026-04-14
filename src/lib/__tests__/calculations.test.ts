import { describe, it, expect } from 'vitest';
import { enrichComponent, buildReserveProjection } from '../calculations';
import type { RawComponent } from '@/types';

function makeComponent(overrides: Partial<RawComponent> = {}): RawComponent {
  return {
    id: 'test-1',
    name: 'Testdach',
    typeKey: 'dach',
    buildYear: 2000,
    customCostChf: null,
    customLifetimeYrs: null,
    plannedRenovationYear: null,
    plannedRenovationCostChf: null,
    notes: null,
    renovationPlanned: true,
    maintenanceIntervalMonths: null,
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2020-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('enrichComponent — renovationPlanned modes', () => {
  const currentYear = 2025;

  it('mode 1: renovationPlanned=true → includes in cost projections', () => {
    const c = makeComponent({ renovationPlanned: true });
    const enriched = enrichComponent(c, currentYear);
    expect(enriched.annualSavingsChf).toBeGreaterThan(0);
    expect(enriched.totalReserveNeededChf).toBeGreaterThan(0);
    expect(enriched.sollReserveChf).toBeGreaterThan(0);
  });

  it('mode 2: renovationPlanned=false, no manual → excluded (zero costs)', () => {
    const c = makeComponent({
      renovationPlanned: false,
      plannedRenovationYear: null,
      plannedRenovationCostChf: null,
    });
    const enriched = enrichComponent(c, currentYear);
    expect(enriched.annualSavingsChf).toBe(0);
    expect(enriched.totalReserveNeededChf).toBe(0);
    expect(enriched.sollReserveChf).toBe(0);
  });

  it('mode 3: renovationPlanned=false, with manual year+cost → uses manual cost', () => {
    const c = makeComponent({
      renovationPlanned: false,
      plannedRenovationYear: 2030,
      plannedRenovationCostChf: 40000,
    });
    const enriched = enrichComponent(c, currentYear);
    expect(enriched.annualSavingsChf).toBeGreaterThan(0);
    expect(enriched.effectiveCostChf).toBe(40000);
    expect(enriched.replacementYear).toBe(2030);
  });

  it('replacementYear uses plannedRenovationYear when set', () => {
    const c = makeComponent({ renovationPlanned: true, plannedRenovationYear: 2035 });
    const enriched = enrichComponent(c, currentYear);
    expect(enriched.replacementYear).toBe(2035);
  });

  it('replacementYear falls back to buildYear + lifetime', () => {
    const c = makeComponent({ renovationPlanned: true, buildYear: 2010 });
    const enriched = enrichComponent(c, currentYear);
    // dach has defaultLifetimeYrs = 40
    expect(enriched.replacementYear).toBe(2010 + 40);
  });

  it('customCostChf overrides type default', () => {
    const c = makeComponent({ renovationPlanned: true, customCostChf: 99000 });
    const enriched = enrichComponent(c, currentYear);
    expect(enriched.effectiveCostChf).toBe(99000);
  });

  it('plannedRenovationCostChf overrides customCostChf', () => {
    const c = makeComponent({
      renovationPlanned: false,
      plannedRenovationYear: 2030,
      plannedRenovationCostChf: 25000,
      customCostChf: 99000,
    });
    const enriched = enrichComponent(c, currentYear);
    expect(enriched.effectiveCostChf).toBe(25000);
  });
});

describe('buildReserveProjection — excluded components', () => {
  const currentYear = 2025;

  it('excluded component (renovationPlanned=false, no manual) has no expenditure in projection', () => {
    const excluded = makeComponent({
      renovationPlanned: false,
      plannedRenovationYear: null,
      plannedRenovationCostChf: null,
      buildYear: 2020, // close replacement year
    });
    const enriched = [enrichComponent(excluded, currentYear)];
    const rows = buildReserveProjection(enriched, 20, 0, 0);
    const totalExpenditure = rows.reduce((sum, r) => sum + r.expenditure, 0);
    expect(totalExpenditure).toBe(0);
  });

  it('included component (renovationPlanned=true) has expenditure in projection', () => {
    const included = makeComponent({
      renovationPlanned: true,
      buildYear: 2000,
    });
    const enriched = [enrichComponent(included, currentYear)];
    const rows = buildReserveProjection(enriched, 20, 0, 0);
    const totalExpenditure = rows.reduce((sum, r) => sum + r.expenditure, 0);
    expect(totalExpenditure).toBeGreaterThan(0);
  });

  it('annual savings is 0 for excluded component', () => {
    const excluded = makeComponent({
      renovationPlanned: false,
      plannedRenovationYear: null,
      plannedRenovationCostChf: null,
    });
    const enriched = enrichComponent(excluded, currentYear);
    expect(enriched.annualSavingsChf).toBe(0);
    const rows = buildReserveProjection([enriched], 5, 0, 0);
    rows.forEach((r) => expect(r.expenditure).toBe(0));
  });
});
