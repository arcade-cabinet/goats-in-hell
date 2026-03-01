---
title: "Decision Log"
description: "Architectural Decision Records (ADRs) for the project"
created: "2026-03-01"
updated: "2026-03-01"
tags: [memory-bank, decisions, adr]
---

# Decision Log

Architectural decisions are recorded here in ADR format. Before making a new architectural decision, check this log for existing constraints. Append new decisions at the bottom using the next sequential ADR number.

---

## ADR-001: Three.js / React Three Fiber over Babylon.js

**Date:** 2026-02-28 | **Status:** accepted

**Context:** The original prototype used Babylon.js for 3D rendering within a React Native Web / Expo app. As the project grew, Babylon.js presented challenges: large bundle size (~1.5MB minified), limited React integration (imperative API requiring refs and effects), smaller ecosystem of React-specific tooling, and friction with the ECS architecture.

**Decision:** Migrate to Three.js + React Three Fiber v9. Use @react-three/rapier for physics (replacing Havok), @react-three/drei for common abstractions, @react-three/xr for WebXR, and @react-three/postprocessing for visual effects.

**Consequences:**
- (+) Declarative 3D via JSX — components compose naturally with React
- (+) Massive ecosystem: drei, rapier, postprocessing, xr all first-party quality
- (+) Smaller bundle (~500KB Three.js core vs ~1.5MB Babylon)
- (+) Better TypeScript support and community documentation
- (-) Required full rewrite: 145 files, +18,947/-25,150 lines (PR #4)
- (-) Coordinate system change: Three.js is right-handed (positive Z toward camera), requiring Z negation from Babylon-style positions
- (-) Some Babylon features (e.g., built-in inspector, physics debug viz) have no direct R3F equivalent

---

## ADR-002: SQLite Level Database over Pure Procedural Generation

**Date:** 2026-02-28 | **Status:** accepted

**Context:** The initial approach used fully procedural level generation via `LevelGenerator.ts` with seeded PRNG. While this produced playable levels, the results were generic — every circle felt similar, and it was impossible to craft the specific room-by-room experiences described in the circle design documents (e.g., the Siren Pit's spiraling ramp, the Weight Room's pressure plate puzzle, the Hall of Mirrors' reflection mechanic).

**Decision:** Implement a SQLite database (via Drizzle ORM) as both the authoring and runtime format for levels. Each circle is hand-crafted using the LevelEditor API and stored as structured data (rooms, connections, entities, triggers, environment zones). The GridCompiler converts this to a MapCell[][] grid for runtime consumption.

**Consequences:**
- (+) Deterministic levels — each circle is bespoke with specific room layouts, encounter pacing, and narrative beats
- (+) Agentic authoring — Claude Code agents can build levels via the LevelEditor API, enabling the /build-circle workflow
- (+) Playtest validation — PlaytestRunner can simulate levels from DB for completability checking
- (+) Introspectable — rooms, entities, triggers are queryable SQL data, not opaque procedural output
- (+) Versioned — build scripts are TypeScript files checked into git, providing full history
- (-) More upfront authoring effort per level (mitigated by agent automation)
- (-) Additional dependency (better-sqlite3 / sql.js / expo-sqlite)
- (-) Procedural floors between circles still need the old generator (hybrid approach)

---

## ADR-003: Visible Projectiles over Hitscan

**Date:** 2026-02-28 | **Status:** accepted

**Context:** The combat system needed a shooting mechanic. Hitscan (instant raycast from weapon to target) is simpler to implement and common in FPS games. Visible projectiles (physical objects that travel through space) are more complex but offer different gameplay.

**Decision:** ALL weapons fire visible projectiles. No hitscan weapons. Projectiles are pooled objects (~100 slots via ProjectilePool) with Rapier physics colliders and CCD (Continuous Collision Detection) enabled for fast-moving projectiles.

**Consequences:**
- (+) Better game feel — players see their shots travel, impacts feel weighty
- (+) VR compatibility — projectiles are visible in 3D space, important for VR aiming
- (+) Dodge mechanics — enemies (and players) can dodge visible projectiles, adding skill expression
- (+) Enables Circle 9's reflected shots mechanic (projectiles bounce off walls)
- (+) Visual spectacle — projectile trails, muzzle flashes, impact particles
- (-) More complex physics — need CCD for fast projectiles to avoid tunneling
- (-) Object pooling required to avoid GC pressure (~100 pre-allocated projectile slots)
- (-) Network complexity if multiplayer is added (projectile state sync vs. hitscan validation)

---

## ADR-004: pnpm over npm

**Date:** 2026-02-28 | **Status:** accepted

**Context:** The project was using npm for package management. With a growing dependency tree (Three.js ecosystem, Expo, React Native Web, testing tools, build tools), npm's flat node_modules and duplicate packages caused disk bloat and occasional phantom dependency issues.

**Decision:** Migrate to pnpm as the package manager.

**Consequences:**
- (+) Disk efficiency — content-addressable store, hard links instead of copies
- (+) Strict dependency resolution — packages can only access declared dependencies, preventing phantom deps
- (+) Faster installs — parallel downloads, cached content store
- (+) pnpm-lock.yaml is more deterministic than package-lock.json
- (-) Some tools assume npm (e.g., older CI scripts, some Expo commands) — minor friction
- (-) Team members need pnpm installed globally

---

## ADR-005: Biome over ESLint / Prettier

**Date:** 2026-02-28 | **Status:** accepted

**Context:** The project used ESLint for linting and Prettier for formatting — two separate tools with overlapping concerns, separate configs, and occasional conflicts (e.g., ESLint rules that disagree with Prettier formatting). Configuration sprawl across `.eslintrc`, `.prettierrc`, and plugin configs was growing.

**Decision:** Replace both ESLint and Prettier with Biome 2.4 — a single tool that handles both linting and formatting with minimal configuration.

**Consequences:**
- (+) Single tool — one config file, one command (`pnpm lint`), one mental model
- (+) Significantly faster — Biome is written in Rust, lints+formats in milliseconds
- (+) Less config — Biome's defaults are sensible, minimal `biome.json` needed
- (+) Format and lint unified — no conflicts between formatter and linter rules
- (-) Smaller rule set than ESLint (no plugin ecosystem) — some niche rules unavailable
- (-) Less mature than ESLint — occasional edge cases in newer syntax

---

## ADR-006: Grid Coordinates as Canonical

**Date:** 2026-02-28 | **Status:** accepted

**Context:** The level system operates in two coordinate spaces: grid coordinates (integer cell positions used in the LevelEditor API, room definitions, and entity placement) and world coordinates (floating-point positions used by Three.js, Rapier physics, and the renderer). Early development had bugs from mixing the two — entities placed at grid position (5, 10) being rendered at world position (5, 10) instead of (10, 20).

**Decision:** Grid coordinates are the canonical coordinate system. ALL level data (rooms, entities, triggers, environment zones) uses grid coordinates. The conversion to world coordinates (`worldPos = gridPos * CELL_SIZE` where `CELL_SIZE = 2`) happens exclusively at the adapter boundary in `LevelDbAdapter.ts`. No other code performs this conversion.

**Consequences:**
- (+) Single source of truth — all level data is in one coordinate system
- (+) Prevents coordinate mismatch bugs — conversion happens in exactly one place
- (+) Easier level authoring — grid coordinates are small integers (e.g., room at 5,10 width 8 height 6)
- (+) Database stores compact values
- (-) Must remember that entity positions in the DB are grid coords, not world coords
- (-) Debugging requires mental conversion (multiply by 2) when comparing DB values to renderer positions
