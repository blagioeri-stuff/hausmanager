import type { ComponentTypeDefinition } from '@/lib/component-types';

export interface RawComponent {
  id: string;
  name: string;
  typeKey: string;
  buildYear: number;
  customCostChf: number | null;
  customLifetimeYrs: number | null;
  plannedRenovationYear: number | null;
  plannedRenovationCostChf: number | null;
  notes: string | null;
  renovationPlanned: boolean;
  maintenanceIntervalMonths: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface EnrichedComponent extends RawComponent {
  typeDef: ComponentTypeDefinition;
  effectiveCostChf: number;
  effectiveLifetimeYrs: number;
  replacementYear: number;
  yearsRemaining: number;
  ageYears: number;
  ageRatio: number;
  annualSavingsChf: number;
  totalReserveNeededChf: number;
  sollReserveChf: number;
  statusColor: 'green' | 'yellow' | 'red';
}

export interface ReserveSummary {
  totalAnnualSavingsChf: number;
  totalReserveNeededChf: number;
  totalSollReserveChf: number;
  istReserveChf: number;
  deckungsgradPct: number | null;
  componentCount: number;
  nextReplacementComponent: EnrichedComponent | null;
  nextReplacementYear: number | null;
  componentsDueIn10Years: EnrichedComponent[];
}

export interface ReserveProjectionRow {
  year: number;
  accumulated: number;
  expenditure: number;
  expenditurePlanned: number;   // user-entered plannedRenovationYear
  expenditureCalculated: number; // derived from buildYear + lifetime
  balance: number;
  runningBalance: number;
  sollBalance: number;
  istBalance: number;
}

export interface RawMaintenanceEntry {
  id: string;
  componentId: string;
  date: string;
  description: string;
  costChf: number | null;
  serviceProvider: string | null;
  createdAt: string;
}

export interface RawDocument {
  id: string;
  componentId: string;
  filename: string;
  storedName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
}

export interface RawGardenPlant {
  id: string;
  name: string;
  latinName: string | null;
  typeKey: string;
  locationHint: string | null;
  posX: number | null;
  posY: number | null;
  plantedYear: number | null;
  status: string;
  winterProtection: boolean;
  wateringIntervalDays: number | null;
  fertilizingWeeks: number | null;
  pruningMonths: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RawGardenElement {
  id: string;
  name: string;
  typeKey: string;
  posX: number | null;
  posY: number | null;
  sizeM2: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RawGardenPhoto {
  id: string;
  storedName: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  notes: string | null;
  plantId: string | null;
  elementId: string | null;
  uploadedAt: string;
}

export interface RawGardenTodo {
  id: string;
  title: string;
  description: string | null;
  dueMonth: number | null;
  recurring: boolean;
  done: boolean;
  doneAt: string | null;
  priority: string;
  category: string;
  plantId: string | null;
  elementId: string | null;
  createdAt: string;
  updatedAt: string;
}
