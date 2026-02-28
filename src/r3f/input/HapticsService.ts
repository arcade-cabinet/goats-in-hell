/**
 * HapticsService — provides haptic feedback for game events.
 *
 * Web: uses navigator.vibrate() (binary intensity, approximate durations)
 * VR: uses XR controller haptic pulse (precise intensity + duration) — wired later in XR task
 * Native: will use expo-haptics when native support is added
 */

// ---------------------------------------------------------------------------
// Haptic event enum
// ---------------------------------------------------------------------------

export enum HapticEvent {
  WeaponFire = 'weapon_fire',
  DamageTaken = 'damage_taken',
  Kill = 'kill',
  BossDefeat = 'boss_defeat',
  LevelUp = 'level_up',
  Pickup = 'pickup',
  LowHealth = 'low_health',
  Reload = 'reload',
  WeaponSwitch = 'weapon_switch',
  Explosion = 'explosion',
  Jump = 'jump',
  Land = 'land',
}

// ---------------------------------------------------------------------------
// Pattern definition
// ---------------------------------------------------------------------------

interface HapticPattern {
  /** Web vibration pattern: [vibrate, pause, vibrate, ...] in ms */
  webPattern: number[];
  /** XR controller pulse intensity (0-1) */
  xrIntensity: number;
  /** XR controller pulse duration in ms */
  xrDuration: number;
}

// ---------------------------------------------------------------------------
// Pattern table
// ---------------------------------------------------------------------------

const HAPTIC_PATTERNS: Record<HapticEvent, HapticPattern> = {
  [HapticEvent.WeaponFire]: {
    webPattern: [30],
    xrIntensity: 0.4,
    xrDuration: 30,
  },
  [HapticEvent.DamageTaken]: {
    webPattern: [50, 30, 80],
    xrIntensity: 0.8,
    xrDuration: 100,
  },
  [HapticEvent.Kill]: {
    webPattern: [60],
    xrIntensity: 0.6,
    xrDuration: 60,
  },
  [HapticEvent.BossDefeat]: {
    webPattern: [100, 50, 100, 50, 200],
    xrIntensity: 1.0,
    xrDuration: 500,
  },
  [HapticEvent.LevelUp]: {
    webPattern: [30, 20, 50, 20, 80],
    xrIntensity: 0.7,
    xrDuration: 200,
  },
  [HapticEvent.Pickup]: {
    webPattern: [20],
    xrIntensity: 0.2,
    xrDuration: 20,
  },
  [HapticEvent.LowHealth]: {
    webPattern: [40, 60, 40],
    xrIntensity: 0.5,
    xrDuration: 140,
  },
  [HapticEvent.Reload]: {
    webPattern: [25, 15, 25],
    xrIntensity: 0.3,
    xrDuration: 65,
  },
  [HapticEvent.WeaponSwitch]: {
    webPattern: [15],
    xrIntensity: 0.2,
    xrDuration: 15,
  },
  [HapticEvent.Explosion]: {
    webPattern: [150],
    xrIntensity: 1.0,
    xrDuration: 150,
  },
  [HapticEvent.Jump]: {
    webPattern: [15],
    xrIntensity: 0.15,
    xrDuration: 15,
  },
  [HapticEvent.Land]: {
    webPattern: [40],
    xrIntensity: 0.5,
    xrDuration: 40,
  },
};

// ---------------------------------------------------------------------------
// XR gamepad haptic actuator interface (minimal typing for future use)
// ---------------------------------------------------------------------------

interface XRGamepadHapticActuator {
  pulse(intensity: number, duration: number): Promise<void>;
}

interface XRController {
  gamepad?: {
    hapticActuators?: XRGamepadHapticActuator[];
  };
}

// ---------------------------------------------------------------------------
// HapticsService
// ---------------------------------------------------------------------------

export class HapticsService {
  private enabled: boolean;
  private xrControllers: XRController[] = [];

  constructor() {
    // Default to enabled — Task 15 will add a store setting to control this.
    this.enabled = true;
  }

  /**
   * Trigger a haptic event.
   *
   * @param event  The game event to provide feedback for.
   * @param intensity  Optional intensity multiplier (0-1, default 1).
   *                   Scales web vibration durations and XR pulse intensity.
   */
  trigger(event: HapticEvent, intensity: number = 1): void {
    if (!this.enabled) return;

    const pattern = HAPTIC_PATTERNS[event];
    if (!pattern) return;

    const clampedIntensity = Math.max(0, Math.min(1, intensity));

    // --- Web vibration path ---
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      const scaled = pattern.webPattern.map((ms, i) => {
        // Even indices are vibration durations; odd indices are pauses.
        // Scale vibration durations by intensity, leave pauses unchanged.
        if (i % 2 === 0) {
          return Math.round(ms * clampedIntensity);
        }
        return ms;
      });
      navigator.vibrate(scaled);
    }

    // --- XR controller haptic path ---
    for (const controller of this.xrControllers) {
      const actuators = controller.gamepad?.hapticActuators;
      if (actuators && actuators.length > 0) {
        const xrIntensityClamped = Math.min(1, pattern.xrIntensity * clampedIntensity);
        const xrDuration = Math.round(pattern.xrDuration * clampedIntensity);
        for (const actuator of actuators) {
          actuator.pulse(xrIntensityClamped, xrDuration).catch(() => {
            // Silently ignore — controller may have disconnected
          });
        }
      }
    }
  }

  /** Enable or disable haptic feedback globally. */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /** Whether haptic feedback is currently enabled. */
  getEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Register an XR controller for haptic pulse output.
   * Called by the XR integration layer when controllers connect.
   */
  registerXRController(controller: XRController): void {
    if (!this.xrControllers.includes(controller)) {
      this.xrControllers.push(controller);
    }
  }

  /**
   * Unregister an XR controller (e.g. when it disconnects).
   */
  unregisterXRController(controller: XRController): void {
    const idx = this.xrControllers.indexOf(controller);
    if (idx !== -1) {
      this.xrControllers.splice(idx, 1);
    }
  }

  /**
   * Check whether haptic feedback is supported in the current environment.
   * Returns true if the Web Vibration API is available OR if XR controllers
   * with haptic actuators are registered.
   */
  isSupported(): boolean {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      return true;
    }
    return this.xrControllers.some((c) => (c.gamepad?.hapticActuators?.length ?? 0) > 0);
  }
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

export const haptics = new HapticsService();
