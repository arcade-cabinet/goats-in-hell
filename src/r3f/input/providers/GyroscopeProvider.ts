/**
 * GyroscopeProvider — adds gyroscope-based look control on mobile devices.
 *
 * Uses the Web DeviceOrientation API to read device orientation changes and
 * translate them into look deltas. This is additive to touch look — gyro
 * movement layers on top of touch drag.
 *
 * Disabled by default; user must opt-in via settings. On iOS 13+, the user
 * must also grant permission via a user-gesture-triggered prompt.
 */

import type {InputFrame} from '../InputActions';
import type {IInputProvider} from '../InputManager';

/** Maximum accumulated look delta per frame to prevent huge jumps on tab-away. */
const MAX_ACCUMULATED_DELTA = 0.5; // radians (~28 degrees)

/**
 * Request gyroscope permission on iOS 13+.
 * Must be called from a user gesture handler (e.g. button click).
 * Returns true if permission is granted, false otherwise.
 * On Android and older iOS, permission is granted automatically.
 */
export async function requestGyroPermission(): Promise<boolean> {
  if (
    typeof DeviceOrientationEvent !== 'undefined' &&
    typeof (DeviceOrientationEvent as any).requestPermission === 'function'
  ) {
    try {
      const result = await (DeviceOrientationEvent as any).requestPermission();
      return result === 'granted';
    } catch {
      return false;
    }
  }
  // Android / older iOS grants automatically
  return true;
}

export class GyroscopeProvider implements IInputProvider {
  readonly type = 'gyroscope';
  enabled = false; // disabled by default, user opt-in via settings

  private _sensitivity = 1.0;

  // Look delta accumulators (cleared each frame by postFrame)
  private lookDeltaX = 0;
  private lookDeltaY = 0;

  // Previous orientation values for calculating deltas
  private prevAlpha: number | null = null;
  private prevBeta: number | null = null;

  // Bound handler for cleanup
  private onDeviceOrientation: (e: DeviceOrientationEvent) => void;

  constructor() {
    this.onDeviceOrientation = this.handleDeviceOrientation.bind(this);
    window.addEventListener('deviceorientation', this.onDeviceOrientation);
  }

  // ---------------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------------

  get sensitivity(): number {
    return this._sensitivity;
  }

  /** Set gyroscope sensitivity. Clamped to [0.1, 2.0]. */
  setSensitivity(value: number): void {
    this._sensitivity = Math.max(0.1, Math.min(2.0, value));
  }

  // ---------------------------------------------------------------------------
  // Event handler
  // ---------------------------------------------------------------------------

  private handleDeviceOrientation(e: DeviceOrientationEvent): void {
    if (!this.enabled) return;

    // Skip if alpha or beta is null/undefined (sensor not reporting)
    if (e.alpha == null || e.beta == null) return;

    const alpha = e.alpha; // yaw: 0-360
    const beta = e.beta; // pitch: -180 to 180

    // First event: store initial values, don't calculate delta
    if (this.prevAlpha === null || this.prevBeta === null) {
      this.prevAlpha = alpha;
      this.prevBeta = beta;
      return;
    }

    // Calculate raw deltas
    let deltaYaw = alpha - this.prevAlpha;
    const deltaPitch = beta - this.prevBeta;

    // Handle wrap-around for alpha (0-360 range)
    if (deltaYaw > 180) {
      deltaYaw -= 360;
    } else if (deltaYaw < -180) {
      deltaYaw += 360;
    }

    // Apply sensitivity and scale factor, accumulate
    this.lookDeltaX += deltaYaw * this._sensitivity * 0.01;
    this.lookDeltaY += deltaPitch * this._sensitivity * 0.01;

    // Clamp accumulated deltas to prevent huge jumps (e.g. after tab-away)
    this.lookDeltaX = Math.max(
      -MAX_ACCUMULATED_DELTA,
      Math.min(MAX_ACCUMULATED_DELTA, this.lookDeltaX),
    );
    this.lookDeltaY = Math.max(
      -MAX_ACCUMULATED_DELTA,
      Math.min(MAX_ACCUMULATED_DELTA, this.lookDeltaY),
    );

    // Store current values for next delta calculation
    this.prevAlpha = alpha;
    this.prevBeta = beta;
  }

  // ---------------------------------------------------------------------------
  // IInputProvider implementation
  // ---------------------------------------------------------------------------

  poll(_dt: number): Partial<InputFrame> {
    return {
      lookDeltaX: this.lookDeltaX,
      lookDeltaY: this.lookDeltaY,
    };
  }

  postFrame(): void {
    this.lookDeltaX = 0;
    this.lookDeltaY = 0;
  }

  isAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    return 'DeviceOrientationEvent' in window;
  }

  dispose(): void {
    window.removeEventListener('deviceorientation', this.onDeviceOrientation);
    this.prevAlpha = null;
    this.prevBeta = null;
    this.lookDeltaX = 0;
    this.lookDeltaY = 0;
  }
}
