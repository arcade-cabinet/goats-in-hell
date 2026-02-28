/**
 * MuzzleFlash — billboard sprite at the weapon barrel on fire.
 *
 * Creates a short-lived emissive plane at the barrel position when
 * the player fires. Also triggers triggerMuzzleFlash() from Lighting.tsx
 * for dynamic point light illumination.
 *
 * Fades out over ~50ms with random rotation for visual variety.
 */

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three/webgpu';
import { useGameStore } from '../../state/GameStore';
import { triggerMuzzleFlash as triggerDynamicLight } from '../rendering/Lighting';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FLASH_DURATION = 0.05; // 50ms in seconds
const FLASH_SIZE = 0.15; // world-space size of the flash quad
const FLASH_OFFSET_Z = -0.55; // forward from camera (camera looks -Z)
const FLASH_OFFSET_X = 0.2; // right from camera center (barrel position)
const FLASH_OFFSET_Y = -0.12; // slightly below center

// ---------------------------------------------------------------------------
// Shared resources
// ---------------------------------------------------------------------------

let sharedFlashGeometry: THREE.PlaneGeometry | null = null;
let sharedFlashMaterial: THREE.MeshBasicMaterial | null = null;

function getFlashGeometry(): THREE.PlaneGeometry {
  if (!sharedFlashGeometry) {
    sharedFlashGeometry = new THREE.PlaneGeometry(FLASH_SIZE, FLASH_SIZE);
  }
  return sharedFlashGeometry;
}

function getFlashMaterial(): THREE.MeshBasicMaterial {
  if (!sharedFlashMaterial) {
    sharedFlashMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffcc, // yellow-white
      transparent: true,
      opacity: 1,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
  }
  return sharedFlashMaterial;
}

// ---------------------------------------------------------------------------
// Temp vectors
// ---------------------------------------------------------------------------

const _worldPos = new THREE.Vector3();

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MuzzleFlashEffect() {
  const { camera } = useThree();
  const meshRef = useRef<THREE.Mesh | null>(null);
  const timerRef = useRef(0);
  const prevGunFlashRef = useRef(0);

  // Create flash mesh, parent to camera
  useEffect(() => {
    const material = getFlashMaterial().clone(); // clone for independent opacity
    const mesh = new THREE.Mesh(getFlashGeometry(), material);
    mesh.name = 'muzzleFlashSprite';
    mesh.visible = false;
    mesh.renderOrder = 1000; // render on top of weapon
    mesh.frustumCulled = false;

    // Position relative to camera (barrel location)
    mesh.position.set(FLASH_OFFSET_X, FLASH_OFFSET_Y, FLASH_OFFSET_Z);

    camera.add(mesh);
    meshRef.current = mesh;

    return () => {
      camera.remove(mesh);
      material.dispose();
      meshRef.current = null;
    };
  }, [camera]);

  useFrame((_state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const dt = Math.min(delta, 0.1);
    const gunFlash = useGameStore.getState().gunFlash;

    // Detect new fire event (gunFlash resets to 6 on fire)
    if (gunFlash > prevGunFlashRef.current && gunFlash >= 5) {
      // Trigger flash
      timerRef.current = FLASH_DURATION;
      mesh.visible = true;

      // Math.random() is intentional — cosmetic variation doesn't need deterministic seeding
      mesh.rotation.z = Math.random() * Math.PI * 2;

      // Reset opacity
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 1;

      // Trigger dynamic point light at world position of barrel
      mesh.getWorldPosition(_worldPos);
      triggerDynamicLight(_worldPos);
    }
    prevGunFlashRef.current = gunFlash;

    // Fade out
    if (timerRef.current > 0) {
      timerRef.current -= dt;
      const t = Math.max(0, timerRef.current / FLASH_DURATION);
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = t;

      if (timerRef.current <= 0) {
        mesh.visible = false;
      }
    }
  });

  // No JSX — mesh is managed imperatively
  return null;
}
