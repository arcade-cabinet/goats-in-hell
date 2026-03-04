/**
 * DungeonProps -- R3F component that renders decorative dungeon props as GLB models.
 *
 * Props are placed by LevelGenerator.placeProps() as SpawnData entries with
 * types like prop_firebasket, prop_candle, prop_coffin, prop_column, etc.
 *
 * Each prop loads a GLB model via ModelLoader. If a prop type has no registered
 * GLB in AssetRegistry, or if cloning fails, onPropErrors is called with the
 * failing prop types — no silent fallback boxes are rendered.
 *
 * Fire-type props include flickering PointLights for atmosphere.
 *
 * Uses imperative Three.js API to match the project pattern and avoid
 * JSX type conflicts with Reactylon.
 */

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three/webgpu';
import {
  PROP_MODEL_ASSETS,
  type PropModelKey,
  SETPIECE_MODEL_ASSETS,
  type SetpieceModelKey,
} from '../../game/systems/AssetRegistry';
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
  /** Called once after model loading if any prop types have no registered GLB or fail to clone. */
  onPropErrors?: (errors: string[]) => void;
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
  },
  prop_candle: {
    assetKey: 'prop-candle',
    scale: 0.5,
    emitsLight: true,
    lightColor: '#ffcc44',
    lightIntensity: 0.5,
    lightDistance: 3,
    lightFlicker: true,
  },
  prop_candle_multi: {
    assetKey: 'prop-candle-multi',
    scale: 0.5,
    emitsLight: true,
    lightColor: '#ffcc44',
    lightIntensity: 0.7,
    lightDistance: 3.5,
    lightFlicker: true,
  },
  prop_coffin: {
    assetKey: 'prop-chest',
    scale: 0.7,
  },
  prop_column: {
    assetKey: 'prop-column',
    scale: 1.0,
  },
  prop_chalice: {
    assetKey: 'prop-chalice',
    scale: 0.5,
  },
  prop_bowl: {
    assetKey: 'prop-bowl',
    scale: 0.5,
  },
};

/** Maximum point lights placed for props (GPU budget). */
const MAX_PROP_LIGHTS = 16;

// Module-scope temp objects — reused each frame, never allocated in useFrame.
const _yAxis = new THREE.Vector3(0, 1, 0);
const _hsl = { h: 0, s: 0, l: 0 };

/**
 * Replace neon-green Meshy material artifacts with dark iron-gray.
 * Checks BOTH base color and emissive — Meshy ritual/magic props often have
 * bright green emissive with a near-white base color.
 */
function sanitizeMeshyMaterials(object: THREE.Group): void {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    for (const mat of materials) {
      if (!(mat instanceof THREE.MeshStandardMaterial)) continue;

      // Check base color
      mat.color.getHSL(_hsl);
      const colorIsGreen = _hsl.h > 0.25 && _hsl.h < 0.45 && _hsl.s > 0.5 && _hsl.l > 0.2;

      // Check emissive — ritual/magic props glow green via emissive
      mat.emissive.getHSL(_hsl);
      const emissiveIsGreen = _hsl.h > 0.2 && _hsl.h < 0.5 && _hsl.s > 0.4 && _hsl.l > 0.1;

      if (colorIsGreen || emissiveIsGreen) {
        mat.color.set('#2a2a2a');
        mat.emissive.set('#000000');
        mat.emissiveIntensity = 0;
        mat.metalness = 0.7;
        mat.roughness = 0.5;
        mat.needsUpdate = true;
      }
    }
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve a spawn entity type to an asset key and require() value.
 *
 * Handles three formats:
 *   - Procedural (LevelGenerator): `prop_firebasket` → `prop-firebasket` in PROP_MODEL_ASSETS
 *   - Meshy prop (build scripts):   `limbo-stone-bench` → `prop-limbo-stone-bench` in PROP_MODEL_ASSETS
 *   - Meshy setpiece (build scripts): `limbo-crumbling-arch` → `setpiece-limbo-crumbling-arch` in SETPIECE_MODEL_ASSETS
 *
 * Returns null if the type resolves to no known asset.
 */
function resolveAsset(type: string): { key: string; value: number | string } | null {
  // Procedural: prop_firebasket → prop-firebasket
  const dashKey = type.replace(/_/g, '-');
  if (dashKey in PROP_MODEL_ASSETS) {
    return { key: dashKey, value: PROP_MODEL_ASSETS[dashKey as PropModelKey] };
  }
  // Meshy prop: limbo-stone-bench → prop-limbo-stone-bench
  const meshyPropKey = `prop-${dashKey}`;
  if (meshyPropKey in PROP_MODEL_ASSETS) {
    return { key: meshyPropKey, value: PROP_MODEL_ASSETS[meshyPropKey as PropModelKey] };
  }
  // Meshy setpiece: limbo-crumbling-arch → setpiece-limbo-crumbling-arch
  const meshySpKey = `setpiece-${dashKey}`;
  if (meshySpKey in SETPIECE_MODEL_ASSETS) {
    return { key: meshySpKey, value: SETPIECE_MODEL_ASSETS[meshySpKey as SetpieceModelKey] };
  }
  return null;
}

/**
 * Returns true for spawn types this component can render:
 * - Procedural `prop_*` types
 * - DB-authored Meshy prop or setpiece IDs
 */
function isSupportedPropType(type: string): boolean {
  if (type.startsWith('prop_')) return true;
  return resolveAsset(type) !== null;
}

/**
 * Collect unique (key, subpath) pairs for the current spawn list.
 * Asset values are URL subpaths served from public/.
 */
function collectNeededAssets(spawns: PropSpawn[]): [string, string][] {
  const seen = new Set<string>();
  const entries: [string, string][] = [];

  for (const spawn of spawns) {
    const config = PROP_GLB_CONFIGS[spawn.type];
    const resolved = config
      ? {
          key: config.assetKey as string,
          value: PROP_MODEL_ASSETS[config.assetKey] as string,
        }
      : resolveAsset(spawn.type);
    if (!resolved || seen.has(resolved.key)) continue;

    seen.add(resolved.key);
    entries.push([resolved.key, resolved.value as string]);
  }

  return entries;
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

  // Ensure shadows on all child meshes and sanitize material artifacts
  cloned.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  sanitizeMeshyMaterials(cloned);

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
 *
 * All prop groups are placed under a single root Group so that the scene
 * graph root has one node instead of N nodes (one per prop). This does not
 * reduce draw calls — each unique GLB sub-mesh is still a separate draw —
 * but it reduces scene traversal and cleanup cost significantly.
 *
 * Geometry sharing: cloneModel() shares BufferGeometry across all clones of
 * the same template. Only materials are cloned per-instance. This avoids
 * duplicating vertex buffer data for repeated prop types (e.g. 10x pillars
 * share one BufferGeometry instead of ten copies).
 */
export function DungeonProps({ spawns, onPropErrors }: DungeonPropsProps): null {
  const scene = useThree((state) => state.scene);

  // Filter to renderable prop/setpiece spawns (procedural prop_* + Meshy authored IDs)
  const propSpawns = useMemo(() => spawns.filter((s) => isSupportedPropType(s.type)), [spawns]);

  // Single root Group for all prop instances — one scene node instead of N.
  const propsRootRef = useRef<THREE.Group | null>(null);
  // Separate list for lights (added directly to scene — can't be children of
  // the root group because PointLight positions are in world space).
  const sceneLightsRef = useRef<THREE.PointLight[]>([]);
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
    cleanupPropsRoot(scene, propsRootRef.current);
    propsRootRef.current = null;
    cleanupLights(sceneLightsRef.current);
    sceneLightsRef.current = [];
    flickerLightsRef.current = [];

    // Single root group — one scene.add() instead of N
    const propsRoot = new THREE.Group();
    propsRoot.name = 'dungeon-props-root';
    const sceneLights: THREE.PointLight[] = [];
    const flickerLights: typeof flickerLightsRef.current = [];
    let totalLightsPlaced = 0;
    let propIndex = 0;

    const propErrors: string[] = [];

    for (const spawn of propSpawns) {
      const config = PROP_GLB_CONFIGS[spawn.type];
      const resolved = config ? { key: config.assetKey as string } : resolveAsset(spawn.type);
      const assetKey = resolved?.key ?? null;
      const scale = config?.scale ?? 0.7;

      const propGroup = new THREE.Group();
      propGroup.name = `dungeon-prop-${spawn.type}-${propIndex++}`;

      if (!assetKey) {
        propErrors.push(
          `No GLB registered for prop type "${spawn.type}" — add to AssetRegistry PROP_MODEL_ASSETS`,
        );
      } else if (isModelLoaded(assetKey)) {
        const glb = buildGlbPropMesh(assetKey, scale);
        if (glb) {
          propGroup.add(glb);
        } else {
          propErrors.push(`GLB clone failed for asset "${assetKey}" (prop type: "${spawn.type}")`);
        }
      }
      // If model not loaded yet — empty group, will be re-placed when modelsLoaded fires again

      // Position: x stays, z is negated for Three.js coordinate system
      propGroup.position.set(spawn.x, 0, -spawn.z);

      // Apply rotation around Y axis
      if (spawn.rotation) {
        propGroup.quaternion.setFromAxisAngle(_yAxis, spawn.rotation);
      }

      propsRoot.add(propGroup);

      // Point lights for fire-emitting props — added directly to scene (world space)
      if (config?.emitsLight && totalLightsPlaced < MAX_PROP_LIGHTS) {
        const light = new THREE.PointLight(
          config.lightColor ?? '#ff6600',
          config.lightIntensity ?? 1,
          config.lightDistance ?? 4,
        );
        light.name = `prop-light-${spawn.type}-${propIndex}`;
        // Light above the prop (world-space position)
        light.position.set(spawn.x, scale + 0.3, -spawn.z);
        scene.add(light);
        sceneLights.push(light);

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

    scene.add(propsRoot);
    propsRootRef.current = propsRoot;
    sceneLightsRef.current = sceneLights;
    flickerLightsRef.current = flickerLights;

    // Report any prop registration or clone errors — no fallback boxes, hard errors instead
    if (propErrors.length > 0 && onPropErrors) {
      onPropErrors([...new Set(propErrors)]);
    }

    return () => {
      cleanupPropsRoot(scene, propsRootRef.current);
      propsRootRef.current = null;
      cleanupLights(sceneLightsRef.current);
      sceneLightsRef.current = [];
      flickerLightsRef.current = [];
    };
  }, [scene, propSpawns, modelsLoaded, onPropErrors]);

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
 * Remove the props root Group from the scene and dispose its resources.
 *
 * Geometry is NOT disposed here — prop clones share BufferGeometry with the
 * ModelLoader template cache (cloneModel() no longer clones geometry). Only
 * cloned materials are disposed.
 */
function cleanupPropsRoot(scene: THREE.Scene, root: THREE.Group | null): void {
  if (!root) return;
  scene.remove(root);

  root.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      // Do NOT dispose geometry — it is shared with the ModelLoader template
      // (or is the module-scope sharedFallbackGeo). Disposing it here would
      // corrupt other live instances and the cached template.
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

/**
 * Remove and dispose a list of PointLights that were added directly to the
 * scene (not parented to the props root Group).
 */
function cleanupLights(lights: THREE.PointLight[]): void {
  for (const light of lights) {
    // Lights may have already been removed from the scene by the time this
    // runs — removeFromParent() is safe to call regardless.
    light.removeFromParent();
    light.dispose();
  }
}
