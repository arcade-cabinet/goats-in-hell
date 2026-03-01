/**
 * Database module barrel export.
 *
 * Re-exports the level editor API, grid compiler, database adapter,
 * playtest runner, schema types, and database connection utilities.
 */

// Database connection
export { type DrizzleDb, getDb, initFromBetterSqlite, resetDb } from './connection';

// Grid compiler
export { compileGrid, packGrid, unpackGrid } from './GridCompiler';

// Database adapter
export { toFloorTheme, toLevelData } from './LevelDbAdapter';
// Level editor API and constants
export {
  CONNECTION_TYPES,
  ENEMY_TYPES,
  ENV_TYPES,
  LevelEditor,
  MapCell,
  PICKUP_TYPES,
  ROOM_TYPES,
  SPAWN_CATEGORIES,
  TRIGGER_ACTIONS,
  type ValidationResult,
} from './LevelEditor';
// Playtest runner
export { type PlaytestResult, runPlaytest } from './PlaytestRunner';
// Schema tables and types
export {
  type CellMeta,
  type Connection,
  cellMetadata,
  connections,
  type Entity,
  type EnvironmentZone,
  entities,
  environmentZones,
  type Level,
  levels,
  type Material,
  materials,
  type NewCellMeta,
  type NewConnection,
  type NewEntity,
  type NewEnvironmentZone,
  type NewLevel,
  type NewMaterial,
  type NewRoom,
  type NewTheme,
  type NewTrigger,
  type Room,
  rooms,
  type Theme,
  type Trigger,
  themes,
  triggers,
} from './schema';
