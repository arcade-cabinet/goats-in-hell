import type { GameEntity } from 'yuka';
import { Goal } from 'yuka';
import type { Entity } from '../../../../entities/components';
import { vec3Distance, vec3Subtract } from '../../../../entities/vec3';
import { spawnEnemyProjectile } from '../../../EnemyProjectileBridge';
import type { BrainContext } from '../../BrainContext';

const RANGED_ATTACK_RANGE = 15;

/**
 * AttackRangedGoal — fire a single aimed projectile at the player.
 * Completes after firing, fails if out of range.
 */
export class AttackRangedGoal extends Goal<GameEntity> {
  private entity: Entity;
  private ctx: BrainContext;
  private damage: number;
  private speed: number;

  constructor(entity: Entity, ctx: BrainContext, damage: number, speed = 0.08) {
    super();
    this.entity = entity;
    this.ctx = ctx;
    this.damage = damage;
    this.speed = speed;
  }

  activate(): void {
    this.status = Goal.STATUS.ACTIVE;
  }

  execute(): void {
    const dist = vec3Distance(this.entity.position!, this.ctx.playerPos);
    if (dist > RANGED_ATTACK_RANGE) {
      this.status = Goal.STATUS.FAILED;
      return;
    }

    const diff = vec3Subtract(this.ctx.playerPos, this.entity.position!);
    const len = Math.sqrt(diff.x * diff.x + diff.y * diff.y + diff.z * diff.z);
    if (len > 0) {
      diff.x /= len;
      diff.y /= len;
      diff.z /= len;
    }
    spawnEnemyProjectile(this.entity.position!, diff, this.damage, this.speed);
    this.status = Goal.STATUS.COMPLETED;
  }

  terminate(): void {}
}
