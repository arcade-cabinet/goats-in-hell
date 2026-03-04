jest.mock('../AudioSystem', () => ({ playSound: jest.fn() }));
jest.mock('../GameClock', () => ({ getGameTime: jest.fn(() => 0) }));
jest.mock('../PlayerDamageBridge', () => ({ bridgeDamagePlayer: jest.fn() }));
jest.mock('../../ui/HUDEvents', () => ({ registerDamageDirection: jest.fn() }));

import type { Entity } from '../../entities/components';
import { vec3 } from '../../entities/vec3';
import type { BrainContext } from '../brains/BrainContext';
import { AttackMeleeGoal } from '../brains/enemy/goals/AttackMeleeGoal';
import { ChasePlayerGoal } from '../brains/enemy/goals/ChasePlayerGoal';
import { IdleGoal } from '../brains/enemy/goals/IdleGoal';

function mockContext(overrides: Partial<BrainContext> = {}): BrainContext {
  return {
    playerPos: vec3(10, 0, 10),
    playerHp: 100,
    playerMaxHp: 100,
    playerWeapon: 'hellPistol',
    grid: [
      [0, 0],
      [0, 0],
    ],
    gridW: 2,
    gridH: 2,
    cellSize: 2,
    circleNumber: 1,
    encounterType: 'explore',
    screen: 'playing',
    deltaTime: 16,
    dtScale: 1,
    gameTime: 1000,
    ...overrides,
  };
}

function mockEnemy(overrides: Partial<Entity> = {}): Entity {
  return {
    id: 'goat-1',
    type: 'goat',
    position: vec3(11, 0, 10),
    enemy: {
      hp: 20,
      maxHp: 20,
      damage: 5,
      speed: 0.04,
      attackRange: 1.8,
      alert: true,
      attackCooldown: 0,
      scoreValue: 100,
    },
    ...overrides,
  };
}

describe('IdleGoal', () => {
  it('activates and completes when enemy becomes alert', () => {
    const enemy = mockEnemy();
    enemy.enemy!.alert = false;
    const goal = new IdleGoal(enemy);
    goal.activate();
    expect(goal.active()).toBe(true);

    // Simulate alert
    enemy.enemy!.alert = true;
    goal.execute();
    expect(goal.completed()).toBe(true);
  });
});

describe('AttackMeleeGoal', () => {
  it('completes after attacking', () => {
    const enemy = mockEnemy();
    const ctx = mockContext();
    const goal = new AttackMeleeGoal(enemy, ctx);
    goal.activate();
    goal.execute();
    // Should have attacked (distance ~1 unit, within attackRange 1.8)
    expect(enemy.enemy!.attackCooldown).toBeGreaterThan(0);
    expect(goal.completed()).toBe(true);
  });

  it('fails when target out of range', () => {
    const enemy = mockEnemy();
    enemy.position = vec3(50, 0, 50); // far away
    const ctx = mockContext();
    const goal = new AttackMeleeGoal(enemy, ctx);
    goal.activate();
    goal.execute();
    expect(goal.failed()).toBe(true);
  });
});

describe('ChasePlayerGoal', () => {
  it('stays active while moving toward player', () => {
    const enemy = mockEnemy();
    enemy.position = vec3(20, 0, 20); // 14 units away
    const ctx = mockContext();
    const goal = new ChasePlayerGoal(enemy, ctx);
    goal.activate();
    goal.execute();
    expect(goal.active()).toBe(true);
  });
});
