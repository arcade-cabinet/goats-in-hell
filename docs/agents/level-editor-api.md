---
title: "Level Editor API Reference"
status: implemented
created: "2026-03-01"
updated: "2026-03-01"
domain: agents
related:
  - docs/agents/circle-building-guide.md
  - docs/circles/01-limbo.md
---

# Level Editor API Reference

> **For AI agents building circle levels.** This document is self-contained. You do not need to read any other file to use the LevelEditor API.

**Source files:** `src/db/LevelEditor.ts`, `src/db/schema.ts`, `src/constants.ts`

---

## 1. Quick Start

Complete example building a minimal playable level from scratch:

```typescript
import BetterSqlite3 from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../db/schema';
import { migrateAndSeed } from '../db/migrate';
import {
  LevelEditor,
  MapCell,
  ROOM_TYPES,
  CONNECTION_TYPES,
  ENEMY_TYPES,
  PICKUP_TYPES,
  TRIGGER_ACTIONS,
  ENV_TYPES,
} from '../db/LevelEditor';

// --- DB setup ---
const sqliteDb = new BetterSqlite3(':memory:'); // or a file path
const db = drizzle(sqliteDb, { schema });
await migrateAndSeed(db);

const editor = new LevelEditor(db);

// --- Theme ---
const THEME_ID = 'circle-1-limbo';
editor.createTheme(THEME_ID, {
  name: 'limbo',
  displayName: 'LIMBO',
  primaryWall: MapCell.WALL_STONE,
  accentWalls: [MapCell.WALL_STONE],
  ambientColor: '#2233aa',
  ambientIntensity: 0.15,
  fogDensity: 0.08,
  fogColor: '#0d0d1a',
  skyColor: '#000000',
  enemyTypes: ['hellgoat'],
});

// --- Level ---
const LEVEL_ID = 'circle-1-limbo';
editor.createLevel(LEVEL_ID, {
  name: 'Limbo',
  levelType: 'circle',
  width: 40,
  depth: 40,
  floor: 1,
  themeId: THEME_ID,
  circleNumber: 1,
  sin: 'ignorance',
  guardian: 'Il Vecchio',
});

// --- Rooms ---
const vestibule = editor.room(LEVEL_ID, 'vestibule', 16, 2, 8, 6);
const fogHall = editor.room(LEVEL_ID, 'fog_hall', 14, 12, 12, 10);
const arena = editor.room(LEVEL_ID, 'columns', 14, 26, 12, 10, {
  roomType: ROOM_TYPES.ARENA,
});

// --- Connections ---
editor.corridor(LEVEL_ID, vestibule, fogHall, 3);
editor.corridor(LEVEL_ID, fogHall, arena, 3);

// --- Entities ---
editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 18, 15, { roomId: fogHall });
editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 22, 18, { roomId: fogHall });
editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 17, 4);
editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 23, 4);

// --- Arena lock/wave/unlock ---
editor.setupArenaWaves(
  LEVEL_ID,
  arena,
  { x: 15, z: 27, w: 10, h: 8 },
  [
    // Wave 1
    [
      { type: ENEMY_TYPES.HELLGOAT, x: 16, z: 28 },
      { type: ENEMY_TYPES.HELLGOAT, x: 20, z: 30 },
      { type: ENEMY_TYPES.HELLGOAT, x: 24, z: 28 },
    ],
    // Wave 2
    [
      { type: ENEMY_TYPES.HELLGOAT, x: 16, z: 32 },
      { type: ENEMY_TYPES.HELLGOAT, x: 20, z: 28 },
      { type: ENEMY_TYPES.HELLGOAT, x: 24, z: 32 },
    ],
  ],
);

// --- Player spawn ---
editor.setPlayerSpawn(LEVEL_ID, 20, 5, Math.PI); // center of vestibule, facing south

// --- Compile grid ---
editor.compile(LEVEL_ID);

// --- Validate ---
const result = editor.validate(LEVEL_ID);
if (!result.valid) {
  console.error('ERRORS:', result.errors);
}
if (result.warnings.length > 0) {
  console.warn('WARNINGS:', result.warnings);
}
```

---

## 2. Coordinate System

### Grid coordinates (what you use in the API)

- **All API methods accept GRID coordinates.** Never pass world coordinates.
- 1 grid cell = 2 world units (`CELL_SIZE = 2`)
- `WALL_HEIGHT = 3` world units
- **x** increases **eastward** (left to right)
- **z** increases **southward** (top to bottom)
- Origin `(0, 0)` is the **top-left** corner of the level

### Room bounds

- `(x, z)` is the **top-left corner** of the room
- `(w, h)` is the **width** (x-axis) and **height/depth** (z-axis)
- The room occupies cells from `(x, z)` to `(x + w - 1, z + h - 1)` inclusive
- The room extends to `(x + w, z + h)` exclusive

### Room center

The compiler calculates room center as:
```
centerX = boundsX + floor(boundsW / 2)
centerZ = boundsZ + floor(boundsH / 2)
```
Corridors connect room centers via L-shaped paths.

### Spawn and entity positions

- Entity positions must be **inside the level bounds**: `x` in `[0, width-1]`, `z` in `[0, depth-1]`
- Player spawn must be **inside a room's bounds** to pass validation
- "Inside room" means: `x >= boundsX && x < boundsX + boundsW && z >= boundsZ && z < boundsZ + boundsH`

### World coordinate conversion (at runtime, NOT in editor)

The `LevelDbAdapter.toLevelData()` converts spawn positions:
```
worldX = gridX * CELL_SIZE   (i.e., gridX * 2)
worldZ = gridZ * CELL_SIZE   (i.e., gridZ * 2)
worldY = 1                   (constant)
```

---

## 3. MapCell Reference

These are the cell types used by `primaryWall`, `wallCell`, `floorCell`, and `accentWalls`.

| Value | Name | Category | Walkable | Solid | Damage/s | Speed | Destructible | Description |
|-------|------|----------|----------|-------|----------|-------|--------------|-------------|
| 0 | `EMPTY` | floor | Yes | No | 0 | 1.0x | No | Standard walkable floor |
| 1 | `WALL_STONE` | wall | No | Yes | 0 | 0x | No | Default stone wall |
| 2 | `WALL_FLESH` | wall | No | Yes | 0 | 0x | No | Organic fleshy wall |
| 3 | `WALL_LAVA` | wall | No | Yes | 0 | 0x | No | Volcanic lava-glow wall |
| 4 | `WALL_OBSIDIAN` | wall | No | Yes | 0 | 0x | No | Dark volcanic glass wall |
| 5 | `DOOR` | door | Yes | No | 0 | 0.8x | No | Door cell (DoorSystem handles locking) |
| 6 | `FLOOR_LAVA` | hazard | Yes | No | 15 | 0.6x | No | Lava floor, deals 15 DPS |
| 7 | `FLOOR_RAISED` | platform | Yes | No | 0 | 1.0x | No | Elevated platform (2 world units high) |
| 8 | `RAMP` | ramp | Yes | No | 0 | 0.85x | No | Connects ground level to raised platform |
| 9 | `WALL_SECRET` | special | No | Yes | 0 | 0x | Yes | Looks like wall, can be opened/destroyed |
| 10 | `FLOOR_VOID` | hazard | Yes | No | 9999 | 1.0x | No | Void pit, effectively instant death |

Access via: `MapCell.WALL_STONE`, `MapCell.FLOOR_LAVA`, etc.

---

## 4. Exported Constants Reference

Import all from `LevelEditor.ts`:
```typescript
import {
  LevelEditor,
  MapCell,
  TRIGGER_ACTIONS,
  ROOM_TYPES,
  CONNECTION_TYPES,
  ENV_TYPES,
  SPAWN_CATEGORIES,
  ENEMY_TYPES,
  PICKUP_TYPES,
} from '../db/LevelEditor';
```

### TRIGGER_ACTIONS

| Key | Value | Description |
|-----|-------|-------------|
| `SPAWN_WAVE` | `'spawnWave'` | Spawn a group of enemies |
| `LOCK_DOORS` | `'lockDoors'` | Lock all doors in the room |
| `UNLOCK_DOORS` | `'unlockDoors'` | Unlock doors (usually condition: allEnemiesKilled) |
| `DIALOGUE` | `'dialogue'` | Show dialogue/lore text |
| `AMBIENT_CHANGE` | `'ambientChange'` | Change ambient lighting/fog |
| `BOSS_INTRO` | `'bossIntro'` | Boss intro cinematic text |
| `SECRET_REVEAL` | `'secretReveal'` | Reveal a secret area |
| `PLATFORM_MOVE` | `'platformMove'` | Move a platform |

### ROOM_TYPES

| Key | Value | Description |
|-----|-------|-------------|
| `EXPLORATION` | `'exploration'` | Standard exploration room (default) |
| `ARENA` | `'arena'` | Combat arena with waves |
| `BOSS` | `'boss'` | Boss encounter room |
| `SECRET` | `'secret'` | Hidden room behind secret wall |
| `HUB` | `'hub'` | Central hub connecting multiple paths |
| `PLATFORMING` | `'platforming'` | Platforming challenge room |
| `CORRIDOR` | `'corridor'` | Narrow connecting passage |
| `PUZZLE` | `'puzzle'` | Puzzle-based room |

### CONNECTION_TYPES

| Key | Value | Grid Effect | Description |
|-----|-------|-------------|-------------|
| `CORRIDOR` | `'corridor'` | Carves L-shaped 2-wide EMPTY path | Standard walkable corridor |
| `DOOR` | `'door'` | Carves corridor + places DOOR cell at midpoint | Doorway between rooms |
| `STAIRS` | `'stairs'` | Carves corridor + places 3x3 RAMP at L-bend | Elevation change |
| `PORTAL` | `'portal'` | (no grid carving) | Teleport connection |
| `SECRET` | `'secret'` | Places WALL_SECRET cell at midpoint | Hidden passageway |
| `BRIDGE` | `'bridge'` | Carves L-shaped FLOOR_RAISED path | Elevated bridge |
| `JUMP_PAD` | `'jump_pad'` | Places EMPTY cell at midpoint | Launch point |

### ENV_TYPES

| Key | Value | Description |
|-----|-------|-------------|
| `WIND` | `'wind'` | Wind that pushes the player (use directionX/Z) |
| `ICE` | `'ice'` | Slippery surface, reduced friction |
| `WATER` | `'water'` | Shallow water, slowed movement |
| `FIRE` | `'fire'` | Fire geyser/hazard zone |
| `FOG` | `'fog'` | Dense fog, reduced visibility |
| `FROST` | `'frost'` | Freezing effect |
| `VOID` | `'void'` | Void area (visual + gameplay) |
| `BLOOD` | `'blood'` | Blood pool area |
| `ILLUSION` | `'illusion'` | Visual illusion zone |
| `CRUSHING` | `'crushing'` | Crushing walls/ceiling trap |

### SPAWN_CATEGORIES

| Key | Value | Description |
|-----|-------|-------------|
| `ENEMY` | `'enemy'` | Regular enemy entity |
| `PICKUP` | `'pickup'` | Health, ammo, weapon pickup |
| `PROP` | `'prop'` | Decorative prop (torch, barrel, etc.) |
| `HAZARD` | `'hazard'` | Environmental hazard entity |
| `BOSS` | `'boss'` | Boss entity (affects AI governor behavior) |

### ENEMY_TYPES

| Key | Value | Description |
|-----|-------|-------------|
| `HELLGOAT` | `'hellgoat'` | Standard melee goatman (10 HP) |
| `FIRE_GOAT` | `'fireGoat'` | Ranged fire-shooting goat (8 HP) |
| `SHADOW_GOAT` | `'shadowGoat'` | Invisible until close, glass cannon (4 HP) |
| `GOAT_KNIGHT` | `'goatKnight'` | Armored tank goat (15-20 HP) |

### PICKUP_TYPES

| Key | Value | Description |
|-----|-------|-------------|
| `HEALTH` | `'health'` | Health restore |
| `AMMO` | `'ammo'` | Ammo refill |
| `FUEL` | `'fuel'` | Flamethrower fuel (Circles 7-9) |
| `WEAPON_SHOTGUN` | `'weapon_shotgun'` | Brim Shotgun pickup |
| `WEAPON_CANNON` | `'weapon_cannon'` | Hellfire Cannon (AK-47) pickup |
| `WEAPON_LAUNCHER` | `'weapon_launcher'` | Goat's Bane (Bazooka) pickup |
| `WEAPON_FLAMETHROWER` | `'weapon_flamethrower'` | Brimstone Flamethrower pickup |

---

## 5. API Method Reference

### constructor

```typescript
const editor = new LevelEditor(db: DrizzleDb);
```

Takes a Drizzle ORM database handle. Create via:
```typescript
const sqliteDb = new BetterSqlite3(':memory:');
const db = drizzle(sqliteDb, { schema });
await migrateAndSeed(db);
```

---

### createTheme()

Creates a visual theme (fog, lighting, wall types) for one or more levels.

```typescript
editor.createTheme(id: string, opts: {
  name: string;              // Internal name (camelCase)
  displayName: string;       // UI display name (e.g., 'THE FIRE PITS')
  primaryWall: number;       // MapCell value for default walls (e.g., MapCell.WALL_STONE)
  accentWalls: number[];     // MapCell values for accent wall variety
  fogDensity?: number;       // 0.0 = no fog, 0.08 = dense (default: 0.03)
  fogColor?: string;         // Hex color (default: '#000000')
  ambientColor: string;      // Hex color for ambient lighting (REQUIRED)
  ambientIntensity?: number; // 0.0-1.0 (default: 0.3)
  skyColor?: string;         // Hex color (default: '#000000')
  particleEffect?: string;   // Particle system name or null
  enemyTypes?: string[];     // Enemy type strings for this theme
  enemyDensity?: number;     // Multiplier 0.0-2.0 (default: 1.0)
  pickupDensity?: number;    // Multiplier 0.0-2.0 (default: 0.6)
}): void
```

**Example:**
```typescript
editor.createTheme('circle-5-wrath', {
  name: 'wrath',
  displayName: 'WRATH',
  primaryWall: MapCell.WALL_LAVA,
  accentWalls: [MapCell.WALL_LAVA, MapCell.WALL_OBSIDIAN],
  ambientColor: '#ff4422',
  ambientIntensity: 0.4,
  fogDensity: 0.02,
  fogColor: '#1a0a00',
  enemyTypes: ['fireGoat', 'hellgoat', 'goatKnight'],
});
```

---

### createLevel()

Creates the top-level record for a level. Must reference an existing theme.

```typescript
editor.createLevel(id: string, opts: {
  name: string;              // Human-readable name
  levelType: 'circle' | 'procedural' | 'arena' | 'boss';
  width: number;             // Grid width in cells
  depth: number;             // Grid depth in cells
  floor: number;             // Floor number in game progression
  themeId: string;           // Must match a createTheme() id
  circleNumber?: number;     // 1-9 for circle levels
  sin?: string;              // The sin of this circle
  guardian?: string;         // Boss name
  music?: string;            // Music track ID
  ambientSound?: string;     // Ambient sound ID
  spawnX?: number;           // Initial spawn X (default: 0; override with setPlayerSpawn)
  spawnZ?: number;           // Initial spawn Z (default: 0)
  spawnFacing?: number;      // Initial facing in radians (default: 0)
}): void
```

**Example:**
```typescript
editor.createLevel('circle-1-limbo', {
  name: 'Limbo',
  levelType: 'circle',
  width: 40,
  depth: 50,
  floor: 1,
  themeId: 'circle-1-limbo',
  circleNumber: 1,
  sin: 'ignorance',
  guardian: 'Il Vecchio',
});
```

---

### room() (convenience)

Creates a room with a simplified signature. Default room type is `'exploration'`.

```typescript
editor.room(
  levelId: string,
  name: string,              // Unique name within the level (e.g., 'vestibule')
  x: number,                 // Top-left X (grid)
  z: number,                 // Top-left Z (grid)
  w: number,                 // Width in cells
  h: number,                 // Height/depth in cells
  opts?: {
    roomType?: string;       // Default: 'exploration'
    elevation?: number;      // Default: 0
    floorCell?: number;      // Override MapCell for floor (default: EMPTY)
    wallCell?: number;       // Override MapCell for room border walls
    sortOrder?: number;      // Rendering order (default: 0)
  }
): string                    // Returns the generated room ID
```

**Example:**
```typescript
const arenaId = editor.room(LEVEL_ID, 'columns', 14, 26, 12, 10, {
  roomType: ROOM_TYPES.ARENA,
});

const lavaRoom = editor.room(LEVEL_ID, 'lava_pit', 5, 5, 8, 8, {
  floorCell: MapCell.FLOOR_LAVA,
  wallCell: MapCell.WALL_LAVA,
});
```

---

### addRoom() (low-level)

Full-parameter room creation. Use `room()` for convenience.

```typescript
editor.addRoom(levelId: string, name: string, opts: {
  roomType: string;          // REQUIRED
  boundsX: number;           // REQUIRED
  boundsZ: number;           // REQUIRED
  boundsW: number;           // REQUIRED
  boundsH: number;           // REQUIRED
  elevation?: number;
  floorCell?: number;
  wallCell?: number;
  sortOrder?: number;
}): string                   // Returns room ID
```

---

### corridor() (convenience)

Creates a corridor connection between two rooms. Carves an L-shaped 2-wide path between room centers.

```typescript
editor.corridor(
  levelId: string,
  fromRoomId: string,        // Source room ID
  toRoomId: string,          // Destination room ID
  width?: number             // Corridor width in cells (default: 2)
): string                    // Returns connection ID
```

**Example:**
```typescript
editor.corridor(LEVEL_ID, vestibuleId, fogHallId, 3);
```

**IMPORTANT:** Connections are directional. The room graph must be a DAG (no cycles). `validate()` will detect cycles.

---

### connect() (low-level)

Full-parameter connection creation. Use `corridor()` for the common case.

```typescript
editor.connect(levelId: string, fromRoomId: string, toRoomId: string, opts: {
  connectionType: string;    // REQUIRED: 'corridor' | 'door' | 'stairs' | 'portal' | 'secret' | 'bridge' | 'jump_pad'
  corridorWidth?: number;    // Default: 2
  direction?: string;        // 'n' | 's' | 'e' | 'w'
  fromElevation?: number;    // Elevation at source room
  toElevation?: number;      // Elevation at destination room
  length?: number;           // Connection length
}): string                   // Returns connection ID
```

**Example:**
```typescript
// Door connection
editor.connect(LEVEL_ID, hallId, arenaId, { connectionType: 'door' });

// Secret wall connection
editor.connect(LEVEL_ID, mainId, secretId, { connectionType: 'secret' });

// Stairs between elevations
editor.connect(LEVEL_ID, lowerId, upperId, {
  connectionType: 'stairs',
  fromElevation: 0,
  toElevation: 1,
});
```

---

### spawnEnemy()

Spawn a regular enemy entity.

```typescript
editor.spawnEnemy(
  levelId: string,
  type: string,              // Enemy type (use ENEMY_TYPES constants)
  x: number,                 // Grid X position
  z: number,                 // Grid Z position
  opts?: {
    roomId?: string;         // Associate with a room (for validation)
    elevation?: number;      // Vertical offset
    facing?: number;         // Initial facing in radians
    patrol?: Array<{         // Patrol waypoints (grid coordinates)
      x: number;
      z: number;
    }>;
    overrides?: Record<string, unknown>;  // Override entity properties (hp, speed, etc.)
  }
): string                    // Returns entity ID
```

**Example:**
```typescript
editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 20, 17, {
  roomId: fogHallId,
  facing: Math.PI,
  patrol: [
    { x: 20, z: 17 },
    { x: 24, z: 17 },
    { x: 24, z: 20 },
    { x: 20, z: 20 },
  ],
});
```

---

### spawnBoss()

Spawn a boss entity. Uses `spawnCategory='boss'` which affects AI governor behavior differently from regular enemies.

```typescript
editor.spawnBoss(
  levelId: string,
  type: string,              // Boss type string
  x: number,                 // Grid X
  z: number,                 // Grid Z
  opts?: {
    roomId?: string;
    facing?: number;
    overrides?: Record<string, unknown>;  // Boss-specific overrides (hp, phases, etc.)
  }
): string                    // Returns entity ID
```

**Example:**
```typescript
editor.spawnBoss(LEVEL_ID, 'il_vecchio', 20, 42, {
  roomId: bossRoomId,
  facing: 0,
  overrides: {
    hp: 200,
    phases: 2,
    fogDensityPhase2: 0.12,
  },
});
```

---

### spawnPickup()

Spawn a pickup entity (health, ammo, weapons).

```typescript
editor.spawnPickup(
  levelId: string,
  type: string,              // Pickup type (use PICKUP_TYPES constants)
  x: number,                 // Grid X
  z: number                  // Grid Z
): string                    // Returns entity ID
```

**Example:**
```typescript
editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 5, 5);
editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.WEAPON_SHOTGUN, 10, 15);
```

---

### spawnProp()

Spawn a decorative prop (torch, barrel, cage, etc.).

```typescript
editor.spawnProp(
  levelId: string,
  type: string,              // Prop type string (e.g., 'torch_metal', 'barrel')
  x: number,                 // Grid X
  z: number,                 // Grid Z
  opts?: {
    roomId?: string;
    elevation?: number;
    facing?: number;         // Rotation in radians
    surfaceAnchor?: {        // Mount to a wall surface
      face: string;          // 'north' | 'south' | 'east' | 'west'
      offsetX: number;       // Offset from cell center X
      offsetY: number;       // Offset from cell center Y (vertical)
      offsetZ: number;       // Offset from cell center Z
      rotation: number[];    // Euler rotation [rx, ry, rz]
      scale: number;         // Scale multiplier
    };
  }
): string                    // Returns entity ID
```

**Example:**
```typescript
// Floor prop
editor.spawnProp(LEVEL_ID, 'barrel', 8, 10, { roomId: hallId });

// Wall-mounted torch
editor.spawnProp(LEVEL_ID, 'torch_metal', 14, 12, {
  roomId: fogHallId,
  surfaceAnchor: {
    face: 'west',
    offsetX: -0.9,
    offsetY: 1.5,
    offsetZ: 0,
    rotation: [0, Math.PI / 2, 0],
    scale: 1.0,
  },
});
```

---

### addEntity() (low-level)

Full-parameter entity creation. Use `spawnEnemy()`, `spawnBoss()`, `spawnPickup()`, or `spawnProp()` for convenience.

```typescript
editor.addEntity(levelId: string, opts: {
  entityType: string;        // REQUIRED
  x: number;                 // REQUIRED
  z: number;                 // REQUIRED
  spawnCategory: 'enemy' | 'pickup' | 'prop' | 'hazard' | 'boss';  // REQUIRED
  roomId?: string;
  elevation?: number;
  facing?: number;
  patrol?: Array<{ x: number; z: number }>;
  triggerId?: string;        // If set, entity only spawns when trigger fires
  overrides?: Record<string, unknown>;
  surfaceAnchor?: { face: string; offsetX: number; offsetY: number; offsetZ: number; rotation: number[]; scale: number; };
}): string
```

**Key behavior:** Entities with a `triggerId` are NOT included in the initial `toLevelData()` spawn list. They only appear at runtime when the trigger fires. This is how ambush spawns and arena waves work.

---

### addTrigger()

Create a trigger zone. When the player enters the zone bounds, the action fires.

```typescript
editor.addTrigger(levelId: string, opts: {
  action: string;            // REQUIRED: use TRIGGER_ACTIONS constants
  zoneX: number;             // REQUIRED: trigger zone top-left X (grid)
  zoneZ: number;             // REQUIRED: trigger zone top-left Z (grid)
  zoneW: number;             // REQUIRED: trigger zone width
  zoneH: number;             // REQUIRED: trigger zone height
  roomId?: string;           // Room this trigger belongs to
  once?: boolean;            // Fire only once? (default: true)
  delay?: number;            // Delay in seconds before firing (default: 0)
  actionData?: Record<string, unknown>;  // Action-specific payload
}): string                   // Returns trigger ID
```

**actionData by action type:**

| Action | actionData fields |
|--------|-------------------|
| `spawnWave` | `{ waveIndex?: number, enemies: [{ type: string, count: number }] }` |
| `lockDoors` | (none needed) |
| `unlockDoors` | `{ condition: 'allEnemiesKilled' }` |
| `dialogue` | `{ text: string }` |
| `bossIntro` | `{ text: string }` |
| `ambientChange` | `{ fogDensity?: number, fogColor?: string, ambientColor?: string }` |
| `secretReveal` | `{ roomId: string }` |
| `platformMove` | `{ direction: string, distance: number }` |

---

### addEnvironmentZone()

Create an atmospheric effect zone. The zone affects player physics and visuals within its bounds.

```typescript
editor.addEnvironmentZone(levelId: string, opts: {
  envType: string;           // REQUIRED: use ENV_TYPES constants
  boundsX: number;           // REQUIRED: zone top-left X (grid)
  boundsZ: number;           // REQUIRED: zone top-left Z (grid)
  boundsW: number;           // REQUIRED: zone width
  boundsH: number;           // REQUIRED: zone height
  intensity?: number;        // Effect strength 0.0-2.0 (default: 1.0)
  directionX?: number;       // Wind direction X component (-1.0 to 1.0)
  directionZ?: number;       // Wind direction Z component (-1.0 to 1.0)
  timerOn?: number;          // Seconds the effect is active
  timerOff?: number;         // Seconds the effect is inactive (creates pulsing)
}): string                   // Returns zone ID
```

**Example:**
```typescript
// Constant wind pushing east
editor.addEnvironmentZone(LEVEL_ID, {
  envType: ENV_TYPES.WIND,
  boundsX: 5, boundsZ: 10, boundsW: 20, boundsH: 8,
  intensity: 1.5,
  directionX: 1.0,
  directionZ: 0,
});

// Pulsing fire geyser (3s on, 2s off)
editor.addEnvironmentZone(LEVEL_ID, {
  envType: ENV_TYPES.FIRE,
  boundsX: 12, boundsZ: 20, boundsW: 2, boundsH: 2,
  intensity: 1.0,
  timerOn: 3.0,
  timerOff: 2.0,
});

// Dense fog zone
editor.addEnvironmentZone(LEVEL_ID, {
  envType: ENV_TYPES.FOG,
  boundsX: 14, boundsZ: 12, boundsW: 12, boundsH: 10,
  intensity: 0.08,
});
```

---

### lockOnEntry()

Convenience method for the lock-on-entry pattern. Creates two triggers:
1. Player enters zone => doors lock
2. All enemies killed => doors unlock

```typescript
editor.lockOnEntry(
  levelId: string,
  roomId: string,            // Room whose doors to lock
  triggerZone: { x: number; z: number; w: number; h: number }
): { lockTriggerId: string; unlockTriggerId: string }
```

---

### ambush()

Convenience method for ambush spawns. Creates a trigger zone and entities tied to it. Enemies appear only when the player enters the zone.

```typescript
editor.ambush(
  levelId: string,
  triggerZone: { x: number; z: number; w: number; h: number },
  enemies: Array<{ type: string; x: number; z: number }>,
  opts?: { roomId?: string }
): string                    // Returns trigger ID
```

**Example:**
```typescript
editor.ambush(
  LEVEL_ID,
  { x: 6, z: 30, w: 6, h: 4 },
  [
    { type: ENEMY_TYPES.HELLGOAT, x: 7, z: 31 },
    { type: ENEMY_TYPES.HELLGOAT, x: 10, z: 32 },
    { type: ENEMY_TYPES.HELLGOAT, x: 9, z: 31 },
  ],
  { roomId: bonePitId },
);
```

---

### setupArenaWaves()

Full arena encounter setup: lock doors on entry, spawn enemies in sequential waves, unlock doors when all waves are cleared.

```typescript
editor.setupArenaWaves(
  levelId: string,
  roomId: string,
  triggerZone: { x: number; z: number; w: number; h: number },
  waves: Array<Array<{ type: string; x: number; z: number }>>
): {
  lockTriggerId: string;
  waveTriggersIds: string[];
  unlockTriggerId: string;
}
```

**Example:**
```typescript
const { lockTriggerId, waveTriggersIds, unlockTriggerId } = editor.setupArenaWaves(
  LEVEL_ID,
  arenaId,
  { x: 15, z: 27, w: 10, h: 8 },
  [
    // Wave 1: 3 hellgoats
    [
      { type: ENEMY_TYPES.HELLGOAT, x: 16, z: 28 },
      { type: ENEMY_TYPES.HELLGOAT, x: 20, z: 30 },
      { type: ENEMY_TYPES.HELLGOAT, x: 24, z: 28 },
    ],
    // Wave 2: 2 hellgoats + 1 fireGoat
    [
      { type: ENEMY_TYPES.HELLGOAT, x: 16, z: 32 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 20, z: 28 },
      { type: ENEMY_TYPES.HELLGOAT, x: 24, z: 32 },
    ],
  ],
);
```

---

### bossIntro()

Create a boss introduction dialogue trigger.

```typescript
editor.bossIntro(
  levelId: string,
  triggerZone: { x: number; z: number; w: number; h: number },
  text: string,              // The boss's spoken line
  opts?: {
    roomId?: string;
    delay?: number;          // Delay in seconds
  }
): string                    // Returns trigger ID
```

**Example:**
```typescript
editor.bossIntro(
  LEVEL_ID,
  { x: 18, z: 40, w: 4, h: 2 },
  'You carry what is not yours, little goat.',
  { roomId: bossRoomId, delay: 1.5 },
);
```

---

### dialogue()

Create a lore/dialogue trigger zone.

```typescript
editor.dialogue(
  levelId: string,
  triggerZone: { x: number; z: number; w: number; h: number },
  text: string,
  opts?: { roomId?: string }
): string                    // Returns trigger ID
```

**Example:**
```typescript
editor.dialogue(
  LEVEL_ID,
  { x: 17, z: 3, w: 6, h: 2 },
  'Per me si va ne la citta dolente...',
  { roomId: vestibuleId },
);
```

---

### setPlayerSpawn()

Set the player's starting position and facing direction. Must be inside a room.

```typescript
editor.setPlayerSpawn(
  levelId: string,
  x: number,                 // Grid X (must be inside a room)
  z: number,                 // Grid Z (must be inside a room)
  facing?: number            // Facing in radians (default: 0 = north; Math.PI = south)
): void
```

**Example:**
```typescript
editor.setPlayerSpawn(LEVEL_ID, 20, 5, Math.PI);
```

---

### compile()

Rasterize rooms and connections into a MapCell grid BLOB stored on the level record. **Must be called after all rooms and connections are added.**

```typescript
editor.compile(levelId: string): void
```

The compiler:
1. Initializes a `width x depth` grid filled with `primaryWall`
2. Carves each room's interior to its `floorCell` (default: EMPTY)
3. If a room has a custom `wallCell`, paints the border ring
4. Processes connections (corridors, doors, stairs, bridges, secrets, jump pads)
5. Packs the grid as a Uint8Array BLOB and writes it to `levels.compiled_grid`

---

### validate()

Run structural validation checks. Returns errors (must fix) and warnings (should fix).

```typescript
editor.validate(levelId: string): {
  valid: boolean;            // true if no errors
  errors: string[];          // Blocking issues
  warnings: string[];        // Non-blocking suggestions
}
```

**Always validate after compile. Fix all errors before shipping.**

---

### Getter Methods

These methods query the database for introspection. Useful for verifying state mid-build.

```typescript
// Get level record (or null)
editor.getLevel(levelId: string): Level | null

// Get all rooms for a level
editor.getRooms(levelId: string): Room[]

// Get a specific room by name (or null)
editor.getRoomByName(levelId: string, name: string): Room | null

// Get entities, optionally filtered by spawn category
editor.getEntities(levelId: string, spawnCategory?: string): Entity[]

// Get all triggers
editor.getTriggers(levelId: string): Trigger[]

// Get all environment zones
editor.getEnvironmentZones(levelId: string): EnvironmentZone[]

// Get all connections
editor.getConnections(levelId: string): Connection[]
```

**Example:**
```typescript
const rooms = editor.getRooms(LEVEL_ID);
const enemies = editor.getEntities(LEVEL_ID, 'enemy');
const bossRoom = editor.getRoomByName(LEVEL_ID, 'boss_chamber');
```

---

## 6. Common Patterns

### Arena with lock/wave/unlock

The most common combat pattern. Doors lock when the player enters, enemies spawn in waves, doors unlock when all enemies are killed.

```typescript
// Create the arena room
const arenaId = editor.room(LEVEL_ID, 'tempest_hall', 10, 20, 14, 12, {
  roomType: ROOM_TYPES.ARENA,
});

// Connect to previous room
editor.corridor(LEVEL_ID, previousRoomId, arenaId, 3);

// Set up waves (trigger zone should cover the room entrance area)
const { lockTriggerId, waveTriggersIds, unlockTriggerId } = editor.setupArenaWaves(
  LEVEL_ID,
  arenaId,
  { x: 11, z: 21, w: 12, h: 10 }, // trigger zone inside arena
  [
    // Wave 1
    [
      { type: ENEMY_TYPES.HELLGOAT, x: 12, z: 24 },
      { type: ENEMY_TYPES.HELLGOAT, x: 16, z: 26 },
      { type: ENEMY_TYPES.HELLGOAT, x: 20, z: 24 },
    ],
    // Wave 2
    [
      { type: ENEMY_TYPES.FIRE_GOAT, x: 14, z: 28 },
      { type: ENEMY_TYPES.HELLGOAT, x: 18, z: 22 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 22, z: 28 },
    ],
  ],
);

// Add pickups that appear after the fight (tied to unlock trigger)
editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 17, 26);
editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 17, 28);
```

### Boss room setup

```typescript
// Create the boss room
const bossRoomId = editor.room(LEVEL_ID, 'boss_chamber', 12, 38, 16, 10, {
  roomType: ROOM_TYPES.BOSS,
  wallCell: MapCell.WALL_OBSIDIAN,
});

// Connect from the last exploration room
editor.connect(LEVEL_ID, lastRoomId, bossRoomId, { connectionType: 'door' });

// Boss intro dialogue (placed at room entrance)
editor.bossIntro(
  LEVEL_ID,
  { x: 18, z: 38, w: 4, h: 2 },
  'You carry what is not yours, little goat.',
  { roomId: bossRoomId, delay: 1.5 },
);

// Lock doors on entry
editor.lockOnEntry(LEVEL_ID, bossRoomId, { x: 13, z: 39, w: 14, h: 8 });

// Spawn the boss
editor.spawnBoss(LEVEL_ID, 'il_vecchio', 20, 44, {
  roomId: bossRoomId,
  facing: 0, // facing north (toward player)
  overrides: { hp: 200, phases: 2 },
});

// Props for atmosphere
editor.spawnProp(LEVEL_ID, 'torch_metal', 12, 38, {
  roomId: bossRoomId,
  surfaceAnchor: {
    face: 'east',
    offsetX: 0.9, offsetY: 1.5, offsetZ: 0,
    rotation: [0, -Math.PI / 2, 0],
    scale: 1.0,
  },
});
```

### Secret room with WALL_SECRET connection

```typescript
// Create the secret room
const secretId = editor.room(LEVEL_ID, 'crypt', 2, 18, 6, 6, {
  roomType: ROOM_TYPES.SECRET,
});

// Connect via secret wall (places WALL_SECRET at the midpoint)
editor.connect(LEVEL_ID, fogHallId, secretId, { connectionType: 'secret' });

// Place a weapon pickup in the secret room
editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.WEAPON_SHOTGUN, 5, 21);

// Optional: dialogue when entering
editor.dialogue(
  LEVEL_ID,
  { x: 3, z: 19, w: 4, h: 4 },
  'A forgotten armory. The walls weep with moisture.',
  { roomId: secretId },
);
```

### Patrol enemies with waypoints

Enemies follow waypoint loops. Coordinates are grid positions.

```typescript
// Triangle patrol pattern
editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 18, 15, {
  roomId: fogHallId,
  patrol: [
    { x: 18, z: 15 },
    { x: 22, z: 15 },
    { x: 20, z: 19 },
  ],
});

// Back-and-forth patrol
editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 10, 25, {
  roomId: hallId,
  patrol: [
    { x: 10, z: 25 },
    { x: 10, z: 35 },
  ],
});
```

### Trigger-gated enemy spawns

Enemies with a `triggerId` do not appear in the level until the trigger fires.

```typescript
// Create the trigger
const triggerId = editor.addTrigger(LEVEL_ID, {
  action: TRIGGER_ACTIONS.SPAWN_WAVE,
  zoneX: 10, zoneZ: 30, zoneW: 4, zoneH: 2,
  roomId: hallId,
  once: true,
  actionData: {
    enemies: [{ type: 'hellgoat', count: 3 }],
  },
});

// Create entities tied to the trigger
editor.addEntity(LEVEL_ID, {
  entityType: ENEMY_TYPES.HELLGOAT,
  x: 12, z: 32,
  spawnCategory: 'enemy',
  roomId: hallId,
  triggerId, // Will not spawn until trigger fires
});
editor.addEntity(LEVEL_ID, {
  entityType: ENEMY_TYPES.HELLGOAT,
  x: 14, z: 34,
  spawnCategory: 'enemy',
  roomId: hallId,
  triggerId,
});
```

Or use the `ambush()` convenience method which does this automatically:

```typescript
const triggerId = editor.ambush(
  LEVEL_ID,
  { x: 10, z: 30, w: 4, h: 2 },
  [
    { type: ENEMY_TYPES.HELLGOAT, x: 12, z: 32 },
    { type: ENEMY_TYPES.HELLGOAT, x: 14, z: 34 },
  ],
  { roomId: hallId },
);
```

### Wall-mounted props (surfaceAnchor)

Props mounted on wall surfaces use the `surfaceAnchor` field.

```typescript
// West wall torch
editor.spawnProp(LEVEL_ID, 'torch_metal', 14, 15, {
  roomId: roomId,
  surfaceAnchor: {
    face: 'west',          // Which wall face to attach to
    offsetX: -0.9,         // Push into the wall (-X for west wall)
    offsetY: 1.5,          // Height above floor (world units)
    offsetZ: 0,            // Lateral offset along the wall
    rotation: [0, Math.PI / 2, 0],  // Rotate to face into room
    scale: 1.0,
  },
});

// East wall torch
editor.spawnProp(LEVEL_ID, 'torch_metal', 25, 15, {
  roomId: roomId,
  surfaceAnchor: {
    face: 'east',
    offsetX: 0.9,
    offsetY: 1.5,
    offsetZ: 0,
    rotation: [0, -Math.PI / 2, 0],
    scale: 1.0,
  },
});

// North wall scroll
editor.spawnProp(LEVEL_ID, 'scroll_1', 20, 2, {
  roomId: roomId,
  surfaceAnchor: {
    face: 'north',
    offsetX: 0,
    offsetY: 1.2,
    offsetZ: -0.9,
    rotation: [0, Math.PI, 0],
    scale: 0.8,
  },
});
```

### Environment zones (fog, wind, fire)

```typescript
// Dense fog covering a room
editor.addEnvironmentZone(LEVEL_ID, {
  envType: ENV_TYPES.FOG,
  boundsX: 14, boundsZ: 12, boundsW: 12, boundsH: 10,
  intensity: 0.08,
});

// Wind pushing east across a corridor (with pulsing)
editor.addEnvironmentZone(LEVEL_ID, {
  envType: ENV_TYPES.WIND,
  boundsX: 5, boundsZ: 10, boundsW: 20, boundsH: 4,
  intensity: 1.5,
  directionX: 1.0,
  directionZ: 0,
  timerOn: 4.0,
  timerOff: 2.0,
});

// Fire geyser (3 seconds on, 2 seconds off)
editor.addEnvironmentZone(LEVEL_ID, {
  envType: ENV_TYPES.FIRE,
  boundsX: 18, boundsZ: 25, boundsW: 2, boundsH: 2,
  intensity: 1.0,
  timerOn: 3.0,
  timerOff: 2.0,
});

// Blood pool area
editor.addEnvironmentZone(LEVEL_ID, {
  envType: ENV_TYPES.BLOOD,
  boundsX: 8, boundsZ: 20, boundsW: 10, boundsH: 8,
  intensity: 0.5,
});
```

---

## 7. Circle-Specific Entity Types

### Enemy and boss assignments by circle

| Circle | Sin | Primary Mob | Secondary Mob | Boss | Boss Type String | Unique Mechanic |
|--------|-----|-------------|---------------|------|------------------|-----------------|
| 1 | Ignorance | `hellgoat` (Brown) | -- | Il Vecchio | `'il_vecchio'` | Dense fog (visibility ~8 cells) |
| 2 | Desire | `hellgoat` (Brown) | `fireGoat` (Crimson) | Caprone | `'caprone'` | Wind zones drag player toward lava |
| 3 | Excess | `hellgoat` (Green) | `fireGoat` (Crimson) | Vorago | `'vorago'` | 50% chance health pickups deal damage |
| 4 | Avarice | `goatKnight` (Dark) | `hellgoat` (Brown) | Aureo | `'aureo'` | Hoarding penalty (excess ammo slows player) |
| 5 | Rage | `fireGoat` (Crimson) | `goatKnight` (Dark) + `hellgoat` | Furia | `'furia'` | Enemy speed +10% every 5s of combat |
| 6 | Defiance | `shadowGoat` (Gray) | `fireGoat` (Crimson) | Profano | `'profano'` | Illusion walls (WALL_SECRET + FLOOR_VOID traps) |
| 7 | Bloodshed | `goatKnight` (Dark) | `fireGoat` + `hellgoat` | Il Macello | `'il_macello'` | Bleeding (1 HP/s drain; kills restore 10 HP) |
| 8 | Deception | `shadowGoat` (Gray) | `hellgoat` (Green) | Inganno | `'inganno'` | Mimic enemies disguised as pickups |
| 9 | Betrayal | `goatKnight` (Blue) | `shadowGoat` + `fireGoat` (Dark) | Azazel | `'azazel'` | Missed projectiles bounce back at player |

### Enemy stats quick reference

| Enemy Type | HP | Behavior | First Appears |
|------------|-----|----------|---------------|
| `hellgoat` | 10 | Melee, patrols, charges when player is spotted | Circle 1 |
| `fireGoat` | 8 | Ranged, shoots fire projectiles, keeps distance | Circle 2 |
| `shadowGoat` | 4 | Invisible until 4 cells away, high damage, glass cannon | Circle 6 |
| `goatKnight` | 15-20 | Armored, slow, tanky, devastating melee | Circle 4 (dark), Circle 9 (blue elite) |

### Circle-specific environment zones

| Circle | Env Type | Usage |
|--------|----------|-------|
| 1 (Limbo) | `FOG` | Dense fog zones (intensity 0.08) covering exploration rooms |
| 2 (Lust) | `WIND` | Pulsing crosswinds pushing toward lava walls (timerOn/timerOff) |
| 3 (Gluttony) | `WATER` | Acid pools (reskinned FLOOR_LAVA) |
| 5 (Wrath) | `FIRE` | Erupting fire geysers with timerOn/timerOff |
| 6 (Heresy) | `ILLUSION` | Zones where floor/walls cannot be trusted |
| 7 (Violence) | `BLOOD` | Blood river areas + `FIRE` geysers on burning shore |
| 9 (Treachery) | `ICE` | Slippery ice floors, reduced friction |

### Theme configuration per circle

| Circle | primaryWall | accentWalls | ambientColor | fogDensity |
|--------|-------------|-------------|--------------|------------|
| 1 | `WALL_STONE` (1) | `[1]` | `'#2233aa'` | 0.08 |
| 2 | `WALL_STONE` (1) | `[1]` | `'#aa6633'` | 0.02 |
| 3 | `WALL_FLESH` (2) | `[2]` | `'#33aa22'` | 0.03 |
| 4 | `WALL_STONE` (1) | `[4]` | `'#aaaa33'` | 0.02 |
| 5 | `WALL_LAVA` (3) | `[3, 4]` | `'#ff4422'` | 0.02 |
| 6 | `WALL_STONE` (1) | `[1, 4]` | `'#553388'` | 0.04 |
| 7 | `WALL_LAVA` (3) | `[3, 2]` | `'#cc2200'` | 0.03 |
| 8 | `WALL_STONE` (1) | `[1]` | `'#886644'` | 0.03 |
| 9 | `WALL_OBSIDIAN` (4) | `[4, 1]` | `'#4466cc'` | 0.02 |

---

## 8. Validation Checklist

`validate()` returns `{ valid, errors, warnings }`. Fix all **errors** before shipping. Review **warnings** and address when appropriate.

### Errors (level will not work)

| Check | Error message pattern | How to fix |
|-------|----------------------|------------|
| **Level not found** | `Level not found: 'xxx'` | Ensure `createLevel()` was called with the correct ID |
| **No rooms** | `Level has no rooms` | Call `editor.room()` at least once |
| **Spawn outside rooms** | `Spawn point (x, z) is not inside any room` | Call `setPlayerSpawn()` with coordinates inside a room. The error message suggests the nearest room and correct coordinates. |
| **Room out of bounds** | `Room 'xxx' bounds ... exceed level bounds` | Make sure `boundsX + boundsW <= level.width` and `boundsZ + boundsH <= level.depth`. Increase level width/depth or move the room. |
| **Entity out of bounds** | `Entity 'xxx' at (x, z) is outside level bounds` | Move the entity so `x` is in `[0, width-1]` and `z` is in `[0, depth-1]` |
| **Trigger out of bounds** | `Trigger 'xxx' zone ... exceeds level bounds` | Shrink or move the trigger zone to fit within level bounds |
| **Broken trigger FK** | `Entity 'xxx' references non-existent trigger` | Ensure the `triggerId` passed to `addEntity()` is a valid ID returned from `addTrigger()`, `ambush()`, or `setupArenaWaves()` |
| **Unreachable room** | `Room 'xxx' is not reachable from spawn room` | Add a connection (corridor, door, stairs, etc.) linking the unreachable room to the connected graph. The error message suggests which rooms to connect. |
| **DAG cycle** | `Room connection graph contains a cycle` | Remove or reverse one connection to break the cycle. Connections are directional: `fromRoomId -> toRoomId`. |

### Warnings (level works but may have issues)

| Check | Warning message pattern | How to fix |
|-------|------------------------|------------|
| **Room overlap** | `Rooms 'xxx' and 'yyy' have overlapping bounds` | Move rooms so they don't overlap. Overlapping rooms cause unpredictable grid compilation (the last room written wins). |
| **Empty room** | `Room 'xxx' has no entities` | Add enemies, pickups, or props to the room. Corridor rooms are exempt from this warning. |
| **Disconnected room** | `Room 'xxx' has no connections at all` | Add at least one connection to another room. |

### Validation order of operations

Always follow this sequence:
1. `createTheme()` + `createLevel()`
2. `room()` calls for all rooms
3. `corridor()` / `connect()` calls for all connections
4. `spawnEnemy()` / `spawnPickup()` / `spawnProp()` / `spawnBoss()` for entities
5. `addTrigger()` / `ambush()` / `setupArenaWaves()` for triggers
6. `setPlayerSpawn()` to set spawn inside a room
7. `compile()` to rasterize the grid
8. `validate()` to check for errors

---

## Appendix: Connection Type Grid Effects

How each connection type modifies the compiled grid:

| Type | Grid modification |
|------|-------------------|
| `corridor` | Carves L-shaped 2-wide EMPTY path between room centers (horizontal-first bend) |
| `door` | Same as corridor, then places a DOOR cell at the midpoint between room centers |
| `stairs` | Same as corridor, then places a 3x3 patch of RAMP cells at the L-bend corner |
| `bridge` | Same L-shape as corridor but carves FLOOR_RAISED cells instead of EMPTY |
| `secret` | Places a single WALL_SECRET cell at the midpoint between room centers (no corridor carved) |
| `jump_pad` | Places a single EMPTY cell at the midpoint (marker for jump pad entity) |
| `portal` | No grid modification (teleport handled at runtime) |

**Corridor carving detail:** The L-shaped path goes horizontal first (from source center X to target center X at source center Z), then vertical (from source center Z to target center Z at target center X). The path is always 2 cells wide.

---

## Appendix: Database Schema Summary

For reference, these are the SQLite tables. You should not need to write SQL directly -- use `LevelEditor` methods instead.

| Table | Primary Key | Key Columns |
|-------|-------------|-------------|
| `themes` | `id` (text) | name, primaryWall, accentWalls, fogDensity, ambientColor |
| `levels` | `id` (text) | name, levelType, width, depth, floor, themeId, spawnX, spawnZ, compiled_grid |
| `rooms` | `id` (UUID) | levelId, name, roomType, boundsX, boundsZ, boundsW, boundsH, floorCell, wallCell |
| `connections` | `id` (UUID) | levelId, fromRoomId, toRoomId, connectionType, corridorWidth |
| `entities` | `id` (UUID) | levelId, roomId, entityType, x, z, spawnCategory, triggerId, patrol, surfaceAnchor |
| `triggers` | `id` (UUID) | levelId, roomId, action, zoneX, zoneZ, zoneW, zoneH, once, delay, actionData |
| `environment_zones` | `id` (UUID) | levelId, envType, boundsX, boundsZ, boundsW, boundsH, intensity, directionX/Z, timerOn/Off |
| `materials` | `id` (text) | name, color, roughness, metalness, textures |
| `cell_metadata` | `mapCell` (int) | name, category, isWalkable, isSolid, damagePerSecond |

Foreign key cascades: Deleting a level cascades to rooms, connections, entities, triggers, and environment_zones.
