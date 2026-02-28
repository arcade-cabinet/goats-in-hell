/**
 * InputManager — orchestrates multiple input providers into a single InputFrame.
 *
 * Each provider (keyboard, touch, gamepad, XR, AI) produces a partial InputFrame.
 * The manager merges them: movement is summed and clamped, booleans are OR'd,
 * and the first non-null aim override wins (VR controllers take priority).
 */

import type { InputFrame } from './InputActions';
import { emptyInputFrame } from './InputActions';

/** Interface that all input providers implement. */
export interface IInputProvider {
  readonly type: string;
  enabled: boolean;

  /** Poll provider and return partial frame for this tick. */
  poll(dt: number): Partial<InputFrame>;

  /** Called after the frame is consumed — reset accumulators (e.g. mouse deltas). */
  postFrame(): void;

  /** Returns true if the provider is available on this platform. */
  isAvailable(): boolean;

  /** Clean up event listeners / subscriptions. */
  dispose(): void;
}

export class InputManager {
  private providers: IInputProvider[] = [];

  register(provider: IInputProvider): void {
    if (!provider.isAvailable()) return;
    this.providers.push(provider);
  }

  unregister(provider: IInputProvider): void {
    const idx = this.providers.indexOf(provider);
    if (idx >= 0) this.providers.splice(idx, 1);
  }

  /** Merge all providers into a single InputFrame. */
  poll(dt: number): InputFrame {
    const frame = emptyInputFrame();

    for (const p of this.providers) {
      if (!p.enabled) continue;
      const partial = p.poll(dt);

      // Movement: sum (clamped after)
      frame.moveX += partial.moveX ?? 0;
      frame.moveZ += partial.moveZ ?? 0;

      // Look: sum deltas
      frame.lookDeltaX += partial.lookDeltaX ?? 0;
      frame.lookDeltaY += partial.lookDeltaY ?? 0;

      // Booleans: OR
      if (partial.fire) frame.fire = true;
      if (partial.reload) frame.reload = true;
      if (partial.jump) frame.jump = true;
      if (partial.sprint) frame.sprint = true;
      if (partial.pause) frame.pause = true;
      if (partial.interact) frame.interact = true;

      // Weapon: first non-zero wins
      if (partial.weaponSlot && !frame.weaponSlot) frame.weaponSlot = partial.weaponSlot;
      if (partial.weaponCycle && !frame.weaponCycle) frame.weaponCycle = partial.weaponCycle;

      // Aim override: first non-null wins (VR controllers registered first)
      if (partial.aimOrigin && !frame.aimOrigin) {
        frame.aimOrigin = partial.aimOrigin;
        frame.aimDirection = partial.aimDirection ?? null;
      }
    }

    // Clamp movement to unit circle
    const len = Math.sqrt(frame.moveX * frame.moveX + frame.moveZ * frame.moveZ);
    if (len > 1) {
      frame.moveX /= len;
      frame.moveZ /= len;
    }

    return frame;
  }

  /** Reset all provider accumulators after the frame is consumed. */
  postFrame(): void {
    for (const p of this.providers) {
      if (p.enabled) p.postFrame();
    }
  }

  dispose(): void {
    for (const p of this.providers) p.dispose();
    this.providers = [];
  }
}

/** Singleton instance used across the R3F game. */
export const inputManager = new InputManager();
