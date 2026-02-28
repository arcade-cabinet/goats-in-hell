/**
 * Shared LevelData interface — extracted from the former GameEngine.tsx.
 *
 * Used by level generators, entity spawners, and system code that needs
 * to know about the current floor's layout.
 */
import type {Vec3} from '../entities/components';
import type {MapCell} from './LevelGenerator';
import type {FloorTheme} from './FloorThemes';

export interface LevelData {
  width: number;
  depth: number;
  floor: number;
  grid: MapCell[][];
  playerSpawn: Vec3;
  spawns: Array<{type: string; x: number; z: number; weaponId?: string; rotation?: number}>;
  theme: FloorTheme;
}
