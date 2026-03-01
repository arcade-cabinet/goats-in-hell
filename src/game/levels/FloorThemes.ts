/**
 * FloorThemes -- visual and gameplay configuration for each dungeon biome.
 *
 * Themes cycle every 4 floors: Fire Pits -> Flesh Caverns -> Obsidian Fortress
 * -> The Void. Each theme controls wall materials, enemy pools, spawn densities,
 * and ambient lighting color.
 */
import type { EntityType } from '../entities/components';

// MapCell values from LevelGenerator.ts
const WALL_STONE = 1;
const WALL_FLESH = 2;
const WALL_LAVA = 3;
const WALL_OBSIDIAN = 4;

/** Per-biome configuration that controls both visuals and gameplay tuning. */
export interface FloorTheme {
  /** Internal key used for asset lookups and ambient sound selection. */
  name: string;
  /** All-caps display name shown on the HUD floor transition screen. */
  displayName: string;
  /** MapCell value for the biome's primary wall material. */
  primaryWall: number;
  /** MapCell values randomly chosen for accent/decorative walls. */
  accentWalls: number[];
  /** Weighted enemy pool -- duplicates increase spawn probability. */
  enemyTypes: EntityType[];
  /** Multiplier on base enemy count per room (1.0 = default density). */
  enemyDensity: number;
  /** Multiplier on base pickup count per room (1.0 = default density). */
  pickupDensity: number;
  /** CSS hex color for ambient/fog tinting in the 3D scene. */
  ambientColor: string;
}

const firePits: FloorTheme = {
  name: 'firePits',
  displayName: 'THE FIRE PITS',
  primaryWall: WALL_STONE,
  accentWalls: [WALL_LAVA, WALL_LAVA],
  enemyTypes: ['goat', 'goat', 'hellgoat', 'fireGoat'],
  enemyDensity: 0.8,
  pickupDensity: 0.6,
  ambientColor: '#ff4422',
};

const fleshCaverns: FloorTheme = {
  name: 'fleshCaverns',
  displayName: 'FLESH CAVERNS',
  primaryWall: WALL_FLESH,
  accentWalls: [WALL_STONE, WALL_LAVA],
  enemyTypes: ['goat', 'hellgoat', 'hellgoat', 'shadowGoat'],
  enemyDensity: 1.0,
  pickupDensity: 0.6,
  ambientColor: '#cc2244',
};

const obsidianFortress: FloorTheme = {
  name: 'obsidianFortress',
  displayName: 'OBSIDIAN FORTRESS',
  primaryWall: WALL_OBSIDIAN,
  accentWalls: [WALL_STONE, WALL_LAVA],
  enemyTypes: ['hellgoat', 'goatKnight', 'goatKnight', 'fireGoat'],
  enemyDensity: 1.2,
  pickupDensity: 0.6,
  ambientColor: '#6622aa',
};

const theVoid: FloorTheme = {
  name: 'theVoid',
  displayName: 'THE VOID',
  primaryWall: WALL_OBSIDIAN,
  accentWalls: [WALL_FLESH, WALL_OBSIDIAN],
  enemyTypes: ['shadowGoat', 'goatKnight', 'fireGoat', 'hellgoat'],
  enemyDensity: 1.5,
  pickupDensity: 0.6,
  ambientColor: '#220044',
};

const themes: FloorTheme[] = [firePits, fleshCaverns, obsidianFortress, theVoid];

/**
 * Return the biome theme for a given floor number (1-indexed, cycles every 4).
 *
 * @param floor - 1-indexed floor number.
 */
export function getThemeForFloor(floor: number): FloorTheme {
  const index = (floor - 1) % themes.length;
  return themes[index];
}
