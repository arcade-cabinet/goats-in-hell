import type { GameEntity } from 'yuka';
import { Goal } from 'yuka';
import { useGameStore } from '../../../../../state/GameStore';
import type { Entity, EntityType } from '../../../../entities/components';
import { vec3 } from '../../../../entities/vec3';
import { world } from '../../../../entities/world';
import { getGameTime } from '../../../GameClock';
import { trackEnemySpawn } from '../../../ProgressionSystem';

function rng(): number {
  return useGameStore.getState().rng();
}

export interface SummonMinionsConfig {
  maxMinions: number;
  minionIdPrefix: string;
  minionType: EntityType;
  minionHp: number;
  spawnRadius: number;
}

/**
 * SummonMinionsGoal — spawns minions around the boss if under the cap.
 * One-shot: checks cap, spawns up to limit, completes.
 */
export class SummonMinionsGoal extends Goal<GameEntity> {
  private entity: Entity;
  private config: SummonMinionsConfig;

  constructor(entity: Entity, config: SummonMinionsConfig) {
    super();
    this.entity = entity;
    this.config = config;
  }

  activate(): void {
    this.status = Goal.STATUS.ACTIVE;
  }

  execute(): void {
    const { maxMinions, minionIdPrefix, minionType, minionHp, spawnRadius } = this.config;
    const existing = world.entities.filter((e) => e.id?.startsWith(minionIdPrefix)).length;

    if (existing >= maxMinions) {
      this.status = Goal.STATUS.COMPLETED;
      return;
    }

    const ox = (rng() - 0.5) * spawnRadius;
    const oz = (rng() - 0.5) * spawnRadius;
    world.add({
      id: `${minionIdPrefix}-${getGameTime().toFixed(0)}-${rng().toString(36).slice(2, 6)}`,
      type: minionType,
      position: vec3(
        this.entity.position!.x + ox,
        this.entity.position!.y,
        this.entity.position!.z + oz,
      ),
      enemy: {
        hp: minionHp,
        maxHp: minionHp,
        damage: 5,
        speed: 0.04,
        attackRange: 1.8,
        alert: true,
        attackCooldown: 0,
        scoreValue: 50,
      },
    });
    trackEnemySpawn();
    this.status = Goal.STATUS.COMPLETED;
  }

  terminate(): void {}
}
