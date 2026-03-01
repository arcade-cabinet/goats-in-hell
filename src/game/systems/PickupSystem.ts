/**
 * PickupSystem -- proximity-based pickup collection with magnet pull.
 *
 * Each frame, checks player distance to all active pickups. Nearby pickups
 * are magnetically attracted toward the player. On contact, applies the
 * pickup effect (health, ammo, weapon grant, or power-up activation).
 */
import type { Entity, WeaponId } from '../entities/components';
import {
  vec3AddInPlace,
  vec3Distance,
  vec3Normalize,
  vec3Scale,
  vec3Subtract,
} from '../entities/vec3';
import { world } from '../entities/world';
import { playSound } from './AudioSystem';
import { activatePowerUp } from './PowerUpSystem';

// Magnet pull: pickups within this radius accelerate toward the player
const MAGNET_RADIUS = 3.5;
const MAGNET_STRENGTH = 0.12;

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
  const player = world.entities.find((e: Entity) => e.type === 'player');

  if (!player || !player.player || !player.position || !player.ammo) {
    return;
  }

  const playerPos = player.position;

  // Snapshot so removals during iteration are safe
  const pickups = world.entities.filter((e: Entity) => e.pickup?.active && e.position);

  for (const entity of pickups) {
    const pickup = entity.pickup!;
    const pickupPos = entity.position!;
    let dist = vec3Distance(playerPos, pickupPos);

    // Magnet pull: attract nearby pickups toward the player
    if (dist < MAGNET_RADIUS && dist > 1.0) {
      const dir = vec3Normalize(vec3Subtract(playerPos, pickupPos));
      const pull = MAGNET_STRENGTH * (1 - dist / MAGNET_RADIUS);
      vec3AddInPlace(pickupPos, vec3Scale(dir, pull));
      dist = vec3Distance(playerPos, pickupPos);
    }

    if (dist >= 1.5) {
      continue;
    }

    // ----- Apply pickup effect -----

    if (pickup.pickupType === 'health') {
      player.player.hp = Math.min(player.player.hp + pickup.value, player.player.maxHp);
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

    // ----- Clean up the pickup entity -----

    pickup.active = false;
    world.remove(entity);
  }
}
