import type { GameEntity } from 'yuka';
import { Goal } from 'yuka';
import type { Entity } from '../../../../entities/components';
import { vec3, vec3Subtract } from '../../../../entities/vec3';
import { spawnEnemyProjectile } from '../../../EnemyProjectileBridge';
import type { BrainContext } from '../../BrainContext';

export interface AoeAttackConfig {
  projectileCount: number;
  damage: number;
  speed: number;
  cooldownFrames: number;
}

/**
 * AoeAttackGoal — fires a ring of projectiles outward from the boss.
 * One-shot: fires on execute(), completes immediately.
 */
export class AoeAttackGoal extends Goal<GameEntity> {
  private entity: Entity;
  private ctx: BrainContext;
  private config: AoeAttackConfig;

  constructor(entity: Entity, ctx: BrainContext, config: AoeAttackConfig) {
    super();
    this.entity = entity;
    this.ctx = ctx;
    this.config = config;
  }

  activate(): void {
    this.status = Goal.STATUS.ACTIVE;
  }

  execute(): void {
    const { projectileCount, damage, speed } = this.config;
    const origin = this.entity.position!;
    const angleStep = (Math.PI * 2) / projectileCount;

    for (let i = 0; i < projectileCount; i++) {
      const angle = i * angleStep;
      const dir = vec3(Math.sin(angle), 0, Math.cos(angle));
      spawnEnemyProjectile(origin, dir, damage, speed);
    }

    this.status = Goal.STATUS.COMPLETED;
  }

  terminate(): void {}
}
