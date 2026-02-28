/**
 * R3F Post-Processing Effects
 *
 * Provides bloom, vignette, chromatic aberration, and noise effects
 * using @react-three/postprocessing. Exposes module-level trigger
 * functions for damage flash, sprint effects, and floor transitions.
 */

import { useFrame } from '@react-three/fiber';
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Noise,
  Vignette,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import type React from 'react';
import { useMemo, useRef } from 'react';
import { Vector2 } from 'three';

// ---------------------------------------------------------------------------
// Module-level effect state (avoids Zustand overhead for per-frame effects)
// ---------------------------------------------------------------------------

/** Damage flash: 1 = full intensity, decays to 0 over ~200ms */
let damageFlashIntensity = 0;
const DAMAGE_FLASH_DECAY = 0.005; // per ms

/** Sprint state */
let sprintActiveState = false;
let sprintBlend = 0; // 0..1 interpolated
const SPRINT_LERP_UP = 0.06;
const SPRINT_LERP_DOWN = 0.04;

/** Floor fade-in: 1 = fully black, decays to 0 */
let floorFadeIntensity = 0;
const FLOOR_FADE_DECAY = 0.002; // per ms, ~500ms full fade

// ---------------------------------------------------------------------------
// Public trigger API
// ---------------------------------------------------------------------------

/** Trigger a red vignette + chromatic aberration flash for damage feedback. */
export function triggerDamageFlash(): void {
  damageFlashIntensity = 1;
}

/** Toggle sprint post-processing effects (bloom boost + slight aberration). */
export function setSprinting(active: boolean): void {
  sprintActiveState = active;
}

/** Trigger a fade-from-black when entering a new floor. */
export function triggerFloorFadeIn(): void {
  floorFadeIntensity = 1;
}

// ---------------------------------------------------------------------------
// Internal state snapshot read by component each frame
// ---------------------------------------------------------------------------

interface EffectState {
  bloomIntensity: number;
  vignetteOffset: number;
  vignetteDarkness: number;
  chromaticOffset: Vector2;
  noiseOpacity: number;
}

function computeEffectState(deltaMs: number): EffectState {
  // Decay damage flash
  if (damageFlashIntensity > 0) {
    damageFlashIntensity = Math.max(0, damageFlashIntensity - deltaMs * DAMAGE_FLASH_DECAY);
  }

  // Interpolate sprint blend
  const sprintTarget = sprintActiveState ? 1 : 0;
  if (sprintBlend < sprintTarget) {
    sprintBlend = Math.min(sprintTarget, sprintBlend + SPRINT_LERP_UP);
  } else if (sprintBlend > sprintTarget) {
    sprintBlend = Math.max(sprintTarget, sprintBlend - SPRINT_LERP_DOWN);
  }

  // Decay floor fade
  if (floorFadeIntensity > 0) {
    floorFadeIntensity = Math.max(0, floorFadeIntensity - deltaMs * FLOOR_FADE_DECAY);
  }

  // Compute derived values
  const d = damageFlashIntensity;
  const s = sprintBlend;

  // Bloom: base 0.8, boost during sprint (+0.4) or damage (+0.3)
  const bloomIntensity = 0.8 + s * 0.4 + d * 0.3;

  // Vignette: base offset 0.3, darkness 0.7; damage pushes darkness hard
  const vignetteOffset = 0.3 - d * 0.15; // tighter vignette on damage
  const vignetteDarkness = 0.7 + d * 0.8 + floorFadeIntensity * 0.9;

  // Chromatic aberration: [0,0] normally, [0.003, 0.003] on damage,
  // slight during sprint [0.001, 0.001]
  const chromaX = d * 0.003 + s * 0.001;
  const chromaY = d * 0.003 + s * 0.001;

  // Noise: subtle 0.04 base
  const noiseOpacity = 0.04 + d * 0.06;

  return {
    bloomIntensity,
    vignetteOffset: Math.max(0.05, vignetteOffset),
    vignetteDarkness: Math.min(1.5, vignetteDarkness),
    chromaticOffset: new Vector2(chromaX, chromaY),
    noiseOpacity,
  };
}

// ---------------------------------------------------------------------------
// React component
// ---------------------------------------------------------------------------

export function PostProcessingEffects(): React.JSX.Element {
  const bloomRef = useRef<any>(null);
  const vignetteRef = useRef<any>(null);
  const chromaticRef = useRef<any>(null);
  const noiseRef = useRef<any>(null);

  // Stable offset vector reused every frame to avoid GC
  const offsetVec = useMemo(() => new Vector2(0, 0), []);

  useFrame((_state, delta) => {
    const deltaMs = delta * 1000;
    const fx = computeEffectState(deltaMs);

    // Update Bloom
    if (bloomRef.current) {
      bloomRef.current.intensity = fx.bloomIntensity;
    }

    // Update Vignette
    if (vignetteRef.current) {
      vignetteRef.current.offset = fx.vignetteOffset;
      vignetteRef.current.darkness = fx.vignetteDarkness;
    }

    // Update ChromaticAberration
    if (chromaticRef.current) {
      offsetVec.set(fx.chromaticOffset.x, fx.chromaticOffset.y);
      chromaticRef.current.offset = offsetVec;
    }

    // Update Noise
    if (noiseRef.current) {
      // The postprocessing Noise effect uses blendFunction opacity
      // We control it via the blend mode's opacity uniform
      if (noiseRef.current.blendMode) {
        noiseRef.current.blendMode.opacity.value = fx.noiseOpacity;
      }
    }
  });

  return (
    <EffectComposer>
      <Bloom
        ref={bloomRef}
        luminanceThreshold={0.6}
        luminanceSmoothing={0.3}
        intensity={0.8}
        mipmapBlur
      />
      <Vignette
        ref={vignetteRef}
        offset={0.3}
        darkness={0.7}
        blendFunction={BlendFunction.NORMAL}
      />
      <ChromaticAberration
        ref={chromaticRef}
        offset={new Vector2(0, 0)}
        radialModulation={false}
        modulationOffset={0}
      />
      <Noise ref={noiseRef} opacity={0.04} blendFunction={BlendFunction.OVERLAY} />
    </EffectComposer>
  );
}
