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
  DECAL_TYPES,
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
  // 1x treachery-ice-arch (top entrance, spawn)
  editor.spawnProp(LEVEL_ID, 'treachery-ice-arch', 30, 3, { roomId: glacialStairsId });
  // 4x treachery-unlit-lantern (wall, E/W alternating, frost-covered, dead)
  editor.spawnProp(LEVEL_ID, 'treachery-unlit-lantern', 27, 5, {
    roomId: glacialStairsId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.8,
    },
  });
  editor.spawnProp(LEVEL_ID, 'treachery-unlit-lantern', 32, 8, {
    roomId: glacialStairsId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.8,
    },
  });
  editor.spawnProp(LEVEL_ID, 'treachery-unlit-lantern', 27, 11, {
    roomId: glacialStairsId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.8,
    },
  });
  editor.spawnProp(LEVEL_ID, 'treachery-unlit-lantern', 32, 14, {
    roomId: glacialStairsId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.8,
    },
  });
  // 2x treachery-frozen-chain-cluster (ceiling, landings 2 and 4)
  editor.spawnProp(LEVEL_ID, 'treachery-frozen-chain-cluster', 30, 7, { roomId: glacialStairsId });
  editor.spawnProp(LEVEL_ID, 'treachery-frozen-chain-cluster', 30, 13, { roomId: glacialStairsId });
  // 3x treachery-frozen-stalactite (ceiling, landings 1/3/5)
  editor.spawnProp(LEVEL_ID, 'treachery-frozen-stalactite', 30, 4, { roomId: glacialStairsId });
  editor.spawnProp(LEVEL_ID, 'treachery-frozen-stalactite', 30, 10, { roomId: glacialStairsId });
  editor.spawnProp(LEVEL_ID, 'treachery-frozen-stalactite', 30, 16, { roomId: glacialStairsId });
  // 2x treachery-snow-drift-mound (alcove corners)
  editor.spawnProp(LEVEL_ID, 'treachery-snow-drift-mound', 27, 6, { roomId: glacialStairsId });
  editor.spawnProp(LEVEL_ID, 'treachery-snow-drift-mound', 32, 12, { roomId: glacialStairsId });
  // 1x treachery-ice-crack-floor (ramp surfaces)
  editor.spawnProp(LEVEL_ID, 'treachery-ice-crack-floor', 30, 9, { roomId: glacialStairsId });

  // --- Caina (bounds: 22, 22, 16, 14) ---
  // 6x ice-pillar (structural, 2 rows of 3, staggered, reflective surfaces)
  editor.spawnProp(LEVEL_ID, 'ice-pillar', 25, 25, { roomId: cainaId });
  editor.spawnProp(LEVEL_ID, 'ice-pillar', 30, 25, { roomId: cainaId });
  editor.spawnProp(LEVEL_ID, 'ice-pillar', 35, 25, { roomId: cainaId });
  editor.spawnProp(LEVEL_ID, 'ice-pillar', 25, 31, { roomId: cainaId });
  editor.spawnProp(LEVEL_ID, 'ice-pillar', 30, 31, { roomId: cainaId });
  editor.spawnProp(LEVEL_ID, 'ice-pillar', 35, 31, { roomId: cainaId });
  // 1x treachery-ice-arch (south corridor exit to Antenora)
  editor.spawnProp(LEVEL_ID, 'treachery-ice-arch', 30, 34, { roomId: cainaId });
  // 3x treachery-betrayer-cage (embedded in floor ice, frozen betrayers)
  editor.spawnProp(LEVEL_ID, 'treachery-betrayer-cage', 27, 28, { roomId: cainaId });
  editor.spawnProp(LEVEL_ID, 'treachery-betrayer-cage', 33, 26, { roomId: cainaId });
  editor.spawnProp(LEVEL_ID, 'treachery-betrayer-cage', 26, 33, { roomId: cainaId });
  // 2x treachery-frozen-sword (frozen into pillar surfaces)
  editor.spawnProp(LEVEL_ID, 'treachery-frozen-sword', 25, 26, {
    roomId: cainaId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.7,
    },
  });
  editor.spawnProp(LEVEL_ID, 'treachery-frozen-sword', 35, 32, {
    roomId: cainaId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.7,
    },
  });
  // 1x treachery-ice-crack-floor (center lake area)
  editor.spawnProp(LEVEL_ID, 'treachery-ice-crack-floor', 30, 28, { roomId: cainaId });
  // 2x treachery-snow-drift-mound (NW/SE corners)
  editor.spawnProp(LEVEL_ID, 'treachery-snow-drift-mound', 23, 23, { roomId: cainaId });
  editor.spawnProp(LEVEL_ID, 'treachery-snow-drift-mound', 36, 34, { roomId: cainaId });
  // 1x treachery-dark-ice-monolith (hero piece, center-north edge)
  editor.spawnProp(LEVEL_ID, 'treachery-dark-ice-monolith', 30, 23, { roomId: cainaId });

  // --- Antenora (bounds: 24, 40, 12, 16) ---
  // 2x treachery-ice-arch (north entrance, south exit)
  editor.spawnProp(LEVEL_ID, 'treachery-ice-arch', 30, 41, { roomId: antenoraId });
  editor.spawnProp(LEVEL_ID, 'treachery-ice-arch', 30, 54, { roomId: antenoraId });
  // 4x treachery-frozen-banner (wall, N/S alternating, frozen stiff)
  editor.spawnProp(LEVEL_ID, 'treachery-frozen-banner', 26, 41, {
    roomId: antenoraId,
    surfaceAnchor: {
      face: 'north',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.8,
    },
  });
  editor.spawnProp(LEVEL_ID, 'treachery-frozen-banner', 32, 45, {
    roomId: antenoraId,
    surfaceAnchor: {
      face: 'south',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.8,
    },
  });
  editor.spawnProp(LEVEL_ID, 'treachery-frozen-banner', 26, 49, {
    roomId: antenoraId,
    surfaceAnchor: {
      face: 'north',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.8,
    },
  });
  editor.spawnProp(LEVEL_ID, 'treachery-frozen-banner', 32, 53, {
    roomId: antenoraId,
    surfaceAnchor: {
      face: 'south',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.8,
    },
  });
  // 1x treachery-crystalline-spike-wall (corridor dead-end wall)
  editor.spawnProp(LEVEL_ID, 'treachery-crystalline-spike-wall', 34, 46, {
    roomId: antenoraId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.8,
    },
  });
  // 2x treachery-frozen-chain-cluster (ceiling, corridor intersections)
  editor.spawnProp(LEVEL_ID, 'treachery-frozen-chain-cluster', 30, 44, { roomId: antenoraId });
  editor.spawnProp(LEVEL_ID, 'treachery-frozen-chain-cluster', 30, 50, { roomId: antenoraId });
  // 3x treachery-snow-drift-mound (alcove recesses)
  editor.spawnProp(LEVEL_ID, 'treachery-snow-drift-mound', 25, 43, { roomId: antenoraId });
  editor.spawnProp(LEVEL_ID, 'treachery-snow-drift-mound', 34, 47, { roomId: antenoraId });
  editor.spawnProp(LEVEL_ID, 'treachery-snow-drift-mound', 25, 51, { roomId: antenoraId });
  // 2x stalactite-cluster (general, corridor ceiling)
  editor.spawnProp(LEVEL_ID, 'stalactite-cluster', 30, 42, { roomId: antenoraId });
  editor.spawnProp(LEVEL_ID, 'stalactite-cluster', 30, 52, { roomId: antenoraId });

  // --- Ptolomea (bounds: 23, 60, 14, 10) ---
  // 1x treachery-ice-arch (north entrance, low clearance)
  editor.spawnProp(LEVEL_ID, 'treachery-ice-arch', 30, 61, { roomId: ptolomeaId });
  // 1x treachery-frozen-feast-table (center, frost-covered banquet)
  editor.spawnProp(LEVEL_ID, 'treachery-frozen-feast-table', 30, 64, { roomId: ptolomeaId });
  // 6x chair (general, around table, some knocked over)
  editor.spawnProp(LEVEL_ID, 'chair', 28, 63, { roomId: ptolomeaId });
  editor.spawnProp(LEVEL_ID, 'chair', 30, 63, { roomId: ptolomeaId });
  editor.spawnProp(LEVEL_ID, 'chair', 32, 63, { roomId: ptolomeaId });
  editor.spawnProp(LEVEL_ID, 'chair', 28, 66, { roomId: ptolomeaId });
  editor.spawnProp(LEVEL_ID, 'chair', 30, 66, { roomId: ptolomeaId });
  editor.spawnProp(LEVEL_ID, 'chair', 32, 66, { roomId: ptolomeaId });
  // 2x treachery-frost-chalice (on table, frozen contents)
  editor.spawnProp(LEVEL_ID, 'treachery-frost-chalice', 29, 64, { roomId: ptolomeaId });
  editor.spawnProp(LEVEL_ID, 'treachery-frost-chalice', 31, 64, { roomId: ptolomeaId });
  // 2x broken-pot (general, on table, shattered by ice expansion)
  editor.spawnProp(LEVEL_ID, 'broken-pot', 30, 65, { roomId: ptolomeaId });
  editor.spawnProp(LEVEL_ID, 'broken-pot', 31, 65, { roomId: ptolomeaId });
  // 1x treachery-snow-drift-mound (SE corner)
  editor.spawnProp(LEVEL_ID, 'treachery-snow-drift-mound', 35, 67, { roomId: ptolomeaId });
  // 1x frozen-goat (under table, partially visible)
  editor.spawnProp(LEVEL_ID, 'frozen-goat', 30, 65, { roomId: ptolomeaId });
  // 2x crystal (general, ice formations growing from floor)
  editor.spawnProp(LEVEL_ID, 'crystal', 26, 62, { roomId: ptolomeaId });
  editor.spawnProp(LEVEL_ID, 'crystal', 34, 64, { roomId: ptolomeaId });

  // --- Giudecca (bounds: 21, 74, 18, 16) ---
  // 1x treachery-frozen-waterfall (HERO PIECE, south/back wall, 8 cells wide, full height)
  editor.spawnProp(LEVEL_ID, 'treachery-frozen-waterfall', 30, 88, { roomId: giudeccaId });
  // 6x ice-pillar (2 rows of 3, staggered, cover + reflection)
  editor.spawnProp(LEVEL_ID, 'ice-pillar', 25, 77, { roomId: giudeccaId });
  editor.spawnProp(LEVEL_ID, 'ice-pillar', 30, 77, { roomId: giudeccaId });
  editor.spawnProp(LEVEL_ID, 'ice-pillar', 35, 77, { roomId: giudeccaId });
  editor.spawnProp(LEVEL_ID, 'ice-pillar', 25, 83, { roomId: giudeccaId });
  editor.spawnProp(LEVEL_ID, 'ice-pillar', 30, 83, { roomId: giudeccaId });
  editor.spawnProp(LEVEL_ID, 'ice-pillar', 35, 83, { roomId: giudeccaId });
  // 6x treachery-frozen-stalactite (ceiling, hazards that fall during waves)
  editor.spawnProp(LEVEL_ID, 'treachery-frozen-stalactite', 24, 76, { roomId: giudeccaId });
  editor.spawnProp(LEVEL_ID, 'treachery-frozen-stalactite', 30, 76, { roomId: giudeccaId });
  editor.spawnProp(LEVEL_ID, 'treachery-frozen-stalactite', 36, 76, { roomId: giudeccaId });
  editor.spawnProp(LEVEL_ID, 'treachery-frozen-stalactite', 24, 84, { roomId: giudeccaId });
  editor.spawnProp(LEVEL_ID, 'treachery-frozen-stalactite', 30, 84, { roomId: giudeccaId });
  editor.spawnProp(LEVEL_ID, 'treachery-frozen-stalactite', 36, 84, { roomId: giudeccaId });
  // 4x treachery-glacial-platform (floor fragments, form as floor collapses)
  editor.spawnProp(LEVEL_ID, 'treachery-glacial-platform', 24, 78, { roomId: giudeccaId });
  editor.spawnProp(LEVEL_ID, 'treachery-glacial-platform', 34, 78, { roomId: giudeccaId });
  editor.spawnProp(LEVEL_ID, 'treachery-glacial-platform', 24, 86, { roomId: giudeccaId });
  editor.spawnProp(LEVEL_ID, 'treachery-glacial-platform', 34, 86, { roomId: giudeccaId });
  // 4x treachery-ice-crack-floor (visible crack patterns at future collapse points)
  editor.spawnProp(LEVEL_ID, 'treachery-ice-crack-floor', 24, 79, { roomId: giudeccaId });
  editor.spawnProp(LEVEL_ID, 'treachery-ice-crack-floor', 34, 79, { roomId: giudeccaId });
  editor.spawnProp(LEVEL_ID, 'treachery-ice-crack-floor', 24, 85, { roomId: giudeccaId });
  editor.spawnProp(LEVEL_ID, 'treachery-ice-crack-floor', 34, 85, { roomId: giudeccaId });
  // 4x treachery-frozen-chain-cluster (ceiling, massive, quadrant markers)
  editor.spawnProp(LEVEL_ID, 'treachery-frozen-chain-cluster', 25, 78, { roomId: giudeccaId });
  editor.spawnProp(LEVEL_ID, 'treachery-frozen-chain-cluster', 35, 78, { roomId: giudeccaId });
  editor.spawnProp(LEVEL_ID, 'treachery-frozen-chain-cluster', 25, 86, { roomId: giudeccaId });
  editor.spawnProp(LEVEL_ID, 'treachery-frozen-chain-cluster', 35, 86, { roomId: giudeccaId });
  // 2x treachery-dark-ice-monolith (flanking entrance, sets visual tone)
  editor.spawnProp(LEVEL_ID, 'treachery-dark-ice-monolith', 22, 75, { roomId: giudeccaId });
  editor.spawnProp(LEVEL_ID, 'treachery-dark-ice-monolith', 37, 75, { roomId: giudeccaId });
  // 2x treachery-snow-drift-mound (south corners, near frozen waterfall base)
  editor.spawnProp(LEVEL_ID, 'treachery-snow-drift-mound', 22, 87, { roomId: giudeccaId });
  editor.spawnProp(LEVEL_ID, 'treachery-snow-drift-mound', 37, 87, { roomId: giudeccaId });

  // --- Judas Trap (bounds: 12, 78, 6, 6) ---
  // 1x treachery-betrayer-cage (floor, containing frozen goat figure)
  editor.spawnProp(LEVEL_ID, 'treachery-betrayer-cage', 14, 81, { roomId: judasTrapId });
  // 1x frozen-goat (inside cage, previous scapegoat)
  editor.spawnProp(LEVEL_ID, 'frozen-goat', 14, 81, { roomId: judasTrapId });
  // 2x treachery-snow-drift-mound (corners, thin covering)
  editor.spawnProp(LEVEL_ID, 'treachery-snow-drift-mound', 13, 79, { roomId: judasTrapId });
  editor.spawnProp(LEVEL_ID, 'treachery-snow-drift-mound', 16, 83, { roomId: judasTrapId });
  // 1x treachery-ice-crack-floor (around cage, aged cracking)
  editor.spawnProp(LEVEL_ID, 'treachery-ice-crack-floor', 13, 80, { roomId: judasTrapId });
  // 1x crystal (general, ice crystal growth near frozen figure)
  editor.spawnProp(LEVEL_ID, 'crystal', 15, 80, { roomId: judasTrapId });

  // --- Cocytus Bridge (bounds: 28, 94, 4, 36) ---
  // NONE. Empty ice. Void below. Wind only.

  // --- Azazel's Frozen Throne (bounds: 20, 134, 20, 20) ---
  // HERO PIECE: 1x treachery-ice-formation (central ice prison, 4x4 cells, 3 cells tall)
  editor.spawnProp(LEVEL_ID, 'treachery-ice-formation', 30, 144, { roomId: azazelThroneId });
  // 1x treachery-frozen-throne (within ice formation, revealed phase 2)
  editor.spawnProp(LEVEL_ID, 'treachery-frozen-throne', 30, 144, { roomId: azazelThroneId });
  // 4x treachery-dark-ice-monolith (arena quadrant markers, tallest vertical elements)
  editor.spawnProp(LEVEL_ID, 'treachery-dark-ice-monolith', 23, 139, { roomId: azazelThroneId });
  editor.spawnProp(LEVEL_ID, 'treachery-dark-ice-monolith', 37, 139, { roomId: azazelThroneId });
  editor.spawnProp(LEVEL_ID, 'treachery-dark-ice-monolith', 23, 149, { roomId: azazelThroneId });
  editor.spawnProp(LEVEL_ID, 'treachery-dark-ice-monolith', 37, 149, { roomId: azazelThroneId });
  // 4x treachery-crystalline-spike-wall (perimeter ring, N/E/S/W edges)
  editor.spawnProp(LEVEL_ID, 'treachery-crystalline-spike-wall', 30, 135, {
    roomId: azazelThroneId,
    surfaceAnchor: {
      face: 'north',
      offsetX: 0,
      offsetY: 0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.2,
    },
  });
  editor.spawnProp(LEVEL_ID, 'treachery-crystalline-spike-wall', 39, 144, {
    roomId: azazelThroneId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.2,
    },
  });
  editor.spawnProp(LEVEL_ID, 'treachery-crystalline-spike-wall', 30, 153, {
    roomId: azazelThroneId,
    surfaceAnchor: {
      face: 'south',
      offsetX: 0,
      offsetY: 0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.2,
    },
  });
  editor.spawnProp(LEVEL_ID, 'treachery-crystalline-spike-wall', 21, 144, {
    roomId: azazelThroneId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.2,
    },
  });
  // 4x treachery-frozen-chain-cluster (ceiling, massive, quadrant boundaries)
  editor.spawnProp(LEVEL_ID, 'treachery-frozen-chain-cluster', 25, 139, { roomId: azazelThroneId });
  editor.spawnProp(LEVEL_ID, 'treachery-frozen-chain-cluster', 35, 139, { roomId: azazelThroneId });
  editor.spawnProp(LEVEL_ID, 'treachery-frozen-chain-cluster', 25, 149, { roomId: azazelThroneId });
  editor.spawnProp(LEVEL_ID, 'treachery-frozen-chain-cluster', 35, 149, { roomId: azazelThroneId });
  // 4x treachery-frozen-stalactite (ceiling, between chains)
  editor.spawnProp(LEVEL_ID, 'treachery-frozen-stalactite', 27, 137, { roomId: azazelThroneId });
  editor.spawnProp(LEVEL_ID, 'treachery-frozen-stalactite', 33, 137, { roomId: azazelThroneId });
  editor.spawnProp(LEVEL_ID, 'treachery-frozen-stalactite', 27, 151, { roomId: azazelThroneId });
  editor.spawnProp(LEVEL_ID, 'treachery-frozen-stalactite', 33, 151, { roomId: azazelThroneId });
  // 1x treachery-ice-crack-floor (around central formation, 4-cell ring)
  editor.spawnProp(LEVEL_ID, 'treachery-ice-crack-floor', 30, 144, { roomId: azazelThroneId });
  // 4x treachery-glacial-platform (phase 2 floor fragments, positioned at quadrants)
  editor.spawnProp(LEVEL_ID, 'treachery-glacial-platform', 24, 138, { roomId: azazelThroneId });
  editor.spawnProp(LEVEL_ID, 'treachery-glacial-platform', 36, 138, { roomId: azazelThroneId });
  editor.spawnProp(LEVEL_ID, 'treachery-glacial-platform', 24, 150, { roomId: azazelThroneId });
  editor.spawnProp(LEVEL_ID, 'treachery-glacial-platform', 36, 150, { roomId: azazelThroneId });
  // 2x treachery-frozen-banner (near entrance, from a forgotten age)
  editor.spawnProp(LEVEL_ID, 'treachery-frozen-banner', 27, 135, {
    roomId: azazelThroneId,
    surfaceAnchor: {
      face: 'north',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.8,
    },
  });
  editor.spawnProp(LEVEL_ID, 'treachery-frozen-banner', 33, 135, {
    roomId: azazelThroneId,
    surfaceAnchor: {
      face: 'north',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.8,
    },
  });
  // 1x treachery-snow-drift-mound (entrance area, blown in from bridge)
  editor.spawnProp(LEVEL_ID, 'treachery-snow-drift-mound', 30, 135, { roomId: azazelThroneId });
  // 1x treachery-frozen-waterfall (west wall fragment, echo of Giudecca)
  editor.spawnProp(LEVEL_ID, 'treachery-frozen-waterfall', 21, 144, { roomId: azazelThroneId });

  // =========================================================================
  // 5d. DECALS (ice frost, snow drift, concrete cracks — Treachery theme)
  // =========================================================================
  // THE ice circle — heavy decal placement.
  // Ice frost on ALL wall surfaces (creeping cold).
  // Snow drift on floor edges, corners, stair landings.
  // Concrete cracks on ice floor in Giudecca and Boss rooms (frozen lake fractures).

  // --- Glacial Stairs (bounds: 26, 2, 8, 16) ---
  // Ice frost on walls, snow drifts on landings
  editor.placeDecals(LEVEL_ID, glacialStairsId, [
    { type: DECAL_TYPES.ICE_FROST, x: 27, z: 4, surface: 'wall' },
    { type: DECAL_TYPES.ICE_FROST, x: 32, z: 10, surface: 'wall' },
    { type: DECAL_TYPES.SNOW_DRIFT, x: 28, z: 6, w: 3, h: 2 },
    { type: DECAL_TYPES.SNOW_DRIFT, x: 31, z: 12, w: 3, h: 2 },
  ]);

  // --- Caina (bounds: 22, 22, 16, 14) ---
  // Ice frost creeping on all walls, snow drifts in corners
  editor.placeDecals(LEVEL_ID, cainaId, [
    { type: DECAL_TYPES.ICE_FROST, x: 23, z: 24, surface: 'wall' },
    { type: DECAL_TYPES.ICE_FROST, x: 36, z: 24, surface: 'wall' },
    { type: DECAL_TYPES.ICE_FROST, x: 23, z: 32, surface: 'wall' },
    { type: DECAL_TYPES.ICE_FROST, x: 36, z: 32, surface: 'wall' },
    { type: DECAL_TYPES.SNOW_DRIFT, x: 23, z: 23, w: 3, h: 2 },
    { type: DECAL_TYPES.SNOW_DRIFT, x: 36, z: 34, w: 3, h: 2 },
  ]);

  // --- Antenora (bounds: 24, 40, 12, 16) ---
  // Ice frost on corridor walls, snow drifts in alcove recesses
  editor.placeDecals(LEVEL_ID, antenoraId, [
    { type: DECAL_TYPES.ICE_FROST, x: 25, z: 42, surface: 'wall' },
    { type: DECAL_TYPES.ICE_FROST, x: 34, z: 48, surface: 'wall' },
    { type: DECAL_TYPES.SNOW_DRIFT, x: 25, z: 43, w: 2, h: 2 },
    { type: DECAL_TYPES.SNOW_DRIFT, x: 34, z: 51, w: 2, h: 2 },
  ]);

  // --- Ptolomea (bounds: 23, 60, 14, 10) ---
  // Ice frost on walls, snow drift near SE corner
  editor.placeDecals(LEVEL_ID, ptolomeaId, [
    { type: DECAL_TYPES.ICE_FROST, x: 24, z: 62, surface: 'wall' },
    { type: DECAL_TYPES.ICE_FROST, x: 35, z: 66, surface: 'wall' },
    { type: DECAL_TYPES.SNOW_DRIFT, x: 35, z: 67, w: 2, h: 2 },
  ]);

  // --- Giudecca (bounds: 21, 74, 18, 16) ---
  // Ice frost on all walls, concrete cracks on frozen lake floor, snow drifts
  editor.placeDecals(LEVEL_ID, giudeccaId, [
    { type: DECAL_TYPES.ICE_FROST, x: 22, z: 76, surface: 'wall' },
    { type: DECAL_TYPES.ICE_FROST, x: 37, z: 76, surface: 'wall' },
    { type: DECAL_TYPES.ICE_FROST, x: 22, z: 86, surface: 'wall' },
    { type: DECAL_TYPES.ICE_FROST, x: 37, z: 86, surface: 'wall' },
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 26, z: 80, w: 3, h: 3 },
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 34, z: 80, w: 3, h: 3 },
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 30, z: 84, w: 4, h: 3 },
    { type: DECAL_TYPES.SNOW_DRIFT, x: 22, z: 87, w: 3, h: 2 },
    { type: DECAL_TYPES.SNOW_DRIFT, x: 37, z: 87, w: 3, h: 2 },
  ]);

  // --- Judas Trap (bounds: 12, 78, 6, 6) ---
  // Ice frost on walls, snow drift in corners
  editor.placeDecals(LEVEL_ID, judasTrapId, [
    { type: DECAL_TYPES.ICE_FROST, x: 13, z: 79, surface: 'wall' },
    { type: DECAL_TYPES.SNOW_DRIFT, x: 16, z: 83, w: 2, h: 2 },
  ]);

  // --- Cocytus Bridge (bounds: 28, 94, 4, 36) ---
  // No decals. Empty ice. Void below.

  // --- Azazel's Frozen Throne (bounds: 20, 134, 20, 20) ---
  // Ice frost on all walls (massive), concrete cracks radiating from center, snow at entrance
  editor.placeDecals(LEVEL_ID, azazelThroneId, [
    { type: DECAL_TYPES.ICE_FROST, x: 21, z: 138, w: 3, h: 3, surface: 'wall' },
    { type: DECAL_TYPES.ICE_FROST, x: 39, z: 138, w: 3, h: 3, surface: 'wall' },
    { type: DECAL_TYPES.ICE_FROST, x: 21, z: 150, w: 3, h: 3, surface: 'wall' },
    { type: DECAL_TYPES.ICE_FROST, x: 39, z: 150, w: 3, h: 3, surface: 'wall' },
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 28, z: 142, w: 4, h: 4 },
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 32, z: 146, w: 4, h: 4 },
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 26, z: 148, w: 3, h: 3 },
    { type: DECAL_TYPES.SNOW_DRIFT, x: 30, z: 135, w: 4, h: 2 },
  ]);

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
