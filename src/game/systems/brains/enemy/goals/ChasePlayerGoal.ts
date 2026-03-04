import type { GameEntity } from 'yuka';
import { Goal } from 'yuka';
import type { Entity } from '../../../../entities/components';
import { vec3Distance } from '../../../../entities/vec3';
import type { BrainContext } from '../../BrainContext';

/**
 * ChasePlayerGoal — move toward player using YUKA vehicle steering.
 * Active while distance > attackRange. Vehicle steering is handled
 * externally by the shared EntityManager in AISystem.
 *
 * This goal doesn't drive movement directly — it signals INTENT.
 * The AISystem loop reads the active goal type to configure steering.
 */
export class ChasePlayerGoal extends Goal<GameEntity> {
  private entity: Entity;
  private ctx: BrainContext;

  constructor(entity: Entity, ctx: BrainContext) {
    super();
    this.entity = entity;
    this.ctx = ctx;
  }

  activate(): void {
    this.status = Goal.STATUS.ACTIVE;
  }

  execute(): void {
    const dist = vec3Distance(this.entity.position!, this.ctx.playerPos);
    if (dist <= this.entity.enemy!.attackRange) {
      this.status = Goal.STATUS.COMPLETED;
    }
    // Otherwise stays ACTIVE — steering handles movement
  }

  terminate(): void {}
}
