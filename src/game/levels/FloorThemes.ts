import type { EntityType } from '../entities/components';

// MapCell values from LevelGenerator.ts
const WALL_STONE = 1;
const WALL_FLESH = 2;
const WALL_LAVA = 3;
const WALL_OBSIDIAN = 4;

export interface FloorTheme {
  name: string;
  displayName: string;
  primaryWall: number;
  accentWalls: number[];
  enemyTypes: EntityType[];
  enemyDensity: number;
  pickupDensity: number;
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

export function getThemeForFloor(floor: number): FloorTheme {
  const index = (floor - 1) % themes.length;
  return themes[index];
}
