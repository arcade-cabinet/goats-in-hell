import {Ray, Scene, Vector3} from '@babylonjs/core';
import type {Entity, WeaponId} from '../entities/components';
import {world} from '../entities/world';
import {GameState} from '../../state/GameState';
import {weapons} from './weapons';
import {playSound} from '../systems/AudioSystem';
import type {SoundType} from '../systems/AudioSystem';

// Track last fire time per weapon to enforce fire rate cooldown
const lastFireTime: Record<string, number> = {};

// Map weapon IDs to their firing sound effects
const weaponSoundMap: Record<WeaponId, SoundType> = {
  hellPistol: 'shoot',
  brimShotgun: 'shotgun',
  hellfireCannon: 'rapid',
  goatsBane: 'bigshot',
};

/**
 * Returns initial ammo loadout for the player.
 * Starts with a loaded Hell Pistol + 32 reserve; all other weapons empty.
 */
export function initPlayerAmmo(): Record<
  WeaponId,
  {current: number; reserve: number; magSize: number}
> {
  return {
    hellPistol: {
      current: weapons.hellPistol.magSize,
      reserve: 32,
      magSize: weapons.hellPistol.magSize,
    },
    brimShotgun: {current: 0, reserve: 0, magSize: weapons.brimShotgun.magSize},
    hellfireCannon: {current: 0, reserve: 0, magSize: weapons.hellfireCannon.magSize},
    goatsBane: {current: 0, reserve: 0, magSize: weapons.goatsBane.magSize},
  };
}

/**
 * Attempt to fire the player's current weapon.
 * Checks cooldown and ammo, then performs hitscan or spawns a projectile.
 * Returns true if a shot was fired.
 */
export function tryShoot(scene: Scene, player: Entity): boolean {
  if (!player.player || !player.ammo || !player.position) {
    return false;
  }

  const weaponId = player.player.currentWeapon;
  const def = weapons[weaponId];
  const ammo = player.ammo[weaponId];

  // Cannot shoot while reloading
  if (player.player.isReloading) {
    return false;
  }

  // Check ammo
  if (ammo.current <= 0) {
    playSound('empty');
    return false;
  }

  // Enforce fire-rate cooldown
  const now = performance.now();
  const lastFired = lastFireTime[weaponId] ?? 0;
  if (now - lastFired < def.fireRate) {
    return false;
  }

  lastFireTime[weaponId] = now;

  // Consume ammo
  ammo.current -= 1;

  // Trigger gun flash effect
  GameState.set({gunFlash: 6});

  // Get camera forward direction for aiming
  const camera = scene.activeCamera;
  if (!camera) {
    return false;
  }

  // Camera forward vector (the direction the player is looking)
  const cameraForward = camera.getForwardRay().direction.clone();

  if (def.isProjectile) {
    // --- Projectile weapon: spawn a projectile entity ---
    spawnProjectile(player, cameraForward, def);
  } else {
    // --- Hitscan weapon: cast ray(s) from camera ---
    for (let i = 0; i < def.pellets; i++) {
      const direction = applySpread(cameraForward, def.spread);
      performHitscan(scene, player.position, direction, def);
    }
  }

  // Play weapon-specific firing sound
  playSound(weaponSoundMap[weaponId]);

  return true;
}

/**
 * Begin a reload if the player is not already reloading and has reserve ammo.
 */
export function tryReload(player: Entity): void {
  if (!player.player || !player.ammo) {
    return;
  }

  const weaponId = player.player.currentWeapon;
  const ammo = player.ammo[weaponId];

  // Already reloading
  if (player.player.isReloading) {
    return;
  }

  // Magazine already full
  if (ammo.current >= ammo.magSize) {
    return;
  }

  // No reserve ammo
  if (ammo.reserve <= 0) {
    return;
  }

  player.player.isReloading = true;
  player.player.reloadStart = performance.now();
  playSound('reload');
}

/**
 * Check if the current reload has completed and transfer ammo from reserve
 * into the magazine.
 */
export function updateReload(player: Entity): void {
  if (!player.player || !player.ammo) {
    return;
  }

  if (!player.player.isReloading) {
    return;
  }

  const weaponId = player.player.currentWeapon;
  const def = weapons[weaponId];
  const elapsed = performance.now() - player.player.reloadStart;

  if (elapsed >= def.reloadTime) {
    const ammo = player.ammo[weaponId];
    const needed = ammo.magSize - ammo.current;
    const transfer = Math.min(needed, ammo.reserve);

    ammo.current += transfer;
    ammo.reserve -= transfer;

    player.player.isReloading = false;
    playSound('reload');
  }
}

/**
 * Switch to a different weapon if the player has it in their inventory.
 */
export function switchWeapon(player: Entity, weaponId: WeaponId): void {
  if (!player.player) {
    return;
  }

  // Player must possess the weapon
  if (!player.player.weapons.includes(weaponId)) {
    return;
  }

  // Already equipped
  if (player.player.currentWeapon === weaponId) {
    return;
  }

  // Cancel any in-progress reload
  player.player.isReloading = false;

  player.player.currentWeapon = weaponId;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Apply random spread to a direction vector.
 * Spread of 0 returns the original direction unchanged.
 */
function applySpread(direction: Vector3, spread: number): Vector3 {
  if (spread <= 0) {
    return direction.clone();
  }

  const spreadDir = direction.clone();
  spreadDir.x += (Math.random() - 0.5) * spread;
  spreadDir.y += (Math.random() - 0.5) * spread;
  spreadDir.z += (Math.random() - 0.5) * spread;

  return spreadDir.normalize();
}

/**
 * Cast a single hitscan ray from the player's position along `direction`,
 * checking for enemy meshes within weapon range.
 */
function performHitscan(
  scene: Scene,
  origin: Vector3,
  direction: Vector3,
  def: (typeof weapons)[WeaponId],
): void {
  const ray = new Ray(origin.clone(), direction.clone(), def.range);

  const hit = scene.pickWithRay(ray, mesh => {
    return mesh.name.startsWith('mesh-enemy-');
  });

  if (hit?.hit && hit.pickedMesh) {
    applyDamageToEnemy(hit.pickedMesh.name, def.damage);
  }
}

/**
 * Spawn a projectile entity travelling in the given direction.
 */
function spawnProjectile(
  player: Entity,
  direction: Vector3,
  def: (typeof weapons)[WeaponId],
): void {
  const spreadDir = applySpread(direction, def.spread);

  const velocity = spreadDir.scale(def.projectileSpeed ?? 0.5);

  world.add({
    type: 'projectile',
    position: player.position!.clone(),
    velocity,
    projectile: {
      life: def.range / (def.projectileSpeed ?? 0.5),
      damage: def.damage,
      speed: def.projectileSpeed ?? 0.5,
      owner: 'player',
      aoe: def.aoe,
    },
  });
}

/**
 * Find an enemy entity by its mesh name and apply damage.
 * If the enemy's hp drops to 0 or below, remove it and update score.
 *
 * The EnemyRenderer names meshes as "mesh-enemy-{entity.id}", so we extract
 * the entity ID from the mesh name rather than looking up a `.mesh` property
 * that doesn't exist on enemy entities.
 */
function applyDamageToEnemy(meshName: string, damage: number): void {
  // Extract entity ID from mesh name format: "mesh-enemy-{id}"
  const entityId = meshName.replace('mesh-enemy-', '');
  const entity = world.entities.find(e => e.id === entityId && e.enemy);

  if (!entity || !entity.enemy) {
    return;
  }

  entity.enemy.hp -= damage;

  // Play boss_hit sound when damaging the arch-goat boss
  if (entity.type === 'archGoat') {
    playSound('boss_hit');
  }

  if (entity.enemy.hp <= 0) {
    const state = GameState.get();
    GameState.set({
      score: state.score + entity.enemy.scoreValue,
      kills: state.kills + 1,
      totalKills: state.totalKills + 1,
    });

    world.remove(entity);
  }
}
