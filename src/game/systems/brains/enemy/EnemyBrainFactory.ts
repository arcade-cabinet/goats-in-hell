import type { GameEntity } from 'yuka';
import { Think } from 'yuka';
import type { Entity } from '../../../entities/components';
import { AggressionEval } from './evaluators/AggressionEval';
import { SurvivalEval } from './evaluators/SurvivalEval';

/** Enemy types that can flee when low HP. */
const FLEE_TYPES = ['fireGoat', 'archGoat', 'infernoGoat', 'voidGoat', 'ironGoat'];

/**
 * Creates a Think brain configured for the given enemy entity type.
 * Basic goats get aggression only. Ranged/boss types also evaluate survival.
 */
export function createEnemyBrain(entity: Entity): Think<GameEntity> {
  const brain = new Think<GameEntity>();

  // All enemies get aggression
  brain.addEvaluator(new AggressionEval(1));

  // Ranged/boss types also evaluate survival (flee when low HP)
  if (entity.type && FLEE_TYPES.includes(entity.type)) {
    brain.addEvaluator(
      new SurvivalEval(() => {
        const e = entity.enemy;
        return e ? e.hp / e.maxHp : 1;
      }, 1.2),
    );
  }

  return brain;
}
