/**
 * PBR materials for dungeon walls, floors, and ceilings.
 *
 * Uses pre-loaded AmbientCG PBR texture sets (Color, NormalGL, Roughness,
 * Emission) resolved via the AssetLoader pipeline.
 */
import {
  Color3,
  StandardMaterial,
  Scene,
  Texture,
} from '@babylonjs/core';

import {loadTexture} from '../systems/AssetLoader';
import type {TextureAssetKey} from '../systems/AssetRegistry';

export type WallType = 'stone' | 'flesh' | 'lava' | 'obsidian' | 'door';

// ---------------------------------------------------------------------------
// Texture set definitions
// ---------------------------------------------------------------------------

interface TextureSet {
  color: TextureAssetKey;
  normal: TextureAssetKey;
  emission?: TextureAssetKey;
}

const WALL_TEXTURES: Record<WallType, TextureSet> = {
  lava: {
    color: 'lava-color',
    normal: 'lava-normal',
    emission: 'lava-emission',
  },
  stone: {
    color: 'stone-color',
    normal: 'stone-normal',
  },
  flesh: {
    color: 'flesh-color',
    normal: 'flesh-normal',
  },
  obsidian: {
    color: 'obsidian-color',
    normal: 'obsidian-normal',
  },
  door: {
    color: 'door-color',
    normal: 'door-normal',
  },
};

const FLOOR_TEXTURES: TextureSet = {
  color: 'floor-color',
  normal: 'floor-normal',
};

const CEILING_TEXTURES: TextureSet = {
  color: 'ceiling-color',
  normal: 'ceiling-normal',
};

// ---------------------------------------------------------------------------
// Material property presets
// ---------------------------------------------------------------------------

interface MaterialProps {
  specularPower: number;
  specularColor: Color3;
  emissiveColor?: Color3;
  animate?: boolean;
}

const WALL_PROPS: Record<WallType, MaterialProps> = {
  stone: {specularPower: 8, specularColor: new Color3(0.1, 0.1, 0.1)},
  flesh: {
    specularPower: 20,
    specularColor: new Color3(0.2, 0.05, 0.05),
    emissiveColor: new Color3(0.2, 0.03, 0.03),
    animate: true,
  },
  lava: {
    specularPower: 40,
    specularColor: new Color3(0.3, 0.15, 0.05),
    emissiveColor: new Color3(1.0, 0.35, 0.02),
  },
  obsidian: {
    specularPower: 80,
    specularColor: new Color3(0.4, 0.35, 0.5),
    emissiveColor: new Color3(0.1, 0.02, 0.18),
  },
  door: {specularPower: 30, specularColor: new Color3(0.2, 0.2, 0.2)},
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function applyTextureSet(
  mat: StandardMaterial,
  texSet: TextureSet,
  scene: Scene,
): void {
  // Cap light slots to stay within WebGPU's 12 uniform buffer per-stage limit
  mat.maxSimultaneousLights = 8;

  mat.diffuseTexture = loadTexture(texSet.color, scene);

  if (texSet.emission) {
    mat.emissiveTexture = loadTexture(texSet.emission, scene);
  }

  const allTextures = [
    mat.diffuseTexture,
    mat.emissiveTexture,
  ];
  for (const tex of allTextures) {
    if (tex && tex instanceof Texture) {
      tex.uScale = 1;
      tex.vScale = 1;
    }
  }
}

// ---------------------------------------------------------------------------
// Public API — same signatures as before
// ---------------------------------------------------------------------------

export function createWallMaterial(
  name: string,
  wallType: WallType,
  scene: Scene,
): StandardMaterial {
  const mat = new StandardMaterial(name, scene);
  const texSet = WALL_TEXTURES[wallType];
  const props = WALL_PROPS[wallType];

  applyTextureSet(mat, texSet, scene);
  mat.specularPower = props.specularPower;
  mat.specularColor = props.specularColor;

  if (props.emissiveColor) {
    mat.emissiveColor = props.emissiveColor.clone();
  }

  if (props.animate) {
    let time = 0;
    scene.registerBeforeRender(() => {
      time += scene.getEngine().getDeltaTime() * 0.001;
      const pulse =
        0.5 + Math.sin(time * 1.8) * 0.35 + Math.sin(time * 3.1) * 0.15;
      mat.emissiveColor = new Color3(
        0.2 * pulse,
        0.03 * pulse,
        0.03 * pulse,
      );
    });
  }

  return mat;
}

export function createFloorMaterial(
  scene: Scene,
): StandardMaterial {
  const mat = new StandardMaterial('floorMat', scene);
  applyTextureSet(mat, FLOOR_TEXTURES, scene);
  mat.specularPower = 8;
  mat.specularColor = new Color3(0.1, 0.1, 0.1);
  return mat;
}

export function createCeilingMaterial(
  scene: Scene,
): StandardMaterial {
  const mat = new StandardMaterial('ceilingMat', scene);
  applyTextureSet(mat, CEILING_TEXTURES, scene);
  mat.specularPower = 10;
  mat.specularColor = new Color3(0.05, 0.05, 0.05);
  return mat;
}
