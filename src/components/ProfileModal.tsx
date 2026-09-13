import React, { useEffect } from 'react';
import { PlayerProfile } from '../game/playerStorage';
import { X, Gem, Trophy, Swords, ShieldCheck, Lock } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  profile: PlayerProfile;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  profile,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      id="profile-modal-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 select-none animate-in fade-in duration-150"
    >
      <div
        id="profile-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl relative overflow-hidden"
      >
        {/* Subtle background glow */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          id="close-profile-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          title="Close profile (Esc)"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Avatar & Name */}
        <div className="flex flex-col items-center text-center pt-2 pb-5 border-b border-slate-800">
          {/* Avatar Icon: Initial of the auto-generated name */}
          <div
            id="player-avatar-large"
            className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-indigo-500 flex items-center justify-center text-3xl font-extrabold text-white shadow-xl shadow-cyan-900/30 border-2 border-cyan-300/40 mb-3"
          >
            {profile.avatarInitial}
          </div>

          <div className="flex items-center gap-1.5 justify-center mb-1">
            <h2 id="player-profile-name" className="text-xl font-heading font-bold text-slate-100">
              {profile.name}
            </h2>
            <span
              title="Player identity is randomly auto-generated and cannot be edited"
              className="p-1 text-slate-400 hover:text-slate-300"
            >
              <Lock className="w-3.5 h-3.5" />
            </span>
          </div>

          <p className="text-xs text-slate-400 font-medium">
            Auto-generated Commander Identity • Non-editable
          </p>
        </div>

        {/* Diamonds Balance Highlight */}
        <div className="my-5 p-3.5 bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border border-cyan-500/30 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-inner">
              <Gem className="w-5 h-5 text-cyan-400 fill-cyan-400/30" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-cyan-300/80 uppercase tracking-wider">
                Account Currency
              </div>
              <div className="text-xs text-slate-300">
                Earned by beating levels
              </div>
            </div>
          </div>

          <div className="flex items-baseline gap-1 text-right">
            <span id="profile-diamonds-count" className="font-heading font-extrabold text-2xl text-cyan-300">
              {profile.diamonds}
            </span>
            <span className="text-xs font-bold text-cyan-400">💎</span>
          </div>
        </div>

        {/* Player Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 text-center flex flex-col items-center">
            <Trophy className="w-4 h-4 text-amber-400 mb-1" />
            <div className="font-heading font-bold text-base text-slate-100">
              {profile.levelsWon}
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Levels Won
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 text-center flex flex-col items-center">
            <Swords className="w-4 h-4 text-rose-400 mb-1" />
            <div className="font-heading font-bold text-base text-slate-100">
              {profile.totalWavesCleared}
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Waves Defended
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 text-center flex flex-col items-center">
            <ShieldCheck className="w-4 h-4 text-emerald-400 mb-1" />
            <div className="font-heading font-bold text-base text-slate-100">
              {profile.activeTeam.length} / 7
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Active Cats
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center text-xs text-slate-500">
          Diamonds are tied to your commander account across all rounds.
        </div>
      </div>
    </div>
  );
};
