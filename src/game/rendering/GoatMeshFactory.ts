/**
 * Enemy mesh factory — loads pre-cached GLB models from the asset pipeline.
 *
 * Each enemy type maps to a distinct 3D model. Templates are loaded during the
 * asset loading phase; createGoatMesh() clones them synchronously at spawn time.
 */
import {
  Color3,
  Mesh,
  MeshBuilder,
  PBRMaterial,
  StandardMaterial,
  Scene,
  Vector3,
} from '@babylonjs/core';
// Note: MeshBuilder still used for eye spheres below
import type {EntityType} from '../entities/components';
import {loadEnemyModel, cloneModelHierarchy} from '../systems/AssetLoader';
import type {EnemyModelKey} from '../systems/AssetRegistry';
import {addEnemyCollider, removeEnemyCollider} from '../systems/PhysicsSetup';

// ---------------------------------------------------------------------------
// Configuration per enemy type (simplified — models provide geometry)
// ---------------------------------------------------------------------------

interface GoatConfig {
  scale: number;
  modelKey: EnemyModelKey;
  emissiveHex: string;
  emissiveIntensity: number;
  eyeColor: string;
}

const GOAT_CONFIGS: Record<string, GoatConfig> = {
  goat: {
    scale: 1.0,
    modelKey: 'enemy-goat',
    emissiveHex: '#330000',
    emissiveIntensity: 0.15,
    eyeColor: '#ff0000',
  },
  hellgoat: {
    scale: 1.15,
    modelKey: 'enemy-hellgoat',
    emissiveHex: '#441100',
    emissiveIntensity: 0.25,
    eyeColor: '#ff2200',
  },
  fireGoat: {
    scale: 1.0,
    modelKey: 'enemy-fireGoat',
    emissiveHex: '#663300',
    emissiveIntensity: 0.4,
    eyeColor: '#ff8800',
  },
  shadowGoat: {
    scale: 0.9,
    modelKey: 'enemy-shadowGoat',
    emissiveHex: '#110033',
    emissiveIntensity: 0.3,
    eyeColor: '#8888ff',
  },
  goatKnight: {
    scale: 1.3,
    modelKey: 'enemy-goatKnight',
    emissiveHex: '#112233',
    emissiveIntensity: 0.15,
    eyeColor: '#4466ff',
  },
  archGoat: {
    scale: 2.0,
    modelKey: 'enemy-archGoat',
    emissiveHex: '#440044',
    emissiveIntensity: 0.35,
    eyeColor: '#cc00ff',
  },
  infernoGoat: {
    scale: 1.8,
    modelKey: 'enemy-infernoGoat',
    emissiveHex: '#882200',
    emissiveIntensity: 0.6,
    eyeColor: '#ff4400',
  },
  voidGoat: {
    scale: 1.6,
    modelKey: 'enemy-voidGoat',
    emissiveHex: '#220055',
    emissiveIntensity: 0.5,
    eyeColor: '#aa44ff',
  },
  ironGoat: {
    scale: 2.2,
    modelKey: 'enemy-ironGoat',
    emissiveHex: '#223344',
    emissiveIntensity: 0.2,
    eyeColor: '#4488ff',
  },
};

// ---------------------------------------------------------------------------
// Template cache — pre-loaded during loading phase
// ---------------------------------------------------------------------------

const templateCache = new Map<string, Mesh>();
const eyeMaterialCache = new Map<string, StandardMaterial>();

/**
 * Pre-load all enemy GLB models. Call during asset loading phase.
 * After this resolves, createGoatMesh() is synchronous.
 */
export async function loadAllEnemyTemplates(scene: Scene): Promise<void> {
  const entries = Object.entries(GOAT_CONFIGS);
  await Promise.all(
    entries.map(async ([type, config]) => {
      const template = await loadEnemyModel(config.modelKey, scene);
      template.name = `goatTemplate-${type}`;

      // Apply per-type emissive tinting to all materials.
      // GLB imports as PBRMaterial; handle both PBR and Standard gracefully.
      const emissive = Color3.FromHexString(config.emissiveHex).scale(
        config.emissiveIntensity,
      );
      for (const child of template.getChildMeshes(false)) {
        if (child.material) {
          const mat = child.material;
          if (mat.getClassName() === 'PBRMaterial') {
            const pbr = mat as PBRMaterial;
            pbr.emissiveColor = emissive;
            pbr.emissiveIntensity = 1.0;
          } else {
            const std = mat as StandardMaterial;
            std.maxSimultaneousLights = 8;
            std.emissiveColor = emissive;
          }
        }
      }

      template.setEnabled(false);
      templateCache.set(type, template);
    }),
  );
}

function getEyeMaterial(
  type: string,
  scene: Scene,
): StandardMaterial {
  if (!eyeMaterialCache.has(type)) {
    const config = GOAT_CONFIGS[type] || GOAT_CONFIGS.goat;
    const mat = new StandardMaterial(`goatEyeMat-${type}`, scene);
    mat.diffuseColor = Color3.FromHexString(config.eyeColor);
    mat.emissiveColor = Color3.FromHexString(config.eyeColor);
    mat.specularPower = 64;
    mat.maxSimultaneousLights = 4;
    mat.backFaceCulling = false;
    eyeMaterialCache.set(type, mat);
  }
  return eyeMaterialCache.get(type)!;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create a 3D enemy mesh for an entity.
 * Adds a Havok capsule collider for physics-based raycasting.
 * Entity ID stored in mesh.metadata for retrieval after raycast hits.
 */
export function createGoatMesh(
  id: string,
  type: EntityType,
  scene: Scene,
): Mesh {
  const config = GOAT_CONFIGS[type as string] || GOAT_CONFIGS.goat;
  const template = templateCache.get(type as string);

  if (!template) {
    throw new Error(
      `Enemy template not loaded for type "${type}". ` +
      `Call loadAllEnemyTemplates() and wait for it to complete before spawning enemies.`
    );
  }

  const mesh = cloneModelHierarchy(template, `mesh-enemy-${id}`, scene);
  mesh.isVisible = true;
  mesh.scaling = new Vector3(config.scale, config.scale, config.scale);

  // Emissive eyes as children
  const eyeMat = getEyeMaterial(type as string, scene);
  for (const side of [-1, 1]) {
    const eye = MeshBuilder.CreateSphere(
      `_eye_${id}_${side}`,
      {diameter: 0.07, segments: 6},
      scene,
    );
    eye.position = new Vector3(side * 0.12, 0.9, 0.8);
    eye.parent = mesh;
    eye.material = eyeMat;
    eye.isPickable = false;
  }

  // Havok physics capsule collider — scaled height/radius for enemy type
  const capsuleHeight = 1.5 * config.scale;
  const capsuleRadius = 0.4 * config.scale;
  addEnemyCollider(mesh, id, scene, capsuleHeight, capsuleRadius);

  return mesh;
}

/**
 * Dispose a single enemy's 3D mesh and its physics collider.
 * Shared materials are NOT disposed — they're cleaned up by disposeGoatCache.
 */
export function disposeGoatMesh(mesh: Mesh): void {
  const entityId = mesh.metadata?.entityId;
  if (entityId) {
    removeEnemyCollider(entityId);
  }
  mesh.dispose();
}

/**
 * Dispose all cached templates and materials.
 * Call when transitioning away from gameplay.
 */
export function disposeGoatCache(): void {
  for (const template of templateCache.values()) {
    template.getChildMeshes(false).forEach(m => m.dispose());
    template.dispose();
  }
  templateCache.clear();

  for (const mat of eyeMaterialCache.values()) {
    mat.dispose();
  }
  eyeMaterialCache.clear();
}
