import type { GameEntity } from 'yuka';
import { CompositeGoal, Goal } from 'yuka';
import type { PlayerGoalDriver } from '../PlayerGoalDriver';
import { HuntEnemyGoal } from './HuntEnemyGoal';

/**
 * ClearFloorGoal — composite goal that hunts all enemies on the current floor.
 * Pushes a HuntEnemyGoal; completes when the floor is clear.
 */
export class ClearFloorGoal extends CompositeGoal<GameEntity> {
  private driver: PlayerGoalDriver;

  constructor(driver: PlayerGoalDriver) {
    super();
    this.driver = driver;
  }

  activate(): void {
    this.clearSubgoals();
    this.addSubgoal(new HuntEnemyGoal(this.driver));
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
