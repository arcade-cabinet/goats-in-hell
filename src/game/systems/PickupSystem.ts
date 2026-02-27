import {Vector3} from '@babylonjs/core';
import type {Entity, WeaponId} from '../entities/components';
import {world} from '../entities/world';
import {playSound} from './AudioSystem';

// Default reserve ammo granted when picking up a new weapon
const WEAPON_PICKUP_RESERVE: Record<WeaponId, number> = {
  hellPistol: 32,
  brimShotgun: 16,
  hellfireCannon: 80,
  goatsBane: 6,
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
    const dist = Vector3.Distance(playerPos, entity.position!);

    if (dist >= 1.5) {
      continue;
    }

    // ----- Apply pickup effect -----

    if (pickup.pickupType === 'health') {
      player.player.hp = Math.min(
        player.player.hp + pickup.value,
        player.player.maxHp,
      );
    } else if (pickup.pickupType === 'ammo') {
      const weaponId = player.player.currentWeapon;
      const ammoSlot = player.ammo[weaponId];
      ammoSlot.reserve += pickup.value;
    } else if (pickup.pickupType === 'weapon' && pickup.weaponId) {
      const weaponId = pickup.weaponId;

      // Add weapon to inventory if not already owned
      if (!player.player.weapons.includes(weaponId)) {
        player.player.weapons.push(weaponId);
      }

      // Grant reserve ammo for the picked-up weapon
      const ammoSlot = player.ammo[weaponId];
      ammoSlot.reserve += WEAPON_PICKUP_RESERVE[weaponId];
    }

    playSound('pickup');

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
