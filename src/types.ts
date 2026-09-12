export type CatTier = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type CatClass = 'fighter' | 'tank' | 'ranger' | 'mage' | 'assassin' | 'priest' | 'sorcerer';

export interface CatTypeConfig {
  id: CatTier;
  catClass: CatClass;
  name: string;
  subtitle: string;
  cost: number;
  damage: number;
  attackRange: number; // in grid cells
  attackSpeed: number; // attacks / actions per second
  color: string;
  accentColor: string;
  projectileColor: string;
  projectileSpeed: number;
  description: string;
  placementType: 'on-path' | 'off-path';
  maxHp: number; // life bar for all cats (Tank > Fighter > Ranger > Assassin > Mage > Sorcerer > Priest)
  blockCapacity?: number; // enemies that can be blocked simultaneously (Fighter & Tank)
  deathRefundPercent?: number; // refund percentage on defeat
  splashRadius?: number; // for Mage AoE
  executeMultiplier?: number; // for Assassin
  healAmount?: number; // for Priest
}

export interface PlacedCat {
  id: string;
  tier: CatTier;
  catClass: CatClass;
  gridX: number;
  gridY: number;
  worldX: number;
  worldY: number;
  lastAttackTime: number; // timestamp in seconds
  targetEnemyId: string | null;
  angle: number; // radians facing target or facing upstream
  facingAngle?: number; // upstream facing direction on path (for Fighters & Tanks)
  totalKills: number;
  totalDamageDealt: number;
  totalHealingDone?: number;
  level: number; // Unit level (1, 2, 3...)
  damage?: number; // Current unit damage scaled by level
  healAmount?: number; // Current unit heal scaled by level
  attackRange?: number; // Current unit attack range scaled by odd levels
  investedGold?: number; // Total gold invested for sell/defeat refund
  hp?: number;
  maxHp?: number;
  blockCapacity?: number;
  blockedEnemyIds?: string[];
  damageFlashTimer?: number;
  // Active buffs from Sorcerer:
  windBlessTimer?: number; // attack speed boost
  firePowerTimer?: number; // damage boost
  // Sorcerer state:
  sorcererCycleStep?: number; // 0: Wind Bless, 1: Poison Pool, 2: Fire Power, 3: Cool Breeze
}

export interface EnemyTypeConfig {
  name: string;
  baseHealth: number;
  moveSpeed: number; // cells per second
  goldReward: number;
  damageToPlayer: number;
  color: string;
  size: number;
}

export interface EnemyInstance {
  id: string;
  type: 'mouse' | 'rat' | 'boss' | 'bat';
  isFlying?: boolean;
  waypoints?: Waypoint[];
  health: number;
  maxHealth: number;
  moveSpeed: number;
  goldReward: number;
  damageToPlayer: number;
  currentWaypointIndex: number;
  worldX: number;
  worldY: number;
  angle: number;
  isAlive: boolean;
  damageFlashTimer: number; // in seconds
  blockedByCatId: string | null;
  lastCatAttackTime: number; // melee attack cooldown against blocked cat on path
  // Ranged attack state:
  lastRangedAttackTime: number; // timestamp of last ranged attack
  attackPauseTimer: number; // brief stop duration while winding up/firing ranged attack
  rangedTargetCatId?: string | null;
  // Active debuffs from Sorcerer:
  chilledTimer?: number; // reduced movement speed
  chilledSlowMultiplier?: number; // e.g. 0.5 for -50%
  armorReducedTimer?: number; // takes extra damage from all sources
  armorVulnerabilityMultiplier?: number; // e.g. 1.4 for +40% extra damage
  acidTickCooldown?: number;
}

export interface PoisonPool {
  id: string;
  worldX: number;
  worldY: number;
  radius: number;
  duration: number;
  maxDuration: number;
  damagePerSec: number;
  armorReduction: number;
  lastTickTime: number;
}

export interface ProjectileInstance {
  id: string;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  targetEnemyId?: string;
  targetCatId?: string; // when launched by an enemy at a cat
  isEnemyProjectile?: boolean;
  damage: number;
  speed: number;
  color: string;
  lifetime: number;
  timeAlive: number;
  isAoE?: boolean;
  splashRadius?: number;
  isCrit?: boolean;
}

export interface FloatingText {
  id: string;
  text: string;
  worldX: number;
  worldY: number;
  color: string;
  age: number;
  maxAge: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface WaveConfig {
  waveNumber: number;
  enemyCount: number;
  spawnRate: number; // enemies per second
  enemyHealthMultiplier: number;
  enemySpeedMultiplier: number;
}

export interface Waypoint {
  x: number; // grid coords
  y: number;
}

export interface GridCell {
  gridX: number;
  gridY: number;
  isOccupied: boolean;
  isBlocked: boolean; // on path
  catId?: string;
}

export interface Obstacle {
  id: string;
  type: 'rock' | 'tree';
  gridX: number;
  gridY: number;
  variant: number;
}

