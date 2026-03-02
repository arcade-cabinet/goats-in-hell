/**
 * game-schema.ts -- Drizzle ORM schema for the runtime game.db.
 *
 * This database stores player save state and is separate from levels.db.
 * Initialized fresh on "New Game", persisted across sessions.
 */
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// ---------------------------------------------------------------------------
// Runs -- one row per game run
// ---------------------------------------------------------------------------

export const runs = sqliteTable('runs', {
  id: text('id').primaryKey(),
  seed: text('seed').notNull(),
  difficulty: text('difficulty').notNull(), // 'easy' | 'normal' | 'hard'
  nightmareMode: integer('nightmare_mode', { mode: 'boolean' }).notNull().default(false),
  permadeath: integer('permadeath', { mode: 'boolean' }).notNull().default(false),
  ultraNightmare: integer('ultra_nightmare', { mode: 'boolean' }).notNull().default(false),
  startedAt: integer('started_at').notNull(), // unix ms
  updatedAt: integer('updated_at').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
});

// ---------------------------------------------------------------------------
// Run state -- current progression within active run
// ---------------------------------------------------------------------------

export const runState = sqliteTable('run_state', {
  runId: text('run_id')
    .notNull()
    .primaryKey()
    .references(() => runs.id),
  circleNumber: integer('circle_number').notNull().default(1),
  stageNumber: integer('stage_number').notNull().default(1),
  floor: integer('floor').notNull().default(1),
  encounterType: text('encounter_type').notNull().default('explore'), // 'explore' | 'boss'
  bossId: text('boss_id'),
});

// ---------------------------------------------------------------------------
// Player state -- player stats within run
// ---------------------------------------------------------------------------

export const playerState = sqliteTable('player_state', {
  runId: text('run_id')
    .notNull()
    .primaryKey()
    .references(() => runs.id),
  hp: real('hp').notNull(),
  maxHp: real('max_hp').notNull(),
  currentWeapon: text('current_weapon').notNull().default('hellPistol'),
  playerLevel: integer('player_level').notNull().default(1),
  xp: integer('xp').notNull().default(0),
  xpToNext: integer('xp_to_next').notNull(),
  score: integer('score').notNull().default(0),
  kills: integer('kills').notNull().default(0),
  totalKills: integer('total_kills').notNull().default(0),
  mandatoryKills: integer('mandatory_kills').notNull().default(0),
  optionalKills: integer('optional_kills').notNull().default(0),
});

// ---------------------------------------------------------------------------
// Player ammo -- ammo reserves per weapon
// ---------------------------------------------------------------------------

export const playerAmmo = sqliteTable('player_ammo', {
  runId: text('run_id')
    .notNull()
    .references(() => runs.id),
  weaponId: text('weapon_id').notNull(),
  reserve: integer('reserve').notNull(),
});

// ---------------------------------------------------------------------------
// Circle progress -- which circles have been completed
// ---------------------------------------------------------------------------

export const circleProgress = sqliteTable('circle_progress', {
  runId: text('run_id')
    .notNull()
    .references(() => runs.id),
  circleNumber: integer('circle_number').notNull(), // 1-9
  status: text('status').notNull(), // 'locked' | 'active' | 'completed'
  completedAt: integer('completed_at'), // unix ms, null if not completed
});

// ---------------------------------------------------------------------------
// Visited rooms -- rooms the player has entered (for map fog of war)
// ---------------------------------------------------------------------------

export const visitedRooms = sqliteTable('visited_rooms', {
  runId: text('run_id')
    .notNull()
    .references(() => runs.id),
  circleNumber: integer('circle_number').notNull(),
  roomId: text('room_id').notNull(),
  visitedAt: integer('visited_at').notNull(), // unix ms
});

// ---------------------------------------------------------------------------
// Bosses defeated -- which bosses have been killed
// ---------------------------------------------------------------------------

export const bossesDefeated = sqliteTable('bosses_defeated', {
  runId: text('run_id')
    .notNull()
    .references(() => runs.id),
  bossId: text('boss_id').notNull(),
  defeatedAt: integer('defeated_at').notNull(), // unix ms
});

// ---------------------------------------------------------------------------
// Settings -- user preferences (single row, id = 'default')
// ---------------------------------------------------------------------------

export const settings = sqliteTable('settings', {
  id: text('id').primaryKey().default('default'),
  masterVolume: real('master_volume').notNull().default(0.8),
  mouseSensitivity: real('mouse_sensitivity').notNull().default(0.003),
  touchLookSensitivity: real('touch_look_sensitivity').notNull().default(1.0),
  gamepadLookSensitivity: real('gamepad_look_sensitivity').notNull().default(1.0),
  gamepadDeadzone: real('gamepad_deadzone').notNull().default(0.1),
  gyroSensitivity: real('gyro_sensitivity').notNull().default(1.0),
  gyroEnabled: integer('gyro_enabled', { mode: 'boolean' }).notNull().default(false),
  hapticsEnabled: integer('haptics_enabled', { mode: 'boolean' }).notNull().default(true),
});

// ---------------------------------------------------------------------------
// TypeScript types derived from schema
// ---------------------------------------------------------------------------

export type Run = typeof runs.$inferSelect;
export type NewRun = typeof runs.$inferInsert;

export type RunState = typeof runState.$inferSelect;
export type NewRunState = typeof runState.$inferInsert;

export type PlayerState = typeof playerState.$inferSelect;
export type NewPlayerState = typeof playerState.$inferInsert;

export type PlayerAmmo = typeof playerAmmo.$inferSelect;
export type NewPlayerAmmo = typeof playerAmmo.$inferInsert;

export type CircleProgress = typeof circleProgress.$inferSelect;
export type NewCircleProgress = typeof circleProgress.$inferInsert;

export type VisitedRoom = typeof visitedRooms.$inferSelect;
export type NewVisitedRoom = typeof visitedRooms.$inferInsert;

export type BossDefeated = typeof bossesDefeated.$inferSelect;
export type NewBossDefeated = typeof bossesDefeated.$inferInsert;

export type Settings = typeof settings.$inferSelect;
export type NewSettings = typeof settings.$inferInsert;

// ---------------------------------------------------------------------------
// Aggregated schema export
// ---------------------------------------------------------------------------

export const gameSchema = {
  runs,
  runState,
  playerState,
  playerAmmo,
  circleProgress,
  visitedRooms,
  bossesDefeated,
  settings,
};
