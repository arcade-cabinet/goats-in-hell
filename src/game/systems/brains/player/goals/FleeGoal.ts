import type { GameEntity } from 'yuka';
import { Goal } from 'yuka';
import type { PlayerGoalDriver } from '../PlayerGoalDriver';

const FLEE_THRESHOLD = 0.15;

/**
 * FleeGoal — drives the player away from threats when HP is critically low.
 * ACTIVE while hpRatio < FLEE_THRESHOLD; COMPLETED when safe.
 */
export class FleeGoal extends Goal<GameEntity> {
  private driver: PlayerGoalDriver;

  constructor(driver: PlayerGoalDriver) {
    super();
    this.driver = driver;
  }

  activate(): void {
    this.status = Goal.STATUS.ACTIVE;
  }

  execute(dt = 16): void {
    if (this.driver.getHpRatio() >= FLEE_THRESHOLD) {
      this.status = Goal.STATUS.COMPLETED;
      return;
    }
    this.driver.execFlee(dt);
  }

  terminate(): void {}
}
