/**
 * Dungeon prop system — loads and places decorative GLB models from the
 * Kenney Graveyard Kit (fire-baskets, candles, coffins, etc.).
 */
import {
  Mesh,
  Scene,
  StandardMaterial,
  Vector3,
} from '@babylonjs/core';

import {loadPropModel, cloneModelHierarchy} from '../systems/AssetLoader';
import type {PropModelKey} from '../systems/AssetRegistry';

// ---------------------------------------------------------------------------
// Prop type definitions
// ---------------------------------------------------------------------------

export type PropType =
  | 'prop_firebasket'
  | 'prop_candle'
  | 'prop_candle_multi'
  | 'prop_altar'
  | 'prop_coffin'
  | 'prop_column'
  | 'prop_chalice'
  | 'prop_bowl';

const PROP_MODEL_MAP: Record<PropType, PropModelKey> = {
  prop_firebasket: 'prop-firebasket',
  prop_candle: 'prop-candle',
  prop_candle_multi: 'prop-candle-multi',
  prop_altar: 'prop-altar',
  prop_coffin: 'prop-coffin',
  prop_column: 'prop-column',
  prop_chalice: 'prop-chalice',
  prop_bowl: 'prop-bowl',
};

/** Scale factors to fit CELL_SIZE (2 units). */
const PROP_SCALES: Record<PropType, number> = {
  prop_firebasket: 0.5,
  prop_candle: 0.4,
  prop_candle_multi: 0.4,
  prop_altar: 0.6,
  prop_coffin: 0.5,
  prop_column: 0.7,
  prop_chalice: 0.3,
  prop_bowl: 0.3,
};

// ---------------------------------------------------------------------------
// Template cache
// ---------------------------------------------------------------------------

const templateCache = new Map<PropType, Mesh>();

/**
 * Pre-load all prop GLB models. Call during asset loading phase.
 */
export async function loadAllProps(scene: Scene): Promise<void> {
  const entries = Object.entries(PROP_MODEL_MAP) as [PropType, PropModelKey][];
  await Promise.all(
    entries.map(async ([propType, modelKey]) => {
      const template = await loadPropModel(modelKey, scene);
      template.name = `propTemplate-${propType}`;
      // Cap light slots for WebGPU compatibility (PBR materials from GLB)
      for (const child of template.getChildMeshes(false)) {
        if (child.material) {
          (child.material as StandardMaterial).maxSimultaneousLights = 8;
        }
      }
      template.setEnabled(false);
      templateCache.set(propType, template);
    }),
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create a prop mesh instance at the given position.
 * Props are non-pickable, static decorations.
 */
export function createProp(
  type: PropType,
  position: Vector3,
  rotation: number,
  scene: Scene,
): Mesh | null {
  const template = templateCache.get(type);
  if (!template) return null;

  const mesh = cloneModelHierarchy(template, `prop-${type}-${position.x}-${position.z}`, scene);
  const scale = PROP_SCALES[type];
  mesh.isPickable = false;
  mesh.scaling = new Vector3(scale, scale, scale);
  mesh.position = position.clone();
  mesh.rotation.y = rotation;

  // Mark all children as non-pickable too
  for (const child of mesh.getChildMeshes(false)) {
    child.isPickable = false;
  }

  return mesh;
}

/**
 * Dispose all cached prop templates.
 */
export function disposePropCache(): void {
  for (const template of templateCache.values()) {
    template.getChildMeshes(false).forEach(m => m.dispose());
    template.dispose();
  }
  templateCache.clear();
}
