import React, { useState } from 'react';
import { CatTier } from '../types';
import { CAT_CONFIGS } from '../game/constants';
import {
  PlayerProfile,
  getUnlockedCats,
  getMaxTeamSlots,
  getFightsForChapter,
  getWavesForFight,
  getChapterTitle,
  purchaseStoreItem,
  hasPurchasedItem,
} from '../game/playerStorage';
import { SoundManager } from '../game/audio';
import { CatPreviewCanvas } from './CatPreviewCanvas';
import {
  Swords,
  Users,
  ShoppingBag,
  Gem,
  Play,
  Shield,
  Sparkles,
  Check,
  Plus,
  Trash2,
  Lock,
  ChevronRight,
  Infinity as InfinityIcon,
  Flame,
  Crown,
} from 'lucide-react';

interface MainGameScreenProps {
  profile: PlayerProfile;
  onStartGame: (isEndless?: boolean) => void;
  onOpenProfile: () => void;
  onUpdateTeam: (newTeam: CatTier[]) => void;
  onProfileUpdated?: (profile: PlayerProfile) => void;
}

type MainTab = 'play' | 'team' | 'store';

interface StoreItem {
  id: string;
  name: string;
  category: 'Relic' | 'Skin' | 'Booster' | 'Gear';
  rarity: 'Legendary' | 'Epic' | 'Rare';
  cost: number;
  icon: string;
  description: string;
  effect: string;
}

const STORE_ITEMS: StoreItem[] = [
  {
    id: 'crown-lionheart',
    name: 'Crown of the Lionheart',
    category: 'Skin',
    rarity: 'Legendary',
    cost: 150,
    icon: '👑',
    description: 'Golden coronet crowned with celestial rubies for front-line brawlers and tanks.',
    effect: 'Cosmetic aura & custom golden claw strike effects in battle.',
  },
  {
    id: 'catnip-overdrive',
    name: 'Hyper Catnip Infusion',
    category: 'Booster',
    rarity: 'Rare',
    cost: 95,
    icon: '🌿',
    description: 'Concentrated distillation of mountain nip that sparks wild battle adrenaline.',
    effect: '+10% Attack speed boost to all deployed cats during boss waves.',
  },
  {
    id: 'iron-fortress-collar',
    name: 'Iron Fortress Collar',
    category: 'Relic',
    rarity: 'Epic',
    cost: 120,
    icon: '🛡️',
    description: 'Forged from meteorite alloy worn by legendary ancient feline defenders.',
    effect: '+60 Max HP & +1 enemy block capacity for Tanks.',
  },
  {
    id: 'diamond-pickaxe',
    name: 'Diamond Demolition Pickaxe',
    category: 'Gear',
    rarity: 'Rare',
    cost: 80,
    icon: '🪓',
    description: 'Ultra-hard crystalline blade capable of slicing through granite boulders with ease.',
    effect: 'Permanently lowers terrain obstacle clearing fees by 25%.',
  },
  {
    id: 'arcane-orb',
    name: 'Orb of the Arcane Familiar',
    category: 'Relic',
    rarity: 'Epic',
    cost: 110,
    icon: '🔮',
    description: 'A swirling amethyst orb that channels explosive celestial energies.',
    effect: '+30% Area-of-Effect explosion radius on Mage attacks.',
  },
  {
    id: 'angelic-feather',
    name: 'Angelic Feather of Purring',
    category: 'Relic',
    rarity: 'Rare',
    cost: 85,
    icon: '🕊️',
    description: 'A sacred luminous plume that radiates comforting healing waves.',
    effect: 'Priests heal 2 damaged allies simultaneously with each pulse.',
  },
  {
    id: 'thunder-claws',
    name: 'Thunder Claws Matrix',
    category: 'Gear',
    rarity: 'Legendary',
    cost: 180,
    icon: '⚡',
    description: 'Static-charged claws that crackle with high-voltage electricity.',
    effect: 'Assassins gain 20% chance to arc chain-lightning to 2 adjacent foes.',
  },
  {
    id: 'mystery-chest',
    name: 'Commander Supply Cache',
    category: 'Booster',
    rarity: 'Rare',
    cost: 65,
    icon: '📦',
    description: 'Sealed tactical supply crate stocked with battle provisions and bonuses.',
    effect: 'Contains diamonds and bonus starting battle gold.',
  },
];

export const MainGameScreen: React.FC<MainGameScreenProps> = ({
  profile,
  onStartGame,
  onOpenProfile,
  onUpdateTeam,
  onProfileUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<MainTab>('play');
  const [teamNotification, setTeamNotification] = useState<string | null>(null);
  const [purchaseNotification, setPurchaseNotification] = useState<string | null>(null);

  const allTiers: CatTier[] = [1, 2, 3, 4, 5, 6, 7];
  const maxSlots = getMaxTeamSlots(profile);
  const unlockedCats = getUnlockedCats(profile);
  const totalFightsInChapter = getFightsForChapter(profile.currentChapter);
  const wavesInFight = getWavesForFight(profile.currentChapter);
  const chapterTitle = getChapterTitle(profile.currentChapter);

  const handlePurchaseItem = (item: StoreItem) => {
    const isOwned = hasPurchasedItem(profile, item.id);
    if (isOwned) {
      setPurchaseNotification(`You already own ${item.name}!`);
      setTimeout(() => setPurchaseNotification(null), 2500);
      return;
    }

    if (profile.diamonds < item.cost) {
      setPurchaseNotification(`Not enough diamonds for ${item.name}! Defend in battle to earn more.`);
      setTimeout(() => setPurchaseNotification(null), 2500);
      return;
    }

    const res = purchaseStoreItem(item.id, item.cost);
    if (res.success) {
      SoundManager.playCoin();
      onProfileUpdated?.(res.profile);
      setPurchaseNotification(`🎉 Acquired ${item.name}! Perk is now active.`);
      setTimeout(() => setPurchaseNotification(null), 3500);
    } else {
      setPurchaseNotification(res.message);
      setTimeout(() => setPurchaseNotification(null), 2500);
    }
  };

  const handleToggleCatInTeam = (tier: CatTier) => {
    if (!unlockedCats.includes(tier)) {
      const required = tier === 4 || tier === 6 ? 'Chapter 1' : 'Chapter 2';
      setTeamNotification(`Locked! Clear ${required} to recruit ${CAT_CONFIGS[tier].name}.`);
      setTimeout(() => setTeamNotification(null), 2500);
      return;
    }

    const isCurrentlyIn = profile.activeTeam.includes(tier);
    if (isCurrentlyIn) {
      if (profile.activeTeam.length <= 1) {
        setTeamNotification('Your team must have at least 1 active cat!');
        setTimeout(() => setTeamNotification(null), 2500);
        return;
      }
      const updated = profile.activeTeam.filter((t) => t !== tier);
      onUpdateTeam(updated);
      setTeamNotification(`Removed ${CAT_CONFIGS[tier].name} from active squad`);
      setTimeout(() => setTeamNotification(null), 2500);
    } else {
      if (profile.activeTeam.length >= maxSlots) {
        setTeamNotification(`Active squad is full (Max ${maxSlots} slots). Clear chapters to unlock more slots!`);
        setTimeout(() => setTeamNotification(null), 2500);
        return;
      }
      const updated = [...profile.activeTeam, tier];
      onUpdateTeam(updated);
      setTeamNotification(`Added ${CAT_CONFIGS[tier].name} to active squad!`);
      setTimeout(() => setTeamNotification(null), 2500);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 select-none overflow-hidden font-sans">
      {/* Top Header Bar */}
      <header className="w-full bg-slate-900/90 backdrop-blur border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-lg z-30 shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-900/30 text-xl border border-amber-300/30">
            🐱
          </div>
          <div>
            <h1 className="font-heading font-extrabold text-lg text-white tracking-wide flex items-center gap-2">
              Cats Defense
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                HQ
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">
              Defend the Sanctuary • Command the Pride
            </p>
          </div>
        </div>

        {/* Currency & Top-Right Avatar */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Diamonds Pill */}
          <div
            id="main-diamonds-pill"
            title="Diamonds: Earned by beating levels. Linked to your commander account!"
            className="flex items-center gap-2 bg-slate-800/90 hover:bg-slate-800 border border-cyan-500/40 px-3.5 py-1.5 rounded-xl shadow-inner cursor-pointer transition-all hover:scale-105"
            onClick={onOpenProfile}
          >
            <div className="w-5 h-5 rounded-md bg-cyan-500/20 flex items-center justify-center">
              <Gem className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/40" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-heading font-bold text-base text-cyan-300">
                {profile.diamonds}
              </span>
              <span className="text-[10px] uppercase font-bold text-cyan-400/80 tracking-wider">
                Diamonds
              </span>
            </div>
          </div>

          {/* Top-Right Avatar Icon (Opens Profile) */}
          <button
            id="player-avatar-top-btn"
            onClick={onOpenProfile}
            title={`Open Profile: ${profile.name}`}
            className="group flex items-center gap-2.5 p-1 pr-3 bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 hover:border-cyan-500/50 rounded-full transition-all duration-200 cursor-pointer shadow-md hover:shadow-cyan-900/20 active:scale-95"
          >
            {/* Avatar circle showing the initial of the auto-generated name */}
            <div
              id="avatar-icon-circle"
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 via-sky-500 to-indigo-500 flex items-center justify-center font-heading font-black text-sm text-white shadow border border-cyan-300/60 group-hover:scale-105 transition-transform"
            >
              {profile.avatarInitial}
            </div>

            <div className="text-left hidden md:block">
              <div className="text-xs font-heading font-bold text-slate-200 group-hover:text-cyan-300 transition-colors truncate max-w-[120px]">
                {profile.name}
              </div>
              <div className="text-[9px] text-slate-400 font-medium">
                Commander Profile
              </div>
            </div>
          </button>
        </div>
      </header>

      {/* Main Tab Navigation Bar */}
      <nav className="w-full bg-slate-900/70 border-b border-slate-800/80 px-4 sm:px-8 py-2 flex items-center justify-center shrink-0 z-20">
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800 shadow-inner max-w-md w-full">
          {/* Tab 1: Start Game / Play */}
          <button
            id="tab-start-game-btn"
            onClick={() => setActiveTab('play')}
            className={`flex-1 py-2 px-3 rounded-lg font-heading font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'play'
                ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md shadow-emerald-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Play</span>
          </button>

          {/* Tab 2: Modify Team */}
          <button
            id="tab-team-btn"
            onClick={() => setActiveTab('team')}
            className={`flex-1 py-2 px-3 rounded-lg font-heading font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'team'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Team ({profile.activeTeam.length})</span>
          </button>

          {/* Tab 3: Store */}
          <button
            id="tab-store-btn"
            onClick={() => setActiveTab('store')}
            className={`flex-1 py-2 px-3 rounded-lg font-heading font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'store'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Store</span>
          </button>
        </div>
      </nav>

      {/* Main Tab Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center">
        <div className="w-full max-w-6xl">
          {/* TAB 1: START GAME / PLAY */}
          {activeTab === 'play' && (
            <div id="tab-play-content" className="space-y-6 animate-in fade-in duration-200">
              {/* Level Mission Hero Card */}
              <div className="relative rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-8 shadow-2xl overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  <div className="space-y-3 max-w-xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold font-mono uppercase px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Chapter {profile.currentChapter} • {chapterTitle}
                      </span>
                      <span className="text-xs font-bold font-mono uppercase px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Fight {profile.currentFight} of {totalFightsInChapter}
                      </span>
                    </div>

                    <h2 className="text-2xl sm:text-4xl font-heading font-extrabold text-white tracking-tight">
                      Perimeter Defense: Battle #{profile.currentFight}
                    </h2>

                    <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                      Assault forces are escalating! Deploy your frontline brawlers along the path to intercept invaders, while snipers, mages, and healers provide critical fire support from the flanks.
                    </p>

                    {/* Mission Intel Tags */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 rounded-lg border border-slate-700/60 text-xs text-slate-300">
                        <Swords className="w-3.5 h-3.5 text-rose-400" />
                        <span>{wavesInFight} Assault Waves</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 rounded-lg border border-slate-700/60 text-xs text-amber-300">
                        <Flame className="w-3.5 h-3.5 text-amber-400" />
                        <span>Mini-Boss on Wave 3</span>
                      </div>
                      {wavesInFight >= 5 && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-950/60 rounded-lg border border-purple-500/40 text-xs text-purple-300 font-semibold">
                          <Crown className="w-3.5 h-3.5 text-purple-400" />
                          <span>Boss on Wave 5 (+1 HP Heal)</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-cyan-950/60 rounded-lg border border-cyan-500/30 text-xs text-cyan-300 font-semibold">
                        <Gem className="w-3.5 h-3.5 text-cyan-400" />
                        <span>+{25 + profile.currentChapter * 5 + wavesInFight * 4} 💎 Diamonds (+20 Flawless)</span>
                      </div>
                    </div>
                  </div>

                  {/* Big Play CTA Button */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-center gap-3 w-full lg:w-auto">
                    <button
                      id="launch-battle-btn"
                      onClick={() => onStartGame(false)}
                      className="w-full sm:w-auto lg:w-64 py-4 px-8 bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-heading font-extrabold text-lg rounded-2xl transition-all duration-200 shadow-xl shadow-emerald-950/50 hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer group"
                    >
                      <Play className="w-6 h-6 fill-white group-hover:translate-x-0.5 transition-transform" />
                      <span>START FIGHT {profile.currentFight}</span>
                    </button>
                    <span className="text-[11px] text-slate-400 text-center font-medium">
                      Chapter {profile.currentChapter} • {wavesInFight} Waves
                    </span>
                  </div>
                </div>
              </div>

              {/* Endless Mode Banner Card */}
              <div className={`rounded-2xl border p-5 shadow-xl transition-all ${
                profile.endlessUnlocked
                  ? 'bg-gradient-to-r from-indigo-950/70 via-slate-900 to-purple-950/70 border-indigo-500/40'
                  : 'bg-slate-900/50 border-slate-800'
              }`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      profile.endlessUnlocked
                        ? 'bg-indigo-500/20 border-indigo-400/40 text-indigo-300'
                        : 'bg-slate-800 border-slate-700 text-slate-500'
                    }`}>
                      {profile.endlessUnlocked ? (
                        <InfinityIcon className="w-5 h-5 animate-pulse" />
                      ) : (
                        <Lock className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading font-bold text-base text-white">
                          Endless Wave Mode
                        </h3>
                        {profile.endlessUnlocked ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                            Unlocked
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                            Locked
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 mt-1 max-w-xl">
                        {profile.endlessUnlocked
                          ? 'Engage an infinite progression of waves. Mini-bosses attack every 3 waves and powerful bosses emerge every 5 waves!'
                          : 'Complete any fight without losing a single HP point (Flawless Victory) to unlock Endless Waves!'}
                      </p>
                    </div>
                  </div>

                  {profile.endlessUnlocked ? (
                    <button
                      id="launch-endless-mode-btn"
                      onClick={() => onStartGame(true)}
                      className="py-2.5 px-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-heading font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-indigo-950/50 hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer shrink-0"
                    >
                      <InfinityIcon className="w-4 h-4" />
                      <span>Play Endless Waves</span>
                    </button>
                  ) : (
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 shrink-0 px-3 py-1.5 bg-slate-950/60 rounded-lg border border-slate-800">
                      <Lock className="w-3.5 h-3.5 text-slate-500" />
                      <span>Requires Flawless Fight (0 HP Lost)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Ready Squad Quick Preview Card */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-400" />
                    <h3 className="font-heading font-bold text-sm text-slate-200 uppercase tracking-wider">
                      Selected Battle Squad ({profile.activeTeam.length} / {maxSlots} Cats)
                    </h3>
                  </div>

                  <button
                    onClick={() => setActiveTab('team')}
                    className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <span>Modify Team</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {profile.activeTeam.map((tier) => {
                    const cfg = CAT_CONFIGS[tier];
                    return (
                      <div
                        key={tier}
                        className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex flex-col items-center text-center relative overflow-hidden group hover:border-slate-700 transition-colors"
                      >
                        <div
                          className="w-2 h-full absolute left-0 top-0"
                          style={{ backgroundColor: cfg.color }}
                        />
                        <div className="mb-2">
                          <CatPreviewCanvas tier={tier} size={48} />
                        </div>
                        <span className="font-heading font-bold text-xs text-slate-100 truncate w-full">
                          {cfg.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium capitalize truncate w-full">
                          {cfg.catClass} • {cfg.placementType === 'on-path' ? 'Path' : 'Off-path'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MODIFY TEAM */}
          {activeTab === 'team' && (
            <div id="tab-team-content" className="space-y-6 animate-in fade-in duration-200">
              {/* Squad Header & Feedback Banner */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-heading font-bold text-xl text-white">
                      Modify Battle Squad
                    </h2>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {profile.activeTeam.length} / {maxSlots} Active
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Select up to {maxSlots} cat classes to bring into the battlefield. Only active squad cats will be purchasable in the shop!
                  </p>
                </div>

                {teamNotification && (
                  <div className="px-3.5 py-2 bg-amber-950/80 border border-amber-500/50 text-amber-200 rounded-xl text-xs font-semibold animate-in fade-in">
                    {teamNotification}
                  </div>
                )}
              </div>

              {/* Active Squad Ribbon */}
              <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 shadow-md">
                <div className="text-xs font-heading font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span>Current Active Lineup (Max {maxSlots} Slots)</span>
                  </div>
                  {maxSlots < 5 && (
                    <span className="text-[11px] text-amber-400 font-semibold">
                      Clear Chapters to unlock up to 5 squad slots!
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[0, 1, 2, 3, 4].map((slotIdx) => {
                    const isSlotUnlocked = slotIdx < maxSlots;
                    const tier = profile.activeTeam[slotIdx];

                    if (!isSlotUnlocked) {
                      return (
                        <div
                          key={`locked-slot-${slotIdx}`}
                          className="border border-slate-800 bg-slate-950/40 rounded-xl p-3 flex flex-col items-center justify-center text-center text-slate-500 min-h-[120px] opacity-75"
                        >
                          <Lock className="w-5 h-5 mb-1.5 text-slate-500" />
                          <span className="text-[11px] font-bold text-slate-400">Slot {slotIdx + 1} Locked</span>
                          <span className="text-[9px] text-amber-400/80 mt-0.5">
                            {slotIdx === 3 ? 'Clear Chapter 1' : 'Clear Chapter 2'}
                          </span>
                        </div>
                      );
                    }

                    if (tier) {
                      const cfg = CAT_CONFIGS[tier];
                      return (
                        <div
                          key={`slot-${slotIdx}-${tier}`}
                          className="bg-slate-950 border border-emerald-500/40 rounded-xl p-3 flex flex-col items-center text-center relative group shadow-sm"
                        >
                          <button
                            id={`remove-team-slot-${tier}`}
                            onClick={() => handleToggleCatInTeam(tier)}
                            title="Remove from active squad"
                            className="absolute top-1.5 right-1.5 p-1 bg-slate-800/80 hover:bg-rose-900/80 text-slate-400 hover:text-rose-200 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <div className="my-1">
                            <CatPreviewCanvas tier={tier} size={50} />
                          </div>

                          <div className="font-heading font-bold text-xs text-slate-100 truncate w-full">
                            {cfg.name}
                          </div>
                          <span
                            className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded mt-1"
                            style={{ backgroundColor: `${cfg.color}33`, color: cfg.color }}
                          >
                            {cfg.catClass}
                          </span>
                        </div>
                      );
                    } else {
                      return (
                        <div
                          key={`empty-slot-${slotIdx}`}
                          className="border-2 border-dashed border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center text-slate-600 min-h-[120px]"
                        >
                          <Plus className="w-5 h-5 mb-1 text-slate-500" />
                          <span className="text-[11px] font-semibold text-slate-400">Empty Slot</span>
                          <span className="text-[9px] text-slate-500">Select below</span>
                        </div>
                      );
                    }
                  })}
                </div>
              </div>

              {/* All 7 Cat Classes Roster */}
              <div className="space-y-3">
                <h3 className="font-heading font-bold text-base text-slate-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Available Cat Classes ({allTiers.length})</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allTiers.map((tier) => {
                    const cfg = CAT_CONFIGS[tier];
                    const isUnlocked = unlockedCats.includes(tier);
                    const isInTeam = profile.activeTeam.includes(tier);

                    return (
                      <div
                        key={tier}
                        className={`rounded-2xl border p-4 transition-all relative flex flex-col justify-between ${
                          !isUnlocked
                            ? 'bg-slate-900/30 border-slate-800/60 opacity-80'
                            : isInTeam
                            ? 'bg-slate-900/90 border-emerald-500/50 ring-1 ring-emerald-500/30 shadow-lg'
                            : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Header with Avatar Canvas & Basic Info */}
                        <div className="flex items-start gap-3 mb-3">
                          <div
                            className="w-14 h-14 rounded-xl border flex items-center justify-center p-1 shrink-0 shadow-inner relative"
                            style={{ backgroundColor: `${cfg.color}15`, borderColor: `${cfg.color}55` }}
                          >
                            <CatPreviewCanvas tier={tier} size={48} />
                            {!isUnlocked && (
                              <div className="absolute inset-0 bg-slate-950/60 rounded-xl flex items-center justify-center text-slate-400">
                                <Lock className="w-4 h-4" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="font-heading font-bold text-sm text-slate-100 truncate">
                                {cfg.name}
                              </h4>
                              <span
                                className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border shrink-0"
                                style={{
                                  backgroundColor: `${cfg.color}22`,
                                  color: cfg.color,
                                  borderColor: `${cfg.color}44`,
                                }}
                              >
                                {cfg.catClass}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-400 font-medium">
                              {cfg.placementType === 'on-path' ? '📍 Placed on path (Melee/Block)' : '🎯 Placed off-path (Ranged)'}
                            </p>

                            <div className="text-[10px] text-amber-300 font-mono font-semibold mt-0.5">
                              Deploy Cost: {cfg.cost}g
                            </div>
                          </div>
                        </div>

                        {/* Description & Mechanics */}
                        <p className="text-xs text-slate-300 leading-relaxed mb-3 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                          {cfg.description}
                        </p>

                        {/* Stat Badges */}
                        <div className="grid grid-cols-3 gap-1.5 text-center mb-4">
                          <div className="bg-slate-950/80 p-1.5 rounded border border-slate-800">
                            <div className="text-[9px] text-slate-400 uppercase font-semibold">HP</div>
                            <div className="font-mono font-bold text-xs text-rose-400">{cfg.maxHp}</div>
                          </div>
                          <div className="bg-slate-950/80 p-1.5 rounded border border-slate-800">
                            <div className="text-[9px] text-slate-400 uppercase font-semibold">Damage</div>
                            <div className="font-mono font-bold text-xs text-amber-300">
                              {cfg.damage > 0 ? cfg.damage : 'Support'}
                            </div>
                          </div>
                          <div className="bg-slate-950/80 p-1.5 rounded border border-slate-800">
                            <div className="text-[9px] text-slate-400 uppercase font-semibold">Range</div>
                            <div className="font-mono font-bold text-xs text-cyan-300">{cfg.attackRange}</div>
                          </div>
                        </div>

                        {/* Toggle or Lock Button */}
                        {!isUnlocked ? (
                          <div className="w-full py-2 px-3 rounded-xl font-heading font-bold text-xs flex items-center justify-center gap-1.5 bg-slate-950 border border-slate-800 text-slate-500">
                            <Lock className="w-3.5 h-3.5 text-amber-500/70" />
                            <span>
                              Unlocks on {tier === 4 || tier === 6 ? 'Chapter 1' : 'Chapter 2'} Clear
                            </span>
                          </div>
                        ) : (
                          <button
                            id={`toggle-cat-team-${tier}`}
                            onClick={() => handleToggleCatInTeam(tier)}
                            className={`w-full py-2 px-3 rounded-xl font-heading font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              isInTeam
                                ? 'bg-emerald-950/80 hover:bg-rose-950/80 text-emerald-300 hover:text-rose-300 border border-emerald-500/40 hover:border-rose-500/40'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                            }`}
                          >
                            {isInTeam ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span>In Active Squad (Click to Remove)</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" />
                                <span>Deploy to Squad</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STORE (BUY ITEMS WITH DIAMONDS) */}
          {activeTab === 'store' && (
            <div id="tab-store-content" className="space-y-6 animate-in fade-in duration-200">
              {/* Store Banner */}
              <div className="bg-gradient-to-r from-blue-950/70 via-slate-900 to-cyan-950/70 border border-cyan-500/30 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <ShoppingBag className="w-5 h-5 text-cyan-400" />
                    <h2 className="font-heading font-bold text-xl text-white">
                      Diamond Item Emporium
                    </h2>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      Catalog Preview
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                    Exchange your hard-earned battle diamonds for exclusive combat relics, defensive gear, and commander cosmetics.
                  </p>
                </div>

                {/* Diamonds in Hand */}
                <div className="bg-slate-950/90 border border-cyan-500/40 px-4 py-2.5 rounded-xl shadow-inner flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <Gem className="w-4 h-4 text-cyan-400 fill-cyan-400/40" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                      Your Balance
                    </div>
                    <div className="font-heading font-black text-xl text-cyan-300">
                      {profile.diamonds} 💎
                    </div>
                  </div>
                </div>
              </div>

              {/* Purchase Notification Banner */}
              {purchaseNotification && (
                <div className="p-3.5 bg-gradient-to-r from-cyan-950 to-blue-950 rounded-xl border border-cyan-500/60 flex items-center gap-3 text-xs text-cyan-200 shadow-lg animate-in slide-in-from-top-2 duration-200">
                  <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 animate-pulse" />
                  <span className="font-semibold">{purchaseNotification}</span>
                </div>
              )}

              {/* Store Status Note */}
              <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs text-slate-300">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>
                    Purchased artifacts and upgrades are permanently tied to your commander profile and automatically activate in battle!
                  </span>
                </div>
                <div className="text-[11px] font-mono font-bold text-cyan-400 shrink-0 bg-cyan-950/80 px-2.5 py-1 rounded-lg border border-cyan-800/60">
                  {(profile.purchasedItems || []).length} / {STORE_ITEMS.length} Owned
                </div>
              </div>

              {/* Store Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {STORE_ITEMS.map((item) => {
                  const isPurchased = hasPurchasedItem(profile, item.id);
                  const canAfford = profile.diamonds >= item.cost;
                  return (
                    <div
                      key={item.id}
                      className={`border rounded-2xl p-4 flex flex-col justify-between shadow-lg relative group transition-all ${
                        isPurchased
                          ? 'bg-slate-900/90 border-emerald-500/50 ring-1 ring-emerald-500/30'
                          : 'bg-slate-900/70 border-slate-800 hover:border-slate-700/80'
                      }`}
                    >
                      <div>
                        {/* Top: Icon & Rarity */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner border ${
                            isPurchased ? 'bg-emerald-950/60 border-emerald-500/40' : 'bg-slate-800/80 border-slate-700'
                          }`}>
                            {item.icon}
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <span
                              className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                                isPurchased
                                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                                  : item.rarity === 'Legendary'
                                  ? 'bg-amber-950/80 text-amber-400 border-amber-600/50'
                                  : item.rarity === 'Epic'
                                  ? 'bg-purple-950/80 text-purple-400 border-purple-600/50'
                                  : 'bg-cyan-950/80 text-cyan-400 border-cyan-600/50'
                              }`}
                            >
                              {isPurchased ? 'Owned' : item.rarity}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold">
                              {item.category}
                            </span>
                          </div>
                        </div>

                        {/* Title & Description */}
                        <h4 className="font-heading font-bold text-sm text-slate-100 mb-1 leading-snug">
                          {item.name}
                        </h4>
                        <p className="text-xs text-slate-400 leading-relaxed mb-3">
                          {item.description}
                        </p>

                        {/* Effect Box */}
                        <div className={`p-2 rounded-lg border text-[11px] mb-4 font-medium ${
                          isPurchased
                            ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300'
                            : 'bg-slate-950/60 border-slate-800 text-cyan-300/90'
                        }`}>
                          ⚡ {item.effect}
                        </div>
                      </div>

                      {/* Bottom Price & Purchase Action */}
                      <div className="pt-2 border-t border-slate-800/80">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            {isPurchased ? 'Status' : 'Price'}
                          </span>
                          <div className="flex items-center gap-1">
                            {isPurchased ? (
                              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> Equipped
                              </span>
                            ) : (
                              <>
                                <Gem className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/30" />
                                <span
                                  className={`font-heading font-bold text-sm ${
                                    canAfford ? 'text-cyan-300' : 'text-slate-400'
                                  }`}
                                >
                                  {item.cost} Diamonds
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Action Button */}
                        {isPurchased ? (
                          <div className="w-full py-2 px-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-heading font-bold flex items-center justify-center gap-1.5 shadow-inner">
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Acquired & Active</span>
                          </div>
                        ) : (
                          <button
                            id={`store-buy-${item.id}`}
                            onClick={() => handlePurchaseItem(item)}
                            disabled={!canAfford}
                            className={`w-full py-2 px-3 rounded-xl font-heading font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                              canAfford
                                ? 'bg-cyan-600 hover:bg-cyan-500 active:scale-98 text-white shadow-md shadow-cyan-950/50 cursor-pointer'
                                : 'bg-slate-800/80 text-slate-500 border border-slate-700/80 cursor-not-allowed'
                            }`}
                          >
                            <Gem className={`w-3.5 h-3.5 ${canAfford ? 'text-cyan-200 fill-cyan-200/40' : 'text-slate-500'}`} />
                            <span>
                              {canAfford ? `Purchase (${item.cost} 💎)` : `Need ${item.cost - profile.diamonds} More 💎`}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
