import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Terminal, Users, Zap, Coffee, Keyboard, Cpu, Trophy, 
  Home, Building, Building2, Landmark, GitBranch, 
  Monitor, Server, Cloud, Rocket, Trash2, ArrowUpCircle,
  Settings, Upload, Download, X, FileText, Wrench, Eye, AlertTriangle
} from 'lucide-react';

import { designDocument } from './designDoc';

// --- DATA STRUCTURES ---

interface Stage {
  id: number;
  name: string;
  cost: number;
  icon: React.ElementType;
  description: string;
  buyerName?: string;
  buyerMultiplier?: number;
}

interface Building {
  id: string;
  name: string;
  baseCost: number;
  baseProduction: number;
  growthFactor: number;
  description: string;
  icon: React.ElementType;
  reqStage: number;
  hiresCount: number;
}

interface Upgrade {
  id: string;
  name: string | ((level: number) => string);
  baseCost: number;
  growthFactor: number;
  maxLevel?: number | ((state: GameState) => number);
  description: (level: number) => string;
  icon: React.ElementType;
  reqStage: number;
}

interface PrestigeUpgrade {
  id: string;
  name: string;
  baseCost: number;
  growthFactor: number;
  maxLevel?: number;
  description: (level: number) => string;
  icon: React.ElementType;
}

interface GameState {
  version: number;
  loc: number;
  totalLoc: number;
  lifetimeLoc: number;
  buildingsOwned: Record<string, number>;
  upgradesOwned: Record<string, number>;
  stage: number;
  ac: number;
  prestigeUpgradesOwned: Record<string, number>;
  prestigeCount: number;
  lastSaved: number;
  technicalDebt: number;
  // Active temporary outages: building id -> timestamp when service returns.
  outages: Record<string, number>;
}

type BuyAmount = 1 | 10 | 50 | 100 | 'next' | 'max';

const STAGES: Stage[] = [
  { id: 0, name: "Mom's Garage", cost: 0, icon: Home, description: "Where every great tech company begins." },
  { id: 1, name: "Co-working Space", cost: 1500000, icon: Building, description: "Free kombucha and networking events." },
  { id: 2, name: "Startup Office", cost: 50000000, icon: Building2, description: "You have your own meeting rooms now.", buyerName: "Rival Startup", buyerMultiplier: 1 },
  { id: 3, name: "Corporate Campus", cost: 5000000000, icon: Landmark, description: "Stock options and endless bureaucracy.", buyerName: "Venture Capital Firm", buyerMultiplier: 3 },
  { id: 4, name: "Tech Skyscraper", cost: 1000000000000, icon: Building, description: "Your logo is on the skyline.", buyerName: "Social Media Giant", buyerMultiplier: 10 },
  { id: 5, name: "Global Megacorp", cost: 500000000000000, icon: Cloud, description: "Too big to fail.", buyerName: "Tech Conglomerate", buyerMultiplier: 50 },
  { id: 6, name: "Cloud Empire", cost: 250000000000000000, icon: Server, description: "Your code runs the internet.", buyerName: "Search Engine Monopolist", buyerMultiplier: 250 },
  { id: 7, name: "Orbital Station", cost: 100000000000000000000, icon: Rocket, description: "Coding in zero gravity.", buyerName: "Global AI Overlord", buyerMultiplier: 1000 },
];

const BUILDINGS: Building[] = [
  { id: 'buddy', name: 'College Buddy', hiresCount: 1, baseCost: 15, baseProduction: 1, growthFactor: 1.07, description: 'Works for pizza. Writes spaghetti code.', icon: Users, reqStage: 0 },
  { id: 'freelancer', name: 'Fiverr Freelancer', hiresCount: 1, baseCost: 150, baseProduction: 5, growthFactor: 1.08, description: 'Hit or miss, but gets it done.', icon: Monitor, reqStage: 0 },
  { id: 'junior', name: 'Junior Developer', hiresCount: 1, baseCost: 1000, baseProduction: 25, growthFactor: 1.09, description: 'Googles everything. Very enthusiastic.', icon: Terminal, reqStage: 0 },
  { id: 'scrum', name: 'Scrum Master', hiresCount: 1, baseCost: 5000, baseProduction: 100, growthFactor: 1.10, description: 'Increases velocity by scheduling meetings.', icon: Coffee, reqStage: 0 },
  { id: 'senior', name: 'Senior Developer', hiresCount: 1, baseCost: 25000, baseProduction: 450, growthFactor: 1.11, description: 'Complains about the codebase. Flat -2% TD generated.', icon: Trophy, reqStage: 1 },
  { id: 'devops', name: 'DevOps Engineer', hiresCount: 1, baseCost: 75000, baseProduction: 1000, growthFactor: 1.09, description: 'Automates pipelines. -0.1 TD/min (max -2).', icon: Wrench, reqStage: 1 },
  { id: 'architect', name: 'Software Architect', hiresCount: 1, baseCost: 150000, baseProduction: 2500, growthFactor: 1.12, description: 'Draws boxes and arrows. Flat -2% TD generated.', icon: Server, reqStage: 1 },
  { id: 'reviewer', name: 'Code Reviewer', hiresCount: 1, baseCost: 500000, baseProduction: 5000, growthFactor: 1.10, description: 'Nitpicks PRs. -2% TD generated per unit (max -50%).', icon: Eye, reqStage: 2 },
  { id: 'micro_team', name: 'Microservices Team', hiresCount: 10, baseCost: 1000000, baseProduction: 15000, growthFactor: 1.13, description: '10 people to deploy 1 function.', icon: GitBranch, reqStage: 2 },
  { id: 'ai', name: 'AI Code Generator', hiresCount: 0, baseCost: 5000000, baseProduction: 65000, growthFactor: 1.14, description: 'Replaces everyone. Probably.', icon: Cpu, reqStage: 2 },
  { id: 'server_farm', name: 'Cloud Server Farm', hiresCount: 0, baseCost: 50000000, baseProduction: 500000, growthFactor: 1.15, description: 'Datacenters dedicated to running your code.', icon: Cloud, reqStage: 3 },
  { id: 'quantum', name: 'Quantum Computer', hiresCount: 0, baseCost: 1000000000, baseProduction: 8000000, growthFactor: 1.16, description: 'Computes bugs before they are written.', icon: Rocket, reqStage: 4 },
];

const getTotalHires = (state: GameState) => {
  return BUILDINGS.reduce((total, b) => {
    return total + (state.buildingsOwned[b.id] || 0) * b.hiresCount;
  }, 0);
};

const UPGRADES: Upgrade[] = [
  // Equipment Counts
  { id: 'eq_keyboard', name: 'Mechanical Keyboard', baseCost: 150, growthFactor: 1.2, maxLevel: (state) => getTotalHires(state), description: () => `Equip a hire with a keyboard. (+50% base production per keyboard)`, icon: Keyboard, reqStage: 0 },
  { id: 'eq_coffee', name: 'Coffee Machine', baseCost: 500, growthFactor: 1.3, maxLevel: (state) => getTotalHires(state), description: () => `Provide coffee for a hire. (+100% base production per machine)`, icon: Coffee, reqStage: 0 },
  { id: 'eq_chair', name: 'Ergonomic Chair', baseCost: 50000, growthFactor: 1.4, maxLevel: (state) => getTotalHires(state), description: () => `Save a hire's back. (+200% base production per chair)`, icon: Monitor, reqStage: 1 },

  // Equipment Brands
  { id: 'brand_keyboard', 
    name: (lvl) => ["LogiMace Keyboards", "Lazer Chroma", "Berry MX Pro", "PirateShip K1000"][lvl] || "Maxed Brand",
    baseCost: 50000, growthFactor: 10, maxLevel: (state) => Math.min(4, state.stage), 
    description: (lvl) => `Each equipped keyboard gives +${(lvl + 1) * 50}% base production.`, icon: Keyboard, reqStage: 1 },
  { id: 'brand_coffee', 
    name: (lvl) => ["DipIn Donuts Coffee", "MoonBucks Roastery", "YesPresso Pods", "Copy Luwak Beans"][lvl] || "Maxed Brand",
    baseCost: 150000, growthFactor: 10, maxLevel: (state) => Math.min(4, state.stage), 
    description: (lvl) => `Each coffee machine gives +${(lvl + 1) * 100}% base production.`, icon: Coffee, reqStage: 1 },
  { id: 'brand_chair', 
    name: (lvl) => ["FXRunner Chairs", "MysteryLab Titan", "RegalChairs Hero", "Human Miller Aeron"][lvl] || "Maxed Brand",
    baseCost: 2500000, growthFactor: 10, maxLevel: (state) => Math.min(4, Math.max(0, state.stage - 1)), 
    description: (lvl) => `Each ergonomic chair gives +${(lvl + 1) * 200}% base production.`, icon: Trophy, reqStage: 2 },

  // Other repeatables
  { id: 'code_reviews', name: 'Code Reviews', baseCost: 2500, growthFactor: 2.0, description: (lvl) => `Adds +${lvl * 10}% to each building's multiplier (additive after milestones).`, icon: GitBranch, reqStage: 0 },
  { id: 'stock_options', name: 'Stock Options', baseCost: 25000000, growthFactor: 10, maxLevel: 5, description: (lvl) => `Global production x${Math.pow(1.5, lvl).toFixed(2)} (Level ${lvl}/5). Keep talent happy.`, icon: Landmark, reqStage: 2 },
  
  // One-time
  { id: 'stackoverflow', name: 'StackOverflow Premium', baseCost: 500, growthFactor: 1, maxLevel: 1, description: () => `Clicking is 5x as effective.`, icon: Zap, reqStage: 0 },
  { id: 'git', name: 'Version Control (Git)', baseCost: 1000, growthFactor: 1, maxLevel: 1, description: () => `Global production x1.5. No more code_v2_final.zip.`, icon: GitBranch, reqStage: 0 },
  { id: 'copilot', name: 'AI Autocomplete', baseCost: 7500, growthFactor: 1, maxLevel: 1, description: () => `Clicking is 10x as effective.`, icon: Cpu, reqStage: 0 },
  { id: 'ci_cd', name: 'CI/CD Pipeline', baseCost: 1000000, growthFactor: 1, maxLevel: 1, description: () => `Global production x2. Automated deployments!`, icon: Rocket, reqStage: 1 },
  { id: 'agile', name: 'Agile Methodology', baseCost: 2500000, growthFactor: 1, maxLevel: 1, description: () => `Scrum Masters production x3.`, icon: Users, reqStage: 1 },
  { id: 'fabric', name: 'Move to Fabric', baseCost: 5000000, growthFactor: 1, maxLevel: 1, description: () => `Global production x2. The modern data stack.`, icon: Cloud, reqStage: 1 },
  { id: 'microservices_arch', name: 'Microservices Architecture', baseCost: 50000000, growthFactor: 1, maxLevel: 1, description: () => `Architect & Senior production x2.`, icon: Server, reqStage: 2 },
  { id: 'k8s', name: 'Kubernetes Cluster', baseCost: 100000000, growthFactor: 1, maxLevel: 1, description: () => `Global production x2. Containers everywhere.`, icon: Cloud, reqStage: 2 },
  { id: 'neural_net', name: 'Neural Networks', baseCost: 250000000, growthFactor: 1, maxLevel: 1, description: () => `AI Code Generator production x3.`, icon: Cpu, reqStage: 2 },
  { id: 'data_lake', name: 'Data Lake', baseCost: 5000000000, growthFactor: 1, maxLevel: 1, description: () => `Global production x2. Big data.`, icon: Server, reqStage: 3 },
  { id: 'metaverse', name: 'Pivot to Metaverse', baseCost: 100000000000, growthFactor: 1, maxLevel: 1, description: () => `Global production x2. Marketing loves it.`, icon: Users, reqStage: 4 },
  { id: 'monopoly', name: 'Tech Monopoly', baseCost: 50000000000000, growthFactor: 1, maxLevel: 1, description: () => `Global production x3. No more competition.`, icon: Landmark, reqStage: 5 },
  { id: 'dysonsphere', name: 'Code-Powered Dyson Sphere', baseCost: 10000000000000000, growthFactor: 1, maxLevel: 1, description: () => `Global production x5. Limitless energy.`, icon: Zap, reqStage: 6 },
  { id: 'time_travel', name: 'Time-Traveling Compilers', baseCost: 1000000000000000000, growthFactor: 1, maxLevel: 1, description: () => `Global production x10. Code finishes before it starts.`, icon: Rocket, reqStage: 7 },
];

// Compact suffixes for large values. The old version stopped at T, so anything
// bigger rendered as a raw float (e.g. "2.46932918005993e+43"). Values past
// the suffix list fall back to scientific notation instead.
const NUMBER_SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc', 'UDc', 'DDc', 'TDc', 'QaDc', 'QiDc', 'SxDc', 'SpDc', 'OcDc', 'NoDc', 'Vg'];

export const formatNumber = (num: number): string => {
  if (!Number.isFinite(num)) return 'Infinity';
  if (num < 0) return '-' + formatNumber(-num);
  if (num < 1000) return Math.floor(num).toLocaleString('en-US');

  let tier = Math.floor(Math.log10(num) / 3);
  let scaled = num / Math.pow(1000, tier);
  // Rounding can push e.g. 999,999 to "1000.00K"; promote it a tier instead.
  if (Number(scaled.toFixed(2)) >= 1000 && tier + 1 < NUMBER_SUFFIXES.length) {
    tier += 1;
    scaled /= 1000;
  }
  if (tier >= NUMBER_SUFFIXES.length) return num.toExponential(2);
  return scaled.toFixed(2) + NUMBER_SUFFIXES[tier];
};

const PRESTIGE_UPGRADES: PrestigeUpgrade[] = [
  { id: 'founder_network', name: "Founder's Network", baseCost: 1, growthFactor: 1.5, description: (lvl) => `Base Click Power +${lvl * 10}.`, icon: Users },
  { id: 'angel_investor', name: "Angel Investor", baseCost: 2, growthFactor: 2.0, description: (lvl) => `Start runs with ${formatNumber(lvl * 50000)} LOC.`, icon: Landmark },
  { id: 'remote_work', name: "Remote Work Policy", baseCost: 3, growthFactor: 1.7, maxLevel: 10, description: (lvl) => `+${lvl * 30} min to offline cap thresholds.`, icon: Home },
  { id: 'brand_recognition', name: "Brand Recognition", baseCost: 5, growthFactor: 1.8, maxLevel: 20, description: (lvl) => `Reduces all building costs by ${lvl * 2}%.`, icon: Trophy },
  { id: 'synergy', name: "Corporate Synergy", baseCost: 10, growthFactor: 3.0, description: (lvl) => `Adds +${(lvl * 0.20).toFixed(2)} to the global production multiplier (additive).`, icon: Building2 },
  { id: '10x_culture', name: "10x Culture", baseCost: 25, growthFactor: 5.0, description: (lvl) => `Clicking is ${Math.pow(2, lvl)}x as effective.`, icon: Zap },
];

// Technical Debt only affects gameplay up to the last penalty tier (-60% at
// 200 TD). Accumulating past it changed nothing except making the old
// exponential Refactor cost unaffordable, which soft-locked long-running
// saves. Cap the state at the last tier.
const TD_MAX = 200;

const SAVE_VERSION = 1;

// High Technical Debt no longer deletes buildings. It causes a temporary
// outage instead: one building type stops producing for 30 seconds, then
// recovers on its own. The player can also repair it immediately.
const OUTAGE_DURATION_MS = 30_000;
const OUTAGE_CHANCE_PER_SEC_LOW = 0.005; // TD 50-99: about one per 3 minutes
const OUTAGE_CHANCE_PER_SEC_HIGH = 0.02; // TD 100+: about one per 50 seconds

// The live loop must never award minutes of production just because the
// browser throttled its timer. Background time is handled by the visibility
// handler using the same capped offline rules.
const MAX_LIVE_TICK_SECONDS = 1;
const OFFLINE_REPORT_MIN_SECONDS = 60;
// A foreground timer can also stall (laptop sleep, tab freeze). Gaps longer
// than this are treated as offline time instead of being discarded by the cap.
const LIVE_GAP_OFFLINE_SECONDS = 5;

export const DEFAULT_STATE: GameState = {
  version: SAVE_VERSION,
  loc: 0,
  totalLoc: 0,
  lifetimeLoc: 0,
  buildingsOwned: {},
  upgradesOwned: {},
  stage: 0,
  ac: 0,
  prestigeUpgradesOwned: {},
  prestigeCount: 0,
  lastSaved: Date.now(),
  technicalDebt: 0,
  outages: {},
};

// A save can come from localStorage or a hand-edited/corrupted imported file,
// so it's untrusted input. Naively spreading it over DEFAULT_STATE (the old
// approach) lets e.g. an out-of-range `stage` crash rendering with no way to
// reach the in-app Hard Reset button, since the crash happens before Settings
// can even render. Validate and clamp every field instead, falling back to
// the default for anything malformed.
//
// The old sanitizer only checked that the *Owned fields were objects. Their
// values could still be strings, negative, NaN, Infinity, or unknown ids,
// which produced NaN production, negative costs, or free purchases. Every
// nested count is now validated and clamped, and unknown ids are dropped.
export const sanitizeGameState = (raw: unknown): GameState => {
  const parsed = (raw && typeof raw === 'object' && !Array.isArray(raw))
    ? raw as Record<string, unknown>
    : {};

  const isFiniteNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
  const isNonNegativeNumber = (v: unknown): v is number => isFiniteNumber(v) && v >= 0;
  const isPlainObject = (v: unknown): v is Record<string, unknown> =>
    !!v && typeof v === 'object' && !Array.isArray(v);

  const stage = isFiniteNumber(parsed.stage)
    ? Math.min(STAGES.length - 1, Math.max(0, Math.floor(parsed.stage)))
    : DEFAULT_STATE.stage;

  const buildingIds = new Set(BUILDINGS.map(b => b.id));
  const upgradeIds = new Set(UPGRADES.map(u => u.id));
  const prestigeIds = new Set(PRESTIGE_UPGRADES.map(u => u.id));

  const sanitizeCounts = (
    value: unknown,
    allowedIds: Set<string>,
    getMax: (id: string) => number | undefined,
    fallbackMax: number,
  ): Record<string, number> => {
    if (!isPlainObject(value)) return {};
    const result: Record<string, number> = {};
    for (const [id, rawCount] of Object.entries(value)) {
      if (!allowedIds.has(id) || !isFiniteNumber(rawCount) || rawCount < 0) continue;
      const integer = Math.floor(rawCount);
      if (integer <= 0) continue;
      const max = getMax(id);
      const capped = Math.min(integer, Math.max(0, Math.floor(max ?? fallbackMax)));
      if (capped > 0) result[id] = capped;
    }
    return result;
  };

  const buildingsOwned = sanitizeCounts(
    parsed.buildingsOwned,
    buildingIds,
    () => 1_000_000_000,
    1_000_000_000,
  );

  // Equipment max levels depend on team size and stage, so validate against
  // the sanitized state rather than trusting anything else in the save.
  const upgradeState: GameState = { ...DEFAULT_STATE, buildingsOwned, stage };

  const upgradesOwned = sanitizeCounts(
    parsed.upgradesOwned,
    upgradeIds,
    (id) => {
      const upgrade = UPGRADES.find(u => u.id === id);
      if (!upgrade) return 0;
      return typeof upgrade.maxLevel === 'function'
        ? upgrade.maxLevel(upgradeState)
        : upgrade.maxLevel;
    },
    1_000_000,
  );

  const prestigeUpgradesOwned = sanitizeCounts(
    parsed.prestigeUpgradesOwned,
    prestigeIds,
    (id) => PRESTIGE_UPGRADES.find(u => u.id === id)?.maxLevel,
    1_000_000,
  );

  // At most one temporary outage is active at a time. Ignore unknown
  // buildings, expired timestamps, and implausibly distant future times.
  const now = Date.now();
  const outages: Record<string, number> = {};
  if (isPlainObject(parsed.outages)) {
    for (const [id, rawUntil] of Object.entries(parsed.outages)) {
      if (!buildingIds.has(id) || !isFiniteNumber(rawUntil)) continue;
      if ((buildingsOwned[id] || 0) <= 0) continue;
      const until = Math.min(rawUntil, now + OUTAGE_DURATION_MS);
      if (until > now) {
        outages[id] = until;
        break;
      }
    }
  }

  return {
    version: SAVE_VERSION,
    loc: isNonNegativeNumber(parsed.loc) ? parsed.loc : DEFAULT_STATE.loc,
    totalLoc: isNonNegativeNumber(parsed.totalLoc) ? parsed.totalLoc : DEFAULT_STATE.totalLoc,
    lifetimeLoc: isNonNegativeNumber(parsed.lifetimeLoc) ? parsed.lifetimeLoc : DEFAULT_STATE.lifetimeLoc,
    buildingsOwned,
    upgradesOwned,
    stage,
    ac: isNonNegativeNumber(parsed.ac) ? parsed.ac : DEFAULT_STATE.ac,
    prestigeUpgradesOwned,
    prestigeCount: isNonNegativeNumber(parsed.prestigeCount)
      ? Math.floor(parsed.prestigeCount)
      : DEFAULT_STATE.prestigeCount,
    lastSaved: isFiniteNumber(parsed.lastSaved)
      ? Math.min(Math.max(0, parsed.lastSaved), now)
      : DEFAULT_STATE.lastSaved,
    technicalDebt: isNonNegativeNumber(parsed.technicalDebt)
      ? Math.min(TD_MAX, parsed.technicalDebt)
      : DEFAULT_STATE.technicalDebt,
    outages,
  };
};

// --- OBFUSCATION ---
export const encodeSave = (data: GameState) => {
  const json = JSON.stringify(data);
  const b64 = btoa(encodeURIComponent(json));
  // Shift characters by 1 for basic obfuscation to deter casual cheating
  return b64.split('').map(c => String.fromCharCode(c.charCodeAt(0) + 1)).join('');
};

export const decodeSave = (str: string): GameState | null => {
  try {
    const b64 = str.split('').map(c => String.fromCharCode(c.charCodeAt(0) - 1)).join('');
    return JSON.parse(decodeURIComponent(atob(b64)));
  } catch (e) {
    return null;
  }
};

// localStorage can throw (private browsing, disabled storage, quota). A game
// that cannot autosave should keep running and tell the player, not crash.
const storage = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn(`Could not read ${key} from localStorage`, e);
      return null;
    }
  },
  set(key: string, value: string): boolean {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.warn(`Could not write ${key} to localStorage`, e);
      return false;
    }
  },
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`Could not remove ${key} from localStorage`, e);
    }
  },
};

// --- HELPER FUNCTIONS ---
export const getMilestoneMultiplier = (count: number) => {
  let mult = 1;
  if (count >= 10) mult *= 2;
  if (count >= 25) mult *= 2;
  if (count >= 50) mult *= 2;
  if (count >= 100) mult *= 2;
  if (count >= 250) mult *= 2;
  if (count >= 500) mult *= 2;
  return mult;
};

const getTDAcquisitionMultiplier = (state: GameState) => {
  let reduction = 0;
  const reviewers = state.buildingsOwned['reviewer'] || 0;
  reduction += Math.min(0.50, reviewers * 0.02);
  
  const seniors = state.buildingsOwned['senior'] || 0;
  reduction += seniors > 0 ? 0.02 : 0;
  
  const architects = state.buildingsOwned['architect'] || 0;
  reduction += architects > 0 ? 0.02 : 0;
  
  return 1 - Math.min(0.90, reduction);
};

const getTDReductionPerSec = (state: GameState) => {
  const devops = Math.min(20, state.buildingsOwned['devops'] || 0);
  return devops * (0.1 / 60); // 0.1 TD reduced per min per DevOps
};

const getTDBaseRatePerMin = (state: GameState) => {
  const totalBuildings = Object.values(state.buildingsOwned).reduce((a, b) => a + b, 0);
  const totalUpgrades = Math.min(20, Object.values(state.upgradesOwned).reduce((a, b) => a + b, 0));
  return (totalBuildings * 0.01) + (totalUpgrades * 0.05);
};

export const getTDNetRatePerMin = (state: GameState) =>
  getTDBaseRatePerMin(state) * getTDAcquisitionMultiplier(state)
  - getTDReductionPerSec(state) * 60;

const getTDPenaltyMultiplier = (td: number) => {
  if (td >= 200) return 0.40;
  if (td >= 100) return 0.60;
  if (td >= 50) return 0.80;
  if (td >= 25) return 0.90;
  if (td >= 10) return 0.95;
  return 1;
};

const getGlobalMultiplier = (state: GameState) => {
  let mult = 1;
  
  if (state.upgradesOwned['git']) mult *= 1.5;
  if (state.upgradesOwned['ci_cd']) mult *= 2;
  if (state.upgradesOwned['fabric']) mult *= 2;
  if (state.upgradesOwned['k8s']) mult *= 2;
  if (state.upgradesOwned['data_lake']) mult *= 2;
  if (state.upgradesOwned['metaverse']) mult *= 2;
  if (state.upgradesOwned['monopoly']) mult *= 3;
  if (state.upgradesOwned['dysonsphere']) mult *= 5;
  if (state.upgradesOwned['time_travel']) mult *= 10;
  
  const stockLvl = state.upgradesOwned['stock_options'] || 0;
  if (stockLvl > 0) mult *= Math.pow(1.5, stockLvl);
  
  const synergyLvl = state.prestigeUpgradesOwned?.['synergy'] || 0;
  if (synergyLvl > 0) mult += synergyLvl * 0.20; // +20% per level
  
  const tdMult = getTDPenaltyMultiplier(state.technicalDebt || 0);
  
  return mult * tdMult;
};

const getHumanMultiplier = (state: GameState) => {
  const humans = getTotalHires(state);
  if (humans === 0) return 1;

  let mult = 1;
  
  const kbCount = Math.min(state.upgradesOwned['eq_keyboard'] || 0, humans);
  const kbBrand = state.upgradesOwned['brand_keyboard'] || 0;
  const kbBonus = (kbBrand + 1) * 0.50;
  mult += (kbCount / humans) * kbBonus;

  const coffeeCount = Math.min(state.upgradesOwned['eq_coffee'] || 0, humans);
  const coffeeBrand = state.upgradesOwned['brand_coffee'] || 0;
  const coffeeBonus = (coffeeBrand + 1) * 1.00;
  mult += (coffeeCount / humans) * coffeeBonus;

  const chairCount = Math.min(state.upgradesOwned['eq_chair'] || 0, humans);
  const chairBrand = state.upgradesOwned['brand_chair'] || 0;
  const chairBonus = (chairBrand + 1) * 2.00;
  mult += (chairCount / humans) * chairBonus;

  return mult;
};

const getBuildingMultiplier = (state: GameState, buildingId: string, count: number) => {
  let mult = getMilestoneMultiplier(count);
  
  const reviewLvl = state.upgradesOwned['code_reviews'] || 0;
  mult += reviewLvl * 0.10; // +10% base per level
  
  const building = BUILDINGS.find(b => b.id === buildingId);
  if (building && building.hiresCount > 0) {
     mult *= getHumanMultiplier(state);
  }

  if (buildingId === 'scrum') {
    if (state.upgradesOwned['agile']) mult *= 3;
  }
  if (buildingId === 'architect' || buildingId === 'senior') {
    if (state.upgradesOwned['microservices_arch']) mult *= 2;
  }
  if (buildingId === 'ai') {
    if (state.upgradesOwned['neural_net']) mult *= 3;
  }
  return mult;
};

export const isBuildingOutaged = (state: GameState, buildingId: string) =>
  (state.outages?.[buildingId] || 0) > Date.now();

export const calculateProduction = (state: GameState) => {
  const globalMult = getGlobalMultiplier(state);
  return BUILDINGS.reduce((total, b) => {
    const count = state.buildingsOwned[b.id] || 0;
    if (count <= 0) return total;
    const bMult = getBuildingMultiplier(state, b.id, count);
    const outageMult = isBuildingOutaged(state, b.id) ? 0 : 1;
    return total + (b.baseProduction * count * bMult * globalMult * outageMult);
  }, 0);
};

// Refactor cost is tied to income instead of TD, so it stays affordable at
// every stage and can never outrun what the company actually earns.
const REFACTOR_COST_SECONDS = 30;
const REFACTOR_MIN_COST = 100;
const getRefactorCost = (state: GameState) =>
  Math.max(REFACTOR_MIN_COST, calculateProduction(state) * REFACTOR_COST_SECONDS);

export const calculateClickPower = (state: GameState) => {
  let power = 1;
  
  const founderNetworkLvl = state.prestigeUpgradesOwned?.['founder_network'] || 0;
  power += founderNetworkLvl * 10;
  
  if (state.upgradesOwned['stackoverflow']) power *= 5;
  if (state.upgradesOwned['copilot']) power *= 10;
  
  const cultureLvl = state.prestigeUpgradesOwned?.['10x_culture'] || 0;
  if (cultureLvl > 0) power *= Math.pow(2, cultureLvl);
  
  const globalMult = getGlobalMultiplier(state);
  
  const production = calculateProduction(state);
  return (power * globalMult) + (production * 0.01);
};

// Calculates cost and actual amount that can be bought
// Same overflow risk BUG-001 fixed for the Refactor cost applies to any
// exponential cost curve: Math.pow(growthFactor, exponent) can reach
// Infinity given a large enough exponent (how large depends on
// growthFactor — a slow 1.07 grower needs ~10k+ owned, a fast one needs
// far less). Clamp the exponent per-growthFactor so the result can never
// exceed ~1e304, comfortably below Number.MAX_VALUE, regardless of owned count.
const getSafePow = (base: number, exponent: number) => {
  if (base <= 1) return Math.pow(base, exponent);
  const maxExponent = 700 / Math.log(base);
  return Math.pow(base, Math.min(exponent, maxExponent));
};

export const calculateCost = (baseCost: number, growthFactor: number, owned: number, loc: number, amount: BuyAmount, maxLevel?: number) => {
  const availableLevels = maxLevel !== undefined ? maxLevel - owned : Infinity;
  if (availableLevels <= 0) return { cost: 0, count: 0 };

  const getCostForN = (n: number) => {
    if (growthFactor === 1) return baseCost * n;
    const currentBase = baseCost * getSafePow(growthFactor, owned);
    return currentBase * ((getSafePow(growthFactor, n) - 1) / (growthFactor - 1));
  };

  if (amount === 'next') {
    const milestones = [1, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000];
    const target = milestones.find(m => m > owned) || (owned + 10);
    let n = target - owned;
    if (n > availableLevels) n = availableLevels;
    return { cost: Math.floor(getCostForN(n)), count: n };
  }

  if (amount === 'max') {
    let n = 0;
    if (growthFactor === 1) {
      n = Math.floor(loc / baseCost);
    } else {
      const currentBase = baseCost * getSafePow(growthFactor, owned);
      if (loc < currentBase) return { cost: Math.floor(currentBase), count: 1 }; // Return cost of 1 to show user
      n = Math.floor(Math.log(loc * (growthFactor - 1) / currentBase + 1) / Math.log(growthFactor));
    }
    let actualN = Math.max(1, n);
    if (actualN > availableLevels) actualN = availableLevels;
    return { cost: Math.floor(getCostForN(actualN)), count: actualN };
  }

  let n = amount as number;
  if (n > availableLevels) n = availableLevels;
  return { cost: Math.floor(getCostForN(n)), count: n };
};

const getBuildingCost = (state: GameState, buildingId: string, amount: BuyAmount) => {
  const building = BUILDINGS.find(b => b.id === buildingId)!;
  const owned = state.buildingsOwned[buildingId] || 0;
  
  const brandLvl = state.prestigeUpgradesOwned?.['brand_recognition'] || 0;
  const discount = 1 - (brandLvl * 0.02); // 2% per level, max 40%
  const discountedBaseCost = building.baseCost * discount;
  
  return calculateCost(discountedBaseCost, building.growthFactor, owned, state.loc, amount);
};

const getPrestigeUpgradeCost = (state: GameState, upgradeId: string, amount: BuyAmount) => {
  const upgrade = PRESTIGE_UPGRADES.find(u => u.id === upgradeId)!;
  const owned = state.prestigeUpgradesOwned?.[upgradeId] || 0;
  return calculateCost(upgrade.baseCost, upgrade.growthFactor, owned, state.ac, amount, upgrade.maxLevel);
};

export const calculateAcquisitionCapital = (state: GameState) => {
  if (state.stage < 2) return 0;
  const currentStage = STAGES[state.stage];
  const buyerMult = currentStage.buyerMultiplier || 1;
  const baseAC = Math.floor(Math.pow(state.totalLoc / 100000, 0.5));
  return baseAC * buyerMult;
};

export interface OfflineProgressResult {
  earned: number;
  reason: string;
}

// Shared by the initial page load and by returning to a hidden tab. Keeping
// one implementation guarantees both paths use the same caps.
export const calculateOfflineProgress = (
  prodPerSec: number,
  secondsOffline: number,
  remoteWorkLvl: number,
): OfflineProgressResult => {
  const extraMins = remoteWorkLvl * 30;
  const cap1 = (30 + extraMins) * 60; // 100%
  const cap2 = (120 + extraMins) * 60; // 50%
  const cap3 = (240 + extraMins) * 60; // 20%

  let earned = 0;
  let reason = 'Your team worked at 100% capacity while you were gone.';

  if (secondsOffline > cap3) {
    earned += cap1 * prodPerSec;
    earned += (cap2 - cap1) * prodPerSec * 0.5;
    earned += (cap3 - cap2) * prodPerSec * 0.2;
    reason = `Productivity dropped to 0% after ${(240 + extraMins)} minutes because nobody merged the pull requests.`;
  } else if (secondsOffline > cap2) {
    earned += cap1 * prodPerSec;
    earned += (cap2 - cap1) * prodPerSec * 0.5;
    earned += (secondsOffline - cap2) * prodPerSec * 0.2;
    reason = `Productivity dropped to 20% after ${(120 + extraMins)} minutes.`;
  } else if (secondsOffline > cap1) {
    earned += cap1 * prodPerSec;
    earned += (secondsOffline - cap1) * prodPerSec * 0.5;
    reason = `Productivity dropped to 50% after ${(30 + extraMins)} minutes.`;
  } else {
    earned += secondsOffline * prodPerSec;
  }

  return { earned, reason };
};

const getUpgradeCost = (state: GameState, upgradeId: string, amount: BuyAmount) => {
  const upgrade = UPGRADES.find(u => u.id === upgradeId)!;
  const owned = state.upgradesOwned[upgradeId] || 0;
  const maxLvl = typeof upgrade.maxLevel === 'function' ? upgrade.maxLevel(state) : upgrade.maxLevel;
  return calculateCost(upgrade.baseCost, upgrade.growthFactor, owned, state.loc, amount, maxLvl);
};

// --- MAIN COMPONENT ---

export default function App() {
  const [buyAmount, setBuyAmount] = useState<BuyAmount>(() => {
    const saved = storage.get('codeTycoonBuyAmount');
    if (saved === 'next' || saved === 'max') return saved;
    if (saved) {
      const parsed = parseInt(saved);
      if ([1, 10, 50, 100].includes(parsed)) return parsed as BuyAmount;
    }
    return 1;
  });

  useEffect(() => {
    storage.set('codeTycoonBuyAmount', buyAmount.toString());
  }, [buyAmount]);

  const [activeTab, setActiveTab] = useState<'team' | 'upgrades' | 'boardroom'>('team');
  const [showOptions, setShowOptions] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showPrestigeConfirm, setShowPrestigeConfirm] = useState(false);
  const [pendingImport, setPendingImport] = useState<GameState | null>(null);
  const [storageWarning, setStorageWarning] = useState(false);
  const [offlineReport, setOfflineReport] = useState<{earned: number; reason: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const offlineProgressAppliedRef = useRef(false);

  const [gameState, setGameState] = useState<GameState>(() => {
    // Try loading encrypted save first
    const encSaved = storage.get('codeTycoonEncryptedSave');
    if (encSaved) {
      const parsed = decodeSave(encSaved);
      if (parsed) return sanitizeGameState(parsed);
    }
    // Fallback to old plain JSON save if present
    const saved = storage.get('codeTycoonSave');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return sanitizeGameState(parsed);
      } catch (e) {
        console.error("Failed to load save", e);
      }
    }
    return DEFAULT_STATE;
  });

  // Auto-save every 5 seconds (using obfuscation)
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  useEffect(() => {
    const interval = setInterval(() => {
      if (!storage.set('codeTycoonEncryptedSave', encodeSave(gameStateRef.current))) {
        setStorageWarning(true);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Offline progress and game loop
  useEffect(() => {
    const applyAwayProgress = (secondsAway: number, showReport: boolean) => {
      const state = gameStateRef.current;
      const prodPerSec = calculateProduction(state);
      if (prodPerSec <= 0 || secondsAway <= 0) return;

      const remoteWorkLvl = state.prestigeUpgradesOwned?.['remote_work'] || 0;
      const { earned, reason } = calculateOfflineProgress(prodPerSec, secondsAway, remoteWorkLvl);
      if (earned <= 0) return;

      setGameState(prev => ({
        ...prev,
        loc: prev.loc + earned,
        totalLoc: prev.totalLoc + earned,
        lifetimeLoc: (prev.lifetimeLoc || prev.totalLoc) + earned,
        lastSaved: Date.now(),
      }));
      if (showReport) setOfflineReport({ earned, reason });
    };

    // Guarded by a ref because React StrictMode intentionally double-invokes
    // mount effects in dev, and this block isn't idempotent. The old code only
    // awarded offline time after 60s; short reloads now get their few seconds
    // back too, without a modal.
    if (!offlineProgressAppliedRef.current) {
      offlineProgressAppliedRef.current = true;
      const timeDiffMs = Date.now() - gameState.lastSaved;
      if (timeDiffMs > 5000) {
        applyAwayProgress(Math.floor(timeDiffMs / 1000), timeDiffMs > OFFLINE_REPORT_MIN_SECONDS * 1000);
      }
    }

    let lastTick = Date.now();
    // If the app is opened in a background tab, start tracking the hidden
    // interval immediately so it is awarded when the tab becomes visible.
    let hiddenAt: number | null = document.hidden ? Date.now() : null;

    // A hidden tab may be throttled to one timer per minute. Treat the hidden
    // interval as offline time instead of letting a delayed tick award it at
    // full rate. This makes an open background tab and a closed tab behave
    // the same way.
    const handleVisibilityChange = () => {
      if (document.hidden) {
        hiddenAt = Date.now();
        lastTick = Date.now();
        return;
      }

      const awaySince = hiddenAt;
      hiddenAt = null;
      lastTick = Date.now();
      if (awaySince !== null) {
        const secondsAway = Math.floor((Date.now() - awaySince) / 1000);
        if (secondsAway >= 5) {
          applyAwayProgress(secondsAway, secondsAway > OFFLINE_REPORT_MIN_SECONDS);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const interval = setInterval(() => {
      const currentTime = Date.now();
      const elapsed = (currentTime - lastTick) / 1000;
      lastTick = currentTime;

      if (document.hidden) return;

      if (elapsed > LIVE_GAP_OFFLINE_SECONDS) {
        applyAwayProgress(Math.floor(elapsed), elapsed > OFFLINE_REPORT_MIN_SECONDS);
        return;
      }

      const dt = Math.min(Math.max(elapsed, 0), MAX_LIVE_TICK_SECONDS);

      setGameState(prev => {
        const prod = calculateProduction(prev);

        const buildingCounts: number[] = Object.values(prev.buildingsOwned);
        const upgradeCounts: number[] = Object.values(prev.upgradesOwned);
        const totalBuildings = buildingCounts.reduce((a, b) => a + b, 0);
        const totalUpgrades = Math.min(20, upgradeCounts.reduce((a, b) => a + b, 0));

        // 1 TD/min per 100 buildings (0.01 per building)
        // 0.5 TD/min per 10 upgrades (0.05 per upgrade), capped at 20 upgrades (max +1.0 TD/min)
        const baseTDRatePerMin = (totalBuildings * 0.01) + (totalUpgrades * 0.05);
        const passiveTDRatePerSec = baseTDRatePerMin / 60;

        const tdAccumulation = passiveTDRatePerSec * getTDAcquisitionMultiplier(prev) * dt;
        const tdReduction = getTDReductionPerSec(prev) * dt;

        let newTD = (prev.technicalDebt || 0) + tdAccumulation - tdReduction;
        if (newTD < 0) newTD = 0;
        if (newTD > TD_MAX) newTD = TD_MAX;

        // Outages are temporary. Never delete a building: high TD takes one
        // building type offline for 30 seconds, then it recovers on its own.
        let newOutages = prev.outages || {};
        const activeOutages = Object.entries(newOutages).filter(([, until]) => until > currentTime);
        if (activeOutages.length !== Object.keys(newOutages).length) {
          newOutages = Object.fromEntries(activeOutages);
        }

        if (Object.keys(newOutages).length === 0 && newTD >= 50) {
          const outageChancePerSec = newTD >= 100 ? OUTAGE_CHANCE_PER_SEC_HIGH : OUTAGE_CHANCE_PER_SEC_LOW;
          if (Math.random() < outageChancePerSec * dt) {
            const owned = BUILDINGS.filter(b => (prev.buildingsOwned[b.id] || 0) > 0);
            if (owned.length > 0) {
              // Weight by owned count so a single rare Quantum Computer is
              // much less likely to be picked than one of many Buddies.
              const totalWeight = owned.reduce((sum, b) => sum + (prev.buildingsOwned[b.id] || 0), 0);
              let roll = Math.random() * totalWeight;
              let target = owned[owned.length - 1];
              for (const building of owned) {
                roll -= prev.buildingsOwned[building.id] || 0;
                if (roll <= 0) {
                  target = building;
                  break;
                }
              }
              newOutages = { [target.id]: currentTime + OUTAGE_DURATION_MS };
            }
          }
        }

        if (prod === 0 && tdAccumulation === 0 && tdReduction === 0 && Object.keys(newOutages).length === 0) {
          return { ...prev, lastSaved: currentTime, technicalDebt: newTD, outages: newOutages };
        }

        return {
          ...prev,
          loc: prev.loc + prod * dt,
          totalLoc: prev.totalLoc + prod * dt,
          lifetimeLoc: (prev.lifetimeLoc || prev.totalLoc) + prod * dt,
          lastSaved: currentTime,
          technicalDebt: newTD,
          outages: newOutages,
        };
      });
    }, 100);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleWriteCode = useCallback(() => {
    setGameState(prev => {
      const power = calculateClickPower(prev);
      return {
        ...prev,
        loc: prev.loc + power,
        totalLoc: prev.totalLoc + power,
        lifetimeLoc: (prev.lifetimeLoc || prev.totalLoc) + power
      };
    });
  }, []);

  const buyBuilding = (buildingId: string) => {
    setGameState(prev => {
      const { cost, count } = getBuildingCost(prev, buildingId, buyAmount);
      if (prev.loc >= cost && count > 0) {
        return {
          ...prev,
          loc: prev.loc - cost,
          buildingsOwned: {
            ...prev.buildingsOwned,
            [buildingId]: (prev.buildingsOwned[buildingId] || 0) + count
          }
        };
      }
      return prev;
    });
  };

  const buyUpgrade = (upgradeId: string) => {
    setGameState(prev => {
      const upgrade = UPGRADES.find(u => u.id === upgradeId)!;
      const { cost, count } = getUpgradeCost(prev, upgradeId, buyAmount);
      const currentLevel = prev.upgradesOwned[upgradeId] || 0;
      
      const maxLvl = typeof upgrade.maxLevel === 'function' ? upgrade.maxLevel(prev) : upgrade.maxLevel;
      if (maxLvl !== undefined && currentLevel >= maxLvl) return prev;
      if (count <= 0) return prev;

      if (prev.loc >= cost) {
        return {
          ...prev,
          loc: prev.loc - cost,
          upgradesOwned: {
            ...prev.upgradesOwned,
            [upgradeId]: currentLevel + count
          }
        };
      }
      return prev;
    });
  };

  const buyPrestigeUpgrade = (upgradeId: string) => {
    setGameState(prev => {
      const upgrade = PRESTIGE_UPGRADES.find(u => u.id === upgradeId)!;
      const { cost, count } = getPrestigeUpgradeCost(prev, upgradeId, buyAmount);
      const currentLevel = prev.prestigeUpgradesOwned?.[upgradeId] || 0;
      
      if (upgrade.maxLevel && currentLevel >= upgrade.maxLevel) return prev;
      if (count <= 0) return prev;

      if (prev.ac >= cost) {
        return {
          ...prev,
          ac: prev.ac - cost,
          prestigeUpgradesOwned: {
            ...prev.prestigeUpgradesOwned,
            [upgradeId]: currentLevel + count
          }
        };
      }
      return prev;
    });
  };

  const handlePrestige = () => {
    // Compute the payout inside the updater. A fast double-click would
    // otherwise calculate the same payout twice from the render snapshot;
    // the second invocation now sees stage 0 and becomes a no-op.
    setGameState(prev => {
      const acGained = calculateAcquisitionCapital(prev);
      if (acGained <= 0) return prev;

      const angelLvl = prev.prestigeUpgradesOwned?.['angel_investor'] || 0;
      return {
        ...DEFAULT_STATE,
        loc: angelLvl * 50000,
        lifetimeLoc: prev.lifetimeLoc || prev.totalLoc, // keep lifetime
        ac: (prev.ac || 0) + acGained,
        prestigeCount: (prev.prestigeCount || 0) + 1,
        prestigeUpgradesOwned: prev.prestigeUpgradesOwned || {},
        lastSaved: Date.now(),
      };
    });
    setActiveTab('team');
    setShowPrestigeConfirm(false);
  };

  const repairOutage = () => {
    setGameState(prev => {
      if (!prev.outages || Object.keys(prev.outages).length === 0) return prev;
      return { ...prev, outages: {} };
    });
  };

  const upgradeStage = () => {
    setGameState(prev => {
      if ((prev.technicalDebt || 0) >= 200) return prev;
      const nextStage = STAGES[prev.stage + 1];
      if (nextStage && prev.loc >= nextStage.cost) {
        return {
          ...prev,
          loc: prev.loc - nextStage.cost,
          stage: prev.stage + 1
        };
      }
      return prev;
    });
  };

  // --- SAVE/LOAD HANDLERS ---
  const confirmWipe = () => {
    storage.remove('codeTycoonEncryptedSave');
    storage.remove('codeTycoonSave');
    setGameState(DEFAULT_STATE);
    setShowResetConfirm(false);
    setShowPrestigeConfirm(false);
    setPendingImport(null);
    setShowOptions(false);
  };

  const exportSave = () => {
    const encoded = encodeSave(gameState);
    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(encoded);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `code_tycoon_save_${new Date().getTime()}.txt`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const importSave = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const parsed = decodeSave(result);
      if (parsed) {
        // Preview before replacing the current company. Importing is a
        // progress-loss action just like prestiging, so it gets a confirm.
        setPendingImport(sanitizeGameState(parsed));
        setShowOptions(false);
      } else {
        alert("Invalid save file!");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const confirmImport = () => {
    if (!pendingImport) return;
    setGameState({ ...pendingImport, lastSaved: Date.now() });
    setPendingImport(null);
    setActiveTab('team');
  };

  const currentStage = STAGES[gameState.stage];
  const nextStage = STAGES[gameState.stage + 1];
  const StageIcon = currentStage.icon;
  
  const currentProd = calculateProduction(gameState);
  const currentClick = calculateClickPower(gameState);

  const availableBuildings = BUILDINGS.filter(b => b.reqStage <= gameState.stage);
  const availableUpgrades = UPGRADES.filter(u => u.reqStage <= gameState.stage);

  const canAffordAnyBuilding = availableBuildings.some(b => {
    const { cost, count } = getBuildingCost(gameState, b.id, buyAmount);
    return gameState.loc >= cost && count > 0;
  });
  
  const getUpgradeMax = (upgrade: Upgrade) =>
    typeof upgrade.maxLevel === 'function' ? upgrade.maxLevel(gameState) : upgrade.maxLevel;

  // A dynamic max of 0 means "no hires yet", not "maxed". Locked equipment
  // stays visible with a clear requirement instead of appearing exhausted.
  const isUpgradeLocked = (upgrade: Upgrade) => {
    const max = getUpgradeMax(upgrade);
    return max !== undefined && max <= 0;
  };

  const isUpgradeMaxed = (upgrade: Upgrade) => {
    const max = getUpgradeMax(upgrade);
    const level = gameState.upgradesOwned[upgrade.id] || 0;
    return max !== undefined && max > 0 && level >= max;
  };

  const repeatableUpgrades = availableUpgrades.filter(u => u.maxLevel !== 1 && !isUpgradeMaxed(u));
  const oneTimeUpgrades = availableUpgrades.filter(u =>
    u.maxLevel === 1 && (gameState.upgradesOwned[u.id] || 0) < 1,
  );
  const exhaustedUpgrades = availableUpgrades.filter(isUpgradeMaxed);

  const canAffordAnyUpgrade = [...repeatableUpgrades, ...oneTimeUpgrades].some(u => {
    if (isUpgradeLocked(u)) return false;
    const { cost, count } = getUpgradeCost(gameState, u.id, buyAmount);
    return gameState.loc >= cost && count > 0;
  });

  const canAffordAnyPrestigeUpgrade = PRESTIGE_UPGRADES.some(u => {
    const owned = gameState.prestigeUpgradesOwned?.[u.id] || 0;
    if (u.maxLevel !== undefined && owned >= u.maxLevel) return false;
    const { cost, count } = getPrestigeUpgradeCost(gameState, u.id, buyAmount);
    return gameState.ac >= cost && count > 0;
  });

  const td = gameState.technicalDebt || 0;
  const tdNetPerMin = getTDNetRatePerMin(gameState);
  const tdThresholds = [0, 10, 25, 50, 100, 200];
  const tdNext = tdThresholds.find(t => t > td);
  const tdPrevious = [...tdThresholds].reverse().find(t => t <= td) ?? 0;
  const tdProgress = tdNext
    ? Math.min(100, Math.max(0, ((td - tdPrevious) / (tdNext - tdPrevious)) * 100))
    : 100;

  const activeOutage = Object.entries(gameState.outages || {})
    .find(([, until]) => until > Date.now());
  const activeOutageBuilding = activeOutage
    ? BUILDINGS.find(b => b.id === activeOutage[0])
    : undefined;
  const activeOutageSeconds = activeOutage
    ? Math.max(0, Math.ceil((activeOutage[1] - Date.now()) / 1000))
    : 0;

  const totalHires = getTotalHires(gameState);
  const humanMultiplier = getHumanMultiplier(gameState);
  const equippedKeyboards = Math.min(gameState.upgradesOwned['eq_keyboard'] || 0, totalHires);
  const equippedCoffee = Math.min(gameState.upgradesOwned['eq_coffee'] || 0, totalHires);
  const equippedChairs = Math.min(gameState.upgradesOwned['eq_chair'] || 0, totalHires);

  const AMOUNTS: BuyAmount[] = [1, 10, 50, 100, 'next', 'max'];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/30 pb-20 relative">
      
      {/* Top Navigation / Stage Banner */}
      <div className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-10 shadow-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4 relative">
          <div className="flex items-center gap-4 flex-1">
            <div className="p-2 bg-emerald-900/30 text-emerald-400 rounded-xl border border-emerald-800/50 hidden sm:block">
              <StageIcon size={24} />
            </div>
            <div>
              <h2 className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold">Current HQ</h2>
              <div className="text-base font-bold text-zinc-100">{currentStage.name}</div>
            </div>
          </div>

          <div className="absolute left-1/2 -translate-x-1/2 font-bold text-xl text-zinc-100 tracking-tight hidden md:block">
            Code Tycoon v0.0.7
          </div>

          <div className="flex items-center gap-3 flex-1 justify-end">
            {nextStage ? (
              <button
                onClick={upgradeStage}
                disabled={gameState.loc < nextStage.cost || td >= 200}
                aria-label={
                  td >= 200
                    ? 'HQ upgrade blocked by Technical Debt'
                    : `Upgrade HQ to ${nextStage.name} for ${formatNumber(nextStage.cost)} LOC`
                }
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
                  gameState.loc >= nextStage.cost && td < 200
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] cursor-pointer'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                }`}
              >
                <ArrowUpCircle size={18} />
                <div className="text-left hidden sm:block">
                  <div className="text-xs">Next: {nextStage.name}</div>
                  <div className="text-[10px] font-mono font-normal opacity-80">
                    {td >= 200 ? 'BLOCKED BY TD' : formatNumber(nextStage.cost) + ' LOC'}
                  </div>
                </div>
              </button>
            ) : (
              <div className="px-4 py-2 bg-amber-900/20 text-amber-400 border border-amber-900/50 rounded-xl flex items-center gap-2 font-semibold text-sm">
                <Trophy size={16} /> Max HQ
              </div>
            )}
            
            <button 
              onClick={() => { setShowOptions(true); setShowResetConfirm(false); }}
              aria-label="Open settings"
              title="Settings"
              className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-zinc-300 transition-colors"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-8 mt-2">
        
        {/* COMPACT TOP HERO: STATS & ACTION */}
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-zinc-950/50 rounded-xl p-4 border border-zinc-800/30 text-center flex flex-col justify-center">
              <div className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Lines of Code</div>
              <div className="text-3xl font-mono font-bold text-emerald-400">{formatNumber(gameState.loc)}</div>
            </div>
            <div className="bg-zinc-950/50 rounded-xl p-4 border border-zinc-800/30 text-center flex flex-col justify-center">
              <div className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Per Second</div>
              <div className="text-2xl font-mono text-zinc-200">{formatNumber(currentProd)}</div>
            </div>
            <div className="bg-zinc-950/50 rounded-xl p-4 border border-zinc-800/30 text-center flex flex-col justify-center">
              <div className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Per Click</div>
              <div className="text-2xl font-mono text-zinc-200">{formatNumber(currentClick)}</div>
              {currentProd > 0 && <div className="text-emerald-500/70 text-[10px] mt-1 font-mono">(Base + 1% of Per Sec)</div>}
            </div>
            <div className="bg-zinc-950/50 rounded-xl p-4 border border-zinc-800/30 text-center flex flex-col justify-center">
              <div className="text-zinc-400 text-[10px] uppercase tracking-wider mb-1">LOC This Run</div>
              <div className="text-xl font-mono text-zinc-500">{formatNumber(gameState.totalLoc)}</div>
            </div>
          </div>

          <div className="bg-zinc-950/50 rounded-xl p-4 border border-red-900/30 flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className={`p-2 rounded-lg shrink-0 ${
                td >= 50 ? 'bg-red-950/50 text-red-500' :
                td >= 10 ? 'bg-amber-950/50 text-amber-500' :
                'bg-zinc-900/50 text-zinc-500'
              }`}>
                <AlertTriangle size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-zinc-200 text-sm md:text-base">Technical Debt: <span className="font-mono">{formatNumber(td)}</span></h3>
                <p className={`text-xs md:text-sm ${
                  td >= 200 ? 'text-red-400 font-bold' :
                  td >= 50 ? 'text-red-400' :
                  td >= 10 ? 'text-amber-400' :
                  'text-zinc-500'
                }`}>
                  {td >= 200 ? 'Severe: -60% Prod, HQ progression blocked!' :
                   td >= 100 ? 'High: -40% Prod, temporary outages possible.' :
                   td >= 50 ? 'Medium: -20% Prod, occasional temporary outages.' :
                   td >= 25 ? 'Low: -10% Prod.' :
                   td >= 10 ? 'Minor: -5% Prod.' :
                   'Healthy: No penalties.'}
                </p>
                <div className="text-[10px] font-mono text-zinc-500 mt-1">
                  Net {tdNetPerMin >= 0 ? '+' : ''}{tdNetPerMin.toFixed(2)} TD/min
                  {tdNext ? ` · Next penalty at ${tdNext}` : ' · Maximum penalty'}
                </div>
                <div className="mt-2 h-1.5 w-full max-w-xs bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${td >= 50 ? 'bg-red-500' : td >= 10 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${tdProgress}%` }}
                  />
                </div>
                {activeOutageBuilding && activeOutage && (
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-red-300">
                    <span className="px-2 py-0.5 rounded bg-red-950/50 border border-red-900/50 font-semibold">
                      Outage: {activeOutageBuilding.name} offline ({activeOutageSeconds}s)
                    </span>
                    <button onClick={repairOutage} className="underline hover:text-white">Fix now</button>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                setGameState(prev => {
                  const cost = getRefactorCost(prev);
                  if (prev.loc < cost || (prev.technicalDebt || 0) <= 0) return prev;
                  return {
                    ...prev,
                    loc: prev.loc - cost,
                    technicalDebt: Math.max(0, (prev.technicalDebt || 0) - 10),
                  };
                });
              }}
              disabled={gameState.loc < getRefactorCost(gameState) || Math.floor(td) <= 0}
              className={`w-full sm:w-auto px-4 py-2 rounded-lg font-bold transition-all shrink-0 ${
                gameState.loc >= getRefactorCost(gameState) && Math.floor(td) > 0
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-sm cursor-pointer'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
              }`}
            >
              Refactor (-10 TD)
              <div className="text-[10px] font-mono font-normal">Cost: {formatNumber(getRefactorCost(gameState))} LOC</div>
            </button>
          </div>

          <button
            onClick={handleWriteCode}
            className="w-full py-6 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl font-bold text-2xl transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] flex items-center justify-center gap-3"
          >
            <Terminal size={28} />
            Write Code
          </button>
        </div>

        {/* TABS & MAIN CONTENT */}
        <div className="space-y-4">
          <div className="flex border-b border-zinc-800 mb-6">
            <button
              onClick={() => setActiveTab('team')}
              className={`flex-1 py-4 text-center font-bold text-lg transition-colors relative ${
                activeTab === 'team' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Hire Team ({getTotalHires(gameState)})
              {canAffordAnyBuilding && (
                <span className="absolute top-3 right-8 w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('upgrades')}
              className={`flex-1 py-4 text-center font-bold text-lg transition-colors relative ${
                activeTab === 'upgrades' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Upgrades
              {canAffordAnyUpgrade && (
                <span className="absolute top-3 right-8 w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
              )}
            </button>
            {(gameState.stage >= 2 || gameState.prestigeCount > 0) && (
              <button
                onClick={() => setActiveTab('boardroom')}
                className={`flex-1 py-4 text-center font-bold text-lg transition-colors relative ${
                  activeTab === 'boardroom' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Boardroom
                {canAffordAnyPrestigeUpgrade && (
                  <span className="absolute top-3 right-8 w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                )}
              </button>
            )}
          </div>

          {/* TAB CONTENT: HIRE TEAM */}
          {activeTab === 'team' && (
            <section>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                <p className="text-zinc-400 text-sm">Automate your code generation.</p>
                <div className="flex flex-wrap items-center gap-1 bg-zinc-900/50 p-1.5 rounded-lg border border-zinc-800 self-end sm:self-auto">
                  {AMOUNTS.map(amt => (
                    <button
                      key={amt}
                      onClick={() => setBuyAmount(amt)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all uppercase ${
                        buyAmount === amt 
                          ? 'bg-emerald-600 text-white shadow-sm' 
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                      }`}
                    >
                      {typeof amt === 'number' ? `x${amt}` : amt}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {availableBuildings.map(building => {
                  const { cost, count } = getBuildingCost(gameState, building.id, buyAmount);
                  const canAfford = gameState.loc >= cost;
                  const owned = gameState.buildingsOwned[building.id] || 0;
                  const Icon = building.icon;
                  
                  const bMult = getBuildingMultiplier(gameState, building.id, owned);
                  const globalMult = getGlobalMultiplier(gameState);
                  const outaged = isBuildingOutaged(gameState, building.id);
                  const actualProd = outaged ? 0 : building.baseProduction * bMult * globalMult;
                  
                  return (
                    <button
                      key={building.id}
                      onClick={() => buyBuilding(building.id)}
                      disabled={!canAfford || count === 0}
                      className={`w-full flex flex-col p-3 rounded-lg border transition-all ${
                        canAfford && count > 0
                          ? 'bg-zinc-900/80 border-zinc-700 hover:border-emerald-500/50 hover:bg-zinc-800 cursor-pointer shadow-sm'
                          : 'bg-zinc-950/50 border-zinc-800/50 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-start gap-3 w-full">
                        <div className="p-1.5 bg-zinc-800 rounded-md shrink-0 text-zinc-300">
                          <Icon size={16} />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex justify-between items-center mb-0.5">
                            <h3 className="font-semibold text-zinc-200 text-sm truncate">{building.name}</h3>
                            <span className="text-sm font-mono font-bold text-zinc-500 shrink-0">{owned}</span>
                          </div>
                          <p className="text-[11px] text-zinc-400 leading-tight">{building.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between w-full mt-2 pt-2 border-t border-zinc-800/50">
                        <div className={`text-[11px] font-mono ${outaged ? 'text-red-400' : 'text-emerald-500/70'}`}>
                          {outaged ? (
                            'Outage — 0 LOC/s'
                          ) : (
                            <>
                              +{formatNumber(actualProd)} <span className="opacity-75">LOC/s each</span>
                              {owned > 0 && (
                                <span className="opacity-60"> · {formatNumber(actualProd * owned)}/s total</span>
                              )}
                            </>
                          )}
                        </div>
                        <div className={`font-mono text-xs px-2 py-1 rounded bg-zinc-950/50 ${canAfford && count > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {count > 1 && <span className="opacity-70 text-[10px] mr-1">Buy {count}:</span>}
                          {formatNumber(cost)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* TAB CONTENT: UPGRADES */}
          {activeTab === 'upgrades' && (
            <section>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                <p className="text-zinc-400 text-sm">Invest in better tools and culture.</p>
                <div className="flex flex-wrap items-center gap-1 bg-zinc-900/50 p-1.5 rounded-lg border border-zinc-800 self-end sm:self-auto">
                  {AMOUNTS.map(amt => (
                    <button
                      key={amt}
                      onClick={() => setBuyAmount(amt)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all uppercase ${
                        buyAmount === amt 
                          ? 'bg-emerald-600 text-white shadow-sm' 
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                      }`}
                    >
                      {typeof amt === 'number' ? `x${amt}` : amt}
                    </button>
                  ))}
                </div>
              </div>

              {totalHires > 0 && (
                <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-[11px] text-zinc-400">
                  <span className="font-semibold uppercase tracking-wider text-zinc-300">Team equipment</span>
                  <span>Keyboards <span className="font-mono text-zinc-200">{equippedKeyboards}/{totalHires}</span></span>
                  <span>Coffee <span className="font-mono text-zinc-200">{equippedCoffee}/{totalHires}</span></span>
                  <span>Chairs <span className="font-mono text-zinc-200">{equippedChairs}/{totalHires}</span></span>
                  <span>Human multiplier <span className="font-mono text-emerald-400">x{humanMultiplier.toFixed(2)}</span></span>
                </div>
              )}

              {/* REGULAR UPGRADES */}
              <div className="mb-6">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Repeatable Upgrades</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {repeatableUpgrades.map(upgrade => {
                    const level = gameState.upgradesOwned[upgrade.id] || 0;
                    const max = getUpgradeMax(upgrade);
                    const isLocked = isUpgradeLocked(upgrade);
                    const isMaxed = isUpgradeMaxed(upgrade);
                    const { cost, count } = getUpgradeCost(gameState, upgrade.id, buyAmount);
                    const canAfford = gameState.loc >= cost;
                    const Icon = upgrade.icon;
                    const name = typeof upgrade.name === 'function' ? upgrade.name(level) : upgrade.name;
                    const desc = upgrade.description(level);
                    const nextDesc = upgrade.description(level + 1);
                    const showNext = !isLocked && !isMaxed && nextDesc !== desc;
                    
                    return (
                      <button
                        key={upgrade.id}
                        onClick={() => buyUpgrade(upgrade.id)}
                        disabled={isLocked || isMaxed || !canAfford || count === 0}
                        className={`relative p-3 rounded-lg border text-left transition-all ${
                          isLocked
                            ? 'bg-zinc-950/50 border-zinc-800/50 opacity-60 cursor-not-allowed'
                            : isMaxed
                              ? 'bg-emerald-950/20 border-emerald-900/30 opacity-50 cursor-not-allowed'
                              : canAfford && count > 0
                                ? 'bg-zinc-900/80 border-zinc-700 hover:border-emerald-500/50 hover:bg-zinc-800 cursor-pointer shadow-sm'
                                : 'bg-zinc-950/50 border-zinc-800/50 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-1.5 rounded-md shrink-0 ${level > 0 ? 'bg-emerald-900/50 text-emerald-400' : 'bg-zinc-800 text-zinc-300'}`}>
                            <Icon size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h3 className="font-semibold text-zinc-200 text-sm truncate">{name}</h3>
                              {level > 0 && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-900/30 text-emerald-400 shrink-0">
                                  Lvl {level}{max !== undefined ? ` / ${max}` : ''}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-zinc-400 leading-tight">Current: {desc}</p>
                            {showNext && (
                              <p className="text-[11px] text-emerald-500/80 leading-tight mt-0.5">Next level: {nextDesc}</p>
                            )}
                          </div>
                          <div className="text-right shrink-0 self-center">
                            {isLocked ? (
                              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold px-2 py-1">Requires a hire</span>
                            ) : !isMaxed ? (
                              <div className={`font-mono text-xs px-2 py-1 rounded bg-zinc-950/50 ${canAfford && count > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {count > 1 && <span className="opacity-70 text-[10px] mr-1">Buy {count}:</span>}
                                {formatNumber(cost)}
                              </div>
                            ) : (
                              <span className="text-[10px] uppercase tracking-wider text-emerald-500 font-semibold px-2 py-1">Maxed</span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  {repeatableUpgrades.length === 0 && (
                    <div className="col-span-full p-4 text-center text-zinc-500 border border-zinc-800/50 rounded-xl border-dashed text-sm">
                      {availableUpgrades.some(u => u.maxLevel !== 1)
                        ? 'All repeatable upgrades are maxed for this HQ. Upgrade your HQ to unlock more.'
                        : 'Upgrade your HQ to unlock technologies.'}
                    </div>
                  )}
                </div>
              </div>

              {/* ONE-TIME UPGRADES */}
              <div className="mb-6">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">One-Time Tech Upgrades</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {oneTimeUpgrades.map(upgrade => {
                    const level = gameState.upgradesOwned[upgrade.id] || 0;
                    const isMaxed = level >= 1;
                    const { cost } = getUpgradeCost(gameState, upgrade.id, 1);
                    const canAfford = gameState.loc >= cost;
                    const Icon = upgrade.icon;
                    const name = typeof upgrade.name === 'function' ? upgrade.name(level) : upgrade.name;
                    const desc = upgrade.description(level);
                    
                    return (
                      <button
                        key={upgrade.id}
                        onClick={() => buyUpgrade(upgrade.id)}
                        disabled={isMaxed || !canAfford}
                        className={`relative p-3 rounded-lg border text-left transition-all ${
                          isMaxed 
                            ? 'bg-emerald-950/20 border-emerald-900/30 opacity-50 cursor-not-allowed' 
                            : canAfford
                              ? 'bg-zinc-900/80 border-zinc-700 hover:border-emerald-500/50 hover:bg-zinc-800 cursor-pointer shadow-sm'
                              : 'bg-zinc-950/50 border-zinc-800/50 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-1.5 rounded-md shrink-0 ${level > 0 ? 'bg-emerald-900/50 text-emerald-400' : 'bg-zinc-800 text-zinc-300'}`}>
                            <Icon size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-zinc-200 text-sm truncate mb-0.5">{name}</h3>
                            <p className="text-[11px] text-zinc-400 leading-tight">{desc}</p>
                          </div>
                          <div className="text-right shrink-0 self-center">
                            {!isMaxed ? (
                              <div className={`font-mono text-xs px-2 py-1 rounded bg-zinc-950/50 ${canAfford ? 'text-emerald-400' : 'text-red-400'}`}>
                                {formatNumber(cost)}
                              </div>
                            ) : (
                              <span className="text-[10px] uppercase tracking-wider text-emerald-500 font-semibold px-2 py-1">Maxed</span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  {oneTimeUpgrades.length === 0 && (
                    <div className="col-span-full p-4 text-center text-zinc-500 border border-zinc-800/50 rounded-xl border-dashed text-sm">
                      {availableUpgrades.some(u => u.maxLevel === 1)
                        ? 'All one-time tech for this HQ is already installed.'
                        : 'Upgrade your HQ to unlock technologies.'}
                    </div>
                  )}
                </div>
              </div>

              {/* EXHAUSTED UPGRADES */}
              {exhaustedUpgrades.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Exhausted Technologies</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 opacity-60">
                    {exhaustedUpgrades.map(upgrade => {
                      const level = gameState.upgradesOwned[upgrade.id] || 0;
                      const max = getUpgradeMax(upgrade);
                      const Icon = upgrade.icon;
                      const name = typeof upgrade.name === 'function' ? upgrade.name(level) : upgrade.name;
                      const desc = upgrade.description(level);
                      
                      return (
                        <div
                          key={upgrade.id}
                          className="relative p-3 rounded-lg border text-left bg-emerald-950/10 border-emerald-900/30 cursor-not-allowed"
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-1.5 rounded-md shrink-0 bg-emerald-900/50 text-emerald-400">
                              <Icon size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <h3 className="font-semibold text-zinc-200 text-sm truncate">{name}</h3>
                                {level > 0 && (
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-900/30 text-emerald-400 shrink-0">
                                    Lvl {level}{max !== undefined ? ` / ${max}` : ''}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-zinc-400 leading-tight">Current: {desc}</p>
                            </div>
                            <div className="text-right shrink-0 self-center">
                              <span className="text-[10px] uppercase tracking-wider text-emerald-500 font-semibold px-2 py-1">Maxed</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* TAB CONTENT: BOARDROOM */}
          {activeTab === 'boardroom' && (
            <section>
              <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-2xl p-6 shadow-lg mb-8 backdrop-blur-sm">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div>
                    <h3 className="text-xl font-bold text-zinc-100 mb-2 flex items-center gap-2">
                      <Building2 size={24} className="text-emerald-500" /> Sell Company
                    </h3>
                    {gameState.stage >= 2 ? (
                      <p className="text-zinc-400 text-sm max-w-md mb-2">
                        Your company has gained the attention of a <strong className="text-zinc-200">{STAGES[gameState.stage].buyerName}</strong>. 
                        They are offering to acquire you for Acquisition Capital (AC), giving a <strong className="text-emerald-400">x{STAGES[gameState.stage].buyerMultiplier}</strong> multiplier to the payout!
                      </p>
                    ) : (
                      <p className="text-zinc-400 text-sm max-w-md mb-2">
                        Grow your company to <strong className="text-zinc-200">Startup Office</strong> to attract buyers.
                      </p>
                    )}
                    <p className="text-zinc-500 text-xs">
                      Selling resets your LOC, buildings, upgrades, HQ stage, Technical Debt and outages.
                      It keeps Founder Perks, AC and lifetime LOC.
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-center min-w-[200px]">
                    <div className="text-3xl font-bold text-emerald-400 mb-1">
                      +{formatNumber(calculateAcquisitionCapital(gameState))} AC
                    </div>
                    <div className="text-zinc-500 text-xs uppercase tracking-wider mb-4">Payout</div>
                    <button
                      onClick={() => setShowPrestigeConfirm(true)}
                      disabled={calculateAcquisitionCapital(gameState) <= 0}
                      className={`px-8 py-3 rounded-xl font-bold transition-all w-full ${
                        calculateAcquisitionCapital(gameState) > 0
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] cursor-pointer'
                          : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                      }`}
                    >
                      Review Acquisition Offer
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-zinc-100">Founder Perks</h3>
                  <div className="px-3 py-1 bg-emerald-900/30 border border-emerald-800/50 rounded-full text-emerald-400 font-mono text-sm font-bold">
                    {formatNumber(gameState.ac)} AC Available
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1 bg-zinc-900/50 p-1.5 rounded-lg border border-zinc-800">
                  {AMOUNTS.map(amt => (
                    <button
                      key={amt}
                      onClick={() => setBuyAmount(amt)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all uppercase ${
                        buyAmount === amt 
                          ? 'bg-emerald-600 text-white shadow-sm' 
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                      }`}
                    >
                      {typeof amt === 'number' ? `x${amt}` : amt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {PRESTIGE_UPGRADES.filter(u => {
                    const level = gameState.prestigeUpgradesOwned?.[u.id] || 0;
                    return u.maxLevel === undefined || level < u.maxLevel;
                  }).map(upgrade => {
                    const level = gameState.prestigeUpgradesOwned?.[upgrade.id] || 0;
                    const isMaxed = upgrade.maxLevel !== undefined && level >= upgrade.maxLevel;
                    const { cost, count } = getPrestigeUpgradeCost(gameState, upgrade.id, buyAmount);
                    const canAfford = gameState.ac >= cost;
                    const Icon = upgrade.icon;
                    const name = upgrade.name;
                    const desc = upgrade.description(level);
                    const nextDesc = upgrade.description(level + 1);
                    const showNext = !isMaxed && nextDesc !== desc;
                    
                    return (
                      <button
                        key={upgrade.id}
                        onClick={() => buyPrestigeUpgrade(upgrade.id)}
                        disabled={isMaxed || !canAfford || count === 0}
                        className={`relative p-3 rounded-lg border text-left transition-all ${
                          isMaxed 
                            ? 'bg-emerald-950/20 border-emerald-900/30 opacity-50 cursor-not-allowed' 
                            : canAfford && count > 0
                              ? 'bg-zinc-900/80 border-zinc-700 hover:border-emerald-500/50 hover:bg-zinc-800 cursor-pointer shadow-sm'
                              : 'bg-zinc-950/50 border-zinc-800/50 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-1.5 rounded-md shrink-0 ${level > 0 ? 'bg-emerald-900/50 text-emerald-400' : 'bg-zinc-800 text-zinc-300'}`}>
                            <Icon size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h3 className="font-semibold text-zinc-200 text-sm truncate">{name}</h3>
                              {level > 0 && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-900/30 text-emerald-400 shrink-0">
                                  Lvl {level}{upgrade.maxLevel !== undefined ? ` / ${upgrade.maxLevel}` : ''}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-zinc-400 leading-tight">Current: {desc}</p>
                            {showNext && (
                              <p className="text-[11px] text-emerald-500/80 leading-tight mt-0.5">Next level: {nextDesc}</p>
                            )}
                          </div>
                          <div className="text-right shrink-0 self-center">
                            {!isMaxed ? (
                              <div className={`font-mono text-xs px-2 py-1 rounded bg-zinc-950/50 ${canAfford && count > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {count > 1 && <span className="opacity-70 text-[10px] mr-1">Buy {count}:</span>}
                                {formatNumber(cost)} AC
                              </div>
                            ) : (
                              <span className="text-[10px] uppercase tracking-wider text-emerald-500 font-semibold px-2 py-1">Maxed</span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* EXHAUSTED PERKS */}
              {PRESTIGE_UPGRADES.filter(u => {
                const level = gameState.prestigeUpgradesOwned?.[u.id] || 0;
                return u.maxLevel !== undefined && level >= u.maxLevel;
              }).length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Exhausted Perks</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 opacity-60">
                    {PRESTIGE_UPGRADES.filter(u => {
                      const level = gameState.prestigeUpgradesOwned?.[u.id] || 0;
                      return u.maxLevel !== undefined && level >= u.maxLevel;
                    }).map(upgrade => {
                      const level = gameState.prestigeUpgradesOwned?.[upgrade.id] || 0;
                      const Icon = upgrade.icon;
                      const name = upgrade.name;
                      const desc = upgrade.description(level);
                      
                      return (
                        <div
                          key={upgrade.id}
                          className="relative p-3 rounded-lg border text-left bg-emerald-950/10 border-emerald-900/30 cursor-not-allowed"
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-1.5 rounded-md shrink-0 bg-emerald-900/50 text-emerald-400">
                              <Icon size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <h3 className="font-semibold text-zinc-200 text-sm truncate">{name}</h3>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-900/30 text-emerald-400 shrink-0">
                                  Lvl {level} / {upgrade.maxLevel}
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-400 leading-tight">Current: {desc}</p>
                            </div>
                            <div className="text-right shrink-0 self-center">
                              <span className="text-[10px] uppercase tracking-wider text-emerald-500 font-semibold px-2 py-1">Maxed</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          )}

        </div>
      </div>

      {/* OPTIONS MODAL */}
      {showOptions && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Settings and stats"
            className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
          >
            <div className="flex justify-between items-center p-4 border-b border-zinc-800">
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <Settings size={20} /> Settings & Stats
              </h2>
              <button
                onClick={() => { setShowOptions(false); setShowResetConfirm(false); }}
                aria-label="Close settings"
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto">
              
              <div className="space-y-3">
                <h3 className="text-sm uppercase tracking-wider text-zinc-500 font-semibold">Statistics</h3>
                <div className="bg-zinc-950/50 rounded-xl p-4 border border-zinc-800/30 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Lifetime LOC</span>
                    <span className="font-mono text-zinc-200">{formatNumber(gameState.lifetimeLoc || gameState.totalLoc)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">LOC This Run</span>
                    <span className="font-mono text-zinc-200">{formatNumber(gameState.totalLoc)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Total Acquisitions</span>
                    <span className="font-mono text-zinc-200">{gameState.prestigeCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Current HQ Stage</span>
                    <span className="font-mono text-zinc-200">{STAGES[gameState.stage].name}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm uppercase tracking-wider text-zinc-500 font-semibold">Game Info</h3>
                <a 
                  href={`data:text/plain;charset=utf-8,${encodeURIComponent(designDocument)}`}
                  download="Code_Tycoon_Design_Doc.txt"
                  className="w-full py-3 bg-indigo-900/40 hover:bg-indigo-900/60 text-indigo-300 rounded-xl font-semibold flex items-center justify-center gap-3 transition-colors border border-indigo-500/30 hover:border-indigo-500/50"
                >
                  <FileText size={18} /> Download Design Document (Lore & Mechanics)
                </a>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm uppercase tracking-wider text-zinc-500 font-semibold">Save Data</h3>
                {storageWarning && (
                  <p className="rounded-lg border border-amber-900/50 bg-amber-950/30 px-3 py-2 text-xs text-amber-300">
                    Automatic saving is unavailable in this browser. Export your save manually so progress is not lost.
                  </p>
                )}
                <button 
                  onClick={exportSave}
                  className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl font-semibold flex items-center justify-center gap-3 transition-colors border border-zinc-700 hover:border-zinc-500"
                >
                  <Download size={18} /> Export Save to File
                </button>
                
                <label className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl font-semibold flex items-center justify-center gap-3 transition-colors border border-zinc-700 hover:border-zinc-500 cursor-pointer">
                  <Upload size={18} /> Import Save from File
                  <input 
                    type="file" 
                    accept=".txt"
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={importSave} 
                  />
                </label>
              </div>

              {showResetConfirm ? (
                <div className="pt-4 border-t border-zinc-800 space-y-3">
                  <h3 className="text-sm uppercase tracking-wider text-red-900/80 font-semibold">Are you sure?</h3>
                  <p className="text-xs text-zinc-400">This will permanently delete all progress. There is no undo.</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={confirmWipe} 
                      className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-semibold transition-colors"
                    >
                      Yes, Reset
                    </button>
                    <button 
                      onClick={() => setShowResetConfirm(false)} 
                      className="flex-1 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-4 border-t border-zinc-800 space-y-3">
                  <h3 className="text-sm uppercase tracking-wider text-red-900/80 font-semibold">Danger Zone</h3>
                  <button 
                    onClick={() => setShowResetConfirm(true)} 
                    className="w-full py-3 bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 rounded-xl font-semibold flex items-center justify-center gap-3 transition-colors"
                  >
                    <Trash2 size={18} /> Hard Reset Game
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* PRESTIGE CONFIRMATION */}
      {showPrestigeConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Confirm acquisition"
            className="bg-zinc-900 border border-emerald-900/50 rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 space-y-4">
              <h2 className="text-xl font-bold text-zinc-100">Accept the acquisition?</h2>
              <p className="text-sm text-zinc-400">
                <strong className="text-zinc-200">{STAGES[gameState.stage].buyerName || 'A buyer'}</strong> will acquire
                your company for <strong className="text-emerald-400">+{formatNumber(calculateAcquisitionCapital(gameState))} AC</strong>.
                The offer is based on the {formatNumber(gameState.totalLoc)} LOC you earned this run.
              </p>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 text-xs space-y-2">
                <p><span className="font-semibold text-red-300">Resets:</span> LOC, buildings, upgrades, HQ stage, Technical Debt and outages.</p>
                <p><span className="font-semibold text-emerald-300">Keeps:</span> Founder Perks, AC, lifetime LOC and acquisition count.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePrestige}
                  className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white transition-colors hover:bg-emerald-500"
                >
                  Confirm Sale
                </button>
                <button
                  onClick={() => setShowPrestigeConfirm(false)}
                  className="flex-1 rounded-xl bg-zinc-700 px-4 py-3 font-semibold text-white transition-colors hover:bg-zinc-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IMPORT CONFIRMATION */}
      {pendingImport && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Confirm save import"
            className="bg-zinc-900 border border-indigo-900/50 rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 space-y-4">
              <h2 className="text-xl font-bold text-zinc-100">Replace your current company?</h2>
              <p className="text-sm text-zinc-400">
                The imported save will overwrite your current progress. Export the current save first if you might want it back.
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
                  <div className="mb-1 font-semibold uppercase tracking-wider text-zinc-500">Current</div>
                  <div className="text-zinc-300">{STAGES[gameState.stage].name}</div>
                  <div className="font-mono text-zinc-400">{formatNumber(gameState.loc)} LOC · {formatNumber(gameState.ac)} AC</div>
                </div>
                <div className="rounded-xl border border-indigo-900/50 bg-indigo-950/20 p-3">
                  <div className="mb-1 font-semibold uppercase tracking-wider text-indigo-400">Imported</div>
                  <div className="text-zinc-200">{STAGES[pendingImport.stage].name}</div>
                  <div className="font-mono text-zinc-400">{formatNumber(pendingImport.loc)} LOC · {formatNumber(pendingImport.ac)} AC</div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={confirmImport}
                  className="rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white transition-colors hover:bg-indigo-500"
                >
                  Replace Save
                </button>
                <button
                  onClick={exportSave}
                  className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 font-semibold text-zinc-200 transition-colors hover:bg-zinc-700"
                >
                  Download Current Save First
                </button>
                <button
                  onClick={() => setPendingImport(null)}
                  className="rounded-xl bg-zinc-700 px-4 py-3 font-semibold text-white transition-colors hover:bg-zinc-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OFFLINE PROGRESS MODAL */}
      {offlineReport && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Offline progress report"
            className="bg-zinc-900 border border-emerald-900/50 rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto shadow-emerald-900/20"
          >
            <div className="flex justify-between items-center p-4 border-b border-zinc-800 bg-zinc-800/50">
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <Coffee size={20} className="text-emerald-500" /> Welcome Back
              </h2>
              <button
                onClick={() => setOfflineReport(null)}
                aria-label="Close welcome back report"
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6 text-center">
              <div className="space-y-2">
                <p className="text-zinc-400">While you were away, your team wrote</p>
                <div className="text-4xl font-mono font-bold text-emerald-400 tracking-tight">
                  +{formatNumber(offlineReport.earned)} LOC
                </div>
              </div>
              
              <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/50 inline-block text-sm text-zinc-300">
                {offlineReport.reason}
              </div>
              
              <button 
                onClick={() => setOfflineReport(null)}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
              >
                Merge Pull Requests & Start
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
