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

  it('computes A* waypoints on open grid and advances toward them', () => {
    // 5x5 open grid, cellSize=2
    const grid = Array.from({ length: 5 }, () => Array(5).fill(0));
    // Enemy at world (0,0,0) → grid (0,0), player at world (8,0,8) → grid (4,4)
    const enemy = mockEnemy({ position: vec3(0, 0, 0) });
    const ctx = mockContext({
      playerPos: vec3(8, 0, 8),
      grid,
      gridW: 5,
      gridH: 5,
      deltaTime: 1000, // 1 second → speed*dt = 3.0 units of movement
    });

    const goal = new ChasePlayerGoal(enemy, ctx);
    goal.activate();
    expect(goal.active()).toBe(true);

    // Execute several ticks — first tick skips start waypoint, subsequent ticks move
    for (let i = 0; i < 5; i++) {
      if (goal.completed()) break;
      goal.execute();
    }
    const pos = enemy.position!;
    expect(pos.x !== 0 || pos.z !== 0).toBe(true);
  });

  it('falls back to direct mode on blocked grid', () => {
    // 3x3 grid with wall blocking path
    const grid = [
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 0],
    ];
    // Enemy at (0,0,0) → grid (0,0), player at (4,0,0) → grid (2,0)
    // Wall at column 1 blocks all paths
    const enemy = mockEnemy({ position: vec3(0, 0, 0) });
    const ctx = mockContext({
      playerPos: vec3(4, 0, 0),
      grid,
      gridW: 3,
      gridH: 3,
    });

    const goal = new ChasePlayerGoal(enemy, ctx);
    goal.activate();
    // A* returns [] — fallback mode
    goal.execute();
    // Distance is 4 > attackRange 1.8, so stays ACTIVE in fallback
    expect(goal.active()).toBe(true);
  });

  it('completes immediately when already in attack range', () => {
    // Enemy 1 unit from player, attackRange=1.8
    const enemy = mockEnemy({ position: vec3(10, 0, 9) });
    const ctx = mockContext({ playerPos: vec3(10, 0, 10) });

    const goal = new ChasePlayerGoal(enemy, ctx);
    goal.activate();
    goal.execute();
    expect(goal.completed()).toBe(true);
  });

  it('completes when reaching final waypoint', () => {
    // Tiny 2x2 grid, enemy and player on adjacent cells
    const grid = [
      [0, 0],
      [0, 0],
    ];
    // Enemy at world (0,0,0) → grid (0,0), player at world (2,0,0) → grid (1,0)
    // A* path: [[0,0],[1,0]], enemy starts at wp[0], advances to wp[1]
    const enemy = mockEnemy({
      position: vec3(0, 0, 0),
      enemy: {
        hp: 20,
        maxHp: 20,
        damage: 5,
        speed: 0.04,
        attackRange: 0.3,
        alert: true,
        attackCooldown: 0,
        scoreValue: 100,
      },
    });
    const ctx = mockContext({
      playerPos: vec3(2, 0, 0),
      grid,
      gridW: 2,
      gridH: 2,
      deltaTime: 1000, // large dt so movement covers distance
    });

    const goal = new ChasePlayerGoal(enemy, ctx);
    goal.activate();

    // Run enough execute ticks to traverse the path
    for (let i = 0; i < 10; i++) {
      if (goal.completed()) break;
      goal.execute();
    }
    expect(goal.completed()).toBe(true);
  });

  it('clears waypoints on terminate', () => {
    const grid = Array.from({ length: 3 }, () => Array(3).fill(0));
    const enemy = mockEnemy({ position: vec3(0, 0, 0) });
    const ctx = mockContext({
      playerPos: vec3(4, 0, 4),
      grid,
      gridW: 3,
      gridH: 3,
    });

    const goal = new ChasePlayerGoal(enemy, ctx);
    goal.activate();
    goal.terminate();

    // After terminate + re-activate with enemy at player pos → completes
    enemy.position = vec3(4, 0, 4);
    goal.activate();
    goal.execute();
    expect(goal.completed()).toBe(true);
  });
});
