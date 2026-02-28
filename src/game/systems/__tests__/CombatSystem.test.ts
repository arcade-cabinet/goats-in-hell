/**
 * CombatSystem unit tests — tests damageEnemy, handleEnemyKill, removeEntity.
 *
 * Mocks all side-effect dependencies (AudioSystem, BabylonHUD, KillStreakSystem,
 * PowerUpSystem, HazardSystem, damageEvents) so we test pure combat logic.
 */

// Mock modules BEFORE imports
jest.mock('../AudioSystem', () => ({
  playSound: jest.fn(),
}));

jest.mock('../../ui/HUDEvents', () => ({
  registerDamageDirection: jest.fn(),
  triggerBloodSplatter: jest.fn(),
}));

jest.mock('../KillStreakSystem', () => ({
  registerKill: jest.fn(),
}));

jest.mock('../PowerUpSystem', () => ({
  absorbDamage: jest.fn((dmg: number) => dmg),
  getDamageMultiplier: jest.fn(() => 1),
}));

jest.mock('../HazardSystem', () => ({
  damageBarrel: jest.fn(),
}));

jest.mock('../damageEvents', () => ({
  pushDamageEvent: jest.fn(),
}));

jest.mock('../GameClock', () => ({
  getGameTime: jest.fn(() => 0),
}));

import {vec3 as Vector3} from '../../entities/vec3';
import type {Entity} from '../../entities/components';
import {world} from '../../entities/world';
import {damageEnemy, handleEnemyKill, removeEntity} from '../CombatSystem';
import {playSound} from '../AudioSystem';
import {registerKill} from '../KillStreakSystem';

// Reset world and Zustand store between tests
beforeEach(() => {
  // Clear all entities from the world
  for (const entity of [...world.entities]) {
    world.remove(entity);
  }
  jest.clearAllMocks();
  // Reset GameStore state to defaults
  const {useGameStore} = require('../../../state/GameStore');
  useGameStore.setState({
    score: 0,
    kills: 0,
    totalKills: 0,
    leveling: {level: 1, xp: 0, xpToNext: 283},
    difficulty: 'normal',
  });
});

describe('damageEnemy', () => {
  function makeEnemy(hp: number, maxHp: number, opts: Partial<Entity['enemy']> = {}): Entity {
    const entity: Entity = {
      id: 'test-enemy',
      type: 'goat',
      position: Vector3(5, 1, 5),
      enemy: {
        hp,
        maxHp,
        damage: 5,
        speed: 1,
        attackRange: 2,
        alert: true,
        attackCooldown: 0,
        scoreValue: 100,
        ...opts,
      },
    };
    world.add(entity);
    return entity;
  }

  it('reduces enemy HP by the damage amount', () => {
    const enemy = makeEnemy(50, 50);
    const dealt = damageEnemy(enemy, 10);
    expect(enemy.enemy!.hp).toBe(40);
    expect(dealt).toBe(10);
  });

  it('can reduce HP below zero', () => {
    const enemy = makeEnemy(5, 50);
    const dealt = damageEnemy(enemy, 20);
    expect(enemy.enemy!.hp).toBe(-15);
    expect(dealt).toBe(20);
  });

  it('absorbs damage with armor first', () => {
    const enemy = makeEnemy(50, 50, {
      isArmored: true,
      armorHp: 15,
      armorMaxHp: 15,
    });

    const dealt = damageEnemy(enemy, 20);

    // 15 armor absorbs first, then 5 goes to HP
    expect(enemy.enemy!.armorHp).toBe(0);
    expect(enemy.enemy!.hp).toBe(45);
    expect(dealt).toBe(5);
  });

  it('armor fully absorbs when armor > damage', () => {
    const enemy = makeEnemy(50, 50, {
      isArmored: true,
      armorHp: 30,
      armorMaxHp: 30,
    });

    const dealt = damageEnemy(enemy, 10);

    expect(enemy.enemy!.armorHp).toBe(20);
    expect(enemy.enemy!.hp).toBe(50); // no HP damage
    expect(dealt).toBe(0);
  });

  it('triggers stagger on heavy hit (>25% maxHP)', () => {
    // Need a player entity for stagger knockback direction
    const player: Entity = {
      id: 'player',
      type: 'player',
      position: Vector3(0, 1, 0),
      player: {
        hp: 100,
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

    const enemy = makeEnemy(100, 100);
    // 30 damage > 25% of 100 = 25, so should stagger
    damageEnemy(enemy, 30);

    expect(enemy.enemy!.staggerTimer).toBe(300);
    expect(enemy.enemy!.staggerDirX).toBeDefined();
    expect(enemy.enemy!.staggerDirZ).toBeDefined();
  });

  it('does NOT stagger on light hit (<= 25% maxHP)', () => {
    const enemy = makeEnemy(100, 100);
    damageEnemy(enemy, 20); // 20 <= 25% of 100

    expect(enemy.enemy!.staggerTimer).toBeUndefined();
  });

  it('does NOT stagger if enemy is dead (hp <= 0)', () => {
    const enemy = makeEnemy(10, 100);
    damageEnemy(enemy, 50); // kills the enemy, 50 > 25

    // stagger only applies if hp > 0 after damage
    expect(enemy.enemy!.staggerTimer).toBeUndefined();
  });
});

describe('handleEnemyKill', () => {
  it('increments score and kills', () => {
    const {useGameStore} = require('../../../state/GameStore');
    const entity: Entity = {
      id: 'kill-target',
      type: 'goat',
      position: Vector3(3, 1, 3),
      enemy: {
        hp: 0,
        maxHp: 50,
        damage: 5,
        speed: 1,
        attackRange: 2,
        alert: true,
        attackCooldown: 0,
        scoreValue: 200,
      },
    };
    world.add(entity);

    handleEnemyKill(entity);

    const state = useGameStore.getState();
    expect(state.score).toBe(200);
    expect(state.kills).toBe(1);
    expect(state.totalKills).toBe(1);
  });

  it('plays goat_die sound', () => {
    const entity: Entity = {
      id: 'die-target',
      type: 'goat',
      enemy: {
        hp: 0,
        maxHp: 50,
        damage: 5,
        speed: 1,
        attackRange: 2,
        alert: true,
        attackCooldown: 0,
        scoreValue: 50,
      },
    };
    world.add(entity);

    handleEnemyKill(entity);

    expect(playSound).toHaveBeenCalledWith('goat_die');
  });

  it('removes the entity from the world', () => {
    const entity: Entity = {
      id: 'remove-target',
      type: 'goat',
      enemy: {
        hp: 0,
        maxHp: 50,
        damage: 5,
        speed: 1,
        attackRange: 2,
        alert: true,
        attackCooldown: 0,
        scoreValue: 50,
      },
    };
    world.add(entity);
    expect(world.entities).toContain(entity);

    handleEnemyKill(entity);

    expect(world.entities).not.toContain(entity);
  });

  it('calls registerKill for kill streak tracking', () => {
    const entity: Entity = {
      id: 'streak-target',
      type: 'goat',
      enemy: {
        hp: 0,
        maxHp: 50,
        damage: 5,
        speed: 1,
        attackRange: 2,
        alert: true,
        attackCooldown: 0,
        scoreValue: 50,
      },
    };
    world.add(entity);

    handleEnemyKill(entity);

    expect(registerKill).toHaveBeenCalled();
  });
});

describe('removeEntity', () => {
  it('removes entity from world', () => {
    const entity: Entity = {
      id: 'simple-entity',
      type: 'goat',
    };
    world.add(entity);

    removeEntity(entity);

    expect(world.entities).not.toContain(entity);
  });

  it('removes entity from world without mesh', () => {
    const entity: Entity = {
      id: 'no-mesh',
      type: 'projectile',
    };
    world.add(entity);

    removeEntity(entity);

    expect(world.entities).not.toContain(entity);
  });
});
