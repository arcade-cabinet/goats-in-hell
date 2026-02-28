# Domain 1: Ship It (Production)

> Get the game deployable and playable by anyone with a URL.

## 1.1 Verify Production Build

**Files:** `package.json`, `app.json`

The `web:export` script exists (`npx expo export --platform web`) but the output has never been validated end-to-end.

**Tasks:**
1. Run `npx expo export --platform web` and confirm `dist/` is generated without errors
2. Run `npx serve dist` and verify all assets load (models, textures, audio, WASM physics)
3. Fix any broken asset paths (Metro asset resolution vs production bundler)
4. Verify Havok WASM loads correctly in production build (it uses `Asset.fromModule()` which may behave differently outside Metro dev server)
5. Test touch controls on mobile browser or Chrome DevTools mobile emulation
6. Verify `?autoplay` parameter works in production build

**Acceptance:** Game loads, plays through 3+ floors, and completes a boss fight from `npx serve dist`.

## 1.2 Dead Asset Cleanup

**Files:** `src/game/systems/AssetRegistry.ts`, `assets/`

Unused assets waste load time. Remove or defer-load them.

| Asset | Registry Key | Issue |
|-------|-------------|-------|
| `Skeleton_Minion.glb` | `enemy-skeleton` | Registered, loaded, never spawned |
| `Skeleton_Warrior.glb` | `enemy-skeletonWarrior` | Same |
| `Skeleton_Rogue.glb` | `enemy-skeletonRogue` | Same |
| `skeleton_texture.png` | (none) | Loose file, not in registry |
| `barrel_small.glb` | (none) | Not registered, never loaded |
| `doorClose_1.ogg` | `sfx-doorClose-0` | Registered, loaded, never played |
| `doorClose_2.ogg` | `sfx-doorClose-1` | Same |

**Tasks:**
1. Remove the 3 skeleton enemy registrations from AssetRegistry.ts (lines 76-78) and their `loadAllEnemyTemplates()` calls
2. Delete `skeleton_texture.png` and `barrel_small.glb` from `assets/`
3. Either wire `doorClose` sounds into DoorSystem.ts (play when door closes) or remove the registry entries and OGG files
4. Verify no import errors after cleanup

**Acceptance:** `tsc --noEmit` passes. Game starts without console errors about missing assets.

## 1.3 CI/CD Pipeline (Optional)

**Files:** Create `.github/workflows/deploy.yml`

**Tasks:**
1. GitHub Actions workflow: install deps, typecheck, export, deploy to GitHub Pages (or Netlify/Vercel)
2. Add `CNAME` or configure custom domain if desired
3. Badge in README

**Acceptance:** Push to main triggers automatic deploy. Game accessible at a public URL.

## 1.4 TypeScript Strictness

**Files:** `tsconfig.json`

**Tasks:**
1. Run `tsc --noEmit` and fix any errors
2. Audit the 35 `as any` casts — replace with proper types where feasible:
   - `'powerup' as EntityType` → add `'powerup'` to the EntityType union in `components.ts`
   - `'hazard_spikes' as EntityType` / `'hazard_barrel' as EntityType` → already in union, remove the casts
   - `'100%' as any` in HUD.tsx/MainMenu.tsx → use `DimensionValue` type from react-native
   - `(camera as any).__cleanup` → declare a proper interface extension or use a WeakMap
   - `(mesh as any).__glowRing` → same pattern, use WeakMap<AbstractMesh, Mesh>

**Acceptance:** `tsc --noEmit` passes with zero errors. `as any` count reduced from 35 to <10.
