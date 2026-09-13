import React from 'react';
import { Heart, Coins, Swords, Play, FastForward, Volume2, VolumeX, RotateCcw, Dices, Gem, Home } from 'lucide-react';
import { SoundManager } from '../game/audio';

interface HUDProps {
  gold: number;
  health: number;
  maxHealth: number;
  currentWave: number;
  waveInProgress: boolean;
  gameSpeed: number;
  chapter?: number;
  fight?: number;
  targetWaves?: number;
  isEndlessMode?: boolean;
  diamonds?: number;
  avatarInitial?: string;
  onStartWave: () => void;
  onToggleSpeed: () => void;
  onRestart: () => void;
  onRerollMap?: () => void;
  onReturnToMenu?: () => void;
  onOpenProfile?: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  gold,
  health,
  maxHealth,
  currentWave,
  waveInProgress,
  gameSpeed,
  chapter = 1,
  fight = 1,
  targetWaves = 3,
  isEndlessMode = false,
  diamonds,
  avatarInitial,
  onStartWave,
  onToggleSpeed,
  onRestart,
  onRerollMap,
  onReturnToMenu,
  onOpenProfile,
}) => {
  const [isMuted, setIsMuted] = React.useState(SoundManager.getIsMuted());

  const handleToggleMute = () => {
    const muted = SoundManager.toggleMute();
    setIsMuted(muted);
  };

  const healthPercent = Math.max(0, Math.min(1, health / maxHealth));

  return (
    <header className="w-full bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-3 shadow-md flex items-center justify-between gap-3 select-none">
      {/* Brand & Wave Info */}
      <div className="flex items-center gap-3">
        {onReturnToMenu && (
          <button
            id="hud-home-btn"
            onClick={onReturnToMenu}
            title="Return to Main Headquarters"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 rounded-xl transition-all flex items-center gap-1.5 text-xs font-semibold shadow-sm"
          >
            <Home className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">HQ</span>
          </button>
        )}

        <div className="flex items-center gap-2">
          <span className="text-2xl" role="img" aria-label="Cat Defender">🐱</span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading font-bold text-base sm:text-lg leading-tight tracking-wide text-white">
                Cats Defense
              </h1>
              {isEndlessMode ? (
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  Endless
                </span>
              ) : (
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                  Ch.{chapter} F.{fight}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              {currentWave === 0 ? (
                <span>Ready for Wave 1</span>
              ) : isEndlessMode ? (
                <span>Wave {currentWave}</span>
              ) : (
                <span>Wave {currentWave} / {targetWaves}</span>
              )}

              {/* Boss indicator for upcoming or active wave */}
              {currentWave > 0 && currentWave % 5 === 0 && (
                <span className="text-[10px] font-bold text-purple-400 bg-purple-950/70 border border-purple-500/40 px-1 rounded">
                  👑 Boss (+1 HP)
                </span>
              )}
              {currentWave > 0 && currentWave % 3 === 0 && currentWave % 5 !== 0 && (
                <span className="text-[10px] font-bold text-amber-400 bg-amber-950/70 border border-amber-500/40 px-1 rounded">
                  ⚡ Mini-Boss
                </span>
              )}

              {waveInProgress && <span className="ml-1 text-emerald-400 animate-pulse">● Battling</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Core Vitals: Gold, Diamonds & Health */}
      <div className="flex items-center gap-3 sm:gap-5">
        {/* Diamonds Counter */}
        {typeof diamonds === 'number' && (
          <div
            id="hud-diamonds-display"
            onClick={onOpenProfile}
            title="Diamonds: Tied to player account"
            className="flex items-center gap-2 bg-slate-800/90 px-3 py-1.5 rounded-lg border border-cyan-500/30 text-cyan-300 shadow-inner cursor-pointer hover:border-cyan-400/60 transition-all"
          >
            <Gem className="w-4 h-4 text-cyan-400 fill-cyan-400/30" />
            <span className="font-heading font-bold text-base text-cyan-300">
              {diamonds}
            </span>
          </div>
        )}

        {/* Gold Counter */}
        <div 
          id="hud-gold-display" 
          className="flex items-center gap-2 bg-slate-800/90 px-3.5 py-1.5 rounded-lg border border-amber-500/30 text-amber-300 shadow-inner"
        >
          <Coins className="w-5 h-5 text-amber-400 fill-amber-400/20" />
          <span className="font-heading font-bold text-lg text-amber-300 tracking-wider">
            {gold}
          </span>
          <span className="text-xs font-semibold text-amber-400/70 uppercase">Gold</span>
        </div>

        {/* Health Bar */}
        <div 
          id="hud-health-display"
          className="flex flex-col gap-1 min-w-[140px] sm:min-w-[180px]"
        >
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="flex items-center gap-1 text-rose-400">
              <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-400" />
              Lives
            </span>
            <span className="text-slate-300 font-mono">
              {health} / {maxHealth}
            </span>
          </div>
          {/* Health Bar Fill */}
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div
              className={`h-full transition-all duration-300 ${
                healthPercent > 0.5
                  ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                  : healthPercent > 0.25
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                  : 'bg-gradient-to-r from-rose-600 to-red-500 animate-pulse'
              }`}
              style={{ width: `${healthPercent * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Controls: Start Wave, Speed, Mute, Restart */}
      <div className="flex items-center gap-2">
        {/* Start Wave Button */}
        <button
          id="start-wave-btn"
          onClick={onStartWave}
          disabled={waveInProgress}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-heading font-semibold text-sm transition-all duration-150 shadow-sm ${
            waveInProgress
              ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30 ring-2 ring-emerald-400/30 hover:scale-105 active:scale-95'
          }`}
        >
          {waveInProgress ? (
            <>
              <Swords className="w-4 h-4 animate-spin text-slate-400" />
              <span>Wave Active</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>Start Wave {currentWave + 1}</span>
            </>
          )}
        </button>

        {/* Speed Toggle (1x / 2x) */}
        <button
          id="toggle-speed-btn"
          onClick={onToggleSpeed}
          title="Toggle Game Speed (1x / 2x)"
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg flex items-center gap-1 text-xs font-bold transition-all"
        >
          <FastForward className="w-4 h-4 text-cyan-400" />
          <span>{gameSpeed}x</span>
        </button>

        {/* Audio Mute Button */}
        <button
          id="toggle-audio-btn"
          onClick={handleToggleMute}
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition-all"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-slate-300" />}
        </button>

        {/* Reroll Map Path Button (available before starting wave 1) */}
        {currentWave === 0 && !waveInProgress && onRerollMap && (
          <button
            id="reroll-map-btn"
            onClick={onRerollMap}
            title="Generate New Random Path for this Round"
            className="flex items-center gap-1.5 px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-amber-500/30 hover:border-amber-400/50 rounded-lg text-xs font-semibold transition-all shadow-sm"
          >
            <Dices className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">New Path</span>
          </button>
        )}

        {/* Quick Restart Round */}
        <button
          id="restart-game-btn"
          onClick={onRestart}
          title="Restart Round (generates new random path)"
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 rounded-lg transition-all"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Top-Right Avatar button */}
        {avatarInitial && onOpenProfile && (
          <button
            id="hud-avatar-btn"
            onClick={onOpenProfile}
            title="Open Commander Profile"
            className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white font-heading font-extrabold text-xs flex items-center justify-center border border-cyan-300/60 shadow hover:scale-105 active:scale-95 transition-transform"
          >
            {avatarInitial}
          </button>
        )}
      </div>
    </header>
  );
};
