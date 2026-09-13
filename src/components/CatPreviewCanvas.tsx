import React, { useRef, useEffect } from 'react';
import { CatTier, PlacedCat } from '../types';
import { drawCat } from '../game/sprites';

interface CatPreviewCanvasProps {
  tier: CatTier;
  size?: number;
  className?: string;
}

export const CatPreviewCanvas: React.FC<CatPreviewCanvasProps> = ({
  tier,
  size = 56,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let startTime = performance.now();

    const render = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      ctx.clearRect(0, 0, size, size);

      // Virtual PlacedCat for rendering preview
      const dummyCat: PlacedCat = {
        id: `preview-${tier}`,
        tier,
        catClass: 'fighter', // fallback, overridden inside drawCat by config
        gridX: 0,
        gridY: 0,
        worldX: 0,
        worldY: 0,
        lastAttackTime: 0,
        targetEnemyId: null,
        angle: Math.sin(elapsed * 1.5) * 0.15, // gentle breathing rotation
        totalKills: 0,
        totalDamageDealt: 0,
        level: 1,
      };

      drawCat(ctx, dummyCat, size, false);
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [tier, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={`rounded-lg ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    />
  );
};
