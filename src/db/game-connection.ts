/**
 * game-connection.ts -- Runtime game.db connection via expo-sqlite.
 *
 * Works on iOS, Android, and Web (expo-sqlite + wa-sqlite WASM).
 * All writes auto-persist — no manual export-to-blob required.
 *
 * Test path: initGameDbFromBetterSqlite() for Jest (Node.js).
 */
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as SQLite from 'expo-sqlite';
import { createGameTables } from './game-migrations';
import * as gameSchema from './game-schema';

// ---------------------------------------------------------------------------
// Shared type
// ---------------------------------------------------------------------------

export type GameDrizzleDb = ReturnType<typeof drizzle<typeof gameSchema>>;

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let _db: GameDrizzleDb | null = null;
let _dbInitPromise: Promise<GameDrizzleDb> | null = null;
let _rawDb: SQLite.SQLiteDatabase | null = null;

/**
 * Initialize the game database. Returns a Drizzle ORM handle.
 * Idempotent — safe to call multiple times; resolves immediately after first init.
 */
export async function initGameDb(): Promise<GameDrizzleDb> {
  if (_db) return _db;
  if (_dbInitPromise) return _dbInitPromise;

  _dbInitPromise = (async () => {
    try {
      const sqliteDb = await SQLite.openDatabaseAsync('game.db');
      _rawDb = sqliteDb;
      createGameTables({ run: (s: string) => sqliteDb.execSync(s) });
      _db = drizzle(sqliteDb, { schema: gameSchema });
      return _db;
    } catch (err) {
      _dbInitPromise = null;
      throw err;
    }
  })();

  return _dbInitPromise;
}

/**
 * Reset the singleton. Used when importing a save file or in tests.
 */
export function resetGameDb(): void {
  _db = null;
  _dbInitPromise = null;
  _rawDb = null;
}

/**
 * Serialize the current database to bytes (for save-file export).
 * Returns null if the DB has not been opened yet.
 */
export async function exportGameDb(): Promise<Uint8Array | null> {
  if (!_rawDb) return null;
  return _rawDb.serializeAsync();
}

/**
 * Replace the current persistent database with imported bytes.
 *
 * Deserializes the bytes into a temporary in-memory database, then uses
 * expo-sqlite's backup API to overwrite the persistent 'game.db' file.
 * Reinitializes the Drizzle handle so subsequent queries use the new data.
 */
export async function importGameDb(data: Uint8Array): Promise<void> {
  const memDb = await SQLite.deserializeDatabaseAsync(data);

  // Ensure persistent DB is open
  if (!_rawDb) {
    _rawDb = await SQLite.openDatabaseAsync('game.db');
  }

  await SQLite.backupDatabaseAsync({
    sourceDatabase: memDb,
    sourceDatabaseName: 'main',
    destDatabase: _rawDb,
    destDatabaseName: 'main',
  });

  await memDb.closeAsync();

  // Ensure tables exist in restored DB (idempotent)
  createGameTables({ run: (s: string) => _rawDb!.execSync(s) });

  // Refresh Drizzle handle
  _db = drizzle(_rawDb, { schema: gameSchema });
  _dbInitPromise = Promise.resolve(_db);
}

/**
 * No-op: expo-sqlite auto-persists all writes to OPFS (web) or the app
 * documents directory (native). Kept for API compatibility with callers.
 */
export async function persistGameDb(): Promise<void> {}

// ---------------------------------------------------------------------------
// Test-only path (Node.js / Jest)
// ---------------------------------------------------------------------------

/**
 * Initialize from an existing better-sqlite3 Database instance.
 * Used by tests that manage their own DB lifecycle.
 * NOT imported by Metro for the web/native bundle (dynamic require).
 */
export function initGameDbFromBetterSqlite(sqliteDb: any): GameDrizzleDb {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { drizzle: drizzleBs3 } = require('drizzle-orm/better-sqlite3');
  createGameTables({ run: (s: string) => sqliteDb.exec(s) });
  _db = drizzleBs3(sqliteDb, { schema: gameSchema }) as GameDrizzleDb;
  return _db;
}
