/**
 * BossArenas tests — arena generation for all 4 boss types.
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

import { BOSS_ARENA_PICKUP_POSITIONS, BOSS_ARENA_SIZE, generateBossArena } from '../BossArenas';

const MC = {
  EMPTY: 0,
  WALL_STONE: 1,
  WALL_LAVA: 3,
  WALL_OBSIDIAN: 4,
  FLOOR_RAISED: 8,
  FLOOR_LAVA: 9,
  RAMP: 10,
};

describe('BOSS_ARENA_SIZE', () => {
  it('is 19', () => {
    expect(BOSS_ARENA_SIZE).toBe(19);
  });
});

describe('BOSS_ARENA_PICKUP_POSITIONS', () => {
  it('has 4 symmetric positions', () => {
    expect(BOSS_ARENA_PICKUP_POSITIONS).toHaveLength(4);
  });

  it('positions are within arena bounds', () => {
    for (const [x, z] of BOSS_ARENA_PICKUP_POSITIONS) {
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(BOSS_ARENA_SIZE - 1);
      expect(z).toBeGreaterThan(0);
      expect(z).toBeLessThan(BOSS_ARENA_SIZE - 1);
    }
  });
});

describe('generateBossArena', () => {
  it('returns 19x19 grid', () => {
    const grid = generateBossArena('infernoGoat');
    expect(grid.length).toBe(19);
    for (const row of grid) {
      expect(row.length).toBe(19);
    }
  });

  it('edges are obsidian walls', () => {
    const grid = generateBossArena('infernoGoat');
    for (let i = 0; i < 19; i++) {
      expect(grid[0][i]).toBe(MC.WALL_OBSIDIAN);
      expect(grid[18][i]).toBe(MC.WALL_OBSIDIAN);
      expect(grid[i][0]).toBe(MC.WALL_OBSIDIAN);
      expect(grid[i][18]).toBe(MC.WALL_OBSIDIAN);
    }
  });
});

describe('infernoGoat arena', () => {
  const grid = generateBossArena('infernoGoat');

  it('has lava channels at rows 5 and 13', () => {
    let lavaRow5 = 0;
    let lavaRow13 = 0;
    for (let x = 2; x < 17; x++) {
      if (grid[5][x] === MC.FLOOR_LAVA || grid[5][x] === MC.RAMP) lavaRow5++;
      if (grid[13][x] === MC.FLOOR_LAVA || grid[13][x] === MC.RAMP) lavaRow13++;
    }
    expect(lavaRow5).toBeGreaterThan(0);
    expect(lavaRow13).toBeGreaterThan(0);
  });

  it('has stone cover pillars', () => {
    let stoneCount = 0;
    for (let z = 1; z < 18; z++) {
      for (let x = 1; x < 18; x++) {
        if (grid[z][x] === MC.WALL_STONE) stoneCount++;
      }
    }
    expect(stoneCount).toBeGreaterThan(0);
  });

  it('has raised corner platforms', () => {
    expect(grid[2][2]).toBe(MC.FLOOR_RAISED);
    expect(grid[2][3]).toBe(MC.FLOOR_RAISED);
  });
});

describe('voidGoat arena', () => {
  const grid = generateBossArena('voidGoat');

  it('has central lava pit', () => {
    // Center of 19x19 is (9,9)
    expect(grid[9][9]).not.toBe(MC.EMPTY);
  });

  it('has bridges crossing the pit', () => {
    let rampCount = 0;
    for (let i = 0; i < 19; i++) {
      if (grid[9][i] === MC.RAMP) rampCount++;
      if (grid[i][9] === MC.RAMP) rampCount++;
    }
    expect(rampCount).toBeGreaterThan(0);
  });

  it('has lava in corners', () => {
    // Corners should have lava to make arena feel circular
    let cornerLava = 0;
    for (let z = 1; z < 4; z++) {
      for (let x = 1; x < 4; x++) {
        if (grid[z][x] === MC.FLOOR_LAVA) cornerLava++;
      }
    }
    expect(cornerLava).toBeGreaterThan(0);
  });
});

describe('ironGoat arena', () => {
  const grid = generateBossArena('ironGoat');

  it('has obsidian fortress walls', () => {
    let fortressWalls = 0;
    for (let z = 3; z < 16; z++) {
      for (let x = 3; x < 16; x++) {
        if (grid[z][x] === MC.WALL_OBSIDIAN) fortressWalls++;
      }
    }
    expect(fortressWalls).toBeGreaterThan(0);
  });

  it('has raised sniper positions in corners', () => {
    expect(grid[2][2]).toBe(MC.FLOOR_RAISED);
    expect(grid[16][16]).toBe(MC.FLOOR_RAISED);
  });

  it('has lava traps at corridor dead-ends', () => {
    expect(grid[2][9]).toBe(MC.FLOOR_LAVA);
    expect(grid[16][9]).toBe(MC.FLOOR_LAVA);
  });
});

describe('archGoat arena (default)', () => {
  const grid = generateBossArena('archGoat');

  it('has central raised ring', () => {
    let raisedCount = 0;
    for (let z = 2; z < 17; z++) {
      for (let x = 2; x < 17; x++) {
        if (grid[z][x] === MC.FLOOR_RAISED) raisedCount++;
      }
    }
    expect(raisedCount).toBeGreaterThan(10);
  });

  it('has center lava pit', () => {
    expect(grid[9][9]).toBe(MC.FLOOR_LAVA);
  });

  it('has ramp approaches', () => {
    let rampCount = 0;
    for (let z = 0; z < 19; z++) {
      for (let x = 0; x < 19; x++) {
        if (grid[z][x] === MC.RAMP) rampCount++;
      }
    }
    expect(rampCount).toBeGreaterThan(0);
  });

  it('uses default when bossType undefined', () => {
    const defaultGrid = generateBossArena(undefined);
    // Default should produce same layout as archGoat
    expect(defaultGrid[9][9]).toBe(MC.FLOOR_LAVA);
  });
});
