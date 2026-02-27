/**
 * Enemy AI system powered by YUKA steering behaviors.
 *
 * Each alerted enemy gets a YUKA Vehicle with type-specific steering:
 *   - goat / hellgoat:  SeekBehavior → direct charge, melee
 *   - fireGoat:         ArriveBehavior with flee zone → ranged kiter
 *   - shadowGoat:       SeekBehavior at 1.5× speed → stealth ambusher
 *   - goatKnight:       SeekBehavior → armored charger, slower attacks
 *   - archGoat:         SeekBehavior with phase transitions → boss
 *
 * The shared EntityManager is ticked once per frame; individual Vehicle
 * velocities are written back to the ECS entity positions.
 */
import {
  EntityManager,
  Vehicle,
  SeekBehavior,
  FleeBehavior,
  ArriveBehavior,
  Vector3 as YV3,
} from 'yuka';
import {Vector3} from '@babylonjs/core';
import type {Entity} from '../entities/components';
import {world} from '../entities/world';
import {GameState} from '../../state/GameState';
import {playSound} from './AudioSystem';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALERT_RADIUS = 15;
const ATTACK_COOLDOWN_FRAMES = 60;

// ---------------------------------------------------------------------------
// Shared YUKA EntityManager (one for all enemies)
// ---------------------------------------------------------------------------

const entityManager = new EntityManager();

/**
 * Map from ECS entity ID → YUKA Vehicle.
 * Created lazily when an enemy first becomes alert.
 */
const vehicleMap = new Map<string, Vehicle>();

/** Reusable target vector updated each frame to the player's position. */
const playerTarget = new YV3();

// ---------------------------------------------------------------------------
// Vehicle factory — creates a YUKA Vehicle with type-appropriate behaviors
// ---------------------------------------------------------------------------

function createVehicleForEnemy(entity: Entity): Vehicle {
  const enemy = entity.enemy!;
  const v = new Vehicle();

  v.position.set(entity.position!.x, 0, entity.position!.z);
  v.maxSpeed = enemy.speed;
  v.mass = 1;
  v.maxForce = enemy.speed * 2;
  // Don't let YUKA update the rotation (we don't need heading for 2D sprites)
  v.updateOrientation = false;

  switch (entity.type) {
    case 'fireGoat': {
      // Ranged: seek when far, flee when too close
      const arrive = new ArriveBehavior(playerTarget, 1.5);
      arrive.active = true;
      v.steering.add(arrive);

      // Flee when player is within 6 units
      const flee = new FleeBehavior(playerTarget, 6);
      flee.active = true;
      flee.weight = 1.2; // slight bias toward fleeing
      v.steering.add(flee);
      break;
    }
    case 'shadowGoat': {
      // Fast ambusher — 1.5× speed
      v.maxSpeed = enemy.speed * 1.5;
      v.maxForce = enemy.speed * 3;
      const seek = new SeekBehavior(playerTarget);
      seek.active = true;
      v.steering.add(seek);
      break;
    }
    case 'archGoat': {
      // Boss — slower but strong. Phase transitions handled in update.
      const seek = new SeekBehavior(playerTarget);
      seek.active = true;
      v.steering.add(seek);
      break;
    }
    default: {
      // goat, hellgoat, goatKnight: direct seek
      const seek = new SeekBehavior(playerTarget);
      seek.active = true;
      v.steering.add(seek);
      break;
    }
  }

  entityManager.add(v);
  return v;
}

// ---------------------------------------------------------------------------
// Helpers (unchanged from original)
// ---------------------------------------------------------------------------

function directionTo(from: Vector3, to: Vector3): Vector3 {
  const dir = to.subtract(from);
  dir.y = 0;
  const len = dir.length();
  if (len < 0.0001) return Vector3.Zero();
  return dir.scaleInPlace(1 / len);
}

function meleeHitPlayer(player: Entity, damage: number): void {
  player.player!.hp -= damage;
  GameState.set({damageFlash: 1.0, screenShake: 10});
  playSound('hurt');
}

function spawnProjectile(
  origin: Vector3,
  direction: Vector3,
  damage: number,
  speed: number,
): void {
  const vel = direction.scale(speed);
  world.add({
    type: 'projectile',
    position: origin.clone(),
    velocity: new Vector3(vel.x, vel.y, vel.z),
    projectile: {
      life: 120,
      damage,
      speed,
      owner: 'enemy',
    },
  });
}

// ---------------------------------------------------------------------------
// Type-specific post-steering logic (attacks, projectiles, abilities)
// ---------------------------------------------------------------------------

function postSteeringBasicGoat(
  entity: Entity,
  player: Entity,
  dist: number,
): void {
  const enemy = entity.enemy!;
  if (dist <= enemy.attackRange && enemy.attackCooldown <= 0) {
    meleeHitPlayer(player, enemy.damage);
    enemy.attackCooldown = ATTACK_COOLDOWN_FRAMES;
  }
}

function postSteeringFireGoat(
  entity: Entity,
  player: Entity,
  dist: number,
  dtScale: number,
): void {
  const enemy = entity.enemy!;
  if (enemy.shootCooldown === undefined) enemy.shootCooldown = 90;

  enemy.shootCooldown -= dtScale;

  if (enemy.shootCooldown <= 0 && dist < 15) {
    const dir = directionTo(entity.position!, player.position!);
    spawnProjectile(entity.position!, dir, enemy.damage, 0.08);
    enemy.shootCooldown = 90;
  }
}

function postSteeringShadowGoat(
  entity: Entity,
  player: Entity,
  dist: number,
): void {
  const enemy = entity.enemy!;

  // Visibility ramp
  const t = Math.max(0, Math.min(1, 1 - dist / ALERT_RADIUS));
  enemy.visibilityAlpha = 0.15 + t * 0.85;

  if (dist <= enemy.attackRange && enemy.attackCooldown <= 0) {
    meleeHitPlayer(player, enemy.damage);
    enemy.attackCooldown = ATTACK_COOLDOWN_FRAMES;
  }
}

function postSteeringGoatKnight(
  entity: Entity,
  player: Entity,
  dist: number,
): void {
  const enemy = entity.enemy!;
  if (dist <= enemy.attackRange && enemy.attackCooldown <= 0) {
    meleeHitPlayer(player, enemy.damage);
    enemy.attackCooldown = Math.floor(ATTACK_COOLDOWN_FRAMES * 1.5);
  }
}

function postSteeringArchGoat(
  entity: Entity,
  player: Entity,
  dist: number,
  dtScale: number,
  vehicle: Vehicle,
): void {
  const enemy = entity.enemy!;
  const hpPercent = enemy.hp / enemy.maxHp;
  const isPhase2 = hpPercent <= 0.5;

  // Phase transition: boost speed
  vehicle.maxSpeed = isPhase2 ? enemy.speed * 1.5 : enemy.speed;

  // Melee
  if (dist <= enemy.attackRange && enemy.attackCooldown <= 0) {
    meleeHitPlayer(player, enemy.damage);
    enemy.attackCooldown = ATTACK_COOLDOWN_FRAMES;
  }

  // Ranged: spread projectiles
  if (enemy.shootCooldown === undefined) {
    enemy.shootCooldown = isPhase2 ? 60 : 120;
  }
  enemy.shootCooldown -= dtScale;

  if (enemy.shootCooldown <= 0 && dist < ALERT_RADIUS) {
    const baseDir = directionTo(entity.position!, player.position!);
    for (const angle of [-0.2, 0, 0.2]) {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const rotated = new Vector3(
        baseDir.x * cos - baseDir.z * sin,
        0,
        baseDir.x * sin + baseDir.z * cos,
      );
      spawnProjectile(entity.position!, rotated, enemy.damage, 0.08);
    }
    enemy.shootCooldown = isPhase2 ? 60 : 120;
  }

  // Phase 2: occasional minion spawn
  if (isPhase2 && Math.random() < 0.002) {
    const ox = (Math.random() - 0.5) * 6;
    const oz = (Math.random() - 0.5) * 6;
    world.add({
      type: 'goat',
      position: new Vector3(
        entity.position!.x + ox,
        entity.position!.y,
        entity.position!.z + oz,
      ),
      enemy: {
        hp: 20,
        maxHp: 20,
        damage: 5,
        speed: 0.04,
        attackRange: 1.8,
        alert: true,
        attackCooldown: 0,
        scoreValue: 50,
      },
    });
  }
}

// ---------------------------------------------------------------------------
// Main system entry point
// ---------------------------------------------------------------------------

export function aiSystemUpdate(deltaTime: number): void {
  const player = world.entities.find(e => e.type === 'player');
  if (!player || !player.position || !player.player) return;

  const playerPos = player.position;
  const dtScale = deltaTime / 16;

  // Update the shared target for all YUKA steering behaviors
  playerTarget.set(playerPos.x, 0, playerPos.z);

  // Collect live enemy IDs to prune stale vehicles
  const liveEnemyIds = new Set<string>();

  for (const entity of world.entities) {
    if (!entity.enemy || !entity.position) continue;

    const enemy = entity.enemy;
    const id = entity.id ?? '';
    const dist = Vector3.Distance(entity.position, playerPos);

    // Alert check
    if (!enemy.alert && dist < ALERT_RADIUS) {
      enemy.alert = true;
      playSound('goat_alert');
    }

    if (!enemy.alert) continue;

    liveEnemyIds.add(id);

    // Decrement attack cooldown
    if (enemy.attackCooldown > 0) {
      enemy.attackCooldown -= dtScale;
    }

    // Lazily create YUKA Vehicle on first alert
    let vehicle = vehicleMap.get(id);
    if (!vehicle) {
      vehicle = createVehicleForEnemy(entity);
      vehicleMap.set(id, vehicle);
    }

    // Sync ECS position → YUKA vehicle (in case combat knocked them around)
    vehicle.position.set(entity.position.x, 0, entity.position.z);
  }

  // Tick YUKA steering (seconds)
  const dtSec = deltaTime / 1000;
  entityManager.update(dtSec);

  // Write YUKA vehicle positions back to ECS entities + run post-steering logic
  for (const entity of world.entities) {
    if (!entity.enemy || !entity.position || !entity.enemy.alert) continue;

    const id = entity.id ?? '';
    const vehicle = vehicleMap.get(id);
    if (!vehicle) continue;

    // Apply YUKA steering result to ECS position
    entity.position.x = vehicle.position.x;
    entity.position.z = vehicle.position.z;

    const dist = Vector3.Distance(entity.position, playerPos);

    // Type-specific post-steering (attacks, projectiles, abilities)
    switch (entity.type) {
      case 'goat':
      case 'hellgoat':
        postSteeringBasicGoat(entity, player, dist);
        break;
      case 'fireGoat':
        postSteeringFireGoat(entity, player, dist, dtScale);
        break;
      case 'shadowGoat':
        postSteeringShadowGoat(entity, player, dist);
        break;
      case 'goatKnight':
        postSteeringGoatKnight(entity, player, dist);
        break;
      case 'archGoat':
        postSteeringArchGoat(entity, player, dist, dtScale, vehicle);
        break;
    }
  }

  // Prune vehicles for dead enemies
  for (const [id, vehicle] of vehicleMap) {
    if (!liveEnemyIds.has(id)) {
      entityManager.remove(vehicle);
      vehicleMap.delete(id);
    }
  }
}

/** Call when starting a new floor to clear stale YUKA state. */
export function aiSystemReset(): void {
  for (const [, vehicle] of vehicleMap) {
    entityManager.remove(vehicle);
  }
  vehicleMap.clear();
}
