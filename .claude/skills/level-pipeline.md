---
name: level-pipeline
description: End-to-end level creation pipeline from design through playtesting
---

# Level Creation Pipeline

Complete workflow for creating a new circle level from design to validation.

## Pipeline Steps

### Step 1: Design the Circle
**Agent:** `@game-designer`
**Command:** N/A (interactive design session)

- Read the Game Bible and player journey for context
- Define the circle's sin, mechanic, boss, and visual theme
- Design room layout with ASCII diagram
- Write the full design doc to `docs/circles/0N-<name>.md`

### Step 2: Design Encounters
**Agent:** `@encounter-designer`
**Command:** `/design-encounter N`

- Read enemy stats and difficulty scaling for this circle
- Design enemy composition for each room type
- Plan wave patterns for arenas
- Balance resource economy (health/ammo pickups)
- Output LevelEditor API calls for all encounters

### Step 3: Build the Level Script
**Agent:** `@level-builder`
**Command:** `/build-circle N`

- Read the design doc and API reference
- Translate all sections into LevelEditor API calls
- Write build script to `scripts/build-circle-N.ts`
- Verify TypeScript compilation

### Step 4: Review the Build Script
**Agent:** `@level-reviewer`
**Command:** `/review-circle N`

- Cross-reference build script against design doc
- Verify rooms, connections, entities, triggers
- Check coordinate bounds safety
- Report PASS/FAIL with itemized issues

### Step 5: Run Playtest
**Agent:** `@playtest-analyst`
**Command:** `/run-playtest N`

- Build the level into the SQLite database
- Run headless A* simulation
- Verify completability and pacing
- Check for softlocks and resource issues

### Step 6: Performance Profile
**Agent:** `@performance-profiler`
**Command:** `/profile-level N`

- Count entities and estimate draw calls
- Audit materials and texture memory
- Scan for per-frame allocation issues
- Verify within mobile performance budget

## Checklist

Use this checklist to track progress through the pipeline:

- [ ] Circle design doc written (`docs/circles/0N-<name>.md`)
- [ ] Encounters designed with proper difficulty scaling
- [ ] Build script created (`scripts/build-circle-N.ts`)
- [ ] TypeScript compilation passes (`npx tsc --noEmit`)
- [ ] Review passes (rooms, connections, entities all correct)
- [ ] Playtest passes (completable, no softlocks)
- [ ] Performance profile acceptable (<200 draw calls, <50 enemies)
- [ ] Level added to `scripts/build-all-circles.ts`

## Iteration

If any step fails, go back to the appropriate earlier step:
- Review failures -> fix build script (Step 3)
- Playtest failures -> fix design or build script (Step 1 or 3)
- Performance failures -> reduce entity count or optimize (Step 2 or 3)
