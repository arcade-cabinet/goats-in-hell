/**
 * R3F Post-Processing Effects
 *
 * Provides bloom, vignette, chromatic aberration, and noise effects
 * using @react-three/postprocessing. Exposes module-level trigger
 * functions for damage flash, sprint effects, and floor transitions.
 */

import { useFrame, useThree } from '@react-three/fiber';
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Noise,
  Vignette,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import React, { useMemo, useRef } from 'react';
import { Platform } from 'react-native';
import { Vector2 } from 'three/webgpu';
import { renderingConfig } from '../../config';

// ---------------------------------------------------------------------------
// Error boundary — prevents postprocessing crashes from killing the game
// ---------------------------------------------------------------------------

class EffectErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn('[PostProcessing] Crashed, rendering without effects:', error.message);
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

// ---------------------------------------------------------------------------
// Module-level effect state (avoids Zustand overhead for per-frame effects)
// ---------------------------------------------------------------------------

/** Damage flash: 1 = full intensity, decays to 0 over ~200ms */
let damageFlashIntensity = 0;
const DAMAGE_FLASH_DECAY = renderingConfig.postProcessing.damageFlashDecayPerMs; // per ms

/** Sprint state */
let sprintActiveState = false;
let sprintBlend = 0; // 0..1 interpolated
const SPRINT_LERP_UP = renderingConfig.postProcessing.sprintLerpUp;
const SPRINT_LERP_DOWN = renderingConfig.postProcessing.sprintLerpDown;

/** Floor fade-in: 1 = fully black, decays to 0 */
let floorFadeIntensity = 0;
const FLOOR_FADE_DECAY = renderingConfig.postProcessing.floorFadeDecayPerMs; // per ms, ~500ms full fade

/** Circle 7 (Violence) — Bleeding: subtle pulsing red vignette */
let bleedingActive = false;

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

/** Enable/disable Circle 7 bleeding vignette. */
export function setBleedingVignette(active: boolean): void {
  bleedingActive = active;
}

// ---------------------------------------------------------------------------
// Internal state snapshot read by component each frame
// ---------------------------------------------------------------------------

interface EffectState {
  bloomIntensity: number;
  vignetteOffset: number;
  vignetteDarkness: number;
  chromaX: number;
  chromaY: number;
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
  const pp = renderingConfig.postProcessing;

  // Bloom: base, boost during sprint or damage
  const bloomIntensity = pp.bloomIntensity + s * pp.sprintBloomBoost + d * pp.damageBloomBoost;

  // Circle 7 (Violence) — Bleeding: subtle pulsing red vignette
  const bleedPulse = bleedingActive
    ? pp.bleedingPulseBase +
      Math.sin(Date.now() * pp.bleedingPulseSpeed) * pp.bleedingPulseAmplitude
    : 0;

  // Vignette: base offset and darkness; damage pushes darkness hard
  const vignetteOffset = pp.vignetteOffset - d * 0.15 - bleedPulse * 0.1; // tighter vignette on damage + bleed
  const vignetteDarkness =
    pp.vignetteDarkness +
    d * pp.damageVignetteDarknessBoost +
    floorFadeIntensity * 0.9 +
    bleedPulse;

  // Chromatic aberration: [0,0] normally, max on damage, slight during sprint
  const chromaX = d * pp.damageChromaMax + s * (pp.damageChromaMax / 3);
  const chromaY = d * pp.damageChromaMax + s * (pp.damageChromaMax / 3);

  // Noise: subtle base
  const noiseOpacity = pp.noiseOpacity + d * 0.06;

  return {
    bloomIntensity,
    vignetteOffset: Math.max(0.05, vignetteOffset),
    vignetteDarkness: Math.min(1.5, vignetteDarkness),
    chromaX,
    chromaY,
    noiseOpacity,
  };
}

// ---------------------------------------------------------------------------
// React component
// ---------------------------------------------------------------------------

export function PostProcessingEffects(): React.JSX.Element | null {
  const gl = useThree((s) => s.gl);
  const bloomRef = useRef<any>(null);
  const vignetteRef = useRef<any>(null);
  const chromaticRef = useRef<any>(null);
  const noiseRef = useRef<any>(null);

  // Stable offset vector reused every frame to avoid GC
  const offsetVec = useMemo(() => new Vector2(0, 0), []);

  // EffectComposer (from @react-three/postprocessing) is WebGL-only.
  // When WebGPURenderer is using the true WebGPU backend (not the WebGL2
  // fallback), EffectComposer crashes. Detect the backend and skip effects.
  const isWebGPUBackend = useMemo(() => {
    const backendName = (gl as any).backend?.constructor?.name;
    return backendName === 'WebGPUBackend';
  }, [gl]);

  useFrame((_state, delta) => {
    if (isWebGPUBackend) return;

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
      offsetVec.set(fx.chromaX, fx.chromaY);
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

  // Skip EffectComposer on native — @react-three/postprocessing uses WebGL APIs
  if (Platform.OS !== 'web') return null;

  // Skip EffectComposer entirely on true WebGPU backend — it's WebGL-only
  if (isWebGPUBackend) {
    return null;
  }

  return (
    <EffectErrorBoundary>
      <EffectComposer multisampling={0}>
        <Bloom
          ref={bloomRef}
          intensity={renderingConfig.postProcessing.bloomIntensity}
          luminanceThreshold={renderingConfig.postProcessing.bloomLuminanceThreshold}
          luminanceSmoothing={renderingConfig.postProcessing.bloomLuminanceSmoothing}
          mipmapBlur
        />
        <Vignette
          ref={vignetteRef}
          offset={renderingConfig.postProcessing.vignetteOffset}
          darkness={renderingConfig.postProcessing.vignetteDarkness}
          blendFunction={BlendFunction.NORMAL}
        />
        <ChromaticAberration
          ref={chromaticRef}
          offset={offsetVec}
          radialModulation={false}
          modulationOffset={0}
        />
        <Noise
          ref={noiseRef}
          opacity={renderingConfig.postProcessing.noiseOpacity}
          blendFunction={BlendFunction.OVERLAY}
        />
      </EffectComposer>
    </EffectErrorBoundary>
  );
}
