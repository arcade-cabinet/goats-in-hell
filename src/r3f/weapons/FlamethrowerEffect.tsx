/**
 * FlamethrowerEffect — particle stream visual for the Brimstone Flamethrower.
 *
 * Renders a cone-shaped stream of orange/red/yellow emissive particles from
 * the weapon muzzle when the flamethrower is equipped and firing.
 *
 * Uses an imperative particle pool (similar to ParticleEffects.ts) to avoid
 * per-frame allocations. Parented to the camera for first-person alignment.
 */

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three/webgpu';
import { world as ecsWorld } from '../../game/entities/world';
import { isFlamethrowerFiring } from './WeaponSystem';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_FLAME_PARTICLES = 60;
const SPAWN_RATE = 120; // particles per second while firing
const PARTICLE_LIFETIME_MIN = 0.15; // seconds
const PARTICLE_LIFETIME_MAX = 0.3;
const PARTICLE_SPEED_MIN = 8;
const PARTICLE_SPEED_MAX = 14;
const CONE_HALF_ANGLE = 0.25; // radians (~15 degrees visual spread)

// Muzzle offset from camera (matches WeaponViewModel barrel position)
const MUZZLE_OFFSET_X = 0.2;
const MUZZLE_OFFSET_Y = -0.12;
const MUZZLE_OFFSET_Z = -0.55;

// ---------------------------------------------------------------------------
// Shared resources
// ---------------------------------------------------------------------------

let sharedFlameGeometry: THREE.SphereGeometry | null = null;

function getFlameGeometry(): THREE.SphereGeometry {
  if (!sharedFlameGeometry) {
    sharedFlameGeometry = new THREE.SphereGeometry(0.06, 4, 4);
  }
  return sharedFlameGeometry;
}

// Pre-allocated flame materials (orange → red → yellow gradient)
const flameMaterials: THREE.MeshBasicMaterial[] = [];

function initFlameMaterials(): void {
  if (flameMaterials.length > 0) return;

  const colors = [
    new THREE.Color('#ff6600'), // orange
    new THREE.Color('#ff4400'), // red-orange
    new THREE.Color('#ff2200'), // red
    new THREE.Color('#ffaa00'), // amber
    new THREE.Color('#ffcc33'), // yellow
  ];

  for (const color of colors) {
    flameMaterials.push(
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 1,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    );
  }
}

// ---------------------------------------------------------------------------
// Particle type
// ---------------------------------------------------------------------------

interface FlameParticle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number; // remaining life in seconds
  maxLife: number;
  active: boolean;
}

// ---------------------------------------------------------------------------
// Module-scope temp vectors (avoid per-frame allocation)
// ---------------------------------------------------------------------------

const _muzzleWorld = new THREE.Vector3();
const _forward = new THREE.Vector3();
const _particleDir = new THREE.Vector3();

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FlamethrowerEffect() {
  const { camera, scene } = useThree();
  const particlesRef = useRef<FlameParticle[]>([]);
  const spawnAccRef = useRef(0); // accumulator for spawn timing

  // Initialize particles pool on mount
  useEffect(() => {
    initFlameMaterials();
    const geo = getFlameGeometry();
    const particles: FlameParticle[] = [];

    for (let i = 0; i < MAX_FLAME_PARTICLES; i++) {
      const mat = flameMaterials[i % flameMaterials.length];
      const mesh = new THREE.Mesh(geo, mat.clone()); // clone for independent opacity
      mesh.name = `flame-particle-${i}`;
      mesh.visible = false;
      mesh.frustumCulled = false;
      mesh.renderOrder = 998;
      scene.add(mesh);

      particles.push({
        mesh,
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 0,
        active: false,
      });
    }

    particlesRef.current = particles;

    return () => {
      for (const p of particles) {
        scene.remove(p.mesh);
        // Dispose cloned materials
        if (p.mesh.material instanceof THREE.Material) {
          p.mesh.material.dispose();
        }
      }
      particles.length = 0;
    };
  }, [scene]);

  useFrame((_state, delta) => {
    const particles = particlesRef.current;
    if (particles.length === 0) return;

    const dt = Math.min(delta, 0.1);

    // Check if flamethrower is equipped and firing
    const player = ecsWorld.entities.find((e) => e.type === 'player' && e.player);
    const isEquipped = player?.player?.currentWeapon === 'brimstoneFlamethrower';
    const isFiring = isEquipped && isFlamethrowerFiring();

    // --- Spawn new particles while firing ---
    if (isFiring) {
      spawnAccRef.current += SPAWN_RATE * dt;
      const toSpawn = Math.floor(spawnAccRef.current);
      spawnAccRef.current -= toSpawn;

      // Calculate muzzle world position
      _muzzleWorld.set(MUZZLE_OFFSET_X, MUZZLE_OFFSET_Y, MUZZLE_OFFSET_Z);
      _muzzleWorld.applyMatrix4(camera.matrixWorld);

      // Camera forward
      _forward.set(0, 0, -1).applyQuaternion(camera.quaternion).normalize();

      for (let s = 0; s < toSpawn; s++) {
        // Find inactive slot
        const p = particles.find((pp) => !pp.active);
        if (!p) break;

        // Random direction within cone
        _particleDir.copy(_forward);
        _particleDir.x += (Math.random() - 0.5) * CONE_HALF_ANGLE * 2;
        _particleDir.y += (Math.random() - 0.5) * CONE_HALF_ANGLE * 2;
        _particleDir.z += (Math.random() - 0.5) * CONE_HALF_ANGLE * 2;
        _particleDir.normalize();

        const speed =
          PARTICLE_SPEED_MIN + Math.random() * (PARTICLE_SPEED_MAX - PARTICLE_SPEED_MIN);
        p.velocity.copy(_particleDir).multiplyScalar(speed);
        p.mesh.position.copy(_muzzleWorld);
        p.life =
          PARTICLE_LIFETIME_MIN + Math.random() * (PARTICLE_LIFETIME_MAX - PARTICLE_LIFETIME_MIN);
        p.maxLife = p.life;
        p.active = true;
        p.mesh.visible = true;

        // Random initial scale
        const initialScale = 0.8 + Math.random() * 0.4;
        p.mesh.scale.setScalar(initialScale);
      }
    } else {
      spawnAccRef.current = 0;
    }

    // --- Update active particles ---
    for (const p of particles) {
      if (!p.active) continue;

      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        p.mesh.visible = false;
        continue;
      }

      // Move
      p.mesh.position.addScaledVector(p.velocity, dt);

      // Progress 0 → 1
      const t = 1 - p.life / p.maxLife;

      // Grow then shrink
      const scale = t < 0.3 ? t / 0.3 : 1 - (t - 0.3) / 0.7;
      p.mesh.scale.setScalar(scale * 1.5 + 0.2);

      // Fade out
      const mat = p.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 1 - t * t; // quadratic fade

      // Slight upward drift (heat rises)
      p.velocity.y += 2 * dt;
    }
  });

  return null;
}
