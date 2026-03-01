/**
 * Game levels barrel export.
 *
 * Re-exports level generation, arena generation, boss arenas,
 * floor themes, level data types, and the active level reference.
 */

// Arena generation
export { generateArena, getArenaPlayerSpawn } from './ArenaGenerator';
// Active level reference
export {
  clearActiveLevel,
  getActiveLevel,
  setActiveLevel,
} from './activeLevelRef';

// Boss arenas
export {
  BOSS_ARENA_PICKUP_POSITIONS,
  BOSS_ARENA_SIZE,
  generateBossArena,
} from './BossArenas';

// Floor themes
export { type FloorTheme, getThemeForFloor } from './FloorThemes';

// Level data types
export type { LevelData } from './LevelData';
// Procedural dungeon generation
export {
  CELL_SIZE,
  LevelGenerator,
  MapCell,
  PLATFORM_HEIGHT,
  type SpawnData,
  WALL_HEIGHT,
} from './LevelGenerator';
