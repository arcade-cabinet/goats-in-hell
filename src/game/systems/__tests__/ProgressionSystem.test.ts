/**
 * ProgressionSystem tests — floor completion, death detection, permadeath.
 */

jest.mock('../AudioSystem', () => ({
  playSound: jest.fn(),
}));

jest.mock('../GameClock', () => ({
  getGameTime: jest.fn(() => 0),
}));

import type { Entity } from '../../entities/components';
import { vec3 as Vector3 } from '../../entities/vec3';
import { world } from '../../entities/world';
import {
  checkFloorComplete,
  checkPlayerDeath,
  resetFloorProgression,
  trackEnemySpawn,
  triggerDeath,
} from '../ProgressionSystem';

beforeEach(() => {
  for (const e of [...world.entities]) world.remove(e);
  resetFloorProgression();
  const { useGameStore } = require('../../../state/GameStore');
  useGameStore.setState({
    screen: 'playing',
    nightmareFlags: { nightmare: false, permadeath: false, ultraNightmare: false },
  });
  localStorage.clear();
});

describe('checkFloorComplete', () => {
  it('returns false when no enemies were ever spawned', () => {
    const player: Entity = {
      id: 'player',
      type: 'player',
      position: Vector3(0, 0, 0),
      player: {
        hp: 100,
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
    };
    world.add(player);
    // No enemies spawned — floor should NOT auto-complete
    expect(checkFloorComplete()).toBe(false);
  });

  it('returns true when all spawned enemies are killed', () => {
    const player: Entity = {
      id: 'player',
      type: 'player',
      position: Vector3(0, 0, 0),
      player: {
        hp: 100,
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
    };
    world.add(player);
    // Simulate enemies being spawned and then killed
    trackEnemySpawn();
    expect(checkFloorComplete()).toBe(true);
  });

  it('returns false when enemies remain', () => {
    const player: Entity = {
      id: 'player',
      type: 'player',
      position: Vector3(0, 0, 0),
      player: {
        hp: 100,
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
    };
    const enemy: Entity = {
      id: 'enemy-1',
      type: 'goat',
      position: Vector3(5, 0, 5),
      enemy: {
        hp: 10,
        maxHp: 10,
        damage: 5,
        speed: 1,
        attackRange: 2,
        alert: false,
        attackCooldown: 0,
        scoreValue: 100,
      },
    };
    world.add(player);
    world.add(enemy);
    trackEnemySpawn();
    expect(checkFloorComplete()).toBe(false);
  });

  it('returns false with non-enemy entities and no spawns tracked', () => {
    const pickup: Entity = { id: 'pickup-1', type: 'powerup' };
    world.add(pickup);
    expect(checkFloorComplete()).toBe(false);
  });
});

describe('checkPlayerDeath', () => {
  it('returns true when no player exists', () => {
    expect(checkPlayerDeath()).toBe(true);
  });

  it('returns false when player has HP', () => {
    const player: Entity = {
      id: 'player',
      type: 'player',
      player: {
        hp: 50,
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
    };
    world.add(player);
    expect(checkPlayerDeath()).toBe(false);
  });

  it('returns true when player HP is zero', () => {
    const player: Entity = {
      id: 'player',
      type: 'player',
      player: {
        hp: 0,
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
    };
    world.add(player);
    expect(checkPlayerDeath()).toBe(true);
  });

  it('returns true when player HP is negative', () => {
    const player: Entity = {
      id: 'player',
      type: 'player',
      player: {
        hp: -10,
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
    };
    world.add(player);
    expect(checkPlayerDeath()).toBe(true);
  });
});

describe('triggerDeath', () => {
  it('sets screen to dead', () => {
    const { useGameStore } = require('../../../state/GameStore');
    triggerDeath();
    expect(useGameStore.getState().screen).toBe('dead');
  });

  it('deletes save on permadeath', () => {
    const { useGameStore } = require('../../../state/GameStore');
    // Start a game and write a save
    useGameStore
      .getState()
      .startNewGame(
        'hard',
        { nightmare: false, permadeath: true, ultraNightmare: false },
        'perm-test',
      );
    useGameStore.getState().advanceStage();
    expect(localStorage.getItem('goats-in-hell-save')).not.toBeNull();

    triggerDeath();
    expect(localStorage.getItem('goats-in-hell-save')).toBeNull();
  });

  it('keeps save without permadeath', () => {
    const { useGameStore } = require('../../../state/GameStore');
    useGameStore
      .getState()
      .startNewGame(
        'normal',
        { nightmare: false, permadeath: false, ultraNightmare: false },
        'keep-save',
      );
    useGameStore.getState().advanceStage();
    expect(localStorage.getItem('goats-in-hell-save')).not.toBeNull();

    triggerDeath();
    // Save should still exist
    expect(localStorage.getItem('goats-in-hell-save')).not.toBeNull();
  });
});
