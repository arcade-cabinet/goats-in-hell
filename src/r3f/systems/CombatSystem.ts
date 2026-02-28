/**
 * R3F Combat System — damage pipeline for enemies and the player.
 *
 * Ported from src/game/systems/CombatSystem.ts.
 * Uses Miniplex ECS world, Zustand game store, and imperative Three.js
 * particle effects. No Babylon.js dependencies.
 */
import * as THREE from 'three';
import type { Entity } from '../../game/entities/components';
import { world } from '../../game/entities/world';
import { registerKill } from '../../game/systems/KillStreakSystem';
import { useGameStore } from '../../state/GameStore';
import { playSound } from '../audio/AudioSystem';
import { HapticEvent, haptics } from '../input/HapticsService';
import { triggerDamageFlash } from '../rendering/PostProcessing';
import { createBloodSplash, createDeathBurst } from './ParticleEffects';

// ---------------------------------------------------------------------------
// Scene reference — set by the game loop component
// ---------------------------------------------------------------------------

let combatScene: THREE.Scene | null = null;

/** Provide the Three.js scene for particle effects. Call once on mount. */
export function setCombatScene(scene: THREE.Scene): void {
  combatScene = scene;
}

/** Clear the scene reference on unmount. */
export function clearCombatScene(): void {
  combatScene = null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Safely remove an entity from the world. */
export function removeEntity(entity: Entity): void {
  world.remove(entity);
}

// ---------------------------------------------------------------------------
// Damage enemy
// ---------------------------------------------------------------------------

export interface DamageResult {
  killed: boolean;
  damage: number;
}

/**
 * Apply damage to an enemy, factoring in armor if present.
 *
 * @param entityId  The entity's id field in the Miniplex world.
 * @param damage    Raw incoming damage.
 * @param isHeadshot  Whether this was a headshot (critical).
 * @returns  Result with actual damage dealt and kill status.
 */
export function damageEnemy(entityId: string, damage: number, isHeadshot?: boolean): DamageResult {
  const entity = world.entities.find((e: Entity) => e.id === entityId && e.enemy);

  if (!entity || !entity.enemy) {
    return { killed: false, damage: 0 };
  }

  const enemy = entity.enemy;

  // Armored enemies absorb damage with armor first
  if (enemy.isArmored && enemy.armorHp !== undefined && enemy.armorHp > 0) {
    const absorbed = Math.min(damage, enemy.armorHp);
    enemy.armorHp -= absorbed;
    damage -= absorbed;
  }

  enemy.hp -= damage;

  // Stagger on heavy hits (>25% max HP) — pause AI + visual knockback
  if (damage > enemy.maxHp * 0.25 && enemy.hp > 0) {
    enemy.staggerTimer = 300; // 300ms stagger

    // Knockback direction: away from player
    const player = world.entities.find((e: Entity) => e.type === 'player');
    if (player?.position && entity.position) {
      const dx = entity.position.x - player.position.x;
      const dz = entity.position.z - player.position.z;
      const len = Math.sqrt(dx * dx + dz * dz) || 1;
      enemy.staggerDirX = dx / len;
      enemy.staggerDirZ = dz / len;
    }
  }

  if (enemy.hp <= 0) {
    handleEnemyKill(entity);
    return { killed: true, damage };
  }

  // Enemy survived — play hurt feedback
  playSound('hit');

  // Blood splash at enemy position (negate Z for Three.js coords)
  if (combatScene && entity.position) {
    const pos = new THREE.Vector3(entity.position.x, entity.position.y + 0.5, -entity.position.z);
    createBloodSplash(pos, combatScene);
  }

  if (isHeadshot) {
    playSound('headshot');
  }

  return { killed: false, damage };
}

/**
 * Apply damage to an enemy entity directly (when you already have the entity).
 * Used internally for projectile and AoE damage.
 */
export function damageEnemyEntity(entity: Entity, damage: number, _isCrit?: boolean): number {
  const enemy = entity.enemy!;

  // Armored enemies absorb damage with armor first
  if (enemy.isArmored && enemy.armorHp !== undefined && enemy.armorHp > 0) {
    const absorbed = Math.min(damage, enemy.armorHp);
    enemy.armorHp -= absorbed;
    damage -= absorbed;
  }

  enemy.hp -= damage;

  // Stagger on heavy hits (>25% max HP)
  if (damage > enemy.maxHp * 0.25 && enemy.hp > 0) {
    enemy.staggerTimer = 300;

    const player = world.entities.find((e: Entity) => e.type === 'player');
    if (player?.position && entity.position) {
      const dx = entity.position.x - player.position.x;
      const dz = entity.position.z - player.position.z;
      const len = Math.sqrt(dx * dx + dz * dz) || 1;
      enemy.staggerDirX = dx / len;
      enemy.staggerDirZ = dz / len;
    }
  }

  return damage;
}

// ---------------------------------------------------------------------------
// Handle enemy kill
// ---------------------------------------------------------------------------

/**
 * Process an enemy death: award XP, increment kills, play death sound,
 * spawn death particles, trigger haptics, and remove the entity.
 */
export function handleEnemyKill(entity: Entity): void {
  const store = useGameStore.getState();
  const scoreValue = entity.enemy?.scoreValue ?? 0;

  // Update store: score and kills
  store.patch({
    score: store.score + scoreValue,
    kills: store.kills + 1,
    totalKills: store.totalKills + 1,
  });

  // Award XP via logarithmic leveling system
  store.awardXp(scoreValue);

  // Track kill streak
  registerKill();

  // Audio feedback
  playSound('goat_die');

  // Haptic feedback
  haptics.trigger(HapticEvent.Kill);

  // Death particles at entity position (negate Z for Three.js coords)
  if (combatScene && entity.position) {
    const pos = new THREE.Vector3(entity.position.x, entity.position.y + 0.5, -entity.position.z);
    createDeathBurst(pos, combatScene);
  }

  // Remove entity from ECS world
  removeEntity(entity);
}

// ---------------------------------------------------------------------------
// Damage player
// ---------------------------------------------------------------------------

/**
 * Apply damage to the player.
 *
 * @param damage  Raw incoming damage amount.
 * @returns  Whether the player died.
 */
export function damagePlayer(damage: number): boolean {
  const player = world.entities.find((e: Entity) => e.type === 'player' && e.player);

  if (!player || !player.player) return false;

  player.player.hp -= damage;

  // Audio feedback
  playSound('hurt');

  // Visual feedback
  triggerDamageFlash();

  // Haptic feedback
  haptics.trigger(HapticEvent.DamageTaken);

  // Screen effects via Zustand store
  useGameStore.getState().patch({
    damageFlash: 0.8,
    screenShake: Math.max(useGameStore.getState().screenShake, 8),
  });

  if (player.player.hp <= 0) {
    player.player.hp = 0;

    // Trigger death — set game screen to dead
    playSound('death_sting');
    useGameStore.getState().patch({ screen: 'dead' });

    return true;
  }

  // Low health warning haptics (below 25%)
  if (player.player.hp < player.player.maxHp * 0.25) {
    haptics.trigger(HapticEvent.LowHealth, 0.5);
  }

  return false;
}

// ---------------------------------------------------------------------------
// Projectile helpers
// ---------------------------------------------------------------------------

/**
 * Calculate distance between two Babylon.js-coordinate positions.
 * Both are in Babylon left-handed space (no Z negation needed for comparison).
 */
function distanceBetween(
  a: { x: number; y: number; z: number },
  b: { x: number; y: number; z: number },
): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/** Check a player-owned projectile against all enemies. */
function checkPlayerProjectileCollisions(projectile: Entity): boolean {
  const projPos = projectile.position!;
  const projData = projectile.projectile!;
  let hitSomething = false;

  for (const entity of [...world.entities]) {
    if (!entity.enemy || !entity.position) continue;

    const dist = distanceBetween(projPos, entity.position);

    if (dist < 1.5) {
      hitSomething = true;

      damageEnemyEntity(entity, projData.damage);

      if (entity.enemy.hp <= 0) {
        handleEnemyKill(entity);
      } else {
        playSound('hit');
        // Blood splash
        if (combatScene && entity.position) {
          const pos = new THREE.Vector3(
            entity.position.x,
            entity.position.y + 0.5,
            -entity.position.z,
          );
          createBloodSplash(pos, combatScene);
        }
      }

      // Area-of-effect: damage all enemies within the AoE radius
      if (projData.aoe !== undefined && projData.aoe > 0) {
        playSound('explosion');

        let aoeKills = 0;
        for (const other of [...world.entities]) {
          if (!other.enemy || !other.position || other === entity) continue;

          const aoeDist = distanceBetween(projPos, other.position);
          if (aoeDist < projData.aoe) {
            damageEnemyEntity(other, projData.damage);

            if (other.enemy.hp <= 0) {
              handleEnemyKill(other);
              aoeKills++;
            }
          }
        }

        // Screen shake proportional to explosion proximity + kill count
        const playerEntity = world.entities.find((e: Entity) => e.type === 'player');
        if (playerEntity?.position) {
          const playerDist = distanceBetween(projPos, playerEntity.position);
          if (playerDist < projData.aoe * 2) {
            const proximity = 1 - playerDist / (projData.aoe * 2);
            const killBonus = Math.min(aoeKills * 2, 8);
            const shake = Math.ceil(proximity * 8 + killBonus);
            const store = useGameStore.getState();
            store.patch({
              screenShake: Math.max(store.screenShake, shake),
            });
          }
        }
      }

      break; // Projectile consumed on first direct hit
    }
  }

  return hitSomething;
}

/** Check an enemy-owned projectile against the player. */
function checkEnemyProjectileCollision(projectile: Entity, player: Entity): boolean {
  if (!player.position || !player.player) return false;

  const dist = distanceBetween(projectile.position!, player.position);

  if (dist < 1.5) {
    const rawDmg = projectile.projectile!.damage;
    player.player.hp -= rawDmg;

    // Visual feedback
    triggerDamageFlash();
    const store = useGameStore.getState();
    store.patch({
      damageFlash: rawDmg > 0 ? 0.8 : 0.2,
      screenShake: rawDmg > 0 ? 8 : 3,
    });

    playSound('hurt');
    haptics.trigger(HapticEvent.DamageTaken);

    // Check for death
    if (player.player.hp <= 0) {
      player.player.hp = 0;
      playSound('death_sting');
      store.patch({ screen: 'dead' });
    }

    return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// Main system entry point — melee + projectile update
// ---------------------------------------------------------------------------

/**
 * Per-frame combat system update.
 *
 * Processes:
 * 1. Enemy melee attacks (proximity-based)
 * 2. Projectile movement, lifetime, and collision detection
 *
 * @param deltaTime  Frame delta in ms (typically ~16 for 60fps)
 */
export function combatSystemUpdate(deltaTime: number): void {
  const dtScale = deltaTime / 16;
  const _dtSeconds = deltaTime / 1000;

  const player = world.entities.find((e: Entity) => e.type === 'player' && e.player);

  // --- Enemy melee attacks ---
  if (player?.position && player.player) {
    for (const entity of world.entities) {
      if (!entity.enemy || !entity.position) continue;

      // Skip staggered enemies
      if (entity.enemy.staggerTimer && entity.enemy.staggerTimer > 0) {
        entity.enemy.staggerTimer -= deltaTime;
        continue;
      }

      // Check if enemy is within melee attack range
      const dist = distanceBetween(entity.position, player.position);

      if (dist <= entity.enemy.attackRange) {
        // Check cooldown
        if (entity.enemy.attackCooldown <= 0) {
          // Melee attack
          damagePlayer(entity.enemy.damage);

          // Reset cooldown (in ms) — ~1 second between attacks
          entity.enemy.attackCooldown = 1000;
        }
      }

      // Decrement attack cooldown
      if (entity.enemy.attackCooldown > 0) {
        entity.enemy.attackCooldown -= deltaTime;
      }
    }
  }

  // --- Projectile processing ---
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

    // Decrement lifetime (delta-time scaled so range is framerate-independent)
    proj.life -= dtScale;

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
