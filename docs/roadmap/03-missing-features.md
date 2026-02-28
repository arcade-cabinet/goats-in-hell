# Domain 3: Missing Features

> Features that are planned, referenced, or expected but not yet implemented.

## 3.1 Ultra Nightmare Boss Phases

**Status:** Nightmare flags are wired (no health pickups + 2x damage), but boss "phase 2" transformations are not implemented. The `BabylonHUD.ts` boss HP bar has a phase-2 flash effect, but no boss actually enters phase 2.

**Design:**
When a boss reaches 50% HP on Nightmare difficulty:
- Phase 2 trigger: double attack speed, add new attack pattern
- Visual: mesh scale pulse + color tint shift (red glow)
- Audio: `goat_alert` sting on phase change
- HUD: phase-2 flash is already coded in BabylonHUD

**Files to modify:**
- `src/game/systems/AISystem.ts` — add phase-2 behavior branches for each boss type
- `src/game/entities/enemyStats.ts` — add `phase2` stat overrides per boss
- `src/game/GameEngine.tsx` — detect 50% HP threshold and trigger phase transition
- `src/game/ui/BabylonHUD.ts` — wire the existing phase-2 flash to the trigger

**Acceptance:** On Nightmare, boss at 50% HP visibly changes behavior and appearance.

## 3.2 In-Game Settings Menu

**Status:** Settings (volume, sensitivity) exist on MainMenu.tsx. But once in-game, there's no way to adjust them — PauseMenu.tsx only has Resume/Quit.

**Files to modify:**
- `src/ui/PauseMenu.tsx` — add volume slider and sensitivity slider
- `src/state/GameStore.ts` — settings are already persisted via `writeSettings()`

**Acceptance:** Pause during gameplay, adjust volume/sensitivity, changes take effect immediately and persist.

## 3.3 Mid-Game Save Indicator

**Status:** The game auto-saves via `writeSave()` on floor transitions. But there's no visual indicator that the game was saved, and no explicit "Save & Quit" option.

**Files to modify:**
- `src/game/ui/BabylonHUD.ts` — add a brief "Game Saved" toast notification after `writeSave()`
- `src/ui/PauseMenu.tsx` — add "Save & Quit" button (calls `writeSave()` then returns to menu)

**Acceptance:** "Game Saved" appears briefly on floor transitions. Pause menu has "Save & Quit".

## 3.4 Continue Button UX

**Status:** MainMenu.tsx has a "Continue" button that loads the save. But there's no preview of what the save contains (floor, difficulty, level).

**Files to modify:**
- `src/ui/MainMenu.tsx` — show save preview below Continue button (e.g., "Floor 8 / Lv 5 / Hard")
- `src/state/GameStore.ts` — `readSave()` already returns the data, just surface it

**Acceptance:** Continue button shows floor/level/difficulty. No save = button grayed out.

## 3.5 Difficulty Balance — Arena Ammo Economy

**Status:** From the original plan (Task 1). Arena mode pickups only spawn every other wave with 2-3 ammo pickups of 12. This starves ammo around wave 5-7.

**Files:** `src/game/systems/WaveSystem.ts`

**Changes:**
1. Spawn pickups every wave (not every other): change `currentWave % 2 === 0` to `currentWave > 0`
2. Increase ammo pickup value from 12 to 18
3. Add a weapon pickup every 3rd wave

**Acceptance:** Autoplay survives 8+ arena waves without running out of ammo.

## 3.6 Difficulty Balance — Boss Arena Pickups

**Status:** From the original plan (Task 2). Boss arenas spawn zero pickups. Players must defeat bosses with only carried-over ammo.

**Files:** `src/game/levels/BossArenas.ts`, `src/game/GameEngine.tsx`

**Changes:**
1. Add pickup spawn positions to boss arena layout (4 symmetric positions)
2. Spawn 3 ammo pickups (value: 18) and 1 health pickup (value: 30) at arena build time
3. Mid-fight resupply: when boss reaches 50% HP, spawn 2 more ammo pickups

**Acceptance:** Boss fight is completable with Hell Pistol only (no weapon carryover required).

## 3.7 Difficulty Balance — Weapon Ammo Reserves

**Status:** From the original plan (Task 3). Hell Pistol starting reserve (32) is low. Goat's Bane pickup gives only 6 ammo (2 reloads of 3-round mag).

**Files:** `src/game/weapons/WeaponSystem.ts`

**Changes:**
1. Increase Hell Pistol starting reserve: 32 to 48
2. Increase Goat's Bane pickup reserve: 6 to 12
3. Audit Hellfire Cannon reserve proportionally

**Acceptance:** Starting loadout sustains 2 explore floors without needing pickups.

## 3.8 Nightmare Difficulty Tuning

**Status:** From the original plan (Task 4). Nightmare mode disables all health pickups + 2x damage. Hard difficulty reduces pickup density to 0.7x.

**Files:** `src/state/GameStore.ts`, `src/game/systems/WaveSystem.ts`

**Changes:**
1. Hard pickup density: 0.7 to 0.85
2. Nightmare arena: spawn 1 half-value health pickup every 3 waves (brutal but not impossible)
3. Verify boss HP scaling doesn't compound with difficulty multiplier

**Acceptance:** Autoplay survives to floor 5 on Nightmare (hard but possible).

## 3.9 PBR Material Migration

**Status:** Walls, floor, and ceiling still use `StandardMaterial`. The original plan called for `PBRMetallicRoughnessMaterial`.

**Files:** `src/game/rendering/Materials.ts` (lines 133-176)

**Changes:**
1. Replace `StandardMaterial` with `PBRMetallicRoughnessMaterial` for wall/floor/ceiling
2. Apply the existing PBR texture set (baseColor, normal, roughness, AO) that's already loaded
3. Ensure dungeon props and other materials aren't affected

**Acceptance:** Visual quality improvement on walls/floor/ceiling. No rendering artifacts.
