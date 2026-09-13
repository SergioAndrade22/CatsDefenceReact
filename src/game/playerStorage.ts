import { CatTier } from '../types';

export interface PlayerProfile {
  name: string;
  avatarInitial: string;
  diamonds: number;
  levelsWon: number; // total fights won across all campaigns
  totalWavesCleared: number;
  currentChapter: number; // starts at 1
  currentFight: number; // 1-indexed fight within current chapter
  chaptersCleared: number; // count of completed chapters
  endlessUnlocked: boolean; // unlocked when a fight is completed with 0 HP lost
  activeTeam: CatTier[];
  purchasedItems?: string[]; // IDs of items purchased from the store
  createdAt: string;
}

const STORAGE_KEY = 'cats_defense_player_profile';

// Curated list of delightful cat commander names
const COMMANDER_NAMES = [
  'Commander Whiskers',
  'Captain Purrfect',
  'Major Mittens',
  'Admiral Clawdia',
  'General Fluffington',
  'Baron Von Paws',
  'Shadow Striker',
  'Sergeant Scratch',
  'Sir Felix the Brave',
  'Duchess Tabby',
  'Colonel Meow',
  'Marshal Marmalade',
  'Vanguard Boots',
  'Count Calico',
  'Tactician Smudge',
];

export const CHAPTER_NAMES: Record<number, string> = {
  1: 'The Green Outskirts',
  2: 'Whispering Pine Forest',
  3: 'Whisker Ridge Highlands',
  4: 'Shadow Citadel Gates',
  5: 'Sunken Dragon Caverns',
  6: 'Celestial Cat Sanctum',
  7: 'Void of the Infinite Scratch',
};

export function getChapterTitle(chapter: number): string {
  return CHAPTER_NAMES[chapter] || `Frontier Sector ${chapter}`;
}

/**
 * Fights per chapter progression:
 * - Chapter 1: 3 fights
 * - Chapter 2: 5 fights
 * - Chapter 3: 8 fights
 * - Chapter 4: 12 fights
 * - Endless further chapters scale up (+5, +6, +7...)
 */
export function getFightsForChapter(chapter: number): number {
  if (chapter === 1) return 3;
  if (chapter === 2) return 5;
  if (chapter === 3) return 8;
  if (chapter === 4) return 12;
  let count = 12;
  for (let c = 5; c <= chapter; c++) {
    count += c;
  }
  return count;
}

/**
 * Waves per fight progression:
 * - Chapter 1: 3 waves
 * - Chapter 2: 4 waves
 * - Chapter 3: 5 waves
 * - Chapter 4: 7 waves
 * - Subsequent chapters grow longer
 */
export function getWavesForFight(chapter: number): number {
  if (chapter === 1) return 3;
  if (chapter === 2) return 4;
  if (chapter === 3) return 5;
  if (chapter === 4) return 7;
  return Math.min(15, 7 + (chapter - 4));
}

/**
 * Unlocked Cats Progression:
 * - Player only starts with 3 cats: Fighter (1), Tank (2), Ranger (3)
 * - Chapter 1 cleared: Mage (4) and Priest (6) are unlocked
 * - Chapter 2 cleared: Assassin (5) and Sorcerer (7) are unlocked
 */
export function getUnlockedCats(profile: Pick<PlayerProfile, 'currentChapter' | 'chaptersCleared'>): CatTier[] {
  const cats: CatTier[] = [1, 2, 3]; // Fighter, Tank, Ranger
  const cleared = profile.chaptersCleared ?? (profile.currentChapter > 1 ? profile.currentChapter - 1 : 0);

  if (cleared >= 1 || profile.currentChapter > 1) {
    cats.push(4, 6); // Mage & Priest
  }

  if (cleared >= 2 || profile.currentChapter > 2) {
    cats.push(5, 7); // Assassin & Sorcerer
  }

  return cats.sort((a, b) => a - b);
}

/**
 * Team Slot Limit Progression:
 * - Starts with 3 slots
 * - Chapter 1 cleared: +1 slot (totalling 4)
 * - Chapter 2 cleared: +1 slot (totalling 5)
 */
export function getMaxTeamSlots(profile: Pick<PlayerProfile, 'currentChapter' | 'chaptersCleared'>): number {
  const cleared = profile.chaptersCleared ?? (profile.currentChapter > 1 ? profile.currentChapter - 1 : 0);
  if (cleared >= 2 || profile.currentChapter > 2) return 5;
  if (cleared >= 1 || profile.currentChapter > 1) return 4;
  return 3;
}

/**
 * Sanitizes the active squad according to unlocked cats and slot limits.
 */
export function sanitizeTeam(profile: Pick<PlayerProfile, 'currentChapter' | 'chaptersCleared' | 'activeTeam'>): CatTier[] {
  const unlocked = getUnlockedCats(profile);
  const maxSlots = getMaxTeamSlots(profile);

  let team = (profile.activeTeam || []).filter((tier) => unlocked.includes(tier));
  if (team.length === 0) {
    team = unlocked.slice(0, maxSlots);
  } else if (team.length > maxSlots) {
    team = team.slice(0, maxSlots);
  }
  return team;
}

function generateRandomName(): string {
  const index = Math.floor(Math.random() * COMMANDER_NAMES.length);
  return COMMANDER_NAMES[index];
}

export function getPlayerProfile(): PlayerProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.name === 'string') {
        const currentChapter = typeof parsed.currentChapter === 'number' ? parsed.currentChapter : 1;
        const currentFight = typeof parsed.currentFight === 'number' ? parsed.currentFight : 1;
        const chaptersCleared = typeof parsed.chaptersCleared === 'number' 
          ? parsed.chaptersCleared 
          : (currentChapter > 1 ? currentChapter - 1 : 0);
        const endlessUnlocked = Boolean(parsed.endlessUnlocked);

        const profile: PlayerProfile = {
          name: parsed.name,
          avatarInitial: parsed.name.charAt(0).toUpperCase(),
          diamonds: typeof parsed.diamonds === 'number' ? parsed.diamonds : 60,
          levelsWon: typeof parsed.levelsWon === 'number' ? parsed.levelsWon : 0,
          totalWavesCleared: typeof parsed.totalWavesCleared === 'number' ? parsed.totalWavesCleared : 0,
          currentChapter,
          currentFight,
          chaptersCleared,
          endlessUnlocked,
          activeTeam: Array.isArray(parsed.activeTeam) ? parsed.activeTeam : [1, 2, 3],
          createdAt: parsed.createdAt || new Date().toISOString(),
        };

        // Ensure active team adheres strictly to unlocked roster & slot limit
        profile.activeTeam = sanitizeTeam(profile);
        return profile;
      }
    }
  } catch (err) {
    console.warn('Failed to load player profile, creating new one', err);
  }

  // Create initial persistent profile (Starts with 3 cats & 3 slots)
  const name = generateRandomName();
  const newProfile: PlayerProfile = {
    name,
    avatarInitial: name.charAt(0).toUpperCase(),
    diamonds: 60, // Starting welcome diamond gift
    levelsWon: 0,
    totalWavesCleared: 0,
    currentChapter: 1,
    currentFight: 1,
    chaptersCleared: 0,
    endlessUnlocked: false,
    activeTeam: [1, 2, 3], // Fighter (1), Tank (2), Ranger (3)
    createdAt: new Date().toISOString(),
  };

  savePlayerProfile(newProfile);
  return newProfile;
}

export function savePlayerProfile(profile: PlayerProfile): void {
  try {
    profile.activeTeam = sanitizeTeam(profile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.warn('Failed to save player profile', err);
  }
}

export function addPlayerDiamonds(amount: number): PlayerProfile {
  const profile = getPlayerProfile();
  profile.diamonds = Math.max(0, profile.diamonds + amount);
  savePlayerProfile(profile);
  return profile;
}

export interface FightVictoryResult {
  profile: PlayerProfile;
  diamondsEarned: number;
  isFlawless: boolean;
  endlessNewlyUnlocked: boolean;
  chapterJustCleared: number | null;
  newlyUnlockedCats: CatTier[];
  newSlotUnlocked: number | null;
  nextChapter: number;
  nextFight: number;
}

/**
 * Advances player progress upon winning a fight.
 * Handles flawless condition (0 HP lost) to unlock Endless Waves,
 * chapter progression, newly unlocked cats, and team slot expansions.
 */
export function recordFightVictory(
  wavesCleared: number,
  isFlawless: boolean
): FightVictoryResult {
  const profile = getPlayerProfile();
  const oldMaxSlots = getMaxTeamSlots(profile);
  const oldUnlocked = getUnlockedCats(profile);

  const baseDiamonds = 25 + profile.currentChapter * 5;
  const flawlessBonus = isFlawless ? 20 : 0;
  const diamondsEarned = baseDiamonds + wavesCleared * 4 + flawlessBonus;

  profile.diamonds += diamondsEarned;
  profile.levelsWon += 1;
  profile.totalWavesCleared += wavesCleared;

  let endlessNewlyUnlocked = false;
  if (isFlawless && !profile.endlessUnlocked) {
    profile.endlessUnlocked = true;
    endlessNewlyUnlocked = true;
  }

  const totalFightsInCurrentChapter = getFightsForChapter(profile.currentChapter);
  let chapterJustCleared: number | null = null;

  if (profile.currentFight >= totalFightsInCurrentChapter) {
    // Chapter completed!
    chapterJustCleared = profile.currentChapter;
    profile.chaptersCleared = Math.max(profile.chaptersCleared, chapterJustCleared);
    profile.currentChapter += 1;
    profile.currentFight = 1;
  } else {
    // Progress to next fight in same chapter
    profile.currentFight += 1;
  }

  const newMaxSlots = getMaxTeamSlots(profile);
  const newUnlocked = getUnlockedCats(profile);
  const newlyUnlockedCats = newUnlocked.filter((c) => !oldUnlocked.includes(c));
  const newSlotUnlocked = newMaxSlots > oldMaxSlots ? newMaxSlots : null;

  // If new cats unlocked, optionally fill empty slots
  profile.activeTeam = sanitizeTeam(profile);

  savePlayerProfile(profile);

  return {
    profile,
    diamondsEarned,
    isFlawless,
    endlessNewlyUnlocked,
    chapterJustCleared,
    newlyUnlockedCats,
    newSlotUnlocked,
    nextChapter: profile.currentChapter,
    nextFight: profile.currentFight,
  };
}

export function updatePlayerTeam(team: CatTier[]): PlayerProfile {
  const profile = getPlayerProfile();
  const unlocked = getUnlockedCats(profile);
  const maxSlots = getMaxTeamSlots(profile);

  const filtered = team.filter((t) => unlocked.includes(t)).slice(0, maxSlots);
  profile.activeTeam = filtered.length > 0 ? filtered : unlocked.slice(0, maxSlots);
  savePlayerProfile(profile);
  return profile;
}

export function purchaseStoreItem(
  itemId: string,
  cost: number
): { success: boolean; profile: PlayerProfile; message: string } {
  const profile = getPlayerProfile();
  profile.purchasedItems = profile.purchasedItems || [];

  if (profile.purchasedItems.includes(itemId)) {
    return { success: false, profile, message: 'Already acquired!' };
  }

  if (profile.diamonds < cost) {
    return {
      success: false,
      profile,
      message: `Need ${cost - profile.diamonds} more diamonds!`,
    };
  }

  profile.diamonds -= cost;
  profile.purchasedItems.push(itemId);
  savePlayerProfile(profile);
  return { success: true, profile, message: 'Item acquired!' };
}

export function hasPurchasedItem(profile: PlayerProfile, itemId: string): boolean {
  return Boolean(profile.purchasedItems && profile.purchasedItems.includes(itemId));
}

