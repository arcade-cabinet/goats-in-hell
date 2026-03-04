import type { GameEntity } from 'yuka';
import { Goal } from 'yuka';

/**
 * WaitForTransitionGoal — idles for a fixed duration (ms).
 * Used to pause during floor transitions, loading screens, etc.
 */
export class WaitForTransitionGoal extends Goal<GameEntity> {
  private remaining: number;

  constructor(durationMs: number) {
    super();
    this.remaining = durationMs;
  }

  activate(): void {
    this.status = Goal.STATUS.ACTIVE;
  }

  execute(dt = 16): void {
    this.remaining -= dt;
    if (this.remaining <= 0) {
      this.status = Goal.STATUS.COMPLETED;
    }
  }

  terminate(): void {}
}
