import React from 'react';
import { PlacedCat } from '../types';
import { CAT_CONFIGS, MAX_CAT_LEVEL, getCatLevelStats, isRangedCat } from '../game/constants';
import {
  X,
  DollarSign,
  Crosshair,
  Zap,
  Shield,
  Swords,
  Sparkles,
  Skull,
  Heart,
  Wand2,
  ArrowUpCircle,
  Award,
} from 'lucide-react';

interface CatInspectorProps {
  cat: PlacedCat | null;
  currentGold: number;
  onClose: () => void;
  onSell: (catId: string) => void;
  onUpgrade: (catId: string) => void;
}

export const CatInspector: React.FC<CatInspectorProps> = ({
  cat,
  currentGold,
  onClose,
  onSell,
  onUpgrade,
}) => {
  if (!cat) return null;

  const config = CAT_CONFIGS[cat.tier];
  const catLevel = cat.level || 1;
  const levelStats = getCatLevelStats(cat.tier, catLevel);
  const isMaxLevel = catLevel >= MAX_CAT_LEVEL;
  const canAffordUpgrade = currentGold >= levelStats.upgradeCost;

  const totalInvested = cat.investedGold ?? config.cost;
  const sellValue = Math.floor(totalInvested * 0.7);

  const getClassIcon = () => {
    switch (config.catClass) {
      case 'fighter':
        return <Swords className="w-4 h-4 text-orange-400" />;
      case 'tank':
        return <Shield className="w-4 h-4 text-blue-400" />;
      case 'ranger':
        return <Crosshair className="w-4 h-4 text-emerald-400" />;
      case 'mage':
        return <Sparkles className="w-4 h-4 text-purple-400" />;
      case 'assassin':
        return <Skull className="w-4 h-4 text-rose-400" />;
      case 'priest':
        return <Heart className="w-4 h-4 text-emerald-400" />;
      case 'sorcerer':
        return <Wand2 className="w-4 h-4 text-indigo-400" />;
    }
  };

  const hpRatio = cat.maxHp && cat.hp !== undefined ? Math.max(0, cat.hp / cat.maxHp) : 1;
  const hasWindBless = (cat.windBlessTimer ?? 0) > 0;
  const hasFirePower = (cat.firePowerTimer ?? 0) > 0;

  // Stat previews
  const currentDamage = cat.damage ?? levelStats.damage;
  const currentHp = cat.hp ?? levelStats.maxHp;
  const currentMaxHp = cat.maxHp ?? levelStats.maxHp;
  const currentHeal = cat.healAmount ?? levelStats.healAmount;

  return (
    <div
      id="cat-inspector-panel"
      className="absolute top-4 right-4 z-20 w-84 max-w-[calc(100vw-2rem)] bg-slate-900/95 backdrop-blur border border-slate-700 rounded-xl p-4 shadow-2xl select-none max-h-[calc(100vh-2rem)] overflow-y-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center border shadow-inner shrink-0 relative"
            style={{ backgroundColor: config.color, borderColor: config.accentColor }}
          >
            <span className="text-base">🐱</span>
            <span className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 font-black text-[9px] px-1 rounded-full border border-slate-900 shadow">
              L{catLevel}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="font-heading font-bold text-sm text-slate-100">{config.name}</h2>
              {getClassIcon()}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <span className="capitalize font-medium text-slate-300">{config.catClass}</span>
              <span>•</span>
              <span className={config.placementType === 'on-path' ? 'text-amber-400' : 'text-indigo-400'}>
                {config.placementType === 'on-path' ? 'On-Path Defender' : 'Support Unit'}
              </span>
              <span>•</span>
              <span className="text-amber-300 font-bold">Level {catLevel}</span>
            </div>
          </div>
        </div>
        <button
          id="close-inspector-btn"
          onClick={onClose}
          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Active Buffs Banner (if any) */}
      {(hasWindBless || hasFirePower) && (
        <div className="py-2 px-2.5 my-2 bg-slate-800/80 rounded-lg border border-slate-700 flex flex-wrap gap-2 text-xs">
          {hasWindBless && (
            <span className="flex items-center gap-1 text-sky-400 font-medium">
              💨 Wind Bless (+60% Spd): {cat.windBlessTimer?.toFixed(1)}s
            </span>
          )}
          {hasFirePower && (
            <span className="flex items-center gap-1 text-orange-400 font-medium">
              🔥 Fire Power (+60% Dmg): {cat.firePowerTimer?.toFixed(1)}s
            </span>
          )}
        </div>
      )}

      {/* Level Up Progression Card */}
      <div className="my-2.5 p-2.5 bg-slate-800/80 border border-slate-700/80 rounded-lg">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            Unit Level Progression
          </span>
          <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-700 text-amber-300 border border-slate-600">
            Level {catLevel} / {MAX_CAT_LEVEL}
          </span>
        </div>

        {!isMaxLevel ? (
          <div>
            {/* Stat Upgrade Preview */}
            <div className="bg-slate-900/70 rounded p-2 text-[11px] space-y-1 mb-2 border border-slate-700/40">
              <div className="text-slate-400 flex items-center justify-between">
                <span>Max Health:</span>
                <span className="font-mono text-slate-200 font-semibold">
                  {currentMaxHp} <span className="text-emerald-400 font-bold">→ {levelStats.nextHp}</span>{' '}
                  <span className="text-emerald-400 text-[10px]">(+{levelStats.nextHp! - currentMaxHp})</span>
                </span>
              </div>
              {levelStats.nextDamage !== undefined && (
                <div className="text-slate-400 flex items-center justify-between">
                  <span>Attack Damage:</span>
                  <span className="font-mono text-slate-200 font-semibold">
                    {currentDamage} <span className="text-amber-400 font-bold">→ {levelStats.nextDamage}</span>{' '}
                    <span className="text-amber-400 text-[10px]">(+{levelStats.nextDamage! - currentDamage})</span>
                  </span>
                </div>
              )}
              {levelStats.nextHealAmount !== undefined && (
                <div className="text-slate-400 flex items-center justify-between">
                  <span>Healing Pulse:</span>
                  <span className="font-mono text-slate-200 font-semibold">
                    {currentHeal} <span className="text-emerald-400 font-bold">→ {levelStats.nextHealAmount}</span>{' '}
                    <span className="text-emerald-400 text-[10px]">(+{levelStats.nextHealAmount! - (currentHeal ?? 0)})</span>
                  </span>
                </div>
              )}
              {levelStats.nextAttackRange !== undefined && levelStats.nextAttackRange > levelStats.attackRange && (
                <div className="text-slate-400 flex items-center justify-between">
                  <span>Attack Range:</span>
                  <span className="font-mono text-slate-200 font-semibold">
                    {levelStats.attackRange} <span className="text-purple-400 font-bold">→ {levelStats.nextAttackRange}</span>{' '}
                    <span className="text-purple-400 text-[10px]">(+{(levelStats.nextAttackRange - levelStats.attackRange).toFixed(1)} Odd Lv. Bonus!)</span>
                  </span>
                </div>
              )}
            </div>

            {/* Level Up Button */}
            <button
              id={`upgrade-cat-btn-${cat.id}`}
              onClick={() => onUpgrade(cat.id)}
              disabled={!canAffordUpgrade}
              className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all shadow ${
                canAffordUpgrade
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 hover:shadow-amber-500/20 active:scale-98'
                  : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed'
              }`}
            >
              <ArrowUpCircle className={`w-4 h-4 ${canAffordUpgrade ? 'text-slate-950' : 'text-slate-500'}`} />
              {canAffordUpgrade ? (
                <span>
                  Raise to Level {catLevel + 1} ({levelStats.upgradeCost}g)
                </span>
              ) : (
                <span>
                  Need {levelStats.upgradeCost}g to Level Up (Have {currentGold}g)
                </span>
              )}
            </button>
            <p className="text-[10px] text-slate-400 text-center mt-1.5 italic">
              Upgrading costs {levelStats.upgradeCost}g (lower than summoning a new {config.cost}g cat) & enhances this unit.
            </p>
          </div>
        ) : (
          <div className="py-2 px-2.5 bg-amber-950/40 border border-amber-500/30 rounded-lg text-center">
            <span className="text-xs font-bold text-amber-300 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Maximum Level Reached (Lv. {MAX_CAT_LEVEL})
            </span>
            <p className="text-[10px] text-slate-400 mt-0.5">This unit has achieved its peak combat potential.</p>
          </div>
        )}
      </div>

      {/* HP Bar */}
      {cat.maxHp !== undefined && cat.hp !== undefined && (
        <div className="py-2.5 border-b border-slate-800/80">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1 text-slate-300 font-medium">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              Health Points
            </span>
            <span className="font-mono font-bold text-slate-200">
              {currentHp} / {currentMaxHp}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div
              className={`h-full transition-all duration-200 ${
                hpRatio > 0.5 ? 'bg-emerald-500' : hpRatio > 0.25 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${Math.round(hpRatio * 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
            {cat.blockCapacity !== undefined ? (
              <span>
                Enemies Blocked:{' '}
                <strong className="text-slate-200">
                  {cat.blockedEnemyIds?.length ?? 0} / {cat.blockCapacity}
                </strong>
              </span>
            ) : (
              <span className="text-indigo-300/80">Support Unit (Off-Path)</span>
            )}
            <span className="text-amber-400/90 font-medium">
              Defeat refund: +{Math.round(totalInvested * (config.deathRefundPercent || 0.15))}g (
              {Math.round((config.deathRefundPercent || 0.15) * 100)}%)
            </span>
          </div>
        </div>
      )}

      {/* Stats list */}
      <div className="py-3 space-y-2 text-xs">
        {config.catClass === 'priest' ? (
          <>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Heart className="w-3.5 h-3.5 text-emerald-400" />
                Healing Pulse
              </span>
              <span className="font-mono font-bold text-emerald-300">+{currentHeal} HP</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Total Healing Done
              </span>
              <span className="font-mono font-bold text-slate-100">{cat.totalHealingDone || 0} HP</span>
            </div>
          </>
        ) : config.catClass === 'sorcerer' ? (
          <>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5 text-indigo-400">
                <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
                Spell Cycle
              </span>
              <span className="font-mono font-bold text-indigo-300">4 Alternating Spells</span>
            </div>
            <div className="text-[10.5px] text-slate-300 bg-slate-800/60 p-2 rounded border border-slate-700/60 space-y-1">
              <div className="text-amber-300 text-[10px] font-semibold mb-1 pb-1 border-b border-slate-700/60 flex items-center gap-1">
                <span>✨</span> Buffs allies only when wave is active
              </div>
              <div className={cat.sorcererCycleStep === 0 ? 'text-sky-300 font-bold' : 'text-slate-400'}>
                1. 💨 Bless of the Wind (+60% Spd to ally)
              </div>
              <div className={cat.sorcererCycleStep === 1 ? 'text-lime-300 font-bold' : 'text-slate-400'}>
                2. 🧪 Poison Pool (Acid puddle damaging & -40% Armor)
              </div>
              <div className={cat.sorcererCycleStep === 2 ? 'text-orange-300 font-bold' : 'text-slate-400'}>
                3. 🔥 Fire Power (+60% Dmg to ally)
              </div>
              <div className={cat.sorcererCycleStep === 3 ? 'text-cyan-300 font-bold' : 'text-slate-400'}>
                4. ❄️ Cool Breeze (-50% Slow to enemies)
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              Damage
            </span>
            <span className="font-mono font-bold text-slate-100">
              {currentDamage}
              {config.catClass === 'assassin' && (
                <span className="text-rose-400 font-normal text-[11px] ml-1">(Executes low HP)</span>
              )}
              {config.catClass === 'mage' && (
                <span className="text-purple-400 font-normal text-[11px] ml-1">(AoE Splash)</span>
              )}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-slate-300">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Crosshair className="w-3.5 h-3.5 text-purple-400" />
            Range
          </span>
          <span className="font-mono font-bold text-slate-100">
            {cat.attackRange ?? levelStats.attackRange ?? config.attackRange} tiles
            {isRangedCat(config.catClass) && (
              <span className="text-purple-400 font-normal text-[10px] ml-1">
                (+{(Math.ceil(catLevel / 2) * 0.5).toFixed(1)} Odd Lv. Bonus)
              </span>
            )}
            {(config.catClass === 'fighter' || config.catClass === 'tank') && (
              <span className="text-amber-400 font-normal text-[11px] ml-1">(Front/Same cell)</span>
            )}
          </span>
        </div>

        {/* Aerial / Targeting Capability Badge */}
        {isRangedCat(config.catClass) ? (
          <div className="text-[10px] text-purple-300/90 bg-purple-950/30 border border-purple-800/40 rounded px-2 py-1 flex items-center gap-1.5">
            <span>🎯</span>
            <span><strong>Anti-Air & Ground:</strong> Can target flying Bats!</span>
          </div>
        ) : (
          <div className="text-[10px] text-amber-300/90 bg-amber-950/30 border border-amber-800/40 rounded px-2 py-1 flex items-center gap-1.5">
            <span>⚠️</span>
            <span><strong>Ground Only:</strong> Cannot attack or block flying Bats.</span>
          </div>
        )}

        <div className="flex items-center justify-between text-slate-300">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Cast / Action Speed
          </span>
          <span className="font-mono font-bold text-slate-100">
            {(config.attackSpeed * (hasWindBless ? 1.6 : 1)).toFixed(2)} / sec
            {hasWindBless && <span className="text-sky-400 text-[10px] ml-1">(+60% Buffed)</span>}
          </span>
        </div>

        <div className="flex items-center justify-between text-slate-300">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Swords className="w-3.5 h-3.5 text-emerald-400" />
            Total Damage Dealt
          </span>
          <span className="font-mono font-bold text-slate-100">{cat.totalDamageDealt || 0}</span>
        </div>

        <p className="text-[11px] text-slate-400 pt-1 leading-relaxed italic bg-slate-800/40 p-2 rounded border border-slate-800">
          "{config.description}"
        </p>
      </div>

      {/* Sell Action */}
      <div className="pt-2 border-t border-slate-800">
        <button
          id="sell-cat-btn"
          onClick={() => onSell(cat.id)}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-600/40 hover:border-rose-500 rounded-lg text-rose-300 text-xs font-semibold transition-all shadow-sm active:scale-98"
        >
          <DollarSign className="w-3.5 h-3.5 text-rose-400" />
          <span>Sell Cat for +{sellValue}g (70% of {totalInvested}g invested)</span>
        </button>
      </div>
    </div>
  );
};
