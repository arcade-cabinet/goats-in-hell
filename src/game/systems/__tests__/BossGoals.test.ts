jest.mock('../AudioSystem', () => ({ playSound: jest.fn() }));
jest.mock('../GameClock', () => ({ getGameTime: jest.fn(() => 5000) }));
jest.mock('../PlayerDamageBridge', () => ({ bridgeDamagePlayer: jest.fn() }));
jest.mock('../EnemyProjectileBridge', () => ({ spawnEnemyProjectile: jest.fn() }));
jest.mock('../../ui/HUDEvents', () => ({ registerDamageDirection: jest.fn() }));

import type { Entity } from '../../entities/components';
import { vec3 } from '../../entities/vec3';
import { BossPhaseEval } from '../brains/enemy/evaluators/BossPhaseEval';
import { AoeAttackGoal } from '../brains/enemy/goals/AoeAttackGoal';
import { EnrageGoal } from '../brains/enemy/goals/EnrageGoal';

function mockBoss(hp: number, maxHp: number): Entity {
  return {
    id: 'boss-1',
    type: 'archGoat',
    position: vec3(10, 0, 10),
    enemy: {
      hp,
      maxHp,
      damage: 15,
      speed: 0.05,
      attackRange: 2.0,
      alert: true,
      attackCooldown: 0,
      scoreValue: 500,
    },
  };
}

describe('BossPhaseEval', () => {
  it('returns 0 desirability when above threshold', () => {
    const boss = mockBoss(100, 100);
    const eval_ = new BossPhaseEval(() => boss.enemy!.hp / boss.enemy!.maxHp, 0.5);
    expect(eval_.calculateDesirability()).toBe(0);
  });

  it('returns high desirability when below threshold', () => {
    const boss = mockBoss(40, 100);
    const eval_ = new BossPhaseEval(() => boss.enemy!.hp / boss.enemy!.maxHp, 0.5);
    expect(eval_.calculateDesirability()).toBeGreaterThan(0.5);
  });
});

describe('EnrageGoal', () => {
  it('boosts enemy speed on activation', () => {
    const boss = mockBoss(20, 100);
    const originalSpeed = boss.enemy!.speed;
    const goal = new EnrageGoal(boss, 1.5);
    goal.activate();
    expect(boss.enemy!.speed).toBe(originalSpeed * 1.5);
    expect(goal.completed()).toBe(true);
  });
});

describe('AoeAttackGoal', () => {
  it('fires when cooldown is ready', () => {
    const boss = mockBoss(20, 100);
    const ctx = {
      playerPos: vec3(12, 0, 10),
      deltaTime: 16,
      dtScale: 1,
      gameTime: 5000,
    } as any;
    const goal = new AoeAttackGoal(boss, {
      projectileCount: 12,
      damage: 8,
      speed: 0.07,
      cooldownFrames: 360,
    });
    goal.activate();
    goal.execute();
    expect(goal.completed()).toBe(true);
  });
});
