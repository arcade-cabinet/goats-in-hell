---
allowed-tools: Read, Bash, Grep, Glob
description: Performance analysis for a specific level — entity counts, draw call estimates, material audit
---

Profile level `$ARGUMENTS` for performance.

## Process

1. Read the level data from the database or build script:
   - If a build script exists: `scripts/build-circle-$ARGUMENTS.ts`
   - Otherwise load from `assets/levels.db`

2. Count entities by type:
   - Enemies (by enemy type)
   - Pickups
   - Props
   - Triggers
   - Environment zones

3. Estimate draw calls:
   - Level geometry (from `src/r3f/level/LevelMeshes.tsx`)
   - Unique materials (from `src/r3f/level/Materials.ts`)
   - Enemy meshes (instanced vs individual)
   - Projectile pool size
   - Particle budget (MAX_ACTIVE_PARTICLES=300)

4. Scan for per-frame allocation issues in related R3F components

5. Check texture/GLB sizes for assets used by this level's theme

Use the `@performance-profiler` agent for the detailed analysis.

## Output

Report the performance profile with risk level (LOW/MEDIUM/HIGH/CRITICAL) and actionable recommendations.
