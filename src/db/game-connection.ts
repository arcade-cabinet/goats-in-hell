/**
 * game-connection.ts -- Cross-platform runtime game.db connection.
 *
 * Web:    sql.js in-memory database, persisted to IndexedDB.
 *         The WASM is bundled offline via Metro (assets/sql-wasm.wasm).
 * Native: expo-sqlite (not yet implemented -- placeholder).
 */
import {
  type BetterSQLite3Database,
  drizzle as drizzleBetterSqlite,
} from 'drizzle-orm/better-sqlite3';
import { createGameTables } from './game-migrations';
import * as gameSchema from './game-schema';

// ---------------------------------------------------------------------------
// Shared type
// ---------------------------------------------------------------------------

export type GameDrizzleDb = BetterSQLite3Database<typeof gameSchema>;

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let _gameDb: GameDrizzleDb | null = null;
let _gameDbInitPromise: Promise<GameDrizzleDb> | null = null;

/** Raw sql.js database handle, needed for export/persist operations. */
let _rawSqlJsDb: any = null;

/**
 * Initialize the game database. Returns a Drizzle ORM handle.
 * In Node.js (tests/tooling), uses better-sqlite3 in-memory.
 * In the browser, uses sql.js WASM with IndexedDB persistence.
 */
export async function initGameDb(): Promise<GameDrizzleDb> {
  if (_gameDb) return _gameDb;

  if (_gameDbInitPromise) return _gameDbInitPromise;

  _gameDbInitPromise = (async () => {
    try {
      if (typeof window === 'undefined') {
        _gameDb = await initBetterSqlite();
      } else {
        _gameDb = await initSqlJs();
      }
      return _gameDb;
    } catch (err) {
      _gameDbInitPromise = null;
      throw err;
    }
  })();

  return _gameDbInitPromise;
}

/**
 * Initialize from an existing better-sqlite3 Database instance.
 * Used by tests that manage their own DB lifecycle.
 */
export function initGameDbFromBetterSqlite(
  sqliteDb: import('better-sqlite3').Database,
): GameDrizzleDb {
  createGameTables({
    run: (s: string) => {
      sqliteDb.exec(s);
    },
  });
  _gameDb = drizzleBetterSqlite(sqliteDb, { schema: gameSchema });
  return _gameDb;
}

/**
 * Reset the singleton. Used by tests to ensure clean state.
 */
export function resetGameDb(): void {
  _gameDb = null;
  _gameDbInitPromise = null;
  _rawSqlJsDb = null;
}

/**
 * Get the raw sql.js Database handle (web only).
 * Returns null in Node.js or if not yet initialized.
 */
export function getRawSqlJsDb(): any {
  return _rawSqlJsDb;
}

// ---------------------------------------------------------------------------
// Platform initializers
// ---------------------------------------------------------------------------

async function initBetterSqlite(): Promise<GameDrizzleDb> {
  const BetterSqlite3 = (await import('better-sqlite3')).default;
  const sqliteDb = new BetterSqlite3(':memory:');
  sqliteDb.pragma('journal_mode = WAL');
  sqliteDb.pragma('foreign_keys = ON');

  createGameTables({
    run: (s: string) => {
      sqliteDb.exec(s);
    },
  });

  return drizzleBetterSqlite(sqliteDb, { schema: gameSchema });
}

async function initSqlJs(): Promise<GameDrizzleDb> {
  const initSqlJsLib = (await import('sql.js' as any)).default;
  const { drizzle: drizzleSqlJs } = await import('drizzle-orm/sql-js' as string);

  // locateFile tells sql.js where to find sql-wasm.wasm.
  // Metro's asset pipeline resolves `require('./file.wasm')` to a URI string
  // that works in both dev (Metro dev server) and production (bundled asset).
  // This eliminates the CDN dependency entirely — works offline.
  const SQL = await initSqlJsLib({
    locateFile: () => require('../../assets/sql-wasm.wasm') as string,
  });

  // Try to restore from IndexedDB
  const existingData = await getDbFromIndexedDB();
  const sqlJsDb = existingData ? new SQL.Database(existingData) : new SQL.Database();

  _rawSqlJsDb = sqlJsDb;

  // Ensure tables exist (idempotent)
  createGameTables({
    run: (s: string) => {
      sqlJsDb.run(s);
    },
  });

  return drizzleSqlJs(sqlJsDb, { schema: gameSchema }) as GameDrizzleDb;
}

// ---------------------------------------------------------------------------
// IndexedDB persistence (web only)
// ---------------------------------------------------------------------------

const IDB_NAME = 'goats-in-hell-game';
const IDB_VERSION = 1;
const IDB_STORE = 'game-db';
const IDB_KEY = 'data';

function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, IDB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Load game.db bytes from IndexedDB. Returns null if not found. */
export async function getDbFromIndexedDB(): Promise<Uint8Array | null> {
  if (typeof indexedDB === 'undefined') return null;
  try {
    const db = await openIdb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const request = store.get(IDB_KEY);
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

/** Save game.db bytes to IndexedDB. */
export async function saveDbToIndexedDB(data: Uint8Array): Promise<void> {
  if (typeof indexedDB === 'undefined') return;
  const db = await openIdb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    const request = store.put(data, IDB_KEY);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Persist the current in-memory sql.js database to IndexedDB.
 * No-op in Node.js or if the raw handle isn't available.
 */
export async function persistGameDb(): Promise<void> {
  if (!_rawSqlJsDb) return;
  const data: Uint8Array = _rawSqlJsDb.export();
  await saveDbToIndexedDB(data);
}

/**
 * Download game.db as a file (web only).
 */
export function exportGameDbBlob(): void {
  if (!_rawSqlJsDb) return;
  const data: Uint8Array = _rawSqlJsDb.export();
  const blob = new Blob([data.buffer as ArrayBuffer], { type: 'application/x-sqlite3' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'goats-in-hell-save.db';
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Import game.db from a file upload (web only).
 * Saves to IndexedDB; the next initGameDb() call will pick it up.
 */
export async function importGameDbBlob(file: File): Promise<void> {
  const buffer = await file.arrayBuffer();
  await saveDbToIndexedDB(new Uint8Array(buffer));
}

// TODO: expo-sqlite path
// For native (React Native with expo-sqlite), the connection would use:
//   import * as SQLite from 'expo-sqlite';
//   const db = SQLite.openDatabaseSync('game.db');
// Then wrap it with the Drizzle expo-sqlite driver.
// The game-migrations.ts tables would be created via db.execSync().
