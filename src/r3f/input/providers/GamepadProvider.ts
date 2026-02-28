/**
 * GamepadProvider — translates gamepad input into InputFrame via polling.
 *
 * Standard gamepad mapping:
 * - Left stick  → moveX/moveZ (0.15 deadzone)
 * - Right stick → lookDeltaX/lookDeltaY (0.05 rad/unit sensitivity)
 * - RT (buttons[7]) > 0.5 → fire
 * - LT (buttons[6]) > 0.5 → interact
 * - A  (buttons[0]) → jump (rising edge)
 * - X  (buttons[2]) → reload (rising edge)
 * - LB (buttons[4]) → weaponPrev (rising edge)
 * - RB (buttons[5]) → weaponNext (rising edge)
 * - Start (buttons[9]) → pause (rising edge)
 */

import type {InputFrame} from '../InputActions';
import type {IInputProvider} from '../InputManager';

const STICK_DEADZONE = 0.15;
const LOOK_SENSITIVITY = 0.05; // radians per unit per frame

/** Button indices we track for rising-edge detection. */
const EDGE_BUTTONS = [0, 2, 4, 5, 9] as const;

export class GamepadProvider implements IInputProvider {
  readonly type = 'gamepad';
  enabled = true;

  /** Previous frame button states for rising-edge detection. */
  private prevButtons: boolean[] = [];

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  /** Apply deadzone and rescale so output is 0 at the edge of deadzone and 1 at full tilt. */
  private applyDeadzone(raw: number): number {
    const sign = Math.sign(raw);
    const abs = Math.abs(raw);
    if (abs < STICK_DEADZONE) return 0;
    return sign * (abs - STICK_DEADZONE) / (1 - STICK_DEADZONE);
  }

  /** Return the first connected gamepad, or null. */
  private getGamepad(): Gamepad | null {
    const gamepads = navigator.getGamepads();
    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i]) return gamepads[i];
    }
    return null;
  }

  /** Check if a button transitioned from not-pressed to pressed. */
  private risingEdge(index: number, currentPressed: boolean): boolean {
    const prev = this.prevButtons[index] ?? false;
    return currentPressed && !prev;
  }

  // -------------------------------------------------------------------------
  // IInputProvider implementation
  // -------------------------------------------------------------------------

  poll(_dt: number): Partial<InputFrame> {
    const gp = this.getGamepad();
    if (!gp) return {};

    const axes = gp.axes;
    const buttons = gp.buttons;

    // Left stick → movement
    const moveX = this.applyDeadzone(axes[0] ?? 0);
    const moveZ = -this.applyDeadzone(axes[1] ?? 0); // invert Y: stick up = forward (+Z)

    // Right stick → look
    const lookDeltaX = this.applyDeadzone(axes[2] ?? 0) * LOOK_SENSITIVITY;
    const lookDeltaY = this.applyDeadzone(axes[3] ?? 0) * LOOK_SENSITIVITY;

    // Triggers (analog, threshold at 0.5)
    const fire = (buttons[7]?.value ?? 0) > 0.5;
    const interact = (buttons[6]?.value ?? 0) > 0.5;

    // Rising-edge buttons
    const jumpPressed = buttons[0]?.pressed ?? false;
    const reloadPressed = buttons[2]?.pressed ?? false;
    const lbPressed = buttons[4]?.pressed ?? false;
    const rbPressed = buttons[5]?.pressed ?? false;
    const startPressed = buttons[9]?.pressed ?? false;

    const jump = this.risingEdge(0, jumpPressed);
    const reload = this.risingEdge(2, reloadPressed);
    const weaponPrev = this.risingEdge(4, lbPressed);
    const weaponNext = this.risingEdge(5, rbPressed);
    const pause = this.risingEdge(9, startPressed);

    // Update previous button state for next frame
    const newPrev: boolean[] = [];
    for (const idx of EDGE_BUTTONS) {
      newPrev[idx] = buttons[idx]?.pressed ?? false;
    }
    this.prevButtons = newPrev;

    // Determine weapon cycle
    let weaponCycle = 0;
    if (weaponNext) weaponCycle = 1;
    else if (weaponPrev) weaponCycle = -1;

    // Sprint: left stick click (buttons[10])
    const sprint = buttons[10]?.pressed ?? false;

    return {
      moveX,
      moveZ,
      lookDeltaX,
      lookDeltaY,
      fire,
      reload,
      jump,
      sprint,
      pause,
      interact,
      weaponCycle,
    };
  }

  postFrame(): void {
    // Polling-based — no accumulators to clear.
    // Rising-edge detection is handled in poll() via prevButtons.
  }

  isAvailable(): boolean {
    return typeof navigator !== 'undefined' && typeof navigator.getGamepads === 'function';
  }

  dispose(): void {
    // Polling-based — no event listeners to remove.
  }
}
