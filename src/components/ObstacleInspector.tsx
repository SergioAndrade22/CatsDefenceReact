import React from 'react';
import { Obstacle } from '../types';
import { X, Coins, Pickaxe, TrendingUp, AlertCircle, Sparkles } from 'lucide-react';
import { CLEAR_OBSTACLE_COST_INCREMENT } from '../game/constants';

interface ObstacleInspectorProps {
  obstacle: Obstacle | null;
  currentGold: number;
  clearCost: number;
  clearedCount: number;
  onClose: () => void;
  onClear: (obstacleId: string) => void;
}

export const ObstacleInspector: React.FC<ObstacleInspectorProps> = ({
  obstacle,
  currentGold,
  clearCost,
  clearedCount,
  onClose,
  onClear,
}) => {
  if (!obstacle) return null;

  const canAfford = currentGold >= clearCost;
  const isRock = obstacle.type === 'rock';
  const obstacleName = isRock ? 'Granite Boulder' : 'Pine Tree';

  return (
    <div
      id="obstacle-inspector-panel"
      className="absolute top-4 right-4 z-20 w-80 max-w-[calc(100vw-2rem)] bg-slate-900/95 backdrop-blur border border-slate-700/80 rounded-xl p-4 shadow-2xl select-none animate-in fade-in slide-in-from-top-2 duration-150"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner shrink-0 ${
              isRock
                ? 'bg-slate-800 border-slate-600 text-slate-200'
                : 'bg-emerald-950/80 border-emerald-700/60 text-emerald-300'
            }`}
          >
            <span className="text-xl" role="img" aria-label={obstacleName}>
              {isRock ? '🪨' : '🌲'}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="font-heading font-bold text-sm text-slate-100">{obstacleName}</h2>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                  isRock
                    ? 'bg-slate-800 text-slate-300 border-slate-700'
                    : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                }`}
              >
                Terrain
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              Tile: [{obstacle.gridX}, {obstacle.gridY}] • Variant {obstacle.variant + 1}
            </div>
          </div>
        </div>

        <button
          id="close-obstacle-inspector-btn"
          onClick={onClose}
          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"
          title="Close (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Description / Effect Card */}
      <div className="my-3 p-2.5 bg-slate-800/60 rounded-lg border border-slate-700/60 flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-200">Blocks Cat Placement.</span> Cleared terrain permanently opens this grid cell for ranged snipers, mages, or support cats.
        </div>
      </div>

      {/* Cost & Escalation Rate Grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Coins className="w-3 h-3 text-amber-400" />
            Clear Fee
          </span>
          <div className="flex items-baseline gap-1">
            <span className={`text-base font-bold font-mono ${canAfford ? 'text-amber-300' : 'text-rose-400'}`}>
              {clearCost}g
            </span>
            <span className="text-[10px] text-slate-500">gold</span>
          </div>
        </div>

        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-cyan-400" />
            Price Escalation
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-bold font-mono text-cyan-300">
              +{CLEAR_OBSTACLE_COST_INCREMENT}g
            </span>
            <span className="text-[10px] text-slate-500">per cleared</span>
          </div>
        </div>
      </div>

      {/* Clearance History Counter */}
      <div className="mb-3 px-2.5 py-1.5 bg-slate-800/40 rounded-lg border border-slate-800/80 flex items-center justify-between text-[11px]">
        <span className="text-slate-400">Obstacles Cleared:</span>
        <span className="font-bold text-amber-400 font-mono">
          {clearedCount} {clearedCount === 1 ? 'obstacle' : 'obstacles'}
        </span>
      </div>

      {/* Action Button: Clear Terrain */}
      <button
        id="confirm-clear-terrain-btn"
        onClick={() => onClear(obstacle.id)}
        disabled={!canAfford}
        className={`w-full py-2.5 px-3 rounded-lg font-heading font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
          canAfford
            ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 hover:shadow-amber-500/20 active:scale-[0.98] cursor-pointer'
            : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
        }`}
      >
        <Pickaxe className="w-4 h-4" />
        {canAfford ? (
          <span>Clear Terrain (-{clearCost} Gold)</span>
        ) : (
          <span>Need {clearCost - currentGold} More Gold</span>
        )}
      </button>

      {/* Strategy Hint */}
      <div className="mt-2.5 text-[10px] text-slate-400/90 text-center flex items-center justify-center gap-1">
        <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
        <span>Clearing central obstacles creates ideal sniper perches!</span>
      </div>
    </div>
  );
};
