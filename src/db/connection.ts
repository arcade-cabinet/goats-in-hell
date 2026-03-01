/**
 * Platform-specific SQLite database initialization.
 *
 * - Web: sql.js (WASM, ~400KB, loaded lazily on first level request)
 * - Native: expo-sqlite (synchronous native binding, zero JS bundle cost)
 * - Node.js (tooling/tests): better-sqlite3
 *
 * All paths produce a Drizzle ORM database handle (`DrizzleDb`) that the
 * rest of the codebase consumes through LevelDbAdapter and LevelEditor.
 */
import {
  type BetterSQLite3Database,
  drizzle as drizzleBetterSqlite,
} from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

// ---------------------------------------------------------------------------
// Shared type — all consumers use this
// ---------------------------------------------------------------------------

/**
 * Drizzle database handle. The specific driver type depends on the runtime
 * platform, but the query API is identical. We use BetterSQLite3Database
 * as the shared type since both sql.js and better-sqlite3 produce the
 * same synchronous Drizzle SQLite interface.
 */
export type DrizzleDb = BetterSQLite3Database<typeof schema>;

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let _db: DrizzleDb | null = null;
let _dbInitPromise: Promise<DrizzleDb> | null = null;

/**
 * Get the shared database handle, initializing lazily on first call.
 * In Node.js (tests/tooling), uses better-sqlite3.
 * In the browser, uses sql.js WASM.
 *
 * Uses a promise-based singleton guard so concurrent callers await the
 * same initialization — preventing the race condition where multiple
 * calls trigger parallel database init (CWE-362).
 */
export async function getDb(): Promise<DrizzleDb> {
  if (_db) return _db;

  if (_dbInitPromise) return _dbInitPromise;

  _dbInitPromise = (async () => {
    try {
      if (typeof window === 'undefined') {
        // Node.js environment — better-sqlite3
        _db = await initBetterSqlite();
      } else {
        // Browser environment — sql.js WASM
        _db = await initSqlJs();
      }
      return _db;
    } catch (err) {
      // Clear the promise so subsequent calls can retry
      _dbInitPromise = null;
      throw err;
    }
  })();

  return _dbInitPromise;
}

/**
 * Initialize from an existing better-sqlite3 Database instance.
 * Used by tooling scripts and tests that manage their own DB lifecycle.
 */
export function initFromBetterSqlite(sqliteDb: import('better-sqlite3').Database): DrizzleDb {
  _db = drizzleBetterSqlite(sqliteDb, { schema });
  return _db;
}

/**
 * Reset the singleton. Used by tests to ensure clean state.
 */
export function resetDb(): void {
  _db = null;
  _dbInitPromise = null;
}

// ---------------------------------------------------------------------------
// Platform initializers
// ---------------------------------------------------------------------------

async function initBetterSqlite(): Promise<DrizzleDb> {
  // Dynamic import so the bundle doesn't include better-sqlite3 on web
  const BetterSqlite3 = (await import('better-sqlite3')).default;
  const path = await import('node:path');
  const fs = await import('node:fs');

  const dbPath = path.resolve(process.cwd(), 'assets', 'levels.db');

  // Ensure parent directory exists
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const sqliteDb = new BetterSqlite3(dbPath);
  sqliteDb.pragma('journal_mode = WAL');
  sqliteDb.pragma('foreign_keys = ON');

  return drizzleBetterSqlite(sqliteDb, { schema });
}

async function initSqlJs(): Promise<DrizzleDb> {
  // Dynamic import so the bundle doesn't include sql.js on native
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const initSqlJsLib = (await import('sql.js' as any)).default;
  const { drizzle: drizzleSqlJs } = await import('drizzle-orm/sql-js' as string);
  const SQL = await initSqlJsLib();

  // Try loading pre-built DB from assets, or create empty
  let sqlJsDb: any;
  try {
    const response = await fetch('/assets/levels.db');
    if (response.ok) {
      const buffer = await response.arrayBuffer();
      sqlJsDb = new SQL.Database(new Uint8Array(buffer));
    } else {
      sqlJsDb = new SQL.Database();
    }
  } catch {
    sqlJsDb = new SQL.Database();
  }

  return drizzleSqlJs(sqlJsDb, { schema }) as DrizzleDb;
}
