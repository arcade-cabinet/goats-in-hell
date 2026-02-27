import {
  Color4,
  DynamicTexture,
  ParticleSystem,
  Scene,
  Vector3,
} from '@babylonjs/core';

let cachedParticleTexture: DynamicTexture | null = null;
let cachedScene: Scene | null = null;

/** Creates (or reuses) a tiny DynamicTexture with a white radial circle for particles. */
function getParticleTexture(scene: Scene): DynamicTexture {
  if (cachedParticleTexture && cachedScene === scene) {
    return cachedParticleTexture;
  }

  const size = 64;
  const texture = new DynamicTexture('particleTex', size, scene, false);
  const ctx = texture.getContext() as unknown as CanvasRenderingContext2D;
  const half = size / 2;

  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.5, 'rgba(255,255,255,0.5)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  texture.update();
  texture.hasAlpha = true;

  cachedParticleTexture = texture;
  cachedScene = scene;
  return texture;
}

export function createLavaEmbers(
  position: Vector3,
  scene: Scene,
): ParticleSystem {
  const system = new ParticleSystem('lavaEmbers', 50, scene);
  system.particleTexture = getParticleTexture(scene);

  system.emitter = position;
  system.emitRate = 5;

  system.minLifeTime = 1.5;
  system.maxLifeTime = 2.5;

  system.direction1 = new Vector3(-0.3, 1, -0.3);
  system.direction2 = new Vector3(0.3, 2, 0.3);

  system.minSize = 0.02;
  system.maxSize = 0.06;

  system.color1 = new Color4(1, 0.5, 0, 0.8);
  system.color2 = new Color4(1, 0.5, 0, 0.8);
  system.colorDead = new Color4(0.5, 0.1, 0, 0);

  system.gravity = new Vector3(0, 0.5, 0);

  system.start();
  return system;
}

export function createDeathBurst(
  position: Vector3,
  scene: Scene,
  isBoss: boolean,
): ParticleSystem {
  const capacity = isBoss ? 80 : 30;
  const system = new ParticleSystem('deathBurst', capacity, scene);
  system.particleTexture = getParticleTexture(scene);

  system.emitter = position;
  system.manualEmitCount = capacity;

  system.minLifeTime = 0.3;
  system.maxLifeTime = 0.8;

  system.direction1 = new Vector3(-1, -1, -1);
  system.direction2 = new Vector3(1, 1, 1);

  system.minEmitPower = 2;
  system.maxEmitPower = 5;

  system.minSize = 0.05;
  system.maxSize = 0.15;

  if (isBoss) {
    system.color1 = new Color4(0.8, 0, 1, 1);
    system.color2 = new Color4(0.8, 0, 1, 1);
  } else {
    system.color1 = new Color4(0.8, 0.1, 0.1, 1);
    system.color2 = new Color4(0.8, 0.1, 0.1, 1);
  }
  system.colorDead = new Color4(0, 0, 0, 0);

  system.gravity = new Vector3(0, -2, 0);

  system.disposeOnStop = true;
  system.targetStopDuration = 1;

  system.start();
  system.stop();

  return system;
}

export function createMuzzleFlash(
  position: Vector3,
  direction: Vector3,
  scene: Scene,
): ParticleSystem {
  const system = new ParticleSystem('muzzleFlash', 20, scene);
  system.particleTexture = getParticleTexture(scene);

  system.emitter = position;
  system.manualEmitCount = 20;

  system.minLifeTime = 0.05;
  system.maxLifeTime = 0.15;

  system.direction1 = new Vector3(
    direction.x * 3 - 0.5,
    direction.y * 3 - 0.5,
    direction.z * 3 - 0.5,
  );
  system.direction2 = new Vector3(
    direction.x * 5 + 0.5,
    direction.y * 5 + 0.5,
    direction.z * 5 + 0.5,
  );

  system.minEmitPower = 5;
  system.maxEmitPower = 10;

  system.minSize = 0.03;
  system.maxSize = 0.08;

  system.color1 = new Color4(1, 0.8, 0.3, 1);
  system.color2 = new Color4(1, 0.8, 0.3, 1);
  system.colorDead = new Color4(1, 1, 0.8, 0);

  system.disposeOnStop = true;
  system.targetStopDuration = 0.3;

  system.start();
  system.stop();

  return system;
}

export function createPickupGlow(
  position: Vector3,
  scene: Scene,
  color: Color4,
): ParticleSystem {
  const system = new ParticleSystem('pickupGlow', 20, scene);
  system.particleTexture = getParticleTexture(scene);

  system.emitter = position;
  system.emitRate = 8;

  system.minEmitBox = new Vector3(-0.3, -0.3, -0.3);
  system.maxEmitBox = new Vector3(0.3, 0.3, 0.3);

  system.minLifeTime = 0.5;
  system.maxLifeTime = 1.0;

  system.minSize = 0.02;
  system.maxSize = 0.05;

  system.color1 = color;
  system.color2 = color;
  system.colorDead = new Color4(color.r, color.g, color.b, 0);

  system.gravity = new Vector3(0, 0.3, 0);

  system.start();
  return system;
}
