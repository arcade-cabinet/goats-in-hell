/**
 * TouchControls — Babylon.js GUI overlay for mobile web.
 *
 * Creates a virtual joystick (left half) and action buttons (right side)
 * that feed into a shared input state object polled by PlayerController.
 * Auto-hidden on desktop (keyboard/mouse detected).
 */
import {
  AdvancedDynamicTexture,
  Ellipse,
  Rectangle,
  TextBlock,
  Control,
  Button,
} from '@babylonjs/gui';
import type {Scene} from '@babylonjs/core';

// ---------------------------------------------------------------------------
// Shared touch input state — read by PlayerController each frame
// ---------------------------------------------------------------------------

export interface TouchInputState {
  /** Movement vector from joystick: x = strafe, z = forward/back (-1..1). */
  moveX: number;
  moveZ: number;
  /** Look delta from right-side drag (radians per frame). */
  lookDeltaX: number;
  lookDeltaY: number;
  /** True on the frame the fire button is pressed. */
  fire: boolean;
  /** True on the frame the reload button is pressed. */
  reload: boolean;
  /** Weapon slot to switch to (1-4), or 0 if none. */
  weaponSwitch: number;
  /** Pause requested. */
  pause: boolean;
}

/** Global touch input state — reset each frame by the consumer. */
export const touchInput: TouchInputState = {
  moveX: 0,
  moveZ: 0,
  lookDeltaX: 0,
  lookDeltaY: 0,
  fire: false,
  reload: false,
  weaponSwitch: 0,
  pause: false,
};

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// ---------------------------------------------------------------------------
// TouchControls class
// ---------------------------------------------------------------------------

export class TouchControls {
  private gui: AdvancedDynamicTexture;
  private disposed = false;

  // Joystick state
  private joystickOuter!: Ellipse;
  private joystickInner!: Ellipse;
  private joystickActive = false;
  private joystickPointerId: number | null = null;
  private joystickCenterX = 0;
  private joystickCenterY = 0;
  private readonly JOYSTICK_RADIUS = 60;

  // Look state (right half touch)
  private lookPointerId: number | null = null;
  private lookLastX = 0;
  private lookLastY = 0;

  // Fire button held state for auto-fire
  private fireHeld = false;

  constructor(scene: Scene) {
    this.gui = AdvancedDynamicTexture.CreateFullscreenUI('touch-controls', true, scene);

    this.createJoystick();
    this.createFireButton();
    this.createReloadButton();
    this.createWeaponButtons();
    this.createPauseButton();
    this.createLookZone();
  }

  // -------------------------------------------------------------------------
  // Virtual Joystick (left side)
  // -------------------------------------------------------------------------

  private createJoystick(): void {
    // Outer ring
    const outer = new Ellipse('joy-outer');
    outer.width = `${this.JOYSTICK_RADIUS * 2}px`;
    outer.height = `${this.JOYSTICK_RADIUS * 2}px`;
    outer.color = 'rgba(255,255,255,0.3)';
    outer.thickness = 2;
    outer.background = 'rgba(0,0,0,0.15)';
    outer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    outer.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    outer.left = '60px';
    outer.top = '-80px';
    outer.isPointerBlocker = true;
    this.gui.addControl(outer);
    this.joystickOuter = outer;

    // Inner knob
    const inner = new Ellipse('joy-inner');
    inner.width = '50px';
    inner.height = '50px';
    inner.color = 'rgba(255,255,255,0.6)';
    inner.thickness = 0;
    inner.background = 'rgba(255,100,50,0.5)';
    inner.isPointerBlocker = false;
    outer.addControl(inner);
    this.joystickInner = inner;

    // Track initial touch position to compute delta from center
    let touchStartX = 0;
    let touchStartY = 0;

    outer.onPointerDownObservable.add((info) => {
      this.joystickActive = true;
      this.joystickPointerId = (info as any).pointerId ?? 0;
      // Record the initial touch point as the virtual center
      touchStartX = info.x;
      touchStartY = info.y;
    });

    outer.onPointerUpObservable.add(() => {
      this.joystickActive = false;
      this.joystickPointerId = null;
      inner.left = '0px';
      inner.top = '0px';
      touchInput.moveX = 0;
      touchInput.moveZ = 0;
    });

    outer.onPointerMoveObservable.add((coords) => {
      if (!this.joystickActive) return;
      const dx = coords.x - touchStartX;
      const dy = coords.y - touchStartY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = Math.max(1, this.JOYSTICK_RADIUS - 25);
      const clamped = Math.min(dist, maxDist);
      const angle = Math.atan2(dy, dx);

      const clampedX = Math.cos(angle) * clamped;
      const clampedY = Math.sin(angle) * clamped;

      inner.left = `${clampedX}px`;
      inner.top = `${clampedY}px`;

      // Normalize to -1..1
      touchInput.moveX = clampedX / maxDist;
      touchInput.moveZ = -clampedY / maxDist; // negative because forward = -Y in screen coords
    });
  }

  // -------------------------------------------------------------------------
  // Look Zone (right half — invisible touch area for camera look)
  // -------------------------------------------------------------------------

  private createLookZone(): void {
    const zone = new Rectangle('look-zone');
    zone.width = '50%';
    zone.height = '100%';
    zone.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    zone.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    zone.thickness = 0;
    zone.background = 'transparent';
    zone.isPointerBlocker = true;
    // Place behind buttons so buttons still receive taps
    zone.zIndex = -1;
    this.gui.addControl(zone);

    let lookTotalMovement = 0;

    zone.onPointerDownObservable.add((info) => {
      this.lookPointerId = (info as any).pointerId ?? 0;
      this.lookLastX = info.x;
      this.lookLastY = info.y;
      lookTotalMovement = 0;
    });

    zone.onPointerUpObservable.add(() => {
      // Fire only on tap (minimal movement), not on drag/pan
      if (lookTotalMovement < 10) {
        touchInput.fire = true;
      }
      this.lookPointerId = null;
    });

    zone.onPointerMoveObservable.add((coords) => {
      if (this.lookPointerId === null) return;
      const dx = coords.x - this.lookLastX;
      const dy = coords.y - this.lookLastY;
      this.lookLastX = coords.x;
      this.lookLastY = coords.y;
      lookTotalMovement += Math.abs(dx) + Math.abs(dy);

      // Scale to reasonable look speed (radians)
      touchInput.lookDeltaX += dx * 0.004;
      touchInput.lookDeltaY += dy * 0.004;
    });
  }

  // -------------------------------------------------------------------------
  // Fire Button
  // -------------------------------------------------------------------------

  private createFireButton(): void {
    const btn = Button.CreateSimpleButton('fire-btn', 'FIRE');
    btn.width = '90px';
    btn.height = '90px';
    btn.cornerRadius = 45;
    btn.color = 'white';
    btn.background = 'rgba(255,50,20,0.5)';
    btn.thickness = 2;
    btn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    btn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    btn.left = '-30px';
    btn.top = '-100px';
    btn.fontSize = 14;
    btn.fontWeight = 'bold';
    btn.isPointerBlocker = true;
    btn.zIndex = 10;
    this.gui.addControl(btn);

    btn.onPointerDownObservable.add(() => {
      this.fireHeld = true;
      touchInput.fire = true;
    });
    btn.onPointerUpObservable.add(() => {
      this.fireHeld = false;
    });
  }

  // -------------------------------------------------------------------------
  // Reload Button
  // -------------------------------------------------------------------------

  private createReloadButton(): void {
    const btn = Button.CreateSimpleButton('reload-btn', 'R');
    btn.width = '55px';
    btn.height = '55px';
    btn.cornerRadius = 27;
    btn.color = 'white';
    btn.background = 'rgba(50,150,255,0.4)';
    btn.thickness = 2;
    btn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    btn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    btn.left = '-140px';
    btn.top = '-110px';
    btn.fontSize = 18;
    btn.fontWeight = 'bold';
    btn.isPointerBlocker = true;
    btn.zIndex = 10;
    this.gui.addControl(btn);

    btn.onPointerDownObservable.add(() => {
      touchInput.reload = true;
    });
  }

  // -------------------------------------------------------------------------
  // Weapon Switch Buttons (1-4 along the bottom)
  // -------------------------------------------------------------------------

  private createWeaponButtons(): void {
    const labels = ['1', '2', '3', '4'];
    const colors = ['#ff8800', '#44aaff', '#ff4444', '#aa44ff'];

    for (let i = 0; i < labels.length; i++) {
      const btn = Button.CreateSimpleButton(`wep-${i}`, labels[i]);
      btn.width = '44px';
      btn.height = '44px';
      btn.cornerRadius = 8;
      btn.color = 'white';
      btn.background = `${colors[i]}66`;
      btn.thickness = 1;
      btn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
      btn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
      btn.left = `${(i - 1.5) * 52}px`;
      btn.top = '-12px';
      btn.fontSize = 16;
      btn.fontWeight = 'bold';
      btn.isPointerBlocker = true;
      btn.zIndex = 10;
      this.gui.addControl(btn);

      const slot = i + 1;
      btn.onPointerDownObservable.add(() => {
        touchInput.weaponSwitch = slot;
      });
    }
  }

  // -------------------------------------------------------------------------
  // Pause Button (top-right)
  // -------------------------------------------------------------------------

  private createPauseButton(): void {
    const btn = Button.CreateSimpleButton('pause-btn', '||');
    btn.width = '44px';
    btn.height = '44px';
    btn.cornerRadius = 8;
    btn.color = 'white';
    btn.background = 'rgba(100,100,100,0.4)';
    btn.thickness = 1;
    btn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    btn.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    btn.left = '-12px';
    btn.top = '12px';
    btn.fontSize = 16;
    btn.fontWeight = 'bold';
    btn.isPointerBlocker = true;
    btn.zIndex = 10;
    this.gui.addControl(btn);

    btn.onPointerDownObservable.add(() => {
      touchInput.pause = true;
    });
  }

  // -------------------------------------------------------------------------
  // Per-frame update — auto-fire while held
  // -------------------------------------------------------------------------

  update(): void {
    if (this.fireHeld) {
      touchInput.fire = true;
    }
  }

  // -------------------------------------------------------------------------
  // Cleanup
  // -------------------------------------------------------------------------

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.gui.dispose();
  }
}

/**
 * Reset per-frame touch input flags. Call at the END of each frame
 * after consuming the input.
 */
export function resetTouchInput(): void {
  touchInput.lookDeltaX = 0;
  touchInput.lookDeltaY = 0;
  touchInput.fire = false;
  touchInput.reload = false;
  touchInput.weaponSwitch = 0;
  touchInput.pause = false;
}
