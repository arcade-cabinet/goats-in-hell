import type { GameEntity } from 'yuka';
import { Goal } from 'yuka';
import type { Entity } from '../../../../entities/components';
import { vec3Distance } from '../../../../entities/vec3';
import { registerDamageDirection } from '../../../../ui/HUDEvents';
import { bridgeDamagePlayer } from '../../../PlayerDamageBridge';
import type { BrainContext } from '../../BrainContext';

const ATTACK_COOLDOWN_FRAMES = 60;

/**
 * AttackMeleeGoal — execute a single melee strike if in range.
 * Completes after attacking, fails if out of range.
 */
export class AttackMeleeGoal extends Goal<GameEntity> {
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
    const enemy = this.entity.enemy!;
    const dist = vec3Distance(this.entity.position!, this.ctx.playerPos);

    if (dist > enemy.attackRange) {
      this.status = Goal.STATUS.FAILED;
      return;
    }

    if (enemy.attackCooldown <= 0) {
      bridgeDamagePlayer(enemy.damage);
      if (this.entity.position) registerDamageDirection(this.entity.position);
      enemy.attackCooldown = ATTACK_COOLDOWN_FRAMES;
      this.status = Goal.STATUS.COMPLETED;
    }
  }

  terminate(): void {}
}
