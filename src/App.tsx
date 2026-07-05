import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Terminal, Users, Zap, Coffee, Keyboard, Cpu, Trophy, 
  Home, Building, Building2, Landmark, GitBranch, 
  Monitor, Server, Cloud, Rocket, Save, Trash2, ArrowUpCircle,
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
    description: (lvl) => `Upgrade all keyboards. Each keyboard now gives +${(lvl + 2) * 50}% production.`, icon: Keyboard, reqStage: 1 },
  { id: 'brand_coffee', 
    name: (lvl) => ["DipIn Donuts Coffee", "MoonBucks Roastery", "YesPresso Pods", "Copy Luwak Beans"][lvl] || "Maxed Brand",
    baseCost: 150000, growthFactor: 10, maxLevel: (state) => Math.min(4, state.stage), 
    description: (lvl) => `Upgrade all coffee. Each machine now gives +${(lvl + 2) * 100}% production.`, icon: Coffee, reqStage: 1 },
  { id: 'brand_chair', 
    name: (lvl) => ["FXRunner Chairs", "MysteryLab Titan", "RegalChairs Hero", "Human Miller Aeron"][lvl] || "Maxed Brand",
    baseCost: 2500000, growthFactor: 10, maxLevel: (state) => Math.min(4, Math.max(0, state.stage - 1)), 
    description: (lvl) => `Upgrade all chairs. Each chair now gives +${(lvl + 2) * 200}% production.`, icon: Trophy, reqStage: 2 },

  // Other repeatables
  { id: 'code_reviews', name: 'Code Reviews', baseCost: 2500, growthFactor: 2.0, description: (lvl) => `All building base production +${(lvl + 1) * 10}%.`, icon: GitBranch, reqStage: 0 },
  { id: 'stock_options', name: 'Stock Options', baseCost: 25000000, growthFactor: 10, maxLevel: 5, description: (lvl) => `Global production x1.5 (Level ${lvl}/5). Keep talent happy.`, icon: Landmark, reqStage: 2 },
  
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

const formatNumber = (num: number) => {
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  return Math.floor(num).toLocaleString('en-US');
};

const PRESTIGE_UPGRADES: PrestigeUpgrade[] = [
  { id: 'founder_network', name: "Founder's Network", baseCost: 1, growthFactor: 1.5, description: (lvl) => `Base Click Power +${(lvl + 1) * 10}.`, icon: Users },
  { id: 'angel_investor', name: "Angel Investor", baseCost: 2, growthFactor: 2.0, description: (lvl) => `Start runs with ${formatNumber((lvl + 1) * 50000)} LOC.`, icon: Landmark },
  { id: 'remote_work', name: "Remote Work Policy", baseCost: 3, growthFactor: 1.7, maxLevel: 10, description: (lvl) => `+${(lvl + 1) * 30} min to offline cap thresholds.`, icon: Home },
  { id: 'brand_recognition', name: "Brand Recognition", baseCost: 5, growthFactor: 1.8, maxLevel: 20, description: (lvl) => `Reduces all building costs by ${(lvl + 1) * 2}%.`, icon: Trophy },
  { id: 'synergy', name: "Corporate Synergy", baseCost: 10, growthFactor: 3.0, description: (lvl) => `Global Production +${(lvl + 1) * 20}%.`, icon: Building2 },
  { id: '10x_culture', name: "10x Culture", baseCost: 25, growthFactor: 5.0, description: (lvl) => `Clicking is ${Math.pow(2, lvl + 1)}x as effective.`, icon: Zap },
];

const DEFAULT_STATE: GameState = {
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
};

// --- OBFUSCATION ---
const encodeSave = (data: GameState) => {
  const json = JSON.stringify(data);
  const b64 = btoa(encodeURIComponent(json));
  // Shift characters by 1 for basic obfuscation to deter casual cheating
  return b64.split('').map(c => String.fromCharCode(c.charCodeAt(0) + 1)).join('');
};

const decodeSave = (str: string): GameState | null => {
  try {
    const b64 = str.split('').map(c => String.fromCharCode(c.charCodeAt(0) - 1)).join('');
    return JSON.parse(decodeURIComponent(atob(b64)));
  } catch (e) {
    return null;
  }
};

// --- HELPER FUNCTIONS ---
const getMilestoneMultiplier = (count: number) => {
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

const getTDPenaltyMultiplier = (td: number) => {
  if (td >= 200) return 0.40;
  if (td >= 100) return 0.60;
  if (td >= 50) return 0.80;
  if (td >= 25) return 0.90;
  if (td >= 10) return 0.95;
  return 1;
};

// TD has no upper bound (it only affects gameplay via the capped penalty above),
// so a long-idle session can push it into the thousands. Cap the exponent here
// to keep the cost finite (1.1^1000 ~= 2e41) instead of overflowing to Infinity,
// which would otherwise permanently disable the Refactor button.
const REFACTOR_COST_TD_CAP = 1000;
const getRefactorCost = (td: number) => 100 * Math.pow(1.1, Math.min(td, REFACTOR_COST_TD_CAP));

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

const calculateProduction = (state: GameState) => {
  const globalMult = getGlobalMultiplier(state);
  return BUILDINGS.reduce((total, b) => {
    const count = state.buildingsOwned[b.id] || 0;
    const bMult = getBuildingMultiplier(state, b.id, count);
    return total + (b.baseProduction * count * bMult * globalMult);
  }, 0);
};

const calculateClickPower = (state: GameState) => {
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
const calculateCost = (baseCost: number, growthFactor: number, owned: number, loc: number, amount: BuyAmount, maxLevel?: number) => {
  const availableLevels = maxLevel !== undefined ? maxLevel - owned : Infinity;
  if (availableLevels <= 0) return { cost: 0, count: 0 };

  const getCostForN = (n: number) => {
    if (growthFactor === 1) return baseCost * n;
    const currentBase = baseCost * Math.pow(growthFactor, owned);
    return currentBase * ((Math.pow(growthFactor, n) - 1) / (growthFactor - 1));
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
      const currentBase = baseCost * Math.pow(growthFactor, owned);
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

const calculateAcquisitionCapital = (state: GameState) => {
  if (state.stage < 2) return 0;
  const currentStage = STAGES[state.stage];
  const buyerMult = currentStage.buyerMultiplier || 1;
  const baseAC = Math.floor(Math.pow(state.totalLoc / 100000, 0.5));
  return baseAC * buyerMult;
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
    const saved = localStorage.getItem('codeTycoonBuyAmount');
    if (saved === 'next' || saved === 'max') return saved;
    if (saved) {
      const parsed = parseInt(saved);
      if ([1, 10, 50, 100].includes(parsed)) return parsed as BuyAmount;
    }
    return 1;
  });

  useEffect(() => {
    localStorage.setItem('codeTycoonBuyAmount', buyAmount.toString());
  }, [buyAmount]);

  const [activeTab, setActiveTab] = useState<'team' | 'upgrades' | 'boardroom'>('team');
  const [showOptions, setShowOptions] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [offlineReport, setOfflineReport] = useState<{earned: number; reason: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [gameState, setGameState] = useState<GameState>(() => {
    // Try loading encrypted save first
    const encSaved = localStorage.getItem('codeTycoonEncryptedSave');
    if (encSaved) {
      const parsed = decodeSave(encSaved);
      if (parsed) return { ...DEFAULT_STATE, ...parsed };
    }
    // Fallback to old plain JSON save if present
    const saved = localStorage.getItem('codeTycoonSave');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_STATE, ...parsed };
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
      localStorage.setItem('codeTycoonEncryptedSave', encodeSave(gameStateRef.current));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Offline progress and game loop
  useEffect(() => {
    // Calculate offline progress
    const now = Date.now();
    const timeDiffMs = now - gameState.lastSaved;
    if (timeDiffMs > 60000) { // more than 1 minute
       const prodPerSec = calculateProduction(gameState);
       if (prodPerSec > 0) {
           const remoteWorkLvl = gameState.prestigeUpgradesOwned['remote_work'] || 0;
           const extraMins = remoteWorkLvl * 30;
           
           const cap1 = (30 + extraMins) * 60; // 100%
           const cap2 = (120 + extraMins) * 60; // 50%
           const cap3 = (240 + extraMins) * 60; // 20%
           
           let earned = 0;
           let secondsOffline = Math.floor(timeDiffMs / 1000);
           let reason = "Your team worked at 100% capacity while you were gone.";
           
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

           if (earned > 0) {
               setOfflineReport({ earned, reason });
               setGameState(prev => ({
                   ...prev,
                   loc: prev.loc + earned,
                   totalLoc: prev.totalLoc + earned,
                   lifetimeLoc: (prev.lifetimeLoc || prev.totalLoc) + earned,
                   lastSaved: Date.now()
               }));
           }
       }
    }

    let lastTime = Date.now();
    const interval = setInterval(() => {
      const currentTime = Date.now();
      const dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      
      setGameState(prev => {
        const prod = calculateProduction(prev);
        
        const totalBuildings = Object.values(prev.buildingsOwned).reduce((a, b) => a + b, 0);
        const totalUpgrades = Math.min(20, Object.values(prev.upgradesOwned).reduce((a, b) => a + b, 0));
        
        // 1 TD/min per 100 buildings (0.01 per building)
        // 0.5 TD/min per 10 upgrades (0.05 per upgrade), capped at 20 upgrades (max +1.0 TD/min)
        const baseTDRatePerMin = (totalBuildings * 0.01) + (totalUpgrades * 0.05);
        const passiveTDRatePerSec = baseTDRatePerMin / 60;
        
        const tdAccumulation = passiveTDRatePerSec * getTDAcquisitionMultiplier(prev) * dt;
        const tdReduction = getTDReductionPerSec(prev) * dt;
        
        let newTD = (prev.technicalDebt || 0) + tdAccumulation - tdReduction;
        if (newTD < 0) newTD = 0;
        
        let newBuildings = prev.buildingsOwned;
        if (newTD >= 50) {
            const shutdownChancePerSec = newTD >= 100 ? 0.05 : 0.01;
            if (Math.random() < shutdownChancePerSec * dt) {
                const available = Object.keys(newBuildings).filter(k => newBuildings[k] > 0);
                if (available.length > 0) {
                    const target = available[Math.floor(Math.random() * available.length)];
                    newBuildings = { ...newBuildings, [target]: newBuildings[target] - 1 };
                }
            }
        }
        
        if (prod === 0 && tdAccumulation === 0 && tdReduction === 0) return { ...prev, lastSaved: currentTime, technicalDebt: newTD, buildingsOwned: newBuildings };
        
        return {
          ...prev,
          loc: prev.loc + prod * dt,
          totalLoc: prev.totalLoc + prod * dt,
          lifetimeLoc: (prev.lifetimeLoc || prev.totalLoc) + prod * dt,
          lastSaved: currentTime,
          technicalDebt: newTD,
          buildingsOwned: newBuildings
        };
      });
    }, 100);
    
    return () => clearInterval(interval);
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
    const acGained = calculateAcquisitionCapital(gameState);
    if (acGained <= 0) return;
    
    setGameState(prev => {
      const angelLvl = prev.prestigeUpgradesOwned?.['angel_investor'] || 0;
      const startLoc = angelLvl * 50000;
      return {
        ...DEFAULT_STATE,
        loc: startLoc,
        lifetimeLoc: prev.lifetimeLoc || prev.totalLoc, // keep lifetime
        ac: (prev.ac || 0) + acGained,
        prestigeCount: (prev.prestigeCount || 0) + 1,
        prestigeUpgradesOwned: prev.prestigeUpgradesOwned || {}
      };
    });
    setActiveTab('team');
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
    localStorage.removeItem('codeTycoonEncryptedSave');
    localStorage.removeItem('codeTycoonSave');
    setGameState(DEFAULT_STATE);
    setShowResetConfirm(false);
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
        setGameState({ ...DEFAULT_STATE, ...parsed });
        setShowOptions(false);
      } else {
        alert("Invalid save file!");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
  
  const canAffordAnyUpgrade = availableUpgrades.some(u => {
    const owned = gameState.upgradesOwned[u.id] || 0;
    const max = typeof u.maxLevel === 'function' ? u.maxLevel(gameState) : u.maxLevel;
    if (max !== undefined && owned >= max) return false;
    const { cost, count } = getUpgradeCost(gameState, u.id, buyAmount);
    return gameState.loc >= cost && count > 0;
  });

  const canAffordAnyPrestigeUpgrade = PRESTIGE_UPGRADES.some(u => {
    const owned = gameState.prestigeUpgradesOwned?.[u.id] || 0;
    if (u.maxLevel !== undefined && owned >= u.maxLevel) return false;
    const { cost, count } = getPrestigeUpgradeCost(gameState, u.id, buyAmount);
    return gameState.ac >= cost && count > 0;
  });

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
            Code Tycoon v0.05
          </div>

          <div className="flex items-center gap-3 flex-1 justify-end">
            {nextStage ? (
              <button
                onClick={upgradeStage}
                disabled={gameState.loc < nextStage.cost || (gameState.technicalDebt || 0) >= 200}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
                  gameState.loc >= nextStage.cost && (gameState.technicalDebt || 0) < 200
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] cursor-pointer'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                }`}
              >
                <ArrowUpCircle size={18} />
                <div className="text-left hidden sm:block">
                  <div className="text-xs">Next: {nextStage.name}</div>
                  <div className="text-[10px] font-mono font-normal opacity-80">
                    {(gameState.technicalDebt || 0) >= 200 ? 'BLOCKED BY TD' : formatNumber(nextStage.cost) + ' LOC'}
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
              <div className="text-zinc-400 text-[10px] uppercase tracking-wider mb-1">Total LOC Written</div>
              <div className="text-xl font-mono text-zinc-500">{formatNumber(gameState.totalLoc)}</div>
            </div>
          </div>

          <div className="bg-zinc-950/50 rounded-xl p-4 border border-red-900/30 flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className={`p-2 rounded-lg shrink-0 ${
                (gameState.technicalDebt || 0) >= 50 ? 'bg-red-950/50 text-red-500' :
                (gameState.technicalDebt || 0) >= 10 ? 'bg-amber-950/50 text-amber-500' :
                'bg-zinc-900/50 text-zinc-500'
              }`}>
                <AlertTriangle size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-zinc-200 text-sm md:text-base">Technical Debt: <span className="font-mono">{formatNumber(gameState.technicalDebt || 0)}</span></h3>
                <p className={`text-xs md:text-sm ${
                  (gameState.technicalDebt || 0) >= 200 ? 'text-red-400 font-bold' :
                  (gameState.technicalDebt || 0) >= 50 ? 'text-red-400' :
                  (gameState.technicalDebt || 0) >= 10 ? 'text-amber-400' :
                  'text-zinc-500'
                }`}>
                  {(gameState.technicalDebt || 0) >= 200 ? 'Severe: -60% Prod, HQ progression blocked!' :
                   (gameState.technicalDebt || 0) >= 100 ? 'High: -40% Prod, frequent outages.' :
                   (gameState.technicalDebt || 0) >= 50 ? 'Medium: -20% Prod, occasional outages.' :
                   (gameState.technicalDebt || 0) >= 25 ? 'Low: -10% Prod.' :
                   (gameState.technicalDebt || 0) >= 10 ? 'Minor: -5% Prod.' :
                   'Healthy: No penalties.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                const cost = getRefactorCost(gameState.technicalDebt || 0);
                if (gameState.loc >= cost) {
                  setGameState(prev => ({
                    ...prev,
                    loc: prev.loc - cost,
                    technicalDebt: Math.max(0, (prev.technicalDebt || 0) - 10)
                  }));
                }
              }}
              disabled={gameState.loc < getRefactorCost(gameState.technicalDebt || 0) || Math.floor(gameState.technicalDebt || 0) <= 0}
              className={`w-full sm:w-auto px-4 py-2 rounded-lg font-bold transition-all shrink-0 ${
                gameState.loc >= getRefactorCost(gameState.technicalDebt || 0) && Math.floor(gameState.technicalDebt || 0) > 0
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-sm cursor-pointer'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
              }`}
            >
              Refactor (-10 TD)
              <div className="text-[10px] font-mono font-normal">Cost: {formatNumber(getRefactorCost(gameState.technicalDebt || 0))} LOC</div>
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
                  const actualProd = building.baseProduction * bMult * globalMult;
                  
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
                        <div className="text-[11px] font-mono text-emerald-500/70">
                          +{formatNumber(actualProd)} <span className="opacity-75">LOC/s</span>
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

              {/* REGULAR UPGRADES */}
              <div className="mb-6">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Repeatable Upgrades</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {availableUpgrades.filter(u => {
                    const level = gameState.upgradesOwned[u.id] || 0;
                    const max = typeof u.maxLevel === 'function' ? u.maxLevel(gameState) : u.maxLevel;
                    return u.maxLevel !== 1 && (max === undefined || level < max);
                  }).map(upgrade => {
                    const level = gameState.upgradesOwned[upgrade.id] || 0;
                    const max = typeof upgrade.maxLevel === 'function' ? upgrade.maxLevel(gameState) : upgrade.maxLevel;
                    const isMaxed = max !== undefined && level >= max;
                    const { cost, count } = getUpgradeCost(gameState, upgrade.id, buyAmount);
                    const canAfford = gameState.loc >= cost;
                    const Icon = upgrade.icon;
                    const name = typeof upgrade.name === 'function' ? upgrade.name(level) : upgrade.name;
                    const desc = typeof upgrade.description === 'function' ? upgrade.description(level) : upgrade.description;
                    
                    return (
                      <button
                        key={upgrade.id}
                        onClick={() => buyUpgrade(upgrade.id)}
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
                                  Lvl {level}{max !== undefined ? ` / ${max}` : ''}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-zinc-400 leading-tight">{desc}</p>
                          </div>
                          <div className="text-right shrink-0 self-center">
                            {!isMaxed ? (
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
                  {availableUpgrades.filter(u => {
                    const level = gameState.upgradesOwned[u.id] || 0;
                    const max = typeof u.maxLevel === 'function' ? u.maxLevel(gameState) : u.maxLevel;
                    return u.maxLevel !== 1 && (max === undefined || level < max);
                  }).length === 0 && (
                    <div className="col-span-full p-4 text-center text-zinc-500 border border-zinc-800/50 rounded-xl border-dashed text-sm">
                      Upgrade your HQ to unlock technologies.
                    </div>
                  )}
                </div>
              </div>

              {/* ONE-TIME UPGRADES */}
              <div className="mb-6">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">One-Time Tech Upgrades</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {availableUpgrades.filter(u => {
                    const level = gameState.upgradesOwned[u.id] || 0;
                    return u.maxLevel === 1 && level < 1;
                  }).map(upgrade => {
                    const level = gameState.upgradesOwned[upgrade.id] || 0;
                    const isMaxed = level >= 1;
                    const { cost } = getUpgradeCost(gameState, upgrade.id, 1);
                    const canAfford = gameState.loc >= cost;
                    const Icon = upgrade.icon;
                    const name = typeof upgrade.name === 'function' ? upgrade.name(level) : upgrade.name;
                    const desc = typeof upgrade.description === 'function' ? upgrade.description(level) : upgrade.description;
                    
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
                  {availableUpgrades.filter(u => {
                    const level = gameState.upgradesOwned[u.id] || 0;
                    return u.maxLevel === 1 && level < 1;
                  }).length === 0 && (
                    <div className="col-span-full p-4 text-center text-zinc-500 border border-zinc-800/50 rounded-xl border-dashed text-sm">
                      Upgrade your HQ to unlock technologies.
                    </div>
                  )}
                </div>
              </div>

              {/* EXHAUSTED UPGRADES */}
              {availableUpgrades.filter(u => {
                const level = gameState.upgradesOwned[u.id] || 0;
                const max = typeof u.maxLevel === 'function' ? u.maxLevel(gameState) : u.maxLevel;
                return max !== undefined && level >= max;
              }).length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Exhausted Technologies</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 opacity-60">
                    {availableUpgrades.filter(u => {
                      const level = gameState.upgradesOwned[u.id] || 0;
                      const max = typeof u.maxLevel === 'function' ? u.maxLevel(gameState) : u.maxLevel;
                      return max !== undefined && level >= max;
                    }).map(upgrade => {
                      const level = gameState.upgradesOwned[upgrade.id] || 0;
                      const max = typeof upgrade.maxLevel === 'function' ? upgrade.maxLevel(gameState) : upgrade.maxLevel;
                      const Icon = upgrade.icon;
                      const name = typeof upgrade.name === 'function' ? upgrade.name(level) : upgrade.name;
                      const desc = typeof upgrade.description === 'function' ? upgrade.description(level) : upgrade.description;
                      
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
                              <p className="text-[11px] text-zinc-400 leading-tight">{desc}</p>
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
                    <p className="text-zinc-500 text-xs">Selling resets your LOC, Buildings, Upgrades, and HQ Stage.</p>
                  </div>
                  
                  <div className="flex flex-col items-center min-w-[200px]">
                    <div className="text-3xl font-bold text-emerald-400 mb-1">
                      +{formatNumber(calculateAcquisitionCapital(gameState))} AC
                    </div>
                    <div className="text-zinc-500 text-xs uppercase tracking-wider mb-4">Payout</div>
                    <button
                      onClick={handlePrestige}
                      disabled={calculateAcquisitionCapital(gameState) <= 0}
                      className={`px-8 py-3 rounded-xl font-bold transition-all w-full ${
                        calculateAcquisitionCapital(gameState) > 0
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] cursor-pointer'
                          : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                      }`}
                    >
                      Accept Acquisition
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
                    const name = typeof upgrade.name === 'function' ? upgrade.name(level) : upgrade.name;
                    const desc = typeof upgrade.description === 'function' ? upgrade.description(level) : upgrade.description;
                    
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
                            <p className="text-[11px] text-zinc-400 leading-tight">{desc}</p>
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
                      const name = typeof upgrade.name === 'function' ? upgrade.name(level) : upgrade.name;
                      const desc = typeof upgrade.description === 'function' ? upgrade.description(level) : upgrade.description;
                      
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
                              <p className="text-[11px] text-zinc-400 leading-tight">{desc}</p>
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
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-zinc-800">
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <Settings size={20} /> Settings & Stats
              </h2>
              <button onClick={() => { setShowOptions(false); setShowResetConfirm(false); }} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              
              <div className="space-y-3">
                <h3 className="text-sm uppercase tracking-wider text-zinc-500 font-semibold">Statistics</h3>
                <div className="bg-zinc-950/50 rounded-xl p-4 border border-zinc-800/30 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Total LOC Written (All Time)</span>
                    <span className="font-mono text-zinc-200">{formatNumber(gameState.lifetimeLoc || gameState.totalLoc)}</span>
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

      {/* OFFLINE PROGRESS MODAL */}
      {offlineReport && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-emerald-900/50 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden shadow-emerald-900/20">
            <div className="flex justify-between items-center p-4 border-b border-zinc-800 bg-zinc-800/50">
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <Coffee size={20} className="text-emerald-500" /> Welcome Back
              </h2>
              <button onClick={() => setOfflineReport(null)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
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
