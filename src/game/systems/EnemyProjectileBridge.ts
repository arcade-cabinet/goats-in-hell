/**
 * EnemyProjectileBridge — connects engine-agnostic AI enemy projectile spawning
 * to the R3F ProjectilePool so enemy projectiles have visible meshes.
 *
 * The AI system operates in Babylon/ECS coordinates (positive Z = forward).
 * The ProjectilePool operates in Three.js coordinates (negative Z = forward).
 * This bridge handles the coordinate conversion.
 *
 * The bridge callback is registered by the R3F game scene on mount and cleared
 * on unmount, keeping the AI system renderer-agnostic.
 */

import type { Vec3 } from '../entities/components';

// ---------------------------------------------------------------------------
// Bridge callback type
// ---------------------------------------------------------------------------

export type SpawnEnemyProjectileFn = (
  origin: Vec3,
  direction: Vec3,
  damage: number,
  speed: number,
) => void;

// ---------------------------------------------------------------------------
// Module-level callback — set by R3F scene component
// ---------------------------------------------------------------------------

let bridgeCallback: SpawnEnemyProjectileFn | null = null;

/**
 * Register the R3F ProjectilePool callback for enemy projectile spawning.
 * Called once by the game scene component during setup.
 */
export function setEnemyProjectileBridge(fn: SpawnEnemyProjectileFn): void {
  bridgeCallback = fn;
}

/**
 * Clear the bridge callback on unmount.
 */
export function clearEnemyProjectileBridge(): void {
  bridgeCallback = null;
}

/**
 * Spawn an enemy projectile. Called by AISystem.
 * If no bridge is registered (e.g., during tests), this is a no-op.
 */
export function spawnEnemyProjectile(
  origin: Vec3,
  direction: Vec3,
  damage: number,
  speed: number,
): void {
  if (bridgeCallback) {
    bridgeCallback(origin, direction, damage, speed);
  }
}
