/**
 * HazardSystem tests — spike damage, barrel damage, barrel explosion AoE.
 */

jest.mock('../AudioSystem', () => ({
  playSound: jest.fn(),
}));

jest.mock('../../ui/HUDEvents', () => ({
  registerDamageDirection: jest.fn(),
  triggerBloodSplatter: jest.fn(),
  triggerEnvKill: jest.fn(),
}));

jest.mock('../damageEvents', () => ({
  pushDamageEvent: jest.fn(),
}));

jest.mock('../CombatSystem', () => ({
  removeEntity: jest.fn((entity: any) => {
    const { world } = require('../../entities/world');
    world.remove(entity);
  }),
}));

jest.mock('../GameClock', () => {
  let mockTime = 0;
  return {
    getGameTime: jest.fn(() => mockTime),
    __setMockTime: (t: number) => {
      mockTime = t;
    },
  };
});

import type { Entity } from '../../entities/components';
import { vec3 as Vector3 } from '../../entities/vec3';
import { world } from '../../entities/world';
import { playSound } from '../AudioSystem';
import { damageBarrel, hazardSystemUpdate, resetHazardSystem } from '../HazardSystem';

const GameClockMock = require('../GameClock') as {
  getGameTime: jest.Mock;
  __setMockTime: (t: number) => void;
};

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
    },
  };
  world.add(player);
  return player;
}

beforeEach(() => {
  for (const e of [...world.entities]) world.remove(e);
  resetHazardSystem();
  GameClockMock.__setMockTime(0);
  jest.clearAllMocks();

  // Reset GameState shim
  const { useGameStore } = require('../../../state/GameStore');
  useGameStore.setState({ damageFlash: 0, screenShake: 0 });
});

describe('damageBarrel', () => {
  it('reduces barrel HP', () => {
    const barrel: Entity = {
      id: 'barrel-1',
      type: 'hazard_barrel',
      position: Vector3(5, 0, 5),
      hazard: { hazardType: 'barrel', damage: 20, cooldown: 0, hp: 30 },
    };
    damageBarrel(barrel, 10);
    expect(barrel.hazard!.hp).toBe(20);
  });

  it('ignores non-barrel entities', () => {
    const spike: Entity = {
      id: 'spike-1',
      type: 'hazard_spikes',
      position: Vector3(5, 0, 5),
      hazard: { hazardType: 'spikes', damage: 10, cooldown: 0 },
    };
    damageBarrel(spike, 10);
    // No crash, no change
    expect(spike.hazard!.damage).toBe(10);
  });

  it('ignores barrel without HP field', () => {
    const barrel: Entity = {
      id: 'barrel-nohp',
      type: 'hazard_barrel',
      position: Vector3(5, 0, 5),
      hazard: { hazardType: 'barrel', damage: 20, cooldown: 0 },
    };
    damageBarrel(barrel, 10);
    expect(barrel.hazard!.hp).toBeUndefined();
  });
});

describe('hazardSystemUpdate — spikes', () => {
  it('damages player within range', () => {
    const player = makePlayer(1, 1);
    const spike: Entity = {
      id: 'spike-1',
      type: 'hazard_spikes',
      position: Vector3(1, 0, 1), // same spot as player
      hazard: { hazardType: 'spikes', damage: 15, cooldown: 0 },
    };
    world.add(spike);

    GameClockMock.__setMockTime(2000);
    hazardSystemUpdate();

    expect(player.player!.hp).toBe(85);
    expect(playSound).toHaveBeenCalledWith('hurt');
  });

  it('respects cooldown (no double damage within 1.5s)', () => {
    const player = makePlayer(1, 1);
    const spike: Entity = {
      id: 'spike-2',
      type: 'hazard_spikes',
      position: Vector3(1, 0, 1),
      hazard: { hazardType: 'spikes', damage: 10, cooldown: 0 },
    };
    world.add(spike);

    GameClockMock.__setMockTime(2000);
    hazardSystemUpdate();
    expect(player.player!.hp).toBe(90);

    GameClockMock.__setMockTime(3000); // only 1s later
    hazardSystemUpdate();
    expect(player.player!.hp).toBe(90); // no additional damage

    GameClockMock.__setMockTime(3600); // 1.6s later — cooldown expired
    hazardSystemUpdate();
    expect(player.player!.hp).toBe(80);
  });

  it('does not damage player outside range', () => {
    const player = makePlayer(0, 0);
    const spike: Entity = {
      id: 'spike-far',
      type: 'hazard_spikes',
      position: Vector3(10, 0, 10),
      hazard: { hazardType: 'spikes', damage: 10, cooldown: 0 },
    };
    world.add(spike);

    GameClockMock.__setMockTime(2000);
    hazardSystemUpdate();
    expect(player.player!.hp).toBe(100);
  });
});

describe('hazardSystemUpdate — barrel explosion', () => {
  it('explodes barrel when HP <= 0', () => {
    makePlayer(20, 20); // far away
    const barrel: Entity = {
      id: 'barrel-boom',
      type: 'hazard_barrel',
      position: Vector3(5, 0, 5),
      hazard: { hazardType: 'barrel', damage: 30, cooldown: 0, hp: -1 },
    };
    world.add(barrel);

    hazardSystemUpdate();

    expect(playSound).toHaveBeenCalledWith('explosion');
    expect(world.entities.find((e) => e.id === 'barrel-boom')).toBeUndefined();
  });

  it('damages nearby enemies in blast radius', () => {
    makePlayer(20, 20); // far away
    const barrel: Entity = {
      id: 'barrel-aoe',
      type: 'hazard_barrel',
      position: Vector3(5, 0, 5),
      hazard: { hazardType: 'barrel', damage: 20, cooldown: 0, hp: 0 },
    };
    const enemy: Entity = {
      id: 'enemy-near',
      type: 'goat',
      position: Vector3(6, 0, 5), // 1 unit away
      enemy: {
        hp: 50,
        maxHp: 50,
        damage: 5,
        speed: 1,
        attackRange: 2,
        alert: false,
        attackCooldown: 0,
        scoreValue: 100,
      },
    };
    world.add(barrel);
    world.add(enemy);

    hazardSystemUpdate();

    // 1 unit away from center, falloff = 1 - (1/4)*0.75 = 0.8125, dmg = ceil(20*0.8125) = 17
    expect(enemy.enemy!.hp).toBeLessThan(50);
  });

  it('chain-damages nearby barrels', () => {
    makePlayer(20, 20);
    const barrel1: Entity = {
      id: 'barrel-chain-1',
      type: 'hazard_barrel',
      position: Vector3(5, 0, 5),
      hazard: { hazardType: 'barrel', damage: 20, cooldown: 0, hp: 0 },
    };
    const barrel2: Entity = {
      id: 'barrel-chain-2',
      type: 'hazard_barrel',
      position: Vector3(7, 0, 5), // 2 units away, within blast radius
      hazard: { hazardType: 'barrel', damage: 20, cooldown: 0, hp: 30 },
    };
    world.add(barrel1);
    world.add(barrel2);

    hazardSystemUpdate();

    expect(barrel2.hazard!.hp!).toBeLessThan(30);
  });
});
