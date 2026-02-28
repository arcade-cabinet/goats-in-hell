/**
 * Three.js PBR materials for dungeon walls, floors, and ceilings.
 *
 * Provides factory functions that create MeshStandardMaterial for each theme
 * element, with PBR textures (color, normal, roughness) loaded from the
 * AssetRegistry. Textures are loaded asynchronously and applied once ready;
 * materials start with flat-color fallbacks so rendering is never blocked.
 *
 * Materials and textures are cached by key to avoid recreation across
 * floor transitions.
 */
import { Asset } from 'expo-asset';
import * as THREE from 'three';
import { COLORS } from '../../constants';
import type { FloorTheme } from '../../game/levels/FloorThemes';
import { TEXTURE_ASSETS, type TextureAssetKey } from '../../game/systems/AssetRegistry';

// ---------------------------------------------------------------------------
// Cache: one material instance per theme + element combination
// ---------------------------------------------------------------------------

const wallCache = new Map<string, THREE.MeshStandardMaterial>();
const floorCache = new Map<string, THREE.MeshStandardMaterial>();
const ceilingCache = new Map<string, THREE.MeshStandardMaterial>();

// ---------------------------------------------------------------------------
// Texture loading & caching
// ---------------------------------------------------------------------------

const textureCache = new Map<TextureAssetKey, THREE.Texture>();
const textureLoader = new THREE.TextureLoader();

/** Pending load promises — prevents duplicate fetches for the same key. */
const pendingLoads = new Map<TextureAssetKey, Promise<THREE.Texture | null>>();

/**
 * Resolve a Metro require() module ID to a fetchable URI string.
 * Uses expo-asset for React Native / Expo projects.
 */
function resolveAssetUri(moduleId: number | string): string {
  if (typeof moduleId === 'string') return moduleId;
  const asset = Asset.fromModule(moduleId);
  return asset.uri;
}

/**
 * Load a single texture by AssetRegistry key. Returns the cached texture
 * immediately if already loaded, otherwise kicks off an async load and
 * returns a Promise. Returns null on failure (caller should keep flat color).
 */
function loadTexture(key: TextureAssetKey): Promise<THREE.Texture | null> {
  // Already loaded — return immediately
  const cached = textureCache.get(key);
  if (cached) return Promise.resolve(cached);

  // Already in-flight — return existing promise
  const pending = pendingLoads.get(key);
  if (pending) return pending;

  const moduleId = TEXTURE_ASSETS[key];
  if (moduleId == null) return Promise.resolve(null);

  const promise = new Promise<THREE.Texture | null>((resolve) => {
    try {
      const uri = resolveAssetUri(moduleId as unknown as number);
      textureLoader.load(
        uri,
        (texture) => {
          textureCache.set(key, texture);
          pendingLoads.delete(key);
          resolve(texture);
        },
        undefined,
        (_err) => {
          console.warn(`[Materials] Failed to load texture "${key}"`);
          pendingLoads.delete(key);
          resolve(null);
        },
      );
    } catch (_e) {
      console.warn(`[Materials] Failed to resolve asset URI for "${key}"`);
      pendingLoads.delete(key);
      resolve(null);
    }
  });

  pendingLoads.set(key, promise);
  return promise;
}

/**
 * Configure a texture for tiled dungeon surfaces: repeat wrapping +
 * appropriate tiling scale.
 */
function configureTiling(
  texture: THREE.Texture,
  repeatX: number,
  repeatY: number,
  isColorMap = true,
): void {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  // Color maps need sRGB; normal/roughness/metalness maps store data, not color
  texture.colorSpace = isColorMap ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.needsUpdate = true;
}

// ---------------------------------------------------------------------------
// Texture set definitions per theme/element
// ---------------------------------------------------------------------------

interface TextureSetDef {
  color: TextureAssetKey;
  normal: TextureAssetKey;
  roughness: TextureAssetKey;
  emission?: TextureAssetKey;
  metalness?: TextureAssetKey;
}

/** Wall texture sets keyed by theme name. */
const WALL_TEXTURE_SETS: Record<string, TextureSetDef> = {
  firePits: {
    color: 'stone-color',
    normal: 'stone-normal',
    roughness: 'stone-roughness',
  },
  fleshCaverns: {
    color: 'flesh-color',
    normal: 'flesh-normal',
    roughness: 'flesh-roughness',
  },
  obsidianFortress: {
    color: 'obsidian-color',
    normal: 'obsidian-normal',
    roughness: 'obsidian-roughness',
  },
  theVoid: {
    color: 'obsidian-color',
    normal: 'obsidian-normal',
    roughness: 'obsidian-roughness',
  },
};

/** Wall texture sets keyed by wall-type cell value. */
const WALL_TYPE_TEXTURE_SETS: Record<number, TextureSetDef> = {
  // WALL_STONE (1) — brick texture
  1: {
    color: 'stone-color',
    normal: 'stone-normal',
    roughness: 'stone-roughness',
  },
  // WALL_FLESH (2) — organic lava-like texture
  2: {
    color: 'flesh-color',
    normal: 'flesh-normal',
    roughness: 'flesh-roughness',
  },
  // WALL_LAVA (3) — lava texture with emission
  3: {
    color: 'lava-color',
    normal: 'lava-normal',
    roughness: 'lava-roughness',
    emission: 'lava-emission',
  },
  // WALL_OBSIDIAN (4) — dark crystalline texture
  4: {
    color: 'obsidian-color',
    normal: 'obsidian-normal',
    roughness: 'obsidian-roughness',
  },
};

/** Floor texture set (same ground texture for all themes, tinted per theme). */
const FLOOR_TEXTURE_SET: TextureSetDef = {
  color: 'floor-color',
  normal: 'floor-normal',
  roughness: 'floor-roughness',
};

/** Ceiling texture set. */
const CEILING_TEXTURE_SET: TextureSetDef = {
  color: 'ceiling-color',
  normal: 'ceiling-normal',
  roughness: 'ceiling-roughness',
};

/** Door texture set. */
const DOOR_TEXTURE_SET: TextureSetDef = {
  color: 'door-color',
  normal: 'door-normal',
  roughness: 'door-roughness',
  metalness: 'door-metalness',
};

// ---------------------------------------------------------------------------
// Async texture application
// ---------------------------------------------------------------------------

/** Tiling repeat counts for different surface types. */
const WALL_TILE = { x: 1, y: 1 };
const FLOOR_TILE = { x: 8, y: 8 };
const CEILING_TILE = { x: 8, y: 8 };
const DOOR_TILE = { x: 1, y: 1 };
const LAVA_TILE = { x: 2, y: 2 };

/**
 * Asynchronously load and apply a set of PBR textures to a material.
 * The material keeps its flat-color appearance until textures are ready.
 */
function applyTextureSet(
  mat: THREE.MeshStandardMaterial,
  texSet: TextureSetDef,
  tileX: number,
  tileY: number,
): void {
  // Color (diffuse/albedo) map
  loadTexture(texSet.color).then((tex) => {
    if (tex) {
      const t = tex.clone();
      configureTiling(t, tileX, tileY);
      mat.map = t;
      mat.needsUpdate = true;
    }
  });

  // Normal map (data texture — not color)
  loadTexture(texSet.normal).then((tex) => {
    if (tex) {
      const t = tex.clone();
      configureTiling(t, tileX, tileY, false);
      mat.normalMap = t;
      mat.normalScale.set(1.0, 1.0);
      mat.needsUpdate = true;
    }
  });

  // Roughness map (data texture — not color)
  loadTexture(texSet.roughness).then((tex) => {
    if (tex) {
      const t = tex.clone();
      configureTiling(t, tileX, tileY, false);
      mat.roughnessMap = t;
      mat.needsUpdate = true;
    }
  });

  // Emission map (optional — e.g. lava, this IS a color map)
  if (texSet.emission) {
    loadTexture(texSet.emission).then((tex) => {
      if (tex) {
        const t = tex.clone();
        configureTiling(t, tileX, tileY);
        mat.emissiveMap = t;
        mat.needsUpdate = true;
      }
    });
  }

  // Metalness map (data texture — not color)
  if (texSet.metalness) {
    loadTexture(texSet.metalness).then((tex) => {
      if (tex) {
        const t = tex.clone();
        configureTiling(t, tileX, tileY, false);
        mat.metalnessMap = t;
        mat.needsUpdate = true;
      }
    });
  }
}

// ---------------------------------------------------------------------------
// Per-wall-type material properties (keyed by MapCell wall value)
// ---------------------------------------------------------------------------

interface WallMatProps {
  color: string;
  emissive: string;
  emissiveIntensity: number;
  roughness: number;
  metalness: number;
}

/** Material properties for individual wall types (MapCell values). */
const WALL_TYPE_PROPS: Record<number, WallMatProps> = {
  // WALL_STONE (1)
  1: {
    color: COLORS.wallStone,
    emissive: '#000000',
    emissiveIntensity: 0,
    roughness: 0.9,
    metalness: 0.1,
  },
  // WALL_FLESH (2)
  2: {
    color: COLORS.wallFlesh,
    emissive: '#330808',
    emissiveIntensity: 0.3,
    roughness: 0.6,
    metalness: 0.05,
  },
  // WALL_LAVA (3)
  3: {
    color: COLORS.wallLava,
    emissive: '#ff4400',
    emissiveIntensity: 0.8,
    roughness: 0.8,
    metalness: 0.1,
  },
  // WALL_OBSIDIAN (4)
  4: {
    color: COLORS.wallObsidian,
    emissive: '#1a0430',
    emissiveIntensity: 0.2,
    roughness: 0.3,
    metalness: 0.7,
  },
};

// ---------------------------------------------------------------------------
// Theme-specific material presets
// ---------------------------------------------------------------------------

interface ThemeMatProps {
  wall: WallMatProps;
  floor: {
    color: string;
    emissive: string;
    emissiveIntensity: number;
    roughness: number;
    metalness: number;
  };
  ceiling: {
    color: string;
    emissive: string;
    emissiveIntensity: number;
    roughness: number;
    metalness: number;
  };
}

const THEME_PRESETS: Record<string, ThemeMatProps> = {
  firePits: {
    wall: {
      color: COLORS.wallStone,
      emissive: '#ff2200',
      emissiveIntensity: 0.15,
      roughness: 0.8,
      metalness: 0.1,
    },
    floor: {
      color: '#331008',
      emissive: '#ff4400',
      emissiveIntensity: 0.08,
      roughness: 0.85,
      metalness: 0.05,
    },
    ceiling: {
      color: '#1a0808',
      emissive: '#ff2200',
      emissiveIntensity: 0.05,
      roughness: 0.9,
      metalness: 0.0,
    },
  },
  fleshCaverns: {
    wall: {
      color: COLORS.wallFlesh,
      emissive: '#440a0a',
      emissiveIntensity: 0.25,
      roughness: 0.6,
      metalness: 0.05,
    },
    floor: {
      color: '#3a1010',
      emissive: '#330808',
      emissiveIntensity: 0.1,
      roughness: 0.55,
      metalness: 0.0,
    },
    ceiling: {
      color: '#2a0a0a',
      emissive: '#220505',
      emissiveIntensity: 0.08,
      roughness: 0.6,
      metalness: 0.0,
    },
  },
  obsidianFortress: {
    wall: {
      color: COLORS.wallObsidian,
      emissive: '#1a0430',
      emissiveIntensity: 0.2,
      roughness: 0.3,
      metalness: 0.7,
    },
    floor: {
      color: '#0a0510',
      emissive: '#110220',
      emissiveIntensity: 0.05,
      roughness: 0.4,
      metalness: 0.5,
    },
    ceiling: {
      color: '#080410',
      emissive: '#0a0118',
      emissiveIntensity: 0.03,
      roughness: 0.35,
      metalness: 0.6,
    },
  },
  theVoid: {
    wall: {
      color: '#0a0018',
      emissive: '#4400aa',
      emissiveIntensity: 0.35,
      roughness: 0.4,
      metalness: 0.5,
    },
    floor: {
      color: '#050010',
      emissive: '#220066',
      emissiveIntensity: 0.15,
      roughness: 0.5,
      metalness: 0.3,
    },
    ceiling: {
      color: '#030008',
      emissive: '#330088',
      emissiveIntensity: 0.2,
      roughness: 0.5,
      metalness: 0.3,
    },
  },
};

/** Fallback preset for unknown themes. */
const DEFAULT_PRESET: ThemeMatProps = THEME_PRESETS.firePits;

// ---------------------------------------------------------------------------
// Factory helpers
// ---------------------------------------------------------------------------

function getPreset(theme: FloorTheme): ThemeMatProps {
  return THEME_PRESETS[theme.name] ?? DEFAULT_PRESET;
}

function makeMaterial(props: {
  color: string;
  emissive: string;
  emissiveIntensity: number;
  roughness: number;
  metalness: number;
}): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(props.color),
    emissive: new THREE.Color(props.emissive),
    emissiveIntensity: props.emissiveIntensity,
    roughness: props.roughness,
    metalness: props.metalness,
    side: THREE.FrontSide,
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create (or return cached) wall material for a theme.
 * Uses the theme's primary wall type properties as the base,
 * overlaid with theme-specific emissive/roughness tweaks.
 * PBR textures are loaded asynchronously and applied once ready.
 */
export function createWallMaterial(theme: FloorTheme): THREE.MeshStandardMaterial {
  const key = theme.name;
  const cached = wallCache.get(key);
  if (cached) return cached;

  const preset = getPreset(theme);
  const mat = makeMaterial(preset.wall);
  mat.name = `wall-${key}`;
  wallCache.set(key, mat);

  // Apply PBR textures asynchronously
  const texSet = WALL_TEXTURE_SETS[key];
  if (texSet) {
    applyTextureSet(mat, texSet, WALL_TILE.x, WALL_TILE.y);
  }

  return mat;
}

/**
 * Create (or return cached) floor material for a theme.
 * PBR textures are loaded asynchronously and applied once ready.
 */
export function createFloorMaterial(theme: FloorTheme): THREE.MeshStandardMaterial {
  const key = theme.name;
  const cached = floorCache.get(key);
  if (cached) return cached;

  const preset = getPreset(theme);
  const mat = makeMaterial(preset.floor);
  mat.name = `floor-${key}`;
  mat.side = THREE.DoubleSide;
  floorCache.set(key, mat);

  // Apply floor PBR textures
  applyTextureSet(mat, FLOOR_TEXTURE_SET, FLOOR_TILE.x, FLOOR_TILE.y);

  return mat;
}

/**
 * Create (or return cached) ceiling material for a theme.
 * PBR textures are loaded asynchronously and applied once ready.
 */
export function createCeilingMaterial(theme: FloorTheme): THREE.MeshStandardMaterial {
  const key = theme.name;
  const cached = ceilingCache.get(key);
  if (cached) return cached;

  const preset = getPreset(theme);
  const mat = makeMaterial(preset.ceiling);
  mat.name = `ceiling-${key}`;
  mat.side = THREE.DoubleSide;
  ceilingCache.set(key, mat);

  // Apply ceiling PBR textures
  applyTextureSet(mat, CEILING_TEXTURE_SET, CEILING_TILE.x, CEILING_TILE.y);

  return mat;
}

/**
 * Get material properties for a specific wall type (MapCell value).
 * Used when different wall cells within a level need distinct materials.
 * PBR textures are loaded asynchronously and applied once ready.
 */
export function getWallTypeMaterial(wallCellValue: number): THREE.MeshStandardMaterial {
  const cacheKey = `wallType-${wallCellValue}`;
  const cached = wallCache.get(cacheKey);
  if (cached) return cached;

  const props = WALL_TYPE_PROPS[wallCellValue];
  if (!props) {
    // Default to stone if unknown
    const stoneProps = WALL_TYPE_PROPS[1];
    const mat = makeMaterial(stoneProps);
    mat.name = cacheKey;
    wallCache.set(cacheKey, mat);

    // Apply stone textures as fallback
    const texSet = WALL_TYPE_TEXTURE_SETS[1];
    if (texSet) {
      applyTextureSet(mat, texSet, WALL_TILE.x, WALL_TILE.y);
    }
    return mat;
  }

  const mat = makeMaterial(props);
  mat.name = cacheKey;
  wallCache.set(cacheKey, mat);

  // Apply wall-type-specific PBR textures
  const texSet = WALL_TYPE_TEXTURE_SETS[wallCellValue];
  if (texSet) {
    applyTextureSet(mat, texSet, WALL_TILE.x, WALL_TILE.y);
  }

  return mat;
}

/**
 * Create a lava floor tile material (emissive orange/red).
 * Uses lava PBR textures with emission map for glowing effect.
 */
export function createLavaMaterial(): THREE.MeshStandardMaterial {
  const cacheKey = 'lavaFloor';
  const cached = wallCache.get(cacheKey);
  if (cached) return cached;

  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#1a0a00'),
    emissive: new THREE.Color('#ff4400'),
    emissiveIntensity: 1.0,
    roughness: 0.8,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });
  mat.name = cacheKey;
  wallCache.set(cacheKey, mat);

  // Apply lava PBR textures with emission
  const texSet: TextureSetDef = {
    color: 'lava-color',
    normal: 'lava-normal',
    roughness: 'lava-roughness',
    emission: 'lava-emission',
  };
  applyTextureSet(mat, texSet, LAVA_TILE.x, LAVA_TILE.y);

  return mat;
}

/**
 * Create a void pit material (dark purple with emissive glow).
 */
export function createVoidPitMaterial(): THREE.MeshStandardMaterial {
  const cacheKey = 'voidPit';
  const cached = wallCache.get(cacheKey);
  if (cached) return cached;

  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#050010'),
    emissive: new THREE.Color('#3300aa'),
    emissiveIntensity: 0.6,
    roughness: 0.5,
    metalness: 0.2,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide,
  });
  mat.name = cacheKey;
  wallCache.set(cacheKey, mat);
  return mat;
}

/**
 * Create a door material with metal PBR textures.
 */
export function createDoorMaterial(): THREE.MeshStandardMaterial {
  const cacheKey = 'door';
  const cached = wallCache.get(cacheKey);
  if (cached) return cached;

  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(COLORS.door),
    emissive: new THREE.Color('#111000'),
    emissiveIntensity: 0.1,
    roughness: 0.7,
    metalness: 0.3,
  });
  mat.name = cacheKey;
  wallCache.set(cacheKey, mat);

  // Apply door PBR textures (metal)
  applyTextureSet(mat, DOOR_TEXTURE_SET, DOOR_TILE.x, DOOR_TILE.y);

  return mat;
}

/**
 * Create a ramp material (stone-like) with PBR textures.
 */
export function createRampMaterial(): THREE.MeshStandardMaterial {
  const cacheKey = 'ramp';
  const cached = wallCache.get(cacheKey);
  if (cached) return cached;

  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(COLORS.wallStone),
    emissive: new THREE.Color('#000000'),
    emissiveIntensity: 0,
    roughness: 0.85,
    metalness: 0.1,
  });
  mat.name = cacheKey;
  wallCache.set(cacheKey, mat);

  // Use stone textures for ramps
  const texSet = WALL_TYPE_TEXTURE_SETS[1]; // stone
  if (texSet) {
    applyTextureSet(mat, texSet, WALL_TILE.x, WALL_TILE.y);
  }

  return mat;
}

/**
 * Create a platform material (obsidian-like for raised floors) with PBR textures.
 */
export function createPlatformMaterial(): THREE.MeshStandardMaterial {
  const cacheKey = 'platform';
  const cached = wallCache.get(cacheKey);
  if (cached) return cached;

  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(COLORS.wallObsidian),
    emissive: new THREE.Color('#1a0430'),
    emissiveIntensity: 0.15,
    roughness: 0.35,
    metalness: 0.6,
  });
  mat.name = cacheKey;
  wallCache.set(cacheKey, mat);

  // Use obsidian textures for platforms
  const texSet = WALL_TYPE_TEXTURE_SETS[4]; // obsidian
  if (texSet) {
    applyTextureSet(mat, texSet, WALL_TILE.x, WALL_TILE.y);
  }

  return mat;
}

/**
 * Dispose all cached materials. Textures are intentionally retained
 * as they are shared across floor transitions. Call on app teardown.
 */
export function disposeCachedMaterials(): void {
  for (const mat of wallCache.values()) mat.dispose();
  for (const mat of floorCache.values()) mat.dispose();
  for (const mat of ceilingCache.values()) mat.dispose();
  wallCache.clear();
  floorCache.clear();
  ceilingCache.clear();
  // Note: textures are intentionally NOT disposed here — they are shared
  // across floor transitions and should persist for the lifetime of the app.
  // The texture cache is cheap (GPU textures are released when the context
  // is lost) and reloading them is expensive.
}

/**
 * Preload all PBR textures so they are ready before the first floor renders.
 * Call this during the loading screen. Returns a promise that resolves once
 * all textures are loaded (or have failed gracefully).
 */
export async function preloadAllTextures(): Promise<void> {
  const allKeys = Object.keys(TEXTURE_ASSETS) as TextureAssetKey[];
  await Promise.all(allKeys.map((key) => loadTexture(key)));
}
