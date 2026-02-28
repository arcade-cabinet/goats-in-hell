/**
 * EnemyRenderer — R3F component that manages all enemy meshes imperatively.
 *
 * Uses imperative Three.js API (useEffect + scene.add) to avoid JSX type
 * conflicts with Reactylon's global JSX augmentation.
 *
 * Responsibilities:
 *   - Preload enemy GLB models (or create colored capsule placeholders)
 *   - Spawn a cloned mesh for each new enemy in the Miniplex world
 *   - Dispose meshes for removed enemies
 *   - Sync positions each frame via updateEnemyMeshes()
 */

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { COLORS } from '../../constants';
import type { Entity, EntityType } from '../../game/entities/components';
import { world } from '../../game/entities/world';
import { updateEnemyMeshes } from './EnemySystem';

// ---------------------------------------------------------------------------
// Enemy type configuration
// ---------------------------------------------------------------------------

interface EnemyMeshConfig {
  color: string;
  scale: number;
  emissiveHex: string;
  emissiveIntensity: number;
  eyeColor: string;
  baseVisibility?: number;
}

const ENEMY_CONFIGS: Record<string, EnemyMeshConfig> = {
  goat: {
    color: COLORS.goat,
    scale: 1.0,
    emissiveHex: '#440000',
    emissiveIntensity: 0.2,
    eyeColor: '#ff0000',
  },
  hellgoat: {
    color: COLORS.hellgoat,
    scale: 1.2,
    emissiveHex: '#662200',
    emissiveIntensity: 0.35,
    eyeColor: '#ff4400',
  },
  fireGoat: {
    color: COLORS.fireGoat,
    scale: 1.0,
    emissiveHex: '#663300',
    emissiveIntensity: 0.4,
    eyeColor: '#ff8800',
  },
  shadowGoat: {
    color: COLORS.shadowGoat,
    scale: 0.9,
    emissiveHex: '#110033',
    emissiveIntensity: 0.3,
    eyeColor: '#8888ff',
    baseVisibility: 0.4,
  },
  goatKnight: {
    color: COLORS.goatKnight,
    scale: 1.4,
    emissiveHex: '#223344',
    emissiveIntensity: 0.15,
    eyeColor: '#4488ff',
  },
  // Bosses — use boss color at 1.5× base scale (on top of config scale)
  archGoat: {
    color: COLORS.boss,
    scale: 2.0,
    emissiveHex: '#550044',
    emissiveIntensity: 0.4,
    eyeColor: '#cc00ff',
  },
  infernoGoat: {
    color: COLORS.boss,
    scale: 1.8,
    emissiveHex: '#882200',
    emissiveIntensity: 0.6,
    eyeColor: '#ff4400',
  },
  voidGoat: {
    color: COLORS.boss,
    scale: 1.6,
    emissiveHex: '#220055',
    emissiveIntensity: 0.5,
    eyeColor: '#aa44ff',
    baseVisibility: 0.4,
  },
  ironGoat: {
    color: COLORS.boss,
    scale: 2.2,
    emissiveHex: '#334455',
    emissiveIntensity: 0.25,
    eyeColor: '#4488ff',
  },
};

// All enemy entity types for filtering
const ENEMY_TYPES = new Set<EntityType>([
  'goat',
  'hellgoat',
  'fireGoat',
  'shadowGoat',
  'goatKnight',
  'archGoat',
  'infernoGoat',
  'voidGoat',
  'ironGoat',
]);

// ---------------------------------------------------------------------------
// Template cache — one capsule mesh per enemy type
// ---------------------------------------------------------------------------

/** Cached template meshes (capsule geometry + emissive eyes), keyed by enemy type. */
const templateCache = new Map<string, THREE.Group>();

/** Shared geometry instances to avoid redundant allocations. */
let sharedCapsuleGeometry: THREE.CapsuleGeometry | null = null;
let sharedEyeGeometry: THREE.SphereGeometry | null = null;

function getSharedCapsuleGeometry(): THREE.CapsuleGeometry {
  if (!sharedCapsuleGeometry) {
    sharedCapsuleGeometry = new THREE.CapsuleGeometry(0.3, 0.8, 8, 12);
  }
  return sharedCapsuleGeometry;
}

function getSharedEyeGeometry(): THREE.SphereGeometry {
  if (!sharedEyeGeometry) {
    sharedEyeGeometry = new THREE.SphereGeometry(0.035, 6, 6);
  }
  return sharedEyeGeometry;
}

/**
 * Build a template Group for the given enemy type.
 * Consists of a capsule body + two emissive eye spheres.
 */
function buildTemplate(type: string): THREE.Group {
  const config = ENEMY_CONFIGS[type] || ENEMY_CONFIGS.goat;
  const group = new THREE.Group();
  group.name = `template-enemy-${type}`;

  // Body — capsule
  const bodyMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(config.color),
    emissive: new THREE.Color(config.emissiveHex),
    emissiveIntensity: config.emissiveIntensity,
    roughness: 0.7,
    metalness: 0.1,
  });

  if (config.baseVisibility !== undefined && config.baseVisibility < 1) {
    bodyMat.transparent = true;
    bodyMat.opacity = config.baseVisibility;
  }

  const body = new THREE.Mesh(getSharedCapsuleGeometry(), bodyMat);
  body.castShadow = true;
  body.receiveShadow = true;
  // Capsule center is at origin; shift up so feet are at y=0
  body.position.y = 0.7;
  group.add(body);

  // Eyes — small emissive spheres
  const eyeMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(config.eyeColor),
    emissive: new THREE.Color(config.eyeColor),
    emissiveIntensity: 1.0,
  });

  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(getSharedEyeGeometry(), eyeMat);
    eye.position.set(side * 0.12, 0.9, 0.25);
    group.add(eye);
  }

  // Apply type-specific scale
  group.scale.setScalar(config.scale);

  // Store config on group for later reference
  group.userData = { enemyType: type, baseScale: config.scale };

  return group;
}

/**
 * Get or create a template for the given enemy type.
 */
function getTemplate(type: string): THREE.Group {
  let template = templateCache.get(type);
  if (!template) {
    template = buildTemplate(type);
    templateCache.set(type, template);
  }
  return template;
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

/**
 * EnemyRenderer — manages all enemy meshes in the Three.js scene.
 *
 * Each frame:
 *   1. Check for newly spawned enemies → clone template and add to scene
 *   2. Check for removed enemies → dispose and remove from scene
 *   3. Call updateEnemyMeshes() to sync positions from ECS
 */
export function EnemyRenderer() {
  const { scene } = useThree();
  const spawnedRef = useRef<Map<string, THREE.Group>>(new Map());

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const spawned = spawnedRef.current;
      for (const [, mesh] of spawned) {
        scene.remove(mesh);
        disposeMeshGroup(mesh);
      }
      spawned.clear();
    };
  }, [scene]);

  useFrame(() => {
    const spawned = spawnedRef.current;

    // --- Collect current enemy IDs from ECS ---
    const currentEnemyIds = new Set<string>();
    for (const entity of world.entities) {
      if (!entity.enemy || !entity.id || !entity.type) continue;
      if (!ENEMY_TYPES.has(entity.type)) continue;
      currentEnemyIds.add(entity.id);

      // Spawn mesh for new enemies
      if (!spawned.has(entity.id)) {
        spawnEnemyMesh(entity, scene, spawned);
      }
    }

    // --- Remove meshes for dead/removed enemies ---
    for (const [id, mesh] of spawned) {
      if (!currentEnemyIds.has(id)) {
        scene.remove(mesh);
        disposeMeshGroup(mesh);
        spawned.delete(id);
      }
    }

    // --- Position/rotation sync ---
    updateEnemyMeshes(scene);
  });

  // No JSX output — all meshes are managed imperatively
  return null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Clone a template and add it to the scene for the given enemy entity.
 */
function spawnEnemyMesh(
  entity: Entity,
  scene: THREE.Scene,
  spawned: Map<string, THREE.Group>,
): void {
  const type = entity.type as string;
  const template = getTemplate(type);
  const mesh = template.clone(true);

  // Deep clone materials so each instance can have independent opacity
  mesh.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material) {
      if (Array.isArray(child.material)) {
        child.material = child.material.map((m: THREE.Material) => m.clone());
      } else {
        child.material = child.material.clone();
      }
    }
  });

  mesh.name = `mesh-enemy-${entity.id}`;
  mesh.userData = {
    ...template.userData,
    entityId: entity.id,
  };

  // Set initial position (negate Z for coordinate system conversion)
  if (entity.position) {
    mesh.position.set(entity.position.x, entity.position.y, -entity.position.z);
  }

  scene.add(mesh);
  spawned.set(entity.id!, mesh);
}

/**
 * Recursively dispose geometries and materials in a group.
 * Shared geometries (capsule, eye) are NOT disposed — they're reused.
 */
function disposeMeshGroup(group: THREE.Group): void {
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      // Don't dispose shared geometry — only per-instance materials
      if (child.material) {
        if (Array.isArray(child.material)) {
          for (const m of child.material) {
            m.dispose();
          }
        } else {
          child.material.dispose();
        }
      }
    }
  });
}
