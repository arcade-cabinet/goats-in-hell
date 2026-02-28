/**
 * ProjectileManager — R3F component that manages the ProjectilePool,
 * advances projectiles each frame, and checks collisions via Rapier.
 *
 * Collision detection:
 *   - For each active projectile, cast a short Rapier ray along velocity
 *   - On enemy hit: apply damage via callback
 *   - On wall hit: release projectile + spawn impact sparks
 *   - On rocket hit: area damage to nearby enemies
 *
 * Exports pool ref for WeaponSystem to call spawn().
 */

import { useFrame, useThree } from '@react-three/fiber';
import type { RapierContext } from '@react-three/rapier';
import { useRapier } from '@react-three/rapier';
import { useCallback, useEffect, useRef } from 'react';
import * as THREE from 'three/webgpu';
import type { Vec3 } from '../../game/entities/components';
import { world } from '../../game/entities/world';
import {
  clearEnemyProjectileBridge,
  setEnemyProjectileBridge,
} from '../../game/systems/EnemyProjectileBridge';
import { damagePlayer } from '../systems/CombatSystem';
import { createBloodSplash, createImpactSparks } from '../systems/ParticleEffects';
import { PROJECTILE_COLORS, type ProjectileSlot } from './ProjectilePool';
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

// Temp vectors for enemy projectile bridge (reused to avoid allocation)
const _bridgeOrigin = new THREE.Vector3();
const _bridgeDir = new THREE.Vector3();

// Temp vector for player position check
const _playerPos = new THREE.Vector3();

export function ProjectileManager() {
  const { scene } = useThree();
  const { world: rapierWorld, rapier } = useRapier();
  const poolRef = useRef<ProjectilePool | null>(null);

  // Create pool on mount + register enemy projectile bridge
  useEffect(() => {
    const pool = new ProjectilePool(scene);
    poolRef.current = pool;
    activePool = pool;

    // Register bridge so enemy AI projectiles spawn visible pool meshes.
    // AI uses Babylon coords (positive Z = forward); pool uses Three.js
    // coords (negative Z = forward). Speed is per-frame at 60fps; pool
    // expects units/sec so multiply by 60.
    setEnemyProjectileBridge((origin: Vec3, direction: Vec3, damage: number, speed: number) => {
      _bridgeOrigin.set(origin.x, origin.y + 0.5, -origin.z);
      _bridgeDir.set(direction.x, direction.y, -direction.z).normalize();
      // Convert per-frame speed (at 60fps) to units/sec
      const speedPerSec = speed * 60;
      const slotIndex = pool.spawn(
        _bridgeOrigin,
        _bridgeDir,
        speedPerSec,
        damage,
        'enemy',
        0,
        PROJECTILE_COLORS.enemy,
        false,
      );
      if (slotIndex === -1) {
        console.warn('[ProjectileManager] Pool exhausted — enemy projectile dropped');
      }
    });

    return () => {
      clearEnemyProjectileBridge();
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

  // --- Phase 0: Enemy projectile → Player hit detection ---
  // Check enemy-owned projectiles against the player entity.
  if (slot.owner === 'enemy') {
    const player = world.entities.find((e) => e.type === 'player' && e.player);
    if (player?.position) {
      _playerPos.set(player.position.x, player.position.y + 0.5, -player.position.z);
      const projPos = slot.mesh.position;
      const dx = projPos.x - _playerPos.x;
      const dy = projPos.y - _playerPos.y;
      const dz = projPos.z - _playerPos.z;
      const distSq = dx * dx + dy * dy + dz * dz;

      if (distSq < 2.25) {
        // 1.5² = 2.25 — hit!
        damagePlayer(slot.damage);
        pool.release(index);
        return;
      }
    }

    // Enemy projectiles don't need Phase 1 or 2 (no enemy-to-enemy damage),
    // but DO need wall collision to prevent flying through geometry.
    const wallHit = rapierWorld.castRay(ray, rayLength, true);
    if (wallHit) {
      _hitPos.copy(slot.mesh.position);
      _hitNormal.copy(slot.velocity).normalize().negate();
      createImpactSparks(_hitPos, _hitNormal, scene);
      pool.release(index);
    }
    return;
  }

  // --- Phase 1: Distance-based enemy hit detection (player projectiles) ---
  // Check projectile proximity to all enemy ECS entities. This is the primary
  // hit detection method because it's frame-accurate and doesn't depend on
  // Rapier collider registration timing.
  if (slot.owner === 'player') {
    const projPos = slot.mesh.position;

    for (const entity of world.entities) {
      if (!entity.enemy || !entity.position) continue;

      // Convert entity position (Babylon left-handed) to Three.js right-handed
      _enemyPos.set(entity.position.x, entity.position.y + 0.5, -entity.position.z);

      // Squared distance comparison (avoids sqrt for performance)
      const dx = projPos.x - _enemyPos.x;
      const dy = projPos.y - _enemyPos.y;
      const dz = projPos.z - _enemyPos.z;
      const distSq = dx * dx + dy * dy + dz * dz;

      if (distSq < 2.25) {
        // 1.5² = 2.25 — direct hit!
        // Blood splash at projectile position
        _hitPos.copy(projPos);
        createBloodSplash(_hitPos, scene);

        if (damageEnemyCallback && entity.id) {
          damageEnemyCallback(entity.id, slot.damage);
        }
        recordHit();

        // Area damage for rockets
        if (slot.aoe > 0 && entity.id) {
          applyAreaDamage(slot.mesh.position, slot.aoe, slot.damage, entity.id);
        }

        pool.release(index);
        return;
      }
    }
  }

  // --- Phase 2: Rapier raycast for wall collision ---
  // Only triggers if no enemy was hit above. Detects walls for impact sparks
  // and to prevent projectiles from flying through geometry.
  const hit = rapierWorld.castRay(ray, rayLength, true);

  if (!hit) return;

  const hitCollider = hit.collider;
  const parentBody = hitCollider.parent();

  // Check if we hit an enemy collider (backup path for enemies near walls)
  if (parentBody) {
    const userData = parentBody.userData as { entityId?: string } | undefined;
    const entityId = userData?.entityId;

    if (entityId && slot.owner === 'player') {
      const entity = world.entities.find((e) => e.id === entityId && e.enemy);
      if (entity) {
        _hitPos.copy(slot.mesh.position);
        createBloodSplash(_hitPos, scene);

        if (damageEnemyCallback) {
          damageEnemyCallback(entityId, slot.damage);
        }
        recordHit();

        if (slot.aoe > 0) {
          applyAreaDamage(slot.mesh.position, slot.aoe, slot.damage, entityId);
        }

        pool.release(index);
        return;
      }
    }
  }

  // Hit wall — impact sparks
  _hitPos.copy(slot.mesh.position);
  _hitNormal.copy(slot.velocity).normalize().negate();
  createImpactSparks(_hitPos, _hitNormal, scene);

  if (slot.aoe > 0) {
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

  const radiusSq = radius * radius;

  for (const entity of world.entities) {
    if (!entity.enemy || !entity.position || !entity.id) continue;
    if (entity.id === skipId) continue;

    // Convert entity position (Babylon left-handed) to Three.js right-handed
    const dx = entity.position.x - center.x;
    const dy = entity.position.y - center.y;
    const dz = -entity.position.z - center.z;
    const distSq = dx * dx + dy * dy + dz * dz;
    if (distSq > radiusSq) continue;

    // Linear falloff: full damage at center, 0 at edge
    const dist = Math.sqrt(distSq);
    const falloff = 1 - dist / radius;
    const damage = Math.ceil(baseDamage * falloff);
    if (damage > 0) {
      damageEnemyCallback(entity.id, damage, true);
    }
  }
}
