import type { GameEntity } from 'yuka';
import { Goal } from 'yuka';
import type { Entity } from '../../../../entities/components';

/**
 * IdleGoal — enemy waits until alerted by player proximity.
 * Completes when enemy.alert becomes true.
 */
export class IdleGoal extends Goal<GameEntity> {
  private entity: Entity;

  constructor(entity: Entity) {
    super();
    this.entity = entity;
  }

  activate(): void {
    this.status = Goal.STATUS.ACTIVE;
  }

  execute(): void {
    if (this.entity.enemy?.alert) {
      this.status = Goal.STATUS.COMPLETED;
    }
  }

  terminate(): void {}
}
