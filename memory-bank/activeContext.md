---
title: "Active Context"
description: "Current session focus, in-progress work, and next steps"
created: "2026-03-01"
updated: "2026-03-01"
tags: [memory-bank, active-context]
---

# Active Context

## Last Accomplished

- **Level-DB system complete:** SQLite/Drizzle ORM schema, LevelEditor API, GridCompiler, LevelDbAdapter, PlaytestRunner — all implemented and tested.
- **All 9 circles built:** Build scripts for Circles 1-9 (Limbo through Treachery) written using the LevelEditor API, each with bespoke room layouts, encounters, triggers, and environment zones.
- **Playtesting passed:** All 9 circles validated via headless A* simulation (PlaytestRunner). Completability, pacing, and resource economy confirmed.
- **Test suite green:** 268 tests across 22 suites passing (`pnpm test`).
- **Agent infrastructure established:** 4 custom agents (level-builder, level-reviewer, playtest-analyst, game-designer) and 4 custom commands (/build-circle, /review-circle, /validate-level, /build-all-circles).
- **R3F rewrite merged:** PR #4 (2026-02-28) — Three.js/React Three Fiber replaced Babylon.js. 145 files changed, +18,947/-25,150 lines.
- **Boss pipeline documented:** DAZ Genesis 9 / Dainir rigging workflow, ARP Smart rigging, GLB export pipeline all documented in `docs/boss-pipeline.md`.

## Currently In Progress

- **Documentation infrastructure overhaul:**
  - YAML frontmatter being added to all markdown files
  - AGENTS.md hierarchy being restructured
  - Memory bank system being created (this file)
  - .claude hooks and agent definitions being refined
  - JSDoc coverage being expanded
  - TypeDoc generation being set up

## Next Steps

### High Priority
1. **Production deploy preparation** — bundle optimization, asset loading, error handling
2. **Boss GLB models** — Create 9 boss models from Dainir for Genesis 9 base templates using the documented pipeline (`docs/boss-pipeline.md`)
3. **Automated playtesting wired to game** — Connect PlaytestRunner output to actual R3F runtime, not just headless simulation

### Medium Priority
4. **Per-circle gameplay modifiers** — Implement the 9 unique mechanics (fog of war, siren pulls, poisoned pickups, etc.) described in the GAME-BIBLE
5. **Procedural floors** — 2 procedural floors between each circle using next circle's theme as foreshadowing
6. **Brimstone Flamethrower weapon** — Continuous stream, DOT mechanics, fuel system

### Lower Priority
7. **Boss animations** — Tier 1: Mixamo retarget to G9 skeleton; Tier 2: procedural overlays; Tier 3: hand-keyed signature attacks
8. **Multiplayer/networking** — Not yet scoped
9. **Steam/store integration** — Not yet scoped

## Open Questions

- How should procedural floors integrate with the level-DB system? Seed-based generation with DB metadata, or fully procedural with no DB record?
- Boss animation priority: ship with Mixamo retargets first, or wait for hand-keyed signature attacks?
- Flamethrower fuel economy tuning: 5 fuel/sec burn rate with 100 max and 1/sec passive regen — needs playtesting to confirm feel
- Kill metric tracking for the binary ending: where in the state system should optional vs. mandatory kills be tracked?
