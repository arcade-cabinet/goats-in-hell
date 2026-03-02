/**
 * DungeonProps -- R3F component that renders decorative dungeon props as GLB models.
 *
 * Props are placed by LevelGenerator.placeProps() as SpawnData entries with
 * types like prop_firebasket, prop_candle, prop_coffin, prop_column, etc.
 *
 * Each prop loads a Quaternius GLB model via ModelLoader, with a colored-box
 * fallback while the model loads or if the model key is unrecognized.
 * Fire-type props include flickering PointLights for atmosphere.
 *
 * Uses imperative Three.js API to match the project pattern and avoid
 * JSX type conflicts with Reactylon.
 */

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three/webgpu';
import { PROP_MODEL_ASSETS, type PropModelKey } from '../../game/systems/AssetRegistry';
import { cloneModel, isModelLoaded, loadModels } from '../systems/ModelLoader';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PropSpawn {
  x: number;
  z: number;
  type: string;
  rotation?: number;
}

export interface DungeonPropsProps {
  spawns: PropSpawn[];
}

// ---------------------------------------------------------------------------
// Per-prop-type configuration
// ---------------------------------------------------------------------------

interface PropGlbConfig {
  /** Key into PROP_MODEL_ASSETS for the GLB model. */
  assetKey: PropModelKey;
  /** Uniform scale applied to the cloned model. */
  scale: number;
  /** Whether this prop emits atmospheric light. */
  emitsLight?: boolean;
  lightColor?: string;
  lightIntensity?: number;
  lightDistance?: number;
  lightFlicker?: boolean;
  /** Fallback box color for use before GLB loads. */
  fallbackColor: string;
}

/**
 * Maps LevelGenerator spawn types (underscore-separated) to GLB config.
 * Spawn type `prop_firebasket` → asset key `prop-firebasket`.
 */
const PROP_GLB_CONFIGS: Record<string, PropGlbConfig> = {
  prop_firebasket: {
    assetKey: 'prop-firebasket',
    scale: 0.6,
    emitsLight: true,
    lightColor: '#ff6600',
    lightIntensity: 1.2,
    lightDistance: 5,
    lightFlicker: true,
    fallbackColor: '#331100',
  },
  prop_candle: {
    assetKey: 'prop-candle',
    scale: 0.5,
    emitsLight: true,
    lightColor: '#ffcc44',
    lightIntensity: 0.5,
    lightDistance: 3,
    lightFlicker: true,
    fallbackColor: '#eeddcc',
  },
  prop_candle_multi: {
    assetKey: 'prop-candle-multi',
    scale: 0.5,
    emitsLight: true,
    lightColor: '#ffcc44',
    lightIntensity: 0.7,
    lightDistance: 3.5,
    lightFlicker: true,
    fallbackColor: '#eeddcc',
  },
  prop_coffin: {
    assetKey: 'prop-chest',
    scale: 0.7,
    fallbackColor: '#2a1a0a',
  },
  prop_column: {
    assetKey: 'prop-column',
    scale: 1.0,
    fallbackColor: '#554444',
  },
  prop_chalice: {
    assetKey: 'prop-chalice',
    scale: 0.5,
    fallbackColor: '#aa8833',
  },
  prop_bowl: {
    assetKey: 'prop-bowl',
    scale: 0.5,
    fallbackColor: '#443322',
  },
};

/** Maximum point lights placed for props (GPU budget). */
const MAX_PROP_LIGHTS = 16;

// Module-scope temp objects — reused each frame, never allocated in useFrame.
const _yAxis = new THREE.Vector3(0, 1, 0);

// ---------------------------------------------------------------------------
// Fallback geometry (shared, never disposed per-instance)
// ---------------------------------------------------------------------------

let sharedFallbackGeo: THREE.BoxGeometry | null = null;

function getSharedFallbackGeo(): THREE.BoxGeometry {
  if (!sharedFallbackGeo) {
    sharedFallbackGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
  }
  return sharedFallbackGeo;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert a spawn type like `prop_firebasket` to asset key `prop-firebasket`.
 * Returns null if the key doesn't exist in PROP_MODEL_ASSETS.
 */
function spawnTypeToAssetKey(type: string): PropModelKey | null {
  const key = type.replace(/_/g, '-') as PropModelKey;
  if (key in PROP_MODEL_ASSETS) return key;
  return null;
}

/**
 * Collect unique asset keys needed for the current spawn list.
 */
function collectNeededAssets(spawns: PropSpawn[]): [string, number | string][] {
  const seen = new Set<string>();
  const entries: [string, number | string][] = [];

  for (const spawn of spawns) {
    if (!spawn.type.startsWith('prop_')) continue;

    const config = PROP_GLB_CONFIGS[spawn.type];
    const assetKey = config?.assetKey ?? spawnTypeToAssetKey(spawn.type);
    if (!assetKey || seen.has(assetKey)) continue;

    seen.add(assetKey);
    entries.push([assetKey, PROP_MODEL_ASSETS[assetKey]]);
  }

  return entries;
}

/**
 * Build a fallback colored box for a prop that hasn't loaded yet.
 */
function buildFallbackMesh(color: string): THREE.Mesh {
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.8,
    metalness: 0.1,
  });
  const mesh = new THREE.Mesh(getSharedFallbackGeo(), mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.y = 0.2;
  return mesh;
}

/**
 * Clone a GLB model, normalize its scale to fit the prop scale, and
 * position it so the bottom sits at y=0.
 */
function buildGlbPropMesh(assetKey: string, scale: number): THREE.Group | null {
  const cloned = cloneModel(assetKey);
  if (!cloned) return null;

  // Compute bounding box to normalize model size
  const box = new THREE.Box3().setFromObject(cloned);
  const size = new THREE.Vector3();
  box.getSize(size);
  const center = new THREE.Vector3();
  box.getCenter(center);

  // Target: ~1 unit tall at scale 1.0
  const maxDim = Math.max(size.x, size.y, size.z);
  const normalizeScale = maxDim > 0 ? (1.0 / maxDim) * scale : scale;

  cloned.scale.setScalar(normalizeScale);

  // Shift so bottom touches y=0
  const scaledBottom = center.y * normalizeScale - (size.y * normalizeScale) / 2;
  cloned.position.y = -scaledBottom;

  // Center horizontally
  cloned.position.x = -center.x * normalizeScale;
  cloned.position.z = -center.z * normalizeScale;

  // Ensure shadows on all child meshes
  cloned.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return cloned;
}

// ---------------------------------------------------------------------------
// DungeonProps Component
// ---------------------------------------------------------------------------

/**
 * Renders decorative dungeon props as Quaternius GLB models with
 * colored-box fallbacks. Fire/candle props get flickering PointLights.
 *
 * Returns null — all rendering is side-effectful via scene.add().
 */
export function DungeonProps({ spawns }: DungeonPropsProps): null {
  const scene = useThree((state) => state.scene);

  // Filter to prop_ spawns once
  const propSpawns = useMemo(() => spawns.filter((s) => s.type.startsWith('prop_')), [spawns]);

  // Track all scene objects for cleanup
  const sceneObjectsRef = useRef<THREE.Object3D[]>([]);
  const flickerLightsRef = useRef<
    { light: THREE.PointLight; baseIntensity: number; phase: number; speed: number }[]
  >([]);
  // State (not ref) so setting it triggers re-render → placement effect re-runs
  const [modelsLoaded, setModelsLoaded] = useState(false);

  // Phase 1: Load all needed GLB models
  useEffect(() => {
    let cancelled = false;
    setModelsLoaded(false);

    const entries = collectNeededAssets(propSpawns);
    if (entries.length > 0) {
      loadModels(entries).then(() => {
        if (!cancelled) setModelsLoaded(true);
      });
    } else {
      setModelsLoaded(true);
    }

    return () => {
      cancelled = true;
    };
  }, [propSpawns]);

  // Phase 2: Place prop meshes and lights once models are available
  // biome-ignore lint/correctness/useExhaustiveDependencies: modelsLoaded signals async load completion
  useEffect(() => {
    // Cleanup previous run
    cleanupSceneObjects(scene, sceneObjectsRef.current);
    sceneObjectsRef.current = [];
    flickerLightsRef.current = [];

    const objects: THREE.Object3D[] = [];
    const flickerLights: typeof flickerLightsRef.current = [];
    let totalLightsPlaced = 0;

    for (const spawn of propSpawns) {
      const config = PROP_GLB_CONFIGS[spawn.type];
      const assetKey = config?.assetKey ?? spawnTypeToAssetKey(spawn.type);
      const scale = config?.scale ?? 0.7;

      // Build the prop mesh: GLB if loaded, fallback box otherwise
      let propGroup: THREE.Group;

      if (assetKey && isModelLoaded(assetKey)) {
        const glb = buildGlbPropMesh(assetKey, scale);
        if (glb) {
          propGroup = new THREE.Group();
          propGroup.add(glb);
        } else {
          propGroup = new THREE.Group();
          propGroup.add(buildFallbackMesh(config?.fallbackColor ?? '#555555'));
        }
      } else {
        propGroup = new THREE.Group();
        propGroup.add(buildFallbackMesh(config?.fallbackColor ?? '#555555'));
      }

      propGroup.name = `dungeon-prop-${spawn.type}-${objects.length}`;

      // Position: x stays, z is negated for Three.js coordinate system
      propGroup.position.set(spawn.x, 0, -spawn.z);

      // Apply rotation around Y axis
      if (spawn.rotation) {
        propGroup.quaternion.setFromAxisAngle(_yAxis, spawn.rotation);
      }

      scene.add(propGroup);
      objects.push(propGroup);

      // Point lights for fire-emitting props
      if (config?.emitsLight && totalLightsPlaced < MAX_PROP_LIGHTS) {
        const light = new THREE.PointLight(
          config.lightColor ?? '#ff6600',
          config.lightIntensity ?? 1,
          config.lightDistance ?? 4,
        );
        light.name = `prop-light-${spawn.type}-${objects.length}`;
        // Light above the prop
        light.position.set(spawn.x, scale + 0.3, -spawn.z);
        scene.add(light);
        objects.push(light);

        if (config.lightFlicker) {
          flickerLights.push({
            light,
            baseIntensity: config.lightIntensity ?? 1,
            phase: Math.random() * Math.PI * 2,
            speed: 3 + Math.random() * 4,
          });
        }

        totalLightsPlaced++;
      }
    }

    sceneObjectsRef.current = objects;
    flickerLightsRef.current = flickerLights;

    return () => {
      cleanupSceneObjects(scene, sceneObjectsRef.current);
      sceneObjectsRef.current = [];
      flickerLightsRef.current = [];
    };
  }, [scene, propSpawns, modelsLoaded]);

  // Per-frame flicker for atmospheric prop lights
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    for (const entry of flickerLightsRef.current) {
      const flicker = Math.sin(time * entry.speed + entry.phase) * 0.3;
      const noise = Math.sin(time * entry.speed * 2.7 + entry.phase * 1.3) * 0.1;
      entry.light.intensity = Math.max(0.1, entry.baseIntensity + flicker + noise);
    }
  });

  return null;
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

/**
 * Remove all tracked objects from the scene and dispose their resources.
 * Shared fallback geometry is NOT disposed — it's reused across levels.
 */
function cleanupSceneObjects(scene: THREE.Scene, objects: THREE.Object3D[]): void {
  for (const obj of objects) {
    scene.remove(obj);

    if (obj instanceof THREE.PointLight) {
      obj.dispose();
      continue;
    }

    // Dispose geometries and materials in groups/meshes
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Don't dispose the shared fallback geometry
        if (child.geometry && child.geometry !== sharedFallbackGeo) {
          child.geometry.dispose();
        }
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
}
