import BetterSqlite3 from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { CELL_SIZE } from '../../constants';
import { MapCell } from '../../game/levels/LevelGenerator';
import { packGrid } from '../GridCompiler';
import { toFloorTheme, toLevelData } from '../LevelDbAdapter';
import { migrateAndSeed } from '../migrate';
import * as schema from '../schema';

function createTestDb() {
  const sqliteDb = new BetterSqlite3(':memory:');
  const db = drizzle(sqliteDb, { schema });
  return db;
}

/** Build a simple 4x4 grid with walls on the border and empty inside. */
function makeTestGrid(width: number, depth: number): MapCell[][] {
  const grid: MapCell[][] = [];
  for (let z = 0; z < depth; z++) {
    const row: MapCell[] = [];
    for (let x = 0; x < width; x++) {
      if (x === 0 || x === width - 1 || z === 0 || z === depth - 1) {
        row.push(MapCell.WALL_STONE);
      } else {
        row.push(MapCell.EMPTY);
      }
    }
    grid.push(row);
  }
  return grid;
}

describe('LevelDbAdapter', () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(async () => {
    db = createTestDb();
    await migrateAndSeed(db);
  });

  describe('toFloorTheme', () => {
    it('converts a DB theme row to FloorTheme', () => {
      const themeRows = db.select().from(schema.themes).all();
      expect(themeRows.length).toBeGreaterThan(0);

      const dbTheme = themeRows[0];
      const floorTheme = toFloorTheme(dbTheme);

      expect(floorTheme.name).toBe(dbTheme.name);
      expect(floorTheme.displayName).toBe(dbTheme.displayName);
      expect(floorTheme.primaryWall).toBe(dbTheme.primaryWall);
      expect(floorTheme.accentWalls).toEqual(dbTheme.accentWalls);
      expect(floorTheme.enemyTypes).toEqual(dbTheme.enemyTypes);
      expect(floorTheme.enemyDensity).toBe(dbTheme.enemyDensity);
      expect(floorTheme.pickupDensity).toBe(dbTheme.pickupDensity);
      expect(floorTheme.ambientColor).toBe(dbTheme.ambientColor);
    });
  });

  describe('toLevelData', () => {
    const LEVEL_ID = 'test-level-1';
    const THEME_ID = 'fire-pits'; // Seeded by migrateAndSeed
    const WIDTH = 6;
    const DEPTH = 6;
    const SPAWN_X = 3; // grid coordinates
    const SPAWN_Z = 3;

    beforeEach(() => {
      const grid = makeTestGrid(WIDTH, DEPTH);
      const compiledGrid = Buffer.from(packGrid(grid));

      db.insert(schema.levels)
        .values({
          id: LEVEL_ID,
          name: 'Test Level',
          levelType: 'procedural',
          width: WIDTH,
          depth: DEPTH,
          floor: 1,
          spawnX: SPAWN_X,
          spawnZ: SPAWN_Z,
          themeId: THEME_ID,
          compiledGrid,
        })
        .run();

      // Room (not strictly required by toLevelData but keeps schema consistent)
      db.insert(schema.rooms)
        .values({
          id: 'room-1',
          levelId: LEVEL_ID,
          name: 'Main Room',
          roomType: 'exploration',
          boundsX: 1,
          boundsZ: 1,
          boundsW: 4,
          boundsH: 4,
        })
        .run();

      // Non-triggered entities (should appear in spawns)
      db.insert(schema.entities)
        .values({
          id: 'ent-goat-1',
          levelId: LEVEL_ID,
          roomId: 'room-1',
          entityType: 'goat',
          x: 4,
          z: 8,
          facing: 1.5,
          spawnCategory: 'enemy',
        })
        .run();

      db.insert(schema.entities)
        .values({
          id: 'ent-health-1',
          levelId: LEVEL_ID,
          roomId: 'room-1',
          entityType: 'health',
          x: 6,
          z: 6,
          spawnCategory: 'pickup',
        })
        .run();

      // Weapon pickup with overrides containing weaponId
      db.insert(schema.entities)
        .values({
          id: 'ent-weapon-1',
          levelId: LEVEL_ID,
          roomId: 'room-1',
          entityType: 'weaponPickup',
          x: 10,
          z: 10,
          spawnCategory: 'pickup',
          overrides: { weaponId: 'brimShotgun' },
        })
        .run();

      // Trigger + triggered entity (should be EXCLUDED from spawns)
      db.insert(schema.triggers)
        .values({
          id: 'trigger-1',
          levelId: LEVEL_ID,
          roomId: 'room-1',
          action: 'spawnWave',
          zoneX: 2,
          zoneZ: 2,
          zoneW: 2,
          zoneH: 2,
        })
        .run();

      db.insert(schema.entities)
        .values({
          id: 'ent-triggered-1',
          levelId: LEVEL_ID,
          roomId: 'room-1',
          entityType: 'hellgoat',
          x: 4,
          z: 4,
          spawnCategory: 'enemy',
          triggerId: 'trigger-1',
        })
        .run();
    });

    it('returns correct LevelData structure', () => {
      const levelData = toLevelData(db, LEVEL_ID);

      expect(levelData.width).toBe(WIDTH);
      expect(levelData.depth).toBe(DEPTH);
      expect(levelData.floor).toBe(1);
    });

    it('unpacks the grid correctly', () => {
      const levelData = toLevelData(db, LEVEL_ID);

      expect(levelData.grid.length).toBe(DEPTH);
      expect(levelData.grid[0].length).toBe(WIDTH);

      // Border cells are WALL_STONE
      expect(levelData.grid[0][0]).toBe(MapCell.WALL_STONE);
      expect(levelData.grid[0][WIDTH - 1]).toBe(MapCell.WALL_STONE);

      // Interior cells are EMPTY
      expect(levelData.grid[1][1]).toBe(MapCell.EMPTY);
      expect(levelData.grid[2][2]).toBe(MapCell.EMPTY);
    });

    it('scales playerSpawn by CELL_SIZE', () => {
      const levelData = toLevelData(db, LEVEL_ID);

      expect(levelData.playerSpawn).toEqual({
        x: SPAWN_X * CELL_SIZE,
        y: 1,
        z: SPAWN_Z * CELL_SIZE,
      });
    });

    it('includes non-triggered entities in spawns', () => {
      const levelData = toLevelData(db, LEVEL_ID);

      const goatSpawn = levelData.spawns.find((s) => s.type === 'goat');
      expect(goatSpawn).toBeDefined();
      expect(goatSpawn!.x).toBe(4);
      expect(goatSpawn!.z).toBe(8);
      expect(goatSpawn!.rotation).toBe(1.5);

      const healthSpawn = levelData.spawns.find((s) => s.type === 'health');
      expect(healthSpawn).toBeDefined();
      expect(healthSpawn!.x).toBe(6);
      expect(healthSpawn!.z).toBe(6);
    });

    it('includes weaponId from overrides', () => {
      const levelData = toLevelData(db, LEVEL_ID);

      const weaponSpawn = levelData.spawns.find((s) => s.type === 'weaponPickup');
      expect(weaponSpawn).toBeDefined();
      expect(weaponSpawn!.weaponId).toBe('brimShotgun');
    });

    it('excludes entities with trigger_id from spawns', () => {
      const levelData = toLevelData(db, LEVEL_ID);

      const triggeredSpawn = levelData.spawns.find((s) => s.type === 'hellgoat');
      expect(triggeredSpawn).toBeUndefined();
    });

    it('builds FloorTheme from DB theme', () => {
      const levelData = toLevelData(db, LEVEL_ID);

      expect(levelData.theme.name).toBe('firePits');
      expect(levelData.theme.displayName).toBe('THE FIRE PITS');
      expect(levelData.theme.primaryWall).toBe(1); // WALL_STONE
      expect(levelData.theme.accentWalls).toEqual([3, 3]);
      expect(levelData.theme.ambientColor).toBe('#ff4422');
    });

    it('throws when level not found', () => {
      expect(() => toLevelData(db, 'nonexistent')).toThrow('Level not found: nonexistent');
    });

    it('throws when compiled grid is missing', () => {
      db.insert(schema.levels)
        .values({
          id: 'no-grid',
          name: 'No Grid',
          levelType: 'procedural',
          width: 4,
          depth: 4,
          floor: 1,
          spawnX: 1,
          spawnZ: 1,
          themeId: THEME_ID,
          compiledGrid: null,
        })
        .run();

      expect(() => toLevelData(db, 'no-grid')).toThrow('has no compiled grid');
    });
  });
});
