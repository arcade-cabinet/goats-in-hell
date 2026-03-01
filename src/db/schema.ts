/**
 * Drizzle ORM schema for the level database.
 *
 * All level data — rooms, connections, entities, triggers, themes — is stored
 * in SQLite and served to the renderer via LevelDbAdapter. The compiled grid
 * (MapCell[][]) is stored as a packed Uint8Array BLOB on the levels table.
 */
import { blob, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// ---------------------------------------------------------------------------
// Themes
// ---------------------------------------------------------------------------

export const themes = sqliteTable('themes', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  displayName: text('display_name').notNull(),
  primaryWall: integer('primary_wall').notNull(), // MapCell value
  accentWalls: text('accent_walls', { mode: 'json' }).$type<number[]>().notNull(),
  fogDensity: real('fog_density').notNull().default(0.03),
  fogColor: text('fog_color').notNull().default('#000000'),
  ambientColor: text('ambient_color').notNull(),
  ambientIntensity: real('ambient_intensity').notNull().default(0.3),
  skyColor: text('sky_color').notNull().default('#000000'),
  particleEffect: text('particle_effect'),
  enemyTypes: text('enemy_types', { mode: 'json' }).$type<string[]>(),
  enemyDensity: real('enemy_density').notNull().default(1.0),
  pickupDensity: real('pickup_density').notNull().default(0.6),
});

// ---------------------------------------------------------------------------
// Levels — top-level level definition
// ---------------------------------------------------------------------------

export const levels = sqliteTable('levels', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  levelType: text('level_type').notNull(), // 'circle' | 'procedural' | 'arena' | 'boss'
  width: integer('width').notNull(),
  depth: integer('depth').notNull(),
  floor: integer('floor').notNull(),
  circleNumber: integer('circle_number'),
  sin: text('sin'),
  guardian: text('guardian'),
  music: text('music'),
  ambientSound: text('ambient_sound'),
  spawnX: real('spawn_x').notNull(),
  spawnZ: real('spawn_z').notNull(),
  spawnFacing: real('spawn_facing').notNull().default(0),
  themeId: text('theme_id')
    .notNull()
    .references(() => themes.id),
  compiledGrid: blob('compiled_grid', { mode: 'buffer' }),
  version: integer('version').notNull().default(1),
});

// ---------------------------------------------------------------------------
// Rooms — DAG nodes (spatial regions within a level)
// ---------------------------------------------------------------------------

export const rooms = sqliteTable('rooms', {
  id: text('id').primaryKey(),
  levelId: text('level_id')
    .notNull()
    .references(() => levels.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  roomType: text('room_type').notNull(), // 'corridor' | 'arena' | 'puzzle' | 'secret' | 'boss' | 'hub' | 'platforming' | 'exploration'
  boundsX: integer('bounds_x').notNull(),
  boundsZ: integer('bounds_z').notNull(),
  boundsW: integer('bounds_w').notNull(),
  boundsH: integer('bounds_h').notNull(),
  elevation: integer('elevation').notNull().default(0),
  floorCell: integer('floor_cell'), // Override MapCell for this room's floor
  wallCell: integer('wall_cell'), // Override MapCell for this room's walls
  sortOrder: integer('sort_order').notNull().default(0),
});

// ---------------------------------------------------------------------------
// Connections — DAG edges (room-to-room links)
// ---------------------------------------------------------------------------

export const connections = sqliteTable('connections', {
  id: text('id').primaryKey(),
  levelId: text('level_id')
    .notNull()
    .references(() => levels.id, { onDelete: 'cascade' }),
  fromRoomId: text('from_room_id')
    .notNull()
    .references(() => rooms.id),
  toRoomId: text('to_room_id')
    .notNull()
    .references(() => rooms.id),
  connectionType: text('connection_type').notNull(), // 'corridor' | 'door' | 'stairs' | 'portal' | 'secret' | 'bridge' | 'jump_pad'
  corridorWidth: integer('corridor_width').notNull().default(2),
  direction: text('direction'), // 'n' | 's' | 'e' | 'w'
  fromElevation: integer('from_elevation'),
  toElevation: integer('to_elevation'),
  length: integer('length'),
});

// ---------------------------------------------------------------------------
// Materials — PBR material definitions
// ---------------------------------------------------------------------------

export const materials = sqliteTable('materials', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  color: text('color').notNull(),
  emissive: text('emissive').notNull().default('#000000'),
  emissiveIntensity: real('emissive_intensity').notNull().default(0),
  roughness: real('roughness').notNull().default(0.8),
  metalness: real('metalness').notNull().default(0.1),
  colorTexture: text('color_texture'),
  normalTexture: text('normal_texture'),
  roughnessTexture: text('roughness_texture'),
  emissionTexture: text('emission_texture'),
  metalnessTexture: text('metalness_texture'),
  tileX: real('tile_x').notNull().default(1),
  tileY: real('tile_y').notNull().default(1),
});

// ---------------------------------------------------------------------------
// Entities — enemies, pickups, props, hazards
// ---------------------------------------------------------------------------

export const entities = sqliteTable('entities', {
  id: text('id').primaryKey(),
  levelId: text('level_id')
    .notNull()
    .references(() => levels.id, { onDelete: 'cascade' }),
  roomId: text('room_id').references(() => rooms.id),
  entityType: text('entity_type').notNull(),
  x: real('x').notNull(),
  z: real('z').notNull(),
  elevation: real('elevation').notNull().default(0),
  facing: real('facing').notNull().default(0),
  patrol: text('patrol', { mode: 'json' }).$type<Array<{ x: number; z: number }>>(),
  triggerId: text('trigger_id').references(() => triggers.id),
  overrides: text('overrides', { mode: 'json' }).$type<Record<string, unknown>>(),
  spawnCategory: text('spawn_category').notNull(), // 'enemy' | 'pickup' | 'prop' | 'hazard' | 'boss'
  surfaceAnchor: text('surface_anchor', { mode: 'json' }).$type<{
    face: string;
    offsetX: number;
    offsetY: number;
    offsetZ: number;
    rotation: number[];
    scale: number;
  }>(),
});

// ---------------------------------------------------------------------------
// Triggers — event trigger zones
// ---------------------------------------------------------------------------

export const triggers = sqliteTable('triggers', {
  id: text('id').primaryKey(),
  levelId: text('level_id')
    .notNull()
    .references(() => levels.id, { onDelete: 'cascade' }),
  roomId: text('room_id').references(() => rooms.id),
  action: text('action').notNull(), // 'spawnWave' | 'lockDoors' | 'unlockDoors' | 'dialogue' | 'ambientChange' | 'bossIntro' | 'secretReveal' | 'platformMove'
  zoneX: integer('zone_x').notNull(),
  zoneZ: integer('zone_z').notNull(),
  zoneW: integer('zone_w').notNull(),
  zoneH: integer('zone_h').notNull(),
  once: integer('once', { mode: 'boolean' }).notNull().default(true),
  delay: real('delay').notNull().default(0),
  actionData: text('action_data', { mode: 'json' }).$type<Record<string, unknown>>(),
});

// ---------------------------------------------------------------------------
// Environment zones — atmospheric regions
// ---------------------------------------------------------------------------

export const environmentZones = sqliteTable('environment_zones', {
  id: text('id').primaryKey(),
  levelId: text('level_id')
    .notNull()
    .references(() => levels.id, { onDelete: 'cascade' }),
  envType: text('env_type').notNull(), // 'wind' | 'ice' | 'water' | 'fire' | 'fog' | 'frost' | 'void' | 'blood' | 'illusion' | 'crushing'
  boundsX: integer('bounds_x').notNull(),
  boundsZ: integer('bounds_z').notNull(),
  boundsW: integer('bounds_w').notNull(),
  boundsH: integer('bounds_h').notNull(),
  intensity: real('intensity').notNull().default(1.0),
  directionX: real('direction_x'),
  directionZ: real('direction_z'),
  timerOn: real('timer_on'),
  timerOff: real('timer_off'),
});

// ---------------------------------------------------------------------------
// Cell metadata — behavioral properties per MapCell type (seed data)
// ---------------------------------------------------------------------------

export const cellMetadata = sqliteTable('cell_metadata', {
  mapCell: integer('map_cell').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(), // 'wall' | 'floor' | 'platform' | 'ramp' | 'door' | 'hazard' | 'special'
  isWalkable: integer('is_walkable', { mode: 'boolean' }).notNull(),
  isSolid: integer('is_solid', { mode: 'boolean' }).notNull(),
  damagePerSecond: real('damage_per_second').notNull().default(0),
  movementSpeedMult: real('movement_speed_mult').notNull().default(1.0),
  isDestructible: integer('is_destructible', { mode: 'boolean' }).notNull().default(false),
});

// ---------------------------------------------------------------------------
// TypeScript types derived from schema
// ---------------------------------------------------------------------------

export type Level = typeof levels.$inferSelect;
export type NewLevel = typeof levels.$inferInsert;

export type Theme = typeof themes.$inferSelect;
export type NewTheme = typeof themes.$inferInsert;

export type Room = typeof rooms.$inferSelect;
export type NewRoom = typeof rooms.$inferInsert;

export type Connection = typeof connections.$inferSelect;
export type NewConnection = typeof connections.$inferInsert;

export type Material = typeof materials.$inferSelect;
export type NewMaterial = typeof materials.$inferInsert;

export type Entity = typeof entities.$inferSelect;
export type NewEntity = typeof entities.$inferInsert;

export type Trigger = typeof triggers.$inferSelect;
export type NewTrigger = typeof triggers.$inferInsert;

export type EnvironmentZone = typeof environmentZones.$inferSelect;
export type NewEnvironmentZone = typeof environmentZones.$inferInsert;

export type CellMeta = typeof cellMetadata.$inferSelect;
export type NewCellMeta = typeof cellMetadata.$inferInsert;
