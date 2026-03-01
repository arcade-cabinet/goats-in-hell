---
title: "Circle 1: Limbo — Implementation Plan"
status: implemented
created: "2026-03-01"
updated: "2026-03-01"
domain: plans
plan_type: implementation
related:
  - docs/circles/01-limbo.md
  - docs/plans/2026-03-01-circle-1-limbo-design.md
  - docs/agents/level-editor-api.md
---

# Circle 1: Limbo — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Author Circle 1 (Limbo) into the SQLite level database using the LevelEditor API, producing a playable 6-room level that loads and renders via the existing pipeline.

**Architecture:** A single `buildCircle1(db)` function inserts theme, level, rooms, connections, entities, triggers, and environment zones into the DB. The GridCompiler compiles the grid BLOB. The PlaytestRunner validates the AI can navigate from spawn to the boss chamber.

**Tech Stack:** TypeScript, better-sqlite3, Drizzle ORM, LevelEditor API, GridCompiler, PlaytestRunner

---

## Spatial Reference

Every room is a 3D volume. Grid coordinates are (X, Z) in cells. Elevation is the Y axis. `CELL_SIZE=2` scales grid→world. Entity positions are grid coordinates; the adapter multiplies by `CELL_SIZE` for world space. The `elevation` field on entities and rooms controls the Y position.

### Room interiors (X range, Z range, elevation)

| Room | X min..max | Z min..max | W×H cells | Elevation | Notes |
|------|-----------|-----------|-----------|-----------|-------|
| Vestibule | 16..23 | 2..7 | 8×6 | 0 | Safe start room |
| Fog Hall | 14..25 | 12..21 | 12×10 | 0 | Main hub, 3 patrol enemies |
| Crypt | 30..35 | 14..19 | 6×6 | 0 | Secret room, shotgun |
| Bone Pit | 2..9 | 14..21 | 8×8 | 0 (edges=1) | Elevated perimeter, void center |
| Columns | 15..24 | 26..37 | 10×12 | 0 | Arena, 6 tall columns break LOS |
| Boss Chamber | 14..25 | 42..53 | 12×12 | -1 | Below ground, descend via stairs |

**Grid dimensions: 40 wide × 56 deep** (not 50 — the boss room at Z=42, H=12 extends to Z=53, plus we need a wall ring buffer).

---

### Task 1: Create Circle 1 builder — theme, level, player spawn

**Files:**
- Create: `src/db/circles/circle1-limbo.ts`
- Test: `src/db/__tests__/circle1-limbo.test.ts`

**Step 1: Write the failing test**

```typescript
// src/db/__tests__/circle1-limbo.test.ts
import BetterSqlite3 from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
import { migrateAndSeed } from '../migrate';
import { buildCircle1 } from '../circles/circle1-limbo';
import * as schema from '../schema';

function createTestDb() {
  const sqliteDb = new BetterSqlite3(':memory:');
  const db = drizzle(sqliteDb, { schema });
  return db;
}

describe('Circle 1: Limbo', () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(async () => {
    db = createTestDb();
    await migrateAndSeed(db);
    buildCircle1(db);
  });

  it('creates the limbo theme with dense fog', () => {
    const theme = db.select().from(schema.themes)
      .where(eq(schema.themes.id, 'circle-1-limbo')).get();
    expect(theme).toBeDefined();
    expect(theme!.name).toBe('limbo');
    expect(theme!.fogDensity).toBe(0.08);
    expect(theme!.fogColor).toBe('#0d0d1a');
    expect(theme!.ambientColor).toBe('#2233aa');
    expect(theme!.ambientIntensity).toBe(0.15);
    expect(theme!.primaryWall).toBe(1); // WALL_STONE
  });

  it('creates the level with correct dimensions', () => {
    const level = db.select().from(schema.levels)
      .where(eq(schema.levels.id, 'circle-1-limbo')).get();
    expect(level).toBeDefined();
    expect(level!.levelType).toBe('circle');
    expect(level!.width).toBe(40);
    expect(level!.depth).toBe(56);
    expect(level!.circleNumber).toBe(1);
    expect(level!.sin).toBe('Ignorance');
    expect(level!.guardian).toBe('il-vecchio');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- --testPathPattern circle1-limbo`
Expected: FAIL with "Cannot find module '../circles/circle1-limbo'"

**Step 3: Write the theme and level metadata**

```typescript
// src/db/circles/circle1-limbo.ts
import { MapCell } from '../../game/levels/LevelGenerator';
import type { DrizzleDb } from '../connection';
import { LevelEditor } from '../LevelEditor';

const LEVEL_ID = 'circle-1-limbo';
const THEME_ID = 'circle-1-limbo';

export function buildCircle1(db: DrizzleDb): void {
  const editor = new LevelEditor(db);

  // Theme — dense fog, cold blue ambient, no particles (stillness)
  editor.createTheme(THEME_ID, {
    name: 'limbo',
    displayName: 'LIMBO — The Circle of Ignorance',
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

  // Level — 40×56 grid
  // (boss room at Z=42, H=12 extends to Z=53; need buffer to Z=55)
  editor.createLevel(LEVEL_ID, {
    name: 'Limbo',
    levelType: 'circle',
    width: 40,
    depth: 56,
    floor: 1,
    themeId: THEME_ID,
    circleNumber: 1,
    sin: 'Ignorance',
    guardian: 'il-vecchio',
  });

  // Player spawn: center of Vestibule, facing south (toward Fog Hall)
  editor.setPlayerSpawn(LEVEL_ID, 20, 5, Math.PI);
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- --testPathPattern circle1-limbo`
Expected: PASS (2 tests)

**Step 5: Commit**

```bash
git add src/db/circles/circle1-limbo.ts src/db/__tests__/circle1-limbo.test.ts
git commit -m "feat(circle-1): theme and level metadata for Limbo"
```

---

### Task 2: Add 6 rooms with elevation and 5 DAG connections

**Files:**
- Modify: `src/db/circles/circle1-limbo.ts`
- Modify: `src/db/__tests__/circle1-limbo.test.ts`

**Step 1: Write the failing tests**

Add to `circle1-limbo.test.ts`:

```typescript
it('creates all 6 rooms', () => {
  const rooms = db.select().from(schema.rooms)
    .where(eq(schema.rooms.levelId, 'circle-1-limbo')).all();
  expect(rooms).toHaveLength(6);

  const names = rooms.map(r => r.name).sort();
  expect(names).toEqual([
    'bone-pit', 'columns', 'crypt',
    'fog-hall', 'il-vecchio-chamber', 'vestibule',
  ]);
});

it('rooms have correct bounds and types', () => {
  const rooms = db.select().from(schema.rooms)
    .where(eq(schema.rooms.levelId, 'circle-1-limbo')).all();
  const byName = Object.fromEntries(rooms.map(r => [r.name, r]));

  // Vestibule: 8×6 at (16, 2)
  expect(byName['vestibule'].boundsX).toBe(16);
  expect(byName['vestibule'].boundsZ).toBe(2);
  expect(byName['vestibule'].boundsW).toBe(8);
  expect(byName['vestibule'].boundsH).toBe(6);
  expect(byName['vestibule'].roomType).toBe('exploration');

  // Boss chamber: 12×12 at (14, 42), elevation -1
  expect(byName['il-vecchio-chamber'].boundsW).toBe(12);
  expect(byName['il-vecchio-chamber'].boundsH).toBe(12);
  expect(byName['il-vecchio-chamber'].roomType).toBe('boss');
  expect(byName['il-vecchio-chamber'].elevation).toBe(-1);

  // Bone Pit: platforming type
  expect(byName['bone-pit'].roomType).toBe('platforming');

  // Crypt: secret type
  expect(byName['crypt'].roomType).toBe('secret');
});

it('creates 5 connections with correct types', () => {
  const connections = db.select().from(schema.connections)
    .where(eq(schema.connections.levelId, 'circle-1-limbo')).all();
  expect(connections).toHaveLength(5);

  const secrets = connections.filter(c => c.connectionType === 'secret');
  expect(secrets).toHaveLength(1);

  const stairs = connections.filter(c => c.connectionType === 'stairs');
  expect(stairs).toHaveLength(1);
  expect(stairs[0].fromElevation).toBe(0);
  expect(stairs[0].toElevation).toBe(-1);
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- --testPathPattern circle1-limbo`
Expected: FAIL — rooms list empty

**Step 3: Add rooms and connections to buildCircle1**

Add after `setPlayerSpawn` in `circle1-limbo.ts`:

```typescript
  // --- Rooms ---
  // Layout diagram: docs/plans/2026-03-01-circle-1-limbo-design.md

  const vestibule = editor.room(LEVEL_ID, 'vestibule', 16, 2, 8, 6, {
    roomType: 'exploration',
    sortOrder: 0,
  });

  const fogHall = editor.room(LEVEL_ID, 'fog-hall', 14, 12, 12, 10, {
    roomType: 'exploration',
    sortOrder: 1,
  });

  const crypt = editor.room(LEVEL_ID, 'crypt', 30, 14, 6, 6, {
    roomType: 'secret',
    sortOrder: 2,
  });

  const bonePit = editor.room(LEVEL_ID, 'bone-pit', 2, 14, 8, 8, {
    roomType: 'platforming',
    sortOrder: 3,
    // Bone Pit: elevated perimeter (elev=1) with void center.
    // The room itself is ground level; elevation logic is handled
    // by floor cell overrides and entity elevation fields.
  });

  const columns = editor.room(LEVEL_ID, 'columns', 15, 26, 10, 12, {
    roomType: 'arena',
    sortOrder: 4,
  });

  const bossRoom = editor.room(LEVEL_ID, 'il-vecchio-chamber', 14, 42, 12, 12, {
    roomType: 'boss',
    elevation: -1,
    sortOrder: 5,
  });

  // --- Connections (DAG edges) ---

  // Vestibule → Fog Hall: wide welcoming corridor
  editor.corridor(LEVEL_ID, vestibule, fogHall, 3);

  // Fog Hall → Crypt: secret wall (WALL_SECRET at boundary)
  editor.connect(LEVEL_ID, fogHall, crypt, {
    connectionType: 'secret',
    corridorWidth: 2,
  });

  // Fog Hall → Bone Pit: side branch (optional exploration)
  editor.corridor(LEVEL_ID, fogHall, bonePit, 2);

  // Fog Hall → Columns: main path forward
  editor.corridor(LEVEL_ID, fogHall, columns, 2);

  // Columns → Boss: descending stairs (elevation 0 → -1)
  editor.connect(LEVEL_ID, columns, bossRoom, {
    connectionType: 'stairs',
    corridorWidth: 3,
    fromElevation: 0,
    toElevation: -1,
  });
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- --testPathPattern circle1-limbo`
Expected: PASS (5 tests)

**Step 5: Commit**

```bash
git add src/db/circles/circle1-limbo.ts src/db/__tests__/circle1-limbo.test.ts
git commit -m "feat(circle-1): 6 rooms with elevation and 5 DAG connections"
```

---

### Task 3: Add enemies and boss — spread across room volume

**Files:**
- Modify: `src/db/circles/circle1-limbo.ts`
- Modify: `src/db/__tests__/circle1-limbo.test.ts`

The 3 Fog Hall patrols must sweep the full 12×10 interior (X=14..25, Z=12..21). Patrol waypoints should hit opposite corners, not cluster at center. The boss is centered in the 12×12 boss chamber at elevation -1.

**Step 1: Write the failing tests**

Add to `circle1-limbo.test.ts`:

```typescript
it('spawns 3 immediate hellgoats in Fog Hall with room-spanning patrols', () => {
  const enemies = db.select().from(schema.entities)
    .where(eq(schema.entities.levelId, 'circle-1-limbo'))
    .all()
    .filter(e => e.spawnCategory === 'enemy' && !e.triggerId);

  expect(enemies).toHaveLength(3);
  expect(enemies.every(e => e.entityType === 'hellgoat')).toBe(true);

  // Each patrol should span at least 6 cells in both X and Z
  for (const enemy of enemies) {
    const patrol = enemy.patrol as Array<{ x: number; z: number }>;
    expect(patrol).toBeDefined();
    expect(patrol.length).toBeGreaterThanOrEqual(3);
    const xs = patrol.map(p => p.x);
    const zs = patrol.map(p => p.z);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThanOrEqual(6);
    expect(Math.max(...zs) - Math.min(...zs)).toBeGreaterThanOrEqual(3);
  }
});

it('spawns Il Vecchio boss at elevation -1', () => {
  const bosses = db.select().from(schema.entities)
    .where(eq(schema.entities.levelId, 'circle-1-limbo'))
    .all()
    .filter(e => e.spawnCategory === 'boss');
  expect(bosses).toHaveLength(1);
  expect(bosses[0].entityType).toBe('il-vecchio');
  expect(bosses[0].elevation).toBe(-1);
  // Boss at center of 12×12 chamber: (20, 48)
  expect(bosses[0].x).toBe(20);
  expect(bosses[0].z).toBe(48);
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- --testPathPattern circle1-limbo`
Expected: FAIL — no enemies or bosses

**Step 3: Add enemies with room-spanning patrols**

Add after connections in `circle1-limbo.ts`:

```typescript
  // --- Enemies ---

  // Fog Hall (X=14..25, Z=12..21): 3 hellgoats on triangle patrols
  // Each patrol sweeps different sectors of the 12×10 room

  // Patrol 1: west-south sweep (covers SW quadrant + NE corner)
  editor.spawnEnemy(LEVEL_ID, 'hellgoat', 15, 13, {
    roomId: fogHall,
    patrol: [
      { x: 15, z: 13 }, // NW corner area
      { x: 24, z: 17 }, // east middle
      { x: 16, z: 20 }, // SW corner area
    ],
  });

  // Patrol 2: east zigzag (covers east wall, sweeps north to south)
  editor.spawnEnemy(LEVEL_ID, 'hellgoat', 24, 13, {
    roomId: fogHall,
    patrol: [
      { x: 24, z: 13 }, // NE corner
      { x: 15, z: 17 }, // west middle
      { x: 24, z: 21 }, // SE corner
    ],
  });

  // Patrol 3: center diagonal (crosses both other patrols)
  editor.spawnEnemy(LEVEL_ID, 'hellgoat', 19, 20, {
    roomId: fogHall,
    patrol: [
      { x: 19, z: 20 }, // south center
      { x: 20, z: 13 }, // north center
      { x: 14, z: 17 }, // far west wall
    ],
  });

  // Boss: Il Vecchio — center of 12×12 chamber at elevation -1
  // (X=14..25, Z=42..53, center = 20, 48)
  editor.addEntity(LEVEL_ID, {
    entityType: 'il-vecchio',
    x: 20,
    z: 48,
    spawnCategory: 'boss',
    roomId: bossRoom,
    elevation: -1,
    facing: 0, // facing north (toward entering player)
  });
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- --testPathPattern circle1-limbo`
Expected: PASS (7 tests)

**Step 5: Commit**

```bash
git add src/db/circles/circle1-limbo.ts src/db/__tests__/circle1-limbo.test.ts
git commit -m "feat(circle-1): enemies with room-spanning patrols and boss"
```

---

### Task 4: Add pickups — spread to corners and edges, use elevation

**Files:**
- Modify: `src/db/circles/circle1-limbo.ts`
- Modify: `src/db/__tests__/circle1-limbo.test.ts`

Pickups placed at room corners and edges, not centers. Boss room uses all 4 corners symmetrically. Bone Pit pickups are at the bottom (elevation 0) while the perimeter walkway is elevation 1.

**Step 1: Write the failing tests**

Add to `circle1-limbo.test.ts`:

```typescript
it('places pickups across room area, not clustered', () => {
  const pickups = db.select().from(schema.entities)
    .where(eq(schema.entities.levelId, 'circle-1-limbo'))
    .all()
    .filter(e => e.spawnCategory === 'pickup');

  expect(pickups.length).toBeGreaterThanOrEqual(12);

  // Boss chamber pickups in 4 distinct corners (X=14..25, Z=42..53)
  const bossPickups = pickups.filter(
    p => p.x >= 14 && p.x <= 25 && p.z >= 42 && p.z <= 53
  );
  expect(bossPickups).toHaveLength(4);
  // Check they span the room — min/max X and Z should be far apart
  const bpXs = bossPickups.map(p => p.x);
  const bpZs = bossPickups.map(p => p.z);
  expect(Math.max(...bpXs) - Math.min(...bpXs)).toBeGreaterThanOrEqual(8);
  expect(Math.max(...bpZs) - Math.min(...bpZs)).toBeGreaterThanOrEqual(8);
});

it('boss chamber pickups are at elevation -1', () => {
  const pickups = db.select().from(schema.entities)
    .where(eq(schema.entities.levelId, 'circle-1-limbo'))
    .all()
    .filter(e => e.spawnCategory === 'pickup' && e.x >= 14 && e.z >= 42);
  expect(pickups.every(p => p.elevation === -1)).toBe(true);
});

it('crypt has shotgun weapon pickup', () => {
  const pickups = db.select().from(schema.entities)
    .where(eq(schema.entities.levelId, 'circle-1-limbo'))
    .all()
    .filter(e => e.spawnCategory === 'pickup');

  const weapons = pickups.filter(p => p.entityType === 'weapon');
  expect(weapons).toHaveLength(1);
  expect(weapons[0].overrides).toEqual(
    expect.objectContaining({ weaponId: 'shotgun' })
  );
});

it('bone pit pickups spread to opposite corners', () => {
  const bpPickups = db.select().from(schema.entities)
    .where(eq(schema.entities.levelId, 'circle-1-limbo'))
    .all()
    .filter(e => e.spawnCategory === 'pickup' && e.x >= 2 && e.x <= 9 && e.z >= 14 && e.z <= 21);

  expect(bpPickups).toHaveLength(3);
  const xs = bpPickups.map(p => p.x);
  expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThanOrEqual(4);
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- --testPathPattern circle1-limbo`
Expected: FAIL — no pickups

**Step 3: Add pickups with spatial spread and elevation**

Add after enemies in `circle1-limbo.ts`:

```typescript
  // --- Pickups ---
  // Placed at room edges/corners, not centers. Elevation matches room.

  // Fog Hall (X=14..25, Z=12..21): ammo near east wall, not dead center
  editor.spawnPickup(LEVEL_ID, 'ammo', 23, 16);

  // Crypt (X=30..35, Z=14..19): shotgun on pedestal + ammo near wall
  editor.addEntity(LEVEL_ID, {
    entityType: 'weapon',
    x: 33, z: 17,
    spawnCategory: 'pickup',
    roomId: crypt,
    overrides: { weaponId: 'shotgun' },
  });
  editor.spawnPickup(LEVEL_ID, 'ammo', 31, 15); // near north wall

  // Bone Pit (X=2..9, Z=14..21): pickups at bottom, spread to corners
  // These lure the player down into the ambush zone
  editor.spawnPickup(LEVEL_ID, 'ammo', 3, 15);   // NW area
  editor.spawnPickup(LEVEL_ID, 'ammo', 8, 20);   // SE area
  editor.spawnPickup(LEVEL_ID, 'health', 5, 18);  // center (the bait)

  // Columns (X=15..24, Z=26..37): resupply in opposite corners
  editor.spawnPickup(LEVEL_ID, 'ammo', 16, 27);   // NW corner
  editor.spawnPickup(LEVEL_ID, 'health', 23, 36);  // SE corner

  // Boss chamber (X=14..25, Z=42..53): symmetric 4-corner layout, elev -1
  editor.addEntity(LEVEL_ID, {
    entityType: 'ammo', x: 24, z: 43,
    spawnCategory: 'pickup', elevation: -1,
    roomId: bossRoom,
  }); // NE
  editor.addEntity(LEVEL_ID, {
    entityType: 'ammo', x: 15, z: 52,
    spawnCategory: 'pickup', elevation: -1,
    roomId: bossRoom,
  }); // SW
  editor.addEntity(LEVEL_ID, {
    entityType: 'health', x: 15, z: 43,
    spawnCategory: 'pickup', elevation: -1,
    roomId: bossRoom,
  }); // NW
  editor.addEntity(LEVEL_ID, {
    entityType: 'health', x: 24, z: 52,
    spawnCategory: 'pickup', elevation: -1,
    roomId: bossRoom,
  }); // SE
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- --testPathPattern circle1-limbo`
Expected: PASS (11 tests)

**Step 5: Commit**

```bash
git add src/db/circles/circle1-limbo.ts src/db/__tests__/circle1-limbo.test.ts
git commit -m "feat(circle-1): pickups spread to room corners with elevation"
```

---

### Task 5: Add props — wall-mounted torches, floor scatter, hanging chains

**Files:**
- Modify: `src/db/circles/circle1-limbo.ts`
- Modify: `src/db/__tests__/circle1-limbo.test.ts`

Props use `surfaceAnchor` for wall-mounted items (torches, banners) with `offsetY` for vertical placement. Floor props (vases, cages, barrels) sit at room elevation. Chains hang from ceiling (`offsetY` high). The 6 columns in the arena are structural props at specific grid positions.

**Step 1: Write the failing tests**

Add to `circle1-limbo.test.ts`:

```typescript
it('places props in every room', () => {
  const props = db.select().from(schema.entities)
    .where(eq(schema.entities.levelId, 'circle-1-limbo'))
    .all()
    .filter(e => e.spawnCategory === 'prop');

  // At least: 5 vestibule + 7 fog hall + 3 crypt + 4 bone pit
  // + 8 columns + 5 boss = 32 props minimum
  expect(props.length).toBeGreaterThanOrEqual(30);
});

it('wall-mounted torches have surfaceAnchor with offsetY', () => {
  const props = db.select().from(schema.entities)
    .where(eq(schema.entities.levelId, 'circle-1-limbo'))
    .all()
    .filter(e => e.entityType === 'prop_torch');

  expect(props.length).toBeGreaterThanOrEqual(10);

  // Every torch should have a surface anchor with Y offset > 0
  for (const torch of props) {
    expect(torch.surfaceAnchor).toBeDefined();
    const anchor = torch.surfaceAnchor!;
    expect(anchor.offsetY).toBeGreaterThan(0);
    expect(['north', 'south', 'east', 'west']).toContain(anchor.face);
  }
});

it('columns room has 6 structural column props', () => {
  const columnProps = db.select().from(schema.entities)
    .where(eq(schema.entities.levelId, 'circle-1-limbo'))
    .all()
    .filter(e => e.entityType === 'prop_column');

  expect(columnProps).toHaveLength(6);

  // Columns arranged in 2×3 grid pattern
  const xs = columnProps.map(p => p.x);
  const zs = columnProps.map(p => p.z);
  expect(new Set(xs).size).toBe(2);  // 2 distinct X positions
  expect(new Set(zs).size).toBe(3);  // 3 distinct Z positions
});

it('bone pit has hanging chains at ceiling height', () => {
  const chains = db.select().from(schema.entities)
    .where(eq(schema.entities.levelId, 'circle-1-limbo'))
    .all()
    .filter(e => e.entityType === 'prop_chain');

  expect(chains).toHaveLength(3);
  // Chains hang from ceiling — high offsetY
  for (const chain of chains) {
    expect(chain.surfaceAnchor).toBeDefined();
    expect(chain.surfaceAnchor!.offsetY).toBeGreaterThanOrEqual(3);
  }
});

it('boss chamber torches create backlit silhouette', () => {
  const bossProps = db.select().from(schema.entities)
    .where(eq(schema.entities.levelId, 'circle-1-limbo'))
    .all()
    .filter(e => e.spawnCategory === 'prop' && e.z >= 42);

  const torches = bossProps.filter(e => e.entityType === 'prop_torch');
  // 2 at entrance + 1 behind boss = 3
  expect(torches).toHaveLength(3);

  // The torch behind the boss should be at high Z (near back wall)
  const backTorch = torches.filter(t => t.z >= 52);
  expect(backTorch).toHaveLength(1);
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- --testPathPattern circle1-limbo`
Expected: FAIL — no props

**Step 3: Add props to buildCircle1**

Helper for wall torches (reused across rooms):

```typescript
  // --- Props ---
  // surfaceAnchor.offsetY: torches at 2.5 units (eye level),
  // chains at 4.0 (ceiling), banners at 3.0 (above eye)

  const TORCH_Y = 2.5;
  const CHAIN_Y = 4.0;
  const BANNER_Y = 3.0;

  function torch(x: number, z: number, face: string, roomId?: string) {
    editor.spawnProp(LEVEL_ID, 'prop_torch', x, z, {
      roomId,
      surfaceAnchor: {
        face,
        offsetX: 0, offsetY: TORCH_Y, offsetZ: 0,
        rotation: [0, 0, 0],
        scale: 1.0,
      },
    });
  }

  // -- Vestibule (X=16..23, Z=2..7) --
  // 2 torches on side walls, 1 scroll on north wall, 2 vases near exit
  torch(16, 4, 'west', vestibule);    // west wall, mid-height
  torch(23, 4, 'east', vestibule);    // east wall, mid-height
  editor.spawnProp(LEVEL_ID, 'prop_scroll', 20, 2, {
    roomId: vestibule,
    surfaceAnchor: {
      face: 'north', offsetX: 0, offsetY: 1.5, offsetZ: 0,
      rotation: [0, 0, 0], scale: 1.0,
    },
    overrides: {
      text: 'Per me si va ne la città dolente, per me si va ne l\'etterno dolore, per me si va tra la perduta gente.',
    },
  });
  editor.spawnProp(LEVEL_ID, 'prop_vase', 17, 6, { roomId: vestibule });
  editor.spawnProp(LEVEL_ID, 'prop_vase', 22, 6, { roomId: vestibule });

  // -- Fog Hall (X=14..25, Z=12..21) --
  // 2 torches near corners, 2 cages in opposite corners, 3 vases scattered
  torch(14, 14, 'west', fogHall);     // west wall, north area
  torch(25, 19, 'east', fogHall);     // east wall, south area
  editor.spawnProp(LEVEL_ID, 'prop_cage', 15, 20, { roomId: fogHall }); // SW
  editor.spawnProp(LEVEL_ID, 'prop_cage', 24, 13, { roomId: fogHall }); // NE
  editor.spawnProp(LEVEL_ID, 'prop_vase', 15, 12, { roomId: fogHall }); // NW corner
  editor.spawnProp(LEVEL_ID, 'prop_vase', 24, 21, { roomId: fogHall }); // SE corner
  editor.spawnProp(LEVEL_ID, 'prop_vase', 19, 16, { roomId: fogHall }); // interior

  // -- Crypt (X=30..35, Z=14..19) --
  // 1 torch, 1 bookstand for scroll, moss indicated via theme
  torch(30, 16, 'west', crypt);
  editor.spawnProp(LEVEL_ID, 'prop_bookstand', 32, 15, {
    roomId: crypt,
    overrides: {
      text: 'The scapegoat carries what is not his. The wilderness awaits.',
    },
  });
  editor.spawnProp(LEVEL_ID, 'prop_vase', 34, 19, { roomId: crypt });

  // -- Bone Pit (X=2..9, Z=14..21) --
  // 3 chains hanging from ceiling at different positions, 1 barrel
  editor.spawnProp(LEVEL_ID, 'prop_chain', 3, 15, {
    roomId: bonePit,
    surfaceAnchor: {
      face: 'north', offsetX: 0, offsetY: CHAIN_Y, offsetZ: 0,
      rotation: [0, 0, 0], scale: 1.2,
    },
  });
  editor.spawnProp(LEVEL_ID, 'prop_chain', 6, 17, {
    roomId: bonePit,
    surfaceAnchor: {
      face: 'north', offsetX: 0, offsetY: CHAIN_Y, offsetZ: 0,
      rotation: [0, 0, 0], scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'prop_chain', 8, 20, {
    roomId: bonePit,
    surfaceAnchor: {
      face: 'north', offsetX: 0, offsetY: CHAIN_Y, offsetZ: 0,
      rotation: [0, 0, 0], scale: 0.8,
    },
  });
  editor.spawnProp(LEVEL_ID, 'prop_barrel', 9, 14, { roomId: bonePit });

  // -- Columns (X=15..24, Z=26..37) --
  // 6 stone columns in 2×3 grid to break line-of-sight
  // Column X positions: 18 and 21 (inner thirds of 10-wide room)
  // Column Z positions: 29, 32, 35 (evenly spaced in 12-deep room)
  for (const cx of [18, 21]) {
    for (const cz of [29, 32, 35]) {
      editor.spawnProp(LEVEL_ID, 'prop_column', cx, cz, {
        roomId: columns,
      });
    }
  }
  // 2 torches at entrance
  torch(15, 26, 'west', columns);
  torch(24, 26, 'east', columns);

  // -- Boss Chamber (X=14..25, Z=42..53) --
  // 3 torches: 2 entrance flanking + 1 behind boss for backlit silhouette
  torch(15, 42, 'west', bossRoom);    // entrance left
  torch(24, 42, 'east', bossRoom);    // entrance right
  torch(20, 53, 'south', bossRoom);   // behind boss — backlit
  // 2 banners on side walls
  editor.spawnProp(LEVEL_ID, 'prop_banner', 14, 47, {
    roomId: bossRoom,
    elevation: -1,
    surfaceAnchor: {
      face: 'west', offsetX: 0, offsetY: BANNER_Y, offsetZ: 0,
      rotation: [0, 0, 0], scale: 1.5,
    },
  });
  editor.spawnProp(LEVEL_ID, 'prop_banner', 25, 47, {
    roomId: bossRoom,
    elevation: -1,
    surfaceAnchor: {
      face: 'east', offsetX: 0, offsetY: BANNER_Y, offsetZ: 0,
      rotation: [0, 0, 0], scale: 1.5,
    },
  });
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- --testPathPattern circle1-limbo`
Expected: PASS (16 tests)

**Step 5: Commit**

```bash
git add src/db/circles/circle1-limbo.ts src/db/__tests__/circle1-limbo.test.ts
git commit -m "feat(circle-1): props with wall mounting, hanging chains, columns"
```

---

### Task 6: Add triggers — 9 triggers for ambush, lock-and-clear, boss, fog

**Files:**
- Modify: `src/db/circles/circle1-limbo.ts`
- Modify: `src/db/__tests__/circle1-limbo.test.ts`

**Step 1: Write the failing tests**

Add to `circle1-limbo.test.ts`:

```typescript
it('creates 9 triggers', () => {
  const triggers = db.select().from(schema.triggers)
    .where(eq(schema.triggers.levelId, 'circle-1-limbo')).all();
  expect(triggers).toHaveLength(9);

  const actions = triggers.map(t => t.action).sort();
  expect(actions).toEqual([
    'ambientChange', 'ambientChange',
    'bossIntro',
    'lockDoors', 'lockDoors',
    'spawnWave', 'spawnWave', 'spawnWave',
    'unlockDoors',
  ]);
});

it('bone pit ambush covers the pit floor zone', () => {
  const triggers = db.select().from(schema.triggers)
    .where(eq(schema.triggers.levelId, 'circle-1-limbo')).all();
  // Bone pit at X=2..9, Z=14..21 — trigger zone should cover interior
  const bonePitTrigger = triggers.find(
    t => t.action === 'spawnWave' && t.zoneX >= 2 && t.zoneX <= 4
  );
  expect(bonePitTrigger).toBeDefined();
  expect(bonePitTrigger!.once).toBe(true);
  const data = bonePitTrigger!.actionData as any;
  expect(data.enemies[0].type).toBe('hellgoat');
  expect(data.enemies[0].count).toBe(3);
});

it('boss intro has dialogue text', () => {
  const triggers = db.select().from(schema.triggers)
    .where(eq(schema.triggers.levelId, 'circle-1-limbo')).all();
  const bossIntro = triggers.find(t => t.action === 'bossIntro');
  expect(bossIntro).toBeDefined();
  const data = bossIntro!.actionData as any;
  expect(data.text).toContain('You carry what is not yours');
});

it('boss fog surge at 50% HP changes density to 0.12', () => {
  const triggers = db.select().from(schema.triggers)
    .where(eq(schema.triggers.levelId, 'circle-1-limbo')).all();
  const fogSurge = triggers.find(
    t => t.action === 'ambientChange' && t.zoneX === 14 && t.zoneZ === 42
  );
  expect(fogSurge).toBeDefined();
  const data = fogSurge!.actionData as any;
  expect(data.fogDensity).toBe(0.12);
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- --testPathPattern circle1-limbo`
Expected: FAIL — no triggers

**Step 3: Add triggers**

Add after props in `circle1-limbo.ts`:

```typescript
  // --- Triggers ---

  // T1: Bone Pit ambush — entering pit floor spawns 3 hellgoats
  editor.addTrigger(LEVEL_ID, {
    action: 'spawnWave',
    zoneX: 3, zoneZ: 16, zoneW: 6, zoneH: 4,
    roomId: bonePit,
    once: true,
    actionData: { enemies: [{ type: 'hellgoat', count: 3 }] },
  });

  // T2: Columns lock — entering the arena locks doors
  editor.addTrigger(LEVEL_ID, {
    action: 'lockDoors',
    zoneX: 17, zoneZ: 28, zoneW: 6, zoneH: 6,
    roomId: columns,
    once: true,
  });

  // T3: Columns wave 1 — 3 hellgoats from edges
  editor.addTrigger(LEVEL_ID, {
    action: 'spawnWave',
    zoneX: 17, zoneZ: 28, zoneW: 6, zoneH: 6,
    roomId: columns,
    once: true,
    actionData: { enemies: [{ type: 'hellgoat', count: 3 }] },
  });

  // T4: Columns wave 2 — fires when wave 1 cleared
  editor.addTrigger(LEVEL_ID, {
    action: 'spawnWave',
    zoneX: 15, zoneZ: 26, zoneW: 10, zoneH: 12,
    roomId: columns,
    once: true,
    actionData: {
      enemies: [{ type: 'hellgoat', count: 3 }],
      condition: 'onWaveClear',
    },
  });

  // T5: Columns unlock — doors open when wave 2 cleared
  editor.addTrigger(LEVEL_ID, {
    action: 'unlockDoors',
    zoneX: 15, zoneZ: 26, zoneW: 10, zoneH: 12,
    roomId: columns,
    once: true,
    actionData: { condition: 'onWaveClear' },
  });

  // T6: Fog lifts after Columns clear — brief relief before descent
  editor.addTrigger(LEVEL_ID, {
    action: 'ambientChange',
    zoneX: 15, zoneZ: 26, zoneW: 10, zoneH: 12,
    roomId: columns,
    once: true,
    actionData: { fogDensity: 0.04, condition: 'onWaveClear' },
  });

  // T7: Boss intro — Il Vecchio speaks as player enters chamber
  editor.addTrigger(LEVEL_ID, {
    action: 'bossIntro',
    zoneX: 15, zoneZ: 43, zoneW: 10, zoneH: 2,
    roomId: bossRoom,
    once: true,
    actionData: {
      text: 'You carry what is not yours, little goat. I have watched the gate since before memory. All who pass carry sin. You carry more than most.',
    },
  });

  // T8: Boss chamber lock — 3s delay after intro
  editor.addTrigger(LEVEL_ID, {
    action: 'lockDoors',
    zoneX: 15, zoneZ: 43, zoneW: 10, zoneH: 2,
    roomId: bossRoom,
    once: true,
    delay: 3,
  });

  // T9: Boss fog surge — density jumps to 0.12 at 50% HP (nearly blind)
  editor.addTrigger(LEVEL_ID, {
    action: 'ambientChange',
    zoneX: 14, zoneZ: 42, zoneW: 12, zoneH: 12,
    roomId: bossRoom,
    once: true,
    actionData: {
      fogDensity: 0.12,
      condition: 'bossHpBelow',
      threshold: 0.5,
    },
  });
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- --testPathPattern circle1-limbo`
Expected: PASS (20 tests)

**Step 5: Commit**

```bash
git add src/db/circles/circle1-limbo.ts src/db/__tests__/circle1-limbo.test.ts
git commit -m "feat(circle-1): 9 triggers for ambush, lock-clear, boss, fog"
```

---

### Task 7: Add environment zones, compile, validate, playtest

**Files:**
- Modify: `src/db/circles/circle1-limbo.ts`
- Modify: `src/db/__tests__/circle1-limbo.test.ts`

**Step 1: Write the tests**

Add to `circle1-limbo.test.ts`:

```typescript
import { MapCell } from '../../game/levels/LevelGenerator';
import { CELL_SIZE } from '../../constants';
import { toLevelData } from '../LevelDbAdapter';
import { LevelEditor } from '../LevelEditor';
import { runPlaytest } from '../PlaytestRunner';

it('creates 2 environment zones', () => {
  const zones = db.select().from(schema.environmentZones)
    .where(eq(schema.environmentZones.levelId, 'circle-1-limbo')).all();
  expect(zones).toHaveLength(2);

  const fog = zones.find(z => z.envType === 'fog');
  expect(fog).toBeDefined();
  expect(fog!.boundsW).toBe(40);
  expect(fog!.boundsH).toBe(56);

  const wind = zones.find(z => z.envType === 'wind');
  expect(wind).toBeDefined();
});

it('grid is compiled with correct dimensions', () => {
  const level = db.select().from(schema.levels)
    .where(eq(schema.levels.id, 'circle-1-limbo')).get();
  expect(level!.compiledGrid).not.toBeNull();

  const levelData = toLevelData(db, 'circle-1-limbo');
  expect(levelData.grid.length).toBe(56);
  expect(levelData.grid[0].length).toBe(40);
});

it('vestibule interior is carved (EMPTY)', () => {
  const levelData = toLevelData(db, 'circle-1-limbo');
  // Vestibule at (16, 2, 8, 6) — interior cells should be EMPTY
  expect(levelData.grid[4][18]).toBe(MapCell.EMPTY);
  expect(levelData.grid[5][20]).toBe(MapCell.EMPTY);
});

it('walls outside rooms are WALL_STONE', () => {
  const levelData = toLevelData(db, 'circle-1-limbo');
  expect(levelData.grid[0][0]).toBe(MapCell.WALL_STONE);
  expect(levelData.grid[0][39]).toBe(MapCell.WALL_STONE);
  expect(levelData.grid[55][0]).toBe(MapCell.WALL_STONE);
});

it('validates with no errors', () => {
  const editor = new LevelEditor(db);
  const result = editor.validate('circle-1-limbo');
  expect(result.valid).toBe(true);
  expect(result.errors).toHaveLength(0);
});

it('playtest runner navigates from spawn to boss room', () => {
  const levelData = toLevelData(db, 'circle-1-limbo');
  const rooms = db.select().from(schema.rooms)
    .where(eq(schema.rooms.levelId, 'circle-1-limbo')).all();

  const result = runPlaytest(levelData, rooms, { maxDuration: 120 });

  expect(result.unreachableRooms).toHaveLength(0);
  // At least 5 of 6 rooms visited (Crypt is behind WALL_SECRET,
  // playtest runner can't walk through secrets by design)
  expect(result.roomsVisited.length).toBeGreaterThanOrEqual(5);
  expect(result.softlocks).toHaveLength(0);
  expect(result.passed).toBe(true);
});

it('toLevelData produces correct spawn position', () => {
  const levelData = toLevelData(db, 'circle-1-limbo');
  expect(levelData.playerSpawn.x).toBe(20 * CELL_SIZE);
  expect(levelData.playerSpawn.z).toBe(5 * CELL_SIZE);
  expect(levelData.playerSpawn.y).toBe(1);
});

it('toLevelData theme has limbo settings', () => {
  const levelData = toLevelData(db, 'circle-1-limbo');
  expect(levelData.theme.name).toBe('limbo');
  expect(levelData.theme.primaryWall).toBe(MapCell.WALL_STONE);
  expect(levelData.theme.enemyTypes).toContain('hellgoat');
});
```

**Step 2: Add environment zones and compile to buildCircle1**

Add at end of `buildCircle1()`:

```typescript
  // --- Environment Zones ---

  // Global fog covering entire level
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: 'fog',
    boundsX: 0, boundsZ: 0, boundsW: 40, boundsH: 56,
    intensity: 0.8,
  });

  // Bone Pit updraft — subtle wind from the void below
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: 'wind',
    boundsX: 2, boundsZ: 14, boundsW: 8, boundsH: 8,
    intensity: 0.3,
    directionX: 0,
    directionZ: -1,
  });

  // --- Compile grid → BLOB ---
  editor.compile(LEVEL_ID);
```

**Step 3: Run test to verify it passes**

Run: `pnpm test -- --testPathPattern circle1-limbo`
Expected: PASS (all tests). If any fail, debug grid carving or connection geometry.

**Step 4: Run full test suite for regressions**

Run: `pnpm test`
Expected: All existing tests pass + Circle 1 tests

**Step 5: Commit**

```bash
git add src/db/circles/circle1-limbo.ts src/db/__tests__/circle1-limbo.test.ts
git commit -m "feat(circle-1): env zones, compile, validate, playtest passes"
```

---

### Task 8: Final verification — typecheck, lint, all tests

**Files:**
- No changes expected

**Step 1: TypeScript check**

Run: `npx tsc --noEmit`
Expected: No type errors

**Step 2: Lint**

Run: `pnpm lint`
Expected: No lint errors

**Step 3: Full test suite**

Run: `pnpm test`
Expected: All tests pass

**Step 4: Fix any issues and commit**

---

## Verification Checklist

After all tasks:

1. `pnpm test` passes with all Circle 1 tests
2. `npx tsc --noEmit` clean
3. `buildCircle1(db)` inserts: 1 theme, 1 level (40×56), 6 rooms, 5 connections, 30+ props, 3+1 immediate enemies, 12+ pickups, 9 triggers, 2 env zones
4. `editor.validate('circle-1-limbo')` returns `{ valid: true }`
5. `runPlaytest(levelData, rooms)` returns `{ passed: true }` with 5+ rooms visited
6. Entity positions span room corners/edges, not clustered at center
7. Boss chamber entities use `elevation: -1`
8. Wall-mounted props use `surfaceAnchor` with `offsetY` > 0
9. 6 columns in 2×3 grid break line-of-sight in Columns room
10. Crypt is intentionally behind WALL_SECRET — playtest runner can't reach it

## Files Summary

### New files
```
src/db/circles/circle1-limbo.ts        — buildCircle1(db) function
src/db/__tests__/circle1-limbo.test.ts  — ~28 tests covering full pipeline
```

### Unchanged files
```
src/db/schema.ts, LevelEditor.ts, GridCompiler.ts,
LevelDbAdapter.ts, PlaytestRunner.ts, connection.ts,
migrate.ts, R3FRoot.tsx — all already implemented
```
