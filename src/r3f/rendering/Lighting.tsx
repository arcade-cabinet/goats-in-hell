/**
 * R3F Dynamic Lighting
 *
 * Creates theme-based point lights placed at open floor cells, a subtle
 * player-following spotlight, and a muzzle flash system. All lights are
 * created imperatively via useEffect + scene.add.
 *
 * This is the SOLE source of scene lighting — R3FScene.tsx sets background
 * and fog only, with no lights of its own, to avoid stacking/overlap.
 */

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three/webgpu';
import { renderingConfig } from '../../config';
import { CELL_SIZE } from '../../constants';
import type { FloorTheme } from '../../game/levels/FloorThemes';
import { MapCell } from '../../game/levels/LevelGenerator';
import { setAmbientLightForDevBridge } from '../debug/GameDevBridge';

// ---------------------------------------------------------------------------
// Theme-based light configurations
// ---------------------------------------------------------------------------

interface ThemeLightConfig {
  color: string;
  intensity: number;
  distance: number;
}

const THEME_LIGHTS: Record<string, ThemeLightConfig> = {
  firePits: renderingConfig.themeLights.firePits,
  fleshCaverns: renderingConfig.themeLights.fleshCaverns,
  obsidianFortress: renderingConfig.themeLights.obsidianFortress,
  theVoid: renderingConfig.themeLights.theVoid,
};

// Default fallback for unknown themes
const DEFAULT_THEME_LIGHT: ThemeLightConfig = renderingConfig.themeLights.default;

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

const MUZZLE_FLASH_DURATION = renderingConfig.muzzleFlash.durationMs;
const MUZZLE_FLASH_INTENSITY = renderingConfig.muzzleFlash.intensity;
const MUZZLE_FLASH_DISTANCE = renderingConfig.muzzleFlash.distance;
const MUZZLE_FLASH_COLOR = renderingConfig.muzzleFlash.color;

// Reusable temp vector for spotlight forward direction (avoids per-frame allocation)
const _spotForward = new THREE.Vector3();

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
// Helpers — find open floor cells for room light placement
// ---------------------------------------------------------------------------

/** MapCell values considered walkable open floor. */
function isFloorCell(cell: MapCell): boolean {
  return cell === MapCell.EMPTY || cell === MapCell.FLOOR_RAISED || cell === MapCell.DOOR;
}

/**
 * Collect candidate (gridX, gridZ) positions for room lights.
 * We stride through the grid at `spacing` intervals and pick cells that are
 * open floor, capping at `maxLights`. Positions are shuffled with a simple
 * deterministic Fisher-Yates so the same grid always produces the same lights.
 */
function pickFloorLightPositions(
  grid: MapCell[][],
  width: number,
  depth: number,
  spacing: number,
  maxLights: number,
): { gx: number; gz: number }[] {
  const candidates: { gx: number; gz: number }[] = [];

  for (let gz = 1; gz < depth - 1; gz += spacing) {
    for (let gx = 1; gx < width - 1; gx += spacing) {
      if (isFloorCell(grid[gz][gx])) {
        candidates.push({ gx, gz });
      }
    }
  }

  // Deterministic shuffle (seeded by grid dimensions so it's stable per level)
  let seed = width * 1000 + depth;
  for (let i = candidates.length - 1; i > 0; i--) {
    seed = (seed * 16807 + 0) % 2147483647; // LCG
    const j = seed % (i + 1);
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  return candidates.slice(0, maxLights);
}

// ---------------------------------------------------------------------------
// DynamicLighting component
// ---------------------------------------------------------------------------

interface DynamicLightingProps {
  theme: FloorTheme;
  grid: MapCell[][];
  width: number;
  depth: number;
}

interface TrackedPointLight {
  light: THREE.PointLight;
  baseIntensity: number;
  flickerSpeed: number;
  flickerPhase: number;
}

export function DynamicLighting({ theme, grid, width, depth }: DynamicLightingProps): null {
  const { scene, camera } = useThree();

  // Refs for all managed lights
  const roomLightsRef = useRef<TrackedPointLight[]>([]);
  const spotlightRef = useRef<THREE.SpotLight | null>(null);
  const ambientRef = useRef<THREE.AmbientLight | null>(null);
  const hemiRef = useRef<THREE.HemisphereLight | null>(null);

  // Store scene reference for muzzle flash system
  useEffect(() => {
    muzzleFlash.scene = scene;
    return () => {
      muzzleFlash.scene = null;
    };
  }, [scene]);

  // -------------------------------------------------------------------------
  // Create ambient light — very dim, warm reddish for hell atmosphere
  // -------------------------------------------------------------------------
  useEffect(() => {
    const ambient = new THREE.AmbientLight(theme.ambientColor, renderingConfig.ambient.intensity);
    ambient.name = 'ambientLight';
    scene.add(ambient);
    ambientRef.current = ambient;
    setAmbientLightForDevBridge(ambient);

    // Hemisphere light — sky color from theme, ground color warm (lava glow)
    // Provides soft fill so no surface is ever pure black
    const hemi = new THREE.HemisphereLight(
      renderingConfig.hemisphere.groundColor, // sky — dim warm grey (cavern ceiling bounce)
      theme.ambientColor, // ground — theme color (lava/flesh/void glow from below)
      renderingConfig.hemisphere.skyIntensity,
    );
    hemi.name = 'hemisphereLight';
    scene.add(hemi);
    hemiRef.current = hemi;

    return () => {
      scene.remove(ambient);
      ambient.dispose();
      ambientRef.current = null;
      scene.remove(hemi);
      hemi.dispose();
      hemiRef.current = null;
    };
  }, [scene, theme]);

  // -------------------------------------------------------------------------
  // Create theme-based room point lights at open floor cells
  // -------------------------------------------------------------------------
  useEffect(() => {
    const config = THEME_LIGHTS[theme.name] ?? DEFAULT_THEME_LIGHT;
    const lights: TrackedPointLight[] = [];

    const LIGHT_SPACING = renderingConfig.roomLights.spacing; // grid-cell stride between candidate positions
    const MAX_ROOM_LIGHTS = renderingConfig.roomLights.maxLights;

    const positions = pickFloorLightPositions(grid, width, depth, LIGHT_SPACING, MAX_ROOM_LIGHTS);

    // Deterministic seed for flicker variation
    let flickerSeed = width * 1000 + depth;

    for (const { gx, gz } of positions) {
      const light = new THREE.PointLight(config.color, config.intensity, config.distance);
      light.name = `roomLight_${lights.length}`;
      // Convert grid coords to world coords (Z negated for R3F convention)
      light.position.set(gx * CELL_SIZE, 2.0, -(gz * CELL_SIZE));

      scene.add(light);

      flickerSeed = (flickerSeed * 16807) % 2147483647;
      const flickerSpeed = 2 + (flickerSeed % 300) / 100; // 2–5
      flickerSeed = (flickerSeed * 16807) % 2147483647;
      const flickerPhase = ((flickerSeed % 628) / 100) * 1; // 0–~6.28

      lights.push({
        light,
        baseIntensity: config.intensity,
        flickerSpeed,
        flickerPhase,
      });
    }

    roomLightsRef.current = lights;

    return () => {
      for (const tracked of lights) {
        scene.remove(tracked.light);
        tracked.light.dispose();
      }
      roomLightsRef.current = [];
    };
  }, [scene, theme, grid, width, depth]);

  // -------------------------------------------------------------------------
  // Create player spotlight — subtle forward-facing, attached to camera
  // -------------------------------------------------------------------------
  useEffect(() => {
    const spotlight = new THREE.SpotLight(
      renderingConfig.spotlight.color, // warm white
      renderingConfig.spotlight.intensity, // bright enough to see surroundings
      renderingConfig.spotlight.distance, // distance — lights up more of the dungeon ahead
      renderingConfig.spotlight.angle, // angle (radians) — wide cone for peripheral visibility
      renderingConfig.spotlight.penumbra, // penumbra — soft edge
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
        tracked.baseIntensity +
        Math.sin(time * tracked.flickerSpeed + tracked.flickerPhase) *
          renderingConfig.roomLights.flickerAmplitude;
    }

    // Update player spotlight to follow camera
    const spotlight = spotlightRef.current;
    if (spotlight) {
      spotlight.position.copy(cam.position);

      // Point the spotlight in the camera's forward direction
      _spotForward.set(0, 0, -1);
      _spotForward.applyQuaternion(cam.quaternion);
      spotlight.target.position.copy(cam.position).add(_spotForward.multiplyScalar(5));
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
