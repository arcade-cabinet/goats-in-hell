/**
 * PickupSystem tests — health/ammo/weapon/powerup collection, magnet pull.
 */

jest.mock('../AudioSystem', () => ({
  playSound: jest.fn(),
}));

jest.mock('../GameClock', () => ({
  getGameTime: jest.fn(() => 0),
}));

jest.mock('../PowerUpSystem', () => ({
  activatePowerUp: jest.fn(),
}));

// Particles module was deleted — pickup burst is now handled by R3F rendering layer

import type { Entity } from '../../entities/components';
import { vec3 as Vector3 } from '../../entities/vec3';
import { world } from '../../entities/world';
import { playSound } from '../AudioSystem';
import { pickupSystemUpdate } from '../PickupSystem';
import { activatePowerUp } from '../PowerUpSystem';

function makePlayer(x = 0, z = 0, hp = 100): Entity {
  const player: Entity = {
    id: 'player',
    type: 'player',
    position: Vector3(x, 1, z),
    player: {
      hp,
      maxHp: 100,
      speed: 5,
      sprintMult: 1.5,
      currentWeapon: 'hellPistol',
      weapons: ['hellPistol'],
      isReloading: false,
      reloadStart: 0,
      fuel: 100,
      fuelMax: 100,
    },
    ammo: {
      hellPistol: { current: 12, reserve: 20, magSize: 12 },
      brimShotgun: { current: 0, reserve: 0, magSize: 6 },
      hellfireCannon: { current: 0, reserve: 0, magSize: 30 },
      goatsBane: { current: 0, reserve: 0, magSize: 3 },
      brimstoneFlamethrower: { current: 0, reserve: 0, magSize: 0 },
    },
  };
  world.add(player);
  return player;
}

function makePickup(type: string, x: number, z: number, value = 20, extra: any = {}): Entity {
  const entity: Entity = {
    id: `pickup-${Math.random()}`,
    type: 'powerup',
    position: Vector3(x, 0, z),
    pickup: { pickupType: type as any, value, active: true, ...extra },
  };
  world.add(entity);
  return entity;
}

beforeEach(() => {
  for (const e of [...world.entities]) world.remove(e);
  jest.clearAllMocks();
});

describe('health pickup', () => {
  it('heals the player', () => {
    const player = makePlayer(0, 0, 50);
    makePickup('health', 0.5, 0, 30); // within 1.5 range
    pickupSystemUpdate();
    expect(player.player!.hp).toBe(80);
  });

  it('caps at maxHp', () => {
    const player = makePlayer(0, 0, 90);
    makePickup('health', 0.5, 0, 30);
    pickupSystemUpdate();
    expect(player.player!.hp).toBe(100);
  });

  it('plays pickup sound', () => {
    makePlayer(0, 0, 50);
    makePickup('health', 0.5, 0, 20);
    pickupSystemUpdate();
    expect(playSound).toHaveBeenCalledWith('pickup');
  });

  it('removes pickup from world after collection', () => {
    makePlayer(0, 0, 50);
    const pickup = makePickup('health', 0.5, 0, 20);
    pickupSystemUpdate();
    expect(world.entities).not.toContain(pickup);
  });
});

describe('ammo pickup', () => {
  it('adds ammo to current weapon reserve', () => {
    const player = makePlayer(0, 0);
    makePickup('ammo', 0.5, 0, 18);
    pickupSystemUpdate();
    expect(player.ammo!.hellPistol.reserve).toBe(38); // 20 + 18
  });

  it('caps reserve at 999', () => {
    const player = makePlayer(0, 0);
    player.ammo!.hellPistol.reserve = 995;
    makePickup('ammo', 0.5, 0, 18);
    pickupSystemUpdate();
    expect(player.ammo!.hellPistol.reserve).toBe(999);
  });
});

describe('weapon pickup', () => {
  it('adds weapon to inventory if not owned', () => {
    const player = makePlayer(0, 0);
    makePickup('weapon', 0.5, 0, 0, { weaponId: 'brimShotgun' });
    pickupSystemUpdate();
    expect(player.player!.weapons).toContain('brimShotgun');
  });

  it('does not duplicate weapon in inventory', () => {
    const player = makePlayer(0, 0);
    player.player!.weapons.push('brimShotgun');
    makePickup('weapon', 0.5, 0, 0, { weaponId: 'brimShotgun' });
    pickupSystemUpdate();
    const count = player.player!.weapons.filter((w) => w === 'brimShotgun').length;
    expect(count).toBe(1);
  });

  it('grants reserve ammo for the weapon', () => {
    const player = makePlayer(0, 0);
    makePickup('weapon', 0.5, 0, 0, { weaponId: 'goatsBane' });
    pickupSystemUpdate();
    expect(player.ammo!.goatsBane.reserve).toBe(12); // WEAPON_PICKUP_RESERVE for goatsBane
  });
});

describe('powerup pickup', () => {
  it('activates the power-up', () => {
    makePlayer(0, 0);
    makePickup('powerup', 0.5, 0, 0, { powerUpType: 'quadDamage' });
    pickupSystemUpdate();
    expect(activatePowerUp).toHaveBeenCalledWith('quadDamage');
  });
});

describe('distance check', () => {
  it('does not collect pickup beyond range', () => {
    const player = makePlayer(0, 0, 50);
    makePickup('health', 5, 5, 30); // far away
    pickupSystemUpdate();
    expect(player.player!.hp).toBe(50);
  });
});

describe('no player', () => {
  it('does nothing without a player entity', () => {
    makePickup('health', 0, 0, 30);
    // Should not throw
    pickupSystemUpdate();
  });
});
