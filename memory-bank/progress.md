---
title: "Project Progress"
description: "Milestone tracking — completed, in-progress, and not-started work"
created: "2026-03-01"
updated: "2026-03-01"
tags: [memory-bank, progress, milestones]
---

# Project Progress

## Completed

### R3F Rewrite (PR #4, merged 2026-02-28)
- Migrated from Babylon.js to Three.js + React Three Fiber v9
- 145 files changed, +18,947/-25,150 lines
- Rapier WASM physics replaced Havok
- @react-three/drei for controls, instancing, billboards
- @react-three/xr for WebXR/VR/AR support
- @react-three/postprocessing for visual effects

### Level Database System
- SQLite/Drizzle ORM schema (`src/db/schema.ts`) — themes, levels, rooms, connections, entities, triggers, envZones tables
- LevelEditor API (`src/db/LevelEditor.ts`) — agentic level building with convenience methods (lockOnEntry, ambush, setupArenaWaves, spawnBoss, bossIntro, dialogue)
- GridCompiler (`src/db/GridCompiler.ts`) — rooms + connections to MapCell[][] grid BLOB
- LevelDbAdapter (`src/db/LevelDbAdapter.ts`) — DB to LevelData/CircleLevel converters
- PlaytestRunner (`src/db/PlaytestRunner.ts`) — headless A* simulation for validation

### 9 Circle Build Scripts
- `scripts/build-circle-1.ts` through `scripts/build-circle-9.ts`
- Each circle is a bespoke level with unique room layouts, encounters, triggers, and environment zones
- All validated via PlaytestRunner — completable, pacing verified, resource economy confirmed
- Circle designs documented in `docs/circles/01-limbo.md` through `09-treachery.md`

### Test Suite
- 268 tests across 22 suites (Jest)
- All passing (`pnpm test`)

### Agent Infrastructure
- 4 custom agents: level-builder, level-reviewer, playtest-analyst, game-designer
- 4 custom commands: /build-circle, /review-circle, /validate-level, /build-all-circles
- Agent reference docs: `docs/agents/level-editor-api.md`, `docs/agents/circle-building-guide.md`

### Boss Pipeline Documentation
- DAZ Genesis 9 / Dainir rigging workflow documented
- ARP Smart rigging with bone mapping
- GLB export pipeline (decimate, bake atlas, Draco compress)
- Documented in `docs/boss-pipeline.md` (in-progress) and `docs/DAZ-PIPELINE.md`
- Note: pipeline is documented but no boss GLB models have been exported yet (see Not Started)

### Tooling Migration
- pnpm replaced npm (disk efficiency, strict deps)
- Biome 2.4 replaced ESLint + Prettier (single tool, faster)

### Core Game Systems
- FPS player controller with Rapier physics (`src/r3f/PlayerController.tsx`)
- Unified input abstraction with 6 providers (keyboard/mouse, touch, gamepad, gyroscope, XR, AI)
- Projectile combat system with object pooling (~100 slots)
- ECS entity system via Miniplex with O(1) mesh sync
- Zustand state management with GameStore
- Web Audio API audio system (SFX, music, ambient layers)
- Post-processing pipeline (Bloom, Vignette, ChromaticAberration, Noise)
- Autoplay AI system with YUKA governor

### Weapon Models
- 4 weapon GLBs integrated: pistol (MAC-10), shotgun, cannon (AK-47), launcher (Bazooka)
- 4 projectile GLBs: bullet-small, bullet-large, shell, rocket
- Textures compressed to 1024px JPEG (~250KB per GLB vs 12MB original)

## In Progress

### Documentation Infrastructure Overhaul
- YAML frontmatter being added to all markdown files
- AGENTS.md hierarchy being restructured
- Memory bank system (this directory)
- .claude hooks and agent definitions being refined
- JSDoc coverage expansion
- TypeDoc generation setup

### Bug Fixes
- Items from roadmap being addressed (check `docs/plans/` for current list)

## Not Started

### Boss GLB Models
- 9 bosses from Dainir for Genesis 9 base (Male: 29,698v / Female: 30,764v)
- Base templates saved: `assets/models/bosses/dainir-male-base.blend`, `dainir-female-base.blend`
- Pipeline documented but no bosses exported to GLB yet
- Each needs: morph customization, anatomy, armor/props, strip hair, decimate to ~8-10K verts, bake atlas, Draco GLB

### Per-Circle Gameplay Modifiers
- 9 unique mechanics designed but not implemented:
  1. Limbo: Fog of war (visibility 8 cells)
  2. Lust: Siren pulls (wind zones toward hazards)
  3. Gluttony: Poisoned pickups (50/50 health/poison)
  4. Greed: Hoarding penalty (excess ammo slows movement)
  5. Wrath: Escalation (enemies speed up over combat duration)
  6. Heresy: Illusion walls (fake walls, trap paths)
  7. Violence: Bleeding (constant HP drain, kills restore HP)
  8. Fraud: Mimic enemies (pickups that attack on proximity)
  9. Treachery: Reflected shots (missed projectiles bounce back)

### Brimstone Flamethrower
- Continuous stream weapon, DOT (2 dmg/s x 5s), short range, wide cone
- Fuel system: 100 max, 5 fuel/sec burn, 1 fuel/sec passive regen
- Found in Circle 7 Flamethrower Shrine

### Procedural Floors
- 2 procedural floors between each circle (16 total)
- Use next circle's theme as foreshadowing
- Higher pickup density for resource recovery
- New weapons found here

### Boss Animations
- Tier 1: Mixamo retarget to G9 skeleton (idle, walk, attack, hit, death)
- Tier 2: Procedural overlays in Three.js (breathing, head tracking, antler sway)
- Tier 3: Hand-keyed signature attacks per boss

### Kill Metric / Binary Ending
- Track optional vs. mandatory kills throughout the game
- Ascent ending (>30% optional enemies skipped) vs. Remain ending (<30% skipped)
- Subtle hints system ("Another sin carried deeper", "The weight grows")

### Automated Playtesting (Runtime)
- Wire PlaytestRunner output to actual R3F game runtime
- Currently only headless A* simulation

### Multiplayer / Networking
- Not yet scoped or designed

### Steam / Store Integration
- Not yet scoped or designed

### Production Deploy
- Bundle optimization
- Asset loading strategy
- Error handling and recovery
- Performance profiling
