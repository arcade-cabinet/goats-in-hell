---
title: "Testing"
status: superseded
created: "2026-02-27"
updated: "2026-02-27"
domain: roadmap
priority: medium
roadmap_order: 5
related:
  - docs/roadmap/README.md
---

# Domain 5: Testing

> Zero test coverage today. Build a test suite that catches real bugs.

## Current State

- `jest.config.js` exists with `react-native` preset and Babylon.js transform ignores
- `package.json` has `"test": "jest"`
- Zero test files exist in the project
- Autoplay (`?autoplay`) serves as an informal integration test

## Testing Strategy

Focus on **game logic** (pure functions, no rendering) — this is where bugs hide and tests have the highest ROI. Don't test Babylon.js rendering or React Native UI.

### Priority Order
1. **Combat math** — damage calculations, armor, stagger, AoE falloff
2. **Progression logic** — floor sequencing, boss selection, XP/leveling
3. **Save/load** — serialization roundtrip, schema validation, migration
4. **Weapon system** — fire rate, reload timing, ammo consumption
5. **Wave system** — enemy count scaling, pickup spawning rules
6. **AI behavior** — state transitions (idle/chase/attack/flee/stagger)

## 5.1 Test Infrastructure Setup

**Files:** `jest.config.js`, `package.json`, create `src/__mocks__/`

**Tasks:**
1. Verify `npm test` runs without errors (even with 0 tests)
2. Create mock for `@babylonjs/core` — export stub `Vector3` class with `Distance()` method
3. Create mock for `world` — in-memory entity array with `add()`/`remove()`/`entities`
4. Create mock for `GameState` — simple get/set object
5. Create mock for `playSound` — no-op function

**Acceptance:** `npm test` runs. Mocks importable from test files.

## 5.2 Combat System Tests

**File:** Create `src/game/systems/__tests__/CombatSystem.test.ts`

**Test cases:**
- `damageEnemy` reduces HP by damage amount
- `damageEnemy` with armored enemy: armor absorbs first, then HP
- `damageEnemy` triggers stagger when damage > 25% maxHP
- `damageEnemy` does NOT stagger when enemy already dead (hp <= 0)
- `handleEnemyKill` increments score and kills in GameState
- `handleEnemyKill` calls `removeEntity`
- AoE falloff: 100% at center, 25% at edge of blast radius

## 5.3 Progression System Tests

**File:** Create `src/game/systems/__tests__/ProgressionSystem.test.ts`

**Test cases:**
- `nextEncounterType`: 3 explore, then arena, then boss at stage 5
- `bossForStage`: cycles through 4 bosses correctly
- `xpForLevel`: logarithmic curve values match expectations
- `awardXp`: level-up occurs at correct XP threshold
- Floor transition preserves total kills but resets floor kills

## 5.4 Save/Load Tests

**File:** Create `src/state/__tests__/GameStore.test.ts`

**Test cases:**
- `writeSave` + `readSave` roundtrip returns same data
- `isValidSave` rejects malformed data (missing fields, wrong types)
- `isValidSave` rejects data with future version number
- `clearSave` removes data from localStorage
- Settings roundtrip (volume, sensitivity)

## 5.5 Weapon System Tests

**File:** Create `src/game/weapons/__tests__/WeaponSystem.test.ts`

**Test cases:**
- Fire rate cooldown prevents rapid firing
- Reload sets correct reload timer per weapon
- Ammo consumption: 1 per shot (pistol), 1 per shot (shotgun with pellets), 1 per shot (cannon)
- Shot tracking: `shotsFired` and `shotsHit` increment correctly
- `getShotStats` + `resetShotStats` work

## 5.6 Wave System Tests

**File:** Create `src/game/systems/__tests__/WaveSystem.test.ts`

**Test cases:**
- Wave scaling: `3 + wave * 2` enemies per wave
- Pickup spawning rules (every wave vs. every other)
- Arena completion condition: 5+ waves cleared

## 5.7 Integration Test via Autoplay

**Not a jest test.** Document the autoplay testing procedure:

1. Start dev server: `npm run web:start`
2. Open `http://localhost:8085/?autoplay`
3. Observe: AI should reach floor 3+ without crashes
4. Check console: 0 errors
5. Check floor transitions: no stale entities, no mesh disposal errors

**Automate:** Consider a Playwright script that opens the autoplay URL, waits 60s, and asserts no console errors.
