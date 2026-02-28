import {Scene, Vector3} from '@babylonjs/core';
import type {Entity, WeaponId} from '../entities/components';
import {world} from '../entities/world';
import {playSound} from './AudioSystem';
import {createPickupBurst} from '../rendering/Particles';
import {activatePowerUp} from './PowerUpSystem';

// Magnet pull: pickups within this radius accelerate toward the player
const MAGNET_RADIUS = 3.5;
const MAGNET_STRENGTH = 0.12;

// Scene reference for particle effects
let pickupScene: Scene | null = null;

/** Set the Babylon.js scene for pickup collection particle effects. */
export function setPickupScene(scene: Scene): void {
  pickupScene = scene;
}

// Default reserve ammo granted when picking up a new weapon
const WEAPON_PICKUP_RESERVE: Record<WeaponId, number> = {
  hellPistol: 48,
  brimShotgun: 16,
  hellfireCannon: 120,
  goatsBane: 12,
};

// ---------------------------------------------------------------------------
// Main system entry point
// ---------------------------------------------------------------------------

/**
 * Each frame, check whether the player is close enough to any active pickup
 * entity. If so, apply the pickup effect (heal, ammo, or weapon) and remove
 * the pickup from the world.
 */
export function pickupSystemUpdate(): void {
  const player = world.entities.find(
    (e: Entity) => e.type === 'player',
  );

  if (!player || !player.player || !player.position || !player.ammo) {
    return;
  }

  const playerPos = player.position;

  // Snapshot so removals during iteration are safe
  const pickups = world.entities.filter(
    (e: Entity) => e.pickup && e.pickup.active && e.position,
  );

  for (const entity of pickups) {
    const pickup = entity.pickup!;
    const pickupPos = entity.position!;
    let dist = Vector3.Distance(playerPos, pickupPos);

    // Magnet pull: attract nearby pickups toward the player
    if (dist < MAGNET_RADIUS && dist > 1.0) {
      const dir = playerPos.subtract(pickupPos).normalize();
      const pull = MAGNET_STRENGTH * (1 - dist / MAGNET_RADIUS);
      pickupPos.addInPlace(dir.scale(pull));
      // Update mesh position if it exists
      if (entity.mesh) {
        entity.mesh.position.x = pickupPos.x;
        entity.mesh.position.z = pickupPos.z;
      }
      dist = Vector3.Distance(playerPos, pickupPos);
    }

    if (dist >= 1.5) {
      continue;
    }

    // ----- Apply pickup effect -----

    if (pickup.pickupType === 'health') {
      // Health pickup collection — nightmare filtering is handled at spawn time
      // (explore floors skip health spawns; arenas/bosses spawn reduced trickle)
      player.player.hp = Math.min(
        player.player.hp + pickup.value,
        player.player.maxHp,
      );
    } else if (pickup.pickupType === 'ammo') {
      const weaponId = player.player.currentWeapon;
      const ammoSlot = player.ammo[weaponId];
      ammoSlot.reserve = Math.min(ammoSlot.reserve + pickup.value, 999);
    } else if (pickup.pickupType === 'weapon' && pickup.weaponId) {
      const weaponId = pickup.weaponId;

      // Add weapon to inventory if not already owned
      if (!player.player.weapons.includes(weaponId)) {
        player.player.weapons.push(weaponId);
      }

      // Grant reserve ammo for the picked-up weapon
      const ammoSlot = player.ammo[weaponId];
      ammoSlot.reserve = Math.min(ammoSlot.reserve + WEAPON_PICKUP_RESERVE[weaponId], 999);
    } else if (pickup.pickupType === 'powerup' && pickup.powerUpType) {
      activatePowerUp(pickup.powerUpType);
    }

    playSound('pickup');

    // ----- Collection particle burst -----
    if (pickupScene) {
      createPickupBurst(entity.position!.clone(), pickupScene, pickup.pickupType);
    }

    // ----- Clean up the pickup entity -----

    pickup.active = false;

    if (entity.mesh) {
      entity.mesh.dispose();
    }

    if (entity.particles) {
      entity.particles.dispose();
    }

    world.remove(entity);
  }
}
