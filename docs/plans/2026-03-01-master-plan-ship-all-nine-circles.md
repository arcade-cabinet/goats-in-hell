# Ship All Nine Circles — Master Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship a complete, visually-dressed, AI-playable 9-circle Dante's Inferno FPS. Fix the systemic prop-naming blocker, overhaul every build script with correct asset names and playtest-driven additions, build the unified YUKA brain assembly, and validate with an automated full-game playthrough.

**Architecture:** Four parallel workstreams converging on a single integration milestone:
- WS-A: Prop Name Mapping Layer (prerequisite for WS-B)
- WS-B: Circle Build Script Overhaul (9 circles, depends on WS-A)
- WS-C: YUKA Brain Assembly (12 tasks, independent of WS-A/B)
- WS-D: Integration & Playthrough Validation (depends on WS-B + WS-C)

**Tech Stack:** TypeScript, LevelEditor API (SQLite/Drizzle), YUKA goal system, Zustand, Miniplex ECS, React Three Fiber.

**Supersedes:** `docs/plans/2026-03-01-ai-governor-overhaul-design.md` (folded into WS-C)

---

## Playtest Findings Summary

### P0 — Systemic Blocker (All 9 Circles)

Every build script uses Fantasy Props MegaKit names (`Torch_Metal`, `CandleStick_Triple`, `Column_Stone`, `Chain_Coil`, etc.) that don't match ANY asset in the 319-prop inventory:
- 62 Quaternius GLBs use `prop-` prefixed kebab-case (`prop-torch-mounted`, `prop-column`, etc.)
- 62 general Meshy props (manifests only, no GLBs yet)
- 195 circle-specific Meshy props (manifests only, no GLBs yet, ZERO placed in any script)

**Until the naming mismatch is resolved, zero props render in-game.**

### Per-Circle Assessment

| Circle | Avg Props/Room | Worst Room | Critical Gaps |
|--------|---------------|------------|---------------|
| 1 Limbo | 4.7 | Boss (0.03/cell) | Bone Pit has no bones. Crypt has 2 props. Boss room has zero cover. |
| 2 Lust | 10.1 | Siren Pit (0.04/cell) | Marble throne missing (Chest_Wood placeholder). Ramp bare. No lava borders. |
| 3 Gluttony | 19.3 | Vorago's Maw (0.05/cell) | Boss room reads "acid room with chains" not "stomach." Zero organic props. |
| 4 Greed | ~10 | Weight Room (0.06/cell) | Weight Room critically empty. Missing throne in boss. No pressure plates. |
| 5 Wrath | ~12 | Rage Pit (0.06/cell) | Blood Marsh under-dressed. Rage Pit barren. Colosseum sand is empty. |
| 6 Heresy | ~11 | Ossuary (thematic fail) | ZERO bones in Ossuary/Catacombs. Missing columns in Nave. No pentagram. |
| 7 Violence | 6.5 | Thornwood (0.006/cell) | Thornwood 1 prop/168 cells. Burning Shore 0 props/180 cells. |
| 8 Fraud | 7.0 | Hall of Mirrors (0.04/cell) | Missing silhouette props. Missing onyx panels. Missing fake columns. |
| 9 Treachery | 6.25 | Boss (0.01/cell) | Final boss: 4 props in 400 cells. Arena: 4 props in 288 cells. |

### Boss Rooms Ranked

| Boss Room | Props/Cell | Verdict |
|-----------|-----------|---------|
| Azazel's Frozen Throne (C9) | 0.010 | CRITICALLY LOW — final boss of entire game |
| Il Vecchio's Chamber (C1) | 0.035 | CRITICALLY LOW — first boss encounter |
| Vorago's Maw (C3) | 0.046 | NEEDS WORK — stomach concept under-executed |
| Caprone's Sanctum (C2) | 0.066 | NEEDS WORK — south half barren |
| Aureo's Court (C4) | 0.092 | NEEDS WORK — missing throne hero piece |
| Profano's Chapel (C6) | 0.061 | NEEDS WORK — missing pentagram, altar undersold |
| Furia's Colosseum (C5) | 0.086 | GOOD — chains serve dual purpose |
| Il Macello's Abattoir (C7) | 0.066 | ADEQUATE |
| Inganno's Parlor (C8) | 0.077 | ADEQUATE |

---

## WS-A: Prop Name Mapping Layer

### Task 1: Create Prop Name Mapping Module

**Files:**
- Create: `src/game/propNameMap.ts`
- Modify: `src/db/LevelEditor.ts` (use map in `spawnProp`)
- Test: `src/game/__tests__/propNameMap.test.ts`

**Step 1: Write the failing test**

```typescript
// src/game/__tests__/propNameMap.test.ts
import { resolveAssetName, PROP_NAME_MAP } from '../propNameMap';

describe('propNameMap', () => {
  test('maps Fantasy Props MegaKit names to Quaternius GLBs', () => {
    expect(resolveAssetName('Torch_Metal')).toBe('prop-torch-mounted');
    expect(resolveAssetName('Column_Stone')).toBe('prop-column');
    expect(resolveAssetName('Barrel')).toBe('prop-barrel');
    expect(resolveAssetName('Chain_Coil')).toBe('chain-hanging-single');
    expect(resolveAssetName('CandleStick_Triple')).toBe('prop-candelabrum-tall');
    expect(resolveAssetName('Chalice')).toBe('prop-chalice');
    expect(resolveAssetName('Chair_1')).toBe('prop-chair');
    expect(resolveAssetName('Chest_Wood')).toBe('prop-chest');
    expect(resolveAssetName('Banner_1')).toBe('prop-banner-wall');
    expect(resolveAssetName('Banner_2')).toBe('prop-banner-wall');
  });

  test('passes through already-correct names unchanged', () => {
    expect(resolveAssetName('prop-barrel')).toBe('prop-barrel');
    expect(resolveAssetName('prop-column')).toBe('prop-column');
    expect(resolveAssetName('lust-marble-throne')).toBe('lust-marble-throne');
  });

  test('passes through unknown names with warning', () => {
    expect(resolveAssetName('NonExistent_Prop')).toBe('NonExistent_Prop');
  });

  test('map covers all Fantasy Props names used in build scripts', () => {
    const allUsedNames = [
      'Torch_Metal', 'CandleStick_Triple', 'Column_Stone', 'Column_Onyx',
      'Chain_Coil', 'Banner_1', 'Banner_2', 'Barrel', 'Barrel_Apples',
      'Cage_Small', 'Vase_2', 'Vase_4', 'Vase_Rubble', 'Chalice',
      'Chair_1', 'Chest_Wood', 'Scroll_1', 'Scroll_2', 'BookStand',
      'Bookcase_2', 'Book_5', 'Book_7', 'Candle_1', 'Candle_2',
      'Chandelier', 'Cabinet', 'Bench', 'Bucket_Wooden', 'Bucket_Metal',
      'Table_Large', 'Table_Plate', 'Table_Fork', 'Table_Knife', 'Table_Spoon',
      'Mug', 'SmallBottle', 'SmallBottles_1', 'FarmCrate_Apple',
      'Shelf_Arch', 'Crate_Wooden', 'Rope_1', 'Rope_2', 'Rope_3',
      'Cauldron', 'Anvil', 'WeaponStand', 'Shield_Wooden', 'Sword_Bronze',
      'Lantern_Wall', 'Potion_4', 'Coin_Pile', 'Coin_Pile_2',
      'Bed_Twin1', 'Workbench', 'Crate_Metal'
    ];
    for (const name of allUsedNames) {
      expect(PROP_NAME_MAP[name]).toBeDefined();
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- --testPathPattern=propNameMap`
Expected: FAIL — module not found

**Step 3: Write implementation**

```typescript
// src/game/propNameMap.ts
/** PropNameMap -- resolves Fantasy Props MegaKit names to actual asset GLB names. */

/**
 * Maps legacy Fantasy Props MegaKit prop names (PascalCase/underscore)
 * to actual asset names (kebab-case with prefix).
 *
 * Three tiers of resolution:
 * 1. Direct Quaternius match (has GLB, renders now)
 * 2. Meshy general prop match (manifest exists, GLB pending)
 * 3. Circle-specific Meshy match (manifest exists, GLB pending)
 *
 * Names already in correct format pass through unchanged.
 */
export const PROP_NAME_MAP: Record<string, string> = {
  // === Lighting ===
  Torch_Metal: 'prop-torch-mounted',
  CandleStick_Triple: 'prop-candelabrum-tall',
  Candle_1: 'prop-candle',
  Candle_2: 'prop-candle',
  Chandelier: 'prop-candelabrum-tall', // closest Quaternius match
  Lantern_Wall: 'prop-torch-mounted', // wall-mounted lighting

  // === Structural ===
  Column_Stone: 'prop-column',
  Column_Onyx: 'prop-column', // overridden per-circle with lust-onyx-column etc.
  Bench: 'prop-chair', // closest functional match

  // === Chains / Hanging ===
  Chain_Coil: 'chain-hanging-single', // Meshy general
  Rope_1: 'chain-hanging-single',
  Rope_2: 'chain-hanging-single',
  Rope_3: 'chain-hanging-single',

  // === Containers ===
  Barrel: 'prop-barrel',
  Barrel_Apples: 'prop-barrel',
  Bucket_Wooden: 'prop-bucket',
  Bucket_Metal: 'prop-bucket',
  Crate_Wooden: 'prop-crate',
  Crate_Metal: 'prop-crate',
  Chest_Wood: 'prop-chest',

  // === Décor ===
  Banner_1: 'prop-banner-wall',
  Banner_2: 'prop-banner-wall',
  Vase_2: 'prop-vase',
  Vase_4: 'prop-vase',
  Vase_Rubble: 'prop-broken-pot',
  Cage_Small: 'prop-cage', // Meshy general if exists, else keep

  // === Furniture ===
  Chair_1: 'prop-chair',
  Table_Large: 'prop-table',
  Bed_Twin1: 'prop-chest', // placeholder — no bed GLB
  Cabinet: 'prop-bookcase',
  Bookcase_2: 'prop-bookcase',

  // === Tableware ===
  Chalice: 'prop-chalice',
  Mug: 'prop-bowl',
  Table_Plate: 'prop-bowl',
  Table_Fork: 'prop-bowl', // tiny props — use bowl as group placeholder
  Table_Knife: 'prop-bowl',
  Table_Spoon: 'prop-bowl',
  SmallBottle: 'prop-potion',
  SmallBottles_1: 'prop-potion',
  Potion_4: 'prop-potion',
  Coin_Pile: 'prop-chest-gold', // closest value indicator
  Coin_Pile_2: 'prop-chest-gold',

  // === Books / Scrolls ===
  BookStand: 'prop-book-open',
  Book_5: 'prop-book-open',
  Book_7: 'prop-book-open',
  Scroll_1: 'prop-book-open',
  Scroll_2: 'prop-book-open',

  // === Food / Farm ===
  FarmCrate_Apple: 'prop-crate',
  Shelf_Arch: 'prop-bookcase', // shelving — closest match
  Cauldron: 'prop-firebasket', // closest Quaternius

  // === Weapons / Military ===
  Anvil: 'prop-anvil', // may need Meshy
  WeaponStand: 'prop-sword-wall',
  Shield_Wooden: 'prop-shield-wall',
  Sword_Bronze: 'prop-sword-wall',
  Workbench: 'prop-table', // functional match

  // === Misc ===
  Bed_Twin1: 'prop-chest', // no bed in Quaternius
};

/**
 * Resolve a prop name to its actual asset GLB name.
 * If the name is already in correct format (kebab-case with prefix), pass through.
 * If it's a Fantasy Props MegaKit name, map it.
 * Unknown names pass through with a console warning.
 */
export function resolveAssetName(name: string): string {
  // Already correct format (kebab-case, starts with known prefix)
  if (name.includes('-') && !name.includes('_')) return name;

  const mapped = PROP_NAME_MAP[name];
  if (mapped) return mapped;

  if (import.meta.env?.DEV) {
    console.warn(`[propNameMap] Unknown prop name: "${name}" — passing through unmapped`);
  }
  return name;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- --testPathPattern=propNameMap`
Expected: PASS

**Step 5: Wire into LevelEditor**

Modify `src/db/LevelEditor.ts` — in `spawnProp()`, resolve the prop name before inserting:

```typescript
import { resolveAssetName } from '../game/propNameMap';

// In spawnProp():
const resolvedName = resolveAssetName(propName);
// Use resolvedName for the DB insert
```

**Step 6: Commit**

```bash
git add src/game/propNameMap.ts src/game/__tests__/propNameMap.test.ts src/db/LevelEditor.ts
git commit -m "feat: prop name mapping layer — resolves Fantasy Props names to actual GLBs"
```

---

## WS-B: Circle Build Script Overhaul (9 Tasks)

### Dependencies

- Depends on WS-A Task 1 (prop name mapping layer must exist)

### Approach

For each circle, the overhaul has 3 phases:
1. **Replace** all Fantasy Props MegaKit names with the correct mapped names (or preferably, direct circle-specific/Quaternius names)
2. **Add** props per playtest P0/P1 recommendations (bones, columns, borders, hero pieces)
3. **Verify** via `pnpm test` and the headless playtest runner

### Task 2: Circle 1 — Limbo Overhaul

**Files:**
- Modify: `scripts/build-circle-1-limbo.ts`

**Changes (from Act 1 playtest):**
- Replace ALL Fantasy Props names with Quaternius kebab-case names
- Vestibule: +`prop-cobweb`(x2), +`prop-rock1`(x2), replace Scroll_2→`prop-book-open`
- Fog Hall: +`prop-column`(x3) for fog silhouettes, +`prop-bones`(x3), +`prop-cobweb`(x1)
- Crypt: +`prop-pedestal`(x1) for weapon display, +`prop-cobweb`(x2), +`prop-skull`(x2), +`prop-bones`(x1)
- Bone Pit: +`prop-bones`(x4), +`prop-bones2`(x2), +`prop-skull`(x3), +`prop-spikes`(x2)
- Columns: Replace Column_Stone→`prop-column`, +`prop-column-broken`(x2), +`prop-rock1`(x2)
- Boss Chamber: +`prop-column`(x4) for cover, +`prop-candelabrum-tall`(x2), +`prop-skull`(x4)

**Verification:**
```bash
npx tsx scripts/build-circle-1-limbo.ts
pnpm test -- --testPathPattern="circle.*1|limbo"
```

**Commit:** `fix(circle-1): overhaul prop names and density per playtest audit`

### Task 3: Circle 2 — Lust Overhaul

**Files:**
- Modify: `scripts/build-circle-2-lust.ts`

**Changes (from Act 1 playtest):**
- Replace ALL Fantasy Props names with correct names
- Antechamber: +`prop-carpet`(x1)
- Wind Corridor: Replace Banner_2→`prop-banner-wall`
- Lover's Gallery: Replace Column_Onyx→`prop-column` (or `lust-onyx-column` when available)
- Siren Pit: +`prop-firebasket`(x2) on ramp segments
- Tempest Hall: +`prop-column`(x4) at bridge entrances
- Boudoir: Replace Bed_Twin1→best match, add `prop-carpet`
- Boss: Replace Chest_Wood→`prop-chest-gold` (throne placeholder), +`prop-carpet`(x1), +`prop-column`(x2)

**Commit:** `fix(circle-2): overhaul prop names and density per playtest audit`

### Task 4: Circle 3 — Gluttony Overhaul

**Files:**
- Modify: `scripts/build-circle-3-gluttony.ts`

**Changes (from Act 1 playtest):**
- Replace ALL Fantasy Props names
- Gullet: Replace Lantern_Wall→`prop-torch-mounted`, Bucket_Wooden→`prop-bucket`
- Feast Hall: Replace Table_Large→`prop-table`, reduce cutlery from 12→8
- Larder: Replace Shelf_Arch→`prop-bookcase`, Barrel→`prop-barrel`, Crate_Wooden→`prop-crate`
- Bile Cistern: +`prop-bones`(x3) along walkway edges
- Gut Arena: +`prop-column`(x4) at bridge entries
- Vorago's Maw: +`prop-bones`(x4), +`prop-cobweb`(x2), increase Chain_Coil→4-6

**Commit:** `fix(circle-3): overhaul prop names and density per playtest audit`

### Task 5: Circle 4 — Greed Overhaul

**Files:**
- Modify: `scripts/build-circle-4-greed.ts`

**Changes (from Act 2 playtest):**
- Replace ALL Fantasy Props names
- Weight Room: +`prop-bones`(x2), +`prop-skull`(x2), +`prop-torch-mounted`(x2)
- Reliquary: +`prop-pedestal`(x1) under chest
- Auction Hall: Replace Column_Stone→`prop-column`, +`prop-broken-pot`(x3)
- Boss: +`prop-column`(x2) flanking, replace placeholder throne with `prop-chest-gold`

**Commit:** `fix(circle-4): overhaul prop names and density per playtest audit`

### Task 6: Circle 5 — Wrath Overhaul

**Files:**
- Modify: `scripts/build-circle-5-wrath.ts`

**Changes (from Act 2 playtest):**
- Replace ALL Fantasy Props names
- Blood Marsh: +`prop-dead-tree`(x3), +`prop-bones`(x2), +`prop-rock1`(x2)
- Rage Pit: +`prop-column-broken`(x3), +`prop-bones`(x3), +`prop-spikes`(x1)
- Arsenal: Replace WeaponStand→`prop-sword-wall`, Shield_Wooden→`prop-shield-wall`, Sword_Bronze→`prop-sword-wall`, +`prop-pedestal`(x1)
- Berserker Arena: +`prop-broken-pot`(x3) at edges
- Gauntlet: +`prop-bones`(x2), +`prop-skull`(x2)
- Boss: +`prop-skull`(x4), +`prop-bones`(x3) on sand

**Commit:** `fix(circle-5): overhaul prop names and density per playtest audit`

### Task 7: Circle 6 — Heresy Overhaul

**Files:**
- Modify: `scripts/build-circle-6-heresy.ts`

**Changes (from Act 2 playtest — MOST CRITICAL):**
- Replace ALL Fantasy Props names
- Narthex: +`prop-torch-mounted`(x1) near east WALL_SECRET (critical teach fix)
- Nave of Lies: +`prop-column`(x6) along sides, +`prop-carpet`(x1) center aisle
- Catacombs: +`prop-bones`(x6), +`prop-bones2`(x2), +`prop-skull`(x4), +`prop-cobweb`(x2)
- Ossuary: OVERHAUL — +`prop-bones`(x8), +`prop-skull`(x4), +`prop-bone`(x4), reduce Chain_Coil to 2, replace Vase→`prop-broken-pot`
- Trial Chamber: +`prop-column`(x4) flanking bench, +`prop-carpet`(x1)
- Library: Replace Bookcase_2→`prop-bookcase`, +`prop-cobweb`(x1)
- Boss Chapel: +`prop-column`(x4), +`prop-candle`(x4) around pentagram points

**Commit:** `fix(circle-6): overhaul prop names and density — bones in Ossuary/Catacombs`

### Task 8: Circle 7 — Violence Overhaul

**Files:**
- Modify: `scripts/build-circle-7-violence.ts`

**Changes (from Act 3 playtest):**
- Replace ALL Fantasy Props names
- Blood River: +`prop-bones`(x4), +`prop-skull`(x3), +`prop-column`(x2)
- Thorny Passage: +`prop-spikes`(x4) along thorn walls
- Thornwood: +`prop-dead-tree`(x3), +`prop-bones`(x4), +`prop-skull`(x3) — room goes from 1 to ~11 props
- Burning Shore: +`prop-rock1`(x3) for minimal visual break — room goes from 0 to ~3 props
- Slaughterhouse: Replace Chain_Coil with proper names
- Boss: Replace generic props, +`prop-skull`(x3), +`prop-bones`(x2)

**Commit:** `fix(circle-7): overhaul prop names and density — Thornwood/Burning Shore dressed`

### Task 9: Circle 8 — Fraud Overhaul

**Files:**
- Modify: `scripts/build-circle-8-fraud.ts`

**Changes (from Act 3 playtest):**
- Replace ALL Fantasy Props names
- Hall of Mirrors: +`prop-column`(x4), +`prop-pedestal`(x2) with `prop-chalice`
- Bolgia of Flatterers: Add note/TODO for `fraud-silhouette-prop` when Meshy available
- Bolgia of Thieves: Replace Chest_Wood→`prop-chest`, Coin_Pile→`prop-chest-gold`
- Shifting Maze: Replace Vase_Rubble→`prop-broken-pot`
- Counterfeit Arena: Replace Column_Stone→`prop-column`, +`prop-column-broken`(x1)
- Serenissima: Replace Chest_Wood→`prop-chest-gold`, +`prop-carpet`(x1)
- Boss: Replace Bookcase_2→`prop-bookcase`, +`prop-carpet`(x1)

**Commit:** `fix(circle-8): overhaul prop names and density per playtest audit`

### Task 10: Circle 9 — Treachery Overhaul

**Files:**
- Modify: `scripts/build-circle-9-treachery.ts`

**Changes (from Act 3 playtest — MOST CRITICAL for boss rooms):**
- Replace ALL Fantasy Props names
- Glacial Stairs: Replace Lantern_Wall→`prop-torch-mounted`, +`prop-crystal`(x3), +`prop-rock1`(x2)
- Caina: Replace Column_Stone→`prop-column`, Cage_Small→`prop-cage`, +`prop-crystal`(x2), +`prop-bones`(x2)
- Antenora: Replace Banner_1→`prop-banner-wall`, Shield_Wooden→`prop-shield-wall`
- Ptolomea: Replace Table_Large→`prop-table`, Chalice→`prop-chalice`
- Giudecca Arena: +`prop-column`(x6) for cover, +`prop-crystal`(x4) ceiling, +`prop-crystal2`(x4) — room goes from 4 to ~18 props
- Judas Trap: Replace Cage_Small→`prop-cage`, +`prop-bones`(x1)
- Boss: +`prop-column`(x4), +`prop-crystal`(x4), +`prop-crystal2`(x2) — room goes from 4 to ~14 props

**Commit:** `fix(circle-9): overhaul prop names and density — final boss/arena dressed`

---

## WS-C: YUKA Brain Assembly

Full implementation plan in `docs/plans/2026-03-01-yuka-brain-assembly-implementation.md` (12 tasks).

### Summary of Tasks

| Task | Component | Status |
|------|-----------|--------|
| C1 | GameEventBus | Independent, new file |
| C2 | BrainContext + BrainRegistry | Independent, new files |
| C3 | Enemy Leaf Goals (HuntPlayer, FleeFromDanger, SeekPickup, Patrol) | Depends on C2 |
| C4 | Boss Composite Goals (ArchGoatBrain, InfernoGoatBrain, VoidGoatBrain, IronGoatBrain) | Depends on C3 |
| C5 | Enemy GoalEvaluators (AggressionEval, SurvivalEval, PatrolEval) | Depends on C3 |
| C6 | Wire EnemyBrainFactory into AISystem.ts | Depends on C3+C4+C5 |
| C7 | Player Leaf Goals (HuntEnemy, SeekPickup, FleeFromThreat, ExploreLevel) | Depends on C2 |
| C8 | Player Strategic Goals (PlayThroughGame, ClearCircle, ClearFloor, SurviveArena, DefeatBoss) | Depends on C7 |
| C9 | Screenshot Service + Run Report | Independent |
| C10 | Wire GameEventBus into existing systems | Depends on C1 |
| C11 | Wire PlayerBrain into R3FRoot/AIProvider | Depends on C8 |
| C12 | A* Pathfinding upgrade + cleanup | Independent |

### Parallelization

- **Phase 1 (parallel):** C1, C2, C9, C12 — all independent new files
- **Phase 2 (parallel):** C3 + C7 (enemy and player leaf goals) — both depend on C2
- **Phase 3 (parallel):** C4 + C5 + C8 — tactical/strategic goals and evaluators
- **Phase 4 (sequential):** C6 → C10 → C11 — integration wiring

---

## WS-D: Integration & Playthrough Validation

### Task 11: Integration Testing

**Depends on:** WS-B (all 9 circles) + WS-C (at minimum C1-C6)

**Steps:**
1. Rebuild all 9 circle databases: `for i in {1..9}; do npx tsx scripts/build-circle-$i-*.ts; done`
2. Run full test suite: `pnpm test` (268+ tests pass)
3. Run type check: `npx tsc --noEmit`
4. Run lint: `pnpm lint`
5. Run headless playtest on each circle: `/run-playtest N` for N=1..9
6. Verify prop resolution: no "Unknown prop name" warnings in playtest output
7. Launch dev server: `npx expo start --web --port 8085`
8. Manual spot-check: navigate Circle 1, verify props render

### Task 12: Full Automated Playthrough

**Depends on:** Task 11 + WS-C complete (C11 especially)

**Steps:**
1. Start dev server: `npx expo start --web --port 8085`
2. Navigate to `http://localhost:8085?autoplay`
3. Observe AI governor completing all 9 circles
4. Verify screenshots captured at each circle transition
5. Verify run report JSON produced
6. Log completion time, deaths, kills per circle

---

## Execution Strategy

### Phase 1: Foundation (Parallel, 3 agents)

```
Agent A: WS-A Task 1 (Prop Name Mapping)
Agent B: WS-C Tasks C1+C2 (GameEventBus + BrainContext)
Agent C: WS-C Tasks C9+C12 (Screenshot Service + A* Pathfinding)
```

### Phase 2: Circle Overhaul (Parallel, 3 agents batched)

After Agent A completes:
```
Agent D: Circles 1-3 (Tasks 2-4)
Agent E: Circles 4-6 (Tasks 5-7)
Agent F: Circles 7-9 (Tasks 8-10)
```

### Phase 3: Brain Assembly Goals (Parallel, 2 agents)

After Agent B completes:
```
Agent G: Enemy goals + evaluators (WS-C Tasks C3-C5)
Agent H: Player goals + strategic (WS-C Tasks C7-C8)
```

### Phase 4: Wiring + Integration (Sequential)

```
Agent I: WS-C Tasks C6+C10+C11 (all wiring)
Then: Task 11 (integration testing)
Then: Task 12 (full playthrough)
```

---

## Verification Checklist

1. [ ] `pnpm test` — all tests pass (268+)
2. [ ] `npx tsc --noEmit` — clean
3. [ ] `pnpm lint` — clean
4. [ ] All 9 `build-circle-*.ts` scripts compile and validate
5. [ ] Headless playtest passes on all 9 circles
6. [ ] Zero "Unknown prop name" warnings
7. [ ] Props render in-game (spot check Circle 1)
8. [ ] AI governor completes full 9-circle run (WS-C dependent)
9. [ ] Screenshots captured at circle transitions
10. [ ] Run report JSON produced
