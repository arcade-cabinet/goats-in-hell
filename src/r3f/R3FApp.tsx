import { Canvas, extend, type ThreeToJSXElements } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import type React from 'react';
import { Suspense, useEffect, useState } from 'react';
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
 * Minimal 3D loading scene shown inside the Canvas while Suspense resolves.
 * Renders a dim scene with basic lighting so the player sees *something*
 * instead of pure black while GLB models and textures download.
 */
function LoadingFallback() {
  return (
    <>
      <color attach="background" args={['#1a0808']} />
      <ambientLight intensity={0.3} color="#ff4400" />
      <pointLight position={[0, 2, 0]} intensity={1.5} color="#ff6622" distance={10} />
    </>
  );
}

/**
 * Top-level R3F canvas wrapper.
 *
 * - Uses WebGPURenderer with automatic WebGL2 fallback
 * - `shadows` enables Three.js shadow maps globally
 * - `frameloop="always"` keeps the game loop running every frame
 * - sRGB color management is the R3F v9 default
 * - Rapier Physics context wraps the entire scene for collision/raycasting
 * - Shows an HTML loading overlay + 3D fallback scene until assets resolve
 */
export function R3FApp({ children }: { children?: React.ReactNode }) {
  const [rendererReady, setRendererReady] = useState(false);

  return (
    <>
      {/* HTML loading overlay — visible until renderer + Suspense resolve */}
      {!rendererReady && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1a0808',
            zIndex: 10,
            fontFamily: 'monospace',
          }}
        >
          <div style={{ color: '#ff4400', fontSize: 24, marginBottom: 16 }}>
            DESCENDING INTO HELL...
          </div>
          <div style={{ color: '#ff6622', fontSize: 14, opacity: 0.7 }}>Loading assets</div>
        </div>
      )}
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
            try {
              const fallback = new THREE.WebGPURenderer({
                canvas: canvas as HTMLCanvasElement,
                antialias: false,
                forceWebGL: true,
              });
              await fallback.init();
              return fallback;
            } catch (fallbackErr) {
              console.error('[R3FApp] WebGL2 fallback also failed:', fallbackErr);
              throw fallbackErr;
            }
          }
          return renderer;
        }}
        onCreated={({ gl, scene, camera }) => {
          // Add camera to scene graph so camera-parented objects (WeaponViewModel)
          // are traversed during rendering. R3F v9 does NOT add the camera to the
          // scene by default — without this, camera.add(child) objects are invisible.
          scene.add(camera);
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
        camera={{ fov: 75, near: 0.3, far: 100, position: [0, 1.6, 0] }}
      >
        <Suspense fallback={<LoadingFallback />}>
          <ReadySignal onReady={() => setRendererReady(true)} />
          <Physics gravity={[0, -9.81, 0]} timeStep="vary">
            <R3FScene>{children}</R3FScene>
          </Physics>
        </Suspense>
      </Canvas>
    </>
  );
}

/**
 * Invisible component that fires onReady when mounted inside Suspense.
 * Since it's inside the Suspense boundary, it only mounts AFTER all
 * suspended resources (useGLTF, useTexture, etc.) have resolved.
 */
function ReadySignal({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    onReady();
  }, [onReady]);
  return null;
}
