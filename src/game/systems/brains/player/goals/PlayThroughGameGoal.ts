import type { GameEntity } from 'yuka';
import { CompositeGoal, Goal } from 'yuka';
import type { PlayerGoalDriver } from '../PlayerGoalDriver';
import { ClearCircleGoal } from './ClearCircleGoal';

/**
 * PlayThroughGameGoal — top-level composite goal for a full 9-circle run.
 * Pushes ClearCircleGoal(1) through ClearCircleGoal(9) in sequence.
 */
export class PlayThroughGameGoal extends CompositeGoal<GameEntity> {
  private driver: PlayerGoalDriver;

  constructor(driver: PlayerGoalDriver) {
    super();
    this.driver = driver;
  }

  activate(): void {
    this.clearSubgoals();
    for (let circle = 1; circle <= 9; circle++) {
      this.addSubgoal(new ClearCircleGoal(circle, this.driver));
    }
    this.status = Goal.STATUS.ACTIVE;
  }

  execute(dt = 16): void {
    const status = this.executeSubgoals();
    if (status === Goal.STATUS.COMPLETED) {
      this.status = Goal.STATUS.COMPLETED;
    } else if (status === Goal.STATUS.FAILED) {
      this.status = Goal.STATUS.FAILED;
    }
    void dt;
  }

  terminate(): void {
    this.clearSubgoals();
  }
}
