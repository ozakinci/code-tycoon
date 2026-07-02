import React, { useState, useEffect, useCallback } from 'react';
import { Terminal, Users, Zap, Coffee, Keyboard, Cpu, Trophy } from 'lucide-react';

type BuildingId = 'intern' | 'junior' | 'senior' | 'ai';
type UpgradeId = 'mechanical_keyboard' | 'coffee' | 'energy_drink';

interface Building {
  id: BuildingId;
  name: string;
  baseCost: number;
  baseProduction: number;
  description: string;
  icon: React.ElementType;
}

interface Upgrade {
  id: UpgradeId;
  name: string;
  cost: number;
  clickMultiplier: number;
  description: string;
  icon: React.ElementType;
}

const BUILDINGS: Building[] = [
  { id: 'intern', name: 'Intern', baseCost: 15, baseProduction: 1, description: 'Writes some code, mostly copies from StackOverflow.', icon: Users },
  { id: 'junior', name: 'Junior Developer', baseCost: 100, baseProduction: 5, description: 'Actually writes code, but needs supervision.', icon: Terminal },
  { id: 'senior', name: 'Senior Developer', baseCost: 1100, baseProduction: 25, description: 'Writes good code, complains about architecture.', icon: Trophy },
  { id: 'ai', name: 'AI Assistant', baseCost: 12000, baseProduction: 100, description: 'Generates code instantly, sometimes hallucinating.', icon: Cpu },
];

const UPGRADES: Upgrade[] = [
  { id: 'mechanical_keyboard', name: 'Mechanical Keyboard', cost: 50, clickMultiplier: 2, description: 'Clicking is twice as effective.', icon: Keyboard },
  { id: 'coffee', name: 'Coffee', cost: 500, clickMultiplier: 5, description: 'Clicking is 5x as effective.', icon: Coffee },
  { id: 'energy_drink', name: 'Energy Drink', cost: 5000, clickMultiplier: 10, description: 'Clicking is 10x as effective.', icon: Zap },
];

export default function App() {
  const [loc, setLoc] = useState<number>(0);
  const [totalLoc, setTotalLoc] = useState<number>(0);
  
  const [buildingsOwned, setBuildingsOwned] = useState<Record<BuildingId, number>>({
    intern: 0,
    junior: 0,
    senior: 0,
    ai: 0,
  });
  
  const [upgradesOwned, setUpgradesOwned] = useState<Record<UpgradeId, boolean>>({
    mechanical_keyboard: false,
    coffee: false,
    energy_drink: false,
  });

  // Calculate stats
  const locPerSecond = BUILDINGS.reduce((total, b) => total + b.baseProduction * buildingsOwned[b.id], 0);
  
  let locPerClick = 1;
  if (upgradesOwned.mechanical_keyboard) locPerClick *= 2;
  if (upgradesOwned.coffee) locPerClick *= 5;
  if (upgradesOwned.energy_drink) locPerClick *= 10;

  // Game loop
  useEffect(() => {
    if (locPerSecond === 0) return;
    
    const interval = setInterval(() => {
      const amount = locPerSecond / 10;
      setLoc(prev => prev + amount);
      setTotalLoc(prev => prev + amount);
    }, 100);
    
    return () => clearInterval(interval);
  }, [locPerSecond]);

  const handleWriteCode = useCallback(() => {
    setLoc(prev => prev + locPerClick);
    setTotalLoc(prev => prev + locPerClick);
  }, [locPerClick]);

  const getBuildingCost = (buildingId: BuildingId) => {
    const building = BUILDINGS.find(b => b.id === buildingId)!;
    const owned = buildingsOwned[buildingId];
    return Math.floor(building.baseCost * Math.pow(1.15, owned));
  };

  const buyBuilding = (buildingId: BuildingId) => {
    const cost = getBuildingCost(buildingId);
    if (loc >= cost) {
      setLoc(prev => prev - cost);
      setBuildingsOwned(prev => ({
        ...prev,
        [buildingId]: prev[buildingId] + 1
      }));
    }
  };

  const buyUpgrade = (upgradeId: UpgradeId) => {
    const upgrade = UPGRADES.find(u => u.id === upgradeId)!;
    if (loc >= upgrade.cost && !upgradesOwned[upgradeId]) {
      setLoc(prev => prev - upgrade.cost);
      setUpgradesOwned(prev => ({
        ...prev,
        [upgradeId]: true
      }));
    }
  };

  const formatNumber = (num: number) => {
    return Math.floor(num).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/30">
      <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Main Action & Stats */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-8 text-center shadow-xl backdrop-blur-sm">
            <h1 className="text-2xl font-bold text-zinc-100 mb-2 tracking-tight">Code Tycoon</h1>
            <p className="text-zinc-400 text-sm mb-8">Build your software empire</p>
            
            <div className="mb-8">
              <div className="text-5xl font-mono font-bold text-emerald-400 mb-2 tracking-tighter">
                {formatNumber(loc)}
              </div>
              <div className="text-zinc-500 text-sm uppercase tracking-widest font-semibold">Lines of Code</div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-zinc-950/50 rounded-xl p-4 border border-zinc-800/30">
                <div className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Per Second</div>
                <div className="text-xl font-mono text-zinc-200">{formatNumber(locPerSecond)}</div>
              </div>
              <div className="bg-zinc-950/50 rounded-xl p-4 border border-zinc-800/30">
                <div className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Per Click</div>
                <div className="text-xl font-mono text-zinc-200">{formatNumber(locPerClick)}</div>
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
                <span className="font-mono text-zinc-200">{formatNumber(totalLoc)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Total Buildings</span>
                <span className="font-mono text-zinc-200">
                  {Object.values(buildingsOwned).reduce((a: number, b: number) => a + b, 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Upgrades & Buildings */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Upgrades Section */}
          <section>
            <h2 className="text-xl font-bold mb-4 text-zinc-100 flex items-center gap-2">
              <Zap size={20} className="text-yellow-400" />
              Upgrades
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {UPGRADES.map(upgrade => {
                const isOwned = upgradesOwned[upgrade.id];
                const canAfford = loc >= upgrade.cost;
                const Icon = upgrade.icon;
                
                return (
                  <button
                    key={upgrade.id}
                    onClick={() => buyUpgrade(upgrade.id)}
                    disabled={isOwned || !canAfford}
                    className={`relative p-4 rounded-xl border text-left transition-all ${
                      isOwned 
                        ? 'bg-emerald-950/30 border-emerald-900/50 opacity-50 cursor-not-allowed' 
                        : canAfford
                          ? 'bg-zinc-900/80 border-zinc-700 hover:border-emerald-500/50 hover:bg-zinc-800 cursor-pointer'
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
            </div>
          </section>

          {/* Buildings Section */}
          <section>
            <h2 className="text-xl font-bold mb-4 text-zinc-100 flex items-center gap-2">
              <Users size={20} className="text-blue-400" />
              Hire Team
            </h2>
            <div className="space-y-3">
              {BUILDINGS.map(building => {
                const cost = getBuildingCost(building.id);
                const canAfford = loc >= cost;
                const owned = buildingsOwned[building.id];
                const Icon = building.icon;
                
                return (
                  <button
                    key={building.id}
                    onClick={() => buyBuilding(building.id)}
                    disabled={!canAfford}
                    className={`w-full flex items-center p-4 rounded-xl border transition-all ${
                      canAfford
                        ? 'bg-zinc-900/80 border-zinc-700 hover:border-emerald-500/50 hover:bg-zinc-800 cursor-pointer'
                        : 'bg-zinc-950/50 border-zinc-800/50 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-300 mr-4">
                      <Icon size={24} />
                    </div>
                    
                    <div className="flex-grow text-left">
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="font-semibold text-zinc-200 text-lg">{building.name}</h3>
                        <span className="text-2xl font-mono font-bold text-zinc-700">{owned}</span>
                      </div>
                      <p className="text-sm text-zinc-400 mb-2">{building.description}</p>
                      <div className="flex items-center gap-4 text-xs font-mono">
                        <span className="text-zinc-500">
                          +{building.baseProduction} LOC/s
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
