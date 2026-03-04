import type { GameEntity } from 'yuka';
import { GoalEvaluator } from 'yuka';

/**
 * Scores high when enemy HP is low — relevant for fireGoat (flee behavior).
 */
export class SurvivalEval extends GoalEvaluator<GameEntity> {
  private getHpRatio: () => number;

  constructor(getHpRatio: () => number, characterBias = 1) {
    super(characterBias);
    this.getHpRatio = getHpRatio;
  }

  calculateDesirability(): number {
    const hpRatio = this.getHpRatio();
    if (hpRatio > 0.3) return 0;
    return (1 - hpRatio) * this.characterBias;
  }

  setGoal(): void {}
}
