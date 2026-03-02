/**
 * Shared LevelData interface — extracted from the former GameEngine.tsx.
 *
 * Used by level generators, entity spawners, and system code that needs
 * to know about the current floor's layout.
 */
import type { Vec3 } from '../entities/components';
import type { FloorTheme } from './FloorThemes';
import type { MapCell } from './LevelGenerator';

/** Runtime representation of a loaded floor, consumed by the renderer and game systems. */
export interface LevelData {
  /** Grid width in cells. */
  width: number;
  /** Grid depth in cells. */
  depth: number;
  /** 1-based floor number within the current run. */
  floor: number;
  /** 2D cell grid (row-major, indexed as grid[z][x]). */
  grid: MapCell[][];
  /** Player start position in world coordinates. */
  playerSpawn: Vec3;
  /** Entity spawn list — enemies, pickups, hazards, and props. */
  spawns: Array<{ type: string; x: number; z: number; weaponId?: string; rotation?: number }>;
  /** Visual theme applied to this floor's materials and enemy roster. */
  theme: FloorTheme;
  /** Database level ID (present when loaded from DB, undefined for procedural). */
  levelId?: string;
}
