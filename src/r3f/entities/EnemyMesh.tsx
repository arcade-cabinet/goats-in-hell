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
import { MeshStandardMaterial as _BaseMat, Mesh as _Mesh } from 'three';
import * as THREE from 'three/webgpu';
import { COLORS } from '../../constants';
import type { Entity, EntityType } from '../../game/entities/components';
import { world } from '../../game/entities/world';
import { ENEMY_ANIMATION_ASSETS, ENEMY_MODEL_ASSETS } from '../../game/systems/AssetRegistry';
import {
  cloneModel,
  getAnimationClip,
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
  shaman: {
    color: '#3d1a66',
    scale: 1.0,
    emissiveHex: '#1a0033',
    emissiveIntensity: 0.3,
    eyeColor: '#cc44ff',
    modelKey: 'enemy-shaman',
    modelScale: 0.85,
    modelOffsetY: 0,
  },
  // Circle-specific enemies
  siren: {
    color: '#661a44',
    scale: 0.9,
    emissiveHex: '#330011',
    emissiveIntensity: 0.25,
    eyeColor: '#ff44aa',
    modelKey: 'enemy-siren',
    modelScale: 0.8,
    modelOffsetY: 0,
  },
  glutton: {
    color: '#2a4400',
    scale: 1.3,
    emissiveHex: '#0a1a00',
    emissiveIntensity: 0.2,
    eyeColor: '#66ff00',
    modelKey: 'enemy-glutton',
    modelScale: 1.0,
    modelOffsetY: 0,
  },
  hoarder: {
    color: '#665500',
    scale: 1.1,
    emissiveHex: '#332200',
    emissiveIntensity: 0.15,
    eyeColor: '#ffcc00',
    modelKey: 'enemy-hoarder',
    modelScale: 0.9,
    modelOffsetY: 0,
  },
  berserker: {
    color: '#660000',
    scale: 1.1,
    emissiveHex: '#330000',
    emissiveIntensity: 0.35,
    eyeColor: '#ff2200',
    modelKey: 'enemy-berserker',
    modelScale: 0.9,
    modelOffsetY: 0,
  },
  heretic: {
    color: '#1a1a44',
    scale: 1.0,
    emissiveHex: '#0a0a22',
    emissiveIntensity: 0.3,
    eyeColor: '#8888ff',
    modelKey: 'enemy-heretic',
    modelScale: 0.85,
    modelOffsetY: 0,
  },
  butcher: {
    color: '#440000',
    scale: 1.3,
    emissiveHex: '#220000',
    emissiveIntensity: 0.2,
    eyeColor: '#cc0000',
    modelKey: 'enemy-butcher',
    modelScale: 1.05,
    modelOffsetY: 0,
  },
  mimic: {
    color: '#002244',
    scale: 1.0,
    emissiveHex: '#000a22',
    emissiveIntensity: 0.25,
    eyeColor: '#00aaff',
    modelKey: 'enemy-mimic',
    modelScale: 0.85,
    modelOffsetY: 0,
  },
  frost: {
    color: '#001a44',
    scale: 1.1,
    emissiveHex: '#000a22',
    emissiveIntensity: 0.3,
    eyeColor: '#44ddff',
    modelKey: 'enemy-frost',
    modelScale: 0.9,
    modelOffsetY: 0,
  },
  // ── Limbo whelp/elder — spectral grey palette ──────────────────────────────
  shadeWhelp: {
    color: '#8888aa',
    scale: 0.65,
    emissiveHex: '#111122',
    emissiveIntensity: 0.2,
    eyeColor: '#aabbff',
    modelKey: 'enemy-shadeWhelp',
    modelScale: 0.55,
    modelOffsetY: 0,
  },
  shadeElder: {
    color: '#aaaacc',
    scale: 1.7,
    emissiveHex: '#222244',
    emissiveIntensity: 0.35,
    eyeColor: '#cce0ff',
    modelKey: 'enemy-shadeElder',
    modelScale: 1.35,
    modelOffsetY: 0,
  },
  // ── Lust whelp/elder — rose-crimson palette ─────────────────────────────────
  sirenWhelp: {
    color: '#882244',
    scale: 0.7,
    emissiveHex: '#330011',
    emissiveIntensity: 0.2,
    eyeColor: '#dd88aa',
    modelKey: 'enemy-sirenWhelp',
    modelScale: 0.6,
    modelOffsetY: 0,
  },
  sirenElder: {
    color: '#440022',
    scale: 1.55,
    emissiveHex: '#220011',
    emissiveIntensity: 0.4,
    eyeColor: '#ff00aa',
    modelKey: 'enemy-sirenElder',
    modelScale: 1.25,
    modelOffsetY: 0,
  },
  // ── Gluttony whelp/elder — filth brown-green palette ───────────────────────
  gluttonWhelp: {
    color: '#445533',
    scale: 0.7,
    emissiveHex: '#111500',
    emissiveIntensity: 0.1,
    eyeColor: '#88aa44',
    modelKey: 'enemy-gluttonWhelp',
    modelScale: 0.55,
    modelOffsetY: 0,
  },
  gluttonElder: {
    color: '#334422',
    scale: 1.75,
    emissiveHex: '#0a1200',
    emissiveIntensity: 0.25,
    eyeColor: '#aadd00',
    modelKey: 'enemy-gluttonElder',
    modelScale: 1.4,
    modelOffsetY: 0,
  },
  // ── Greed whelp/elder — tarnished gold palette ──────────────────────────────
  hoarderWhelp: {
    color: '#554400',
    scale: 0.7,
    emissiveHex: '#221a00',
    emissiveIntensity: 0.1,
    eyeColor: '#ccaa22',
    modelKey: 'enemy-hoarderWhelp',
    modelScale: 0.6,
    modelOffsetY: 0,
  },
  hoarderElder: {
    color: '#886600',
    scale: 1.6,
    emissiveHex: '#442200',
    emissiveIntensity: 0.3,
    eyeColor: '#ffdd00',
    modelKey: 'enemy-hoarderElder',
    modelScale: 1.3,
    modelOffsetY: 0,
  },
  // ── Wrath whelp/elder — scorched orange-black palette ──────────────────────
  berserkerWhelp: {
    color: '#661100',
    scale: 0.75,
    emissiveHex: '#330800',
    emissiveIntensity: 0.3,
    eyeColor: '#ff6600',
    modelKey: 'enemy-berserkerWhelp',
    modelScale: 0.6,
    modelOffsetY: 0,
  },
  berserkerElder: {
    color: '#331100',
    scale: 1.65,
    emissiveHex: '#441100',
    emissiveIntensity: 0.5,
    eyeColor: '#ff8800',
    modelKey: 'enemy-berserkerElder',
    modelScale: 1.3,
    modelOffsetY: 0,
  },
  // ── Heresy whelp/elder — void-blue flame palette ────────────────────────────
  hereticWhelp: {
    color: '#1a1a55',
    scale: 0.7,
    emissiveHex: '#0a0a2a',
    emissiveIntensity: 0.25,
    eyeColor: '#6666dd',
    modelKey: 'enemy-hereticWhelp',
    modelScale: 0.6,
    modelOffsetY: 0,
  },
  hereticElder: {
    color: '#110011',
    scale: 1.6,
    emissiveHex: '#110011',
    emissiveIntensity: 0.5,
    eyeColor: '#ff8800',
    modelKey: 'enemy-hereticElder',
    modelScale: 1.25,
    modelOffsetY: 0,
  },
  // ── Violence whelp/elder — blood-iron palette ────────────────────────────────
  butcherWhelp: {
    color: '#550000',
    scale: 0.75,
    emissiveHex: '#220000',
    emissiveIntensity: 0.2,
    eyeColor: '#ff4422',
    modelKey: 'enemy-butcherWhelp',
    modelScale: 0.6,
    modelOffsetY: 0,
  },
  butcherElder: {
    color: '#220000',
    scale: 1.75,
    emissiveHex: '#330000',
    emissiveIntensity: 0.3,
    eyeColor: '#aa0000',
    modelKey: 'enemy-butcherElder',
    modelScale: 1.4,
    modelOffsetY: 0,
  },
  // ── Fraud whelp/elder — void-black iridescent palette ───────────────────────
  mimicWhelp: {
    color: '#003355',
    scale: 0.7,
    emissiveHex: '#001122',
    emissiveIntensity: 0.2,
    eyeColor: '#55aaff',
    modelKey: 'enemy-mimicWhelp',
    modelScale: 0.6,
    modelOffsetY: 0,
  },
  mimicElder: {
    color: '#001122',
    scale: 1.55,
    emissiveHex: '#000a1a',
    emissiveIntensity: 0.4,
    eyeColor: '#00ffff',
    modelKey: 'enemy-mimicElder',
    modelScale: 1.25,
    modelOffsetY: 0,
  },
  // ── Treachery whelp/elder — Cocytus ice palette ─────────────────────────────
  frostWhelp: {
    color: '#2244aa',
    scale: 0.7,
    emissiveHex: '#0a1a44',
    emissiveIntensity: 0.25,
    eyeColor: '#88bbff',
    modelKey: 'enemy-frostWhelp',
    modelScale: 0.6,
    modelOffsetY: 0,
  },
  frostElder: {
    color: '#001166',
    scale: 1.7,
    emissiveHex: '#000a33',
    emissiveIntensity: 0.45,
    eyeColor: '#00bbff',
    modelKey: 'enemy-frostElder',
    modelScale: 1.35,
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
  'shaman',
  // Circle 1: Limbo
  'shadeWhelp',
  'shadeElder',
  // Circle 2: Lust
  'sirenWhelp',
  'siren',
  'sirenElder',
  // Circle 3: Gluttony
  'gluttonWhelp',
  'glutton',
  'gluttonElder',
  // Circle 4: Greed
  'hoarderWhelp',
  'hoarder',
  'hoarderElder',
  // Circle 5: Wrath
  'berserkerWhelp',
  'berserker',
  'berserkerElder',
  // Circle 6: Heresy
  'hereticWhelp',
  'heretic',
  'hereticElder',
  // Circle 7: Violence
  'butcherWhelp',
  'butcher',
  'butcherElder',
  // Circle 8: Fraud
  'mimicWhelp',
  'mimic',
  'mimicElder',
  // Circle 9: Treachery
  'frostWhelp',
  'frost',
  'frostElder',
  // Bosses
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
// GLB model template builder
// ---------------------------------------------------------------------------

/**
 * Build a GLB-based mesh for the given enemy type by cloning the loaded model,
 * correcting Meshy's Z-up export orientation, sanitizing material artifacts,
 * and applying enemy-specific emissive tinting.
 *
 * Returns null if the model key has no registered GLB or clone fails — callers
 * must treat null as a hard error and NOT fall back to a capsule placeholder.
 */
function buildGlbEnemyMesh(type: string): THREE.Group | null {
  const config = ENEMY_CONFIGS[type] || ENEMY_CONFIGS.goat;

  const cloned = cloneModel(config.modelKey);
  if (!cloned) return null;

  const group = new THREE.Group();
  group.name = `template-enemy-glb-${type}`;

  // --- Fix Meshy Z-up exports (model lies flat on XZ plane) ---
  // Meshy exports characters with the body along the Z axis rather than Y.
  // In Three.js (Y-up), this makes them appear as a flat disc on the floor.
  // Detect: if Z or X extent is significantly larger than Y, rotate -90° on X
  // so the model's Z axis becomes Three.js Y (upright).
  {
    const box0 = new THREE.Box3().setFromObject(cloned);
    const sz = new THREE.Vector3();
    box0.getSize(sz);
    if (sz.z > sz.y || sz.x > sz.y) {
      cloned.rotateX(-Math.PI / 2);
      cloned.updateMatrixWorld(true);
    }
  }

  // --- Normalize: compute bounding box, center on origin, scale to ~1.4 units tall ---
  const box = new THREE.Box3().setFromObject(cloned);
  const size = new THREE.Vector3();
  box.getSize(size);
  const center = new THREE.Vector3();
  box.getCenter(center);

  const targetHeight = 1.4;
  const heightScale = size.y > 0 ? targetHeight / size.y : 1;
  const uniformScale = heightScale * config.modelScale;

  cloned.scale.multiplyScalar(uniformScale);

  // Shift so feet touch y=0
  const scaledBottom = center.y * uniformScale - (size.y * uniformScale) / 2;
  cloned.position.y += -scaledBottom + config.modelOffsetY;

  // Center horizontally
  cloned.position.x += -center.x * uniformScale;
  cloned.position.z += -center.z * uniformScale;

  // --- Apply material overrides and shadow casting ---
  // three/webgpu and three ship as SEPARATE compiled bundles. GLTFLoader imports
  // from 'three' (three.module.js), while our code imports from 'three/webgpu'
  // (three.webgpu.js). Both bundles inline their own Mesh and MeshStandardMaterial
  // class definitions, so instanceof THREE.Mesh fails for GLTF-loaded objects.
  // Fix: import Mesh and MeshStandardMaterial from 'three' directly (_Mesh, _BaseMat)
  // so the class reference matches what GLTFLoader used to construct the objects.
  cloned.traverse((child) => {
    if (!(child instanceof _Mesh)) return;
    child.castShadow = true;
    child.receiveShadow = true;

    const buildMat = () => {
      // Create a fresh MeshStandardMaterial — completely bypasses Meshy artifacts.
      const m = new _BaseMat({
        color: 0x1a1a1a,
        emissive: new THREE.Color(config.emissiveHex),
        emissiveIntensity: config.emissiveIntensity,
        metalness: 0.4,
        roughness: 0.7,
      });
      if (config.baseVisibility !== undefined && config.baseVisibility < 1) {
        m.transparent = true;
        m.opacity = config.baseVisibility;
      }
      return m;
    };

    if (Array.isArray(child.material)) {
      child.material = child.material.map(() => buildMat());
    } else {
      child.material = buildMat();
    }
  });

  group.add(cloned);
  group.userData = { enemyType: type, baseScale: 1.0, isGlb: true };

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

  // Kick off model loading on mount
  useEffect(() => {
    let cancelled = false;
    const entries = Object.entries(ENEMY_MODEL_ASSETS) as [string, string][];
    loadModels(entries).then(() => {
      if (!cancelled) modelsLoadedRef.current = true;
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

      // Spawn mesh for new enemies (no-op if models not ready yet)
      if (!spawned.has(entity.id)) {
        spawnEnemyMesh(entity, scene, spawned, animators, modelsLoadedRef.current);
      }

      // Drive animation state
      const anim = animators.get(entity.id!);
      if (anim) {
        transitionAnimState(anim, getDesiredAnimState(entity));
      }
    }

    // --- Remove meshes for dead/removed enemies ---
    for (const [id, mesh] of spawned) {
      if (!currentEnemyIds.has(id)) {
        scene.remove(mesh);
        disposeMeshGroup(mesh);
        spawned.delete(id);
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

  return null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build and add a GLB mesh for the given enemy entity.
 * Does NOT fall back to a capsule — if the model is unavailable or not yet
 * loaded, the enemy gets no mesh and an error is logged. No silent fallbacks.
 */
function spawnEnemyMesh(
  entity: Entity,
  scene: THREE.Scene,
  spawned: Map<string, THREE.Group>,
  animators: Map<string, EnemyAnimator>,
  modelsLoaded: boolean,
): void {
  // Models not loaded yet — skip silently, retry next frame
  if (!modelsLoaded) return;

  const type = entity.type as string;
  const glbMesh = buildGlbEnemyMesh(type);

  if (!glbMesh) {
    console.error(
      `[EnemyMesh] No GLB loaded for enemy type "${type}" (modelKey: ${ENEMY_CONFIGS[type]?.modelKey ?? 'unknown'})`,
    );
    return;
  }

  glbMesh.name = `mesh-enemy-${entity.id}`;
  glbMesh.userData = { ...glbMesh.userData, entityId: entity.id };

  if (entity.position) {
    glbMesh.position.set(entity.position.x, entity.position.y, -entity.position.z);
  }

  scene.add(glbMesh);
  spawned.set(entity.id!, glbMesh);

  // Kick off animation loading
  if (entity.id) {
    const config = ENEMY_CONFIGS[type] || ENEMY_CONFIGS.goat;
    const entityId = entity.id;
    createAnimator(glbMesh, config.modelKey).then((anim) => {
      if (anim && spawned.has(entityId)) {
        animators.set(entityId, anim);
      }
    });
  }
}

/**
 * Recursively dispose materials in a GLB group.
 * Geometry is shared via cloneModel() skeleton clone — do NOT dispose it here.
 */
function disposeMeshGroup(group: THREE.Group): void {
  group.traverse((child) => {
    if (child instanceof _Mesh && child.material) {
      if (Array.isArray(child.material)) {
        for (const m of child.material) m.dispose();
      } else {
        child.material.dispose();
      }
    }
  });
}
