---
title: "Claude Code Project Guide"
status: implemented
created: "2026-02-26"
updated: "2026-03-01"
domain: agents
related:
  - AGENTS.md
  - docs/AGENTS.md
---

# Goats in Hell — Claude Code Project Guide

## Quick Reference

```bash
pnpm test          # Jest (268 tests, 22 suites)
pnpm lint          # Biome check
pnpm lint:fix      # Biome auto-fix
pnpm format        # Biome format
npx tsc --noEmit   # TypeScript check
npx expo start --web --port 8085  # Dev server (port 8085 required)
```

## Tech Stack

- **Runtime:** React Native Web + Expo
- **3D:** Three.js + React Three Fiber v9 + @react-three/rapier (physics)
- **ECS:** Miniplex
- **State:** Zustand (`useGameStore`)
- **AI:** YUKA game AI library
- **Level DB:** SQLite via Drizzle ORM (better-sqlite3 / sql.js / expo-sqlite)
- **Package manager:** pnpm (NOT npm)
- **Linter:** Biome 2.4 (NOT ESLint)

## Architecture

See `AGENTS.md` for the complete agent infrastructure documentation.

### Level System (SQLite/Drizzle)

The level system uses a SQLite database as both the authoring and runtime format.

**Key files:**
- `src/db/schema.ts` — Drizzle ORM table definitions
- `src/db/LevelEditor.ts` — Agentic level building API
- `src/db/GridCompiler.ts` — Room/connection geometry → MapCell[][] grid
- `src/db/LevelDbAdapter.ts` — DB → LevelData/CircleLevel converters
- `src/db/PlaytestRunner.ts` — Headless A* simulation for validation
- `src/db/migrate.ts` — Migration + seed data

**Circle design docs:** `docs/circles/0N-<name>.md` (1 per circle, 9 total)
**Agent reference docs:** `docs/agents/` (API reference, building guide)

### Coordinate System

- ALL level coordinates are GRID coordinates (not world)
- 1 grid cell = 2 world units (`CELL_SIZE = 2`)
- X increases eastward, Z increases southward (top-left origin)
- Three.js is right-handed: positive Z points toward camera

### Key Patterns

- **Per-frame allocation avoidance:** Module-scope temp vectors reused each frame
- **Material lifecycle:** Three.js materials/geometries manually disposed
- **ECS→Three.js sync:** Map<string, THREE.Group> for O(1) mesh lookup
- **Projectile combat:** ALL weapons fire visible projectiles (no hitscan)
- **Shared AudioContext:** All 3 audio systems share one context

## Bespoke Agents

This project has custom Claude agents in `.claude/agents/`:

| Agent | Purpose |
|-------|---------|
| `level-builder` | Reads circle design doc, writes LevelEditor build script |
| `level-reviewer` | Cross-references build script against design doc |
| `playtest-analyst` | Runs headless playtest, analyzes results |
| `game-designer` | Designs/modifies circle level designs |

## Custom Commands

| Command | Purpose |
|---------|---------|
| `/build-circle N` | Build circle N from design doc |
| `/review-circle N` | Review circle N build script |
| `/validate-level ID` | Validate a level in the database |
| `/build-all-circles` | Build all 9 circles with parallel agents |

## Critical Rules

1. **pnpm only** — never `npm install` or `yarn`
2. **Biome only** — never ESLint/Prettier
3. **Grid coordinates** — entities/rooms use grid coords, not world coords
4. **Port 8085** — dev server always on port 8085
5. **No new Vector3() in useFrame()** — reuse module-scope temp vectors
6. **Always dispose materials** — prevent WebGL memory leaks

## For Full Documentation

- `AGENTS.md` — Agent infrastructure (custom agents, commands, workflows)
- `docs/AGENTS.md` — Master documentation index (all docs with frontmatter schema)
- `memory-bank/AGENTS.md` — Memory bank index (if present)
