import {Vector3} from '@babylonjs/core';
import type {Entity} from '../entities/components';
import {world} from '../entities/world';
import {GameState} from '../../state/GameState';
import {useGameStore} from '../../state/GameStore';
import {playSound} from './AudioSystem';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Safely remove an entity from the world, disposing its mesh if present. */
function removeEntity(entity: Entity): void {
  if (entity.mesh) {
    entity.mesh.dispose();
  }
  if (entity.particles) {
    entity.particles.dispose();
  }
  world.remove(entity);
}

/**
 * Apply damage to an enemy, factoring in armor if present.
 * Returns the actual damage dealt to HP.
 */
function damageEnemy(entity: Entity, damage: number): number {
  const enemy = entity.enemy!;

  // Armored enemies absorb damage with armor first
  if (enemy.isArmored && enemy.armorHp !== undefined && enemy.armorHp > 0) {
    const absorbed = Math.min(damage, enemy.armorHp);
    enemy.armorHp -= absorbed;
    damage -= absorbed;
  }

  enemy.hp -= damage;
  return damage;
}

/**
 * Handle an enemy being killed: update score/kills, play sound, and remove
 * the entity from the world.
 */
function handleEnemyKill(entity: Entity): void {
  const state = GameState.get();
  const scoreValue = entity.enemy?.scoreValue ?? 0;

  GameState.set({
    score: state.score + scoreValue,
    kills: state.kills + 1,
    totalKills: state.totalKills + 1,
  });

  // Award XP for the kill (logarithmic leveling)
  useGameStore.getState().awardXp(scoreValue);

  playSound('goat_die');
  removeEntity(entity);
}

// ---------------------------------------------------------------------------
// Collision helpers
// ---------------------------------------------------------------------------

/** Check a player-owned projectile against all enemies. */
function checkPlayerProjectileCollisions(projectile: Entity): boolean {
  const projPos = projectile.position!;
  const projData = projectile.projectile!;
  let hitSomething = false;

  for (const entity of [...world.entities]) {
    if (!entity.enemy || !entity.position) {
      continue;
    }

    const dist = Vector3.Distance(projPos, entity.position);

    if (dist < 1.5) {
      hitSomething = true;

      // Apply direct hit damage
      damageEnemy(entity, projData.damage);

      if (entity.enemy.hp <= 0) {
        handleEnemyKill(entity);
      } else {
        playSound('hit');
      }

      // Area-of-effect: damage all enemies within the AoE radius
      if (projData.aoe !== undefined && projData.aoe > 0) {
        playSound('explosion');

        for (const other of [...world.entities]) {
          if (!other.enemy || !other.position || other === entity) {
            continue;
          }

          const aoeDist = Vector3.Distance(projPos, other.position);
          if (aoeDist < projData.aoe) {
            damageEnemy(other, projData.damage);

            if (other.enemy.hp <= 0) {
              handleEnemyKill(other);
            }
          }
        }
      }

      break; // Projectile consumed on first direct hit
    }
  }

  return hitSomething;
}

/** Check an enemy-owned projectile against the player. */
function checkEnemyProjectileCollision(
  projectile: Entity,
  player: Entity,
): boolean {
  if (!player.position || !player.player) {
    return false;
  }

  const dist = Vector3.Distance(projectile.position!, player.position);

  if (dist < 1.5) {
    player.player.hp -= projectile.projectile!.damage;

    GameState.set({damageFlash: 0.8, screenShake: 8});
    playSound('hurt');

    return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// Main system entry point
// ---------------------------------------------------------------------------

/**
 * Process all active projectiles each frame: move them, decrement lifetime,
 * and check for collisions with enemies (player-owned) or the player
 * (enemy-owned).
 */
export function combatSystemUpdate(deltaTime: number): void {
  const dtScale = deltaTime / 16;

  const player = world.entities.find(
    (e: Entity) => e.type === 'player',
  );

  // Snapshot the entity list so removals during iteration are safe
  const projectiles = world.entities.filter(
    (e: Entity) => e.projectile && e.position && e.velocity,
  );

  for (const projectile of projectiles) {
    const proj = projectile.projectile!;
    const pos = projectile.position!;
    const vel = projectile.velocity!;

    // Move projectile
    pos.x += vel.x * dtScale;
    pos.y += vel.y * dtScale;
    pos.z += vel.z * dtScale;

    // Decrement lifetime
    proj.life -= 1;

    if (proj.life <= 0) {
      removeEntity(projectile);
      continue;
    }

    // Collision detection based on owner
    let hit = false;

    if (proj.owner === 'player') {
      hit = checkPlayerProjectileCollisions(projectile);
    } else if (proj.owner === 'enemy' && player) {
      hit = checkEnemyProjectileCollision(projectile, player);
    }

    if (hit) {
      removeEntity(projectile);
    }
  }
}
