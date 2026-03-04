import type { GameEntity } from 'yuka';
import { GoalEvaluator } from 'yuka';

/**
 * Scores high when the enemy should be attacking (always aggressive for basic goats).
 */
export class AggressionEval extends GoalEvaluator<GameEntity> {
  calculateDesirability(): number {
    return 0.7 * this.characterBias;
  }

  setGoal(): void {
    // Brain factory's composite goal handles decomposition
  }
}
