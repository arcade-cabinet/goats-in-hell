/**
 * ScreenShake — module-level screen shake state.
 *
 * Provides triggerScreenShake() to kick off a shake, and
 * getScreenShakeOffset() to sample per-frame camera offsets.
 * Intensity decays exponentially each frame.
 */

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let shakeIntensity = 0;
const SHAKE_DECAY = 8; // decay rate per second (exponential)
const MAX_OFFSET = 0.15; // max pixel offset in world units

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Trigger a screen shake. Intensity is 0-1.
 * If a shake is already in progress, takes the max of current and new.
 */
export function triggerScreenShake(intensity: number): void {
  if (!Number.isFinite(intensity)) return;
  const clamped = Math.max(0, Math.min(1, intensity));
  shakeIntensity = Math.max(shakeIntensity, clamped);
}

/**
 * Sample the current shake offset and decay intensity.
 * Call once per frame after setting the camera base position.
 *
 * @param dt  Frame delta in seconds.
 * @returns   {x, y} offset to add to camera position.
 */
export function getScreenShakeOffset(dt: number): { x: number; y: number } {
  if (shakeIntensity < 0.001) {
    shakeIntensity = 0;
    return { x: 0, y: 0 };
  }

  const offset = shakeIntensity * MAX_OFFSET;
  const x = (Math.random() * 2 - 1) * offset;
  const y = (Math.random() * 2 - 1) * offset;

  // Exponential decay
  shakeIntensity *= Math.exp(-SHAKE_DECAY * dt);

  return { x, y };
}

/** Reset shake state (e.g. on floor transition). */
export function resetScreenShake(): void {
  shakeIntensity = 0;
}
