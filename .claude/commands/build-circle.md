---
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Task
description: Build a Dante circle level from its design document using the LevelEditor API
---

Build circle level $ARGUMENTS from its design document.

## Context Files to Read

1. `docs/agents/level-editor-api.md` — LevelEditor API reference
2. `docs/agents/circle-building-guide.md` — How to translate designs to code
3. `docs/circles/0$ARGUMENTS-*.md` — The circle design document

## Process

1. Read the circle design document
2. Create `scripts/build-circle-$ARGUMENTS.ts` following the build script template
3. Translate all sections:
   - Theme from "Theme Configuration"
   - Level from "Identity" + "Grid Dimensions"
   - Rooms from "Room Placement" table
   - Connections from "Connections" table
   - Enemies from "Entities > Enemies" table
   - Pickups from "Entities > Pickups" table
   - Props from "Entities > Props" table
   - Triggers from "Triggers" table
   - Environment zones from "Environment Zones" table
   - Player spawn from "Player Spawn" section
4. Compile and validate
5. Run `npx tsc --noEmit` to verify TypeScript
6. Report results

Use the `@level-builder` agent for implementation.
