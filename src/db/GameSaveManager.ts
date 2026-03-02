/**
 * GameSaveManager -- High-level save/load API for game.db.
 *
 * Abstracts the sql.js/expo-sqlite difference. Coordinates between
 * game-connection.ts (low-level DB) and GameStore (in-memory state).
 */
import { and, desc, eq } from 'drizzle-orm';
import type { GameDrizzleDb } from './game-connection';
import { exportGameDbBlob, importGameDbBlob, initGameDb, persistGameDb } from './game-connection';
import * as gs from './game-schema';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NewRunConfig {
  seed: string;
  difficulty: 'easy' | 'normal' | 'hard';
  nightmareFlags: { nightmare: boolean; permadeath: boolean; ultraNightmare: boolean };
}

export interface GameSaveState {
  runId: string;
  seed: string;
  difficulty: 'easy' | 'normal' | 'hard';
  nightmareFlags: { nightmare: boolean; permadeath: boolean; ultraNightmare: boolean };
  stage: {
    circleNumber: number;
    stageNumber: number;
    floor: number;
    encounterType: string;
    bossId: string | null;
  };
  player: {
    hp: number;
    maxHp: number;
    currentWeapon: string;
    level: number;
    xp: number;
    xpToNext: number;
    score: number;
    kills: number;
    totalKills: number;
    mandatoryKills: number;
    optionalKills: number;
  };
  ammo: Record<string, number>;
  bossesDefeated: string[];
  visitedRooms: Record<number, string[]>;
  settings: {
    masterVolume: number;
    mouseSensitivity: number;
    touchLookSensitivity: number;
    gamepadLookSensitivity: number;
    gamepadDeadzone: number;
    gyroSensitivity: number;
    gyroEnabled: boolean;
    hapticsEnabled: boolean;
  };
}

// ---------------------------------------------------------------------------
// Default starting ammo per weapon
// ---------------------------------------------------------------------------

const DEFAULT_STARTING_AMMO: Record<string, number> = {
  hellPistol: 120,
  brimShotgun: 0,
  hellfireCannon: 0,
  goatsBane: 0,
  brimstoneFlamethrower: 0,
};

// ---------------------------------------------------------------------------
// Manager singleton
// ---------------------------------------------------------------------------

let _db: GameDrizzleDb | null = null;
let _lastPersistTime = 0;
const PERSIST_DEBOUNCE_MS = 5000;

/**
 * Initialize the save system. Call once at app start.
 */
export async function initSaveSystem(): Promise<void> {
  _db = await initGameDb();
}

/**
 * Get the DB handle, throwing if not initialized.
 */
function db(): GameDrizzleDb {
  if (!_db) throw new Error('Save system not initialized. Call initSaveSystem() first.');
  return _db;
}

/**
 * Generate a UUID-ish run ID.
 */
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Debounced persist -- writes to IndexedDB at most every 5 seconds.
 */
async function debouncedPersist(): Promise<void> {
  const now = Date.now();
  if (now - _lastPersistTime < PERSIST_DEBOUNCE_MS) return;
  _lastPersistTime = now;
  await persistGameDb();
}

/**
 * Force-persist (bypasses debounce).
 */
async function forcePersist(): Promise<void> {
  _lastPersistTime = Date.now();
  await persistGameDb();
}

// ---------------------------------------------------------------------------
// XP formula (mirrors GameStore.ts)
// ---------------------------------------------------------------------------

function xpForLevel(level: number): number {
  return Math.floor(100 * level ** 1.5);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create a fresh run. Returns the run ID.
 */
export async function createNewRun(config: NewRunConfig): Promise<string> {
  const d = db();
  const runId = generateId();
  const now = Date.now();

  // Deactivate any existing active runs
  d.update(gs.runs).set({ isActive: false }).where(eq(gs.runs.isActive, true)).run();

  // Insert run
  d.insert(gs.runs)
    .values({
      id: runId,
      seed: config.seed,
      difficulty: config.difficulty,
      nightmareMode: config.nightmareFlags.nightmare,
      permadeath: config.nightmareFlags.permadeath,
      ultraNightmare: config.nightmareFlags.ultraNightmare,
      startedAt: now,
      updatedAt: now,
      isActive: true,
    })
    .run();

  // Insert initial run_state
  d.insert(gs.runState)
    .values({
      runId,
      circleNumber: 1,
      stageNumber: 1,
      floor: 1,
      encounterType: 'explore',
      bossId: null,
    })
    .run();

  // Insert initial player_state (100 HP as default; actual HP depends on difficulty,
  // but the caller should saveCurrentState() right after with the real values)
  d.insert(gs.playerState)
    .values({
      runId,
      hp: 100,
      maxHp: 100,
      currentWeapon: 'hellPistol',
      playerLevel: 1,
      xp: 0,
      xpToNext: xpForLevel(2),
      score: 0,
      kills: 0,
      totalKills: 0,
      mandatoryKills: 0,
      optionalKills: 0,
    })
    .run();

  // Insert player_ammo for each weapon
  for (const [weaponId, reserve] of Object.entries(DEFAULT_STARTING_AMMO)) {
    d.insert(gs.playerAmmo).values({ runId, weaponId, reserve }).run();
  }

  // Insert circle_progress rows (circle 1 = 'active', rest = 'locked')
  for (let i = 1; i <= 9; i++) {
    d.insert(gs.circleProgress)
      .values({
        runId,
        circleNumber: i,
        status: i === 1 ? 'active' : 'locked',
        completedAt: null,
      })
      .run();
  }

  // Upsert default settings (don't overwrite if already present)
  const existingSettings = d.select().from(gs.settings).where(eq(gs.settings.id, 'default')).get();
  if (!existingSettings) {
    d.insert(gs.settings).values({ id: 'default' }).run();
  }

  await forcePersist();
  return runId;
}

/**
 * Persist current run state from the in-memory game state.
 */
export async function saveCurrentState(state: GameSaveState): Promise<void> {
  const d = db();
  const now = Date.now();

  // Update runs.updatedAt
  d.update(gs.runs).set({ updatedAt: now }).where(eq(gs.runs.id, state.runId)).run();

  // Update run_state
  d.update(gs.runState)
    .set({
      circleNumber: state.stage.circleNumber,
      stageNumber: state.stage.stageNumber,
      floor: state.stage.floor,
      encounterType: state.stage.encounterType,
      bossId: state.stage.bossId,
    })
    .where(eq(gs.runState.runId, state.runId))
    .run();

  // Update player_state
  d.update(gs.playerState)
    .set({
      hp: state.player.hp,
      maxHp: state.player.maxHp,
      currentWeapon: state.player.currentWeapon,
      playerLevel: state.player.level,
      xp: state.player.xp,
      xpToNext: state.player.xpToNext,
      score: state.player.score,
      kills: state.player.kills,
      totalKills: state.player.totalKills,
      mandatoryKills: state.player.mandatoryKills,
      optionalKills: state.player.optionalKills,
    })
    .where(eq(gs.playerState.runId, state.runId))
    .run();

  // Update player_ammo -- delete existing and re-insert
  d.delete(gs.playerAmmo).where(eq(gs.playerAmmo.runId, state.runId)).run();
  for (const [weaponId, reserve] of Object.entries(state.ammo)) {
    d.insert(gs.playerAmmo).values({ runId: state.runId, weaponId, reserve }).run();
  }

  await debouncedPersist();
}

/**
 * Load the most recent active run. Returns null if no active save exists.
 */
export async function loadLatestRun(): Promise<GameSaveState | null> {
  const d = db();

  // Find the latest active run
  const run = d
    .select()
    .from(gs.runs)
    .where(eq(gs.runs.isActive, true))
    .orderBy(desc(gs.runs.updatedAt))
    .limit(1)
    .get();

  if (!run) return null;

  const state = d.select().from(gs.runState).where(eq(gs.runState.runId, run.id)).get();
  const player = d.select().from(gs.playerState).where(eq(gs.playerState.runId, run.id)).get();
  const ammoRows = d.select().from(gs.playerAmmo).where(eq(gs.playerAmmo.runId, run.id)).all();
  const bossRows = d
    .select()
    .from(gs.bossesDefeated)
    .where(eq(gs.bossesDefeated.runId, run.id))
    .all();
  const visitedRows = d
    .select()
    .from(gs.visitedRooms)
    .where(eq(gs.visitedRooms.runId, run.id))
    .all();
  const settingsRow = d.select().from(gs.settings).where(eq(gs.settings.id, 'default')).get();

  if (!state || !player) return null;

  // Build ammo map
  const ammo: Record<string, number> = {};
  for (const row of ammoRows) {
    ammo[row.weaponId] = row.reserve;
  }

  // Build visited rooms map
  const visitedRooms: Record<number, string[]> = {};
  for (const row of visitedRows) {
    if (!visitedRooms[row.circleNumber]) {
      visitedRooms[row.circleNumber] = [];
    }
    visitedRooms[row.circleNumber].push(row.roomId);
  }

  return {
    runId: run.id,
    seed: run.seed,
    difficulty: run.difficulty as 'easy' | 'normal' | 'hard',
    nightmareFlags: {
      nightmare: run.nightmareMode,
      permadeath: run.permadeath,
      ultraNightmare: run.ultraNightmare,
    },
    stage: {
      circleNumber: state.circleNumber,
      stageNumber: state.stageNumber,
      floor: state.floor,
      encounterType: state.encounterType,
      bossId: state.bossId,
    },
    player: {
      hp: player.hp,
      maxHp: player.maxHp,
      currentWeapon: player.currentWeapon,
      level: player.playerLevel,
      xp: player.xp,
      xpToNext: player.xpToNext,
      score: player.score,
      kills: player.kills,
      totalKills: player.totalKills,
      mandatoryKills: player.mandatoryKills,
      optionalKills: player.optionalKills,
    },
    ammo,
    bossesDefeated: bossRows.map((r) => r.bossId),
    visitedRooms,
    settings: settingsRow
      ? {
          masterVolume: settingsRow.masterVolume,
          mouseSensitivity: settingsRow.mouseSensitivity,
          touchLookSensitivity: settingsRow.touchLookSensitivity,
          gamepadLookSensitivity: settingsRow.gamepadLookSensitivity,
          gamepadDeadzone: settingsRow.gamepadDeadzone,
          gyroSensitivity: settingsRow.gyroSensitivity,
          gyroEnabled: settingsRow.gyroEnabled,
          hapticsEnabled: settingsRow.hapticsEnabled,
        }
      : {
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
}

/**
 * Mark a room as visited. Fire-and-forget, non-blocking persist.
 */
export function markRoomVisited(runId: string, circleNumber: number, roomId: string): void {
  const d = db();
  try {
    d.insert(gs.visitedRooms)
      .values({
        runId,
        circleNumber,
        roomId,
        visitedAt: Date.now(),
      })
      .run();
  } catch {
    // INSERT OR IGNORE semantics -- if the row already exists, this is fine.
    // Drizzle doesn't have onConflictDoNothing for all drivers, so we catch.
  }
  // Fire-and-forget debounced persist
  debouncedPersist().catch(() => {});
}

/**
 * Record a boss defeat and update circle progress.
 */
export async function recordBossDefeated(runId: string, bossId: string): Promise<void> {
  const d = db();

  d.insert(gs.bossesDefeated)
    .values({
      runId,
      bossId,
      defeatedAt: Date.now(),
    })
    .run();

  // Get current circle from run_state
  const state = d.select().from(gs.runState).where(eq(gs.runState.runId, runId)).get();
  if (state) {
    d.update(gs.circleProgress)
      .set({ status: 'completed', completedAt: Date.now() })
      .where(
        and(
          eq(gs.circleProgress.runId, runId),
          eq(gs.circleProgress.circleNumber, state.circleNumber),
        ),
      )
      .run();

    // Unlock next circle if applicable
    if (state.circleNumber < 9) {
      d.update(gs.circleProgress)
        .set({ status: 'active' })
        .where(
          and(
            eq(gs.circleProgress.runId, runId),
            eq(gs.circleProgress.circleNumber, state.circleNumber + 1),
          ),
        )
        .run();
    }
  }

  await forcePersist();
}

/**
 * Download save file (web only).
 */
export function exportSave(): void {
  exportGameDbBlob();
}

/**
 * Upload save file (web only).
 */
export async function importSave(file: File): Promise<void> {
  await importGameDbBlob(file);
}
