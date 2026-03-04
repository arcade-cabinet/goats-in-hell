/**
 * LevelRenderer — unified R3F component for all level visuals.
 *
 * Renders:
 * 1. Per-room floor planes with PBR AmbientCG textures (from CompiledVisual).
 * 2. Procedural prop scatter (from CompiledVisual fill rules).
 * 3. Static prop placements from DB entities (formerly in DungeonProps.tsx).
 * 4. Atmospheric point lights for fire/candle props (formerly in DungeonProps.tsx).
 *
 * Env zone GAMEPLAY is handled by EnvironmentZoneEffects.ts — this
 * component has no responsibility for damage/speed zones.
 */

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import seedrandom from 'seedrandom';
import { MeshStandardMaterial as _BaseMat, Mesh as _Mesh } from 'three';
import * as THREE from 'three/webgpu';
import { CELL_SIZE } from '../../constants';
import type { CompiledVisual } from '../../db/LevelEditor';
import {
  PROP_MODEL_ASSETS,
  type PropModelKey,
  SETPIECE_MODEL_ASSETS,
  type SetpieceModelKey,
} from '../../game/systems/AssetRegistry';
import { cloneModel, isModelLoaded, loadModels } from '../systems/ModelLoader';
import { createZoneMaterial } from './Materials';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PropSpawn {
  x: number;
  z: number;
  type: string;
  rotation?: number;
}

export interface LevelRendererProps {
  compiledVisual: CompiledVisual | null;
  propSpawns: PropSpawn[];
  /** Called once after model loading if any prop types have no registered GLB or fail to clone. */
  onPropErrors?: (errors: string[]) => void;
}

// ---------------------------------------------------------------------------
// Module-scope temps — never allocate inside useFrame
// ---------------------------------------------------------------------------

const _yAxis = new THREE.Vector3(0, 1, 0);
const _hsl = { h: 0, s: 0, l: 0 };

// ---------------------------------------------------------------------------
// Per-prop-type configuration (folded from DungeonProps.tsx)
// ---------------------------------------------------------------------------

interface PropGlbConfig {
  assetKey: PropModelKey;
  scale: number;
  emitsLight?: boolean;
  lightColor?: string;
  lightIntensity?: number;
  lightDistance?: number;
  lightFlicker?: boolean;
}

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

// ---------------------------------------------------------------------------
// Meshy material sanitization
// ---------------------------------------------------------------------------

/**
 * Some Meshy-generated GLB models have neon-green or other obviously-wrong
 * material colors (HSL hue near green, high saturation). These render as
 * bright artifacts in WebGPU. Replace them with dark iron-gray to match
 * a hell-industrial aesthetic.
 */
function sanitizeMeshyMaterials(object: THREE.Group): void {
  // GLTFLoader creates MeshStandardMaterial from 'three', not 'three/webgpu'.
  // Use _BaseMat (imported from 'three') so instanceof works for GLTF-loaded mats.
  object.traverse((child) => {
    if (!(child instanceof _Mesh)) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    for (const mat of materials) {
      if (!(mat instanceof _BaseMat)) continue;

      // Check base color — bright pure-green artifacts from Meshy
      mat.color.getHSL(_hsl);
      const colorIsGreen = _hsl.h > 0.25 && _hsl.h < 0.45 && _hsl.s > 0.5 && _hsl.l > 0.2;

      // Check emissive — ritual/magic props glow green via emissive (e.g. ritual-circle)
      mat.emissive.getHSL(_hsl);
      const emissiveIsGreen = _hsl.h > 0.2 && _hsl.h < 0.5 && _hsl.s > 0.4 && _hsl.l > 0.1;

      if (colorIsGreen || emissiveIsGreen) {
        mat.color.set('#2a2a2a');
        mat.emissive.set('#000000');
        mat.emissiveIntensity = 0;
        mat.metalness = 0.7;
        mat.roughness = 0.5;
        mat.map = null; // Strip diffuse texture — green can't be fixed by color tinting alone
        mat.needsUpdate = true;
      }
    }
  });
}

// ---------------------------------------------------------------------------
// Asset resolution helpers
// ---------------------------------------------------------------------------

/**
 * Resolve a spawn entity type to an asset key and require() value.
 * Handles procedural (prop_*), Meshy prop, and Meshy setpiece formats.
 */
function resolveAsset(type: string): { key: string; value: number | string } | null {
  const dashKey = type.replace(/_/g, '-');
  if (dashKey in PROP_MODEL_ASSETS) {
    return { key: dashKey, value: PROP_MODEL_ASSETS[dashKey as PropModelKey] };
  }
  const meshyPropKey = `prop-${dashKey}`;
  if (meshyPropKey in PROP_MODEL_ASSETS) {
    return { key: meshyPropKey, value: PROP_MODEL_ASSETS[meshyPropKey as PropModelKey] };
  }
  const meshySpKey = `setpiece-${dashKey}`;
  if (meshySpKey in SETPIECE_MODEL_ASSETS) {
    return { key: meshySpKey, value: SETPIECE_MODEL_ASSETS[meshySpKey as SetpieceModelKey] };
  }
  return null;
}

function isSupportedPropType(type: string): boolean {
  if (type.startsWith('prop_')) return true;
  return resolveAsset(type) !== null;
}

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
 * Collect GLB keys needed for procedural fill props.
 * FillRule props are referenced WITHOUT the 'prop-' prefix.
 */
function collectFillAssets(compiledVisual: CompiledVisual | null): [string, string][] {
  if (!compiledVisual) return [];

  const seen = new Set<string>();
  const entries: [string, string][] = [];

  // Gather all fill-rule prop names from rooms + theme defaults
  const allPropNames = new Set<string>();

  for (const room of compiledVisual.rooms) {
    const fillRule = room.fillRule ?? compiledVisual.theme.roomFillRules[room.roomType] ?? null;
    if (fillRule) {
      for (const p of fillRule.props) {
        allPropNames.add(p);
      }
    }
  }

  for (const propName of allPropNames) {
    // FillRule props: e.g. 'limbo-stone-bench' → try 'prop-limbo-stone-bench'
    const resolved = resolveAsset(propName);
    if (!resolved || seen.has(resolved.key)) continue;
    seen.add(resolved.key);
    entries.push([resolved.key, resolved.value as string]);
  }

  return entries;
}

/**
 * Clone and position a GLB model so the bottom sits at y=0.
 * Normalizes scale so the model fits within the target scale factor.
 */
function buildGlbPropMesh(assetKey: string, scale = 0.7): THREE.Group | null {
  const cloned = cloneModel(assetKey);
  if (!cloned) return null;

  const box = new THREE.Box3().setFromObject(cloned);
  const size = new THREE.Vector3();
  box.getSize(size);
  const center = new THREE.Vector3();
  box.getCenter(center);

  const maxDim = Math.max(size.x, size.y, size.z);
  const normalizeScale = maxDim > 0 ? (1.0 / maxDim) * scale : scale;

  cloned.scale.setScalar(normalizeScale);

  const scaledBottom = center.y * normalizeScale - (size.y * normalizeScale) / 2;
  cloned.position.y = -scaledBottom;
  cloned.position.x = -center.x * normalizeScale;
  cloned.position.z = -center.z * normalizeScale;

  cloned.traverse((child) => {
    if (child instanceof _Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  sanitizeMeshyMaterials(cloned);

  return cloned;
}

// ---------------------------------------------------------------------------
// Cleanup helpers
// ---------------------------------------------------------------------------

function cleanupGroup(scene: THREE.Scene, root: THREE.Group | null): void {
  if (!root) return;
  scene.remove(root);
  root.traverse((child) => {
    if (child instanceof _Mesh) {
      // Do NOT dispose geometry — shared with ModelLoader template cache
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

function cleanupLights(lights: THREE.PointLight[]): void {
  for (const light of lights) {
    light.removeFromParent();
    light.dispose();
  }
}

// ---------------------------------------------------------------------------
// LevelRenderer Component
// ---------------------------------------------------------------------------

/**
 * Unified R3F component that renders:
 * 1. Per-room floor planes with PBR AmbientCG textures.
 * 2. Procedural fill props (GLBs scattered over floor cells per fillRule).
 * 3. Static prop placements from the entity list.
 *
 * Returns null — all rendering is side-effectful via scene.add().
 */
export function LevelRenderer({
  compiledVisual,
  propSpawns,
  onPropErrors,
}: LevelRendererProps): null {
  const scene = useThree((state) => state.scene);

  // Filter spawns to only those this component can render
  const renderableSpawns = useMemo(
    () => propSpawns.filter((s) => isSupportedPropType(s.type)),
    [propSpawns],
  );

  // Track all imperative scene objects for cleanup
  const floorRootRef = useRef<THREE.Group | null>(null);
  const staticPropsRootRef = useRef<THREE.Group | null>(null);
  const fillPropsRootRef = useRef<THREE.Group | null>(null);
  const sceneLightsRef = useRef<THREE.PointLight[]>([]);
  const flickerLightsRef = useRef<
    { light: THREE.PointLight; baseIntensity: number; phase: number; speed: number }[]
  >([]);
  const floorGeosRef = useRef<THREE.BufferGeometry[]>([]);

  // State to trigger re-render after async model load
  const [modelsLoaded, setModelsLoaded] = useState(false);

  // Phase 1: Load all needed GLB models (static props + fill props)
  useEffect(() => {
    let cancelled = false;
    setModelsLoaded(false);

    const staticEntries = collectNeededAssets(renderableSpawns);
    const fillEntries = collectFillAssets(compiledVisual);

    // Merge and deduplicate
    const allMap = new Map<string, string>();
    for (const [key, val] of [...staticEntries, ...fillEntries]) {
      allMap.set(key, val);
    }
    const allEntries = [...allMap.entries()];

    if (allEntries.length > 0) {
      loadModels(allEntries).then(() => {
        if (!cancelled) setModelsLoaded(true);
      });
    } else {
      setModelsLoaded(true);
    }

    return () => {
      cancelled = true;
    };
  }, [renderableSpawns, compiledVisual]);

  // Phase 2: Build floor planes (depends on compiledVisual, not model loading)
  useEffect(() => {
    // Cleanup previous floor meshes
    if (floorRootRef.current) {
      scene.remove(floorRootRef.current);
      floorRootRef.current = null;
    }
    for (const geo of floorGeosRef.current) {
      geo.dispose();
    }
    floorGeosRef.current = [];

    if (!compiledVisual) return;

    const floorRoot = new THREE.Group();
    floorRoot.name = 'level-floor-planes';
    const geos: THREE.BufferGeometry[] = [];

    for (const room of compiledVisual.rooms) {
      // Resolve floor texture: room override → theme palette → fallback 'stone'
      const textureId =
        room.floorTexture ?? compiledVisual.theme.texturePalette[room.roomType] ?? 'stone';

      const wW = room.bounds.w * CELL_SIZE;
      const wH = room.bounds.h * CELL_SIZE;

      const geo = new THREE.PlaneGeometry(wW, wH);
      geo.rotateX(-Math.PI / 2); // lay flat facing up
      geos.push(geo);

      const mat = createZoneMaterial(textureId as import('../../db/LevelEditor').TextureId);

      const mesh = new THREE.Mesh(geo, mat);
      mesh.name = `floor-${room.id}`;
      mesh.receiveShadow = true;

      // Center of room in world coordinates (grid × CELL_SIZE, negate Z for Three.js)
      const centerX = (room.bounds.x + room.bounds.w / 2) * CELL_SIZE;
      const centerZ = -((room.bounds.z + room.bounds.h / 2) * CELL_SIZE);
      const yPos = room.elevation * (CELL_SIZE / 2) + 0.01;

      mesh.position.set(centerX, yPos, centerZ);

      floorRoot.add(mesh);
    }

    scene.add(floorRoot);
    floorRootRef.current = floorRoot;
    floorGeosRef.current = geos;

    return () => {
      scene.remove(floorRoot);
      for (const geo of geos) {
        geo.dispose();
      }
    };
  }, [scene, compiledVisual]);

  // Phase 3: Place static props + procedural fill props once models are loaded
  // biome-ignore lint/correctness/useExhaustiveDependencies: modelsLoaded signals async load completion
  useEffect(() => {
    // Cleanup previous prop instances
    cleanupGroup(scene, staticPropsRootRef.current);
    staticPropsRootRef.current = null;
    cleanupGroup(scene, fillPropsRootRef.current);
    fillPropsRootRef.current = null;
    cleanupLights(sceneLightsRef.current);
    sceneLightsRef.current = [];
    flickerLightsRef.current = [];

    const sceneLights: THREE.PointLight[] = [];
    const flickerLights: typeof flickerLightsRef.current = [];
    const propErrors: string[] = [];

    // --- Static props (folded from DungeonProps.tsx — includes light-emitting props) ---
    const staticRoot = new THREE.Group();
    staticRoot.name = 'level-static-props';
    let propIndex = 0;
    let totalLightsPlaced = 0;

    for (const spawn of renderableSpawns) {
      const config = PROP_GLB_CONFIGS[spawn.type];
      const resolved = config ? { key: config.assetKey as string } : resolveAsset(spawn.type);
      const assetKey = resolved?.key ?? null;
      const scale = config?.scale ?? 0.7;

      const propGroup = new THREE.Group();
      propGroup.name = `static-prop-${spawn.type}-${propIndex++}`;

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

      propGroup.position.set(spawn.x, 0, -spawn.z);
      if (spawn.rotation) {
        propGroup.quaternion.setFromAxisAngle(_yAxis, spawn.rotation);
      }

      staticRoot.add(propGroup);

      // Point lights for fire-emitting props (firebasket, candles)
      if (config?.emitsLight && totalLightsPlaced < MAX_PROP_LIGHTS) {
        const light = new THREE.PointLight(
          config.lightColor ?? '#ff6600',
          config.lightIntensity ?? 1,
          config.lightDistance ?? 4,
        );
        light.name = `prop-light-${spawn.type}-${propIndex}`;
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

    scene.add(staticRoot);
    staticPropsRootRef.current = staticRoot;

    // --- Procedural fill props ---
    if (compiledVisual) {
      const fillRoot = new THREE.Group();
      fillRoot.name = 'level-fill-props';

      // Build a set of entity positions for overlap rejection (grid coords)
      const staticGridPositions: Array<{ x: number; z: number }> = renderableSpawns.map((s) => ({
        x: s.x / CELL_SIZE,
        z: s.z / CELL_SIZE,
      }));

      for (const room of compiledVisual.rooms) {
        const fillRule = room.fillRule ?? compiledVisual.theme.roomFillRules[room.roomType] ?? null;

        if (!fillRule || fillRule.type === 'none' || fillRule.props.length === 0) continue;

        // Seeded PRNG — deterministic per level + room
        const rng = seedrandom(`${compiledVisual.version}-${room.id}`);

        const n = Math.floor(room.bounds.w * room.bounds.h * fillRule.density);

        for (let i = 0; i < n; i++) {
          // Random grid position within room bounds
          const gridX = room.bounds.x + rng() * room.bounds.w;
          const gridZ = room.bounds.z + rng() * room.bounds.h;

          // Reject if too close to any static entity spawn (1.5 cells)
          const tooClose = staticGridPositions.some(
            (p) => Math.abs(p.x - gridX) < 1.5 && Math.abs(p.z - gridZ) < 1.5,
          );
          if (tooClose) continue;

          // Cycle through prop list
          const propName = fillRule.props[i % fillRule.props.length];
          const resolved = resolveAsset(propName);
          if (!resolved) continue;

          const assetKey = resolved.key;
          if (!isModelLoaded(assetKey)) continue;

          const glb = buildGlbPropMesh(assetKey, 0.7);
          if (!glb) continue;

          const fillGroup = new THREE.Group();
          fillGroup.name = `fill-prop-${propName}-${i}`;
          fillGroup.add(glb);

          // World position: grid × CELL_SIZE, center within cell (+0.5), negate Z
          const wx = (gridX + 0.5) * CELL_SIZE;
          const wz = -((gridZ + 0.5) * CELL_SIZE);
          const wy = room.elevation * (CELL_SIZE / 2);
          fillGroup.position.set(wx, wy, wz);

          // Random Y rotation if requested
          if (fillRule.randomRotation) {
            fillGroup.quaternion.setFromAxisAngle(_yAxis, rng() * Math.PI * 2);
          }

          fillRoot.add(fillGroup);
        }
      }

      scene.add(fillRoot);
      fillPropsRootRef.current = fillRoot;
    }

    sceneLightsRef.current = sceneLights;
    flickerLightsRef.current = flickerLights;

    if (propErrors.length > 0 && onPropErrors) {
      onPropErrors([...new Set(propErrors)]);
    }

    return () => {
      cleanupGroup(scene, staticPropsRootRef.current);
      staticPropsRootRef.current = null;
      cleanupGroup(scene, fillPropsRootRef.current);
      fillPropsRootRef.current = null;
      cleanupLights(sceneLightsRef.current);
      sceneLightsRef.current = [];
      flickerLightsRef.current = [];
    };
  }, [scene, renderableSpawns, compiledVisual, modelsLoaded, onPropErrors]);

  // Per-frame: flicker atmospheric lights (same as DungeonProps.tsx)
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
