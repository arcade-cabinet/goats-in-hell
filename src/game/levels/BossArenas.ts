import {MapCell, PLATFORM_HEIGHT} from './LevelGenerator';
import type {EntityType} from '../entities/components';

// Lazy accessors — avoids circular import crash at module load time
// (LevelGenerator -> BossArenas -> LevelGenerator cycle)
function EMPTY() { return MapCell.EMPTY; }
function WALL_STONE() { return MapCell.WALL_STONE; }
function WALL_LAVA() { return MapCell.WALL_LAVA; }
function WALL_OBSIDIAN() { return MapCell.WALL_OBSIDIAN; }
function FLOOR_RAISED() { return MapCell.FLOOR_RAISED; }
function FLOOR_LAVA() { return MapCell.FLOOR_LAVA; }
function RAMP() { return MapCell.RAMP; }

export const BOSS_ARENA_SIZE = 19;

/** Symmetric pickup positions scaled for the 19x19 arena. */
export const BOSS_ARENA_PICKUP_POSITIONS: [number, number][] = [
  [3, 3],
  [15, 3],
  [3, 15],
  [15, 15],
];

/**
 * Generates a boss arena with layout tailored to the boss's combat style.
 *
 * - infernoGoat: Lava gauntlet — lava channels + cover pillars for dodging fireballs
 * - voidGoat:    Void pit — open arena with central lava pit, thin bridges, nowhere to hide
 * - ironGoat:    Iron fortress — narrow corridors and chokepoints to exploit its slow speed
 * - archGoat:    Colosseum — multi-level ring with elevated sniper platforms
 */
export function generateBossArena(bossType?: EntityType): number[][] {
  const size = BOSS_ARENA_SIZE;
  const grid: number[][] = [];

  // Base grid: obsidian walls on edges, empty interior
  for (let z = 0; z < size; z++) {
    const row: number[] = [];
    for (let x = 0; x < size; x++) {
      if (z === 0 || z === size - 1 || x === 0 || x === size - 1) {
        row.push(WALL_OBSIDIAN());
      } else {
        row.push(EMPTY());
      }
    }
    grid.push(row);
  }

  switch (bossType) {
    case 'infernoGoat':
      buildInfernoArena(grid, size);
      break;
    case 'voidGoat':
      buildVoidArena(grid, size);
      break;
    case 'ironGoat':
      buildIronArena(grid, size);
      break;
    default:
      buildArchArena(grid, size);
      break;
  }

  return grid;
}

// ---------------------------------------------------------------------------
// Inferno Arena: Lava channels with stone cover pillars
// infernoGoat shoots rapidly — player needs cover to dodge fireballs
// ---------------------------------------------------------------------------

function buildInfernoArena(grid: number[][], size: number): void {
  const mid = Math.floor(size / 2);

  // Two parallel lava channels (horizontal) creating 3 combat lanes
  for (let x = 2; x < size - 2; x++) {
    grid[5][x] = FLOOR_LAVA();
    grid[size - 6][x] = FLOOR_LAVA();
  }

  // Bridges across lava channels (3 crossing points each)
  const bridgeX = [4, mid, size - 5];
  for (const bx of bridgeX) {
    grid[5][bx] = RAMP();
    grid[5][bx + 1] = RAMP();
    grid[size - 6][bx] = RAMP();
    grid[size - 6][bx + 1] = RAMP();
  }

  // Stone cover pillars in middle lane (where most combat happens)
  const pillarPositions = [
    [4, mid], [mid - 2, mid], [mid + 2, mid], [size - 5, mid],
  ];
  for (const [px, pz] of pillarPositions) {
    grid[pz][px] = WALL_STONE();
    grid[pz + 1][px] = WALL_STONE();
  }

  // Corner raised platforms (2x2) — elevated vantage points
  const corners = [
    {x: 2, z: 2}, {x: size - 4, z: 2},
    {x: 2, z: size - 4}, {x: size - 4, z: size - 4},
  ];
  for (const c of corners) {
    for (let dz = 0; dz <= 1; dz++) {
      for (let dx = 0; dx <= 1; dx++) {
        grid[c.z + dz][c.x + dx] = FLOOR_RAISED();
      }
    }
  }

  // Lava hazard pools in the outer lanes
  grid[3][3] = FLOOR_LAVA();
  grid[3][size - 4] = FLOOR_LAVA();
  grid[size - 4][3] = FLOOR_LAVA();
  grid[size - 4][size - 4] = FLOOR_LAVA();
}

// ---------------------------------------------------------------------------
// Void Arena: Open space with central lava pit + thin bridges
// voidGoat is invisible — open design lets player spot the shimmer
// Bridges force linear movement, creating predictable attack windows
// ---------------------------------------------------------------------------

function buildVoidArena(grid: number[][], size: number): void {
  const mid = Math.floor(size / 2);
  const pitR = 3;

  // Central lava pit (circular)
  for (let z = 2; z < size - 2; z++) {
    for (let x = 2; x < size - 2; x++) {
      const dist = Math.sqrt((x - mid) * (x - mid) + (z - mid) * (z - mid));
      if (dist <= pitR) {
        grid[z][x] = FLOOR_LAVA();
      }
    }
  }

  // 4 bridges crossing the pit (cardinal directions, 1-wide)
  for (let i = mid - pitR - 1; i <= mid + pitR + 1; i++) {
    grid[mid][i] = RAMP(); // horizontal bridge
    grid[i][mid] = RAMP(); // vertical bridge
  }

  // Raised center platform (tiny, 1 cell) — the boss often stands here
  grid[mid][mid] = FLOOR_RAISED();

  // Outer ring of obsidian pillars (sparse, don't block line of sight too much)
  const outerR = Math.floor(size / 2) - 3;
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const px = mid + Math.round(Math.cos(angle) * outerR);
    const pz = mid + Math.round(Math.sin(angle) * outerR);
    if (px > 1 && px < size - 2 && pz > 1 && pz < size - 2) {
      grid[pz][px] = WALL_OBSIDIAN();
    }
  }

  // Lava corners (cut off corners to make arena feel more circular)
  for (let z = 1; z < 4; z++) {
    for (let x = 1; x < 4; x++) {
      if (grid[z][x] === EMPTY()) grid[z][x] = FLOOR_LAVA();
      if (grid[z][size - 1 - x] === EMPTY()) grid[z][size - 1 - x] = FLOOR_LAVA();
      if (grid[size - 1 - z][x] === EMPTY()) grid[size - 1 - z][x] = FLOOR_LAVA();
      if (grid[size - 1 - z][size - 1 - x] === EMPTY()) grid[size - 1 - z][size - 1 - x] = FLOOR_LAVA();
    }
  }
}

// ---------------------------------------------------------------------------
// Iron Fortress: Narrow corridors with thick walls
// ironGoat is slow but heavily armored — chokepoints let the player kite it
// The fortress layout rewards hit-and-run tactics
// ---------------------------------------------------------------------------

function buildIronArena(grid: number[][], size: number): void {
  const mid = Math.floor(size / 2);

  // Inner fortress walls creating a cross-shaped corridor system
  // Horizontal walls with gaps
  for (let x = 3; x < size - 3; x++) {
    if (Math.abs(x - mid) > 2) {
      grid[6][x] = WALL_OBSIDIAN();
      grid[size - 7][x] = WALL_OBSIDIAN();
    }
  }
  // Vertical walls with gaps
  for (let z = 3; z < size - 3; z++) {
    if (Math.abs(z - mid) > 2) {
      grid[z][6] = WALL_OBSIDIAN();
      grid[z][size - 7] = WALL_OBSIDIAN();
    }
  }

  // Central arena (the kill zone) — open 5x5 area
  // Already empty from base generation

  // Corner rooms (4 quadrants) with single-cell entrances
  // These are kiting corridors — run into a corner, let ironGoat follow,
  // then circle back through another entrance

  // Raised sniper positions at dead ends
  const sniperSpots = [
    {x: 2, z: 2}, {x: size - 3, z: 2},
    {x: 2, z: size - 3}, {x: size - 3, z: size - 3},
  ];
  for (const s of sniperSpots) {
    grid[s.z][s.x] = FLOOR_RAISED();
    // Ramps leading up
    grid[s.z][s.x + (s.x < mid ? 1 : -1)] = RAMP();
    grid[s.z + (s.z < mid ? 1 : -1)][s.x] = RAMP();
  }

  // Cover pillars in the corridor intersections
  grid[4][4] = WALL_STONE();
  grid[4][size - 5] = WALL_STONE();
  grid[size - 5][4] = WALL_STONE();
  grid[size - 5][size - 5] = WALL_STONE();

  // Lava traps at corridor dead-ends (punishes reckless sprinting)
  grid[2][mid] = FLOOR_LAVA();
  grid[size - 3][mid] = FLOOR_LAVA();
  grid[mid][2] = FLOOR_LAVA();
  grid[mid][size - 3] = FLOOR_LAVA();
}

// ---------------------------------------------------------------------------
// Arch Colosseum: Multi-level ring with elevated sniper platforms
// archGoat is a ranged caster — the player needs elevation to match its range
// Central raised ring gives high ground advantage
// ---------------------------------------------------------------------------

function buildArchArena(grid: number[][], size: number): void {
  const mid = Math.floor(size / 2);
  const ringR = 5;

  // Central raised ring (donut shape)
  for (let z = 2; z < size - 2; z++) {
    for (let x = 2; x < size - 2; x++) {
      const dist = Math.sqrt((x - mid) * (x - mid) + (z - mid) * (z - mid));
      if (dist >= 2 && dist <= ringR) {
        grid[z][x] = FLOOR_RAISED();
      }
    }
  }

  // 4 ramp approaches to the ring
  const rampDirs = [{dx: 1, dz: 0}, {dx: -1, dz: 0}, {dx: 0, dz: 1}, {dx: 0, dz: -1}];
  for (const dir of rampDirs) {
    for (let i = ringR; i <= ringR + 2; i++) {
      const rx = mid + dir.dx * i;
      const rz = mid + dir.dz * i;
      if (rx > 1 && rx < size - 1 && rz > 1 && rz < size - 1) {
        grid[rz][rx] = RAMP();
      }
    }
  }

  // Center pit (lava at the very center of the ring)
  grid[mid][mid] = FLOOR_LAVA();
  grid[mid - 1][mid] = FLOOR_LAVA();
  grid[mid + 1][mid] = FLOOR_LAVA();
  grid[mid][mid - 1] = FLOOR_LAVA();
  grid[mid][mid + 1] = FLOOR_LAVA();

  // Outer cover pillars (8 symmetrical positions)
  const outerR = Math.floor(size / 2) - 2;
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const px = mid + Math.round(Math.cos(angle) * outerR);
    const pz = mid + Math.round(Math.sin(angle) * outerR);
    if (px > 1 && px < size - 2 && pz > 1 && pz < size - 2) {
      const wallType = i % 2 === 0 ? WALL_STONE() : WALL_LAVA();
      grid[pz][px] = wallType;
    }
  }
}
