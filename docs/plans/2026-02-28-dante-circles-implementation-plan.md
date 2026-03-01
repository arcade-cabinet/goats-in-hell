# Dante's 9 Circles Level System — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace procedural BSP dungeon generation with 9 hand-crafted levels mapped to Dante's Inferno circles, each with unique environmental mechanics, guardian goat bosses, trigger-based encounters, and 3D platforming.

**Architecture:** TypeScript `LevelBuilder` class authors `CircleLevel` data objects. A `CircleLoader` bridges `CircleLevel` → existing `LevelData` interface so rendering pipeline (`LevelMeshes.tsx`, `EnemyMesh.tsx`, `DungeonProps.tsx`) requires zero changes. New systems (TriggerSystem, EnvironmentZoneSystem, PatrolSystem) run per-frame to handle scripted encounters and circle-specific mechanics.

**Tech Stack:** TypeScript, Three.js/R3F, Miniplex ECS, Rapier physics, Jest

**Design doc:** `docs/plans/2026-02-28-dante-circles-level-system-design.md`

---

## Phase 1: Data Types + Foundation

### Task 1: Add new MapCell types

**Files:**
- Modify: `src/game/levels/LevelGenerator.ts:16-28` — extend `MapCell` enum
- Modify: `src/game/levels/LevelGenerator.ts:733-741` — extend `isWalkable()`
- Modify: `src/game/levels/LevelGenerator.ts:748-752` — extend `getElevation()`
- Test: `src/game/levels/__tests__/LevelGenerator.test.ts`

**Step 1: Write the failing test**

Add to `src/game/levels/__tests__/LevelGenerator.test.ts`:

```typescript
describe('new MapCell types', () => {
  it('defines all circle-specific cell types', () => {
    expect(MapCell.FLOOR_ICE).toBe(11);
    expect(MapCell.FLOOR_SLUSH).toBe(12);
    expect(MapCell.FLOOR_WATER).toBe(13);
    expect(MapCell.FLOOR_WATER_DEEP).toBe(14);
    expect(MapCell.FLOOR_BLOOD).toBe(15);
    expect(MapCell.FLOOR_SAND_BURNING).toBe(16);
    expect(MapCell.FLOOR_FROST).toBe(17);
    expect(MapCell.WALL_ICE).toBe(18);
    expect(MapCell.WALL_ILLUSION).toBe(19);
    expect(MapCell.FLOOR_ILLUSION).toBe(20);
    expect(MapCell.WALL_GOLD).toBe(21);
    expect(MapCell.FLOOR_CRUSHING).toBe(22);
    expect(MapCell.FLOOR_RAISED_HIGH).toBe(23);
    expect(MapCell.RAMP_HIGH).toBe(24);
    expect(MapCell.JUMP_PAD).toBe(25);
    expect(MapCell.FLOOR_VINES).toBe(26);
  });

  it('FLOOR_ICE is walkable', () => {
    expect(LevelGenerator.isWalkable(MapCell.FLOOR_ICE)).toBe(true);
  });

  it('WALL_ICE is not walkable', () => {
    expect(LevelGenerator.isWalkable(MapCell.WALL_ICE)).toBe(false);
  });

  it('WALL_ILLUSION is walkable (looks like wall, but player can walk through)', () => {
    expect(LevelGenerator.isWalkable(MapCell.WALL_ILLUSION)).toBe(true);
  });

  it('FLOOR_RAISED_HIGH has elevation 2x PLATFORM_HEIGHT', () => {
    expect(LevelGenerator.getElevation(MapCell.FLOOR_RAISED_HIGH)).toBe(PLATFORM_HEIGHT * 2);
  });

  it('RAMP_HIGH has elevation 1.5x PLATFORM_HEIGHT', () => {
    expect(LevelGenerator.getElevation(MapCell.RAMP_HIGH)).toBe(PLATFORM_HEIGHT * 1.5);
  });

  it('JUMP_PAD has ground elevation', () => {
    expect(LevelGenerator.getElevation(MapCell.JUMP_PAD)).toBe(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- --testPathPattern LevelGenerator.test -t "new MapCell types"`
Expected: FAIL — `MapCell.FLOOR_ICE` is undefined

**Step 3: Add new MapCell values and update helpers**

In `src/game/levels/LevelGenerator.ts`, extend the `MapCell` enum (after line 27):

```typescript
  FLOOR_ICE = 11,
  FLOOR_SLUSH = 12,
  FLOOR_WATER = 13,
  FLOOR_WATER_DEEP = 14,
  FLOOR_BLOOD = 15,
  FLOOR_SAND_BURNING = 16,
  FLOOR_FROST = 17,
  WALL_ICE = 18,
  WALL_ILLUSION = 19,
  FLOOR_ILLUSION = 20,
  WALL_GOLD = 21,
  FLOOR_CRUSHING = 22,
  FLOOR_RAISED_HIGH = 23,
  RAMP_HIGH = 24,
  JUMP_PAD = 25,
  FLOOR_VINES = 26,
```

Update `isWalkable()` to include new walkable types:

```typescript
static isWalkable(cell: MapCell): boolean {
  return (
    cell === MapCell.EMPTY ||
    cell === MapCell.DOOR ||
    cell === MapCell.FLOOR_LAVA ||
    cell === MapCell.FLOOR_RAISED ||
    cell === MapCell.RAMP ||
    cell === MapCell.FLOOR_VOID ||
    cell === MapCell.FLOOR_ICE ||
    cell === MapCell.FLOOR_SLUSH ||
    cell === MapCell.FLOOR_WATER ||
    cell === MapCell.FLOOR_WATER_DEEP ||
    cell === MapCell.FLOOR_BLOOD ||
    cell === MapCell.FLOOR_SAND_BURNING ||
    cell === MapCell.FLOOR_FROST ||
    cell === MapCell.WALL_ILLUSION ||
    cell === MapCell.FLOOR_ILLUSION ||
    cell === MapCell.FLOOR_CRUSHING ||
    cell === MapCell.FLOOR_RAISED_HIGH ||
    cell === MapCell.RAMP_HIGH ||
    cell === MapCell.JUMP_PAD ||
    cell === MapCell.FLOOR_VINES
  );
}
```

Update `getElevation()`:

```typescript
static getElevation(cell: MapCell): number {
  if (cell === MapCell.FLOOR_RAISED) return PLATFORM_HEIGHT;
  if (cell === MapCell.FLOOR_RAISED_HIGH) return PLATFORM_HEIGHT * 2;
  if (cell === MapCell.RAMP) return PLATFORM_HEIGHT * 0.5;
  if (cell === MapCell.RAMP_HIGH) return PLATFORM_HEIGHT * 1.5;
  return 0;
}
```

Update `isWall()` to include new wall types:

```typescript
private isWall(x: number, z: number): boolean {
  if (!this.inBounds(x, z)) return true;
  const cell = this.grid[z][x];
  return (
    cell === MapCell.WALL_STONE ||
    cell === MapCell.WALL_FLESH ||
    cell === MapCell.WALL_LAVA ||
    cell === MapCell.WALL_OBSIDIAN ||
    cell === MapCell.WALL_SECRET ||
    cell === MapCell.WALL_ICE ||
    cell === MapCell.WALL_GOLD
  );
}
```

Note: `WALL_ILLUSION` is intentionally NOT in `isWall()` — it renders as a wall but is walkable.

**Step 4: Run test to verify it passes**

Run: `pnpm test -- --testPathPattern LevelGenerator.test`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/game/levels/LevelGenerator.ts src/game/levels/__tests__/LevelGenerator.test.ts
git commit -m "feat: add circle-specific MapCell types for Dante's 9 circles"
```

---

### Task 2: Create CircleLevel data types

**Files:**
- Create: `src/game/levels/CircleLevel.ts`
- Test: `src/game/levels/__tests__/CircleLevel.test.ts`

**Step 1: Write the failing test**

Create `src/game/levels/__tests__/CircleLevel.test.ts`:

```typescript
import type {
  CircleLevel,
  CircleEntity,
  CircleMetadata,
  CircleRoom,
  CircleTheme,
  CircleTrigger,
  EnvironmentZone,
} from '../CircleLevel';

describe('CircleLevel types', () => {
  it('can create a minimal CircleLevel', () => {
    const level: CircleLevel = {
      metadata: {
        circle: 1,
        name: 'Limbo',
        sin: 'Loss of Heaven',
        guardian: 'goat',
        theme: {
          primaryWall: 1,
          accentWalls: [1],
          fogDensity: 0.05,
          fogColor: '#667788',
          ambientColor: '#556677',
          ambientIntensity: 0.4,
          skyColor: '#334455',
        },
        music: 'limbo-lament',
        ambientSound: 'limbo-wind',
      },
      grid: [[0, 1], [1, 0]],
      width: 2,
      height: 2,
      playerSpawn: { x: 0, z: 0, facing: 0 },
      entities: [],
      triggers: [],
      rooms: [],
      environmentZones: [],
    };

    expect(level.metadata.circle).toBe(1);
    expect(level.metadata.name).toBe('Limbo');
    expect(level.grid.length).toBe(2);
  });

  it('supports entities with patrol routes', () => {
    const entity: CircleEntity = {
      type: 'goat',
      x: 10,
      z: 8,
      patrol: [{ x: 10, z: 8 }, { x: 10, z: 14 }],
    };
    expect(entity.patrol).toHaveLength(2);
  });

  it('supports trigger zones', () => {
    const trigger: CircleTrigger = {
      id: 'ambush1',
      zone: { x: 4, z: 4, w: 6, h: 6 },
      action: 'spawnWave',
      wave: [{ type: 'goat', x: 6, z: 6 }],
      once: true,
    };
    expect(trigger.action).toBe('spawnWave');
    expect(trigger.once).toBe(true);
  });

  it('supports environment zones', () => {
    const zone: EnvironmentZone = {
      type: 'wind',
      bounds: { x: 0, z: 0, w: 10, h: 10 },
      intensity: 0.8,
      direction: { x: 1, z: 0 },
    };
    expect(zone.type).toBe('wind');
    expect(zone.direction?.x).toBe(1);
  });

  it('supports named rooms with types', () => {
    const room: CircleRoom = {
      name: 'bossArena',
      bounds: { x: 10, z: 20, w: 15, h: 15 },
      type: 'boss',
      elevation: 0,
    };
    expect(room.type).toBe('boss');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- --testPathPattern CircleLevel.test`
Expected: FAIL — module not found

**Step 3: Create the CircleLevel types file**

Create `src/game/levels/CircleLevel.ts`:

```typescript
/**
 * CircleLevel — data format for hand-crafted Dante's Inferno circle levels.
 *
 * Each circle is authored via LevelBuilder and produces a CircleLevel object.
 * The runtime CircleLoader converts this to the existing LevelData interface
 * so the rendering pipeline (LevelMeshes, EnemyMesh, DungeonProps) works unchanged.
 */

// ---------------------------------------------------------------------------
// Core level data
// ---------------------------------------------------------------------------

export interface CircleLevel {
  metadata: CircleMetadata;
  grid: number[][];
  width: number;
  height: number;
  playerSpawn: { x: number; z: number; facing: number };
  entities: CircleEntity[];
  triggers: CircleTrigger[];
  rooms: CircleRoom[];
  environmentZones: EnvironmentZone[];
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export interface CircleMetadata {
  circle: number;
  name: string;
  sin: string;
  guardian: string;
  theme: CircleTheme;
  music: string;
  ambientSound: string;
}

export interface CircleTheme {
  primaryWall: number;
  accentWalls: number[];
  fogDensity: number;
  fogColor: string;
  ambientColor: string;
  ambientIntensity: number;
  skyColor: string;
  particleEffect?: 'storm' | 'snow' | 'ash' | 'embers' | 'frost';
}

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------

export interface CircleEntity {
  type: string;
  x: number;
  z: number;
  elevation?: number;
  patrol?: { x: number; z: number }[];
  triggerId?: string;
  overrides?: Record<string, number | boolean | string>;
  facing?: number;
}

// ---------------------------------------------------------------------------
// Triggers
// ---------------------------------------------------------------------------

export type TriggerAction =
  | 'spawnWave'
  | 'lockDoors'
  | 'unlockDoors'
  | 'dialogue'
  | 'ambientChange'
  | 'bossIntro'
  | 'secretReveal'
  | 'platformMove';

export interface CircleTrigger {
  id: string;
  zone: { x: number; z: number; w: number; h: number };
  action: TriggerAction;
  wave?: { type: string; x: number; z: number }[];
  once: boolean;
  text?: string;
  delay?: number;
}

// ---------------------------------------------------------------------------
// Rooms
// ---------------------------------------------------------------------------

export type RoomType =
  | 'corridor'
  | 'arena'
  | 'puzzle'
  | 'secret'
  | 'boss'
  | 'hub'
  | 'platforming'
  | 'exploration';

export interface CircleRoom {
  name: string;
  bounds: { x: number; z: number; w: number; h: number };
  type: RoomType;
  elevation?: number;
}

// ---------------------------------------------------------------------------
// Environment zones
// ---------------------------------------------------------------------------

export type EnvironmentType =
  | 'wind'
  | 'ice'
  | 'water'
  | 'fire'
  | 'fog'
  | 'frost'
  | 'void'
  | 'blood'
  | 'illusion'
  | 'crushing';

export interface EnvironmentZone {
  type: EnvironmentType;
  bounds: { x: number; z: number; w: number; h: number };
  intensity: number;
  direction?: { x: number; z: number };
  timer?: { on: number; off: number };
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- --testPathPattern CircleLevel.test`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/game/levels/CircleLevel.ts src/game/levels/__tests__/CircleLevel.test.ts
git commit -m "feat: add CircleLevel data types for Dante's circle levels"
```

---

### Task 3: Create LevelBuilder class

**Files:**
- Create: `src/game/levels/LevelBuilder.ts`
- Test: `src/game/levels/__tests__/LevelBuilder.test.ts`

**Step 1: Write the failing test**

Create `src/game/levels/__tests__/LevelBuilder.test.ts`:

```typescript
import { LevelBuilder } from '../LevelBuilder';
import { MapCell } from '../LevelGenerator';

describe('LevelBuilder', () => {
  it('creates a grid filled with wall cells', () => {
    const b = new LevelBuilder(10, 10, 1, 'Limbo');
    const level = b.build();
    expect(level.width).toBe(10);
    expect(level.height).toBe(10);
    expect(level.grid[0][0]).toBe(MapCell.WALL_STONE);
    expect(level.metadata.circle).toBe(1);
    expect(level.metadata.name).toBe('Limbo');
  });

  it('carves a room into the grid', () => {
    const b = new LevelBuilder(20, 20, 1, 'Limbo');
    b.room('entrance', 2, 2, 6, 4);
    const level = b.build();

    // Interior should be EMPTY
    expect(level.grid[3][4]).toBe(MapCell.EMPTY);
    // Room should be registered
    expect(level.rooms).toHaveLength(1);
    expect(level.rooms[0].name).toBe('entrance');
    expect(level.rooms[0].bounds).toEqual({ x: 2, z: 2, w: 6, h: 4 });
  });

  it('carves a corridor between two rooms', () => {
    const b = new LevelBuilder(30, 30, 1, 'Limbo');
    b.room('a', 2, 2, 4, 4);
    b.room('b', 20, 2, 4, 4);
    b.corridor('a', 'b');
    const level = b.build();

    // Midpoint between rooms should be carved
    expect(level.grid[3][12]).toBe(MapCell.EMPTY);
  });

  it('places an enemy entity', () => {
    const b = new LevelBuilder(10, 10, 1, 'Limbo');
    b.room('r', 1, 1, 8, 8);
    b.spawnEnemy('goat', 4, 4, { patrol: [{ x: 4, z: 4 }, { x: 4, z: 6 }] });
    const level = b.build();

    expect(level.entities).toHaveLength(1);
    expect(level.entities[0].type).toBe('goat');
    expect(level.entities[0].patrol).toHaveLength(2);
  });

  it('places a boss entity', () => {
    const b = new LevelBuilder(20, 20, 1, 'Limbo');
    b.room('boss', 4, 4, 12, 12, { type: 'boss' });
    b.spawnBoss('goat', 10, 10);
    const level = b.build();

    expect(level.entities).toHaveLength(1);
    expect(level.entities[0].type).toBe('goat');
  });

  it('creates a trigger zone', () => {
    const b = new LevelBuilder(20, 20, 1, 'Limbo');
    b.room('r', 2, 2, 10, 10);
    b.trigger('ambush1', { x: 4, z: 4, w: 4, h: 4 }, 'spawnWave', {
      wave: [{ type: 'goat', x: 6, z: 6 }],
      once: true,
    });
    const level = b.build();

    expect(level.triggers).toHaveLength(1);
    expect(level.triggers[0].id).toBe('ambush1');
    expect(level.triggers[0].action).toBe('spawnWave');
  });

  it('creates an environment zone', () => {
    const b = new LevelBuilder(20, 20, 1, 'Limbo');
    b.room('r', 2, 2, 10, 10);
    b.envZone('fog', { x: 2, z: 2, w: 10, h: 10 }, 0.1);
    const level = b.build();

    expect(level.environmentZones).toHaveLength(1);
    expect(level.environmentZones[0].type).toBe('fog');
    expect(level.environmentZones[0].intensity).toBe(0.1);
  });

  it('creates elevated rooms with raised floor cells', () => {
    const b = new LevelBuilder(20, 20, 1, 'Limbo');
    b.room('upper', 4, 4, 6, 6, { elevation: 1 });
    const level = b.build();

    expect(level.grid[6][6]).toBe(MapCell.FLOOR_RAISED);
  });

  it('creates high elevated rooms', () => {
    const b = new LevelBuilder(20, 20, 1, 'Limbo');
    b.room('high', 4, 4, 6, 6, { elevation: 2 });
    const level = b.build();

    expect(level.grid[6][6]).toBe(MapCell.FLOOR_RAISED_HIGH);
  });

  it('places stairs between elevations', () => {
    const b = new LevelBuilder(30, 30, 1, 'Limbo');
    b.room('lower', 2, 2, 6, 6);
    b.room('upper', 2, 12, 6, 6, { elevation: 1 });
    b.stairs(4, 8, 0, 1, 's', 4);
    const level = b.build();

    // Stair cells should be RAMP
    expect(level.grid[9][4]).toBe(MapCell.RAMP);
  });

  it('places a jump pad', () => {
    const b = new LevelBuilder(10, 10, 1, 'Limbo');
    b.room('r', 1, 1, 8, 8);
    b.jumpPad(4, 4);
    const level = b.build();

    expect(level.grid[4][4]).toBe(MapCell.JUMP_PAD);
  });

  it('creates a secret room behind a wall', () => {
    const b = new LevelBuilder(20, 20, 1, 'Limbo');
    b.room('main', 2, 2, 8, 8);
    b.secretRoom(10, 5, 'e');
    const level = b.build();

    // Secret wall at entry point
    expect(level.grid[5][10]).toBe(MapCell.WALL_SECRET);
    // Room behind should be carved
    expect(level.grid[5][12]).toBe(MapCell.EMPTY);
  });

  it('places a door cell', () => {
    const b = new LevelBuilder(10, 10, 1, 'Limbo');
    b.room('r', 1, 1, 8, 8);
    b.door(5, 1);
    const level = b.build();

    expect(level.grid[1][5]).toBe(MapCell.DOOR);
  });

  it('creates lockOnEntry trigger for a room', () => {
    const b = new LevelBuilder(20, 20, 1, 'Limbo');
    b.room('arena', 4, 4, 10, 10, { type: 'arena' });
    b.lockOnEntry('arena');
    const level = b.build();

    const lockTrigger = level.triggers.find(t => t.action === 'lockDoors');
    expect(lockTrigger).toBeDefined();
    expect(lockTrigger!.zone).toEqual({ x: 4, z: 4, w: 10, h: 10 });
  });

  it('sets player spawn', () => {
    const b = new LevelBuilder(10, 10, 1, 'Limbo');
    b.room('start', 2, 2, 4, 4);
    b.setPlayerSpawn(4, 4, Math.PI);
    const level = b.build();

    expect(level.playerSpawn).toEqual({ x: 4, z: 4, facing: Math.PI });
  });

  it('bridge creates a walkable path between two points', () => {
    const b = new LevelBuilder(20, 20, 1, 'Limbo');
    b.bridge(2, 5, 12, 5);
    const level = b.build();

    // All cells along the bridge should be EMPTY
    for (let x = 2; x <= 12; x++) {
      expect(level.grid[5][x]).toBe(MapCell.EMPTY);
    }
  });

  it('creates a lava pool', () => {
    const b = new LevelBuilder(20, 20, 1, 'Limbo');
    b.room('r', 1, 1, 18, 18);
    b.lavaPool(4, 4, 3, 3);
    const level = b.build();

    expect(level.grid[5][5]).toBe(MapCell.FLOOR_LAVA);
  });

  it('sets theme', () => {
    const b = new LevelBuilder(10, 10, 1, 'Limbo');
    b.setTheme({ fogDensity: 0.08, fogColor: '#aabbcc' });
    const level = b.build();

    expect(level.metadata.theme.fogDensity).toBe(0.08);
    expect(level.metadata.theme.fogColor).toBe('#aabbcc');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- --testPathPattern LevelBuilder.test`
Expected: FAIL — module not found

**Step 3: Implement LevelBuilder**

Create `src/game/levels/LevelBuilder.ts`:

```typescript
/**
 * LevelBuilder — fluent API for authoring hand-crafted circle levels.
 *
 * Usage:
 *   const b = new LevelBuilder(30, 40, 1, 'Limbo');
 *   b.room('entrance', 2, 2, 8, 6);
 *   b.corridor('entrance', 'fogHall');
 *   b.spawnEnemy('goat', 10, 5);
 *   const level = b.build();
 */

import type {
  CircleEntity,
  CircleLevel,
  CircleMetadata,
  CircleRoom,
  CircleTheme,
  CircleTrigger,
  EnvironmentZone,
  EnvironmentType,
  RoomType,
  TriggerAction,
} from './CircleLevel';
import { MapCell } from './LevelGenerator';

interface Rect {
  x: number;
  z: number;
  w: number;
  h: number;
}

interface RoomOpts {
  type?: RoomType;
  elevation?: number;
  cell?: MapCell;
}

interface EntityOpts {
  patrol?: { x: number; z: number }[];
  triggerId?: string;
  elevation?: number;
  overrides?: Record<string, number | boolean | string>;
}

interface TriggerOpts {
  wave?: { type: string; x: number; z: number }[];
  once?: boolean;
  text?: string;
  delay?: number;
}

interface EnvOpts {
  direction?: { x: number; z: number };
  timer?: { on: number; off: number };
}

const DEFAULT_THEME: CircleTheme = {
  primaryWall: MapCell.WALL_STONE,
  accentWalls: [MapCell.WALL_STONE],
  fogDensity: 0.03,
  fogColor: '#000000',
  ambientColor: '#444444',
  ambientIntensity: 0.3,
  skyColor: '#1a0808',
};

export class LevelBuilder {
  private grid: number[][];
  private readonly width: number;
  private readonly height: number;
  private readonly circle: number;
  private readonly name: string;

  private rooms: CircleRoom[] = [];
  private roomMap = new Map<string, CircleRoom>();
  private entities: CircleEntity[] = [];
  private triggers: CircleTrigger[] = [];
  private envZones: EnvironmentZone[] = [];
  private theme: CircleTheme = { ...DEFAULT_THEME };
  private meta: Partial<CircleMetadata> = {};
  private spawn: { x: number; z: number; facing: number } = { x: 2, z: 2, facing: 0 };

  constructor(width: number, height: number, circle: number, name: string) {
    this.width = width;
    this.height = height;
    this.circle = circle;
    this.name = name;

    // Fill grid with primary wall
    this.grid = [];
    for (let z = 0; z < height; z++) {
      const row: number[] = [];
      for (let x = 0; x < width; x++) {
        row.push(MapCell.WALL_STONE);
      }
      this.grid.push(row);
    }
  }

  // -----------------------------------------------------------------------
  // Geometry
  // -----------------------------------------------------------------------

  room(name: string, x: number, z: number, w: number, h: number, opts?: RoomOpts): this {
    const elevation = opts?.elevation ?? 0;
    const cellType =
      opts?.cell ??
      (elevation === 2
        ? MapCell.FLOOR_RAISED_HIGH
        : elevation === 1
          ? MapCell.FLOOR_RAISED
          : MapCell.EMPTY);

    // Carve room into grid
    for (let rz = z; rz < z + h && rz < this.height; rz++) {
      for (let rx = x; rx < x + w && rx < this.width; rx++) {
        this.grid[rz][rx] = cellType;
      }
    }

    const room: CircleRoom = {
      name,
      bounds: { x, z, w, h },
      type: opts?.type ?? 'exploration',
      elevation,
    };
    this.rooms.push(room);
    this.roomMap.set(name, room);
    return this;
  }

  corridor(fromRoom: string, toRoom: string, width: number = 2): this {
    const a = this.roomMap.get(fromRoom);
    const b = this.roomMap.get(toRoom);
    if (!a || !b) return this;

    const ax = Math.floor(a.bounds.x + a.bounds.w / 2);
    const az = Math.floor(a.bounds.z + a.bounds.h / 2);
    const bx = Math.floor(b.bounds.x + b.bounds.w / 2);
    const bz = Math.floor(b.bounds.z + b.bounds.h / 2);

    // L-shaped corridor: horizontal then vertical
    for (let x = Math.min(ax, bx); x <= Math.max(ax, bx); x++) {
      for (let w = 0; w < width; w++) {
        const rz = az + w;
        if (rz >= 0 && rz < this.height && x >= 0 && x < this.width) {
          this.grid[rz][x] = MapCell.EMPTY;
        }
      }
    }
    for (let z = Math.min(az, bz); z <= Math.max(az, bz); z++) {
      for (let w = 0; w < width; w++) {
        const rx = bx + w;
        if (z >= 0 && z < this.height && rx >= 0 && rx < this.width) {
          this.grid[z][rx] = MapCell.EMPTY;
        }
      }
    }

    return this;
  }

  stairs(
    x: number,
    z: number,
    _fromElevation: number,
    _toElevation: number,
    direction: 'n' | 's' | 'e' | 'w',
    length: number = 3,
  ): this {
    const dx = direction === 'e' ? 1 : direction === 'w' ? -1 : 0;
    const dz = direction === 's' ? 1 : direction === 'n' ? -1 : 0;

    for (let i = 0; i < length; i++) {
      const rx = x + dx * i;
      const rz = z + dz * i;
      if (rx >= 0 && rx < this.width && rz >= 0 && rz < this.height) {
        this.grid[rz][rx] = MapCell.RAMP;
      }
      // Also carve adjacent cell for 2-wide stairs
      const rx2 = rx + (dz !== 0 ? 1 : 0);
      const rz2 = rz + (dx !== 0 ? 1 : 0);
      if (rx2 >= 0 && rx2 < this.width && rz2 >= 0 && rz2 < this.height) {
        this.grid[rz2][rx2] = MapCell.RAMP;
      }
    }
    return this;
  }

  platform(x: number, z: number, w: number, h: number, elevation: number = 1): this {
    const cell = elevation >= 2 ? MapCell.FLOOR_RAISED_HIGH : MapCell.FLOOR_RAISED;
    for (let rz = z; rz < z + h && rz < this.height; rz++) {
      for (let rx = x; rx < x + w && rx < this.width; rx++) {
        this.grid[rz][rx] = cell;
      }
    }
    return this;
  }

  jumpPad(x: number, z: number): this {
    if (x >= 0 && x < this.width && z >= 0 && z < this.height) {
      this.grid[z][x] = MapCell.JUMP_PAD;
    }
    return this;
  }

  lavaPool(x: number, z: number, w: number, h: number): this {
    for (let rz = z; rz < z + h && rz < this.height; rz++) {
      for (let rx = x; rx < x + w && rx < this.width; rx++) {
        this.grid[rz][rx] = MapCell.FLOOR_LAVA;
      }
    }
    return this;
  }

  waterPool(x: number, z: number, w: number, h: number, deep: boolean = false): this {
    const cell = deep ? MapCell.FLOOR_WATER_DEEP : MapCell.FLOOR_WATER;
    for (let rz = z; rz < z + h && rz < this.height; rz++) {
      for (let rx = x; rx < x + w && rx < this.width; rx++) {
        this.grid[rz][rx] = cell;
      }
    }
    return this;
  }

  secretRoom(wallX: number, wallZ: number, dir: 'n' | 's' | 'e' | 'w', w: number = 3, h: number = 3): this {
    const dx = dir === 'e' ? 1 : dir === 'w' ? -1 : 0;
    const dz = dir === 's' ? 1 : dir === 'n' ? -1 : 0;

    // Place secret wall
    if (wallX >= 0 && wallX < this.width && wallZ >= 0 && wallZ < this.height) {
      this.grid[wallZ][wallX] = MapCell.WALL_SECRET;
    }

    // Carve room behind the wall
    const roomCenterX = wallX + dx * 2;
    const roomCenterZ = wallZ + dz * 2;
    const halfW = Math.floor(w / 2);
    const halfH = Math.floor(h / 2);

    for (let rz = roomCenterZ - halfH; rz <= roomCenterZ + halfH; rz++) {
      for (let rx = roomCenterX - halfW; rx <= roomCenterX + halfW; rx++) {
        if (rx >= 0 && rx < this.width && rz >= 0 && rz < this.height) {
          this.grid[rz][rx] = MapCell.EMPTY;
        }
      }
    }

    // Carve throat between wall and room
    const throatX = wallX + dx;
    const throatZ = wallZ + dz;
    if (throatX >= 0 && throatX < this.width && throatZ >= 0 && throatZ < this.height) {
      this.grid[throatZ][throatX] = MapCell.EMPTY;
    }

    return this;
  }

  door(x: number, z: number): this {
    if (x >= 0 && x < this.width && z >= 0 && z < this.height) {
      this.grid[z][x] = MapCell.DOOR;
    }
    return this;
  }

  bridge(x1: number, z1: number, x2: number, z2: number, width: number = 1): this {
    // Straight line bridge (horizontal or vertical)
    if (z1 === z2) {
      // Horizontal bridge
      for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
        for (let w = 0; w < width; w++) {
          const rz = z1 + w;
          if (x >= 0 && x < this.width && rz >= 0 && rz < this.height) {
            this.grid[rz][x] = MapCell.EMPTY;
          }
        }
      }
    } else if (x1 === x2) {
      // Vertical bridge
      for (let z = Math.min(z1, z2); z <= Math.max(z1, z2); z++) {
        for (let w = 0; w < width; w++) {
          const rx = x1 + w;
          if (rx >= 0 && rx < this.width && z >= 0 && z < this.height) {
            this.grid[z][rx] = MapCell.EMPTY;
          }
        }
      }
    }
    return this;
  }

  // -----------------------------------------------------------------------
  // Entities
  // -----------------------------------------------------------------------

  spawnEnemy(type: string, x: number, z: number, opts?: EntityOpts): this {
    this.entities.push({
      type,
      x,
      z,
      elevation: opts?.elevation,
      patrol: opts?.patrol,
      triggerId: opts?.triggerId,
      overrides: opts?.overrides,
    });
    return this;
  }

  spawnBoss(type: string, x: number, z: number): this {
    this.entities.push({ type, x, z });
    return this;
  }

  spawnPickup(type: string, x: number, z: number, opts?: { weaponId?: string }): this {
    this.entities.push({ type, x, z, overrides: opts?.weaponId ? { weaponId: opts.weaponId } : undefined });
    return this;
  }

  spawnProp(type: string, x: number, z: number, opts?: { rotation?: number }): this {
    this.entities.push({ type, x, z, facing: opts?.rotation });
    return this;
  }

  // -----------------------------------------------------------------------
  // Scripting
  // -----------------------------------------------------------------------

  trigger(id: string, zone: Rect, action: TriggerAction, opts?: TriggerOpts): this {
    this.triggers.push({
      id,
      zone,
      action,
      wave: opts?.wave,
      once: opts?.once ?? true,
      text: opts?.text,
      delay: opts?.delay,
    });
    return this;
  }

  ambush(id: string, zone: Rect, enemies: { type: string; x: number; z: number }[]): this {
    return this.trigger(id, zone, 'spawnWave', { wave: enemies, once: true });
  }

  lockOnEntry(roomName: string): this {
    const room = this.roomMap.get(roomName);
    if (!room) return this;

    this.triggers.push({
      id: `lock-${roomName}`,
      zone: room.bounds,
      action: 'lockDoors',
      once: true,
    });
    return this;
  }

  dialogue(id: string, zone: Rect, text: string): this {
    return this.trigger(id, zone, 'dialogue', { text, once: true });
  }

  // -----------------------------------------------------------------------
  // Environment
  // -----------------------------------------------------------------------

  envZone(type: EnvironmentType, bounds: Rect, intensity: number, opts?: EnvOpts): this {
    this.envZones.push({
      type,
      bounds,
      intensity,
      direction: opts?.direction,
      timer: opts?.timer,
    });
    return this;
  }

  setTheme(theme: Partial<CircleTheme>): this {
    this.theme = { ...this.theme, ...theme };
    return this;
  }

  setMetadata(meta: Partial<CircleMetadata>): this {
    this.meta = { ...this.meta, ...meta };
    return this;
  }

  setPlayerSpawn(x: number, z: number, facing: number = 0): this {
    this.spawn = { x, z, facing };
    return this;
  }

  // -----------------------------------------------------------------------
  // Build
  // -----------------------------------------------------------------------

  build(): CircleLevel {
    return {
      metadata: {
        circle: this.circle,
        name: this.name,
        sin: this.meta.sin ?? '',
        guardian: this.meta.guardian ?? '',
        theme: this.theme,
        music: this.meta.music ?? '',
        ambientSound: this.meta.ambientSound ?? '',
        ...this.meta,
      } as CircleMetadata,
      grid: this.grid,
      width: this.width,
      height: this.height,
      playerSpawn: this.spawn,
      entities: this.entities,
      triggers: this.triggers,
      rooms: this.rooms,
      environmentZones: this.envZones,
    };
  }

  toJSON(): string {
    return JSON.stringify(this.build(), null, 2);
  }
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- --testPathPattern LevelBuilder.test`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/game/levels/LevelBuilder.ts src/game/levels/__tests__/LevelBuilder.test.ts
git commit -m "feat: add LevelBuilder fluent API for authoring circle levels"
```

---

### Task 4: Create CircleLoader (bridge to existing LevelData)

**Files:**
- Create: `src/game/levels/CircleLoader.ts`
- Test: `src/game/levels/__tests__/CircleLoader.test.ts`

**Step 1: Write the failing test**

Create `src/game/levels/__tests__/CircleLoader.test.ts`:

```typescript
import { circleLevelToLevelData } from '../CircleLoader';
import { LevelBuilder } from '../LevelBuilder';
import { CELL_SIZE, MapCell } from '../LevelGenerator';

describe('CircleLoader', () => {
  it('converts CircleLevel to LevelData', () => {
    const b = new LevelBuilder(10, 10, 1, 'Limbo');
    b.room('start', 2, 2, 6, 6);
    b.setPlayerSpawn(5, 5);
    b.spawnEnemy('goat', 7, 7);
    b.spawnPickup('health', 3, 3);
    const circleLevel = b.build();

    const levelData = circleLevelToLevelData(circleLevel);

    expect(levelData.width).toBe(10);
    expect(levelData.depth).toBe(10);
    expect(levelData.floor).toBe(1);
    expect(levelData.grid).toBe(circleLevel.grid);
    expect(levelData.playerSpawn.x).toBe(5 * CELL_SIZE);
    expect(levelData.playerSpawn.z).toBe(5 * CELL_SIZE);
    expect(levelData.spawns).toHaveLength(2); // goat + health
    expect(levelData.spawns[0].type).toBe('goat');
    expect(levelData.spawns[0].x).toBe(7 * CELL_SIZE);
    expect(levelData.spawns[1].type).toBe('health');
  });

  it('converts theme to FloorTheme', () => {
    const b = new LevelBuilder(10, 10, 3, 'Gluttony');
    b.setTheme({
      primaryWall: MapCell.WALL_STONE,
      ambientColor: '#2244cc',
    });
    const circleLevel = b.build();

    const levelData = circleLevelToLevelData(circleLevel);
    expect(levelData.theme.ambientColor).toBe('#2244cc');
    expect(levelData.theme.primaryWall).toBe(MapCell.WALL_STONE);
  });

  it('skips trigger-gated entities (not in spawns until triggered)', () => {
    const b = new LevelBuilder(10, 10, 1, 'Limbo');
    b.room('r', 1, 1, 8, 8);
    b.spawnEnemy('goat', 4, 4); // always spawns
    b.spawnEnemy('goat', 6, 6, { triggerId: 'ambush1' }); // only on trigger
    const circleLevel = b.build();

    const levelData = circleLevelToLevelData(circleLevel);
    // Only non-trigger-gated entities in initial spawns
    expect(levelData.spawns).toHaveLength(1);
    expect(levelData.spawns[0].x).toBe(4 * CELL_SIZE);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- --testPathPattern CircleLoader.test`
Expected: FAIL — module not found

**Step 3: Implement CircleLoader**

Create `src/game/levels/CircleLoader.ts`:

```typescript
/**
 * CircleLoader — converts CircleLevel data to the existing LevelData interface
 * so the rendering pipeline (LevelMeshes, EnemyMesh, DungeonProps) works unchanged.
 */

import type { Vec3 } from '../entities/components';
import { vec3 } from '../entities/vec3';
import type { CircleLevel } from './CircleLevel';
import type { LevelData } from './LevelData';
import type { FloorTheme } from './FloorThemes';
import { CELL_SIZE, MapCell } from './LevelGenerator';

/**
 * Convert a CircleLevel to the existing LevelData interface.
 *
 * - Grid passes through directly (same MapCell[][] format)
 * - Player spawn converts from grid coords to world coords
 * - Entities convert to the spawns array format
 * - Trigger-gated entities are excluded (TriggerSystem handles them at runtime)
 */
export function circleLevelToLevelData(circle: CircleLevel): LevelData {
  const playerSpawn: Vec3 = vec3(
    circle.playerSpawn.x * CELL_SIZE,
    1,
    circle.playerSpawn.z * CELL_SIZE,
  );

  // Convert entities to spawns, excluding trigger-gated ones
  const spawns = circle.entities
    .filter((e) => !e.triggerId)
    .map((e) => ({
      type: e.type,
      x: e.x * CELL_SIZE,
      z: e.z * CELL_SIZE,
      weaponId: e.overrides?.weaponId as string | undefined,
      rotation: e.facing,
    }));

  // Build FloorTheme from CircleTheme
  const theme: FloorTheme = {
    name: circle.metadata.name.toLowerCase().replace(/\s+/g, ''),
    displayName: circle.metadata.name.toUpperCase(),
    primaryWall: circle.metadata.theme.primaryWall,
    accentWalls: circle.metadata.theme.accentWalls,
    enemyTypes: [],
    enemyDensity: 0,
    pickupDensity: 0,
    ambientColor: circle.metadata.theme.ambientColor,
  };

  return {
    width: circle.width,
    depth: circle.height,
    floor: circle.metadata.circle,
    grid: circle.grid as MapCell[][],
    playerSpawn,
    spawns,
    theme,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- --testPathPattern CircleLoader.test`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/game/levels/CircleLoader.ts src/game/levels/__tests__/CircleLoader.test.ts
git commit -m "feat: add CircleLoader bridge from CircleLevel to LevelData"
```

---

### Task 5: Create CircleRegistry

**Files:**
- Create: `src/game/levels/CircleRegistry.ts`
- Test: `src/game/levels/__tests__/CircleRegistry.test.ts`

**Step 1: Write the failing test**

Create `src/game/levels/__tests__/CircleRegistry.test.ts`:

```typescript
import { getCircleLevel, TOTAL_CIRCLES } from '../CircleRegistry';

describe('CircleRegistry', () => {
  it('has 9 circles', () => {
    expect(TOTAL_CIRCLES).toBe(9);
  });

  it('returns a CircleLevel for circle 1', () => {
    const level = getCircleLevel(1);
    expect(level).toBeDefined();
    expect(level.metadata.circle).toBe(1);
    expect(level.metadata.name).toBe('Limbo');
    expect(level.grid.length).toBeGreaterThan(0);
    expect(level.width).toBeGreaterThan(0);
  });

  it('throws for invalid circle number', () => {
    expect(() => getCircleLevel(0)).toThrow();
    expect(() => getCircleLevel(10)).toThrow();
  });

  it('all 9 circles have unique guardians', () => {
    const guardians = new Set<string>();
    for (let i = 1; i <= 9; i++) {
      const level = getCircleLevel(i);
      guardians.add(level.metadata.guardian);
    }
    expect(guardians.size).toBe(9);
  });

  it('all circles have a player spawn', () => {
    for (let i = 1; i <= 9; i++) {
      const level = getCircleLevel(i);
      expect(level.playerSpawn).toBeDefined();
      expect(level.playerSpawn.x).toBeGreaterThan(0);
    }
  });

  it('all circles have at least one boss entity', () => {
    for (let i = 1; i <= 9; i++) {
      const level = getCircleLevel(i);
      const guardian = level.metadata.guardian;
      const bossEntity = level.entities.find(e => e.type === guardian);
      expect(bossEntity).toBeDefined();
    }
  });

  it('all circles have a boss room', () => {
    for (let i = 1; i <= 9; i++) {
      const level = getCircleLevel(i);
      const bossRoom = level.rooms.find(r => r.type === 'boss');
      expect(bossRoom).toBeDefined();
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- --testPathPattern CircleRegistry.test`
Expected: FAIL — module not found

**Step 3: Implement CircleRegistry + placeholder circles**

Create `src/game/levels/CircleRegistry.ts`:

```typescript
/**
 * CircleRegistry — maps circle number (1-9) to CircleLevel data.
 *
 * Each circle is built by a dedicated builder function. Initially these
 * are placeholder levels; they'll be fleshed out with full level design.
 */

import type { CircleLevel } from './CircleLevel';
import { LevelBuilder } from './LevelBuilder';
import { MapCell } from './LevelGenerator';

export const TOTAL_CIRCLES = 9;

/** Circle definitions: [circle, name, sin, guardian, primaryWall, ambientColor] */
const CIRCLE_DEFS: [number, string, string, string, MapCell, string][] = [
  [1, 'Limbo',     'Loss of Heaven',     'goat',       MapCell.WALL_STONE,    '#556677'],
  [2, 'Lust',      'Storm of desire',    'fireGoat',   MapCell.WALL_STONE,    '#cc4466'],
  [3, 'Gluttony',  'Frozen slush',       'hellgoat',   MapCell.WALL_STONE,    '#2266aa'],
  [4, 'Greed',     'Hoarding and waste', 'goatKnight', MapCell.WALL_OBSIDIAN, '#ccaa22'],
  [5, 'Anger',     'Wrath of the Styx',  'shadowGoat', MapCell.WALL_FLESH,    '#991122'],
  [6, 'Heresy',    'Flaming tombs',      'archGoat',   MapCell.WALL_LAVA,     '#cc6622'],
  [7, 'Violence',  'Three rings',        'infernoGoat',MapCell.WALL_LAVA,     '#cc2200'],
  [8, 'Fraud',     'Ten ditches',        'voidGoat',   MapCell.WALL_OBSIDIAN, '#6622aa'],
  [9, 'Treachery', 'Frozen Cocytus',     'ironGoat',   MapCell.WALL_OBSIDIAN, '#aaccee'],
];

const circleCache = new Map<number, CircleLevel>();

export function getCircleLevel(circle: number): CircleLevel {
  if (circle < 1 || circle > TOTAL_CIRCLES) {
    throw new Error(`Invalid circle number: ${circle}. Must be 1-${TOTAL_CIRCLES}.`);
  }

  const cached = circleCache.get(circle);
  if (cached) return cached;

  const level = buildCircle(circle);
  circleCache.set(circle, level);
  return level;
}

/** Clear the cache (useful for testing or hot-reloading levels). */
export function clearCircleCache(): void {
  circleCache.clear();
}

function buildCircle(circle: number): CircleLevel {
  const def = CIRCLE_DEFS[circle - 1];
  const [num, name, sin, guardian, primaryWall, ambientColor] = def;

  const b = new LevelBuilder(35, 45, num, name);

  b.setTheme({
    primaryWall,
    accentWalls: [primaryWall],
    fogDensity: 0.03,
    fogColor: ambientColor,
    ambientColor,
    ambientIntensity: 0.4,
    skyColor: '#1a0808',
  });

  b.setMetadata({
    sin,
    guardian,
    music: `circle-${num}`,
    ambientSound: `ambient-${name.toLowerCase()}`,
  });

  // --- Guaranteed critical path layout ---
  // Entrance
  b.room('entrance', 2, 2, 8, 6);
  b.setPlayerSpawn(6, 5);

  // Exploration zone
  b.corridor('entrance', 'explorationHall');
  b.room('explorationHall', 14, 2, 10, 8, { type: 'exploration' });

  // Encounter arena (mid-level)
  b.room('midArena', 14, 14, 12, 12, { type: 'arena' });
  b.corridor('explorationHall', 'midArena');

  // Place some fodder enemies
  b.spawnEnemy('goat', 17, 5);
  b.spawnEnemy('goat', 20, 7);

  // Platforming section
  b.room('platformZone', 2, 20, 10, 10, { type: 'platforming' });
  b.corridor('midArena', 'platformZone');
  b.platform(4, 22, 3, 3, 1);
  b.stairs(4, 25, 0, 1, 's', 2);

  // Pre-boss corridor
  b.room('bossApproach', 14, 30, 8, 6, { type: 'corridor' });
  b.corridor('platformZone', 'bossApproach');
  b.spawnPickup('health', 18, 32);
  b.spawnPickup('ammo', 16, 32);

  // Boss arena
  b.room('bossArena', 6, 38, 22, 16, { type: 'boss' });
  b.corridor('bossApproach', 'bossArena');
  b.lockOnEntry('bossArena');
  b.spawnBoss(guardian, 17, 46);

  // Props
  b.spawnProp('prop_column', 9, 40);
  b.spawnProp('prop_column', 25, 40);
  b.spawnProp('prop_column', 9, 50);
  b.spawnProp('prop_column', 25, 50);
  b.spawnProp('prop_firebasket', 6, 38);
  b.spawnProp('prop_firebasket', 28, 38);

  // Secret room
  b.secretRoom(1, 6, 'w');
  b.spawnPickup('weaponPickup', -1, 6);

  return b.build();
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- --testPathPattern CircleRegistry.test`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/game/levels/CircleRegistry.ts src/game/levels/__tests__/CircleRegistry.test.ts
git commit -m "feat: add CircleRegistry with placeholder layouts for all 9 circles"
```

---

## Phase 2: Runtime Systems

### Task 6: Create TriggerSystem

**Files:**
- Create: `src/game/systems/TriggerSystem.ts`
- Test: `src/game/systems/__tests__/TriggerSystem.test.ts`

**Step 1: Write the failing test**

Create `src/game/systems/__tests__/TriggerSystem.test.ts`:

```typescript
import type { CircleTrigger } from '../../levels/CircleLevel';
import { CELL_SIZE } from '../../levels/LevelGenerator';
import {
  initTriggerSystem,
  resetTriggerSystem,
  updateTriggerSystem,
} from '../TriggerSystem';

describe('TriggerSystem', () => {
  beforeEach(() => {
    resetTriggerSystem();
  });

  it('fires a trigger when player enters the zone', () => {
    const fired: string[] = [];
    const triggers: CircleTrigger[] = [
      {
        id: 'test1',
        zone: { x: 4, z: 4, w: 4, h: 4 },
        action: 'spawnWave',
        wave: [{ type: 'goat', x: 6, z: 6 }],
        once: true,
      },
    ];

    initTriggerSystem(triggers, (trigger) => {
      fired.push(trigger.id);
    });

    // Player outside zone
    updateTriggerSystem({ x: 2 * CELL_SIZE, y: 1, z: 2 * CELL_SIZE });
    expect(fired).toHaveLength(0);

    // Player enters zone
    updateTriggerSystem({ x: 5 * CELL_SIZE, y: 1, z: 5 * CELL_SIZE });
    expect(fired).toHaveLength(1);
    expect(fired[0]).toBe('test1');
  });

  it('once=true triggers only fire once', () => {
    let count = 0;
    const triggers: CircleTrigger[] = [
      {
        id: 'once-trigger',
        zone: { x: 0, z: 0, w: 10, h: 10 },
        action: 'dialogue',
        text: 'Hello',
        once: true,
      },
    ];

    initTriggerSystem(triggers, () => { count++; });

    updateTriggerSystem({ x: 5 * CELL_SIZE, y: 1, z: 5 * CELL_SIZE });
    updateTriggerSystem({ x: 5 * CELL_SIZE, y: 1, z: 5 * CELL_SIZE });
    updateTriggerSystem({ x: 5 * CELL_SIZE, y: 1, z: 5 * CELL_SIZE });

    expect(count).toBe(1);
  });

  it('once=false triggers can fire multiple times', () => {
    let count = 0;
    const triggers: CircleTrigger[] = [
      {
        id: 'repeat',
        zone: { x: 0, z: 0, w: 10, h: 10 },
        action: 'dialogue',
        text: 'Again',
        once: false,
      },
    ];

    initTriggerSystem(triggers, () => { count++; });

    // Enter
    updateTriggerSystem({ x: 5 * CELL_SIZE, y: 1, z: 5 * CELL_SIZE });
    expect(count).toBe(1);

    // Leave
    updateTriggerSystem({ x: 20 * CELL_SIZE, y: 1, z: 20 * CELL_SIZE });
    // Re-enter
    updateTriggerSystem({ x: 5 * CELL_SIZE, y: 1, z: 5 * CELL_SIZE });
    expect(count).toBe(2);
  });

  it('reset clears all trigger state', () => {
    let count = 0;
    const triggers: CircleTrigger[] = [
      {
        id: 'reset-test',
        zone: { x: 0, z: 0, w: 10, h: 10 },
        action: 'dialogue',
        once: true,
      },
    ];

    initTriggerSystem(triggers, () => { count++; });
    updateTriggerSystem({ x: 5 * CELL_SIZE, y: 1, z: 5 * CELL_SIZE });
    expect(count).toBe(1);

    resetTriggerSystem();
    initTriggerSystem(triggers, () => { count++; });
    updateTriggerSystem({ x: 5 * CELL_SIZE, y: 1, z: 5 * CELL_SIZE });
    expect(count).toBe(2); // fires again after reset
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- --testPathPattern TriggerSystem.test`
Expected: FAIL — module not found

**Step 3: Implement TriggerSystem**

Create `src/game/systems/TriggerSystem.ts`:

```typescript
/**
 * TriggerSystem — checks player position against trigger zones each frame.
 *
 * Fires a callback when the player enters a zone. Supports one-shot triggers
 * (fire once) and repeatable triggers (fire each time player re-enters after leaving).
 */

import type { Vec3 } from '../entities/components';
import type { CircleTrigger } from '../levels/CircleLevel';
import { CELL_SIZE } from '../levels/LevelGenerator';

type TriggerCallback = (trigger: CircleTrigger) => void;

interface TriggerState {
  fired: boolean;
  inside: boolean;
}

let triggers: CircleTrigger[] = [];
let triggerStates: Map<string, TriggerState> = new Map();
let callback: TriggerCallback = () => {};

export function initTriggerSystem(
  circleTriggers: CircleTrigger[],
  onTrigger: TriggerCallback,
): void {
  triggers = circleTriggers;
  callback = onTrigger;
  triggerStates = new Map();

  for (const t of triggers) {
    triggerStates.set(t.id, { fired: false, inside: false });
  }
}

export function resetTriggerSystem(): void {
  triggers = [];
  triggerStates = new Map();
  callback = () => {};
}

export function updateTriggerSystem(playerPos: Vec3): void {
  // Convert world position to grid coords
  const px = playerPos.x / CELL_SIZE;
  const pz = playerPos.z / CELL_SIZE;

  for (const trigger of triggers) {
    const state = triggerStates.get(trigger.id);
    if (!state) continue;

    const inZone =
      px >= trigger.zone.x &&
      px < trigger.zone.x + trigger.zone.w &&
      pz >= trigger.zone.z &&
      pz < trigger.zone.z + trigger.zone.h;

    if (inZone && !state.inside) {
      // Player just entered the zone
      state.inside = true;

      if (trigger.once && state.fired) continue;

      state.fired = true;
      callback(trigger);
    } else if (!inZone && state.inside) {
      // Player just left the zone
      state.inside = false;
    }
  }
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- --testPathPattern TriggerSystem.test`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/game/systems/TriggerSystem.ts src/game/systems/__tests__/TriggerSystem.test.ts
git commit -m "feat: add TriggerSystem for zone-based scripted encounters"
```

---

### Task 7: Create EnvironmentZoneSystem

**Files:**
- Create: `src/game/systems/EnvironmentZoneSystem.ts`
- Test: `src/game/systems/__tests__/EnvironmentZoneSystem.test.ts`

**Step 1: Write the failing test**

Create `src/game/systems/__tests__/EnvironmentZoneSystem.test.ts`:

```typescript
import type { EnvironmentZone } from '../../levels/CircleLevel';
import { CELL_SIZE } from '../../levels/LevelGenerator';
import {
  getActiveEffects,
  initEnvironmentZones,
  resetEnvironmentZones,
  updateEnvironmentZones,
} from '../EnvironmentZoneSystem';

describe('EnvironmentZoneSystem', () => {
  beforeEach(() => {
    resetEnvironmentZones();
  });

  it('returns empty effects when player is outside all zones', () => {
    const zones: EnvironmentZone[] = [
      { type: 'fog', bounds: { x: 10, z: 10, w: 5, h: 5 }, intensity: 0.1 },
    ];
    initEnvironmentZones(zones);
    updateEnvironmentZones({ x: 2 * CELL_SIZE, y: 1, z: 2 * CELL_SIZE });

    const effects = getActiveEffects();
    expect(effects).toHaveLength(0);
  });

  it('returns fog effect when player is inside fog zone', () => {
    const zones: EnvironmentZone[] = [
      { type: 'fog', bounds: { x: 0, z: 0, w: 20, h: 20 }, intensity: 0.08 },
    ];
    initEnvironmentZones(zones);
    updateEnvironmentZones({ x: 5 * CELL_SIZE, y: 1, z: 5 * CELL_SIZE });

    const effects = getActiveEffects();
    expect(effects).toHaveLength(1);
    expect(effects[0].type).toBe('fog');
    expect(effects[0].intensity).toBe(0.08);
  });

  it('returns wind effect with direction', () => {
    const zones: EnvironmentZone[] = [
      {
        type: 'wind',
        bounds: { x: 0, z: 0, w: 30, h: 30 },
        intensity: 0.5,
        direction: { x: 1, z: 0 },
      },
    ];
    initEnvironmentZones(zones);
    updateEnvironmentZones({ x: 10 * CELL_SIZE, y: 1, z: 10 * CELL_SIZE });

    const effects = getActiveEffects();
    expect(effects).toHaveLength(1);
    expect(effects[0].type).toBe('wind');
    expect(effects[0].direction?.x).toBe(1);
  });

  it('supports multiple overlapping zones', () => {
    const zones: EnvironmentZone[] = [
      { type: 'fog', bounds: { x: 0, z: 0, w: 20, h: 20 }, intensity: 0.05 },
      { type: 'ice', bounds: { x: 0, z: 0, w: 20, h: 20 }, intensity: 0.8 },
    ];
    initEnvironmentZones(zones);
    updateEnvironmentZones({ x: 5 * CELL_SIZE, y: 1, z: 5 * CELL_SIZE });

    const effects = getActiveEffects();
    expect(effects).toHaveLength(2);
  });

  it('calculates movement modifier for ice zones', () => {
    const zones: EnvironmentZone[] = [
      { type: 'ice', bounds: { x: 0, z: 0, w: 20, h: 20 }, intensity: 0.8 },
    ];
    initEnvironmentZones(zones);
    updateEnvironmentZones({ x: 5 * CELL_SIZE, y: 1, z: 5 * CELL_SIZE });

    const effects = getActiveEffects();
    // Ice should provide a movement modifier
    expect(effects[0].movementMod).toBeDefined();
    expect(effects[0].movementMod!.friction).toBeLessThan(1);
  });

  it('calculates movement slow for water zones', () => {
    const zones: EnvironmentZone[] = [
      { type: 'water', bounds: { x: 0, z: 0, w: 20, h: 20 }, intensity: 0.5 },
    ];
    initEnvironmentZones(zones);
    updateEnvironmentZones({ x: 5 * CELL_SIZE, y: 1, z: 5 * CELL_SIZE });

    const effects = getActiveEffects();
    expect(effects[0].movementMod).toBeDefined();
    expect(effects[0].movementMod!.speedMult).toBeLessThan(1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- --testPathPattern EnvironmentZoneSystem.test`
Expected: FAIL — module not found

**Step 3: Implement EnvironmentZoneSystem**

Create `src/game/systems/EnvironmentZoneSystem.ts`:

```typescript
/**
 * EnvironmentZoneSystem — tracks which environment zones the player is in
 * and computes active effects (movement modifiers, visual changes, DoT).
 */

import type { Vec3 } from '../entities/components';
import type { EnvironmentZone, EnvironmentType } from '../levels/CircleLevel';
import { CELL_SIZE } from '../levels/LevelGenerator';

export interface ActiveEffect {
  type: EnvironmentType;
  intensity: number;
  direction?: { x: number; z: number };
  movementMod?: {
    speedMult?: number;
    friction?: number;
    windForce?: { x: number; z: number };
  };
  damagePerSecond?: number;
}

let zones: EnvironmentZone[] = [];
let activeEffects: ActiveEffect[] = [];

export function initEnvironmentZones(envZones: EnvironmentZone[]): void {
  zones = envZones;
  activeEffects = [];
}

export function resetEnvironmentZones(): void {
  zones = [];
  activeEffects = [];
}

export function updateEnvironmentZones(playerPos: Vec3): void {
  const px = playerPos.x / CELL_SIZE;
  const pz = playerPos.z / CELL_SIZE;
  activeEffects = [];

  for (const zone of zones) {
    const inZone =
      px >= zone.bounds.x &&
      px < zone.bounds.x + zone.bounds.w &&
      pz >= zone.bounds.z &&
      pz < zone.bounds.z + zone.bounds.h;

    if (!inZone) continue;

    const effect = computeEffect(zone);
    activeEffects.push(effect);
  }
}

export function getActiveEffects(): ActiveEffect[] {
  return activeEffects;
}

function computeEffect(zone: EnvironmentZone): ActiveEffect {
  const effect: ActiveEffect = {
    type: zone.type,
    intensity: zone.intensity,
    direction: zone.direction,
  };

  switch (zone.type) {
    case 'ice':
    case 'frost':
      effect.movementMod = {
        friction: 0.15 * (1 - zone.intensity), // Lower intensity = more slippery
      };
      if (zone.type === 'frost') {
        effect.damagePerSecond = 2 * zone.intensity;
      }
      break;

    case 'water':
      effect.movementMod = {
        speedMult: 1 - 0.5 * zone.intensity, // 50% slow at full intensity
      };
      break;

    case 'wind':
      if (zone.direction) {
        effect.movementMod = {
          windForce: {
            x: zone.direction.x * zone.intensity * 5,
            z: zone.direction.z * zone.intensity * 5,
          },
        };
      }
      break;

    case 'blood':
      effect.damagePerSecond = 3 * zone.intensity;
      effect.movementMod = { speedMult: 0.8 };
      break;

    case 'fire':
      effect.damagePerSecond = 5 * zone.intensity;
      break;

    case 'fog':
    case 'illusion':
    case 'void':
    case 'crushing':
      // These are primarily visual/logic effects, handled by rendering
      break;
  }

  return effect;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- --testPathPattern EnvironmentZoneSystem.test`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/game/systems/EnvironmentZoneSystem.ts src/game/systems/__tests__/EnvironmentZoneSystem.test.ts
git commit -m "feat: add EnvironmentZoneSystem for circle-specific area effects"
```

---

## Phase 3: Integration + First Playable Circle

### Task 8: Wire CircleLevel into R3FRoot game loop

**Files:**
- Modify: `src/R3FRoot.tsx` — add circle level loading path
- Modify: `src/state/GameStore.ts` — add circle-based progression

This task integrates the circle system into the existing game loop. The key change is:
- `GameStore.stage` gains a `useCircles: boolean` flag
- When `useCircles` is true, `R3FRoot` loads from `CircleRegistry` instead of `LevelGenerator`
- The existing rendering pipeline works unchanged since `CircleLoader` produces `LevelData`

**Step 1: Add circle progression to GameStore**

In `src/state/GameStore.ts`, add to the `Stage` interface:

```typescript
interface Stage {
  // ... existing fields
  /** When true, use hand-crafted circle levels instead of procedural gen. */
  useCircles?: boolean;
  /** Current circle number (1-9) when useCircles is true. */
  circleNumber?: number;
}
```

Update `startNewGame()` to set `useCircles: true, circleNumber: 1`.

Update `advanceStage()`: when `useCircles` is true, increment `circleNumber` instead of using the old explore/arena/boss cycle. Victory at circle 9 = game complete.

**Step 2: Add circle loading path in R3FRoot**

In `src/R3FRoot.tsx`, in the level generation section, add:

```typescript
import { getCircleLevel } from './game/levels/CircleRegistry';
import { circleLevelToLevelData } from './game/levels/CircleLoader';
import { initTriggerSystem } from './game/systems/TriggerSystem';
import { initEnvironmentZones } from './game/systems/EnvironmentZoneSystem';

// In the level generation function:
if (stage.useCircles && stage.circleNumber) {
  const circleLevel = getCircleLevel(stage.circleNumber);
  levelData = circleLevelToLevelData(circleLevel);
  initTriggerSystem(circleLevel.triggers, handleTrigger);
  initEnvironmentZones(circleLevel.environmentZones);
} else {
  // Existing procedural generation path (kept as fallback)
  const gen = new LevelGenerator(24, 24, stage.floor);
  gen.generate();
  levelData = { ... };
}
```

**Step 3: Add trigger handler**

```typescript
function handleTrigger(trigger: CircleTrigger): void {
  switch (trigger.action) {
    case 'spawnWave':
      if (trigger.wave) {
        for (const spawn of trigger.wave) {
          // Use existing EntitySpawner logic
          spawnEnemyEntity(spawn.type, spawn.x, spawn.z);
        }
      }
      break;
    case 'lockDoors':
      // Lock all DOOR cells in the trigger zone
      lockDoorsInZone(trigger.zone);
      break;
    case 'unlockDoors':
      unlockDoorsInZone(trigger.zone);
      break;
    case 'dialogue':
      if (trigger.text) {
        useGameStore.getState().setDialogueText(trigger.text);
      }
      break;
    case 'bossIntro':
      // Could show boss name, play intro sound, etc.
      break;
  }
}
```

**Step 4: Add TriggerSystem update to game loop**

In the per-frame update (R3FRoot's `useFrame` or system update), add:

```typescript
import { updateTriggerSystem } from './game/systems/TriggerSystem';
import { updateEnvironmentZones } from './game/systems/EnvironmentZoneSystem';

// In game loop:
const player = world.entities.find(e => e.type === 'player');
if (player?.position) {
  updateTriggerSystem(player.position);
  updateEnvironmentZones(player.position);
}
```

**Step 5: Test manually**

Run: `npx expo start --web --port 8085`
- Click "New Game" — should load Circle 1: Limbo
- Verify: level renders, enemies appear, boss is in boss arena
- Console should show: `[CircleLoader] Loading Circle 1: Limbo`

**Step 6: Commit**

```bash
git add src/R3FRoot.tsx src/state/GameStore.ts
git commit -m "feat: wire circle levels into game loop with trigger + env zone systems"
```

---

### Task 9: Author Circle 1 — Limbo (full level design)

**Files:**
- Create: `src/game/levels/circles/circle1-limbo.ts`
- Modify: `src/game/levels/CircleRegistry.ts` — import and use circle1 builder

This is where the creative level design happens. Circle 1: Limbo is the tutorial/intro circle — it introduces the player to the game mechanics while establishing the fog-and-sorrow atmosphere.

**Level layout (35×50 grid):**

```
[Entrance Hall] → [Fog Corridor] → [Fog Crossroads] ──→ [Ambush Room]
                                          │                    │
                                          ↓                    ↓
                                    [Platform Garden]    [Secret Cache]
                                          │
                                          ↓
                                    [Descent Stairs]
                                          │
                                          ↓
                                    [Pre-Boss Gallery]
                                          │
                                          ↓
                                    ═══ BOSS ARENA ═══
                                    (Guardian of Limbo)
```

Write the full `buildCircle1Limbo()` function using LevelBuilder with:
- 8+ rooms connected by corridors/stairs
- Fog environment zones in 3 areas
- 2 ambush triggers
- 6-8 patrol enemies
- 1 boss entity with lock-on-entry
- 2 secret rooms with loot
- 1 platforming section with raised/high platforms + stairs
- Props: columns, candles, coffins for atmosphere
- Health/ammo pickups strategically placed before boss

**Step 1: Create the circle1 file and implement**

Create `src/game/levels/circles/circle1-limbo.ts` with the full level design.

**Step 2: Update CircleRegistry to use it**

In `CircleRegistry.ts`, import and call `buildCircle1Limbo()` for circle 1 instead of the placeholder.

**Step 3: Test by playing**

Run: `npx expo start --web --port 8085`
- Verify: fog zones visible
- Verify: enemies on patrol routes
- Verify: ambush triggers fire when entering zones
- Verify: boss arena locks doors
- Verify: platforming sections reachable
- Verify: secrets discoverable

**Step 4: Commit**

```bash
git add src/game/levels/circles/circle1-limbo.ts src/game/levels/CircleRegistry.ts
git commit -m "feat: author Circle 1 — Limbo, full hand-crafted level"
```

---

### Task 10: Author Circles 2-9 (remaining levels)

Each circle follows the same pattern as Task 9 but with unique layouts, environmental mechanics, and boss arena designs. Each circle file should be 100-200 lines using the LevelBuilder API.

Create one file per circle:
- `src/game/levels/circles/circle2-lust.ts` — Storm-swept, wind zones, open areas
- `src/game/levels/circles/circle3-gluttony.ts` — Ice/slush floors, precision platforming
- `src/game/levels/circles/circle4-greed.ts` — Gold walls, crushing zones, trap treasures
- `src/game/levels/circles/circle5-anger.ts` — Dark water, River Styx, narrow bridges
- `src/game/levels/circles/circle6-heresy.ts` — Flame traps, tomb corridors, fire zones
- `src/game/levels/circles/circle7-violence.ts` — Three sub-zones (blood, vines, fire)
- `src/game/levels/circles/circle8-fraud.ts` — Illusion walls/floors, maze-like
- `src/game/levels/circles/circle9-treachery.ts` — Frozen Cocytus, ice platforms, frost zones

Each circle gets progressively harder with:
- More enemies
- More environmental hazards
- More complex platforming
- Tougher boss fights

---

## Phase 4: Boss Upgrades + New Enemies

### Task 11: Upgrade goat boss abilities for circle themes

Modify `src/game/systems/AISystem.ts` to add circle-themed phase transitions for each of the 9 guardian goats. Each boss gets a Phase 2 (and some get Phase 3) with new attacks matching their sin:

- `goat` → fog clones at 50% HP
- `fireGoat` → tornado pull at 50% HP
- `hellgoat` → bloat + slam + vomit at 50% HP
- `goatKnight` → gold boulders + summon golems at 50% HP
- `shadowGoat` → permanent berserk + arena flood at 50% HP
- `archGoat` → tombs open + flame spirits at 50% HP (already has partial abilities)
- `infernoGoat` → 3-phase matching violence rings (already has partial abilities)
- `voidGoat` → arena shifts + wall manipulation at 50% HP (already has partial abilities)
- `ironGoat` → ice shatter + expanded arena at 50% HP (already has partial abilities)

### Task 12: Add circle-themed fodder enemy types

Add the 20 new entity types from the design doc to:
- `src/game/entities/components.ts` — extend `EntityType` union
- `src/game/entities/enemyStats.ts` — add stats for each new type
- `src/game/systems/AISystem.ts` — add AI behaviors
- `src/r3f/entities/EnemyMesh.tsx` — add visual configs (fallback capsules initially)

---

## Phase 5: Polish

### Task 13: Add new floor rendering for circle-specific tiles

Modify `src/r3f/level/Materials.ts` to add materials for:
- Ice floors (reflective, blue-white)
- Water floors (animated, dark blue)
- Blood floors (glossy red)
- Frost floors (translucent, crystalline)
- Illusion walls (slightly transparent shimmer)
- Gold walls (metallic, warm)

Modify `src/r3f/level/LevelMeshes.tsx` to render the new cell types.

### Task 14: Add environment zone visual effects

Create `src/r3f/rendering/EnvironmentEffects.tsx`:
- Fog zones: increase scene fog density dynamically
- Wind zones: particle effect (directional wind particles)
- Ice zones: floor shimmer/reflection
- Fire zones: ember particles + heat distortion
- Water zones: surface ripple shader

### Task 15: Update game progression UI

Modify `src/ui/` screens:
- `VictoryScreen` → shows "Circle N: [Name] Complete" instead of "Floor N"
- `MainMenu` → shows circle select (for replay)
- `HUD` → shows current circle name

---

## Verification

After all phases:

1. `pnpm test` — all tests pass (existing + new)
2. `npx tsc --noEmit` — no TypeScript errors
3. Each of the 9 circles loads and renders correctly
4. Critical path completable in every circle (entrance → boss → victory)
5. Environmental mechanics work (ice slippery, wind pushes, water slows)
6. Trigger zones fire correctly (ambushes, door locks, boss intros)
7. All 9 guardian goat boss fights have phase transitions
8. Platforming sections are playable (jump across gaps, climb platforms)
9. Secrets are discoverable but optional
10. AI governor can complete at least Circle 1 via `?autoplay`
11. 60fps on web with full circle level loaded
12. `npx expo export --platform web` builds without errors
