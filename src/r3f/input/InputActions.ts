/**
 * Unified input actions and frame — the single interface between
 * all input sources (keyboard, touch, gamepad, XR, AI) and game systems.
 *
 * Game code NEVER reads raw events. It reads InputFrame.
 */

export enum InputAction {
  Fire = 'fire',
  Reload = 'reload',
  WeaponSlot1 = 'weaponSlot1',
  WeaponSlot2 = 'weaponSlot2',
  WeaponSlot3 = 'weaponSlot3',
  WeaponSlot4 = 'weaponSlot4',
  WeaponNext = 'weaponNext',
  WeaponPrev = 'weaponPrev',
  Sprint = 'sprint',
  Jump = 'jump',
  Pause = 'pause',
  Interact = 'interact',
}

/** Per-frame input snapshot consumed by game systems. */
export interface InputFrame {
  // Movement (normalized -1..1)
  moveX: number; // strafe: -1 = left, +1 = right
  moveZ: number; // forward/back: -1 = backward, +1 = forward

  // Look deltas (radians this frame)
  lookDeltaX: number; // yaw
  lookDeltaY: number; // pitch

  // Actions (binary, combined across all providers)
  fire: boolean;
  reload: boolean;
  jump: boolean;
  sprint: boolean;
  pause: boolean;
  interact: boolean;

  // Weapon selection: 0 = no change, 1-4 = specific slot
  weaponSlot: number;
  // Weapon cycle: -1 = prev, 0 = none, +1 = next
  weaponCycle: number;

  // Aim override for VR controllers (null = use camera forward)
  aimOrigin: {x: number; y: number; z: number} | null;
  aimDirection: {x: number; y: number; z: number} | null;
}

/** Returns a zeroed-out InputFrame. */
export function emptyInputFrame(): InputFrame {
  return {
    moveX: 0,
    moveZ: 0,
    lookDeltaX: 0,
    lookDeltaY: 0,
    fire: false,
    reload: false,
    jump: false,
    sprint: false,
    pause: false,
    interact: false,
    weaponSlot: 0,
    weaponCycle: 0,
    aimOrigin: null,
    aimDirection: null,
  };
}
