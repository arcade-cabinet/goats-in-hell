/**
 * PlayerBrain — player goal lifecycle and composite decomposition tests.
 */
import { PlayerSurvivalEval } from '../brains/player/evaluators/PlayerSurvivalEval';
import { PlayThroughEval } from '../brains/player/evaluators/PlayThroughEval';
import { ClearFloorGoal } from '../brains/player/goals/ClearFloorGoal';
import { FleeGoal } from '../brains/player/goals/FleeGoal';
import { HuntEnemyGoal } from '../brains/player/goals/HuntEnemyGoal';
import { PlayThroughGameGoal } from '../brains/player/goals/PlayThroughGameGoal';
import { WaitForTransitionGoal } from '../brains/player/goals/WaitForTransitionGoal';
import type { PlayerGoalDriver } from '../brains/player/PlayerGoalDriver';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mockDriver(overrides?: Partial<PlayerGoalDriver>): PlayerGoalDriver {
  return {
    execHunt: jest.fn(),
    execFlee: jest.fn(),
    execSeekPickup: jest.fn(),
    execExplore: jest.fn(),
    getHpRatio: jest.fn().mockReturnValue(1.0),
    getEnemyCount: jest.fn().mockReturnValue(3),
    hasPickupAvailable: jest.fn().mockReturnValue(false),
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('HuntEnemyGoal', () => {
  it('calls driver.execHunt and stays ACTIVE while enemies remain', () => {
    const driver = mockDriver({ getEnemyCount: jest.fn().mockReturnValue(2) });
    const goal = new HuntEnemyGoal(driver);
    goal.activate();
    goal.execute();
    expect(driver.execHunt).toHaveBeenCalled();
    expect(goal.active()).toBe(true);
  });

  it('completes when enemy count drops to zero', () => {
    const driver = mockDriver({ getEnemyCount: jest.fn().mockReturnValue(0) });
    const goal = new HuntEnemyGoal(driver);
    goal.activate();
    goal.execute();
    expect(goal.completed()).toBe(true);
  });
});

describe('FleeGoal', () => {
  it('stays ACTIVE while HP is critically low', () => {
    const driver = mockDriver({ getHpRatio: jest.fn().mockReturnValue(0.1) });
    const goal = new FleeGoal(driver);
    goal.activate();
    goal.execute();
    expect(driver.execFlee).toHaveBeenCalled();
    expect(goal.active()).toBe(true);
  });

  it('completes when HP recovers above flee threshold', () => {
    const driver = mockDriver({ getHpRatio: jest.fn().mockReturnValue(0.5) });
    const goal = new FleeGoal(driver);
    goal.activate();
    goal.execute();
    expect(goal.completed()).toBe(true);
  });
});

describe('WaitForTransitionGoal', () => {
  it('completes after duration elapses', () => {
    const goal = new WaitForTransitionGoal(500);
    goal.activate();
    // Simulate 600ms of ticks
    for (let i = 0; i < 10; i++) goal.execute(60);
    expect(goal.completed()).toBe(true);
  });

  it('stays ACTIVE while duration has not elapsed', () => {
    const goal = new WaitForTransitionGoal(500);
    goal.activate();
    goal.execute(50); // only 50ms elapsed
    expect(goal.active()).toBe(true);
  });
});

describe('ClearFloorGoal', () => {
  it('pushes HuntEnemyGoal as its first subgoal', () => {
    const driver = mockDriver({ getEnemyCount: jest.fn().mockReturnValue(5) });
    const goal = new ClearFloorGoal(driver);
    goal.activate();
    expect(goal.subgoals.length).toBeGreaterThan(0);
    expect(goal.subgoals[0]).toBeInstanceOf(HuntEnemyGoal);
  });

  it('completes when all sub-goals complete', () => {
    const driver = mockDriver({ getEnemyCount: jest.fn().mockReturnValue(0) });
    const goal = new ClearFloorGoal(driver);
    goal.activate();
    goal.execute();
    expect(goal.completed()).toBe(true);
  });
});

describe('PlayThroughGameGoal', () => {
  it('pushes 9 circle sub-goals', () => {
    const driver = mockDriver();
    const goal = new PlayThroughGameGoal(driver);
    goal.activate();
    expect(goal.subgoals.length).toBe(9);
  });
});

describe('PlayThroughEval', () => {
  it('always returns 1.0', () => {
    const eval_ = new PlayThroughEval();
    expect(eval_.calculateDesirability({} as any)).toBe(1.0);
  });
});

describe('PlayerSurvivalEval', () => {
  it('returns 0 when HP is healthy', () => {
    const eval_ = new PlayerSurvivalEval(() => 0.8);
    expect(eval_.calculateDesirability({} as any)).toBe(0);
  });

  it('returns high desirability when HP is critically low', () => {
    const eval_ = new PlayerSurvivalEval(() => 0.1);
    const score = eval_.calculateDesirability({} as any);
    expect(score).toBeGreaterThan(0.8);
  });
});
