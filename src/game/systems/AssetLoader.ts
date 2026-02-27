/**
 * Asset loading utilities — resolves Metro require() IDs to URIs and provides
 * typed helpers for loading textures, GLB models, and audio buffers.
 */
import {Asset} from 'expo-asset';
import {
  AbstractMesh,
  Mesh,
  PBRMaterial,
  Scene,
  SceneLoader,
  Texture,
  TransformNode,
} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';

import {
  TEXTURE_ASSETS,
  WEAPON_MODEL_ASSETS,
  ENEMY_MODEL_ASSETS,
  PROP_MODEL_ASSETS,
  MUSIC_ASSETS,
  SFX_ASSETS,
  type TextureAssetKey,
  type WeaponModelKey,
  type EnemyModelKey,
  type PropModelKey,
  type MusicAssetKey,
  type SfxAssetKey,
} from './AssetRegistry';

// ---------------------------------------------------------------------------
// URI resolution
// ---------------------------------------------------------------------------

/** Resolve a Metro require() module ID to a fetchable URI string. */
function resolveAssetUri(moduleId: number | string): string {
  if (typeof moduleId === 'string') return moduleId;
  const asset = Asset.fromModule(moduleId);
  return asset.uri;
}

// ---------------------------------------------------------------------------
// Texture loading
// ---------------------------------------------------------------------------

/** Load a JPG texture from the asset registry by key. */
export function loadTexture(key: TextureAssetKey, scene: Scene): Texture {
  const uri = resolveAssetUri(TEXTURE_ASSETS[key] as unknown as number);
  const tex = new Texture(uri, scene, false, true);
  tex.name = key;
  return tex;
}

// ---------------------------------------------------------------------------
// GLB model loading
// ---------------------------------------------------------------------------

type ModelAssets = typeof WEAPON_MODEL_ASSETS | typeof ENEMY_MODEL_ASSETS | typeof PROP_MODEL_ASSETS;

async function loadGlbModel(
  registry: ModelAssets,
  key: string,
  scene: Scene,
): Promise<Mesh> {
  const moduleId = (registry as Record<string, number>)[key];
  if (moduleId === undefined) {
    throw new Error(`Unknown model key: ${key}`);
  }
  const uri = resolveAssetUri(moduleId);

  // Metro serves assets via URLs like /assets/?unstable_path=./path/file.glb
  // SceneLoader can't detect .glb extension from this URL format, so we pass
  // the full URI as the filename with an empty rootUrl, and explicitly specify
  // the plugin extension so BabylonJS uses the glTF loader.
  const result = await SceneLoader.ImportMeshAsync(
    '',
    '',
    uri,
    scene,
    undefined,
    '.glb',
  );

  // Normalize PBR materials so GLB models render under direct lights without IBL.
  // glTF always imports as PBRMaterial; without an environment texture these are
  // pitch-black. Setting metallic=0 and roughness=0.85 makes them fully diffuse,
  // responsive to point/hemispheric/spot lights.
  for (const mesh of result.meshes) {
    if (mesh.material && mesh.material.getClassName() === 'PBRMaterial') {
      const pbr = mesh.material as PBRMaterial;
      pbr.metallic = 0;
      pbr.roughness = 0.85;
      pbr.maxSimultaneousLights = 8;
    }
  }

  // Create a root mesh to hold all imported meshes
  const root = new Mesh(`model-${key}`, scene);
  for (const mesh of result.meshes) {
    if (!mesh.parent) {
      mesh.parent = root;
    }
  }
  root.setEnabled(false); // template — clone for instances
  return root;
}

/** Load a weapon model by registry key. */
export async function loadWeaponModel(
  key: WeaponModelKey,
  scene: Scene,
): Promise<Mesh> {
  return loadGlbModel(WEAPON_MODEL_ASSETS, key, scene);
}

/** Load an enemy model by registry key. */
export async function loadEnemyModel(
  key: EnemyModelKey,
  scene: Scene,
): Promise<Mesh> {
  return loadGlbModel(ENEMY_MODEL_ASSETS, key, scene);
}

/** Load a prop model by registry key. */
export async function loadPropModel(
  key: PropModelKey,
  scene: Scene,
): Promise<Mesh> {
  return loadGlbModel(PROP_MODEL_ASSETS, key, scene);
}

// ---------------------------------------------------------------------------
// Model cloning — deep-clone entire GLB hierarchy
// ---------------------------------------------------------------------------

/**
 * Deep-clone a GLB model template including all child meshes.
 * Uses Babylon's instantiateHierarchy with doNotInstantiate:true to create
 * full clones (not instances) of the entire node tree — armatures, bones,
 * meshes, materials, and transform nodes are all properly duplicated.
 */
export function cloneModelHierarchy(
  template: Mesh,
  name: string,
  _scene: Scene,
): Mesh {
  // Enable template momentarily so instantiateHierarchy can traverse it
  template.setEnabled(true);

  const cloned = template.instantiateHierarchy(
    null,
    {doNotInstantiate: true},
    (source, clone) => {
      clone.name = `${name}_${source.name}`;
    },
  );

  // Disable template again
  template.setEnabled(false);

  if (!cloned) {
    throw new Error(
      `cloneModelHierarchy failed for "${name}". ` +
      `instantiateHierarchy returned null — template may have no children.`
    );
  }

  // The result is a TransformNode; wrap in a Mesh reference for our API
  const root = cloned as unknown as Mesh;
  root.name = name;
  root.setEnabled(true);

  // Ensure all child meshes are enabled and visible
  const childMeshes = root.getChildMeshes(false);
  for (const child of childMeshes) {
    child.setEnabled(true);
    child.isVisible = true;
  }

  return root;
}

// ---------------------------------------------------------------------------
// Audio loading
// ---------------------------------------------------------------------------

/** Fetch and decode an OGG audio file into an AudioBuffer. */
async function loadAudioBuffer(
  moduleId: number,
  audioCtx: AudioContext,
): Promise<AudioBuffer> {
  const uri = resolveAssetUri(moduleId);
  const response = await fetch(uri);
  const arrayBuffer = await response.arrayBuffer();
  return audioCtx.decodeAudioData(arrayBuffer);
}

/** Load all music tracks into a map of AudioBuffers. */
export async function loadAllMusic(
  audioCtx: AudioContext,
): Promise<Map<MusicAssetKey, AudioBuffer>> {
  const map = new Map<MusicAssetKey, AudioBuffer>();
  const entries = Object.entries(MUSIC_ASSETS) as [MusicAssetKey, number][];
  await Promise.all(
    entries.map(async ([key, moduleId]) => {
      const buffer = await loadAudioBuffer(moduleId, audioCtx);
      map.set(key, buffer);
    }),
  );
  return map;
}

/** Load all SFX into a map of AudioBuffer arrays (variants per sound). */
export async function loadAllSfx(
  audioCtx: AudioContext,
): Promise<Map<string, AudioBuffer[]>> {
  const map = new Map<string, AudioBuffer[]>();
  const entries = Object.entries(SFX_ASSETS) as [SfxAssetKey, number][];

  await Promise.all(
    entries.map(async ([key, moduleId]) => {
      const buffer = await loadAudioBuffer(moduleId, audioCtx);
      // Group by prefix: 'sfx-pistol-0' → 'sfx-pistol'
      const groupKey = key.replace(/-\d+$/, '');
      if (!map.has(groupKey)) {
        map.set(groupKey, []);
      }
      map.get(groupKey)!.push(buffer);
    }),
  );
  return map;
}

// ---------------------------------------------------------------------------
// Progress tracking
// ---------------------------------------------------------------------------

export interface LoadProgress {
  loaded: number;
  total: number;
  label: string;
}

export type ProgressCallback = (progress: LoadProgress) => void;
