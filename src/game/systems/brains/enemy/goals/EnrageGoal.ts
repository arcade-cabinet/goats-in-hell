import type { GameEntity } from 'yuka';
import { Goal } from 'yuka';
import type { Entity } from '../../../../entities/components';

/**
 * EnrageGoal — boosts enemy speed by a multiplier (boss phase transition).
 * One-shot: activates, applies boost, immediately completes.
 */
export class EnrageGoal extends Goal<GameEntity> {
  private entity: Entity;
  private speedMultiplier: number;

  constructor(entity: Entity, speedMultiplier: number) {
    super();
    this.entity = entity;
    this.speedMultiplier = speedMultiplier;
  }

  activate(): void {
    const enemy = this.entity.enemy;
    if (enemy) {
      enemy.speed *= this.speedMultiplier;
    }
    this.status = Goal.STATUS.COMPLETED;
  }

  execute(): void {}

  terminate(): void {}
}
