/**
 * Config — typed game configuration loader.
 *
 * All game-balance tunables live in JSON files under /config/.
 * Metro bundles JSON imports statically — no async fetch required.
 * Edit the JSON files to tune the game; TypeScript types are inferred.
 *
 * Usage:
 *   import { weaponConfig, enemyConfig, difficultyConfig, gameplayConfig } from '../config';
 */

import rawDifficulty from '../../config/difficulty.json';
import rawEnemies from '../../config/enemies.json';
import rawGameplay from '../../config/gameplay.json';
import rawWeapons from '../../config/weapons.json';
import rawWeaponVisuals from '../../config/weaponVisuals.json';

// ---------------------------------------------------------------------------
// Weapon config
// ---------------------------------------------------------------------------

/** Per-weapon stat block sourced from config/weapons.json. */
export type WeaponConfig = (typeof rawWeapons)[keyof Omit<typeof rawWeapons, '_comment'>];

export const weaponConfig = rawWeapons as Omit<typeof rawWeapons, '_comment'>;

// ---------------------------------------------------------------------------
// Enemy config
// ---------------------------------------------------------------------------

export type EnemyConfig = (typeof rawEnemies)[keyof Omit<typeof rawEnemies, '_comment'>];

export const enemyConfig = rawEnemies as Omit<typeof rawEnemies, '_comment'>;

// ---------------------------------------------------------------------------
// Difficulty config
// ---------------------------------------------------------------------------

export type DifficultyPreset = (typeof rawDifficulty)[keyof Omit<typeof rawDifficulty, '_comment'>];

export const difficultyConfig = rawDifficulty as Omit<typeof rawDifficulty, '_comment'>;

// ---------------------------------------------------------------------------
// Gameplay config
// ---------------------------------------------------------------------------

export const gameplayConfig = rawGameplay as Omit<typeof rawGameplay, '_comment'>;

// ---------------------------------------------------------------------------
// Weapon visual config
// ---------------------------------------------------------------------------

export type WeaponVisualConfig = (typeof rawWeaponVisuals)[keyof Omit<
  typeof rawWeaponVisuals,
  '_comment'
>];

export const weaponVisualsConfig = rawWeaponVisuals as Omit<typeof rawWeaponVisuals, '_comment'>;
