# Cats Defense

A 2D tactical grid-based tower defense game where players position defender cats to repel incoming waves of enemies.

## Features

- **Strategic Cat Placement**: Place cats on the 10x10 battle grid outside the enemy's path.
- **3 Cat Archetypes**:
  - **Whiskers Scout (Tier 1)**: Cost 50g • Dmg 10 • Rng 3 • Spd 1.0/s
  - **Sparky Claws (Tier 2)**: Cost 75g • Dmg 15 • Rng 4 • Spd 1.5/s
  - **Mystic Shadow (Tier 3)**: Cost 100g • Dmg 25 • Rng 5 • Spd 2.0/s
- **Wave Progression System**: Face scaling enemy assault waves, defeat invaders to earn gold, and conquer the campaign or test your defense in endless mode.
- **Cat Inspection & Selling**: Select any placed cat on the grid to inspect its stats or sell it for a 70% refund.
- **Interactive Audio**: Procedural Web Audio API sound effects for shooting, hits, coins, wave horns, victory, and game over.
- **Controls & Hotkeys**:
  - `[1]`, `[2]`, `[3]`: Quick-select Cat Tiers
  - `[Esc]` or Right Click: Cancel placement
  - `1x / 2x`: Toggle game simulation speed

## Development

```bash
npm install
npm run dev
```
