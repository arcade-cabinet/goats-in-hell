import type { GameEntity } from 'yuka';
import { Goal } from 'yuka';
import { useGameStore } from '../../../../../state/GameStore';
import type { Entity } from '../../../../entities/components';

function rng(): number {
  return useGameStore.getState().rng();
}

/**
 * TeleportGoal — instantly repositions the boss near (but not on top of) the player.
 * Used by voidGoat phase 3 to escape corners.
 */
export class TeleportGoal extends Goal<GameEntity> {
  private entity: Entity;
  private targetPos: { x: number; y: number; z: number };
  private minDist: number;
  private maxDist: number;

  constructor(
    entity: Entity,
    targetPos: { x: number; y: number; z: number },
    minDist = 4,
    maxDist = 8,
  ) {
    super();
    this.entity = entity;
    this.targetPos = targetPos;
    this.minDist = minDist;
    this.maxDist = maxDist;
  }

  activate(): void {
    this.status = Goal.STATUS.ACTIVE;
  }

  execute(): void {
    const angle = rng() * Math.PI * 2;
    const dist = this.minDist + rng() * (this.maxDist - this.minDist);
    if (this.entity.position) {
      this.entity.position.x = this.targetPos.x + Math.cos(angle) * dist;
      this.entity.position.y = this.targetPos.y;
      this.entity.position.z = this.targetPos.z + Math.sin(angle) * dist;
    }
    this.status = Goal.STATUS.COMPLETED;
  }

  terminate(): void {}
}
