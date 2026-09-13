import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Trophy, Skull, ArrowRight, Gem, Home, Sparkles, Infinity as InfinityIcon, ShieldCheck } from 'lucide-react';
import { CatTier } from '../types';
import { CAT_CONFIGS } from '../game/constants';

interface GameOverModalProps {
  isGameOver: boolean;
  isGameWon: boolean;
  wave: number;
  chapter?: number;
  fight?: number;
  isFlawless?: boolean;
  endlessNewlyUnlocked?: boolean;
  isEndlessMode?: boolean;
  newlyUnlockedCats?: CatTier[];
  newSlotUnlocked?: number | null;
  chapterJustCleared?: number | null;
  diamondsEarned?: number;
  onRestart: () => void;
  onContinueEndless?: () => void;
  onNextFight?: () => void;
  onReturnToMenu?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isGameOver,
  isGameWon,
  wave,
  chapter = 1,
  fight = 1,
  isFlawless = false,
  endlessNewlyUnlocked = false,
  isEndlessMode = false,
  newlyUnlockedCats = [],
  newSlotUnlocked = null,
  chapterJustCleared = null,
  diamondsEarned = 35,
  onRestart,
  onContinueEndless,
  onNextFight,
  onReturnToMenu,
}) => {
  useEffect(() => {
    if (isGameWon) {
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch {
        // Confetti fallback
      }
    }
  }, [isGameWon]);

  if (!isGameOver && !isGameWon) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl text-center flex flex-col items-center max-h-[90vh] overflow-y-auto">
        {isGameWon ? (
          <>
            <div className="w-16 h-16 bg-amber-500/10 border-2 border-amber-500/40 rounded-full flex items-center justify-center mb-3 text-amber-400">
              <Trophy className="w-8 h-8" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-amber-300 mb-0.5">
              {isEndlessMode
                ? 'ENDLESS SURVIVAL!'
                : chapterJustCleared
                ? `CHAPTER ${chapterJustCleared} CLEARED!`
                : `CH. ${chapter} • FIGHT ${fight} VICTORIOUS!`}
            </h2>
            <p className="text-xs text-slate-300 mb-3">
              {isEndlessMode
                ? `You repelled ${wave} onslaught waves in Endless Mode!`
                : `Perimeter secured! All assault waves repelled with feline precision.`}
            </p>

            {/* Flawless Victory Badge */}
            {isFlawless && (
              <div className="w-full py-1.5 px-3 bg-amber-500/10 border border-amber-500/40 rounded-xl mb-3 flex items-center justify-center gap-2 text-amber-300 text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>✨ FLAWLESS VICTORY (Zero HP Lost)!</span>
              </div>
            )}

            {/* Endless Newly Unlocked Announcement */}
            {endlessNewlyUnlocked && (
              <div className="w-full p-3 bg-gradient-to-r from-indigo-950/90 to-purple-950/90 border border-indigo-500/50 rounded-xl mb-3 text-left">
                <div className="flex items-center gap-2 text-indigo-300 font-heading font-bold text-sm mb-1">
                  <InfinityIcon className="w-4 h-4 text-indigo-400 animate-spin" />
                  <span>ENDLESS MODE UNLOCKED!</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Because you completed a fight without losing a single HP point, the infinite Endless Wave Mode is now unlocked at HQ!
                </p>
              </div>
            )}

            {/* Newly Unlocked Cats Banner */}
            {newlyUnlockedCats.length > 0 && (
              <div className="w-full p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-xl mb-3 text-left">
                <div className="flex items-center gap-2 text-emerald-300 font-heading font-bold text-xs mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>NEW CAT CLASSES UNLOCKED!</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {newlyUnlockedCats.map((tier) => (
                    <span
                      key={tier}
                      className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-200 border border-emerald-500/30"
                    >
                      🐱 {CAT_CONFIGS[tier].name} ({CAT_CONFIGS[tier].catClass})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Squad Slot Expanded Banner */}
            {newSlotUnlocked && (
              <div className="w-full py-2 px-3 bg-amber-950/80 border border-amber-500/40 rounded-xl mb-3 flex items-center justify-center gap-2 text-amber-200 text-xs font-bold">
                <span>🎒 Squad Capacity Expanded to {newSlotUnlocked} Slots!</span>
              </div>
            )}

            {/* Diamonds Award Banner */}
            <div className="w-full p-3 bg-gradient-to-r from-cyan-950/80 to-blue-950/80 border border-cyan-500/40 rounded-xl mb-4 flex items-center justify-center gap-2 text-cyan-300 shadow-inner">
              <Gem className="w-5 h-5 text-cyan-400 fill-cyan-400/40 animate-bounce" />
              <span className="font-heading font-extrabold text-lg text-cyan-200">
                +{diamondsEarned} Diamonds Earned!
              </span>
            </div>

            <div className="w-full space-y-2">
              {onNextFight && !isEndlessMode && (
                <button
                  id="next-fight-btn"
                  onClick={onNextFight}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-heading font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                >
                  <span>Advance to Next Fight</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {onContinueEndless && (
                <button
                  id="continue-endless-btn"
                  onClick={onContinueEndless}
                  className="w-full py-2 px-4 bg-indigo-950/90 hover:bg-indigo-900/90 text-indigo-200 font-heading font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 border border-indigo-500/40 cursor-pointer"
                >
                  <InfinityIcon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Continue in Endless Mode</span>
                </button>
              )}

              {onReturnToMenu && (
                <button
                  id="return-hq-won-btn"
                  onClick={onReturnToMenu}
                  className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-heading font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-700 cursor-pointer"
                >
                  <Home className="w-4 h-4 text-emerald-400" />
                  <span>Return to Main Headquarters</span>
                </button>
              )}

              <button
                id="play-again-won-btn"
                onClick={onRestart}
                className="w-full py-2 px-4 bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-700/80 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Replay Fight</span>
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-rose-500/10 border-2 border-rose-500/40 rounded-full flex items-center justify-center mb-4 text-rose-400">
              <Skull className="w-8 h-8" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-rose-400 mb-1">
              GAME OVER!
            </h2>
            <p className="text-sm text-slate-300 mb-6">
              The enemies broke the defenses at Wave {wave}. Regroup your pride and try again!
            </p>

            <div className="w-full space-y-2">
              <button
                id="restart-game-over-btn"
                onClick={onRestart}
                className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-heading font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-950/40 active:scale-98 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Try Again</span>
              </button>

              {onReturnToMenu && (
                <button
                  id="return-hq-lost-btn"
                  onClick={onReturnToMenu}
                  className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-700 cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Back to Main Screen</span>
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
