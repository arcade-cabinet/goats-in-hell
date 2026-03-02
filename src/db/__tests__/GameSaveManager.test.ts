import BetterSqlite3 from 'better-sqlite3';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import {
  createNewRun,
  type GameSaveState,
  initSaveSystem,
  loadLatestRun,
  markRoomVisited,
  type NewRunConfig,
  recordBossDefeated,
  saveCurrentState,
} from '../GameSaveManager';
import type { GameDrizzleDb } from '../game-connection';
import { createGameTables } from '../game-migrations';
import * as gs from '../game-schema';

// ---------------------------------------------------------------------------
// We bypass the singleton initSaveSystem() and inject the DB directly
// by mocking the game-connection module.
// ---------------------------------------------------------------------------

jest.mock('../game-connection', () => {
  const actual = jest.requireActual('../game-connection');
  return {
    ...actual,
    initGameDb: jest.fn(),
    persistGameDb: jest.fn().mockResolvedValue(undefined),
    exportGameDbBlob: jest.fn(),
    importGameDbBlob: jest.fn().mockResolvedValue(undefined),
  };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { initGameDb, persistGameDb } = require('../game-connection');

function createTestDb(): GameDrizzleDb {
  const sqliteDb = new BetterSqlite3(':memory:');
  sqliteDb.pragma('foreign_keys = ON');
  createGameTables({
    run: (s: string) => {
      sqliteDb.exec(s);
    },
  });
  return drizzle(sqliteDb, { schema: gs.gameSchema }) as unknown as GameDrizzleDb;
}

const DEFAULT_CONFIG: NewRunConfig = {
  seed: 'burning-cursed-goat',
  difficulty: 'normal',
  nightmareFlags: { nightmare: false, permadeath: false, ultraNightmare: false },
};

describe('GameSaveManager', () => {
  let testDb: GameDrizzleDb;

  beforeEach(async () => {
    testDb = createTestDb();
    (initGameDb as jest.Mock).mockResolvedValue(testDb);
    (persistGameDb as jest.Mock).mockClear();
    await initSaveSystem();
  });

  // -------------------------------------------------------------------------
  // createNewRun
  // -------------------------------------------------------------------------

  describe('createNewRun', () => {
    it('inserts a run and returns a UUID', async () => {
      const runId = await createNewRun(DEFAULT_CONFIG);

      expect(typeof runId).toBe('string');
      expect(runId.length).toBeGreaterThan(0);

      const run = testDb.select().from(gs.runs).where(eq(gs.runs.id, runId)).get();
      expect(run).toBeDefined();
      expect(run!.seed).toBe('burning-cursed-goat');
      expect(run!.difficulty).toBe('normal');
      expect(run!.isActive).toBe(true);
      expect(run!.nightmareMode).toBe(false);
    });

    it('creates initial run_state at circle 1, stage 1', async () => {
      const runId = await createNewRun(DEFAULT_CONFIG);

      const state = testDb.select().from(gs.runState).where(eq(gs.runState.runId, runId)).get();
      expect(state).toBeDefined();
      expect(state!.circleNumber).toBe(1);
      expect(state!.stageNumber).toBe(1);
      expect(state!.floor).toBe(1);
      expect(state!.encounterType).toBe('explore');
      expect(state!.bossId).toBeNull();
    });

    it('creates initial player_state with defaults', async () => {
      const runId = await createNewRun(DEFAULT_CONFIG);

      const player = testDb
        .select()
        .from(gs.playerState)
        .where(eq(gs.playerState.runId, runId))
        .get();
      expect(player).toBeDefined();
      expect(player!.hp).toBe(100);
      expect(player!.maxHp).toBe(100);
      expect(player!.currentWeapon).toBe('hellPistol');
      expect(player!.playerLevel).toBe(1);
      expect(player!.xp).toBe(0);
      expect(player!.score).toBe(0);
    });

    it('creates ammo rows for all weapons', async () => {
      const runId = await createNewRun(DEFAULT_CONFIG);

      const ammoRows = testDb
        .select()
        .from(gs.playerAmmo)
        .where(eq(gs.playerAmmo.runId, runId))
        .all();

      expect(ammoRows.length).toBe(5);

      const pistolAmmo = ammoRows.find((r) => r.weaponId === 'hellPistol');
      expect(pistolAmmo).toBeDefined();
      expect(pistolAmmo!.reserve).toBe(120);

      const shotgunAmmo = ammoRows.find((r) => r.weaponId === 'brimShotgun');
      expect(shotgunAmmo!.reserve).toBe(0);
    });

    it('creates circle_progress rows for all 9 circles', async () => {
      const runId = await createNewRun(DEFAULT_CONFIG);

      const progress = testDb
        .select()
        .from(gs.circleProgress)
        .where(eq(gs.circleProgress.runId, runId))
        .all();

      expect(progress.length).toBe(9);

      const circle1 = progress.find((r) => r.circleNumber === 1);
      expect(circle1!.status).toBe('active');

      const circle2 = progress.find((r) => r.circleNumber === 2);
      expect(circle2!.status).toBe('locked');

      const circle9 = progress.find((r) => r.circleNumber === 9);
      expect(circle9!.status).toBe('locked');
    });

    it('deactivates previous runs when creating a new one', async () => {
      const run1Id = await createNewRun(DEFAULT_CONFIG);
      const run2Id = await createNewRun({ ...DEFAULT_CONFIG, seed: 'new-seed-phrase' });

      const run1 = testDb.select().from(gs.runs).where(eq(gs.runs.id, run1Id)).get();
      const run2 = testDb.select().from(gs.runs).where(eq(gs.runs.id, run2Id)).get();

      expect(run1!.isActive).toBe(false);
      expect(run2!.isActive).toBe(true);
    });

    it('stores nightmare flags correctly', async () => {
      const runId = await createNewRun({
        ...DEFAULT_CONFIG,
        nightmareFlags: { nightmare: true, permadeath: true, ultraNightmare: true },
      });

      const run = testDb.select().from(gs.runs).where(eq(gs.runs.id, runId)).get();
      expect(run!.nightmareMode).toBe(true);
      expect(run!.permadeath).toBe(true);
      expect(run!.ultraNightmare).toBe(true);
    });

    it('persists to IndexedDB after creation', async () => {
      await createNewRun(DEFAULT_CONFIG);
      expect(persistGameDb).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // saveCurrentState
  // -------------------------------------------------------------------------

  describe('saveCurrentState', () => {
    it('updates run_state, player_state, and ammo', async () => {
      const runId = await createNewRun(DEFAULT_CONFIG);

      const updatedState: GameSaveState = {
        runId,
        seed: 'burning-cursed-goat',
        difficulty: 'normal',
        nightmareFlags: { nightmare: false, permadeath: false, ultraNightmare: false },
        stage: {
          circleNumber: 3,
          stageNumber: 12,
          floor: 10,
          encounterType: 'boss',
          bossId: 'infernoGoat',
        },
        player: {
          hp: 75,
          maxHp: 120,
          currentWeapon: 'brimShotgun',
          level: 5,
          xp: 150,
          xpToNext: 500,
          score: 5000,
          kills: 42,
          totalKills: 200,
          mandatoryKills: 100,
          optionalKills: 100,
        },
        ammo: { hellPistol: 60, brimShotgun: 24, hellfireCannon: 10 },
        bossesDefeated: [],
        visitedRooms: {},
        settings: {
          masterVolume: 0.8,
          mouseSensitivity: 0.003,
          touchLookSensitivity: 1.0,
          gamepadLookSensitivity: 1.0,
          gamepadDeadzone: 0.1,
          gyroSensitivity: 1.0,
          gyroEnabled: false,
          hapticsEnabled: true,
        },
      };

      await saveCurrentState(updatedState);

      const state = testDb.select().from(gs.runState).where(eq(gs.runState.runId, runId)).get();
      expect(state!.circleNumber).toBe(3);
      expect(state!.stageNumber).toBe(12);
      expect(state!.encounterType).toBe('boss');
      expect(state!.bossId).toBe('infernoGoat');

      const player = testDb
        .select()
        .from(gs.playerState)
        .where(eq(gs.playerState.runId, runId))
        .get();
      expect(player!.hp).toBe(75);
      expect(player!.maxHp).toBe(120);
      expect(player!.currentWeapon).toBe('brimShotgun');
      expect(player!.playerLevel).toBe(5);
      expect(player!.score).toBe(5000);

      const ammoRows = testDb
        .select()
        .from(gs.playerAmmo)
        .where(eq(gs.playerAmmo.runId, runId))
        .all();
      expect(ammoRows.length).toBe(3);

      const pistolAmmo = ammoRows.find((r) => r.weaponId === 'hellPistol');
      expect(pistolAmmo!.reserve).toBe(60);
    });
  });

  // -------------------------------------------------------------------------
  // loadLatestRun
  // -------------------------------------------------------------------------

  describe('loadLatestRun', () => {
    it('returns null when no runs exist', async () => {
      const result = await loadLatestRun();
      expect(result).toBeNull();
    });

    it('round-trips data correctly through create -> save -> load', async () => {
      const runId = await createNewRun(DEFAULT_CONFIG);

      const stateToSave: GameSaveState = {
        runId,
        seed: 'burning-cursed-goat',
        difficulty: 'normal',
        nightmareFlags: { nightmare: false, permadeath: false, ultraNightmare: false },
        stage: {
          circleNumber: 2,
          stageNumber: 6,
          floor: 5,
          encounterType: 'explore',
          bossId: null,
        },
        player: {
          hp: 85,
          maxHp: 110,
          currentWeapon: 'hellfireCannon',
          level: 3,
          xp: 200,
          xpToNext: 400,
          score: 2500,
          kills: 10,
          totalKills: 80,
          mandatoryKills: 50,
          optionalKills: 30,
        },
        ammo: { hellPistol: 90, brimShotgun: 16, hellfireCannon: 5 },
        bossesDefeated: [],
        visitedRooms: {},
        settings: {
          masterVolume: 0.8,
          mouseSensitivity: 0.003,
          touchLookSensitivity: 1.0,
          gamepadLookSensitivity: 1.0,
          gamepadDeadzone: 0.1,
          gyroSensitivity: 1.0,
          gyroEnabled: false,
          hapticsEnabled: true,
        },
      };

      await saveCurrentState(stateToSave);

      const loaded = await loadLatestRun();

      expect(loaded).not.toBeNull();
      expect(loaded!.runId).toBe(runId);
      expect(loaded!.seed).toBe('burning-cursed-goat');
      expect(loaded!.difficulty).toBe('normal');
      expect(loaded!.stage.circleNumber).toBe(2);
      expect(loaded!.stage.stageNumber).toBe(6);
      expect(loaded!.stage.encounterType).toBe('explore');
      expect(loaded!.stage.bossId).toBeNull();
      expect(loaded!.player.hp).toBe(85);
      expect(loaded!.player.maxHp).toBe(110);
      expect(loaded!.player.currentWeapon).toBe('hellfireCannon');
      expect(loaded!.player.level).toBe(3);
      expect(loaded!.player.score).toBe(2500);
      expect(loaded!.player.totalKills).toBe(80);
      expect(loaded!.ammo.hellPistol).toBe(90);
      expect(loaded!.ammo.brimShotgun).toBe(16);
    });

    it('loads the most recently updated active run', async () => {
      await createNewRun(DEFAULT_CONFIG);
      const run2Id = await createNewRun({ ...DEFAULT_CONFIG, seed: 'second-run-seed' });

      const loaded = await loadLatestRun();
      expect(loaded).not.toBeNull();
      expect(loaded!.runId).toBe(run2Id);
      expect(loaded!.seed).toBe('second-run-seed');
    });
  });

  // -------------------------------------------------------------------------
  // markRoomVisited
  // -------------------------------------------------------------------------

  describe('markRoomVisited', () => {
    it('inserts a visited room record', async () => {
      const runId = await createNewRun(DEFAULT_CONFIG);

      markRoomVisited(runId, 1, 'vestibule');

      const visited = testDb
        .select()
        .from(gs.visitedRooms)
        .where(eq(gs.visitedRooms.runId, runId))
        .all();
      expect(visited.length).toBe(1);
      expect(visited[0].roomId).toBe('vestibule');
      expect(visited[0].circleNumber).toBe(1);
    });

    it('appears in loadLatestRun visitedRooms', async () => {
      const runId = await createNewRun(DEFAULT_CONFIG);

      markRoomVisited(runId, 1, 'vestibule');
      markRoomVisited(runId, 1, 'fog-hall');
      markRoomVisited(runId, 2, 'lust-entrance');

      const loaded = await loadLatestRun();
      expect(loaded!.visitedRooms[1]).toContain('vestibule');
      expect(loaded!.visitedRooms[1]).toContain('fog-hall');
      expect(loaded!.visitedRooms[2]).toContain('lust-entrance');
    });
  });

  // -------------------------------------------------------------------------
  // recordBossDefeated
  // -------------------------------------------------------------------------

  describe('recordBossDefeated', () => {
    it('inserts a boss defeated record and updates circle progress', async () => {
      const runId = await createNewRun(DEFAULT_CONFIG);

      await recordBossDefeated(runId, 'boss-azazel');

      const bosses = testDb
        .select()
        .from(gs.bossesDefeated)
        .where(eq(gs.bossesDefeated.runId, runId))
        .all();
      expect(bosses.length).toBe(1);
      expect(bosses[0].bossId).toBe('boss-azazel');

      // Circle 1 should be completed
      const progress = testDb
        .select()
        .from(gs.circleProgress)
        .where(eq(gs.circleProgress.runId, runId))
        .all();
      const circle1 = progress.find((r) => r.circleNumber === 1);
      expect(circle1!.status).toBe('completed');
      expect(circle1!.completedAt).not.toBeNull();

      // Circle 2 should be unlocked
      const circle2 = progress.find((r) => r.circleNumber === 2);
      expect(circle2!.status).toBe('active');
    });

    it('appears in loadLatestRun bossesDefeated', async () => {
      const runId = await createNewRun(DEFAULT_CONFIG);
      await recordBossDefeated(runId, 'boss-azazel');

      const loaded = await loadLatestRun();
      expect(loaded!.bossesDefeated).toContain('boss-azazel');
    });
  });
});
