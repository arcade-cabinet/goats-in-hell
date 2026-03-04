import type { GameEntity, Think } from 'yuka';

/**
 * BrainRegistry — manages Think brain lifecycle for all AI-controlled entities.
 *
 * Each entity (enemy or autoplay player) gets a Think brain registered by
 * entity ID. The registry ticks all brains once per frame.
 */
export class BrainRegistry {
  private brains = new Map<string, Think<GameEntity>>();

  register(entityId: string, brain: Think<GameEntity>): void {
    this.brains.set(entityId, brain);
  }

  unregister(entityId: string): void {
    const brain = this.brains.get(entityId);
    if (brain) {
      brain.terminate();
      this.brains.delete(entityId);
    }
  }

  get(entityId: string): Think<GameEntity> | undefined {
    return this.brains.get(entityId);
  }

  get size(): number {
    return this.brains.size;
  }

  /** Tick all registered brains. Call once per frame after steering. */
  updateAll(): void {
    for (const brain of this.brains.values()) {
      brain.execute();
    }
  }

  /** Clear all brains (floor transition). */
  reset(): void {
    for (const brain of this.brains.values()) {
      brain.terminate();
    }
    this.brains.clear();
  }
}

/** Singleton brain registry. */
export const brainRegistry = new BrainRegistry();
