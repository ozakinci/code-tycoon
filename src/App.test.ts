import { describe, expect, it } from 'vitest';
import {
  DEFAULT_STATE,
  calculateAcquisitionCapital,
  calculateCost,
  calculateOfflineProgress,
  calculateProduction,
  decodeSave,
  encodeSave,
  formatNumber,
  formatRate,
  getMilestoneMultiplier,
  isBuildingOutaged,
  sanitizeGameState,
} from './App';

const plainSave = (overrides: Record<string, unknown> = {}) => ({
  version: 1,
  loc: 1234,
  totalLoc: 5000,
  lifetimeLoc: 9000,
  buildingsOwned: { buddy: 3, freelancer: 1 },
  upgradesOwned: { git: 1, eq_keyboard: 2 },
  stage: 2,
  ac: 7,
  prestigeUpgradesOwned: { remote_work: 2 },
  prestigeCount: 1,
  lastSaved: Date.now() - 1000,
  technicalDebt: 12,
  outages: {},
  ...overrides,
});

describe('save sanitizer', () => {
  it('falls back to a playable default for non-object input', () => {
    for (const input of [null, undefined, 42, 'nope', [], true]) {
      const state = sanitizeGameState(input);
      expect(state.version).toBe(1);
      expect(state.stage).toBe(0);
      expect(state.loc).toBe(0);
      expect(Number.isFinite(calculateProduction(state))).toBe(true);
    }
  });

  it('clamps stage and technical debt to valid ranges', () => {
    expect(sanitizeGameState(plainSave({ stage: 99 })).stage).toBe(7);
    expect(sanitizeGameState(plainSave({ stage: -4 })).stage).toBe(0);
    expect(sanitizeGameState(plainSave({ technicalDebt: 9999 })).technicalDebt).toBe(200);
    expect(sanitizeGameState(plainSave({ technicalDebt: -1 })).technicalDebt).toBe(0);
  });

  it('drops non-numeric, negative, zero, and unknown nested counts', () => {
    const state = sanitizeGameState(plainSave({
      buildingsOwned: {
        buddy: 'lots',
        freelancer: -3,
        junior: 0,
        senior: Number.NaN,
        unknown: 10,
        architect: 2.9,
      },
    }));

    expect(state.buildingsOwned).toEqual({ architect: 2 });
  });

  it('rejects non-finite top-level values but keeps valid saves intact', () => {
    const malformed = sanitizeGameState(plainSave({
      loc: Number.POSITIVE_INFINITY,
      totalLoc: Number.NaN,
      lifetimeLoc: -5,
      ac: Number.NEGATIVE_INFINITY,
      prestigeCount: 2.8,
    }));

    expect(malformed.loc).toBe(0);
    expect(malformed.totalLoc).toBe(0);
    expect(malformed.lifetimeLoc).toBe(0);
    expect(malformed.ac).toBe(0);
    expect(malformed.prestigeCount).toBe(2);

    const valid = sanitizeGameState(plainSave());
    expect(valid.loc).toBe(1234);
    expect(valid.buildingsOwned).toEqual({ buddy: 3, freelancer: 1 });
    expect(valid.upgradesOwned).toEqual({ git: 1, eq_keyboard: 2 });
  });

  it('clamps equipment to the number of hires', () => {
    const noHires = sanitizeGameState(plainSave({
      buildingsOwned: {},
      upgradesOwned: { eq_keyboard: 99 },
    }));
    expect(noHires.upgradesOwned.eq_keyboard).toBeUndefined();

    const threeHires = sanitizeGameState(plainSave({
      buildingsOwned: { buddy: 3 },
      upgradesOwned: { eq_keyboard: 99 },
    }));
    expect(threeHires.upgradesOwned.eq_keyboard).toBe(3);
  });

  it('clamps stage-gated and static max-level upgrades', () => {
    const stageZeroBrand = sanitizeGameState(plainSave({
      stage: 0,
      upgradesOwned: { brand_keyboard: 4 },
    }));
    expect(stageZeroBrand.upgradesOwned.brand_keyboard).toBeUndefined();

    const stageTwoBrand = sanitizeGameState(plainSave({
      stage: 2,
      upgradesOwned: { brand_keyboard: 4 },
    }));
    expect(stageTwoBrand.upgradesOwned.brand_keyboard).toBe(2);

    const perks = sanitizeGameState(plainSave({
      prestigeUpgradesOwned: { remote_work: 999, brand_recognition: 999, synergy: 999 },
    }));
    expect(perks.prestigeUpgradesOwned.remote_work).toBe(10);
    expect(perks.prestigeUpgradesOwned.brand_recognition).toBe(20);
    expect(perks.prestigeUpgradesOwned.synergy).toBe(999);
  });

  it('sanitizes outages and never allows a permanent one', () => {
    const now = Date.now();
    const state = sanitizeGameState(plainSave({
      buildingsOwned: { buddy: 3, freelancer: 1, senior: 1 },
      outages: {
        unknown: now + 10_000,
        buddy: now - 10_000,
        junior: now + 10_000,
        senior: now + 10_000_000,
      },
    }));

    const entries = Object.entries(state.outages);
    expect(entries).toHaveLength(1);
    expect(entries[0][0]).toBe('senior');
    expect(entries[0][1]).toBeLessThanOrEqual(now + 30_000 + 1000);
  });

  it('does not produce NaN or Infinity from a malicious save', () => {
    const state = sanitizeGameState(plainSave({
      buildingsOwned: { buddy: 'x', freelancer: Number.POSITIVE_INFINITY, senior: 1e30 },
      upgradesOwned: { eq_keyboard: Number.NaN, code_reviews: 1e30, brand_keyboard: 'x' },
      technicalDebt: Number.POSITIVE_INFINITY,
    }));

    expect(Number.isFinite(calculateProduction(state))).toBe(true);
    expect(Number.isFinite(state.loc)).toBe(true);
  });
});

describe('save encoding', () => {
  it('round-trips a valid save', () => {
    const state = sanitizeGameState(plainSave());
    const decoded = decodeSave(encodeSave(state));
    expect(decoded).not.toBeNull();
    expect(sanitizeGameState(decoded)).toEqual(state);
  });

  it('returns null for garbage', () => {
    expect(decodeSave('not a save')).toBeNull();
  });
});

describe('temporary outages', () => {
  it('zeroes production for an outaged building without deleting it', () => {
    const state = sanitizeGameState(plainSave({ buildingsOwned: { buddy: 10 }, upgradesOwned: {} }));
    expect(calculateProduction(state)).toBeGreaterThan(0);

    const outaged = { ...state, outages: { buddy: Date.now() + 30_000 } };
    expect(isBuildingOutaged(outaged, 'buddy')).toBe(true);
    expect(calculateProduction(outaged)).toBe(0);
    expect(outaged.buildingsOwned.buddy).toBe(10);

    const recovered = { ...state, outages: { buddy: Date.now() - 1 } };
    expect(isBuildingOutaged(recovered, 'buddy')).toBe(false);
    expect(calculateProduction(recovered)).toBeGreaterThan(0);
  });
});

describe('costs and formatting', () => {
  it('calculates linear and growth costs', () => {
    expect(calculateCost(100, 1, 0, 10000, 10)).toEqual({ cost: 1000, count: 10 });
    expect(calculateCost(100, 2, 0, 100000, 10)).toEqual({ cost: 102300, count: 10 });
  });

  it('respects max levels and next milestones', () => {
    expect(calculateCost(100, 2, 0, 100000, 10, 3)).toEqual({ cost: 700, count: 3 });
    // "next" buys up to the next owned-count milestone: 10, 25, 50, ...
    expect(calculateCost(100, 2, 0, 100000, 'next')).toEqual({ cost: 100, count: 1 });
    expect(calculateCost(100, 2, 3, 100000, 'next')).toEqual({ cost: 101600, count: 7 });
    expect(calculateCost(100, 2, 3, 100000, 'next', 5)).toEqual({ cost: 2400, count: 2 });
  });

  it('never returns NaN or negative costs', () => {
    for (const amount of [1, 10, 50, 100, 'next', 'max'] as const) {
      const result = calculateCost(15, 1.07, 500, 0, amount);
      expect(Number.isFinite(result.cost)).toBe(true);
      expect(result.cost).toBeGreaterThanOrEqual(0);
      expect(result.count).toBeGreaterThanOrEqual(0);
    }
  });

  it('formats compact numbers at suffix boundaries', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(999)).toBe('999');
    expect(formatNumber(1000)).toBe('1.00K');
    expect(formatNumber(999999)).toBe('1.00M');
    expect(formatNumber(1e15)).toBe('1.00Qa');
    expect(formatNumber(Number.POSITIVE_INFINITY)).toBe('Infinity');
  });

  it('shows fractional rates instead of flooring them to zero', () => {
    expect(formatRate(0)).toBe('0');
    expect(formatRate(0.04)).toBe('0.04');
    expect(formatRate(0.4)).toBe('0.4');
    expect(formatRate(0.8)).toBe('0.8');
    expect(formatRate(9.94)).toBe('9.94');
    expect(formatRate(10.5)).toBe('10');
    expect(formatRate(999.9)).toBe('999');
    expect(formatRate(1000)).toBe('1.00K');
    expect(formatRate(Number.POSITIVE_INFINITY)).toBe('Infinity');
  });

  it('applies building milestones', () => {
    expect(getMilestoneMultiplier(0)).toBe(1);
    expect(getMilestoneMultiplier(10)).toBe(2);
    expect(getMilestoneMultiplier(25)).toBe(4);
    expect(getMilestoneMultiplier(500)).toBe(64);
  });
});

describe('prestige and offline earnings', () => {
  it('pays no AC before stage 2 and multiplies by the buyer', () => {
    expect(calculateAcquisitionCapital(sanitizeGameState(plainSave({ stage: 1, totalLoc: 1e9 })))).toBe(0);

    const rival = sanitizeGameState(plainSave({ stage: 2, totalLoc: 100_000 }));
    expect(calculateAcquisitionCapital(rival)).toBe(1);

    const vc = sanitizeGameState(plainSave({ stage: 3, totalLoc: 100_000 }));
    expect(calculateAcquisitionCapital(vc)).toBe(3);
  });

  it('applies the offline tiers and Remote Work extension', () => {
    expect(calculateOfflineProgress(1, 60, 0).earned).toBe(60);
    expect(calculateOfflineProgress(1, 1800, 0).earned).toBe(1800);
    expect(calculateOfflineProgress(1, 7200, 0).earned).toBe(4500);
    expect(calculateOfflineProgress(1, 10000, 0).earned).toBe(5060);
    expect(calculateOfflineProgress(1, 1800, 1).earned).toBe(1800);
    // Remote Work I moves the 100% cap to 60 minutes; 90 minutes is 60 min
    // full rate + 30 min at 50%.
    expect(calculateOfflineProgress(1, 5400, 1).earned).toBe(4500);
  });

  it('uses defaults that stay finite', () => {
    expect(DEFAULT_STATE.version).toBe(1);
    expect(Number.isFinite(calculateProduction(DEFAULT_STATE))).toBe(true);
    expect(DEFAULT_STATE.outages).toEqual({});
  });
});
