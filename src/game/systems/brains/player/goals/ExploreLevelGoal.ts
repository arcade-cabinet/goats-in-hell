import type { GameEntity } from 'yuka';
import { Goal } from 'yuka';
import type { PlayerGoalDriver } from '../PlayerGoalDriver';

/**
 * ExploreLevelGoal — wanders the level searching for enemies.
 * COMPLETED when enemies are found (transitions caller back to hunt).
 */
export class ExploreLevelGoal extends Goal<GameEntity> {
  private driver: PlayerGoalDriver;

  constructor(driver: PlayerGoalDriver) {
    super();
    this.driver = driver;
  }

  activate(): void {
    this.status = Goal.STATUS.ACTIVE;
  }

  execute(dt = 16): void {
    if (this.driver.getEnemyCount() > 0) {
      // Enemies found — signal that a HuntEnemyGoal should take over
      this.status = Goal.STATUS.COMPLETED;
      return;
    }
    this.driver.execExplore(dt);
  }

  terminate(): void {}
}
