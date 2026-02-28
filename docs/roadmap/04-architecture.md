# Domain 4: Architecture Refactor

> Split the god-files, reduce coupling, improve maintainability.

## Current State

Two files contain 21% of the 19,300-line codebase:
- `GameEngine.tsx` (2027 lines) — 17 distinct concerns in one React component
- `BabylonHUD.ts` (2010 lines) — 20 distinct UI subsystems in one class

Both files are difficult to navigate, review, and modify without introducing regressions.

## 4.1 Split GameEngine.tsx

**Target:** Break the 2027-line monolith into focused modules.

### Extraction Plan

| New File | What Moves | ~Lines |
|----------|-----------|--------|
| `src/game/systems/AssetPipeline.ts` | Physics WASM loading, enemy template loading, prop loading, music/SFX preload, loading screen progress | ~200 |
| `src/game/systems/EntitySpawner.ts` | All `world.add()` calls: enemies, pickups, power-ups, hazards, props, lore, boss spawning | ~250 |
| `src/game/rendering/LevelMeshBuilder.ts` | Wall/floor/ceiling mesh creation, void-fill geometry, level geometry disposal | ~200 |
| `src/game/rendering/EntityMeshManager.ts` | Enemy HP bars, projectile meshes, pickup meshes (with glow rings), hazard meshes | ~300 |
| `src/game/systems/PlayerController.ts` | Keyboard input, touch input polling, camera look, pointer lock, sprint state | ~150 |
| `src/game/systems/GameLoop.ts` | The `scene.onBeforeRenderObservable` callback: system update dispatch, death detection, floor completion | ~150 |

**What stays in GameEngine.tsx:** React component lifecycle, scene/engine setup, floor transition orchestration, ref management. Target: ~400-500 lines.

### Approach
1. Extract one module at a time, starting with the least-coupled (AssetPipeline)
2. Each extraction: move code, update imports, verify `tsc --noEmit`, test in-game
3. Use module-level state (like existing systems) rather than class instances
4. Maintain the same public API — GameEngine.tsx calls the extracted functions

**Acceptance:** GameEngine.tsx under 600 lines. All extracted modules have clear single responsibilities. Game behavior unchanged.

## 4.2 Split BabylonHUD.ts

**Target:** Break the 2010-line HUD class into composable UI modules.

### Extraction Plan

| New File | What Moves | ~Lines |
|----------|-----------|--------|
| `src/game/ui/hud/HealthBar.ts` | HP bar, low-HP vignette, damage flash | ~80 |
| `src/game/ui/hud/AmmoDisplay.ts` | Ammo text, reload bar, low-ammo pulse | ~80 |
| `src/game/ui/hud/Crosshair.ts` | Crosshair lines, hit marker, dynamic spread | ~100 |
| `src/game/ui/hud/Minimap.ts` | Canvas 2D minimap rendering + throttle | ~150 |
| `src/game/ui/hud/ScoreDisplay.ts` | Score interpolation, kills, time, XP bar, level-up toast | ~120 |
| `src/game/ui/hud/BossBar.ts` | Boss HP bar, phase-2 flash | ~80 |
| `src/game/ui/hud/Notifications.ts` | Kill streak, headshot, env kill, weapon pickup, floor stats, tutorial hints | ~250 |
| `src/game/ui/hud/DamageIndicators.ts` | Directional damage arrows, blood splatter callback | ~100 |
| `src/game/ui/hud/WeaponSlots.ts` | Weapon slot icons, active highlight | ~80 |
| `src/game/ui/hud/DebugOverlay.ts` | Autoplay AI debug info | ~80 |

**What stays in BabylonHUD.ts:** `BabylonHUD` class shell that creates `AdvancedDynamicTexture`, instantiates all sub-modules, and dispatches the per-frame `update()` call. Target: ~200-300 lines.

### Approach
1. Each sub-module exports: `create(texture: AdvancedDynamicTexture)` and `update(state)` functions
2. BabylonHUD becomes a thin orchestrator
3. Extract one module at a time, verify visually after each

**Acceptance:** BabylonHUD.ts under 400 lines. Each sub-module independently testable.

## 4.3 WeakMap for Mesh Metadata

**Files:** `src/game/GameEngine.tsx`

Replace `(mesh as any).__glowRing` and `(camera as any).__cleanup` patterns with typed WeakMaps.

```typescript
// At module level
const meshGlowRings = new WeakMap<AbstractMesh, Mesh>();
const cameraCleanups = new WeakMap<Camera, () => void>();
```

**Acceptance:** Zero `as any` casts for mesh/camera metadata access.

## 4.4 Module-Level Callback Registry

**Pattern in use:** BabylonHUD exports `registerDamageDirection()`, `triggerBloodSplatter()`, `triggerEnvKill()`, `showFloorStats()` as module-level callbacks that GameEngine.tsx and CombatSystem.ts call. This works but creates implicit coupling.

**Alternative:** Create an `EventBus.ts` with typed event channels. Systems emit events, HUD subscribes. This decouples emitters from receivers and makes testing easier.

```typescript
// src/game/systems/EventBus.ts
type Events = {
  'damage-direction': { position: Vector3 };
  'blood-splatter': { intensity: number };
  'env-kill': { type: 'void' | 'lava' | 'barrel' };
  'floor-stats': { kills: number; accuracy: number; secrets: number; time: number };
};
```

**Priority:** Low — current approach works fine. Only pursue if god-file split reveals import cycle issues.
