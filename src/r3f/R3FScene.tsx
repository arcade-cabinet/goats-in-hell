import { useThree } from '@react-three/fiber';
import type React from 'react';
import { useEffect } from 'react';
import * as THREE from 'three/webgpu';

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

  useEffect(() => {
    scene.background = new THREE.Color('#0a0000');
    scene.fog = new THREE.FogExp2('#0a0000', 0.06);

    // All lighting is handled by DynamicLighting — no lights here to avoid
    // overlapping/stacking with theme-based lights.

    return () => {};
  }, [scene]);

  return <>{children}</>;
}
