/**
 * EnemyRenderer — R3F component that manages all enemy meshes imperatively.
 *
 * Uses imperative Three.js API (useEffect + scene.add) to avoid JSX type
 * conflicts with Reactylon's global JSX augmentation.
 *
 * Responsibilities:
 *   - Preload enemy GLB models and animation clips on mount
 *   - Spawn a cloned GLB mesh for each new enemy, falling back to a colored
 *     capsule placeholder if the model is not yet loaded or failed to load
 *   - Drive per-entity AnimationMixer (walk / hit / death states)
 *   - Dispose meshes and mixers for removed enemies
 *   - Sync positions each frame via updateEnemyMeshes()
 */

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three/webgpu';
import { COLORS } from '../../constants';
import type { Entity, EntityType } from '../../game/entities/components';
import { world } from '../../game/entities/world';
import { ENEMY_ANIMATION_ASSETS, ENEMY_MODEL_ASSETS } from '../../game/systems/AssetRegistry';
import {
  cloneModel,
  getAnimationClip,
  isModelLoaded,
  loadAnimationClip,
  loadModels,
} from '../systems/ModelLoader';
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
    emissiveIntensity: 0.15,
    eyeColor: '#ff0000',
    modelKey: 'enemy-goat',
    modelScale: 0.8,
    modelOffsetY: 0,
  },
  hellgoat: {
    color: COLORS.hellgoat,
    scale: 1.2,
    emissiveHex: '#220011',
    emissiveIntensity: 0.2,
    eyeColor: '#ff4400',
    modelKey: 'enemy-hellgoat',
    modelScale: 1.0,
    modelOffsetY: 0,
  },
  fireGoat: {
    color: COLORS.fireGoat,
    scale: 1.0,
    emissiveHex: '#330800',
    emissiveIntensity: 0.25,
    eyeColor: '#ff8800',
    modelKey: 'enemy-fireGoat',
    modelScale: 0.8,
    modelOffsetY: 0,
  },
  shadowGoat: {
    color: COLORS.shadowGoat,
    scale: 0.9,
    emissiveHex: '#080015',
    emissiveIntensity: 0.2,
    eyeColor: '#8888ff',
    baseVisibility: 0.4,
    modelKey: 'enemy-shadowGoat',
    modelScale: 0.7,
    modelOffsetY: 0,
  },
  goatKnight: {
    color: COLORS.goatKnight,
    scale: 1.4,
    emissiveHex: '#111a22',
    emissiveIntensity: 0.1,
    eyeColor: '#4488ff',
    modelKey: 'enemy-goatKnight',
    modelScale: 1.1,
    modelOffsetY: 0,
  },
  plagueGoat: {
    color: COLORS.goat,
    scale: 1.1,
    emissiveHex: '#112200',
    emissiveIntensity: 0.2,
    eyeColor: '#44ff00',
    modelKey: 'enemy-plagueGoat',
    modelScale: 0.9,
    modelOffsetY: 0,
  },
  // Bosses — use boss color at larger scale
  archGoat: {
    color: COLORS.boss,
    scale: 2.0,
    emissiveHex: '#280022',
    emissiveIntensity: 0.3,
    eyeColor: '#cc00ff',
    modelKey: 'enemy-archGoat',
    modelScale: 1.6,
    modelOffsetY: 0,
  },
  infernoGoat: {
    color: COLORS.boss,
    scale: 1.8,
    emissiveHex: '#440800',
    emissiveIntensity: 0.4,
    eyeColor: '#ff4400',
    modelKey: 'enemy-infernoGoat',
    modelScale: 1.4,
    modelOffsetY: 0,
  },
  voidGoat: {
    color: COLORS.boss,
    scale: 1.6,
    emissiveHex: '#100028',
    emissiveIntensity: 0.35,
    eyeColor: '#aa44ff',
    baseVisibility: 0.4,
    modelKey: 'enemy-voidGoat',
    modelScale: 1.2,
    modelOffsetY: 0,
  },
  ironGoat: {
    color: COLORS.boss,
    scale: 2.2,
    emissiveHex: '#1a2233',
    emissiveIntensity: 0.15,
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
  'plagueGoat',
  'archGoat',
  'infernoGoat',
  'voidGoat',
  'ironGoat',
]);

// ---------------------------------------------------------------------------
// Animation state machine
// ---------------------------------------------------------------------------

type AnimState = 'walk' | 'hit' | 'death';

interface EnemyAnimator {
  mixer: THREE.AnimationMixer;
  actions: Partial<Record<AnimState, THREE.AnimationAction>>;
  currentState: AnimState | null;
}

/** Derive desired animation state from ECS entity data. */
function getDesiredAnimState(entity: Entity): AnimState {
  if (!entity.enemy) return 'walk';
  if (entity.enemy.hp <= 0) return 'death';
  if ((entity.enemy.staggerTimer ?? 0) > 0) return 'hit';
  return 'walk';
}

/**
 * Transition the animator to a new state, crossfading from the previous action.
 * One-shot states (hit, death) play once and clamp; walk loops continuously.
 */
function transitionAnimState(anim: EnemyAnimator, next: AnimState): void {
  if (anim.currentState === next) return;

  const prevAction = anim.currentState ? anim.actions[anim.currentState] : undefined;
  const nextAction = anim.actions[next];
  if (!nextAction) return;

  anim.currentState = next;

  if (next === 'death' || next === 'hit') {
    nextAction.clampWhenFinished = true;
    nextAction.loop = THREE.LoopOnce;
    nextAction.reset().play();
    if (prevAction && prevAction !== nextAction) prevAction.crossFadeTo(nextAction, 0.2, true);
  } else {
    // walk — loop
    nextAction.loop = THREE.LoopRepeat;
    nextAction.reset().play();
    if (prevAction && prevAction !== nextAction) prevAction.crossFadeTo(nextAction, 0.3, true);
  }
}

/**
 * Async: load animation clips for a model key, attach them to a mixer,
 * and return the animator. If a clip fails to load it's simply omitted.
 */
async function createAnimator(mesh: THREE.Group, modelKey: string): Promise<EnemyAnimator | null> {
  const animDefs = ENEMY_ANIMATION_ASSETS[modelKey as keyof typeof ENEMY_ANIMATION_ASSETS];
  if (!animDefs) return null;

  // Load all clips concurrently
  const roles: AnimState[] = ['walk', 'hit', 'death'];
  await Promise.all(
    roles.map((role) => {
      const subpath = (animDefs as Record<string, string>)[role];
      if (subpath == null) return Promise.resolve(null);
      return loadAnimationClip(`${modelKey}:${role}`, subpath);
    }),
  );

  const mixer = new THREE.AnimationMixer(mesh);
  const actions: Partial<Record<AnimState, THREE.AnimationAction>> = {};

  for (const role of roles) {
    const clip = getAnimationClip(`${modelKey}:${role}`);
    if (clip) {
      actions[role] = mixer.clipAction(clip);
    }
  }

  // Start walk immediately (looping)
  const walkAction = actions.walk;
  if (walkAction) {
    walkAction.loop = THREE.LoopRepeat;
    walkAction.play();
  }

  return { mixer, actions, currentState: walkAction ? 'walk' : null };
}

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
          mat.needsUpdate = true;
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
 *   3. Update all AnimationMixers (walk/hit/death state machine)
 *   4. Call updateEnemyMeshes() to sync positions from ECS
 */
export function EnemyRenderer() {
  const { scene } = useThree();
  const spawnedRef = useRef<Map<string, THREE.Group>>(new Map());
  const animatorsRef = useRef<Map<string, EnemyAnimator>>(new Map());
  const modelsLoadedRef = useRef(false);
  /** Set of entity IDs that have already been upgraded from fallback→GLB. */
  const upgradedRef = useRef<Set<string>>(new Set());
  /** Once all current fallbacks have been upgraded, skip the check entirely. */
  const allUpgradedRef = useRef(false);

  // Kick off model loading on mount
  useEffect(() => {
    let cancelled = false;

    const entries = Object.entries(ENEMY_MODEL_ASSETS) as [string, string][];
    loadModels(entries).then(() => {
      if (!cancelled) {
        modelsLoadedRef.current = true;
        allUpgradedRef.current = false;
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
      // Stop all mixers
      for (const [, anim] of animatorsRef.current) {
        anim.mixer.stopAllAction();
      }
      animatorsRef.current.clear();
    };
  }, [scene]);

  useFrame((_, delta) => {
    const spawned = spawnedRef.current;
    const animators = animatorsRef.current;

    // --- Collect current enemy IDs from ECS ---
    const currentEnemyIds = new Set<string>();
    for (const entity of world.entities) {
      if (!entity.enemy || !entity.id || !entity.type) continue;
      if (!ENEMY_TYPES.has(entity.type)) continue;
      currentEnemyIds.add(entity.id);

      // Spawn mesh for new enemies
      if (!spawned.has(entity.id)) {
        spawnEnemyMesh(entity, scene, spawned, animators, modelsLoadedRef.current);
        // If a fallback capsule was created after models loaded, resume upgrade checks
        const justSpawned = spawned.get(entity.id);
        if (modelsLoadedRef.current && justSpawned && !justSpawned.userData.isGlb) {
          allUpgradedRef.current = false;
        }
      }

      // If models just finished loading, upgrade any fallback capsules to GLB.
      if (modelsLoadedRef.current && !allUpgradedRef.current) {
        const existing = spawned.get(entity.id);
        if (existing && !existing.userData.isGlb && !upgradedRef.current.has(entity.id!)) {
          const type = entity.type as string;
          const config = ENEMY_CONFIGS[type] || ENEMY_CONFIGS.goat;
          if (isModelLoaded(config.modelKey)) {
            scene.remove(existing);
            disposeMeshGroup(existing);
            spawned.delete(entity.id);
            // Dispose old animator if any
            const oldAnim = animators.get(entity.id!);
            if (oldAnim) {
              oldAnim.mixer.stopAllAction();
              animators.delete(entity.id!);
            }
            spawnEnemyMesh(entity, scene, spawned, animators, true);
            upgradedRef.current.add(entity.id!);
          }
        }
      }

      // Drive animation state for this entity
      const anim = animators.get(entity.id!);
      if (anim) {
        const desired = getDesiredAnimState(entity);
        transitionAnimState(anim, desired);
      }
    }

    // Check if all current fallbacks have been upgraded
    if (modelsLoadedRef.current && !allUpgradedRef.current) {
      let hasFallbacks = false;
      for (const [, mesh] of spawned) {
        if (!mesh.userData.isGlb) {
          hasFallbacks = true;
          break;
        }
      }
      if (!hasFallbacks) {
        allUpgradedRef.current = true;
      }
    }

    // --- Remove meshes for dead/removed enemies ---
    for (const [id, mesh] of spawned) {
      if (!currentEnemyIds.has(id)) {
        scene.remove(mesh);
        disposeMeshGroup(mesh);
        spawned.delete(id);
        upgradedRef.current.delete(id);
        // Dispose animator
        const anim = animators.get(id);
        if (anim) {
          anim.mixer.stopAllAction();
          animators.delete(id);
        }
      }
    }

    // --- Update all AnimationMixers ---
    for (const [, anim] of animators) {
      anim.mixer.update(delta);
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
 * For GLB meshes, also kicks off async animation loading.
 */
function spawnEnemyMesh(
  entity: Entity,
  scene: THREE.Scene,
  spawned: Map<string, THREE.Group>,
  animators: Map<string, EnemyAnimator>,
  modelsLoaded: boolean,
): void {
  const type = entity.type as string;

  let mesh: THREE.Group;
  let isGlb = false;

  // Try GLB model first
  if (modelsLoaded) {
    const glbMesh = buildGlbEnemyMesh(type);
    if (glbMesh) {
      mesh = glbMesh;
      isGlb = true;
    } else {
      const template = getFallbackTemplate(type);
      mesh = cloneFallbackTemplate(template);
    }
  } else {
    const template = getFallbackTemplate(type);
    mesh = cloneFallbackTemplate(template);
  }

  mesh.name = `mesh-enemy-${entity.id}`;
  mesh.userData = { ...mesh.userData, entityId: entity.id };

  if (entity.position) {
    mesh.position.set(entity.position.x, entity.position.y, -entity.position.z);
  }

  scene.add(mesh);
  spawned.set(entity.id!, mesh);

  // Kick off animation loading for GLB models
  if (isGlb && entity.id) {
    const config = ENEMY_CONFIGS[type] || ENEMY_CONFIGS.goat;
    const modelKey = config.modelKey;
    const entityId = entity.id;
    createAnimator(mesh, modelKey).then((anim) => {
      if (anim && spawned.has(entityId)) {
        animators.set(entityId, anim);
      }
    });
  }
}

/**
 * Clone a fallback capsule template with independent materials.
 */
function cloneFallbackTemplate(template: THREE.Group): THREE.Group {
  const mesh = template.clone(true);

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
