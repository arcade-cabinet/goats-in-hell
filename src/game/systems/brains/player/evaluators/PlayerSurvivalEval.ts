import type { GameEntity } from 'yuka';
import { GoalEvaluator } from 'yuka';
import { FleeGoal } from '../goals/FleeGoal';
import type { PlayerGoalDriver } from '../PlayerGoalDriver';

const FLEE_THRESHOLD = 0.15;

/**
 * PlayerSurvivalEval — spikes desirability when player HP is critically low.
 * Pushes FleeGoal when chosen by Think.arbitrate().
 */
export class PlayerSurvivalEval extends GoalEvaluator<GameEntity> {
  private getHpRatio: () => number;
  private driver: PlayerGoalDriver | null = null;

  constructor(getHpRatio: () => number, characterBias = 1.5) {
    super(characterBias);
    this.getHpRatio = getHpRatio;
  }

  setDriver(driver: PlayerGoalDriver): void {
    this.driver = driver;
  }

  calculateDesirability(_owner: GameEntity): number {
    const ratio = this.getHpRatio();
    if (ratio >= FLEE_THRESHOLD) return 0;
    return (1 - ratio) * this.characterBias;
  }

  setGoal(owner: GameEntity): void {
    if (!this.driver) return;
    const brain = (owner as any).brain;
    if (!brain) return;
    brain.clearSubgoals();
    brain.addSubgoal(new FleeGoal(this.driver));
  }
}
