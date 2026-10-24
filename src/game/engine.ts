import {
  BASE_CLEAR_OBSTACLE_COST,
  BASE_WAVE_REWARD,
  CAT_CONFIGS,
  CLEAR_OBSTACLE_COST_INCREMENT,
  ENEMY_GOLD_REWARD,
  FLAWLESS_WAVE_BONUS,
  GRID_COLS,
  GRID_ROWS,
  INITIAL_GOLD,
  INITIAL_HEALTH,
  MAX_HEALTH,
  MAX_CAT_LEVEL,
  generateFlyingPath,
  generateObstacles,
  generateRandomPath,
  getCatLevelStats,
  getWaveConfig,
} from './constants';
import {
  CatTier,
  EnemyInstance,
  FloatingText,
  Obstacle,
  Particle,
  PlacedCat,
  PoisonPool,
  ProjectileInstance,
  Waypoint,
} from '../types';
import { SoundManager } from './audio';
import { getWavesForFight, getPlayerProfile } from './playerStorage';

export interface GameEngineListener {
  onGoldChanged?: (gold: number) => void;
  onHealthChanged?: (health: number, maxHealth: number) => void;
  onWaveChanged?: (wave: number, inProgress: boolean) => void;
  onGameOver?: () => void;
  onGameWon?: (isFlawless: boolean, wavesCleared: number) => void;
  onCatSelected?: (cat: PlacedCat | null) => void;
  onPathChanged?: (path: Waypoint[]) => void;
  onFlyingPathChanged?: (path: Waypoint[]) => void;
  onObstaclesChanged?: (obstacles: Obstacle[]) => void;
  onClearedObstaclesCountChanged?: (count: number) => void;
  onFightInfoChanged?: (chapter: number, fight: number, targetWaves: number, isEndless: boolean) => void;
}

export const ENEMY_ATTACK_CONFIGS: Record<'mouse' | 'rat' | 'boss' | 'bat' | 'mini_boss', {
  meleeDamage: number;
  meleeCooldown: number;
  rangedDamage: number;
  rangedRange: number;
  rangedCooldown: number;
  pauseDuration: number;
  projColor: string;
  projSpeed: number;
}> = {
  mouse: {
    meleeDamage: 9,
    meleeCooldown: 0.75,
    rangedDamage: 6,
    rangedRange: 2.7,
    rangedCooldown: 0.85,
    pauseDuration: 0.22,
    projColor: '#f43f5e',
    projSpeed: 8.5,
  },
  rat: {
    meleeDamage: 14,
    meleeCooldown: 0.8,
    rangedDamage: 10,
    rangedRange: 3.0,
    rangedCooldown: 0.95,
    pauseDuration: 0.25,
    projColor: '#ea580c',
    projSpeed: 9.5,
  },
  mini_boss: {
    meleeDamage: 24,
    meleeCooldown: 0.8,
    rangedDamage: 16,
    rangedRange: 3.2,
    rangedCooldown: 0.95,
    pauseDuration: 0.22,
    projColor: '#f97316',
    projSpeed: 10.5,
  },
  boss: {
    meleeDamage: 38,
    meleeCooldown: 0.85,
    rangedDamage: 24,
    rangedRange: 3.8,
    rangedCooldown: 1.1,
    pauseDuration: 0.28,
    projColor: '#a855f7',
    projSpeed: 9.0,
  },
  bat: {
    meleeDamage: 8,
    meleeCooldown: 0.7,
    rangedDamage: 8, // Ultrasonic screech shockwave
    rangedRange: 3.2,
    rangedCooldown: 0.85,
    pauseDuration: 0.18,
    projColor: '#c084fc', // Violet sonic echo
    projSpeed: 10.5,
  },
};

export class GameEngine {
  // Game State
  private gold: number = INITIAL_GOLD;
  private health: number = INITIAL_HEALTH;
  private maxHealth: number = MAX_HEALTH;
  private currentWave: number = 0;
  private waveInProgress: boolean = false;
  private isGameOver: boolean = false;
  private isGameWon: boolean = false;
  private lostLivesThisWave: boolean = false;
  private lostLivesInFight: boolean = false;
  private healthAtWaveStart: number = INITIAL_HEALTH;
  public gameSpeed: number = 1; // 1x or 2x
  private gameTime: number = 0; // Total accumulated simulation time (scales with gameSpeed)

  // Progression: Chapter & Fight State
  public chapter: number = 1;
  public fight: number = 1;
  public targetWaves: number = 3;
  public isEndlessMode: boolean = false;

  // Dynamic Path for the current round (shared across all waves in this run)
  public pathWaypoints: Waypoint[] = [];
  public flyingWaypoints: Waypoint[] = [];

  // Obstacles (rocks and trees) for the current round
  public obstacles: Obstacle[] = [];
  private clearedObstaclesCount: number = 0;

  // Entities
  public placedCats: PlacedCat[] = [];
  public enemies: EnemyInstance[] = [];
  public projectiles: ProjectileInstance[] = [];
  public floatingTexts: FloatingText[] = [];
  public particles: Particle[] = [];
  public poisonPools: PoisonPool[] = [];

  // Wave Spawning internals
  private enemiesRemainingToSpawn: number = 0;
  private spawnCooldown: number = 0;
  private currentWaveConfig = getWaveConfig(1);
  private waveSpawnRate: number = 1;

  // Selected cat for inspect/sell
  public selectedCatId: string | null = null;

  // Grid Cell Blocked state (Path and Obstacles)
  public pathCells: Set<string> = new Set();
  public obstacleCells: Set<string> = new Set();
  private blockedCells: Set<string> = new Set();

  // Listeners for React state sync
  private listeners: GameEngineListener = {};

  constructor() {
    this.generateNewPath();
  }

  public setListeners(listeners: GameEngineListener) {
    this.listeners = listeners;
    this.broadcastState();
  }

  private broadcastState() {
    this.listeners.onGoldChanged?.(this.gold);
    this.listeners.onHealthChanged?.(this.health, this.maxHealth);
    this.listeners.onWaveChanged?.(this.currentWave, this.waveInProgress);
    this.listeners.onPathChanged?.(this.pathWaypoints);
    this.listeners.onFlyingPathChanged?.(this.flyingWaypoints);
    this.listeners.onObstaclesChanged?.(this.obstacles);
    this.listeners.onClearedObstaclesCountChanged?.(this.clearedObstaclesCount);
    this.listeners.onFightInfoChanged?.(this.chapter, this.fight, this.targetWaves, this.isEndlessMode);
  }

  public startFight(chapter: number, fight: number, isEndless: boolean = false) {
    this.chapter = chapter;
    this.fight = fight;
    this.targetWaves = getWavesForFight(chapter);
    this.isEndlessMode = isEndless;
    this.lostLivesInFight = false;
    this.restartGame();
  }

  public continueEndlessWaves() {
    this.isEndlessMode = true;
    this.isGameWon = false;
    this.listeners.onFightInfoChanged?.(this.chapter, this.fight, this.targetWaves, this.isEndlessMode);
    this.startNextWave();
  }

  public isFightFlawless(): boolean {
    return !this.lostLivesInFight && this.health === this.maxHealth;
  }

  /**
   * Generates a new random path and obstacles for a fresh run/round
   * and blocks corresponding grid tiles from cat placement.
   */
  public generateNewPath() {
    this.pathWaypoints = generateRandomPath();
    this.flyingWaypoints = generateFlyingPath(this.pathWaypoints);
    this.obstacles = generateObstacles(this.pathWaypoints);
    this.clearedObstaclesCount = 0;
    this.initGridPathBlocks();
    this.listeners.onPathChanged?.(this.pathWaypoints);
    this.listeners.onFlyingPathChanged?.(this.flyingWaypoints);
    this.listeners.onObstaclesChanged?.(this.obstacles);
    this.listeners.onClearedObstaclesCountChanged?.(0);
  }

  /**
   * Allows player to reroll the map path and obstacles before starting Wave 1.
   */
  public rerollPath() {
    if (this.currentWave > 0 || this.waveInProgress) return;
    this.placedCats = [];
    this.selectedCatId = null;
    this.listeners.onCatSelected?.(null);
    this.generateNewPath();
  }

  // Pre-calculate which grid cells the path and obstacles occupy
  private initGridPathBlocks() {
    this.pathCells.clear();
    this.obstacleCells.clear();
    this.blockedCells.clear();

    // 1. Identify path cells
    for (let i = 0; i < this.pathWaypoints.length - 1; i++) {
      const p1 = this.pathWaypoints[i];
      const p2 = this.pathWaypoints[i + 1];

      const minX = Math.max(0, Math.floor(Math.min(p1.x, p2.x)));
      const maxX = Math.min(GRID_COLS - 1, Math.ceil(Math.max(p1.x, p2.x)));
      const minY = Math.max(0, Math.floor(Math.min(p1.y, p2.y)));
      const maxY = Math.min(GRID_ROWS - 1, Math.ceil(Math.max(p1.y, p2.y)));

      for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
          this.pathCells.add(`${x},${y}`);
          this.blockedCells.add(`${x},${y}`);
        }
      }
    }

    // 2. Identify obstacle cells (rocks and trees)
    for (const obs of this.obstacles) {
      this.obstacleCells.add(`${obs.gridX},${obs.gridY}`);
      this.blockedCells.add(`${obs.gridX},${obs.gridY}`);
    }
  }

  /**
   * Validates if a cat of a given tier/class can be placed at (gridX, gridY).
   * - Fighters and Tanks: Can ONLY be placed ON the enemy path.
   * - Rangers, Mages, Assassins: Can ONLY be placed OUTSIDE the enemy path.
   * - Neither can be placed on obstacles (rocks/trees) or occupied tiles.
   */
  public canPlaceCat(tier: CatTier, gridX: number, gridY: number): boolean {
    if (gridX < 0 || gridX >= GRID_COLS || gridY < 0 || gridY >= GRID_ROWS) return false;
    
    // Cannot place on obstacles
    if (this.obstacleCells.has(`${gridX},${gridY}`)) return false;

    // Cannot place on an already occupied cell
    if (this.placedCats.some((c) => c.gridX === gridX && c.gridY === gridY)) return false;

    const config = CAT_CONFIGS[tier];
    if (!config) return false;

    const isPath = this.pathCells.has(`${gridX},${gridY}`);
    if (config.placementType === 'on-path') {
      return isPath;
    } else {
      return !isPath;
    }
  }

  /**
   * Calculates the upstream angle along the path so on-path cats (Fighter/Tank)
   * face towards the direction incoming enemies travel from.
   */
  public getPathFacingAngle(gridX: number, gridY: number): number {
    for (let i = 0; i < this.pathWaypoints.length - 1; i++) {
      const p1 = this.pathWaypoints[i];
      const p2 = this.pathWaypoints[i + 1];

      const minX = Math.min(p1.x, p2.x) - 0.5;
      const maxX = Math.max(p1.x, p2.x) + 0.5;
      const minY = Math.min(p1.y, p2.y) - 0.5;
      const maxY = Math.max(p1.y, p2.y) + 0.5;

      if (gridX >= minX && gridX <= maxX && gridY >= minY && gridY <= maxY) {
        // Flow of enemies is from p1 to p2.
        // The cat defends facing upstream (from p2 towards p1):
        return Math.atan2(p1.y - p2.y, p1.x - p2.x);
      }
    }

    if (this.pathWaypoints.length > 0) {
      const spawn = this.pathWaypoints[0];
      return Math.atan2(spawn.y - gridY, spawn.x - gridX);
    }
    return 0;
  }

  /**
   * Calculates the current gold fee required to clear a terrain obstacle.
   * Gets more expensive the more obstacles the player removes.
   */
  public getClearObstacleCost(): number {
    const base = BASE_CLEAR_OBSTACLE_COST + this.clearedObstaclesCount * CLEAR_OBSTACLE_COST_INCREMENT;
    try {
      const profile = getPlayerProfile();
      if (profile.purchasedItems?.includes('diamond-pickaxe')) {
        return Math.round(base * 0.75);
      }
    } catch {
      // ignore
    }
    return base;
  }

  public getClearedObstaclesCount(): number {
    return this.clearedObstaclesCount;
  }

  /**
   * Removes a selected obstacle for a set fee of gold that gets more expensive
   * the more obstacles the player removes.
   */
  public clearObstacle(obstacleId: string): boolean {
    const obsIndex = this.obstacles.findIndex((o) => o.id === obstacleId);
    if (obsIndex === -1) return false;

    const obs = this.obstacles[obsIndex];
    const cost = this.getClearObstacleCost();
    if (this.gold < cost) return false;

    // Deduct gold
    this.gold -= cost;
    this.listeners.onGoldChanged?.(this.gold);

    // Remove obstacle from data structures and unblock tile for cats
    this.obstacles.splice(obsIndex, 1);
    this.obstacleCells.delete(`${obs.gridX},${obs.gridY}`);
    this.blockedCells.delete(`${obs.gridX},${obs.gridY}`);

    this.clearedObstaclesCount++;
    this.listeners.onClearedObstaclesCountChanged?.(this.clearedObstaclesCount);
    this.listeners.onObstaclesChanged?.(this.obstacles);

    // Audio & Visual Effects
    SoundManager.playClearTerrain();
    this.addFloatingText(`-${cost}g Cleared!`, obs.gridX, obs.gridY, '#f59e0b');
    this.spawnClearObstacleParticles(obs.gridX, obs.gridY, obs.type);

    return true;
  }

  private spawnClearObstacleParticles(gridX: number, gridY: number, type: 'rock' | 'tree') {
    const count = 18;
    const colors = type === 'rock'
      ? ['#94a3b8', '#64748b', '#475569', '#cbd5e1', '#e2e8f0']
      : ['#15803d', '#22c55e', '#86efac', '#b45309', '#d97706'];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.0 + Math.random() * 4.5;
      this.particles.push({
        x: gridX * 50 + 25,
        y: gridY * 50 + 25,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2, // upward burst
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 2.5 + Math.random() * 3.5,
        alpha: 1,
        life: 0,
        maxLife: 0.55,
      });
    }
  }

  public placeCat(tier: CatTier, gridX: number, gridY: number): boolean {
    if (!this.canPlaceCat(tier, gridX, gridY)) return false;
    const config = CAT_CONFIGS[tier];
    if (this.gold < config.cost) return false;

    this.gold -= config.cost;
    this.listeners.onGoldChanged?.(this.gold);

    const facingAngle = config.placementType === 'on-path'
      ? this.getPathFacingAngle(gridX, gridY)
      : 0;

    const initialStats = getCatLevelStats(tier, 1);

    let baseHp = config.maxHp;
    let blockCap = config.blockCapacity;
    try {
      const profile = getPlayerProfile();
      if (config.catClass === 'tank' && profile.purchasedItems?.includes('iron-fortress-collar')) {
        baseHp = (baseHp ?? 180) + 60;
        blockCap = (blockCap ?? 2) + 1;
      }
    } catch {
      // ignore
    }

    const newCat: PlacedCat = {
      id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      tier,
      catClass: config.catClass,
      gridX,
      gridY,
      worldX: gridX,
      worldY: gridY,
      lastAttackTime: -999, // Ready to attack immediately
      targetEnemyId: null,
      angle: facingAngle,
      facingAngle: facingAngle,
      totalKills: 0,
      totalDamageDealt: 0,
      level: 1,
      damage: initialStats.damage,
      healAmount: initialStats.healAmount,
      attackRange: initialStats.attackRange,
      investedGold: config.cost,
      hp: baseHp,
      maxHp: baseHp,
      blockCapacity: blockCap,
      blockedEnemyIds: [],
      damageFlashTimer: 0,
    };

    this.placedCats.push(newCat);
    this.selectedCatId = newCat.id;
    this.listeners.onCatSelected?.(newCat);

    SoundManager.playPlaceCat();
    this.addFloatingText(`-${config.cost}g`, gridX, gridY, '#f59e0b');

    return true;
  }

  public sellCat(catId: string): boolean {
    const idx = this.placedCats.findIndex((c) => c.id === catId);
    if (idx === -1) return false;

    const cat = this.placedCats[idx];
    const config = CAT_CONFIGS[cat.tier];
    const totalCost = cat.investedGold ?? config.cost;
    const refund = Math.floor(totalCost * 0.7);

    this.placedCats.splice(idx, 1);
    this.gold += refund;
    this.listeners.onGoldChanged?.(this.gold);

    if (this.selectedCatId === catId) {
      this.selectedCatId = null;
      this.listeners.onCatSelected?.(null);
    }

    // Unblock and clear targets for any enemies
    for (const enemy of this.enemies) {
      if (enemy.blockedByCatId === catId) {
        enemy.blockedByCatId = null;
      }
      if (enemy.rangedTargetCatId === catId) {
        enemy.rangedTargetCatId = null;
      }
    }

    SoundManager.playCoin();
    this.addFloatingText(`+${refund}g`, cat.gridX, cat.gridY, '#22c55e');

    return true;
  }

  public upgradeCat(catId: string): boolean {
    const cat = this.placedCats.find((c) => c.id === catId);
    if (!cat) return false;

    if (cat.level >= MAX_CAT_LEVEL) return false;

    const levelStats = getCatLevelStats(cat.tier, cat.level);
    if (this.gold < levelStats.upgradeCost) return false;

    this.gold -= levelStats.upgradeCost;
    this.listeners.onGoldChanged?.(this.gold);

    const config = CAT_CONFIGS[cat.tier];
    cat.investedGold = (cat.investedGold ?? config.cost) + levelStats.upgradeCost;

    const nextStats = getCatLevelStats(cat.tier, cat.level + 1);
    const oldMaxHp = cat.maxHp ?? config.maxHp;
    const hpGain = nextStats.maxHp - oldMaxHp;
    const oldRange = cat.attackRange ?? config.attackRange;
    const rangeGain = nextStats.attackRange - oldRange;

    cat.level += 1;
    cat.maxHp = nextStats.maxHp;
    cat.hp = Math.min(nextStats.maxHp, (cat.hp ?? oldMaxHp) + hpGain);
    cat.damage = nextStats.damage;
    cat.attackRange = nextStats.attackRange;
    if (nextStats.healAmount !== undefined) {
      cat.healAmount = nextStats.healAmount;
    }

    // Sparkle particles for level up celebration
    for (let p = 0; p < 16; p++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 1.5 + Math.random() * 3.5;
      this.particles.push({
        x: cat.worldX * 50 + 25,
        y: cat.worldY * 50 + 25,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        color: p % 2 === 0 ? '#facc15' : '#38bdf8',
        size: 3 + Math.random() * 2.5,
        alpha: 1,
        life: 0,
        maxLife: 0.5,
      });
    }

    SoundManager.playPlaceCat();
    const rangeText = rangeGain > 0 ? `, +${rangeGain.toFixed(1)} Range` : '';
    this.addFloatingText(`Lv.${cat.level} UP! (+${hpGain} HP${rangeText})`, cat.worldX, cat.worldY - 0.4, '#facc15');

    // Notify listeners so UI updates immediately
    if (this.selectedCatId === cat.id) {
      this.listeners.onCatSelected?.({ ...cat });
    }

    return true;
  }

  public startNextWave() {
    if (this.waveInProgress || this.isGameOver) return;

    this.currentWave++;
    this.waveInProgress = true;
    this.lostLivesThisWave = false;
    this.healthAtWaveStart = this.health;
    this.currentWaveConfig = getWaveConfig(this.currentWave, this.chapter, this.fight);
    this.enemiesRemainingToSpawn = this.currentWaveConfig.enemyCount;
    this.waveSpawnRate = this.currentWaveConfig.spawnRate;
    this.spawnCooldown = 0.2; // brief pause before first enemy

    SoundManager.playWaveStart();
    this.listeners.onWaveChanged?.(this.currentWave, true);
  }

  public restartGame() {
    this.gold = INITIAL_GOLD;
    this.health = INITIAL_HEALTH;
    this.maxHealth = MAX_HEALTH;
    this.currentWave = 0;
    this.waveInProgress = false;
    this.isGameOver = false;
    this.isGameWon = false;
    this.lostLivesThisWave = false;
    this.lostLivesInFight = false;
    this.placedCats = [];
    this.enemies = [];
    this.projectiles = [];
    this.floatingTexts = [];
    this.particles = [];
    this.poisonPools = [];
    this.selectedCatId = null;
    this.listeners.onCatSelected?.(null);
    this.gameTime = 0;
    // Generate a new random path for this run
    this.generateNewPath();
    this.broadcastState();
  }

  // --- Main Tick Update ---
  public update(dt: number) {
    if (this.isGameOver) return;

    const effectiveDt = dt * this.gameSpeed;
    if (effectiveDt <= 0) return;

    // Advance simulation time scaled by gameSpeed so all game elements (enemies, cats, projectiles) move in sync
    this.gameTime += effectiveDt;

    this.updateWaveSpawning(effectiveDt);
    this.updatePoisonPools(effectiveDt);
    this.updateEnemies(effectiveDt);
    this.updateCats(effectiveDt);
    this.updateProjectiles(effectiveDt);
    this.updateFloatingTexts(effectiveDt);
    this.updateParticles(effectiveDt);
  }

  private updateWaveSpawning(dt: number) {
    if (!this.waveInProgress) return;

    if (this.enemiesRemainingToSpawn > 0) {
      this.spawnCooldown -= dt;
      if (this.spawnCooldown <= 0) {
        this.spawnEnemy();
        this.enemiesRemainingToSpawn--;
        this.spawnCooldown = 1 / this.waveSpawnRate;
      }
    } else {
      // Check if all enemies in current wave defeated
      if (this.enemies.length === 0) {
        this.onWaveCompleted();
      }
    }
  }

  private spawnEnemy() {
    const baseHealth = 26 * this.currentWaveConfig.enemyHealthMultiplier;
    const baseSpeed = 1.9 * this.currentWaveConfig.enemySpeedMultiplier;

    let enemyType: 'mouse' | 'rat' | 'boss' | 'bat' | 'mini_boss' = 'mouse';
    let hpMultiplier = 1.0;
    let speedMultiplier = 1.0;
    let gold = ENEMY_GOLD_REWARD; // 11g
    let dmgToPlayer = 1;
    let isFlying = false;

    // Boss & Mini-Boss rules:
    // - Every 5 waves: Boss spawns (even more upgraded version, heals player 1 heart on death, only spawns on path)
    // - Every 3 waves (not multiple of 5): Mini-Boss spawns (deals more damage, more HP, moves faster, only in path, cannot block other units when held)
    if (this.currentWave % 5 === 0 && this.enemiesRemainingToSpawn === 0) {
      enemyType = 'boss';
      hpMultiplier = 8.5;
      speedMultiplier = 1.05;
      gold = 105 + this.chapter * 15 + this.fight * 4;
      dmgToPlayer = 3;
      isFlying = false;
    } else if (this.currentWave % 3 === 0 && this.enemiesRemainingToSpawn === 0) {
      enemyType = 'mini_boss';
      hpMultiplier = 4.6;
      speedMultiplier = 1.30; // Moves faster than normal boss
      gold = 60 + this.chapter * 10 + this.fight * 3;
      dmgToPlayer = 2;
      isFlying = false;
    } else if (this.currentWave >= 2) {
      // In Wave 2+, spawn regular mice, rats, and flying bats
      const roll = Math.random();
      const forceBat = this.currentWave === 2 && (this.enemiesRemainingToSpawn === 4 || this.enemiesRemainingToSpawn === 1);
      if (forceBat || roll < 0.35) {
        enemyType = 'bat';
        isFlying = true;
        hpMultiplier = 1.15;
        speedMultiplier = 1.35; // Fast aerial movement
        gold = 16 + this.chapter * 2;
        dmgToPlayer = 1;
      } else if (roll < 0.72) {
        enemyType = 'rat';
        hpMultiplier = 1.85;
        speedMultiplier = 1.1;
        gold = 23 + this.chapter * 3;
        dmgToPlayer = 1;
      } else {
        enemyType = 'mouse';
        hpMultiplier = 1.0;
        speedMultiplier = 1.0;
        gold = ENEMY_GOLD_REWARD + this.chapter;
        dmgToPlayer = 1;
      }
    } else {
      enemyType = 'mouse';
      hpMultiplier = 1.0;
      speedMultiplier = 1.0;
      gold = ENEMY_GOLD_REWARD;
      dmgToPlayer = 1;
    }

    const enemyWaypoints = isFlying ? this.flyingWaypoints : this.pathWaypoints;
    const startWp = enemyWaypoints[0] || { x: -1, y: 5 };

    const enemy: EnemyInstance = {
      id: `enemy_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: enemyType,
      isFlying,
      waypoints: enemyWaypoints,
      health: Math.round(baseHealth * hpMultiplier),
      maxHealth: Math.round(baseHealth * hpMultiplier),
      moveSpeed: baseSpeed * speedMultiplier,
      goldReward: gold,
      damageToPlayer: dmgToPlayer,
      currentWaypointIndex: 1, // moving towards next waypoint
      worldX: startWp.x,
      worldY: startWp.y,
      angle: 0,
      isAlive: true,
      damageFlashTimer: 0,
      blockedByCatId: null,
      lastCatAttackTime: 0,
      lastRangedAttackTime: 0,
      attackPauseTimer: 0,
      rangedTargetCatId: null,
    };

    this.enemies.push(enemy);
  }

  private onWaveCompleted() {
    this.waveInProgress = false;
    let waveReward = BASE_WAVE_REWARD + (this.chapter - 1) * 5;
    const isFlawlessWave = !this.lostLivesThisWave && this.health === this.healthAtWaveStart;
    if (isFlawlessWave) {
      waveReward += FLAWLESS_WAVE_BONUS;
      this.addFloatingText(`✨ FLAWLESS WAVE! +${FLAWLESS_WAVE_BONUS}g`, 4.5, 3.5, '#34d399');
    }

    this.gold += waveReward;
    this.listeners.onGoldChanged?.(this.gold);
    this.listeners.onWaveChanged?.(this.currentWave, false);
    SoundManager.playCoin();

    // Check if player completed this fight or continuing endless waves
    if (!this.isEndlessMode && this.currentWave >= this.targetWaves) {
      this.isGameWon = true;
      const isFightFlawless = !this.lostLivesInFight && this.health === this.maxHealth;
      SoundManager.playVictory();
      this.listeners.onGameWon?.(isFightFlawless, this.currentWave);
    }
  }

  private updateEnemies(dt: number) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (!enemy.isAlive) {
        this.enemies.splice(i, 1);
        continue;
      }

      if (enemy.damageFlashTimer > 0) {
        enemy.damageFlashTimer -= dt;
      }

      if (enemy.chilledTimer && enemy.chilledTimer > 0) {
        enemy.chilledTimer -= dt;
      }
      if (enemy.armorReducedTimer && enemy.armorReducedTimer > 0) {
        enemy.armorReducedTimer -= dt;
      }

      const atkConfig = ENEMY_ATTACK_CONFIGS[enemy.type] || ENEMY_ATTACK_CONFIGS.mouse;

      // 1. MELEE COMBAT: advances as long as the path is clear, only attacks the Cats on the path
      if (enemy.blockedByCatId) {
        const cat = this.placedCats.find((c) => c.id === enemy.blockedByCatId);
        if (!cat || (cat.hp !== undefined && cat.hp <= 0)) {
          // Blocking cat is defeated or removed -> path becomes clear again!
          enemy.blockedByCatId = null;
        } else {
          // Path is blocked: enemy is held in place facing the cat on the path
          enemy.angle = Math.atan2(cat.worldY - enemy.worldY, cat.worldX - enemy.worldX);

          // Periodic melee attack against the blocking cat on path
          if (this.gameTime - enemy.lastCatAttackTime >= atkConfig.meleeCooldown) {
            enemy.lastCatAttackTime = this.gameTime;

            const enemyDmg = atkConfig.meleeDamage;
            cat.hp = Math.max(0, (cat.hp ?? 0) - enemyDmg);
            cat.damageFlashTimer = 0.2;

            this.addFloatingText(`-${enemyDmg}`, cat.worldX, cat.worldY - 0.25, '#ef4444');
            SoundManager.playHit();

            if ((cat.hp ?? 0) <= 0) {
              this.handleCatDeath(cat);
              enemy.blockedByCatId = null;
            }
          }
          // Held in place: do not advance down the path
          continue;
        }
      }

      // 2. MELEE INTERCEPTION: Check if an on-path Fighter or Tank can intercept this enemy
      // Flying enemies (Bats) soar through the air: Fighter and Tank Cats cannot attack them and do not stop their path!
      if (!enemy.isFlying && enemy.type !== 'bat') {
        let intercepted = false;
        for (const cat of this.placedCats) {
          if (cat.blockCapacity && (cat.hp ?? 0) > 0) {
            // Rule: "if a Cat is blocking the mini-boss, it can not block other units"
            const isHoldingBossOrMini = this.enemies.some(
              (e) => (e.type === 'mini_boss' || e.type === 'boss') && e.blockedByCatId === cat.id && e.isAlive
            );
            if (isHoldingBossOrMini) {
              // Cat is occupied blocking the mini-boss/boss; cannot block any other units!
              continue;
            }

            const distToCat = Math.hypot(enemy.worldX - cat.worldX, enemy.worldY - cat.worldY);
            // Intercept when reaching the cat's tile (within 0.65 grid units)
            if (distToCat <= 0.65) {
              const currentlyBlocked = this.enemies.filter((e) => e.blockedByCatId === cat.id && e.isAlive).length;

              if (enemy.type === 'mini_boss' || enemy.type === 'boss') {
                // Mini-boss / Boss consumes full cat capacity and can only engage an unburdened cat
                if (currentlyBlocked === 0) {
                  enemy.blockedByCatId = cat.id;
                  enemy.lastCatAttackTime = this.gameTime;
                  intercepted = true;
                  break;
                }
              } else {
                // Regular enemies can be blocked if cat has space remaining and isn't holding boss
                if (currentlyBlocked < cat.blockCapacity) {
                  enemy.blockedByCatId = cat.id;
                  enemy.lastCatAttackTime = this.gameTime;
                  intercepted = true;
                  break;
                }
              }
            }
          }
        }

        if (intercepted) {
          continue; // Intercepted this frame, halt movement
        }
      }

      // 3. RANGED ATTACK: attacks cats both in the path and outside the path
      // "they advance until a Cat is in range. When a Cat enters in range, the enemy stops for a brief moment to attack, then continues to advance, and repeats while there is a Cat in range"
      if (enemy.attackPauseTimer > 0) {
        enemy.attackPauseTimer -= dt;
        if (enemy.rangedTargetCatId) {
          const targetCat = this.placedCats.find((c) => c.id === enemy.rangedTargetCatId && (c.hp ?? 0) > 0);
          if (targetCat) {
            enemy.angle = Math.atan2(targetCat.worldY - enemy.worldY, targetCat.worldX - enemy.worldX);
          }
        }
        // Enemy is stopped for this brief moment to attack -> do not advance
        continue;
      }

      // Check if ranged attack is off cooldown
      const isRangedReady = (this.gameTime - enemy.lastRangedAttackTime) >= atkConfig.rangedCooldown;
      if (isRangedReady) {
        // Find any Cat (both in path and outside path) within ranged attack range
        let targetCat: PlacedCat | null = null;
        let minDist = Infinity;

        for (const cat of this.placedCats) {
          if ((cat.hp ?? 0) <= 0) continue;
          const dist = Math.hypot(cat.worldX - enemy.worldX, cat.worldY - enemy.worldY);
          if (dist <= atkConfig.rangedRange && dist < minDist) {
            minDist = dist;
            targetCat = cat;
          }
        }

        if (targetCat) {
          // When a Cat enters in range, the enemy stops for a brief moment to attack:
          enemy.attackPauseTimer = atkConfig.pauseDuration;
          enemy.lastRangedAttackTime = this.gameTime;
          enemy.rangedTargetCatId = targetCat.id;
          enemy.angle = Math.atan2(targetCat.worldY - enemy.worldY, targetCat.worldX - enemy.worldX);

          // Fire projectile towards the cat
          this.spawnEnemyProjectile(
            enemy,
            targetCat,
            atkConfig.rangedDamage,
            atkConfig.projColor,
            atkConfig.projSpeed
          );

          // Brief pause starts now
          continue;
        }
      }

      // 4. ADVANCE ALONG PATH: Advance towards next waypoint along the enemy's designated route!
      const enemyWaypoints = enemy.waypoints || (enemy.isFlying ? this.flyingWaypoints : this.pathWaypoints);
      if (enemy.currentWaypointIndex >= enemyWaypoints.length) {
        this.onEnemyReachedEnd(enemy);
        this.enemies.splice(i, 1);
        continue;
      }

      const targetWp = enemyWaypoints[enemy.currentWaypointIndex];
      const dx = targetWp.x - enemy.worldX;
      const dy = targetWp.y - enemy.worldY;
      const dist = Math.hypot(dx, dy);

      enemy.angle = Math.atan2(dy, dx);

      let effectiveSpeed = enemy.moveSpeed;
      if (enemy.chilledTimer && enemy.chilledTimer > 0) {
        effectiveSpeed *= (enemy.chilledSlowMultiplier ?? 0.5);
      }

      const moveDist = effectiveSpeed * dt;
      if (dist <= moveDist) {
        enemy.worldX = targetWp.x;
        enemy.worldY = targetWp.y;
        enemy.currentWaypointIndex++;
      } else {
        enemy.worldX += (dx / dist) * moveDist;
        enemy.worldY += (dy / dist) * moveDist;
      }
    }

    // Update cat blocked list runtime state for inspector / UI
    for (const cat of this.placedCats) {
      if (cat.blockCapacity !== undefined) {
        cat.blockedEnemyIds = this.enemies
          .filter((e) => e.blockedByCatId === cat.id && e.isAlive)
          .map((e) => e.id);
      }
    }
  }

  private spawnEnemyProjectile(
    enemy: EnemyInstance,
    targetCat: PlacedCat,
    damage: number,
    color: string,
    speed: number
  ) {
    const proj: ProjectileInstance = {
      id: `eproj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      startX: enemy.worldX,
      startY: enemy.worldY,
      currentX: enemy.worldX,
      currentY: enemy.worldY,
      targetCatId: targetCat.id,
      isEnemyProjectile: true,
      damage,
      speed,
      color,
      lifetime: 3.0,
      timeAlive: 0,
    };
    this.projectiles.push(proj);
    SoundManager.playShoot(0.65);
  }

  /**
   * Handles when any Cat runs out of HP from enemy attacks:
   * - Restores cost refund (30% Fighter, 15% Tank, 20% off-path classes)
   * - Plays defeat poof particles & unblocks any held enemies
   */
  private handleCatDeath(cat: PlacedCat) {
    const config = CAT_CONFIGS[cat.tier];
    const refundPercent = config.deathRefundPercent ?? (cat.catClass === 'fighter' ? 0.30 : 0.15);
    const totalCost = cat.investedGold ?? config.cost;
    const refund = Math.round(totalCost * refundPercent);

    this.gold += refund;
    this.listeners.onGoldChanged?.(this.gold);

    this.addFloatingText(`+${refund}g Refund!`, cat.worldX, cat.worldY - 0.4, '#f59e0b');
    SoundManager.playCoin();

    // Defeat smoke particles
    for (let p = 0; p < 12; p++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 1.0 + Math.random() * 2.2;
      this.particles.push({
        x: cat.worldX * 50 + 25,
        y: cat.worldY * 50 + 25,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        color: '#94a3b8',
        size: 3 + Math.random() * 3,
        alpha: 1,
        life: 0,
        maxLife: 0.5,
      });
    }

    // Remove from placed cats
    const idx = this.placedCats.findIndex((c) => c.id === cat.id);
    if (idx !== -1) {
      this.placedCats.splice(idx, 1);
    }

    if (this.selectedCatId === cat.id) {
      this.selectedCatId = null;
      this.listeners.onCatSelected?.(null);
    }

    // Unblock any enemies held by this cat and clear ranged targets
    for (const enemy of this.enemies) {
      if (enemy.blockedByCatId === cat.id) {
        enemy.blockedByCatId = null;
      }
      if (enemy.rangedTargetCatId === cat.id) {
        enemy.rangedTargetCatId = null;
      }
    }
  }

  private onEnemyReachedEnd(enemy: EnemyInstance) {
    this.lostLivesThisWave = true;
    this.lostLivesInFight = true;
    this.health = Math.max(0, this.health - enemy.damageToPlayer);
    this.listeners.onHealthChanged?.(this.health, this.maxHealth);
    SoundManager.playDamageTaken();

    if (this.health <= 0) {
      this.isGameOver = true;
      SoundManager.playGameOver();
      this.listeners.onGameOver?.();
    }
  }

  private updateCats(dt: number) {
    for (const cat of this.placedCats) {
      if (cat.damageFlashTimer && cat.damageFlashTimer > 0) {
        cat.damageFlashTimer -= dt;
      }
      if (cat.windBlessTimer && cat.windBlessTimer > 0) {
        cat.windBlessTimer -= dt;
      }
      if (cat.firePowerTimer && cat.firePowerTimer > 0) {
        cat.firePowerTimer -= dt;
      }

      const config = CAT_CONFIGS[cat.tier];
      const catCenterX = cat.worldX;
      const catCenterY = cat.worldY;

      // Effective attack speed (scaled by Bless of the Wind buff)
      const effectiveAttackSpeed = config.attackSpeed * (cat.windBlessTimer && cat.windBlessTimer > 0 ? 1.6 : 1.0);
      const actionInterval = 1 / effectiveAttackSpeed;

      // 1. PRIEST CLASS: Ally Healer
      if (config.catClass === 'priest') {
        // The priest should not heal an ally if the wave is not active
        if (!this.waveInProgress) {
          continue;
        }

        const catRange = cat.attackRange ?? config.attackRange;

        if (this.gameTime - cat.lastAttackTime >= actionInterval) {
          // Find damaged allies within heal range
          const damagedAllies = this.placedCats.filter((other) => {
            if (other.id === cat.id) return false;
            if (other.hp === undefined || other.maxHp === undefined) return false;
            if (other.hp >= other.maxHp) return false;
            const dist = Math.hypot(other.worldX - catCenterX, other.worldY - catCenterY);
            return dist <= catRange;
          });

          if (damagedAllies.length > 0) {
            // Heal the ally with the lowest health percentage
            damagedAllies.sort((a, b) => (a.hp! / a.maxHp!) - (b.hp! / b.maxHp!));
            
            const targetsToHeal = [damagedAllies[0]];
            try {
              const profile = getPlayerProfile();
              if (profile.purchasedItems?.includes('angelic-feather') && damagedAllies.length > 1) {
                targetsToHeal.push(damagedAllies[1]);
              }
            } catch {
              // ignore
            }

            const healAmount = cat.healAmount ?? config.healAmount ?? 35;
            cat.lastAttackTime = this.gameTime;
            cat.angle = Math.atan2(targetsToHeal[0].worldY - catCenterY, targetsToHeal[0].worldX - catCenterX);
            SoundManager.playHeal();

            for (const targetAlly of targetsToHeal) {
              targetAlly.hp = Math.min(targetAlly.maxHp!, targetAlly.hp! + healAmount);
              cat.totalHealingDone = (cat.totalHealingDone || 0) + healAmount;
              this.addFloatingText(`+${healAmount} HP`, targetAlly.worldX, targetAlly.worldY - 0.35, '#4ade80');

              // Divine heal particles
              for (let p = 0; p < 8; p++) {
                const ang = Math.random() * Math.PI * 2;
                this.particles.push({
                  x: targetAlly.worldX * 50 + 25,
                  y: targetAlly.worldY * 50 + 25,
                  vx: Math.cos(ang) * 1.5,
                  vy: -1.2 - Math.random() * 2.0,
                  color: p % 2 === 0 ? '#4ade80' : '#fef08a',
                  size: 3 + Math.random() * 2,
                  alpha: 1,
                  life: 0,
                  maxLife: 0.5,
                });
              }
            }
          }
        }
        continue;
      }

      // 2. SORCERER CLASS: Alternates between Buffs to allies and Debuffs to enemies
      if (config.catClass === 'sorcerer') {
        // The Sorcerer should only apply buffs to ally cats when the wave is active
        if (!this.waveInProgress) {
          continue;
        }

        const catRange = cat.attackRange ?? config.attackRange;

        if (this.gameTime - cat.lastAttackTime >= actionInterval) {
          const alliesInRange = this.placedCats.filter((other) => {
            if (other.id === cat.id) return false;
            const dist = Math.hypot(other.worldX - catCenterX, other.worldY - catCenterY);
            return dist <= catRange;
          });

          const enemiesInRange = this.enemies.filter((enemy) => {
            if (!enemy.isAlive) return false;
            const dist = Math.hypot(enemy.worldX - catCenterX, enemy.worldY - catCenterY);
            return dist <= catRange;
          });

          let currentStep = cat.sorcererCycleStep ?? 0;
          const isAllyStep = currentStep % 2 === 0;
          let shouldCastAlly = isAllyStep;

          // The Sorcerer should only apply buffs to ally cats when the wave is active
          if (shouldCastAlly && !this.waveInProgress) {
            continue;
          }

          // Smart fallback if target group isn't present
          if (shouldCastAlly && alliesInRange.length === 0 && (enemiesInRange.length > 0 || this.pathCells.size > 0)) {
            shouldCastAlly = false;
            currentStep = currentStep === 0 ? 1 : 3;
          } else if (!shouldCastAlly && enemiesInRange.length === 0 && alliesInRange.length > 0) {
            if (!this.waveInProgress) continue;
            shouldCastAlly = true;
            currentStep = currentStep === 1 ? 2 : 0;
          }

          if (shouldCastAlly && alliesInRange.length > 0) {
            // Buff an ally (Bless of the Wind or Fire Power)
            alliesInRange.sort((a, b) => {
              const timerA = currentStep === 0 ? (a.windBlessTimer ?? 0) : (a.firePowerTimer ?? 0);
              const timerB = currentStep === 0 ? (b.windBlessTimer ?? 0) : (b.firePowerTimer ?? 0);
              return timerA - timerB;
            });
            const targetAlly = alliesInRange[0];
            cat.angle = Math.atan2(targetAlly.worldY - catCenterY, targetAlly.worldX - catCenterX);
            cat.lastAttackTime = this.gameTime;

            if (currentStep === 0) {
              // Bless of the Wind: +60% attack speed
              targetAlly.windBlessTimer = 6.5;
              this.addFloatingText('💨 Wind Bless! +Spd', targetAlly.worldX, targetAlly.worldY - 0.35, '#38bdf8');
              SoundManager.playBuff();
              for (let p = 0; p < 10; p++) {
                const ang = Math.random() * Math.PI * 2;
                this.particles.push({
                  x: targetAlly.worldX * 50 + 25,
                  y: targetAlly.worldY * 50 + 25,
                  vx: Math.cos(ang) * 2.2,
                  vy: Math.sin(ang) * 2.2,
                  color: '#38bdf8',
                  size: 2.5 + Math.random() * 2,
                  alpha: 1,
                  life: 0,
                  maxLife: 0.45,
                });
              }
            } else {
              // Fire Power: +60% damage
              targetAlly.firePowerTimer = 6.5;
              this.addFloatingText('🔥 Fire Power! +Dmg', targetAlly.worldX, targetAlly.worldY - 0.35, '#f97316');
              SoundManager.playBuff();
              for (let p = 0; p < 10; p++) {
                const ang = Math.random() * Math.PI * 2;
                this.particles.push({
                  x: targetAlly.worldX * 50 + 25,
                  y: targetAlly.worldY * 50 + 25,
                  vx: Math.cos(ang) * 2.0,
                  vy: -1.2 - Math.random() * 2.0,
                  color: p % 2 === 0 ? '#ea580c' : '#facc15',
                  size: 3 + Math.random() * 2,
                  alpha: 1,
                  life: 0,
                  maxLife: 0.5,
                });
              }
            }
            cat.sorcererCycleStep = (currentStep + 1) % 4;
          } else if (!shouldCastAlly && (enemiesInRange.length > 0 || this.pathCells.size > 0)) {
            // Debuff enemies (Poison Pool or Cool Breeze)
            cat.lastAttackTime = this.gameTime;
            if (currentStep === 1) {
              // Poison Pool: creates acid pool on path damaging & reducing armor
              let poolX = catCenterX;
              let poolY = catCenterY;
              if (enemiesInRange.length > 0) {
                poolX = enemiesInRange[0].worldX;
                poolY = enemiesInRange[0].worldY;
              } else {
                for (const key of this.pathCells) {
                  const [px, py] = key.split(',').map(Number);
                  if (Math.hypot(px - catCenterX, py - catCenterY) <= catRange) {
                    poolX = px;
                    poolY = py;
                    break;
                  }
                }
              }

              cat.angle = Math.atan2(poolY - catCenterY, poolX - catCenterX);
              this.poisonPools.push({
                id: `pool_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                worldX: poolX,
                worldY: poolY,
                radius: 0.95,
                duration: 6.0,
                maxDuration: 6.0,
                damagePerSec: 14,
                armorReduction: 1.4,
                lastTickTime: this.gameTime,
              });

              SoundManager.playAcidPool();
              this.addFloatingText('🧪 Poison Pool!', poolX, poolY - 0.35, '#84cc16');

              for (let p = 0; p < 12; p++) {
                const ang = Math.random() * Math.PI * 2;
                this.particles.push({
                  x: poolX * 50 + 25,
                  y: poolY * 50 + 25,
                  vx: Math.cos(ang) * 1.5,
                  vy: Math.sin(ang) * 1.5,
                  color: '#a3e635',
                  size: 3 + Math.random() * 2,
                  alpha: 1,
                  life: 0,
                  maxLife: 0.5,
                });
              }
            } else {
              // Cool Breeze: reduces enemies movement speed by 50%
              if (enemiesInRange.length > 0) {
                cat.angle = Math.atan2(enemiesInRange[0].worldY - catCenterY, enemiesInRange[0].worldX - catCenterX);
                for (const enemy of enemiesInRange.slice(0, 4)) {
                  enemy.chilledTimer = 5.0;
                  enemy.chilledSlowMultiplier = 0.5;
                  this.addFloatingText('❄️ Cool Breeze! -Spd', enemy.worldX, enemy.worldY - 0.25, '#7dd3fc');
                }
                SoundManager.playDebuff();
                for (let p = 0; p < 14; p++) {
                  const ang = Math.random() * Math.PI * 2;
                  this.particles.push({
                    x: enemiesInRange[0].worldX * 50 + 25,
                    y: enemiesInRange[0].worldY * 50 + 25,
                    vx: Math.cos(ang) * 2.5,
                    vy: Math.sin(ang) * 2.5,
                    color: '#bae6fd',
                    size: 2.5 + Math.random() * 2,
                    alpha: 1,
                    life: 0,
                    maxLife: 0.5,
                  });
                }
              }
            }
            cat.sorcererCycleStep = (currentStep + 1) % 4;
          }
        }
        continue;
      }

      // 3. COMBAT CATS (Fighter, Tank, Ranger, Mage, Assassin)
      let targetEnemy: EnemyInstance | null = null;
      const catRange = cat.attackRange ?? config.attackRange;

      if (config.catClass === 'fighter' || config.catClass === 'tank') {
        // Fighters & Tanks:
        // "will attack only what's in 'front of them' or in the same cell as them"
        // CANNOT attack flying enemies (Bats) and do not stop their path!
        const facingAngle = cat.facingAngle ?? cat.angle;
        const fx = Math.cos(facingAngle);
        const fy = Math.sin(facingAngle);

        const candidates = this.enemies.filter((enemy) => {
          if (!enemy.isAlive) return false;
          // Flying enemies (Bat) cannot be attacked by Fighter or Tank Cats
          if (enemy.isFlying || enemy.type === 'bat') return false;

          const dx = enemy.worldX - catCenterX;
          const dy = enemy.worldY - catCenterY;
          const dist = Math.hypot(dx, dy);
          if (dist > catRange) return false;

          // Same cell check
          if (dist <= 0.75) return true;

          // In front check (dot product with facing direction > 0)
          const dot = dx * fx + dy * fy;
          return dot > 0;
        });

        if (candidates.length > 0) {
          // Prioritize blocked enemies held by this cat, then closest
          candidates.sort((a, b) => {
            const aBlocked = a.blockedByCatId === cat.id ? 1 : 0;
            const bBlocked = b.blockedByCatId === cat.id ? 1 : 0;
            if (bBlocked !== aBlocked) return bBlocked - aBlocked;
            const distA = Math.hypot(a.worldX - catCenterX, a.worldY - catCenterY);
            const distB = Math.hypot(b.worldX - catCenterX, b.worldY - catCenterY);
            return distA - distB;
          });
          targetEnemy = candidates[0];
        }
      } else if (config.catClass === 'assassin') {
        // Assassin:
        // "Targets the enemy with the lowest health in its range, can only target one enemy at a time"
        const candidates = this.enemies.filter((enemy) => {
          if (!enemy.isAlive) return false;
          const dist = Math.hypot(enemy.worldX - catCenterX, enemy.worldY - catCenterY);
          return dist <= catRange;
        });

        if (candidates.length > 0) {
          candidates.sort((a, b) => a.health - b.health);
          targetEnemy = candidates[0];
        }
      } else {
        // Ranger & Mage:
        // "targets the first enemy to enter their range and continues attacking it until it dies or leaves their range, changing target to the one closest to leaving their range"

        // 1. Maintain sticky target if still alive and in range
        if (cat.targetEnemyId) {
          const existing = this.enemies.find((e) => e.id === cat.targetEnemyId && e.isAlive);
          if (existing) {
            const dist = Math.hypot(existing.worldX - catCenterX, existing.worldY - catCenterY);
            if (dist <= catRange) {
              targetEnemy = existing;
            }
          }
        }

        // 2. Select target closest to leaving range (furthest along path)
        if (!targetEnemy) {
          const candidates = this.enemies.filter((enemy) => {
            if (!enemy.isAlive) return false;
            const dist = Math.hypot(enemy.worldX - catCenterX, enemy.worldY - catCenterY);
            return dist <= catRange;
          });

          if (candidates.length > 0) {
            candidates.sort((a, b) => {
              if (b.currentWaypointIndex !== a.currentWaypointIndex) {
                return b.currentWaypointIndex - a.currentWaypointIndex;
              }
              const wpsA = a.waypoints || (a.isFlying ? this.flyingWaypoints : this.pathWaypoints);
              const wpsB = b.waypoints || (b.isFlying ? this.flyingWaypoints : this.pathWaypoints);
              const nextWpA = wpsA[a.currentWaypointIndex] || { x: 0, y: 0 };
              const nextWpB = wpsB[b.currentWaypointIndex] || { x: 0, y: 0 };
              const distA = Math.hypot(nextWpA.x - a.worldX, nextWpA.y - a.worldY);
              const distB = Math.hypot(nextWpB.x - b.worldX, nextWpB.y - b.worldY);
              return distA - distB;
            });
            targetEnemy = candidates[0];
          }
        }
      }

      if (targetEnemy) {
        cat.targetEnemyId = targetEnemy.id;
        cat.angle = Math.atan2(targetEnemy.worldY - catCenterY, targetEnemy.worldX - catCenterX);

        // Attack cooldown check using gameTime (synchronized with game speed)
        if (this.gameTime - cat.lastAttackTime >= actionInterval) {
          cat.lastAttackTime = this.gameTime;
          this.spawnProjectile(cat, targetEnemy);
        }
      } else {
        cat.targetEnemyId = null;
        if (cat.facingAngle !== undefined) {
          cat.angle = cat.facingAngle;
        }
      }
    }
  }

  private updatePoisonPools(dt: number) {
    for (let i = this.poisonPools.length - 1; i >= 0; i--) {
      const pool = this.poisonPools[i];
      pool.duration -= dt;
      if (pool.duration <= 0) {
        this.poisonPools.splice(i, 1);
        continue;
      }

      // Ambient acid bubble particles
      if (Math.random() < 0.3) {
        const offsetAng = Math.random() * Math.PI * 2;
        const offsetR = Math.random() * pool.radius * 0.65;
        this.particles.push({
          x: (pool.worldX + Math.cos(offsetAng) * offsetR) * 50 + 25,
          y: (pool.worldY + Math.sin(offsetAng) * offsetR) * 50 + 25,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -0.8 - Math.random() * 0.8,
          color: Math.random() > 0.5 ? '#84cc16' : '#a3e635',
          size: 1.5 + Math.random() * 2,
          alpha: 0.85,
          life: 0,
          maxLife: 0.4,
        });
      }

      // Damage & reduce armor of ground enemies standing in the pool
      for (const enemy of this.enemies) {
        if (!enemy.isAlive || enemy.isFlying) continue; // Flying bats hover above ground acid pools
        const dist = Math.hypot(enemy.worldX - pool.worldX, enemy.worldY - pool.worldY);
        if (dist <= pool.radius) {
          // Acid pool reduces armor and makes them take extra damage
          enemy.armorReducedTimer = 4.0;
          enemy.armorVulnerabilityMultiplier = pool.armorReduction;

          // Periodic acid damage tick (every 0.5s)
          if (!enemy.acidTickCooldown || enemy.acidTickCooldown <= 0) {
            const acidDmg = Math.round(pool.damagePerSec * 0.5);
            this.applyDamageToEnemy(enemy, acidDmg, '#84cc16', false);
            enemy.acidTickCooldown = 0.5;
          }
        }
      }
    }

    // Decrement acid tick timers
    for (const enemy of this.enemies) {
      if (enemy.acidTickCooldown && enemy.acidTickCooldown > 0) {
        enemy.acidTickCooldown -= dt;
      }
    }
  }

  private spawnProjectile(cat: PlacedCat, target: EnemyInstance) {
    // Ensure the cat faces the enemy it is attacking
    cat.angle = Math.atan2(target.worldY - cat.worldY, target.worldX - cat.worldX);
    cat.targetEnemyId = target.id;

    const config = CAT_CONFIGS[cat.tier];
    const baseDamage = cat.damage ?? config.damage;
    let damage = baseDamage;
    let isCrit = false;

    // Fire Power buff (+60% damage)
    if (cat.firePowerTimer && cat.firePowerTimer > 0) {
      damage = Math.round(damage * 1.6);
      isCrit = true;
    }

    // Assassin execute scaling: gets increasingly higher the less health the enemy has
    if (config.catClass === 'assassin') {
      const missingHealthRatio = Math.max(0, 1 - target.health / target.maxHealth);
      const multiplier = 1 + missingHealthRatio * (config.executeMultiplier || 2.5);
      damage = Math.round(baseDamage * multiplier * (cat.firePowerTimer && cat.firePowerTimer > 0 ? 1.6 : 1.0));
      isCrit = missingHealthRatio >= 0.35 || (cat.firePowerTimer !== undefined && cat.firePowerTimer > 0);
    }

    const proj: ProjectileInstance = {
      id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      startX: cat.worldX,
      startY: cat.worldY,
      currentX: cat.worldX,
      currentY: cat.worldY,
      targetEnemyId: target.id,
      damage,
      speed: config.projectileSpeed,
      color: cat.firePowerTimer && cat.firePowerTimer > 0 ? '#f97316' : config.projectileColor,
      lifetime: 3.5,
      timeAlive: 0,
      isAoE: config.catClass === 'mage',
      splashRadius: config.splashRadius || 1.4,
      isCrit,
    };

    this.projectiles.push(proj);
    SoundManager.playShoot(
      config.catClass === 'tank' ? 0.7 :
      config.catClass === 'fighter' ? 1.05 :
      config.catClass === 'mage' ? 0.9 :
      config.catClass === 'assassin' ? 1.45 : 1.3
    );
  }

  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.timeAlive += dt;

      if (proj.timeAlive >= proj.lifetime) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // 1. Enemy Projectile targeting a Cat (in path or outside path)
      if (proj.isEnemyProjectile && proj.targetCatId) {
        const cat = this.placedCats.find((c) => c.id === proj.targetCatId && (c.hp ?? 0) > 0);
        if (!cat) {
          // Target cat defeated or sold
          this.projectiles.splice(i, 1);
          continue;
        }

        const dx = cat.worldX - proj.currentX;
        const dy = cat.worldY - proj.currentY;
        const dist = Math.hypot(dx, dy);

        const step = proj.speed * dt;
        if (dist <= step || dist < 0.25) {
          // Hit the cat!
          this.onEnemyProjectileHit(proj, cat);
          this.projectiles.splice(i, 1);
        } else {
          proj.currentX += (dx / dist) * step;
          proj.currentY += (dy / dist) * step;
        }
        continue;
      }

      // 2. Ally Cat Projectile targeting an Enemy
      const target = this.enemies.find((e) => e.id === proj.targetEnemyId && e.isAlive);
      if (!target) {
        // Target died or removed
        this.projectiles.splice(i, 1);
        continue;
      }

      // Move toward target
      const dx = target.worldX - proj.currentX;
      const dy = target.worldY - proj.currentY;
      const dist = Math.hypot(dx, dy);

      const step = proj.speed * dt;
      if (dist <= step || dist < 0.25) {
        // Hit!
        this.onProjectileHit(proj, target);
        this.projectiles.splice(i, 1);
      } else {
        proj.currentX += (dx / dist) * step;
        proj.currentY += (dy / dist) * step;
      }
    }
  }

  private onEnemyProjectileHit(proj: ProjectileInstance, cat: PlacedCat) {
    cat.hp = Math.max(0, (cat.hp ?? 0) - proj.damage);
    cat.damageFlashTimer = 0.2;

    this.addFloatingText(`-${proj.damage}`, cat.worldX, cat.worldY - 0.25, '#ef4444');
    SoundManager.playHit();

    // Red impact sparks
    for (let p = 0; p < 6; p++) {
      const ang = Math.random() * Math.PI * 2;
      this.particles.push({
        x: cat.worldX * 50 + 25,
        y: cat.worldY * 50 + 25,
        vx: Math.cos(ang) * 1.5,
        vy: Math.sin(ang) * 1.5,
        color: '#ef4444',
        size: 2.5 + Math.random() * 2,
        alpha: 1,
        life: 0,
        maxLife: 0.35,
      });
    }

    if ((cat.hp ?? 0) <= 0) {
      this.handleCatDeath(cat);
    }
  }

  private onProjectileHit(proj: ProjectileInstance, enemy: EnemyInstance) {
    // 1. Damage primary target
    this.applyDamageToEnemy(enemy, proj.damage, proj.color, proj.isCrit);

    // 2. Mage Area of Effect (AoE) splash
    if (proj.isAoE && proj.splashRadius) {
      let splashRadius = proj.splashRadius;
      try {
        const profile = getPlayerProfile();
        if (profile.purchasedItems?.includes('arcane-orb')) {
          splashRadius *= 1.30;
        }
      } catch {
        // ignore
      }

      // Arcane ring particles on explosion
      for (let p = 0; p < 10; p++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 1.0 + Math.random() * 2.5;
        this.particles.push({
          x: enemy.worldX * 50 + 25,
          y: enemy.worldY * 50 + 25,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          color: '#c084fc',
          size: 3 + Math.random() * 2,
          alpha: 1,
          life: 0,
          maxLife: 0.45,
        });
      }

      // Splash damage to nearby enemies
      for (const other of this.enemies) {
        if (other.id === enemy.id || !other.isAlive) continue;
        const dist = Math.hypot(other.worldX - enemy.worldX, other.worldY - enemy.worldY);
        if (dist <= splashRadius) {
          this.applyDamageToEnemy(other, Math.round(proj.damage * 0.8), '#a855f7', false);
        }
      }
    }
  }

  private applyDamageToEnemy(enemy: EnemyInstance, damage: number, color: string, isCrit: boolean = false) {
    if (!enemy.isAlive) return;

    let finalDamage = damage;
    const hasArmorReduced = (enemy.armorReducedTimer ?? 0) > 0;
    if (hasArmorReduced) {
      finalDamage = Math.round(damage * (enemy.armorVulnerabilityMultiplier ?? 1.4));
    }

    enemy.health -= finalDamage;
    enemy.damageFlashTimer = 0.14;

    SoundManager.playHit();
    const text = isCrit
      ? `CRIT! -${finalDamage}`
      : hasArmorReduced
      ? `-${finalDamage} (Acid)`
      : `-${finalDamage}`;
    const textColor = isCrit ? '#fb7185' : hasArmorReduced ? '#a3e635' : '#f87171';
    this.addFloatingText(text, enemy.worldX, enemy.worldY - 0.2, textColor);
    this.spawnHitParticles(enemy.worldX, enemy.worldY, hasArmorReduced ? '#84cc16' : color);

    if (enemy.health <= 0 && enemy.isAlive) {
      enemy.isAlive = false;
      this.gold += enemy.goldReward;
      this.listeners.onGoldChanged?.(this.gold);

      // Boss Defeat Reward: heals player 1 heart!
      if (enemy.type === 'boss') {
        if (this.health < this.maxHealth) {
          this.health = Math.min(this.maxHealth, this.health + 1);
          this.listeners.onHealthChanged?.(this.health, this.maxHealth);
          this.addFloatingText('+1 ❤️ HEALED!', enemy.worldX, enemy.worldY - 0.7, '#ec4899');
          SoundManager.playHeal();
        }
      }

      SoundManager.playCoin();
      this.addFloatingText(`+${enemy.goldReward}g`, enemy.worldX, enemy.worldY - 0.4, '#facc15');
      this.spawnDeathParticles(enemy.worldX, enemy.worldY);
    }
  }

  private addFloatingText(text: string, worldX: number, worldY: number, color: string) {
    this.floatingTexts.push({
      id: Math.random().toString(),
      text,
      worldX,
      worldY,
      color,
      age: 0,
      maxAge: 0.8,
    });
  }

  private updateFloatingTexts(dt: number) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.age += dt;
      if (ft.age >= ft.maxAge) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  private spawnHitParticles(worldX: number, worldY: number, color: string) {
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3.5;
      this.particles.push({
        x: worldX * 50 + 25,
        y: worldY * 50 + 25,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 2 + Math.random() * 2,
        alpha: 1,
        life: 0,
        maxLife: 0.35,
      });
    }
  }

  private spawnDeathParticles(worldX: number, worldY: number) {
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4.5;
      this.particles.push({
        x: worldX * 50 + 25,
        y: worldY * 50 + 25,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: i % 2 === 0 ? '#facc15' : '#ef4444',
        size: 3 + Math.random() * 2.5,
        alpha: 1,
        life: 0,
        maxLife: 0.5,
      });
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx;
      p.y += p.vy;
      p.alpha = 1 - p.life / p.maxLife;
    }
  }

  // Getters
  public getGold(): number {
    return this.gold;
  }
  public getHealth(): number {
    return this.health;
  }
  public getMaxHealth(): number {
    return this.maxHealth;
  }
  public getCurrentWave(): number {
    return this.currentWave;
  }
  public isWaveRunning(): boolean {
    return this.waveInProgress;
  }
  public getIsGameWon(): boolean {
    return this.isGameWon;
  }
  public getSelectedCat(): PlacedCat | null {
    if (!this.selectedCatId) return null;
    return this.placedCats.find((c) => c.id === this.selectedCatId) || null;
  }
}
