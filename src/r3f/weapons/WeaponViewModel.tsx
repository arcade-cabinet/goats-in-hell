/**
 * WeaponViewModel — first-person weapon model rendered in camera space.
 *
 * Creates a placeholder weapon mesh (colored box per weapon type)
 * parented to the camera. Handles:
 *   - Reload animation: weapon bobs down and back up
 *   - Recoil kick: backward/upward offset on fire, spring back
 *   - Weapon switch animation: old weapon drops, new rises
 *
 * All 3D objects are created imperatively via useEffect + scene.add
 * to avoid JSX type conflicts with Reactylon.
 */

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { Entity, WeaponId } from '../../game/entities/components';
import { world } from '../../game/entities/world';
import { useGameStore } from '../../state/GameStore';
import { getReloadProgress } from './WeaponSystem';

// ---------------------------------------------------------------------------
// Weapon visual config
// ---------------------------------------------------------------------------

interface WeaponVisualConfig {
  /** Size of the placeholder box [width, height, depth]. */
  size: [number, number, number];
  /** Offset from camera center (lower-right). */
  offset: THREE.Vector3;
  /** Color of the placeholder mesh. */
  color: string;
  /** Emissive color. */
  emissive: string;
}

const WEAPON_VISUALS: Record<WeaponId, WeaponVisualConfig> = {
  hellPistol: {
    size: [0.06, 0.08, 0.25],
    offset: new THREE.Vector3(0.2, -0.15, -0.35),
    color: '#555555',
    emissive: '#331100',
  },
  brimShotgun: {
    size: [0.06, 0.06, 0.45],
    offset: new THREE.Vector3(0.22, -0.18, -0.4),
    color: '#444444',
    emissive: '#001133',
  },
  hellfireCannon: {
    size: [0.08, 0.08, 0.35],
    offset: new THREE.Vector3(0.18, -0.16, -0.38),
    color: '#553333',
    emissive: '#440000',
  },
  goatsBane: {
    size: [0.1, 0.1, 0.5],
    offset: new THREE.Vector3(0.2, -0.2, -0.45),
    color: '#444455',
    emissive: '#220044',
  },
};

// ---------------------------------------------------------------------------
// Animation constants
// ---------------------------------------------------------------------------

/** Recoil: how far the weapon kicks back on fire. */
const RECOIL_KICK_BACK = 0.04;
/** Recoil: how far the weapon kicks up on fire. */
const RECOIL_KICK_UP = 0.02;
/** Recoil spring-back speed (units/sec). */
const RECOIL_RECOVERY_SPEED = 8;

/** Reload bob depth (how far down the weapon goes). */
const RELOAD_BOB_DEPTH = 0.15;

/** Weapon switch animation duration in seconds. */
const SWITCH_DURATION = 0.25;
/** How far down the weapon drops during switch. */
const SWITCH_DROP_DEPTH = 0.25;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WeaponViewModel() {
  const { camera } = useThree();

  // Refs for managed objects
  const groupRef = useRef<THREE.Group | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const currentWeaponRef = useRef<WeaponId>('hellPistol');

  // Animation state
  const recoilRef = useRef(0); // 0..1, decays to 0
  const switchProgressRef = useRef(0); // 0..1, 0 = done
  const switchDirectionRef = useRef<'down' | 'up'>('up');
  const pendingWeaponRef = useRef<WeaponId | null>(null);

  // Create the weapon group and parent to camera
  useEffect(() => {
    const group = new THREE.Group();
    group.name = 'weaponViewModel';

    // Add to camera so it moves with the view
    camera.add(group);
    groupRef.current = group;

    // Build initial weapon mesh
    const config = WEAPON_VISUALS.hellPistol;
    const mesh = buildWeaponMesh(config);
    group.add(mesh);
    meshRef.current = mesh;

    return () => {
      camera.remove(group);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material instanceof THREE.Material) mesh.material.dispose();
      groupRef.current = null;
      meshRef.current = null;
    };
  }, [camera]);

  // Per-frame animation
  useFrame((_state, delta) => {
    const group = groupRef.current;
    const mesh = meshRef.current;
    if (!group || !mesh) return;

    const dt = Math.min(delta, 0.1);
    const screen = useGameStore.getState().screen;

    // Hide weapon when not playing
    group.visible = screen === 'playing';
    if (!group.visible) return;

    // Find player entity
    const player = world.entities.find((e: Entity) => e.type === 'player');

    // Check for weapon switch
    const currentWeapon = player?.player?.currentWeapon ?? 'hellPistol';
    if (currentWeapon !== currentWeaponRef.current && switchProgressRef.current <= 0) {
      // Start switch-down animation
      switchDirectionRef.current = 'down';
      switchProgressRef.current = 1;
      pendingWeaponRef.current = currentWeapon;
    }

    // Check for fire (recoil trigger)
    const gunFlash = useGameStore.getState().gunFlash;
    if (gunFlash > 4) {
      // New shot fired — kick recoil
      recoilRef.current = 1;
    }

    // --- Animate recoil ---
    if (recoilRef.current > 0) {
      recoilRef.current = Math.max(0, recoilRef.current - RECOIL_RECOVERY_SPEED * dt);
    }

    // --- Animate weapon switch ---
    if (switchProgressRef.current > 0) {
      switchProgressRef.current = Math.max(0, switchProgressRef.current - dt / SWITCH_DURATION);

      if (switchProgressRef.current <= 0) {
        if (switchDirectionRef.current === 'down') {
          // At bottom of drop — swap the weapon mesh
          const newWeaponId = pendingWeaponRef.current ?? currentWeapon;
          swapWeaponMesh(group, newWeaponId, meshRef);
          currentWeaponRef.current = newWeaponId;
          pendingWeaponRef.current = null;

          // Start rise animation
          switchDirectionRef.current = 'up';
          switchProgressRef.current = 1;
        }
        // else 'up' finished — done
      }
    }

    // --- Compute final offset ---
    const config = WEAPON_VISUALS[currentWeaponRef.current];
    let offsetY = config.offset.y;
    const offsetZ = config.offset.z;

    // Reload bob
    if (player) {
      const reloadProg = getReloadProgress(player);
      if (reloadProg > 0) {
        // Smooth sine bob: goes down in first half, comes back up in second half
        const bobAmount = Math.sin(reloadProg * Math.PI) * RELOAD_BOB_DEPTH;
        offsetY -= bobAmount;
      }
    }

    // Recoil offset
    const recoilT = recoilRef.current;
    const recoilBack = recoilT * RECOIL_KICK_BACK;
    const recoilUp = recoilT * RECOIL_KICK_UP;

    // Switch drop
    let switchDrop = 0;
    if (switchProgressRef.current > 0) {
      const t = switchProgressRef.current;
      if (switchDirectionRef.current === 'down') {
        // Dropping: t goes 1→0, we want drop to increase
        switchDrop = (1 - t) * SWITCH_DROP_DEPTH;
      } else {
        // Rising: t goes 1→0, we want drop to decrease
        switchDrop = t * SWITCH_DROP_DEPTH;
      }
    }

    // Apply combined offset to group
    group.position.set(config.offset.x, offsetY + recoilUp - switchDrop, offsetZ + recoilBack);
  });

  // No JSX output — mesh is managed imperatively
  return null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildWeaponMesh(config: WeaponVisualConfig): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(...config.size);
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(config.color),
    emissive: new THREE.Color(config.emissive),
    emissiveIntensity: 0.5,
    roughness: 0.6,
    metalness: 0.4,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'weaponMesh';
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.renderOrder = 999; // render on top
  return mesh;
}

function swapWeaponMesh(
  group: THREE.Group,
  weaponId: WeaponId,
  meshRef: React.MutableRefObject<THREE.Mesh | null>,
): void {
  // Remove old mesh
  const oldMesh = meshRef.current;
  if (oldMesh) {
    group.remove(oldMesh);
    oldMesh.geometry.dispose();
    if (oldMesh.material instanceof THREE.Material) {
      oldMesh.material.dispose();
    }
  }

  // Build new mesh
  const config = WEAPON_VISUALS[weaponId];
  const newMesh = buildWeaponMesh(config);
  group.add(newMesh);
  meshRef.current = newMesh;
}
