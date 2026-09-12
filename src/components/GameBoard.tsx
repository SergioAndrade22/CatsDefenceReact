import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameEngine } from '../game/engine';
import { CatTier, Obstacle, PlacedCat } from '../types';
import { CAT_CONFIGS, GRID_COLS, GRID_ROWS } from '../game/constants';
import {
  drawCat,
  drawEnemy,
  drawFloatingTexts,
  drawGridAndPath,
  drawObstacles,
  drawParticles,
  drawPlacementPreview,
  drawPoisonPools,
  drawProjectile,
  drawRangeCircle,
} from '../game/sprites';

interface GameBoardProps {
  engine: GameEngine;
  placingTier: CatTier | null;
  selectedCat: PlacedCat | null;
  selectedObstacle: Obstacle | null;
  isClearMode: boolean;
  clearCost: number;
  onCatPlaced: () => void;
  onSelectCat: (cat: PlacedCat | null) => void;
  onSelectObstacle: (obstacle: Obstacle | null) => void;
  onCancelPlacement: () => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  engine,
  placingTier,
  selectedCat,
  selectedObstacle,
  isClearMode,
  clearCost,
  onCatPlaced,
  onSelectCat,
  onSelectObstacle,
  onCancelPlacement,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredGridPos, setHoveredGridPos] = useState<{ x: number; y: number } | null>(null);

  // Measure board dimensions & calculate cellSize
  const [boardSize, setBoardSize] = useState({ width: 600, height: 600, cellSize: 60 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const minDimension = Math.min(rect.width, rect.height);
      // Ensure it's square and multiple of GRID_COLS
      const size = Math.max(300, Math.min(minDimension - 16, 750));
      const cellSize = size / GRID_COLS;
      setBoardSize({ width: size, height: size, cellSize });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  // Main Render & Animation Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = Math.min(0.1, (now - lastTime) / 1000); // delta time in seconds, clamped
      lastTime = now;

      // Update engine simulation
      engine.update(dt);

      // Render to canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const { width, height, cellSize } = boardSize;

          // Clear
          ctx.clearRect(0, 0, width, height);

          // 1. Grid & Path (Ground path + Flying aerial path)
          drawGridAndPath(ctx, width, height, cellSize, engine.pathWaypoints, engine.flyingWaypoints);

          // 1.2. Poison Pools on Path
          drawPoisonPools(ctx, engine.poisonPools, cellSize);

          // 1.5. Terrain Obstacles (Rocks and Trees with clear terrain highlight)
          drawObstacles(
            ctx,
            engine.obstacles,
            cellSize,
            selectedObstacle?.id,
            isClearMode,
            hoveredGridPos,
            clearCost
          );

          // 2. Selected Cat Range Ring (if any)
          if (selectedCat && !placingTier) {
            const placedCat = engine.placedCats.find((c) => c.id === selectedCat.id);
            if (placedCat) {
              const cfg = CAT_CONFIGS[placedCat.tier];
              if (cfg) {
                const range = placedCat.attackRange ?? cfg.attackRange;
                drawRangeCircle(ctx, placedCat.gridX, placedCat.gridY, range, cellSize, true);
              }
            }
          }

          // 3. Placement Preview
          if (placingTier && hoveredGridPos) {
            const canPlace = engine.canPlaceCat(placingTier, hoveredGridPos.x, hoveredGridPos.y);
            drawPlacementPreview(ctx, placingTier, hoveredGridPos.x, hoveredGridPos.y, cellSize, canPlace);
          }

          // 4. Placed Cats
          engine.placedCats.forEach((cat) => {
            const isSelected = selectedCat?.id === cat.id;
            drawCat(ctx, cat, cellSize, isSelected);
          });

          // 5. Enemies
          engine.enemies.forEach((enemy) => {
            drawEnemy(ctx, enemy, cellSize);
          });

          // 6. Projectiles
          engine.projectiles.forEach((proj) => {
            drawProjectile(ctx, proj, cellSize);
          });

          // 7. Particles
          drawParticles(ctx, engine.particles);

          // 8. Floating Damage / Gold Texts
          drawFloatingTexts(ctx, engine.floatingTexts, cellSize);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [engine, boardSize, placingTier, selectedCat, selectedObstacle, isClearMode, clearCost, hoveredGridPos]);

  // Convert client mouse position to grid coordinate
  const getGridPosFromMouseEvent = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const clientX = (e.clientX - rect.left) * scaleX;
      const clientY = (e.clientY - rect.top) * scaleY;

      const gridX = Math.floor(clientX / boardSize.cellSize);
      const gridY = Math.floor(clientY / boardSize.cellSize);

      if (gridX >= 0 && gridX < GRID_COLS && gridY >= 0 && gridY < GRID_ROWS) {
        return { x: gridX, y: gridY };
      }
      return null;
    },
    [boardSize.cellSize]
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getGridPosFromMouseEvent(e);
    setHoveredGridPos(pos);
  };

  const handleMouseLeave = () => {
    setHoveredGridPos(null);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getGridPosFromMouseEvent(e);
    if (!pos) return;

    // Check if clicked an obstacle
    const clickedObstacle = engine.obstacles.find((o) => o.gridX === pos.x && o.gridY === pos.y);
    if (clickedObstacle) {
      if (placingTier) {
        onCancelPlacement();
      }
      onSelectCat(null);
      onSelectObstacle(clickedObstacle);
      return;
    }

    if (placingTier) {
      // Attempt placement
      const success = engine.placeCat(placingTier, pos.x, pos.y);
      if (success) {
        onCatPlaced();
      }
    } else {
      // Check if clicked an existing cat
      const clickedCat = engine.placedCats.find((c) => c.gridX === pos.x && c.gridY === pos.y);
      if (clickedCat) {
        onSelectObstacle(null);
        onSelectCat(clickedCat);
      } else {
        onSelectCat(null);
        onSelectObstacle(null);
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (placingTier) {
      onCancelPlacement();
    }
    if (selectedObstacle) {
      onSelectObstacle(null);
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 w-full flex items-center justify-center p-2 sm:p-4 overflow-hidden relative"
    >
      <div
        className="relative rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl bg-slate-950 flex items-center justify-center"
        style={{
          width: `${boardSize.width}px`,
          height: `${boardSize.height}px`,
        }}
      >
        <canvas
          ref={canvasRef}
          width={boardSize.width}
          height={boardSize.height}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          onContextMenu={handleContextMenu}
          className={`w-full h-full block ${
            placingTier ? 'cursor-crosshair' : isClearMode ? 'cursor-cell' : 'cursor-pointer'
          }`}
        />
      </div>
    </div>
  );
};
