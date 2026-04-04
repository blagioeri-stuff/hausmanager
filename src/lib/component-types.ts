export type ComponentCategory = 'innen' | 'aussen' | 'technik' | 'sonstiges';

export interface ComponentTypeDefinition {
  key: string;
  labelDe: string;
  defaultLifetimeYrs: number;
  defaultCostChf: number;
  category: ComponentCategory;
}

export const COMPONENT_TYPES: Record<string, ComponentTypeDefinition> = {
  kueche: {
    key: 'kueche',
    labelDe: 'Küche',
    defaultLifetimeYrs: 20,
    defaultCostChf: 30_000,
    category: 'innen',
  },
  badezimmer: {
    key: 'badezimmer',
    labelDe: 'Badezimmer',
    defaultLifetimeYrs: 25,
    defaultCostChf: 20_000,
    category: 'innen',
  },
  wc: {
    key: 'wc',
    labelDe: 'WC',
    defaultLifetimeYrs: 25,
    defaultCostChf: 8_000,
    category: 'innen',
  },
  heizung: {
    key: 'heizung',
    labelDe: 'Heizung',
    defaultLifetimeYrs: 20,
    defaultCostChf: 25_000,
    category: 'technik',
  },
  dach: {
    key: 'dach',
    labelDe: 'Dach',
    defaultLifetimeYrs: 40,
    defaultCostChf: 50_000,
    category: 'aussen',
  },
  fenster: {
    key: 'fenster',
    labelDe: 'Fenster',
    defaultLifetimeYrs: 30,
    defaultCostChf: 25_000,
    category: 'aussen',
  },
  fassade: {
    key: 'fassade',
    labelDe: 'Fassade',
    defaultLifetimeYrs: 30,
    defaultCostChf: 40_000,
    category: 'aussen',
  },
  bodenbelaege: {
    key: 'bodenbelaege',
    labelDe: 'Bodenbeläge',
    defaultLifetimeYrs: 20,
    defaultCostChf: 15_000,
    category: 'innen',
  },
  elektro: {
    key: 'elektro',
    labelDe: 'Elektroinstallation',
    defaultLifetimeYrs: 40,
    defaultCostChf: 20_000,
    category: 'technik',
  },
  sanitaer: {
    key: 'sanitaer',
    labelDe: 'Sanitärinstallation',
    defaultLifetimeYrs: 40,
    defaultCostChf: 15_000,
    category: 'technik',
  },
  maler_innen: {
    key: 'maler_innen',
    labelDe: 'Malerarbeiten Innen',
    defaultLifetimeYrs: 10,
    defaultCostChf: 8_000,
    category: 'innen',
  },
  maler_aussen: {
    key: 'maler_aussen',
    labelDe: 'Malerarbeiten Aussen',
    defaultLifetimeYrs: 10,
    defaultCostChf: 12_000,
    category: 'aussen',
  },
  garten: {
    key: 'garten',
    labelDe: 'Garten',
    defaultLifetimeYrs: 15,
    defaultCostChf: 20_000,
    category: 'sonstiges',
  },
  garage: {
    key: 'garage',
    labelDe: 'Garage / Carport',
    defaultLifetimeYrs: 40,
    defaultCostChf: 30_000,
    category: 'sonstiges',
  },
  kuechen_geraete: {
    key: 'kuechen_geraete',
    labelDe: 'Küchengeräte',
    defaultLifetimeYrs: 12,
    defaultCostChf: 8_000,
    category: 'innen',
  },
};

export const COMPONENT_TYPE_LIST = Object.values(COMPONENT_TYPES).sort((a, b) =>
  a.labelDe.localeCompare(b.labelDe, 'de')
);

export const CATEGORY_LABELS: Record<ComponentCategory, string> = {
  innen: 'Innen',
  aussen: 'Aussen',
  technik: 'Technik',
  sonstiges: 'Sonstiges',
};
