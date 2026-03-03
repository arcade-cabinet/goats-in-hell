---
title: "AI Governor Overhaul — Goal-Driven Agent Design"
status: superseded
created: "2026-03-01"
updated: "2026-03-01"
domain: plans
plan_type: design
implements: null
related:
  - src/game/systems/AIGovernor.ts
  - src/r3f/input/providers/AIProvider.ts
  - src/state/GameStore.ts
  - src/game/systems/ProgressionSystem.ts
  - src/ui/AutoplayOverlay.tsx
  - src/App.tsx
---

# AI Governor Overhaul — Design Document

## Vision

Replace the reactive 4-state machine (`hunt/heal/flee/explore`) with a hierarchical goal-driven agent that can autonomously play through all 9 circles of Hell as a tool-assisted speedrun. The governor should understand progression (circles, encounter types, boss phases), capture screenshots at pivotal moments, and produce a complete run report.

## Current System (What We're Replacing)

The existing `AIGovernor` (990 lines) is a flat reactive state machine:

- **4 states:** hunt, heal, flee, explore — evaluated every 200ms
- **No progression awareness:** Doesn't know what circle it's in, what encounter type is active, or how to handle boss phases
- **No cross-floor memory:** State resets completely on each level load
- **No screenshot capability:** Can't capture pivotal moments
- **BFS pathfinding:** Correct but no heuristic (A* would be faster on large grids)
- **Babylon.js coordinate legacy:** All coordinates are Babylon-convention, converted by `AIProvider`
- **Screen transitions handled externally:** `App.tsx` auto-advances through victory/bossIntro/gameComplete screens with hardcoded timeouts

The governor works well enough for single-floor testing but can't do a coherent 9-circle run with any intelligence about what's happening.

## Architecture: YUKA Goal-Driven Agent Design

Use YUKA's built-in `Think` → `GoalEvaluator` → `CompositeGoal` → `Goal` hierarchy, which implements the Goal-Driven Agent Design pattern from "Programming Game AI by Example" (Buckland, Ch. 9).

### Three-Tier Goal Hierarchy

```
Think (brain)
 ├─ GoalEvaluator: PlayThroughGameEval (desirability: always 1.0)
 │   └─ CompositeGoal: PlayThroughGame
 │       ├─ ClearCircle(1) → ClearCircle(2) → ... → ClearCircle(9)
 │       │   ├─ ClearExploreFloor  (encounter: explore)
 │       │   ├─ SurviveArena       (encounter: arena)
 │       │   └─ DefeatBoss         (encounter: boss)
 │       └─ CaptureVictoryScreenshot (after each circle)
 │
 └─ GoalEvaluator: SurvivalEval (desirability: spikes when HP critical)
     └─ CompositeGoal: Survive
         ├─ FleeFromThreat
         └─ SeekHealth
```

### Tier 1: Strategic Goals (CompositeGoal)

**PlayThroughGame** — Top-level goal. Pushes `ClearCircle(N)` subgoals for circles 1-9. Monitors `GameStore.circleNumber` and `GameStore.screen` to know when to advance. Captures run-level stats (total time, deaths, kills per circle).

**ClearCircle(N)** — Reads the circle's encounter sequence from `GameStore.stage` and decomposes into the correct sub-goals. Circle completion is detected when `advanceStage()` advances `circleNumber`.

### Tier 2: Tactical Goals (CompositeGoal)

**ClearExploreFloor** — Kill all enemies on an explore floor. Uses existing hunt/explore behavior. Completes when `checkFloorComplete()` returns true.

**SurviveArena** — Track arena waves via `GameStore.stage.arenaWave`. Prioritize survival (heal when possible), fight aggressively to trigger next wave. Completes when the arena encounter ends.

**DefeatBoss** — Boss-specific tactics:
- Phase 1 (HP > 50%): Aggressive — close range, high-DPS weapons
- Phase 2 (HP ≤ 50%): Cautious — maintain distance, dodge patterns, heal between attacks
- Weapon selection: Always use highest-DPS available weapon against bosses
- Completes when boss entity is removed from world

### Tier 3: Behavioral Goals (Leaf Goal)

These are thin wrappers around the existing `AIGovernor` movement/combat code:

| Goal | Existing Code Reused | Completion Condition |
|------|---------------------|---------------------|
| `HuntEnemy` | `execHunt()` | Target dead or unreachable |
| `SeekPickup` | `execHeal()` | Pickup collected or gone |
| `FleeFromThreat` | `execFlee()` | Distance > FLEE_DISTANCE * 2 |
| `ExploreLevel` | `execExplore()` | Enemy found (transitions to hunt) |
| `WaitForTransition` | No-op | Screen returns to 'playing' |

### Goal Evaluation Cycle

The `Think` brain runs `arbitrate()` every 200ms (same as current `DECISION_INTERVAL`):

1. Each `GoalEvaluator` scores desirability (0-1)
2. `PlayThroughGameEval`: always 1.0 (this is the primary objective)
3. `SurvivalEval`: `1.5 * (1 - hpRatio)` when `hpRatio < 0.2` — spikes above 1.0 to override PlayThrough when critically low HP
4. Winning evaluator sets its top-level goal via `setGoal()`
5. Subgoals decompose and execute via YUKA's `executeSubgoals()` stack

## Screenshot System

### Trigger Points

Screenshots are captured at goal transitions — natural "pivotal moments":

| Event | Trigger | Filename Pattern |
|-------|---------|-----------------|
| Circle start | `ClearCircle.activate()` | `circle-{N}-start-{timestamp}.png` |
| Boss encounter start | `DefeatBoss.activate()` | `circle-{N}-boss-start-{timestamp}.png` |
| Boss defeated | `DefeatBoss.terminate()` (completed) | `circle-{N}-boss-defeated-{timestamp}.png` |
| Player death | `SurvivalEval` detects death screen | `circle-{N}-death-{timestamp}.png` |
| Game complete | `PlayThroughGame` completes | `game-complete-{timestamp}.png` |
| Arena clear | `SurviveArena.terminate()` | `circle-{N}-arena-clear-{timestamp}.png` |

### Capture Method

```typescript
function captureScreenshot(filename: string): void {
  const canvas = document.querySelector('canvas');
  if (!canvas) return;

  // R3F renders to WebGL canvas — toDataURL captures current frame
  const dataUrl = canvas.toDataURL('image/png');

  // Store in run report (in-memory) + optionally download
  runReport.screenshots.push({ filename, dataUrl, timestamp: Date.now() });

  // Auto-download if ?autoplay=screenshots
  if (shouldDownload) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  }
}
```

**Canvas capture timing:** Screenshots must be taken DURING a `useFrame` callback (after render) to ensure the frame is complete. The goal system will set a `pendingScreenshot` flag, and a `useFrame` hook will capture after the next render.

## Run Report

The governor accumulates a `RunReport` object across the entire 9-circle run:

```typescript
interface RunReport {
  seed: string;
  difficulty: string;
  startTime: number;
  endTime: number;
  totalDeaths: number;
  circleReports: CircleReport[];
  screenshots: ScreenshotEntry[];
}

interface CircleReport {
  circleNumber: number;
  startTime: number;
  endTime: number;
  deaths: number;
  kills: number;
  encounterBreakdown: {
    explore: { floors: number; time: number };
    arena: { waves: number; time: number };
    boss: { attempts: number; time: number };
  };
}

interface ScreenshotEntry {
  filename: string;
  dataUrl: string;
  timestamp: number;
  circleNumber: number;
  event: string;
}
```

The report is logged to console as JSON when the run completes and optionally downloaded as `run-report-{seed}.json`.

## Progression Awareness

The governor reads `GameStore` state to understand where it is in the game:

```typescript
// Read once per decision cycle (200ms)
const { circleNumber, stage, screen } = useGameStore.getState();
const { encounterType, stageNumber, arenaWave, bossId } = stage;
```

### Screen State Handling

The governor needs to be aware of screen transitions (currently handled by `App.tsx` auto-advance timeouts):

| Screen | Governor Behavior |
|--------|------------------|
| `playing` | Execute current goal normally |
| `victory` | `WaitForTransition` goal — no-op until App.tsx advances |
| `bossIntro` | `WaitForTransition` goal — capture boss-start screenshot |
| `dead` | Log death, wait for auto-restart, resume at circle start |
| `gameComplete` | Finalize run report, capture screenshot |
| `paused` | Should not happen in autoplay mode |

### Level Reload Detection

When `App.tsx` advances to the next stage, R3F unmounts and remounts the level. The governor is recreated via the `useEffect` in `R3FRoot.tsx`. The NEW governor instance needs to inherit the run report and circle progress from the previous instance.

**Solution:** Store `RunReport` on `window.__aiRunReport` (module-level singleton). New governor instances read it on construction. The goal hierarchy reconstructs from the current `GameStore` state.

## Pathfinding Upgrade: BFS → A*

Replace the current BFS with A* using Manhattan distance heuristic. This is a direct improvement with no behavioral change — same paths, faster computation on large grids.

```typescript
// Priority queue entry
interface AStarNode {
  x: number;
  y: number;
  g: number;  // cost from start
  f: number;  // g + h (total estimated cost)
}

// Heuristic: octile distance (allows diagonals)
function heuristic(x0: number, y0: number, x1: number, y1: number): number {
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy);
}
```

Uses a binary min-heap for the open set. Expected 3-5x speedup on large circle grids (some rooms are 20x20+ cells).

## AutoplayOverlay Integration

The existing `AutoplayOverlay.tsx` reads `window.__aiGovernor` but this is never exposed. We'll:

1. Expose the governor: `window.__aiGovernor = governor` in `R3FRoot.tsx`
2. Extend `AIDebugInfo` with goal hierarchy state:

```typescript
interface AIDebugInfo {
  // Existing
  state: AIState;
  targetType: string;
  targetDist: number;
  weapon: string;
  steering: string;
  // New
  activeGoal: string;        // e.g., "ClearCircle(3) > DefeatBoss > HuntEnemy"
  circleNumber: number;
  encounterType: string;
  runStats: {
    deaths: number;
    circlesCleared: number;
    elapsedTime: number;
  };
}
```

## File Structure

```
src/game/systems/
  AIGovernor.ts           — Refactored: keeps movement/combat/pathfinding helpers
  goals/
    PlayThroughGame.ts    — Strategic: 9-circle sequence
    ClearCircle.ts        — Strategic: single circle (explore → arena → boss)
    ClearExploreFloor.ts  — Tactical: kill all enemies on explore floor
    SurviveArena.ts       — Tactical: survive arena waves
    DefeatBoss.ts         — Tactical: boss-specific combat
    HuntEnemy.ts          — Behavioral: engage single enemy
    SeekPickup.ts         — Behavioral: navigate to pickup
    FleeFromThreat.ts     — Behavioral: retreat from danger
    ExploreLevel.ts       — Behavioral: wander/seek enemies
    WaitForTransition.ts  — Behavioral: idle during screen transitions
  evaluators/
    PlayThroughGameEval.ts
    SurvivalEval.ts
  AIScreenshotService.ts  — Canvas capture + run report accumulation
  AIRunReport.ts          — RunReport type + singleton storage
```

## What We Keep

The existing `AIGovernor` has excellent low-level code that we preserve:

- **All movement helpers:** `displacementToMoveXZ`, `applySteeringMovement`, `moveAwayFrom`, `strafeAround`
- **YUKA Vehicle + steering:** ArriveBehavior, WanderBehavior, EntityManager
- **DDA line-of-sight:** `hasLineOfSight` (works perfectly)
- **Pathfinding:** Upgraded BFS → A*, but same interface
- **Combat:** `tryFire`, `manageWeapons`, `handleReload`, weapon slot management
- **Entity queries:** `getEnemies`, `nearest`, `nearestPickup`, `distToEntity`
- **Stuck detection:** `stuckStrikes`, `burstTimer`, random burst recovery
- **AIOutputFrame:** Same output format, AIProvider unchanged

## What Changes

1. **`decide()` → `Think.arbitrate()`** — Goal evaluators replace the flat if/else chain
2. **`execHunt/execHeal/execFlee/execExplore` → Goal leaf `execute()` methods** — Same logic, wrapped in Goal lifecycle
3. **State machine removed** — `_state: AIState` replaced by `Think.currentSubgoal()` hierarchy
4. **`update()` refactored** — Calls `brain.execute()` instead of `decide()` + state executors
5. **Constructor takes `GameStore` read accessor** — For progression awareness
6. **New: screenshot service** — Injected as dependency, triggered by goal transitions
7. **New: run report** — Accumulated across level reloads via module-level singleton

## URL Parameters

| Param | Effect |
|-------|--------|
| `?autoplay` | Enable AI governor (existing) |
| `?autoplay=easy` | AI plays on easy difficulty (existing) |
| `?autoplay=hard` | AI plays on hard difficulty (existing) |
| `?autoplay=screenshots` | Enable auto-download of screenshots (new) |
| `?autoplay=report` | Auto-download run report JSON on completion (new) |

## Testing Strategy

1. **Unit tests for each Goal class** — Mock governor helpers, verify activate/execute/terminate lifecycle and status transitions
2. **Unit tests for evaluators** — Verify desirability scoring under various HP/enemy/progression states
3. **Integration test: Think brain arbitration** — Verify goal switching under changing conditions
4. **A* pathfinding tests** — Same path correctness tests as BFS, verify performance improvement
5. **Screenshot service tests** — Mock canvas, verify capture timing and filename patterns
6. **E2E: full 9-circle autoplay** — Manual verification that the governor completes all 9 circles (this is the "tool-assisted speedrun" validation)

## Success Criteria

1. Governor autonomously completes all 9 circles without getting stuck
2. Screenshots captured at every circle start, boss encounter, boss defeat, death, and game completion
3. Run report JSON produced with per-circle stats
4. AutoplayOverlay shows goal hierarchy in real-time
5. No regressions: existing 268 tests still pass
6. Performance: goal evaluation adds < 1ms per decision cycle
