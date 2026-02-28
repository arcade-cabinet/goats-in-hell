/**
 * PowerUpSystem tests — activate, query, absorb damage, expiry, reset.
 */

jest.mock('../GameClock', () => {
  let mockTime = 0;
  return {
    getGameTime: jest.fn(() => mockTime),
    __setMockTime: (t: number) => {
      mockTime = t;
    },
  };
});

jest.mock('../AudioSystem', () => ({
  playSound: jest.fn(),
}));

import {
  absorbDamage,
  activatePowerUp,
  getActiveBuffs,
  getDamageMultiplier,
  getSpeedMultiplier,
  isBuffActive,
  powerUpSystemUpdate,
  resetPowerUps,
} from '../PowerUpSystem';

const GameClockMock = require('../GameClock') as {
  getGameTime: jest.Mock;
  __setMockTime: (t: number) => void;
};

beforeEach(() => {
  resetPowerUps();
  GameClockMock.__setMockTime(0);
});

describe('activatePowerUp', () => {
  it('activates quad damage buff', () => {
    activatePowerUp('quadDamage');
    expect(isBuffActive('quadDamage')).toBe(true);
    expect(getDamageMultiplier()).toBe(4.0);
  });

  it('activates hell speed buff', () => {
    activatePowerUp('hellSpeed');
    expect(isBuffActive('hellSpeed')).toBe(true);
    expect(getSpeedMultiplier()).toBe(2.0);
  });

  it('activates demon shield buff', () => {
    activatePowerUp('demonShield');
    expect(isBuffActive('demonShield')).toBe(true);
  });

  it('refreshes duration on duplicate activation', () => {
    GameClockMock.__setMockTime(0);
    activatePowerUp('quadDamage');

    GameClockMock.__setMockTime(5000);
    activatePowerUp('quadDamage'); // refresh

    // Should still be active at 14s (5s + 10s duration - 1s)
    GameClockMock.__setMockTime(14000);
    powerUpSystemUpdate();
    expect(isBuffActive('quadDamage')).toBe(true);

    // Should expire at 15s+
    GameClockMock.__setMockTime(15100);
    powerUpSystemUpdate();
    expect(isBuffActive('quadDamage')).toBe(false);
  });
});

describe('getDamageMultiplier / getSpeedMultiplier', () => {
  it('returns 1.0 with no buffs', () => {
    expect(getDamageMultiplier()).toBe(1.0);
    expect(getSpeedMultiplier()).toBe(1.0);
  });

  it('quad + speed stack independently', () => {
    activatePowerUp('quadDamage');
    activatePowerUp('hellSpeed');
    expect(getDamageMultiplier()).toBe(4.0);
    expect(getSpeedMultiplier()).toBe(2.0);
  });
});

describe('absorbDamage', () => {
  it('returns full damage with no shield', () => {
    expect(absorbDamage(30)).toBe(30);
  });

  it('absorbs damage up to shield HP', () => {
    activatePowerUp('demonShield'); // 50 HP shield
    expect(absorbDamage(20)).toBe(0);
  });

  it('partial absorb when shield < damage', () => {
    activatePowerUp('demonShield'); // 50 HP
    absorbDamage(30); // 20 remaining
    const remaining = absorbDamage(35); // only 20 shield left
    expect(remaining).toBe(15);
  });

  it('shield fully depleted returns full damage', () => {
    activatePowerUp('demonShield');
    absorbDamage(50); // deplete
    expect(absorbDamage(10)).toBe(10);
  });
});

describe('powerUpSystemUpdate', () => {
  it('expires quad damage after 10s', () => {
    GameClockMock.__setMockTime(0);
    activatePowerUp('quadDamage');

    GameClockMock.__setMockTime(10100);
    powerUpSystemUpdate();
    expect(isBuffActive('quadDamage')).toBe(false);
    expect(getDamageMultiplier()).toBe(1.0);
  });

  it('expires hell speed after 8s', () => {
    GameClockMock.__setMockTime(0);
    activatePowerUp('hellSpeed');

    GameClockMock.__setMockTime(8100);
    powerUpSystemUpdate();
    expect(isBuffActive('hellSpeed')).toBe(false);
  });

  it('removes fully depleted shield', () => {
    activatePowerUp('demonShield');
    absorbDamage(50); // fully depleted
    powerUpSystemUpdate();
    expect(isBuffActive('demonShield')).toBe(false);
  });
});

describe('getActiveBuffs', () => {
  it('returns empty array with no buffs', () => {
    expect(getActiveBuffs()).toHaveLength(0);
  });

  it('returns buff info with progress', () => {
    GameClockMock.__setMockTime(0);
    activatePowerUp('quadDamage');

    GameClockMock.__setMockTime(5000); // halfway through 10s duration
    const buffs = getActiveBuffs();
    expect(buffs).toHaveLength(1);
    expect(buffs[0].type).toBe('quadDamage');
    expect(buffs[0].label).toBe('QUAD DAMAGE');
    expect(buffs[0].progress).toBeCloseTo(0.5, 1);
  });

  it('includes shield fraction for demon shield', () => {
    activatePowerUp('demonShield');
    absorbDamage(25); // 50% remaining
    const buffs = getActiveBuffs();
    expect(buffs[0].shieldFraction).toBeCloseTo(0.5, 1);
  });
});

describe('resetPowerUps', () => {
  it('clears all active buffs', () => {
    activatePowerUp('quadDamage');
    activatePowerUp('hellSpeed');
    activatePowerUp('demonShield');
    resetPowerUps();
    expect(getActiveBuffs()).toHaveLength(0);
    expect(getDamageMultiplier()).toBe(1.0);
    expect(getSpeedMultiplier()).toBe(1.0);
  });
});
