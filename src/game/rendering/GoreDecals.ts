/**
 * Gore Decals — blood splatter planes on the floor where enemies die.
 * Uses a pooled ring buffer to cap total decals and recycle the oldest.
 */
import {
  Color3,
  DynamicTexture,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
} from '@babylonjs/core';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_DECALS = 32;
const DECAL_SIZE = 1.8; // world-space diameter
const FLOOR_Y = 0.02; // slightly above floor to avoid z-fighting

// ---------------------------------------------------------------------------
// Pool state
// ---------------------------------------------------------------------------

interface DecalEntry {
  mesh: Mesh;
  material: StandardMaterial;
}

const pool: DecalEntry[] = [];
let poolIndex = 0;
let cachedScene: Scene | null = null;

// ---------------------------------------------------------------------------
// Texture generation — procedural blood splat
// ---------------------------------------------------------------------------

/** Map gore color keys to RGB tuples. */
const GORE_COLORS: Record<string, [number, number, number]> = {
  default: [140, 10, 10],
  fire: [200, 60, 10],
  void: [80, 10, 160],
  shadow: [60, 10, 120],
  iron: [70, 90, 110],
  boss: [170, 10, 220],
};

function goreKeyFromType(enemyType?: string): string {
  if (!enemyType) return 'default';
  if (enemyType.includes('fire') || enemyType.includes('inferno')) return 'fire';
  if (enemyType.includes('void')) return 'void';
  if (enemyType.includes('shadow')) return 'shadow';
  if (enemyType.includes('iron') || enemyType.includes('Knight')) return 'iron';
  if (enemyType.includes('arch')) return 'boss';
  return 'default';
}

function createSplatTexture(scene: Scene, colorKey: string): DynamicTexture {
  const size = 128;
  const tex = new DynamicTexture(`goreTex_${Date.now()}`, size, scene, false);
  const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;

  const [r, g, b] = GORE_COLORS[colorKey] ?? GORE_COLORS.default;

  // Clear transparent
  ctx.clearRect(0, 0, size, size);

  // Draw 4-8 overlapping radial blobs for organic splatter shape
  const blobCount = 4 + Math.floor(Math.random() * 5);
  const half = size / 2;

  for (let i = 0; i < blobCount; i++) {
    const cx = half + (Math.random() - 0.5) * size * 0.5;
    const cy = half + (Math.random() - 0.5) * size * 0.5;
    const radius = 10 + Math.random() * 30;

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    const alpha = 0.5 + Math.random() * 0.4;
    const dr = Math.floor(r + (Math.random() - 0.5) * 30);
    const dg = Math.floor(g + (Math.random() - 0.5) * 10);
    const db = Math.floor(b + (Math.random() - 0.5) * 10);
    grad.addColorStop(0, `rgba(${dr},${dg},${db},${alpha})`);
    grad.addColorStop(0.6, `rgba(${dr},${dg},${db},${alpha * 0.5})`);
    grad.addColorStop(1, `rgba(${dr},${dg},${db},0)`);

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }

  // Add small droplet specks
  for (let i = 0; i < 12; i++) {
    const sx = Math.random() * size;
    const sy = Math.random() * size;
    const sr = 1 + Math.random() * 3;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${r},${g},${b},${0.3 + Math.random() * 0.4})`;
    ctx.fill();
  }

  tex.update();
  tex.hasAlpha = true;
  return tex;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Place a blood decal on the floor at the given position. */
export function placeGoreDecal(
  position: Vector3,
  scene: Scene,
  isBoss: boolean,
  enemyType?: string,
): void {
  // Reset pool if scene changed (floor transition)
  if (cachedScene !== scene) {
    disposeAllDecals();
    cachedScene = scene;
  }

  const colorKey = isBoss ? 'boss' : goreKeyFromType(enemyType);
  const scale = isBoss ? DECAL_SIZE * 1.6 : DECAL_SIZE * (0.8 + Math.random() * 0.4);

  let entry: DecalEntry;

  if (pool.length < MAX_DECALS) {
    // Create new decal mesh
    const mesh = MeshBuilder.CreateGround(
      `goreDecal_${pool.length}`,
      {width: 1, height: 1},
      scene,
    );
    const material = new StandardMaterial(`goreMat_${pool.length}`, scene);
    material.disableLighting = true;
    material.backFaceCulling = false;
    material.alpha = 0.85;
    mesh.material = material;
    mesh.isPickable = false;

    entry = {mesh, material};
    pool.push(entry);
  } else {
    // Recycle oldest
    entry = pool[poolIndex];
    poolIndex = (poolIndex + 1) % MAX_DECALS;
  }

  // Update position, scale, rotation
  entry.mesh.position.set(position.x, FLOOR_Y, position.z);
  entry.mesh.scaling.set(scale, 1, scale);
  entry.mesh.rotation.y = Math.random() * Math.PI * 2;
  entry.mesh.setEnabled(true);

  // Fresh texture
  if (entry.material.diffuseTexture) {
    entry.material.diffuseTexture.dispose();
  }
  const tex = createSplatTexture(scene, colorKey);
  entry.material.diffuseTexture = tex;
  entry.material.useAlphaFromDiffuseTexture = true;
  entry.material.emissiveColor = new Color3(
    (GORE_COLORS[colorKey]?.[0] ?? 140) / 510,
    (GORE_COLORS[colorKey]?.[1] ?? 10) / 510,
    (GORE_COLORS[colorKey]?.[2] ?? 10) / 510,
  );
  entry.material.alpha = 0.85;
}

/** Dispose all decals (call on scene teardown / floor transition). */
export function disposeAllDecals(): void {
  for (const entry of pool) {
    entry.material.diffuseTexture?.dispose();
    entry.material.dispose();
    entry.mesh.dispose();
  }
  pool.length = 0;
  poolIndex = 0;
  cachedScene = null;
}
