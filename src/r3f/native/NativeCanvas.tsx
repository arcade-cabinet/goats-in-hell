/**
 * Native canvas wrapper for R3F using react-native-wgpu.
 *
 * SETUP REQUIRED:
 * 1. npm install react-native-wgpu @react-three/fiber @react-three/rapier three
 * 2. cd ios && pod install
 * 3. Configure R3F Canvas with async WebGPU renderer
 *
 * NOTE: This is experimental. GLB loading on native has known issues.
 * Web + WebXR is the primary platform.
 */

import React from 'react';

// Uncomment these imports when R3F packages are installed:
// import {Suspense} from 'react';
// import {Canvas} from '@react-three/fiber';
// import * as THREE from 'three';
// import {Physics} from '@react-three/rapier';
// import {R3FScene} from '../R3FScene';

/**
 * When react-native-wgpu is installed, use this Canvas configuration:
 *
 * <Canvas
 *   gl={async (props) => {
 *     const renderer = new THREE.WebGPURenderer(props);
 *     await renderer.init();
 *     return renderer;
 *   }}
 *   shadows
 *   frameloop="always"
 *   camera={{fov: 75, near: 0.1, far: 100, position: [0, 1.6, 0]}}
 * >
 *
 * For now, use the standard WebGL renderer which works on web:
 */

interface NativeCanvasProps {
  children?: React.ReactNode;
}

/**
 * NativeCanvas wraps the R3F Canvas with the correct configuration for
 * native mobile rendering via react-native-wgpu.
 *
 * Usage:
 *   import {NativeCanvas} from '../r3f/native';
 *
 *   function App() {
 *     return <NativeCanvas />;
 *   }
 *
 * Once react-native-wgpu and R3F are installed, uncomment the Canvas
 * implementation below and remove the placeholder.
 */
export function NativeCanvas({ children }: NativeCanvasProps) {
  // -------------------------------------------------------------------
  // PLACEHOLDER: Replace this block with the real Canvas once R3F and
  // react-native-wgpu are installed. The commented-out implementation
  // below shows the target configuration.
  // -------------------------------------------------------------------

  return React.createElement(
    'div',
    { style: { flex: 1, alignItems: 'center', justifyContent: 'center' } },
    React.createElement(
      'span',
      null,
      'NativeCanvas: install @react-three/fiber and react-native-wgpu to enable',
    ),
    children,
  );

  // -------------------------------------------------------------------
  // TARGET IMPLEMENTATION (uncomment when dependencies are installed):
  // -------------------------------------------------------------------
  //
  // return (
  //   <Canvas
  //     shadows
  //     frameloop="always"
  //     gl={{antialias: false}}
  //     camera={{fov: 75, near: 0.1, far: 100, position: [0, 1.6, 0]}}
  //   >
  //     <Suspense fallback={null}>
  //       <Physics gravity={[0, -9.81, 0]} timeStep="vary">
  //         <R3FScene>
  //           {children}
  //         </R3FScene>
  //       </Physics>
  //     </Suspense>
  //   </Canvas>
  // );
}
