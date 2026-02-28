/**
 * R3F Dynamic Lighting
 *
 * Creates theme-based point lights, a player-following spotlight,
 * and a muzzle flash system. All lights are created imperatively
 * via useEffect + scene.add to avoid JSX type conflicts with Reactylon.
 */

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { FloorTheme } from '../../game/levels/FloorThemes';

// ---------------------------------------------------------------------------
// Theme-based light configurations
// ---------------------------------------------------------------------------

interface ThemeLightConfig {
  color: string;
  intensity: number;
  distance: number;
}

const THEME_LIGHTS: Record<string, ThemeLightConfig> = {
  firePits: { color: '#ff4400', intensity: 2, distance: 8 },
  fleshCaverns: { color: '#cc3333', intensity: 1, distance: 6 },
  obsidianFortress: { color: '#4466aa', intensity: 1.5, distance: 8 },
  theVoid: { color: '#6600cc', intensity: 2, distance: 10 },
};

// Default fallback for unknown themes
const DEFAULT_THEME_LIGHT: ThemeLightConfig = {
  color: '#ff4400',
  intensity: 1.5,
  distance: 8,
};

// ---------------------------------------------------------------------------
// Muzzle flash module-level state
// ---------------------------------------------------------------------------

interface MuzzleFlashState {
  light: THREE.PointLight | null;
  startTime: number;
  active: boolean;
  scene: THREE.Scene | null;
}

const muzzleFlash: MuzzleFlashState = {
  light: null,
  startTime: 0,
  active: false,
  scene: null,
};

const MUZZLE_FLASH_DURATION = 100; // ms
const MUZZLE_FLASH_INTENSITY = 5;
const MUZZLE_FLASH_DISTANCE = 4;
const MUZZLE_FLASH_COLOR = '#ffffcc'; // yellow-white

/**
 * Trigger a muzzle flash at the given world position.
 * Creates a temporary bright PointLight that fades over 100ms.
 */
export function triggerMuzzleFlash(position: THREE.Vector3): void {
  if (!muzzleFlash.scene) return;

  // Reuse existing light or create a new one
  if (!muzzleFlash.light) {
    muzzleFlash.light = new THREE.PointLight(MUZZLE_FLASH_COLOR, 0, MUZZLE_FLASH_DISTANCE);
    muzzleFlash.light.name = 'muzzleFlashLight';
    muzzleFlash.scene.add(muzzleFlash.light);
  }

  muzzleFlash.light.position.copy(position);
  muzzleFlash.light.intensity = MUZZLE_FLASH_INTENSITY;
  muzzleFlash.startTime = performance.now();
  muzzleFlash.active = true;
}

// ---------------------------------------------------------------------------
// DynamicLighting component
// ---------------------------------------------------------------------------

interface DynamicLightingProps {
  theme: FloorTheme;
}

interface TrackedPointLight {
  light: THREE.PointLight;
  baseIntensity: number;
  flickerSpeed: number;
  flickerPhase: number;
}

export function DynamicLighting({ theme }: DynamicLightingProps): null {
  const { scene, camera } = useThree();

  // Refs for all managed lights
  const roomLightsRef = useRef<TrackedPointLight[]>([]);
  const spotlightRef = useRef<THREE.SpotLight | null>(null);
  const ambientRef = useRef<THREE.AmbientLight | null>(null);

  // Store scene reference for muzzle flash system
  useEffect(() => {
    muzzleFlash.scene = scene;
    return () => {
      muzzleFlash.scene = null;
    };
  }, [scene]);

  // -------------------------------------------------------------------------
  // Create ambient light
  // -------------------------------------------------------------------------
  useEffect(() => {
    const ambient = new THREE.AmbientLight(theme.ambientColor, 0.15);
    ambient.name = 'ambientLight';
    scene.add(ambient);
    ambientRef.current = ambient;

    return () => {
      scene.remove(ambient);
      ambient.dispose();
      ambientRef.current = null;
    };
  }, [scene, theme]);

  // -------------------------------------------------------------------------
  // Create theme-based room point lights
  // -------------------------------------------------------------------------
  useEffect(() => {
    const config = THEME_LIGHTS[theme.name] ?? DEFAULT_THEME_LIGHT;
    const lights: TrackedPointLight[] = [];

    // Create a grid of point lights to illuminate the level.
    // Place them at regular intervals; the exact positions will be
    // adjusted by level geometry in a real integration, but for now
    // we create a reasonable grid pattern.
    const GRID_SPACING = 6;
    const GRID_COUNT = 4; // 4x4 = 16 positions, capped at 6 lights
    const MAX_ROOM_LIGHTS = 6;

    for (let gz = 0; gz < GRID_COUNT && lights.length < MAX_ROOM_LIGHTS; gz++) {
      for (let gx = 0; gx < GRID_COUNT && lights.length < MAX_ROOM_LIGHTS; gx++) {
        // Skip some positions for variety (checkerboard-ish pattern)
        if ((gx + gz) % 2 === 0) continue;

        const light = new THREE.PointLight(config.color, config.intensity, config.distance);
        light.name = `roomLight_${lights.length}`;
        light.position.set(
          gx * GRID_SPACING - (GRID_COUNT * GRID_SPACING) / 2,
          2.0, // slightly below ceiling
          gz * GRID_SPACING - (GRID_COUNT * GRID_SPACING) / 2,
        );

        scene.add(light);

        const flickerSpeed = 2 + Math.random() * 3;
        const flickerPhase = Math.random() * Math.PI * 2;

        lights.push({
          light,
          baseIntensity: config.intensity,
          flickerSpeed,
          flickerPhase,
        });
      }
    }

    roomLightsRef.current = lights;

    return () => {
      for (const tracked of lights) {
        scene.remove(tracked.light);
        tracked.light.dispose();
      }
      roomLightsRef.current = [];
    };
  }, [scene, theme]);

  // -------------------------------------------------------------------------
  // Create player spotlight (forward-facing, attached to camera)
  // -------------------------------------------------------------------------
  useEffect(() => {
    const spotlight = new THREE.SpotLight(
      '#fff5e0', // warm white
      0.3,
      15,
      0.5, // angle (radians)
      0.5, // penumbra
    );
    spotlight.name = 'playerSpotlight';
    spotlight.position.copy(camera.position);

    // SpotLight needs a target; create a target object ahead of camera
    const target = new THREE.Object3D();
    target.name = 'spotlightTarget';
    scene.add(target);
    spotlight.target = target;

    scene.add(spotlight);
    spotlightRef.current = spotlight;

    return () => {
      scene.remove(spotlight);
      scene.remove(target);
      spotlight.dispose();
      spotlightRef.current = null;
    };
  }, [scene, camera]);

  // -------------------------------------------------------------------------
  // Muzzle flash light cleanup on unmount
  // -------------------------------------------------------------------------
  useEffect(() => {
    return () => {
      if (muzzleFlash.light) {
        if (muzzleFlash.scene) {
          muzzleFlash.scene.remove(muzzleFlash.light);
        }
        muzzleFlash.light.dispose();
        muzzleFlash.light = null;
        muzzleFlash.active = false;
      }
    };
  }, []);

  // -------------------------------------------------------------------------
  // Per-frame updates
  // -------------------------------------------------------------------------
  useFrame(({ clock, camera: cam }) => {
    const time = clock.getElapsedTime();

    // Flicker room point lights with sinusoidal variation
    for (const tracked of roomLightsRef.current) {
      tracked.light.intensity =
        tracked.baseIntensity + Math.sin(time * tracked.flickerSpeed + tracked.flickerPhase) * 0.2;
    }

    // Update player spotlight to follow camera
    const spotlight = spotlightRef.current;
    if (spotlight) {
      spotlight.position.copy(cam.position);

      // Point the spotlight in the camera's forward direction
      const forward = new THREE.Vector3(0, 0, -1);
      forward.applyQuaternion(cam.quaternion);
      spotlight.target.position.copy(cam.position).add(forward.multiplyScalar(5));
      spotlight.target.updateMatrixWorld();
    }

    // Update muzzle flash fade-out
    if (muzzleFlash.active && muzzleFlash.light) {
      const elapsed = performance.now() - muzzleFlash.startTime;
      if (elapsed >= MUZZLE_FLASH_DURATION) {
        muzzleFlash.light.intensity = 0;
        muzzleFlash.active = false;
      } else {
        // Linear fade out
        const t = 1 - elapsed / MUZZLE_FLASH_DURATION;
        muzzleFlash.light.intensity = MUZZLE_FLASH_INTENSITY * t;
      }
    }
  });

  // This component only manages imperative Three.js objects
  return null;
}
