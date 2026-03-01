/** Weapons -- weapon definitions and the canonical weapon registry. */
import type { WeaponId } from '../entities/components';

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
}

/** Complete weapon registry — keyed by WeaponId, used by WeaponSystem and HUD. */
export const weapons: Record<WeaponId, WeaponDef> = {
  hellPistol: {
    id: 'hellPistol',
    name: 'Hell Pistol',
    damage: 4, // reliable hitscan, ~13 DPS
    pellets: 1,
    spread: 0,
    magSize: 12,
    fireRate: 300,
    reloadTime: 1200,
    range: 50,
    isProjectile: false,
    projectileSpeed: 80,
  },
  brimShotgun: {
    id: 'brimShotgun',
    name: 'Brimstone Shotgun',
    damage: 4, // 4×7 = 28 per shot at point-blank, ~23 DPS
    pellets: 7,
    spread: 0.14,
    magSize: 6,
    fireRate: 700,
    reloadTime: 2200,
    range: 12,
    isProjectile: false,
    projectileSpeed: 60,
  },
  hellfireCannon: {
    id: 'hellfireCannon',
    name: 'Hellfire Cannon',
    damage: 3, // rapid projectile stream, ~20 DPS
    pellets: 1,
    spread: 0.03,
    magSize: 30,
    fireRate: 150,
    reloadTime: 3000,
    range: 30,
    isProjectile: true,
    projectileSpeed: 40,
  },
  goatsBane: {
    id: 'goatsBane',
    name: "Goat's Bane",
    damage: 60, // heavy rocket, ~40 DPS + AoE crowd clear
    pellets: 1,
    spread: 0,
    magSize: 3,
    fireRate: 1500,
    reloadTime: 3500,
    range: 100,
    isProjectile: true,
    projectileSpeed: 20,
    aoe: 5,
  },
};
