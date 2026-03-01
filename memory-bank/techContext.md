---
title: "Technical Context"
description: "Tech stack, architecture patterns, gotchas, and dev commands"
created: "2026-03-01"
updated: "2026-03-01"
tags: [memory-bank, tech, architecture]
---

# Technical Context

## Tech Stack

### Runtime
- **React Native Web + Expo** — cross-platform UI (web primary, mobile secondary)
- **React 19.2.0** + **react-native 0.83.2** + **TypeScript 5.9.2**
- **Dev server:** `npx expo start --web --port 8085` (port 8085 required)

### 3D Rendering
- **Three.js + React Three Fiber v9** — declarative 3D via JSX
- **@react-three/rapier v2** — Rapier WASM physics engine
- **@react-three/drei** — PointerLockControls, KeyboardControls, useGLTF, Instances, Billboard
- **@react-three/xr v6** — WebXR / VR / AR support
- **@react-three/postprocessing v3** — Bloom, Vignette, ChromaticAberration, Noise

### Game Architecture
- **Miniplex ECS** — Entity Component System (`world.entities`, `world.add()`, `world.remove()`)
- **Zustand** — State management (`useGameStore`) + `GameState` backward-compat shim
- **YUKA v0.7.8** — Game AI library for enemies and autoplay AI governor
- **seedrandom** — Seeded PRNG for deterministic procedural generation

### Level System
- **SQLite** via **Drizzle ORM** — Level database (better-sqlite3 / sql.js / expo-sqlite)
- **LevelEditor API** — Agentic level building (`src/db/LevelEditor.ts`)
- **GridCompiler** — Rooms + connections to MapCell[][] grid BLOB
- **PlaytestRunner** — Headless A* simulation for validation

### Tooling
- **pnpm** — Package manager (NOT npm, NOT yarn)
- **Biome 2.4** — Linter + formatter (NOT ESLint, NOT Prettier)
- **Jest** — Test runner (268 tests, 22 suites)
- **TypeScript** — Type checking via `npx tsc --noEmit`

## Dev Commands

```bash
pnpm test              # Jest (268 tests, 22 suites)
pnpm lint              # Biome check
pnpm lint:fix          # Biome auto-fix
pnpm format            # Biome format
npx tsc --noEmit       # TypeScript check
npx expo start --web --port 8085  # Dev server (port 8085 required)
```

## Coordinate System

### Grid vs. World Coordinates
- **All level data uses grid coordinates** — rooms, entities, triggers, environment zones
- 1 grid cell = 2 world units (`CELL_SIZE = 2`)
- Conversion happens ONLY in `LevelDbAdapter.ts` at the adapter boundary
- X increases eastward, Z increases southward (top-left origin)

### Three.js Handedness
- Three.js is **right-handed** — positive Z points toward the camera
- When converting from Babylon.js-style positions, **negate Z**
- GLB models are engine-agnostic (no Z conversion needed for models)

### Room Bounds
- `(x, z)` = top-left corner of the room in grid coordinates
- `(w, h)` = width (X extent) x height (Z extent)
- Entity positions must be INSIDE room/level bounds
- Player spawn facing: radians (pi = facing south, 0 = facing north)

## Critical Patterns

### Per-Frame Allocation Avoidance
Module-scope temporary vectors are reused each frame. **NEVER** allocate `new Vector3()` inside `useFrame()`.

```typescript
// CORRECT: module scope
const _tempVec = new THREE.Vector3();
const _yAxis = new THREE.Vector3(0, 1, 0);

function MyComponent() {
  useFrame(() => {
    _tempVec.set(x, y, z); // reuse, no allocation
  });
}

// WRONG: per-frame allocation (creates GC pressure)
function MyComponent() {
  useFrame(() => {
    const pos = new THREE.Vector3(x, y, z); // BAD
  });
}
```

Named temp vectors in the codebase: `_yAxis`, `_spotForward`, `_particlePos`, and others at module scope.

### Material Lifecycle
Three.js materials and geometries must be **manually disposed** to prevent WebGL memory leaks.

- `LevelMeshes` disposes via `disposeCachedMaterials()`
- `ParticleEffects` uses pre-allocated material pools (`MAX_ACTIVE_PARTICLES = 300`)
- Always call `.dispose()` on materials and geometries when removing them from the scene
- PBR materials per floor theme defined in `src/r3f/level/Materials.ts` (fire, flesh, obsidian, void)

### ECS to Three.js Sync
`EnemySystem.ts` uses `Map<string, THREE.Group>` for O(1) mesh lookup by entity ID. **Avoid scene graph traversal** for per-frame entity updates.

- Template+clone pattern for enemy GLB instancing (`src/r3f/entities/EnemyMesh.tsx`)
- Per-frame sync loop: iterate ECS entities, look up Three.js mesh by ID, set position/rotation

### Shared AudioContext
All 3 audio systems share a single Web Audio API context via `src/r3f/audio/sharedAudioContext.ts`.

- **Never call `ctx.close()`** — just disconnect gain nodes on dispose
- Systems: `AudioSystem.ts` (SFX), `MusicSystem.ts` (background music per encounter), `AmbientSoundSystem.ts` (biome ambient layers)

### Projectile Combat
ALL weapons fire visible projectiles — no hitscan.

- **Object pooling:** `ProjectilePool.ts` maintains ~100 pre-allocated slots to avoid GC
- **CCD enabled** for fast projectiles (Continuous Collision Detection prevents tunneling)
- Projectile rendering: mesh + light trail + Rapier collider (`src/r3f/weapons/Projectile.tsx`)
- First-person weapon model: `WeaponViewModel.tsx`
- Muzzle flash: Billboard with point light (`MuzzleFlash.tsx`)

### Input Abstraction
`InputFrame` is the unified input format consumed by game systems.

- Includes `aimOrigin` / `aimDirection` (null = use camera, non-null = VR controller)
- 6 providers: KeyboardMouse, Touch, Gamepad, Gyroscope, XR, AI
- `InputManager` merges provider outputs into a single `InputFrame` per tick

### Grace Period
A **2-second grace period** at the start of each floor:

- Skip AI updates
- Skip combat processing
- Skip win-condition checks
- Allows the player to orient before enemies activate

### AI System Reset
**`aiSystemReset()` MUST be called before clearing entities** on floor transitions. Failure to do so causes stale AI references.

### Nightmare Modes
- **Nightmare:** No health pickups + 2x enemy damage
- **Permadeath:** No retry on death
- **Ultra Nightmare:** Both nightmare + permadeath

## Key Source Files

### R3F Rendering
| File | Purpose |
|------|---------|
| `src/r3f/R3FApp.tsx` | Canvas wrapper (shadows, sRGB, continuous frameloop) |
| `src/r3f/R3FScene.tsx` | Scene setup (lighting, environment, fog, dark background) |
| `src/r3f/PlayerController.tsx` | FPS camera, WASD, pointer lock, Rapier physics |
| `src/r3f/level/LevelMeshes.tsx` | Level mesh rendering with BufferGeometry |
| `src/r3f/level/Materials.ts` | PBR materials per floor theme |
| `src/r3f/rendering/PostProcessing.tsx` | Bloom, Vignette, ChromaticAberration, Noise |
| `src/r3f/rendering/Lighting.tsx` | Scene lighting setup |

### Entities & Combat
| File | Purpose |
|------|---------|
| `src/r3f/entities/EnemyMesh.tsx` | Enemy GLB instancing (template+clone) |
| `src/r3f/entities/EnemySystem.ts` | Per-frame ECS to Three.js mesh sync |
| `src/r3f/entities/EnemyColliders.tsx` | Rapier CapsuleCollider per enemy |
| `src/r3f/weapons/WeaponSystem.ts` | Visible projectile combat |
| `src/r3f/weapons/ProjectilePool.ts` | Object pool (~100 slots) |
| `src/r3f/weapons/Projectile.tsx` | Projectile mesh + light trail + collider |
| `src/r3f/weapons/WeaponViewModel.tsx` | First-person weapon model |
| `src/r3f/weapons/MuzzleFlash.tsx` | Billboard muzzle flash + point light |
| `src/r3f/systems/CombatSystem.ts` | Damage pipeline (armor, XP, kill streaks, particles) |
| `src/r3f/systems/ParticleEffects.ts` | Blood/death/spark particles with material pooling |
| `src/r3f/systems/PickupSystem.ts` | Pickup proximity detection and collection |

### Input & Audio
| File | Purpose |
|------|---------|
| `src/r3f/input/InputManager.ts` | Unified input abstraction |
| `src/r3f/input/providers/` | KeyboardMouse, Touch, Gamepad, Gyroscope, XR, AI |
| `src/r3f/input/HapticsService.ts` | expo-haptics + Web Vibration API fallback |
| `src/r3f/audio/AudioSystem.ts` | Web Audio API SFX |
| `src/r3f/audio/MusicSystem.ts` | Background music per encounter type |
| `src/r3f/audio/AmbientSoundSystem.ts` | Biome ambient layers |
| `src/r3f/audio/sharedAudioContext.ts` | Single shared AudioContext |

### Game Systems (Engine-Agnostic)
| File | Purpose |
|------|---------|
| `src/game/systems/` | ECS systems (AI, Progression, Wave, Door, etc.) |
| `src/game/levels/LevelGenerator.ts` | Procedural dungeon generation |
| `src/game/entities/vec3.ts` | Engine-agnostic Vec3 utilities |
| `src/state/GameStore.ts` | Zustand store + input settings |

### Level Database
| File | Purpose |
|------|---------|
| `src/db/schema.ts` | Drizzle ORM table definitions |
| `src/db/LevelEditor.ts` | Agentic level building API |
| `src/db/GridCompiler.ts` | Room/connection geometry to grid BLOB |
| `src/db/LevelDbAdapter.ts` | DB to LevelData/CircleLevel converters |
| `src/db/PlaytestRunner.ts` | Headless A* simulation |
| `src/db/migrate.ts` | Migration + seed data |

## Asset Information

### Weapon Models (Stylized Guns 3D Models PRO)
- `weapon-pistol.glb` (MAC-10, 205KB) | `weapon-shotgun.glb` (263KB)
- `weapon-cannon.glb` (AK-47, 284KB) | `weapon-launcher.glb` (Bazooka, 363KB)
- Projectile GLBs: `bullet-small`, `bullet-large`, `shell`, `rocket` (143-219KB each)
- Also available: Flamethrower, MGD PM-9, Suppressor (not yet wired)
- Textures: 1024px JPEG compressed (down from 4096 PNG, ~250KB vs 12MB per GLB)

### Boss Models (Dainir for Genesis 9)
- 9 bosses planned, none exported to GLB yet
- Base templates: `assets/models/bosses/dainir-male-base.blend`, `dainir-female-base.blend`
- Male: 29,698 verts / Female: 30,764 verts
- ARP Smart rigging: 348 bones (full) or 339 (no fingers)
- Target: ~8,000-10,000 verts per boss after decimation

### PBR Material Library
- User's AmbientCG library: `/Volumes/home/assets/AmbientCG`
- 500+ textures: Rock, Lava, Ice, Marble, Metal, Rust, Concrete, PavingStones, Moss, Snow, Granite
