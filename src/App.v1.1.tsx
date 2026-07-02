import React, { useState, useEffect, useCallback } from 'react';
import { 
  Terminal, Users, Zap, Coffee, Keyboard, Cpu, Trophy, 
  Home, Building, Building2, Landmark, GitBranch, 
  Monitor, Server, Cloud, Rocket, Save, Trash2, ArrowUpCircle
} from 'lucide-react';

// --- DATA STRUCTURES ---

interface Stage {
  id: number;
  name: string;
  cost: number;
  icon: React.ElementType;
  description: string;
}

interface Building {
  id: string;
  name: string;
  baseCost: number;
  baseProduction: number;
  description: string;
  icon: React.ElementType;
  reqStage: number;
}

interface Upgrade {
  id: string;
  name: string;
  cost: number;
  description: string;
  icon: React.ElementType;
  reqStage: number;
}

interface GameState {
  loc: number;
  totalLoc: number;
  buildingsOwned: Record<string, number>;
  upgradesOwned: Record<string, boolean>;
  stage: number;
}

const STAGES: Stage[] = [
  { id: 0, name: "Mom's Garage", cost: 0, icon: Home, description: "Where every great tech company begins." },
  { id: 1, name: "Co-working Space", cost: 5000, icon: Building, description: "Free kombucha and networking events." },
  { id: 2, name: "Startup Office", cost: 50000, icon: Building2, description: "You have your own meeting rooms now." },
  { id: 3, name: "Corporate Campus", cost: 500000, icon: Landmark, description: "Stock options and endless bureaucracy." },
];

const BUILDINGS: Building[] = [
  { id: 'buddy', name: 'College Buddy', baseCost: 15, baseProduction: 1, description: 'Works for pizza. Writes spaghetti code.', icon: Users, reqStage: 0 },
  { id: 'freelancer', name: 'Fiverr Freelancer', baseCost: 100, baseProduction: 5, description: 'Hit or miss, but gets it done.', icon: Monitor, reqStage: 0 },
  { id: 'junior', name: 'Junior Developer', baseCost: 500, baseProduction: 20, description: 'Googles everything. Very enthusiastic.', icon: Terminal, reqStage: 1 },
  { id: 'scrum', name: 'Scrum Master', baseCost: 3000, baseProduction: 100, description: 'Increases velocity by scheduling meetings.', icon: Coffee, reqStage: 1 },
  { id: 'senior', name: 'Senior Developer', baseCost: 15000, baseProduction: 400, description: 'Complains about the codebase they wrote.', icon: Trophy, reqStage: 2 },
  { id: 'architect', name: 'Software Architect', baseCost: 80000, baseProduction: 2000, description: 'Draws boxes and arrows on whiteboards.', icon: Server, reqStage: 2 },
  { id: 'ai', name: 'AI Code Generator', baseCost: 500000, baseProduction: 10000, description: 'Replaces everyone. Probably.', icon: Cpu, reqStage: 3 },
];

const UPGRADES: Upgrade[] = [
  { id: 'mech_keyboard', name: 'Mechanical Keyboard', cost: 50, description: 'Clicking is 2x as effective.', icon: Keyboard, reqStage: 0 },
  { id: 'energy_drink', name: 'Energy Drink', cost: 500, description: 'Clicking is 5x as effective.', icon: Zap, reqStage: 0 },
  { id: 'git', name: 'Version Control (Git)', cost: 1000, description: 'Global production x1.5. No more code_v2_final.zip.', icon: GitBranch, reqStage: 0 },
  { id: 'standing_desk', name: 'Standing Desks', cost: 2500, description: 'Buddy & Freelancer production x2.', icon: Monitor, reqStage: 1 },
  { id: 'ci_cd', name: 'CI/CD Pipeline', cost: 10000, description: 'Global production x2. Automated deployments!', icon: Rocket, reqStage: 1 },
  { id: 'gaming_chair', name: 'Gaming Chairs', cost: 25000, description: 'Junior & Senior production x2.', icon: Trophy, reqStage: 2 },
  { id: 'fabric', name: 'Move to Fabric', cost: 100000, description: 'Global production x3. The modern data stack.', icon: Cloud, reqStage: 2 },
  { id: 'microservices', name: 'Microservices', cost: 250000, description: 'Architect & Senior production x2. More repos!', icon: Server, reqStage: 3 },
];

const DEFAULT_STATE: GameState = {
  loc: 0,
  totalLoc: 0,
  buildingsOwned: {},
  upgradesOwned: {},
  stage: 0,
};

// --- HELPER FUNCTIONS ---

const getGlobalMultiplier = (state: GameState) => {
  let mult = 1;
  if (state.upgradesOwned['git']) mult *= 1.5;
  if (state.upgradesOwned['ci_cd']) mult *= 2;
  if (state.upgradesOwned['fabric']) mult *= 3;
  return mult;
};

const getBuildingMultiplier = (state: GameState, buildingId: string) => {
  let mult = 1;
  if (buildingId === 'buddy' || buildingId === 'freelancer') {
    if (state.upgradesOwned['standing_desk']) mult *= 2;
  }
  if (buildingId === 'junior' || buildingId === 'senior') {
    if (state.upgradesOwned['gaming_chair']) mult *= 2;
  }
  if (buildingId === 'architect' || buildingId === 'senior') {
    if (state.upgradesOwned['microservices']) mult *= 2;
  }
  return mult;
};

const calculateProduction = (state: GameState) => {
  const globalMult = getGlobalMultiplier(state);
  return BUILDINGS.reduce((total, b) => {
    const count = state.buildingsOwned[b.id] || 0;
    const bMult = getBuildingMultiplier(state, b.id);
    return total + (b.baseProduction * count * bMult * globalMult);
  }, 0);
};

const calculateClickPower = (state: GameState) => {
  let power = 1;
  if (state.upgradesOwned['mech_keyboard']) power *= 2;
  if (state.upgradesOwned['energy_drink']) power *= 5;
  
  const globalMult = getGlobalMultiplier(state);
  return power * globalMult;
};

const getBuildingCost = (state: GameState, buildingId: string) => {
  const building = BUILDINGS.find(b => b.id === buildingId)!;
  const owned = state.buildingsOwned[buildingId] || 0;
  return Math.floor(building.baseCost * Math.pow(1.15, owned));
};

// --- MAIN COMPONENT ---

export default function App() {
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem('codeTycoonSave');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge with default state to ensure new properties exist
        return { ...DEFAULT_STATE, ...parsed };
      } catch (e) {
        console.error("Failed to load save", e);
      }
    }
    return DEFAULT_STATE;
  });

  // Auto-save every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      localStorage.setItem('codeTycoonSave', JSON.stringify(gameState));
    }, 5000);
    return () => clearInterval(interval);
  }, [gameState]);

  // Game loop (Delta time based for smooth background progression)
  useEffect(() => {
    let lastTime = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const dt = (now - lastTime) / 1000; // seconds passed
      lastTime = now;
      
      setGameState(prev => {
        const prod = calculateProduction(prev);
        if (prod === 0) return prev;
        return {
          ...prev,
          loc: prev.loc + prod * dt,
          totalLoc: prev.totalLoc + prod * dt
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
        totalLoc: prev.totalLoc + power
      };
    });
  }, []);

  const buyBuilding = (buildingId: string) => {
    setGameState(prev => {
      const cost = getBuildingCost(prev, buildingId);
      if (prev.loc >= cost) {
        return {
          ...prev,
          loc: prev.loc - cost,
          buildingsOwned: {
            ...prev.buildingsOwned,
            [buildingId]: (prev.buildingsOwned[buildingId] || 0) + 1
          }
        };
      }
      return prev;
    });
  };

  const buyUpgrade = (upgradeId: string) => {
    setGameState(prev => {
      const upgrade = UPGRADES.find(u => u.id === upgradeId)!;
      if (prev.loc >= upgrade.cost && !prev.upgradesOwned[upgradeId]) {
        return {
          ...prev,
          loc: prev.loc - upgrade.cost,
          upgradesOwned: {
            ...prev.upgradesOwned,
            [upgradeId]: true
          }
        };
      }
      return prev;
    });
  };

  const upgradeStage = () => {
    setGameState(prev => {
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

  const wipeSave = () => {
    if (window.confirm("Are you sure you want to wipe your save? This cannot be undone!")) {
      localStorage.removeItem('codeTycoonSave');
      setGameState(DEFAULT_STATE);
    }
  };

  const manualSave = () => {
    localStorage.setItem('codeTycoonSave', JSON.stringify(gameState));
    alert("Game saved!");
  };

  const formatNumber = (num: number) => {
    return Math.floor(num).toLocaleString();
  };

  const currentStage = STAGES[gameState.stage];
  const nextStage = STAGES[gameState.stage + 1];
  const StageIcon = currentStage.icon;
  
  const currentProd = calculateProduction(gameState);
  const currentClick = calculateClickPower(gameState);

  const availableBuildings = BUILDINGS.filter(b => b.reqStage <= gameState.stage);
  const availableUpgrades = UPGRADES.filter(u => u.reqStage <= gameState.stage);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/30 pb-20">
      
      {/* Top Navigation / Stage Banner */}
      <div className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-10 shadow-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-900/30 text-emerald-400 rounded-xl border border-emerald-800/50">
              <StageIcon size={28} />
            </div>
            <div>
              <h2 className="text-sm text-zinc-400 uppercase tracking-widest font-semibold">Current HQ</h2>
              <div className="text-xl font-bold text-zinc-100">{currentStage.name}</div>
            </div>
          </div>

          {nextStage && (
            <button
              onClick={upgradeStage}
              disabled={gameState.loc < nextStage.cost}
              className={`flex items-center gap-3 px-6 py-3 rounded-xl font-bold transition-all ${
                gameState.loc >= nextStage.cost
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] cursor-pointer'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
              }`}
            >
              <ArrowUpCircle size={20} />
              <div>
                <div className="text-sm">Move to {nextStage.name}</div>
                <div className="text-xs font-mono font-normal opacity-80">Cost: {formatNumber(nextStage.cost)} LOC</div>
              </div>
            </button>
          )}
          {!nextStage && (
            <div className="px-6 py-3 bg-amber-900/20 text-amber-400 border border-amber-900/50 rounded-xl flex items-center gap-2 font-semibold">
              <Trophy size={18} /> Max HQ Level Reached
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4">
        
        {/* Left Column: Main Action & Stats */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-8 text-center shadow-xl backdrop-blur-sm">
            <h1 className="text-2xl font-bold text-zinc-100 mb-2 tracking-tight">Code Tycoon</h1>
            <p className="text-zinc-400 text-sm mb-8">{currentStage.description}</p>
            
            <div className="mb-8">
              <div className="text-5xl font-mono font-bold text-emerald-400 mb-2 tracking-tighter">
                {formatNumber(gameState.loc)}
              </div>
              <div className="text-zinc-500 text-sm uppercase tracking-widest font-semibold">Lines of Code</div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-zinc-950/50 rounded-xl p-4 border border-zinc-800/30">
                <div className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Per Second</div>
                <div className="text-xl font-mono text-zinc-200">{formatNumber(currentProd)}</div>
              </div>
              <div className="bg-zinc-950/50 rounded-xl p-4 border border-zinc-800/30">
                <div className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Per Click</div>
                <div className="text-xl font-mono text-zinc-200">{formatNumber(currentClick)}</div>
              </div>
            </div>

            <button
              onClick={handleWriteCode}
              className="w-full py-6 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl font-bold text-xl transition-all active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] flex items-center justify-center gap-3"
            >
              <Terminal size={24} />
              Write Code
            </button>
          </div>
          
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4 text-zinc-200 flex items-center gap-2">
              <Trophy size={18} className="text-amber-400" />
              Statistics
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">Total LOC Written</span>
                <span className="font-mono text-zinc-200">{formatNumber(gameState.totalLoc)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Total Buildings</span>
                <span className="font-mono text-zinc-200">
                  {Object.values(gameState.buildingsOwned).reduce((a: number, b: number) => a + b, 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Upgrades Unlocked</span>
                <span className="font-mono text-zinc-200">
                  {Object.keys(gameState.upgradesOwned).length} / {UPGRADES.length}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button onClick={manualSave} className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
              <Save size={16} /> Save Game
            </button>
            <button onClick={wipeSave} className="flex-1 py-3 bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
              <Trash2 size={16} /> Wipe Save
            </button>
          </div>
        </div>

        {/* Right Column: Upgrades & Buildings */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Upgrades Section */}
          <section>
            <h2 className="text-xl font-bold mb-4 text-zinc-100 flex items-center gap-2">
              <Zap size={20} className="text-yellow-400" />
              Available Upgrades
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableUpgrades.map(upgrade => {
                const isOwned = gameState.upgradesOwned[upgrade.id];
                const canAfford = gameState.loc >= upgrade.cost;
                const Icon = upgrade.icon;
                
                return (
                  <button
                    key={upgrade.id}
                    onClick={() => buyUpgrade(upgrade.id)}
                    disabled={isOwned || !canAfford}
                    className={`relative p-4 rounded-xl border text-left transition-all ${
                      isOwned 
                        ? 'bg-emerald-950/20 border-emerald-900/30 opacity-50 cursor-not-allowed' 
                        : canAfford
                          ? 'bg-zinc-900/80 border-zinc-700 hover:border-emerald-500/50 hover:bg-zinc-800 cursor-pointer shadow-sm'
                          : 'bg-zinc-950/50 border-zinc-800/50 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className={`p-2 rounded-lg ${isOwned ? 'bg-emerald-900/50 text-emerald-400' : 'bg-zinc-800 text-zinc-300'}`}>
                        <Icon size={18} />
                      </div>
                      {!isOwned && (
                        <span className={`font-mono text-sm ${canAfford ? 'text-emerald-400' : 'text-red-400'}`}>
                          {formatNumber(upgrade.cost)}
                        </span>
                      )}
                      {isOwned && (
                        <span className="text-xs uppercase tracking-wider text-emerald-500 font-semibold">Owned</span>
                      )}
                    </div>
                    <h3 className="font-semibold text-zinc-200 mb-1">{upgrade.name}</h3>
                    <p className="text-xs text-zinc-500">{upgrade.description}</p>
                  </button>
                );
              })}
              {availableUpgrades.length === 0 && (
                <div className="col-span-full p-6 text-center text-zinc-500 border border-zinc-800/50 rounded-xl border-dashed">
                  Upgrade your HQ to unlock more technologies.
                </div>
              )}
            </div>
          </section>

          {/* Buildings Section */}
          <section>
            <h2 className="text-xl font-bold mb-4 text-zinc-100 flex items-center gap-2">
              <Users size={20} className="text-blue-400" />
              Hire Team
            </h2>
            <div className="space-y-3">
              {availableBuildings.map(building => {
                const cost = getBuildingCost(gameState, building.id);
                const canAfford = gameState.loc >= cost;
                const owned = gameState.buildingsOwned[building.id] || 0;
                const Icon = building.icon;
                
                // Calculate individual production to show to user
                const bMult = getBuildingMultiplier(gameState, building.id);
                const globalMult = getGlobalMultiplier(gameState);
                const actualProd = building.baseProduction * bMult * globalMult;
                
                return (
                  <button
                    key={building.id}
                    onClick={() => buyBuilding(building.id)}
                    disabled={!canAfford}
                    className={`w-full flex items-center p-4 rounded-xl border transition-all ${
                      canAfford
                        ? 'bg-zinc-900/80 border-zinc-700 hover:border-emerald-500/50 hover:bg-zinc-800 cursor-pointer shadow-sm'
                        : 'bg-zinc-950/50 border-zinc-800/50 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-300 mr-4">
                      <Icon size={24} />
                    </div>
                    
                    <div className="flex-grow text-left">
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="font-semibold text-zinc-200 text-lg">{building.name}</h3>
                        <span className="text-2xl font-mono font-bold text-zinc-600">{owned}</span>
                      </div>
                      <p className="text-sm text-zinc-400 mb-2">{building.description}</p>
                      <div className="flex items-center gap-4 text-xs font-mono">
                        <span className="text-zinc-500">
                          +{formatNumber(actualProd)} LOC/s
                        </span>
                        <span className={canAfford ? 'text-emerald-400' : 'text-red-400'}>
                          Cost: {formatNumber(cost)}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
