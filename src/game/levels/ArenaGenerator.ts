import { useGameStore } from '../../state/GameStore';
import { MapCell } from './LevelGenerator';

const EMPTY = MapCell.EMPTY;
const WALL_STONE = MapCell.WALL_STONE;
const WALL_LAVA = MapCell.WALL_LAVA;
const WALL_OBSIDIAN = MapCell.WALL_OBSIDIAN;
const FLOOR_RAISED = MapCell.FLOOR_RAISED;
const FLOOR_LAVA = MapCell.FLOOR_LAVA;
const RAMP = MapCell.RAMP;

/** Shorthand for the store's seeded PRNG. */
function rng(): number {
  return useGameStore.getState().rng();
}

/**
 * Arena layout types for variety across encounters.
 * Each produces a distinct combat experience:
 * - crucible: Cross-shaped with corner platforms (classic DOOM)
 * - colosseum: Circular with concentric ring cover
 * - gauntlet: Long narrow arena with side alcoves
 * - hellpit: Lava-ringed with central platform
 */
type ArenaLayout = 'crucible' | 'colosseum' | 'gauntlet' | 'hellpit';

const ARENA_LAYOUTS: ArenaLayout[] = ['crucible', 'colosseum', 'gauntlet', 'hellpit'];

/**
 * Generates a combat arena with varied layouts for survival mode.
 * Arenas are designed for DOOM-style "skate park" circular combat flow.
 *
 * @param size - Width and depth of the square arena grid (default 24).
 * @param floor - Current floor number (affects layout selection and hazards).
 * @returns A size x size grid of MapCell values.
 */
export function generateArena(size: number = 24, floor: number = 1): number[][] {
  const grid: number[][] = [];

  // Base grid: edges are walls, interior is empty
  for (let z = 0; z < size; z++) {
    const row: number[] = [];
    for (let x = 0; x < size; x++) {
      if (z === 0 || z === size - 1 || x === 0 || x === size - 1) {
        row.push(WALL_OBSIDIAN);
      } else {
        row.push(EMPTY);
      }
    }
    grid.push(row);
  }

  // Select layout based on floor progression (cycle through all types)
  const layout = ARENA_LAYOUTS[(floor - 1) % ARENA_LAYOUTS.length];

  switch (layout) {
    case 'crucible':
      buildCrucible(grid, size);
      break;
    case 'colosseum':
      buildColosseum(grid, size);
      break;
    case 'gauntlet':
      buildGauntlet(grid, size);
      break;
    case 'hellpit':
      buildHellpit(grid, size);
      break;
  }

  return grid;
}

// ---------------------------------------------------------------------------
// Crucible: Cross-shaped pillars with raised corner platforms
// Classic DOOM arena — 4 elevated positions overlooking central killing field
// ---------------------------------------------------------------------------

function buildCrucible(grid: number[][], size: number): void {
  const mid = Math.floor(size / 2);
  const q = Math.floor(size / 4);

  // Central cross of cover pillars (4 arms from center)
  const armDirections = [
    { dx: 1, dz: 0 },
    { dx: -1, dz: 0 },
    { dx: 0, dz: 1 },
    { dx: 0, dz: -1 },
  ];
  for (const dir of armDirections) {
    for (let i = 2; i <= 4; i++) {
      const x = mid + dir.dx * i;
      const z = mid + dir.dz * i;
      if (x > 1 && x < size - 2 && z > 1 && z < size - 2) {
        const wallType = rng() < 0.3 ? WALL_LAVA : WALL_STONE;
        grid[z][x] = wallType;
      }
    }
  }

  // Four corner raised platforms (2x2 each)
  const corners = [
    { x: q, z: q },
    { x: size - q - 1, z: q },
    { x: q, z: size - q - 1 },
    { x: size - q - 1, z: size - q - 1 },
  ];
  for (const c of corners) {
    for (let dz = 0; dz <= 1; dz++) {
      for (let dx = 0; dx <= 1; dx++) {
        grid[c.z + dz][c.x + dx] = FLOOR_RAISED;
      }
    }
    // Ramp access
    grid[c.z - 1][c.x] = RAMP;
    grid[c.z + 2][c.x] = RAMP;
  }

  // Scatter small cover blocks
  placeCoverBlocks(grid, size, 6);
}

// ---------------------------------------------------------------------------
// Colosseum: Circular arena with concentric ring of pillars
// Encourages constant movement around a ring — no camping
// ---------------------------------------------------------------------------

function buildColosseum(grid: number[][], size: number): void {
  const mid = Math.floor(size / 2);
  const outerR = Math.floor(size / 2) - 2;
  const innerR = Math.floor(size / 3);

  // Inner ring of pillars (creating the "donut" combat zone)
  const pillarCount = 8 + Math.floor(rng() * 4);
  for (let i = 0; i < pillarCount; i++) {
    const angle = (i / pillarCount) * Math.PI * 2;
    const px = mid + Math.round(Math.cos(angle) * innerR);
    const pz = mid + Math.round(Math.sin(angle) * innerR);
    if (px > 1 && px < size - 2 && pz > 1 && pz < size - 2) {
      grid[pz][px] = WALL_STONE;
      // Some pillars are 2-wide for better cover
      if (rng() < 0.4 && px + 1 < size - 1) {
        grid[pz][px + 1] = WALL_STONE;
      }
    }
  }

  // Central raised platform
  for (let dz = -1; dz <= 1; dz++) {
    for (let dx = -1; dx <= 1; dx++) {
      grid[mid + dz][mid + dx] = FLOOR_RAISED;
    }
  }
  // Ramps on 4 sides
  grid[mid - 2][mid] = RAMP;
  grid[mid + 2][mid] = RAMP;
  grid[mid][mid - 2] = RAMP;
  grid[mid][mid + 2] = RAMP;

  // Outer wall alcoves (small indentations for tactical retreats)
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const ax = mid + Math.round(Math.cos(angle) * (outerR - 1));
    const az = mid + Math.round(Math.sin(angle) * (outerR - 1));
    if (ax > 2 && ax < size - 3 && az > 2 && az < size - 3) {
      grid[az][ax] = WALL_LAVA;
    }
  }
}

// ---------------------------------------------------------------------------
// Gauntlet: Long narrow arena with side alcoves
// Forces forward movement — enemies funnel toward the player
// ---------------------------------------------------------------------------

function buildGauntlet(grid: number[][], size: number): void {
  const mid = Math.floor(size / 2);

  // Narrow the arena: add walls to make a corridor with alcoves
  for (let z = 2; z < size - 2; z++) {
    // Left wall with alcove gaps
    if (z % 5 !== 0) {
      grid[z][3] = WALL_OBSIDIAN;
      grid[z][4] = WALL_OBSIDIAN;
    }
    // Right wall with alcove gaps (offset from left)
    if ((z + 2) % 5 !== 0) {
      grid[z][size - 4] = WALL_OBSIDIAN;
      grid[z][size - 5] = WALL_OBSIDIAN;
    }
  }

  // Central cover pillars running down the middle
  for (let z = 4; z < size - 4; z += 3) {
    const wallType = rng() < 0.4 ? WALL_LAVA : WALL_STONE;
    grid[z][mid] = wallType;
    if (rng() < 0.5) {
      grid[z][mid + 1] = wallType;
    }
  }

  // Raised sniper platforms at far ends
  for (let dx = -1; dx <= 1; dx++) {
    grid[2][mid + dx] = FLOOR_RAISED;
    grid[size - 3][mid + dx] = FLOOR_RAISED;
  }
  grid[3][mid] = RAMP;
  grid[size - 4][mid] = RAMP;

  // Lava hazards in alcoves
  for (let z = 3; z < size - 3; z += 5) {
    if (rng() < 0.5) {
      grid[z][2] = FLOOR_LAVA;
    }
    if (rng() < 0.5) {
      grid[z][size - 3] = FLOOR_LAVA;
    }
  }
}

// ---------------------------------------------------------------------------
// Hellpit: Lava-ringed arena with central platform
// High stakes — fall into the lava ring and take damage
// ---------------------------------------------------------------------------

function buildHellpit(grid: number[][], size: number): void {
  const mid = Math.floor(size / 2);
  const lavaRingR = Math.floor(size / 3);
  const centerR = Math.floor(size / 5);

  // Create lava ring
  for (let z = 2; z < size - 2; z++) {
    for (let x = 2; x < size - 2; x++) {
      const dist = Math.sqrt((x - mid) * (x - mid) + (z - mid) * (z - mid));
      if (dist >= centerR && dist <= lavaRingR) {
        grid[z][x] = FLOOR_LAVA;
      }
    }
  }

  // Central raised platform
  for (let z = 2; z < size - 2; z++) {
    for (let x = 2; x < size - 2; x++) {
      const dist = Math.sqrt((x - mid) * (x - mid) + (z - mid) * (z - mid));
      if (dist < centerR) {
        grid[z][x] = FLOOR_RAISED;
      }
    }
  }

  // 4 bridge corridors across the lava (ramps leading to center)
  const bridgeDirs = [
    { dx: 1, dz: 0 },
    { dx: -1, dz: 0 },
    { dx: 0, dz: 1 },
    { dx: 0, dz: -1 },
  ];
  for (const dir of bridgeDirs) {
    for (let i = centerR; i <= lavaRingR + 1; i++) {
      const bx = mid + dir.dx * i;
      const bz = mid + dir.dz * i;
      if (bx > 1 && bx < size - 1 && bz > 1 && bz < size - 1) {
        grid[bz][bx] = RAMP;
        // Make bridges 2-wide
        const perpX = bx + dir.dz;
        const perpZ = bz + dir.dx;
        if (perpX > 1 && perpX < size - 1 && perpZ > 1 && perpZ < size - 1) {
          grid[perpZ][perpX] = RAMP;
        }
      }
    }
  }

  // Cover pillars on outer ring
  placeCoverBlocks(grid, size, 4);
}

// ---------------------------------------------------------------------------
// Shared helper: scatter cover blocks that avoid placed geometry
// ---------------------------------------------------------------------------

function placeCoverBlocks(grid: number[][], size: number, count: number): void {
  const mid = Math.floor(size / 2);
  let placed = 0;
  let attempts = 0;

  while (placed < count && attempts < 150) {
    attempts++;
    const px = 3 + Math.floor(rng() * (size - 7));
    const pz = 3 + Math.floor(rng() * (size - 7));

    // Don't place near center (player spawn)
    if (Math.abs(px - mid) < 3 && Math.abs(pz - mid) < 3) continue;

    // Check area is clear
    let clear = true;
    for (let dz = 0; dz <= 1 && clear; dz++) {
      for (let dx = 0; dx <= 1 && clear; dx++) {
        if (grid[pz + dz][px + dx] !== EMPTY) clear = false;
      }
    }
    if (!clear) continue;

    const wallType = rng() < 0.3 ? WALL_LAVA : WALL_STONE;
    grid[pz][px] = wallType;
    grid[pz][px + 1] = wallType;
    grid[pz + 1][px] = wallType;
    grid[pz + 1][px + 1] = wallType;
    placed++;
  }
}

/**
 * Returns the player spawn point for the arena (center of the grid).
 */
export function getArenaPlayerSpawn(size: number): { x: number; z: number } {
  return { x: Math.floor(size / 2), z: Math.floor(size / 2) };
}
