import type { GameEntity } from 'yuka';
import { CompositeGoal, Goal } from 'yuka';
import type { PlayerGoalDriver } from '../PlayerGoalDriver';
import { ClearFloorGoal } from './ClearFloorGoal';

/**
 * ClearCircleGoal — composite goal for clearing a single Dante circle.
 * Pushes ClearFloorGoal sub-goals for each floor/encounter type.
 */
export class ClearCircleGoal extends CompositeGoal<GameEntity> {
  private circleNumber: number;
  private driver: PlayerGoalDriver;

  constructor(circleNumber: number, driver: PlayerGoalDriver) {
    super();
    this.circleNumber = circleNumber;
    this.driver = driver;
  }

  activate(): void {
    this.clearSubgoals();
    // Push one ClearFloorGoal for the explore floor + one for the arena/boss
    this.addSubgoal(new ClearFloorGoal(this.driver));
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

  get circle(): number {
    return this.circleNumber;
  }
}
