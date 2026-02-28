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

// Hard cap on total active particles to prevent runaway allocations
const MAX_ACTIVE_PARTICLES = 300;

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
// Pre-allocated material pools (shared across all particles of each type)
// ---------------------------------------------------------------------------

/** Pool of red/orange materials for death burst particles. */
const deathMaterialPool: THREE.MeshBasicMaterial[] = [];

/** Pool of dark red materials for blood splash particles. */
const bloodMaterialPool: THREE.MeshBasicMaterial[] = [];

/** Pool of yellow/white materials for impact spark particles. */
const sparkMaterialPool: THREE.MeshBasicMaterial[] = [];

function initMaterialPools(): void {
  if (deathMaterialPool.length > 0) return; // already initialized

  // 5 red/orange variants for death bursts
  for (let i = 0; i < 5; i++) {
    const hue = 0 + (i / 5) * 0.08;
    const color = new THREE.Color().setHSL(hue, 0.9, 0.5);
    deathMaterialPool.push(new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 }));
  }

  // 5 dark red variants for blood splashes
  for (let i = 0; i < 5; i++) {
    const r = 0.5 + (i / 5) * 0.3;
    const g = (i / 5) * 0.1;
    const b = (i / 5) * 0.05;
    bloodMaterialPool.push(
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(r, g, b),
        transparent: true,
        opacity: 1,
      }),
    );
  }

  // 3 yellow/white variants for impact sparks
  for (let i = 0; i < 3; i++) {
    const brightness = 0.8 + (i / 3) * 0.2;
    sparkMaterialPool.push(
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(brightness, brightness * 0.9, brightness * 0.5),
        transparent: true,
        opacity: 1,
      }),
    );
  }
}

function pickRandom<T>(pool: T[]): T {
  return pool[Math.floor(Math.random() * pool.length)];
}

// ---------------------------------------------------------------------------
// Death burst — red/orange particles radiating from enemy death position
// ---------------------------------------------------------------------------

export function createDeathBurst(position: THREE.Vector3, scene: THREE.Scene): void {
  if (activeParticles.length > MAX_ACTIVE_PARTICLES) return;
  initMaterialPools();

  const geo = getParticleSphere();
  const now = performance.now();

  for (let i = 0; i < PARTICLES_PER_BURST; i++) {
    const mat = pickRandom(deathMaterialPool);

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
  if (activeParticles.length > MAX_ACTIVE_PARTICLES) return;
  initMaterialPools();

  const geo = getParticleSphere();
  const now = performance.now();

  for (let i = 0; i < IMPACT_SPARK_COUNT; i++) {
    const mat = pickRandom(sparkMaterialPool);

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

export function createBloodSplash(position: THREE.Vector3, scene: THREE.Scene): void {
  if (activeParticles.length > MAX_ACTIVE_PARTICLES) return;
  initMaterialPools();

  const geo = getParticleSphere();
  const now = performance.now();

  for (let i = 0; i < BLOOD_PARTICLE_COUNT; i++) {
    const mat = pickRandom(bloodMaterialPool);

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
      // Particle expired — remove from scene (material is pooled, do NOT dispose)
      const parent = p.mesh.parent;
      if (parent) parent.remove(p.mesh);
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
    // Materials are pooled — do NOT dispose them here
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
  // Dispose pooled materials on full teardown
  for (const m of deathMaterialPool) m.dispose();
  for (const m of bloodMaterialPool) m.dispose();
  for (const m of sparkMaterialPool) m.dispose();
  deathMaterialPool.length = 0;
  bloodMaterialPool.length = 0;
  sparkMaterialPool.length = 0;
}
