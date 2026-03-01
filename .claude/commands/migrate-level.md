---
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
description: Migrate a hand-coded level file to LevelEditor API format for the SQLite database
---

Migrate the hand-coded level file at `$ARGUMENTS` to the LevelEditor API format.

## Process

1. Read the hand-coded level file at `$ARGUMENTS`
2. Read the LevelEditor API reference: `docs/agents/level-editor-api.md`
3. Read the building guide: `docs/agents/circle-building-guide.md`

4. Analyze the hand-coded level:
   - Identify room definitions (position, size, type)
   - Identify connections between rooms
   - Identify entity placements (enemies, pickups, props)
   - Identify triggers and environment zones
   - Identify player spawn position
   - Identify theme/material settings

5. Generate a build script that recreates the level using the LevelEditor API:
   - Follow the standard build script template from `@level-builder`
   - Convert all world coordinates to grid coordinates (divide by CELL_SIZE=2)
   - Use exported constants (TRIGGER_ACTIONS, ROOM_TYPES, etc.)
   - Include compile() and validate() calls

6. Write the build script to `scripts/build-<level-name>.ts`

7. Run `npx tsc --noEmit` to verify it compiles

## Output

Report:
- Number of rooms, connections, entities migrated
- Any elements that couldn't be automatically migrated
- Any coordinate conversion issues detected
