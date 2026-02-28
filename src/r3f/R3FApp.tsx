import React, {Suspense} from 'react';
import {Canvas} from '@react-three/fiber';
import {Physics} from '@react-three/rapier';
import {R3FScene} from './R3FScene';

/**
 * Top-level R3F canvas wrapper.
 *
 * - `shadows` enables Three.js shadow maps globally
 * - `frameloop="always"` keeps the game loop running every frame
 * - sRGB color management is the R3F v9 default
 * - Rapier Physics context wraps the entire scene for collision/raycasting
 */
export function R3FApp({children}: {children?: React.ReactNode}) {
  return (
    <Canvas
      shadows
      frameloop="always"
      gl={{antialias: false}} // postprocessing handles AA via FXAA
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        touchAction: 'none',
      }}
      camera={{fov: 75, near: 0.1, far: 100, position: [0, 1.6, 0]}}
    >
      <Suspense fallback={null}>
        <Physics gravity={[0, -9.81, 0]} timeStep="vary">
          <R3FScene>
            {children}
          </R3FScene>
        </Physics>
      </Suspense>
    </Canvas>
  );
}
