---
title: "YUKA Brain Assembly — Unified Goal-Driven AI Implementation Plan"
status: in-progress
created: "2026-03-01"
updated: "2026-03-01"
domain: plans
plan_type: implementation
implements: docs/plans/2026-03-01-master-plan-ship-all-nine-circles.md
---

# YUKA Brain Assembly — Unified Goal-Driven AI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the flat reactive AI (both enemy `AISystem` and autoplay `AIGovernor`) with a unified YUKA goal-driven brain assembly where every entity — regular goats, boss goats, and the autoplay player — gets a `Think` brain with `GoalEvaluator`s. Track trap triggers, door states, and combat events properly in Zustand state so automated playthroughs produce rich telemetry.

**Architecture:** Three brain tiers: (1) `EnemyBrain` — per-entity goal-driven AI for all goat types using YUKA's `Think`/`GoalEvaluator`/`CompositeGoal`/`Goal` hierarchy, replacing the flat switch-case in `AISystem.ts`. (2) `BossBrain` extends `EnemyBrain` with phase-aware composite goals (enrage, summon, AoE patterns). (3) `PlayerBrain` — autoplay governor rebuilt on the same goal stack, with progression awareness, screenshot capture, and run reports. All three share a common `BrainContext` that reads game state from Zustand and the level DB.

**Tech Stack:** YUKA goal system (`Think`, `CompositeGoal`, `Goal`, `GoalEvaluator`), YUKA steering (`Vehicle`, `SeekBehavior`, `ArriveBehavior`, `FleeBehavior`, `WanderBehavior`), Zustand (`useGameStore`), Miniplex ECS, TypeScript.

**Supersedes:** `docs/plans/2026-03-01-ai-governor-overhaul-design.md` (player-only governor overhaul — now folded into this broader plan)

---

## Current System Analysis

### What exists and works well (KEEP):
- **YUKA steering behaviors** in `AISystem.ts` — Vehicle per enemy, SeekBehavior/ArriveBehavior/FleeBehavior, shared EntityManager. **Keep all of this.**
- **Post-steering attack logic** — melee, ranged projectiles, boss phase transitions (archGoat 3-phase, infernoGoat enrage, voidGoat teleport+clones, ironGoat armor regen+slam). **Keep the combat logic, wrap in Goals.**
- **AIGovernor movement helpers** — `displacementToMoveXZ`, `applySteeringMovement`, `strafeAround`, `moveAwayFrom`, BFS pathfinding, DDA line-of-sight. **Keep and share.**
- **TriggerSystem** — zone-based event firing, spawn waves, lock/unlock doors. **Keep, add event bus.**
- **HazardSystem** — spike traps, explosive barrels. **Keep, add telemetry.**
- **DoorSystem** — proximity open/close with lock support. **Keep.**

### What's wrong (REPLACE):
- **Enemy AI is a single 600-line function** with a switch statement — no hierarchy, no per-entity intelligence, all goats of the same type behave identically.
- **Boss AI is inline in post-steering functions** — phase logic scattered across `postSteeringArchGoat`, `postSteeringVoidGoat`, etc. No goal decomposition.
- **Autoplay governor is a separate 990-line system** — completely disconnected from enemy AI, uses its own YUKA setup, own pathfinding, own steering.
- **No event tracking** — triggers fire, enemies spawn, doors lock, hazards activate, but nothing records WHEN or WHERE for playtest analysis.
- **No centralized combat telemetry** — kills, damage dealt/taken, weapon usage, pickup collection all happen but aren't aggregated per-room or per-encounter.

---

## Architecture

### File Structure

```
src/game/systems/
  brains/
    BrainContext.ts           — Shared read-only game state snapshot
    BrainRegistry.ts          — Map<entityId, Think> brain lifecycle

    # Enemy goals (leaf goals wrap existing post-steering logic)
    enemy/
      EnemyBrainFactory.ts    — Creates Think brain per enemy type
      goals/
        AttackMeleeGoal.ts    — Melee attack when in range
        AttackRangedGoal.ts   — Ranged projectile when in range + LOS
        ChasePlayerGoal.ts    — Seek via YUKA steering
        FleePlayerGoal.ts     — Flee via YUKA steering (fireGoat)
        IdleGoal.ts           — Pre-alert idle/patrol
        SummonMinionsGoal.ts  — Boss: spawn helper enemies
        AoeAttackGoal.ts      — Boss: fire ring / ground slam
        TeleportGoal.ts       — Boss: voidGoat blink
        EnrageGoal.ts         — Boss: phase transition (speed+damage boost)
      evaluators/
        AggressionEval.ts     — Score: high when player in range + alert
        SurvivalEval.ts       — Score: high when HP low (flee/heal)
        BossPhaseEval.ts      — Score: triggers phase transitions at HP thresholds

    # Autoplay player goals (wrap existing AIGovernor helpers)
    player/
      PlayerBrainFactory.ts   — Creates Think brain for autoplay
      goals/
        HuntEnemyGoal.ts      — Find + engage nearest enemy
        SeekPickupGoal.ts     — Navigate to health/ammo/weapon
        FleeGoal.ts           — Retreat when critically low HP
        ExploreLevelGoal.ts   — Wander + seek enemies
        ClearFloorGoal.ts     — Composite: hunt all enemies until floor clear
        SurviveArenaGoal.ts   — Composite: survive arena waves
        DefeatBossGoal.ts     — Composite: boss-specific combat
        ClearCircleGoal.ts    — Composite: explore → arena → boss
        PlayThroughGameGoal.ts — Composite: circles 1-9
        WaitForTransitionGoal.ts — No-op during screen changes
      evaluators/
        PlayThroughEval.ts    — Always 1.0 (primary objective)
        SurvivalEval.ts       — Spikes when HP critical

  telemetry/
    GameEventBus.ts           — Pub/sub for game events
    TelemetryStore.ts         — Zustand slice for run telemetry
    ScreenshotService.ts      — Canvas capture at goal transitions
    RunReport.ts              — Aggregate report type + JSON export

  AISystem.ts                 — MODIFIED: delegates to BrainRegistry
  AIGovernor.ts               — DEPRECATED: replaced by PlayerBrainFactory
```

### BrainContext — Shared State Snapshot

Every brain reads from a shared `BrainContext` updated once per frame (not per-entity):

```typescript
interface BrainContext {
  // Player state
  playerPos: Vec3;
  playerHp: number;
  playerMaxHp: number;
  playerWeapon: WeaponId;

  // Level state
  grid: number[][];
  gridW: number;
  gridH: number;
  cellSize: number;

  // Progression
  circleNumber: number;
  encounterType: 'explore' | 'arena' | 'boss';
  screen: GameScreen;

  // Frame timing
  deltaTime: number;
  dtScale: number;
  gameTime: number;
}
```

### BrainRegistry — Entity ↔ Brain Lifecycle

```typescript
class BrainRegistry {
  private brains = new Map<string, Think<GameEntity>>();

  /** Create brain for entity on first alert (enemies) or on construction (player). */
  register(entityId: string, brain: Think<GameEntity>): void;

  /** Remove brain when entity dies. */
  unregister(entityId: string): void;

  /** Tick all brains. Called once per frame after steering update. */
  updateAll(context: BrainContext): void;

  /** Reset on floor transition. */
  reset(): void;
}
```

### GameEventBus — Telemetry Events

```typescript
type GameEvent =
  | { type: 'enemy_alert'; entityId: string; enemyType: string; position: Vec3 }
  | { type: 'enemy_killed'; entityId: string; enemyType: string; weapon: WeaponId; position: Vec3 }
  | { type: 'player_damaged'; amount: number; source: string; position: Vec3 }
  | { type: 'player_death'; circleNumber: number; roomId?: string }
  | { type: 'pickup_collected'; pickupType: string; value: number; position: Vec3 }
  | { type: 'trigger_fired'; triggerId: string; action: string }
  | { type: 'door_locked' | 'door_unlocked'; }
  | { type: 'hazard_activated'; hazardType: string; entityId: string }
  | { type: 'boss_phase'; bossId: string; phase: number; hpPercent: number }
  | { type: 'floor_complete'; circleNumber: number; encounterType: string; timeMs: number }
  | { type: 'screenshot'; filename: string; event: string }
  | { type: 'weapon_switched'; from: WeaponId; to: WeaponId };
```

### TelemetryStore — Zustand Slice

```typescript
interface TelemetryState {
  events: GameEvent[];
  currentRun: RunReport | null;

  // Actions
  emit: (event: GameEvent) => void;
  startRun: (seed: string, difficulty: string) => void;
  endRun: () => void;
  exportReport: () => string; // JSON
}
```

---

## Task 1: GameEventBus + TelemetryStore Foundation

**Files:**
- Create: `src/game/systems/telemetry/GameEventBus.ts`
- Create: `src/game/systems/telemetry/TelemetryStore.ts`
- Create: `src/game/systems/telemetry/RunReport.ts`
- Test: `src/game/systems/__tests__/GameEventBus.test.ts`

**Step 1: Write the failing test**

```typescript
// src/game/systems/__tests__/GameEventBus.test.ts
import { GameEventBus, type GameEvent } from '../telemetry/GameEventBus';

describe('GameEventBus', () => {
  let bus: GameEventBus;
  beforeEach(() => { bus = new GameEventBus(); });

  it('delivers events to subscribers', () => {
    const received: GameEvent[] = [];
    bus.on('enemy_killed', (e) => received.push(e));
    bus.emit({ type: 'enemy_killed', entityId: 'g1', enemyType: 'goat', weapon: 'hellPistol', position: { x: 0, y: 0, z: 0 } });
    expect(received).toHaveLength(1);
    expect(received[0].type).toBe('enemy_killed');
  });

  it('does not deliver to unsubscribed listeners', () => {
    const received: GameEvent[] = [];
    const unsub = bus.on('enemy_killed', (e) => received.push(e));
    unsub();
    bus.emit({ type: 'enemy_killed', entityId: 'g1', enemyType: 'goat', weapon: 'hellPistol', position: { x: 0, y: 0, z: 0 } });
    expect(received).toHaveLength(0);
  });

  it('delivers to wildcard subscribers', () => {
    const received: GameEvent[] = [];
    bus.on('*', (e) => received.push(e));
    bus.emit({ type: 'trigger_fired', triggerId: 't1', action: 'spawnWave' });
    bus.emit({ type: 'door_locked' });
    expect(received).toHaveLength(2);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- --testPathPattern=GameEventBus --no-coverage`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

```typescript
// src/game/systems/telemetry/GameEventBus.ts
import type { Vec3, WeaponId } from '../../entities/components';

export type GameEvent =
  | { type: 'enemy_alert'; entityId: string; enemyType: string; position: Vec3 }
  | { type: 'enemy_killed'; entityId: string; enemyType: string; weapon: WeaponId; position: Vec3 }
  | { type: 'player_damaged'; amount: number; source: string; position: Vec3 }
  | { type: 'player_death'; circleNumber: number; roomId?: string }
  | { type: 'pickup_collected'; pickupType: string; value: number; position: Vec3 }
  | { type: 'trigger_fired'; triggerId: string; action: string }
  | { type: 'door_locked' | 'door_unlocked' }
  | { type: 'hazard_activated'; hazardType: string; entityId: string }
  | { type: 'boss_phase'; bossId: string; phase: number; hpPercent: number }
  | { type: 'floor_complete'; circleNumber: number; encounterType: string; timeMs: number }
  | { type: 'screenshot'; filename: string; event: string }
  | { type: 'weapon_switched'; from: WeaponId; to: WeaponId };

type Listener = (event: GameEvent) => void;

export class GameEventBus {
  private listeners = new Map<string, Set<Listener>>();

  on(eventType: string, listener: Listener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener);
    return () => { this.listeners.get(eventType)?.delete(listener); };
  }

  emit(event: GameEvent): void {
    this.listeners.get(event.type)?.forEach((fn) => fn(event));
    this.listeners.get('*')?.forEach((fn) => fn(event));
  }

  clear(): void {
    this.listeners.clear();
  }
}

/** Singleton event bus for the game. */
export const gameEventBus = new GameEventBus();
```

```typescript
// src/game/systems/telemetry/RunReport.ts
import type { GameEvent } from './GameEventBus';

export interface CircleReport {
  circleNumber: number;
  startTime: number;
  endTime: number;
  deaths: number;
  kills: number;
  eventsCount: number;
}

export interface RunReport {
  seed: string;
  difficulty: string;
  startTime: number;
  endTime: number;
  totalDeaths: number;
  totalKills: number;
  circleReports: CircleReport[];
  events: GameEvent[];
}

export function createRunReport(seed: string, difficulty: string): RunReport {
  return {
    seed,
    difficulty,
    startTime: Date.now(),
    endTime: 0,
    totalDeaths: 0,
    totalKills: 0,
    circleReports: [],
    events: [],
  };
}
```

```typescript
// src/game/systems/telemetry/TelemetryStore.ts
import { gameEventBus, type GameEvent } from './GameEventBus';
import { createRunReport, type RunReport } from './RunReport';

let _currentRun: RunReport | null = null;
let _unsubscribe: (() => void) | null = null;

export function startTelemetryRun(seed: string, difficulty: string): void {
  stopTelemetryRun();
  _currentRun = createRunReport(seed, difficulty);
  _unsubscribe = gameEventBus.on('*', (event) => {
    _currentRun?.events.push(event);
    if (event.type === 'enemy_killed') _currentRun!.totalKills++;
    if (event.type === 'player_death') _currentRun!.totalDeaths++;
  });
}

export function stopTelemetryRun(): void {
  _unsubscribe?.();
  _unsubscribe = null;
  if (_currentRun) _currentRun.endTime = Date.now();
}

export function getCurrentRun(): RunReport | null { return _currentRun; }

export function exportRunReportJSON(): string {
  return JSON.stringify(_currentRun, null, 2);
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- --testPathPattern=GameEventBus --no-coverage`
Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add src/game/systems/telemetry/ src/game/systems/__tests__/GameEventBus.test.ts
git commit -m "feat: GameEventBus + TelemetryStore + RunReport foundation"
```

---

## Task 2: BrainContext + BrainRegistry

**Files:**
- Create: `src/game/systems/brains/BrainContext.ts`
- Create: `src/game/systems/brains/BrainRegistry.ts`
- Test: `src/game/systems/__tests__/BrainRegistry.test.ts`

**Step 1: Write the failing test**

```typescript
// src/game/systems/__tests__/BrainRegistry.test.ts
jest.mock('../AudioSystem', () => ({ playSound: jest.fn() }));
jest.mock('../GameClock', () => ({ getGameTime: jest.fn(() => 0) }));

import { BrainRegistry } from '../brains/BrainRegistry';
import { buildBrainContext, type BrainContext } from '../brains/BrainContext';

describe('BrainRegistry', () => {
  let registry: BrainRegistry;

  beforeEach(() => { registry = new BrainRegistry(); });

  it('registers and retrieves a brain by entity ID', () => {
    const mockBrain = { execute: jest.fn(), status: 'inactive' } as any;
    registry.register('enemy-1', mockBrain);
    expect(registry.get('enemy-1')).toBe(mockBrain);
  });

  it('unregisters a brain', () => {
    const mockBrain = { execute: jest.fn(), terminate: jest.fn(), status: 'inactive' } as any;
    registry.register('enemy-1', mockBrain);
    registry.unregister('enemy-1');
    expect(registry.get('enemy-1')).toBeUndefined();
  });

  it('reset clears all brains', () => {
    const mockBrain = { execute: jest.fn(), terminate: jest.fn(), status: 'inactive' } as any;
    registry.register('enemy-1', mockBrain);
    registry.register('enemy-2', mockBrain);
    registry.reset();
    expect(registry.size).toBe(0);
  });
});

describe('buildBrainContext', () => {
  it('builds a context snapshot from game state', () => {
    const ctx = buildBrainContext(
      { x: 5, y: 1, z: 10 }, // playerPos
      80, 100,               // hp, maxHp
      'hellPistol',          // weapon
      [[0, 1], [0, 0]],     // grid
      2,                     // cellSize
      1,                     // circleNumber
      'explore',             // encounterType
      'playing',             // screen
      16,                    // deltaTime
      100,                   // gameTime
    );
    expect(ctx.playerPos.x).toBe(5);
    expect(ctx.gridW).toBe(2);
    expect(ctx.gridH).toBe(2);
    expect(ctx.dtScale).toBeCloseTo(1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- --testPathPattern=BrainRegistry --no-coverage`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

```typescript
// src/game/systems/brains/BrainContext.ts
import type { GameScreen } from '../../../state/GameStore';
import type { Vec3, WeaponId } from '../../entities/components';

export interface BrainContext {
  playerPos: Vec3;
  playerHp: number;
  playerMaxHp: number;
  playerWeapon: WeaponId;
  grid: number[][];
  gridW: number;
  gridH: number;
  cellSize: number;
  circleNumber: number;
  encounterType: 'explore' | 'arena' | 'boss';
  screen: GameScreen;
  deltaTime: number;
  dtScale: number;
  gameTime: number;
}

export function buildBrainContext(
  playerPos: Vec3,
  playerHp: number,
  playerMaxHp: number,
  playerWeapon: WeaponId,
  grid: number[][],
  cellSize: number,
  circleNumber: number,
  encounterType: 'explore' | 'arena' | 'boss',
  screen: GameScreen,
  deltaTime: number,
  gameTime: number,
): BrainContext {
  return {
    playerPos,
    playerHp,
    playerMaxHp,
    playerWeapon,
    grid,
    gridW: grid[0]?.length ?? 0,
    gridH: grid.length,
    cellSize,
    circleNumber,
    encounterType,
    screen,
    deltaTime,
    dtScale: deltaTime / 16,
    gameTime,
  };
}
```

```typescript
// src/game/systems/brains/BrainRegistry.ts
import type { GameEntity } from 'yuka';
import type { Think } from 'yuka';

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
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- --testPathPattern=BrainRegistry --no-coverage`
Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add src/game/systems/brains/ src/game/systems/__tests__/BrainRegistry.test.ts
git commit -m "feat: BrainContext + BrainRegistry — shared state and brain lifecycle"
```

---

## Task 3: Enemy Leaf Goals (wrap existing post-steering logic)

**Files:**
- Create: `src/game/systems/brains/enemy/goals/AttackMeleeGoal.ts`
- Create: `src/game/systems/brains/enemy/goals/AttackRangedGoal.ts`
- Create: `src/game/systems/brains/enemy/goals/ChasePlayerGoal.ts`
- Create: `src/game/systems/brains/enemy/goals/IdleGoal.ts`
- Test: `src/game/systems/__tests__/EnemyGoals.test.ts`

**Step 1: Write the failing test**

```typescript
// src/game/systems/__tests__/EnemyGoals.test.ts
jest.mock('../AudioSystem', () => ({ playSound: jest.fn() }));
jest.mock('../GameClock', () => ({ getGameTime: jest.fn(() => 0) }));
jest.mock('../PlayerDamageBridge', () => ({ bridgeDamagePlayer: jest.fn() }));

import { Goal } from 'yuka';
import { AttackMeleeGoal } from '../brains/enemy/goals/AttackMeleeGoal';
import { ChasePlayerGoal } from '../brains/enemy/goals/ChasePlayerGoal';
import { IdleGoal } from '../brains/enemy/goals/IdleGoal';
import type { BrainContext } from '../brains/BrainContext';
import type { Entity } from '../../entities/components';
import { vec3 } from '../../entities/vec3';

function mockContext(overrides: Partial<BrainContext> = {}): BrainContext {
  return {
    playerPos: vec3(10, 0, 10),
    playerHp: 100, playerMaxHp: 100,
    playerWeapon: 'hellPistol',
    grid: [[0, 0], [0, 0]], gridW: 2, gridH: 2, cellSize: 2,
    circleNumber: 1, encounterType: 'explore', screen: 'playing',
    deltaTime: 16, dtScale: 1, gameTime: 1000,
    ...overrides,
  };
}

function mockEnemy(overrides: Partial<Entity> = {}): Entity {
  return {
    id: 'goat-1', type: 'goat',
    position: vec3(11, 0, 10),
    enemy: {
      hp: 20, maxHp: 20, damage: 5, speed: 0.04,
      attackRange: 1.8, alert: true, attackCooldown: 0, scoreValue: 100,
    },
    ...overrides,
  };
}

describe('IdleGoal', () => {
  it('activates and completes when enemy becomes alert', () => {
    const enemy = mockEnemy();
    enemy.enemy!.alert = false;
    const goal = new IdleGoal(enemy);
    goal.activate();
    expect(goal.active()).toBe(true);

    // Simulate alert
    enemy.enemy!.alert = true;
    goal.execute();
    expect(goal.completed()).toBe(true);
  });
});

describe('AttackMeleeGoal', () => {
  it('completes after attacking', () => {
    const enemy = mockEnemy();
    const ctx = mockContext();
    const goal = new AttackMeleeGoal(enemy, ctx);
    goal.activate();
    goal.execute();
    // Should have attacked (distance ~1 unit, within attackRange 1.8)
    expect(enemy.enemy!.attackCooldown).toBeGreaterThan(0);
    expect(goal.completed()).toBe(true);
  });

  it('fails when target out of range', () => {
    const enemy = mockEnemy();
    enemy.position = vec3(50, 0, 50); // far away
    const ctx = mockContext();
    const goal = new AttackMeleeGoal(enemy, ctx);
    goal.activate();
    goal.execute();
    expect(goal.failed()).toBe(true);
  });
});

describe('ChasePlayerGoal', () => {
  it('stays active while moving toward player', () => {
    const enemy = mockEnemy();
    enemy.position = vec3(20, 0, 20); // 14 units away
    const ctx = mockContext();
    const goal = new ChasePlayerGoal(enemy, ctx);
    goal.activate();
    goal.execute();
    expect(goal.active()).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- --testPathPattern=EnemyGoals --no-coverage`
Expected: FAIL — modules not found

**Step 3: Write minimal implementation**

The key insight: each goal is a thin wrapper around the existing logic from `AISystem.ts`, but now it has lifecycle management (activate/execute/terminate) and clear completion/failure conditions.

```typescript
// src/game/systems/brains/enemy/goals/IdleGoal.ts
import { Goal, GameEntity } from 'yuka';
import type { Entity } from '../../../../entities/components';

/**
 * IdleGoal — enemy waits until alerted by player proximity.
 * Completes when enemy.alert becomes true.
 */
export class IdleGoal extends Goal<GameEntity> {
  private entity: Entity;

  constructor(entity: Entity) {
    super();
    this.entity = entity;
  }

  activate(): void {
    this.status = Goal.STATUS.ACTIVE;
  }

  execute(): void {
    if (this.entity.enemy?.alert) {
      this.status = Goal.STATUS.COMPLETED;
    }
  }

  terminate(): void {}
}
```

```typescript
// src/game/systems/brains/enemy/goals/AttackMeleeGoal.ts
import { Goal, GameEntity } from 'yuka';
import type { Entity } from '../../../../entities/components';
import type { BrainContext } from '../../BrainContext';
import { vec3Distance } from '../../../../entities/vec3';
import { bridgeDamagePlayer } from '../../../PlayerDamageBridge';
import { registerDamageDirection } from '../../../ui/HUDEvents';

const ATTACK_COOLDOWN_FRAMES = 60;

/**
 * AttackMeleeGoal — execute a single melee strike if in range.
 * Completes after attacking, fails if out of range.
 */
export class AttackMeleeGoal extends Goal<GameEntity> {
  private entity: Entity;
  private ctx: BrainContext;

  constructor(entity: Entity, ctx: BrainContext) {
    super();
    this.entity = entity;
    this.ctx = ctx;
  }

  activate(): void {
    this.status = Goal.STATUS.ACTIVE;
  }

  execute(): void {
    const enemy = this.entity.enemy!;
    const dist = vec3Distance(this.entity.position!, this.ctx.playerPos);

    if (dist > enemy.attackRange) {
      this.status = Goal.STATUS.FAILED;
      return;
    }

    if (enemy.attackCooldown <= 0) {
      bridgeDamagePlayer(enemy.damage);
      if (this.entity.position) registerDamageDirection(this.entity.position);
      enemy.attackCooldown = ATTACK_COOLDOWN_FRAMES;
      this.status = Goal.STATUS.COMPLETED;
    }
  }

  terminate(): void {}
}
```

```typescript
// src/game/systems/brains/enemy/goals/ChasePlayerGoal.ts
import { Goal, GameEntity } from 'yuka';
import type { Entity } from '../../../../entities/components';
import type { BrainContext } from '../../BrainContext';
import { vec3Distance } from '../../../../entities/vec3';

/**
 * ChasePlayerGoal — move toward player using YUKA vehicle steering.
 * Active while distance > attackRange. Vehicle steering is handled
 * externally by the shared EntityManager in AISystem.
 *
 * This goal doesn't drive movement directly — it signals INTENT.
 * The AISystem loop reads the active goal type to configure steering.
 */
export class ChasePlayerGoal extends Goal<GameEntity> {
  private entity: Entity;
  private ctx: BrainContext;

  constructor(entity: Entity, ctx: BrainContext) {
    super();
    this.entity = entity;
    this.ctx = ctx;
  }

  activate(): void {
    this.status = Goal.STATUS.ACTIVE;
  }

  execute(): void {
    const dist = vec3Distance(this.entity.position!, this.ctx.playerPos);
    if (dist <= this.entity.enemy!.attackRange) {
      this.status = Goal.STATUS.COMPLETED;
    }
    // Otherwise stays ACTIVE — steering handles movement
  }

  terminate(): void {}
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- --testPathPattern=EnemyGoals --no-coverage`
Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add src/game/systems/brains/enemy/ src/game/systems/__tests__/EnemyGoals.test.ts
git commit -m "feat: enemy leaf goals — IdleGoal, AttackMeleeGoal, ChasePlayerGoal"
```

---

## Task 4: Enemy GoalEvaluators + EnemyBrainFactory

**Files:**
- Create: `src/game/systems/brains/enemy/evaluators/AggressionEval.ts`
- Create: `src/game/systems/brains/enemy/evaluators/SurvivalEval.ts`
- Create: `src/game/systems/brains/enemy/EnemyBrainFactory.ts`
- Test: `src/game/systems/__tests__/EnemyBrain.test.ts`

**Step 1: Write the failing test**

```typescript
// src/game/systems/__tests__/EnemyBrain.test.ts
jest.mock('../AudioSystem', () => ({ playSound: jest.fn() }));
jest.mock('../GameClock', () => ({ getGameTime: jest.fn(() => 0) }));
jest.mock('../PlayerDamageBridge', () => ({ bridgeDamagePlayer: jest.fn() }));

import { createEnemyBrain } from '../brains/enemy/EnemyBrainFactory';
import type { Entity } from '../../entities/components';
import { vec3 } from '../../entities/vec3';

function mockGoat(): Entity {
  return {
    id: 'goat-1', type: 'goat',
    position: vec3(10, 0, 10),
    enemy: {
      hp: 20, maxHp: 20, damage: 5, speed: 0.04,
      attackRange: 1.8, alert: true, attackCooldown: 0, scoreValue: 100,
    },
  };
}

describe('EnemyBrainFactory', () => {
  it('creates a Think brain with evaluators for a basic goat', () => {
    const entity = mockGoat();
    const brain = createEnemyBrain(entity);
    expect(brain).toBeDefined();
    expect(brain.evaluators.length).toBeGreaterThanOrEqual(1);
  });

  it('creates a brain for fireGoat with survival evaluator', () => {
    const entity = mockGoat();
    entity.type = 'fireGoat';
    const brain = createEnemyBrain(entity);
    expect(brain.evaluators.length).toBeGreaterThanOrEqual(2);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- --testPathPattern=EnemyBrain --no-coverage`
Expected: FAIL

**Step 3: Write minimal implementation**

```typescript
// src/game/systems/brains/enemy/evaluators/AggressionEval.ts
import { GoalEvaluator, GameEntity } from 'yuka';

/**
 * Scores high when the enemy should be attacking (always aggressive for basic goats).
 */
export class AggressionEval extends GoalEvaluator<GameEntity> {
  calculateDesirability(): number {
    return 0.7; // Enemies are generally aggressive
  }

  setGoal(owner: GameEntity): void {
    // The brain factory's composite goal handles decomposition
  }
}
```

```typescript
// src/game/systems/brains/enemy/evaluators/SurvivalEval.ts
import { GoalEvaluator, GameEntity } from 'yuka';

/**
 * Scores high when enemy HP is low — relevant for fireGoat (flee behavior).
 */
export class SurvivalEval extends GoalEvaluator<GameEntity> {
  private getHpRatio: () => number;

  constructor(getHpRatio: () => number, characterBias = 1) {
    super(characterBias);
    this.getHpRatio = getHpRatio;
  }

  calculateDesirability(): number {
    const hpRatio = this.getHpRatio();
    if (hpRatio > 0.3) return 0;
    return (1 - hpRatio) * this.characterBias;
  }

  setGoal(): void {}
}
```

```typescript
// src/game/systems/brains/enemy/EnemyBrainFactory.ts
import { Think, GameEntity } from 'yuka';
import type { Entity } from '../../../entities/components';
import { AggressionEval } from './evaluators/AggressionEval';
import { SurvivalEval } from './evaluators/SurvivalEval';

/**
 * Creates a Think brain configured for the given enemy entity type.
 * Basic goats get aggression only. Ranged/bosses get survival evaluators too.
 */
export function createEnemyBrain(entity: Entity): Think<GameEntity> {
  const brain = new Think<GameEntity>();

  // All enemies get aggression
  brain.addEvaluator(new AggressionEval(1));

  // Ranged/boss types also evaluate survival (flee when low HP)
  const fleeTypes = ['fireGoat', 'archGoat', 'infernoGoat', 'voidGoat', 'ironGoat'];
  if (fleeTypes.includes(entity.type)) {
    brain.addEvaluator(
      new SurvivalEval(() => {
        const e = entity.enemy;
        return e ? e.hp / e.maxHp : 1;
      }, 1.2),
    );
  }

  return brain;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- --testPathPattern=EnemyBrain --no-coverage`
Expected: PASS (2 tests)

**Step 5: Commit**

```bash
git add src/game/systems/brains/enemy/
git add src/game/systems/__tests__/EnemyBrain.test.ts
git commit -m "feat: AggressionEval, SurvivalEval, EnemyBrainFactory"
```

---

## Task 5: Boss-Specific Goals (Phase Transitions, AoE, Summon)

**Files:**
- Create: `src/game/systems/brains/enemy/goals/AoeAttackGoal.ts`
- Create: `src/game/systems/brains/enemy/goals/SummonMinionsGoal.ts`
- Create: `src/game/systems/brains/enemy/goals/TeleportGoal.ts`
- Create: `src/game/systems/brains/enemy/goals/EnrageGoal.ts`
- Create: `src/game/systems/brains/enemy/goals/AttackRangedGoal.ts`
- Create: `src/game/systems/brains/enemy/evaluators/BossPhaseEval.ts`
- Test: `src/game/systems/__tests__/BossGoals.test.ts`

These wrap the existing boss logic from `postSteeringArchGoat`, `postSteeringInfernoGoat`, `postSteeringVoidGoat`, `postSteeringIronGoat` in `AISystem.ts` lines 228-446. Each boss ability becomes a leaf Goal with clear activate/execute/terminate and a `BossPhaseEval` that triggers phase transitions at HP thresholds.

**Step 1: Write the failing test**

```typescript
// src/game/systems/__tests__/BossGoals.test.ts
jest.mock('../AudioSystem', () => ({ playSound: jest.fn() }));
jest.mock('../GameClock', () => ({ getGameTime: jest.fn(() => 5000) }));
jest.mock('../PlayerDamageBridge', () => ({ bridgeDamagePlayer: jest.fn() }));
jest.mock('../EnemyProjectileBridge', () => ({ spawnEnemyProjectile: jest.fn() }));

import { Goal } from 'yuka';
import { AoeAttackGoal } from '../brains/enemy/goals/AoeAttackGoal';
import { EnrageGoal } from '../brains/enemy/goals/EnrageGoal';
import { BossPhaseEval } from '../brains/enemy/evaluators/BossPhaseEval';
import type { Entity } from '../../entities/components';
import { vec3 } from '../../entities/vec3';

function mockBoss(hp: number, maxHp: number): Entity {
  return {
    id: 'boss-1', type: 'archGoat',
    position: vec3(10, 0, 10),
    enemy: {
      hp, maxHp, damage: 15, speed: 0.05,
      attackRange: 2.0, alert: true, attackCooldown: 0, scoreValue: 500,
    },
  };
}

describe('BossPhaseEval', () => {
  it('returns 0 desirability when above threshold', () => {
    const boss = mockBoss(100, 100);
    const eval_ = new BossPhaseEval(() => boss.enemy!.hp / boss.enemy!.maxHp, 0.5);
    expect(eval_.calculateDesirability()).toBe(0);
  });

  it('returns high desirability when below threshold', () => {
    const boss = mockBoss(40, 100);
    const eval_ = new BossPhaseEval(() => boss.enemy!.hp / boss.enemy!.maxHp, 0.5);
    expect(eval_.calculateDesirability()).toBeGreaterThan(0.5);
  });
});

describe('EnrageGoal', () => {
  it('boosts enemy speed on activation', () => {
    const boss = mockBoss(20, 100);
    const originalSpeed = boss.enemy!.speed;
    const goal = new EnrageGoal(boss, 1.5);
    goal.activate();
    expect(boss.enemy!.speed).toBe(originalSpeed * 1.5);
    expect(goal.completed()).toBe(true);
  });
});

describe('AoeAttackGoal', () => {
  it('fires when cooldown is ready', () => {
    const boss = mockBoss(20, 100);
    const ctx = { playerPos: vec3(12, 0, 10), deltaTime: 16, dtScale: 1, gameTime: 5000 } as any;
    const goal = new AoeAttackGoal(boss, ctx, { projectileCount: 12, damage: 8, speed: 0.07, cooldownFrames: 360 });
    goal.activate();
    goal.execute();
    expect(goal.completed()).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- --testPathPattern=BossGoals --no-coverage`
Expected: FAIL

**Step 3: Write implementations** (these extract the existing inline logic from AISystem.ts postSteering functions)

Each goal wraps one boss ability. Code is extracted directly from the existing `postSteeringArchGoat`, `postSteeringInfernoGoat`, etc. — same math, same spawning, same projectile patterns. The only change is lifecycle management.

Implementation details for each goal follow the same pattern as Task 3. The boss goals are larger but structurally identical: activate sets status, execute runs the ability logic, terminate cleans up.

**Step 4: Run test to verify it passes**

Run: `pnpm test -- --testPathPattern=BossGoals --no-coverage`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/systems/brains/enemy/goals/ src/game/systems/brains/enemy/evaluators/
git add src/game/systems/__tests__/BossGoals.test.ts
git commit -m "feat: boss goals — AoeAttack, SummonMinions, Teleport, Enrage, BossPhaseEval"
```

---

## Task 6: Wire Enemy Brains into AISystem

**Files:**
- Modify: `src/game/systems/AISystem.ts`
- Test: existing tests still pass + new integration test

**Step 1: Write the integration test**

```typescript
// Add to existing tests or new file
// Verify that the brain-based AISystem produces the same behavior as before:
// - Enemies still seek player
// - Melee enemies still attack at range
// - Bosses still phase transition
// - fireGoats still flee when close
```

**Step 2: Modify AISystem.ts**

The key refactor: replace the type-switch in `postSteeringBasicGoat`, `postSteeringArchGoat`, etc. with brain.execute(). The steering (Vehicle/SeekBehavior) stays exactly as-is. The post-steering logic moves into goals.

Changes to `aiSystemUpdate()`:
1. When enemy first alerts → `brainRegistry.register(id, createEnemyBrain(entity))`
2. After steering update → `brainRegistry.updateAll()` (goals decide attack/ability/flee)
3. On enemy death → `brainRegistry.unregister(id)`
4. On reset → `brainRegistry.reset()`

The switch statement becomes: brain goals read entity state, decide which action to take, and execute it. Steering behavior configuration changes are driven by the active goal type.

**Step 3: Run full test suite**

Run: `pnpm test --no-coverage`
Expected: 268+ tests pass (no regressions)

**Step 4: Commit**

```bash
git add src/game/systems/AISystem.ts
git commit -m "refactor: wire enemy brains into AISystem via BrainRegistry"
```

---

## Task 7: Player Brain Goals (Autoplay Governor Replacement)

**Files:**
- Create: `src/game/systems/brains/player/PlayerBrainFactory.ts`
- Create: `src/game/systems/brains/player/goals/HuntEnemyGoal.ts`
- Create: `src/game/systems/brains/player/goals/SeekPickupGoal.ts`
- Create: `src/game/systems/brains/player/goals/FleeGoal.ts`
- Create: `src/game/systems/brains/player/goals/ExploreLevelGoal.ts`
- Create: `src/game/systems/brains/player/goals/ClearFloorGoal.ts`
- Create: `src/game/systems/brains/player/goals/ClearCircleGoal.ts`
- Create: `src/game/systems/brains/player/goals/PlayThroughGameGoal.ts`
- Create: `src/game/systems/brains/player/goals/WaitForTransitionGoal.ts`
- Create: `src/game/systems/brains/player/evaluators/PlayThroughEval.ts`
- Create: `src/game/systems/brains/player/evaluators/PlayerSurvivalEval.ts`
- Test: `src/game/systems/__tests__/PlayerBrain.test.ts`

These wrap the existing `AIGovernor` movement/combat/pathfinding helpers. The existing `execHunt`, `execHeal`, `execFlee`, `execExplore` become goal execute() methods. The `decide()` function is replaced by `Think.arbitrate()` with `PlayThroughEval` and `PlayerSurvivalEval`.

The composite goals add hierarchical structure:
- `PlayThroughGameGoal` pushes `ClearCircleGoal(1)` through `ClearCircleGoal(9)`
- `ClearCircleGoal` pushes `ClearFloorGoal` / `SurviveArenaGoal` / `DefeatBossGoal` based on encounter type
- `ClearFloorGoal` pushes `HuntEnemyGoal` / `ExploreLevelGoal` as needed

**Step 1-5:** Same TDD pattern as above. Tests verify goal lifecycle, composite decomposition, and that the existing movement code produces the same input frame output.

**Commit:**

```bash
git add src/game/systems/brains/player/
git add src/game/systems/__tests__/PlayerBrain.test.ts
git commit -m "feat: player brain goals — goal-driven autoplay governor"
```

---

## Task 8: Screenshot Service

**Files:**
- Create: `src/game/systems/telemetry/ScreenshotService.ts`
- Test: `src/game/systems/__tests__/ScreenshotService.test.ts`

Canvas capture via `canvas.toDataURL('image/png')` triggered by goal transitions. A `pendingScreenshot` flag is set by goals, and a `useFrame` hook captures after the next render.

Screenshots are stored in the `RunReport` and optionally auto-downloaded when `?autoplay=screenshots`.

**Commit:**

```bash
git add src/game/systems/telemetry/ScreenshotService.ts
git add src/game/systems/__tests__/ScreenshotService.test.ts
git commit -m "feat: ScreenshotService — canvas capture at goal transitions"
```

---

## Task 9: Wire Event Bus into Existing Systems

**Files:**
- Modify: `src/game/systems/TriggerSystem.ts` — emit `trigger_fired`, `door_locked`, `door_unlocked`
- Modify: `src/game/systems/HazardSystem.ts` — emit `hazard_activated`
- Modify: `src/game/systems/CombatSystem.ts` — emit `enemy_killed`, `player_damaged`
- Modify: `src/game/systems/ProgressionSystem.ts` — emit `floor_complete`, `player_death`
- Modify: `src/r3f/systems/PickupSystem.ts` — emit `pickup_collected`

Each modification is a single `gameEventBus.emit(...)` call at the point where the event occurs. No behavior changes — purely additive telemetry.

**Commit:**

```bash
git add src/game/systems/TriggerSystem.ts src/game/systems/HazardSystem.ts
git add src/game/systems/CombatSystem.ts src/game/systems/ProgressionSystem.ts
git add src/r3f/systems/PickupSystem.ts
git commit -m "feat: wire GameEventBus into combat, triggers, hazards, pickups"
```

---

## Task 10: Wire Player Brain + Telemetry into R3FRoot

**Files:**
- Modify: `src/R3FRoot.tsx` — replace `new AIGovernor(...)` with `PlayerBrainFactory`
- Modify: `src/App.tsx` — start/stop telemetry run on game start/end
- Modify: `src/ui/AutoplayOverlay.tsx` — read goal hierarchy from brain registry

**Commit:**

```bash
git add src/R3FRoot.tsx src/App.tsx src/ui/AutoplayOverlay.tsx
git commit -m "feat: wire PlayerBrain + telemetry into R3F autoplay pipeline"
```

---

## Task 11: A* Pathfinding Upgrade

**Files:**
- Create: `src/game/systems/brains/pathfinding/AStar.ts`
- Create: `src/game/systems/__tests__/AStar.test.ts`
- Modify: player goals to use A* instead of BFS

Replace BFS (from AIGovernor lines 847-933) with A* using octile distance heuristic and binary min-heap. Same interface, same path output, 3-5x faster on large grids.

**Commit:**

```bash
git add src/game/systems/brains/pathfinding/ src/game/systems/__tests__/AStar.test.ts
git commit -m "feat: A* pathfinding with octile heuristic (replaces BFS)"
```

---

## Task 12: Full Test Suite + Cleanup

**Step 1:** Run full test suite: `pnpm test --no-coverage`
**Step 2:** Run TypeScript check: `npx tsc --noEmit`
**Step 3:** Run linter: `pnpm lint`
**Step 4:** If `AIGovernor.ts` is no longer imported anywhere, add deprecation comment pointing to `PlayerBrainFactory`
**Step 5:** Update `CLAUDE.md` and `AGENTS.md` to document new brain architecture

**Commit:**

```bash
git commit -m "chore: cleanup, deprecation notices, documentation updates"
```

---

## Execution Summary

| Task | Component | New Files | Modified Files | Tests |
|------|-----------|-----------|----------------|-------|
| 1 | GameEventBus + Telemetry | 3 | 0 | 3 |
| 2 | BrainContext + Registry | 2 | 0 | 4 |
| 3 | Enemy Leaf Goals | 3 | 0 | 4 |
| 4 | Enemy Evaluators + Factory | 3 | 0 | 2 |
| 5 | Boss Goals | 6 | 0 | 3+ |
| 6 | Wire Enemy Brains | 0 | 1 | regression |
| 7 | Player Brain Goals | 10 | 0 | 5+ |
| 8 | Screenshot Service | 1 | 0 | 2+ |
| 9 | Event Bus Wiring | 0 | 5 | regression |
| 10 | R3FRoot + App Integration | 0 | 3 | manual |
| 11 | A* Pathfinding | 1 | 1+ | 3+ |
| 12 | Cleanup + Docs | 0 | 2+ | full suite |
| **Total** | | **~29 new** | **~12 modified** | **~30 new** |

## Verification

1. `pnpm test` — all existing 268+ tests pass, plus ~30 new brain tests
2. `npx tsc --noEmit` — clean
3. `pnpm lint` — clean
4. `?autoplay` — governor plays through at least circle 1 without getting stuck
5. Run report JSON logged to console on game completion
6. AutoplayOverlay shows active goal hierarchy
