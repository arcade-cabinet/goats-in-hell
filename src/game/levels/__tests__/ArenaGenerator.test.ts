/**
 * ArenaGenerator tests — arena grid generation, layout cycling, spawn points.
 */

jest.mock('../../levels/LevelGenerator', () => ({
  MapCell: {
    EMPTY: 0,
    WALL_STONE: 1,
    WALL_FLESH: 2,
    WALL_LAVA: 3,
    WALL_OBSIDIAN: 4,
    DOOR: 5,
    WALL_SECRET: 6,
    VOID: 7,
    FLOOR_RAISED: 8,
    FLOOR_LAVA: 9,
    RAMP: 10,
  },
  CELL_SIZE: 2,
  WALL_HEIGHT: 3,
  PLATFORM_HEIGHT: 1,
}));

// Deterministic PRNG for reproducible tests (must be prefixed `mock` for jest.mock scope)
let mockPrngCounter = 0;
jest.mock('../../../state/GameStore', () => ({
  useGameStore: {
    getState: () => ({
      rng: () => {
        mockPrngCounter = (mockPrngCounter * 1103515245 + 12345) & 0x7fffffff;
        return (mockPrngCounter % 1000) / 1000;
      },
    }),
  },
}));

import { generateArena, getArenaPlayerSpawn } from '../ArenaGenerator';

const MC = {
  EMPTY: 0,
  WALL_STONE: 1,
  WALL_LAVA: 3,
  WALL_OBSIDIAN: 4,
  FLOOR_RAISED: 8,
  FLOOR_LAVA: 9,
  RAMP: 10,
};

beforeEach(() => {
  mockPrngCounter = 42; // reset seed each test
});

describe('generateArena', () => {
  it('returns correct grid dimensions', () => {
    const grid = generateArena(24, 1);
    expect(grid.length).toBe(24);
    for (const row of grid) {
      expect(row.length).toBe(24);
    }
  });

  it('defaults to size 24', () => {
    const grid = generateArena();
    expect(grid.length).toBe(24);
  });

  it('edges are obsidian walls', () => {
    const grid = generateArena(20, 1);
    for (let i = 0; i < 20; i++) {
      expect(grid[0][i]).toBe(MC.WALL_OBSIDIAN);
      expect(grid[19][i]).toBe(MC.WALL_OBSIDIAN);
      expect(grid[i][0]).toBe(MC.WALL_OBSIDIAN);
      expect(grid[i][19]).toBe(MC.WALL_OBSIDIAN);
    }
  });

  it('interior is not all empty (has features)', () => {
    const grid = generateArena(24, 1);
    let nonEmpty = 0;
    for (let z = 1; z < 23; z++) {
      for (let x = 1; x < 23; x++) {
        if (grid[z][x] !== MC.EMPTY) nonEmpty++;
      }
    }
    expect(nonEmpty).toBeGreaterThan(0);
  });
});

describe('layout cycling', () => {
  it('floor 1 uses crucible layout', () => {
    const grid = generateArena(24, 1);
    // Crucible has raised corner platforms
    const q = Math.floor(24 / 4);
    expect(grid[q][q]).toBe(MC.FLOOR_RAISED);
  });

  it('floor 2 uses colosseum layout', () => {
    const grid = generateArena(24, 2);
    // Colosseum has central raised platform
    const mid = 12;
    expect(grid[mid][mid]).toBe(MC.FLOOR_RAISED);
  });

  it('floor 3 uses gauntlet layout', () => {
    const grid = generateArena(24, 3);
    // Gauntlet has obsidian corridor walls at x=3,4
    let wallCount = 0;
    for (let z = 2; z < 22; z++) {
      if (grid[z][3] === MC.WALL_OBSIDIAN) wallCount++;
    }
    expect(wallCount).toBeGreaterThan(0);
  });

  it('floor 4 uses hellpit layout', () => {
    const grid = generateArena(24, 4);
    // Hellpit has lava ring
    let lavaCount = 0;
    for (let z = 2; z < 22; z++) {
      for (let x = 2; x < 22; x++) {
        if (grid[z][x] === MC.FLOOR_LAVA) lavaCount++;
      }
    }
    expect(lavaCount).toBeGreaterThan(0);
  });

  it('floor 5 cycles back to crucible', () => {
    const grid5 = generateArena(24, 5);
    const q = Math.floor(24 / 4);
    expect(grid5[q][q]).toBe(MC.FLOOR_RAISED);
  });
});

describe('getArenaPlayerSpawn', () => {
  it('returns center of grid', () => {
    const spawn = getArenaPlayerSpawn(24);
    expect(spawn.x).toBe(12);
    expect(spawn.z).toBe(12);
  });

  it('works for different sizes', () => {
    const spawn = getArenaPlayerSpawn(20);
    expect(spawn.x).toBe(10);
    expect(spawn.z).toBe(10);
  });
});
