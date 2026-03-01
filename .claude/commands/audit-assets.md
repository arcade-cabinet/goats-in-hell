---
allowed-tools: Read, Bash, Grep, Glob
description: Audit all game assets for size limits, format compliance, naming conventions, and registry completeness
---

Audit all game assets in the `assets/` directory.

## Process

1. Scan `assets/` recursively for all asset files:
   - GLB models (`.glb`)
   - Textures (`.jpg`, `.jpeg`, `.png`)
   - Audio (`.ogg`, `.mp3`, `.wav`)

2. Check each asset against size limits:
   - Weapon GLBs: <300KB
   - Enemy GLBs: <2MB
   - Boss GLBs: <3MB
   - Prop GLBs: <100KB
   - Textures: 1024px max

3. Verify naming conventions:
   - Lowercase, hyphenated, no spaces
   - Category prefix (weapon-, enemy-, boss-, prop-, sfx-, music-)

4. Cross-reference against `src/game/systems/AssetRegistry.ts`:
   - Every file should be registered
   - No registry entries pointing to missing files

5. Identify orphaned assets not referenced in any source file

Use the `@asset-validator` agent for the detailed validation.

## Output

Report with total assets, passing count, warnings, and errors with specific fix actions.
