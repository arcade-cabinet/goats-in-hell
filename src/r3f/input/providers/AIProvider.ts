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

import type {InputFrame} from '../InputActions';
import type {IInputProvider} from '../InputManager';
import type {AIGovernor, AIOutputFrame} from '../../../game/systems/AIGovernor';

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
    this.governor.update(dt);

    const frame = this.lastFrame;
    if (!frame) return {};

    // --- Movement ---
    // Negate moveZ for Three.js coordinate system (Babylon Z+ forward -> Three Z- forward)
    const moveX = frame.moveX;
    const moveZ = -frame.moveZ;

    // --- Look ---
    // The governor outputs absolute target yaw/pitch in Babylon.js convention.
    // Negate yaw for Three.js (Babylon yaw rotates opposite to Three.js).
    const targetYaw = -frame.lookYaw;
    const targetPitch = frame.lookPitch;

    // Compute smoothed deltas from current to target orientation
    const deltaYaw = angleDelta(this.currentYaw, targetYaw) * this.aimLerp;
    const deltaPitch = angleDelta(this.currentPitch, targetPitch) * this.aimLerp;

    // Advance current orientation
    this.currentYaw += deltaYaw;
    this.currentPitch += deltaPitch;

    // --- Actions ---
    // Weapon slot and other actions pass through directly
    return {
      moveX,
      moveZ,
      lookDeltaX: deltaYaw,
      lookDeltaY: deltaPitch,
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
    (this as unknown as {governor: AIGovernor | null}).governor = null;
  }
}
