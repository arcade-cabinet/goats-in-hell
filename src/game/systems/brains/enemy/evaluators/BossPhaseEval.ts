import type { GameEntity } from 'yuka';
import { GoalEvaluator } from 'yuka';

/**
 * Triggers phase transition goals when boss HP drops below a threshold.
 */
export class BossPhaseEval extends GoalEvaluator<GameEntity> {
  private getHpRatio: () => number;
  private threshold: number;

  constructor(getHpRatio: () => number, threshold: number, characterBias = 1) {
    super(characterBias);
    this.getHpRatio = getHpRatio;
    this.threshold = threshold;
  }

  calculateDesirability(): number {
    const hpRatio = this.getHpRatio();
    if (hpRatio > this.threshold) return 0;
    return (1 - hpRatio) * this.characterBias;
  }

  setGoal(): void {}
}
