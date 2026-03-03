/** Weapons -- weapon definitions and the canonical weapon registry. */

import { weaponConfig } from '../../config';
import type { WeaponId } from '../entities/components';

/** Fire mode: 'projectile' fires discrete shots, 'stream' is a continuous beam/spray. */
export type FireMode = 'projectile' | 'stream';

/** Static definition of a weapon type — immutable stats looked up by WeaponSystem. */
export interface WeaponDef {
  id: WeaponId;
  name: string;
  /** Base damage per pellet (before difficulty/level scaling). */
  damage: number;
  /** Number of pellets per shot (1 for single, 7 for shotgun spread). */
  pellets: number;
  /** Pellet spread cone half-angle in radians. */
  spread: number;
  /** Rounds per magazine before reload. */
  magSize: number;
  /** Minimum milliseconds between consecutive shots. */
  fireRate: number;
  /** Reload duration in milliseconds. */
  reloadTime: number;
  /** Maximum effective range in world units. */
  range: number;
  /** True = spawns a visible projectile entity; false = instant hitscan. */
  isProjectile: boolean;
  /** Projectile travel speed in world-units/frame (only if isProjectile). */
  projectileSpeed?: number;
  /** Area-of-effect blast radius in world units (e.g. rocket launcher). */
  aoe?: number;
  /** Fire mode — 'stream' for continuous weapons like flamethrower. */
  fireMode?: FireMode;
  /** Fuel consumed per second while firing (stream weapons only). */
  fuelBurnRate?: number;
  /** Fuel passively regenerated per second (stream weapons only). */
  fuelRegenRate?: number;
  /** Max fuel capacity (stream weapons only). */
  fuelMax?: number;
  /** DOT damage per second applied on hit (stream weapons only). */
  dotDps?: number;
  /** DOT duration in seconds (stream weapons only). */
  dotDuration?: number;
}

/** Complete weapon registry — keyed by WeaponId, built from config/weapons.json. */
export const weapons: Record<WeaponId, WeaponDef> = {
  hellPistol: {
    id: 'hellPistol',
    ...weaponConfig.hellPistol,
    isProjectile: weaponConfig.hellPistol.projectileSpeed > 0,
  },
  brimShotgun: {
    id: 'brimShotgun',
    ...weaponConfig.brimShotgun,
    isProjectile: false,
  },
  hellfireCannon: {
    id: 'hellfireCannon',
    ...weaponConfig.hellfireCannon,
    isProjectile: true,
  },
  goatsBane: {
    id: 'goatsBane',
    ...weaponConfig.goatsBane,
    isProjectile: true,
    aoe: weaponConfig.goatsBane.aoe,
  },
  brimstoneFlamethrower: {
    id: 'brimstoneFlamethrower',
    ...weaponConfig.brimstoneFlamethrower,
    isProjectile: false,
    fireMode: 'stream' as FireMode,
  },
};
