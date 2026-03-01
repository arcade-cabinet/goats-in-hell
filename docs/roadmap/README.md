---
title: "Development Roadmap"
status: in-progress
created: "2026-02-27"
updated: "2026-02-27"
domain: roadmap
roadmap_order: 0
related:
  - docs/roadmap/01-ship-it.md
  - docs/roadmap/02-bug-fixes.md
  - docs/roadmap/03-missing-features.md
  - docs/roadmap/04-architecture.md
  - docs/roadmap/05-testing.md
  - docs/roadmap/06-polish.md
---

# Goats in Hell — Development Roadmap

Development is organized into 6 domains, ordered by priority. Each domain has its own doc with concrete tasks, file paths, and acceptance criteria.

| # | Domain | Doc | Status | Priority |
|---|--------|-----|--------|----------|
| 1 | [Ship It (Production)](#1-ship-it) | [01-ship-it.md](01-ship-it.md) | Not started | Critical |
| 2 | [Bug Fixes](#2-bug-fixes) | [02-bug-fixes.md](02-bug-fixes.md) | Not started | High |
| 3 | [Missing Features](#3-missing-features) | [03-missing-features.md](03-missing-features.md) | Not started | Medium |
| 4 | [Architecture Refactor](#4-architecture) | [04-architecture.md](04-architecture.md) | Not started | Medium |
| 5 | [Testing](#5-testing) | [05-testing.md](05-testing.md) | Not started | Medium |
| 6 | [Polish](#6-polish) | [06-polish.md](06-polish.md) | Not started | Low |

## Current State (2026-02-27)

Feature-complete single-player roguelike FPS:
- 9 enemy types, 4 bosses, 4 weapons, 4 floor themes
- 20-stage progression (explore -> arena -> boss cycle)
- File-based OGG audio (music + SFX) + procedural stings
- 3D GLB models (enemies, weapons, props) with PBR textures
- Touch controls, minimap, post-processing, particles
- Full UI: MainMenu (with Settings), HUD, Death, Victory, Pause, BossIntro
- Save/load via localStorage, autoplay AI for testing
- Dungeon props, secret rooms, lore terminals, power-ups

**Codebase:** ~19,300 lines across 45 source files. Two god-files (GameEngine.tsx: 2027 lines, BabylonHUD.ts: 2010 lines) hold 21% of the code.

**Branch:** `feature/game-balance-build-touch`

## Completed Work

See `docs/plans/` for the original design and implementation plan that brought the game to its current state. All 21 original implementation tasks are complete.

Recent polish session (commits `da53f93` through `9bc86dd`):
- Dynamic crosshair spread, gore decals, weapon reload animations
- Explosive screen shake, environmental kill messages, hitscan tracers, floor stats
- Enemy stagger, low ammo pulse, weapon glow rings, barrel damage indicators
