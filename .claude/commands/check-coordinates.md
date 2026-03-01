---
allowed-tools: Read, Bash, Grep, Glob
description: Audit all build scripts and level files for grid/world coordinate mismatches
---

Scan all build scripts and level-related files for potential coordinate mismatches.

## Process

1. Scan all build scripts: `scripts/build-circle-*.ts`
2. Scan level DB source: `src/db/LevelEditor.ts`, `src/db/GridCompiler.ts`
3. Scan level adapter: `src/db/LevelDbAdapter.ts`

## Checks

### CELL_SIZE Multiplication
Search for `CELL_SIZE *` or `* CELL_SIZE` in LevelEditor API calls. Grid coordinates should NOT be multiplied by CELL_SIZE — the engine handles conversion internally.

### Coordinates > 99
Search for coordinate arguments greater than 99 in editor method calls. Grid dimensions are typically under 100. Values like 200, 150, etc. suggest world coordinates were used instead of grid coordinates.

### Suspicious `* 2` Patterns
Search for `* 2` in coordinate arguments. Since CELL_SIZE=2, this pattern often indicates an accidental grid-to-world conversion.

### Negative Coordinates
Search for negative coordinate values in editor calls. Grid coordinates should be non-negative (0-based, top-left origin).

### Entity Outside Room Bounds
For each entity placement, verify the position is within the room it's assigned to:
- `x >= room.boundsX && x < room.boundsX + room.boundsW`
- `z >= room.boundsZ && z < room.boundsZ + room.boundsH`

## Output

Report all coordinate issues found with:
- File and line number
- The problematic value
- Whether it's likely a grid vs world coordinate mistake
- Suggested fix
