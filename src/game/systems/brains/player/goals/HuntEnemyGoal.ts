import type { GameEntity } from 'yuka';
import { Goal } from 'yuka';
import type { PlayerGoalDriver } from '../PlayerGoalDriver';

/**
 * HuntEnemyGoal — drives the player toward and engaging the nearest enemy.
 * ACTIVE while enemies remain on the floor; COMPLETED when floor is clear.
 */
export class HuntEnemyGoal extends Goal<GameEntity> {
  private driver: PlayerGoalDriver;
  private dt = 16;

  constructor(driver: PlayerGoalDriver) {
    super();
    this.driver = driver;
  }

  /** Called by WaitForTransitionGoal and ClearFloorGoal to pass dt each tick. */
  setDt(dt: number): void {
    this.dt = dt;
  }

  activate(): void {
    this.status = Goal.STATUS.ACTIVE;
  }

  execute(dt = this.dt): void {
    if (this.driver.getEnemyCount() === 0) {
      this.status = Goal.STATUS.COMPLETED;
      return;
    }
    this.driver.execHunt(dt);
  }

  terminate(): void {}
}
