/**
 * KeyboardMouseProvider — translates keyboard and mouse input into InputFrame.
 *
 * WASD/Arrow keys for movement, mouse for look (pointer-locked), click to fire,
 * scroll for weapon cycling, number keys for weapon slots, and modifier keys
 * for sprint/jump/reload/pause.
 */

import type {InputFrame} from '../InputActions';
import type {IInputProvider} from '../InputManager';
import {useGameStore} from '../../../state/GameStore';

export class KeyboardMouseProvider implements IInputProvider {
  readonly type = 'keyboard-mouse';
  enabled = true;

  // Held key state
  private keysDown = new Set<string>();

  // Mouse look accumulators (cleared each frame)
  private lookDeltaX = 0;
  private lookDeltaY = 0;

  // Fire state (hold-to-fire via mousedown/mouseup)
  private fireHeld = false;

  // One-shot flags (consumed once per frame)
  private reloadFlag = false;
  private jumpFlag = false;
  private pauseFlag = false;
  private weaponSlotFlag = 0;
  private weaponCycleFlag = 0;

  // Bound handlers for cleanup
  private onKeyDown: (e: KeyboardEvent) => void;
  private onKeyUp: (e: KeyboardEvent) => void;
  private onMouseMove: (e: MouseEvent) => void;
  private onMouseDown: (e: MouseEvent) => void;
  private onMouseUp: (e: MouseEvent) => void;
  private onWheel: (e: WheelEvent) => void;

  constructor() {
    this.onKeyDown = this.handleKeyDown.bind(this);
    this.onKeyUp = this.handleKeyUp.bind(this);
    this.onMouseMove = this.handleMouseMove.bind(this);
    this.onMouseDown = this.handleMouseDown.bind(this);
    this.onMouseUp = this.handleMouseUp.bind(this);
    this.onWheel = this.handleWheel.bind(this);

    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mousedown', this.onMouseDown);
    document.addEventListener('mouseup', this.onMouseUp);
    document.addEventListener('wheel', this.onWheel, {passive: true});
  }

  // -------------------------------------------------------------------------
  // Event handlers
  // -------------------------------------------------------------------------

  private handleKeyDown(e: KeyboardEvent): void {
    const key = e.key.toLowerCase();
    this.keysDown.add(key);

    // One-shot actions (only trigger on initial press, not repeat)
    if (e.repeat) return;

    switch (key) {
      case 'r':
        this.reloadFlag = true;
        break;
      case ' ':
        this.jumpFlag = true;
        break;
      case 'escape':
        this.pauseFlag = true;
        break;
      case '1':
        this.weaponSlotFlag = 1;
        break;
      case '2':
        this.weaponSlotFlag = 2;
        break;
      case '3':
        this.weaponSlotFlag = 3;
        break;
      case '4':
        this.weaponSlotFlag = 4;
        break;
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    this.keysDown.delete(e.key.toLowerCase());
  }

  private handleMouseMove(e: MouseEvent): void {
    // Only accumulate look deltas when pointer is locked
    if (!document.pointerLockElement) return;

    const sens = useGameStore.getState().mouseSensitivity;
    this.lookDeltaX += e.movementX * sens * 0.002;
    this.lookDeltaY += e.movementY * sens * 0.002;
  }

  private handleMouseDown(e: MouseEvent): void {
    if (e.button === 0) {
      this.fireHeld = true;
    }
  }

  private handleMouseUp(e: MouseEvent): void {
    if (e.button === 0) {
      this.fireHeld = false;
    }
  }

  private handleWheel(e: WheelEvent): void {
    // deltaY > 0 = scroll down = next weapon, < 0 = scroll up = prev weapon
    if (e.deltaY > 0) {
      this.weaponCycleFlag = 1;
    } else if (e.deltaY < 0) {
      this.weaponCycleFlag = -1;
    }
  }

  // -------------------------------------------------------------------------
  // IInputProvider implementation
  // -------------------------------------------------------------------------

  poll(_dt: number): Partial<InputFrame> {
    let moveX = 0;
    let moveZ = 0;

    // WASD / Arrow keys
    if (this.keysDown.has('w') || this.keysDown.has('arrowup')) moveZ += 1;
    if (this.keysDown.has('s') || this.keysDown.has('arrowdown')) moveZ -= 1;
    if (this.keysDown.has('a') || this.keysDown.has('arrowleft')) moveX -= 1;
    if (this.keysDown.has('d') || this.keysDown.has('arrowright')) moveX += 1;

    const sprint = this.keysDown.has('shift');

    return {
      moveX,
      moveZ,
      lookDeltaX: this.lookDeltaX,
      lookDeltaY: this.lookDeltaY,
      fire: this.fireHeld,
      reload: this.reloadFlag,
      jump: this.jumpFlag,
      sprint,
      pause: this.pauseFlag,
      weaponSlot: this.weaponSlotFlag,
      weaponCycle: this.weaponCycleFlag,
    };
  }

  postFrame(): void {
    // Clear look delta accumulators
    this.lookDeltaX = 0;
    this.lookDeltaY = 0;

    // Clear one-shot flags
    this.reloadFlag = false;
    this.jumpFlag = false;
    this.pauseFlag = false;
    this.weaponSlotFlag = 0;
    this.weaponCycleFlag = 0;
  }

  isAvailable(): boolean {
    return !(
      'ontouchstart' in window && navigator.maxTouchPoints > 0
    );
  }

  dispose(): void {
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mousedown', this.onMouseDown);
    document.removeEventListener('mouseup', this.onMouseUp);
    document.removeEventListener('wheel', this.onWheel);
    this.keysDown.clear();
  }
}
