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
import { world } from '../../game/entities/world';
import { getGameTime } from '../../game/systems/GameClock';
import { getDamageMultiplier } from '../../game/systems/PowerUpSystem';
import { weapons } from '../../game/weapons/weapons';
import { getLevelBonuses, useGameStore } from '../../state/GameStore';
import { triggerScreenShake } from '../systems/ScreenShake';
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
  brimstoneFlamethrower: 'rapid',
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
  brimstoneFlamethrower: { color: '#ff4400', isRocket: false },
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
      reserve: 120,
      magSize: weapons.hellPistol.magSize,
    },
    brimShotgun: { current: 0, reserve: 0, magSize: weapons.brimShotgun.magSize },
    hellfireCannon: { current: 0, reserve: 0, magSize: weapons.hellfireCannon.magSize },
    goatsBane: { current: 0, reserve: 0, magSize: weapons.goatsBane.magSize },
    brimstoneFlamethrower: { current: 0, reserve: 0, magSize: 0 }, // uses fuel system, not ammo
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

  // Per-shot screen shake — proportional to weapon power
  const WEAPON_SHAKE: Record<WeaponId, number> = {
    hellPistol: 0.05,
    brimShotgun: 0.2,
    hellfireCannon: 0.03,
    goatsBane: 0.35,
    brimstoneFlamethrower: 0.01,
  };
  triggerScreenShake(WEAPON_SHAKE[weaponId] ?? 0.05);

  return weaponSoundMap[weaponId];
}

// ---------------------------------------------------------------------------
// Flamethrower stream fire + fuel + DOT
// ---------------------------------------------------------------------------

// Module-scope temp vectors for stream cone checks (avoid per-frame allocation)
const _streamOrigin = new THREE.Vector3();
const _streamDir = new THREE.Vector3();
const _toEnemy = new THREE.Vector3();

/** Flamethrower firing state — true while stream is active. */
let flamethrowerFiring = false;

/** Whether the flamethrower is currently firing (used by FlamethrowerEffect). */
export function isFlamethrowerFiring(): boolean {
  return flamethrowerFiring;
}

/**
 * DOT (damage-over-time) effect applied by flamethrower hits.
 */
export interface DotEffect {
  entityId: string;
  dps: number;
  remaining: number;
}

/** Active DOT effects — ticked each frame by updateDots(). */
const activeDots: DotEffect[] = [];

/** Callback for dealing DOT damage to enemies — set by game scene. */
let dotDamageCallback: ((entityId: string, damage: number) => void) | null = null;

/** Register the DOT damage callback (same as projectile damage callback). */
export function setDotDamageCallback(fn: (entityId: string, damage: number) => void): void {
  dotDamageCallback = fn;
}

/**
 * Attempt to fire the flamethrower stream.
 * Consumes fuel, damages enemies in cone, applies DOT.
 *
 * @returns Sound type if firing, 'empty' if out of fuel, null if not ready.
 */
export function tryStreamFire(
  player: Entity,
  aimOrigin: { x: number; y: number; z: number } | null,
  aimDirection: { x: number; y: number; z: number } | null,
  camera: THREE.Camera,
  dt: number,
): SoundType | null {
  if (!player.player || !player.position) {
    flamethrowerFiring = false;
    return null;
  }

  const weaponId = player.player.currentWeapon;
  const def = weapons[weaponId];

  if (def.fireMode !== 'stream') {
    flamethrowerFiring = false;
    return null;
  }

  // Cannot fire while reloading
  if (player.player.isReloading) {
    flamethrowerFiring = false;
    return null;
  }

  // Check fuel
  if (player.player.fuel <= 0) {
    flamethrowerFiring = false;
    return 'empty';
  }

  // Consume fuel
  const fuelCost = (def.fuelBurnRate ?? 5) * dt;
  player.player.fuel = Math.max(0, player.player.fuel - fuelCost);

  flamethrowerFiring = true;

  // Determine aim
  if (aimOrigin && aimDirection) {
    _streamOrigin.set(aimOrigin.x, aimOrigin.y, aimOrigin.z);
    _streamDir.set(aimDirection.x, aimDirection.y, aimDirection.z).normalize();
  } else {
    _streamOrigin.copy(camera.position);
    _streamDir.set(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
  }

  // Enforce fire-rate cooldown for damage ticks
  const now = getGameTime();
  const lastFired = lastFireTime[weaponId] ?? 0;
  if (now - lastFired < def.fireRate) {
    return null; // still firing visually, but no damage tick this frame
  }
  lastFireTime[weaponId] = now;

  // Damage all enemies within range AND within cone
  const range = def.range;
  const coneHalfAngle = def.spread; // radians
  const cosCone = Math.cos(coneHalfAngle);

  const level = useGameStore.getState().leveling.level;
  const bonuses = getLevelBonuses(level);
  const scaledDamage = Math.ceil(def.damage * bonuses.damageMult * getDamageMultiplier());

  let hitAny = false;
  for (const entity of world.entities) {
    if (!entity.enemy || !entity.position || !entity.id) continue;

    // Convert entity position to Three.js coords
    _toEnemy.set(
      entity.position.x - _streamOrigin.x,
      entity.position.y + 0.5 - _streamOrigin.y,
      -entity.position.z - _streamOrigin.z,
    );

    const dist = _toEnemy.length();
    if (dist > range || dist < 0.1) continue;

    // Cone check: dot product of normalized vectors
    _toEnemy.normalize();
    const dot = _toEnemy.dot(_streamDir);
    if (dot < cosCone) continue;

    // In cone and range — apply damage
    if (dotDamageCallback) {
      dotDamageCallback(entity.id, scaledDamage);
    }
    hitAny = true;
    shotsFired++;

    // Apply/refresh DOT
    if (def.dotDps && def.dotDuration) {
      applyDot(entity.id, def.dotDps, def.dotDuration);
    }
  }

  if (hitAny) {
    shotsHit++;
    triggerScreenShake(0.02);
  }

  // Subtle screen shake while firing
  triggerScreenShake(0.01);

  return weaponSoundMap[weaponId];
}

/**
 * Apply or refresh a DOT effect on an enemy.
 */
function applyDot(entityId: string, dps: number, duration: number): void {
  // Refresh existing DOT if present
  for (const dot of activeDots) {
    if (dot.entityId === entityId) {
      dot.remaining = duration; // refresh duration
      dot.dps = dps; // update in case of scaling changes
      return;
    }
  }
  // New DOT
  activeDots.push({ entityId, dps, remaining: duration });
}

/**
 * Tick all active DOTs. Call once per frame from the game loop.
 * @param dt  Frame delta in seconds.
 */
export function updateDots(dt: number): void {
  for (let i = activeDots.length - 1; i >= 0; i--) {
    const dot = activeDots[i];
    dot.remaining -= dt;

    if (dot.remaining <= 0) {
      activeDots.splice(i, 1);
      continue;
    }

    // Apply damage this frame
    const damage = Math.ceil(dot.dps * dt);
    if (damage > 0 && dotDamageCallback) {
      // Check entity still exists
      const entity = world.entities.find((e) => e.id === dot.entityId && e.enemy);
      if (entity) {
        dotDamageCallback(dot.entityId, damage);
      } else {
        // Entity dead/removed — clean up DOT
        activeDots.splice(i, 1);
      }
    }
  }
}

/**
 * Update fuel regeneration for the player (passive regen each frame).
 * @param player  The player entity.
 * @param dt      Frame delta in seconds.
 */
export function updateFuel(player: Entity, dt: number): void {
  if (!player.player) return;

  const weaponId = player.player.currentWeapon;
  const def = weapons[weaponId];

  // Only regen fuel when NOT firing the flamethrower (or for any weapon with fuel)
  if (def.fireMode === 'stream' && !flamethrowerFiring) {
    const regenRate = def.fuelRegenRate ?? 1;
    const max = player.player.fuelMax;
    player.player.fuel = Math.min(max, player.player.fuel + regenRate * dt);
  }

  // Always regen when holding a different weapon
  if (def.fireMode !== 'stream' && player.player.fuel < player.player.fuelMax) {
    const flameDef = weapons.brimstoneFlamethrower;
    const regenRate = flameDef.fuelRegenRate ?? 1;
    player.player.fuel = Math.min(player.player.fuelMax, player.player.fuel + regenRate * dt);
  }
}

/** Clear all active DOTs (e.g. on floor transition). */
export function clearDots(): void {
  activeDots.length = 0;
}

/** Check if weapon is a stream-type (flamethrower). */
export function isStreamWeapon(weaponId: WeaponId): boolean {
  return weapons[weaponId].fireMode === 'stream';
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
