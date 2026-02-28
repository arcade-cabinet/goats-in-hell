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
import {useGameStore} from '../../state/GameStore';
import {playSound} from './AudioSystem';
import {getGameTime} from './GameClock';
import {registerDamageDirection} from '../ui/BabylonHUD';

/** Shorthand for the store's seeded PRNG. */
function rng(): number {
  return useGameStore.getState().rng();
}

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
    case 'archGoat':
    case 'infernoGoat':
    case 'ironGoat': {
      // Boss types — seek player directly. Phase transitions handled in post-steering.
      const seek = new SeekBehavior(playerTarget);
      seek.active = true;
      v.steering.add(seek);
      break;
    }
    case 'voidGoat': {
      // Void boss — fast seek with teleporting handled in post-steering.
      v.maxSpeed = enemy.speed * 1.3;
      v.maxForce = enemy.speed * 3;
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

function meleeHitPlayer(player: Entity, damage: number, sourcePos?: Vector3): void {
  player.player!.hp -= damage;
  GameState.set({damageFlash: 1.0, screenShake: 10});
  playSound('hurt');
  if (sourcePos) registerDamageDirection(sourcePos);
}

function spawnProjectile(
  origin: Vector3,
  direction: Vector3,
  damage: number,
  speed: number,
): void {
  const vel = direction.scale(speed);
  world.add({
    id: `eproj-${getGameTime().toFixed(0)}-${rng().toString(36).slice(2, 6)}`,
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
    meleeHitPlayer(player, enemy.damage, entity.position);
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
    meleeHitPlayer(player, enemy.damage, entity.position);
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
    meleeHitPlayer(player, enemy.damage, entity.position);
    enemy.attackCooldown = Math.floor(ATTACK_COOLDOWN_FRAMES * 1.5);
  }
}

function postSteeringInfernoGoat(
  entity: Entity,
  player: Entity,
  dist: number,
  dtScale: number,
): void {
  const enemy = entity.enemy!;
  const hpPercent = enemy.hp / enemy.maxHp;
  const isEnraged = hpPercent <= 0.3;

  // Melee
  if (dist <= enemy.attackRange && enemy.attackCooldown <= 0) {
    meleeHitPlayer(player, enemy.damage, entity.position);
    enemy.attackCooldown = ATTACK_COOLDOWN_FRAMES;
  }

  // Rapid fire projectiles (faster when enraged)
  if (enemy.shootCooldown === undefined) enemy.shootCooldown = 60;
  enemy.shootCooldown -= dtScale;

  if (enemy.shootCooldown <= 0 && dist < ALERT_RADIUS) {
    const dir = directionTo(entity.position!, player.position!);
    const count = isEnraged ? 5 : 3;
    const spreadAngle = isEnraged ? 0.3 : 0.15;
    for (let i = 0; i < count; i++) {
      const angle = (i - (count - 1) / 2) * spreadAngle;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const rotated = new Vector3(
        dir.x * cos - dir.z * sin,
        0,
        dir.x * sin + dir.z * cos,
      );
      spawnProjectile(entity.position!, rotated, enemy.damage, 0.1);
    }
    enemy.shootCooldown = isEnraged ? 40 : 60;
  }

  // Fire ring attack: spawn projectiles in 360° burst (enraged only, ~every 6 sec)
  if (isEnraged) {
    if (enemy._fireRingCd === undefined) enemy._fireRingCd = 360;
    enemy._fireRingCd -= dtScale;
    if (enemy._fireRingCd <= 0) {
      const ringCount = 12;
      for (let i = 0; i < ringCount; i++) {
        const a = (i / ringCount) * Math.PI * 2;
        const ringDir = new Vector3(Math.cos(a), 0, Math.sin(a));
        spawnProjectile(entity.position!, ringDir, Math.ceil(enemy.damage * 0.6), 0.07);
      }
      enemy._fireRingCd = 360;
      playSound('explosion');
    }
  }
}

function postSteeringVoidGoat(
  entity: Entity,
  player: Entity,
  dist: number,
  dtScale: number,
  vehicle: Vehicle,
): void {
  const enemy = entity.enemy!;
  const hpPercent = enemy.hp / enemy.maxHp;
  const isPhase2 = hpPercent <= 0.4;

  // Visibility: flicker faster in phase 2
  const flickerSpeed = isPhase2 ? 0.012 : 0.005;
  const flickerPhase = Math.sin(getGameTime() * flickerSpeed);
  enemy.visibilityAlpha = isPhase2
    ? 0.1 + Math.abs(flickerPhase) * 0.5
    : 0.3 + Math.abs(flickerPhase) * 0.7;

  // Teleport: randomly jump near player (faster in phase 2)
  const teleportCd = isPhase2 ? 120 : 240;
  if (enemy.shootCooldown === undefined) enemy.shootCooldown = teleportCd;
  enemy.shootCooldown -= dtScale;
  if (enemy.shootCooldown <= 0 && dist > 3) {
    const angle = rng() * Math.PI * 2;
    const teleportDist = 3 + rng() * 3;
    const nx = player.position!.x + Math.cos(angle) * teleportDist;
    const nz = player.position!.z + Math.sin(angle) * teleportDist;
    entity.position!.x = nx;
    entity.position!.z = nz;
    vehicle.position.set(nx, 0, nz);
    enemy.shootCooldown = teleportCd;
    playSound('door'); // whoosh
  }

  // Melee
  if (dist <= enemy.attackRange && enemy.attackCooldown <= 0) {
    meleeHitPlayer(player, enemy.damage, entity.position);
    enemy.attackCooldown = ATTACK_COOLDOWN_FRAMES;
  }

  // Phase 2: spawn shadow clones (weak shadowGoats) occasionally — capped at 6
  const voidCloneCount = world.entities.filter(e => e.id?.startsWith('voidClone')).length;
  if (isPhase2 && voidCloneCount < 6 && rng() < 0.003) {
    const ox = (rng() - 0.5) * 5;
    const oz = (rng() - 0.5) * 5;
    world.add({
      id: `voidClone-${getGameTime().toFixed(0)}-${rng().toString(36).slice(2, 6)}`,
      type: 'shadowGoat',
      position: new Vector3(
        entity.position!.x + ox,
        entity.position!.y,
        entity.position!.z + oz,
      ),
      enemy: {
        hp: 8,
        maxHp: 8,
        damage: 3,
        speed: 0.06,
        attackRange: 1.8,
        alert: true,
        attackCooldown: 0,
        scoreValue: 25,
        visibilityAlpha: 0.4,
      },
    });
  }
}

function postSteeringIronGoat(
  entity: Entity,
  player: Entity,
  dist: number,
  dtScale: number,
): void {
  const enemy = entity.enemy!;
  const hpPercent = enemy.hp / enemy.maxHp;

  // Slow but devastating melee with longer cooldown
  if (dist <= enemy.attackRange && enemy.attackCooldown <= 0) {
    meleeHitPlayer(player, enemy.damage, entity.position);
    enemy.attackCooldown = Math.floor(ATTACK_COOLDOWN_FRAMES * 2);
    GameState.set({screenShake: 15});
  }

  // Armor regeneration: slowly regain armor over time
  if (enemy.isArmored && enemy.armorHp !== undefined && enemy.armorMaxHp !== undefined) {
    if (enemy.armorHp < enemy.armorMaxHp) {
      // Regen 0.5 armor per second
      enemy.armorHp = Math.min(enemy.armorMaxHp, enemy.armorHp + 0.5 * dtScale / 60);
    }
  }

  // Ground slam AoE at < 50% HP: every ~5 seconds, damages player if within range
  if (hpPercent <= 0.5) {
    if (enemy._slamCd === undefined) enemy._slamCd = 300;
    enemy._slamCd -= dtScale;
    if (enemy._slamCd <= 0 && dist < 5) {
      // Ground slam: heavy damage + big screen shake
      meleeHitPlayer(player, Math.ceil(enemy.damage * 1.5), entity.position);
      GameState.set({screenShake: 25, damageFlash: 0.5});
      enemy._slamCd = 300;
      playSound('explosion');
    }
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
  const isPhase3 = hpPercent <= 0.25;

  // Phase transitions: boost speed
  vehicle.maxSpeed = isPhase3
    ? enemy.speed * 2
    : isPhase2
      ? enemy.speed * 1.5
      : enemy.speed;

  // Melee
  if (dist <= enemy.attackRange && enemy.attackCooldown <= 0) {
    const dmg = isPhase3 ? Math.ceil(enemy.damage * 1.5) : enemy.damage;
    meleeHitPlayer(player, dmg, entity.position);
    enemy.attackCooldown = isPhase3
      ? Math.floor(ATTACK_COOLDOWN_FRAMES * 0.7)
      : ATTACK_COOLDOWN_FRAMES;
  }

  // Ranged: spread projectiles (more in later phases)
  if (enemy.shootCooldown === undefined) {
    enemy.shootCooldown = isPhase3 ? 40 : isPhase2 ? 60 : 120;
  }
  enemy.shootCooldown -= dtScale;

  if (enemy.shootCooldown <= 0 && dist < ALERT_RADIUS) {
    const baseDir = directionTo(entity.position!, player.position!);
    const angles = isPhase3
      ? [-0.4, -0.2, 0, 0.2, 0.4]
      : [-0.2, 0, 0.2];
    for (const angle of angles) {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const rotated = new Vector3(
        baseDir.x * cos - baseDir.z * sin,
        0,
        baseDir.x * sin + baseDir.z * cos,
      );
      spawnProjectile(entity.position!, rotated, enemy.damage, isPhase3 ? 0.1 : 0.08);
    }
    enemy.shootCooldown = isPhase3 ? 40 : isPhase2 ? 60 : 120;
  }

  // Minion spawn: more frequent in phase 3 — capped at 8
  const archMinionCount = world.entities.filter(e => e.id?.startsWith('archMinion')).length;
  const spawnChance = isPhase3 ? 0.005 : isPhase2 ? 0.002 : 0;
  if (spawnChance > 0 && archMinionCount < 8 && rng() < spawnChance) {
    const ox = (rng() - 0.5) * 6;
    const oz = (rng() - 0.5) * 6;
    const minionType = isPhase3 && rng() < 0.3 ? 'hellgoat' : 'goat';
    const minionHp = minionType === 'hellgoat' ? 30 : 20;
    world.add({
      id: `archMinion-${getGameTime().toFixed(0)}-${rng().toString(36).slice(2, 6)}`,
      type: minionType,
      position: new Vector3(
        entity.position!.x + ox,
        entity.position!.y,
        entity.position!.z + oz,
      ),
      enemy: {
        hp: minionHp,
        maxHp: minionHp,
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
      case 'infernoGoat':
        postSteeringInfernoGoat(entity, player, dist, dtScale);
        break;
      case 'voidGoat':
        postSteeringVoidGoat(entity, player, dist, dtScale, vehicle);
        break;
      case 'ironGoat':
        postSteeringIronGoat(entity, player, dist, dtScale);
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
