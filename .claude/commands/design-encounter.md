---
allowed-tools: Read, Write, Edit, Grep, Glob
description: Interactive encounter design for a specific circle — enemy composition, waves, resources
---

Design combat encounters for circle $ARGUMENTS.

## Context Files to Read

1. `docs/circles/0$ARGUMENTS-*.md` — The circle design document
2. `src/game/entities/enemyStats.ts` — Enemy stats reference
3. `docs/agents/level-editor-api.md` — LevelEditor API for placing entities
4. `docs/GAME-BIBLE.md` — Tone and progression philosophy

## Process

1. Read the circle design doc to understand:
   - The circle's sin and dominant mechanic
   - Room layout and types (exploration, arena, boss)
   - Existing enemy placement (if any)

2. For each room that needs encounters:
   - Select appropriate enemy types for this circle
   - Apply difficulty scaling for the circle number
   - Balance wave composition (explore: 2-4, arena: 3-5 waves, boss: 1 with adds)

3. Design resource placement:
   - Health pickups: 1 per exploration room, 1 per 2 arena waves
   - Ammo pickups: 1 per exploration room, 1 per 2 arena waves
   - Weapon pickups in secret rooms (if applicable)

4. Output ready-to-paste LevelEditor API calls

Use the `@encounter-designer` agent for the detailed design work.

## Output

Provide LevelEditor API calls for all encounters in the circle, with comments explaining the design rationale for each encounter.
