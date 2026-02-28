/**
 * R3F WeaponSystem — weapon mechanics + projectile spawning.
 *
 * Port of the existing Babylon.js WeaponSystem to the R3F/Three.js pipeline.
 * ALL weapons now fire visible projectiles (no hitscan).
 *
 * Key differences from the Babylon.js version:
 *   - No scene dependency — uses ProjectilePool for spawning
 *   - Camera-based aiming uses Three.js camera from R3F
 *   - Coordinates are right-handed (no Z negation needed within R3F)
 */

import * as THREE from 'three/webgpu';
import type { Entity, WeaponId } from '../../game/entities/components';
import { getGameTime } from '../../game/systems/GameClock';
import { getDamageMultiplier } from '../../game/systems/PowerUpSystem';
import { weapons } from '../../game/weapons/weapons';
import { getLevelBonuses, useGameStore } from '../../state/GameStore';
import type { ProjectilePool } from './ProjectilePool';
import { PROJECTILE_COLORS } from './ProjectilePool';

// ---------------------------------------------------------------------------
// PRNG shorthand
// ---------------------------------------------------------------------------

function rng(): number {
  return useGameStore.getState().rng();
}

// ---------------------------------------------------------------------------
// Shot tracking
// ---------------------------------------------------------------------------

let shotsFired = 0;
let shotsHit = 0;

export function getShotStats(): { fired: number; hit: number } {
  return { fired: shotsFired, hit: shotsHit };
}

export function resetShotStats(): void {
  shotsFired = 0;
  shotsHit = 0;
}

export function recordHit(): void {
  shotsHit++;
}

// ---------------------------------------------------------------------------
// Fire rate cooldown tracking
// ---------------------------------------------------------------------------

const lastFireTime: Record<string, number> = {};

/**
 * Reset fire cooldowns (e.g. on floor transition).
 */
export function resetFireCooldowns(): void {
  for (const key of Object.keys(lastFireTime)) {
    delete lastFireTime[key];
  }
}

// ---------------------------------------------------------------------------
// Weapon sound map
// ---------------------------------------------------------------------------

type SoundType =
  | 'shoot'
  | 'shotgun'
  | 'rapid'
  | 'bigshot'
  | 'hit'
  | 'empty'
  | 'reload'
  | 'reload_complete'
  | 'weapon_switch';

const weaponSoundMap: Record<WeaponId, SoundType> = {
  hellPistol: 'shoot',
  brimShotgun: 'shotgun',
  hellfireCannon: 'rapid',
  goatsBane: 'bigshot',
};

// ---------------------------------------------------------------------------
// Weapon-specific projectile config
// ---------------------------------------------------------------------------

interface WeaponProjectileConfig {
  color: string;
  isRocket: boolean;
}

const WEAPON_PROJECTILE_CONFIG: Record<WeaponId, WeaponProjectileConfig> = {
  hellPistol: { color: PROJECTILE_COLORS.hellPistol, isRocket: false },
  brimShotgun: { color: PROJECTILE_COLORS.brimShotgun, isRocket: false },
  hellfireCannon: { color: PROJECTILE_COLORS.hellfireCannon, isRocket: false },
  goatsBane: { color: PROJECTILE_COLORS.goatsBane, isRocket: true },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns initial ammo loadout for the player.
 * Starts with a loaded Hell Pistol + 48 reserve; all other weapons empty.
 */
export function initPlayerAmmo(): Record<
  WeaponId,
  { current: number; reserve: number; magSize: number }
> {
  return {
    hellPistol: {
      current: weapons.hellPistol.magSize,
      reserve: 48,
      magSize: weapons.hellPistol.magSize,
    },
    brimShotgun: { current: 0, reserve: 0, magSize: weapons.brimShotgun.magSize },
    hellfireCannon: { current: 0, reserve: 0, magSize: weapons.hellfireCannon.magSize },
    goatsBane: { current: 0, reserve: 0, magSize: weapons.goatsBane.magSize },
  };
}

// Temp vectors to avoid per-frame allocation
const _aimDir = new THREE.Vector3();
const _spreadDir = new THREE.Vector3();
const _spawnOrigin = new THREE.Vector3();

/**
 * Attempt to fire the player's current weapon.
 *
 * All weapons now spawn projectiles via the pool (no hitscan).
 *
 * @param player     The player ECS entity.
 * @param pool       The ProjectilePool to spawn into.
 * @param aimOrigin  World-space aim origin (null = use camera).
 * @param aimDirection  World-space aim direction (null = use camera forward).
 * @param camera     The Three.js camera (used when aim is null).
 * @returns The weapon sound type if a shot was fired, or null.
 */
export function tryShoot(
  player: Entity,
  pool: ProjectilePool,
  aimOrigin: { x: number; y: number; z: number } | null,
  aimDirection: { x: number; y: number; z: number } | null,
  camera: THREE.Camera,
): SoundType | null {
  if (!player.player || !player.ammo || !player.position) {
    return null;
  }

  const weaponId = player.player.currentWeapon;
  const def = weapons[weaponId];
  const ammo = player.ammo[weaponId];

  // Cannot shoot while reloading
  if (player.player.isReloading) {
    return null;
  }

  // Check ammo
  if (ammo.current <= 0) {
    return 'empty';
  }

  // Enforce fire-rate cooldown (game time, not wall clock)
  const now = getGameTime();
  const lastFired = lastFireTime[weaponId] ?? 0;
  if (now - lastFired < def.fireRate) {
    return null;
  }

  lastFireTime[weaponId] = now;

  // Consume ammo
  ammo.current -= 1;
  shotsFired++;

  // Determine aim origin and direction
  if (aimOrigin && aimDirection) {
    // VR: use provided aim
    _spawnOrigin.set(aimOrigin.x, aimOrigin.y, aimOrigin.z);
    _aimDir.set(aimDirection.x, aimDirection.y, aimDirection.z).normalize();
  } else {
    // Desktop/mobile: use camera position + forward
    _spawnOrigin.copy(camera.position);
    _aimDir.set(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
  }

  // Offset spawn point slightly forward to avoid self-collision
  _spawnOrigin.addScaledVector(_aimDir, 0.5);

  // Apply level-based damage multiplier + power-up bonuses
  const level = useGameStore.getState().leveling.level;
  const bonuses = getLevelBonuses(level);
  const scaledDamage = Math.ceil(def.damage * bonuses.damageMult * getDamageMultiplier());

  const projConfig = WEAPON_PROJECTILE_CONFIG[weaponId];
  const projSpeed = def.projectileSpeed ?? 80;

  // Spawn projectiles — one per pellet
  for (let i = 0; i < def.pellets; i++) {
    applySpread(_aimDir, def.spread, _spreadDir);

    pool.spawn(
      _spawnOrigin,
      _spreadDir,
      projSpeed,
      scaledDamage,
      'player',
      def.aoe ?? 0,
      projConfig.color,
      projConfig.isRocket,
    );
  }

  // Update gun flash effect
  useGameStore.getState().patch({ gunFlash: 6 });

  return weaponSoundMap[weaponId];
}

/**
 * Begin a reload if the player is not already reloading and has reserve ammo.
 * @returns 'reload' sound type if reload started, null otherwise.
 */
export function tryReload(player: Entity): SoundType | null {
  if (!player.player || !player.ammo) {
    return null;
  }

  const weaponId = player.player.currentWeapon;
  const ammo = player.ammo[weaponId];

  // Already reloading
  if (player.player.isReloading) {
    return null;
  }

  // Magazine already full
  if (ammo.current >= ammo.magSize) {
    return null;
  }

  // No reserve ammo
  if (ammo.reserve <= 0) {
    return null;
  }

  player.player.isReloading = true;
  player.player.reloadStart = getGameTime();
  return 'reload';
}

/**
 * Check if the current reload has completed and transfer ammo from reserve
 * into the magazine.
 * @returns 'reload_complete' sound type if reload finished, null otherwise.
 */
export function updateReload(player: Entity, _dt: number): SoundType | null {
  if (!player.player || !player.ammo) {
    return null;
  }

  if (!player.player.isReloading) {
    return null;
  }

  const weaponId = player.player.currentWeapon;
  const def = weapons[weaponId];
  const elapsed = getGameTime() - player.player.reloadStart;

  if (elapsed >= def.reloadTime) {
    const ammo = player.ammo[weaponId];
    const needed = ammo.magSize - ammo.current;
    const transfer = Math.min(needed, ammo.reserve);

    ammo.current += transfer;
    ammo.reserve -= transfer;

    player.player.isReloading = false;
    return 'reload_complete';
  }

  return null;
}

/**
 * Switch to a different weapon if the player has it in their inventory.
 * @returns 'weapon_switch' sound type if switch happened, null otherwise.
 */
export function switchWeapon(player: Entity, weaponId: WeaponId): SoundType | null {
  if (!player.player) {
    return null;
  }

  // Player must possess the weapon
  if (!player.player.weapons.includes(weaponId)) {
    return null;
  }

  // Already equipped
  if (player.player.currentWeapon === weaponId) {
    return null;
  }

  // Cancel any in-progress reload
  player.player.isReloading = false;
  player.player.currentWeapon = weaponId;

  return 'weapon_switch';
}

/**
 * Get the reload progress for the current weapon (0..1).
 * Returns 0 if not reloading.
 */
export function getReloadProgress(player: Entity): number {
  if (!player.player?.isReloading) return 0;
  const weaponId = player.player.currentWeapon;
  const def = weapons[weaponId];
  const elapsed = getGameTime() - player.player.reloadStart;
  return Math.min(1, elapsed / def.reloadTime);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Apply random spread to a direction vector.
 * Spread of 0 copies the original direction unchanged.
 */
function applySpread(direction: THREE.Vector3, spread: number, out: THREE.Vector3): void {
  out.copy(direction);
  if (spread <= 0) return;

  out.x += (rng() - 0.5) * spread;
  out.y += (rng() - 0.5) * spread;
  out.z += (rng() - 0.5) * spread;
  out.normalize();
}
