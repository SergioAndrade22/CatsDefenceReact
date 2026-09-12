import { CAT_CONFIGS, GRID_COLS, GRID_ROWS } from './constants';
import { CatTier, EnemyInstance, FloatingText, Obstacle, Particle, PlacedCat, PoisonPool, ProjectileInstance, Waypoint } from '../types';

export function drawGridAndPath(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cellSize: number,
  pathWaypoints: Waypoint[],
  flyingWaypoints?: Waypoint[]
) {
  // 1. Draw Field Background (Tactical Grass)
  ctx.fillStyle = '#0f172a'; // Deep slate background
  ctx.fillRect(0, 0, width, height);

  // 2. Draw Grid Cells
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const x = c * cellSize;
      const y = r * cellSize;
      
      // Checkerboard grass pattern
      const isAlt = (r + c) % 2 === 0;
      ctx.fillStyle = isAlt ? '#132338' : '#101d2e';
      ctx.fillRect(x, y, cellSize, cellSize);

      // Subtle cell border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cellSize, cellSize);
    }
  }

  // 2.5. Draw Aerial Flight Path for Flying Enemies (Bats)
  if (flyingWaypoints && flyingWaypoints.length > 1) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Subtle atmospheric flight corridor glow
    ctx.beginPath();
    flyingWaypoints.forEach((wp, idx) => {
      const px = wp.x * cellSize + cellSize / 2;
      const py = wp.y * cellSize + cellSize / 2;
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.lineWidth = 14;
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.08)';
    ctx.stroke();

    // Dashed aerial vector
    ctx.beginPath();
    flyingWaypoints.forEach((wp, idx) => {
      const px = wp.x * cellSize + cellSize / 2;
      const py = wp.y * cellSize + cellSize / 2;
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = 'rgba(192, 132, 252, 0.45)';
    ctx.setLineDash([6, 6]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Sky Ingress Portal for airborne enemies
    const airStart = flyingWaypoints[0];
    const airNext = flyingWaypoints[1] || airStart;
    const clampedAirX = Math.max(0.5, Math.min(GRID_COLS - 0.5, airStart.x + (airNext.x - airStart.x) * 0.35)) * cellSize;
    const clampedAirY = Math.max(0.5, Math.min(GRID_ROWS - 0.5, airStart.y + (airNext.y - airStart.y) * 0.35)) * cellSize;

    ctx.save();
    // Air vortex shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.arc(clampedAirX, clampedAirY + 2, 11, 0, Math.PI * 2);
    ctx.fill();

    // Sky portal
    ctx.fillStyle = '#7e22ce';
    ctx.beginPath();
    ctx.arc(clampedAirX, clampedAirY, 9.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e9d5ff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Bat wings icon in portal
    ctx.font = 'bold 9px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🦇', clampedAirX, clampedAirY);
    ctx.restore();

    ctx.restore();
  }

  if (pathWaypoints && pathWaypoints.length > 1) {
    // 3. Draw Path (Cobblestone / Path strip)
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Path Outer Shadow / Border
    ctx.beginPath();
    pathWaypoints.forEach((wp, idx) => {
      const px = wp.x * cellSize + cellSize / 2;
      const py = wp.y * cellSize + cellSize / 2;
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.lineWidth = cellSize * 0.84;
    ctx.strokeStyle = '#334155';
    ctx.stroke();

    // Path Main Road (Cobblestone)
    ctx.beginPath();
    pathWaypoints.forEach((wp, idx) => {
      const px = wp.x * cellSize + cellSize / 2;
      const py = wp.y * cellSize + cellSize / 2;
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.lineWidth = cellSize * 0.72;
    ctx.strokeStyle = '#1e293b';
    ctx.stroke();

    // Directional Chevrons along the path pointing towards the player's base (litter box)
    ctx.save();
    for (let i = 0; i < pathWaypoints.length - 1; i++) {
      const p1 = pathWaypoints[i];
      const p2 = pathWaypoints[i + 1];
      const x1 = p1.x * cellSize + cellSize / 2;
      const y1 = p1.y * cellSize + cellSize / 2;
      const x2 = p2.x * cellSize + cellSize / 2;
      const y2 = p2.y * cellSize + cellSize / 2;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const segmentLen = Math.hypot(dx, dy);
      if (segmentLen < 5) continue;
      const angle = Math.atan2(dy, dx);

      // Spaced directional arrows
      const step = cellSize * 0.65;
      const count = Math.floor(segmentLen / step);
      for (let k = 1; k <= count; k++) {
        const arrowX = x1 + (dx / segmentLen) * (k * step);
        const arrowY = y1 + (dy / segmentLen) * (k * step);

        ctx.save();
        ctx.translate(arrowX, arrowY);
        ctx.rotate(angle);
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)'; // Amber direction chevrons
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(-5, -5);
        ctx.lineTo(4, 0);
        ctx.lineTo(-5, 5);
        ctx.stroke();
        ctx.restore();
      }
    }
    ctx.restore();

    // Draw Spawn Point (Enemy Ingress Portal / Burrow)
    const spawnWp = pathWaypoints[0];
    const nextWp = pathWaypoints[1] || spawnWp;
    const clampedSpawnX = Math.max(0.5, Math.min(GRID_COLS - 0.5, spawnWp.x + (nextWp.x - spawnWp.x) * 0.35)) * cellSize;
    const clampedSpawnY = Math.max(0.5, Math.min(GRID_ROWS - 0.5, spawnWp.y + (nextWp.y - spawnWp.y) * 0.35)) * cellSize;
    
    ctx.save();
    // Spawn burrow shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.arc(clampedSpawnX, clampedSpawnY + 2, 11, 0, Math.PI * 2);
    ctx.fill();

    // Spawn hole
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(clampedSpawnX, clampedSpawnY, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fecaca';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Enemy spawn icon
    ctx.font = 'bold 9px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('IN', clampedSpawnX, clampedSpawnY);
    ctx.restore();

    // Draw Player Base: HALF A LITTER BOX at the path exit
    const goalWp = pathWaypoints[pathWaypoints.length - 1];
    const prevWp = pathWaypoints[pathWaypoints.length - 2] || goalWp;
    const clampedGoalX = Math.max(0.6, Math.min(GRID_COLS - 0.6, goalWp.x + (prevWp.x - goalWp.x) * 0.35)) * cellSize;
    const clampedGoalY = Math.max(0.6, Math.min(GRID_ROWS - 0.6, goalWp.y + (prevWp.y - goalWp.y) * 0.35)) * cellSize;
    const incomingAngle = Math.atan2(goalWp.y - prevWp.y, goalWp.x - prevWp.x);

    drawHalfLitterBoxBase(ctx, clampedGoalX, clampedGoalY, incomingAngle, cellSize);
  }
}

/**
 * Renders the player's home base as half a cat litter box
 * oriented toward incoming enemies.
 */
function drawHalfLitterBoxBase(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  incomingAngle: number,
  cellSize: number
) {
  ctx.save();
  ctx.translate(cx, cy);
  // Rotate so the open entry side faces towards incoming enemies
  ctx.rotate(incomingAngle);

  const boxW = cellSize * 0.88;
  const boxH = cellSize * 0.68;

  // 1. Base Drop Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.ellipse(0, 3, boxW * 0.55, boxH * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Outer Plastic Tray (Half / Cutaway Box with curved back)
  // Back wall is arched, front wall is open/lower
  ctx.fillStyle = '#0284c7'; // Rich Sky Blue plastic
  ctx.beginPath();
  ctx.moveTo(-boxW * 0.48, -boxH * 0.45);
  ctx.lineTo(boxW * 0.25, -boxH * 0.45);
  ctx.quadraticCurveTo(boxW * 0.52, 0, boxW * 0.25, boxH * 0.45);
  ctx.lineTo(-boxW * 0.48, boxH * 0.45);
  ctx.closePath();
  ctx.fill();

  // Outer Tray Rim / Lip
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3;
  ctx.stroke();

  // 3. Inner Clumping Sand Bedding (Golden/beige kitty litter)
  ctx.fillStyle = '#fde047'; // Clean yellow-tan litter sand
  ctx.beginPath();
  ctx.moveTo(-boxW * 0.42, -boxH * 0.35);
  ctx.lineTo(boxW * 0.18, -boxH * 0.35);
  ctx.quadraticCurveTo(boxW * 0.42, 0, boxW * 0.18, boxH * 0.35);
  ctx.lineTo(-boxW * 0.42, boxH * 0.35);
  ctx.closePath();
  ctx.fill();

  // Sand texture speckles
  ctx.fillStyle = '#d97706';
  const speckles = [
    [-0.2, -0.15],
    [0.05, -0.18],
    [-0.1, 0.12],
    [0.12, 0.08],
    [-0.25, 0.05],
  ];
  speckles.forEach(([sx, sy]) => {
    ctx.beginPath();
    ctx.arc(sx * boxW, sy * boxH, 1.5, 0, Math.PI * 2);
    ctx.fill();
  });

  // 4. Cat Paw Print in the sand
  ctx.fillStyle = '#b45309';
  const pawX = -boxW * 0.05;
  const pawY = 0;
  // Main paw pad
  ctx.beginPath();
  ctx.ellipse(pawX, pawY + 2, 4, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  // 3 toe beans
  ctx.beginPath();
  ctx.arc(pawX - 3.5, pawY - 2.5, 1.5, 0, Math.PI * 2);
  ctx.arc(pawX, pawY - 4, 1.5, 0, Math.PI * 2);
  ctx.arc(pawX + 3.5, pawY - 2.5, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // 5. Miniature Litter Scoop tucked on the rim
  ctx.save();
  ctx.translate(-boxW * 0.38, -boxH * 0.42);
  ctx.rotate(-0.5);
  // Scoop handle
  ctx.fillStyle = '#f43f5e'; // Rose red scoop
  ctx.fillRect(-2, -8, 3, 9);
  // Scoop shovel head
  ctx.fillRect(-5, 0, 9, 6);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-3, 2, 1.5, 3);
  ctx.fillRect(0, 2, 1.5, 3);
  ctx.restore();

  ctx.restore();

  // 6. Base Health Badge floating above
  ctx.save();
  ctx.translate(cx, cy - boxH * 0.65);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.beginPath();
  ctx.roundRect(-24, -8, 48, 16, 8);
  ctx.fill();
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#34d399';
  ctx.font = 'bold 9px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('BASE', 0, 0);
  ctx.restore();
}

/**
 * Draws all terrain obstacles (rocks and trees) on the grid,
 * highlighting any selected obstacle or hovered obstacle in Clear Terrain mode.
 */
export function drawObstacles(
  ctx: CanvasRenderingContext2D,
  obstacles: Obstacle[],
  cellSize: number,
  selectedObstacleId?: string | null,
  isClearMode?: boolean,
  hoveredPos?: { x: number; y: number } | null,
  clearCost?: number
) {
  obstacles.forEach((obs) => {
    const cx = obs.gridX * cellSize + cellSize / 2;
    const cy = obs.gridY * cellSize + cellSize / 2;

    const isSelected = selectedObstacleId === obs.id;
    const isHovered = Boolean(hoveredPos && hoveredPos.x === obs.gridX && hoveredPos.y === obs.gridY);

    // Highlight background ring if selected or hovered in clear mode
    if (isSelected || (isClearMode && isHovered)) {
      ctx.save();
      ctx.translate(cx, cy);

      // Outer gentle glow
      ctx.beginPath();
      ctx.arc(0, 0, cellSize * 0.46, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? 'rgba(245, 158, 11, 0.25)' : 'rgba(56, 189, 248, 0.2)';
      ctx.fill();

      // Dashed circular selection / targeting border
      ctx.beginPath();
      ctx.arc(0, 0, cellSize * 0.44, 0, Math.PI * 2);
      ctx.strokeStyle = isSelected ? '#f59e0b' : '#38bdf8';
      ctx.lineWidth = isSelected ? 2.5 : 1.8;
      ctx.setLineDash([5, 3]);
      ctx.stroke();
      ctx.restore();
    }

    if (obs.type === 'rock') {
      drawRockObstacle(ctx, cx, cy, obs.variant, cellSize);
    } else {
      drawTreeObstacle(ctx, cx, cy, obs.variant, cellSize);
    }

    // Floating badges for selected or clear-mode obstacles
    if (isSelected) {
      ctx.save();
      ctx.translate(cx, cy - cellSize * 0.46);

      // Badge background pill
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.beginPath();
      ctx.roundRect(-25, -9, 50, 18, 9);
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Badge text
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 9px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`🪓 ${clearCost !== undefined ? `${clearCost}g` : 'Clear'}`, 0, 0);
      ctx.restore();
    } else if (isClearMode) {
      ctx.save();
      ctx.translate(cx, cy - cellSize * 0.42);

      ctx.fillStyle = isHovered ? 'rgba(15, 23, 42, 0.95)' : 'rgba(15, 23, 42, 0.8)';
      ctx.beginPath();
      ctx.roundRect(-15, -7, 30, 14, 7);
      ctx.fill();
      ctx.strokeStyle = isHovered ? '#f59e0b' : '#64748b';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = isHovered ? '#fbbf24' : '#cbd5e1';
      ctx.font = 'bold 8px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isHovered && clearCost ? `${clearCost}g` : '🪓', 0, 0);
      ctx.restore();
    }
  });
}

function drawRockObstacle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  variant: number,
  cellSize: number
) {
  const r = cellSize * 0.36;

  ctx.save();
  ctx.translate(cx, cy);

  // Rock ground shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.55, r * 0.9, r * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  // Boulder geometry based on variant
  ctx.beginPath();
  if (variant === 0) {
    // Angular granite boulder
    ctx.moveTo(-r * 0.85, r * 0.3);
    ctx.lineTo(-r * 0.7, -r * 0.4);
    ctx.lineTo(-r * 0.2, -r * 0.85);
    ctx.lineTo(r * 0.55, -r * 0.7);
    ctx.lineTo(r * 0.85, -r * 0.1);
    ctx.lineTo(r * 0.7, r * 0.45);
    ctx.lineTo(0, r * 0.6);
  } else if (variant === 1) {
    // Dome/smooth boulder with sharp top
    ctx.moveTo(-r * 0.75, r * 0.35);
    ctx.lineTo(-r * 0.8, -r * 0.2);
    ctx.lineTo(-r * 0.3, -r * 0.75);
    ctx.lineTo(r * 0.35, -r * 0.8);
    ctx.lineTo(r * 0.85, -r * 0.3);
    ctx.lineTo(r * 0.65, r * 0.45);
    ctx.lineTo(-r * 0.1, r * 0.55);
  } else {
    // Dual stacked stones
    ctx.moveTo(-r * 0.9, r * 0.2);
    ctx.lineTo(-r * 0.65, -r * 0.5);
    ctx.lineTo(0, -r * 0.8);
    ctx.lineTo(r * 0.7, -r * 0.6);
    ctx.lineTo(r * 0.85, r * 0.25);
    ctx.lineTo(0.2, r * 0.55);
  }
  ctx.closePath();

  // Stone base color
  ctx.fillStyle = '#475569';
  ctx.fill();

  // Top/Light facet
  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.moveTo(-r * 0.5, -r * 0.3);
  ctx.lineTo(-r * 0.2, -r * 0.85);
  ctx.lineTo(r * 0.55, -r * 0.7);
  ctx.lineTo(r * 0.2, -r * 0.1);
  ctx.closePath();
  ctx.fill();

  // Highlights
  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.moveTo(-r * 0.15, -r * 0.8);
  ctx.lineTo(r * 0.4, -r * 0.68);
  ctx.lineTo(r * 0.1, -r * 0.4);
  ctx.closePath();
  ctx.fill();

  // Boulder outline & crack lines
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Chisel cracks
  ctx.beginPath();
  ctx.moveTo(-r * 0.1, -r * 0.4);
  ctx.lineTo(0, r * 0.1);
  ctx.lineTo(-r * 0.25, r * 0.35);
  ctx.moveTo(r * 0.2, -r * 0.1);
  ctx.lineTo(r * 0.35, r * 0.25);
  ctx.stroke();

  // Moss patches
  ctx.fillStyle = '#16a34a';
  ctx.beginPath();
  ctx.arc(-r * 0.55, r * 0.15, 3.5, 0, Math.PI * 2);
  ctx.arc(-r * 0.4, r * 0.28, 3, 0, Math.PI * 2);
  ctx.arc(r * 0.45, r * 0.32, 3, 0, Math.PI * 2);
  ctx.fill();

  // Small companion pebble
  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.ellipse(r * 0.75, r * 0.45, 3.5, 2.5, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

function drawTreeObstacle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  variant: number,
  cellSize: number
) {
  const r = cellSize * 0.38;

  ctx.save();
  ctx.translate(cx, cy);

  // Ground shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.6, r * 0.75, r * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();

  if (variant === 1) {
    // Pine / Evergreen Fir Tree
    // Brown trunk
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-r * 0.15, 0, r * 0.3, r * 0.55);

    // 3 stacked tiered needle cones
    // Bottom tier
    ctx.fillStyle = '#14532d';
    ctx.beginPath();
    ctx.moveTo(-r * 0.8, r * 0.15);
    ctx.lineTo(0, -r * 0.35);
    ctx.lineTo(r * 0.8, r * 0.15);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#052e16';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Middle tier
    ctx.fillStyle = '#166534';
    ctx.beginPath();
    ctx.moveTo(-r * 0.65, -r * 0.15);
    ctx.lineTo(0, -r * 0.65);
    ctx.lineTo(r * 0.65, -r * 0.15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Top tier & spire
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.moveTo(-r * 0.45, -r * 0.45);
    ctx.lineTo(0, -r * 0.95);
    ctx.lineTo(r * 0.45, -r * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    // Deciduous Oak / Woodland Tree
    // Wood Trunk
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-r * 0.18, 0, r * 0.36, r * 0.5);
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-r * 0.18, 0, r * 0.36, r * 0.5);

    // Fluffy Layered Leaf Canopy
    // Back shadow leaf layer
    ctx.fillStyle = '#14532d';
    ctx.beginPath();
    ctx.arc(-r * 0.35, -r * 0.15, r * 0.42, 0, Math.PI * 2);
    ctx.arc(r * 0.35, -r * 0.15, r * 0.42, 0, Math.PI * 2);
    ctx.arc(0, -r * 0.45, r * 0.48, 0, Math.PI * 2);
    ctx.fill();

    // Main vibrant foliage
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.arc(-r * 0.3, -r * 0.22, r * 0.38, 0, Math.PI * 2);
    ctx.arc(r * 0.3, -r * 0.22, r * 0.38, 0, Math.PI * 2);
    ctx.arc(0, -r * 0.48, r * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#14532d';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Sunny highlights on top
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.arc(-r * 0.18, -r * 0.55, r * 0.24, 0, Math.PI * 2);
    ctx.arc(r * 0.15, -r * 0.5, r * 0.22, 0, Math.PI * 2);
    ctx.fill();

    // If variant 2, add cute blossom flower dots
    if (variant === 2) {
      ctx.fillStyle = '#f472b6'; // Pink flowers
      const blossoms = [
        [-0.3, -0.3],
        [0.2, -0.2],
        [-0.05, -0.6],
        [0.3, -0.4],
      ];
      blossoms.forEach(([bx, by]) => {
        ctx.beginPath();
        ctx.arc(bx * r, by * r, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }

  ctx.restore();
}


export function drawCat(
  ctx: CanvasRenderingContext2D,
  cat: PlacedCat,
  cellSize: number,
  isSelected: boolean = false
) {
  const config = CAT_CONFIGS[cat.tier];
  const cx = cat.worldX * cellSize + cellSize / 2;
  const cy = cat.worldY * cellSize + cellSize / 2;
  const radius = cellSize * 0.38;

  ctx.save();
  ctx.translate(cx, cy);

  // Selected ring or aura
  if (isSelected) {
    ctx.beginPath();
    ctx.arc(0, 0, radius + 6, 0, Math.PI * 2);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Active Buff Auras
  if ((cat.windBlessTimer ?? 0) > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, radius + 5, 0, Math.PI * 2);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 3]);
    ctx.stroke();
    ctx.restore();
  }

  if ((cat.firePowerTimer ?? 0) > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, radius + 7, 0, Math.PI * 2);
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#ea580c';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.restore();
  }

  // Draw Shadow
  ctx.beginPath();
  ctx.ellipse(0, radius * 0.8, radius * 0.85, radius * 0.35, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fill();

  // Rotate body towards target angle:
  // Cat face (snout, nose, mouth) is drawn pointing +Y (downwards).
  // Subtracting PI/2 aligns the cat's face directly with cat.angle.
  ctx.rotate((cat.angle ?? 0) - Math.PI / 2);

  const isCatFlashing = (cat.damageFlashTimer ?? 0) > 0;
  const baseCatColor = isCatFlashing ? '#ffffff' : config.color;

  // 1. Cat Ears (Behind or on top)
  ctx.fillStyle = baseCatColor;
  // Left ear
  ctx.beginPath();
  ctx.moveTo(-radius * 0.7, -radius * 0.2);
  ctx.lineTo(-radius * 0.8, -radius * 1.1);
  ctx.lineTo(-radius * 0.2, -radius * 0.7);
  ctx.closePath();
  ctx.fill();

  // Right ear
  ctx.beginPath();
  ctx.moveTo(radius * 0.7, -radius * 0.2);
  ctx.lineTo(radius * 0.8, -radius * 1.1);
  ctx.lineTo(radius * 0.2, -radius * 0.7);
  ctx.closePath();
  ctx.fill();

  // Inner ears (pink)
  ctx.fillStyle = '#fda4af';
  ctx.beginPath();
  ctx.moveTo(-radius * 0.65, -radius * 0.3);
  ctx.lineTo(-radius * 0.73, -radius * 0.95);
  ctx.lineTo(-radius * 0.3, -radius * 0.65);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(radius * 0.65, -radius * 0.3);
  ctx.lineTo(radius * 0.73, -radius * 0.95);
  ctx.lineTo(radius * 0.3, -radius * 0.65);
  ctx.closePath();
  ctx.fill();

  // Priest Class Visual: Divine Holy Halo
  if (config.catClass === 'priest') {
    ctx.save();
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#eab308';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.ellipse(0, -radius * 1.25, radius * 0.65, radius * 0.25, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 2. Main Cat Head / Body
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = baseCatColor;
  ctx.fill();
  ctx.strokeStyle = isCatFlashing ? '#ef4444' : config.accentColor;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Sorcerer Class Visual: Mystical Forehead Rune / Cosmic Gem
  if (config.catClass === 'sorcerer') {
    ctx.save();
    ctx.fillStyle = '#c084fc';
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.arc(0, -radius * 0.35, radius * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f3e8ff';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  // 3. Eyes (looking forward along angle)
  const eyeOffsetX = radius * 0.38;
  const eyeOffsetY = -radius * 0.05;
  const eyeRadius = radius * 0.18;

  // White sclera
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-eyeOffsetX, eyeOffsetY, eyeRadius, 0, Math.PI * 2);
  ctx.arc(eyeOffsetX, eyeOffsetY, eyeRadius, 0, Math.PI * 2);
  ctx.fill();

  // Pupils (looking towards front)
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(-eyeOffsetX + 1, eyeOffsetY + 1, eyeRadius * 0.55, 0, Math.PI * 2);
  ctx.arc(eyeOffsetX + 1, eyeOffsetY + 1, eyeRadius * 0.55, 0, Math.PI * 2);
  ctx.fill();

  // 4. Cat Snout & Nose
  ctx.fillStyle = '#f472b6'; // cute nose
  ctx.beginPath();
  ctx.moveTo(0, radius * 0.15);
  ctx.lineTo(-radius * 0.12, radius * 0.28);
  ctx.lineTo(radius * 0.12, radius * 0.28);
  ctx.closePath();
  ctx.fill();

  // Whiskers
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.lineWidth = 1.2;
  // Left whiskers
  ctx.beginPath();
  ctx.moveTo(-radius * 0.25, radius * 0.25);
  ctx.lineTo(-radius * 0.85, radius * 0.15);
  ctx.moveTo(-radius * 0.25, radius * 0.32);
  ctx.lineTo(-radius * 0.85, radius * 0.4);
  // Right whiskers
  ctx.moveTo(radius * 0.25, radius * 0.25);
  ctx.lineTo(radius * 0.85, radius * 0.15);
  ctx.moveTo(radius * 0.25, radius * 0.32);
  ctx.lineTo(radius * 0.85, radius * 0.4);
  ctx.stroke();

  ctx.restore();

  // 5. Draw Life Bar for ALL Cats (progressively smaller: Tank > Fighter > Ranger > Assassin > Mage > Sorcerer > Priest)
  if (cat.hp !== undefined && cat.maxHp !== undefined) {
    ctx.save();
    // Progressively smaller bar widths according to class hierarchy:
    const classBarRatio: Record<string, number> = {
      tank: 0.88,
      fighter: 0.76,
      ranger: 0.66,
      assassin: 0.58,
      mage: 0.50,
      sorcerer: 0.44,
      priest: 0.38,
    };
    const barW = cellSize * (classBarRatio[config.catClass] ?? 0.6);
    const barH = 5;
    const barX = cx - barW / 2;
    const barY = cy - radius - 14;

    // Background container
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(barX - 2, barY - 2, barW + 4, barH + 4, 3) : ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
    ctx.fill();

    // Health bar fill
    const hpRatio = Math.max(0, Math.min(1, cat.hp / cat.maxHp));
    const hpFillColor = hpRatio > 0.5 ? '#22c55e' : hpRatio > 0.25 ? '#eab308' : '#ef4444';
    ctx.fillStyle = hpFillColor;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(barX, barY, barW * hpRatio, barH, 2) : ctx.fillRect(barX, barY, barW * hpRatio, barH);
    ctx.fill();

    // HP text (and Block capacity if on-path defender)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    if (cat.blockCapacity !== undefined) {
      const blockedCount = cat.blockedEnemyIds?.length ?? 0;
      ctx.fillText(
        `${cat.hp}/${cat.maxHp}  🛡️${blockedCount}/${cat.blockCapacity}`,
        cx,
        barY - 1
      );
    } else {
      ctx.fillText(`${cat.hp}/${cat.maxHp}`, cx, barY - 1);
    }
    ctx.restore();
  }

  // 6. Draw Class / Tier Badge (unrotated, top-right of cell)
  ctx.save();
  ctx.translate(cx + radius * 0.65, cy - radius * 0.65);
  ctx.fillStyle = config.accentColor;
  ctx.beginPath();
  ctx.arc(0, 0, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Class symbol or icon
  const classIcons: Record<string, string> = {
    fighter: '⚔️',
    tank: '🛡️',
    ranger: '🏹',
    mage: '✨',
    assassin: '🗡️',
    priest: '💚',
    sorcerer: '🔮',
  };
  const icon = classIcons[config.catClass] || `T${cat.tier}`;
  ctx.font = '8px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(icon, 0, 0);
  ctx.restore();

  // 7. Draw Level Badge (unrotated, top-left of cell)
  const catLevel = cat.level || 1;
  ctx.save();
  ctx.translate(cx - radius * 0.65, cy - radius * 0.65);
  ctx.fillStyle = catLevel >= 3 ? '#ca8a04' : catLevel === 2 ? '#2563eb' : '#334155';
  ctx.beginPath();
  ctx.arc(0, 0, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = catLevel >= 2 ? '#fef08a' : '#94a3b8';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 8px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`L${catLevel}`, 0, 0);
  ctx.restore();
}

export function drawEnemy(
  ctx: CanvasRenderingContext2D,
  enemy: EnemyInstance,
  cellSize: number
) {
  if (!enemy.isAlive) return;

  if (enemy.type === 'bat' || enemy.isFlying) {
    drawBatEnemy(ctx, enemy, cellSize);
    return;
  }

  const ex = enemy.worldX * cellSize + cellSize / 2;
  const ey = enemy.worldY * cellSize + cellSize / 2;
  const radius = cellSize * 0.28;
  const isChilled = (enemy.chilledTimer ?? 0) > 0;
  const isArmorReduced = (enemy.armorReducedTimer ?? 0) > 0;

  ctx.save();
  ctx.translate(ex, ey);

  // Shadow
  ctx.beginPath();
  ctx.ellipse(0, radius * 0.7, radius * 0.8, radius * 0.3, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fill();

  // Chilled Frost Ring
  if (isChilled) {
    ctx.beginPath();
    ctx.arc(0, 0, radius + 4, 0, Math.PI * 2);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Acid Fumes
  if (isArmorReduced) {
    ctx.beginPath();
    ctx.arc(0, 0, radius + 6, 0, Math.PI * 2);
    ctx.strokeStyle = '#84cc16';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Rotate facing movement
  ctx.rotate(enemy.angle);

  // Damage flash (turns white/bright red)
  const isFlashing = enemy.damageFlashTimer > 0;
  ctx.fillStyle = isFlashing
    ? '#ffffff'
    : isChilled
    ? '#38bdf8'
    : isArmorReduced
    ? '#84cc16'
    : '#ef4444'; // Red enemy matching Unity

  // Mouse / Enemy Body
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * 1.1, radius * 0.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = isFlashing ? '#f87171' : isChilled ? '#0284c7' : isArmorReduced ? '#4d7c0f' : '#b91c1c';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Mouse Ears
  ctx.fillStyle = isFlashing ? '#ffffff' : isChilled ? '#7dd3fc' : isArmorReduced ? '#a3e635' : '#f87171';
  ctx.beginPath();
  ctx.arc(-radius * 0.4, -radius * 0.7, radius * 0.4, 0, Math.PI * 2);
  ctx.arc(radius * 0.4, -radius * 0.7, radius * 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(radius * 0.4, -radius * 0.1, 2.5, 0, Math.PI * 2);
  ctx.arc(radius * 0.4, radius * 0.2, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Nose
  ctx.fillStyle = '#f43f5e';
  ctx.beginPath();
  ctx.arc(radius * 0.95, 0, 2, 0, Math.PI * 2);
  ctx.fill();

  // Tail
  ctx.strokeStyle = isChilled ? '#bae6fd' : '#fca5a5';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-radius * 1.0, 0);
  ctx.quadraticCurveTo(-radius * 1.6, -radius * 0.4, -radius * 1.8, radius * 0.3);
  ctx.stroke();

  ctx.restore();

  // Health Bar (unrotated, above enemy)
  const hpBarW = cellSize * 0.65;
  const hpBarH = 5;
  const hpBarX = ex - hpBarW / 2;
  const hpBarY = ey - radius - 10;
  const hpPercent = Math.max(0, Math.min(1, enemy.health / enemy.maxHealth));

  // Background
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(hpBarX - 1, hpBarY - 1, hpBarW + 2, hpBarH + 2);

  // Fill bar
  ctx.fillStyle = hpPercent > 0.5 ? '#10b981' : hpPercent > 0.25 ? '#f59e0b' : '#ef4444';
  ctx.fillRect(hpBarX, hpBarY, hpBarW * hpPercent, hpBarH);

  // Status badges above HP bar (❄️ or 🧪 or 🎯 attacking)
  const isAttacking = (enemy.attackPauseTimer ?? 0) > 0;
  if (isChilled || isArmorReduced || isAttacking) {
    ctx.font = 'bold 9px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const statusIcons = `${isAttacking ? '🎯 ' : ''}${isChilled ? '❄️' : ''}${isArmorReduced ? '🧪' : ''}`;
    ctx.fillText(statusIcons, ex, hpBarY - 1);
  }
}

/**
 * Specialized renderer for the Bat: an agile airborne enemy
 * with ground altitude shadow, animated flapping wings, ears, fangs, and glowing eyes.
 */
function drawBatEnemy(
  ctx: CanvasRenderingContext2D,
  enemy: EnemyInstance,
  cellSize: number
) {
  const ex = enemy.worldX * cellSize + cellSize / 2;
  const ey = enemy.worldY * cellSize + cellSize / 2;
  const radius = cellSize * 0.29;
  const isChilled = (enemy.chilledTimer ?? 0) > 0;
  const isArmorReduced = (enemy.armorReducedTimer ?? 0) > 0;

  // 1. Altitude Shadow on ground (renders underneath to simulate hovering)
  const altitude = 14;
  ctx.save();
  ctx.translate(ex, ey + altitude);
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * 0.85, radius * 0.32, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
  ctx.fill();
  ctx.restore();

  // 2. Airborne Bat Body
  ctx.save();
  ctx.translate(ex, ey);

  // Chilled Frost Ring in flight
  if (isChilled) {
    ctx.beginPath();
    ctx.arc(0, 0, radius + 5, 0, Math.PI * 2);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Acid Fumes
  if (isArmorReduced) {
    ctx.beginPath();
    ctx.arc(0, 0, radius + 7, 0, Math.PI * 2);
    ctx.strokeStyle = '#84cc16';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Rotate facing movement
  ctx.rotate(enemy.angle);

  // Wing flapping animation: rapid smooth wing beat
  const now = performance.now();
  const flap = Math.sin(now * 0.022); // between -1 and 1
  const wingYOffset = flap * radius * 0.65;

  const isFlashing = enemy.damageFlashTimer > 0;
  const wingColor = isFlashing ? '#ffffff' : '#334155'; // Dark charcoal wings
  const wingAccent = isFlashing ? '#f87171' : '#64748b';
  const bodyColor = isFlashing ? '#ffffff' : isChilled ? '#38bdf8' : '#2e1065'; // Night velvet purple

  // Draw Wings (Left & Right scalloped bat wings)
  ctx.save();
  ctx.fillStyle = wingColor;
  ctx.strokeStyle = wingAccent;
  ctx.lineWidth = 1.5;

  // Top Wing (relative to heading)
  ctx.beginPath();
  ctx.moveTo(-radius * 0.2, 0);
  ctx.lineTo(-radius * 0.4, -radius * 1.6 + wingYOffset);
  ctx.quadraticCurveTo(0, -radius * 1.8 + wingYOffset * 0.8, radius * 0.4, -radius * 1.3 + wingYOffset);
  ctx.quadraticCurveTo(radius * 0.2, -radius * 0.9 + wingYOffset * 0.5, radius * 0.5, -radius * 0.5);
  ctx.lineTo(radius * 0.1, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Bottom Wing (relative to heading)
  ctx.beginPath();
  ctx.moveTo(-radius * 0.2, 0);
  ctx.lineTo(-radius * 0.4, radius * 1.6 - wingYOffset);
  ctx.quadraticCurveTo(0, radius * 1.8 - wingYOffset * 0.8, radius * 0.4, radius * 1.3 - wingYOffset);
  ctx.quadraticCurveTo(radius * 0.2, radius * 0.9 - wingYOffset * 0.5, radius * 0.5, radius * 0.5);
  ctx.lineTo(radius * 0.1, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Bat Torso & Head
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * 0.85, radius * 0.65, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = isFlashing ? '#f87171' : '#c084fc';
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // Pointy Bat Ears
  ctx.fillStyle = isFlashing ? '#ffffff' : '#312e81';
  // Top ear
  ctx.beginPath();
  ctx.moveTo(0, -radius * 0.4);
  ctx.lineTo(radius * 0.5, -radius * 0.9);
  ctx.lineTo(radius * 0.3, -radius * 0.2);
  ctx.closePath();
  ctx.fill();

  // Bottom ear
  ctx.beginPath();
  ctx.moveTo(0, radius * 0.4);
  ctx.lineTo(radius * 0.5, radius * 0.9);
  ctx.lineTo(radius * 0.3, radius * 0.2);
  ctx.closePath();
  ctx.fill();

  // Inner ear pink
  ctx.fillStyle = '#f472b6';
  ctx.beginPath();
  ctx.moveTo(radius * 0.1, -radius * 0.35);
  ctx.lineTo(radius * 0.4, -radius * 0.75);
  ctx.lineTo(radius * 0.25, -radius * 0.25);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(radius * 0.1, radius * 0.35);
  ctx.lineTo(radius * 0.4, radius * 0.75);
  ctx.lineTo(radius * 0.25, radius * 0.25);
  ctx.closePath();
  ctx.fill();

  // Glowing Piercing Eyes
  ctx.fillStyle = '#facc15'; // Amber piercing glow
  ctx.beginPath();
  ctx.arc(radius * 0.35, -radius * 0.22, 2.2, 0, Math.PI * 2);
  ctx.arc(radius * 0.35, radius * 0.22, 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Pupils
  ctx.fillStyle = '#7f1d1d';
  ctx.beginPath();
  ctx.arc(radius * 0.4, -radius * 0.22, 1.1, 0, Math.PI * 2);
  ctx.arc(radius * 0.4, radius * 0.22, 1.1, 0, Math.PI * 2);
  ctx.fill();

  // Cute White Fangs
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(radius * 0.65, -radius * 0.14);
  ctx.lineTo(radius * 0.85, -radius * 0.12);
  ctx.lineTo(radius * 0.65, -radius * 0.08);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(radius * 0.65, radius * 0.08);
  ctx.lineTo(radius * 0.85, radius * 0.12);
  ctx.lineTo(radius * 0.65, radius * 0.14);
  ctx.closePath();
  ctx.fill();

  ctx.restore();

  // Health Bar (unrotated, above Bat)
  const hpBarW = cellSize * 0.65;
  const hpBarH = 5;
  const hpBarX = ex - hpBarW / 2;
  const hpBarY = ey - radius - 12;
  const hpPercent = Math.max(0, Math.min(1, enemy.health / enemy.maxHealth));

  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(hpBarX - 1, hpBarY - 1, hpBarW + 2, hpBarH + 2);

  ctx.fillStyle = hpPercent > 0.5 ? '#10b981' : hpPercent > 0.25 ? '#f59e0b' : '#ef4444';
  ctx.fillRect(hpBarX, hpBarY, hpBarW * hpPercent, hpBarH);

  // Status badges: 🦇 Flying Bat indicator + combat status
  const isAttacking = (enemy.attackPauseTimer ?? 0) > 0;
  ctx.font = 'bold 9px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  const statusIcons = `🦇 ${isAttacking ? '🎯 ' : ''}${isChilled ? '❄️' : ''}${isArmorReduced ? '🧪' : ''}`;
  ctx.fillText(statusIcons, ex, hpBarY - 1);
}

export function drawProjectile(
  ctx: CanvasRenderingContext2D,
  proj: ProjectileInstance,
  cellSize: number
) {
  const px = proj.currentX * cellSize + cellSize / 2;
  const py = proj.currentY * cellSize + cellSize / 2;

  ctx.save();
  ctx.translate(px, py);

  if (proj.isEnemyProjectile) {
    if (proj.color === '#c084fc') {
      // Ultrasonic Screech Wave from Bat: concentric sonic crescent shockwaves
      const radius = 6.5;
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, radius + 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(192, 132, 252, 0.35)';
      ctx.fill();

      // Triple sonic ripple arcs
      ctx.strokeStyle = '#e9d5ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-2, 0, radius, -Math.PI * 0.45, Math.PI * 0.45);
      ctx.stroke();

      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(2, 0, radius * 0.7, -Math.PI * 0.4, Math.PI * 0.4);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      // Standard spiked dark dart / crimson shard
      const radius = 4.5;
      ctx.beginPath();
      ctx.arc(0, 0, radius + 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.fill();

      // Spiked diamond / shard
      ctx.beginPath();
      ctx.moveTo(radius * 1.6, 0);
      ctx.lineTo(-radius * 0.8, radius * 0.8);
      ctx.lineTo(-radius * 0.4, 0);
      ctx.lineTo(-radius * 0.8, -radius * 0.8);
      ctx.closePath();
      ctx.fillStyle = proj.color || '#ef4444';
      ctx.fill();
      ctx.strokeStyle = '#fee2e2';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  } else if (proj.isAoE) {
    // Mage Arcane Orb with energy aura
    const radius = 7;
    ctx.beginPath();
    ctx.arc(0, 0, radius + 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(168, 85, 247, 0.35)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = proj.color;
    ctx.fill();
    ctx.strokeStyle = '#f3e8ff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Orbital sparkle dots
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(radius * 0.8, -radius * 0.5, 1.8, 0, Math.PI * 2);
    ctx.arc(-radius * 0.6, radius * 0.7, 1.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (proj.isCrit) {
    // Assassin Execution Blade / Dagger
    const radius = 6;
    ctx.beginPath();
    ctx.arc(0, 0, radius + 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(244, 63, 94, 0.4)';
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 1.5, radius * 0.7, 0, 0, Math.PI * 2);
    ctx.fillStyle = proj.color;
    ctx.fill();
    ctx.strokeStyle = '#ffe4e6';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else {
    // Standard Projectile (Ranger arrow / Fighter claw / Tank shell)
    const radius = 5;
    ctx.beginPath();
    ctx.arc(0, 0, radius + 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(250, 204, 21, 0.3)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = proj.color;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  ctx.restore();
}

export function drawRangeCircle(
  ctx: CanvasRenderingContext2D,
  gridX: number,
  gridY: number,
  rangeInCells: number,
  cellSize: number,
  isValidPlacement: boolean = true
) {
  const cx = gridX * cellSize + cellSize / 2;
  const cy = gridY * cellSize + cellSize / 2;
  const r = rangeInCells * cellSize;

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = isValidPlacement ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.15)';
  ctx.fill();
  ctx.strokeStyle = isValidPlacement ? 'rgba(34, 197, 94, 0.6)' : 'rgba(239, 68, 68, 0.7)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 6]);
  ctx.stroke();
  ctx.restore();
}

export function drawPlacementPreview(
  ctx: CanvasRenderingContext2D,
  tier: CatTier,
  gridX: number,
  gridY: number,
  cellSize: number,
  canPlace: boolean
) {
  const config = CAT_CONFIGS[tier];

  // Draw Range Circle First
  drawRangeCircle(ctx, gridX, gridY, config.attackRange, cellSize, canPlace);

  // Draw Tile Highlight
  ctx.save();
  ctx.fillStyle = canPlace ? 'rgba(34, 197, 94, 0.25)' : 'rgba(239, 68, 68, 0.35)';
  ctx.fillRect(gridX * cellSize, gridY * cellSize, cellSize, cellSize);
  ctx.strokeStyle = canPlace ? '#22c55e' : '#ef4444';
  ctx.lineWidth = 2;
  ctx.strokeRect(gridX * cellSize, gridY * cellSize, cellSize, cellSize);

  // Semi-transparent Cat Silhouette
  ctx.globalAlpha = canPlace ? 0.7 : 0.35;
  const mockCat: PlacedCat = {
    id: 'preview',
    tier,
    catClass: config.catClass,
    gridX,
    gridY,
    worldX: gridX,
    worldY: gridY,
    lastAttackTime: 0,
    targetEnemyId: null,
    angle: Math.PI / 2,
    totalKills: 0,
    totalDamageDealt: 0,
    level: 1,
    hp: config.maxHp,
    maxHp: config.maxHp,
    blockCapacity: config.blockCapacity,
  };
  drawCat(ctx, mockCat, cellSize, false);

  // If blocked by obstacle or incorrect placement type, draw distinct blocked badge and hint
  if (!canPlace) {
    ctx.globalAlpha = 0.95;
    const cx = gridX * cellSize + cellSize / 2;
    const cy = gridY * cellSize + cellSize / 2;
    const r = cellSize * 0.28;

    // Red circle with diagonal slash
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    const slash = r * 0.7;
    ctx.moveTo(cx - slash, cy - slash);
    ctx.lineTo(cx + slash, cy + slash);
    ctx.stroke();

    // Guidance pill below tile
    const hint = config.placementType === 'on-path' ? 'PATH ONLY' : 'OFF-PATH ONLY';
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(cx - 36, cy + cellSize * 0.38, 72, 14);
    ctx.fillStyle = '#f87171';
    ctx.font = 'bold 8px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(hint, cx, cy + cellSize * 0.38 + 7);
  }

  ctx.restore();
}

export function drawFloatingTexts(
  ctx: CanvasRenderingContext2D,
  texts: FloatingText[],
  cellSize: number
) {
  texts.forEach((ft) => {
    const progress = ft.age / ft.maxAge;
    const alpha = 1 - progress;
    const px = ft.worldX * cellSize + cellSize / 2;
    const py = ft.worldY * cellSize + cellSize / 2 - progress * 24;

    ctx.save();
    ctx.font = 'bold 13px Fredoka, Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = ft.color;
    ctx.globalAlpha = alpha;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;
    ctx.fillText(ft.text, px, py);
    ctx.restore();
  });
}

export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  particles.forEach((p) => {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

export function drawPoisonPools(
  ctx: CanvasRenderingContext2D,
  pools: PoisonPool[],
  cellSize: number
) {
  pools.forEach((pool) => {
    const px = pool.worldX * cellSize + cellSize / 2;
    const py = pool.worldY * cellSize + cellSize / 2;
    const radius = pool.radius * cellSize;

    ctx.save();
    ctx.translate(px, py);

    // Acid puddle glow
    const grad = ctx.createRadialGradient(0, 0, radius * 0.2, 0, 0, radius);
    grad.addColorStop(0, 'rgba(132, 204, 22, 0.65)');
    grad.addColorStop(0.7, 'rgba(101, 163, 13, 0.45)');
    grad.addColorStop(1, 'rgba(77, 124, 15, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    // Acid pool surface ring
    ctx.strokeStyle = 'rgba(163, 230, 53, 0.65)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.85, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Toxic bubble highlights
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.beginPath();
    ctx.arc(-radius * 0.35, -radius * 0.2, 3.5, 0, Math.PI * 2);
    ctx.arc(radius * 0.3, radius * 0.25, 2.5, 0, Math.PI * 2);
    ctx.arc(radius * 0.1, -radius * 0.35, 2, 0, Math.PI * 2);
    ctx.fill();

    // Duration & Acid icon badge
    ctx.font = 'bold 9px Outfit, sans-serif';
    ctx.fillStyle = '#f7fee7';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 3;
    ctx.fillText(`🧪 ${Math.ceil(pool.duration)}s`, 0, 0);

    ctx.restore();
  });
}
