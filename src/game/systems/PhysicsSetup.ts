/**
 * Havok physics integration — initializes the physics engine and provides
 * helpers for enemy colliders and physics-based raycasting.
 *
 * Replaces the old scene.pickWithRay mesh-name approach with proper
 * physics engine raycasts against capsule colliders.
 */
// Use UMD build — the ESM build uses `import.meta` which Metro doesn't support
// @ts-expect-error UMD module doesn't have typed declarations
import HavokPhysics from '@babylonjs/havok/lib/umd/HavokPhysics_umd';
import {Asset} from 'expo-asset';
import {
  HavokPlugin,
  Mesh,
  PhysicsAggregate,
  PhysicsEngine,
  PhysicsMotionType,
  PhysicsRaycastResult,
  PhysicsShapeType,
  Scene,
  Vector3,
} from '@babylonjs/core';

import {PHYSICS_ASSETS} from './AssetRegistry';

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

let havokPlugin: HavokPlugin | null = null;

/**
 * Initialize the Havok physics engine on the scene.
 * Call once during asset loading phase — async because WASM must load.
 *
 * Metro can't serve .wasm files correctly, so we load the binary ourselves
 * via the asset pipeline and pass it directly to the HavokPhysics constructor.
 */
export async function initPhysics(scene: Scene): Promise<void> {
  // Load WASM binary via Metro asset pipeline
  const wasmAsset = Asset.fromModule(PHYSICS_ASSETS['havok-wasm'] as unknown as number);
  await wasmAsset.downloadAsync();
  const wasmResponse = await fetch(wasmAsset.localUri ?? wasmAsset.uri);
  const wasmBinary = await wasmResponse.arrayBuffer();

  const havokInstance = await HavokPhysics({wasmBinary});
  havokPlugin = new HavokPlugin(true, havokInstance);
  // Zero gravity — we don't use physics for movement, only collision queries
  scene.enablePhysics(new Vector3(0, 0, 0), havokPlugin);
}

/** Get the physics plugin (throws if not initialized). */
export function getPhysicsPlugin(): HavokPlugin {
  if (!havokPlugin) {
    throw new Error('Havok physics not initialized. Call initPhysics() first.');
  }
  return havokPlugin;
}

// ---------------------------------------------------------------------------
// Enemy colliders
// ---------------------------------------------------------------------------

const enemyAggregates = new Map<string, PhysicsAggregate>();

/**
 * Add a capsule physics collider to an enemy mesh.
 * The collider is ANIMATED (kinematic) — position is synced from AI movement,
 * not driven by physics forces. This allows the physics engine to track
 * the enemy's position for raycasting without affecting AI-controlled movement.
 */
export function addEnemyCollider(
  mesh: Mesh,
  entityId: string,
  scene: Scene,
  height = 1.5,
  radius = 0.4,
): void {
  // Store entity ID in metadata for retrieval after raycast hits
  mesh.metadata = {...(mesh.metadata ?? {}), entityId};

  const aggregate = new PhysicsAggregate(
    mesh,
    PhysicsShapeType.CAPSULE,
    {
      mass: 0,
      radius,
      pointA: new Vector3(0, radius, 0),
      pointB: new Vector3(0, height - radius, 0),
    },
    scene,
  );

  // Animated = kinematic. Physics tracks position but doesn't apply forces.
  aggregate.body.setMotionType(PhysicsMotionType.ANIMATED);

  // CRITICAL: PhysicsAggregate defaults disablePreStep=true for performance.
  // We need the physics body to auto-sync from the mesh's world matrix each
  // physics step so the collider follows the enemy as AI moves it.
  aggregate.body.disablePreStep = false;

  enemyAggregates.set(entityId, aggregate);
}

/**
 * Remove the physics collider for an enemy (on death/despawn).
 */
export function removeEnemyCollider(entityId: string): void {
  const aggregate = enemyAggregates.get(entityId);
  if (aggregate) {
    aggregate.dispose();
    enemyAggregates.delete(entityId);
  }
}

/** Dispose all tracked enemy colliders. */
export function disposeAllEnemyColliders(): void {
  for (const aggregate of enemyAggregates.values()) {
    aggregate.dispose();
  }
  enemyAggregates.clear();
}

// ---------------------------------------------------------------------------
// Physics raycast
// ---------------------------------------------------------------------------

// Reusable result object (Havok docs recommend reusing this)
const raycastResult = new PhysicsRaycastResult();

export interface HitscanHit {
  entityId: string;
  hitPoint: Vector3;
  hitNormal: Vector3;
  distance: number;
}

/**
 * Cast a physics ray from `origin` in `direction` up to `maxDistance`.
 * Returns the hit enemy's entity ID and hit point, or null if nothing hit.
 */
export function physicsRaycast(
  scene: Scene,
  origin: Vector3,
  direction: Vector3,
  maxDistance: number,
): HitscanHit | null {
  const engine = scene.getPhysicsEngine() as PhysicsEngine | null;
  if (!engine) return null;

  const end = origin.add(direction.scale(maxDistance));
  engine.raycastToRef(origin, end, raycastResult);

  if (!raycastResult.hasHit) return null;

  // Walk up the transform node hierarchy to find our enemy root with metadata
  let node = raycastResult.body?.transformNode;
  while (node && !node.metadata?.entityId) {
    node = node.parent as typeof node;
  }

  const entityId = node?.metadata?.entityId;
  if (!entityId) return null;

  return {
    entityId,
    hitPoint: raycastResult.hitPointWorld.clone(),
    hitNormal: raycastResult.hitNormalWorld.clone(),
    distance: Vector3.Distance(origin, raycastResult.hitPointWorld),
  };
}
