/**
 * Seed data for themes table.
 *
 * Mirrors the 4 FloorTheme definitions from FloorThemes.ts, adding
 * visual parameters (fog, sky, particles) for the extended theme model.
 */
import type { NewTheme } from '../schema';

export const THEMES_SEED: NewTheme[] = [
  {
    id: 'fire-pits',
    name: 'firePits',
    displayName: 'THE FIRE PITS',
    primaryWall: 1, // WALL_STONE
    accentWalls: [3, 3], // WALL_LAVA, WALL_LAVA
    fogDensity: 0.03,
    fogColor: '#1a0500',
    ambientColor: '#ff4422',
    ambientIntensity: 0.3,
    skyColor: '#110000',
    particleEffect: 'embers',
    enemyTypes: ['goat', 'goat', 'hellgoat', 'fireGoat'],
    enemyDensity: 0.8,
    pickupDensity: 0.6,
  },
  {
    id: 'flesh-caverns',
    name: 'fleshCaverns',
    displayName: 'FLESH CAVERNS',
    primaryWall: 2, // WALL_FLESH
    accentWalls: [1, 3], // WALL_STONE, WALL_LAVA
    fogDensity: 0.04,
    fogColor: '#1a0808',
    ambientColor: '#cc2244',
    ambientIntensity: 0.25,
    skyColor: '#0a0505',
    particleEffect: null,
    enemyTypes: ['goat', 'hellgoat', 'hellgoat', 'shadowGoat'],
    enemyDensity: 1.0,
    pickupDensity: 0.6,
  },
  {
    id: 'obsidian-fortress',
    name: 'obsidianFortress',
    displayName: 'OBSIDIAN FORTRESS',
    primaryWall: 4, // WALL_OBSIDIAN
    accentWalls: [1, 3], // WALL_STONE, WALL_LAVA
    fogDensity: 0.025,
    fogColor: '#0a0510',
    ambientColor: '#6622aa',
    ambientIntensity: 0.2,
    skyColor: '#050210',
    particleEffect: null,
    enemyTypes: ['hellgoat', 'goatKnight', 'goatKnight', 'fireGoat'],
    enemyDensity: 1.2,
    pickupDensity: 0.6,
  },
  {
    id: 'the-void',
    name: 'theVoid',
    displayName: 'THE VOID',
    primaryWall: 4, // WALL_OBSIDIAN
    accentWalls: [2, 4], // WALL_FLESH, WALL_OBSIDIAN
    fogDensity: 0.05,
    fogColor: '#030008',
    ambientColor: '#220044',
    ambientIntensity: 0.15,
    skyColor: '#010003',
    particleEffect: 'frost',
    enemyTypes: ['shadowGoat', 'goatKnight', 'fireGoat', 'hellgoat'],
    enemyDensity: 1.5,
    pickupDensity: 0.6,
  },
];
