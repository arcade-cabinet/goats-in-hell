/**
 * EnemyRenderer — R3F component that manages all enemy meshes imperatively.
 *
 * Uses imperative Three.js API (useEffect + scene.add) to avoid JSX type
 * conflicts with Reactylon's global JSX augmentation.
 *
 * Responsibilities:
 *   - Preload enemy GLB models on mount
 *   - Spawn a cloned GLB mesh for each new enemy, falling back to a colored
 *     capsule placeholder if the model is not yet loaded or failed to load
 *   - Dispose meshes for removed enemies
 *   - Sync positions each frame via updateEnemyMeshes()
 */

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { COLORS } from '../../constants';
import type { Entity, EntityType } from '../../game/entities/components';
import { world } from '../../game/entities/world';
import { ENEMY_MODEL_ASSETS } from '../../game/systems/AssetRegistry';
import { cloneModel, isModelLoaded, loadModels } from '../systems/ModelLoader';
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
  /** Asset key in ENEMY_MODEL_ASSETS, e.g. 'enemy-goat' */
  modelKey: string;
  /** Scale multiplier applied to the GLB model to match capsule dimensions */
  modelScale: number;
  /** Vertical offset for the GLB model so feet touch the ground */
  modelOffsetY: number;
}

const ENEMY_CONFIGS: Record<string, EnemyMeshConfig> = {
  goat: {
    color: COLORS.goat,
    scale: 1.0,
    emissiveHex: '#440000',
    emissiveIntensity: 0.2,
    eyeColor: '#ff0000',
    modelKey: 'enemy-goat',
    modelScale: 0.8,
    modelOffsetY: 0,
  },
  hellgoat: {
    color: COLORS.hellgoat,
    scale: 1.2,
    emissiveHex: '#662200',
    emissiveIntensity: 0.35,
    eyeColor: '#ff4400',
    modelKey: 'enemy-hellgoat',
    modelScale: 1.0,
    modelOffsetY: 0,
  },
  fireGoat: {
    color: COLORS.fireGoat,
    scale: 1.0,
    emissiveHex: '#663300',
    emissiveIntensity: 0.4,
    eyeColor: '#ff8800',
    modelKey: 'enemy-fireGoat',
    modelScale: 0.8,
    modelOffsetY: 0,
  },
  shadowGoat: {
    color: COLORS.shadowGoat,
    scale: 0.9,
    emissiveHex: '#110033',
    emissiveIntensity: 0.3,
    eyeColor: '#8888ff',
    baseVisibility: 0.4,
    modelKey: 'enemy-shadowGoat',
    modelScale: 0.7,
    modelOffsetY: 0,
  },
  goatKnight: {
    color: COLORS.goatKnight,
    scale: 1.4,
    emissiveHex: '#223344',
    emissiveIntensity: 0.15,
    eyeColor: '#4488ff',
    modelKey: 'enemy-goatKnight',
    modelScale: 1.1,
    modelOffsetY: 0,
  },
  // Bosses — use boss color at larger scale
  archGoat: {
    color: COLORS.boss,
    scale: 2.0,
    emissiveHex: '#550044',
    emissiveIntensity: 0.4,
    eyeColor: '#cc00ff',
    modelKey: 'enemy-archGoat',
    modelScale: 1.6,
    modelOffsetY: 0,
  },
  infernoGoat: {
    color: COLORS.boss,
    scale: 1.8,
    emissiveHex: '#882200',
    emissiveIntensity: 0.6,
    eyeColor: '#ff4400',
    modelKey: 'enemy-infernoGoat',
    modelScale: 1.4,
    modelOffsetY: 0,
  },
  voidGoat: {
    color: COLORS.boss,
    scale: 1.6,
    emissiveHex: '#220055',
    emissiveIntensity: 0.5,
    eyeColor: '#aa44ff',
    baseVisibility: 0.4,
    modelKey: 'enemy-voidGoat',
    modelScale: 1.2,
    modelOffsetY: 0,
  },
  ironGoat: {
    color: COLORS.boss,
    scale: 2.2,
    emissiveHex: '#334455',
    emissiveIntensity: 0.25,
    eyeColor: '#4488ff',
    modelKey: 'enemy-ironGoat',
    modelScale: 1.8,
    modelOffsetY: 0,
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
// Template cache — fallback capsule meshes (used when GLB not loaded)
// ---------------------------------------------------------------------------

/** Cached fallback template meshes (capsule geometry + emissive eyes), keyed by enemy type. */
const fallbackTemplateCache = new Map<string, THREE.Group>();

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
 * Build a fallback capsule template Group for the given enemy type.
 * Consists of a capsule body + two emissive eye spheres.
 */
function buildFallbackTemplate(type: string): THREE.Group {
  const config = ENEMY_CONFIGS[type] || ENEMY_CONFIGS.goat;
  const group = new THREE.Group();
  group.name = `template-enemy-fallback-${type}`;

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
  group.userData = { enemyType: type, baseScale: config.scale, isGlb: false };

  return group;
}

/**
 * Get or create a fallback capsule template for the given enemy type.
 */
function getFallbackTemplate(type: string): THREE.Group {
  let template = fallbackTemplateCache.get(type);
  if (!template) {
    template = buildFallbackTemplate(type);
    fallbackTemplateCache.set(type, template);
  }
  return template;
}

// ---------------------------------------------------------------------------
// GLB model template builder
// ---------------------------------------------------------------------------

/**
 * Build a GLB-based template for the given enemy type by cloning the
 * loaded model and applying enemy-specific material tinting/emissive.
 */
function buildGlbEnemyMesh(type: string): THREE.Group | null {
  const config = ENEMY_CONFIGS[type] || ENEMY_CONFIGS.goat;

  const cloned = cloneModel(config.modelKey);
  if (!cloned) return null;

  const group = new THREE.Group();
  group.name = `template-enemy-glb-${type}`;

  // Normalize model: compute bounding box, center on origin, scale to match
  // capsule dimensions (~1.4 units tall at scale 1.0)
  const box = new THREE.Box3().setFromObject(cloned);
  const size = new THREE.Vector3();
  box.getSize(size);
  const center = new THREE.Vector3();
  box.getCenter(center);

  // Target height for scale 1.0 is ~1.4 units (matching capsule)
  const targetHeight = 1.4;
  const heightScale = size.y > 0 ? targetHeight / size.y : 1;
  const uniformScale = heightScale * config.modelScale;

  cloned.scale.setScalar(uniformScale);

  // Shift so feet touch y=0
  // After scaling, the bottom of the model should be at y=0
  const scaledBottom = center.y * uniformScale - (size.y * uniformScale) / 2;
  cloned.position.y = -scaledBottom + config.modelOffsetY;

  // Center horizontally
  cloned.position.x = -center.x * uniformScale;
  cloned.position.z = -center.z * uniformScale;

  // Apply emissive tinting to all materials
  cloned.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material) {
      const applyTint = (mat: THREE.Material) => {
        if (
          mat instanceof THREE.MeshStandardMaterial ||
          mat instanceof THREE.MeshPhysicalMaterial
        ) {
          mat.emissive = new THREE.Color(config.emissiveHex);
          mat.emissiveIntensity = config.emissiveIntensity;
          if (config.baseVisibility !== undefined && config.baseVisibility < 1) {
            mat.transparent = true;
            mat.opacity = config.baseVisibility;
          }
        }
      };
      if (Array.isArray(child.material)) {
        for (const m of child.material) applyTint(m);
      } else {
        applyTint(child.material);
      }
    }
  });

  group.add(cloned);
  group.userData = {
    enemyType: type,
    baseScale: 1.0, // Scale already applied inside model
    isGlb: true,
  };

  return group;
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

/**
 * EnemyRenderer — manages all enemy meshes in the Three.js scene.
 *
 * On mount, kicks off async loading of all enemy GLB models.
 * Each frame:
 *   1. Check for newly spawned enemies -> clone GLB model (or fallback capsule)
 *   2. Check for removed enemies -> dispose and remove from scene
 *   3. Call updateEnemyMeshes() to sync positions from ECS
 */
export function EnemyRenderer() {
  const { scene } = useThree();
  const spawnedRef = useRef<Map<string, THREE.Group>>(new Map());
  const modelsLoadedRef = useRef(false);

  // Kick off model loading on mount
  useEffect(() => {
    let cancelled = false;

    const entries = Object.entries(ENEMY_MODEL_ASSETS) as [string, number][];
    loadModels(entries).then(() => {
      if (!cancelled) {
        modelsLoadedRef.current = true;
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

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
        spawnEnemyMesh(entity, scene, spawned, modelsLoadedRef.current);
      }

      // If models just finished loading, upgrade any fallback capsules to GLB
      if (modelsLoadedRef.current) {
        const existing = spawned.get(entity.id);
        if (existing && !existing.userData.isGlb) {
          const type = entity.type as string;
          const config = ENEMY_CONFIGS[type] || ENEMY_CONFIGS.goat;
          if (isModelLoaded(config.modelKey)) {
            // Replace fallback with GLB
            scene.remove(existing);
            disposeMeshGroup(existing);
            spawned.delete(entity.id);
            spawnEnemyMesh(entity, scene, spawned, true);
          }
        }
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
    updateEnemyMeshes(spawned);
  });

  // No JSX output — all meshes are managed imperatively
  return null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Clone a template (GLB or fallback) and add it to the scene for the given enemy entity.
 */
function spawnEnemyMesh(
  entity: Entity,
  scene: THREE.Scene,
  spawned: Map<string, THREE.Group>,
  modelsLoaded: boolean,
): void {
  const type = entity.type as string;

  let mesh: THREE.Group;

  // Try GLB model first
  if (modelsLoaded) {
    const glbMesh = buildGlbEnemyMesh(type);
    if (glbMesh) {
      mesh = glbMesh;
    } else {
      // Model failed to load — use fallback capsule
      const template = getFallbackTemplate(type);
      mesh = cloneFallbackTemplate(template);
    }
  } else {
    // Models still loading — use fallback capsule
    const template = getFallbackTemplate(type);
    mesh = cloneFallbackTemplate(template);
  }

  mesh.name = `mesh-enemy-${entity.id}`;
  mesh.userData = {
    ...mesh.userData,
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
 * Clone a fallback capsule template with independent materials.
 */
function cloneFallbackTemplate(template: THREE.Group): THREE.Group {
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

  return mesh;
}

/**
 * Recursively dispose geometries and materials in a group.
 * Shared geometries (capsule, eye) are NOT disposed — they're reused.
 */
function disposeMeshGroup(group: THREE.Group): void {
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      // Dispose geometry only for GLB models (not shared capsule/eye geometries)
      if (group.userData.isGlb && child.geometry) {
        child.geometry.dispose();
      }
      // Always dispose per-instance materials
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
