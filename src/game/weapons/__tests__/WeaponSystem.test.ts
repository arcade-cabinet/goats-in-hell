/**
 * WeaponSystem unit tests — tests shot stats tracking, ammo init, and weapon definitions.
 *
 * Heavy hitscan/projectile logic requires Scene + physics — we only test pure functions.
 */

jest.mock('../../systems/AudioSystem', () => ({
  playSound: jest.fn(),
}));

jest.mock('../../systems/CombatSystem', () => ({
  damageEnemy: jest.fn(),
  handleEnemyKill: jest.fn(),
}));

jest.mock('../../systems/HazardSystem', () => ({
  damageBarrel: jest.fn(),
}));

jest.mock('../../systems/PhysicsSetup', () => ({
  physicsRaycast: jest.fn(() => null),
}));

jest.mock('../../systems/GameClock', () => ({
  getGameTime: jest.fn(() => 0),
}));

jest.mock('../../systems/PowerUpSystem', () => ({
  getDamageMultiplier: jest.fn(() => 1),
}));

jest.mock('../../rendering/Particles', () => ({
  createImpactSparks: jest.fn(),
  createHitscanTracer: jest.fn(),
}));

jest.mock('../../ui/BabylonHUD', () => ({
  registerDamageDirection: jest.fn(),
  triggerBloodSplatter: jest.fn(),
}));

import {
  getShotStats,
  resetShotStats,
  initPlayerAmmo,
  getHeadshotTimer,
  tickHeadshotTimer,
} from '../WeaponSystem';
import {weapons} from '../weapons';

beforeEach(() => {
  resetShotStats();
});

describe('getShotStats / resetShotStats', () => {
  it('starts with zero shots', () => {
    const stats = getShotStats();
    expect(stats.fired).toBe(0);
    expect(stats.hit).toBe(0);
  });

  it('resets back to zero', () => {
    // We can't easily increment without firing, but reset should be idempotent
    resetShotStats();
    const stats = getShotStats();
    expect(stats.fired).toBe(0);
    expect(stats.hit).toBe(0);
  });
});

describe('initPlayerAmmo', () => {
  it('returns ammo for all four weapons', () => {
    const ammo = initPlayerAmmo();
    expect(ammo).toHaveProperty('hellPistol');
    expect(ammo).toHaveProperty('brimShotgun');
    expect(ammo).toHaveProperty('hellfireCannon');
    expect(ammo).toHaveProperty('goatsBane');
  });

  it('hellPistol starts with full magazine and reserve', () => {
    const ammo = initPlayerAmmo();
    expect(ammo.hellPistol.current).toBe(weapons.hellPistol.magSize);
    expect(ammo.hellPistol.reserve).toBe(48);
    expect(ammo.hellPistol.magSize).toBe(weapons.hellPistol.magSize);
  });

  it('other weapons start with zero ammo', () => {
    const ammo = initPlayerAmmo();
    expect(ammo.brimShotgun.current).toBe(0);
    expect(ammo.brimShotgun.reserve).toBe(0);
    expect(ammo.hellfireCannon.current).toBe(0);
    expect(ammo.hellfireCannon.reserve).toBe(0);
    expect(ammo.goatsBane.current).toBe(0);
    expect(ammo.goatsBane.reserve).toBe(0);
  });

  it('magSize matches weapon definitions', () => {
    const ammo = initPlayerAmmo();
    expect(ammo.hellPistol.magSize).toBe(12);
    expect(ammo.brimShotgun.magSize).toBe(6);
    expect(ammo.hellfireCannon.magSize).toBe(30);
    expect(ammo.goatsBane.magSize).toBe(3);
  });
});

describe('weapon definitions', () => {
  it('hellPistol is a hitscan weapon', () => {
    expect(weapons.hellPistol.isProjectile).toBe(false);
    expect(weapons.hellPistol.pellets).toBe(1);
    expect(weapons.hellPistol.spread).toBe(0);
  });

  it('brimShotgun fires multiple pellets with spread', () => {
    expect(weapons.brimShotgun.pellets).toBe(7);
    expect(weapons.brimShotgun.spread).toBeGreaterThan(0);
    expect(weapons.brimShotgun.isProjectile).toBe(false);
  });

  it('hellfireCannon is a projectile weapon', () => {
    expect(weapons.hellfireCannon.isProjectile).toBe(true);
    expect(weapons.hellfireCannon.projectileSpeed).toBeDefined();
  });

  it('goatsBane has AoE damage', () => {
    expect(weapons.goatsBane.aoe).toBeDefined();
    expect(weapons.goatsBane.aoe!).toBeGreaterThan(0);
    expect(weapons.goatsBane.isProjectile).toBe(true);
  });

  it('goatsBane has highest damage per shot', () => {
    const maxDamage = Math.max(
      weapons.hellPistol.damage,
      weapons.brimShotgun.damage,
      weapons.hellfireCannon.damage,
      weapons.goatsBane.damage,
    );
    expect(weapons.goatsBane.damage).toBe(maxDamage);
  });

  it('all weapons have positive fire rate and reload time', () => {
    for (const [, def] of Object.entries(weapons)) {
      expect(def.fireRate).toBeGreaterThan(0);
      expect(def.reloadTime).toBeGreaterThan(0);
      expect(def.magSize).toBeGreaterThan(0);
    }
  });
});

describe('headshot timer', () => {
  it('starts at zero', () => {
    expect(getHeadshotTimer()).toBe(0);
  });

  it('tickHeadshotTimer does not go negative', () => {
    tickHeadshotTimer();
    expect(getHeadshotTimer()).toBe(0);
  });
});
