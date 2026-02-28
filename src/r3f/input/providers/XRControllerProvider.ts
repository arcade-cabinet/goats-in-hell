/**
 * XRControllerProvider — VR controller input mapped to InputFrame.
 *
 * Implements IInputProvider and polls XR controller state each frame
 * via the @react-three/xr store. This is a polling-based provider
 * (not a React component with hooks) so it integrates with the
 * existing InputManager architecture.
 *
 * Controller mapping (standard Quest/Pico/WMR layout):
 *   Left thumbstick      -> moveX / moveZ (0.15 deadzone)
 *   Right thumbstick X   -> snap turn (45 deg, 200ms cooldown)
 *   Right trigger (>0.5) -> fire
 *   Left trigger (>0.5)  -> interact
 *   A button             -> jump
 *   X button             -> reload
 *   Menu/Start button    -> pause
 *
 * CRITICAL: Sets aimOrigin and aimDirection from the right controller
 * pose. This makes projectiles originate from the player's hand in VR
 * rather than from the camera/face.
 *
 * Registers XR controllers with HapticsService for haptic pulse output.
 */

import type { XRStore } from '@react-three/xr';
import { haptics } from '../HapticsService';
import type { InputFrame } from '../InputActions';
import type { IInputProvider } from '../InputManager';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STICK_DEADZONE = 0.15;
const SNAP_TURN_DEGREES = 45;
const SNAP_TURN_RADIANS = (SNAP_TURN_DEGREES * Math.PI) / 180;
const SNAP_TURN_COOLDOWN_MS = 200;

// ---------------------------------------------------------------------------
// XRControllerProvider
// ---------------------------------------------------------------------------

export class XRControllerProvider implements IInputProvider {
  readonly type = 'xr-controller';
  enabled = true;

  private store: XRStore;

  // Snap turn state
  private lastSnapTurnTime = 0;
  private snapTurnConsumed = false; // prevents repeat while stick is held

  // Rising-edge tracking for buttons
  private prevJump = false;
  private prevReload = false;
  private prevPause = false;

  // Track registered haptic controllers to avoid re-registering
  private registeredInputSources = new Set<XRInputSource>();

  constructor(store: XRStore) {
    this.store = store;
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  /** Apply deadzone and rescale so output ramps from 0 at deadzone edge to 1 at full tilt. */
  private applyDeadzone(raw: number): number {
    const sign = Math.sign(raw);
    const abs = Math.abs(raw);
    if (abs < STICK_DEADZONE) return 0;
    return sign * ((abs - STICK_DEADZONE) / (1 - STICK_DEADZONE));
  }

  /**
   * Read gamepad component state from @react-three/xr controller state.
   * The XR store exposes inputSourceStates with typed gamepad state.
   */
  private getControllerGamepad(handedness: 'left' | 'right'): {
    gamepad: Gamepad | null;
    inputSource: XRInputSource | null;
    object: THREE.Object3D | null;
  } {
    const state = this.store.getState();
    const inputStates = state.inputSourceStates;

    for (const inputState of inputStates) {
      if (inputState.type !== 'controller') continue;
      if (inputState.inputSource.handedness !== handedness) continue;

      const gamepad = inputState.inputSource.gamepad ?? null;

      // Register the controller with haptics service if not already done
      if (!this.registeredInputSources.has(inputState.inputSource)) {
        this.registeredInputSources.add(inputState.inputSource);
        if (gamepad) {
          haptics.registerXRController({
            gamepad: gamepad as unknown as {
              hapticActuators?: Array<{
                pulse(intensity: number, duration: number): Promise<void>;
              }>;
            },
          });
        }
      }

      return {
        gamepad,
        inputSource: inputState.inputSource,
        object: inputState.object ?? null,
      };
    }

    return { gamepad: null, inputSource: null, object: null };
  }

  // -------------------------------------------------------------------------
  // IInputProvider implementation
  // -------------------------------------------------------------------------

  poll(_dt: number): Partial<InputFrame> {
    const state = this.store.getState();
    if (!state.session) return {};

    const left = this.getControllerGamepad('left');
    const right = this.getControllerGamepad('right');

    const result: Partial<InputFrame> = {};

    // --- Left controller: movement ---
    if (left.gamepad) {
      const axes = left.gamepad.axes;
      // Standard mapping: axes[2] = thumbstick X, axes[3] = thumbstick Y
      // Some controllers use axes[0]/axes[1] if there are only 2 axes
      const thumbX = axes.length >= 4 ? axes[2] : (axes[0] ?? 0);
      const thumbY = axes.length >= 4 ? axes[3] : (axes[1] ?? 0);

      result.moveX = this.applyDeadzone(thumbX);
      // Negate Y: thumbstick up (negative Y) = move forward (positive moveZ)
      result.moveZ = -this.applyDeadzone(thumbY);

      // Left trigger (button index 0 = trigger, 1 = squeeze)
      const leftTriggerValue = left.gamepad.buttons[0]?.value ?? 0;
      result.interact = leftTriggerValue > 0.5;

      // Sprint: left thumbstick click (button index 3 on standard XR gamepad)
      result.sprint = left.gamepad.buttons[3]?.pressed ?? false;
    }

    // --- Right controller: look (snap turn) + fire ---
    if (right.gamepad) {
      const axes = right.gamepad.axes;
      const thumbX = axes.length >= 4 ? axes[2] : (axes[0] ?? 0);

      // Snap turn with cooldown
      const now = performance.now();
      const deadzonedX = this.applyDeadzone(thumbX);

      if (Math.abs(deadzonedX) > 0.5 && !this.snapTurnConsumed) {
        if (now - this.lastSnapTurnTime > SNAP_TURN_COOLDOWN_MS) {
          // Apply snap turn as a look delta
          result.lookDeltaX = Math.sign(deadzonedX) * SNAP_TURN_RADIANS;
          this.lastSnapTurnTime = now;
          this.snapTurnConsumed = true;
        }
      }

      // Reset snap turn consumed when stick returns to center
      if (Math.abs(deadzonedX) < 0.3) {
        this.snapTurnConsumed = false;
      }

      // Right trigger -> fire (button index 0 = trigger)
      const rightTriggerValue = right.gamepad.buttons[0]?.value ?? 0;
      result.fire = rightTriggerValue > 0.5;

      // A button -> jump (button index 4 on standard XR gamepad)
      const jumpPressed = right.gamepad.buttons[4]?.pressed ?? false;
      if (jumpPressed && !this.prevJump) {
        result.jump = true;
      }
      this.prevJump = jumpPressed;

      // B button -> weapon cycle (button index 5 on standard XR gamepad)
      // Not mapped currently - could be used for weapon switching
    }

    // --- X button -> reload (left controller, button index 4) ---
    if (left.gamepad) {
      const reloadPressed = left.gamepad.buttons[4]?.pressed ?? false;
      if (reloadPressed && !this.prevReload) {
        result.reload = true;
      }
      this.prevReload = reloadPressed;

      // Y button -> pause (left controller, button index 5)
      const pausePressed = left.gamepad.buttons[5]?.pressed ?? false;
      if (pausePressed && !this.prevPause) {
        result.pause = true;
      }
      this.prevPause = pausePressed;
    }

    // --- CRITICAL: Aim origin and direction from right controller ---
    // This makes VR shooting work by projecting from the hand controller
    // rather than from the camera/face.
    if (right.object) {
      // Get world position of the right controller
      const worldPos = right.object.getWorldPosition(_tempVec3A);
      result.aimOrigin = { x: worldPos.x, y: worldPos.y, z: worldPos.z };

      // Get forward direction of the right controller (local -Z in Three.js)
      _tempVec3B.set(0, 0, -1);
      _tempVec3B.applyQuaternion(right.object.getWorldQuaternion(_tempQuat));
      result.aimDirection = { x: _tempVec3B.x, y: _tempVec3B.y, z: _tempVec3B.z };
    }

    return result;
  }

  postFrame(): void {
    // Polling-based — rising edge detection handled in poll() via prev* flags.
    // Snap turn cooldown handled via timestamp.
  }

  isAvailable(): boolean {
    // Available when an XR session is active
    const state = this.store.getState();
    return state.session != null;
  }

  dispose(): void {
    // Unregister all tracked XR controllers from haptics
    // Note: We stored XRInputSource references but haptics takes a controller-like object.
    // Clear our tracking set.
    this.registeredInputSources.clear();
  }
}

// ---------------------------------------------------------------------------
// Temp objects to avoid per-frame allocations
// ---------------------------------------------------------------------------

// We use THREE types from the global scope since @react-three/xr already
// depends on three. Import lazily to avoid issues in non-3D contexts.
import * as THREE from 'three';

const _tempVec3A = new THREE.Vector3();
const _tempVec3B = new THREE.Vector3();
const _tempQuat = new THREE.Quaternion();
