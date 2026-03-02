/**
 * Environment Zone Effects -- gameplay modifiers applied when the player
 * is inside environment zones (fire, ice, wind, acid, etc.).
 *
 * Exports module-scope state that PlayerController reads each frame:
 * - Speed multiplier (ice/frost zones, C4 crumble warning)
 * - Wind force vector (wind zones, C2 gust bursts)
 * - Ice sliding flag (C9 frozen floor)
 * - Illusion zone flag (C8 hint)
 */
import type { RuntimeEnvZone } from '../../db/LevelDbAdapter';
import { useGameStore } from '../../state/GameStore';
import { damagePlayer } from './CombatSystem';
import { triggerScreenShake } from './ScreenShake';

// ---------------------------------------------------------------------------
// Module-scope state
// ---------------------------------------------------------------------------

/** Speed multiplier applied by active environment zones. Reset each frame. */
let _zoneSpeedMult = 1;

/** Wind force vector applied this frame (world units/sec). */
let _windForceX = 0;
let _windForceZ = 0;

/** Whether the player is currently on an ice zone (C9 sliding). */
let _onIce = false;

/** Whether the player is in an illusion zone (C8 hint). */
let _inIllusion = false;

export function getZoneSpeedMult(): number {
  return _zoneSpeedMult;
}

export function getWindForce(): { x: number; z: number } {
  return { x: _windForceX, z: _windForceZ };
}

export function isOnIce(): boolean {
  return _onIce;
}

export function isInIllusion(): boolean {
  return _inIllusion;
}

/** Reset zone effects. Called on floor transitions. */
export function resetZoneEffects(): void {
  _zoneSpeedMult = 1;
  _windForceX = 0;
  _windForceZ = 0;
  _onIce = false;
  _inIllusion = false;
  _damageAccum = 0;
  _gustTimer = 0;
  _gustActive = false;
  _crumbleTimer = 0;
  _crumbleWarning = false;
}

// ---------------------------------------------------------------------------
// Zone containment check
// ---------------------------------------------------------------------------

/**
 * Check if a world-space position is inside a zone.
 * Zone bounds: (x, z) is top-left in grid space.
 * Player position uses world coords where Z is NOT negated
 * (ECS entity positions use positive-Z = southward).
 */
function isInsideZone(playerWorldX: number, playerWorldZ: number, zone: RuntimeEnvZone): boolean {
  return (
    playerWorldX >= zone.x &&
    playerWorldX <= zone.x + zone.w &&
    playerWorldZ >= zone.z &&
    playerWorldZ <= zone.z + zone.h
  );
}

// ---------------------------------------------------------------------------
// C2 Wind Stagger state — periodic gust bursts in wind zones
// ---------------------------------------------------------------------------

/** Time until next gust burst (seconds). */
let _gustTimer = 0;
/** Whether a gust burst is currently active. */
let _gustActive = false;
/** Remaining duration of current gust (seconds). */
let _gustDuration = 0;

/** Gust interval range (seconds between gusts). */
const GUST_INTERVAL_MIN = 2.0;
const GUST_INTERVAL_MAX = 4.0;
/** Gust burst duration (seconds). */
const GUST_BURST_DURATION = 0.5;
/** Force multiplier during gust. */
const GUST_FORCE_MULT = 3.0;

function randomGustInterval(): number {
  return GUST_INTERVAL_MIN + Math.random() * (GUST_INTERVAL_MAX - GUST_INTERVAL_MIN);
}

// ---------------------------------------------------------------------------
// C4 Golden Floor Crumble state — damage after standing still
// ---------------------------------------------------------------------------

/** Seconds the player has been stationary on circle 4. */
let _crumbleTimer = 0;
/** Whether the crumble warning is active (visual cue). */
let _crumbleWarning = false;
/** Previous player position for movement detection. */
let _prevPosX = 0;
let _prevPosZ = 0;

/** Seconds of standing still before floor crumbles. */
const CRUMBLE_DELAY = 2.5;
/** Damage dealt when floor crumbles. */
const CRUMBLE_DAMAGE = 15;
/** Cooldown after crumble before it can trigger again (seconds). */
const CRUMBLE_COOLDOWN = 4.0;
/** Minimum movement per second to count as "moving" (world units). */
const CRUMBLE_MOVE_THRESHOLD = 0.5;

export function isCrumbleWarning(): boolean {
  return _crumbleWarning;
}

// ---------------------------------------------------------------------------
// Per-frame update
// ---------------------------------------------------------------------------

// Damage accumulator for fractional DPS (fire/acid tick at sub-1 intervals)
let _damageAccum = 0;

/**
 * Check which zones the player is in and apply gameplay effects.
 * Called once per frame from R3FRoot's useFrame.
 *
 * @param playerWorldX - Player X in world coords (ECS position.x)
 * @param playerWorldZ - Player Z in world coords (ECS position.z, positive southward)
 * @param zones - Active environment zones for the current level
 * @param deltaMs - Frame delta in milliseconds
 */
export function updateZoneEffects(
  playerWorldX: number,
  playerWorldZ: number,
  zones: RuntimeEnvZone[],
  deltaMs: number,
): void {
  // Reset per-frame values
  _zoneSpeedMult = 1;
  _windForceX = 0;
  _windForceZ = 0;
  _onIce = false;
  _inIllusion = false;

  if (zones.length === 0) return;

  const now = performance.now();
  const deltaSec = deltaMs / 1000;
  const circleNumber = useGameStore.getState().circleNumber;
  let totalDps = 0;
  let inWindZone = false;
  let baseWindX = 0;
  let baseWindZ = 0;

  for (const zone of zones) {
    // Timer check: skip zones that are currently in their "off" cycle
    if (zone.timerOn > 0 && zone.timerOff > 0) {
      const period = zone.timerOn + zone.timerOff;
      const phase = now % period;
      if (phase >= zone.timerOn) continue; // currently off
    }

    if (!isInsideZone(playerWorldX, playerWorldZ, zone)) continue;

    switch (zone.envType) {
      case 'fire':
        totalDps += zone.intensity * 5;
        break;

      case 'acid':
      case 'poison':
        totalDps += zone.intensity * 5;
        break;

      case 'ice':
      case 'frost':
        _zoneSpeedMult = Math.min(_zoneSpeedMult, 0.5);
        _onIce = true;
        break;

      case 'wind':
        baseWindX += zone.dirX * zone.intensity * 4;
        baseWindZ += zone.dirZ * zone.intensity * 4;
        inWindZone = true;
        break;

      case 'illusion':
        _inIllusion = true;
        // C8 Fraud: illusion zones slightly disorient (mild speed reduction)
        if (circleNumber === 8) {
          _zoneSpeedMult = Math.min(_zoneSpeedMult, 0.85);
        }
        break;

      // blood, void, fog — visual only, no gameplay effect
    }
  }

  // --- C2 Lust: Wind Stagger — periodic gust bursts ---
  if (inWindZone && circleNumber === 2) {
    _gustTimer -= deltaSec;

    if (_gustActive) {
      _gustDuration -= deltaSec;
      if (_gustDuration <= 0) {
        _gustActive = false;
        _gustTimer = randomGustInterval();
      }
    } else if (_gustTimer <= 0) {
      // Trigger a gust burst
      _gustActive = true;
      _gustDuration = GUST_BURST_DURATION;
      triggerScreenShake(0.35);
    }

    const gustMult = _gustActive ? GUST_FORCE_MULT : 1.0;
    _windForceX = baseWindX * gustMult;
    _windForceZ = baseWindZ * gustMult;
  } else {
    _windForceX = baseWindX;
    _windForceZ = baseWindZ;
    if (!inWindZone) {
      _gustActive = false;
      _gustTimer = 0;
    }
  }

  // --- C4 Greed: Golden Floor Crumble — damage after standing still ---
  if (circleNumber === 4 && useGameStore.getState().screen === 'playing') {
    const dx = playerWorldX - _prevPosX;
    const dz = playerWorldZ - _prevPosZ;
    const distMoved = Math.sqrt(dx * dx + dz * dz);
    const isStationary = deltaSec > 0 && distMoved / deltaSec < CRUMBLE_MOVE_THRESHOLD;

    if (isStationary) {
      _crumbleTimer += deltaSec;
      _crumbleWarning = _crumbleTimer > CRUMBLE_DELAY * 0.6; // Warning at 60%

      if (_crumbleTimer >= CRUMBLE_DELAY) {
        damagePlayer(CRUMBLE_DAMAGE);
        triggerScreenShake(0.5);
        _crumbleTimer = -CRUMBLE_COOLDOWN; // Negative = cooldown period
        _crumbleWarning = false;
      }
    } else {
      // Moving resets the timer (but not during cooldown)
      if (_crumbleTimer > 0) _crumbleTimer = 0;
      else _crumbleTimer += deltaSec; // Tick cooldown toward 0
      _crumbleWarning = false;
    }
  } else {
    _crumbleTimer = 0;
    _crumbleWarning = false;
  }

  _prevPosX = playerWorldX;
  _prevPosZ = playerWorldZ;

  // Apply accumulated damage (fractional DPS → integer damage ticks)
  if (totalDps > 0) {
    _damageAccum += totalDps * deltaSec;
    if (_damageAccum >= 1) {
      const dmg = Math.floor(_damageAccum);
      _damageAccum -= dmg;
      damagePlayer(dmg);
    }
  } else {
    _damageAccum = 0;
  }
}
