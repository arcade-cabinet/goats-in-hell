/**
 * Yuka-based AI Governor for automated e2e playtesting.
 *
 * Uses a YUKA Vehicle with steering behaviors to control the player camera,
 * and a simple state machine to choose between hunting enemies, healing,
 * fleeing, and exploring. Bridges YUKA's coordinate system to Babylon.js
 * and handles grid-based wall avoidance.
 *
 * Supports two modes:
 *   1. Direct camera mode (legacy Babylon.js) — manipulates camera directly
 *   2. Output callback mode (R3F) — emits AIOutputFrame each tick; the
 *      AIProvider converts it to an InputFrame for the InputManager.
 *
 * NOTE: All coordinates in this file are Babylon.js left-handed (Z+ = forward).
 * When converting to Three.js right-handed coordinates, negate Z values.
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
import type {Entity, Vec3, WeaponId} from '../entities/components';
import {vec3, vec3Subtract, vec3Scale, vec3Distance, vec3Length} from '../entities/vec3';
import {world} from '../entities/world';
import {weapons} from '../weapons/weapons';
import {LevelGenerator, MapCell} from '../levels/LevelGenerator';

/**
 * Generic camera interface — abstracts away Babylon/Three camera specifics.
 * The governor reads position + rotation but only writes in legacy mode.
 */
export interface AICamera {
  position: Vec3;
  rotation: {x: number; y: number};
}

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

/**
 * Abstract output frame emitted by the AIGovernor when an output callback
 * is registered. Contains movement, look, and action intents that the
 * AIProvider translates into an InputFrame.
 *
 * Coordinate system: Babylon.js left-handed (Z+ forward, X+ right).
 * The AIProvider must negate Z values when converting to Three.js.
 */
export interface AIOutputFrame {
  moveX: number;      // -1..1 strafe (positive = right)
  moveZ: number;      // -1..1 forward/back (positive = forward, Babylon.js Z+)
  lookYaw: number;    // target yaw angle (radians, Babylon.js convention)
  lookPitch: number;  // target pitch angle (radians, Babylon.js convention)
  fire: boolean;
  reload: boolean;
  weaponSlot: number; // 0 = no change, 1-4 = slot
  sprint: boolean;
}

/** Weapon ID to slot number mapping (1-indexed). */
const WEAPON_SLOT_MAP: Record<WeaponId, number> = {
  hellPistol: 1,
  brimShotgun: 2,
  hellfireCannon: 3,
  goatsBane: 4,
};

/** Return a zeroed AIOutputFrame. */
function emptyAIOutputFrame(): AIOutputFrame {
  return {
    moveX: 0,
    moveZ: 0,
    lookYaw: 0,
    lookPitch: 0,
    fire: false,
    reload: false,
    weaponSlot: 0,
    sprint: false,
  };
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
const AIM_LERP = 0.12; // Camera aim smoothing (0-1 per frame)
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

  private camera: AICamera;
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

  // --- Output callback mode ---
  private outputCallback: ((frame: AIOutputFrame) => void) | null = null;
  private outputFrame: AIOutputFrame = emptyAIOutputFrame();
  /** Whether a sprint was requested this frame (used in output mode). */
  private sprintRequested = false;

  constructor(
    camera: AICamera,
    player: Entity,
    grid: MapCell[][],
    cellSize: number,
  ) {
    this.camera = camera;
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

  /**
   * Register a callback to receive an AIOutputFrame each tick instead of
   * the governor directly manipulating the Babylon camera. When set, the
   * governor still READS camera position for distance calculations but does
   * NOT write to it.
   */
  setOutputCallback(cb: (frame: AIOutputFrame) => void): void {
    this.outputCallback = cb;
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

    // Reset per-frame output state
    if (this.outputCallback) {
      this.outputFrame = emptyAIOutputFrame();
      this.sprintRequested = false;
    }

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

    // --- Emit output frame if in callback mode ---
    if (this.outputCallback) {
      this.outputFrame.sprint = this.sprintRequested;
      this.outputCallback(this.outputFrame);
    }
  }

  dispose(): void {
    this.entityManager.clear();
    this.outputCallback = null;
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
      // Too close - backpedal
      this.moveAwayFrom(target.position, MOVE_SPEED * 0.6, dt);
    } else {
      // In range - strafe slightly for dodging
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
    this.sprintRequested = true;
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
    this.sprintRequested = true;

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
      const p = this.camera.position;
      const lookTarget = vec3(p.x + vel.x * 5, p.y, p.z + vel.z * 5);
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
   * Convert a world-space displacement vector into local-space moveX/moveZ
   * relative to the current camera yaw, and write to the output frame.
   *
   * In Babylon.js: yaw = rotation.y, forward is +Z when yaw=0.
   * moveX: right (+) / left (-)
   * moveZ: forward (+) / backward (-)
   */
  private displacementToMoveXZ(displacement: Vec3): void {
    const yaw = this.camera.rotation.y;
    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);

    const localX = cosY * displacement.x - sinY * displacement.z;
    const localZ = sinY * displacement.x + cosY * displacement.z;

    const len = Math.sqrt(localX * localX + localZ * localZ);
    if (len > 0.001) {
      const s = Math.min(1, 1 / len);
      this.outputFrame.moveX = localX * s;
      this.outputFrame.moveZ = localZ * s;
    }
  }

  /**
   * Run YUKA's EntityManager to compute steering velocity, then emit
   * to the output frame for the AIProvider to consume.
   */
  private applySteeringMovement(dt: number, speed: number): void {
    const p = this.camera.position;
    this.vehicle.position.set(p.x, 0, p.z);
    this.vehicle.maxSpeed = speed;

    const dtSec = dt / 1000;
    this.entityManager.update(dtSec);

    const vel = this.vehicle.velocity;
    const dtScale = dt / 16;
    const displacement = vec3(
      vel.x * dtScale * 0.5,
      0,
      vel.z * dtScale * 0.5,
    );

    this.displacementToMoveXZ(displacement);
  }

  /** Move directly toward a target with manual steering (no YUKA). */
  private moveToward(target: Vec3, speed: number, dt: number): void {
    const pos = this.camera.position;
    const dir = vec3Subtract(target, pos);
    dir.y = 0;
    const len = vec3Length(dir);
    if (len < 0.2) return;
    const norm = vec3Scale(dir, 1 / len);

    const dtScale = dt / 16;
    const displacement = vec3Scale(norm, speed * dtScale);
    this.displacementToMoveXZ(displacement);
  }

  /** Move directly away from a position. */
  private moveAwayFrom(target: Vec3, speed: number, dt: number): void {
    const pos = this.camera.position;
    const dir = vec3Subtract(pos, target);
    dir.y = 0;
    const len = vec3Length(dir);
    if (len < 0.1) return;
    const norm = vec3Scale(dir, 1 / len);

    const dtScale = dt / 16;
    const displacement = vec3Scale(norm, speed * dtScale);
    this.displacementToMoveXZ(displacement);
  }

  /** Circle-strafe around a target position. */
  private strafeAround(target: Vec3, speed: number, dt: number): void {
    const pos = this.camera.position;
    const toTarget = vec3Subtract(target, pos);
    toTarget.y = 0;
    const perp = vec3(-toTarget.z, 0, toTarget.x);
    const len = vec3Length(perp);
    if (len < 0.1) return;
    const norm = vec3Scale(perp, 1 / len);

    const strafeDir = Math.sin(performance.now() * 0.001) > 0 ? 1 : -1;

    const dtScale = dt / 16;
    const displacement = vec3Scale(norm, speed * dtScale * strafeDir);
    this.displacementToMoveXZ(displacement);
  }

  /** Check if a world-space position is on a walkable (empty) grid cell. */
  private isWalkable(pos: Vec3): boolean {
    const gx = Math.floor(pos.x / this.cellSize);
    const gz = Math.floor(pos.z / this.cellSize);

    if (gz < 0 || gz >= this.gridH || gx < 0 || gx >= this.gridW) return false;
    return LevelGenerator.isWalkable(this.grid[gz][gx]);
  }

  // -----------------------------------------------------------------------
  // Aiming
  // -----------------------------------------------------------------------

  /** Set look target angles in the output frame. */
  private aimAt(target: Vec3): void {
    const pos = this.camera.position;
    const dx = target.x - pos.x;
    const dz = target.z - pos.z;
    const dy = (target.y ?? 1) - pos.y;

    const yaw = Math.atan2(dx, dz);
    const horizDist = Math.sqrt(dx * dx + dz * dz);
    const pitch = -Math.atan2(dy, horizDist);

    this.outputFrame.lookYaw = yaw;
    this.outputFrame.lookPitch = pitch;
  }

  // -----------------------------------------------------------------------
  // Combat
  // -----------------------------------------------------------------------

  private tryFire(): void {
    if (!this.player.player || !this.player.ammo) return;

    const wpnId = this.player.player.currentWeapon;
    const ammo = this.player.ammo[wpnId];

    if (ammo.current <= 0) {
      // Always use output frame — legacy direct mode is removed
      this.outputFrame.reload = true;
      return;
    }

    this.outputFrame.fire = true;
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
      this.outputFrame.weaponSlot = WEAPON_SLOT_MAP[ideal];
    }
  }

  private handleReload(): void {
    if (!this.player.player || !this.player.ammo) return;
    if (this.player.player.isReloading) return;

    const wpnId = this.player.player.currentWeapon;
    const ammo = this.player.ammo[wpnId];

    // Auto-reload when empty
    if (ammo.current <= 0 && ammo.reserve > 0) {
      this.outputFrame.reload = true;
      return;
    }

    // Tactical reload when safe and magazine < 25%
    const enemies = this.getEnemies();
    const closest = this.nearest(enemies);
    const dist = closest ? this.distToEntity(closest) : Infinity;

    if (dist > 15 && ammo.current < ammo.magSize * 0.25 && ammo.reserve > 0) {
      this.outputFrame.reload = true;
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
    return vec3Distance(this.camera.position, entity.position);
  }
}

// (lerpAngle removed — only used in legacy direct-camera mode)
