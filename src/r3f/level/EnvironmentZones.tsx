/**
 * EnvironmentZones — R3F component that renders visual effects for
 * environment zones loaded from the level database.
 *
 * Each zone type gets a distinct visual treatment:
 * - fire: emissive orange plane + point light
 * - fog: semi-transparent white box
 * - acid/poison: emissive green plane + point light
 * - ice/frost: blue-tinted transparent plane
 * - wind: semi-transparent streaked plane with scrolling UV
 * - blood: dark red emissive plane
 * - void: dark purple transparent plane
 * - illusion: subtle shimmer plane
 *
 * Follows the DungeonProps.tsx pattern: imperative Three.js, scene.add/remove,
 * proper cleanup of geometries and materials.
 */

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three/webgpu';
import type { RuntimeEnvZone } from '../../db/LevelDbAdapter';

// ---------------------------------------------------------------------------
// Zone visual configs
// ---------------------------------------------------------------------------

interface ZoneVisualConfig {
  color: string;
  opacity: number;
  emissive?: string;
  emissiveIntensity?: number;
  /** Whether to use a BoxGeometry (volumetric) instead of flat PlaneGeometry. */
  volumetric?: boolean;
  /** Height of volumetric box (world units). */
  volumeHeight?: number;
  /** Whether to add a PointLight at the zone center. */
  light?: boolean;
  lightColor?: string;
  lightIntensity?: number;
  lightDistance?: number;
}

const ZONE_CONFIGS: Record<string, ZoneVisualConfig> = {
  fire: {
    color: '#ff4400',
    opacity: 0.4,
    emissive: '#ff6600',
    emissiveIntensity: 2.0,
    light: true,
    lightColor: '#ff6600',
    lightIntensity: 1.5,
    lightDistance: 8,
  },
  fog: {
    color: '#aaaaaa',
    opacity: 0.3,
    volumetric: true,
    volumeHeight: 2.0,
  },
  acid: {
    color: '#44ff00',
    opacity: 0.45,
    emissive: '#33cc00',
    emissiveIntensity: 1.5,
    light: true,
    lightColor: '#44ff00',
    lightIntensity: 1.0,
    lightDistance: 6,
  },
  poison: {
    color: '#44ff00',
    opacity: 0.45,
    emissive: '#33cc00',
    emissiveIntensity: 1.5,
    light: true,
    lightColor: '#44ff00',
    lightIntensity: 1.0,
    lightDistance: 6,
  },
  ice: {
    color: '#88ccff',
    opacity: 0.3,
    emissive: '#4488cc',
    emissiveIntensity: 0.5,
  },
  frost: {
    color: '#88ccff',
    opacity: 0.3,
    emissive: '#4488cc',
    emissiveIntensity: 0.5,
  },
  wind: {
    color: '#ccccdd',
    opacity: 0.15,
    volumetric: true,
    volumeHeight: 2.5,
  },
  blood: {
    color: '#440000',
    opacity: 0.5,
    emissive: '#660000',
    emissiveIntensity: 1.0,
  },
  void: {
    color: '#220044',
    opacity: 0.35,
    emissive: '#110022',
    emissiveIntensity: 0.8,
  },
  illusion: {
    color: '#8866cc',
    opacity: 0.12,
    emissive: '#6644aa',
    emissiveIntensity: 0.3,
  },
};

// Maximum zone lights to avoid GPU overload
const MAX_ZONE_LIGHTS = 8;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface EnvironmentZonesProps {
  zones: RuntimeEnvZone[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Renders environment zone visual effects.
 * Returns null — all rendering is side-effectful via scene.add().
 */
export function EnvironmentZones({ zones }: EnvironmentZonesProps): null {
  const scene = useThree((state) => state.scene);

  // Track pulsating lights for per-frame updates
  const pulseLightsRef = useRef<
    { light: THREE.PointLight; baseIntensity: number; speed: number; phase: number }[]
  >([]);

  // Track opacity-animated meshes for per-frame timer cycling
  const timerMeshesRef = useRef<{ mesh: THREE.Mesh; zone: RuntimeEnvZone; baseOpacity: number }[]>(
    [],
  );

  useEffect(() => {
    if (zones.length === 0) return;

    const createdObjects: THREE.Object3D[] = [];
    const createdGeometries: THREE.BufferGeometry[] = [];
    const createdMaterials: THREE.Material[] = [];
    const pulseLights: {
      light: THREE.PointLight;
      baseIntensity: number;
      speed: number;
      phase: number;
    }[] = [];
    const timerMeshes: {
      mesh: THREE.Mesh;
      zone: RuntimeEnvZone;
      baseOpacity: number;
    }[] = [];

    let lightsPlaced = 0;

    for (const zone of zones) {
      const config = ZONE_CONFIGS[zone.envType];
      if (!config) continue;

      // Compute world-space center position
      // Zone bounds: (x, z) is top-left, (w, h) is size, all in world coords
      // Three.js Z-negation: negate the center Z
      const centerX = zone.x + zone.w / 2;
      const centerZ = -(zone.z + zone.h / 2);

      const opacity = config.opacity * zone.intensity;

      // Create geometry: flat plane or volumetric box
      let geometry: THREE.BufferGeometry;
      let yPos: number;

      if (config.volumetric) {
        const height = (config.volumeHeight ?? 2) * zone.intensity;
        geometry = new THREE.BoxGeometry(zone.w, height, zone.h);
        yPos = height / 2;
      } else {
        geometry = new THREE.PlaneGeometry(zone.w, zone.h);
        geometry.rotateX(-Math.PI / 2); // lie flat
        yPos = 0.05; // slightly above floor to avoid z-fighting
      }
      createdGeometries.push(geometry);

      // Create material
      const material = new THREE.MeshBasicMaterial({
        color: config.color,
        transparent: true,
        opacity,
        side: config.volumetric ? THREE.BackSide : THREE.DoubleSide,
        depthWrite: false,
      });

      // Add emissive glow via MeshStandardMaterial for fire/acid/blood/void/ice
      let meshMaterial: THREE.Material = material;
      if (config.emissive) {
        const stdMat = new THREE.MeshStandardMaterial({
          color: config.color,
          emissive: config.emissive,
          emissiveIntensity: config.emissiveIntensity ?? 1,
          transparent: true,
          opacity,
          side: config.volumetric ? THREE.BackSide : THREE.DoubleSide,
          depthWrite: false,
          roughness: 1,
          metalness: 0,
        });
        createdMaterials.push(stdMat);
        material.dispose(); // won't use the basic one
        meshMaterial = stdMat;
      } else {
        createdMaterials.push(material);
      }

      // Create mesh
      const mesh = new THREE.Mesh(geometry, meshMaterial);
      mesh.position.set(centerX, yPos, centerZ);
      mesh.name = `env-zone-${zone.envType}-${zone.id}`;
      mesh.renderOrder = 1; // render after opaque
      scene.add(mesh);
      createdObjects.push(mesh);

      // Track timed zones for fade in/out
      if (zone.timerOn > 0 && zone.timerOff > 0) {
        timerMeshes.push({ mesh, zone, baseOpacity: opacity });
      }

      // Add point light for glowing zone types
      if (config.light && lightsPlaced < MAX_ZONE_LIGHTS) {
        const light = new THREE.PointLight(
          config.lightColor ?? config.color,
          (config.lightIntensity ?? 1) * zone.intensity,
          config.lightDistance ?? 6,
        );
        light.position.set(centerX, 1.0, centerZ);
        light.name = `env-zone-light-${zone.id}`;
        scene.add(light);
        createdObjects.push(light);

        pulseLights.push({
          light,
          baseIntensity: (config.lightIntensity ?? 1) * zone.intensity,
          speed: 2 + Math.random() * 2,
          phase: Math.random() * Math.PI * 2,
        });

        lightsPlaced++;
      }
    }

    pulseLightsRef.current = pulseLights;
    timerMeshesRef.current = timerMeshes;

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
      pulseLightsRef.current = [];
      timerMeshesRef.current = [];
    };
  }, [scene, zones]);

  // Per-frame: pulse lights and handle timer-based zone visibility
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const now = performance.now();

    // Pulse lights
    for (const entry of pulseLightsRef.current) {
      const pulse = Math.sin(time * entry.speed + entry.phase) * 0.3;
      entry.light.intensity = Math.max(0.1, entry.baseIntensity + pulse);
    }

    // Timer-based zone fade
    for (const entry of timerMeshesRef.current) {
      const { zone, baseOpacity, mesh } = entry;
      const period = zone.timerOn + zone.timerOff;
      const phase = now % period;

      // Fade transitions at the boundaries (100ms fade)
      const fadeDuration = 100;
      let alpha = 1;

      if (phase >= zone.timerOn) {
        // In the "off" portion
        const offElapsed = phase - zone.timerOn;
        if (offElapsed < fadeDuration) {
          alpha = 1 - offElapsed / fadeDuration;
        } else if (phase > period - fadeDuration) {
          alpha = (period - phase) / fadeDuration;
          alpha = 1 - alpha; // fading back in
        } else {
          alpha = 0;
        }
      } else if (phase < fadeDuration) {
        // Just entered "on" portion
        alpha = phase / fadeDuration;
      }

      const mat = mesh.material as THREE.MeshBasicMaterial | THREE.MeshStandardMaterial;
      mat.opacity = baseOpacity * alpha;
      mesh.visible = alpha > 0.01;
    }
  });

  return null;
}
