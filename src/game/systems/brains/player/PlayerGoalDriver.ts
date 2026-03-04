/**
 * PlayerGoalDriver — abstraction over the movement/combat helpers that player
 * goals delegate to. Implemented by AIGovernor (or a test mock).
 *
 * Goals call these methods to produce movement output. The driver owns the
 * YUKA vehicle, pathfinding grid, and output frame state.
 */
export interface PlayerGoalDriver {
  /** Execute hunt-mode movement (approach + strafe + shoot nearest enemy). */
  execHunt(dt: number): void;

  /** Execute flee-mode movement (run away from nearest threat). */
  execFlee(dt: number): void;

  /** Execute seek-pickup movement (navigate toward nearest pickup). */
  execSeekPickup(dt: number): void;

  /** Execute explore-mode movement (wander/pathfind toward unseen area). */
  execExplore(dt: number): void;

  /** Return player HP as a ratio 0..1. */
  getHpRatio(): number;

  /** Return count of live, alert enemies on the current floor. */
  getEnemyCount(): number;

  /** Return true if at least one pickup (health/ammo/weapon) is available. */
  hasPickupAvailable(): boolean;
}
