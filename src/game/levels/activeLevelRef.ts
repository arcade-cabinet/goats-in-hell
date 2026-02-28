/**
 * Module-level reference to the active level grid for HUD minimap access.
 * Set by GameEngine when a level is initialized, cleared on cleanup.
 */
import type {MapCell} from './LevelGenerator';

let activeGrid: MapCell[][] | null = null;
let activeWidth = 0;
let activeDepth = 0;

export function setActiveLevel(grid: MapCell[][], width: number, depth: number): void {
  activeGrid = grid;
  activeWidth = width;
  activeDepth = depth;
}

export function clearActiveLevel(): void {
  activeGrid = null;
  activeWidth = 0;
  activeDepth = 0;
}

export function getActiveLevel(): {grid: MapCell[][]; width: number; depth: number} | null {
  if (!activeGrid) return null;
  return {grid: activeGrid, width: activeWidth, depth: activeDepth};
}
