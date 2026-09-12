import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Trophy, Skull, ArrowRight } from 'lucide-react';

interface GameOverModalProps {
  isGameOver: boolean;
  isGameWon: boolean;
  wave: number;
  onRestart: () => void;
  onContinueEndless: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isGameOver,
  isGameWon,
  wave,
  onRestart,
  onContinueEndless,
}) => {
  useEffect(() => {
    if (isGameWon) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Confetti fallback
      }
    }
  }, [isGameWon]);

  if (!isGameOver && !isGameWon) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl text-center flex flex-col items-center">
        {isGameWon ? (
          <>
            <div className="w-16 h-16 bg-amber-500/10 border-2 border-amber-500/40 rounded-full flex items-center justify-center mb-4 text-amber-400">
              <Trophy className="w-8 h-8" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-amber-300 mb-1">
              YOU WON!
            </h2>
            <p className="text-sm text-slate-300 mb-6">
              Territory protected! You successfully repelled all 3 enemy assault waves.
            </p>

            <div className="w-full space-y-2.5">
              <button
                id="continue-endless-btn"
                onClick={onContinueEndless}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40"
              >
                <span>Continue Endless Waves</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="play-again-won-btn"
                onClick={onRestart}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-700"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Play Again</span>
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
              The enemies overrun the perimeter at Wave {wave}. Gather your cats and defend again!
            </p>

            <button
              id="restart-game-over-btn"
              onClick={onRestart}
              className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-heading font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-950/40 active:scale-98"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
