---
title: "Agent Infrastructure"
status: implemented
created: "2026-02-28"
updated: "2026-03-04"
domain: agents
related:
  - docs/AGENTS.md
  - docs/agents/AGENTS.md
  - docs/circles/AGENTS.md
---

# Goats in Hell — Agent Infrastructure

> **For Claude:** When working on level-related tasks, ALWAYS read `docs/agents/level-editor-api.md` first.
> For the full documentation index, see `docs/AGENTS.md`. For memory bank, see `memory-bank/AGENTS.md`.

This document describes the bespoke Claude Code agent infrastructure for the Goats in Hell project. It covers custom agents, commands, reference documentation, and workflows.

---

## Agent Architecture Overview

```text
User Request
  │
  ├─ "build circle 3" ───────────> /build-circle 3
  │                                    │
  │                                    ├─ Reads: docs/agents/level-editor-api.md
  │                                    ├─ Reads: docs/agents/circle-building-guide.md
  │                                    ├─ Reads: docs/circles/03-gluttony.md
  │                                    └─ Uses: @level-builder agent
  │                                         │
  │                                         └─ Writes: scripts/build-circle-3.ts
  │
  ├─ "review circle 3" ──────────> /review-circle 3
  │                                    │
  │                                    └─ Uses: @level-reviewer agent
  │                                         │
  │                                         └─ Outputs: PASS/FAIL report
  │
  ├─ "playtest circle 3" ────────> /validate-level circle-3-gluttony
  │                                    │
  │                                    └─ Uses: @playtest-analyst agent
  │
  └─ "build all circles" ────────> /build-all-circles
                                       │
                                       ├─ Dispatches 9x @level-builder agents
                                       ├─ Dispatches 9x @level-reviewer agents
                                       └─ Runs playtest on all levels
```

---

## Custom Agents

### `@level-builder`

**Location:** `.claude/agents/level-builder.md`
**Purpose:** Reads a circle design document (`docs/circles/0N-*.md`) and translates it into a TypeScript build script (`scripts/build-circle-N.ts`) using the LevelEditor API.

**Required context (auto-loaded by agent):**
1. `docs/agents/level-editor-api.md` — API reference
2. `docs/agents/circle-building-guide.md` — Translation patterns
3. `docs/circles/0N-<name>.md` — Circle design doc

**Output:** `scripts/build-circle-N.ts` — executable TypeScript that populates SQLite

### `@level-reviewer`

**Location:** `.claude/agents/level-reviewer.md`
**Purpose:** Cross-references a build script against its design document, checking every room, connection, entity, trigger, and environment zone.

**Output:** Structured PASS/FAIL report with itemized discrepancies

### `@playtest-analyst`

**Location:** `.claude/agents/playtest-analyst.md`
**Purpose:** Runs the headless A* playtest simulation on compiled levels and analyzes completability, pacing, and resource economy.

**Output:** Playtest report with statistics and recommendations

### `@game-designer`

**Location:** `.claude/agents/game-designer.md`
**Purpose:** Designs and modifies circle level designs following the GAME-BIBLE and player journey conventions.

**Required context:**
1. `docs/GAME-BIBLE.md` — Canonical design reference
2. `docs/circles/00-player-journey.md` — Master game script
3. `docs/circles/playtest-act*.md` — Playtest results

---

## Custom Commands

| Command | Arguments | Description |
|---------|-----------|-------------|
| `/build-circle` | `N` (1-9) | Build one circle from its design doc |
| `/review-circle` | `N` (1-9) | Review one circle's build script |
| `/validate-level` | `level-id` | Validate a compiled level |
| `/build-all-circles` | — | Build all 9 circles with parallel agents |

---

## Reference Documentation

### Agent Reference Docs (`docs/agents/`)

| Document | Purpose | When to Read |
|----------|---------|--------------|
| `level-editor-api.md` | Complete LevelEditor API reference with examples | Before ANY level building |
| `circle-building-guide.md` | How to translate design docs → API calls | Before building a circle |
| `meshy-enemy-pipeline.md` | Full enemy generation pipeline — manifests, scripts, wiring | Before generating or wiring any new enemy |

### Circle Design Docs (`docs/circles/`)

| Document | Content |
|----------|---------|
| `00-player-journey.md` | Master game script — all 9 circles, weapons, enemies, endings |
| `01-limbo.md` through `09-treachery.md` | Individual circle designs with rooms, entities, triggers |
| `playtest-act1.md`, `playtest-act2.md`, `playtest-act3.md` | Paper playtest results |

### Game Design Docs (`docs/`)

| Document | Content |
|----------|---------|
| `GAME-BIBLE.md` | Canonical design reference (theology, tone, bosses, naming) |
| `boss-pipeline.md` | DAZ Genesis 9 rigging + ARP smart rigging |
| `DAZ-PIPELINE.md` | Asset generation workflow |

---

## Brain Architecture (YUKA Goal System)

Enemy and player AI uses YUKA's goal-driven architecture. Each entity gets a `Think` brain managed by the `BrainRegistry` singleton.

### Enemy Brains (`src/game/systems/brains/enemy/`)

| File | Description |
|------|-------------|
| `BrainRegistry.ts` | Singleton `Map<entityId, Think>` — register/unregister/updateAll/reset |
| `EnemyBrainFactory.ts` | Creates `Think` brain with evaluators for each enemy type |
| `goals/PatrolGoal.ts` | Wanders between waypoints (explore phase) |
| `goals/ChaseGoal.ts` | Pursues player via steering behaviours |
| `goals/AttackGoal.ts` | Melee/ranged attack at close range |
| `goals/FleeGoal.ts` | Retreats when HP < threshold |
| `goals/AoeAttackGoal.ts` | Boss AoE burst with cooldown |
| `goals/TeleportGoal.ts` | Boss position teleport |
| `goals/BossIntroGoal.ts` | Plays boss intro animation |
| `evaluators/` | Desirability scorers per goal type |

### Player Brains (`src/game/systems/brains/player/`)

Used by the autoplay governor (`?autoplay` URL param) — replaces the legacy `AIGovernor.ts`.

| File | Description |
|------|-------------|
| `PlayerGoalDriver.ts` | Interface: `execHunt/execFlee/execSeekPickup/execExplore(dt)` |
| `PlayerBrainFactory.ts` | Creates `Think` with `PlayThroughEval` + `PlayerSurvivalEval` |
| `goals/HuntEnemyGoal.ts` | Engages enemies via `driver.execHunt(dt)` |
| `goals/FleeGoal.ts` | Retreats when `hpRatio < 0.15` |
| `goals/SeekPickupGoal.ts` | Collects pickups when available |
| `goals/ExploreLevelGoal.ts` | Opens doors/explores when no enemies |
| `goals/WaitForTransitionGoal.ts` | Holds for floor transition delay |
| `goals/ClearFloorGoal.ts` | CompositeGoal — clears one floor |
| `goals/ClearCircleGoal.ts` | CompositeGoal — clears all floors of one circle |
| `goals/PlayThroughGameGoal.ts` | CompositeGoal — plays all 9 circles |
| `evaluators/PlayThroughEval.ts` | Always desirability = 1.0 (default goal) |
| `evaluators/PlayerSurvivalEval.ts` | Scales with `(1 - hpRatio)` when HP < 15% |

### Pathfinding (`src/game/systems/brains/pathfinding/`)

| File | Description |
|------|-------------|
| `AStar.ts` | A* with binary min-heap open set + octile distance heuristic (3-5x faster than BFS) |

### Telemetry (`src/game/systems/telemetry/`)

| File | Description |
|------|-------------|
| `GameEventBus.ts` | Typed pub/sub — `emit({ type, ...payload })`, wildcard `'*'` subscription |
| `TelemetryStore.ts` | Subscribes to all events on autoplay start; builds `RunReport`; exports JSON |
| `ScreenshotService.ts` | `request(label)` / `capture(canvas)` — goals trigger, `useFrame` captures |

> **`AIGovernor.ts` is `@deprecated`** — kept for the legacy exec* methods still used in R3FRoot. New code should use `PlayerGoalDriver` interface and YUKA goal classes.

---

## Full API Reference

The LevelEditor API, MapCell values, coordinate system, and composite helpers are documented in detail at:

- **API Reference:** `docs/agents/level-editor-api.md`
- **Building Guide:** `docs/agents/circle-building-guide.md`
- **Circle Designs:** `docs/circles/AGENTS.md` (index of all 9 circles)
- **Documentation Index:** `docs/AGENTS.md` (master index for all docs)
