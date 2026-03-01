/** Constants -- shared numeric and color constants used across rendering and level generation. */

/** Width/depth of one grid cell in world units. 1 grid cell = 2 world units. */
export const CELL_SIZE = 2;
/** Height of dungeon walls in world units. */
export const WALL_HEIGHT = 3;

/** Canonical color palette for environment, enemies, pickups, and UI elements. */
export const COLORS = {
  // Environment
  floor: '#220505',
  ceiling: '#1a0520',

  // Walls
  wallStone: '#442222',
  wallFlesh: '#661a1a',
  wallLava: '#1a0a00',
  wallObsidian: '#0a0510',
  door: '#443322',

  // Enemies
  goat: '#5a4632',
  hellgoat: '#641e14',
  fireGoat: '#cc4400',
  shadowGoat: '#1a0830',
  goatKnight: '#556677',
  boss: '#50141e',

  // Pickups
  healthPickup: '#44ff44',
  ammoPickup: '#ffaa00',
  weaponPickup: '#ff44ff',

  // UI
  uiRed: '#cc0000',
  uiDarkRed: '#880000',
  uiGold: '#ffaa00',
  uiBone: '#ccbbaa',
  uiDark: '#110000',
};
