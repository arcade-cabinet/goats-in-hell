---
title: "Circle Building Guide"
status: implemented
created: "2026-03-01"
updated: "2026-03-01"
domain: agents
related:
  - docs/agents/level-editor-api.md
  - docs/circles/01-limbo.md
---

# Circle Building Guide

> **Audience:** AI agents translating a circle design document (`docs/circles/0N-*.md`) into a TypeScript build script that calls the `LevelEditor` API.

---

## 1. Build Script Template

Every circle build script follows this exact structure. Copy it and fill in the numbered sections.

```typescript
import BetterSqlite3 from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import {
  LevelEditor,
  MapCell,
  TRIGGER_ACTIONS,
  ROOM_TYPES,
  CONNECTION_TYPES,
  ENV_TYPES,
  ENEMY_TYPES,
  PICKUP_TYPES,
  SPAWN_CATEGORIES,
} from '../src/db/LevelEditor';
import { migrateAndSeed } from '../src/db/migrate';
import * as schema from '../src/db/schema';

const LEVEL_ID = 'circle-N-slug';
const THEME_ID = 'circle-N-slug';

export async function buildCircleN(dbPath: string) {
  const sqliteDb = new BetterSqlite3(dbPath);
  const db = drizzle(sqliteDb, { schema });
  await migrateAndSeed(db);
  const editor = new LevelEditor(db);

  // 1. Create theme
  editor.createTheme(THEME_ID, {
    name: '...',
    displayName: '...',
    primaryWall: MapCell.WALL_STONE,
    accentWalls: [MapCell.WALL_STONE],
    fogDensity: 0.08,
    fogColor: '#0d0d1a',
    ambientColor: '#2233aa',
    ambientIntensity: 0.15,
    skyColor: '#000000',
    particleEffect: null,
    enemyTypes: ['hellgoat'],
    enemyDensity: 0.8,
    pickupDensity: 0.5,
  });

  // 2. Create level
  editor.createLevel(LEVEL_ID, {
    name: 'Circle N: Name',
    levelType: 'circle',
    width: 40,     // from "Grid Dimensions" section
    depth: 50,     // from "Grid Dimensions" section
    floor: 1,
    themeId: THEME_ID,
    circleNumber: 1,
    sin: 'Ignorance',
    guardian: 'Il Vecchio',
  });

  // 3. Create rooms (in sortOrder)
  const vestibuleId = editor.room(LEVEL_ID, 'vestibule', 16, 2, 8, 6, {
    roomType: ROOM_TYPES.EXPLORATION,
    sortOrder: 0,
  });
  // ... more rooms ...

  // 4. Create connections
  editor.corridor(LEVEL_ID, vestibuleId, fogHallId, 3);
  // ... more connections ...

  // 5. Spawn entities (enemies, pickups, props)
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 18, 17, { roomId: fogHallId });
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 20, 7);
  editor.spawnProp(LEVEL_ID, 'torch-sconce-ornate', 17, 3, { roomId: vestibuleId });
  // ... more entities ...

  // 6. Create triggers
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.SPAWN_WAVE,
    zoneX: 3, zoneZ: 16, zoneW: 6, zoneH: 4,
    once: true,
    actionData: { enemies: [{ type: 'hellgoat', count: 3 }] },
  });
  // ... more triggers ...

  // 7. Create environment zones
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.FOG,
    boundsX: 0, boundsZ: 0, boundsW: 40, boundsH: 50,
    intensity: 0.8,
  });
  // ... more zones ...

  // 8. Set player spawn
  editor.setPlayerSpawn(LEVEL_ID, 20, 5, Math.PI);

  // 9. Compile grid
  editor.compile(LEVEL_ID);

  // 10. Validate
  const result = editor.validate(LEVEL_ID);
  if (!result.valid) {
    console.error('Validation errors:', result.errors);
    throw new Error('Level validation failed');
  }
  console.log(`Circle N built successfully`);
  if (result.warnings.length > 0) {
    console.log('Warnings:', result.warnings);
  }
}
```

### Execution order matters

The steps MUST run in this order because of foreign key dependencies:

1. **Theme** first -- levels reference themes via `themeId`
2. **Level** second -- rooms, entities, triggers, and zones all reference the level via `levelId`
3. **Rooms** third -- connections reference rooms via `fromRoomId`/`toRoomId`, entities and triggers optionally reference rooms via `roomId`
4. **Connections** after rooms -- needs room IDs from step 3
5. **Triggers** before trigger-linked entities -- entities with `triggerId` must reference an existing trigger
6. **Entities** after triggers (if any entities use `triggerId`)
7. **Environment zones** -- no dependencies beyond levelId, can go anywhere after step 2
8. **Player spawn** -- calls `UPDATE` on the level row, so the level must exist
9. **Compile** -- reads rooms and connections from the DB to rasterize the grid
10. **Validate** -- reads everything; always call last

---

## 2. How to Read a Circle Design Doc

Each section of a circle design doc (`docs/circles/0N-*.md`) maps to specific API calls. Here is the complete mapping.

### "Identity" section --> `createLevel()` metadata

| Design doc field | `createLevel()` parameter |
|------------------|---------------------------|
| Circle number    | `circleNumber`            |
| Sin              | `sin`                     |
| Boss name        | `guardian`                |
| Circle name      | `name` (e.g. `'Circle 1: Limbo'`) |

The `levelType` for hand-authored circles is always `'circle'`.

### "Visual Design > PBR Material Palette" --> NOT directly used

PBR materials are handled at render time by `Materials.ts` and the `materials` seed table. The design doc's material palette is informational -- do NOT try to create materials in the build script.

### "Visual Design > Fog Settings" --> `createTheme()` fogDensity, fogColor

The design doc lists multiple fog phases (e.g., different density during boss fight). Use the **baseline** fog values for `createTheme()`. Phase changes (like "boss HP < 50%") are handled by triggers with `TRIGGER_ACTIONS.AMBIENT_CHANGE`.

### "Visual Design > Lighting" --> `createTheme()` ambientColor, ambientIntensity

Map the ambient color hex and intensity directly. Point lights from torches are handled by prop placement, not theme configuration.

### "Visual Design > Props" --> `spawnProp()` calls

Each prop in the table becomes one or more `spawnProp()` calls. Use the Meshy AI-generated prop `id` as the `entityType` (e.g., `'torch-sconce-ornate'`, `'limbo-cage'`, `'limbo-sigil-stone'`). Prop names are lowercase, hyphenated. Circle-specific props use the pattern `{circle-name}-{prop-description}` (e.g., `limbo-broken-pillar`). General library props use short names (e.g., `torch-sconce-ornate`, `candelabrum-tall`, `chandelier-iron`). Props are placed at grid coordinates inside the room they belong to.

For wall-mounted props, use the `surfaceAnchor` option:
```typescript
editor.spawnProp(LEVEL_ID, 'torch-sconce-ornate', x, z, {
  roomId,
  surfaceAnchor: {
    face: 'north',      // which wall face
    offsetX: 0,
    offsetY: 1.5,       // height on wall
    offsetZ: 0,
    rotation: [0, 0, 0],
    scale: 1.0,
  },
});
```

### "Room Layout > Grid Dimensions" --> `createLevel()` width, depth

The design doc states dimensions like "40 wide x 50 deep". Map directly:
- "40 wide" --> `width: 40`
- "50 deep" --> `depth: 50`

### "Room Layout > Room Placement" --> `room()` calls

The Room Placement table provides exact grid coordinates. Map each column directly:

| Table column | `room()` parameter |
|--------------|-------------------|
| X            | `x` (3rd argument) |
| Z            | `z` (4th argument) |
| W            | `w` (5th argument) |
| H            | `h` (6th argument) |
| Type         | `opts.roomType` (use `ROOM_TYPES` constants) |
| Elevation    | `opts.elevation` |
| sortOrder    | `opts.sortOrder` |

Type mapping from design doc strings to constants:
- "exploration" --> `ROOM_TYPES.EXPLORATION`
- "arena" --> `ROOM_TYPES.ARENA`
- "boss" --> `ROOM_TYPES.BOSS`
- "secret" --> `ROOM_TYPES.SECRET`
- "platforming" --> `ROOM_TYPES.PLATFORMING`
- "hub" --> `ROOM_TYPES.HUB`
- "corridor" --> `ROOM_TYPES.CORRIDOR`
- "puzzle" --> `ROOM_TYPES.PUZZLE`

### "Room Layout > Connections" --> `corridor()` / `connect()` calls

For corridor-type connections, use the convenience method:
```typescript
editor.corridor(LEVEL_ID, fromRoomId, toRoomId, width);
```

For non-corridor types (stairs, secret, door, etc.), use the general method:
```typescript
editor.connect(LEVEL_ID, fromRoomId, toRoomId, {
  connectionType: CONNECTION_TYPES.STAIRS,
  corridorWidth: 3,
  fromElevation: 0,
  toElevation: -1,
});
```

### "Entities > Enemies" --> `spawnEnemy()` / `spawnBoss()` calls

- Regular enemies: `editor.spawnEnemy(LEVEL_ID, type, x, z, { roomId })`
- Boss entities: `editor.spawnBoss(LEVEL_ID, type, x, z, { roomId })`
- Trigger-spawned enemies (ambush, wave): use the `ambush()` or `setupArenaWaves()` convenience methods, which create both the trigger and the entities linked to it

Use `ENEMY_TYPES` constants for standard types:
- `ENEMY_TYPES.HELLGOAT` --> `'hellgoat'`
- `ENEMY_TYPES.FIRE_GOAT` --> `'fireGoat'`
- `ENEMY_TYPES.SHADOW_GOAT` --> `'shadowGoat'`
- `ENEMY_TYPES.GOAT_KNIGHT` --> `'goatKnight'`

For boss entities, use the boss GLB name as the type string (e.g., `'il_vecchio'`).

### "Entities > Pickups" --> `spawnPickup()` calls

```typescript
editor.spawnPickup(LEVEL_ID, type, x, z);
```

Use `PICKUP_TYPES` constants:
- `PICKUP_TYPES.HEALTH` --> `'health'`
- `PICKUP_TYPES.AMMO` --> `'ammo'`
- `PICKUP_TYPES.WEAPON_SHOTGUN` --> `'weapon_shotgun'`
- `PICKUP_TYPES.WEAPON_CANNON` --> `'weapon_cannon'`
- `PICKUP_TYPES.WEAPON_LAUNCHER` --> `'weapon_launcher'`
- `PICKUP_TYPES.WEAPON_FLAMETHROWER` --> `'weapon_flamethrower'`

The design doc may say "weapon (shotgun)" -- translate to `PICKUP_TYPES.WEAPON_SHOTGUN`.

### "Triggers" --> `addTrigger()` calls

Each row in the trigger table maps to one `addTrigger()` call. Use `TRIGGER_ACTIONS` constants for the action field.

For common patterns, prefer the convenience methods:
- **Ambush spawns:** `editor.ambush(LEVEL_ID, zone, enemies, { roomId })` -- creates the trigger AND the linked entities
- **Arena lock/wave/unlock:** `editor.setupArenaWaves(LEVEL_ID, roomId, zone, waves)` -- creates lock trigger, wave triggers, unlock trigger, and all wave entities
- **Boss intro dialogue:** `editor.bossIntro(LEVEL_ID, zone, text, { roomId })`
- **Lore dialogue:** `editor.dialogue(LEVEL_ID, zone, text, { roomId })`

For triggers that do not fit a convenience method (e.g., `ambientChange` on boss HP threshold), use `addTrigger()` directly.

### "Environment Zones" --> `addEnvironmentZone()` calls

```typescript
editor.addEnvironmentZone(LEVEL_ID, {
  envType: ENV_TYPES.FOG,
  boundsX: 0, boundsZ: 0, boundsW: 40, boundsH: 50,
  intensity: 0.8,
});
```

Use `ENV_TYPES` constants: `WIND`, `ICE`, `WATER`, `FIRE`, `FOG`, `FROST`, `VOID`, `BLOOD`, `ILLUSION`, `CRUSHING`.

### "Player Spawn" --> `setPlayerSpawn()` call

```typescript
editor.setPlayerSpawn(LEVEL_ID, x, z, facing);
```

The design doc gives position as `(x, z)` and facing as a radian value (e.g., `Math.PI` for south).

### "Theme Configuration" --> `createTheme()` call

The design doc includes a literal TypeScript snippet for `createTheme()`. Copy it directly into the build script, substituting the `THEME_ID` constant for the first argument.

---

## 3. Coordinate Translation Rules

All coordinates in the LevelEditor API are **grid coordinates** (integers). The runtime multiplies by `CELL_SIZE` (2) to get world units. Never pass world coordinates to LevelEditor methods.

### Room Placement table --> `room()` params

The Room Placement table gives `(X, Z, W, H)`. Use these values directly as the `x`, `z`, `w`, `h` arguments to `editor.room()`:

```
| Vestibule | 16 | 2 | 8 | 6 | ...
```

becomes:

```typescript
editor.room(LEVEL_ID, 'vestibule', 16, 2, 8, 6, { ... });
```

### Calculating entity positions from room bounds

When the design doc says a position relative to a room, calculate from the room's grid bounds `(X, Z, W, H)`:

| Design doc says | Grid X | Grid Z |
|----------------|--------|--------|
| "center of room" | `X + Math.floor(W / 2)` | `Z + Math.floor(H / 2)` |
| "NE corner" | `X + W - 2` | `Z + 1` |
| "NW corner" | `X + 1` | `Z + 1` |
| "SE corner" | `X + W - 2` | `Z + H - 2` |
| "SW corner" | `X + 1` | `Z + H - 2` |
| "near south exit" | `X + Math.floor(W / 2)` | `Z + H - 2` |
| "near north exit" | `X + Math.floor(W / 2)` | `Z + 1` |

**Stay 1 cell away from walls.** Entities at the exact room boundary will be inside a wall after grid compilation. Use `X + 1` to `X + W - 2` for valid X range, and `Z + 1` to `Z + H - 2` for valid Z range.

### Trigger zones

The trigger table gives `(x, z, w, h)` directly. Use as-is:

```
| T1 | Bone Pit | (3, 16, 6, 4) | spawnWave | ...
```

becomes:

```typescript
editor.addTrigger(LEVEL_ID, {
  action: TRIGGER_ACTIONS.SPAWN_WAVE,
  zoneX: 3, zoneZ: 16, zoneW: 6, zoneH: 4,
  ...
});
```

### Player spawn

The Player Spawn section gives a position like `(20, 5)`. Use directly:

```typescript
editor.setPlayerSpawn(LEVEL_ID, 20, 5, Math.PI);
```

### Spreading entities within a room

When placing multiple entities (e.g., "ammo x 2, spread"), distribute them within the room bounds. A simple pattern for `count` entities in a room `(X, Z, W, H)`:

```typescript
// Spread N entities across the room interior
const interiorX = X + 1;
const interiorZ = Z + 1;
const interiorW = W - 2;
const interiorH = H - 2;
for (let i = 0; i < count; i++) {
  const ex = interiorX + Math.floor((interiorW * (i + 1)) / (count + 1));
  const ez = interiorZ + Math.floor(interiorH / 2);
  editor.spawnPickup(LEVEL_ID, type, ex, ez);
}
```

---

## 4. Worked Example: Circle 1 (Limbo)

This is the complete build script derived from `docs/circles/01-limbo.md`. Every section of the design doc is accounted for.

```typescript
import BetterSqlite3 from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import {
  LevelEditor,
  MapCell,
  TRIGGER_ACTIONS,
  ROOM_TYPES,
  CONNECTION_TYPES,
  ENV_TYPES,
  ENEMY_TYPES,
  PICKUP_TYPES,
} from '../src/db/LevelEditor';
import { migrateAndSeed } from '../src/db/migrate';
import * as schema from '../src/db/schema';

const LEVEL_ID = 'circle-1-limbo';
const THEME_ID = 'circle-1-limbo';

export async function buildCircle1(dbPath: string) {
  const sqliteDb = new BetterSqlite3(dbPath);
  const db = drizzle(sqliteDb, { schema });
  await migrateAndSeed(db);
  const editor = new LevelEditor(db);

  // =========================================================================
  // 1. THEME (from "Theme Configuration" section)
  // =========================================================================

  editor.createTheme(THEME_ID, {
    name: 'limbo',
    displayName: 'LIMBO \u2014 The Circle of Ignorance',
    primaryWall: MapCell.WALL_STONE,
    accentWalls: [MapCell.WALL_STONE],  // No accent variation -- monotone
    fogDensity: 0.08,
    fogColor: '#0d0d1a',
    ambientColor: '#2233aa',
    ambientIntensity: 0.15,
    skyColor: '#000000',
    particleEffect: null,               // No particles -- stillness
    enemyTypes: ['hellgoat'],
    enemyDensity: 0.8,                  // Below average -- sparse, deliberate
    pickupDensity: 0.5,                 // Scarce -- first circle teaches resource awareness
  });

  // =========================================================================
  // 2. LEVEL (from "Identity" + "Grid Dimensions" sections)
  // =========================================================================

  editor.createLevel(LEVEL_ID, {
    name: 'Circle 1: Limbo',
    levelType: 'circle',
    width: 40,           // "40 wide"
    depth: 50,           // "50 deep"
    floor: 1,
    themeId: THEME_ID,
    circleNumber: 1,
    sin: 'Ignorance',
    guardian: 'Il Vecchio',
  });

  // =========================================================================
  // 3. ROOMS (from "Room Placement" table, in sortOrder)
  // =========================================================================
  //
  // Table from design doc:
  //   | Room                 | X  | Z  | W  | H  | Type          | Elevation    | sortOrder |
  //   | Vestibule            | 16 |  2 |  8 |  6 | exploration   | 0            | 0         |
  //   | Fog Hall             | 14 | 12 | 12 | 10 | exploration   | 0            | 1         |
  //   | Crypt                | 30 | 14 |  6 |  6 | secret        | 0            | 2         |
  //   | Bone Pit             |  2 | 14 |  8 |  8 | platforming   | 0 (edges=1)  | 3         |
  //   | Columns              | 15 | 26 | 10 | 12 | arena         | 0            | 4         |
  //   | Il Vecchio's Chamber | 14 | 42 | 12 | 12 | boss          | -1 (below)   | 5         |

  const vestibuleId = editor.room(LEVEL_ID, 'vestibule', 16, 2, 8, 6, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 0,
  });

  const fogHallId = editor.room(LEVEL_ID, 'fog_hall', 14, 12, 12, 10, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 1,
  });

  const cryptId = editor.room(LEVEL_ID, 'crypt', 30, 14, 6, 6, {
    roomType: ROOM_TYPES.SECRET,
    elevation: 0,
    sortOrder: 2,
  });

  const bonePitId = editor.room(LEVEL_ID, 'bone_pit', 2, 14, 8, 8, {
    roomType: ROOM_TYPES.PLATFORMING,
    elevation: 0,
    sortOrder: 3,
  });

  const columnsId = editor.room(LEVEL_ID, 'columns', 15, 26, 10, 12, {
    roomType: ROOM_TYPES.ARENA,
    elevation: 0,
    sortOrder: 4,
  });

  const bossChamberId = editor.room(LEVEL_ID, 'il_vecchio_chamber', 14, 42, 12, 12, {
    roomType: ROOM_TYPES.BOSS,
    elevation: -1,
    sortOrder: 5,
  });

  // =========================================================================
  // 4. CONNECTIONS (from "Connections" table)
  // =========================================================================
  //
  // Table from design doc:
  //   | From       | To                   | Type     | Width | Notes                      |
  //   | Vestibule  | Fog Hall             | corridor | 3     | Wide, welcoming            |
  //   | Fog Hall   | Crypt                | secret   | 2     | WALL_SECRET at boundary    |
  //   | Fog Hall   | Bone Pit             | corridor | 2     | Side branch (optional)     |
  //   | Fog Hall   | Columns              | corridor | 2     | Main path forward          |
  //   | Columns    | Il Vecchio's Chamber | stairs   | 3     | Descending stairs          |

  // Vestibule -> Fog Hall (corridor, width 3)
  editor.corridor(LEVEL_ID, vestibuleId, fogHallId, 3);

  // Fog Hall -> Crypt (secret, width 2)
  editor.connect(LEVEL_ID, fogHallId, cryptId, {
    connectionType: CONNECTION_TYPES.SECRET,
    corridorWidth: 2,
  });

  // Fog Hall -> Bone Pit (corridor, width 2)
  editor.corridor(LEVEL_ID, fogHallId, bonePitId, 2);

  // Fog Hall -> Columns (corridor, width 2)
  editor.corridor(LEVEL_ID, fogHallId, columnsId, 2);

  // Columns -> Il Vecchio's Chamber (stairs, width 3, descending 0 -> -1)
  editor.connect(LEVEL_ID, columnsId, bossChamberId, {
    connectionType: CONNECTION_TYPES.STAIRS,
    corridorWidth: 3,
    fromElevation: 0,
    toElevation: -1,
  });

  // =========================================================================
  // 5. ENTITIES: ENEMIES (from "Enemies" table)
  // =========================================================================
  //
  // Fog Hall: 3 hellgoat patrol (pre-placed, not trigger-spawned)
  //   Room bounds: (14, 12, 12, 10) -> interior: x=[15..24], z=[13..20]
  //   Patrol in a triangle loop within the room

  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 17, 15, {
    roomId: fogHallId,
    patrol: [{ x: 17, z: 15 }, { x: 23, z: 15 }, { x: 20, z: 20 }],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 23, 15, {
    roomId: fogHallId,
    patrol: [{ x: 23, z: 15 }, { x: 20, z: 20 }, { x: 17, z: 15 }],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 20, 20, {
    roomId: fogHallId,
    patrol: [{ x: 20, z: 20 }, { x: 17, z: 15 }, { x: 23, z: 15 }],
  });

  // Bone Pit: 3 hellgoat ambush (trigger-spawned)
  //   Room bounds: (2, 14, 8, 8) -> interior: x=[3..8], z=[15..20]
  //   Trigger zone from table: (3, 16, 6, 4)
  //   Uses the ambush() convenience method which creates trigger + linked entities

  editor.ambush(
    LEVEL_ID,
    { x: 3, z: 16, w: 6, h: 4 },
    [
      { type: ENEMY_TYPES.HELLGOAT, x: 4, z: 17 },
      { type: ENEMY_TYPES.HELLGOAT, x: 6, z: 19 },
      { type: ENEMY_TYPES.HELLGOAT, x: 8, z: 17 },
    ],
    { roomId: bonePitId },
  );

  // Columns: 2 waves of 3 hellgoat each (arena lock + wave pattern)
  //   Room bounds: (15, 26, 10, 12) -> interior: x=[16..23], z=[27..36]
  //   Trigger zone from table: (17, 28, 6, 6)
  //   Wave 1: spawn from edges, converge
  //   Wave 2: spawn from corners, aggressive
  //   Uses setupArenaWaves() which creates lock, wave spawns, and unlock triggers

  const arenaResult = editor.setupArenaWaves(
    LEVEL_ID,
    columnsId,
    { x: 17, z: 28, w: 6, h: 6 },
    [
      // Wave 1: 3 hellgoats from edges
      [
        { type: ENEMY_TYPES.HELLGOAT, x: 16, z: 32 },
        { type: ENEMY_TYPES.HELLGOAT, x: 20, z: 27 },
        { type: ENEMY_TYPES.HELLGOAT, x: 23, z: 32 },
      ],
      // Wave 2: 3 hellgoats from corners
      [
        { type: ENEMY_TYPES.HELLGOAT, x: 16, z: 27 },
        { type: ENEMY_TYPES.HELLGOAT, x: 23, z: 27 },
        { type: ENEMY_TYPES.HELLGOAT, x: 20, z: 36 },
      ],
    ],
  );

  // Boss chamber: Il Vecchio boss entity
  //   Room bounds: (14, 42, 12, 12) -> center: (20, 48)
  //   Boss faces north (toward entrance), so facing = 0

  editor.spawnBoss(LEVEL_ID, 'il_vecchio', 20, 48, {
    roomId: bossChamberId,
    facing: 0,
  });

  // =========================================================================
  // 5b. ENTITIES: PICKUPS (from "Pickups" table)
  // =========================================================================

  // Vestibule: ammo near south exit
  //   Room bounds: (16, 2, 8, 6) -> south exit area: x=20, z=6
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 20, 6);

  // Fog Hall: ammo at center
  //   Room bounds: (14, 12, 12, 10) -> center: (20, 17)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 20, 17);

  // Crypt: weapon (shotgun) at center
  //   Room bounds: (30, 14, 6, 6) -> center: (33, 17)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.WEAPON_SHOTGUN, 33, 17);

  // Crypt: ammo near scroll
  //   Near the scroll prop, offset slightly: (34, 16)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 34, 16);

  // Bone Pit: ammo x 2, spread
  //   Room bounds: (2, 14, 8, 8) -> interior spread
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 4, 18);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 8, 18);

  // Bone Pit: health at center
  //   Room center: (6, 18)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 6, 18);

  // Columns: ammo at north (between waves)
  //   Room bounds: (15, 26, 10, 12) -> north: (20, 27)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 20, 27);

  // Columns: health at south (between waves)
  //   South: (20, 36)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 20, 36);

  // Boss chamber: ammo x 2 at NE and SW corners
  //   Room bounds: (14, 42, 12, 12)
  //   NE corner: (24, 43), SW corner: (15, 52)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 24, 43);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 15, 52);

  // Boss chamber: health x 2 at NW and SE corners
  //   NW corner: (15, 43), SE corner: (24, 52)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 15, 43);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 24, 52);

  // =========================================================================
  // 5c. ENTITIES: PROPS (from "Props" table)
  // =========================================================================

  // --- Vestibule (bounds: 16, 2, 8, 6) ---
  // 2x limbo-torch-bracket on walls
  editor.spawnProp(LEVEL_ID, 'limbo-torch-bracket', 17, 3, {
    roomId: vestibuleId,
    surfaceAnchor: { face: 'west', offsetX: 0, offsetY: 1.5, offsetZ: 0, rotation: [0, 0, 0], scale: 1.0 },
  });
  editor.spawnProp(LEVEL_ID, 'limbo-torch-bracket', 22, 3, {
    roomId: vestibuleId,
    surfaceAnchor: { face: 'east', offsetX: 0, offsetY: 1.5, offsetZ: 0, rotation: [0, 0, 0], scale: 1.0 },
  });
  // 1x limbo-inscription-tablet
  editor.spawnProp(LEVEL_ID, 'limbo-inscription-tablet', 20, 3, { roomId: vestibuleId });
  // 2x limbo-vase-rubble
  editor.spawnProp(LEVEL_ID, 'limbo-vase-rubble', 18, 6, { roomId: vestibuleId });
  editor.spawnProp(LEVEL_ID, 'limbo-vase-rubble', 22, 6, { roomId: vestibuleId });

  // --- Fog Hall (bounds: 14, 12, 12, 10) ---
  // 2x limbo-torch-bracket
  editor.spawnProp(LEVEL_ID, 'limbo-torch-bracket', 15, 14, {
    roomId: fogHallId,
    surfaceAnchor: { face: 'west', offsetX: 0, offsetY: 1.5, offsetZ: 0, rotation: [0, 0, 0], scale: 1.0 },
  });
  editor.spawnProp(LEVEL_ID, 'limbo-torch-bracket', 24, 14, {
    roomId: fogHallId,
    surfaceAnchor: { face: 'east', offsetX: 0, offsetY: 1.5, offsetZ: 0, rotation: [0, 0, 0], scale: 1.0 },
  });
  // 2x limbo-cage
  editor.spawnProp(LEVEL_ID, 'limbo-cage', 17, 18, { roomId: fogHallId });
  editor.spawnProp(LEVEL_ID, 'limbo-cage', 23, 18, { roomId: fogHallId });
  // 3x limbo-vase-rubble
  editor.spawnProp(LEVEL_ID, 'limbo-vase-rubble', 16, 20, { roomId: fogHallId });
  editor.spawnProp(LEVEL_ID, 'limbo-vase-rubble', 20, 13, { roomId: fogHallId });
  editor.spawnProp(LEVEL_ID, 'limbo-vase-rubble', 24, 20, { roomId: fogHallId });

  // --- Crypt (bounds: 30, 14, 6, 6) ---
  // 1x limbo-torch-bracket
  editor.spawnProp(LEVEL_ID, 'limbo-torch-bracket', 31, 15, {
    roomId: cryptId,
    surfaceAnchor: { face: 'west', offsetX: 0, offsetY: 1.5, offsetZ: 0, rotation: [0, 0, 0], scale: 1.0 },
  });
  // 1x limbo-stone-lectern (for scroll)
  editor.spawnProp(LEVEL_ID, 'limbo-stone-lectern', 33, 16, { roomId: cryptId });

  // --- Bone Pit (bounds: 2, 14, 8, 8) ---
  // 3x limbo-chain-cluster (hanging from ceiling)
  editor.spawnProp(LEVEL_ID, 'limbo-chain-cluster', 4, 16, { roomId: bonePitId });
  editor.spawnProp(LEVEL_ID, 'limbo-chain-cluster', 6, 18, { roomId: bonePitId });
  editor.spawnProp(LEVEL_ID, 'limbo-chain-cluster', 8, 20, { roomId: bonePitId });
  // 1x limbo-bone-pile
  editor.spawnProp(LEVEL_ID, 'limbo-bone-pile', 5, 20, { roomId: bonePitId });

  // --- Columns (bounds: 15, 26, 10, 12) ---
  // 6x limbo-ancient-pillar (structural, break LOS)
  //   Arranged in a 2x3 grid within the room interior
  editor.spawnProp(LEVEL_ID, 'limbo-ancient-pillar', 18, 29, { roomId: columnsId });
  editor.spawnProp(LEVEL_ID, 'limbo-ancient-pillar', 22, 29, { roomId: columnsId });
  editor.spawnProp(LEVEL_ID, 'limbo-ancient-pillar', 18, 32, { roomId: columnsId });
  editor.spawnProp(LEVEL_ID, 'limbo-ancient-pillar', 22, 32, { roomId: columnsId });
  editor.spawnProp(LEVEL_ID, 'limbo-ancient-pillar', 18, 35, { roomId: columnsId });
  editor.spawnProp(LEVEL_ID, 'limbo-ancient-pillar', 22, 35, { roomId: columnsId });
  // 2x limbo-torch-bracket
  editor.spawnProp(LEVEL_ID, 'limbo-torch-bracket', 16, 28, {
    roomId: columnsId,
    surfaceAnchor: { face: 'west', offsetX: 0, offsetY: 1.5, offsetZ: 0, rotation: [0, 0, 0], scale: 1.0 },
  });
  editor.spawnProp(LEVEL_ID, 'limbo-torch-bracket', 23, 28, {
    roomId: columnsId,
    surfaceAnchor: { face: 'east', offsetX: 0, offsetY: 1.5, offsetZ: 0, rotation: [0, 0, 0], scale: 1.0 },
  });

  // --- Boss Chamber (bounds: 14, 42, 12, 12) ---
  // 3x limbo-torch-bracket (2 at entrance, 1 behind boss)
  editor.spawnProp(LEVEL_ID, 'limbo-torch-bracket', 16, 43, {
    roomId: bossChamberId,
    surfaceAnchor: { face: 'west', offsetX: 0, offsetY: 1.5, offsetZ: 0, rotation: [0, 0, 0], scale: 1.0 },
  });
  editor.spawnProp(LEVEL_ID, 'limbo-torch-bracket', 24, 43, {
    roomId: bossChamberId,
    surfaceAnchor: { face: 'east', offsetX: 0, offsetY: 1.5, offsetZ: 0, rotation: [0, 0, 0], scale: 1.0 },
  });
  editor.spawnProp(LEVEL_ID, 'limbo-torch-bracket', 20, 52, {
    roomId: bossChamberId,
    surfaceAnchor: { face: 'south', offsetX: 0, offsetY: 1.5, offsetZ: 0, rotation: [0, 0, 0], scale: 1.0 },
  });
  // 2x limbo-banner-tattered
  editor.spawnProp(LEVEL_ID, 'limbo-banner-tattered', 17, 52, { roomId: bossChamberId });
  editor.spawnProp(LEVEL_ID, 'limbo-banner-tattered', 23, 52, { roomId: bossChamberId });

  // =========================================================================
  // 6. TRIGGERS (from "Triggers" table)
  // =========================================================================
  //
  // NOTE: T1 (Bone Pit ambush) was already created by editor.ambush() above.
  // NOTE: T2, T3, T4, T5 (Columns arena) were already created by editor.setupArenaWaves() above.
  //
  // Remaining triggers to create manually:

  // T6: ambientChange on wave 2 clear (fog lifts to 0.04)
  //   The design says "On wave 2 clear" -- this is a conditional trigger, not zone-based.
  //   Use the Columns room bounds as the zone.
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 15,
    zoneZ: 26,
    zoneW: 10,
    zoneH: 12,
    roomId: columnsId,
    once: true,
    actionData: { fogDensity: 0.04, condition: 'allEnemiesKilled' },
  });

  // T7: bossIntro -- player enters boss chamber entrance zone
  //   Zone from table: (15, 43, 10, 2)
  editor.bossIntro(
    LEVEL_ID,
    { x: 15, z: 43, w: 10, h: 2 },
    'You carry what is not yours, little goat. I have watched the gate since before memory. All who pass carry sin. You carry more than most.',
    { roomId: bossChamberId },
  );

  // T8: lockDoors on boss intro (with 3s delay)
  //   Zone from table: (15, 43, 10, 2)
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.LOCK_DOORS,
    zoneX: 15,
    zoneZ: 43,
    zoneW: 10,
    zoneH: 2,
    roomId: bossChamberId,
    once: true,
    delay: 3,
  });

  // T9: ambientChange when boss HP < 50% (fog surges to 0.12)
  //   No zone -- use boss chamber bounds as the zone
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 14,
    zoneZ: 42,
    zoneW: 12,
    zoneH: 12,
    roomId: bossChamberId,
    once: true,
    actionData: { fogDensity: 0.12, fogColor: '#0a0a15', condition: 'bossHpBelow50' },
  });

  // =========================================================================
  // 7. ENVIRONMENT ZONES (from "Environment Zones" table)
  // =========================================================================

  // Global fog: full level, intensity 0.8
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.FOG,
    boundsX: 0,
    boundsZ: 0,
    boundsW: 40,
    boundsH: 50,
    intensity: 0.8,
  });

  // Bone Pit wind: subtle updraft
  //   Bone Pit room bounds: (2, 14, 8, 8)
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.WIND,
    boundsX: 2,
    boundsZ: 14,
    boundsW: 8,
    boundsH: 8,
    intensity: 0.3,
    directionX: 0,
    directionZ: -1,   // Updraft (negative Z = upward in game convention)
  });

  // =========================================================================
  // 8. PLAYER SPAWN (from "Player Spawn" section)
  // =========================================================================
  //   Position: (20, 5) -- center of Vestibule
  //   Facing: pi (south -- facing toward Fog Hall)

  editor.setPlayerSpawn(LEVEL_ID, 20, 5, Math.PI);

  // =========================================================================
  // 9. COMPILE GRID
  // =========================================================================

  editor.compile(LEVEL_ID);

  // =========================================================================
  // 10. VALIDATE
  // =========================================================================

  const result = editor.validate(LEVEL_ID);
  if (!result.valid) {
    console.error('Validation errors:', result.errors);
    throw new Error('Circle 1 (Limbo) level validation failed');
  }
  console.log('Circle 1 (Limbo) built successfully');
  if (result.warnings.length > 0) {
    console.log('Warnings:', result.warnings);
  }
}
```

---

## 5. Common Mistakes

### Entities placed outside room bounds

**Wrong:**
```typescript
// Room is at (16, 2, 8, 6), so valid interior is x=[17..22], z=[3..6]
editor.spawnEnemy(LEVEL_ID, 'hellgoat', 16, 2, { roomId }); // ON the wall!
```

**Right:**
```typescript
// Center of room: x = 16 + floor(8/2) = 20, z = 2 + floor(6/2) = 5
editor.spawnEnemy(LEVEL_ID, 'hellgoat', 20, 5, { roomId });
```

**Rule:** Entity positions must be at least 1 cell inside the room boundary. For a room at `(X, Z, W, H)`, the valid entity range is `x=[X+1..X+W-2]`, `z=[Z+1..Z+H-2]`.

### Missing connections between rooms

The validator will report: `Room 'crypt' is not reachable from spawn room 'vestibule'.`

Always cross-check: every room in the Room Placement table must appear in at least one row of the Connections table. If the design doc shows a room connected, you must call `corridor()` or `connect()` for it.

### Spawn point not inside a room

The validator will report: `Spawn point (20, 1) is not inside any room.`

The spawn position must satisfy `x >= roomX && x < roomX + roomW && z >= roomZ && z < roomZ + roomH` for at least one room. Double-check by looking at the room that should contain the spawn:

```
Vestibule: (16, 2, 8, 6) -> valid spawn x=[16..23], z=[2..7]
Spawn: (20, 5) -> 16 <= 20 < 24 and 2 <= 5 < 8 -> VALID
```

### Using world coordinates instead of grid coordinates

**Wrong:**
```typescript
// "40 wide" means 40 grid cells, NOT 40 world units
// World units = grid * CELL_SIZE(2), so 40 grid = 80 world
editor.setPlayerSpawn(LEVEL_ID, 40, 10); // This is grid (40,10) -- OUTSIDE a 40-wide level!
```

**Right:**
```typescript
editor.setPlayerSpawn(LEVEL_ID, 20, 5); // Grid coordinates, within bounds
```

The LevelEditor API uses grid coordinates exclusively. CELL_SIZE conversion happens at runtime in LevelDbAdapter.

### Forgetting to call compile() before validate()

`compile()` rasterizes rooms and connections into the binary grid BLOB stored on the level row. If you skip it, the level will have no grid data and will fail to render at runtime. Always call `compile()` after all rooms and connections are defined, before `validate()`.

However, note that `validate()` itself does not require the compiled grid -- it checks structural integrity (room connectivity, entity placement, spawn point). You can technically validate without compiling, but you should always compile first in a build script because validation success + missing grid = a level that passes checks but cannot render.

### Not handling secret connections

**Wrong:**
```typescript
// Secret rooms need CONNECTION_TYPES.SECRET, not CORRIDOR
editor.corridor(LEVEL_ID, fogHallId, cryptId, 2);
```

**Right:**
```typescript
editor.connect(LEVEL_ID, fogHallId, cryptId, {
  connectionType: CONNECTION_TYPES.SECRET,
  corridorWidth: 2,
});
```

The `corridor()` convenience method always uses `connectionType: 'corridor'`. For secret, stairs, door, portal, bridge, or jump_pad connections, use `connect()` with the explicit `connectionType`.

### Mixing up room sortOrder values

`sortOrder` controls the rendering and traversal order of rooms. It must match the design doc's sortOrder column exactly. The spawn room should have the lowest sortOrder (typically 0). The boss room should have the highest. Gaps are allowed but sequential ordering is preferred.

### Forgetting to link trigger-spawned enemies to their trigger

If the design doc says enemies spawn from a trigger (ambush, wave), those entities must have a `triggerId` reference. The convenience methods `ambush()` and `setupArenaWaves()` handle this automatically. If you use `addTrigger()` + `spawnEnemy()` manually, you must pass the trigger ID:

```typescript
const triggerId = editor.addTrigger(LEVEL_ID, { ... });
editor.spawnEnemy(LEVEL_ID, 'hellgoat', x, z, {
  roomId,
  // Without this, the enemy spawns immediately instead of waiting for the trigger
  triggerId,  // <-- REQUIRED for trigger-spawned enemies
});
```

### Overlapping rooms (warning, not error)

The validator emits a warning if two rooms have overlapping bounds. This is usually a mistake in coordinate translation. Check the Room Placement table carefully -- rooms should not share grid cells unless the design doc explicitly says they overlap (rare).

### Connection direction matters for DAG validation

Connections are directional: `fromRoomId -> toRoomId`. The validator checks for cycles in the directed graph. The design doc's connection table lists "From" and "To" -- follow that direction exactly. Undirected reachability (BFS) uses both directions, but cycle detection uses only the forward direction.

**Wrong:**
```typescript
// Design doc says: Columns -> Il Vecchio's Chamber
// But you wrote it backwards:
editor.connect(LEVEL_ID, bossChamberId, columnsId, { ... });
```

**Right:**
```typescript
editor.connect(LEVEL_ID, columnsId, bossChamberId, { ... });
```
