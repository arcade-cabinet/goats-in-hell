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

/** Color presets for different enemy gore types. */
const BLOOD_COLORS: Record<string, [Color4, Color4]> = {
  default: [new Color4(0.6, 0.0, 0.0, 1), new Color4(0.3, 0.0, 0.0, 1)],
  fire: [new Color4(1.0, 0.3, 0.0, 1), new Color4(0.7, 0.1, 0.0, 1)],
  void: [new Color4(0.4, 0.0, 0.8, 1), new Color4(0.2, 0.0, 0.5, 1)],
  shadow: [new Color4(0.3, 0.0, 0.6, 1), new Color4(0.1, 0.0, 0.3, 1)],
  iron: [new Color4(0.3, 0.4, 0.5, 1), new Color4(0.1, 0.2, 0.3, 1)],
  boss: [new Color4(0.8, 0.0, 1.0, 1), new Color4(0.5, 0.0, 0.7, 1)],
};

/** Map enemy type strings to gore color keys. */
function getGoreColor(enemyType?: string): [Color4, Color4] {
  if (!enemyType) return BLOOD_COLORS.default;
  if (enemyType.includes('fire') || enemyType.includes('inferno')) return BLOOD_COLORS.fire;
  if (enemyType.includes('void')) return BLOOD_COLORS.void;
  if (enemyType.includes('shadow')) return BLOOD_COLORS.shadow;
  if (enemyType.includes('iron') || enemyType.includes('Knight')) return BLOOD_COLORS.iron;
  if (enemyType.includes('arch')) return BLOOD_COLORS.boss;
  return BLOOD_COLORS.default;
}

/**
 * Blood spray + giblet burst on enemy death.
 * Significantly more violent than before — this is an 18+ game.
 */
export function createDeathBurst(
  position: Vector3,
  scene: Scene,
  isBoss: boolean,
  enemyType?: string,
): ParticleSystem {
  const [color1, color2] = isBoss ? BLOOD_COLORS.boss : getGoreColor(enemyType);

  // Main blood spray
  const capacity = isBoss ? 150 : 60;
  const system = new ParticleSystem('deathBurst', capacity, scene);
  system.particleTexture = getParticleTexture(scene);

  system.emitter = position;
  system.manualEmitCount = capacity;

  system.minLifeTime = 0.4;
  system.maxLifeTime = 1.5;

  system.direction1 = new Vector3(-2, -0.5, -2);
  system.direction2 = new Vector3(2, 3, 2);

  system.minEmitPower = isBoss ? 5 : 3;
  system.maxEmitPower = isBoss ? 12 : 8;

  system.minSize = 0.04;
  system.maxSize = isBoss ? 0.25 : 0.15;

  system.color1 = color1;
  system.color2 = color2;
  system.colorDead = new Color4(0.15, 0, 0, 0);

  system.gravity = new Vector3(0, -6, 0);

  system.disposeOnStop = true;
  system.targetStopDuration = 2;

  system.start();
  system.stop();

  // Secondary system: blood droplets that fall and linger
  const drips = new ParticleSystem('bloodDrips', isBoss ? 40 : 15, scene);
  drips.particleTexture = getParticleTexture(scene);
  drips.emitter = position;
  drips.manualEmitCount = isBoss ? 40 : 15;

  drips.minLifeTime = 1.0;
  drips.maxLifeTime = 3.0;

  drips.direction1 = new Vector3(-1, 2, -1);
  drips.direction2 = new Vector3(1, 5, 1);

  drips.minEmitPower = 1;
  drips.maxEmitPower = 3;

  drips.minSize = 0.06;
  drips.maxSize = 0.12;

  drips.color1 = new Color4(color1.r * 0.7, color1.g * 0.7, color1.b * 0.7, 0.9);
  drips.color2 = new Color4(color2.r * 0.7, color2.g * 0.7, color2.b * 0.7, 0.9);
  drips.colorDead = new Color4(0.1, 0, 0, 0);

  drips.gravity = new Vector3(0, -9.8, 0);

  drips.disposeOnStop = true;
  drips.targetStopDuration = 3.5;

  drips.start();
  drips.stop();

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

/** Fiery barrel explosion — big orange/red burst. */
export function createExplosionBurst(
  position: Vector3,
  scene: Scene,
): ParticleSystem {
  const system = new ParticleSystem('explosion', 80, scene);
  system.particleTexture = getParticleTexture(scene);
  system.emitter = position;
  system.manualEmitCount = 80;

  system.minLifeTime = 0.3;
  system.maxLifeTime = 1.2;

  system.direction1 = new Vector3(-3, -1, -3);
  system.direction2 = new Vector3(3, 5, 3);

  system.minEmitPower = 4;
  system.maxEmitPower = 10;

  system.minSize = 0.1;
  system.maxSize = 0.35;

  system.color1 = new Color4(1.0, 0.6, 0.1, 1);
  system.color2 = new Color4(1.0, 0.3, 0.0, 1);
  system.colorDead = new Color4(0.2, 0.05, 0.0, 0);

  system.gravity = new Vector3(0, -4, 0);

  system.disposeOnStop = true;
  system.targetStopDuration = 1.5;

  system.start();
  system.stop();

  return system;
}

/** Pickup collection sparkle burst — color matches pickup type. */
export function createPickupBurst(
  position: Vector3,
  scene: Scene,
  pickupType: string,
): ParticleSystem {
  // Color by pickup type
  let c1: Color4;
  let c2: Color4;
  if (pickupType === 'health') {
    c1 = new Color4(0.2, 1.0, 0.3, 1);
    c2 = new Color4(0.0, 0.8, 0.1, 1);
  } else if (pickupType === 'weapon') {
    c1 = new Color4(1.0, 0.3, 1.0, 1);
    c2 = new Color4(0.8, 0.1, 0.8, 1);
  } else {
    // ammo or default
    c1 = new Color4(1.0, 0.7, 0.2, 1);
    c2 = new Color4(0.9, 0.5, 0.0, 1);
  }

  const system = new ParticleSystem('pickupBurst', 12, scene);
  system.particleTexture = getParticleTexture(scene);
  system.emitter = position;
  system.manualEmitCount = 12;

  system.minLifeTime = 0.2;
  system.maxLifeTime = 0.6;

  system.direction1 = new Vector3(-1.5, 1, -1.5);
  system.direction2 = new Vector3(1.5, 3, 1.5);

  system.minEmitPower = 2;
  system.maxEmitPower = 5;

  system.minSize = 0.04;
  system.maxSize = 0.12;

  system.color1 = c1;
  system.color2 = c2;
  system.colorDead = new Color4(c1.r * 0.3, c1.g * 0.3, c1.b * 0.3, 0);

  system.gravity = new Vector3(0, -2, 0);

  system.disposeOnStop = true;
  system.targetStopDuration = 0.8;

  system.start();
  system.stop();

  return system;
}

/** Hitscan impact sparks — bright yellow/orange sparks flying off the hit surface. */
export function createImpactSparks(
  hitPoint: Vector3,
  hitNormal: Vector3,
  scene: Scene,
): ParticleSystem {
  const system = new ParticleSystem('impactSparks', 8, scene);
  system.particleTexture = getParticleTexture(scene);
  system.emitter = hitPoint;
  system.manualEmitCount = 8;

  system.minLifeTime = 0.1;
  system.maxLifeTime = 0.35;

  // Sparks fly outward along hit normal with spread
  const spread = 1.5;
  system.direction1 = new Vector3(
    hitNormal.x * 2 - spread,
    hitNormal.y * 2,
    hitNormal.z * 2 - spread,
  );
  system.direction2 = new Vector3(
    hitNormal.x * 2 + spread,
    hitNormal.y * 2 + 2,
    hitNormal.z * 2 + spread,
  );

  system.minEmitPower = 3;
  system.maxEmitPower = 8;

  system.minSize = 0.02;
  system.maxSize = 0.06;

  system.color1 = new Color4(1.0, 0.9, 0.4, 1);
  system.color2 = new Color4(1.0, 0.5, 0.1, 1);
  system.colorDead = new Color4(0.3, 0.1, 0.0, 0);

  system.gravity = new Vector3(0, -6, 0);

  system.disposeOnStop = true;
  system.targetStopDuration = 0.5;

  system.start();
  system.stop();

  return system;
}

/** Projectile trail emitter — continuous glow trail behind a moving projectile. */
export function createProjectileTrail(
  scene: Scene,
  color: Color4,
): ParticleSystem {
  const system = new ParticleSystem('projTrail', 30, scene);
  system.particleTexture = getParticleTexture(scene);

  system.minLifeTime = 0.1;
  system.maxLifeTime = 0.3;

  system.emitRate = 40;

  // Tight emission cone (trail stays narrow)
  system.direction1 = new Vector3(-0.1, -0.1, -0.1);
  system.direction2 = new Vector3(0.1, 0.1, 0.1);

  system.minEmitPower = 0;
  system.maxEmitPower = 0.2;

  system.minSize = 0.05;
  system.maxSize = 0.15;

  system.color1 = color;
  system.color2 = new Color4(color.r * 0.8, color.g * 0.8, color.b * 0.8, 0.8);
  system.colorDead = new Color4(color.r * 0.2, color.g * 0.2, color.b * 0.2, 0);

  system.gravity = new Vector3(0, 0, 0);

  system.disposeOnStop = true;
  system.targetStopDuration = 0.5;

  return system;
}
