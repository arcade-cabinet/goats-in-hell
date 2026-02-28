import { useThree } from '@react-three/fiber';
import type React from 'react';
import { useEffect } from 'react';
import * as THREE from 'three';

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

    // Dim warm ambient — fills shadow areas so nothing is pitch black
    const ambient = new THREE.AmbientLight('#ffccaa', 0.15);
    scene.add(ambient);

    // Main directional light — shadow caster, angled like dungeon torchlight
    const dirLight = new THREE.DirectionalLight('#ff8855', 0.4);
    dirLight.position.set(5, 10, -5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(1024, 1024);
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 50;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;
    dirLight.shadow.camera.updateProjectionMatrix();
    scene.add(dirLight);

    return () => {
      scene.remove(ambient);
      scene.remove(dirLight);
      ambient.dispose();
      dirLight.dispose();
    };
  }, [scene]);

  return <>{children}</>;
}
