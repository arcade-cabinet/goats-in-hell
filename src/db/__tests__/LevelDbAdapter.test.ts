import BetterSqlite3 from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { CELL_SIZE } from '../../constants';
import { MapCell } from '../../game/levels/LevelGenerator';
import { packGrid } from '../GridCompiler';
import { toEnvironmentZones, toFloorTheme, toLevelData } from '../LevelDbAdapter';
import { LevelEditor } from '../LevelEditor';
import { migrateAndSeed } from '../migrate';
import * as schema from '../schema';

function createTestDb() {
  const sqliteDb = new BetterSqlite3(':memory:');
  const db = drizzle(sqliteDb, { schema });
  return db;
}

function seedTestTheme(db: ReturnType<typeof createTestDb>) {
  const editor = new LevelEditor(db);
  editor.createTheme('fire-pits', {
    name: 'firePits',
    displayName: 'THE FIRE PITS',
    primaryWall: 1,
    accentWalls: [3, 3],
    fogDensity: 0.03,
    fogColor: '#1a0500',
    ambientColor: '#ff4422',
    ambientIntensity: 0.3,
    skyColor: '#110000',
    particleEffect: 'embers',
    enemyTypes: ['goat', 'hellgoat', 'fireGoat'],
    enemyDensity: 0.8,
    pickupDensity: 0.6,
  });
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
    seedTestTheme(db);
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
      // DB stores grid coords; adapter converts to world coords (× CELL_SIZE=2)
      expect(goatSpawn!.x).toBe(8);
      expect(goatSpawn!.z).toBe(16);
      expect(goatSpawn!.rotation).toBe(1.5);

      const healthSpawn = levelData.spawns.find((s) => s.type === 'health');
      expect(healthSpawn).toBeDefined();
      expect(healthSpawn!.x).toBe(12);
      expect(healthSpawn!.z).toBe(12);
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

  describe('toEnvironmentZones', () => {
    const LEVEL_ID = 'env-zone-level';
    const THEME_ID = 'fire-pits';

    beforeEach(() => {
      const grid = makeTestGrid(10, 10);
      const compiledGrid = Buffer.from(packGrid(grid));

      db.insert(schema.levels)
        .values({
          id: LEVEL_ID,
          name: 'Env Zone Level',
          levelType: 'circle',
          width: 10,
          depth: 10,
          floor: 1,
          spawnX: 5,
          spawnZ: 5,
          themeId: THEME_ID,
          compiledGrid,
        })
        .run();
    });

    it('returns empty array when no zones exist', () => {
      const zones = toEnvironmentZones(db, LEVEL_ID);
      expect(zones).toEqual([]);
    });

    it('converts grid coordinates to world coordinates', () => {
      db.insert(schema.environmentZones)
        .values({
          id: 'zone-fire-1',
          levelId: LEVEL_ID,
          envType: 'fire',
          boundsX: 2,
          boundsZ: 3,
          boundsW: 4,
          boundsH: 5,
          intensity: 0.8,
        })
        .run();

      const zones = toEnvironmentZones(db, LEVEL_ID);
      expect(zones).toHaveLength(1);

      const zone = zones[0];
      expect(zone.id).toBe('zone-fire-1');
      expect(zone.envType).toBe('fire');
      expect(zone.x).toBe(2 * CELL_SIZE);
      expect(zone.z).toBe(3 * CELL_SIZE);
      expect(zone.w).toBe(4 * CELL_SIZE);
      expect(zone.h).toBe(5 * CELL_SIZE);
      expect(zone.intensity).toBe(0.8);
    });

    it('loads direction and timer fields', () => {
      db.insert(schema.environmentZones)
        .values({
          id: 'zone-wind-1',
          levelId: LEVEL_ID,
          envType: 'wind',
          boundsX: 1,
          boundsZ: 1,
          boundsW: 3,
          boundsH: 3,
          intensity: 1.0,
          directionX: 0.5,
          directionZ: -0.5,
          timerOn: 3000,
          timerOff: 2000,
        })
        .run();

      const zones = toEnvironmentZones(db, LEVEL_ID);
      expect(zones).toHaveLength(1);

      const zone = zones[0];
      expect(zone.dirX).toBe(0.5);
      expect(zone.dirZ).toBe(-0.5);
      expect(zone.timerOn).toBe(3000);
      expect(zone.timerOff).toBe(2000);
    });

    it('defaults direction and timer to 0 when null', () => {
      db.insert(schema.environmentZones)
        .values({
          id: 'zone-ice-1',
          levelId: LEVEL_ID,
          envType: 'ice',
          boundsX: 0,
          boundsZ: 0,
          boundsW: 2,
          boundsH: 2,
          intensity: 0.5,
        })
        .run();

      const zones = toEnvironmentZones(db, LEVEL_ID);
      const zone = zones[0];
      expect(zone.dirX).toBe(0);
      expect(zone.dirZ).toBe(0);
      expect(zone.timerOn).toBe(0);
      expect(zone.timerOff).toBe(0);
    });

    it('loads multiple zones for the same level', () => {
      db.insert(schema.environmentZones)
        .values([
          {
            id: 'zone-a',
            levelId: LEVEL_ID,
            envType: 'fire',
            boundsX: 1,
            boundsZ: 1,
            boundsW: 2,
            boundsH: 2,
            intensity: 1.0,
          },
          {
            id: 'zone-b',
            levelId: LEVEL_ID,
            envType: 'ice',
            boundsX: 5,
            boundsZ: 5,
            boundsW: 3,
            boundsH: 3,
            intensity: 0.6,
          },
        ])
        .run();

      const zones = toEnvironmentZones(db, LEVEL_ID);
      expect(zones).toHaveLength(2);

      const types = zones.map((z) => z.envType).sort();
      expect(types).toEqual(['fire', 'ice']);
    });

    it('does not load zones from other levels', () => {
      // Create another level
      const grid = makeTestGrid(6, 6);
      const compiledGrid = Buffer.from(packGrid(grid));
      db.insert(schema.levels)
        .values({
          id: 'other-level',
          name: 'Other Level',
          levelType: 'circle',
          width: 6,
          depth: 6,
          floor: 2,
          spawnX: 3,
          spawnZ: 3,
          themeId: THEME_ID,
          compiledGrid,
        })
        .run();

      // Add zone to other level
      db.insert(schema.environmentZones)
        .values({
          id: 'zone-other',
          levelId: 'other-level',
          envType: 'fog',
          boundsX: 0,
          boundsZ: 0,
          boundsW: 6,
          boundsH: 6,
          intensity: 1.0,
        })
        .run();

      // Should return empty for env-zone-level
      const zones = toEnvironmentZones(db, LEVEL_ID);
      expect(zones).toHaveLength(0);
    });
  });
});
