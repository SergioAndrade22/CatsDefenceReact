import { describe, expect, it } from 'vitest';
import {
  CAT_CONFIGS,
  DEFAULT_PATH_WAYPOINTS,
  GRID_COLS,
  GRID_ROWS,
  getCatLevelStats,
  getWaveConfig,
  generateFlyingPath,
  generateObstacles,
  generateRandomPath,
  isRangedCat,
} from './constants';

describe('cat configuration and progression', () => {
  it('identifies ranged cat classes', () => {
    expect(isRangedCat('ranger')).toBe(true);
    expect(isRangedCat('mage')).toBe(true);
    expect(isRangedCat('fighter')).toBe(false);
    expect(isRangedCat('tank')).toBe(false);
  });

  it('scales cat stats and upgrade costs by level', () => {
    const levelOne = getCatLevelStats(1, 1);
    const levelThree = getCatLevelStats(1, 3);
    const maxLevel = getCatLevelStats(1, 5);

    expect(levelOne.maxHp).toBe(CAT_CONFIGS[1].maxHp);
    expect(levelThree.maxHp).toBeGreaterThan(levelOne.maxHp);
    expect(levelOne.upgradeCost).toBe(Math.round(CAT_CONFIGS[1].cost * 0.6));
    expect(maxLevel.upgradeCost).toBe(0);
    expect(maxLevel.nextHp).toBeUndefined();
  });

  it('increases ranged attack range at odd level milestones', () => {
    const levelOne = getCatLevelStats(3, 1);
    const levelTwo = getCatLevelStats(3, 2);
    const levelThree = getCatLevelStats(3, 3);

    expect(levelTwo.attackRange).toBe(levelOne.attackRange);
    expect(levelThree.attackRange).toBeGreaterThan(levelTwo.attackRange);
  });
});

describe('wave configuration', () => {
  it('scales waves from their wave number', () => {
    expect(getWaveConfig(1)).toEqual({
      waveNumber: 1,
      enemyCount: 4 + 1 * 2 + Math.floor(1 * 0.7),
      spawnRate: 0.5,
      enemyHealthMultiplier: 0.85,
      enemySpeedMultiplier: 0.95,
    });
    expect(getWaveConfig(3).enemyCount).toBe(10);
  });

  it('scales waves by chapter and fight progression', () => {
    const wave = getWaveConfig(5);
    const harderWave = getWaveConfig(5, 2, 3);

    expect(wave.waveNumber).toBe(5);
    expect(wave.enemyCount).toBe(14);
    expect(harderWave.enemyCount).toBeGreaterThan(wave.enemyCount);
    expect(harderWave.enemyHealthMultiplier).toBeGreaterThan(wave.enemyHealthMultiplier);
  });
});

describe('path and obstacle generation', () => {
  it('generates paths with grid-edge entry and exit points', () => {
    const path = generateRandomPath();
    const start = path[0];
    const end = path[path.length - 1];

    expect(path.length).toBeGreaterThanOrEqual(4);
    expect(start.x === -1 || start.x === GRID_COLS || start.y === -1 || start.y === GRID_ROWS).toBe(true);
    expect(end.x === -1 || end.x === GRID_COLS || end.y === -1 || end.y === GRID_ROWS).toBe(true);
  });

  it('creates a fallback flying path for insufficient ground paths', () => {
    const path = generateFlyingPath([]);

    expect(path).toHaveLength(3);
    expect(path[0]).toEqual({ x: 2, y: -1 });
    expect(path[2]).toEqual({ x: 8, y: -1 });
  });

  it('places obstacles within the grid and away from the default path', () => {
    const obstacles = generateObstacles(DEFAULT_PATH_WAYPOINTS);

    expect(obstacles.length).toBeGreaterThanOrEqual(6);
    expect(obstacles.length).toBeLessThanOrEqual(9);
    for (const obstacle of obstacles) {
      expect(obstacle.gridX).toBeGreaterThanOrEqual(0);
      expect(obstacle.gridX).toBeLessThan(GRID_COLS);
      expect(obstacle.gridY).toBeGreaterThanOrEqual(0);
      expect(obstacle.gridY).toBeLessThan(GRID_ROWS);
      expect(['rock', 'tree']).toContain(obstacle.type);
    }
  });
});
