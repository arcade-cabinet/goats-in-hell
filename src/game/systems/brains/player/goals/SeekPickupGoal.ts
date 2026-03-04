import type { GameEntity } from 'yuka';
import { Goal } from 'yuka';
import type { PlayerGoalDriver } from '../PlayerGoalDriver';

/**
 * SeekPickupGoal — drives the player toward the nearest pickup (health/ammo/weapon).
 * COMPLETED when no pickup is available (collected or none found).
 */
export class SeekPickupGoal extends Goal<GameEntity> {
  private driver: PlayerGoalDriver;

  constructor(driver: PlayerGoalDriver) {
    super();
    this.driver = driver;
  }

  activate(): void {
    this.status = Goal.STATUS.ACTIVE;
  }

  execute(dt = 16): void {
    if (!this.driver.hasPickupAvailable()) {
      this.status = Goal.STATUS.COMPLETED;
      return;
    }
    this.driver.execSeekPickup(dt);
  }

  terminate(): void {}
}
