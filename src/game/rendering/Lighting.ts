import {
  Camera,
  Color3,
  FreeCamera,
  PointLight,
  Scene,
  SpotLight,
  Vector3,
  ShadowGenerator,
} from '@babylonjs/core';
import {MapCell} from '../levels/LevelGenerator';
import {useGameStore} from '../../state/GameStore';
import {GameState} from '../../state/GameState';
import type {WeaponId} from '../entities/components';

export interface DynamicLight {
  light: PointLight;
  baseIntensity: number;
  flickerSpeed: number;
  flickerAmount: number;
}

export function createLavaLights(
  grid: number[][],
  cellSize: number,
  scene: Scene,
): DynamicLight[] {
  const lights: DynamicLight[] = [];

  for (let z = 0; z < grid.length; z++) {
    for (let x = 0; x < grid[z].length; x++) {
      if (grid[z][x] !== MapCell.WALL_LAVA) {
        continue;
      }

      // Skip ~50% randomly for performance
      if (useGameStore.getState().rng() < 0.5) {
        continue;
      }

      // Cap at 6 — with hemispheric + spotlight = 8 total scene lights.
      // Materials set maxSimultaneousLights=8 to match.
      if (lights.length >= 6) {
        break;
      }

      const light = new PointLight(
        `lavaLight_${lights.length}`,
        new Vector3(x * cellSize, 1.5, z * cellSize),
        scene,
      );
      light.diffuse = new Color3(1.0, 0.4, 0.1);
      light.intensity = 0.6;
      light.range = 6;

      const flickerSpeed = 2 + useGameStore.getState().rng() * 3;
      const flickerAmount = 0.2 + useGameStore.getState().rng() * 0.2;

      lights.push({
        light,
        baseIntensity: 0.6,
        flickerSpeed,
        flickerAmount,
      });
    }

    if (lights.length >= 6) {
      break;
    }
  }

  return lights;
}

export function createPlayerSpotlight(scene: Scene): {
  light: SpotLight;
  shadowGen: ShadowGenerator;
} {
  const light = new SpotLight(
    'playerSpotlight',
    Vector3.Zero(),
    Vector3.Forward(),
    Math.PI / 4,
    2,
    scene,
  );
  light.diffuse = new Color3(0.9, 0.7, 0.5);
  light.intensity = 0.8;
  light.range = 15;

  const shadowGen = new ShadowGenerator(512, light);
  shadowGen.useBlurExponentialShadowMap = true;
  shadowGen.blurKernel = 16;

  return {light, shadowGen};
}

export function updateFlickerLights(
  lights: DynamicLight[],
  time: number,
): void {
  for (const dl of lights) {
    dl.light.intensity =
      dl.baseIntensity + Math.sin(time * dl.flickerSpeed) * dl.flickerAmount;
  }
}

// ---------------------------------------------------------------------------
// Muzzle flash dynamic light
// ---------------------------------------------------------------------------

const MUZZLE_COLORS: Record<WeaponId, Color3> = {
  hellPistol: new Color3(1.0, 0.6, 0.2), // orange
  brimShotgun: new Color3(1.0, 0.9, 0.4), // bright yellow
  hellfireCannon: new Color3(1.0, 0.3, 0.1), // deep red-orange
  goatsBane: new Color3(0.9, 0.9, 1.0), // white-blue
};

let muzzleLight: PointLight | null = null;

/** Create the muzzle flash light (call once per scene). */
export function createMuzzleFlashLight(scene: Scene): PointLight {
  muzzleLight = new PointLight('muzzleFlash', Vector3.Zero(), scene);
  muzzleLight.intensity = 0;
  muzzleLight.range = 8;
  muzzleLight.diffuse = new Color3(1, 0.6, 0.2);
  return muzzleLight;
}

/** Update muzzle flash light each frame. */
export function updateMuzzleFlash(camera: Camera, weaponId?: WeaponId): void {
  if (!muzzleLight) return;

  const flash = GameState.get().gunFlash;
  if (flash > 0) {
    const t = Math.min(flash / 6, 1);
    muzzleLight.intensity = t * 3;
    muzzleLight.range = 6 + t * 4;

    // Color by weapon type
    if (weaponId && MUZZLE_COLORS[weaponId]) {
      muzzleLight.diffuse = MUZZLE_COLORS[weaponId];
    }

    // Position at camera + forward offset
    const cam = camera as FreeCamera;
    const yaw = cam.rotation.y;
    muzzleLight.position.x = cam.position.x + Math.sin(yaw) * 0.5;
    muzzleLight.position.y = cam.position.y - 0.1;
    muzzleLight.position.z = cam.position.z + Math.cos(yaw) * 0.5;
  } else {
    muzzleLight.intensity = 0;
  }
}

/** Dispose the muzzle flash light. */
export function disposeMuzzleFlash(): void {
  if (muzzleLight) {
    muzzleLight.dispose();
    muzzleLight = null;
  }
}
