import { CELL_SIZE } from '../../constants';
import type { LevelData } from '../../game/levels/LevelData';
import { MapCell } from '../../game/levels/LevelGenerator';
import { runPlaytest } from '../PlaytestRunner';
import type { Room } from '../schema';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a grid filled with a single cell type. */
function makeGrid(w: number, h: number, fill: MapCell = MapCell.WALL_STONE): MapCell[][] {
  const grid: MapCell[][] = [];
  for (let z = 0; z < h; z++) {
    const row: MapCell[] = [];
    for (let x = 0; x < w; x++) {
      row.push(fill);
    }
    grid.push(row);
  }
  return grid;
}

/** Carve a rectangular room (set cells to EMPTY). */
function carveRoom(grid: MapCell[][], x: number, z: number, w: number, h: number) {
  for (let rz = z; rz < z + h; rz++) {
    for (let rx = x; rx < x + w; rx++) {
      grid[rz][rx] = MapCell.EMPTY;
    }
  }
}

/** Carve a 1-wide corridor from (x, z1) to (x, z2). */
function carveVerticalCorridor(grid: MapCell[][], x: number, z1: number, z2: number) {
  const minZ = Math.min(z1, z2);
  const maxZ = Math.max(z1, z2);
  for (let z = minZ; z <= maxZ; z++) {
    grid[z][x] = MapCell.EMPTY;
  }
}

const DEFAULT_THEME = {
  name: 'firePits',
  displayName: 'THE FIRE PITS',
  primaryWall: 1,
  accentWalls: [3],
  enemyTypes: ['goat' as const],
  enemyDensity: 0.8,
  pickupDensity: 0.6,
  ambientColor: '#ff4422',
};

/** Build a minimal Room object matching the Drizzle Room type. */
function makeRoom(
  id: string,
  levelId: string,
  name: string,
  boundsX: number,
  boundsZ: number,
  boundsW: number,
  boundsH: number,
): Room {
  return {
    id,
    levelId,
    name,
    roomType: 'exploration',
    boundsX,
    boundsZ,
    boundsW,
    boundsH,
    elevation: 0,
    floorCell: null,
    wallCell: null,
    sortOrder: 0,
    floorTexture: null,
    wallTexture: null,
    ceilingTexture: null,
    fillRule: null,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PlaytestRunner', () => {
  it('should pass a simple 2-room level connected by a corridor', () => {
    // 10x10 grid: room A at (1,1)-(4,4), room B at (6,6)-(9,9)
    // connected by corridor at x=3 from z=4 down to z=6
    const grid = makeGrid(10, 10);
    carveRoom(grid, 1, 1, 3, 3); // Room A: (1,1)-(3,3)
    carveRoom(grid, 6, 6, 3, 3); // Room B: (6,6)-(8,8)
    // L-shaped corridor connecting them
    carveVerticalCorridor(grid, 3, 3, 6); // vertical segment
    for (let x = 3; x <= 7; x++) {
      grid[6][x] = MapCell.EMPTY; // horizontal segment
    }

    const levelData: LevelData = {
      width: 10,
      depth: 10,
      floor: 1,
      grid,
      playerSpawn: { x: 2 * CELL_SIZE, y: 1, z: 2 * CELL_SIZE },
      spawns: [
        { type: 'goat', x: 7 * CELL_SIZE, z: 7 * CELL_SIZE },
        { type: 'hellgoat', x: 8 * CELL_SIZE, z: 7 * CELL_SIZE },
      ],
      theme: DEFAULT_THEME,
    };

    const rooms: Room[] = [
      makeRoom('room-a', 'level-1', 'Room A', 1, 1, 3, 3),
      makeRoom('room-b', 'level-1', 'Room B', 6, 6, 3, 3),
    ];

    const result = runPlaytest(levelData, rooms, { maxDuration: 60 });

    expect(result.passed).toBe(true);
    expect(result.roomsVisited).toContain('room-a');
    expect(result.roomsVisited).toContain('room-b');
    expect(result.roomsTotal).toBe(2);
    expect(result.enemiesKilled).toBe(2);
    expect(result.enemiesTotal).toBe(2);
    expect(result.unreachableRooms).toHaveLength(0);
    expect(result.softlocks).toHaveLength(0);
  });

  it('should detect unreachable rooms and fail', () => {
    // 10x10 grid: room A at (1,1)-(3,3), room B at (6,6)-(8,8)
    // NO corridor connecting them — room B is unreachable
    const grid = makeGrid(10, 10);
    carveRoom(grid, 1, 1, 3, 3); // Room A
    carveRoom(grid, 6, 6, 3, 3); // Room B (isolated)

    const levelData: LevelData = {
      width: 10,
      depth: 10,
      floor: 1,
      grid,
      playerSpawn: { x: 2 * CELL_SIZE, y: 1, z: 2 * CELL_SIZE },
      spawns: [{ type: 'goat', x: 7 * CELL_SIZE, z: 7 * CELL_SIZE }],
      theme: DEFAULT_THEME,
    };

    const rooms: Room[] = [
      makeRoom('room-a', 'level-1', 'Room A', 1, 1, 3, 3),
      makeRoom('room-b', 'level-1', 'Room B', 6, 6, 3, 3),
    ];

    const result = runPlaytest(levelData, rooms, { maxDuration: 30 });

    expect(result.passed).toBe(false);
    expect(result.unreachableRooms).toContain('room-b');
    expect(result.roomsVisited).toContain('room-a');
    expect(result.roomsVisited).not.toContain('room-b');
  });

  it('should detect softlocks when agent cannot progress', () => {
    // 10x10 grid: small room only, agent trapped with no target rooms reachable
    const grid = makeGrid(10, 10);
    // Only carve a tiny 2x2 area — agent can move but has no exit
    carveRoom(grid, 1, 1, 2, 2);

    const levelData: LevelData = {
      width: 10,
      depth: 10,
      floor: 1,
      grid,
      playerSpawn: { x: 1 * CELL_SIZE, y: 1, z: 1 * CELL_SIZE },
      spawns: [],
      theme: DEFAULT_THEME,
    };

    // A target room exists but is unreachable
    const rooms: Room[] = [
      makeRoom('room-a', 'level-1', 'Spawn Room', 1, 1, 2, 2),
      makeRoom('room-b', 'level-1', 'Far Room', 7, 7, 2, 2),
    ];

    const result = runPlaytest(levelData, rooms, { maxDuration: 60 });

    expect(result.passed).toBe(false);
    expect(result.unreachableRooms).toContain('room-b');
    expect(result.diagnostics.length).toBeGreaterThan(0);
  });

  it('should count only enemy types and ignore pickups', () => {
    const grid = makeGrid(10, 10);
    carveRoom(grid, 1, 1, 8, 8);

    const levelData: LevelData = {
      width: 10,
      depth: 10,
      floor: 1,
      grid,
      playerSpawn: { x: 2 * CELL_SIZE, y: 1, z: 2 * CELL_SIZE },
      spawns: [
        { type: 'goat', x: 5 * CELL_SIZE, z: 5 * CELL_SIZE },
        { type: 'health', x: 3 * CELL_SIZE, z: 3 * CELL_SIZE },
        { type: 'ammo', x: 4 * CELL_SIZE, z: 4 * CELL_SIZE },
        { type: 'weaponPickup', x: 6 * CELL_SIZE, z: 6 * CELL_SIZE },
        { type: 'fireGoat', x: 7 * CELL_SIZE, z: 7 * CELL_SIZE },
      ],
      theme: DEFAULT_THEME,
    };

    const rooms: Room[] = [makeRoom('room-a', 'level-1', 'Big Room', 1, 1, 8, 8)];

    const result = runPlaytest(levelData, rooms, { maxDuration: 30 });

    expect(result.enemiesTotal).toBe(2); // only goat + fireGoat
    expect(result.passed).toBe(true); // single room, immediately visited
  });

  it('should handle levels with no enemies gracefully', () => {
    const grid = makeGrid(10, 10);
    carveRoom(grid, 1, 1, 8, 8);

    const levelData: LevelData = {
      width: 10,
      depth: 10,
      floor: 1,
      grid,
      playerSpawn: { x: 2 * CELL_SIZE, y: 1, z: 2 * CELL_SIZE },
      spawns: [],
      theme: DEFAULT_THEME,
    };

    const rooms: Room[] = [makeRoom('room-a', 'level-1', 'Empty Room', 1, 1, 8, 8)];

    const result = runPlaytest(levelData, rooms);

    expect(result.passed).toBe(true);
    expect(result.enemiesTotal).toBe(0);
    expect(result.enemiesKilled).toBe(0);
    expect(result.roomsVisited).toContain('room-a');
  });
});
