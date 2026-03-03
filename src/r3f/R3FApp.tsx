/**
 * R3FApp -- top-level React Three Fiber canvas wrapper.
 *
 * Sets up the WebGPU renderer, shadow maps, Rapier physics (web only),
 * and Suspense-based asset loading. Shows an HTML overlay while
 * models and textures are downloading.
 *
 * On native (iOS/Android), Rapier is disabled via PhysicsWrapper.
 * Player movement falls back to non-physical kinematic control (Phase 2).
 */
import { Canvas, extend, type ThreeToJSXElements } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import type React from 'react';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import * as THREE from 'three/webgpu';
import { R3FScene } from './R3FScene';

/**
 * On web, probe for WebGL2 support by creating a throwaway canvas context.
 * Used as the useState initialiser so the Canvas never mounts when WebGL2 is
 * absent (e.g. headless CI without GPU), preventing a null-context crash
 * inside Three.js internals (getSupportedExtensions on a null gl object).
 * On native, react-native-wgpu provides WebGPU directly — no probe needed.
 */
function detectWebGLError(): string | null {
  if (Platform.OS !== 'web') return null;
  if (typeof document === 'undefined') return null; // SSR — defer to client
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2');
    if (!gl) {
      return 'WebGL2 is not supported in this environment. Please use Chrome 113+, Firefox, or Safari 16+ to play.';
    }
    // Exercise the API: Three.js calls getContextAttributes() early in its
    // WebGL2 backend. If this method is missing (e.g. incomplete software
    // renderers like SwiftShader in headless CI), catch it here rather than
    // letting it crash inside Three.js internals.
    if (typeof gl.getContextAttributes !== 'function') {
      return 'Incomplete WebGL2 implementation detected. Please use Chrome, Firefox, or Safari.';
    }
    gl.getContextAttributes();
  } catch {
    return 'WebGL2 context initialisation failed. Please try a different browser.';
  }
  return null;
}

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
 * Wraps children in Rapier Physics context on web.
 * On native, Rapier WASM is not yet available — children render without physics.
 * Phase 2 will add a kinematic movement fallback for native.
 */
function PhysicsWrapper({ children }: { children: React.ReactNode }) {
  if (Platform.OS !== 'web') return <>{children}</>;
  return (
    <Suspense fallback={null}>
      <Physics gravity={[0, -9.81, 0]} timeStep="vary">
        {children}
      </Physics>
    </Suspense>
  );
}

/**
 * Top-level R3F canvas wrapper.
 *
 * - Uses WebGPURenderer (react-native-wgpu provides WebGPU on native)
 * - `shadows` enables Three.js shadow maps globally
 * - `frameloop="always"` keeps the game loop running every frame
 * - sRGB color management is the R3F v9 default
 * - PhysicsWrapper enables Rapier on web; native boots without physics (Phase 2)
 * - Shows an HTML loading overlay + 3D fallback scene until assets resolve
 * - Canvas wrapped in View for correct native layout
 */
export function R3FApp({ children }: { children?: React.ReactNode }) {
  const [rendererReady, setRendererReady] = useState(false);
  // Synchronous WebGL2 probe: if the probe fails on web, skip the Canvas entirely
  // and show an error screen rather than hanging on the loading screen forever.
  const [webglError] = useState<string | null>(detectWebGLError);
  const onReady = useCallback(() => setRendererReady(true), []);

  if (webglError) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1a0808',
        }}
      >
        <div style={{ color: '#ff4400', fontSize: 20, fontFamily: 'monospace' }}>
          RENDERER UNAVAILABLE
        </div>
        <div
          style={{
            color: '#ff6622',
            fontSize: 13,
            fontFamily: 'monospace',
            opacity: 0.8,
            maxWidth: 420,
            textAlign: 'center',
            marginTop: 12,
          }}
        >
          {webglError}
        </div>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
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
        dpr={[1, 2]}
        gl={async (props) => {
          // react-native-wgpu provides a W3C WebGPU surface on native.
          // On web, Three.js WebGPURenderer uses the browser WebGPU API.
          const { canvas } = props;
          const renderer = new THREE.WebGPURenderer({
            canvas: canvas as HTMLCanvasElement,
            antialias: true,
          });
          await renderer.init();
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
          <ReadySignal onReady={onReady} />
          <PhysicsWrapper>
            <R3FScene>{children}</R3FScene>
          </PhysicsWrapper>
        </Suspense>
      </Canvas>
    </View>
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
