import React, { useEffect } from 'react';
import { CatTier } from '../types';
import { CAT_CONFIGS } from '../game/constants';
import { Shield, Crosshair, X, Coins, Swords, Sparkles, Skull, Heart, Wand2, Pickaxe } from 'lucide-react';

interface CatShopProps {
  gold: number;
  placingTier: CatTier | null;
  isClearMode: boolean;
  clearCost: number;
  clearedCount: number;
  onSelectTier: (tier: CatTier) => void;
  onCancelPlacement: () => void;
  onToggleClearMode: () => void;
}

export const CatShop: React.FC<CatShopProps> = ({
  gold,
  placingTier,
  isClearMode,
  clearCost,
  clearedCount,
  onSelectTier,
  onCancelPlacement,
  onToggleClearMode,
}) => {
  // Keyboard shortcuts [1] to [7], [C] for Clear Terrain, and [Escape]
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tier = parseInt(e.key, 10) as CatTier;
      if (tier >= 1 && tier <= 7) {
        if (gold >= CAT_CONFIGS[tier].cost) onSelectTier(tier);
      } else if (e.key === 'c' || e.key === 'C') {
        onToggleClearMode();
      } else if (e.key === 'Escape') {
        if (isClearMode) {
          onToggleClearMode();
        } else {
          onCancelPlacement();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gold, isClearMode, onSelectTier, onCancelPlacement, onToggleClearMode]);

  const catTiers: CatTier[] = [1, 2, 3, 4, 5, 6, 7];

  const getClassIcon = (tier: CatTier) => {
    switch (tier) {
      case 1:
        return <Swords className="w-3.5 h-3.5 text-orange-400" />;
      case 2:
        return <Shield className="w-3.5 h-3.5 text-blue-400" />;
      case 3:
        return <Crosshair className="w-3.5 h-3.5 text-emerald-400" />;
      case 4:
        return <Sparkles className="w-3.5 h-3.5 text-purple-400" />;
      case 5:
        return <Skull className="w-3.5 h-3.5 text-rose-400" />;
      case 6:
        return <Heart className="w-3.5 h-3.5 text-emerald-400" />;
      case 7:
        return <Wand2 className="w-3.5 h-3.5 text-indigo-400" />;
    }
  };

  return (
    <div className="w-full bg-slate-900/95 border-t border-slate-800 p-2.5 select-none shadow-xl">
      <div className="max-w-7xl mx-auto flex flex-col gap-2">
        {/* Top bar: Placement status, Clear Terrain tool & instructions */}
        <div className="flex items-center justify-between gap-2 px-1">
          {placingTier ? (
            <div className="flex items-center gap-2 bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 px-3 py-1 rounded-lg text-xs font-semibold animate-pulse">
              <span>
                Placing: <strong className="text-white">{CAT_CONFIGS[placingTier].name}</strong> (
                {CAT_CONFIGS[placingTier].placementType === 'on-path' ? 'Must click on enemy path' : 'Must click outside path'}
                )
              </span>
              <button
                id="cancel-placement-btn"
                onClick={onCancelPlacement}
                className="ml-1 p-0.5 hover:bg-emerald-800 rounded text-emerald-200"
                title="Cancel placement (Esc)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : isClearMode ? (
            <div className="flex items-center gap-2 bg-amber-950/80 border border-amber-500/50 text-amber-200 px-3 py-1 rounded-lg text-xs font-semibold animate-pulse">
              <Pickaxe className="w-3.5 h-3.5 text-amber-400" />
              <span>
                Clear Terrain Mode: Click any <strong className="text-amber-100">Rock or Tree</strong> to inspect & clear ({clearCost}g)
              </span>
              <button
                id="cancel-clear-mode-btn"
                onClick={onToggleClearMode}
                className="ml-1 p-0.5 hover:bg-amber-800 rounded text-amber-300"
                title="Exit clear terrain mode (Esc)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-400 overflow-x-auto py-0.5">
              <span className="font-semibold text-slate-300 shrink-0">Cat Classes:</span>
              <span className="text-[11px] text-amber-300/90 font-medium whitespace-nowrap">
                Fighters & Tanks block • Rangers, Mages & Assassins strike • Priests heal • Sorcerers buff/debuff
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 shrink-0">
            {/* Clear Terrain Toggle Button */}
            <button
              id="toggle-clear-terrain-btn"
              onClick={onToggleClearMode}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all border shadow-sm ${
                isClearMode
                  ? 'bg-amber-500 text-slate-950 border-amber-300 ring-2 ring-amber-400/50 shadow-amber-500/20'
                  : 'bg-slate-800 hover:bg-slate-750 text-amber-300 hover:text-amber-200 border-amber-500/40 hover:border-amber-400/60'
              }`}
              title={`Toggle Clear Terrain Mode (Hotkey: C). Cleared: ${clearedCount}`}
            >
              <Pickaxe className={`w-3.5 h-3.5 ${isClearMode ? 'text-slate-950' : 'text-amber-400'}`} />
              <span>Clear Terrain</span>
              <span className={`font-mono px-1 py-0.2 rounded text-[10px] font-bold ${
                isClearMode ? 'bg-amber-600 text-slate-950' : 'bg-slate-950/60 text-amber-300'
              }`}>
                {clearCost}g
              </span>
            </button>

            <div className="text-[11px] text-slate-500 hidden md:block">
              Hotkeys: <kbd className="px-1 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300">1</kbd>-<kbd className="px-1 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300">7</kbd>, <kbd className="px-1 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300">C</kbd>, <kbd className="px-1 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300">Esc</kbd>
            </div>
          </div>
        </div>

        {/* 7 Cat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 w-full">
          {catTiers.map((tier) => {
            const config = CAT_CONFIGS[tier];
            const canAfford = gold >= config.cost;
            const isSelected = placingTier === tier;
            const isOnPath = config.placementType === 'on-path';

            return (
              <button
                key={tier}
                id={`buy-cat-t${tier}-btn`}
                onClick={() => {
                  if (isSelected) onCancelPlacement();
                  else if (canAfford) onSelectTier(tier);
                }}
                disabled={!canAfford && !isSelected}
                className={`group relative flex flex-col p-2 rounded-xl border text-left transition-all duration-150 ${
                  isSelected
                    ? 'bg-slate-800 border-amber-400 ring-2 ring-amber-400/40 shadow-lg scale-[1.02]'
                    : canAfford
                    ? 'bg-slate-800/85 hover:bg-slate-800 border-slate-700 hover:border-slate-600 cursor-pointer shadow-sm hover:scale-[1.01]'
                    : 'bg-slate-900/60 border-slate-800 opacity-50 cursor-not-allowed'
                }`}
              >
                {/* Hotkey Tag */}
                <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 text-[9px] font-mono font-bold bg-slate-700 text-slate-300 rounded border border-slate-600 shadow-sm">
                  [{tier}]
                </span>

                {/* Top Row: Avatar & Name */}
                <div className="flex items-center gap-1.5 mb-1">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center border shadow-inner shrink-0"
                    style={{
                      backgroundColor: config.color,
                      borderColor: config.accentColor,
                    }}
                  >
                    <span className="text-[10px]">🐱</span>
                  </div>
                  <div className="overflow-hidden min-w-0">
                    <div className="text-[11px] font-bold text-slate-100 truncate group-hover:text-white flex items-center gap-1">
                      {config.name}
                    </div>
                    <div className="text-[9px] text-slate-400 flex items-center gap-1">
                      {getClassIcon(tier)}
                      <span className="capitalize">{config.catClass}</span>
                      <span
                        className={`text-[8px] font-semibold px-1 py-0.2 rounded ${
                          isOnPath
                            ? 'bg-amber-950/60 text-amber-300 border border-amber-500/30'
                            : 'bg-indigo-950/60 text-indigo-300 border border-indigo-500/30'
                        }`}
                      >
                        {isOnPath ? 'Path' : 'Off-Path'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Class-Specific Highlights with HP */}
                <div className="text-[10px] text-slate-300 font-mono py-1 border-t border-slate-700/50 flex flex-col gap-0.5">
                  <div className="flex justify-between text-slate-300">
                    <span className="font-semibold text-rose-300">❤️ HP: {config.maxHp}</span>
                    {isOnPath ? (
                      <span className="text-amber-200">Blk: {config.blockCapacity}</span>
                    ) : (
                      <span className="text-sky-200">Rng: {config.attackRange}</span>
                    )}
                  </div>
                  {tier === 1 && (
                    <div className="flex justify-between text-orange-200/90 text-[9.5px]">
                      <span>Fighter Melee</span>
                      <span>Dmg {config.damage}</span>
                    </div>
                  )}
                  {tier === 2 && (
                    <div className="flex justify-between text-blue-200/90 text-[9.5px]">
                      <span>Tank Wall</span>
                      <span>Dmg {config.damage}</span>
                    </div>
                  )}
                  {tier === 3 && (
                    <div className="flex justify-between text-emerald-200/90 text-[9.5px]">
                      <span>Rapid Arrows</span>
                      <span>{config.attackSpeed}/s</span>
                    </div>
                  )}
                  {tier === 4 && (
                    <div className="flex justify-between text-purple-200/90 text-[9.5px]">
                      <span>AoE Splash {config.splashRadius}</span>
                      <span>Dmg {config.damage}</span>
                    </div>
                  )}
                  {tier === 5 && (
                    <div className="flex justify-between text-rose-200/90 text-[9.5px]">
                      <span>Execute Low HP</span>
                      <span>Dmg {config.damage}</span>
                    </div>
                  )}
                  {tier === 6 && (
                    <div className="flex justify-between text-emerald-300 text-[9.5px]">
                      <span>Heals Allies</span>
                      <span>+{config.healAmount} HP</span>
                    </div>
                  )}
                  {tier === 7 && (
                    <div className="flex justify-between text-indigo-300 text-[9.5px]">
                      <span>Buffs & Debuffs</span>
                      <span>4 Spells</span>
                    </div>
                  )}
                </div>

                {/* Cost Pill */}
                <div className="mt-auto pt-1 flex items-center justify-between">
                  <span
                    className={`flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded ${
                      canAfford
                        ? 'text-amber-300 bg-amber-950/40 border border-amber-500/30'
                        : 'text-slate-500 bg-slate-900/60'
                    }`}
                  >
                    <Coins className="w-3 h-3 text-amber-400" />
                    {config.cost}g
                  </span>
                  {isSelected && (
                    <span className="text-[9px] font-semibold text-emerald-400 uppercase tracking-wider">
                      Placing
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
