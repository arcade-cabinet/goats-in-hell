import {
  Camera,
  Color4,
  DefaultRenderingPipeline,
  FreeCamera,
  GlowLayer,
  Scene,
} from '@babylonjs/core';
import {GameState} from '../../state/GameState';
import {useGameStore} from '../../state/GameStore';

let pipeline: DefaultRenderingPipeline | null = null;
let glowLayer: GlowLayer | null = null;

// Baseline values
const BASE_BLOOM_WEIGHT = 0.4;
const BASE_VIGNETTE_WEIGHT = 2.5;
const BASE_VIGNETTE_COLOR = new Color4(0.2, 0, 0, 1);
const BASE_CONTRAST = 1.3;
const BASE_EXPOSURE = 0.9;
const BASE_FOV = 0.8; // ~45.8 degrees, typical Babylon.js FPS default

// Screen shake state (rotation-based, never touches camera.position)
let shakeRotX = 0;
let shakeRotY = 0;

// Gun flash FOV kick state
let fovKick = 0;

// Store the camera's base FOV on first use
let baseFov: number | null = null;

export function setupPostProcessing(scene: Scene, camera: Camera): void {
  pipeline = new DefaultRenderingPipeline(
    'defaultPipeline',
    true,
    scene,
    [camera],
  );

  // Bloom
  pipeline.bloomEnabled = true;
  pipeline.bloomWeight = BASE_BLOOM_WEIGHT;
  pipeline.bloomKernel = 64;
  pipeline.bloomThreshold = 0.6;

  // Anti-aliasing
  pipeline.fxaaEnabled = true;

  // Image processing
  pipeline.imageProcessingEnabled = true;
  if (pipeline.imageProcessing) {
    pipeline.imageProcessing.vignetteEnabled = true;
    pipeline.imageProcessing.vignetteWeight = BASE_VIGNETTE_WEIGHT;
    pipeline.imageProcessing.vignetteColor = BASE_VIGNETTE_COLOR.clone();
    pipeline.imageProcessing.contrast = BASE_CONTRAST;
    pipeline.imageProcessing.exposure = BASE_EXPOSURE;
  }

  // Glow layer
  glowLayer = new GlowLayer('glowLayer', scene);
  glowLayer.intensity = 0.8;

  // Capture base FOV
  const freeCam = camera as FreeCamera;
  if (freeCam.fov !== undefined) {
    baseFov = freeCam.fov;
  }
}

export function updateScreenEffects(scene: Scene, deltaMs: number): void {
  if (!pipeline) {
    throw new Error(
      'PostProcessing pipeline not initialized. ' +
      'Call setupPostProcessing() before updateScreenEffects().'
    );
  }

  const state = GameState.get();
  const camera = scene.activeCamera;

  // -----------------------------------------------------------------------
  // Screen shake (rotation-based -- never modifies camera.position)
  // -----------------------------------------------------------------------
  if (state.screenShake > 0 && camera) {
    const intensity = state.screenShake;

    // Remove previous frame's shake offset
    (camera as FreeCamera).rotation.x -= shakeRotX;
    (camera as FreeCamera).rotation.y -= shakeRotY;

    // Apply new random rotation offset (small angles in radians)
    shakeRotX = (useGameStore.getState().rng() - 0.5) * intensity * 0.004;
    shakeRotY = (useGameStore.getState().rng() - 0.5) * intensity * 0.004;

    (camera as FreeCamera).rotation.x += shakeRotX;
    (camera as FreeCamera).rotation.y += shakeRotY;

    // Decay screen shake
    const newShake = Math.max(0, state.screenShake - deltaMs * 0.05);
    GameState.set({screenShake: newShake});

    // Clean up rotation offset when shake ends
    if (newShake <= 0) {
      (camera as FreeCamera).rotation.x -= shakeRotX;
      (camera as FreeCamera).rotation.y -= shakeRotY;
      shakeRotX = 0;
      shakeRotY = 0;
    }
  } else if ((shakeRotX !== 0 || shakeRotY !== 0) && camera) {
    // Shake just ended or was cleared externally -- remove residual offset
    (camera as FreeCamera).rotation.x -= shakeRotX;
    (camera as FreeCamera).rotation.y -= shakeRotY;
    shakeRotX = 0;
    shakeRotY = 0;
  }

  // -----------------------------------------------------------------------
  // Damage flash (normalized 0-1 range)
  //   - Aggressive red vignette overlay ("blood screen")
  //   - Chromatic aberration via per-channel vignette color shift
  // -----------------------------------------------------------------------
  if (state.damageFlash > 0 && pipeline.imageProcessing) {
    const t = state.damageFlash; // 0..1

    // Vignette: ramp weight aggressively for blood-screen overlay feel
    // At t=1 the vignette is extremely heavy (almost full-screen red).
    pipeline.imageProcessing.vignetteWeight =
      BASE_VIGNETTE_WEIGHT + t * 12;

    // Chromatic aberration: shift green/blue channels slightly toward red
    // so the vignette fringe shows color separation.
    const red = Math.min(1, 0.5 + t * 0.5); // 0.5 -> 1.0
    const green = t * 0.08; // slight green bleed for aberration
    const blue = t * 0.04; // tiny blue for fringe
    pipeline.imageProcessing.vignetteColor = new Color4(
      red,
      green,
      blue,
      1,
    );

    // Slight contrast boost during flash
    pipeline.imageProcessing.contrast = BASE_CONTRAST + t * 0.3;

    // Decay: 0-1 range, ~250ms full fade at 0.004/ms
    const newFlash = Math.max(0, t - deltaMs * 0.004);
    GameState.set({damageFlash: newFlash});

    if (newFlash <= 0) {
      // Reset to baseline
      pipeline.imageProcessing.vignetteWeight = BASE_VIGNETTE_WEIGHT;
      pipeline.imageProcessing.vignetteColor = BASE_VIGNETTE_COLOR.clone();
      pipeline.imageProcessing.contrast = BASE_CONTRAST;
    }
  }

  // -----------------------------------------------------------------------
  // Gun flash -- punchy bloom spike + exposure kick + FOV kick
  // -----------------------------------------------------------------------
  if (state.gunFlash > 0) {
    const flash = state.gunFlash;
    const t = Math.min(flash / 6, 1); // normalized 0..1

    // Bloom spike: up to 2x baseline
    pipeline.bloomWeight = BASE_BLOOM_WEIGHT + t * 0.8;

    // Brief exposure bump for a "white flash" punch
    if (pipeline.imageProcessing) {
      pipeline.imageProcessing.exposure = BASE_EXPOSURE + t * 0.35;
    }

    // FOV kick: widen slightly (additive radians)
    const freeCam = camera as FreeCamera | null;
    if (freeCam && baseFov !== null && freeCam.fov !== undefined) {
      fovKick = t * 0.06; // ~3.4 degrees at peak
      freeCam.fov = baseFov + fovKick;
    }

    GameState.set({gunFlash: Math.max(0, flash - 1)});
  }

  // Decay hit marker
  if (state.hitMarker > 0) {
    GameState.set({hitMarker: Math.max(0, state.hitMarker - 1)});
  }

  if (state.gunFlash <= 0) {
    // Return to baseline
    pipeline.bloomWeight = BASE_BLOOM_WEIGHT;

    if (pipeline.imageProcessing) {
      // Only reset exposure if damage flash isn't also controlling it
      if (state.damageFlash <= 0) {
        pipeline.imageProcessing.exposure = BASE_EXPOSURE;
      }
    }

    // Smoothly return FOV
    const freeCam = camera as FreeCamera | null;
    if (freeCam && baseFov !== null && freeCam.fov !== undefined && fovKick > 0) {
      fovKick *= 0.85; // ease back
      if (fovKick < 0.001) {
        fovKick = 0;
      }
      freeCam.fov = baseFov + fovKick;
    }
  }
}

export function disposePostProcessing(): void {
  if (pipeline) {
    pipeline.dispose();
    pipeline = null;
  }
  if (glowLayer) {
    glowLayer.dispose();
    glowLayer = null;
  }
  shakeRotX = 0;
  shakeRotY = 0;
  fovKick = 0;
  baseFov = null;
}
