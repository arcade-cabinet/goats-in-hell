/**
 * Per-frame enemy position/rotation sync.
 *
 * The ECS entity positions are stored in Babylon.js left-handed coordinates.
 * Three.js is right-handed, so we negate Z when writing to meshes.
 *
 * Called each frame from the R3F game loop via EnemyRenderer's useFrame.
 */
import { MeshStandardMaterial as _BaseMat, Material as _Material, Mesh as _Mesh } from 'three';
import * as THREE from 'three/webgpu';
import { world } from '../../game/entities/world';
import { getEscalationMultiplier } from '../../game/systems/AISystem';
import { useGameStore } from '../../state/GameStore';

/** Reusable color for escalation glow to avoid per-frame allocation. */
const _escalationColor = new THREE.Color();

/**
 * Sync ECS enemy entity positions/rotations to their Three.js meshes.
 *
 * For each enemy entity in the Miniplex world, finds the corresponding
 * mesh from the provided meshMap (keyed by entity ID) and updates its transform:
 *   - Position: x stays, y stays, z negated (left-handed → right-handed)
 *   - Rotation: y-axis rotation for facing direction
 *   - ShadowGoat visibility: opacity driven by visibilityAlpha
 *   - Stagger: slight offset in knockback direction while staggerTimer > 0
 */
export function updateEnemyMeshes(meshMap: Map<string, THREE.Group>): void {
  for (const entity of world.entities) {
    if (!entity.enemy || !entity.position || !entity.id) continue;

    const mesh = meshMap.get(entity.id);
    if (!mesh) continue;

    // --- Position sync (negate Z for coordinate system conversion) ---
    mesh.position.x = entity.position.x;
    mesh.position.y = entity.position.y;
    mesh.position.z = -entity.position.z;

    // --- Stagger offset ---
    if (entity.enemy.staggerTimer && entity.enemy.staggerTimer > 0) {
      const staggerStrength = 0.05;
      mesh.position.x += (entity.enemy.staggerDirX ?? 0) * staggerStrength;
      mesh.position.z += -(entity.enemy.staggerDirZ ?? 0) * staggerStrength;
    }

    // --- Rotation: face toward movement direction (y-axis only) ---
    if (entity.rotation) {
      // In Babylon.js, rotation.y is yaw. In Three.js right-handed space,
      // negate the yaw to mirror the facing direction.
      mesh.rotation.y = -entity.rotation.y;
    }

    // --- ShadowGoat / VoidGoat visibility ---
    if (entity.enemy.isInvisible) {
      const alpha = entity.enemy.visibilityAlpha ?? 0.15;
      applyMeshOpacity(mesh, alpha);
    }

    // --- Circle 5 (Wrath) — Escalation red glow ---
    if (useGameStore.getState().circleNumber === 5) {
      const esc = getEscalationMultiplier();
      if (esc > 1.0) {
        // Intensity scales from 0 at 1x to 1.0 at 2x
        const glowIntensity = esc - 1.0;
        _escalationColor.setRGB(glowIntensity, 0, 0);
        applyMeshEmissive(mesh, _escalationColor, glowIntensity * 0.5);
      }
    }
  }
}

/**
 * Recursively set emissive color + intensity on a mesh and all its children.
 * Used for Circle 5 (Wrath) escalation red glow.
 */
function applyMeshEmissive(object: THREE.Object3D, color: THREE.Color, intensity: number): void {
  if (object instanceof _Mesh) {
    const mat = object.material;
    if (mat instanceof _BaseMat) {
      mat.emissive.copy(color);
      mat.emissiveIntensity = intensity;
    } else if (Array.isArray(mat)) {
      for (const m of mat) {
        if (m instanceof _BaseMat) {
          m.emissive.copy(color);
          m.emissiveIntensity = intensity;
        }
      }
    }
  }
  for (const child of object.children) {
    applyMeshEmissive(child, color, intensity);
  }
}

/**
 * Recursively set opacity on a mesh and all its children.
 * Used for shadowGoat/voidGoat stealth visibility.
 */
function applyMeshOpacity(object: THREE.Object3D, alpha: number): void {
  if (object instanceof _Mesh) {
    const mat = object.material;
    if (mat instanceof _Material) {
      mat.transparent = true;
      mat.opacity = alpha;
    } else if (Array.isArray(mat)) {
      for (const m of mat) {
        m.transparent = true;
        m.opacity = alpha;
      }
    }
  }
  for (const child of object.children) {
    applyMeshOpacity(child, alpha);
  }
}
