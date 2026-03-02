/**
 * R3FScene -- scene-level setup for the R3F canvas.
 *
 * Sets the dark hellfire background color and exponential fog. Actual lighting
 * is handled entirely by the DynamicLighting component to avoid overlap.
 *
 * Circle 1 (Limbo) — "Fog of War": fog density is increased to 0.08,
 * limiting visibility to ~8 grid cells (~16 world units).
 */
import { useThree } from '@react-three/fiber';
import type React from 'react';
import { useEffect } from 'react';
import * as THREE from 'three/webgpu';
import { useGameStore } from '../state/GameStore';

/** Default fog density for most circles. */
const DEFAULT_FOG_DENSITY = 0.028;
/** Circle 1 (Limbo) fog density — heavy fog, ~8 cell visibility. */
const CIRCLE_1_FOG_DENSITY = 0.08;

/**
 * Scene setup — lighting, fog, background.
 * Matches the Babylon.js hell-dungeon atmosphere.
 *
 * NOTE: Uses imperative Three.js API instead of R3F JSX to avoid type
 * conflicts with Reactylon's JSX augmentation during the migration period.
 * After Task 16 removes Reactylon, these can optionally become declarative.
 */
export function R3FScene({ children }: { children?: React.ReactNode }) {
  const { scene } = useThree();
  const circleNumber = useGameStore((s) => s.circleNumber);

  useEffect(() => {
    scene.background = new THREE.Color('#2a1010');
    const density = circleNumber === 1 ? CIRCLE_1_FOG_DENSITY : DEFAULT_FOG_DENSITY;
    scene.fog = new THREE.FogExp2('#2a1010', density);

    // All lighting is handled by DynamicLighting — no lights here to avoid
    // overlapping/stacking with theme-based lights.
  }, [scene, circleNumber]);

  return <>{children}</>;
}
