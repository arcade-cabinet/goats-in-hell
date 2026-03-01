import BetterSqlite3 from 'better-sqlite3';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { MapCell } from '../../game/levels/LevelGenerator';
import { unpackGrid } from '../GridCompiler';
import { LevelEditor } from '../LevelEditor';
import { migrateAndSeed } from '../migrate';
import * as schema from '../schema';

function createTestDb() {
  const sqliteDb = new BetterSqlite3(':memory:');
  const db = drizzle(sqliteDb, { schema });
  return db;
}

describe('LevelEditor', () => {
  let db: ReturnType<typeof createTestDb>;
  let editor: LevelEditor;

  const THEME_ID = 'fire-pits';
  const LEVEL_ID = 'test-level';

  beforeEach(async () => {
    db = createTestDb();
    await migrateAndSeed(db);
    editor = new LevelEditor(db);
    // Seed test theme
    editor.createTheme(THEME_ID, {
      name: 'firePits',
      displayName: 'THE FIRE PITS',
      primaryWall: 1,
      accentWalls: [3, 3],
      ambientColor: '#ff4422',
    });
  });

  // -------------------------------------------------------------------------
  // createLevel
  // -------------------------------------------------------------------------

  describe('createLevel', () => {
    it('inserts a level row into the database', () => {
      editor.createLevel(LEVEL_ID, {
        name: 'Test Level',
        levelType: 'procedural',
        width: 20,
        depth: 20,
        floor: 1,
        themeId: THEME_ID,
      });

      const level = db.select().from(schema.levels).where(eq(schema.levels.id, LEVEL_ID)).get();

      expect(level).toBeDefined();
      expect(level!.name).toBe('Test Level');
      expect(level!.levelType).toBe('procedural');
      expect(level!.width).toBe(20);
      expect(level!.depth).toBe(20);
      expect(level!.floor).toBe(1);
      expect(level!.themeId).toBe(THEME_ID);
      expect(level!.spawnX).toBe(0);
      expect(level!.spawnZ).toBe(0);
    });

    it('stores optional fields when provided', () => {
      editor.createLevel(LEVEL_ID, {
        name: 'Circle of Lust',
        levelType: 'circle',
        width: 30,
        depth: 30,
        floor: 2,
        themeId: THEME_ID,
        circleNumber: 2,
        sin: 'lust',
        guardian: 'Cleopatra',
        music: 'circle2.ogg',
        spawnX: 5,
        spawnZ: 10,
        spawnFacing: 1.57,
      });

      const level = db.select().from(schema.levels).where(eq(schema.levels.id, LEVEL_ID)).get();

      expect(level!.circleNumber).toBe(2);
      expect(level!.sin).toBe('lust');
      expect(level!.guardian).toBe('Cleopatra');
      expect(level!.music).toBe('circle2.ogg');
      expect(level!.spawnX).toBe(5);
      expect(level!.spawnZ).toBe(10);
      expect(level!.spawnFacing).toBeCloseTo(1.57);
    });
  });

  // -------------------------------------------------------------------------
  // addRoom
  // -------------------------------------------------------------------------

  describe('addRoom', () => {
    beforeEach(() => {
      editor.createLevel(LEVEL_ID, {
        name: 'Test',
        levelType: 'procedural',
        width: 20,
        depth: 20,
        floor: 1,
        themeId: THEME_ID,
      });
    });

    it('inserts a room and returns its id', () => {
      const roomId = editor.addRoom(LEVEL_ID, 'Spawn Room', {
        roomType: 'exploration',
        boundsX: 2,
        boundsZ: 2,
        boundsW: 6,
        boundsH: 6,
      });

      expect(typeof roomId).toBe('string');
      expect(roomId.length).toBeGreaterThan(0);

      const room = db.select().from(schema.rooms).where(eq(schema.rooms.id, roomId)).get();

      expect(room).toBeDefined();
      expect(room!.name).toBe('Spawn Room');
      expect(room!.roomType).toBe('exploration');
      expect(room!.boundsX).toBe(2);
      expect(room!.boundsZ).toBe(2);
      expect(room!.boundsW).toBe(6);
      expect(room!.boundsH).toBe(6);
      expect(room!.elevation).toBe(0);
    });

    it('stores optional room fields', () => {
      const roomId = editor.addRoom(LEVEL_ID, 'Raised Arena', {
        roomType: 'arena',
        boundsX: 5,
        boundsZ: 5,
        boundsW: 8,
        boundsH: 8,
        elevation: 1,
        floorCell: MapCell.FLOOR_RAISED,
        wallCell: MapCell.WALL_OBSIDIAN,
        sortOrder: 2,
      });

      const room = db.select().from(schema.rooms).where(eq(schema.rooms.id, roomId)).get();

      expect(room!.elevation).toBe(1);
      expect(room!.floorCell).toBe(MapCell.FLOOR_RAISED);
      expect(room!.wallCell).toBe(MapCell.WALL_OBSIDIAN);
      expect(room!.sortOrder).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  // connect
  // -------------------------------------------------------------------------

  describe('connect', () => {
    let r1: string;
    let r2: string;

    beforeEach(() => {
      editor.createLevel(LEVEL_ID, {
        name: 'Test',
        levelType: 'procedural',
        width: 30,
        depth: 30,
        floor: 1,
        themeId: THEME_ID,
      });
      r1 = editor.addRoom(LEVEL_ID, 'Room A', {
        roomType: 'exploration',
        boundsX: 2,
        boundsZ: 2,
        boundsW: 5,
        boundsH: 5,
      });
      r2 = editor.addRoom(LEVEL_ID, 'Room B', {
        roomType: 'arena',
        boundsX: 15,
        boundsZ: 15,
        boundsW: 5,
        boundsH: 5,
      });
    });

    it('inserts a connection and returns its id', () => {
      const connId = editor.connect(LEVEL_ID, r1, r2, {
        connectionType: 'corridor',
      });

      expect(typeof connId).toBe('string');

      const conn = db
        .select()
        .from(schema.connections)
        .where(eq(schema.connections.id, connId))
        .get();

      expect(conn).toBeDefined();
      expect(conn!.fromRoomId).toBe(r1);
      expect(conn!.toRoomId).toBe(r2);
      expect(conn!.connectionType).toBe('corridor');
      expect(conn!.corridorWidth).toBe(2); // default
    });

    it('stores optional connection fields', () => {
      const connId = editor.connect(LEVEL_ID, r1, r2, {
        connectionType: 'stairs',
        corridorWidth: 3,
        direction: 'n',
        fromElevation: 0,
        toElevation: 1,
        length: 5,
      });

      const conn = db
        .select()
        .from(schema.connections)
        .where(eq(schema.connections.id, connId))
        .get();

      expect(conn!.connectionType).toBe('stairs');
      expect(conn!.corridorWidth).toBe(3);
      expect(conn!.direction).toBe('n');
      expect(conn!.fromElevation).toBe(0);
      expect(conn!.toElevation).toBe(1);
      expect(conn!.length).toBe(5);
    });
  });

  // -------------------------------------------------------------------------
  // addEntity
  // -------------------------------------------------------------------------

  describe('addEntity', () => {
    beforeEach(() => {
      editor.createLevel(LEVEL_ID, {
        name: 'Test',
        levelType: 'procedural',
        width: 20,
        depth: 20,
        floor: 1,
        themeId: THEME_ID,
      });
    });

    it('inserts an entity and returns its id', () => {
      const entityId = editor.addEntity(LEVEL_ID, {
        entityType: 'goat',
        x: 10,
        z: 12,
        spawnCategory: 'enemy',
      });

      expect(typeof entityId).toBe('string');

      const entity = db
        .select()
        .from(schema.entities)
        .where(eq(schema.entities.id, entityId))
        .get();

      expect(entity).toBeDefined();
      expect(entity!.entityType).toBe('goat');
      expect(entity!.x).toBe(10);
      expect(entity!.z).toBe(12);
      expect(entity!.spawnCategory).toBe('enemy');
    });

    it('stores optional entity fields', () => {
      const entityId = editor.addEntity(LEVEL_ID, {
        entityType: 'hellgoat',
        x: 5,
        z: 5,
        spawnCategory: 'enemy',
        elevation: 2,
        facing: 3.14,
        patrol: [
          { x: 5, z: 5 },
          { x: 10, z: 5 },
        ],
        overrides: { health: 200 },
      });

      const entity = db
        .select()
        .from(schema.entities)
        .where(eq(schema.entities.id, entityId))
        .get();

      expect(entity!.elevation).toBe(2);
      expect(entity!.facing).toBeCloseTo(3.14);
      expect(entity!.patrol).toEqual([
        { x: 5, z: 5 },
        { x: 10, z: 5 },
      ]);
      expect(entity!.overrides).toEqual({ health: 200 });
    });
  });

  // -------------------------------------------------------------------------
  // addTrigger
  // -------------------------------------------------------------------------

  describe('addTrigger', () => {
    beforeEach(() => {
      editor.createLevel(LEVEL_ID, {
        name: 'Test',
        levelType: 'procedural',
        width: 20,
        depth: 20,
        floor: 1,
        themeId: THEME_ID,
      });
    });

    it('inserts a trigger and returns its id', () => {
      const triggerId = editor.addTrigger(LEVEL_ID, {
        action: 'spawnWave',
        zoneX: 3,
        zoneZ: 3,
        zoneW: 4,
        zoneH: 4,
      });

      expect(typeof triggerId).toBe('string');

      const trigger = db
        .select()
        .from(schema.triggers)
        .where(eq(schema.triggers.id, triggerId))
        .get();

      expect(trigger).toBeDefined();
      expect(trigger!.action).toBe('spawnWave');
      expect(trigger!.zoneX).toBe(3);
      expect(trigger!.zoneZ).toBe(3);
      expect(trigger!.zoneW).toBe(4);
      expect(trigger!.zoneH).toBe(4);
      expect(trigger!.once).toBe(true); // default
    });

    it('stores optional trigger fields', () => {
      const triggerId = editor.addTrigger(LEVEL_ID, {
        action: 'lockDoors',
        zoneX: 1,
        zoneZ: 1,
        zoneW: 2,
        zoneH: 2,
        once: false,
        delay: 1.5,
        actionData: { waveCount: 3 },
      });

      const trigger = db
        .select()
        .from(schema.triggers)
        .where(eq(schema.triggers.id, triggerId))
        .get();

      expect(trigger!.once).toBe(false);
      expect(trigger!.delay).toBe(1.5);
      expect(trigger!.actionData).toEqual({ waveCount: 3 });
    });
  });

  // -------------------------------------------------------------------------
  // addEnvironmentZone
  // -------------------------------------------------------------------------

  describe('addEnvironmentZone', () => {
    beforeEach(() => {
      editor.createLevel(LEVEL_ID, {
        name: 'Test',
        levelType: 'procedural',
        width: 20,
        depth: 20,
        floor: 1,
        themeId: THEME_ID,
      });
    });

    it('inserts an environment zone and returns its id', () => {
      const zoneId = editor.addEnvironmentZone(LEVEL_ID, {
        envType: 'fire',
        boundsX: 5,
        boundsZ: 5,
        boundsW: 6,
        boundsH: 6,
      });

      expect(typeof zoneId).toBe('string');

      const zone = db
        .select()
        .from(schema.environmentZones)
        .where(eq(schema.environmentZones.id, zoneId))
        .get();

      expect(zone).toBeDefined();
      expect(zone!.envType).toBe('fire');
      expect(zone!.boundsX).toBe(5);
      expect(zone!.intensity).toBe(1.0); // default
    });

    it('stores optional zone fields', () => {
      const zoneId = editor.addEnvironmentZone(LEVEL_ID, {
        envType: 'wind',
        boundsX: 0,
        boundsZ: 0,
        boundsW: 10,
        boundsH: 10,
        intensity: 0.5,
        directionX: 1,
        directionZ: 0,
        timerOn: 3,
        timerOff: 2,
      });

      const zone = db
        .select()
        .from(schema.environmentZones)
        .where(eq(schema.environmentZones.id, zoneId))
        .get();

      expect(zone!.intensity).toBe(0.5);
      expect(zone!.directionX).toBe(1);
      expect(zone!.directionZ).toBe(0);
      expect(zone!.timerOn).toBe(3);
      expect(zone!.timerOff).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  // compile
  // -------------------------------------------------------------------------

  describe('compile', () => {
    it('compiles rooms and connections into a packed grid BLOB', () => {
      editor.createLevel(LEVEL_ID, {
        name: 'Compile Test',
        levelType: 'procedural',
        width: 12,
        depth: 12,
        floor: 1,
        themeId: THEME_ID,
      });

      const r1 = editor.room(LEVEL_ID, 'spawn', 1, 1, 4, 4);
      const r2 = editor.room(LEVEL_ID, 'arena', 7, 7, 4, 4);
      editor.corridor(LEVEL_ID, r1, r2);

      editor.compile(LEVEL_ID);

      const level = db.select().from(schema.levels).where(eq(schema.levels.id, LEVEL_ID)).get();

      expect(level!.compiledGrid).not.toBeNull();

      const blob = new Uint8Array(level!.compiledGrid!);
      const grid = unpackGrid(blob, 12, 12);

      // Room 1 interior carved as EMPTY
      expect(grid[2][2]).toBe(MapCell.EMPTY);

      // Room 2 interior carved as EMPTY
      expect(grid[8][8]).toBe(MapCell.EMPTY);

      // Border should be primary wall (WALL_STONE for fire-pits theme)
      expect(grid[0][0]).toBe(MapCell.WALL_STONE);
    });

    it('throws when level not found', () => {
      expect(() => editor.compile('nonexistent')).toThrow('Level not found: nonexistent');
    });
  });

  // -------------------------------------------------------------------------
  // validate
  // -------------------------------------------------------------------------

  describe('validate', () => {
    it('returns valid for a well-formed level', () => {
      editor.createLevel(LEVEL_ID, {
        name: 'Valid Level',
        levelType: 'procedural',
        width: 20,
        depth: 20,
        floor: 1,
        themeId: THEME_ID,
        spawnX: 4,
        spawnZ: 4,
      });

      const r1 = editor.room(LEVEL_ID, 'spawn', 2, 2, 5, 5);
      const r2 = editor.room(LEVEL_ID, 'arena', 10, 10, 5, 5);
      editor.corridor(LEVEL_ID, r1, r2);

      const result = editor.validate(LEVEL_ID);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('detects level with no rooms', () => {
      editor.createLevel(LEVEL_ID, {
        name: 'Empty Level',
        levelType: 'procedural',
        width: 10,
        depth: 10,
        floor: 1,
        themeId: THEME_ID,
      });

      const result = editor.validate(LEVEL_ID);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining('no rooms'));
    });

    it('detects spawn point outside any room', () => {
      editor.createLevel(LEVEL_ID, {
        name: 'Bad Spawn',
        levelType: 'procedural',
        width: 20,
        depth: 20,
        floor: 1,
        themeId: THEME_ID,
        spawnX: 0,
        spawnZ: 0,
      });

      editor.room(LEVEL_ID, 'room', 5, 5, 4, 4);

      const result = editor.validate(LEVEL_ID);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining('Spawn point'));
    });

    it('detects entity outside level bounds', () => {
      editor.createLevel(LEVEL_ID, {
        name: 'OOB Entity',
        levelType: 'procedural',
        width: 10,
        depth: 10,
        floor: 1,
        themeId: THEME_ID,
        spawnX: 3,
        spawnZ: 3,
      });

      editor.room(LEVEL_ID, 'room', 1, 1, 5, 5);
      editor.addEntity(LEVEL_ID, {
        entityType: 'goat',
        x: 15,
        z: 15,
        spawnCategory: 'enemy',
      });

      const result = editor.validate(LEVEL_ID);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining('outside level bounds'));
    });

    it('detects unreachable rooms', () => {
      editor.createLevel(LEVEL_ID, {
        name: 'Disconnected',
        levelType: 'procedural',
        width: 30,
        depth: 30,
        floor: 1,
        themeId: THEME_ID,
        spawnX: 4,
        spawnZ: 4,
      });

      editor.room(LEVEL_ID, 'spawn', 2, 2, 5, 5);
      editor.room(LEVEL_ID, 'island', 20, 20, 5, 5);
      // No connection between them

      const result = editor.validate(LEVEL_ID);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining('not reachable from spawn'));
    });

    it('detects cycles in directed room graph', () => {
      editor.createLevel(LEVEL_ID, {
        name: 'Cycle',
        levelType: 'procedural',
        width: 30,
        depth: 30,
        floor: 1,
        themeId: THEME_ID,
        spawnX: 4,
        spawnZ: 4,
      });

      const r1 = editor.room(LEVEL_ID, 'A', 2, 2, 5, 5);
      const r2 = editor.room(LEVEL_ID, 'B', 10, 10, 5, 5);
      const r3 = editor.room(LEVEL_ID, 'C', 20, 20, 5, 5);

      editor.corridor(LEVEL_ID, r1, r2);
      editor.corridor(LEVEL_ID, r2, r3);
      editor.corridor(LEVEL_ID, r3, r1); // creates a cycle

      const result = editor.validate(LEVEL_ID);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining('cycle'));
    });

    it('returns error for nonexistent level', () => {
      const result = editor.validate('nonexistent');
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining('Level not found'));
    });
  });

  // -------------------------------------------------------------------------
  // Convenience methods
  // -------------------------------------------------------------------------

  describe('convenience methods', () => {
    beforeEach(() => {
      editor.createLevel(LEVEL_ID, {
        name: 'Test',
        levelType: 'procedural',
        width: 30,
        depth: 30,
        floor: 1,
        themeId: THEME_ID,
      });
    });

    it('room() delegates to addRoom with positional args', () => {
      const roomId = editor.room(LEVEL_ID, 'Hall', 5, 5, 8, 8, {
        roomType: 'hub',
        elevation: 1,
      });

      const room = db.select().from(schema.rooms).where(eq(schema.rooms.id, roomId)).get();

      expect(room!.name).toBe('Hall');
      expect(room!.roomType).toBe('hub');
      expect(room!.boundsX).toBe(5);
      expect(room!.boundsZ).toBe(5);
      expect(room!.boundsW).toBe(8);
      expect(room!.boundsH).toBe(8);
      expect(room!.elevation).toBe(1);
    });

    it('room() defaults roomType to exploration', () => {
      const roomId = editor.room(LEVEL_ID, 'Simple', 1, 1, 3, 3);

      const room = db.select().from(schema.rooms).where(eq(schema.rooms.id, roomId)).get();

      expect(room!.roomType).toBe('exploration');
    });

    it('corridor() creates a corridor connection', () => {
      const r1 = editor.room(LEVEL_ID, 'A', 1, 1, 4, 4);
      const r2 = editor.room(LEVEL_ID, 'B', 15, 15, 4, 4);
      const connId = editor.corridor(LEVEL_ID, r1, r2);

      const conn = db
        .select()
        .from(schema.connections)
        .where(eq(schema.connections.id, connId))
        .get();

      expect(conn!.connectionType).toBe('corridor');
      expect(conn!.corridorWidth).toBe(2);
    });

    it('corridor() accepts custom width', () => {
      const r1 = editor.room(LEVEL_ID, 'A', 1, 1, 4, 4);
      const r2 = editor.room(LEVEL_ID, 'B', 15, 15, 4, 4);
      const connId = editor.corridor(LEVEL_ID, r1, r2, 3);

      const conn = db
        .select()
        .from(schema.connections)
        .where(eq(schema.connections.id, connId))
        .get();

      expect(conn!.corridorWidth).toBe(3);
    });

    it('spawnEnemy() creates an enemy entity', () => {
      const entityId = editor.spawnEnemy(LEVEL_ID, 'hellgoat', 10, 12, {
        facing: 1.5,
        patrol: [
          { x: 10, z: 12 },
          { x: 15, z: 12 },
        ],
      });

      const entity = db
        .select()
        .from(schema.entities)
        .where(eq(schema.entities.id, entityId))
        .get();

      expect(entity!.entityType).toBe('hellgoat');
      expect(entity!.spawnCategory).toBe('enemy');
      expect(entity!.x).toBe(10);
      expect(entity!.z).toBe(12);
      expect(entity!.facing).toBe(1.5);
    });

    it('spawnPickup() creates a pickup entity', () => {
      const entityId = editor.spawnPickup(LEVEL_ID, 'health', 8, 8);

      const entity = db
        .select()
        .from(schema.entities)
        .where(eq(schema.entities.id, entityId))
        .get();

      expect(entity!.entityType).toBe('health');
      expect(entity!.spawnCategory).toBe('pickup');
    });

    it('spawnProp() creates a prop entity', () => {
      const entityId = editor.spawnProp(LEVEL_ID, 'pillar', 6, 6, {
        facing: 0,
      });

      const entity = db
        .select()
        .from(schema.entities)
        .where(eq(schema.entities.id, entityId))
        .get();

      expect(entity!.entityType).toBe('pillar');
      expect(entity!.spawnCategory).toBe('prop');
    });

    it('setPlayerSpawn() updates spawn coordinates on the level', () => {
      editor.setPlayerSpawn(LEVEL_ID, 15, 20, 3.14);

      const level = db.select().from(schema.levels).where(eq(schema.levels.id, LEVEL_ID)).get();

      expect(level!.spawnX).toBe(15);
      expect(level!.spawnZ).toBe(20);
      expect(level!.spawnFacing).toBeCloseTo(3.14);
    });
  });

  // -------------------------------------------------------------------------
  // Integration: full level build + compile + validate
  // -------------------------------------------------------------------------

  describe('integration', () => {
    it('builds a complete level, compiles, and validates', () => {
      editor.createLevel(LEVEL_ID, {
        name: 'Full Integration',
        levelType: 'procedural',
        width: 25,
        depth: 25,
        floor: 1,
        themeId: THEME_ID,
        spawnX: 4,
        spawnZ: 4,
      });

      const spawn = editor.room(LEVEL_ID, 'spawn', 2, 2, 6, 6);
      const arena = editor.room(LEVEL_ID, 'arena', 15, 15, 6, 6, {
        roomType: 'arena',
      });
      editor.corridor(LEVEL_ID, spawn, arena);

      editor.spawnEnemy(LEVEL_ID, 'goat', 17, 17);
      editor.spawnPickup(LEVEL_ID, 'health', 18, 18);

      editor.addTrigger(LEVEL_ID, {
        action: 'spawnWave',
        zoneX: 15,
        zoneZ: 15,
        zoneW: 6,
        zoneH: 6,
      });

      editor.addEnvironmentZone(LEVEL_ID, {
        envType: 'fire',
        boundsX: 15,
        boundsZ: 15,
        boundsW: 6,
        boundsH: 6,
        intensity: 0.8,
      });

      // Validate before compile
      const validation = editor.validate(LEVEL_ID);
      expect(validation.valid).toBe(true);

      // Compile
      editor.compile(LEVEL_ID);

      const level = db.select().from(schema.levels).where(eq(schema.levels.id, LEVEL_ID)).get();

      expect(level!.compiledGrid).not.toBeNull();

      const blob = new Uint8Array(level!.compiledGrid!);
      expect(blob.length).toBe(25 * 25);

      const grid = unpackGrid(blob, 25, 25);
      // Spawn room interior should be carved
      expect(grid[3][3]).toBe(MapCell.EMPTY);
      // Arena room interior should be carved
      expect(grid[17][17]).toBe(MapCell.EMPTY);
    });
  });
});
