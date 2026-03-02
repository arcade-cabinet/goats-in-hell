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
import { ArriveBehavior, EntityManager, Vehicle, WanderBehavior, Vector3 as YV3 } from 'yuka';
import type { Entity, Vec3, WeaponId } from '../entities/components';
import { vec3, vec3Distance, vec3Length, vec3Scale, vec3Subtract } from '../entities/vec3';
import { world } from '../entities/world';
import { LevelGenerator, type MapCell } from '../levels/LevelGenerator';
import { weapons } from '../weapons/weapons';

/**
 * Generic camera interface — abstracts away Babylon/Three camera specifics.
 * The governor reads position + rotation but only writes in legacy mode.
 */
export interface AICamera {
  position: Vec3;
  rotation: { x: number; y: number };
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
  moveX: number; // -1..1 strafe (positive = right)
  moveZ: number; // -1..1 forward/back (positive = forward, Babylon.js Z+)
  lookYaw: number; // target yaw angle (radians, Babylon.js convention)
  lookPitch: number; // target pitch angle (radians, Babylon.js convention)
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
  brimstoneFlamethrower: 5,
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
const MOVE_SPEED = 0.1;
const SPRINT_SPEED = 0.15;
const SHOOT_RANGE_FACTOR = 0.8; // Fire within 80% of weapon's max range
const _AIM_LERP = 0.12; // Camera aim smoothing (0-1 per frame)
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
  private frameCount = 0;

  // --- Output callback mode ---
  private outputCallback: ((frame: AIOutputFrame) => void) | null = null;
  private outputFrame: AIOutputFrame = emptyAIOutputFrame();
  /** Whether a sprint was requested this frame (used in output mode). */
  private sprintRequested = false;

  // --- Pathfinding ---
  /** Current waypoint path (world coords, ECS convention). */
  private waypoints: Vec3[] = [];
  /** Index of the next waypoint to approach. */
  private waypointIndex = 0;
  /** Threshold to consider a waypoint reached. */
  private readonly WAYPOINT_REACH = 1.5;

  // --- Stuck detection ---
  /** Checkpoint position updated every STUCK_CHECK_INTERVAL ms. */
  private stuckCheckpoint: Vec3 = vec3(0, 0, 0);
  /** Time since last checkpoint update. */
  private stuckCheckTimer = 0;
  /** How often (ms) to check if we've moved significantly. */
  private readonly STUCK_CHECK_INTERVAL = 2000;
  /** Minimum distance² the AI must move per check interval to not be "stuck". */
  private readonly STUCK_MIN_DIST_SQ = 4.0; // 2 units
  /** Consecutive failed movement checks before unsticking. */
  private stuckStrikes = 0;
  /** Strikes needed before forcing explore state. */
  private readonly STUCK_STRIKES_EXPLORE = 2;
  /** Cooldown (ms) after forced explore to prevent decide() from switching back. */
  private forceExploreCooldown = 0;
  private readonly FORCE_EXPLORE_DURATION = 4000;
  /** Active random burst direction (persists for BURST_DURATION ms). */
  private burstDirection: { x: number; z: number } | null = null;
  private burstTimer = 0;
  private readonly BURST_DURATION = 800;

  constructor(camera: AICamera, player: Entity, grid: MapCell[][], cellSize: number) {
    this.camera = camera;
    this.player = player;
    this.grid = grid.map((row) => row.map((c) => c as number));
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

    // Tick down force-explore cooldown
    if (this.forceExploreCooldown > 0) {
      this.forceExploreCooldown -= dt;
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

    // --- Stuck detection (AFTER state executor so burst overrides movement) ---
    // Wall sliding can cause positional drift that defeats simple checks.
    // Every STUCK_CHECK_INTERVAL ms we verify the AI moved at least 2 units.
    // Consecutive failures trigger escalating responses.
    const pos = this.player.position;
    this.stuckCheckTimer += dt;
    if (this.stuckCheckTimer >= this.STUCK_CHECK_INTERVAL) {
      this.stuckCheckTimer = 0;
      const dx = pos.x - this.stuckCheckpoint.x;
      const dz = pos.z - this.stuckCheckpoint.z;
      const distSq = dx * dx + dz * dz;
      if (distSq < this.STUCK_MIN_DIST_SQ) {
        this.stuckStrikes++;
        if (this.stuckStrikes >= this.STUCK_STRIKES_EXPLORE) {
          // Hard reset: force explore with cooldown so decide() can't override
          this.setState('explore', null);
          this.forceExploreCooldown = this.FORCE_EXPLORE_DURATION;
          this.stuckStrikes = 0;
          this.waypoints = [];
        }
        // Start a random burst that persists for BURST_DURATION ms
        const angle = Math.random() * Math.PI * 2;
        this.burstDirection = { x: Math.cos(angle), z: Math.sin(angle) };
        this.burstTimer = this.BURST_DURATION;
        this.waypoints = [];
      } else {
        // Making progress — reset strikes
        this.stuckStrikes = 0;
      }
      this.stuckCheckpoint = vec3(pos.x, pos.y, pos.z);
    }

    // Apply active burst direction — overrides state executor output
    if (this.burstTimer > 0) {
      this.burstTimer -= dt;
      if (this.burstDirection) {
        this.outputFrame.moveX = this.burstDirection.x;
        this.outputFrame.moveZ = this.burstDirection.z;
        this.outputFrame.sprint = true;
      }
      if (this.burstTimer <= 0) {
        this.burstDirection = null;
      }
    }

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
    // If we were force-explored by stuck detection, don't override until cooldown expires
    if (this.forceExploreCooldown > 0 && this._state === 'explore') {
      return;
    }

    const hp = this.player.player!.hp;
    const maxHp = this.player.player!.maxHp;
    const hpRatio = hp / maxHp;

    const enemies = this.getEnemies();
    const nearestEnemy = this.nearest(enemies);
    const nearestHealth = this.nearestPickup('health');
    const nearestAmmo = this.nearestPickup('ammo');

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

    // Resupply: seek ammo when current weapon is empty or very low
    if (nearestAmmo && !this.hasAmmo(this.player.player!.currentWeapon)) {
      this.setState('heal', nearestAmmo); // Reuse heal state (approach pickup)
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
    this.waypoints = [];
    this.waypointIndex = 0;

    // Configure YUKA behaviors
    this.arriveBehavior.active = false;
    this.wanderBehavior.active = false;

    if (target?.position) {
      this.arriveBehavior.target = new YV3(target.position.x, 0, target.position.z);
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
      this.waypoints = [];
      this.decide();
      return;
    }

    const dist = this.distToEntity(target);
    const wpn = weapons[this.player.player!.currentWeapon];
    const engageRange = wpn.range * SHOOT_RANGE_FACTOR;
    const hasLOS = this.hasLineOfSight(this.camera.position, target.position);

    if (hasLOS && dist < engageRange && dist > 3) {
      // In range with LOS — strafe and shoot
      this.strafeAround(target.position, MOVE_SPEED * 0.4, dt);
      this.waypoints = []; // Clear path since we can see the target
    } else if (hasLOS && dist < 3) {
      // Too close — backpedal
      this.moveAwayFrom(target.position, MOVE_SPEED * 0.6, dt);
      this.waypoints = [];
    } else {
      // No LOS or out of range — pathfind toward target
      this.navigateToEntity(target, MOVE_SPEED, dt);
    }

    // Aim and fire — only shoot if we have line of sight (no walls between us)
    this.aimAt(target.position);
    if (dist < engageRange && hasLOS) {
      this.tryFire();
    }
  }

  private execHeal(dt: number): void {
    const target = this.targetEntity;
    if (!target?.position || (!target.pickup?.active && !target.enemy)) {
      this.waypoints = [];
      this.decide();
      return;
    }

    if (!world.entities.includes(target)) {
      this.waypoints = [];
      this.decide();
      return;
    }

    // Pathfind to pickup
    this.navigateToEntity(target, SPRINT_SPEED, dt);
    this.sprintRequested = true;
    this.aimAt(target.position);

    // Still shoot at enemies while healing (only with line of sight)
    const enemies = this.getEnemies();
    const closest = this.nearest(enemies);
    if (closest?.position) {
      const d = this.distToEntity(closest);
      if (
        d < weapons[this.player.player!.currentWeapon].range * 0.5 &&
        this.hasLineOfSight(this.camera.position, closest.position)
      ) {
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

    // Shoot while retreating (only with line of sight)
    const enemies = this.getEnemies();
    const closest = this.nearest(enemies);
    if (closest?.position) {
      this.aimAt(closest.position);
      const d = this.distToEntity(closest);
      if (
        d < weapons[this.player.player!.currentWeapon].range * 0.6 &&
        this.hasLineOfSight(this.camera.position, closest.position)
      ) {
        this.tryFire();
      }
    }

    // If we're far enough, stop fleeing
    if (this.distToEntity(threat) > FLEE_DISTANCE * 2) {
      this.decide();
    }
  }

  private execExplore(dt: number): void {
    // During forced explore (stuck recovery), use YUKA wander to go random directions.
    // Pathfinding to enemies likely leads back to the same stuck spot.
    if (this.forceExploreCooldown > 0) {
      this.wanderBehavior.active = true;
      this.arriveBehavior.active = false;
      this.applySteeringMovement(dt, SPRINT_SPEED);
      this.sprintRequested = true;
      const vel = this.vehicle.velocity;
      if (vel.squaredLength() > 0.0001) {
        const p = this.camera.position;
        this.aimAt(vec3(p.x + vel.x * 5, p.y, p.z + vel.z * 5));
      }
      return;
    }

    // Priority 1: If enemies exist anywhere, pathfind toward the nearest one
    const enemies = this.getEnemies();
    const nearestEnemy = this.nearest(enemies);
    if (nearestEnemy?.position) {
      this.navigateToEntity(nearestEnemy, MOVE_SPEED, dt);
      this.aimAt(nearestEnemy.position);
      // If we have LOS and range, switch to hunt
      const dist = this.distToEntity(nearestEnemy);
      if (
        dist < weapons[this.player.player!.currentWeapon].range * SHOOT_RANGE_FACTOR &&
        this.hasLineOfSight(this.camera.position, nearestEnemy.position)
      ) {
        this.setState('hunt', nearestEnemy);
      }
      return;
    }

    // Priority 2: Grab nearby pickups
    const wpnPickup = this.nearestPickup('weapon');
    const ammoPickup = this.nearestPickup('ammo');
    const nearPickup =
      wpnPickup && (!ammoPickup || this.distToEntity(wpnPickup) < this.distToEntity(ammoPickup))
        ? wpnPickup
        : ammoPickup;
    if (nearPickup?.position && this.distToEntity(nearPickup) < 20) {
      this.navigateToEntity(nearPickup, MOVE_SPEED, dt);
      this.aimAt(nearPickup.position);
      return;
    }

    // Fallback: YUKA wander (random exploration when nothing to seek)
    this.applySteeringMovement(dt, MOVE_SPEED);
    const vel = this.vehicle.velocity;
    if (vel.squaredLength() > 0.0001) {
      const p = this.camera.position;
      const lookTarget = vec3(p.x + vel.x * 5, p.y, p.z + vel.z * 5);
      this.aimAt(lookTarget);
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
    const displacement = vec3(vel.x * dtScale * 0.5, 0, vel.z * dtScale * 0.5);

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
    } else if (dist < 20 && owned.includes('hellfireCannon') && this.hasAmmo('hellfireCannon')) {
      ideal = 'hellfireCannon';
    } else if (dist > 15 && owned.includes('goatsBane') && this.hasAmmo('goatsBane')) {
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
    return world.entities.filter((e: Entity) => !!e.enemy && !!e.position);
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

  private nearestPickup(type: 'health' | 'ammo' | 'weapon'): Entity | null {
    const pickups = world.entities.filter(
      (e: Entity) => e.pickup?.active && e.pickup.pickupType === type && !!e.position,
    );
    return this.nearest(pickups);
  }

  private distToEntity(entity: Entity): number {
    if (!entity.position) return Infinity;
    return vec3Distance(this.camera.position, entity.position);
  }

  /**
   * Grid-based line-of-sight check using DDA ray marching.
   * Returns true if there is a clear path between two ECS positions
   * with no wall cells in between.
   */
  private hasLineOfSight(from: Vec3, to: Vec3): boolean {
    const cs = this.cellSize;
    // Convert world positions to grid coordinates
    const x0 = from.x / cs;
    const y0 = from.z / cs; // Z in ECS maps to grid row
    const x1 = to.x / cs;
    const y1 = to.z / cs;

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    let x = Math.floor(x0);
    let y = Math.floor(y0);
    const xEnd = Math.floor(x1);
    const yEnd = Math.floor(y1);
    const stepX = x0 < x1 ? 1 : -1;
    const stepY = y0 < y1 ? 1 : -1;

    // Steps along the ray using DDA
    let tMaxX = dx === 0 ? Infinity : (stepX > 0 ? x + 1 - x0 : x0 - x) / dx;
    let tMaxY = dy === 0 ? Infinity : (stepY > 0 ? y + 1 - y0 : y0 - y) / dy;
    const tDeltaX = dx === 0 ? Infinity : 1 / dx;
    const tDeltaY = dy === 0 ? Infinity : 1 / dy;

    // March along the ray
    const maxSteps = Math.ceil(dx + dy) + 2;
    for (let i = 0; i < maxSteps; i++) {
      // Check if current cell is a wall (skip start cell)
      if (i > 0 && y >= 0 && y < this.gridH && x >= 0 && x < this.gridW) {
        if (this.grid[y][x] !== 0) {
          return false; // Wall blocks line of sight
        }
      }

      // Reached destination cell
      if (x === xEnd && y === yEnd) return true;

      // Step to next cell
      if (tMaxX < tMaxY) {
        x += stepX;
        tMaxX += tDeltaX;
      } else {
        y += stepY;
        tMaxY += tDeltaY;
      }
    }

    return true; // Reached end without hitting wall
  }

  // -----------------------------------------------------------------------
  // Pathfinding (BFS on grid)
  // -----------------------------------------------------------------------

  /**
   * BFS pathfind from the player's current position to a target position.
   * Returns a list of world-space waypoints (ECS coords) through walkable cells.
   */
  private findPath(target: Vec3): Vec3[] {
    const cs = this.cellSize;
    const pos = this.camera.position;
    const sx = Math.floor(pos.x / cs);
    const sy = Math.floor(pos.z / cs);
    const ex = Math.floor(target.x / cs);
    const ey = Math.floor(target.z / cs);

    // Clamp to grid bounds
    if (sx < 0 || sx >= this.gridW || sy < 0 || sy >= this.gridH) return [];
    if (ex < 0 || ex >= this.gridW || ey < 0 || ey >= this.gridH) return [];

    // Same cell — no path needed
    if (sx === ex && sy === ey) return [target];

    // BFS
    const visited = new Set<number>();
    const parent = new Map<number, number>();
    const key = (x: number, y: number) => y * this.gridW + x;
    const queue: [number, number][] = [[sx, sy]];
    visited.add(key(sx, sy));

    const dirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1], // diagonals
    ];

    let found = false;
    while (queue.length > 0) {
      const [cx, cy] = queue.shift()!;
      if (cx === ex && cy === ey) {
        found = true;
        break;
      }

      for (const [dx, dy] of dirs) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx < 0 || nx >= this.gridW || ny < 0 || ny >= this.gridH) continue;
        const nk = key(nx, ny);
        if (visited.has(nk)) continue;
        if (this.grid[ny][nx] !== 0) continue;
        // For diagonals, ensure we can actually fit through
        if (dx !== 0 && dy !== 0) {
          if (this.grid[cy][cx + dx] !== 0 || this.grid[cy + dy][cx] !== 0) continue;
        }
        visited.add(nk);
        parent.set(nk, key(cx, cy));
        queue.push([nx, ny]);
      }
    }

    if (!found) return []; // No path exists

    // Reconstruct path
    const path: Vec3[] = [];
    let ck = key(ex, ey);
    while (ck !== key(sx, sy)) {
      const y = Math.floor(ck / this.gridW);
      const x = ck % this.gridW;
      path.unshift(vec3((x + 0.5) * cs, pos.y, (y + 0.5) * cs));
      const pk = parent.get(ck);
      if (pk === undefined) break;
      ck = pk;
    }

    // Simplify path: skip waypoints that are directly visible from earlier ones
    if (path.length > 2) {
      const simplified: Vec3[] = [path[0]];
      let anchor = 0;
      for (let i = 2; i < path.length; i++) {
        if (!this.hasLineOfSight(path[anchor], path[i])) {
          simplified.push(path[i - 1]);
          anchor = i - 1;
        }
      }
      simplified.push(path[path.length - 1]);
      return simplified;
    }

    return path;
  }

  /**
   * Navigate along the current waypoint path.
   * Returns true if we're moving toward a waypoint, false if path is exhausted.
   */
  private followPath(speed: number, dt: number): boolean {
    if (this.waypointIndex >= this.waypoints.length) return false;

    const wp = this.waypoints[this.waypointIndex];
    const pos = this.camera.position;
    const dx = wp.x - pos.x;
    const dz = wp.z - pos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    // Reached waypoint — advance to next
    if (dist < this.WAYPOINT_REACH) {
      this.waypointIndex++;
      return this.waypointIndex < this.waypoints.length;
    }

    // Move toward waypoint
    const norm = vec3(dx / dist, 0, dz / dist);
    const dtScale = dt / 16;
    const displacement = vec3Scale(norm, speed * dtScale);
    this.displacementToMoveXZ(displacement);
    return true;
  }

  /**
   * Pathfind to a target entity and follow the path.
   * Re-computes path periodically or when target moves significantly.
   */
  private navigateToEntity(target: Entity, speed: number, dt: number): void {
    if (!target.position) return;

    // Recompute path every ~60 frames or if no path exists
    const needRepath =
      this.waypoints.length === 0 ||
      this.waypointIndex >= this.waypoints.length ||
      this.frameCount % 60 === 0;

    if (needRepath) {
      this.waypoints = this.findPath(target.position);
      this.waypointIndex = 0;
    }

    if (!this.followPath(speed, dt)) {
      // Path exhausted or not found — fall back to direct steering
      this.arriveBehavior.target.set(target.position.x, 0, target.position.z);
      this.arriveBehavior.active = true;
      this.wanderBehavior.active = false;
      this.applySteeringMovement(dt, speed);
    }
  }
}

// (lerpAngle removed — only used in legacy direct-camera mode)
