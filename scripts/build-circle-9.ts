#!/usr/bin/env npx tsx
/**
 * Build script for Circle 9: Treachery — The Circle of Betrayal
 *
 * Translates docs/circles/09-treachery.md into LevelEditor API calls.
 * Run: npx tsx scripts/build-circle-9.ts
 */
import BetterSqlite3 from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import {
  CONNECTION_TYPES,
  ENEMY_TYPES,
  ENV_TYPES,
  LevelEditor,
  MapCell,
  PICKUP_TYPES,
  ROOM_TYPES,
  TRIGGER_ACTIONS,
} from '../src/db/LevelEditor';
import { migrateAndSeed } from '../src/db/migrate';
import * as schema from '../src/db/schema';

const LEVEL_ID = 'circle-9-treachery';
const THEME_ID = 'circle-9-treachery';

export async function buildCircle9(dbPath: string) {
  const sqliteDb = new BetterSqlite3(dbPath);
  const db = drizzle(sqliteDb, { schema });
  await migrateAndSeed(db);
  const editor = new LevelEditor(db);

  // =========================================================================
  // 1. THEME (from "Theme Configuration" section)
  // =========================================================================

  editor.createTheme(THEME_ID, {
    name: 'treachery',
    displayName: 'TREACHERY \u2014 The Circle of Betrayal',
    primaryWall: MapCell.WALL_OBSIDIAN, // Dark ice-covered stone
    accentWalls: [MapCell.WALL_STONE], // Frost-covered granite accents
    fogDensity: 0.03,
    fogColor: '#0a0e1a',
    ambientColor: '#2244aa',
    ambientIntensity: 0.1,
    skyColor: '#000005', // Near-black -- the deepest point
    particleEffect: 'snow_drift', // Horizontal snow particles, slow
    enemyTypes: ['goatKnight', 'shadowGoat', 'fireGoat'],
    enemyDensity: 1.2, // High -- the finale
    pickupDensity: 0.8, // Moderate -- enough to survive, not to hoard
  });

  // =========================================================================
  // 2. LEVEL (from "Identity" + "Grid Dimensions" sections)
  // =========================================================================

  editor.createLevel(LEVEL_ID, {
    name: 'Circle 9: Treachery',
    levelType: 'circle',
    width: 60, // "60 wide"
    depth: 154, // "154 deep"
    floor: 1,
    themeId: THEME_ID,
    circleNumber: 9,
    sin: 'Betrayal',
    guardian: 'Azazel',
  });

  // =========================================================================
  // 3. ROOMS (from "Room Placement" table, in sortOrder)
  // =========================================================================
  //
  // | Room                   | X  | Z   | W  | H  | Type        | Elevation            | sortOrder |
  // | Glacial Stairs         | 26 |   2 |  8 | 16 | platforming | 0 -> -3 (descending) | 0         |
  // | Caina                  | 22 |  22 | 16 | 14 | exploration | -3                   | 1         |
  // | Antenora               | 24 |  40 | 12 | 16 | exploration | -3                   | 2         |
  // | Ptolomea               | 23 |  60 | 14 | 10 | exploration | -4 (step down)       | 3         |
  // | Giudecca               | 21 |  74 | 18 | 16 | arena       | -4 (void at -6)      | 4         |
  // | Judas Trap             | 12 |  78 |  6 |  6 | secret      | -4                   | 5         |
  // | Cocytus Bridge         | 28 |  94 |  4 | 36 | corridor    | -5                   | 6         |
  // | Azazel's Frozen Throne | 20 | 134 | 20 | 20 | boss        | -6 (deepest)         | 7         |

  const glacialStairsId = editor.room(LEVEL_ID, 'glacial_stairs', 26, 2, 8, 16, {
    roomType: ROOM_TYPES.PLATFORMING,
    elevation: 0,
    sortOrder: 0,
  });

  const cainaId = editor.room(LEVEL_ID, 'caina', 22, 22, 16, 14, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: -3,
    sortOrder: 1,
  });

  const antenoraId = editor.room(LEVEL_ID, 'antenora', 24, 40, 12, 16, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: -3,
    sortOrder: 2,
  });

  const ptolomeaId = editor.room(LEVEL_ID, 'ptolomea', 23, 60, 14, 10, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: -4,
    sortOrder: 3,
  });

  const giudeccaId = editor.room(LEVEL_ID, 'giudecca', 21, 74, 18, 16, {
    roomType: ROOM_TYPES.ARENA,
    elevation: -4,
    sortOrder: 4,
  });

  const judasTrapId = editor.room(LEVEL_ID, 'judas_trap', 12, 78, 6, 6, {
    roomType: ROOM_TYPES.SECRET,
    elevation: -4,
    sortOrder: 5,
  });

  // Note: design doc says "bridge" room type, but ROOM_TYPES does not have BRIDGE.
  // Using CORRIDOR as the closest match for a narrow connecting passage.
  const cocytusBridgeId = editor.room(LEVEL_ID, 'cocytus_bridge', 28, 94, 4, 36, {
    roomType: ROOM_TYPES.CORRIDOR,
    elevation: -5,
    sortOrder: 6,
  });

  const azazelThroneId = editor.room(LEVEL_ID, 'azazels_frozen_throne', 20, 134, 20, 20, {
    roomType: ROOM_TYPES.BOSS,
    elevation: -6,
    sortOrder: 7,
  });

  // =========================================================================
  // 4. CONNECTIONS (from "Connections" table)
  // =========================================================================
  //
  // | From            | To                     | Type     | Width | Notes                                 |
  // | Glacial Stairs  | Caina                  | corridor | 3     | Base of stairs opens to frozen lake    |
  // | Caina           | Antenora               | corridor | 3     | Lake edge to fortress entrance         |
  // | Antenora        | Ptolomea               | corridor | 2     | Narrow fortress passage, step down     |
  // | Ptolomea        | Giudecca               | corridor | 3     | Opens from feast hall to grand arena   |
  // | Giudecca        | Judas Trap             | secret   | 2     | WALL_SECRET on west wall               |
  // | Giudecca        | Cocytus Bridge         | corridor | 2     | South exit to bridge                   |
  // | Cocytus Bridge  | Azazel's Frozen Throne | door     | 3     | Bridge terminates at massive door      |

  // Glacial Stairs -> Caina (corridor, width 3)
  editor.corridor(LEVEL_ID, glacialStairsId, cainaId, 3);

  // Caina -> Antenora (corridor, width 3)
  editor.corridor(LEVEL_ID, cainaId, antenoraId, 3);

  // Antenora -> Ptolomea (corridor, width 2, step down -3 -> -4)
  editor.connect(LEVEL_ID, antenoraId, ptolomeaId, {
    connectionType: CONNECTION_TYPES.CORRIDOR,
    corridorWidth: 2,
    fromElevation: -3,
    toElevation: -4,
  });

  // Ptolomea -> Giudecca (corridor, width 3)
  editor.corridor(LEVEL_ID, ptolomeaId, giudeccaId, 3);

  // Giudecca -> Judas Trap (secret, width 2)
  editor.connect(LEVEL_ID, giudeccaId, judasTrapId, {
    connectionType: CONNECTION_TYPES.SECRET,
    corridorWidth: 2,
  });

  // Giudecca -> Cocytus Bridge (corridor, width 2)
  editor.corridor(LEVEL_ID, giudeccaId, cocytusBridgeId, 2);

  // Cocytus Bridge -> Azazel's Frozen Throne (door, width 3)
  editor.connect(LEVEL_ID, cocytusBridgeId, azazelThroneId, {
    connectionType: CONNECTION_TYPES.DOOR,
    corridorWidth: 3,
  });

  // =========================================================================
  // 5. ENTITIES: ENEMIES (from "Enemies" table)
  // =========================================================================

  // --- Glacial Stairs: 2 shadowGoat ambush + 1 fireGoat ---
  //   Room bounds: (26, 2, 8, 16) -> interior: x=[27..32], z=[3..16]
  //   T1: shadowGoat ambush at landing 2 zone (27, 6, 6, 3)
  //   T2: shadowGoat ambush at landing 4 zone (27, 12, 6, 3)
  editor.ambush(
    LEVEL_ID,
    { x: 27, z: 6, w: 6, h: 3 },
    [{ type: ENEMY_TYPES.SHADOW_GOAT, x: 28, z: 7 }],
    { roomId: glacialStairsId },
  );
  editor.ambush(
    LEVEL_ID,
    { x: 27, z: 12, w: 6, h: 3 },
    [{ type: ENEMY_TYPES.SHADOW_GOAT, x: 31, z: 13 }],
    { roomId: glacialStairsId },
  );
  // fireGoat at landing 3, fires upward from below
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 30, 10, {
    roomId: glacialStairsId,
    facing: 0, // Facing north (upward at descending player)
  });

  // --- Caina: 3 goatKnight (frozen, thaw on proximity) + 1 shadowGoat ---
  //   Room bounds: (22, 22, 16, 14) -> interior: x=[23..36], z=[23..34]
  //   T3: goatKnights frozen in ice, break free on 4-cell proximity
  //   Using ambush() which creates trigger + linked entities
  editor.ambush(
    LEVEL_ID,
    { x: 23, z: 23, w: 14, h: 12 },
    [
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 28, z: 25 },
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 34, z: 31 },
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 28, z: 33 },
    ],
    { roomId: cainaId },
  );
  // 1 shadowGoat patrols behind ice pillars
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.SHADOW_GOAT, 24, 30, {
    roomId: cainaId,
    patrol: [
      { x: 24, z: 30 },
      { x: 30, z: 34 },
      { x: 36, z: 28 },
    ],
  });

  // --- Antenora: 3 shadowGoat ambush + 1 fireGoat ---
  //   Room bounds: (24, 40, 12, 16) -> interior: x=[25..34], z=[41..54]
  //   T4, T5, T6: ambush triggers at corridor sections
  editor.ambush(
    LEVEL_ID,
    { x: 25, z: 42, w: 10, h: 4 },
    [{ type: ENEMY_TYPES.SHADOW_GOAT, x: 33, z: 43 }],
    { roomId: antenoraId },
  );
  editor.ambush(
    LEVEL_ID,
    { x: 25, z: 48, w: 10, h: 4 },
    [{ type: ENEMY_TYPES.SHADOW_GOAT, x: 33, z: 49 }],
    { roomId: antenoraId },
  );
  editor.ambush(
    LEVEL_ID,
    { x: 25, z: 52, w: 10, h: 4 },
    [{ type: ENEMY_TYPES.SHADOW_GOAT, x: 26, z: 53 }],
    { roomId: antenoraId },
  );
  // 1 fireGoat at corridor intersection
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 30, 46, {
    roomId: antenoraId,
  });

  // --- Ptolomea: 2 goatKnight + 1 fireGoat (frozen at table, thaw on entry) ---
  //   Room bounds: (23, 60, 14, 10) -> interior: x=[24..35], z=[61..68]
  //   T7: enemies frozen at banquet table, thaw when player enters doorway
  //   Using ambush() which creates trigger + linked entities
  editor.ambush(
    LEVEL_ID,
    { x: 24, z: 61, w: 12, h: 2 },
    [
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 28, z: 63 },
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 32, z: 63 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 34, z: 66 },
    ],
    { roomId: ptolomeaId },
  );

  // --- Giudecca: 3 waves (arena lock/wave/unlock pattern) ---
  //   Room bounds: (21, 74, 18, 16) -> interior: x=[22..37], z=[75..88]
  //   Arena trigger zone from table: (23, 76, 14, 4)
  //   Wave 1: 2 goatKnight from waterfall (north)
  //   Wave 2: 2 shadowGoat + 1 fireGoat
  //   Wave 3: 1 goatKnight + 1 shadowGoat + 1 fireGoat
  editor.setupArenaWaves(LEVEL_ID, giudeccaId, { x: 23, z: 76, w: 14, h: 4 }, [
    // Wave 1: 2 goatKnights from frozen waterfall
    [
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 26, z: 76 },
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 34, z: 76 },
    ],
    // Wave 2: 2 shadowGoats from floor + 1 fireGoat elevated
    [
      { type: ENEMY_TYPES.SHADOW_GOAT, x: 28, z: 82 },
      { type: ENEMY_TYPES.SHADOW_GOAT, x: 34, z: 82 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 30, z: 78 },
    ],
    // Wave 3: mixed all types
    [
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 30, z: 80 },
      { type: ENEMY_TYPES.SHADOW_GOAT, x: 24, z: 84 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 36, z: 78 },
    ],
  ]);

  // Cocytus Bridge: NO enemies. Silence.

  // --- Boss chamber: Azazel ---
  //   Room bounds: (20, 134, 20, 20) -> center: (30, 144)
  editor.spawnBoss(LEVEL_ID, 'azazel', 30, 144, {
    roomId: azazelThroneId,
    facing: 0, // Facing north (toward approaching player)
  });

  // =========================================================================
  // 5b. ENTITIES: PICKUPS (from "Pickups" table)
  // =========================================================================

  // Glacial Stairs landing 2: ammo (29, 8)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 29, 8);

  // Glacial Stairs landing 4: health (28, 14)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 28, 14);

  // Caina: ammo x 2 (25, 26) SW and (35, 32) NE of frozen lake
  //   Room bounds: (22, 22, 16, 14)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 25, 26);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 35, 32);

  // Caina: health (30, 28) center of lake -- risky (goatKnights nearby)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 30, 28);

  // Antenora: ammo (28, 46) mid-corridor
  //   Room bounds: (24, 40, 12, 16)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 28, 46);

  // Antenora: health (32, 52) near south exit
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 32, 52);

  // Ptolomea: ammo (26, 64) west side of table
  //   Room bounds: (23, 60, 14, 10)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 26, 64);

  // Ptolomea: health (34, 62) east side, behind barrel
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 34, 62);

  // Giudecca: health near entrance (pre-lock buffer)
  //   Room bounds: (21, 74, 18, 16) -> just inside north: (30, 75)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 30, 75);

  // Giudecca: ammo x 2 between waves -- NW (24, 78) and SE (36, 86)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 24, 78);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 36, 86);

  // Giudecca: health x 2 between waves -- NE (36, 78) and SW (24, 86)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 36, 78);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 24, 86);

  // Judas Trap: ammo x 2 (14, 80), (16, 82) -- generous reward
  //   Room bounds: (12, 78, 6, 6) -> interior: x=[13..16], z=[79..82]
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 14, 80);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 16, 82);

  // Judas Trap: health x 2 (13, 81), (16, 81)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 13, 81);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 16, 81);

  // Cocytus Bridge: NO pickups. Nothing.

  // Boss chamber: ammo x 3 triangle pattern -- NW (23, 138), NE (37, 138), S (30, 150)
  //   Room bounds: (20, 134, 20, 20) -> interior: x=[21..38], z=[135..152]
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 23, 138);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 37, 138);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 30, 150);

  // Boss chamber: health x 3 inverse triangle -- SW (23, 150), SE (37, 150), N (30, 138)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 23, 150);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 37, 150);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 30, 138);

  // Fuel pickups (flamethrower -- essential, does not reflect off walls)
  // Glacial Stairs landing 3
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.FUEL, 30, 10);
  // Caina: near east pillar
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.FUEL, 34, 28);
  // Antenora: corridor midpoint
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.FUEL, 29, 48);
  // Giudecca: fuel x 2 between waves
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.FUEL, 28, 80);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.FUEL, 34, 84);
  // Azazel's Frozen Throne: fuel x 2 NE, SW quadrants
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.FUEL, 36, 138);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.FUEL, 24, 150);

  // =========================================================================
  // 5c. ENTITIES: PROPS (from "Props" table)
  // =========================================================================

  // --- Glacial Stairs (bounds: 26, 2, 8, 16) ---
  // 4x Lantern_Wall (wall, E/W alternating, UNLIT -- frost-covered, dead)
  editor.spawnProp(LEVEL_ID, 'Lantern_Wall', 27, 5, {
    roomId: glacialStairsId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Lantern_Wall', 32, 8, {
    roomId: glacialStairsId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Lantern_Wall', 27, 11, {
    roomId: glacialStairsId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Lantern_Wall', 32, 14, {
    roomId: glacialStairsId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 2x Chain_Coil (ceiling, frozen, landings 2 and 4)
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 30, 7, { roomId: glacialStairsId });
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 30, 13, { roomId: glacialStairsId });

  // --- Caina (bounds: 22, 22, 16, 14) ---
  // 6x ice pillars (structural, 2 rows of 3, staggered)
  editor.spawnProp(LEVEL_ID, 'Column_Stone', 25, 25, { roomId: cainaId });
  editor.spawnProp(LEVEL_ID, 'Column_Stone', 30, 25, { roomId: cainaId });
  editor.spawnProp(LEVEL_ID, 'Column_Stone', 35, 25, { roomId: cainaId });
  editor.spawnProp(LEVEL_ID, 'Column_Stone', 25, 31, { roomId: cainaId });
  editor.spawnProp(LEVEL_ID, 'Column_Stone', 30, 31, { roomId: cainaId });
  editor.spawnProp(LEVEL_ID, 'Column_Stone', 35, 31, { roomId: cainaId });
  // 3x Cage_Small (embedded in floor ice, frozen betrayers)
  editor.spawnProp(LEVEL_ID, 'Cage_Small', 27, 28, { roomId: cainaId });
  editor.spawnProp(LEVEL_ID, 'Cage_Small', 33, 26, { roomId: cainaId });
  editor.spawnProp(LEVEL_ID, 'Cage_Small', 26, 33, { roomId: cainaId });
  // 2x Sword_Bronze (frozen into pillar surfaces)
  editor.spawnProp(LEVEL_ID, 'Sword_Bronze', 25, 26, {
    roomId: cainaId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Sword_Bronze', 35, 32, {
    roomId: cainaId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });

  // --- Antenora (bounds: 24, 40, 12, 16) ---
  // 4x Banner_1 (wall, N/S alternating, frozen stiff)
  editor.spawnProp(LEVEL_ID, 'Banner_1', 26, 41, {
    roomId: antenoraId,
    surfaceAnchor: {
      face: 'north',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Banner_1', 32, 45, {
    roomId: antenoraId,
    surfaceAnchor: {
      face: 'south',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Banner_1', 26, 49, {
    roomId: antenoraId,
    surfaceAnchor: {
      face: 'north',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Banner_1', 32, 53, {
    roomId: antenoraId,
    surfaceAnchor: {
      face: 'south',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 3x Shield_Wooden (wall, E face, frost-covered)
  editor.spawnProp(LEVEL_ID, 'Shield_Wooden', 34, 43, {
    roomId: antenoraId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.2,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Shield_Wooden', 34, 47, {
    roomId: antenoraId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.2,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Shield_Wooden', 34, 51, {
    roomId: antenoraId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.2,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 2x Chain_Coil (ceiling, frozen, at corridor intersections)
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 30, 44, { roomId: antenoraId });
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 30, 50, { roomId: antenoraId });

  // --- Ptolomea (bounds: 23, 60, 14, 10) ---
  // 1x Table_Large (center, frost-covered feast)
  editor.spawnProp(LEVEL_ID, 'Table_Large', 30, 64, { roomId: ptolomeaId });
  // 6x Chair_1 (around table, some knocked over)
  editor.spawnProp(LEVEL_ID, 'Chair_1', 28, 63, { roomId: ptolomeaId });
  editor.spawnProp(LEVEL_ID, 'Chair_1', 30, 63, { roomId: ptolomeaId });
  editor.spawnProp(LEVEL_ID, 'Chair_1', 32, 63, { roomId: ptolomeaId });
  editor.spawnProp(LEVEL_ID, 'Chair_1', 28, 66, { roomId: ptolomeaId });
  editor.spawnProp(LEVEL_ID, 'Chair_1', 30, 66, { roomId: ptolomeaId });
  editor.spawnProp(LEVEL_ID, 'Chair_1', 32, 66, { roomId: ptolomeaId });
  // 2x Chalice (on table, frozen contents)
  editor.spawnProp(LEVEL_ID, 'Chalice', 29, 64, { roomId: ptolomeaId });
  editor.spawnProp(LEVEL_ID, 'Chalice', 31, 64, { roomId: ptolomeaId });
  // 2x SmallBottle (on table, frozen)
  editor.spawnProp(LEVEL_ID, 'SmallBottle', 30, 65, { roomId: ptolomeaId });
  editor.spawnProp(LEVEL_ID, 'SmallBottle', 31, 65, { roomId: ptolomeaId });
  // 1x Barrel (SE corner, frost-covered)
  editor.spawnProp(LEVEL_ID, 'Barrel', 35, 67, { roomId: ptolomeaId });

  // --- Giudecca (bounds: 21, 74, 18, 16) ---
  // 4x Chain_Coil (ceiling, hanging over void sections)
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 25, 78, { roomId: giudeccaId });
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 35, 78, { roomId: giudeccaId });
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 25, 86, { roomId: giudeccaId });
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 35, 86, { roomId: giudeccaId });

  // --- Judas Trap (bounds: 12, 78, 6, 6) ---
  // 1x Book_7 (floor, frost-covered codex)
  editor.spawnProp(LEVEL_ID, 'Book_7', 14, 80, { roomId: judasTrapId });
  // 1x Cage_Small (floor, containing frozen figure)
  editor.spawnProp(LEVEL_ID, 'Cage_Small', 16, 80, { roomId: judasTrapId });
  // 2x Coin_Pile (floor, frost-covered, worthless)
  editor.spawnProp(LEVEL_ID, 'Coin_Pile', 14, 82, { roomId: judasTrapId });
  editor.spawnProp(LEVEL_ID, 'Coin_Pile', 16, 82, { roomId: judasTrapId });

  // --- Cocytus Bridge (bounds: 28, 94, 4, 36) ---
  // NONE. Empty ice. Void below. Wind only.

  // --- Azazel's Frozen Throne (bounds: 20, 134, 20, 20) ---
  // 4x Chain_Coil (ceiling, massive, marking arena quadrants)
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 25, 139, { roomId: azazelThroneId });
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 35, 139, { roomId: azazelThroneId });
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 25, 149, { roomId: azazelThroneId });
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 35, 149, { roomId: azazelThroneId });

  // =========================================================================
  // 6. TRIGGERS (from "Triggers" table)
  // =========================================================================
  //
  // NOTE: T1, T2 (Glacial Stairs ambushes) were created by editor.ambush() above.
  // NOTE: T3 (Caina thaw) was created manually with addTrigger() + linked enemies above.
  // NOTE: T4, T5, T6 (Antenora ambushes) were created by editor.ambush() above.
  // NOTE: T7 (Ptolomea thaw) was created manually with addTrigger() + linked enemies above.
  // NOTE: T8-T15 (Giudecca arena) were created by editor.setupArenaWaves() above.
  //
  // Remaining triggers:

  // T10: environmentHazard -- falling ice in Giudecca (on wave 1 start)
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 21,
    zoneZ: 74,
    zoneW: 18,
    zoneH: 16,
    roomId: giudeccaId,
    once: true,
    actionData: { type: 'falling_ice', interval: 8, damage: 10, aoe: 2, delay: 5 },
  });

  // T12: floorCollapse -- Giudecca floor sections break (on wave 2 start)
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 21,
    zoneZ: 74,
    zoneW: 18,
    zoneH: 16,
    roomId: giudeccaId,
    once: true,
    actionData: {
      type: 'floorCollapse',
      sections: 4,
      sectionSize: 3,
      collapseInterval: 5,
      delay: 5,
    },
  });

  // T14: floorCollapse -- more floor breakage (on wave 3 start)
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 21,
    zoneZ: 74,
    zoneW: 18,
    zoneH: 16,
    roomId: giudeccaId,
    once: true,
    actionData: { type: 'floorCollapse', sections: 2, sectionSize: 2, collapseInterval: 8 },
  });

  // T16: bossIntro -- player enters boss chamber entrance zone
  //   Zone from table: (27, 136, 6, 2)
  editor.bossIntro(
    LEVEL_ID,
    { x: 27, z: 136, w: 6, h: 2 },
    'You came. I have been waiting since the first goat was cast out.',
    { roomId: azazelThroneId },
  );

  // T17: lockDoors on boss intro (with 5s delay)
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.LOCK_DOORS,
    zoneX: 27,
    zoneZ: 136,
    zoneW: 6,
    zoneH: 2,
    roomId: azazelThroneId,
    once: true,
    delay: 5,
  });

  // T18: bossPhaseChange -- Boss HP < 50% -> phase 2 (shatterIce)
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 20,
    zoneZ: 134,
    zoneW: 20,
    zoneH: 20,
    roomId: azazelThroneId,
    once: true,
    actionData: { condition: 'bossHpBelow50', phase: 2, action: 'shatterIce' },
  });

  // T19: floorFragment -- on phase 2 start (floor breaks into platforms)
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 20,
    zoneZ: 134,
    zoneW: 20,
    zoneH: 20,
    roomId: azazelThroneId,
    once: true,
    actionData: {
      type: 'floorFragment',
      platforms: 15,
      minSize: 3,
      maxSize: 4,
      gapSize: 1,
      voidElevation: -8,
      condition: 'bossHpBelow50',
    },
  });

  // T20: bossPhaseChange -- Boss HP < 10% -> phase 3 (revelation)
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 20,
    zoneZ: 134,
    zoneW: 20,
    zoneH: 20,
    roomId: azazelThroneId,
    once: true,
    actionData: { condition: 'bossHpBelow10', phase: 3, action: 'revelation' },
  });

  // T21: ambientChange -- Boss HP < 10% (fog clears to 0.00, silence)
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 20,
    zoneZ: 134,
    zoneW: 20,
    zoneH: 20,
    roomId: azazelThroneId,
    once: true,
    actionData: {
      fogDensity: 0.0,
      music: 'silence',
      sfx: 'wind_low',
      condition: 'bossHpBelow10',
    },
  });

  // T22: endingEvaluate -- on phase 3 speech complete
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 20,
    zoneZ: 134,
    zoneW: 20,
    zoneH: 20,
    roomId: azazelThroneId,
    once: true,
    actionData: {
      type: 'endingEvaluate',
      metric: 'optionalKillPercentage',
      threshold: 0.3,
      condition: 'phase3Complete',
    },
  });

  // =========================================================================
  // 7. ENVIRONMENT ZONES (from "Environment Zones" table)
  // =========================================================================

  // Global freeze: cold blue-black baseline fog
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.FOG,
    boundsX: 0,
    boundsZ: 0,
    boundsW: 60,
    boundsH: 154,
    intensity: 0.3,
  });

  // Ice floor friction: all rooms except bridge
  //   Glacial Stairs (very slippery ramps)
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.ICE,
    boundsX: 26,
    boundsZ: 2,
    boundsW: 8,
    boundsH: 16,
    intensity: 0.6,
  });
  //   Caina
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.ICE,
    boundsX: 22,
    boundsZ: 22,
    boundsW: 16,
    boundsH: 14,
    intensity: 0.8,
  });
  //   Antenora
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.ICE,
    boundsX: 24,
    boundsZ: 40,
    boundsW: 12,
    boundsH: 16,
    intensity: 0.8,
  });
  //   Ptolomea
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.ICE,
    boundsX: 23,
    boundsZ: 60,
    boundsW: 14,
    boundsH: 10,
    intensity: 0.8,
  });
  //   Giudecca
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.ICE,
    boundsX: 21,
    boundsZ: 74,
    boundsW: 18,
    boundsH: 16,
    intensity: 0.8,
  });
  //   Boss chamber
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.ICE,
    boundsX: 20,
    boundsZ: 134,
    boundsW: 20,
    boundsH: 20,
    intensity: 0.8,
  });

  // Bridge friction: slightly less slippery
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.ICE,
    boundsX: 28,
    boundsZ: 94,
    boundsW: 4,
    boundsH: 36,
    intensity: 0.85,
  });

  // Wind (bridge): crosswind, snow particle drift
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.WIND,
    boundsX: 28,
    boundsZ: 94,
    boundsW: 4,
    boundsH: 36,
    intensity: 0.6,
    directionX: 1, // Crosswind from west
    directionZ: 0,
  });

  // Wind (boss): gentle updraft from void below
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.WIND,
    boundsX: 20,
    boundsZ: 134,
    boundsW: 20,
    boundsH: 20,
    intensity: 0.2,
    directionX: 0,
    directionZ: -1, // Updraft
  });

  // Void glow: deep indigo glow from abyss (below rooms at elev < -4)
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.VOID,
    boundsX: 0,
    boundsZ: 74,
    boundsW: 60,
    boundsH: 80,
    intensity: 0.03,
  });

  // =========================================================================
  // 8. PLAYER SPAWN (from "Player Spawn" section)
  // =========================================================================
  //   Position: (30, 3) -- top of Glacial Stairs
  //   Facing: pi (south -- facing down the descent into the frozen depths)

  editor.setPlayerSpawn(LEVEL_ID, 30, 3, Math.PI);

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
    throw new Error('Circle 9 (Treachery) level validation failed');
  }
  console.log('Circle 9 (Treachery) built successfully');
  if (result.warnings.length > 0) {
    console.log('Warnings:', result.warnings);
  }
}
