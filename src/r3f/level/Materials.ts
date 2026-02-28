/**
 * Three.js PBR materials for dungeon walls, floors, and ceilings.
 *
 * Provides factory functions that create MeshStandardMaterial for each theme
 * element, with color/emissive/roughness/metalness tuned per FloorTheme.
 * Materials are cached by theme name to avoid recreation.
 */
import * as THREE from 'three';
import { COLORS } from '../../constants';
import type { FloorTheme } from '../../game/levels/FloorThemes';

// ---------------------------------------------------------------------------
// Cache: one material instance per theme + element combination
// ---------------------------------------------------------------------------

const wallCache = new Map<string, THREE.MeshStandardMaterial>();
const floorCache = new Map<string, THREE.MeshStandardMaterial>();
const ceilingCache = new Map<string, THREE.MeshStandardMaterial>();

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
 */
export function createWallMaterial(theme: FloorTheme): THREE.MeshStandardMaterial {
  const key = theme.name;
  const cached = wallCache.get(key);
  if (cached) return cached;

  const preset = getPreset(theme);
  const mat = makeMaterial(preset.wall);
  mat.name = `wall-${key}`;
  wallCache.set(key, mat);
  return mat;
}

/**
 * Create (or return cached) floor material for a theme.
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
  return mat;
}

/**
 * Create (or return cached) ceiling material for a theme.
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
  return mat;
}

/**
 * Get material properties for a specific wall type (MapCell value).
 * Used when different wall cells within a level need distinct materials.
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
    return mat;
  }

  const mat = makeMaterial(props);
  mat.name = cacheKey;
  wallCache.set(cacheKey, mat);
  return mat;
}

/**
 * Create a lava floor tile material (emissive orange/red).
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
 * Create a door material.
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
  return mat;
}

/**
 * Create a ramp material (stone-like).
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
  return mat;
}

/**
 * Create a platform material (obsidian-like for raised floors).
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
  return mat;
}

/**
 * Dispose all cached materials. Call on app teardown.
 */
export function disposeCachedMaterials(): void {
  for (const mat of wallCache.values()) mat.dispose();
  for (const mat of floorCache.values()) mat.dispose();
  for (const mat of ceilingCache.values()) mat.dispose();
  wallCache.clear();
  floorCache.clear();
  ceilingCache.clear();
}
