# Domain 2: Bug Fixes

> Known bugs that affect gameplay or correctness.

## 2.1 Hellfire Cannon Uses Pistol Sound

**Files:** `src/game/systems/AudioSystem.ts` (line 318), `src/game/weapons/WeaponSystem.ts` (line 44)

The hellfire cannon's `SoundType` is `'rapid'`, which routes to `playBufferSound('sfx-pistol', 0.4)` — the same laser-small OGGs as the Hell Pistol, just quieter. A rapid-fire energy weapon should sound distinct.

**Fix options:**
1. **New SFX files:** Source or generate a rapid-fire/minigun OGG set (3 variants), register as `sfx-rapid`, wire `case 'rapid'` to the new buffer group
2. **Pitch shift:** Keep pistol OGGs but apply heavy pitch-down (`playbackRate: 0.6`) and add slight distortion via a `BiquadFilterNode` for a heavier "gatling" feel — zero new assets needed
3. **Procedural:** Generate the rapid-fire sound with oscillators (already have precedent with `goat_die` etc.)

**Recommendation:** Option 2 (pitch shift) — fast to implement, no asset sourcing needed.

**Acceptance:** Hellfire cannon sounds audibly different from Hell Pistol.

## 2.2 Goat's Bane Single-Variant Sound

**Files:** `src/game/systems/AudioSystem.ts`, `src/game/systems/AssetRegistry.ts`

`sfx-cannon` has only 1 OGG file (`lowFrequency_explosion_000.ogg`). Every rocket launch sounds identical. All other weapon sounds have 2-3 variants with random selection.

**Fix options:**
1. Source 2 more cannon/explosion OGGs
2. Apply random pitch variation (0.9–1.1) to the single file at play time via `playbackRate`

**Recommendation:** Option 2 — add `playbackRate: 0.9 + Math.random() * 0.2` to the `'bigshot'` case.

**Acceptance:** Consecutive Goat's Bane shots sound slightly different.

## 2.3 EntityType Union Gaps

**Files:** `src/game/entities/components.ts` (lines 3-10), `src/game/GameEngine.tsx`

Three entity types are used in GameEngine.tsx but not in the `EntityType` union:
- `'powerup'` (line 484) — cast with `as EntityType`
- `'hazard_spikes'` (line 497) — already in union but cast anyway
- `'hazard_barrel'` (line 505) — already in union but cast anyway

**Fix:**
1. Add `'powerup'` to the `EntityType` union in `components.ts`
2. Remove all 3 `as EntityType` casts in GameEngine.tsx
3. Search for any other missing types

**Acceptance:** `tsc --noEmit` passes. Zero `as EntityType` casts remain.

## 2.4 Campaign Mode Dead Code

**Files:** `src/state/GameState.ts` (line 12)

`GameMode = 'roguelike' | 'arena' | 'campaign'` — no code path ever sets or reads `'campaign'`.

**Fix:** Remove `'campaign'` from the union. If campaign mode is planned for the future, track it in the roadmap, not in the type system.

**Acceptance:** No references to `'campaign'` in source code.

## 2.5 Player State Not Persisted in Save

**Files:** `src/state/GameStore.ts` (lines 283-393)

The save system persists `stage`, `leveling`, `score`, `totalKills`, `bossesDefeated`, `elapsedMs`, `difficulty`, `seed`, `nightmareFlags`. But player HP, current weapon, and ammo reserves are NOT saved — they live in ECS entity state. On resume, the player spawns at the saved floor with full HP and default weapon.

**Fix:**
1. Add `playerHp`, `currentWeapon`, `ammoReserves` to `SaveData` interface
2. Write these fields in `writeSave()` from the player entity
3. Restore them in the player spawn path when `readSave()` returns a valid save

**Acceptance:** Save at floor 8 with 30 HP and Brimstone Shotgun → quit → resume → spawn at floor 8 with 30 HP and Brimstone Shotgun.

## 2.6 Save Schema Versioning

**Files:** `src/state/GameStore.ts`

If `SaveData` fields change (e.g., adding `playerHp` above), old saves silently fail `isValidSave()` and are discarded. Players lose progress.

**Fix:**
1. Add `version: number` to `SaveData`
2. On read, if version is old, apply a migration function to upgrade the data shape
3. Bump version whenever `SaveData` changes

**Acceptance:** A save from the current schema still loads after adding new fields.
