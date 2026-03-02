# Meshy Asset Explosion — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create ~240 Meshy AI manifests for circle-themed 3D building blocks, wire them into the LevelEditor, update all 9 circle design docs with room-by-room spatial design, update all 9 build scripts to use themed assets, and run player-experience paper playtests.

**Architecture:** Manifests live alongside output GLBs in `assets/models/props/{general,circle-N}/`. The LevelEditor gets a `getAvailableProps()` method that scans manifests at build time. Build scripts use circle-themed asset names instead of generic Quaternius names. A `sync-asset-registry.mjs` script auto-generates `AssetRegistry.ts` entries from manifest files.

**Tech Stack:** Meshy AI (text-to-3D), `prop-direct` pipeline, LevelEditor (SQLite/Drizzle), TypeScript build scripts, Node.js asset sync tooling.

**Branch:** `feat/meshy-prop-pipeline` (current)

---

## Phase 1: LevelEditor Wiring (sequential, do first)

The editor must know about available assets before we can plan spatial layouts.

### Task 1: Create asset discovery utility

**Files:**
- Create: `src/db/AssetDiscovery.ts`
- Test: `src/db/__tests__/AssetDiscovery.test.ts`

**Step 1: Write the failing test**

```typescript
// src/db/__tests__/AssetDiscovery.test.ts
import { discoverMeshyProps } from '../AssetDiscovery';

describe('AssetDiscovery', () => {
  test('discovers general props from manifest files', () => {
    const props = discoverMeshyProps();
    // We have 10 existing general Meshy manifests
    expect(props.general.length).toBeGreaterThanOrEqual(10);
    expect(props.general).toContain('hellfire-brazier');
    expect(props.general).toContain('bone-pile');
  });

  test('discovers circle-specific props', () => {
    const props = discoverMeshyProps();
    // Circle 1 has fog-lantern and limbo-cage
    expect(props['circle-1']).toContain('fog-lantern');
    expect(props['circle-1']).toContain('limbo-cage');
  });

  test('getAvailableProps merges general + circle-specific', () => {
    const props = discoverMeshyProps();
    const available = [...props.general, ...(props['circle-7'] || [])];
    expect(available).toContain('hellfire-brazier'); // general
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- --testPathPattern AssetDiscovery`
Expected: FAIL with "Cannot find module '../AssetDiscovery'"

**Step 3: Write minimal implementation**

```typescript
// src/db/AssetDiscovery.ts
/**
 * AssetDiscovery -- scans assets/models/props/ for Meshy manifest.json files
 * to discover available prop types per circle.
 */
import { existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const PROPS_ROOT = resolve(__dirname, '../../assets/models/props');
const ENEMIES_ROOT = resolve(__dirname, '../../assets/models/enemies');

export interface AssetManifest {
  general: string[];
  [circleKey: string]: string[];
}

function scanManifestDir(root: string): AssetManifest {
  const result: AssetManifest = { general: [] };

  if (!existsSync(root)) return result;

  for (const group of readdirSync(root)) {
    const groupDir = join(root, group);
    const ids: string[] = [];
    try {
      for (const asset of readdirSync(groupDir)) {
        if (existsSync(join(groupDir, asset, 'manifest.json'))) {
          ids.push(asset);
        }
      }
    } catch { /* not a directory */ }
    if (ids.length > 0) {
      result[group] = ids.sort();
    }
  }
  return result;
}

/** Discover all Meshy prop manifests organized by group. */
export function discoverMeshyProps(): AssetManifest {
  return scanManifestDir(PROPS_ROOT);
}

/** Discover all Meshy enemy manifests organized by group. */
export function discoverMeshyEnemies(): AssetManifest {
  return scanManifestDir(ENEMIES_ROOT);
}

/**
 * Get all available prop types for a specific circle.
 * Returns general props + circle-specific props.
 */
export function getAvailablePropsForCircle(circle: number): string[] {
  const props = discoverMeshyProps();
  const circleKey = `circle-${circle}`;
  return [...(props.general || []), ...(props[circleKey] || [])].sort();
}

/**
 * Get all available enemy types for a specific circle.
 * Returns general enemies + circle-specific enemies + bosses.
 */
export function getAvailableEnemiesForCircle(circle: number): string[] {
  const enemies = discoverMeshyEnemies();
  const circleKey = `circle-${circle}`;
  return [
    ...(enemies.general || []),
    ...(enemies[circleKey] || []),
    ...(enemies.bosses || []),
  ].sort();
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- --testPathPattern AssetDiscovery`
Expected: PASS

**Step 5: Commit**

```bash
git add src/db/AssetDiscovery.ts src/db/__tests__/AssetDiscovery.test.ts
git commit -m "feat: add AssetDiscovery utility for Meshy manifest scanning"
```

---

### Task 2: Extend LevelEditor with asset discovery methods

**Files:**
- Modify: `src/db/LevelEditor.ts` (add getAvailableProps, getAvailableEnemies, decorateRoom)
- Test: `src/db/__tests__/LevelEditor.test.ts` (add tests for new methods)

**Step 1: Write the failing test**

Add to existing `src/db/__tests__/LevelEditor.test.ts`:

```typescript
describe('asset discovery', () => {
  test('getAvailableProps returns general + circle props', () => {
    const props = editor.getAvailableProps(7);
    expect(Array.isArray(props)).toBe(true);
    // Should include general Meshy props
    expect(props).toContain('hellfire-brazier');
  });

  test('getAvailableEnemies returns general + circle + boss enemies', () => {
    const enemies = editor.getAvailableEnemies(7);
    expect(Array.isArray(enemies)).toBe(true);
    expect(enemies).toContain('goat-grunt'); // general
  });
});

describe('decorateRoom', () => {
  test('batch-places multiple props in a room', () => {
    const levelId = 'test-level';
    editor.createLevel(levelId, {
      name: 'Test', levelType: 'circle', width: 20, depth: 20, floor: 1, themeId: 'test',
    });
    const roomId = editor.addRoom(levelId, {
      name: 'TestRoom', roomType: 'exploration', x: 0, z: 0, width: 10, depth: 10, sortOrder: 0,
    });

    editor.decorateRoom(levelId, roomId, [
      { type: 'prop_column', x: 2, z: 2 },
      { type: 'prop_torch', x: 5, z: 5, facing: Math.PI },
      { type: 'prop_barrel', x: 8, z: 3, elevation: 1 },
    ]);

    const entities = editor.getEntities(levelId);
    const roomProps = entities.filter(e => e.roomId === roomId && e.spawnCategory === 'prop');
    expect(roomProps.length).toBe(3);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- --testPathPattern LevelEditor`
Expected: FAIL with "editor.getAvailableProps is not a function"

**Step 3: Write minimal implementation**

Add to `LevelEditor` class in `src/db/LevelEditor.ts`:

```typescript
import { getAvailablePropsForCircle, getAvailableEnemiesForCircle } from './AssetDiscovery';

// Inside the LevelEditor class:

  /**
   * Get all available prop types for a specific circle.
   * Scans assets/models/props/ manifest files.
   * Returns general props + circle-specific props.
   */
  getAvailableProps(circle: number): string[] {
    return getAvailablePropsForCircle(circle);
  }

  /**
   * Get all available enemy types for a specific circle.
   * Scans assets/models/enemies/ manifest files.
   * Returns general + circle-specific + boss enemies.
   */
  getAvailableEnemies(circle: number): string[] {
    return getAvailableEnemiesForCircle(circle);
  }

  /**
   * Batch-place multiple props in a room.
   * Reduces boilerplate in build scripts.
   */
  decorateRoom(
    levelId: string,
    roomId: string,
    decorations: Array<{
      type: string;
      x: number;
      z: number;
      elevation?: number;
      facing?: number;
      surfaceAnchor?: {
        face: string;
        offsetX: number;
        offsetY: number;
        offsetZ: number;
        rotation: number[];
        scale: number;
      };
    }>,
  ): string[] {
    return decorations.map(d =>
      this.spawnProp(levelId, d.type, d.x, d.z, {
        roomId,
        elevation: d.elevation,
        facing: d.facing,
        surfaceAnchor: d.surfaceAnchor,
      }),
    );
  }
```

**Step 4: Run tests to verify they pass**

Run: `pnpm test -- --testPathPattern LevelEditor`
Expected: PASS (all existing + new tests)

**Step 5: Commit**

```bash
git add src/db/LevelEditor.ts src/db/__tests__/LevelEditor.test.ts
git commit -m "feat: add asset discovery + decorateRoom to LevelEditor"
```

---

### Task 3: Create sync-asset-registry script

**Files:**
- Create: `scripts/sync-asset-registry.mjs`
- Modify: `package.json` (add sync script)

This script reads all manifest.json files in `assets/models/props/` that have a corresponding `refined.glb` and generates/updates entries in `AssetRegistry.ts`.

**Step 1: Write the script**

```javascript
#!/usr/bin/env node
/**
 * sync-asset-registry.mjs -- Auto-generates PROP_MODEL_ASSETS entries from
 * Meshy manifests that have a corresponding refined.glb.
 *
 * Only adds NEW entries. Does not remove or overwrite existing Quaternius entries.
 *
 * Usage: node scripts/sync-asset-registry.mjs [--dry-run]
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = resolve(__dirname, '..');
const PROPS_ROOT = join(PROJECT_DIR, 'assets', 'models', 'props');
const REGISTRY_PATH = join(PROJECT_DIR, 'src', 'game', 'systems', 'AssetRegistry.ts');

const dryRun = process.argv.includes('--dry-run');

// Scan for manifests with refined.glb
const newEntries = [];
for (const group of readdirSync(PROPS_ROOT).sort()) {
  const groupDir = join(PROPS_ROOT, group);
  try {
    for (const asset of readdirSync(groupDir).sort()) {
      const assetDir = join(groupDir, asset);
      const manifestPath = join(assetDir, 'manifest.json');
      const glbPath = join(assetDir, 'refined.glb');

      if (existsSync(manifestPath) && existsSync(glbPath)) {
        const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
        const key = `prop-${manifest.id}`;
        const requirePath = `../../../assets/models/props/${group}/${asset}/refined.glb`;
        newEntries.push({ key, requirePath, group, id: manifest.id });
      }
    }
  } catch { /* not a directory */ }
}

if (newEntries.length === 0) {
  console.log('No Meshy props with refined.glb found. Nothing to sync.');
  process.exit(0);
}

// Read existing registry
const registryContent = readFileSync(REGISTRY_PATH, 'utf8');

// Check which entries already exist
const existing = new Set();
for (const match of registryContent.matchAll(/'(prop-[^']+)'/g)) {
  existing.add(match[1]);
}

const toAdd = newEntries.filter(e => !existing.has(e.key));

if (toAdd.length === 0) {
  console.log('All Meshy props already in AssetRegistry. Nothing to add.');
  process.exit(0);
}

console.log(`Found ${toAdd.length} new Meshy props to add:`);
for (const entry of toAdd) {
  console.log(`  ${entry.key} (${entry.group}/${entry.id})`);
}

if (dryRun) {
  console.log('\n--dry-run: No changes made.');
  process.exit(0);
}

// Insert new entries before the closing `} as const;` of PROP_MODEL_ASSETS
const marker = '} as const satisfies';
const insertionPoint = registryContent.indexOf(marker);
if (insertionPoint === -1) {
  console.error('ERROR: Could not find PROP_MODEL_ASSETS closing marker in AssetRegistry.ts');
  process.exit(1);
}

const newLines = toAdd.map(e =>
  `  '${e.key}': require('${e.requirePath}'),`
).join('\n');

const comment = `\n  // --- Meshy-generated props (auto-synced by sync-asset-registry.mjs) ---\n`;
const updated = registryContent.slice(0, insertionPoint) + comment + newLines + '\n' + registryContent.slice(insertionPoint);

writeFileSync(REGISTRY_PATH, updated, 'utf8');
console.log(`\nAdded ${toAdd.length} entries to AssetRegistry.ts`);
```

**Step 2: Add package.json script**

Add to `package.json` scripts:
```json
"sync:registry": "node scripts/sync-asset-registry.mjs",
"sync:registry:dry": "node scripts/sync-asset-registry.mjs --dry-run"
```

**Step 3: Verify**

Run: `node scripts/sync-asset-registry.mjs --dry-run`
Expected: "No Meshy props with refined.glb found" (since we haven't generated yet)

**Step 4: Commit**

```bash
git add scripts/sync-asset-registry.mjs package.json
git commit -m "feat: add sync-asset-registry script for auto-generating AssetRegistry entries"
```

---

## Phase 2: Spatial Design + Manifest Generation (parallel per circle)

**IMPORTANT:** These 10 tasks (general + 9 circles) are INDEPENDENT and should be dispatched as parallel agents.

Each task follows the same pattern:
1. Read the circle's design doc
2. For each room: write a "Player Experience" moment (2-3 sentences, first-person)
3. For each room: list which Meshy assets go where (structural, environmental, furniture, hazards)
4. Extract the full asset list
5. Cross-reference against existing manifests
6. Write new manifest.json files for missing assets

### Task 4: General prop kit manifests (52 assets)

**Files:**
- Create: 52 manifests in `assets/models/props/general/<id>/manifest.json`
- Reference: design doc Section 2 (General Kit)

**Asset list — Structural (18):**
- `arch-stone-small`, `arch-stone-medium`, `arch-stone-large`, `arch-gothic`, `arch-rounded`, `arch-broken`
- `pillar-square-short`, `pillar-square-tall`, `pillar-round-classical`, `pillar-round-plain`, `pillar-twisted`, `pillar-broken`
- `stairs-straight-short`, `stairs-straight-long`, `stairs-spiral-quarter`, `ramp-stone-short`, `bridge-segment-stone`, `bridge-railing`

**Asset list — Doors/Frames (6):**
- `doorframe-stone-simple`, `doorframe-stone-heavy`, `doorframe-arch`, `gate-iron-bars`, `portcullis-frame`, `wall-buttress`

**Asset list — Environmental (12):**
- `rubble-pile-small`, `rubble-pile-large`, `debris-scatter`, `chain-hanging-single`, `chain-hanging-cluster`, `chain-wall-mounted`, `rope-hanging`, `fire-pit-small`, `fire-pit-large`, `torch-sconce-ornate`, `torch-sconce-simple`, `demon-relief`

**Asset list — Hazards (8):**
- `spike-bed-small`, `spike-bed-large`, `spike-wall-cluster`, `fire-grate`, `thorn-cluster-small`, `thorn-cluster-large`, `poison-pool`, `pressure-plate-stone`

**Asset list — Ceiling (4):**
- `stalactite-cluster`, `ceiling-beam`, `chandelier-iron`, `cobweb-large`

**Asset list — Floor (4):**
- `floor-grating`, `floor-drain`, `floor-tile-cracked`, `floor-rug-tattered`

**Prompt engineering pattern for general assets:**
```
"A [object description] for a dark fantasy dungeon crawler game, [material details matching stone/iron aesthetic], isolated object on dark background, game asset, [orientation], low poly stylized, [polycount target]"
```

**Step 1:** Write all 52 manifests (each ~15 lines)
**Step 2:** Validate JSON syntax: `find assets/models/props/general -name manifest.json -exec python3 -m json.tool {} \;`
**Step 3:** Commit: `git commit -m "feat: add 52 general prop manifests for Meshy generation"`

---

### Task 5: Circle 1 — Limbo spatial design + manifests (~20 assets)

**Files:**
- Modify: `docs/circles/01-limbo.md` (add 3D Spatial Design section)
- Create: ~20 manifests in `assets/models/props/circle-1/<id>/manifest.json`

**Room-by-room spatial design process:**

1. Read `docs/circles/01-limbo.md` for room layout, dimensions, connections
2. For each room, write:
   - **Player Experience** (2-3 sentences, first-person)
   - **Structural Assets** table (arches at doors, themed pillars, themed stairs/ramps)
   - **Environmental Assets** table (set dressing, atmosphere)
   - **Furniture** table (room-specific interactive-looking objects)
   - **Lighting notes** (which fire-type props emit light)
3. Extract unique asset names → create manifests

**Circle 1 palette:** Concrete020 (cold gray-blue), Rock022 (dark stone), Marble003 (columns). Feel: ancient, crumbling, foggy, abandoned. The first circle — relatively mild, eerie rather than terrifying.

**Expected assets (~20):**
- Structural: `arch-limbo-crumbling`, `arch-limbo-foggy`, `pillar-limbo-ancient`, `pillar-limbo-broken`, `doorframe-limbo-ruined`, `wall-limbo-relief`, `stairs-limbo-weathered`
- Environmental: `fog-vent`, `crumbling-statue`, `ancient-tombstone`, `moss-growth`, `fallen-column-section`, `dried-fountain`
- Furniture: `sarcophagus-ancient`, `stone-lectern`, `broken-altar-limbo`, `stone-bench-weathered`
- Ceiling: `stalactite-limbo`, `cobweb-ancient`
- Boss: `throne-crumbling`

**Step 1:** Update `docs/circles/01-limbo.md` with 3D Spatial Design section
**Step 2:** Write manifests for newly identified assets
**Step 3:** Commit: `git commit -m "feat(circle-1): spatial design + 20 Meshy prop manifests"`

---

### Tasks 6-13: Circles 2-9 spatial design + manifests

Identical pattern to Task 5. Each circle gets:

| Task | Circle | Sin | Theme Palette | Expected Assets |
|------|--------|-----|---------------|-----------------|
| 6 | 2 — Lust | Desire | Marble006, warm amber | ~20 |
| 7 | 3 — Gluttony | Excess | Moss001/Leather004, sickly green | ~22 |
| 8 | 4 — Greed | Avarice | Metal034/DiamondPlate, gold | ~20 |
| 9 | 5 — Wrath | Rage | Concrete034/Rust003, red/iron | ~22 |
| 10 | 6 — Heresy | Defiance | Marble014/Rock022, cold purple | ~20 |
| 11 | 7 — Violence | Bloodshed | Rust003/MetalWalkway, industrial | ~22 |
| 12 | 8 — Fraud | Deception | Marble006/Fabric026, palatial | ~20 |
| 13 | 9 — Treachery | Betrayal | Ice002/Snow003, frozen blue | ~22 |

**Per-task steps are identical to Task 5:**
1. Update design doc with 3D Spatial Design section per room
2. Write player experience moments for each room
3. Identify asset needs per room
4. Create manifest files
5. Commit

---

## Phase 3: Paper Playtest (sequential, after Phase 2)

### Task 14: Player-experience paper playtest

**Files:**
- Create: `docs/playtests/2026-03-01-experience-playtest.md`

**Process:** Walk through all 9 circles as 3 player personas:

1. **"First-timer"** — Never played a boomer shooter. Notices environmental storytelling. What do they SEE? Does the environment communicate the sin? Do they understand they're descending through Hell?

2. **"Speedrunner"** — Blasts through. Do structural assets (arches, pillars) create interesting movement corridors? Do rooms feel distinct enough to navigate by sight? Are there interesting skip routes through platforming sections?

3. **"Explorer"** — Checks every corner. Do rooms reward exploration with visual richness? Are secret rooms visually distinct? Do boss rooms feel climactic and unique?

**For each circle, note:**
- Rooms that feel visually EMPTY and need more assets
- Rooms that feel visually CLUTTERED and need fewer
- Transitions between circles — does the palette shift feel dramatic enough?
- Boss room — does the centerpiece create the right dramatic moment?
- Missing asset types not covered by current manifests

**Output:** Markdown report with gap analysis → additional manifests if needed.

**Step 1:** Walk all 9 circles as all 3 personas, documenting findings
**Step 2:** Identify gaps and create additional manifests
**Step 3:** Commit: `git commit -m "docs: player-experience paper playtest with gap analysis"`

---

## Phase 4: Build Script Updates (parallel per circle)

**IMPORTANT:** These 9 tasks are INDEPENDENT and should be dispatched as parallel agents after Phase 2 + Phase 3 are complete.

### Task 15: Update Circle 1 build script with themed assets

**Files:**
- Modify: `scripts/build-circle-1.ts`
- Reference: Updated `docs/circles/01-limbo.md` (3D Spatial Design section)

**Process:**
1. Read the updated design doc's 3D Spatial Design section
2. For each room: replace generic `Column_Stone`, `Chain_Coil`, `Barrel` with themed assets
3. Add structural assets at door positions (arches, doorframes)
4. Add environmental set dressing per room
5. Add boss room centerpiece
6. Use `editor.decorateRoom()` for batch placements where appropriate
7. Use `editor.getAvailableProps(1)` to verify asset availability

**Example transformation:**
```typescript
// Before:
editor.spawnProp(LEVEL_ID, 'Column_Stone', 5, 5, { roomId: vestibuleId });

// After:
editor.spawnProp(LEVEL_ID, 'pillar-limbo-ancient', 5, 5, { roomId: vestibuleId });
```

**Step 1:** Update build script
**Step 2:** Run build: `npx tsx scripts/build-circle-1.ts`
**Step 3:** Run playtest: `npx tsx scripts/playtest-circle.ts 1` (verify still completable)
**Step 4:** Commit: `git commit -m "feat(circle-1): use themed Meshy assets in build script"`

### Tasks 16-23: Update Circles 2-9 build scripts

Identical pattern to Task 15. Each task:
1. Reads updated design doc
2. Replaces generic props with themed Meshy assets
3. Adds structural/environmental/boss assets
4. Verifies build + playtest pass
5. Commits

---

## Phase 5: Integration Verification

### Task 24: Full verification pass

**Step 1:** Run all tests
```bash
pnpm test
```
Expected: 294+ tests passing (new AssetDiscovery tests added)

**Step 2:** TypeScript check
```bash
npx tsc --noEmit
```
Expected: Clean

**Step 3:** Lint
```bash
pnpm lint
```
Expected: Clean

**Step 4:** Build all circles and verify
```bash
for i in $(seq 1 9); do npx tsx scripts/build-circle-$i.ts; done
```
Expected: All 9 circles build without errors

**Step 5:** Count manifests
```bash
find assets/models/props -name manifest.json | wc -l
find assets/models/enemies -name manifest.json | wc -l
```
Expected: ~271 prop manifests, 22 enemy manifests

**Step 6:** Verify JSON validity
```bash
find assets/models -name manifest.json -exec python3 -m json.tool {} > /dev/null \;
```
Expected: No JSON parse errors

**Step 7:** Commit verification results
```bash
git commit -m "chore: full verification pass — all tests, builds, and manifests validated"
```

---

## Execution Summary

| Phase | Tasks | Parallelizable? | Depends On |
|-------|-------|-----------------|------------|
| 1: LevelEditor Wiring | 1-3 | Sequential | Nothing |
| 2: Spatial Design + Manifests | 4-13 | YES (10 parallel agents) | Phase 1 |
| 3: Paper Playtest | 14 | Sequential | Phase 2 |
| 4: Build Script Updates | 15-23 | YES (9 parallel agents) | Phase 2 + 3 |
| 5: Integration Verification | 24 | Sequential | Phase 4 |

**Total: 24 tasks, ~293 manifest files, 9 updated design docs, 9 updated build scripts, 1 new playtest report**
