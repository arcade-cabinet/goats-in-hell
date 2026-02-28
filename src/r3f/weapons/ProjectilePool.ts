/**
 * ProjectilePool — Object pool for projectile meshes and state.
 *
 * Pre-allocates ~100 projectile slots with reusable Three.js meshes.
 * Each slot tracks: mesh, active flag, life timer, velocity, damage,
 * speed, owner, and aoe radius.
 *
 * All projectile meshes are small emissive spheres managed imperatively.
 */

import * as THREE from 'three/webgpu';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ProjectileOwner = 'player' | 'enemy';

export interface ProjectileSlot {
  /** The Three.js mesh for this projectile. */
  mesh: THREE.Mesh;
  /** Whether this slot is in use. */
  active: boolean;
  /** Remaining life in seconds. */
  life: number;
  /** Damage on hit. */
  damage: number;
  /** Speed in units/sec (magnitude of velocity). */
  speed: number;
  /** World-space velocity vector (units/sec). */
  velocity: THREE.Vector3;
  /** Who fired this projectile. */
  owner: ProjectileOwner;
  /** Area of effect radius (0 = no splash). */
  aoe: number;
}

// ---------------------------------------------------------------------------
// Shared geometry/material caches
// ---------------------------------------------------------------------------

const POOL_SIZE = 100;

// Bullet: visible sphere (bigger = more satisfying visual feedback)
const BULLET_RADIUS = 0.08;
const ROCKET_RADIUS = 0.2;

let sharedBulletGeometry: THREE.SphereGeometry | null = null;
let sharedRocketGeometry: THREE.SphereGeometry | null = null;

function getBulletGeometry(): THREE.SphereGeometry {
  if (!sharedBulletGeometry) {
    sharedBulletGeometry = new THREE.SphereGeometry(BULLET_RADIUS, 6, 4);
  }
  return sharedBulletGeometry;
}

function getRocketGeometry(): THREE.SphereGeometry {
  if (!sharedRocketGeometry) {
    sharedRocketGeometry = new THREE.SphereGeometry(ROCKET_RADIUS, 8, 6);
  }
  return sharedRocketGeometry;
}

// Pre-built materials keyed by hex color
const materialCache = new Map<string, THREE.MeshStandardMaterial>();

function getEmissiveMaterial(color: string): THREE.MeshStandardMaterial {
  let mat = materialCache.get(color);
  if (!mat) {
    mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      emissive: new THREE.Color(color),
      emissiveIntensity: 2.0,
      toneMapped: false,
    });
    materialCache.set(color, mat);
  }
  return mat;
}

// ---------------------------------------------------------------------------
// Projectile color constants
// ---------------------------------------------------------------------------

/** Weapon-specific projectile colors. */
export const PROJECTILE_COLORS = {
  hellPistol: '#ff8800', // orange
  brimShotgun: '#4488ff', // blue
  hellfireCannon: '#ff2200', // red
  goatsBane: '#aa44ff', // purple
  enemy: '#ff4444', // red-ish for enemy projectiles
} as const;

// ---------------------------------------------------------------------------
// ProjectilePool
// ---------------------------------------------------------------------------

export class ProjectilePool {
  readonly slots: ProjectileSlot[] = [];
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Pre-allocate pool slots with invisible meshes
    for (let i = 0; i < POOL_SIZE; i++) {
      const mesh = new THREE.Mesh(
        getBulletGeometry(),
        getEmissiveMaterial(PROJECTILE_COLORS.hellPistol),
      );
      mesh.name = `projectile-${i}`;
      mesh.visible = false;
      mesh.frustumCulled = false; // small fast-moving objects
      scene.add(mesh);

      this.slots.push({
        mesh,
        active: false,
        life: 0,
        damage: 0,
        speed: 0,
        velocity: new THREE.Vector3(),
        owner: 'player',
        aoe: 0,
      });
    }
  }

  /**
   * Activate a pooled projectile slot.
   *
   * @param origin    World-space start position.
   * @param direction Normalized direction vector.
   * @param speed     Speed in units/sec.
   * @param damage    Damage on hit.
   * @param owner     'player' or 'enemy'.
   * @param aoe       Area of effect radius (default 0).
   * @param color     Hex color string (default orange).
   * @param isRocket  Whether to use larger rocket geometry.
   * @returns Slot index, or -1 if pool is exhausted.
   */
  spawn(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    speed: number,
    damage: number,
    owner: ProjectileOwner,
    aoe: number = 0,
    color: string = PROJECTILE_COLORS.hellPistol,
    isRocket: boolean = false,
  ): number {
    // Find an inactive slot
    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      if (slot.active) continue;

      slot.active = true;
      slot.life = 5; // 5 seconds max life
      slot.damage = damage;
      slot.speed = speed;
      slot.velocity.copy(direction).normalize().multiplyScalar(speed);
      slot.owner = owner;
      slot.aoe = aoe;

      // Update mesh geometry and material
      const geometry = isRocket ? getRocketGeometry() : getBulletGeometry();
      if (slot.mesh.geometry !== geometry) {
        slot.mesh.geometry = geometry;
      }
      slot.mesh.material = getEmissiveMaterial(color);

      // Position and show
      slot.mesh.position.copy(origin);
      slot.mesh.visible = true;

      return i;
    }

    return -1; // pool exhausted
  }

  /**
   * Advance all active projectiles by dt seconds.
   * Decrements life timers and deactivates expired projectiles.
   */
  update(dt: number): void {
    for (const slot of this.slots) {
      if (!slot.active) continue;

      // Move
      slot.mesh.position.addScaledVector(slot.velocity, dt);

      // Decrement life
      slot.life -= dt;
      if (slot.life <= 0) {
        this.releaseSlot(slot);
      }
    }
  }

  /**
   * Return a projectile slot to the pool by index.
   */
  release(index: number): void {
    if (index < 0 || index >= this.slots.length) return;
    this.releaseSlot(this.slots[index]);
  }

  /**
   * Iterate over all currently active projectile slots.
   * The callback receives (slot, index).
   */
  getActive(callback: (slot: ProjectileSlot, index: number) => void): void {
    for (let i = 0; i < this.slots.length; i++) {
      if (this.slots[i].active) {
        callback(this.slots[i], i);
      }
    }
  }

  /**
   * Release all active projectiles (e.g. on floor transition).
   */
  releaseAll(): void {
    for (const slot of this.slots) {
      if (slot.active) {
        this.releaseSlot(slot);
      }
    }
  }

  /**
   * Dispose all pool resources. Call on unmount.
   */
  dispose(): void {
    for (const slot of this.slots) {
      this.scene.remove(slot.mesh);
      // Don't dispose shared geometry/materials
    }
    this.slots.length = 0;
  }

  // -------------------------------------------------------------------------
  // Internal
  // -------------------------------------------------------------------------

  private releaseSlot(slot: ProjectileSlot): void {
    slot.active = false;
    slot.mesh.visible = false;
    slot.life = 0;
  }
}
