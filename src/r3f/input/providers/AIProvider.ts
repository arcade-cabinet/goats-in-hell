/**
 * AIProvider — wraps the AIGovernor as an IInputProvider for the R3F
 * InputManager. Converts AIOutputFrame (Babylon.js left-handed coords)
 * into InputFrame (Three.js right-handed coords).
 *
 * Coordinate conversion: Babylon.js uses Z+ = forward (left-handed),
 * Three.js uses Z- = forward (right-handed). We negate Z-related values
 * when converting AIOutputFrame -> InputFrame.
 *
 * Look handling:
 *   The AIGovernor emits absolute target yaw/pitch angles. We track the
 *   "current" yaw/pitch and compute per-frame deltas so the InputManager
 *   receives lookDeltaX / lookDeltaY in radians-per-frame, consistent
 *   with keyboard/mouse and gamepad providers.
 */

import type { AIGovernor, AIOutputFrame } from '../../../game/systems/AIGovernor';
import type { InputFrame } from '../InputActions';
import type { IInputProvider } from '../InputManager';

/** Shortest-path angular difference (result in [-PI, PI]). */
function angleDelta(from: number, to: number): number {
  let diff = to - from;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}

export class AIProvider implements IInputProvider {
  readonly type = 'ai';
  enabled = true;

  private governor: AIGovernor;
  private lastFrame: AIOutputFrame | null = null;

  /**
   * Tracked current orientation used to compute look deltas.
   * Starts at 0 and converges on the governor's target angles.
   */
  private currentYaw = 0;
  private currentPitch = 0;

  /** Smoothing factor for aim interpolation (0-1, higher = snappier). */
  private readonly aimLerp = 0.15;

  constructor(governor: AIGovernor) {
    this.governor = governor;
    this.governor.setOutputCallback((frame) => {
      this.lastFrame = frame;
    });
  }

  // -------------------------------------------------------------------------
  // IInputProvider implementation
  // -------------------------------------------------------------------------

  poll(dt: number): Partial<InputFrame> {
    // Tick the AI governor. This will invoke our output callback.
    // R3F passes dt in seconds (~0.016) but the governor expects milliseconds (~16).
    this.governor.update(dt * 1000);

    const frame = this.lastFrame;
    if (!frame) return {};

    // --- Movement ---
    // The governor outputs Babylon world-space moveX/moveZ (because
    // aiCamera.rotation.y is always 0, so the governor's
    // displacementToMoveXZ is an identity transform).
    //
    // Convert to Three.js camera-relative using our tracked camera yaw.
    // Formula: project Babylon world displacement onto Three.js camera axes.
    const y = this.currentYaw;
    const cosY = Math.cos(y);
    const sinY = Math.sin(y);
    const rawMoveX = frame.moveX * cosY + frame.moveZ * sinY;
    const rawMoveZ = -frame.moveX * sinY + frame.moveZ * cosY;

    // Normalize to unit length — the governor outputs tiny displacements
    // but InputFrame moveX/moveZ should be -1..1 where 1 = full walk speed.
    const moveLen = Math.sqrt(rawMoveX * rawMoveX + rawMoveZ * rawMoveZ);
    const moveX = moveLen > 0.001 ? rawMoveX / moveLen : 0;
    const moveZ = moveLen > 0.001 ? rawMoveZ / moveLen : 0;

    // --- Look ---
    // The governor outputs absolute target yaw/pitch in Babylon.js convention.
    // Negate yaw for Three.js (Babylon yaw=0 faces +Z, Three.js yaw=0 faces -Z).
    const targetYaw = -frame.lookYaw;
    const targetPitch = frame.lookPitch;

    // Compute smoothed deltas from current to target orientation
    const deltaYaw = angleDelta(this.currentYaw, targetYaw) * this.aimLerp;
    const deltaPitch = angleDelta(this.currentPitch, targetPitch) * this.aimLerp;

    // Advance current orientation (tracks effective Three.js camera yaw)
    this.currentYaw += deltaYaw;
    this.currentPitch += deltaPitch;

    // --- Actions ---
    // PlayerController does `yawRef -= lookDeltaX`, so we negate our deltas
    // so that positive deltaYaw → positive yawRef change.
    return {
      moveX,
      moveZ,
      lookDeltaX: -deltaYaw,
      lookDeltaY: -deltaPitch,
      fire: frame.fire,
      reload: frame.reload,
      sprint: frame.sprint,
      weaponSlot: frame.weaponSlot,
    };
  }

  postFrame(): void {
    // Reset the last frame so we don't re-use stale data
    this.lastFrame = null;
  }

  isAvailable(): boolean {
    // Always available when autoplay is active (the governor exists)
    return true;
  }

  dispose(): void {
    this.governor.dispose();
    // Clear reference to allow GC
    (this as unknown as { governor: AIGovernor | null }).governor = null;
  }
}
