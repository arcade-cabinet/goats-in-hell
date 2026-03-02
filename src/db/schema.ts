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
// Decals — surface decoration textures (cracks, frost, stains, etc.)
// ---------------------------------------------------------------------------

export const decals = sqliteTable('decals', {
  id: text('id').primaryKey(),
  levelId: text('level_id')
    .notNull()
    .references(() => levels.id, { onDelete: 'cascade' }),
  roomId: text('room_id').references(() => rooms.id),
  decalType: text('decal_type').notNull(), // Texture name, e.g. 'ice-frost', 'concrete-crack', 'blood-stain'
  x: real('x').notNull(), // Grid X coordinate (center)
  z: real('z').notNull(), // Grid Z coordinate (center)
  w: real('w').notNull().default(2), // Width in grid cells
  h: real('h').notNull().default(2), // Height/depth in grid cells
  rotation: real('rotation').notNull().default(0), // Radians
  opacity: real('opacity').notNull().default(0.8),
  surface: text('surface').notNull().default('floor'), // 'floor' | 'wall' | 'ceiling'
});

// ---------------------------------------------------------------------------
// TypeScript types derived from schema
// ---------------------------------------------------------------------------

/** Selected (read) shape of the levels table. */
export type Level = typeof levels.$inferSelect;
/** Insert shape of the levels table. */
export type NewLevel = typeof levels.$inferInsert;

/** Selected (read) shape of the themes table. */
export type Theme = typeof themes.$inferSelect;
/** Insert shape of the themes table. */
export type NewTheme = typeof themes.$inferInsert;

/** Selected (read) shape of the rooms table. */
export type Room = typeof rooms.$inferSelect;
/** Insert shape of the rooms table. */
export type NewRoom = typeof rooms.$inferInsert;

/** Selected (read) shape of the connections table. */
export type Connection = typeof connections.$inferSelect;
/** Insert shape of the connections table. */
export type NewConnection = typeof connections.$inferInsert;

/** Selected (read) shape of the materials table. */
export type Material = typeof materials.$inferSelect;
/** Insert shape of the materials table. */
export type NewMaterial = typeof materials.$inferInsert;

/** Selected (read) shape of the entities table. */
export type Entity = typeof entities.$inferSelect;
/** Insert shape of the entities table. */
export type NewEntity = typeof entities.$inferInsert;

/** Selected (read) shape of the triggers table. */
export type Trigger = typeof triggers.$inferSelect;
/** Insert shape of the triggers table. */
export type NewTrigger = typeof triggers.$inferInsert;

/** Selected (read) shape of the environment_zones table. */
export type EnvironmentZone = typeof environmentZones.$inferSelect;
/** Insert shape of the environment_zones table. */
export type NewEnvironmentZone = typeof environmentZones.$inferInsert;

/** Selected (read) shape of the cell_metadata table. */
export type CellMeta = typeof cellMetadata.$inferSelect;
/** Insert shape of the cell_metadata table. */
export type NewCellMeta = typeof cellMetadata.$inferInsert;

/** Selected (read) shape of the decals table. */
export type Decal = typeof decals.$inferSelect;
/** Insert shape of the decals table. */
export type NewDecal = typeof decals.$inferInsert;
