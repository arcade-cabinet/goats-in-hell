/**
 * R3F Particle Effects — death bursts, impact sparks, and blood splashes.
 *
 * Uses a simple imperative Three.js particle pool. Each effect spawns
 * small emissive sphere meshes that radiate outward and decay.
 * Particles are recycled via a per-burst pool.
 */
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Particle pool
// ---------------------------------------------------------------------------

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  startTime: number;
  lifetime: number;
  active: boolean;
}

const PARTICLES_PER_BURST = 20;
const IMPACT_SPARK_COUNT = 8;
const BLOOD_PARTICLE_COUNT = 12;

// Shared geometries (created once, reused)
let particleSphere: THREE.SphereGeometry | null = null;

function getParticleSphere(): THREE.SphereGeometry {
  if (!particleSphere) {
    particleSphere = new THREE.SphereGeometry(0.04, 4, 4);
  }
  return particleSphere;
}

// Active particles tracked for per-frame update
const activeParticles: Particle[] = [];

// ---------------------------------------------------------------------------
// Death burst — red/orange particles radiating from enemy death position
// ---------------------------------------------------------------------------

export function createDeathBurst(
  position: THREE.Vector3,
  scene: THREE.Scene,
): void {
  const geo = getParticleSphere();
  const now = performance.now();

  for (let i = 0; i < PARTICLES_PER_BURST; i++) {
    // Random red-orange color
    const hue = 0 + Math.random() * 0.08; // 0 = red, 0.08 = orange-red
    const saturation = 0.8 + Math.random() * 0.2;
    const lightness = 0.4 + Math.random() * 0.3;
    const color = new THREE.Color().setHSL(hue, saturation, lightness);

    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 1,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(position);
    mesh.name = `particle-death-${i}`;

    // Random velocity in all directions
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const speed = 2 + Math.random() * 4;
    const velocity = new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta) * speed,
      Math.sin(phi) * Math.sin(theta) * speed * 0.5 + 1, // bias upward
      Math.cos(phi) * speed,
    );

    scene.add(mesh);

    activeParticles.push({
      mesh,
      velocity,
      startTime: now,
      lifetime: 400 + Math.random() * 200, // 400-600ms
      active: true,
    });
  }
}

// ---------------------------------------------------------------------------
// Impact sparks — yellow/white sparks on wall impact
// ---------------------------------------------------------------------------

export function createImpactSparks(
  position: THREE.Vector3,
  normal: THREE.Vector3,
  scene: THREE.Scene,
): void {
  const geo = getParticleSphere();
  const now = performance.now();

  for (let i = 0; i < IMPACT_SPARK_COUNT; i++) {
    // Yellow-white color
    const brightness = 0.8 + Math.random() * 0.2;
    const color = new THREE.Color(brightness, brightness * 0.9, brightness * 0.5);

    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 1,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(position);
    mesh.name = `particle-spark-${i}`;

    // Velocity based on surface normal with random spread
    const tangent1 = new THREE.Vector3();
    const tangent2 = new THREE.Vector3();

    // Generate tangent vectors from normal
    if (Math.abs(normal.y) < 0.99) {
      tangent1.crossVectors(normal, new THREE.Vector3(0, 1, 0)).normalize();
    } else {
      tangent1.crossVectors(normal, new THREE.Vector3(1, 0, 0)).normalize();
    }
    tangent2.crossVectors(normal, tangent1).normalize();

    const spread = 0.8;
    const speed = 1 + Math.random() * 3;
    const velocity = new THREE.Vector3()
      .addScaledVector(normal, speed * 0.5)
      .addScaledVector(tangent1, (Math.random() - 0.5) * spread * speed)
      .addScaledVector(tangent2, (Math.random() - 0.5) * spread * speed);

    scene.add(mesh);

    activeParticles.push({
      mesh,
      velocity,
      startTime: now,
      lifetime: 200 + Math.random() * 150, // 200-350ms
      active: true,
    });
  }
}

// ---------------------------------------------------------------------------
// Blood splash — red particles on enemy hit
// ---------------------------------------------------------------------------

export function createBloodSplash(
  position: THREE.Vector3,
  scene: THREE.Scene,
): void {
  const geo = getParticleSphere();
  const now = performance.now();

  for (let i = 0; i < BLOOD_PARTICLE_COUNT; i++) {
    // Dark red color
    const r = 0.5 + Math.random() * 0.3;
    const g = Math.random() * 0.1;
    const b = Math.random() * 0.05;
    const color = new THREE.Color(r, g, b);

    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 1,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(position);
    mesh.name = `particle-blood-${i}`;

    // Random velocity, biased slightly upward
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const speed = 1 + Math.random() * 2;
    const velocity = new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta) * speed,
      Math.abs(Math.sin(phi) * Math.sin(theta)) * speed * 0.3 + 0.5,
      Math.cos(phi) * speed,
    );

    scene.add(mesh);

    activeParticles.push({
      mesh,
      velocity,
      startTime: now,
      lifetime: 300 + Math.random() * 200, // 300-500ms
      active: true,
    });
  }
}

// ---------------------------------------------------------------------------
// Per-frame update — call from game loop
// ---------------------------------------------------------------------------

const GRAVITY = -9.8;

/**
 * Update all active particles: apply velocity, gravity, fade out,
 * and remove expired particles from the scene.
 */
export function updateParticles(dt: number): void {
  const now = performance.now();

  for (let i = activeParticles.length - 1; i >= 0; i--) {
    const p = activeParticles[i];
    if (!p.active) continue;

    const elapsed = now - p.startTime;
    const t = elapsed / p.lifetime; // 0 to 1+

    if (t >= 1) {
      // Particle expired — remove from scene and pool
      const parent = p.mesh.parent;
      if (parent) parent.remove(p.mesh);
      if (p.mesh.material instanceof THREE.Material) {
        p.mesh.material.dispose();
      }
      p.active = false;
      activeParticles.splice(i, 1);
      continue;
    }

    // Apply velocity and gravity
    p.mesh.position.x += p.velocity.x * dt;
    p.mesh.position.y += p.velocity.y * dt;
    p.mesh.position.z += p.velocity.z * dt;

    // Apply gravity to velocity
    p.velocity.y += GRAVITY * dt;

    // Fade out
    const mat = p.mesh.material;
    if (mat instanceof THREE.MeshBasicMaterial) {
      mat.opacity = 1 - t;
    }

    // Shrink slightly
    const scale = 1 - t * 0.5;
    p.mesh.scale.setScalar(scale);
  }
}

/**
 * Clean up all active particles. Call on level transitions.
 */
export function clearAllParticles(): void {
  for (const p of activeParticles) {
    const parent = p.mesh.parent;
    if (parent) parent.remove(p.mesh);
    if (p.mesh.material instanceof THREE.Material) {
      p.mesh.material.dispose();
    }
  }
  activeParticles.length = 0;
}

/**
 * Dispose shared geometry. Call on full cleanup only.
 */
export function disposeParticleResources(): void {
  clearAllParticles();
  if (particleSphere) {
    particleSphere.dispose();
    particleSphere = null;
  }
}
