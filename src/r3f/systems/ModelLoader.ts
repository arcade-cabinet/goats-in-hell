/**
 * GLB model loading utility for R3F.
 *
 * Resolves asset subpaths to URLs via `getAssetUrl()` and loads GLB
 * files using Three.js GLTFLoader. Works cross-platform (web + native).
 *
 * Provides a cache of loaded GLTF scenes keyed by asset key, and
 * a `cloneModel()` helper that deep-clones a cached scene for instancing.
 *
 * Usage:
 *   await loadModel('enemy-goat', ENEMY_MODEL_ASSETS['enemy-goat']);
 *   const mesh = cloneModel('enemy-goat'); // THREE.Group or null
 */

import { Mesh as _Mesh, SkinnedMesh as _SkinnedMesh } from 'three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import * as THREE from 'three/webgpu';
import { getAssetUrl } from '../../engine/assetUrl';

// ---------------------------------------------------------------------------
// Singleton loader (with DRACOLoader for Draco-compressed GLBs)
// ---------------------------------------------------------------------------

let gltfLoader: GLTFLoader | null = null;

function getLoader(): GLTFLoader {
  if (!gltfLoader) {
    gltfLoader = new GLTFLoader();
    // DRACOLoader handles KHR_draco_mesh_compression extension (boss GLBs).
    // Uses the standard Google CDN decoder path (same as @react-three/drei default).
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    gltfLoader.setDRACOLoader(dracoLoader);
  }
  return gltfLoader;
}

// ---------------------------------------------------------------------------
// Cache: loaded GLTF scene templates keyed by asset key
// ---------------------------------------------------------------------------

const modelCache = new Map<string, THREE.Group>();
const loadingPromises = new Map<string, Promise<THREE.Group | null>>();
const failedModels = new Set<string>();

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

/**
 * Load a single GLB model and cache the result.
 * Returns the cached Group, or null if loading failed.
 *
 * Safe to call multiple times — deduplicates concurrent loads.
 *
 * @param key     Cache key (e.g. 'enemy-goat')
 * @param subpath Asset subpath from AssetRegistry (e.g. 'models/enemies/.../model.glb')
 */
export async function loadModel(key: string, subpath: string): Promise<THREE.Group | null> {
  // Already cached
  if (modelCache.has(key)) {
    return modelCache.get(key)!;
  }

  // Already loading — wait for it
  if (loadingPromises.has(key)) {
    return loadingPromises.get(key)!;
  }

  const promise = (async () => {
    try {
      const uri = getAssetUrl(subpath);
      console.log(`[ModelLoader] Loading "${key}" from:`, uri);
      const loader = getLoader();

      const gltf = await new Promise<{ scene: THREE.Group }>((resolve, reject) => {
        loader.load(
          uri,
          (result) => resolve(result),
          undefined,
          (error) => reject(error),
        );
      });

      const template = gltf.scene;
      template.name = `model-template-${key}`;

      // Ensure all meshes cast shadows
      template.traverse((child) => {
        if (child instanceof _Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      modelCache.set(key, template);
      console.log(`[ModelLoader] Loaded "${key}" — ${template.children.length} children`);
      return template;
    } catch (err) {
      console.error(`[ModelLoader] FAILED to load "${key}":`, err);
      failedModels.add(key);
      return null;
    } finally {
      loadingPromises.delete(key);
    }
  })();

  loadingPromises.set(key, promise);
  return promise;
}

/**
 * Load multiple models in parallel.
 * `entries` is an array of [key, subpath] pairs from AssetRegistry.
 */
export async function loadModels(entries: [string, string][]): Promise<void> {
  await Promise.all(entries.map(([key, subpath]) => loadModel(key, subpath)));
}

// ---------------------------------------------------------------------------
// Cloning
// ---------------------------------------------------------------------------

/**
 * Clone a previously loaded model template.
 * Returns a deep-cloned Group with independent materials, or null
 * if the model was never loaded or failed to load.
 *
 * Geometry is intentionally NOT cloned — all instances share the template's
 * BufferGeometry objects, which are read-only for rendering purposes (only
 * the parent Object3D's matrix changes per instance). Sharing geometry
 * avoids duplicating vertex buffer data on CPU and GPU for every prop clone.
 *
 * Materials ARE cloned so each instance can independently receive per-instance
 * material overrides without affecting other clones or the template.
 *
 * IMPORTANT: Because geometry is shared with the template, callers must NOT
 * call geometry.dispose() on clone children — use disposeClone() instead, or
 * only dispose materials.
 */
export function cloneModel(key: string): THREE.Group | null {
  const template = modelCache.get(key);
  if (!template) return null;

  // Rigged (SkinnedMesh) models require SkeletonUtils.clone() so the cloned
  // SkinnedMesh's bones are rebound to the new hierarchy (not the template's).
  // Static models can use the cheaper template.clone(true).
  let hasSkinnedMesh = false;
  template.traverse((child) => {
    if (child instanceof _SkinnedMesh) hasSkinnedMesh = true;
  });

  const clone = hasSkinnedMesh
    ? (SkeletonUtils.clone(template) as THREE.Group)
    : template.clone(true);

  // Clone materials for per-instance independence (geometry stays shared).
  clone.traverse((child) => {
    if (child instanceof _Mesh && child.material) {
      if (Array.isArray(child.material)) {
        child.material = child.material.map((m: THREE.Material) => {
          const cloned = m.clone();
          cloned.needsUpdate = true;
          return cloned;
        });
      } else {
        child.material = child.material.clone();
        child.material.needsUpdate = true;
      }
    }
  });

  return clone;
}

/**
 * Check if a model has been loaded and cached.
 */
export function isModelLoaded(key: string): boolean {
  return modelCache.has(key);
}

/**
 * Returns a snapshot of the current model load state.
 * Used by the dev overlay to show asset provenance.
 */
export function getModelLoadState(): {
  loaded: string[];
  loading: string[];
  failed: string[];
} {
  return {
    loaded: Array.from(modelCache.keys()),
    loading: Array.from(loadingPromises.keys()),
    failed: Array.from(failedModels),
  };
}

/**
 * Compute the bounding box dimensions of a cached model.
 * Returns { width, height, depth } or null if not loaded.
 */
export function getModelBounds(
  key: string,
): { width: number; height: number; depth: number } | null {
  const template = modelCache.get(key);
  if (!template) return null;

  const box = new THREE.Box3().setFromObject(template);
  const size = new THREE.Vector3();
  box.getSize(size);
  return { width: size.x, height: size.y, depth: size.z };
}

/**
 * Dispose all cached model templates. Call on app teardown.
 */
export function disposeAllModels(): void {
  for (const group of modelCache.values()) {
    group.traverse((child) => {
      if (child instanceof _Mesh) {
        child.geometry?.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            for (const m of child.material) m.dispose();
          } else {
            child.material.dispose();
          }
        }
      }
    });
  }
  modelCache.clear();
  loadingPromises.clear();
  failedModels.clear();
  animClipCache.clear();
  animClipLoadPromises.clear();
}

// ---------------------------------------------------------------------------
// Animation clip loading (for separate animation GLBs, e.g. Meshy anim files)
// ---------------------------------------------------------------------------

/** Cache: animation clip key → loaded AnimationClip (or null if failed). */
const animClipCache = new Map<string, THREE.AnimationClip | null>();
const animClipLoadPromises = new Map<string, Promise<THREE.AnimationClip | null>>();

/**
 * Load the first AnimationClip from an animation-only GLB.
 * Used for Meshy-exported per-action animation files (walk, attack, hit, death).
 *
 * Safe to call concurrently — deduplicates in-flight loads.
 * Returns null if the file has no animations or fails to load.
 *
 * @param key     Cache key (e.g. 'enemy-goat:walk')
 * @param subpath Asset subpath from AssetRegistry (e.g. 'models/enemies/.../walk.glb')
 */
export async function loadAnimationClip(
  key: string,
  subpath: string,
): Promise<THREE.AnimationClip | null> {
  if (animClipCache.has(key)) return animClipCache.get(key) ?? null;
  if (animClipLoadPromises.has(key)) return animClipLoadPromises.get(key)!;

  const promise = (async () => {
    try {
      const uri = getAssetUrl(subpath);
      const loader = getLoader();
      const gltf = await new Promise<{ animations: THREE.AnimationClip[] }>((resolve, reject) =>
        loader.load(uri, resolve as never, undefined, reject),
      );
      const clip = gltf.animations[0] ?? null;
      if (clip) clip.name = key;
      animClipCache.set(key, clip);
      console.log(`[ModelLoader] Loaded anim "${key}" — ${clip ? 'OK' : 'no clip'}`);
      return clip;
    } catch (err) {
      console.error(`[ModelLoader] FAILED to load anim "${key}":`, err);
      animClipCache.set(key, null);
      return null;
    } finally {
      animClipLoadPromises.delete(key);
    }
  })();

  animClipLoadPromises.set(key, promise);
  return promise;
}

/**
 * Synchronously get a cached AnimationClip by key.
 * Returns null if not yet loaded or load failed.
 */
export function getAnimationClip(key: string): THREE.AnimationClip | null {
  return animClipCache.get(key) ?? null;
}
