import { useState, useEffect, useMemo, useCallback } from 'react';
import { GameEngine } from './game/engine';
import { CatTier, Obstacle, PlacedCat } from './types';
import { HUD } from './components/HUD';
import { GameBoard } from './components/GameBoard';
import { CatShop } from './components/CatShop';
import { CatInspector } from './components/CatInspector';
import { ObstacleInspector } from './components/ObstacleInspector';
import { GameOverModal } from './components/GameOverModal';
import { MainGameScreen } from './components/MainGameScreen';
import { ProfileModal } from './components/ProfileModal';
import {
  getPlayerProfile,
  recordFightVictory,
  FightVictoryResult,
  updatePlayerTeam,
  PlayerProfile,
} from './game/playerStorage';

export function App() {
  const engine = useMemo(() => new GameEngine(), []);

  // Player Profile & Account Currency (Diamonds) State
  const [profile, setProfile] = useState<PlayerProfile>(() => getPlayerProfile());
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<'main' | 'battle'>('main');
  const [lastDiamondsEarned, setLastDiamondsEarned] = useState(35);
  const [victoryResult, setVictoryResult] = useState<FightVictoryResult | null>(null);

  // Progression state synced from engine
  const [fightProgression, setFightProgression] = useState({
    chapter: engine.chapter,
    fight: engine.fight,
    targetWaves: engine.targetWaves,
    isEndless: engine.isEndlessMode,
  });

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
      onFightInfoChanged: (chapter, fight, targetWaves, isEndless) => {
        setFightProgression({ chapter, fight, targetWaves, isEndless });
      },
      onGameOver: () => {
        setIsGameOver(true);
        setPlacingTier(null);
        setIsClearMode(false);
      },
      onGameWon: (isFlawless: boolean, wavesCleared: number) => {
        // Award player diamonds and advance chapter/fight progression
        const result = recordFightVictory(wavesCleared, isFlawless);
        setProfile(result.profile);
        setLastDiamondsEarned(result.diamondsEarned);
        setVictoryResult(result);
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
  const handleStartGameFromMenu = useCallback(
    (isEndless = false) => {
      const currentProf = getPlayerProfile();
      setProfile(currentProf);
      engine.startFight(currentProf.currentChapter, currentProf.currentFight, isEndless);
      setIsGameOver(false);
      setIsGameWon(false);
      setVictoryResult(null);
      setPlacingTier(null);
      setSelectedCat(null);
      setSelectedObstacle(null);
      setIsClearMode(false);
      setCurrentScreen('battle');
    },
    [engine]
  );

  const handleReturnToMenu = useCallback(() => {
    setProfile(getPlayerProfile());
    setPlacingTier(null);
    setSelectedCat(null);
    setSelectedObstacle(null);
    setIsClearMode(false);
    setCurrentScreen('main');
  }, []);

  const handleUpdateTeam = useCallback((newTeam: CatTier[]) => {
    const updated = updatePlayerTeam(newTeam);
    setProfile(updated);
  }, []);

  const handleStartWave = useCallback(() => {
    engine.startNextWave();
  }, [engine]);

  const handleToggleSpeed = useCallback(() => {
    const nextSpeed = engine.gameSpeed === 1 ? 2 : 1;
    engine.gameSpeed = nextSpeed;
    setGameSpeed(nextSpeed);
  }, [engine]);

  const handleRestart = useCallback(() => {
    engine.startFight(fightProgression.chapter, fightProgression.fight, fightProgression.isEndless);
    setIsGameOver(false);
    setIsGameWon(false);
    setVictoryResult(null);
    setPlacingTier(null);
    setSelectedCat(null);
    setSelectedObstacle(null);
    setIsClearMode(false);
  }, [engine, fightProgression]);

  const handleNextFight = useCallback(() => {
    const currentProf = getPlayerProfile();
    setProfile(currentProf);
    engine.startFight(currentProf.currentChapter, currentProf.currentFight, false);
    setIsGameOver(false);
    setIsGameWon(false);
    setVictoryResult(null);
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
    setVictoryResult(null);
    engine.continueEndlessWaves();
  }, [engine]);

  const clearCost = engine.getClearObstacleCost();

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden relative font-sans">
      {/* SCREEN 1: MAIN GAME SCREEN (Starting point with 3 tabs) */}
      {currentScreen === 'main' ? (
        <MainGameScreen
          profile={profile}
          onStartGame={handleStartGameFromMenu}
          onOpenProfile={() => setIsProfileOpen(true)}
          onUpdateTeam={handleUpdateTeam}
          onProfileUpdated={(updated) => setProfile(updated)}
        />
      ) : (
        /* SCREEN 2: ACTIVE BATTLE SCREEN */
        <>
          {/* HUD Header */}
          <HUD
            gold={gold}
            health={health}
            maxHealth={maxHealth}
            currentWave={currentWave}
            waveInProgress={waveInProgress}
            gameSpeed={gameSpeed}
            chapter={fightProgression.chapter}
            fight={fightProgression.fight}
            targetWaves={fightProgression.targetWaves}
            isEndlessMode={fightProgression.isEndless}
            diamonds={profile.diamonds}
            avatarInitial={profile.avatarInitial}
            onStartWave={handleStartWave}
            onToggleSpeed={handleToggleSpeed}
            onRestart={handleRestart}
            onRerollMap={handleRerollMap}
            onReturnToMenu={handleReturnToMenu}
            onOpenProfile={() => setIsProfileOpen(true)}
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

          {/* Cat Shop / Controls Footer with Active Team Filter */}
          <CatShop
            gold={gold}
            placingTier={placingTier}
            activeTeam={profile.activeTeam}
            isClearMode={isClearMode}
            clearCost={clearCost}
            clearedCount={clearedObstaclesCount}
            onSelectTier={handleSelectTier}
            onCancelPlacement={handleCancelPlacement}
            onToggleClearMode={handleToggleClearMode}
          />

          {/* Game Over / Victory Modal with Progression & Flawless Rewards */}
          <GameOverModal
            isGameOver={isGameOver}
            isGameWon={isGameWon}
            wave={currentWave}
            chapter={fightProgression.chapter}
            fight={fightProgression.fight}
            isFlawless={victoryResult?.isFlawless ?? false}
            endlessNewlyUnlocked={victoryResult?.endlessNewlyUnlocked ?? false}
            isEndlessMode={fightProgression.isEndless}
            newlyUnlockedCats={victoryResult?.newlyUnlockedCats ?? []}
            newSlotUnlocked={victoryResult?.newSlotUnlocked ?? null}
            chapterJustCleared={victoryResult?.chapterJustCleared ?? null}
            diamondsEarned={lastDiamondsEarned}
            onRestart={handleRestart}
            onNextFight={handleNextFight}
            onContinueEndless={handleContinueEndless}
            onReturnToMenu={handleReturnToMenu}
          />
        </>
      )}

      {/* Global Player Profile Modal (Accessible from top-right avatar anywhere) */}
      <ProfileModal
        isOpen={isProfileOpen}
        profile={profile}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
}

export default App;

