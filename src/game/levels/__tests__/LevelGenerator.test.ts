/**
 * LevelGenerator tests — constructor, static helpers, BSP dungeon generation.
 */

// Must use `mock` prefix for jest.mock scope
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

import {LevelGenerator, MapCell, CELL_SIZE, WALL_HEIGHT, PLATFORM_HEIGHT} from '../LevelGenerator';

beforeEach(() => {
  mockPrngCounter = 42; // reset seed each test
});

describe('constants', () => {
  it('CELL_SIZE is 2', () => {
    expect(CELL_SIZE).toBe(2);
  });

  it('WALL_HEIGHT is 3', () => {
    expect(WALL_HEIGHT).toBe(3);
  });

  it('PLATFORM_HEIGHT is 2', () => {
    expect(PLATFORM_HEIGHT).toBe(2);
  });
});

describe('MapCell enum', () => {
  it('has expected values', () => {
    expect(MapCell.EMPTY).toBe(0);
    expect(MapCell.WALL_STONE).toBe(1);
    expect(MapCell.WALL_FLESH).toBe(2);
    expect(MapCell.WALL_LAVA).toBe(3);
    expect(MapCell.WALL_OBSIDIAN).toBe(4);
    expect(MapCell.DOOR).toBe(5);
    expect(MapCell.FLOOR_LAVA).toBe(6);
    expect(MapCell.FLOOR_RAISED).toBe(7);
    expect(MapCell.RAMP).toBe(8);
    expect(MapCell.WALL_SECRET).toBe(9);
    expect(MapCell.FLOOR_VOID).toBe(10);
  });
});

describe('LevelGenerator constructor', () => {
  it('creates grid of correct size', () => {
    const gen = new LevelGenerator(20, 20, 1);
    // floor 1: width = min(50, 20 + 1*2) = 22
    expect(gen.grid.length).toBe(22);
    expect(gen.grid[0].length).toBe(22);
  });

  it('scales grid with floor number', () => {
    const gen1 = new LevelGenerator(20, 20, 1);
    const gen5 = new LevelGenerator(20, 20, 5);
    // floor 1: 20 + 2 = 22, floor 5: 20 + 10 = 30
    expect(gen5.width).toBeGreaterThan(gen1.width);
  });

  it('caps grid at 50', () => {
    const gen = new LevelGenerator(40, 40, 10);
    // floor 10: min(50, 40 + 20) = 50
    expect(gen.width).toBe(50);
    expect(gen.depth).toBe(50);
  });

  it('fills grid with primary wall type', () => {
    const gen = new LevelGenerator(20, 20, 1);
    // Floor 1 = firePits, primaryWall = WALL_STONE (1)
    expect(gen.grid[0][0]).toBe(MapCell.WALL_STONE);
    expect(gen.grid[10][10]).toBe(MapCell.WALL_STONE);
  });

  it('stores correct floor and theme', () => {
    const gen = new LevelGenerator(20, 20, 3);
    expect(gen.floor).toBe(3);
    expect(gen.theme.name).toBe('obsidianFortress');
  });
});

describe('LevelGenerator.isWalkable', () => {
  it('EMPTY is walkable', () => {
    expect(LevelGenerator.isWalkable(MapCell.EMPTY)).toBe(true);
  });

  it('DOOR is walkable', () => {
    expect(LevelGenerator.isWalkable(MapCell.DOOR)).toBe(true);
  });

  it('FLOOR_LAVA is walkable', () => {
    expect(LevelGenerator.isWalkable(MapCell.FLOOR_LAVA)).toBe(true);
  });

  it('FLOOR_RAISED is walkable', () => {
    expect(LevelGenerator.isWalkable(MapCell.FLOOR_RAISED)).toBe(true);
  });

  it('RAMP is walkable', () => {
    expect(LevelGenerator.isWalkable(MapCell.RAMP)).toBe(true);
  });

  it('FLOOR_VOID is walkable', () => {
    expect(LevelGenerator.isWalkable(MapCell.FLOOR_VOID)).toBe(true);
  });

  it('walls are not walkable', () => {
    expect(LevelGenerator.isWalkable(MapCell.WALL_STONE)).toBe(false);
    expect(LevelGenerator.isWalkable(MapCell.WALL_FLESH)).toBe(false);
    expect(LevelGenerator.isWalkable(MapCell.WALL_LAVA)).toBe(false);
    expect(LevelGenerator.isWalkable(MapCell.WALL_OBSIDIAN)).toBe(false);
    expect(LevelGenerator.isWalkable(MapCell.WALL_SECRET)).toBe(false);
  });
});

describe('LevelGenerator.getElevation', () => {
  it('EMPTY is ground level (0)', () => {
    expect(LevelGenerator.getElevation(MapCell.EMPTY)).toBe(0);
  });

  it('FLOOR_RAISED is PLATFORM_HEIGHT', () => {
    expect(LevelGenerator.getElevation(MapCell.FLOOR_RAISED)).toBe(PLATFORM_HEIGHT);
  });

  it('RAMP is half PLATFORM_HEIGHT', () => {
    expect(LevelGenerator.getElevation(MapCell.RAMP)).toBe(PLATFORM_HEIGHT * 0.5);
  });

  it('walls are ground level', () => {
    expect(LevelGenerator.getElevation(MapCell.WALL_STONE)).toBe(0);
  });
});

describe('generate()', () => {
  it('produces walkable cells (rooms carved out)', () => {
    const gen = new LevelGenerator(25, 25, 1);
    gen.generate();

    let walkableCount = 0;
    for (let z = 0; z < gen.depth; z++) {
      for (let x = 0; x < gen.width; x++) {
        if (LevelGenerator.isWalkable(gen.grid[z][x])) walkableCount++;
      }
    }
    // A 27x27 grid should have substantial walkable area from BSP rooms
    expect(walkableCount).toBeGreaterThan(50);
  });

  it('sets player spawn position', () => {
    const gen = new LevelGenerator(25, 25, 1);
    gen.generate();

    expect(gen.playerSpawn.x).toBeGreaterThan(0);
    expect(gen.playerSpawn.z).toBeGreaterThan(0);
  });

  it('player spawn is on a walkable cell', () => {
    const gen = new LevelGenerator(25, 25, 1);
    gen.generate();

    const cellX = Math.floor(gen.playerSpawn.x / CELL_SIZE);
    const cellZ = Math.floor(gen.playerSpawn.z / CELL_SIZE);
    expect(LevelGenerator.isWalkable(gen.grid[cellZ][cellX])).toBe(true);
  });

  it('generates enemy spawns', () => {
    const gen = new LevelGenerator(25, 25, 1);
    gen.generate();

    const enemies = gen.spawns.filter(s =>
      ['goat', 'hellgoat', 'fireGoat', 'shadowGoat', 'goatKnight'].includes(s.type)
    );
    expect(enemies.length).toBeGreaterThan(0);
  });

  it('generates pickup spawns', () => {
    const gen = new LevelGenerator(25, 25, 1);
    gen.generate();

    const pickups = gen.spawns.filter(s => s.type === 'health' || s.type === 'ammo');
    expect(pickups.length).toBeGreaterThan(0);
  });

  it('higher floors have more enemies', () => {
    mockPrngCounter = 42;
    const gen1 = new LevelGenerator(25, 25, 1);
    gen1.generate();
    const enemies1 = gen1.spawns.filter(s =>
      ['goat', 'hellgoat', 'fireGoat', 'shadowGoat', 'goatKnight'].includes(s.type)
    ).length;

    mockPrngCounter = 42;
    const gen8 = new LevelGenerator(25, 25, 8);
    gen8.generate();
    const enemies8 = gen8.spawns.filter(s =>
      ['goat', 'hellgoat', 'fireGoat', 'shadowGoat', 'goatKnight'].includes(s.type)
    ).length;

    expect(enemies8).toBeGreaterThan(enemies1);
  });

  it('generate completes without errors on large grids', () => {
    const gen = new LevelGenerator(35, 35, 5);
    gen.generate();
    expect(gen.grid.length).toBe(gen.depth);
    expect(gen.spawns.length).toBeGreaterThan(0);
  });
});
