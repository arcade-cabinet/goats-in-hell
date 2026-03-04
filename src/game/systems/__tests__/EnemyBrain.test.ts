jest.mock('../AudioSystem', () => ({ playSound: jest.fn() }));
jest.mock('../GameClock', () => ({ getGameTime: jest.fn(() => 0) }));
jest.mock('../PlayerDamageBridge', () => ({ bridgeDamagePlayer: jest.fn() }));
jest.mock('../../ui/HUDEvents', () => ({ registerDamageDirection: jest.fn() }));

import type { Entity } from '../../entities/components';
import { vec3 } from '../../entities/vec3';
import { createEnemyBrain } from '../brains/enemy/EnemyBrainFactory';

function mockGoat(): Entity {
  return {
    id: 'goat-1',
    type: 'goat',
    position: vec3(10, 0, 10),
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
  };
}

describe('EnemyBrainFactory', () => {
  it('creates a Think brain with evaluators for a basic goat', () => {
    const entity = mockGoat();
    const brain = createEnemyBrain(entity);
    expect(brain).toBeDefined();
    expect(brain.evaluators.length).toBeGreaterThanOrEqual(1);
  });

  it('creates a brain for fireGoat with survival evaluator', () => {
    const entity = mockGoat();
    entity.type = 'fireGoat';
    const brain = createEnemyBrain(entity);
    expect(brain.evaluators.length).toBeGreaterThanOrEqual(2);
  });
});
