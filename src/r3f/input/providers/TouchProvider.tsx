/**
 * TouchProvider — virtual on-screen controls for touch devices.
 *
 * Renders an HTML overlay with:
 * - Left virtual joystick (120px) for movement
 * - Right-half look zone for camera look
 * - Fire, Reload, Jump, Pause buttons
 * - Weapon slot buttons 1-4
 *
 * Exports:
 * - TouchOverlay: React component that renders the touch UI
 * - getTouchProvider(): returns the IInputProvider instance
 */

import React, {useEffect, useRef, useCallback} from 'react';
import type {InputFrame} from '../InputActions';
import type {IInputProvider} from '../InputManager';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const JOYSTICK_SIZE = 120;
const JOYSTICK_DEADZONE = 10; // px
const LOOK_SENSITIVITY = 0.004; // rad per pixel

const BUTTON_STYLES: React.CSSProperties = {
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.45)',
  border: '2px solid rgba(255, 255, 255, 0.6)',
  borderRadius: '50%',
  color: 'white',
  fontSize: 14,
  fontWeight: 'bold',
  userSelect: 'none',
  WebkitUserSelect: 'none',
  touchAction: 'none',
};

// ---------------------------------------------------------------------------
// Touch state — shared between React component and provider
// ---------------------------------------------------------------------------

interface TouchState {
  // Movement joystick
  moveX: number;
  moveZ: number;

  // Look deltas (accumulated between polls)
  lookDeltaX: number;
  lookDeltaY: number;

  // Buttons
  fire: boolean;
  reload: boolean;
  jump: boolean;
  pause: boolean;
  weaponSlot: number;
}

const touchState: TouchState = {
  moveX: 0,
  moveZ: 0,
  lookDeltaX: 0,
  lookDeltaY: 0,
  fire: false,
  reload: false,
  jump: false,
  pause: false,
  weaponSlot: 0,
};

// ---------------------------------------------------------------------------
// Provider implementation
// ---------------------------------------------------------------------------

class TouchProviderImpl implements IInputProvider {
  readonly type = 'touch';
  enabled = true;

  poll(_dt: number): Partial<InputFrame> {
    return {
      moveX: touchState.moveX,
      moveZ: touchState.moveZ,
      lookDeltaX: touchState.lookDeltaX,
      lookDeltaY: touchState.lookDeltaY,
      fire: touchState.fire,
      reload: touchState.reload,
      jump: touchState.jump,
      pause: touchState.pause,
      weaponSlot: touchState.weaponSlot,
    };
  }

  postFrame(): void {
    // Clear accumulators and one-shot flags
    touchState.lookDeltaX = 0;
    touchState.lookDeltaY = 0;
    touchState.reload = false;
    touchState.jump = false;
    touchState.pause = false;
    touchState.weaponSlot = 0;
  }

  isAvailable(): boolean {
    return 'ontouchstart' in window && navigator.maxTouchPoints > 0;
  }

  dispose(): void {
    // State cleanup — React component handles DOM listeners
    touchState.moveX = 0;
    touchState.moveZ = 0;
    touchState.lookDeltaX = 0;
    touchState.lookDeltaY = 0;
    touchState.fire = false;
    touchState.reload = false;
    touchState.jump = false;
    touchState.pause = false;
    touchState.weaponSlot = 0;
  }
}

const providerInstance = new TouchProviderImpl();

/** Get the singleton IInputProvider instance for touch input. */
export function getTouchProvider(): IInputProvider {
  return providerInstance;
}

// ---------------------------------------------------------------------------
// React overlay component
// ---------------------------------------------------------------------------

export const TouchOverlay: React.FC = () => {
  // Joystick tracking
  const joystickTouchId = useRef<number | null>(null);
  const joystickCenter = useRef({x: 0, y: 0});
  const joystickKnobRef = useRef<HTMLDivElement | null>(null);

  // Look zone tracking
  const lookTouchId = useRef<number | null>(null);
  const lookLastPos = useRef({x: 0, y: 0});

  // -----------------------------------------------------------------------
  // Joystick handlers
  // -----------------------------------------------------------------------

  const onJoystickStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (joystickTouchId.current !== null) return;
    const touch = e.changedTouches[0];
    if (!touch) return;
    e.preventDefault();
    joystickTouchId.current = touch.identifier;
    const rect = e.currentTarget.getBoundingClientRect();
    joystickCenter.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    touchState.moveX = 0;
    touchState.moveZ = 0;
    if (joystickKnobRef.current) {
      joystickKnobRef.current.style.transform = 'translate(-50%, -50%)';
    }
  }, []);

  const onJoystickMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (joystickTouchId.current === null) return;
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier !== joystickTouchId.current) continue;

      const dx = touch.clientX - joystickCenter.current.x;
      const dy = touch.clientY - joystickCenter.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxRadius = JOYSTICK_SIZE / 2;

      if (dist < JOYSTICK_DEADZONE) {
        touchState.moveX = 0;
        touchState.moveZ = 0;
        if (joystickKnobRef.current) {
          joystickKnobRef.current.style.transform = 'translate(-50%, -50%)';
        }
      } else {
        const clampedDist = Math.min(dist, maxRadius);
        const normX = (dx / dist) * (clampedDist - JOYSTICK_DEADZONE) / (maxRadius - JOYSTICK_DEADZONE);
        const normY = (dy / dist) * (clampedDist - JOYSTICK_DEADZONE) / (maxRadius - JOYSTICK_DEADZONE);
        touchState.moveX = Math.max(-1, Math.min(1, normX));
        touchState.moveZ = Math.max(-1, Math.min(1, -normY)); // invert Y: up = forward

        // Move knob visual
        if (joystickKnobRef.current) {
          const knobX = (dx / dist) * clampedDist;
          const knobY = (dy / dist) * clampedDist;
          joystickKnobRef.current.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
        }
      }
    }
  }, []);

  const onJoystickEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joystickTouchId.current) {
        joystickTouchId.current = null;
        touchState.moveX = 0;
        touchState.moveZ = 0;
        if (joystickKnobRef.current) {
          joystickKnobRef.current.style.transform = 'translate(-50%, -50%)';
        }
        break;
      }
    }
  }, []);

  // -----------------------------------------------------------------------
  // Look zone handlers
  // -----------------------------------------------------------------------

  const onLookStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (lookTouchId.current !== null) return;
    const touch = e.changedTouches[0];
    if (!touch) return;
    e.preventDefault();
    lookTouchId.current = touch.identifier;
    lookLastPos.current = {x: touch.clientX, y: touch.clientY};
  }, []);

  const onLookMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (lookTouchId.current === null) return;
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier !== lookTouchId.current) continue;

      const dx = touch.clientX - lookLastPos.current.x;
      const dy = touch.clientY - lookLastPos.current.y;
      touchState.lookDeltaX += dx * LOOK_SENSITIVITY;
      touchState.lookDeltaY += dy * LOOK_SENSITIVITY;
      lookLastPos.current = {x: touch.clientX, y: touch.clientY};
    }
  }, []);

  const onLookEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === lookTouchId.current) {
        lookTouchId.current = null;
        break;
      }
    }
  }, []);

  // -----------------------------------------------------------------------
  // Button helpers
  // -----------------------------------------------------------------------

  const onFireStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    touchState.fire = true;
  }, []);

  const onFireEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    touchState.fire = false;
  }, []);

  const onReloadTap = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    touchState.reload = true;
  }, []);

  const onJumpTap = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    touchState.jump = true;
  }, []);

  const onPauseTap = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    touchState.pause = true;
  }, []);

  const onWeaponTap = useCallback((slot: number) => (e: React.TouchEvent) => {
    e.preventDefault();
    touchState.weaponSlot = slot;
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      providerInstance.dispose();
    };
  }, []);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'auto',
        zIndex: 10,
        touchAction: 'none',
      }}
    >
      {/* ---- Left: Virtual Joystick ---- */}
      <div
        onTouchStart={onJoystickStart}
        onTouchMove={onJoystickMove}
        onTouchEnd={onJoystickEnd}
        onTouchCancel={onJoystickEnd}
        style={{
          position: 'absolute',
          left: 30,
          bottom: 30,
          width: JOYSTICK_SIZE,
          height: JOYSTICK_SIZE,
          borderRadius: '50%',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          border: '2px solid rgba(255, 255, 255, 0.4)',
          touchAction: 'none',
        }}
      >
        {/* Joystick knob */}
        <div
          ref={joystickKnobRef}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            border: '2px solid rgba(255, 255, 255, 0.8)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* ---- Right half: Look zone ---- */}
      <div
        onTouchStart={onLookStart}
        onTouchMove={onLookMove}
        onTouchEnd={onLookEnd}
        onTouchCancel={onLookEnd}
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          width: '50%',
          height: '100%',
          touchAction: 'none',
        }}
      />

      {/* ---- Fire button ---- */}
      <div
        onTouchStart={onFireStart}
        onTouchEnd={onFireEnd}
        onTouchCancel={onFireEnd}
        style={{
          ...BUTTON_STYLES,
          right: 20,
          bottom: 100,
          width: 90,
          height: 90,
        }}
      >
        FIRE
      </div>

      {/* ---- Reload button (above fire) ---- */}
      <div
        onTouchStart={onReloadTap}
        style={{
          ...BUTTON_STYLES,
          right: 35,
          bottom: 210,
          width: 60,
          height: 60,
          fontSize: 12,
        }}
      >
        RLD
      </div>

      {/* ---- Jump button (above fire, left side) ---- */}
      <div
        onTouchStart={onJumpTap}
        style={{
          ...BUTTON_STYLES,
          right: 130,
          bottom: 100,
          width: 60,
          height: 60,
          fontSize: 12,
        }}
      >
        JMP
      </div>

      {/* ---- Pause button (top-left) ---- */}
      <div
        onTouchStart={onPauseTap}
        style={{
          ...BUTTON_STYLES,
          left: 10,
          top: 10,
          width: 44,
          height: 44,
          fontSize: 18,
          borderRadius: 8,
        }}
      >
        | |
      </div>

      {/* ---- Weapon slots 1-4 (top-right row) ---- */}
      {[1, 2, 3, 4].map(slot => (
        <div
          key={slot}
          onTouchStart={onWeaponTap(slot)}
          style={{
            ...BUTTON_STYLES,
            right: 10 + (4 - slot) * 52,
            top: 10,
            width: 44,
            height: 44,
            fontSize: 16,
            borderRadius: 8,
          }}
        >
          {slot}
        </div>
      ))}
    </div>
  );
};
