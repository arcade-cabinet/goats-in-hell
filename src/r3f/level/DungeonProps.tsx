/**
 * DungeonProps — R3F component that renders decorative dungeon props.
 *
 * Props are placed by LevelGenerator.placeProps() as SpawnData entries with
 * types like prop_firebasket, prop_candle, prop_coffin, prop_column, etc.
 *
 * Each prop type is rendered as an InstancedMesh with simple geometric
 * approximations (cylinders, boxes) and theme-appropriate materials.
 * Fire baskets and candles include faint PointLights for atmosphere.
 *
 * Uses imperative Three.js API to match the project pattern and avoid
 * JSX type conflicts with Reactylon.
 */

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

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
// Prop type visual configs
// ---------------------------------------------------------------------------

interface PropConfig {
  /** Factory for the geometry (one instance shared across all of this type). */
  geometry: () => THREE.BufferGeometry;
  /** Material properties. */
  color: string;
  emissive?: string;
  emissiveIntensity?: number;
  roughness: number;
  metalness: number;
  /** Y offset from ground level. */
  yOffset: number;
  /** Uniform scale applied to the instance. */
  scale: number;
  /** Whether this prop type emits light (creates a PointLight per instance). */
  emitsLight?: boolean;
  /** Light color (defaults to emissive or color). */
  lightColor?: string;
  /** Light intensity. */
  lightIntensity?: number;
  /** Light range. */
  lightDistance?: number;
  /** Whether the light should flicker. */
  lightFlicker?: boolean;
}

const PROP_CONFIGS: Record<string, PropConfig> = {
  // Fire basket: small box frame with emissive orange glow + point light
  prop_firebasket: {
    geometry: () => new THREE.BoxGeometry(0.5, 0.6, 0.5),
    color: '#331100',
    emissive: '#ff6600',
    emissiveIntensity: 1.5,
    roughness: 0.8,
    metalness: 0.6,
    yOffset: 0.3,
    scale: 1,
    emitsLight: true,
    lightColor: '#ff6600',
    lightIntensity: 1.2,
    lightDistance: 5,
    lightFlicker: true,
  },

  // Single candle: thin cylinder + small emissive flame
  prop_candle: {
    geometry: () => new THREE.CylinderGeometry(0.06, 0.08, 0.3, 6),
    color: '#eeddcc',
    emissive: '#ffcc44',
    emissiveIntensity: 0.8,
    roughness: 0.9,
    metalness: 0.0,
    yOffset: 0.15,
    scale: 1,
    emitsLight: true,
    lightColor: '#ffcc44',
    lightIntensity: 0.5,
    lightDistance: 3,
    lightFlicker: true,
  },

  // Multiple candles: slightly larger cluster
  prop_candle_multi: {
    geometry: () => new THREE.CylinderGeometry(0.15, 0.18, 0.25, 8),
    color: '#eeddcc',
    emissive: '#ffcc44',
    emissiveIntensity: 1.0,
    roughness: 0.9,
    metalness: 0.0,
    yOffset: 0.125,
    scale: 1,
    emitsLight: true,
    lightColor: '#ffcc44',
    lightIntensity: 0.7,
    lightDistance: 3.5,
    lightFlicker: true,
  },

  // Coffin: dark wooden box, elongated
  prop_coffin: {
    geometry: () => new THREE.BoxGeometry(0.5, 0.35, 1.2),
    color: '#2a1a0a',
    emissive: '#110800',
    emissiveIntensity: 0.15,
    roughness: 0.85,
    metalness: 0.1,
    yOffset: 0.175,
    scale: 1,
  },

  // Column: stone cylinder, tall
  prop_column: {
    geometry: () => new THREE.CylinderGeometry(0.25, 0.3, 2.5, 8),
    color: '#554444',
    emissive: '#110808',
    emissiveIntensity: 0.1,
    roughness: 0.9,
    metalness: 0.1,
    yOffset: 1.25,
    scale: 1,
  },

  // Chalice: small metallic cone-ish shape (approximated with cylinder)
  prop_chalice: {
    geometry: () => new THREE.CylinderGeometry(0.08, 0.04, 0.2, 8),
    color: '#aa8833',
    emissive: '#332200',
    emissiveIntensity: 0.3,
    roughness: 0.3,
    metalness: 0.8,
    yOffset: 0.1,
    scale: 1,
  },

  // Bowl: low cylinder (flattened)
  prop_bowl: {
    geometry: () => new THREE.CylinderGeometry(0.15, 0.12, 0.08, 8),
    color: '#443322',
    emissive: '#110800',
    emissiveIntensity: 0.1,
    roughness: 0.85,
    metalness: 0.2,
    yOffset: 0.04,
    scale: 1,
  },
};

// Maximum number of point lights for props (avoid GPU overload)
const MAX_PROP_LIGHTS = 16;

// ---------------------------------------------------------------------------
// Helper: group spawns by prop type
// ---------------------------------------------------------------------------

interface GroupedProps {
  type: string;
  config: PropConfig;
  positions: { x: number; z: number; rotation: number }[];
}

function groupSpawnsByType(spawns: PropSpawn[]): GroupedProps[] {
  const groups = new Map<string, { x: number; z: number; rotation: number }[]>();

  for (const spawn of spawns) {
    if (!spawn.type.startsWith('prop_')) continue;
    if (!PROP_CONFIGS[spawn.type]) continue;

    let arr = groups.get(spawn.type);
    if (!arr) {
      arr = [];
      groups.set(spawn.type, arr);
    }
    arr.push({
      x: spawn.x,
      z: spawn.z,
      rotation: spawn.rotation ?? 0,
    });
  }

  const result: GroupedProps[] = [];
  for (const [type, positions] of groups) {
    result.push({ type, config: PROP_CONFIGS[type], positions });
  }
  return result;
}

// ---------------------------------------------------------------------------
// DungeonProps Component
// ---------------------------------------------------------------------------

/**
 * Renders decorative dungeon props using InstancedMesh for each prop type.
 * Fire baskets and candles also get atmospheric PointLights that flicker.
 *
 * Returns null — all rendering is side-effectful via scene.add().
 */
export function DungeonProps({ spawns }: DungeonPropsProps): null {
  const scene = useThree((state) => state.scene);

  // Memoize grouped spawns
  const grouped = useMemo(() => groupSpawnsByType(spawns), [spawns]);

  // Track flickering lights for per-frame updates
  const flickerLightsRef = useRef<
    { light: THREE.PointLight; baseIntensity: number; phase: number; speed: number }[]
  >([]);

  useEffect(() => {
    const createdObjects: THREE.Object3D[] = [];
    const createdGeometries: THREE.BufferGeometry[] = [];
    const createdMaterials: THREE.Material[] = [];
    const flickerLights: {
      light: THREE.PointLight;
      baseIntensity: number;
      phase: number;
      speed: number;
    }[] = [];

    let totalLightsPlaced = 0;

    const tempMatrix = new THREE.Matrix4();
    const tempQuat = new THREE.Quaternion();
    const tempScale = new THREE.Vector3();

    for (const group of grouped) {
      const { type, config, positions } = group;
      if (positions.length === 0) continue;

      // Create shared geometry and material for this prop type
      const geometry = config.geometry();
      createdGeometries.push(geometry);

      const material = new THREE.MeshStandardMaterial({
        color: config.color,
        emissive: config.emissive ?? '#000000',
        emissiveIntensity: config.emissiveIntensity ?? 0,
        roughness: config.roughness,
        metalness: config.metalness,
      });
      createdMaterials.push(material);

      // Create InstancedMesh
      const instanced = new THREE.InstancedMesh(geometry, material, positions.length);
      instanced.name = `dungeon-props-${type}`;
      instanced.castShadow = true;
      instanced.receiveShadow = true;

      for (let i = 0; i < positions.length; i++) {
        const pos = positions[i];
        // Convert game coords to Three.js: x stays, z is negated
        const worldX = pos.x;
        const worldZ = -pos.z;
        const worldY = config.yOffset;

        tempQuat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), pos.rotation);
        tempScale.setScalar(config.scale);
        tempMatrix.compose(new THREE.Vector3(worldX, worldY, worldZ), tempQuat, tempScale);
        instanced.setMatrixAt(i, tempMatrix);
      }

      instanced.instanceMatrix.needsUpdate = true;
      scene.add(instanced);
      createdObjects.push(instanced);

      // Add flame meshes on top of fire baskets and candles for visual flair
      if (
        config.emitsLight &&
        (type === 'prop_firebasket' || type === 'prop_candle' || type === 'prop_candle_multi')
      ) {
        const flameGeo = new THREE.SphereGeometry(type === 'prop_firebasket' ? 0.18 : 0.05, 6, 6);
        createdGeometries.push(flameGeo);

        const flameMat = new THREE.MeshBasicMaterial({
          color: config.lightColor ?? config.emissive ?? '#ff6600',
          transparent: true,
          opacity: 0.85,
        });
        createdMaterials.push(flameMat);

        const flameInstanced = new THREE.InstancedMesh(flameGeo, flameMat, positions.length);
        flameInstanced.name = `dungeon-props-${type}-flame`;

        for (let i = 0; i < positions.length; i++) {
          const pos = positions[i];
          const worldX = pos.x;
          const worldZ = -pos.z;
          // Flame sits on top of the prop
          const flameY = config.yOffset * 2 + (type === 'prop_firebasket' ? 0.15 : 0.12);

          tempMatrix.makeTranslation(worldX, flameY, worldZ);
          flameInstanced.setMatrixAt(i, tempMatrix);
        }

        flameInstanced.instanceMatrix.needsUpdate = true;
        scene.add(flameInstanced);
        createdObjects.push(flameInstanced);
      }

      // Create point lights for light-emitting props (limited count)
      if (config.emitsLight && totalLightsPlaced < MAX_PROP_LIGHTS) {
        // Spread lights evenly across instances if there are many
        const lightCount = Math.min(positions.length, MAX_PROP_LIGHTS - totalLightsPlaced);
        const step = Math.max(1, Math.floor(positions.length / lightCount));

        for (let i = 0; i < positions.length && totalLightsPlaced < MAX_PROP_LIGHTS; i += step) {
          const pos = positions[i];
          const worldX = pos.x;
          const worldZ = -pos.z;
          const lightY = config.yOffset * 2 + 0.3;

          const light = new THREE.PointLight(
            config.lightColor ?? config.color,
            config.lightIntensity ?? 1,
            config.lightDistance ?? 4,
          );
          light.name = `prop-light-${type}-${i}`;
          light.position.set(worldX, lightY, worldZ);
          scene.add(light);
          createdObjects.push(light);

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
    }

    flickerLightsRef.current = flickerLights;

    // Cleanup
    return () => {
      for (const obj of createdObjects) {
        scene.remove(obj);
        if (obj instanceof THREE.PointLight) {
          obj.dispose();
        }
      }

      for (const geo of createdGeometries) {
        geo.dispose();
      }

      for (const mat of createdMaterials) {
        mat.dispose();
      }

      flickerLightsRef.current = [];
    };
  }, [scene, grouped]);

  // Per-frame flicker update for prop lights
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    for (const entry of flickerLightsRef.current) {
      // Sinusoidal flicker with slight randomness
      const flicker = Math.sin(time * entry.speed + entry.phase) * 0.3;
      const noise = Math.sin(time * entry.speed * 2.7 + entry.phase * 1.3) * 0.1;
      entry.light.intensity = Math.max(0.1, entry.baseIntensity + flicker + noise);
    }
  });

  return null;
}
