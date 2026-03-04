import type { GameEntity } from 'yuka';
import { GoalEvaluator } from 'yuka';
import { PlayThroughGameGoal } from '../goals/PlayThroughGameGoal';
import type { PlayerGoalDriver } from '../PlayerGoalDriver';

/**
 * PlayThroughEval — primary evaluator for the autoplay player brain.
 * Always returns 1.0 so the PlayThroughGameGoal is the baseline objective.
 */
export class PlayThroughEval extends GoalEvaluator<GameEntity> {
  private driver: PlayerGoalDriver | null = null;

  setDriver(driver: PlayerGoalDriver): void {
    this.driver = driver;
  }

  calculateDesirability(_owner: GameEntity): number {
    return 1.0;
  }

  setGoal(owner: GameEntity): void {
    if (!this.driver) return;
    const brain = (owner as any).brain;
    if (!brain) return;
    brain.clearSubgoals();
    brain.addSubgoal(new PlayThroughGameGoal(this.driver));
  }
}
