/**
 * Yuka-based AI Governor for automated e2e playtesting.
 *
 * Uses a YUKA Vehicle with steering behaviors to control the player camera,
 * and a simple state machine to choose between hunting enemies, healing,
 * fleeing, and exploring. Bridges YUKA's coordinate system to Babylon.js
 * and handles grid-based wall avoidance.
 *
 * Activate with ?autoplay URL param (optionally ?autoplay=easy|hard).
 */
import {
  Vehicle,
  EntityManager,
  ArriveBehavior,
  WanderBehavior,
  Vector3 as YV3,
} from 'yuka';
import {Vector3} from '@babylonjs/core';
import type {UniversalCamera, Scene} from '@babylonjs/core';
import type {Entity, WeaponId} from '../entities/components';
import {world} from '../entities/world';
import {tryShoot, tryReload, switchWeapon} from '../weapons/WeaponSystem';
import {weapons} from '../weapons/weapons';
import {LevelGenerator, MapCell} from '../levels/LevelGenerator';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AIState = 'hunt' | 'heal' | 'explore' | 'flee';

export interface AIDebugInfo {
  state: AIState;
  targetType: string;
  targetDist: number;
  weapon: string;
  steering: string;
}

// ---------------------------------------------------------------------------
// Tuning constants
// ---------------------------------------------------------------------------

const HEAL_THRESHOLD = 0.35;
const FLEE_THRESHOLD = 0.15;
const FLEE_DISTANCE = 8;
const MOVE_SPEED = 0.10;
const SPRINT_SPEED = 0.15;
const SHOOT_RANGE_FACTOR = 0.8; // Fire within 80% of weapon's max range
const AIM_LERP = 0.12; // Camera aim smoothing (0–1 per frame)
const DECISION_INTERVAL = 200; // ms between state re-evaluations
const WANDER_RADIUS = 6;
const WANDER_JITTER = 0.8;

// ---------------------------------------------------------------------------
// AIGovernor
// ---------------------------------------------------------------------------

export class AIGovernor {
  private entityManager: EntityManager;
  private vehicle: Vehicle;
  private arriveBehavior: ArriveBehavior;
  private wanderBehavior: WanderBehavior;

  private camera: UniversalCamera;
  private scene: Scene;
  private player: Entity;
  private grid: number[][];
  private gridW: number;
  private gridH: number;
  private cellSize: number;

  private _state: AIState = 'explore';
  private targetEntity: Entity | null = null;
  private lastDecisionTime = 0;
  private wanderYaw = 0;
  private frameCount = 0;

  constructor(
    camera: UniversalCamera,
    scene: Scene,
    player: Entity,
    grid: MapCell[][],
    cellSize: number,
  ) {
    this.camera = camera;
    this.scene = scene;
    this.player = player;
    this.grid = grid.map(row => row.map(c => c as number));
    this.gridH = this.grid.length;
    this.gridW = this.grid[0]?.length ?? 0;
    this.cellSize = cellSize;

    // --- YUKA setup ---
    this.entityManager = new EntityManager();

    this.vehicle = new Vehicle();
    this.vehicle.maxSpeed = MOVE_SPEED;
    this.vehicle.mass = 1;
    this.vehicle.maxForce = 0.15;

    // Arrive: smooth approach to targets
    this.arriveBehavior = new ArriveBehavior();
    this.arriveBehavior.deceleration = 1.5;
    this.arriveBehavior.active = false;
    this.vehicle.steering.add(this.arriveBehavior);

    // Wander: random exploration
    this.wanderBehavior = new WanderBehavior();
    this.wanderBehavior.radius = WANDER_RADIUS;
    this.wanderBehavior.jitter = WANDER_JITTER;
    this.wanderBehavior.active = false;
    this.vehicle.steering.add(this.wanderBehavior);

    // Seed vehicle position from camera
    const p = camera.position;
    this.vehicle.position.set(p.x, 0, p.z);

    this.entityManager.add(this.vehicle);
  }

  // -----------------------------------------------------------------------
  // Public
  // -----------------------------------------------------------------------

  get state(): AIState {
    return this._state;
  }

  getDebugInfo(): AIDebugInfo {
    const dist = this.targetEntity ? this.distToEntity(this.targetEntity) : -1;
    return {
      state: this._state,
      targetType: this.targetEntity?.type ?? 'none',
      targetDist: Math.round(dist),
      weapon: this.player.player?.currentWeapon ?? '?',
      steering: this.arriveBehavior.active
        ? 'arrive'
        : this.wanderBehavior.active
          ? 'wander'
          : 'idle',
    };
  }

  /** Call once per render frame. */
  update(dt: number): void {
    if (!this.player.player || !this.player.position) return;
    this.frameCount++;

    const now = performance.now();

    // Re-evaluate state periodically
    if (now - this.lastDecisionTime > DECISION_INTERVAL) {
      this.decide();
      this.lastDecisionTime = now;
    }

    // --- Execute behaviour ---
    switch (this._state) {
      case 'hunt':
        this.execHunt(dt);
        break;
      case 'heal':
        this.execHeal(dt);
        break;
      case 'flee':
        this.execFlee(dt);
        break;
      case 'explore':
        this.execExplore(dt);
        break;
    }

    // Weapon management every 10 frames
    if (this.frameCount % 10 === 0) {
      this.manageWeapons();
    }

    // Auto-reload
    this.handleReload();
  }

  dispose(): void {
    this.entityManager.clear();
  }

  // -----------------------------------------------------------------------
  // State decision
  // -----------------------------------------------------------------------

  private decide(): void {
    const hp = this.player.player!.hp;
    const maxHp = this.player.player!.maxHp;
    const hpRatio = hp / maxHp;

    const enemies = this.getEnemies();
    const nearestEnemy = this.nearest(enemies);
    const nearestHealth = this.nearestPickup('health');

    // Flee: critically low HP and threat nearby
    if (
      hpRatio < FLEE_THRESHOLD &&
      nearestEnemy &&
      this.distToEntity(nearestEnemy) < FLEE_DISTANCE
    ) {
      this.setState('flee', nearestEnemy);
      return;
    }

    // Heal: seek health when hurting
    if (hpRatio < HEAL_THRESHOLD && nearestHealth) {
      this.setState('heal', nearestHealth);
      return;
    }

    // Hunt: engage enemies
    if (nearestEnemy) {
      this.setState('hunt', nearestEnemy);
      return;
    }

    // Explore
    this.setState('explore', null);
  }

  private setState(state: AIState, target: Entity | null): void {
    this._state = state;
    this.targetEntity = target;

    // Configure YUKA behaviors
    this.arriveBehavior.active = false;
    this.wanderBehavior.active = false;

    if (target?.position) {
      this.arriveBehavior.target = new YV3(
        target.position.x,
        0,
        target.position.z,
      );
      this.arriveBehavior.active = state !== 'flee' && state !== 'explore';
    }

    this.wanderBehavior.active = state === 'explore';
  }

  // -----------------------------------------------------------------------
  // State executors
  // -----------------------------------------------------------------------

  private execHunt(dt: number): void {
    const target = this.targetEntity;
    if (!target?.position || !target.enemy) {
      this.decide();
      return;
    }

    // Check target still alive
    if (!world.entities.includes(target)) {
      this.decide();
      return;
    }

    const dist = this.distToEntity(target);
    const wpn = weapons[this.player.player!.currentWeapon];
    const engageRange = wpn.range * SHOOT_RANGE_FACTOR;

    // Keep target synced for YUKA steering
    this.arriveBehavior.target.set(target.position.x, 0, target.position.z);

    if (dist > engageRange) {
      // Approach
      this.applySteeringMovement(dt, MOVE_SPEED);
    } else if (dist < 3) {
      // Too close — backpedal
      this.moveAwayFrom(target.position, MOVE_SPEED * 0.6, dt);
    } else {
      // In range — strafe slightly for dodging
      this.strafeAround(target.position, MOVE_SPEED * 0.4, dt);
    }

    // Aim and fire
    this.aimAt(target.position);
    if (dist < engageRange) {
      this.tryFire();
    }
  }

  private execHeal(dt: number): void {
    const target = this.targetEntity;
    if (!target?.position || !target.pickup?.active) {
      this.decide();
      return;
    }

    if (!world.entities.includes(target)) {
      this.decide();
      return;
    }

    this.arriveBehavior.target.set(target.position.x, 0, target.position.z);
    this.applySteeringMovement(dt, SPRINT_SPEED);
    this.aimAt(target.position);

    // Still shoot at enemies while healing
    const enemies = this.getEnemies();
    const closest = this.nearest(enemies);
    if (closest?.position) {
      const d = this.distToEntity(closest);
      if (d < weapons[this.player.player!.currentWeapon].range * 0.5) {
        this.aimAt(closest.position);
        this.tryFire();
      }
    }
  }

  private execFlee(dt: number): void {
    const threat = this.targetEntity;
    if (!threat?.position) {
      this.decide();
      return;
    }

    this.moveAwayFrom(threat.position, SPRINT_SPEED, dt);

    // Shoot while retreating
    const enemies = this.getEnemies();
    const closest = this.nearest(enemies);
    if (closest?.position) {
      this.aimAt(closest.position);
      const d = this.distToEntity(closest);
      if (d < weapons[this.player.player!.currentWeapon].range * 0.6) {
        this.tryFire();
      }
    }

    // If we're far enough, stop fleeing
    if (this.distToEntity(threat) > FLEE_DISTANCE * 2) {
      this.decide();
    }
  }

  private execExplore(dt: number): void {
    // YUKA wander computes a velocity; apply it
    this.applySteeringMovement(dt, MOVE_SPEED);

    // Point camera in movement direction
    const vel = this.vehicle.velocity;
    if (vel.squaredLength() > 0.0001) {
      const lookTarget = this.camera.position.add(
        new Vector3(vel.x, 0, vel.z).scale(5),
      );
      this.aimAt(lookTarget);
    }

    // Opportunistic: grab weapon pickups
    const wpnPickup = this.nearestPickup('weapon');
    if (wpnPickup?.position && this.distToEntity(wpnPickup) < 10) {
      this.arriveBehavior.target.set(
        wpnPickup.position.x,
        0,
        wpnPickup.position.z,
      );
      this.arriveBehavior.active = true;
      this.wanderBehavior.active = false;
    }
  }

  // -----------------------------------------------------------------------
  // Movement helpers
  // -----------------------------------------------------------------------

  /**
   * Run YUKA's EntityManager to compute steering velocity, then apply it
   * to the Babylon camera with grid-based wall avoidance.
   */
  private applySteeringMovement(dt: number, speed: number): void {
    // Sync camera position → YUKA vehicle
    const p = this.camera.position;
    this.vehicle.position.set(p.x, 0, p.z);
    this.vehicle.maxSpeed = speed;

    // Tick YUKA (expects seconds)
    const dtSec = dt / 1000;
    this.entityManager.update(dtSec);

    // Read YUKA's computed velocity
    const vel = this.vehicle.velocity;
    const dtScale = dt / 16; // frame-rate normalize
    const displacement = new Vector3(
      vel.x * dtScale * 0.5,
      0,
      vel.z * dtScale * 0.5,
    );

    this.applyMovement(displacement);
  }

  /** Move directly toward a target with manual steering (no YUKA). */
  private moveToward(target: Vector3, speed: number, dt: number): void {
    const pos = this.camera.position;
    const dir = target.subtract(pos);
    dir.y = 0;
    const len = dir.length();
    if (len < 0.2) return;
    dir.scaleInPlace(1 / len);

    const dtScale = dt / 16;
    const displacement = dir.scale(speed * dtScale);
    this.applyMovement(displacement);
  }

  /** Move directly away from a position. */
  private moveAwayFrom(target: Vector3, speed: number, dt: number): void {
    const pos = this.camera.position;
    const dir = pos.subtract(target);
    dir.y = 0;
    const len = dir.length();
    if (len < 0.1) return;
    dir.scaleInPlace(1 / len);

    const dtScale = dt / 16;
    const displacement = dir.scale(speed * dtScale);
    this.applyMovement(displacement);
  }

  /** Circle-strafe around a target position. */
  private strafeAround(target: Vector3, speed: number, dt: number): void {
    const pos = this.camera.position;
    const toTarget = target.subtract(pos);
    toTarget.y = 0;
    // Perpendicular (rotate 90 degrees)
    const perp = new Vector3(-toTarget.z, 0, toTarget.x);
    const len = perp.length();
    if (len < 0.1) return;
    perp.scaleInPlace(1 / len);

    // Alternate strafe direction every ~3 seconds
    const strafeDir = Math.sin(performance.now() * 0.001) > 0 ? 1 : -1;

    const dtScale = dt / 16;
    const displacement = perp.scale(speed * dtScale * strafeDir);
    this.applyMovement(displacement);
  }

  /**
   * Apply a displacement to the camera, checking the grid for wall collisions.
   * Falls back to axis-aligned sliding if the diagonal move is blocked.
   */
  private applyMovement(displacement: Vector3): void {
    const pos = this.camera.position;
    const full = pos.add(displacement);

    if (this.isWalkable(full)) {
      this.camera.position.addInPlace(displacement);
      return;
    }

    // Slide along X
    const slideX = new Vector3(displacement.x, 0, 0);
    if (this.isWalkable(pos.add(slideX))) {
      this.camera.position.addInPlace(slideX);
      return;
    }

    // Slide along Z
    const slideZ = new Vector3(0, 0, displacement.z);
    if (this.isWalkable(pos.add(slideZ))) {
      this.camera.position.addInPlace(slideZ);
      return;
    }

    // Fully blocked — nudge the wander angle so we try a new direction
    this.wanderYaw += Math.PI * 0.4;
  }

  /** Check if a world-space position is on a walkable (empty) grid cell. */
  private isWalkable(pos: Vector3): boolean {
    const gx = Math.floor(pos.x / this.cellSize);
    const gz = Math.floor(pos.z / this.cellSize);

    if (gz < 0 || gz >= this.gridH || gx < 0 || gx >= this.gridW) return false;
    return LevelGenerator.isWalkable(this.grid[gz][gx]);
  }

  // -----------------------------------------------------------------------
  // Aiming
  // -----------------------------------------------------------------------

  /** Smoothly rotate camera to face a world-space target. */
  private aimAt(target: Vector3): void {
    const pos = this.camera.position;
    const dx = target.x - pos.x;
    const dz = target.z - pos.z;
    const dy = (target.y ?? 1) - pos.y;

    // Yaw (left/right)
    const yaw = Math.atan2(dx, dz);
    // Pitch (up/down) — targets are at roughly y=1, camera at y=2
    const horizDist = Math.sqrt(dx * dx + dz * dz);
    const pitch = -Math.atan2(dy, horizDist);

    this.camera.rotation.y = lerpAngle(this.camera.rotation.y, yaw, AIM_LERP);
    this.camera.rotation.x = lerpAngle(
      this.camera.rotation.x,
      pitch,
      AIM_LERP,
    );
  }

  // -----------------------------------------------------------------------
  // Combat
  // -----------------------------------------------------------------------

  private tryFire(): void {
    if (!this.player.player || !this.player.ammo) return;

    const wpnId = this.player.player.currentWeapon;
    const ammo = this.player.ammo[wpnId];

    if (ammo.current <= 0) {
      tryReload(this.player);
      return;
    }

    tryShoot(this.scene, this.player);
  }

  private manageWeapons(): void {
    if (!this.player.player || !this.player.ammo) return;
    if (this.player.player.isReloading) return;

    const owned = this.player.player.weapons;
    const enemies = this.getEnemies();
    const closest = this.nearest(enemies);
    const dist = closest ? this.distToEntity(closest) : Infinity;

    let ideal: WeaponId = 'hellPistol';

    if (dist < 6 && owned.includes('brimShotgun') && this.hasAmmo('brimShotgun')) {
      ideal = 'brimShotgun';
    } else if (
      dist < 20 &&
      owned.includes('hellfireCannon') &&
      this.hasAmmo('hellfireCannon')
    ) {
      ideal = 'hellfireCannon';
    } else if (
      dist > 15 &&
      owned.includes('goatsBane') &&
      this.hasAmmo('goatsBane')
    ) {
      ideal = 'goatsBane';
    } else if (this.hasAmmo('hellPistol')) {
      ideal = 'hellPistol';
    }

    if (ideal !== this.player.player.currentWeapon) {
      switchWeapon(this.player, ideal);
    }
  }

  private handleReload(): void {
    if (!this.player.player || !this.player.ammo) return;
    if (this.player.player.isReloading) return;

    const wpnId = this.player.player.currentWeapon;
    const ammo = this.player.ammo[wpnId];

    // Auto-reload when empty
    if (ammo.current <= 0 && ammo.reserve > 0) {
      tryReload(this.player);
      return;
    }

    // Tactical reload when safe and magazine < 25%
    const enemies = this.getEnemies();
    const closest = this.nearest(enemies);
    const dist = closest ? this.distToEntity(closest) : Infinity;

    if (dist > 15 && ammo.current < ammo.magSize * 0.25 && ammo.reserve > 0) {
      tryReload(this.player);
    }
  }

  private hasAmmo(weaponId: WeaponId): boolean {
    const ammo = this.player.ammo?.[weaponId];
    return !!ammo && (ammo.current > 0 || ammo.reserve > 0);
  }

  // -----------------------------------------------------------------------
  // Entity queries
  // -----------------------------------------------------------------------

  private getEnemies(): Entity[] {
    return world.entities.filter(
      (e: Entity) => !!e.enemy && !!e.position,
    );
  }

  private nearest(entities: Entity[]): Entity | null {
    let best: Entity | null = null;
    let bestDist = Infinity;
    for (const e of entities) {
      const d = this.distToEntity(e);
      if (d < bestDist) {
        bestDist = d;
        best = e;
      }
    }
    return best;
  }

  private nearestPickup(
    type: 'health' | 'ammo' | 'weapon',
  ): Entity | null {
    const pickups = world.entities.filter(
      (e: Entity) =>
        e.pickup?.active && e.pickup.pickupType === type && !!e.position,
    );
    return this.nearest(pickups);
  }

  private distToEntity(entity: Entity): number {
    if (!entity.position) return Infinity;
    return Vector3.Distance(this.camera.position, entity.position);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function lerpAngle(from: number, to: number, t: number): number {
  let diff = to - from;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return from + diff * t;
}
