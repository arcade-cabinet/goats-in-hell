/**
 * game-migrations.ts -- Table creation for game.db.
 *
 * Called once when game.db is first created. Uses raw SQL for simplicity
 * since the tables never change schema (new fields = new DB).
 */

/**
 * Create all game.db tables. Accepts any object with an `exec` or `run`
 * method (sql.js Database or better-sqlite3 Database).
 */
export function createGameTables(sqliteDb: { run: (sql: string) => void }): void {
  sqliteDb.run(`
    CREATE TABLE IF NOT EXISTS runs (
      id TEXT PRIMARY KEY,
      seed TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      nightmare_mode INTEGER NOT NULL DEFAULT 0,
      permadeath INTEGER NOT NULL DEFAULT 0,
      ultra_nightmare INTEGER NOT NULL DEFAULT 0,
      started_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1
    )
  `);

  sqliteDb.run(`
    CREATE TABLE IF NOT EXISTS run_state (
      run_id TEXT NOT NULL PRIMARY KEY REFERENCES runs(id),
      circle_number INTEGER NOT NULL DEFAULT 1,
      stage_number INTEGER NOT NULL DEFAULT 1,
      floor INTEGER NOT NULL DEFAULT 1,
      encounter_type TEXT NOT NULL DEFAULT 'explore',
      boss_id TEXT
    )
  `);

  sqliteDb.run(`
    CREATE TABLE IF NOT EXISTS player_state (
      run_id TEXT NOT NULL PRIMARY KEY REFERENCES runs(id),
      hp REAL NOT NULL,
      max_hp REAL NOT NULL,
      current_weapon TEXT NOT NULL DEFAULT 'hellPistol',
      player_level INTEGER NOT NULL DEFAULT 1,
      xp INTEGER NOT NULL DEFAULT 0,
      xp_to_next INTEGER NOT NULL,
      score INTEGER NOT NULL DEFAULT 0,
      kills INTEGER NOT NULL DEFAULT 0,
      total_kills INTEGER NOT NULL DEFAULT 0,
      mandatory_kills INTEGER NOT NULL DEFAULT 0,
      optional_kills INTEGER NOT NULL DEFAULT 0
    )
  `);

  sqliteDb.run(`
    CREATE TABLE IF NOT EXISTS player_ammo (
      run_id TEXT NOT NULL REFERENCES runs(id),
      weapon_id TEXT NOT NULL,
      reserve INTEGER NOT NULL,
      PRIMARY KEY (run_id, weapon_id)
    )
  `);

  sqliteDb.run(`
    CREATE TABLE IF NOT EXISTS circle_progress (
      run_id TEXT NOT NULL REFERENCES runs(id),
      circle_number INTEGER NOT NULL,
      status TEXT NOT NULL,
      completed_at INTEGER,
      PRIMARY KEY (run_id, circle_number)
    )
  `);

  sqliteDb.run(`
    CREATE TABLE IF NOT EXISTS visited_rooms (
      run_id TEXT NOT NULL REFERENCES runs(id),
      circle_number INTEGER NOT NULL,
      room_id TEXT NOT NULL,
      visited_at INTEGER NOT NULL,
      PRIMARY KEY (run_id, circle_number, room_id)
    )
  `);

  sqliteDb.run(`
    CREATE TABLE IF NOT EXISTS bosses_defeated (
      run_id TEXT NOT NULL REFERENCES runs(id),
      boss_id TEXT NOT NULL,
      defeated_at INTEGER NOT NULL,
      PRIMARY KEY (run_id, boss_id)
    )
  `);

  sqliteDb.run(`
    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY DEFAULT 'default',
      master_volume REAL NOT NULL DEFAULT 0.8,
      mouse_sensitivity REAL NOT NULL DEFAULT 0.003,
      touch_look_sensitivity REAL NOT NULL DEFAULT 1.0,
      gamepad_look_sensitivity REAL NOT NULL DEFAULT 1.0,
      gamepad_deadzone REAL NOT NULL DEFAULT 0.1,
      gyro_sensitivity REAL NOT NULL DEFAULT 1.0,
      gyro_enabled INTEGER NOT NULL DEFAULT 0,
      haptics_enabled INTEGER NOT NULL DEFAULT 1
    )
  `);
}
