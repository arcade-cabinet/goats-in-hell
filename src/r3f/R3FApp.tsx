import { Canvas, extend, type ThreeToJSXElements } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import type React from 'react';
import { Suspense } from 'react';
import * as THREE from 'three/webgpu';
import { R3FScene } from './R3FScene';

// Register all Three.js classes with R3F's JSX element map for WebGPU builds.
// This ensures <mesh>, <boxGeometry>, etc. resolve correctly when using
// the three/webgpu entry point instead of the default 'three' export.
declare module '@react-three/fiber' {
  interface ThreeElements extends ThreeToJSXElements<typeof THREE> {}
}
// Cast needed: three/webgpu re-exports non-constructor namespaces (e.g. RendererUtils)
// which don't satisfy R3F's Catalogue index signature.
extend(THREE as any);

/**
 * Top-level R3F canvas wrapper.
 *
 * - Uses WebGPURenderer with automatic WebGL2 fallback
 * - `shadows` enables Three.js shadow maps globally
 * - `frameloop="always"` keeps the game loop running every frame
 * - sRGB color management is the R3F v9 default
 * - Rapier Physics context wraps the entire scene for collision/raycasting
 */
export function R3FApp({ children }: { children?: React.ReactNode }) {
  return (
    <Canvas
      shadows
      frameloop="always"
      gl={async (props) => {
        // Extract only WebGPU-compatible properties from R3F's canvas props.
        // R3F passes WebGL-typed props (powerPreference: WebGLPowerPreference)
        // that are incompatible with WebGPURendererParameters.
        const { canvas } = props;
        const renderer = new THREE.WebGPURenderer({
          canvas: canvas as HTMLCanvasElement,
          antialias: false, // postprocessing handles AA via FXAA
        });
        try {
          await renderer.init();
        } catch (err) {
          console.warn('[R3FApp] WebGPURenderer.init() failed, falling back to WebGL2:', err);
          // Dispose the failed renderer and create a WebGL2 fallback
          renderer.dispose();
          const fallback = new THREE.WebGPURenderer({
            canvas: canvas as HTMLCanvasElement,
            antialias: false,
            forceWebGL: true,
          });
          await fallback.init();
          return fallback;
        }
        return renderer;
      }}
      onCreated={({ gl }) => {
        const name = gl.constructor.name;
        const backend = (gl as any).backend?.constructor?.name ?? 'unknown';
        console.log(`[R3FApp] Renderer: ${name}, backend: ${backend}`);
      }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        touchAction: 'none',
      }}
      camera={{ fov: 75, near: 0.1, far: 100, position: [0, 1.6, 0] }}
    >
      <Suspense fallback={null}>
        <Physics gravity={[0, -9.81, 0]} timeStep="vary">
          <R3FScene>{children}</R3FScene>
        </Physics>
      </Suspense>
    </Canvas>
  );
}
