import { CatClass, CatTier, CatTypeConfig, Obstacle, WaveConfig, Waypoint } from '../types';

export const GRID_COLS = 10;
export const GRID_ROWS = 10;

export const INITIAL_GOLD = 150;
export const INITIAL_HEALTH = 20;
export const MAX_HEALTH = 20;
export const BASE_WAVE_REWARD = 50;
export const ENEMY_GOLD_REWARD = 11; // 5% more gold
export const FLAWLESS_WAVE_BONUS = 30; // Extra bonus gold for clearing wave without losing lives

// Terrain clearing costs (escalating gold fee per cleared obstacle)
export const BASE_CLEAR_OBSTACLE_COST = 25;
export const CLEAR_OBSTACLE_COST_INCREMENT = 15;

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Procedurally generates a randomized, valid, non-self-intersecting 
 * orthogonal path across the 10x10 grid for each run/round.
 */
export function generateRandomPath(): Waypoint[] {
  const archetype = randInt(1, 7);

  switch (archetype) {
    case 1: {
      // S-Curve: Left -> East -> South -> West -> South -> East Exit
      const y1 = randInt(1, 2);
      const y2 = randInt(4, 5);
      const y3 = randInt(7, 8);
      const xTurn1 = randInt(6, 8);
      const xTurn2 = randInt(1, 3);
      return [
        { x: -1, y: y1 },
        { x: xTurn1, y: y1 },
        { x: xTurn1, y: y2 },
        { x: xTurn2, y: y2 },
        { x: xTurn2, y: y3 },
        { x: 10, y: y3 },
      ];
    }

    case 2: {
      // Inverted S-Curve: Left (Bottom) -> East -> North -> West -> North -> East Exit
      const y1 = randInt(7, 8);
      const y2 = randInt(4, 5);
      const y3 = randInt(1, 2);
      const xTurn1 = randInt(6, 8);
      const xTurn2 = randInt(1, 3);
      return [
        { x: -1, y: y1 },
        { x: xTurn1, y: y1 },
        { x: xTurn1, y: y2 },
        { x: xTurn2, y: y2 },
        { x: xTurn2, y: y3 },
        { x: 10, y: y3 },
      ];
    }

    case 3: {
      // Top-to-Bottom Zig-Zag
      const x1 = randInt(1, 2);
      const x2 = randInt(4, 5);
      const x3 = randInt(7, 8);
      const yTurn1 = randInt(6, 8);
      const yTurn2 = randInt(2, 3);
      return [
        { x: x1, y: -1 },
        { x: x1, y: yTurn1 },
        { x: x2, y: yTurn1 },
        { x: x2, y: yTurn2 },
        { x: x3, y: yTurn2 },
        { x: x3, y: 10 },
      ];
    }

    case 4: {
      // Horseshoe Arch: Enters bottom-left -> climbs to top -> crosses east -> drops to bottom-right exit
      const yStart = randInt(7, 8);
      const xCol1 = randInt(2, 3);
      const yTop = randInt(1, 2);
      const xCol2 = randInt(6, 7);
      const yEnd = randInt(7, 8);
      return [
        { x: -1, y: yStart },
        { x: xCol1, y: yStart },
        { x: xCol1, y: yTop },
        { x: xCol2, y: yTop },
        { x: xCol2, y: yEnd },
        { x: 10, y: yEnd },
      ];
    }

    case 5: {
      // The Staircase: Left entrance -> down & across in 3 steps
      const y1 = randInt(1, 2);
      const x1 = randInt(2, 3);
      const y2 = randInt(4, 5);
      const x2 = randInt(6, 7);
      const y3 = randInt(7, 8);
      return [
        { x: -1, y: y1 },
        { x: x1, y: y1 },
        { x: x1, y: y2 },
        { x: x2, y: y2 },
        { x: x2, y: y3 },
        { x: 10, y: y3 },
      ];
    }

    case 6: {
      // The Hook: Enters Top -> down -> East -> North Exit
      const xStart = randInt(1, 3);
      const yBottom = randInt(7, 8);
      const xTurn = randInt(6, 8);
      return [
        { x: xStart, y: -1 },
        { x: xStart, y: yBottom },
        { x: xTurn, y: yBottom },
        { x: xTurn, y: -1 },
      ];
    }

    case 7:
    default: {
      // Serpentine with Top Exit: Left -> East -> North -> West -> North Exit
      const yStart = randInt(6, 8);
      const x1 = randInt(7, 8);
      const yMid = randInt(3, 4);
      const x2 = randInt(2, 3);
      return [
        { x: -1, y: yStart },
        { x: x1, y: yStart },
        { x: x1, y: yMid },
        { x: x2, y: yMid },
        { x: x2, y: -1 },
      ];
    }
  }
}

// Fallback default path
export const DEFAULT_PATH_WAYPOINTS: Waypoint[] = [
  { x: -1, y: 5 },
  { x: 4, y: 5 },
  { x: 8, y: 5 },
  { x: 8, y: -1 },
];

/**
 * Generates an aerial flight path across the sky to the player's base
 * specifically for flying units like Bats.
 */
export function generateFlyingPath(groundPath: Waypoint[]): Waypoint[] {
  if (!groundPath || groundPath.length < 2) {
    return [
      { x: 2, y: -1 },
      { x: 5, y: 4 },
      { x: 8, y: -1 },
    ];
  }

  const goalWp = groundPath[groundPath.length - 1];
  const startWp = groundPath[0];

  let airStartX = -1;
  let airStartY = -1;

  if (startWp.x <= -0.5) {
    // Ground starts from West -> Bat enters from North or South
    const fromNorth = Math.random() < 0.5;
    if (fromNorth) {
      airStartX = randInt(1, 4);
      airStartY = -1;
    } else {
      airStartX = randInt(1, 4);
      airStartY = 10;
    }
  } else if (startWp.y <= -0.5) {
    // Ground starts from North -> Bat enters from West or East
    const fromWest = Math.random() < 0.5;
    if (fromWest) {
      airStartX = -1;
      airStartY = randInt(2, 6);
    } else {
      airStartX = 10;
      airStartY = randInt(2, 6);
    }
  } else if (startWp.x >= 9.5) {
    // Ground starts from East -> Bat enters from West or North
    airStartX = -1;
    airStartY = randInt(1, 5);
  } else {
    // Fallback
    airStartX = randInt(2, 5);
    airStartY = -1;
  }

  // Mid-flight swooping waypoint across the open field
  const midX = Math.round((airStartX + goalWp.x) * 0.5 + (randInt(0, 1) === 0 ? 1.5 : -1.5));
  const midY = Math.round((airStartY + goalWp.y) * 0.5 + (randInt(0, 1) === 0 ? 1.5 : -1.5));
  const clampedMidX = Math.max(1, Math.min(8, midX));
  const clampedMidY = Math.max(1, Math.min(8, midY));

  return [
    { x: airStartX, y: airStartY },
    { x: clampedMidX, y: clampedMidY },
    { x: goalWp.x, y: goalWp.y },
  ];
}

// 7 Distinct Cat Classes with unique roles, ranges, and mechanics (Costs reduced by 10%)
export const CAT_CONFIGS: Record<number, CatTypeConfig> = {
  1: {
    id: 1,
    catClass: 'fighter',
    name: 'Brawler Claw',
    subtitle: 'Fighter • Path Defender',
    cost: 45, // was 50 (-10%)
    damage: 12,
    attackRange: 2.0,
    attackSpeed: 0.8,
    color: '#ea580c', // Orange/Red Brawler
    accentColor: '#f97316',
    projectileColor: '#fdba74',
    projectileSpeed: 14,
    placementType: 'on-path',
    maxHp: 180,
    blockCapacity: 2,
    deathRefundPercent: 0.30,
    description: 'Placed ON the path. Attacks enemies in front or same cell. Blocks up to 2 enemies. Restores 30% cost on defeat.',
  },
  2: {
    id: 2,
    catClass: 'tank',
    name: 'Iron Paws',
    subtitle: 'Tank • Heavy Barricade',
    cost: 54, // was 60 (-10%)
    damage: 5,
    attackRange: 1.0,
    attackSpeed: 0.5,
    color: '#0284c7', // Steel Blue Tank
    accentColor: '#38bdf8',
    projectileColor: '#7dd3fc',
    projectileSpeed: 12,
    placementType: 'on-path',
    maxHp: 350,
    blockCapacity: 3,
    deathRefundPercent: 0.15,
    description: 'Placed ON the path. Lowest damage & attack speed, but highest HP! Blocks up to 3 enemies. Restores 15% cost on defeat.',
  },
  3: {
    id: 3,
    catClass: 'ranger',
    name: 'Whiskers Archer',
    subtitle: 'Ranger • Rapid Sniper',
    cost: 58, // was 65 (-10%)
    damage: 8,
    attackRange: 5.5,
    attackSpeed: 2.8,
    color: '#059669', // Emerald Ranger
    accentColor: '#10b981',
    projectileColor: '#6ee7b7',
    projectileSpeed: 18,
    placementType: 'off-path',
    maxHp: 140,
    deathRefundPercent: 0.20,
    description: 'Placed OUTSIDE path. Longest range (5.5) & highest attack speed. Locks onto first target until dead or escaped.',
  },
  4: {
    id: 4,
    catClass: 'mage',
    name: 'Arcane Purr',
    subtitle: 'Mage • Splash Sorcerer',
    cost: 76, // was 85 (-10%)
    damage: 34,
    attackRange: 4.0,
    attackSpeed: 0.75,
    color: '#7c3aed', // Arcane Purple
    accentColor: '#a78bfa',
    projectileColor: '#c084fc',
    projectileSpeed: 11,
    placementType: 'off-path',
    maxHp: 90,
    splashRadius: 1.4,
    deathRefundPercent: 0.20,
    description: 'Placed OUTSIDE path. Fires explosive arcane orbs dealing heavy Area-of-Effect (AoE) splash damage.',
  },
  5: {
    id: 5,
    catClass: 'assassin',
    name: 'Shadow Stalker',
    subtitle: 'Assassin • Low HP Executioner',
    cost: 72, // was 80 (-10%)
    damage: 24,
    attackRange: 3.5,
    attackSpeed: 1.3,
    color: '#be123c', // Crimson Assassin
    accentColor: '#f43f5e',
    projectileColor: '#fda4af',
    projectileSpeed: 16,
    placementType: 'off-path',
    maxHp: 110,
    executeMultiplier: 2.5,
    deathRefundPercent: 0.20,
    description: 'Placed OUTSIDE path. Hunts down the lowest-health target in range, dealing lethal execution bonus damage.',
  },
  6: {
    id: 6,
    catClass: 'priest',
    name: 'Divine Abbot',
    subtitle: 'Priest • Ally Healer',
    cost: 63, // was 70 (-10%)
    damage: 0,
    attackRange: 3.5,
    attackSpeed: 0.8,
    color: '#d97706', // Radiant Holy Gold
    accentColor: '#fbbf24',
    projectileColor: '#fef08a',
    projectileSpeed: 14,
    placementType: 'off-path',
    maxHp: 65,
    healAmount: 35,
    deathRefundPercent: 0.20,
    description: 'Placed OUTSIDE path. Does not attack enemies. Periodically heals damaged ally cats in range, restoring their HP!',
  },
  7: {
    id: 7,
    catClass: 'sorcerer',
    name: 'Cosmic Sorcerer',
    subtitle: 'Sorcerer • Buff & Debuff',
    cost: 81, // was 90 (-10%)
    damage: 0,
    attackRange: 4.0,
    attackSpeed: 0.45,
    color: '#4338ca', // Cosmic Indigo
    accentColor: '#818cf8',
    projectileColor: '#a5b4fc',
    projectileSpeed: 14,
    placementType: 'off-path',
    maxHp: 75,
    deathRefundPercent: 0.20,
    description: 'Placed OUTSIDE path. Does not deal damage. Alternates between ally buffs (Bless of the Wind, Fire Power) and enemy debuffs (Poison Pool, Cool Breeze).',
  },
};

export const MAX_CAT_LEVEL = 5;
export const EXTRA_RANGE_PER_ODD_LEVEL = 0.5; // in grid cells/tiles gained at odd levels (1, 3, 5, etc.)

export function isRangedCat(catClass: CatClass): boolean {
  return (
    catClass === 'ranger' ||
    catClass === 'mage' ||
    catClass === 'assassin' ||
    catClass === 'priest' ||
    catClass === 'sorcerer'
  );
}

export interface CatLevelStats {
  level: number;
  maxHp: number;
  damage: number;
  attackRange: number;
  healAmount?: number;
  upgradeCost: number; // Cost to upgrade to next level (0 if max level)
  nextHp?: number;
  nextDamage?: number;
  nextAttackRange?: number;
  nextHealAmount?: number;
}

/**
 * Calculates level stats and upgrade costs for an individual placed cat:
 * - Upgrading costs less than summoning a new cat (~60% for Lv 2, ~75% for Lv 3, etc.).
 * - Stats improvement is less valuable than summoning a new cat:
 *   e.g. Level 1 Fighter (cost 45g): 180hp, 12dmg.
 *        Level 2 Fighter (upgrade 27g): 250hp (+70), 18dmg (+6).
 * - At every odd level (1, 3, 5, etc.), ranged Cats gain extra range (+0.5 per odd level milestone).
 */
export function getCatLevelStats(tier: CatTier, level: number): CatLevelStats {
  const config = CAT_CONFIGS[tier];
  const baseHp = config.maxHp;
  const baseDmg = config.damage;
  const baseHeal = config.healAmount ?? 0;
  const isRanged = isRangedCat(config.catClass);

  // HP scaling: +70 HP per level for Fighter (38.89% base)
  const hpIncrement = Math.round(baseHp * 0.3889);
  // Damage scaling: +6 DMG per level for Fighter (50% base)
  const dmgIncrement = Math.max(1, Math.round(baseDmg * 0.50));
  // Healing scaling: +40% base heal per level
  const healIncrement = Math.round(baseHeal * 0.40);

  const currentHp = baseHp + hpIncrement * (level - 1);
  const currentDmg = baseDmg + (baseDmg > 0 ? dmgIncrement * (level - 1) : 0);
  const currentHeal = baseHeal + (baseHeal > 0 ? healIncrement * (level - 1) : 0);

  // At every odd level (levels 1, 3, 5, etc.), ranged Cats gain extra range
  // Lv 1: 1st milestone (+0.5)
  // Lv 2: 1st milestone (+0.5)
  // Lv 3: 2nd milestone (+1.0 -> +0.5 gain!)
  // Lv 4: 2nd milestone (+1.0)
  // Lv 5: 3rd milestone (+1.5 -> +0.5 gain!)
  const oddLevelCount = Math.ceil(level / 2);
  const currentRange = isRanged
    ? Number((config.attackRange + oddLevelCount * EXTRA_RANGE_PER_ODD_LEVEL).toFixed(2))
    : config.attackRange;

  // Upgrade costs:
  let upgradeCost = 0;
  if (level === 1) {
    upgradeCost = Math.round(config.cost * 0.60);
  } else if (level === 2) {
    upgradeCost = Math.round(config.cost * 0.75);
  } else if (level === 3) {
    upgradeCost = Math.round(config.cost * 0.90);
  } else if (level === 4) {
    upgradeCost = Math.round(config.cost * 1.10);
  }

  const nextLevel = level + 1;
  const nextOddLevelCount = Math.ceil(nextLevel / 2);
  const nextHp = level < MAX_CAT_LEVEL ? currentHp + hpIncrement : undefined;
  const nextDamage = level < MAX_CAT_LEVEL && baseDmg > 0 ? currentDmg + dmgIncrement : undefined;
  const nextHealAmount = level < MAX_CAT_LEVEL && baseHeal > 0 ? currentHeal + healIncrement : undefined;
  const nextAttackRange = level < MAX_CAT_LEVEL
    ? (isRanged ? Number((config.attackRange + nextOddLevelCount * EXTRA_RANGE_PER_ODD_LEVEL).toFixed(2)) : config.attackRange)
    : undefined;

  return {
    level,
    maxHp: currentHp,
    damage: currentDmg,
    healAmount: baseHeal > 0 ? currentHeal : undefined,
    attackRange: currentRange,
    upgradeCost,
    nextHp,
    nextDamage,
    nextHealAmount,
    nextAttackRange,
  };
}

/**
 * Generates wave configurations scaled by wave number, chapter, and fight progression.
 * Enemies start weak in early chapter 1 fights and become progressively harder.
 */
export function getWaveConfig(waveNum: number, chapter: number = 1, fight: number = 1): WaveConfig {
  const chapterScale = Math.pow(1.26, Math.max(0, chapter - 1));
  const fightScale = 1 + Math.max(0, fight - 1) * 0.08;
  const waveHealthBase = 0.85 + (waveNum - 1) * 0.22;
  const waveSpeedBase = 0.95 + Math.min(0.55, (waveNum - 1) * 0.04);
  const enemyCountBase = Math.min(30, 4 + waveNum * 2 + Math.floor(fight * 0.7) + (chapter - 1) * 2);

  return {
    waveNumber: waveNum,
    enemyCount: enemyCountBase,
    spawnRate: Math.min(2.2, 0.5 + (waveNum - 1) * 0.12 + (chapter - 1) * 0.05),
    enemyHealthMultiplier: Number((waveHealthBase * chapterScale * fightScale).toFixed(2)),
    enemySpeedMultiplier: Number(Math.min(1.6, waveSpeedBase * (1 + (chapter - 1) * 0.03)).toFixed(2)),
  };
}

/**
 * Randomly generates natural obstacles (rocks and trees) on grass tiles
 * that do not intersect with the enemy path.
 */
export function generateObstacles(pathWaypoints: Waypoint[]): Obstacle[] {
  // 1. Identify all tiles occupied or traversed by path segments
  const pathBlocked = new Set<string>();
  for (let i = 0; i < pathWaypoints.length - 1; i++) {
    const p1 = pathWaypoints[i];
    const p2 = pathWaypoints[i + 1];

    const minX = Math.max(0, Math.floor(Math.min(p1.x, p2.x)));
    const maxX = Math.min(GRID_COLS - 1, Math.ceil(Math.max(p1.x, p2.x)));
    const minY = Math.max(0, Math.floor(Math.min(p1.y, p2.y)));
    const maxY = Math.min(GRID_ROWS - 1, Math.ceil(Math.max(p1.y, p2.y)));

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        pathBlocked.add(`${x},${y}`);
      }
    }
  }

  // 2. Gather candidate grass tiles
  const availableTiles: { x: number; y: number }[] = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      if (!pathBlocked.has(`${c},${r}`)) {
        availableTiles.push({ x: c, y: r });
      }
    }
  }

  // Shuffle available tiles
  for (let i = availableTiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availableTiles[i], availableTiles[j]] = [availableTiles[j], availableTiles[i]];
  }

  // Pick between 6 and 9 obstacles (balanced mix of rocks and trees)
  const obstacleCount = Math.min(availableTiles.length, randInt(6, 9));
  const obstacles: Obstacle[] = [];

  for (let i = 0; i < obstacleCount; i++) {
    const tile = availableTiles[i];
    // Alternate or randomize between rocks and trees
    const isRock = i % 2 === 0;
    obstacles.push({
      id: `obs_${tile.x}_${tile.y}`,
      type: isRock ? 'rock' : 'tree',
      gridX: tile.x,
      gridY: tile.y,
      variant: randInt(0, 2),
    });
  }

  return obstacles;
}

