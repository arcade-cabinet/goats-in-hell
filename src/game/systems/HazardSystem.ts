/**
 * Hazard System — processes environmental hazards each game tick.
 *
 * - Spike traps: damage player on proximity with cooldown
 * - Explosive barrels: take damage from player projectiles, explode dealing AoE
 */

import type {Entity} from '../entities/components';
import {vec3Distance} from '../entities/vec3';
import {world} from '../entities/world';
import {GameState} from '../../state/GameState';
import {playSound} from './AudioSystem';
import {pushDamageEvent} from './damageEvents';
import {removeEntity} from './CombatSystem';
import {getGameTime} from './GameClock';
import {registerDamageDirection, triggerBloodSplatter, triggerEnvKill} from '../ui/HUDEvents';

const SPIKE_RANGE = 1.2;
const SPIKE_COOLDOWN_MS = 1500;
const BARREL_EXPLOSION_RANGE = 4;

/** Per-hazard cooldown tracker (keyed by entity id). */
const hazardCooldowns = new Map<string, number>();

export function resetHazardSystem(): void {
  hazardCooldowns.clear();
}

export function hazardSystemUpdate(): void {
  const player = world.entities.find((e: Entity) => e.type === 'player');
  if (!player?.position || !player.player) return;

  const now = getGameTime();
  const hazards = world.entities.filter((e: Entity) => e.hazard && e.position);

  for (const hazard of hazards) {
    const hz = hazard.hazard!;
    const pos = hazard.position!;
    const dist = vec3Distance(player.position, pos);

    if (hz.hazardType === 'spikes') {
      // Damage player if within range and off cooldown
      if (dist < SPIKE_RANGE) {
        const lastHit = hazardCooldowns.get(hazard.id!) ?? 0;
        if (now - lastHit > SPIKE_COOLDOWN_MS) {
          player.player.hp -= hz.damage;
          hazardCooldowns.set(hazard.id!, now);
          GameState.set({damageFlash: 0.5, screenShake: 4});
          playSound('hurt');
          triggerBloodSplatter(Math.min(1, hz.damage / 20));
          registerDamageDirection(pos);
        }
      }
    }
    // Barrel HP depletion is handled by projectile collision in CombatSystem
    // (see damageBarrel below). Here we just check if barrel should explode.
    if (hz.hazardType === 'barrel' && hz.hp !== undefined && hz.hp <= 0) {
      explodeBarrel(hazard);
    }
  }
}

/**
 * Called by CombatSystem when a player projectile hits a barrel.
 * Reduces barrel HP; explosion is triggered in the next hazardSystemUpdate tick.
 */
export function damageBarrel(barrel: Entity, damage: number): void {
  if (!barrel.hazard || barrel.hazard.hazardType !== 'barrel') return;
  if (barrel.hazard.hp === undefined) return;
  barrel.hazard.hp -= damage;
}

function explodeBarrel(barrel: Entity): void {
  const pos = barrel.position!;
  const damage = barrel.hazard!.damage;

  playSound('explosion');

  // Damage all entities in blast radius
  const nearby = world.entities.filter((e: Entity) => {
    if (!e.position || e === barrel) return false;
    return vec3Distance(e.position, pos) < BARREL_EXPLOSION_RANGE;
  });

  for (const entity of nearby) {
    const dist = vec3Distance(entity.position!, pos);
    // Damage falls off with distance (100% at center, 25% at edge)
    const falloff = 1 - (dist / BARREL_EXPLOSION_RANGE) * 0.75;
    const actualDmg = Math.ceil(damage * falloff);

    if (entity.type === 'player' && entity.player) {
      entity.player.hp -= actualDmg;
      GameState.set({damageFlash: 0.8, screenShake: 12});
      registerDamageDirection(pos);
      triggerBloodSplatter(Math.min(1, actualDmg / 30));
      playSound('hurt');
    } else if (entity.enemy) {
      entity.enemy.hp -= actualDmg;
      pushDamageEvent(actualDmg, entity.position!);
      if (entity.enemy.hp <= 0) {
        removeEntity(entity);
        triggerEnvKill('barrel');
        // Barrel explosion screen shake for nearby enemy kills
        const p = world.entities.find((e: Entity) => e.type === 'player');
        if (p?.position) {
          const playerDist = vec3Distance(p.position, pos);
          if (playerDist < BARREL_EXPLOSION_RANGE * 2) {
            const proximity = 1 - playerDist / (BARREL_EXPLOSION_RANGE * 2);
            const shake = Math.ceil(proximity * 6);
            const cur = GameState.get().screenShake;
            GameState.set({screenShake: Math.max(cur, shake)});
          }
        }
      }
    } else if (entity.hazard?.hazardType === 'barrel' && entity.hazard.hp !== undefined) {
      // Chain explosion: damage nearby barrels
      entity.hazard.hp -= actualDmg;
    }
  }

  // Remove the exploded barrel
  removeEntity(barrel);
}
