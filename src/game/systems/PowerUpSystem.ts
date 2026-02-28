/**
 * Power-Up System — temporary combat buffs.
 *
 * Three power-up types:
 *  - QUAD DAMAGE: 4× outgoing damage for 10s (red aura)
 *  - HELL SPEED: 2× move speed for 8s (blue trails)
 *  - DEMON SHIELD: absorbs 50 damage (gold aura, depletes)
 *
 * Power-ups spawn rarely in explore levels and after arena waves.
 * Active buffs shown on BabylonHUD with countdown timers.
 */

import {getGameTime} from './GameClock';
import {playSound} from './AudioSystem';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PowerUpType = 'quadDamage' | 'hellSpeed' | 'demonShield';

interface ActiveBuff {
  type: PowerUpType;
  /** Game time (ms) when this buff was activated. */
  startTime: number;
  /** Duration in ms (0 = permanent until depleted, like shield). */
  duration: number;
  /** For shield: remaining absorb HP. */
  shieldHp?: number;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export const POWERUP_CONFIG: Record<PowerUpType, {
  label: string;
  color: string;
  duration: number;
  description: string;
}> = {
  quadDamage: {
    label: 'QUAD DAMAGE',
    color: '#ff2200',
    duration: 10000,
    description: '4× damage',
  },
  hellSpeed: {
    label: 'HELL SPEED',
    color: '#2266ff',
    duration: 8000,
    description: '2× speed',
  },
  demonShield: {
    label: 'DEMON SHIELD',
    color: '#ffcc00',
    duration: 30000, // max lifetime even if not fully depleted
    description: 'Absorbs 50 dmg',
  },
};

const SHIELD_MAX_HP = 50;

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const activeBuffs: ActiveBuff[] = [];

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

/** Activate a power-up buff on the player. Stacking refreshes duration. */
export function activatePowerUp(type: PowerUpType): void {
  const now = getGameTime();
  const config = POWERUP_CONFIG[type];

  // Check if already active — refresh instead of stacking
  const existing = activeBuffs.find(b => b.type === type);
  if (existing) {
    existing.startTime = now;
    existing.duration = config.duration;
    if (type === 'demonShield') {
      existing.shieldHp = SHIELD_MAX_HP;
    }
  } else {
    const buff: ActiveBuff = {
      type,
      startTime: now,
      duration: config.duration,
    };
    if (type === 'demonShield') {
      buff.shieldHp = SHIELD_MAX_HP;
    }
    activeBuffs.push(buff);
  }

  playSound('pickup');
}

/** Called each frame to expire timed-out buffs. */
export function powerUpSystemUpdate(): void {
  const now = getGameTime();

  for (let i = activeBuffs.length - 1; i >= 0; i--) {
    const buff = activeBuffs[i];
    const elapsed = now - buff.startTime;

    if (elapsed > buff.duration) {
      activeBuffs.splice(i, 1);
      continue;
    }

    // Shield fully depleted
    if (buff.type === 'demonShield' && buff.shieldHp !== undefined && buff.shieldHp <= 0) {
      activeBuffs.splice(i, 1);
    }
  }
}

// ---------------------------------------------------------------------------
// Queries (called by other systems)
// ---------------------------------------------------------------------------

/** Returns the outgoing damage multiplier (1.0 = normal, 4.0 = quad). */
export function getDamageMultiplier(): number {
  return activeBuffs.some(b => b.type === 'quadDamage') ? 4.0 : 1.0;
}

/** Returns the movement speed multiplier (1.0 = normal, 2.0 = hell speed). */
export function getSpeedMultiplier(): number {
  return activeBuffs.some(b => b.type === 'hellSpeed') ? 2.0 : 1.0;
}

/**
 * Absorb incoming damage via demon shield. Returns the damage remaining
 * after absorption (0 if fully absorbed).
 */
export function absorbDamage(damage: number): number {
  const shield = activeBuffs.find(b => b.type === 'demonShield');
  if (!shield || shield.shieldHp === undefined || shield.shieldHp <= 0) {
    return damage;
  }

  const absorbed = Math.min(damage, shield.shieldHp);
  shield.shieldHp -= absorbed;
  return damage - absorbed;
}

/** Get all active buffs for HUD display. */
export function getActiveBuffs(): Array<{
  type: PowerUpType;
  label: string;
  color: string;
  /** 0..1 progress (0 = just activated, 1 = about to expire). */
  progress: number;
  /** For shield: remaining HP fraction 0..1. */
  shieldFraction?: number;
}> {
  const now = getGameTime();
  return activeBuffs.map(buff => {
    const config = POWERUP_CONFIG[buff.type];
    const elapsed = now - buff.startTime;
    return {
      type: buff.type,
      label: config.label,
      color: config.color,
      progress: Math.min(1, elapsed / buff.duration),
      shieldFraction: buff.shieldHp !== undefined ? buff.shieldHp / SHIELD_MAX_HP : undefined,
    };
  });
}

/** Check if a specific buff is active. */
export function isBuffActive(type: PowerUpType): boolean {
  return activeBuffs.some(b => b.type === type);
}

/** Reset all active buffs (floor transition / death). */
export function resetPowerUps(): void {
  activeBuffs.length = 0;
}
