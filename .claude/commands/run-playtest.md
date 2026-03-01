---
allowed-tools: Read, Bash, Grep, Glob
description: Run a headless playtest simulation on a circle with verbose analysis
---

Run a headless playtest on circle $ARGUMENTS with verbose analysis.

## Process

1. Verify the circle has been built:
   - Check if `scripts/build-circle-$ARGUMENTS.ts` exists
   - Check if the level exists in `assets/levels.db`

2. If the build script exists but level may not be in DB:
   ```bash
   npx tsx scripts/build-circle-$ARGUMENTS.ts assets/levels.db
   ```

3. Run the playtest:
   ```bash
   npx tsx scripts/playtest-all.ts circle-$ARGUMENTS-*
   ```

4. Analyze results using the `@playtest-analyst` agent:
   - Completability (all rooms visited, all enemies killed)
   - Pacing (time per room, visit order vs sortOrder)
   - Softlock detection (position stagnation, unreachable rooms)
   - Resource economy (enough health/ammo to survive)

## Output

Detailed playtest report with:
- PASS/FAIL result
- Room visit order with timing
- Issues found with severity
- Specific recommendations for fixes
