/**
 * DecalSystem -- R3F component that renders surface decal textures
 * (cracks, frost, stains, leaking, scorch marks) loaded from the level
 * database.
 *
 * Decals are transparent texture quads projected onto level geometry
 * (floors, walls, or ceilings). Each decal type maps to a set of PBR
 * textures (color, normal, opacity, roughness) from AmbientCG.
 *
 * Follows the EnvironmentZones.tsx pattern: imperative Three.js,
 * scene.add/remove, proper cleanup of geometries and materials.
 *
 * All coordinates arrive in world space from LevelDbAdapter.toDecals().
 */

import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import * as THREE from 'three/webgpu';
import { WALL_HEIGHT } from '../../constants';
import type { RuntimeDecal } from '../../db/LevelDbAdapter';
import { TEXTURE_ASSETS, type TextureAssetKey } from '../../game/systems/AssetRegistry';

// ---------------------------------------------------------------------------
// Decal texture set registry
// ---------------------------------------------------------------------------

interface DecalTextureSet {
  color: TextureAssetKey;
  normal: TextureAssetKey;
  opacity: TextureAssetKey;
  roughness: TextureAssetKey;
}

/**
 * Map decal type identifiers to their texture asset keys.
 * Types without a dedicated texture set use the first available set
 * as a fallback. New decal textures can be added here as they are
 * imported into the AssetRegistry.
 */
const DECAL_TEXTURE_SETS: Record<string, DecalTextureSet> = {
  // Leaking/stain decals (AmbientCG Leaking001)
  'water-stain': {
    color: 'decal-leaking001-color',
    normal: 'decal-leaking001-normal',
    opacity: 'decal-leaking001-opacity',
    roughness: 'decal-leaking001-roughness',
  },
  // Blood stain (AmbientCG Leaking005 — darker, reddish tones)
  'blood-stain': {
    color: 'decal-leaking005-color',
    normal: 'decal-leaking005-normal',
    opacity: 'decal-leaking005-opacity',
    roughness: 'decal-leaking005-roughness',
  },
  // Concrete crack / asphalt damage (AmbientCG AsphaltDamage001)
  'concrete-crack': {
    color: 'decal-damage001-color',
    normal: 'decal-damage001-normal',
    opacity: 'decal-damage001-opacity',
    roughness: 'decal-damage001-roughness',
  },
  // Scorch mark — reuse damage texture with tinted material
  'scorch-mark': {
    color: 'decal-damage001-color',
    normal: 'decal-damage001-normal',
    opacity: 'decal-damage001-opacity',
    roughness: 'decal-damage001-roughness',
  },
  // Rust patch — reuse leaking with tinted material
  'rust-patch': {
    color: 'decal-leaking001-color',
    normal: 'decal-leaking001-normal',
    opacity: 'decal-leaking001-opacity',
    roughness: 'decal-leaking001-roughness',
  },
};

/**
 * Fallback texture set used when a decal type has no dedicated textures.
 * Uses the ice textures already in the project (no opacity map — uses
 * flat opacity from the decal row).
 */
const FALLBACK_TEXTURE_SET: Partial<DecalTextureSet> = {
  color: 'treachery-color',
  normal: 'treachery-normal',
  roughness: 'treachery-roughness',
};

/**
 * Color tints applied to specific decal types to differentiate them
 * visually even when sharing the same texture set.
 */
const DECAL_TINTS: Record<string, string> = {
  'ice-frost': '#aaddff',
  'snow-drift': '#eeeeff',
  'blood-stain': '#660000',
  'scorch-mark': '#221100',
  'rust-patch': '#884422',
  'moss-patch': '#224411',
  'water-stain': '#888888',
  'concrete-crack': '#666666',
};

// ---------------------------------------------------------------------------
// Texture loader (reuses the same approach as Materials.ts)
// ---------------------------------------------------------------------------

const textureLoader = new THREE.TextureLoader();
const decalTextureCache = new Map<string, THREE.Texture>();
const decalPendingLoads = new Map<string, Promise<THREE.Texture | null>>();

/**
 * Resolve a Metro require() module ID to a fetchable URI.
 * Mirrors the same function in Materials.ts.
 */
function resolveAssetUri(moduleId: number | string): string {
  if (typeof moduleId === 'string') return moduleId;
  // Lazy import to avoid circular dependency
  const { Asset } = require('expo-asset');
  const asset = Asset.fromModule(moduleId);
  return asset.uri;
}

function loadDecalTexture(key: TextureAssetKey): Promise<THREE.Texture | null> {
  const cached = decalTextureCache.get(key);
  if (cached) return Promise.resolve(cached);

  const pending = decalPendingLoads.get(key);
  if (pending) return pending;

  const moduleId = TEXTURE_ASSETS[key];
  if (moduleId == null) return Promise.resolve(null);

  const promise = new Promise<THREE.Texture | null>((resolve) => {
    try {
      const uri = resolveAssetUri(moduleId as unknown as number);
      textureLoader.load(
        uri,
        (texture) => {
          decalTextureCache.set(key, texture);
          decalPendingLoads.delete(key);
          resolve(texture);
        },
        undefined,
        (_err) => {
          console.warn(`[DecalSystem] Failed to load texture "${key}"`);
          decalPendingLoads.delete(key);
          resolve(null);
        },
      );
    } catch (_e) {
      console.warn(`[DecalSystem] Failed to resolve asset URI for "${key}"`);
      decalPendingLoads.delete(key);
      resolve(null);
    }
  });

  decalPendingLoads.set(key, promise);
  return promise;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface DecalSystemProps {
  decals: RuntimeDecal[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Renders surface decals as translucent textured quads projected onto
 * level geometry. Returns null -- all rendering is side-effectful via
 * scene.add().
 */
export function DecalSystem({ decals }: DecalSystemProps): null {
  const scene = useThree((state) => state.scene);

  useEffect(() => {
    if (decals.length === 0) return;

    const createdObjects: THREE.Object3D[] = [];
    const createdGeometries: THREE.BufferGeometry[] = [];
    const createdMaterials: THREE.Material[] = [];

    for (const decal of decals) {
      // Compute world-space center position
      // Decal coordinates arrive already in world space from toDecals().
      // Three.js Z-negation: negate the center Z
      const centerX = decal.x;
      const centerZ = -decal.z;

      const tint = DECAL_TINTS[decal.decalType] ?? '#ffffff';

      // Create geometry based on surface
      let geometry: THREE.BufferGeometry;
      let yPos: number;

      if (decal.surface === 'floor') {
        geometry = new THREE.PlaneGeometry(decal.w, decal.h);
        geometry.rotateX(-Math.PI / 2); // Lie flat, face up
        if (decal.rotation !== 0) {
          geometry.rotateY(decal.rotation);
        }
        yPos = 0.02; // Just above floor to avoid z-fighting
      } else if (decal.surface === 'ceiling') {
        geometry = new THREE.PlaneGeometry(decal.w, decal.h);
        geometry.rotateX(Math.PI / 2); // Face down
        if (decal.rotation !== 0) {
          geometry.rotateY(decal.rotation);
        }
        yPos = WALL_HEIGHT - 0.02; // Just below ceiling
      } else {
        // Wall: vertical plane facing +Z (will be positioned against a wall)
        geometry = new THREE.PlaneGeometry(decal.w, decal.h);
        if (decal.rotation !== 0) {
          geometry.rotateY(decal.rotation);
        }
        yPos = WALL_HEIGHT / 2; // Center of wall height
      }
      createdGeometries.push(geometry);

      // Create material with flat-color fallback
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(tint),
        transparent: true,
        opacity: decal.opacity,
        side: THREE.DoubleSide,
        depthWrite: false,
        roughness: 0.9,
        metalness: 0.0,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      });
      material.name = `decal-${decal.decalType}-${decal.id}`;
      createdMaterials.push(material);

      // Create mesh
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(centerX, yPos, centerZ);
      mesh.name = `decal-mesh-${decal.id}`;
      mesh.renderOrder = 2; // Render after opaque and env zones
      mesh.receiveShadow = true;
      scene.add(mesh);
      createdObjects.push(mesh);

      // Load and apply textures asynchronously
      const texSet = DECAL_TEXTURE_SETS[decal.decalType];

      if (texSet) {
        // Full decal texture set with dedicated opacity map
        applyDecalTextures(material, texSet, decal.opacity);
      } else {
        // Fallback: use material textures without opacity map
        applyFallbackTextures(material, decal.decalType);
      }
    }

    // Cleanup on unmount
    return () => {
      for (const obj of createdObjects) {
        scene.remove(obj);
      }
      for (const geo of createdGeometries) {
        geo.dispose();
      }
      for (const mat of createdMaterials) {
        mat.dispose();
      }
    };
  }, [scene, decals]);

  return null;
}

// ---------------------------------------------------------------------------
// Texture application helpers
// ---------------------------------------------------------------------------

/**
 * Apply a full decal texture set (color, normal, opacity, roughness) to
 * a material. The opacity map controls per-texel alpha.
 */
function applyDecalTextures(
  mat: THREE.MeshStandardMaterial,
  texSet: DecalTextureSet,
  baseOpacity: number,
): void {
  // Color map
  loadDecalTexture(texSet.color)
    .then((tex) => {
      if (tex) {
        const t = tex.clone();
        t.colorSpace = THREE.SRGBColorSpace;
        mat.map = t;
        mat.needsUpdate = true;
      }
    })
    .catch(() => {});

  // Normal map
  loadDecalTexture(texSet.normal)
    .then((tex) => {
      if (tex) {
        const t = tex.clone();
        t.colorSpace = THREE.NoColorSpace;
        mat.normalMap = t;
        mat.normalScale.set(0.5, 0.5);
        mat.needsUpdate = true;
      }
    })
    .catch(() => {});

  // Opacity (alpha) map — this is the key decal feature
  loadDecalTexture(texSet.opacity)
    .then((tex) => {
      if (tex) {
        const t = tex.clone();
        t.colorSpace = THREE.NoColorSpace;
        mat.alphaMap = t;
        mat.opacity = baseOpacity;
        mat.needsUpdate = true;
      }
    })
    .catch(() => {});

  // Roughness map
  loadDecalTexture(texSet.roughness)
    .then((tex) => {
      if (tex) {
        const t = tex.clone();
        t.colorSpace = THREE.NoColorSpace;
        mat.roughnessMap = t;
        mat.needsUpdate = true;
      }
    })
    .catch(() => {});
}

/**
 * Apply fallback textures for decal types without dedicated texture sets.
 * Uses existing material textures (e.g. ice textures for frost decals).
 */
function applyFallbackTextures(mat: THREE.MeshStandardMaterial, decalType: string): void {
  // Map decal types to existing texture sets
  let colorKey: TextureAssetKey | undefined;
  let normalKey: TextureAssetKey | undefined;
  let roughnessKey: TextureAssetKey | undefined;

  if (decalType === 'ice-frost' || decalType === 'snow-drift') {
    colorKey = 'treachery-color';
    normalKey = 'treachery-normal';
    roughnessKey = 'treachery-roughness';
  } else if (decalType === 'moss-patch') {
    colorKey = 'gluttony-color';
    normalKey = 'gluttony-normal';
    roughnessKey = 'gluttony-roughness';
  } else if (FALLBACK_TEXTURE_SET.color) {
    colorKey = FALLBACK_TEXTURE_SET.color;
    normalKey = FALLBACK_TEXTURE_SET.normal;
    roughnessKey = FALLBACK_TEXTURE_SET.roughness;
  }

  if (colorKey) {
    loadDecalTexture(colorKey)
      .then((tex) => {
        if (tex) {
          const t = tex.clone();
          t.colorSpace = THREE.SRGBColorSpace;
          mat.map = t;
          mat.needsUpdate = true;
        }
      })
      .catch(() => {});
  }

  if (normalKey) {
    loadDecalTexture(normalKey)
      .then((tex) => {
        if (tex) {
          const t = tex.clone();
          t.colorSpace = THREE.NoColorSpace;
          mat.normalMap = t;
          mat.normalScale.set(0.5, 0.5);
          mat.needsUpdate = true;
        }
      })
      .catch(() => {});
  }

  if (roughnessKey) {
    loadDecalTexture(roughnessKey)
      .then((tex) => {
        if (tex) {
          const t = tex.clone();
          t.colorSpace = THREE.NoColorSpace;
          mat.roughnessMap = t;
          mat.needsUpdate = true;
        }
      })
      .catch(() => {});
  }
}

/**
 * Dispose all cached decal textures. Call on app teardown.
 */
export function disposeDecalTextures(): void {
  for (const tex of decalTextureCache.values()) {
    tex.dispose();
  }
  decalTextureCache.clear();
  decalPendingLoads.clear();
}
