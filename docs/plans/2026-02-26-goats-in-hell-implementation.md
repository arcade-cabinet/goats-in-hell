---
title: "Goats in Hell Implementation Plan (Babylon.js)"
status: superseded
created: "2026-02-26"
updated: "2026-02-26"
domain: plans
plan_type: implementation
superseded_by: docs/plans/2026-02-28-dante-circles-implementation-plan.md
related:
  - docs/plans/2026-02-26-goats-in-hell-transformation-design.md
---

# Goats in Hell - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the existing Reactylon Native + Babylon.js proof-of-concept into a fully playable, visually stunning cross-platform FPS featuring goats in hell, with multiple game modes and modern rendering.

**Architecture:** Evolve the existing Reactylon 3.5.4 + Babylon.js 8.53 + Miniplex 2.0 ECS architecture. Reorganize `src/` into domain modules (game/systems, game/entities, game/levels, game/weapons, game/rendering, ui, state). Upgrade flat-color StandardMaterials to PBR with post-processing. Port gameplay from the working HTML raycaster. Layer 21st.dev Magic UI for menus/HUD.

**Tech Stack:** Reactylon 3.5.4, Babylon.js 8.53, React Native 0.74, Miniplex 2.0, TypeScript 5, 21st.dev Magic (UI), Web Audio API (sound)

**Design Doc:** `docs/plans/2026-02-26-goats-in-hell-transformation-design.md`

---

## Phase 1: Foundation (Restructure + Core Systems)

### Task 1: Restructure project directories

Create the new directory structure without breaking existing code. Move files to their new locations and update imports.

**Files:**
- Create: `src/game/systems/` (directory)
- Create: `src/game/entities/` (directory)
- Create: `src/game/levels/` (directory)
- Create: `src/game/weapons/` (directory)
- Create: `src/game/rendering/` (directory)
- Create: `src/ui/` (directory)
- Create: `src/state/` (directory)
- Move: `src/components.ts` -> `src/game/entities/components.ts`
- Move: `src/SystemAI.ts` -> `src/game/systems/AISystem.ts`
- Move: `src/LevelGenerator.ts` -> `src/game/levels/LevelGenerator.ts`
- Move: `src/constants.ts` -> `src/constants.ts` (stays)
- Move: `src/GameEngine.tsx` -> `src/game/GameEngine.tsx`

**Step 1: Create directory structure**

```bash
mkdir -p src/game/systems src/game/entities src/game/levels src/game/weapons src/game/rendering src/ui src/state
```

**Step 2: Move files to new locations**

```bash
cp src/components.ts src/game/entities/components.ts
cp src/SystemAI.ts src/game/systems/AISystem.ts
cp src/LevelGenerator.ts src/game/levels/LevelGenerator.ts
cp src/GameEngine.tsx src/game/GameEngine.tsx
```

**Step 3: Update imports in moved files**

In `src/game/GameEngine.tsx`, update imports:
```typescript
import type {Entity} from './entities/components';
import {world} from './entities/components';
import {COLORS} from '../constants';
import {CELL_SIZE, LevelGenerator, MapCell, WALL_HEIGHT} from './levels/LevelGenerator';
import {aiSystemUpdate} from './systems/AISystem';
```

In `src/game/systems/AISystem.ts`, update imports:
```typescript
import {Vector3} from '@babylonjs/core';
import {world} from '../entities/components';
```

In `src/game/levels/LevelGenerator.ts` - no import changes needed (only imports from `@babylonjs/core`).

**Step 4: Update App.tsx to point to new GameEngine location**

```typescript
import React, {useState} from 'react';
import {EngineWrapper} from './EngineWrapper';
import {GameEngine} from './game/GameEngine';

const App = () => {
  const [camera, setCamera] = useState(undefined);
  return (
    <EngineWrapper camera={camera}>
      <scene clearColor={[0.05, 0.01, 0.02, 1]}>
        <GameEngine />
      </scene>
    </EngineWrapper>
  );
};

export default App;
```

**Step 5: Verify the app still compiles**

```bash
npx tsc --noEmit
```
Expected: No errors (or only pre-existing ones)

**Step 6: Remove old file locations (only after verifying)**

```bash
rm src/components.ts src/SystemAI.ts src/LevelGenerator.ts src/GameEngine.tsx
```

**Step 7: Commit**

```bash
git add -A && git commit -m "refactor: restructure src/ into domain modules"
```

---

### Task 2: Create game state management

Build the global state that tracks game mode, floor, score, player status, and coordinates between systems.

**Files:**
- Create: `src/state/GameState.ts`

**Step 1: Create GameState**

```typescript
// src/state/GameState.ts
export type GameMode = 'roguelike' | 'arena' | 'campaign';
export type GameScreen = 'menu' | 'playing' | 'paused' | 'dead' | 'victory' | 'modeSelect';

export interface GameStateData {
  screen: GameScreen;
  mode: GameMode;
  floor: number;
  score: number;
  kills: number;
  totalKills: number;
  startTime: number;
  // Screen effects
  damageFlash: number;
  screenShake: number;
  gunFlash: number;
}

const initialState: GameStateData = {
  screen: 'menu',
  mode: 'roguelike',
  floor: 1,
  score: 0,
  kills: 0,
  totalKills: 0,
  startTime: 0,
  damageFlash: 0,
  screenShake: 0,
  gunFlash: 0,
};

// Simple singleton state with subscriber pattern
type Listener = () => void;
const listeners: Listener[] = [];
let state: GameStateData = {...initialState};

export const GameState = {
  get: () => state,
  set: (partial: Partial<GameStateData>) => {
    state = {...state, ...partial};
    listeners.forEach(l => l());
  },
  reset: () => {
    state = {...initialState, startTime: performance.now()};
    listeners.forEach(l => l());
  },
  subscribe: (listener: Listener) => {
    listeners.push(listener);
    return () => {
      const idx = listeners.indexOf(listener);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  },
};
```

**Step 2: Commit**

```bash
git add src/state/GameState.ts && git commit -m "feat: add global game state management"
```

---

### Task 3: Expand ECS components for new entity types

Extend the Miniplex entity types to support weapons, new enemy types, projectiles, and power-ups.

**Files:**
- Modify: `src/game/entities/components.ts`
- Create: `src/game/entities/world.ts`

**Step 1: Expand component types**

```typescript
// src/game/entities/components.ts
import {Mesh, Vector3, ParticleSystem} from '@babylonjs/core';

export type EntityType =
  | 'player'
  | 'goat' | 'hellgoat' | 'fireGoat' | 'shadowGoat' | 'goatKnight' | 'archGoat'
  | 'projectile'
  | 'health' | 'ammo' | 'weaponPickup'
  | 'door' | 'decoration';

export type WeaponId = 'hellPistol' | 'brimShotgun' | 'hellfireCannon' | 'goatsBane';

export type Entity = {
  id?: string;
  type?: EntityType;

  // Transform
  position?: Vector3;
  rotation?: Vector3;
  velocity?: Vector3;
  scale?: Vector3;

  // Rendering
  mesh?: Mesh;
  particles?: ParticleSystem;

  // Player
  player?: {
    hp: number;
    maxHp: number;
    speed: number;
    sprintMult: number;
    currentWeapon: WeaponId;
    weapons: WeaponId[];
    isReloading: boolean;
    reloadStart: number;
  };

  // Enemy
  enemy?: {
    hp: number;
    maxHp: number;
    damage: number;
    speed: number;
    attackRange: number;
    alert: boolean;
    attackCooldown: number;
    scoreValue: number;
    // Type-specific
    canShoot?: boolean;
    shootCooldown?: number;
    isArmored?: boolean;
    armorHp?: number;
    isInvisible?: boolean;
    visibilityAlpha?: number;
  };

  // Weapon ammo (per-weapon)
  ammo?: Record<WeaponId, {current: number; reserve: number; magSize: number}>;

  // Projectile
  projectile?: {
    life: number;
    damage: number;
    speed: number;
    owner: 'player' | 'enemy';
    aoe?: number; // area of effect radius
  };

  // Pickup
  pickup?: {
    pickupType: 'health' | 'ammo' | 'weapon';
    value: number;
    weaponId?: WeaponId;
    active: boolean;
  };

  // Door
  door?: {open: boolean; opening: boolean; openProgress: number};
};
```

**Step 2: Create separate world file**

```typescript
// src/game/entities/world.ts
import {World} from 'miniplex';
import type {Entity} from './components';

export const world = new World<Entity>();
```

**Step 3: Update all imports from old `world` export**

In `src/game/GameEngine.tsx`: change `import {world} from './entities/components'` to `import {world} from './entities/world'`

In `src/game/systems/AISystem.ts`: change `import {world} from '../entities/components'` to `import {world} from '../entities/world'`

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: expand ECS components for weapons, enemies, projectiles"
```

---

### Task 4: Create weapon definitions and weapon system

Define all 4 weapons and the state machine for switching, shooting, and reloading.

**Files:**
- Create: `src/game/weapons/weapons.ts`
- Create: `src/game/weapons/WeaponSystem.ts`

**Step 1: Define weapons**

```typescript
// src/game/weapons/weapons.ts
import type {WeaponId} from '../entities/components';

export interface WeaponDef {
  id: WeaponId;
  name: string;
  damage: number;
  pellets: number; // 1 for single shot, 6 for shotgun spread
  spread: number; // radians of spread per pellet
  magSize: number;
  fireRate: number; // ms between shots
  reloadTime: number; // ms
  range: number; // max distance
  isProjectile: boolean; // true = spawns projectile entity, false = hitscan
  projectileSpeed?: number;
  aoe?: number;
}

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  hellPistol: {
    id: 'hellPistol',
    name: 'Hell Pistol',
    damage: 3,
    pellets: 1,
    spread: 0,
    magSize: 8,
    fireRate: 300,
    reloadTime: 1500,
    range: 50,
    isProjectile: false,
  },
  brimShotgun: {
    id: 'brimShotgun',
    name: 'Brimstone Shotgun',
    damage: 2,
    pellets: 6,
    spread: 0.12,
    magSize: 4,
    fireRate: 800,
    reloadTime: 2000,
    range: 15,
    isProjectile: false,
  },
  hellfireCannon: {
    id: 'hellfireCannon',
    name: 'Hellfire Cannon',
    damage: 2,
    pellets: 1,
    spread: 0.02,
    magSize: 40,
    fireRate: 80,
    reloadTime: 3000,
    range: 30,
    isProjectile: true,
    projectileSpeed: 0.5,
  },
  goatsBane: {
    id: 'goatsBane',
    name: "Goat's Bane",
    damage: 50,
    pellets: 1,
    spread: 0,
    magSize: 3,
    fireRate: 2000,
    reloadTime: 4000,
    range: 100,
    isProjectile: true,
    projectileSpeed: 0.3,
    aoe: 5,
  },
};
```

**Step 2: Create weapon system**

```typescript
// src/game/weapons/WeaponSystem.ts
import {Scene, Vector3} from '@babylonjs/core';
import type {Entity, WeaponId} from '../entities/components';
import {world} from '../entities/world';
import {WEAPONS} from './weapons';
import {GameState} from '../../state/GameState';

let lastShotTime = 0;

export function initPlayerAmmo(): Entity['ammo'] {
  return {
    hellPistol: {current: 8, reserve: 32, magSize: 8},
    brimShotgun: {current: 0, reserve: 0, magSize: 4},
    hellfireCannon: {current: 0, reserve: 0, magSize: 40},
    goatsBane: {current: 0, reserve: 0, magSize: 3},
  };
}

export function tryShoot(scene: Scene, player: Entity): boolean {
  if (!player.player || !player.ammo) return false;
  const weapon = WEAPONS[player.player.currentWeapon];
  const ammoState = player.ammo[player.player.currentWeapon];
  const now = performance.now();

  if (player.player.isReloading) return false;
  if (now - lastShotTime < weapon.fireRate) return false;

  if (ammoState.current <= 0) {
    tryReload(player);
    return false;
  }

  ammoState.current--;
  lastShotTime = now;
  GameState.set({gunFlash: 6});

  if (weapon.isProjectile) {
    const camera = scene.activeCamera!;
    const forward = camera.getForwardRay().direction.normalize();
    world.add({
      id: `proj-${Date.now()}`,
      type: 'projectile',
      position: camera.position.clone(),
      velocity: forward.scale(weapon.projectileSpeed!),
      projectile: {
        life: 300,
        damage: weapon.damage,
        speed: weapon.projectileSpeed!,
        owner: 'player',
        aoe: weapon.aoe,
      },
    });
  } else {
    // Hitscan
    const camera = scene.activeCamera!;
    const width = scene.getEngine().getRenderWidth();
    const height = scene.getEngine().getRenderHeight();

    for (let p = 0; p < weapon.pellets; p++) {
      const spreadX = (Math.random() - 0.5) * weapon.spread * width;
      const spreadY = (Math.random() - 0.5) * weapon.spread * height;
      const ray = scene.createPickingRay(
        width / 2 + spreadX,
        height / 2 + spreadY,
        null,
        camera,
      );
      ray.length = weapon.range;

      const hit = scene.pickWithRay(ray, mesh => mesh.name.startsWith('mesh-enemy-'));
      if (hit?.hit && hit.pickedMesh) {
        const enemyId = hit.pickedMesh.name.replace('mesh-', '');
        const enemy = world.entities.find((e: Entity) => e.id === enemyId);
        if (enemy?.enemy) {
          enemy.enemy.hp -= weapon.damage;
          enemy.enemy.alert = true;
          if (enemy.enemy.hp <= 0) {
            const gs = GameState.get();
            GameState.set({
              kills: gs.kills + 1,
              totalKills: gs.totalKills + 1,
              score: gs.score + (enemy.enemy.scoreValue || 100),
            });
            hit.pickedMesh.dispose();
            world.remove(enemy);
          }
        }
      }
    }
  }

  return true;
}

export function tryReload(player: Entity): void {
  if (!player.player || !player.ammo) return;
  const ammo = player.ammo[player.player.currentWeapon];
  if (player.player.isReloading) return;
  if (ammo.current >= WEAPONS[player.player.currentWeapon].magSize) return;
  if (ammo.reserve <= 0) return;

  player.player.isReloading = true;
  player.player.reloadStart = performance.now();
}

export function updateReload(player: Entity): void {
  if (!player.player || !player.ammo || !player.player.isReloading) return;
  const weapon = WEAPONS[player.player.currentWeapon];
  const ammo = player.ammo[player.player.currentWeapon];

  if (performance.now() - player.player.reloadStart >= weapon.reloadTime) {
    const needed = weapon.magSize - ammo.current;
    const available = Math.min(needed, ammo.reserve);
    ammo.current += available;
    ammo.reserve -= available;
    player.player.isReloading = false;
  }
}

export function switchWeapon(player: Entity, weaponId: WeaponId): void {
  if (!player.player) return;
  if (!player.player.weapons.includes(weaponId)) return;
  player.player.isReloading = false;
  player.player.currentWeapon = weaponId;
}
```

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add weapon definitions and weapon system"
```

---

### Task 5: Upgrade rendering - PBR materials and lighting

Replace StandardMaterial with PBR materials and add dynamic point lights.

**Files:**
- Create: `src/game/rendering/Materials.ts`
- Create: `src/game/rendering/Lighting.ts`

**Step 1: Create PBR material definitions**

```typescript
// src/game/rendering/Materials.ts
import {Color3, PBRMetallicRoughnessMaterial, Scene, DynamicTexture} from '@babylonjs/core';
import {COLORS} from '../../constants';

export function createWallMaterial(
  name: string,
  wallType: 'stone' | 'flesh' | 'lava' | 'obsidian' | 'door',
  scene: Scene,
): PBRMetallicRoughnessMaterial {
  const mat = new PBRMetallicRoughnessMaterial(name, scene);

  switch (wallType) {
    case 'stone':
      mat.baseColor = Color3.FromHexString(COLORS.wallStone);
      mat.metallic = 0.1;
      mat.roughness = 0.9;
      break;
    case 'flesh':
      mat.baseColor = Color3.FromHexString(COLORS.wallFlesh);
      mat.metallic = 0.05;
      mat.roughness = 0.6;
      mat.emissiveColor = Color3.FromHexString('#330808');
      break;
    case 'lava':
      mat.baseColor = Color3.FromHexString(COLORS.wallLava);
      mat.metallic = 0.2;
      mat.roughness = 0.3;
      mat.emissiveColor = Color3.FromHexString('#ff4400');
      break;
    case 'obsidian':
      mat.baseColor = Color3.FromHexString(COLORS.wallObsidian);
      mat.metallic = 0.9;
      mat.roughness = 0.15;
      mat.emissiveColor = Color3.FromHexString('#1a0030');
      break;
    case 'door':
      mat.baseColor = Color3.FromHexString(COLORS.door);
      mat.metallic = 0.3;
      mat.roughness = 0.7;
      break;
  }

  return mat;
}

export function createFloorMaterial(scene: Scene): PBRMetallicRoughnessMaterial {
  const mat = new PBRMetallicRoughnessMaterial('floorMat', scene);
  mat.baseColor = Color3.FromHexString(COLORS.floor);
  mat.metallic = 0.1;
  mat.roughness = 0.85;
  return mat;
}

export function createCeilingMaterial(scene: Scene): PBRMetallicRoughnessMaterial {
  const mat = new PBRMetallicRoughnessMaterial('ceilingMat', scene);
  mat.baseColor = Color3.FromHexString(COLORS.ceiling);
  mat.metallic = 0.05;
  mat.roughness = 0.7;
  mat.emissiveColor = Color3.FromHexString('#0a0010');
  return mat;
}

export type WallType = 'stone' | 'flesh' | 'lava' | 'obsidian' | 'door';
```

**Step 2: Create lighting system**

```typescript
// src/game/rendering/Lighting.ts
import {Color3, PointLight, Scene, SpotLight, Vector3, ShadowGenerator} from '@babylonjs/core';
import {MapCell} from '../levels/LevelGenerator';

export interface DynamicLight {
  light: PointLight;
  baseIntensity: number;
  flickerSpeed: number;
  flickerAmount: number;
}

export function createLavaLights(
  grid: MapCell[][],
  cellSize: number,
  scene: Scene,
): DynamicLight[] {
  const lights: DynamicLight[] = [];
  let lightCount = 0;
  const maxLights = 20; // Performance limit

  for (let z = 0; z < grid.length && lightCount < maxLights; z++) {
    for (let x = 0; x < grid[0].length && lightCount < maxLights; x++) {
      if (grid[z][x] === MapCell.WALL_LAVA) {
        // Only place a light every few lava blocks to save performance
        if (Math.random() > 0.7) continue;

        const light = new PointLight(
          `lavaLight-${lightCount}`,
          new Vector3(x * cellSize, 1.5, z * cellSize),
          scene,
        );
        light.diffuse = new Color3(1.0, 0.4, 0.1);
        light.specular = new Color3(1.0, 0.3, 0.0);
        light.intensity = 0.6;
        light.range = 6;

        lights.push({
          light,
          baseIntensity: 0.6,
          flickerSpeed: 2 + Math.random() * 3,
          flickerAmount: 0.2 + Math.random() * 0.2,
        });
        lightCount++;
      }
    }
  }

  return lights;
}

export function createPlayerSpotlight(scene: Scene): {light: SpotLight; shadowGen: ShadowGenerator} {
  const light = new SpotLight(
    'playerSpot',
    Vector3.Zero(),
    Vector3.Forward(),
    Math.PI / 4,
    2,
    scene,
  );
  light.diffuse = new Color3(0.9, 0.7, 0.5);
  light.intensity = 0.8;
  light.range = 15;

  const shadowGen = new ShadowGenerator(512, light);
  shadowGen.useBlurExponentialShadowMap = true;
  shadowGen.blurKernel = 16;

  return {light, shadowGen};
}

export function updateFlickerLights(lights: DynamicLight[], time: number): void {
  for (const dl of lights) {
    dl.light.intensity =
      dl.baseIntensity + Math.sin(time * dl.flickerSpeed) * dl.flickerAmount;
  }
}
```

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add PBR materials and dynamic lighting system"
```

---

### Task 6: Add post-processing pipeline

Set up DefaultRenderingPipeline with bloom, glow, FXAA, vignette, and custom screen effects.

**Files:**
- Create: `src/game/rendering/PostProcessing.ts`

**Step 1: Create post-processing setup**

```typescript
// src/game/rendering/PostProcessing.ts
import {
  Camera,
  Color4,
  DefaultRenderingPipeline,
  GlowLayer,
  Scene,
  Vector3,
} from '@babylonjs/core';
import {GameState} from '../../state/GameState';

let pipeline: DefaultRenderingPipeline | null = null;
let glowLayer: GlowLayer | null = null;
let originalCameraPos: Vector3 | null = null;

export function setupPostProcessing(scene: Scene, camera: Camera): void {
  // Default rendering pipeline
  pipeline = new DefaultRenderingPipeline('defaultPipeline', true, scene, [camera]);

  // Bloom - for lava glow and emissive materials
  pipeline.bloomEnabled = true;
  pipeline.bloomWeight = 0.4;
  pipeline.bloomKernel = 64;
  pipeline.bloomThreshold = 0.6;

  // FXAA anti-aliasing
  pipeline.fxaaEnabled = true;

  // Image processing
  pipeline.imageProcessingEnabled = true;
  pipeline.imageProcessing.vignetteEnabled = true;
  pipeline.imageProcessing.vignetteWeight = 2.5;
  pipeline.imageProcessing.vignetteColor = new Color4(0.2, 0, 0, 1);
  pipeline.imageProcessing.contrast = 1.3;
  pipeline.imageProcessing.exposure = 0.9;

  // Glow layer for emissive objects
  glowLayer = new GlowLayer('glowLayer', scene);
  glowLayer.intensity = 0.8;
}

export function updateScreenEffects(scene: Scene, deltaMs: number): void {
  const camera = scene.activeCamera;
  if (!camera) return;

  const gs = GameState.get();

  // Screen shake
  if (gs.screenShake > 0) {
    const shakeIntensity = gs.screenShake * 0.01;
    if (!originalCameraPos) {
      originalCameraPos = camera.position.clone();
    }
    camera.position.x += (Math.random() - 0.5) * shakeIntensity;
    camera.position.y += (Math.random() - 0.5) * shakeIntensity;
    GameState.set({screenShake: gs.screenShake - deltaMs * 0.05});
  } else if (originalCameraPos) {
    originalCameraPos = null;
  }

  // Damage flash - increase vignette redness
  if (gs.damageFlash > 0 && pipeline) {
    const flashIntensity = gs.damageFlash / 300;
    pipeline.imageProcessing.vignetteWeight = 2.5 + flashIntensity * 8;
    pipeline.imageProcessing.vignetteColor = new Color4(0.8 * flashIntensity, 0, 0, 1);
    GameState.set({damageFlash: gs.damageFlash - deltaMs});
  } else if (pipeline) {
    pipeline.imageProcessing.vignetteWeight = 2.5;
    pipeline.imageProcessing.vignetteColor = new Color4(0.2, 0, 0, 1);
  }

  // Gun flash - brief bloom spike
  if (gs.gunFlash > 0) {
    if (pipeline) {
      pipeline.bloomWeight = 0.4 + (gs.gunFlash / 6) * 0.4;
    }
    GameState.set({gunFlash: gs.gunFlash - 1});
  } else if (pipeline) {
    pipeline.bloomWeight = 0.4;
  }
}

export function disposePostProcessing(): void {
  pipeline?.dispose();
  glowLayer?.dispose();
  pipeline = null;
  glowLayer = null;
}
```

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add post-processing pipeline with bloom, glow, screen effects"
```

---

### Task 7: Create procedural audio system

Port the procedural Web Audio sounds from the HTML version into a reusable sound system.

**Files:**
- Create: `src/game/systems/AudioSystem.ts`

**Step 1: Create audio system**

```typescript
// src/game/systems/AudioSystem.ts

let audioCtx: AudioContext | null = null;

export function initAudio(): void {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
}

export type SoundType =
  | 'shoot' | 'shotgun' | 'rapid' | 'bigshot'
  | 'hit' | 'goat_die' | 'goat_alert'
  | 'pickup' | 'hurt' | 'door'
  | 'empty' | 'reload' | 'boss_hit'
  | 'explosion';

export function playSound(type: SoundType): void {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  switch (type) {
    case 'shoot': {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now); osc.stop(now + 0.15);
      // Noise burst for gunshot crack
      const noise = audioCtx.createBufferSource();
      const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.1, audioCtx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * 0.03));
      }
      noise.buffer = buf;
      const ng = audioCtx.createGain();
      ng.gain.setValueAtTime(0.4, now);
      ng.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      noise.connect(ng); ng.connect(audioCtx.destination);
      noise.start(now);
      break;
    }
    case 'shotgun': {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(25, now + 0.25);
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now); osc.stop(now + 0.25);
      // Heavy noise
      const noise = audioCtx.createBufferSource();
      const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.15, audioCtx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * 0.05));
      }
      noise.buffer = buf;
      const ng = audioCtx.createGain();
      ng.gain.setValueAtTime(0.6, now);
      ng.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      noise.connect(ng); ng.connect(audioCtx.destination);
      noise.start(now);
      break;
    }
    case 'hit': {
      osc.type = 'square';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now); osc.stop(now + 0.1);
      break;
    }
    case 'goat_die': {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.4);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now); osc.stop(now + 0.4);
      break;
    }
    case 'goat_alert': {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.setValueAtTime(350, now + 0.1);
      osc.frequency.setValueAtTime(200, now + 0.2);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now); osc.stop(now + 0.3);
      break;
    }
    case 'pickup': {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(660, now + 0.05);
      osc.frequency.setValueAtTime(880, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now); osc.stop(now + 0.2);
      break;
    }
    case 'hurt': {
      osc.type = 'square';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now); osc.stop(now + 0.2);
      break;
    }
    case 'reload': {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.setValueAtTime(500, now + 0.1);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now); osc.stop(now + 0.15);
      break;
    }
    case 'explosion': {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(60, now);
      osc.frequency.exponentialRampToValueAtTime(15, now + 0.5);
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.start(now); osc.stop(now + 0.5);
      // Rumble
      const noise = audioCtx.createBufferSource();
      const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.4, audioCtx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * 0.15));
      }
      noise.buffer = buf;
      const ng = audioCtx.createGain();
      ng.gain.setValueAtTime(0.5, now);
      ng.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      noise.connect(ng); ng.connect(audioCtx.destination);
      noise.start(now);
      break;
    }
    case 'boss_hit': {
      osc.type = 'square';
      osc.frequency.setValueAtTime(60, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.3);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now); osc.stop(now + 0.3);
      break;
    }
    default: {
      // empty click
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(80, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now); osc.stop(now + 0.05);
    }
  }
}
```

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add procedural audio system ported from HTML version"
```

---

### Task 8: Enhance AI system with new enemy behaviors

Upgrade the AI to handle all 6 enemy types with distinct behaviors: ranged attacks, charge, stealth, armor.

**Files:**
- Modify: `src/game/systems/AISystem.ts`

**Step 1: Rewrite AISystem with expanded behaviors**

```typescript
// src/game/systems/AISystem.ts
import {Vector3} from '@babylonjs/core';
import type {Entity} from '../entities/components';
import {world} from '../entities/world';
import {GameState} from '../../state/GameState';
import {playSound} from './AudioSystem';

const ALERT_RADIUS = 15;
const ATTACK_COOLDOWN_FRAMES = 60;

export function aiSystemUpdate(deltaTime: number): void {
  const player = world.entities.find((e: Entity) => e.type === 'player');
  if (!player?.position) return;

  const playerPos = player.position;
  const dtScale = deltaTime / 16; // normalize to ~60fps

  world.entities
    .filter((e: Entity) => e.enemy)
    .forEach((entity: Entity) => {
      const enemy = entity.enemy!;
      if (!entity.position) return;

      enemy.attackCooldown = Math.max(0, (enemy.attackCooldown || 0) - 1);
      const dist = Vector3.Distance(entity.position, playerPos);

      // Alert detection
      if (dist < ALERT_RADIUS && !enemy.alert) {
        enemy.alert = true;
        playSound('goat_alert');
      }

      if (!enemy.alert) return;

      const dir = playerPos.subtract(entity.position).normalize();

      // Type-specific behaviors
      switch (entity.type) {
        case 'fireGoat':
          updateFireGoat(entity, enemy, dir, dist, playerPos, dtScale);
          break;
        case 'shadowGoat':
          updateShadowGoat(entity, enemy, dir, dist, dtScale);
          break;
        case 'goatKnight':
          updateGoatKnight(entity, enemy, dir, dist, player, dtScale);
          break;
        case 'archGoat':
          updateArchGoat(entity, enemy, dir, dist, playerPos, dtScale);
          break;
        default:
          // goat and hellgoat - basic chase + melee
          updateBasicGoat(entity, enemy, dir, dist, player, dtScale);
          break;
      }
    });
}

function updateBasicGoat(
  entity: Entity, enemy: Entity['enemy']!, dir: Vector3,
  dist: number, player: Entity, dt: number,
): void {
  if (dist > enemy.attackRange * 0.8) {
    entity.position!.x += dir.x * enemy.speed * dt;
    entity.position!.z += dir.z * enemy.speed * dt;
  } else if (enemy.attackCooldown <= 0) {
    player.player!.hp -= enemy.damage;
    enemy.attackCooldown = ATTACK_COOLDOWN_FRAMES;
    GameState.set({damageFlash: 300, screenShake: 10});
    playSound('hurt');
  }
}

function updateFireGoat(
  entity: Entity, enemy: Entity['enemy']!, dir: Vector3,
  dist: number, playerPos: Vector3, dt: number,
): void {
  // Maintain distance - back up if too close, approach if too far
  if (dist < 6) {
    entity.position!.x -= dir.x * enemy.speed * dt;
    entity.position!.z -= dir.z * enemy.speed * dt;
  } else if (dist > 12) {
    entity.position!.x += dir.x * enemy.speed * dt;
    entity.position!.z += dir.z * enemy.speed * dt;
  }

  // Shoot fireballs
  enemy.shootCooldown = (enemy.shootCooldown || 0) - 1;
  if (enemy.shootCooldown! <= 0 && dist < 15) {
    const fireDir = playerPos.subtract(entity.position!).normalize();
    world.add({
      id: `eproj-${Date.now()}-${Math.random()}`,
      type: 'projectile',
      position: entity.position!.clone(),
      velocity: fireDir.scale(0.08),
      projectile: {life: 120, damage: enemy.damage, speed: 0.08, owner: 'enemy'},
    });
    enemy.shootCooldown = 90;
  }
}

function updateShadowGoat(
  entity: Entity, enemy: Entity['enemy']!, dir: Vector3,
  dist: number, dt: number,
): void {
  // Approach while semi-invisible
  enemy.visibilityAlpha = dist > 8 ? 0.15 : 0.15 + (1 - dist / 8) * 0.85;

  // Fast approach
  if (dist > enemy.attackRange * 0.8) {
    entity.position!.x += dir.x * enemy.speed * 1.5 * dt;
    entity.position!.z += dir.z * enemy.speed * 1.5 * dt;
  }
}

function updateGoatKnight(
  entity: Entity, enemy: Entity['enemy']!, dir: Vector3,
  dist: number, player: Entity, dt: number,
): void {
  // Slow approach, absorbs damage with armor
  if (dist > enemy.attackRange * 0.8) {
    entity.position!.x += dir.x * enemy.speed * dt;
    entity.position!.z += dir.z * enemy.speed * dt;
  } else if (enemy.attackCooldown <= 0) {
    player.player!.hp -= enemy.damage;
    enemy.attackCooldown = ATTACK_COOLDOWN_FRAMES * 1.5;
    GameState.set({damageFlash: 400, screenShake: 15});
    playSound('hurt');
  }
}

function updateArchGoat(
  entity: Entity, enemy: Entity['enemy']!, dir: Vector3,
  dist: number, playerPos: Vector3, dt: number,
): void {
  // Boss: multi-behavior based on HP phase
  const hpPercent = enemy.hp / enemy.maxHp;

  // Phase 1 (>50%): Slow approach + ranged
  // Phase 2 (<=50%): Faster + summons minions + more projectiles
  const speedMult = hpPercent > 0.5 ? 1 : 1.5;

  if (dist > 4) {
    entity.position!.x += dir.x * enemy.speed * speedMult * dt;
    entity.position!.z += dir.z * enemy.speed * speedMult * dt;
  }

  // Ranged attack
  enemy.shootCooldown = (enemy.shootCooldown || 0) - 1;
  const shootInterval = hpPercent > 0.5 ? 120 : 60;
  if (enemy.shootCooldown! <= 0 && dist > 3) {
    // Fire 3 projectiles in a spread pattern
    for (let i = -1; i <= 1; i++) {
      const angle = Math.atan2(dir.z, dir.x) + i * 0.2;
      const fireDir = new Vector3(Math.cos(angle), 0, Math.sin(angle));
      world.add({
        id: `bproj-${Date.now()}-${i}`,
        type: 'projectile',
        position: entity.position!.clone(),
        velocity: fireDir.scale(0.1),
        projectile: {life: 150, damage: 15, speed: 0.1, owner: 'enemy'},
      });
    }
    enemy.shootCooldown = shootInterval;
  }

  // Phase 2: summon minions periodically
  if (hpPercent <= 0.5 && Math.random() < 0.002) {
    const spawnOffset = new Vector3(
      (Math.random() - 0.5) * 6,
      0,
      (Math.random() - 0.5) * 6,
    );
    const spawnPos = entity.position!.add(spawnOffset);
    world.add({
      id: `summon-${Date.now()}`,
      type: 'goat',
      position: spawnPos,
      enemy: {
        hp: 3, maxHp: 3, damage: 5, speed: 0.06,
        attackRange: 2, alert: true, attackCooldown: 0, scoreValue: 50,
      },
    });
  }
}
```

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: expand AI system with 6 enemy types and behaviors"
```

---

### Task 9: Enhance level generation with floor themes and boss arenas

Upgrade the procedural generation to support themed floors and boss rooms.

**Files:**
- Modify: `src/game/levels/LevelGenerator.ts`
- Create: `src/game/levels/FloorThemes.ts`
- Create: `src/game/levels/BossArenas.ts`

**Step 1: Create floor themes**

```typescript
// src/game/levels/FloorThemes.ts
import {MapCell} from './LevelGenerator';
import type {EntityType} from '../entities/components';

export interface FloorTheme {
  name: string;
  displayName: string;
  primaryWall: MapCell;
  accentWalls: MapCell[];
  enemyTypes: EntityType[];
  enemyDensity: number; // 0-1 scale
  pickupDensity: number;
  ambientColor: string; // hex for hemispheric light
}

export const FLOOR_THEMES: FloorTheme[] = [
  {
    name: 'firePits',
    displayName: 'THE FIRE PITS',
    primaryWall: MapCell.WALL_STONE,
    accentWalls: [MapCell.WALL_LAVA, MapCell.WALL_LAVA],
    enemyTypes: ['goat', 'goat', 'hellgoat', 'fireGoat'],
    enemyDensity: 0.3,
    pickupDensity: 0.4,
    ambientColor: '#ff4422',
  },
  {
    name: 'fleshCaverns',
    displayName: 'FLESH CAVERNS',
    primaryWall: MapCell.WALL_FLESH,
    accentWalls: [MapCell.WALL_STONE, MapCell.WALL_LAVA],
    enemyTypes: ['goat', 'hellgoat', 'hellgoat', 'shadowGoat'],
    enemyDensity: 0.4,
    pickupDensity: 0.35,
    ambientColor: '#cc2244',
  },
  {
    name: 'obsidianFortress',
    displayName: 'OBSIDIAN FORTRESS',
    primaryWall: MapCell.WALL_OBSIDIAN,
    accentWalls: [MapCell.WALL_STONE, MapCell.WALL_LAVA],
    enemyTypes: ['hellgoat', 'goatKnight', 'goatKnight', 'fireGoat'],
    enemyDensity: 0.5,
    pickupDensity: 0.3,
    ambientColor: '#6622aa',
  },
  {
    name: 'theVoid',
    displayName: 'THE VOID',
    primaryWall: MapCell.WALL_OBSIDIAN,
    accentWalls: [MapCell.WALL_FLESH, MapCell.WALL_OBSIDIAN],
    enemyTypes: ['shadowGoat', 'goatKnight', 'fireGoat', 'hellgoat'],
    enemyDensity: 0.6,
    pickupDensity: 0.25,
    ambientColor: '#220044',
  },
];

export function getThemeForFloor(floor: number): FloorTheme {
  return FLOOR_THEMES[(floor - 1) % FLOOR_THEMES.length];
}
```

**Step 2: Create boss arenas**

```typescript
// src/game/levels/BossArenas.ts
import {MapCell} from './LevelGenerator';

// Returns a 2D grid for a boss arena with pillars for cover
export function generateBossArena(): MapCell[][] {
  const size = 15;
  const arena: MapCell[][] = [];

  for (let z = 0; z < size; z++) {
    const row: MapCell[] = [];
    for (let x = 0; x < size; x++) {
      // Walls on edges
      if (z === 0 || z === size - 1 || x === 0 || x === size - 1) {
        row.push(MapCell.WALL_OBSIDIAN);
      }
      // Symmetrical cover pillars
      else if (
        (x === 4 && z === 4) || (x === 10 && z === 4) ||
        (x === 4 && z === 10) || (x === 10 && z === 10) ||
        (x === 7 && z === 3) || (x === 7 && z === 11)
      ) {
        row.push(MapCell.WALL_LAVA);
      } else {
        row.push(MapCell.EMPTY);
      }
    }
    arena.push(row);
  }

  return arena;
}
```

**Step 3: Update LevelGenerator to use themes and boss rooms**

Add `floor` parameter to `generate()`, use theme for wall types and enemy selection, and append boss arena every 5 floors. The key changes to `src/game/levels/LevelGenerator.ts`:

- Add `floor` parameter to constructor
- Use `getThemeForFloor(floor)` to determine wall types and enemy distribution
- Every 5th floor, embed a boss arena section and spawn an `archGoat`
- Scale difficulty: grid size increases by 2 per floor, more enemies per room

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: add floor themes and boss arena generation"
```

---

### Task 10: Rewrite GameEngine to integrate all new systems

This is the main integration task - rewrite `GameEngine.tsx` to use PBR materials, post-processing, new weapon system, audio, and enhanced level generation.

**Files:**
- Modify: `src/game/GameEngine.tsx`

**Step 1: Rewrite GameEngine integrating all systems**

The rewritten GameEngine should:
1. Initialize level with floor theme
2. Spawn player with full weapon loadout and ammo
3. Create PBR wall materials (shared per type, not per wall)
4. Set up post-processing pipeline
5. Create dynamic lava lights
6. Wire up the game loop: AI update, weapon reload update, screen effects, light flicker
7. Wire up pointer/keyboard input for shooting and weapon switching
8. Handle enemy rendering with visibility alpha for shadow goats

Key patterns:
- Use `useMemo` for shared materials (one per wall type, not per mesh)
- Use `useEffect` for game loop setup on `scene.onBeforeRenderObservable`
- Keep `<box>` JSX for walls but reference shared materials via `materialFromInstance`

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: rewrite GameEngine with all new systems integrated"
```

---

## Phase 2: UI Layer (21st.dev Magic)

### Task 11: Create HUD overlay

Build the in-game HUD showing health, ammo, minimap, floor indicator, crosshair, and kill counter.

**Files:**
- Create: `src/ui/HUD.tsx`

**Step 1: Build HUD component**

Use 21st.dev Magic component builder to create a game HUD overlay with:
- Health bar (bottom-left) - red gradient, pulses below 25% HP
- Ammo display (bottom-right) - magazine dots + weapon name
- Minimap (top-right) - simple canvas showing explored grid
- Floor indicator (top-left) - "FLOOR 3 - FLESH CAVERNS"
- Crosshair (center) - simple cross that expands during movement
- Kill counter (top-center)

This is rendered as a React Native `View` absolutely positioned over the Babylon.js canvas.

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add game HUD with health, ammo, minimap, crosshair"
```

---

### Task 12: Create main menu screen

Build the title screen with animated title, mode selection, and controls display.

**Files:**
- Create: `src/ui/MainMenu.tsx`

**Step 1: Build main menu**

Use 21st.dev Magic for animated buttons and title treatment:
- Title: "GOATS IN HELL" with red glow/shadow effect
- Subtitle: "A DESCENT INTO MADNESS"
- Mode buttons: Roguelike / Arena Survival / Campaign (grayed)
- Controls reference
- Background: dark with animated gradient

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add main menu with mode selection"
```

---

### Task 13: Create death screen and victory screen

Build the game over and floor clear overlay screens.

**Files:**
- Create: `src/ui/DeathScreen.tsx`
- Create: `src/ui/VictoryScreen.tsx`

**Step 1: Build death screen**

- "YOU DIED" title with red glow
- Stats: kills, accuracy, floor reached, score
- "TRY AGAIN" button

**Step 2: Build victory screen**

- "FLOOR CLEARED" title with gold glow
- Stats: kills on this floor, total score
- "CONTINUE" and "EXIT" buttons

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add death screen and victory screen overlays"
```

---

### Task 14: Create pause menu

Build the pause overlay with resume, settings, and quit options.

**Files:**
- Create: `src/ui/PauseMenu.tsx`

**Step 1: Build pause menu**

- Semi-transparent dark overlay
- "PAUSED" title
- Resume / Settings / Quit buttons
- Settings: sensitivity slider, volume toggle

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add pause menu with settings"
```

---

### Task 15: Wire up App.tsx as screen router

Connect all UI screens to the game state screen system.

**Files:**
- Modify: `src/App.tsx`

**Step 1: Rewrite App.tsx as screen router**

```typescript
import React, {useEffect, useState} from 'react';
import {View, StyleSheet} from 'react-native';
import {EngineWrapper} from './EngineWrapper';
import {GameEngine} from './game/GameEngine';
import {MainMenu} from './ui/MainMenu';
import {HUD} from './ui/HUD';
import {DeathScreen} from './ui/DeathScreen';
import {VictoryScreen} from './ui/VictoryScreen';
import {PauseMenu} from './ui/PauseMenu';
import {GameState, GameScreen} from './state/GameState';

const App = () => {
  const [screen, setScreen] = useState<GameScreen>(GameState.get().screen);

  useEffect(() => {
    return GameState.subscribe(() => {
      setScreen(GameState.get().screen);
    });
  }, []);

  return (
    <View style={styles.container}>
      {screen !== 'menu' && (
        <EngineWrapper camera={undefined}>
          <scene clearColor={[0.05, 0.01, 0.02, 1]}>
            <GameEngine />
          </scene>
        </EngineWrapper>
      )}
      {screen === 'menu' && <MainMenu />}
      {screen === 'playing' && <HUD />}
      {screen === 'paused' && <PauseMenu />}
      {screen === 'dead' && <DeathScreen />}
      {screen === 'victory' && <VictoryScreen />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#000'},
});

export default App;
```

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: wire up App.tsx as screen router with all UI overlays"
```

---

## Phase 3: Game Modes

### Task 16: Implement roguelike floor progression

Add floor advancement: when all enemies on a floor are dead, show victory screen and generate next floor.

**Files:**
- Create: `src/game/systems/ProgressionSystem.ts`

**Step 1: Create progression system**

```typescript
// src/game/systems/ProgressionSystem.ts
import type {Entity} from '../entities/components';
import {world} from '../entities/world';
import {GameState} from '../../state/GameState';

export function checkFloorComplete(): boolean {
  const enemies = world.entities.filter((e: Entity) => e.enemy);
  return enemies.length === 0;
}

export function advanceFloor(): void {
  const gs = GameState.get();
  GameState.set({
    floor: gs.floor + 1,
    kills: 0,
    screen: 'victory',
  });
}

export function checkPlayerDeath(): boolean {
  const player = world.entities.find((e: Entity) => e.type === 'player');
  return !player || !player.player || player.player.hp <= 0;
}

export function triggerDeath(): void {
  GameState.set({screen: 'dead'});
}
```

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add roguelike floor progression system"
```

---

### Task 17: Implement arena survival mode

Add wave-based survival with escalating difficulty and score multipliers.

**Files:**
- Create: `src/game/systems/WaveSystem.ts`
- Create: `src/game/levels/ArenaGenerator.ts`

**Step 1: Create arena generator**

Simple open arena with scattered cover pillars, randomized each game.

**Step 2: Create wave system**

Tracks current wave, spawns enemies in increasing numbers with tougher types as waves progress. Score multiplier increases with consecutive kills.

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add arena survival mode with wave system"
```

---

## Phase 4: Polish

### Task 18: Add particle effects

Create particle systems for lava embers, enemy death bursts, muzzle flash, and pickup glow.

**Files:**
- Create: `src/game/rendering/Particles.ts`

**Step 1: Create particle system factory**

Use Babylon.js ParticleSystem API to create reusable particle emitters for each effect type. Lava embers are persistent (attached to lava lights), others are one-shot (spawned and auto-disposed).

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add particle effects for lava, death, muzzle flash"
```

---

### Task 19: Add combat system for projectile entities

Handle projectile movement, collision with walls and player/enemies, and area-of-effect damage.

**Files:**
- Create: `src/game/systems/CombatSystem.ts`

**Step 1: Create combat update loop**

Each frame: move all projectile entities by their velocity, decrement life, check wall collisions (grid lookup), check proximity to enemies (player projectiles) or player (enemy projectiles), apply damage on hit, apply AoE for Goat's Bane, remove dead projectiles.

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add combat system for projectile movement and collision"
```

---

### Task 20: Add pickup collection system

Handle player walking over health, ammo, and weapon pickups.

**Files:**
- Create: `src/game/systems/PickupSystem.ts`

**Step 1: Create pickup system**

Each frame: check distance between player and all pickup entities. If within range (1.5 units), apply effect (heal, add ammo, add weapon to inventory), play pickup sound, remove entity.

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add pickup collection system"
```

---

### Task 21: Final integration and testing

Wire all systems into the game loop, verify everything works end-to-end.

**Files:**
- Modify: `src/game/GameEngine.tsx` (final integration pass)

**Step 1: Verify game loop order**

The render loop should execute in this order:
1. `aiSystemUpdate(deltaTime)`
2. `combatSystemUpdate(deltaTime)`
3. `pickupSystemUpdate()`
4. `updateReload(player)`
5. `updateScreenEffects(scene, deltaTime)`
6. `updateFlickerLights(lavaLights, time)`
7. `checkFloorComplete()` / `checkPlayerDeath()`

**Step 2: Test on web**

```bash
npm start
```
Open in browser, verify:
- Menu screen shows with mode selection
- Roguelike mode generates themed floor
- Player can move, shoot, switch weapons
- Enemies exhibit correct behaviors per type
- PBR materials render with bloom/glow
- Screen shake and damage flash work
- Floor progression triggers on all enemies dead
- Death screen shows on HP <= 0
- Audio plays for all actions

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: final integration of all game systems"
```

---

## Parallel Agent Assignment Guide

For the swarming approach, these tasks can be parallelized:

**Parallel Group 1** (Foundation - independent):
- Task 2 (GameState) + Task 4 (Weapons) + Task 5 (Materials) + Task 6 (PostProcessing) + Task 7 (Audio)

**Parallel Group 2** (after Group 1):
- Task 8 (AI) + Task 9 (Level themes) can run simultaneously

**Parallel Group 3** (UI - independent of game systems):
- Task 11 (HUD) + Task 12 (MainMenu) + Task 13 (Death/Victory) + Task 14 (PauseMenu) can all run in parallel

**Sequential** (integration):
- Task 1 (restructure) must be first
- Task 3 (ECS expansion) must be before Task 4, 8
- Task 10 (GameEngine rewrite) depends on Tasks 2-9
- Task 15 (App.tsx router) depends on Tasks 11-14
- Task 21 (final integration) depends on everything
