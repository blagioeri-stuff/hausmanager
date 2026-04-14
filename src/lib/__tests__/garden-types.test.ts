import { describe, it, expect } from 'vitest';
import {
  PLANT_TYPES,
  PLANT_TYPE_LIST,
  GARDEN_ELEMENT_TYPES,
  GARDEN_ELEMENT_TYPE_LIST,
  MONTHS_DE,
  TODO_CATEGORIES,
  TODO_PRIORITIES,
} from '../garden-types';

describe('PLANT_TYPES', () => {
  it('contains baum with required fields', () => {
    const baum = PLANT_TYPES['baum'];
    expect(baum).toBeDefined();
    expect(baum.key).toBe('baum');
    expect(baum.labelDe).toBeTruthy();
    expect(baum.icon).toBeTruthy();
  });

  it('all entries have key, labelDe, and icon', () => {
    for (const [key, def] of Object.entries(PLANT_TYPES)) {
      expect(def.key).toBe(key);
      expect(def.labelDe).toBeTruthy();
      expect(def.icon).toBeTruthy();
    }
  });
});

describe('PLANT_TYPE_LIST', () => {
  it('has the same count as PLANT_TYPES', () => {
    expect(PLANT_TYPE_LIST.length).toBe(Object.keys(PLANT_TYPES).length);
  });

  it('contains all keys from PLANT_TYPES', () => {
    const listKeys = PLANT_TYPE_LIST.map((t) => t.key);
    for (const key of Object.keys(PLANT_TYPES)) {
      expect(listKeys).toContain(key);
    }
  });
});

describe('GARDEN_ELEMENT_TYPES', () => {
  it('all entries have key, labelDe, and icon', () => {
    for (const [key, def] of Object.entries(GARDEN_ELEMENT_TYPES)) {
      expect(def.key).toBe(key);
      expect(def.labelDe).toBeTruthy();
      expect(def.icon).toBeTruthy();
    }
  });
});

describe('GARDEN_ELEMENT_TYPE_LIST', () => {
  it('has the same count as GARDEN_ELEMENT_TYPES', () => {
    expect(GARDEN_ELEMENT_TYPE_LIST.length).toBe(Object.keys(GARDEN_ELEMENT_TYPES).length);
  });
});

describe('MONTHS_DE', () => {
  it('has exactly 12 entries', () => {
    expect(MONTHS_DE).toHaveLength(12);
  });

  it('starts with Januar and ends with Dezember', () => {
    expect(MONTHS_DE[0]).toBe('Januar');
    expect(MONTHS_DE[11]).toBe('Dezember');
  });
});

describe('TODO_CATEGORIES and TODO_PRIORITIES', () => {
  it('TODO_CATEGORIES has value and label', () => {
    expect(TODO_CATEGORIES.length).toBeGreaterThan(0);
    for (const c of TODO_CATEGORIES) {
      expect(c.value).toBeTruthy();
      expect(c.label).toBeTruthy();
    }
  });

  it('TODO_PRIORITIES has value and label', () => {
    expect(TODO_PRIORITIES.length).toBeGreaterThan(0);
    for (const p of TODO_PRIORITIES) {
      expect(p.value).toBeTruthy();
      expect(p.label).toBeTruthy();
    }
  });
});
