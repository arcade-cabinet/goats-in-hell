/**
 * R3F Pickup System — proximity-based pickup collection.
 *
 * Ported from src/game/systems/PickupSystem.ts.
 * Checks player proximity to pickup entities each frame,
 * applies effects (health, ammo, weapon), and removes collected pickups.
 */
import type { Entity, WeaponId } from '../../game/entities/components';
import { world } from '../../game/entities/world';
import { gameEventBus } from '../../game/systems/telemetry/GameEventBus';
import { useGameStore } from '../../state/GameStore';
import { playSound } from '../audio/AudioSystem';
import { HapticEvent, haptics } from '../input/HapticsService';
import { triggerDamageFlash } from '../rendering/PostProcessing';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Pickup collection radius in world units. */
const PICKUP_RADIUS = 1.5;

/** Magnet pull: pickups within this radius accelerate toward the player. */
const MAGNET_RADIUS = 3.5;
const MAGNET_STRENGTH = 0.12;

/** Default reserve ammo granted when picking up a new weapon. */
const WEAPON_PICKUP_RESERVE: Record<WeaponId, number> = {
  hellPistol: 48,
  brimShotgun: 16,
  hellfireCannon: 120,
  goatsBane: 12,
  brimstoneFlamethrower: 0, // uses fuel, not ammo
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Calculate distance between two positions.
 * Both positions are in Babylon.js left-handed coordinates (ECS space).
 */
function distance(
  a: { x: number; y: number; z: number },
  b: { x: number; y: number; z: number },
): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// ---------------------------------------------------------------------------
// Main system entry point
// ---------------------------------------------------------------------------

/**
 * Per-frame pickup system update.
 *
 * For each active pickup entity, checks proximity to the player.
 * If within range, applies the pickup effect and removes the entity.
 *
 * Positions are in Babylon.js left-handed ECS coordinates (no Z negation
 * needed since both player and pickup are stored in the same space).
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
    let dist = distance(playerPos, pickupPos);

    // Magnet pull: attract nearby pickups toward the player
    // NOTE: MAGNET_STRENGTH tuned for 60fps. For frame-rate independence, multiply by (dt * 60).
    if (dist < MAGNET_RADIUS && dist > PICKUP_RADIUS) {
      const pull = MAGNET_STRENGTH * (1 - dist / MAGNET_RADIUS);
      const dirX = playerPos.x - pickupPos.x;
      const dirZ = playerPos.z - pickupPos.z;
      const dirLen = Math.sqrt(dirX * dirX + dirZ * dirZ) || 1;

      pickupPos.x += (dirX / dirLen) * pull;
      pickupPos.z += (dirZ / dirLen) * pull;

      dist = distance(playerPos, pickupPos);
    }

    if (dist >= PICKUP_RADIUS) {
      continue;
    }

    // --------- Apply pickup effect ---------

    if (pickup.pickupType === 'health') {
      // Circle 3 (Gluttony) — Poisoned Pickups: 50% chance health pickups deal damage
      const circleNumber = useGameStore.getState().circleNumber;
      if (circleNumber === 3 && Math.random() < 0.5) {
        // Poisoned! Deal 10 damage instead of healing
        player.player.hp = Math.max(0, player.player.hp - 10);
        playSound('hurt');
        triggerDamageFlash();
        useGameStore.getState().patch({ damageFlash: 0.6 });
      } else {
        // Normal health pickup — heal player, capped at maxHp
        player.player.hp = Math.min(player.player.hp + pickup.value, player.player.maxHp);
      }
    } else if (pickup.pickupType === 'ammo') {
      // Ammo pickup — add reserve ammo for current weapon
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
    }
    // Note: powerup pickups would be handled via a future PowerUpSystem port

    if (entity.position) {
      gameEventBus.emit({
        type: 'pickup_collected',
        pickupType: pickup.pickupType,
        value: pickup.value,
        position: entity.position,
      });
    }

    // Audio feedback
    playSound('pickup');

    // Haptic feedback
    haptics.trigger(HapticEvent.Pickup);

    // --------- Clean up the pickup entity ---------

    pickup.active = false;
    world.remove(entity);
  }
}
