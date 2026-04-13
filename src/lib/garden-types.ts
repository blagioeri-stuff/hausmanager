export interface PlantTypeDefinition {
  key: string;
  labelDe: string;
  icon: string;
  defaultPruningMonths?: number[];
  defaultWinterProtection?: boolean;
}

export interface GardenElementTypeDefinition {
  key: string;
  labelDe: string;
  icon: string;
}

export const PLANT_TYPES: Record<string, PlantTypeDefinition> = {
  baum: {
    key: 'baum',
    labelDe: 'Baum',
    icon: '🌳',
    defaultPruningMonths: [2, 3],
    defaultWinterProtection: false,
  },
  strauch: {
    key: 'strauch',
    labelDe: 'Strauch / Hecke',
    icon: '🌿',
    defaultPruningMonths: [3, 9],
    defaultWinterProtection: false,
  },
  staude: {
    key: 'staude',
    labelDe: 'Staude / Blume',
    icon: '🌸',
    defaultPruningMonths: [3, 10],
    defaultWinterProtection: true,
  },
  gemüse: {
    key: 'gemüse',
    labelDe: 'Gemüse',
    icon: '🥦',
    defaultPruningMonths: [],
    defaultWinterProtection: false,
  },
  obst: {
    key: 'obst',
    labelDe: 'Obstbaum / -strauch',
    icon: '🍎',
    defaultPruningMonths: [2, 3],
    defaultWinterProtection: false,
  },
  kräuter: {
    key: 'kräuter',
    labelDe: 'Kräuter',
    icon: '🌱',
    defaultPruningMonths: [5, 9],
    defaultWinterProtection: true,
  },
  kletterpflanze: {
    key: 'kletterpflanze',
    labelDe: 'Kletterpflanze',
    icon: '🌿',
    defaultPruningMonths: [3],
    defaultWinterProtection: true,
  },
  rasen: {
    key: 'rasen',
    labelDe: 'Rasen',
    icon: '🟩',
    defaultPruningMonths: [],
    defaultWinterProtection: false,
  },
  sonstiges: {
    key: 'sonstiges',
    labelDe: 'Sonstiges',
    icon: '🌿',
    defaultPruningMonths: [],
    defaultWinterProtection: false,
  },
};

export const PLANT_TYPE_LIST = Object.values(PLANT_TYPES).sort((a, b) =>
  a.labelDe.localeCompare(b.labelDe, 'de')
);

export const GARDEN_ELEMENT_TYPES: Record<string, GardenElementTypeDefinition> = {
  teich: { key: 'teich', labelDe: 'Teich / Wasserfläche', icon: '💧' },
  terrasse: { key: 'terrasse', labelDe: 'Terrasse / Balkon', icon: '🪑' },
  hochbeet: { key: 'hochbeet', labelDe: 'Hochbeet', icon: '🪣' },
  gewächshaus: { key: 'gewächshaus', labelDe: 'Gewächshaus', icon: '🏡' },
  rasenfläche: { key: 'rasenfläche', labelDe: 'Rasenfläche', icon: '🌾' },
  weg: { key: 'weg', labelDe: 'Weg / Pfad', icon: '🛤️' },
  sitzplatz: { key: 'sitzplatz', labelDe: 'Sitzplatz / Pavillon', icon: '⛺' },
  kompost: { key: 'kompost', labelDe: 'Kompost', icon: '♻️' },
  sonstiges: { key: 'sonstiges', labelDe: 'Sonstiges', icon: '📦' },
};

export const GARDEN_ELEMENT_TYPE_LIST = Object.values(GARDEN_ELEMENT_TYPES).sort((a, b) =>
  a.labelDe.localeCompare(b.labelDe, 'de')
);

export const PLANT_STATUS_OPTIONS = [
  { value: 'gut', label: 'Gut', color: 'green' },
  { value: 'pflege_nötig', label: 'Pflege nötig', color: 'yellow' },
  { value: 'krank', label: 'Krank', color: 'red' },
  { value: 'dormant', label: 'Winterruhe', color: 'gray' },
] as const;

export const TODO_CATEGORIES = [
  { value: 'pflege', label: 'Pflege' },
  { value: 'düngen', label: 'Düngen' },
  { value: 'bewässerung', label: 'Bewässerung' },
  { value: 'schutz', label: 'Schutz / Einwintern' },
  { value: 'ernte', label: 'Ernte' },
  { value: 'einwintern', label: 'Einwintern' },
  { value: 'pflanzung', label: 'Pflanzung / Aussaat' },
  { value: 'sonstiges', label: 'Sonstiges' },
];

export const TODO_PRIORITIES = [
  { value: 'niedrig', label: 'Niedrig' },
  { value: 'normal', label: 'Normal' },
  { value: 'hoch', label: 'Hoch' },
];

export const MONTHS_DE = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

// Seasonal todo templates: month → suggested tasks
export const SEASONAL_TODOS: Record<number, { title: string; category: string; plantTypes?: string[] }[]> = {
  1: [
    { title: 'Frostschutz überprüfen', category: 'schutz' },
    { title: 'Gartenplanung für das neue Jahr', category: 'sonstiges' },
    { title: 'Gehölzschnitt bei frostfreiem Wetter', category: 'pflege', plantTypes: ['baum', 'strauch'] },
  ],
  2: [
    { title: 'Obstbäume schneiden', category: 'pflege', plantTypes: ['obst', 'baum'] },
    { title: 'Samen bestellen / vorbereiten', category: 'pflanzung' },
    { title: 'Kompost umschichten', category: 'sonstiges' },
  ],
  3: [
    { title: 'Sträucher schneiden', category: 'pflege', plantTypes: ['strauch'] },
    { title: 'Erste Aussaat im Gewächshaus', category: 'pflanzung', plantTypes: ['gemüse', 'kräuter'] },
    { title: 'Stauden zurückschneiden', category: 'pflege', plantTypes: ['staude'] },
    { title: 'Ersten Dünger ausbringen', category: 'düngen' },
  ],
  4: [
    { title: 'Frostschutz entfernen', category: 'schutz' },
    { title: 'Gemüse auspflanzen (nach letztem Frost)', category: 'pflanzung', plantTypes: ['gemüse'] },
    { title: 'Rasenpflege: Vertikutieren / Düngen', category: 'pflege', plantTypes: ['rasen'] },
    { title: 'Teich reinigen und prüfen', category: 'pflege' },
  ],
  5: [
    { title: 'Eisheiligen abwarten (11.–15. Mai)', category: 'schutz' },
    { title: 'Kräuter aussäen / auspflanzen', category: 'pflanzung', plantTypes: ['kräuter'] },
    { title: 'Bewässerungssystem prüfen', category: 'bewässerung' },
  ],
  6: [
    { title: 'Regelmässig giessen (Trockenheit)', category: 'bewässerung' },
    { title: 'Schädlinge kontrollieren', category: 'pflege' },
    { title: 'Hecken schneiden', category: 'pflege', plantTypes: ['strauch'] },
  ],
  7: [
    { title: 'Sommerfrüchte ernten', category: 'ernte', plantTypes: ['obst', 'gemüse'] },
    { title: 'Kräuter ernten und trocknen', category: 'ernte', plantTypes: ['kräuter'] },
    { title: 'Rasen nicht zu kurz schneiden (Hitzeschutz)', category: 'pflege', plantTypes: ['rasen'] },
  ],
  8: [
    { title: 'Herbstaussaat vorbereiten', category: 'pflanzung', plantTypes: ['gemüse'] },
    { title: 'Herbstdünger für Rasen', category: 'düngen', plantTypes: ['rasen'] },
    { title: 'Ernte sichern und einlagern', category: 'ernte' },
  ],
  9: [
    { title: 'Herbstschnitt Sträucher', category: 'pflege', plantTypes: ['strauch'] },
    { title: 'Zwiebeln setzen (Tulpen, Narzissen)', category: 'pflanzung', plantTypes: ['staude'] },
    { title: 'Teich Herbstvorbereitung', category: 'pflege' },
    { title: 'Kompost anlegen', category: 'sonstiges' },
  ],
  10: [
    { title: 'Empfindliche Pflanzen einwintern', category: 'einwintern', plantTypes: ['staude', 'kräuter', 'kletterpflanze'] },
    { title: 'Laub zusammenrechen', category: 'pflege' },
    { title: 'Winterschutz anbringen', category: 'schutz' },
    { title: 'Letzte Ernte sichern', category: 'ernte' },
  ],
  11: [
    { title: 'Frostempfindliche Pflanzen schützen', category: 'schutz' },
    { title: 'Gartengeräte reinigen und einlagern', category: 'sonstiges' },
    { title: 'Obstbäume kalken (Stammschutz)', category: 'pflege', plantTypes: ['obst', 'baum'] },
  ],
  12: [
    { title: 'Frostschutz kontrollieren', category: 'schutz' },
    { title: 'Saatgutkatalog studieren', category: 'sonstiges' },
    { title: 'Gartenplan für nächstes Jahr erstellen', category: 'sonstiges' },
  ],
};
