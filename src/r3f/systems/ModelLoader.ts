/**
 * GLB model loading utility for R3F.
 *
 * Resolves Expo asset module IDs to URIs via `Asset.fromModule()`,
 * then loads GLB files using Three.js GLTFLoader.
 *
 * Provides a cache of loaded GLTF scenes keyed by asset key, and
 * a `cloneModel()` helper that deep-clones a cached scene for instancing.
 *
 * Usage:
 *   await loadModel('enemy-goat', ENEMY_MODEL_ASSETS['enemy-goat']);
 *   const mesh = cloneModel('enemy-goat'); // THREE.Group or null
 */
import { Asset } from 'expo-asset';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// ---------------------------------------------------------------------------
// Singleton loader
// ---------------------------------------------------------------------------

let gltfLoader: GLTFLoader | null = null;

function getLoader(): GLTFLoader {
  if (!gltfLoader) {
    gltfLoader = new GLTFLoader();
  }
  return gltfLoader;
}

// ---------------------------------------------------------------------------
// Cache: loaded GLTF scene templates keyed by asset key
// ---------------------------------------------------------------------------

const modelCache = new Map<string, THREE.Group>();
const loadingPromises = new Map<string, Promise<THREE.Group | null>>();

// ---------------------------------------------------------------------------
// URI resolution
// ---------------------------------------------------------------------------

/**
 * Resolve an Expo Metro require() module ID to a fetchable URI.
 * On web, expo-asset returns a URI that points to the bundled asset.
 */
function resolveAssetUri(moduleId: number | string): string {
  if (typeof moduleId === 'string') return moduleId;
  const asset = Asset.fromModule(moduleId);
  return asset.uri;
}

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

/**
 * Load a single GLB model and cache the result.
 * Returns the cached Group, or null if loading failed.
 *
 * Safe to call multiple times — deduplicates concurrent loads.
 */
export async function loadModel(
  key: string,
  moduleId: number | string,
): Promise<THREE.Group | null> {
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
      const uri = resolveAssetUri(moduleId);
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
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      modelCache.set(key, template);
      console.log(`[ModelLoader] Loaded "${key}" — ${template.children.length} children`);
      return template;
    } catch (err) {
      console.error(`[ModelLoader] FAILED to load "${key}":`, err);
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
 * `entries` is an array of [key, moduleId] pairs.
 */
export async function loadModels(entries: [string, number | string][]): Promise<void> {
  await Promise.all(entries.map(([key, moduleId]) => loadModel(key, moduleId)));
}

// ---------------------------------------------------------------------------
// Cloning
// ---------------------------------------------------------------------------

/**
 * Clone a previously loaded model template.
 * Returns a deep-cloned Group with independent materials, or null
 * if the model was never loaded or failed to load.
 */
export function cloneModel(key: string): THREE.Group | null {
  const template = modelCache.get(key);
  if (!template) return null;

  const clone = template.clone(true);

  // Deep-clone geometry AND materials so each instance is fully independent.
  // Without geometry cloning, disposing one instance corrupts all other clones.
  clone.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (child.geometry) {
        child.geometry = child.geometry.clone();
      }
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material = child.material.map((m: THREE.Material) => m.clone());
        } else {
          child.material = child.material.clone();
        }
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
      if (child instanceof THREE.Mesh) {
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
}
