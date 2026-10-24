import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CAT_CONFIGS, getCatLevelStats } from './constants';
import { GameEngine } from './engine';

vi.mock('./audio', () => ({
  SoundManager: {
    playAcidPool: vi.fn(),
    playBuff: vi.fn(),
    playClearTerrain: vi.fn(),
    playCoin: vi.fn(),
    playDamageTaken: vi.fn(),
    playDebuff: vi.fn(),
    playGameOver: vi.fn(),
    playHeal: vi.fn(),
    playHit: vi.fn(),
    playPlaceCat: vi.fn(),
    playShoot: vi.fn(),
    playVictory: vi.fn(),
    playWaveStart: vi.fn(),
  },
}));

vi.mock('./playerStorage', () => ({
  getPlayerProfile: vi.fn(() => ({ purchasedItems: [] })),
  getWavesForFight: vi.fn(() => 3),
}));

function findCell(engine: GameEngine, path: boolean): [number, number] {
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
      const cell = `${x},${y}`;
      if (engine.pathCells.has(cell) === path && !engine.obstacleCells.has(cell)) return [x, y];
    }
  }
  throw new Error(`No ${path ? 'path' : 'off-path'} cell found`);
}

describe('GameEngine placement and progression', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine();
  });

  it('allows on-path cats only on path cells and ranged cats off the path', () => {
    const [pathX, pathY] = findCell(engine, true);
    const [grassX, grassY] = findCell(engine, false);

    expect(engine.canPlaceCat(1, pathX, pathY)).toBe(true);
    expect(engine.canPlaceCat(1, grassX, grassY)).toBe(false);
    expect(engine.canPlaceCat(3, grassX, grassY)).toBe(true);
    expect(engine.canPlaceCat(3, pathX, pathY)).toBe(false);
    expect(engine.canPlaceCat(3, -1, grassY)).toBe(false);
  });

  it('places a cat, charges its cost, and rejects an occupied cell', () => {
    const [x, y] = findCell(engine, true);
    const listener = vi.fn();
    engine.setListeners({ onGoldChanged: listener });

    expect(engine.placeCat(1, x, y)).toBe(true);
    expect(engine.placedCats).toHaveLength(1);
    expect(engine.placedCats[0].hp).toBe(CAT_CONFIGS[1].maxHp);
    expect(listener).toHaveBeenLastCalledWith(150 - CAT_CONFIGS[1].cost);
    expect(engine.placeCat(1, x, y)).toBe(false);
  });

  it('upgrades and sells a placed cat with the expected gold effects', () => {
    const [x, y] = findCell(engine, true);
    engine.placeCat(1, x, y);
    const cat = engine.placedCats[0];
    const upgradeCost = getCatLevelStats(1, 1).upgradeCost;

    expect(engine.upgradeCat(cat.id)).toBe(true);
    expect(cat.level).toBe(2);
    expect(cat.maxHp).toBe(getCatLevelStats(1, 2).maxHp);
    expect(engine.sellCat(cat.id)).toBe(true);
    expect(engine.placedCats).toHaveLength(0);
    expect(engine.sellCat('missing')).toBe(false);
    expect(upgradeCost).toBeGreaterThan(0);
  });

  it('clears an obstacle, unblocks its cell, and increases the next cost', () => {
    const obstacle = engine.obstacles[0];
    const firstCost = engine.getClearObstacleCost();

    expect(engine.clearObstacle(obstacle.id)).toBe(true);
    expect(engine.obstacles).not.toContain(obstacle);
    expect(engine.obstacleCells.has(`${obstacle.gridX},${obstacle.gridY}`)).toBe(false);
    expect(engine.getClearedObstaclesCount()).toBe(1);
    expect(engine.getClearObstacleCost()).toBe(firstCost + 15);
    expect(engine.clearObstacle(obstacle.id)).toBe(false);
  });

  it('starts a wave and spawns an enemy during update', () => {
    const listener = vi.fn();
    engine.setListeners({ onWaveChanged: listener });
    engine.startNextWave();

    expect(listener).toHaveBeenLastCalledWith(1, true);
    engine.update(0.21);

    expect(engine.enemies).toHaveLength(1);
    expect(engine.enemies[0].type).toBe('mouse');
    expect(engine.enemies[0].isAlive).toBe(true);
  });
});
