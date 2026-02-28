/**
 * ProjectileManager — R3F component that manages the ProjectilePool,
 * advances projectiles each frame, and checks collisions via Rapier.
 *
 * Collision detection:
 *   - For each active projectile, cast a short Rapier ray along velocity
 *   - On enemy hit: apply damage via callback
 *   - On wall hit: release projectile (impact particles TBD)
 *   - On rocket hit: area damage to nearby enemies
 *
 * Exports pool ref for WeaponSystem to call spawn().
 */

import { useFrame, useThree } from '@react-three/fiber';
import type { RapierContext } from '@react-three/rapier';
import { useRapier } from '@react-three/rapier';
import { useCallback, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { world } from '../../game/entities/world';
import { createBloodSplash, createImpactSparks } from '../systems/ParticleEffects';
import type { ProjectileSlot } from './ProjectilePool';
import { ProjectilePool } from './ProjectilePool';
import { recordHit } from './WeaponSystem';

// ---------------------------------------------------------------------------
// Module-level pool reference (accessible from WeaponSystem via getPool())
// ---------------------------------------------------------------------------

let activePool: ProjectilePool | null = null;

/** Get the active ProjectilePool. Returns null if not yet mounted. */
export function getProjectilePool(): ProjectilePool | null {
  return activePool;
}

// ---------------------------------------------------------------------------
// Collision callback type
// ---------------------------------------------------------------------------

export type DamageEnemyFn = (entityId: string, damage: number, isAoe?: boolean) => void;

// Module-level damage callback — set by the parent game scene
let damageEnemyCallback: DamageEnemyFn | null = null;

/**
 * Register a callback for dealing damage to enemies from projectile hits.
 * Called once by the game scene component during setup.
 */
export function setDamageEnemyCallback(fn: DamageEnemyFn): void {
  damageEnemyCallback = fn;
}

// ---------------------------------------------------------------------------
// Temp vectors
// ---------------------------------------------------------------------------

const _rayOrigin = new THREE.Vector3();
const _rayDir = new THREE.Vector3();
const _enemyPos = new THREE.Vector3();

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProjectileManager() {
  const { scene } = useThree();
  const { world: rapierWorld, rapier } = useRapier();
  const poolRef = useRef<ProjectilePool | null>(null);

  // Create pool on mount
  useEffect(() => {
    const pool = new ProjectilePool(scene);
    poolRef.current = pool;
    activePool = pool;

    return () => {
      pool.dispose();
      poolRef.current = null;
      activePool = null;
    };
  }, [scene]);

  // Stable collision checker that captures rapier context + scene
  const checkCollision = useCallback(
    (slot: ProjectileSlot, index: number, pool: ProjectilePool, dt: number) => {
      checkProjectileCollision(slot, index, pool, rapierWorld, rapier, dt, scene);
    },
    [rapierWorld, rapier, scene],
  );

  // Per-frame update
  useFrame((_state, delta) => {
    const pool = poolRef.current;
    if (!pool) return;

    const dt = Math.min(delta, 0.1); // clamp to avoid physics explosion

    // Advance all projectiles
    pool.update(dt);

    // Check collisions for active projectiles
    pool.getActive((slot, index) => {
      checkCollision(slot, index, pool, dt);
    });
  });

  // No JSX — pool manages meshes imperatively
  return null;
}

// ---------------------------------------------------------------------------
// Collision detection
// ---------------------------------------------------------------------------

// Temp vectors for particle effects (reused to avoid allocation)
const _hitPos = new THREE.Vector3();
const _hitNormal = new THREE.Vector3();

/**
 * Cast a short ray along the projectile's velocity to detect hits.
 * The ray length is velocity * dt (distance traveled this frame) + a small margin.
 */
function checkProjectileCollision(
  slot: ProjectileSlot,
  index: number,
  pool: ProjectilePool,
  rapierWorld: RapierContext['world'],
  rapier: RapierContext['rapier'],
  dt: number,
  scene: THREE.Scene,
): void {
  // Ray from projectile position along velocity
  _rayOrigin.copy(slot.mesh.position);
  _rayDir.copy(slot.velocity).normalize();

  // Ray length = distance traveled this frame + small margin
  const rayLength = slot.speed * dt + 0.2;

  // Construct a proper Rapier Ray instance
  const ray = new rapier.Ray(
    { x: _rayOrigin.x, y: _rayOrigin.y, z: _rayOrigin.z },
    { x: _rayDir.x, y: _rayDir.y, z: _rayDir.z },
  );

  const hit = rapierWorld.castRay(ray, rayLength, true);

  if (!hit) return;

  const hitCollider = hit.collider;
  const parentBody = hitCollider.parent();
  if (!parentBody) {
    // Hit something without a parent body — treat as wall
    _hitPos.copy(slot.mesh.position);
    _hitNormal.copy(slot.velocity).normalize().negate();
    createImpactSparks(_hitPos, _hitNormal, scene);
    pool.release(index);
    return;
  }

  const userData = parentBody.userData as { entityId?: string } | undefined;
  const entityId = userData?.entityId;

  if (entityId && slot.owner === 'player') {
    // Check if this is an enemy entity
    const entity = world.entities.find((e) => e.id === entityId && e.enemy);
    if (entity) {
      // Direct hit on enemy — blood splash at hit point
      _hitPos.copy(slot.mesh.position);
      createBloodSplash(_hitPos, scene);

      if (damageEnemyCallback) {
        damageEnemyCallback(entityId, slot.damage);
      }
      recordHit();

      // Area damage for rockets
      if (slot.aoe > 0) {
        applyAreaDamage(slot.mesh.position, slot.aoe, slot.damage, entityId);
      }

      pool.release(index);
      return;
    }
  }

  // Hit wall or other non-enemy collider — impact sparks
  _hitPos.copy(slot.mesh.position);
  _hitNormal.copy(slot.velocity).normalize().negate();
  createImpactSparks(_hitPos, _hitNormal, scene);

  if (slot.aoe > 0) {
    // Rockets explode on any surface
    applyAreaDamage(slot.mesh.position, slot.aoe, slot.damage);
  }

  pool.release(index);
}

/**
 * Apply area-of-effect damage to all enemies within radius.
 * Damage falls off linearly with distance.
 *
 * @param center     Explosion center in world space.
 * @param radius     AoE radius.
 * @param baseDamage Full damage at center.
 * @param skipId     Entity ID to skip (already received direct hit).
 */
function applyAreaDamage(
  center: THREE.Vector3,
  radius: number,
  baseDamage: number,
  skipId?: string,
): void {
  if (!damageEnemyCallback) return;

  for (const entity of world.entities) {
    if (!entity.enemy || !entity.position || !entity.id) continue;
    if (entity.id === skipId) continue;

    // Convert entity position (Babylon left-handed) to Three.js right-handed
    _enemyPos.set(entity.position.x, entity.position.y, -entity.position.z);

    const dist = _enemyPos.distanceTo(center);
    if (dist > radius) continue;

    // Linear falloff: full damage at center, 0 at edge
    const falloff = 1 - dist / radius;
    const damage = Math.ceil(baseDamage * falloff);
    if (damage > 0) {
      damageEnemyCallback(entity.id, damage, true);
    }
  }
}
