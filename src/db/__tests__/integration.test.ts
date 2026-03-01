import BetterSqlite3 from 'better-sqlite3';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { CELL_SIZE } from '../../constants';
import { MapCell } from '../../game/levels/LevelGenerator';
import { toLevelData } from '../LevelDbAdapter';
import { LevelEditor } from '../LevelEditor';
import { migrateAndSeed } from '../migrate';
import { runPlaytest } from '../PlaytestRunner';
import * as schema from '../schema';

function createTestDb() {
  const sqliteDb = new BetterSqlite3(':memory:');
  const db = drizzle(sqliteDb, { schema });
  return db;
}

describe('Integration: LevelEditor -> compile -> LevelDbAdapter -> PlaytestRunner', () => {
  let db: ReturnType<typeof createTestDb>;
  let editor: LevelEditor;

  const LEVEL_ID = 'test-level';
  const THEME_ID = 'fire-pits';

  beforeEach(async () => {
    db = createTestDb();
    await migrateAndSeed(db);
    editor = new LevelEditor(db);
  });

  /**
   * Helper: build the canonical 3-room test level used by most tests.
   * Returns the room IDs for further assertions.
   */
  function buildThreeRoomLevel(): {
    entranceId: string;
    hallwayId: string;
    arenaId: string;
  } {
    editor.createLevel(LEVEL_ID, {
      name: 'Integration Test Level',
      levelType: 'procedural',
      width: 20,
      depth: 20,
      floor: 1,
      themeId: THEME_ID,
    });

    const entranceId = editor.room(LEVEL_ID, 'entrance', 3, 3, 6, 6);
    const hallwayId = editor.room(LEVEL_ID, 'hallway', 12, 3, 4, 14);
    const arenaId = editor.room(LEVEL_ID, 'arena', 12, 12, 6, 6);

    editor.corridor(LEVEL_ID, entranceId, hallwayId);
    editor.connect(LEVEL_ID, hallwayId, arenaId, { connectionType: 'door' });

    // Enemies in the arena (grid coordinates, matching level bounds)
    editor.spawnEnemy(LEVEL_ID, 'goat', 14, 14, { roomId: arenaId });
    editor.spawnEnemy(LEVEL_ID, 'goat', 15, 15, { roomId: arenaId });

    // Health pickup in entrance (grid coordinates)
    editor.spawnPickup(LEVEL_ID, 'health', 5, 5);

    // Player spawns at grid (5, 5) which is inside the entrance room
    editor.setPlayerSpawn(LEVEL_ID, 5, 5);

    return { entranceId, hallwayId, arenaId };
  }

  // -------------------------------------------------------------------------
  // Test 1: build a small level and verify LevelData output
  // -------------------------------------------------------------------------

  it('builds a small level and verifies LevelData output', () => {
    buildThreeRoomLevel();
    editor.compile(LEVEL_ID);

    const levelData = toLevelData(db, LEVEL_ID);

    // Grid dimensions
    expect(levelData.grid.length).toBe(20);
    expect(levelData.grid[0].length).toBe(20);

    // Player spawn is scaled by CELL_SIZE
    expect(levelData.playerSpawn).toEqual({
      x: 5 * CELL_SIZE,
      y: 1,
      z: 5 * CELL_SIZE,
    });

    // 3 spawns total: 2 enemies + 1 pickup
    expect(levelData.spawns).toHaveLength(3);

    const enemies = levelData.spawns.filter((s) => s.type === 'goat');
    expect(enemies).toHaveLength(2);

    const pickups = levelData.spawns.filter((s) => s.type === 'health');
    expect(pickups).toHaveLength(1);

    // Grid cells inside the entrance room (3,3)-(8,8) should be EMPTY
    expect(levelData.grid[4][4]).toBe(MapCell.EMPTY);
    expect(levelData.grid[5][5]).toBe(MapCell.EMPTY);
    expect(levelData.grid[6][7]).toBe(MapCell.EMPTY);

    // Grid cells outside all rooms should be WALL_STONE (fire-pits primaryWall=1)
    expect(levelData.grid[0][0]).toBe(MapCell.WALL_STONE);
    expect(levelData.grid[0][19]).toBe(MapCell.WALL_STONE);
    expect(levelData.grid[19][0]).toBe(MapCell.WALL_STONE);
  });

  // -------------------------------------------------------------------------
  // Test 2: validate catches unreachable room
  // -------------------------------------------------------------------------

  it('validate catches unreachable room', () => {
    editor.createLevel('unreachable-test', {
      name: 'Unreachable Room Test',
      levelType: 'procedural',
      width: 20,
      depth: 20,
      floor: 1,
      themeId: THEME_ID,
    });

    editor.room('unreachable-test', 'start', 2, 2, 4, 4);
    editor.room('unreachable-test', 'island', 14, 14, 4, 4);

    // Spawn inside the start room
    editor.setPlayerSpawn('unreachable-test', 3, 3);

    // No connection between rooms
    const result = editor.validate('unreachable-test');

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.toLowerCase().includes('reachable'))).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Test 3: validate passes for well-connected level
  // -------------------------------------------------------------------------

  it('validate passes for well-connected level', () => {
    buildThreeRoomLevel();

    const result = editor.validate(LEVEL_ID);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // Test 4: playtest runner completes a valid level
  // -------------------------------------------------------------------------

  it('playtest runner completes a valid level', () => {
    const { entranceId, hallwayId, arenaId } = buildThreeRoomLevel();
    editor.compile(LEVEL_ID);

    const levelData = toLevelData(db, LEVEL_ID);

    // Fetch rooms from DB
    const rooms = db.select().from(schema.rooms).where(eq(schema.rooms.levelId, LEVEL_ID)).all();

    const result = runPlaytest(levelData, rooms, { maxDuration: 60 });

    expect(result.passed).toBe(true);
    // All 3 rooms should have been visited
    expect(result.roomsVisited).toHaveLength(3);
    expect(result.roomsVisited).toContain(entranceId);
    expect(result.roomsVisited).toContain(hallwayId);
    expect(result.roomsVisited).toContain(arenaId);
  });

  // -------------------------------------------------------------------------
  // Test 5: DAG cycle detection
  // -------------------------------------------------------------------------

  it('DAG cycle detection', () => {
    editor.createLevel('cycle-test', {
      name: 'Cycle Test',
      levelType: 'procedural',
      width: 20,
      depth: 20,
      floor: 1,
      themeId: THEME_ID,
    });

    const roomA = editor.room('cycle-test', 'room-a', 2, 2, 4, 4);
    const roomB = editor.room('cycle-test', 'room-b', 8, 2, 4, 4);
    const roomC = editor.room('cycle-test', 'room-c', 8, 8, 4, 4);

    // A -> B -> C -> A (directed cycle)
    editor.corridor('cycle-test', roomA, roomB);
    editor.corridor('cycle-test', roomB, roomC);
    editor.corridor('cycle-test', roomC, roomA);

    // Spawn inside room A
    editor.setPlayerSpawn('cycle-test', 3, 3);

    const result = editor.validate('cycle-test');

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.toLowerCase().includes('cycle'))).toBe(true);
  });
});
