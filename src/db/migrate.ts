/**
 * Database migration and seeding.
 *
 * Creates all tables from the Drizzle schema and populates seed data
 * (cell metadata, materials, themes). Idempotent — safe to run repeatedly.
 */
import { sql } from 'drizzle-orm';
import type { DrizzleDb } from './connection';
import * as schema from './schema';
import { CELL_METADATA_SEED } from './seed/cellMetadata';
import { MATERIALS_SEED } from './seed/materials';
import { THEMES_SEED } from './seed/themes';

/**
 * Run migrations: create tables + seed data.
 * Uses CREATE TABLE IF NOT EXISTS for idempotency.
 */
export async function migrateAndSeed(db: DrizzleDb): Promise<void> {
  // Create tables in dependency order
  db.run(sql`
    CREATE TABLE IF NOT EXISTS themes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      display_name TEXT NOT NULL,
      primary_wall INTEGER NOT NULL,
      accent_walls TEXT NOT NULL,
      fog_density REAL NOT NULL DEFAULT 0.03,
      fog_color TEXT NOT NULL DEFAULT '#000000',
      ambient_color TEXT NOT NULL,
      ambient_intensity REAL NOT NULL DEFAULT 0.3,
      sky_color TEXT NOT NULL DEFAULT '#000000',
      particle_effect TEXT,
      enemy_types TEXT,
      enemy_density REAL NOT NULL DEFAULT 1.0,
      pickup_density REAL NOT NULL DEFAULT 0.6
    )
  `);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS levels (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      level_type TEXT NOT NULL,
      width INTEGER NOT NULL,
      depth INTEGER NOT NULL,
      floor INTEGER NOT NULL,
      circle_number INTEGER,
      sin TEXT,
      guardian TEXT,
      music TEXT,
      ambient_sound TEXT,
      spawn_x REAL NOT NULL,
      spawn_z REAL NOT NULL,
      spawn_facing REAL NOT NULL DEFAULT 0,
      theme_id TEXT NOT NULL REFERENCES themes(id),
      compiled_grid BLOB,
      version INTEGER NOT NULL DEFAULT 1
    )
  `);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      level_id TEXT NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      room_type TEXT NOT NULL,
      bounds_x INTEGER NOT NULL,
      bounds_z INTEGER NOT NULL,
      bounds_w INTEGER NOT NULL,
      bounds_h INTEGER NOT NULL,
      elevation INTEGER NOT NULL DEFAULT 0,
      floor_cell INTEGER,
      wall_cell INTEGER,
      sort_order INTEGER NOT NULL DEFAULT 0
    )
  `);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS connections (
      id TEXT PRIMARY KEY,
      level_id TEXT NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
      from_room_id TEXT NOT NULL REFERENCES rooms(id),
      to_room_id TEXT NOT NULL REFERENCES rooms(id),
      connection_type TEXT NOT NULL,
      corridor_width INTEGER NOT NULL DEFAULT 2,
      direction TEXT,
      from_elevation INTEGER,
      to_elevation INTEGER,
      length INTEGER
    )
  `);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS materials (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      emissive TEXT NOT NULL DEFAULT '#000000',
      emissive_intensity REAL NOT NULL DEFAULT 0,
      roughness REAL NOT NULL DEFAULT 0.8,
      metalness REAL NOT NULL DEFAULT 0.1,
      color_texture TEXT,
      normal_texture TEXT,
      roughness_texture TEXT,
      emission_texture TEXT,
      metalness_texture TEXT,
      tile_x REAL NOT NULL DEFAULT 1,
      tile_y REAL NOT NULL DEFAULT 1
    )
  `);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS triggers (
      id TEXT PRIMARY KEY,
      level_id TEXT NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
      room_id TEXT REFERENCES rooms(id),
      action TEXT NOT NULL,
      zone_x INTEGER NOT NULL,
      zone_z INTEGER NOT NULL,
      zone_w INTEGER NOT NULL,
      zone_h INTEGER NOT NULL,
      once INTEGER NOT NULL DEFAULT 1,
      delay REAL NOT NULL DEFAULT 0,
      action_data TEXT
    )
  `);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS entities (
      id TEXT PRIMARY KEY,
      level_id TEXT NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
      room_id TEXT REFERENCES rooms(id),
      entity_type TEXT NOT NULL,
      x REAL NOT NULL,
      z REAL NOT NULL,
      elevation REAL NOT NULL DEFAULT 0,
      facing REAL NOT NULL DEFAULT 0,
      patrol TEXT,
      trigger_id TEXT REFERENCES triggers(id),
      overrides TEXT,
      spawn_category TEXT NOT NULL,
      surface_anchor TEXT
    )
  `);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS environment_zones (
      id TEXT PRIMARY KEY,
      level_id TEXT NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
      env_type TEXT NOT NULL,
      bounds_x INTEGER NOT NULL,
      bounds_z INTEGER NOT NULL,
      bounds_w INTEGER NOT NULL,
      bounds_h INTEGER NOT NULL,
      intensity REAL NOT NULL DEFAULT 1.0,
      direction_x REAL,
      direction_z REAL,
      timer_on REAL,
      timer_off REAL
    )
  `);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS cell_metadata (
      map_cell INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      is_walkable INTEGER NOT NULL,
      is_solid INTEGER NOT NULL,
      damage_per_second REAL NOT NULL DEFAULT 0,
      movement_speed_mult REAL NOT NULL DEFAULT 1.0,
      is_destructible INTEGER NOT NULL DEFAULT 0
    )
  `);

  // Create indices
  db.run(sql`CREATE INDEX IF NOT EXISTS rooms_level_idx ON rooms(level_id)`);
  db.run(
    sql`CREATE INDEX IF NOT EXISTS entities_level_category_idx ON entities(level_id, spawn_category)`,
  );
  db.run(sql`CREATE INDEX IF NOT EXISTS connections_level_idx ON connections(level_id)`);

  // Seed data — use INSERT OR IGNORE for idempotency
  for (const cell of CELL_METADATA_SEED) {
    db.insert(schema.cellMetadata).values(cell).onConflictDoNothing().run();
  }

  for (const material of MATERIALS_SEED) {
    db.insert(schema.materials).values(material).onConflictDoNothing().run();
  }

  for (const theme of THEMES_SEED) {
    db.insert(schema.themes).values(theme).onConflictDoNothing().run();
  }
}
