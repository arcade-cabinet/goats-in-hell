import {
  Color3,
  PointLight,
  Scene,
  SpotLight,
  Vector3,
  ShadowGenerator,
} from '@babylonjs/core';
import {MapCell} from '../levels/LevelGenerator';

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
      if (Math.random() < 0.5) {
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

      const flickerSpeed = 2 + Math.random() * 3;
      const flickerAmount = 0.2 + Math.random() * 0.2;

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
