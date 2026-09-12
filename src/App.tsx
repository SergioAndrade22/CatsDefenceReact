import { useState, useEffect, useMemo, useCallback } from 'react';
import { GameEngine } from './game/engine';
import { CatTier, Obstacle, PlacedCat } from './types';
import { HUD } from './components/HUD';
import { GameBoard } from './components/GameBoard';
import { CatShop } from './components/CatShop';
import { CatInspector } from './components/CatInspector';
import { ObstacleInspector } from './components/ObstacleInspector';
import { GameOverModal } from './components/GameOverModal';

export function App() {
  const engine = useMemo(() => new GameEngine(), []);

  // React state synced with engine
  const [gold, setGold] = useState(engine.getGold());
  const [health, setHealth] = useState(engine.getHealth());
  const [maxHealth, setMaxHealth] = useState(engine.getMaxHealth());
  const [currentWave, setCurrentWave] = useState(engine.getCurrentWave());
  const [waveInProgress, setWaveInProgress] = useState(engine.isWaveRunning());
  const [isGameOver, setIsGameOver] = useState(false);
  const [isGameWon, setIsGameWon] = useState(false);
  const [gameSpeed, setGameSpeed] = useState(engine.gameSpeed);

  // Interaction state
  const [placingTier, setPlacingTier] = useState<CatTier | null>(null);
  const [selectedCat, setSelectedCat] = useState<PlacedCat | null>(null);
  const [selectedObstacle, setSelectedObstacle] = useState<Obstacle | null>(null);
  const [isClearMode, setIsClearMode] = useState(false);
  const [clearedObstaclesCount, setClearedObstaclesCount] = useState(0);
  const [, setPathRevision] = useState(0);

  // Bind engine listeners
  useEffect(() => {
    engine.setListeners({
      onGoldChanged: (newGold) => setGold(newGold),
      onHealthChanged: (newHealth, newMax) => {
        setHealth(newHealth);
        setMaxHealth(newMax);
      },
      onWaveChanged: (wave, inProgress) => {
        setCurrentWave(wave);
        setWaveInProgress(inProgress);
      },
      onGameOver: () => {
        setIsGameOver(true);
        setPlacingTier(null);
        setIsClearMode(false);
      },
      onGameWon: () => {
        setIsGameWon(true);
        setPlacingTier(null);
        setIsClearMode(false);
      },
      onCatSelected: (cat) => {
        setSelectedCat(cat);
        if (cat) setSelectedObstacle(null);
      },
      onPathChanged: () => setPathRevision((rev) => rev + 1),
      onClearedObstaclesCountChanged: (count) => setClearedObstaclesCount(count),
      onObstaclesChanged: (obstacles) => {
        setSelectedObstacle((current) => {
          if (!current) return null;
          return obstacles.some((o) => o.id === current.id) ? current : null;
        });
      },
    });
  }, [engine]);

  // Handlers
  const handleStartWave = useCallback(() => {
    engine.startNextWave();
  }, [engine]);

  const handleToggleSpeed = useCallback(() => {
    const nextSpeed = engine.gameSpeed === 1 ? 2 : 1;
    engine.gameSpeed = nextSpeed;
    setGameSpeed(nextSpeed);
  }, [engine]);

  const handleRestart = useCallback(() => {
    engine.restartGame();
    setIsGameOver(false);
    setIsGameWon(false);
    setPlacingTier(null);
    setSelectedCat(null);
    setSelectedObstacle(null);
    setIsClearMode(false);
  }, [engine]);

  const handleRerollMap = useCallback(() => {
    engine.rerollPath();
    setPlacingTier(null);
    setSelectedCat(null);
    setSelectedObstacle(null);
    setIsClearMode(false);
  }, [engine]);

  const handleSelectTier = useCallback((tier: CatTier) => {
    setSelectedCat(null);
    setSelectedObstacle(null);
    setIsClearMode(false);
    setPlacingTier(tier);
  }, []);

  const handleCancelPlacement = useCallback(() => {
    setPlacingTier(null);
  }, []);

  const handleCatPlaced = useCallback(() => {
    // Keep placement mode active for multi-placement if player has enough gold
    setPlacingTier(null);
  }, []);

  const handleSellCat = useCallback(
    (catId: string) => {
      engine.sellCat(catId);
      setSelectedCat(null);
    },
    [engine]
  );

  const handleUpgradeCat = useCallback(
    (catId: string) => {
      engine.upgradeCat(catId);
    },
    [engine]
  );

  const handleClearObstacle = useCallback(
    (obstacleId: string) => {
      const success = engine.clearObstacle(obstacleId);
      if (success) {
        setSelectedObstacle(null);
      }
    },
    [engine]
  );

  const handleToggleClearMode = useCallback(() => {
    setIsClearMode((prev) => {
      const next = !prev;
      if (next) {
        setPlacingTier(null);
        setSelectedCat(null);
      }
      return next;
    });
  }, []);

  const handleContinueEndless = useCallback(() => {
    setIsGameWon(false);
    // Allow player to continue triggering waves beyond wave 3!
  }, []);

  const clearCost = engine.getClearObstacleCost();

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden relative font-sans">
      {/* HUD Header */}
      <HUD
        gold={gold}
        health={health}
        maxHealth={maxHealth}
        currentWave={currentWave}
        waveInProgress={waveInProgress}
        gameSpeed={gameSpeed}
        onStartWave={handleStartWave}
        onToggleSpeed={handleToggleSpeed}
        onRestart={handleRestart}
        onRerollMap={handleRerollMap}
      />

      {/* Main Game Stage */}
      <main className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        <GameBoard
          engine={engine}
          placingTier={placingTier}
          selectedCat={selectedCat}
          selectedObstacle={selectedObstacle}
          isClearMode={isClearMode}
          clearCost={clearCost}
          onCatPlaced={handleCatPlaced}
          onSelectCat={(cat) => {
            setSelectedCat(cat);
            if (cat) {
              setPlacingTier(null);
              setSelectedObstacle(null);
            }
          }}
          onSelectObstacle={(obs) => {
            setSelectedObstacle(obs);
            if (obs) {
              setPlacingTier(null);
              setSelectedCat(null);
            }
          }}
          onCancelPlacement={handleCancelPlacement}
        />

        {/* Selected Cat Inspector Panel */}
        <CatInspector
          cat={selectedCat}
          currentGold={gold}
          onClose={() => setSelectedCat(null)}
          onSell={handleSellCat}
          onUpgrade={handleUpgradeCat}
        />

        {/* Selected Obstacle Inspector Panel */}
        <ObstacleInspector
          obstacle={selectedObstacle}
          currentGold={gold}
          clearCost={clearCost}
          clearedCount={clearedObstaclesCount}
          onClose={() => setSelectedObstacle(null)}
          onClear={handleClearObstacle}
        />
      </main>

      {/* Cat Shop / Controls Footer */}
      <CatShop
        gold={gold}
        placingTier={placingTier}
        isClearMode={isClearMode}
        clearCost={clearCost}
        clearedCount={clearedObstaclesCount}
        onSelectTier={handleSelectTier}
        onCancelPlacement={handleCancelPlacement}
        onToggleClearMode={handleToggleClearMode}
      />

      {/* Game Over / Victory Modal */}
      <GameOverModal
        isGameOver={isGameOver}
        isGameWon={isGameWon}
        wave={currentWave}
        onRestart={handleRestart}
        onContinueEndless={handleContinueEndless}
      />
    </div>
  );
}

export default App;
