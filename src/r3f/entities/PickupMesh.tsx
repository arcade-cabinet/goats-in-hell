/**
 * R3F Pickup Renderer — imperative Three.js meshes for pickup entities.
 *
 * Creates distinct visual representations for each pickup type:
 * - Health: green glowing sphere
 * - Ammo: orange glowing box
 * - Weapon: magenta glowing diamond (octahedron)
 *
 * Each pickup has a floating bob animation and slow rotation,
 * plus a semi-transparent glow ring.
 *
 * Uses imperative Three.js API to avoid JSX type conflicts with Reactylon.
 */

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three/webgpu';
import { COLORS } from '../../constants';
import type { Entity } from '../../game/entities/components';
import { world } from '../../game/entities/world';

// ---------------------------------------------------------------------------
// Pickup type visual configuration
// ---------------------------------------------------------------------------

interface PickupVisualConfig {
  color: string;
  geometry: () => THREE.BufferGeometry;
  scale: number;
  glowScale: number;
}

const PICKUP_CONFIGS: Record<string, PickupVisualConfig> = {
  health: {
    color: COLORS.healthPickup,
    geometry: () => new THREE.SphereGeometry(0.25, 12, 12),
    scale: 1,
    glowScale: 2.5,
  },
  ammo: {
    color: COLORS.ammoPickup,
    geometry: () => new THREE.BoxGeometry(0.35, 0.35, 0.35),
    scale: 1,
    glowScale: 2.0,
  },
  weapon: {
    color: COLORS.weaponPickup,
    geometry: () => new THREE.OctahedronGeometry(0.3, 0),
    scale: 1,
    glowScale: 2.5,
  },
};

// Glow ring geometry — shared across all pickups
let sharedRingGeometry: THREE.TorusGeometry | null = null;

function getGlowRingGeometry(): THREE.TorusGeometry {
  if (!sharedRingGeometry) {
    sharedRingGeometry = new THREE.TorusGeometry(0.4, 0.05, 8, 24);
  }
  return sharedRingGeometry;
}

// ---------------------------------------------------------------------------
// Tracked pickup mesh entry
// ---------------------------------------------------------------------------

interface TrackedPickup {
  group: THREE.Group;
  mesh: THREE.Mesh;
  ring: THREE.Mesh;
  material: THREE.MeshStandardMaterial;
  ringMaterial: THREE.MeshBasicMaterial;
  baseY: number;
  entityId: string;
}

// ---------------------------------------------------------------------------
// PickupRenderer component
// ---------------------------------------------------------------------------

export function PickupRenderer(): null {
  const { scene } = useThree();
  const trackedRef = useRef<Map<string, TrackedPickup>>(new Map());

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const tracked = trackedRef.current;
      for (const [, entry] of tracked) {
        scene.remove(entry.group);
        entry.mesh.geometry.dispose();
        entry.material.dispose();
        entry.ringMaterial.dispose();
      }
      tracked.clear();
    };
  }, [scene]);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const tracked = trackedRef.current;

    // Gather current active pickup entities
    const activePickups = new Set<string>();

    for (const entity of world.entities) {
      if (!entity.pickup || !entity.pickup.active || !entity.position || !entity.id) {
        continue;
      }

      activePickups.add(entity.id);

      // Get or create tracked mesh
      let entry = tracked.get(entity.id);

      if (!entry) {
        const created = createPickupMesh(entity, scene);
        if (created) {
          entry = created;
          tracked.set(entity.id, entry);
        } else {
          continue;
        }
      }

      // Update position: x stays, y bobs, z negated for Three.js coords
      const bobOffset = Math.sin(time * 2) * 0.1;
      entry.group.position.x = entity.position.x;
      entry.group.position.y = entry.baseY + bobOffset;
      entry.group.position.z = -entity.position.z;

      // Slow rotation
      entry.mesh.rotation.y = time * 1.5;
      entry.ring.rotation.x = Math.PI / 2; // Keep ring horizontal
      entry.ring.rotation.z = time * 0.8;

      // Pulse glow ring opacity
      const pulse = 0.3 + Math.sin(time * 3) * 0.15;
      entry.ringMaterial.opacity = pulse;
    }

    // Remove tracked meshes for entities that no longer exist
    for (const [id, entry] of tracked) {
      if (!activePickups.has(id)) {
        scene.remove(entry.group);
        entry.mesh.geometry.dispose();
        entry.material.dispose();
        entry.ringMaterial.dispose();
        tracked.delete(id);
      }
    }
  });

  // This component only manages imperative Three.js objects
  return null;
}

// ---------------------------------------------------------------------------
// Mesh creation helper
// ---------------------------------------------------------------------------

function createPickupMesh(entity: Entity, scene: THREE.Scene): TrackedPickup | null {
  if (!entity.pickup || !entity.position || !entity.id) return null;

  const pickupType = entity.pickup.pickupType;
  const config = PICKUP_CONFIGS[pickupType];

  if (!config) {
    // Fallback for unknown pickup types (e.g. powerup)
    return createPickupMeshWithConfig(entity, scene, {
      color: '#ffffff',
      geometry: () => new THREE.SphereGeometry(0.2, 8, 8),
      scale: 1,
      glowScale: 2.0,
    });
  }

  return createPickupMeshWithConfig(entity, scene, config);
}

function createPickupMeshWithConfig(
  entity: Entity,
  scene: THREE.Scene,
  config: PickupVisualConfig,
): TrackedPickup | null {
  if (!entity.position || !entity.id) return null;

  const group = new THREE.Group();
  group.name = `pickup-${entity.id}`;

  // Main pickup mesh
  const geometry = config.geometry();
  const material = new THREE.MeshStandardMaterial({
    color: config.color,
    emissive: config.color,
    emissiveIntensity: 0.6,
    metalness: 0.3,
    roughness: 0.4,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.scale.setScalar(config.scale);
  group.add(mesh);

  // Glow ring
  const ringGeometry = getGlowRingGeometry();
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: config.color,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
  });

  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.scale.setScalar(config.glowScale);
  ring.rotation.x = Math.PI / 2; // Horizontal
  group.add(ring);

  // Set initial position (negate Z)
  const baseY = entity.position.y + 0.5; // Float slightly above ground
  group.position.set(entity.position.x, baseY, -entity.position.z);

  scene.add(group);

  return {
    group,
    mesh,
    ring,
    material,
    ringMaterial,
    baseY,
    entityId: entity.id,
  };
}
