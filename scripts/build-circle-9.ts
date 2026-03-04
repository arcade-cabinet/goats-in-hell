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
    enemyTypes: ['frost', 'goatKnight'],
    texturePalette: { exploration: 'ice', arena: 'ice-deep', boss: 'ice-deep', secret: 'ice' },
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
    floor: 9,
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
    floorTexture: 'ice',
    wallTexture: 'stone-dark',
  });

  const cainaId = editor.room(LEVEL_ID, 'caina', 22, 22, 16, 14, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: -3,
    sortOrder: 1,
    floorTexture: 'ice',
    wallTexture: 'ice',
    fillRule: {
      type: 'scatter',
      props: [
        'treachery-ice-formation',
        'treachery-frozen-chain-cluster',
        'treachery-betrayer-cage',
      ],
      density: 0.1,
    },
  });

  const antenoraId = editor.room(LEVEL_ID, 'antenora', 24, 40, 12, 16, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: -3,
    sortOrder: 2,
    floorTexture: 'ice-deep',
    wallTexture: 'ice',
    fillRule: {
      type: 'scatter',
      props: ['treachery-dark-ice-monolith', 'treachery-crystalline-spike-wall', 'ice-pillar'],
      density: 0.1,
    },
  });

  const ptolomeaId = editor.room(LEVEL_ID, 'ptolomea', 23, 60, 14, 10, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: -4,
    sortOrder: 3,
    floorTexture: 'ice',
    wallTexture: 'stone-dark',
    fillRule: {
      type: 'scatter',
      props: ['treachery-frozen-feast-table', 'treachery-frost-chalice', 'soul-cage'],
      density: 0.08,
    },
  });

  const giudeccaId = editor.room(LEVEL_ID, 'giudecca', 21, 74, 18, 16, {
    roomType: ROOM_TYPES.ARENA,
    elevation: -4,
    sortOrder: 4,
    floorTexture: 'ice-deep',
    wallTexture: 'ice-deep',
    fillRule: {
      type: 'scatter',
      props: ['treachery-frozen-throne', 'treachery-frozen-sword', 'treachery-glacial-platform'],
      density: 0.08,
    },
  });

  const judasTrapId = editor.room(LEVEL_ID, 'judas_trap', 12, 78, 6, 6, {
    roomType: ROOM_TYPES.SECRET,
    elevation: -4,
    sortOrder: 5,
    floorTexture: 'ice-deep',
    fillRule: {
      type: 'scatter',
      props: ['treachery-frozen-waterfall', 'treachery-frozen-stalactite'],
      density: 0.06,
    },
  });

  // Note: design doc says "bridge" room type, but ROOM_TYPES does not have BRIDGE.
  // Using CORRIDOR as the closest match for a narrow connecting passage.
  const cocytusBridgeId = editor.room(LEVEL_ID, 'cocytus_bridge', 28, 94, 4, 36, {
    roomType: ROOM_TYPES.CORRIDOR,
    elevation: -5,
    sortOrder: 6,
    floorTexture: 'ice',
    fillRule: {
      type: 'scatter',
      props: [
        'treachery-ice-bridge-segment',
        'treachery-ice-crack-floor',
        'treachery-snow-drift-mound',
      ],
      density: 0.1,
    },
  });

  const azazelThroneId = editor.room(LEVEL_ID, 'azazels_frozen_throne', 20, 134, 20, 20, {
    roomType: ROOM_TYPES.BOSS,
    elevation: -6,
    sortOrder: 7,
    floorTexture: 'ice-deep',
    wallTexture: 'ice-deep',
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

  // --- Glacial Stairs: 2 frostWhelp ambush + 1 frostWhelp (teaching encounters) ---
  //   Room bounds: (26, 2, 8, 16) -> interior: x=[27..32], z=[3..16]
  //   T1: frostWhelp ambush at landing 2 zone (27, 6, 6, 3)
  //   T2: frostWhelp ambush at landing 4 zone (27, 12, 6, 3)
  editor.ambush(
    LEVEL_ID,
    { x: 27, z: 6, w: 6, h: 3 },
    [{ type: ENEMY_TYPES.FROST_WHELP, x: 28, z: 7 }],
    {
      roomId: glacialStairsId,
    },
  );
  editor.ambush(
    LEVEL_ID,
    { x: 27, z: 12, w: 6, h: 3 },
    [{ type: ENEMY_TYPES.FROST_WHELP, x: 31, z: 13 }],
    { roomId: glacialStairsId },
  );
  // frostWhelp at landing 3, solo learning encounter
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST_WHELP, 30, 10, {
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
      { type: ENEMY_TYPES.FROST_ELDER, x: 28, z: 25 },
      { type: ENEMY_TYPES.FROST_ELDER, x: 34, z: 31 },
      { type: ENEMY_TYPES.FROST_ELDER, x: 28, z: 33 },
    ],
    { roomId: cainaId },
  );
  // 1 shadowGoat patrols behind ice pillars
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 24, 30, {
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
    [{ type: ENEMY_TYPES.FROST, x: 33, z: 43 }],
    { roomId: antenoraId },
  );
  editor.ambush(
    LEVEL_ID,
    { x: 25, z: 48, w: 10, h: 4 },
    [{ type: ENEMY_TYPES.FROST, x: 33, z: 49 }],
    { roomId: antenoraId },
  );
  editor.ambush(
    LEVEL_ID,
    { x: 25, z: 52, w: 10, h: 4 },
    [{ type: ENEMY_TYPES.FROST, x: 26, z: 53 }],
    { roomId: antenoraId },
  );
  // 1 fireGoat at corridor intersection
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 30, 46, {
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
      { type: ENEMY_TYPES.FROST_ELDER, x: 28, z: 63 },
      { type: ENEMY_TYPES.FROST_ELDER, x: 32, z: 63 },
      { type: ENEMY_TYPES.FROST, x: 34, z: 66 },
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
    // Wave 1: 2 frostElder from frozen waterfall (ancient guardians)
    [
      { type: ENEMY_TYPES.FROST_ELDER, x: 26, z: 76 },
      { type: ENEMY_TYPES.FROST_ELDER, x: 34, z: 76 },
    ],
    // Wave 2: 2 frost from floor + 1 frost elevated
    [
      { type: ENEMY_TYPES.FROST, x: 28, z: 82 },
      { type: ENEMY_TYPES.FROST, x: 34, z: 82 },
      { type: ENEMY_TYPES.FROST, x: 30, z: 78 },
    ],
    // Wave 3: mixed all types
    [
      { type: ENEMY_TYPES.FROST_ELDER, x: 30, z: 80 },
      { type: ENEMY_TYPES.FROST, x: 24, z: 84 },
      { type: ENEMY_TYPES.FROST, x: 36, z: 78 },
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
  // +1x prop-torch-mounted (functional torch at top — master plan Task 10)
  editor.spawnProp(LEVEL_ID, 'prop-torch-mounted', 27, 3, {
    roomId: glacialStairsId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // +3x prop-crystal (ice crystal formations on stair landings)
  editor.spawnProp(LEVEL_ID, 'prop-crystal', 28, 5, { roomId: glacialStairsId });
  editor.spawnProp(LEVEL_ID, 'prop-crystal', 31, 9, { roomId: glacialStairsId });
  editor.spawnProp(LEVEL_ID, 'prop-crystal', 28, 14, { roomId: glacialStairsId });
  // +2x prop-rock1 (frozen rock outcrops)
  editor.spawnProp(LEVEL_ID, 'prop-rock1', 27, 8, { roomId: glacialStairsId });
  editor.spawnProp(LEVEL_ID, 'prop-rock1', 32, 15, { roomId: glacialStairsId });

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
  // +2x prop-column (structural, flanking entrance — master plan Task 10)
  editor.spawnProp(LEVEL_ID, 'prop-column', 24, 23, { roomId: cainaId });
  editor.spawnProp(LEVEL_ID, 'prop-column', 36, 23, { roomId: cainaId });
  // +2x prop-crystal (ice crystal growths from frozen lake)
  editor.spawnProp(LEVEL_ID, 'prop-crystal', 27, 30, { roomId: cainaId });
  editor.spawnProp(LEVEL_ID, 'prop-crystal', 33, 28, { roomId: cainaId });
  // +2x prop-bones (frozen remains near betrayer cages)
  editor.spawnProp(LEVEL_ID, 'prop-bones', 28, 27, { roomId: cainaId });
  editor.spawnProp(LEVEL_ID, 'prop-bones', 34, 32, { roomId: cainaId });
  // +1x prop-cage (ice-encased cage)
  editor.spawnProp(LEVEL_ID, 'prop-cage', 26, 34, { roomId: cainaId });

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
  // +2x prop-banner-wall (frozen battle banners — master plan Task 10)
  editor.spawnProp(LEVEL_ID, 'prop-banner-wall', 25, 44, {
    roomId: antenoraId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.8,
    },
  });
  editor.spawnProp(LEVEL_ID, 'prop-banner-wall', 34, 50, {
    roomId: antenoraId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.8,
    },
  });
  // +2x prop-shield-wall (frozen shields mounted on walls)
  editor.spawnProp(LEVEL_ID, 'prop-shield-wall', 25, 48, {
    roomId: antenoraId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.8,
    },
  });
  editor.spawnProp(LEVEL_ID, 'prop-shield-wall', 34, 44, {
    roomId: antenoraId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.8,
    },
  });

  // --- Ptolomea (bounds: 23, 60, 14, 10) ---
  // 1x treachery-ice-arch (north entrance, low clearance)
  editor.spawnProp(LEVEL_ID, 'treachery-ice-arch', 30, 61, { roomId: ptolomeaId });
  // 1x treachery-frozen-feast-table (center, frost-covered banquet)
  editor.spawnProp(LEVEL_ID, 'treachery-frozen-feast-table', 30, 64, { roomId: ptolomeaId });
  // 6x prop-chair (around table, some knocked over)
  editor.spawnProp(LEVEL_ID, 'prop-chair', 28, 63, { roomId: ptolomeaId });
  editor.spawnProp(LEVEL_ID, 'prop-chair', 30, 63, { roomId: ptolomeaId });
  editor.spawnProp(LEVEL_ID, 'prop-chair', 32, 63, { roomId: ptolomeaId });
  editor.spawnProp(LEVEL_ID, 'prop-chair', 28, 66, { roomId: ptolomeaId });
  editor.spawnProp(LEVEL_ID, 'prop-chair', 30, 66, { roomId: ptolomeaId });
  editor.spawnProp(LEVEL_ID, 'prop-chair', 32, 66, { roomId: ptolomeaId });
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
  // 2x prop-crystal (ice formations growing from floor)
  editor.spawnProp(LEVEL_ID, 'prop-crystal', 26, 62, { roomId: ptolomeaId });
  editor.spawnProp(LEVEL_ID, 'prop-crystal', 34, 64, { roomId: ptolomeaId });
  // +1x prop-table (side table with frozen contents — master plan Task 10)
  editor.spawnProp(LEVEL_ID, 'prop-table', 26, 66, { roomId: ptolomeaId });
  // +1x prop-chalice (overturned chalice on side table)
  editor.spawnProp(LEVEL_ID, 'prop-chalice', 26, 66, { roomId: ptolomeaId });

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
  // +6x prop-column (cover columns — master plan Task 10, Giudecca was 4 props/288 cells)
  editor.spawnProp(LEVEL_ID, 'prop-column', 23, 77, { roomId: giudeccaId });
  editor.spawnProp(LEVEL_ID, 'prop-column', 37, 77, { roomId: giudeccaId });
  editor.spawnProp(LEVEL_ID, 'prop-column', 23, 83, { roomId: giudeccaId });
  editor.spawnProp(LEVEL_ID, 'prop-column', 37, 83, { roomId: giudeccaId });
  editor.spawnProp(LEVEL_ID, 'prop-column', 23, 88, { roomId: giudeccaId });
  editor.spawnProp(LEVEL_ID, 'prop-column', 37, 88, { roomId: giudeccaId });
  // +4x prop-crystal (ice crystal clusters for visual spectacle)
  editor.spawnProp(LEVEL_ID, 'prop-crystal', 26, 79, { roomId: giudeccaId });
  editor.spawnProp(LEVEL_ID, 'prop-crystal', 34, 79, { roomId: giudeccaId });
  editor.spawnProp(LEVEL_ID, 'prop-crystal', 26, 85, { roomId: giudeccaId });
  editor.spawnProp(LEVEL_ID, 'prop-crystal', 34, 85, { roomId: giudeccaId });

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
  // 1x prop-crystal (ice crystal growth near frozen figure)
  editor.spawnProp(LEVEL_ID, 'prop-crystal', 15, 80, { roomId: judasTrapId });
  // +1x prop-cage (additional cage — master plan Task 10)
  editor.spawnProp(LEVEL_ID, 'prop-cage', 16, 80, { roomId: judasTrapId });
  // +1x prop-bones (frozen remains inside cage)
  editor.spawnProp(LEVEL_ID, 'prop-bones', 14, 82, { roomId: judasTrapId });

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
  // +4x prop-column (arena pillars for cover — master plan Task 10, was 4 props/400 cells)
  editor.spawnProp(LEVEL_ID, 'prop-column', 25, 140, { roomId: azazelThroneId });
  editor.spawnProp(LEVEL_ID, 'prop-column', 35, 140, { roomId: azazelThroneId });
  editor.spawnProp(LEVEL_ID, 'prop-column', 25, 148, { roomId: azazelThroneId });
  editor.spawnProp(LEVEL_ID, 'prop-column', 35, 148, { roomId: azazelThroneId });
  // +4x prop-crystal (massive ice crystal formations — final boss must be spectacular)
  editor.spawnProp(LEVEL_ID, 'prop-crystal', 27, 142, { roomId: azazelThroneId });
  editor.spawnProp(LEVEL_ID, 'prop-crystal', 33, 142, { roomId: azazelThroneId });
  editor.spawnProp(LEVEL_ID, 'prop-crystal', 27, 146, { roomId: azazelThroneId });
  editor.spawnProp(LEVEL_ID, 'prop-crystal', 33, 146, { roomId: azazelThroneId });

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
  // EXPANSION: New rooms, connections, enemies, triggers, and env zones
  // Added to increase Circle 9 playtime to 15-22 minutes.
  //
  // New room layout (all coordinates are GRID coords, no overlap with existing):
  //
  // Room                   | X  | Z   | W  | H  | Notes
  // caina_west_annex       |  2 |  20 | 16 | 14 | West of Caina, same depth band
  // frozen_gallery         | 38 |  40 | 14 | 12 | East of Antenora, frozen gallery
  // frozen_passage_north   | 42 |  56 |  8 | 16 | East side, passage south of gallery
  // ice_crevasse           |  2 |  60 | 14 | 16 | West side, between Ptolomea level
  // betrayer_hall          | 42 |  74 | 12 | 16 | East of Giudecca, arena annex
  // cocytus_west_dock      |  2 | 100 | 14 | 20 | West side, facing bridge
  // void_overlook          | 38 | 100 | 14 | 20 | East side, overlooking void
  // =========================================================================

  // ── New Rooms ─────────────────────────────────────────────────────────────

  // Caina West Annex: frozen catacombs where family betrayers are entombed.
  // Bounds: (2, 20, 16, 14) → x: 2–17, z: 20–33
  const cainaWestAnnexId = editor.room(LEVEL_ID, 'caina_west_annex', 2, 20, 16, 14, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: -3,
    sortOrder: 8,
    floorTexture: 'ice',
    wallTexture: 'ice',
    fillRule: {
      type: 'scatter',
      props: ['treachery-betrayer-cage', 'treachery-ice-formation', 'frozen-goat'],
      density: 0.12,
    },
  });

  // Frozen Gallery: Antenora's eastern wing, a colonnaded hall of frozen traitors.
  // Bounds: (38, 40, 14, 12) → x: 38–51, z: 40–51
  const frozenGalleryId = editor.room(LEVEL_ID, 'frozen_gallery', 38, 40, 14, 12, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: -3,
    sortOrder: 9,
    floorTexture: 'ice-deep',
    wallTexture: 'ice',
    fillRule: {
      type: 'scatter',
      props: ['treachery-dark-ice-monolith', 'treachery-crystalline-spike-wall', 'ice-pillar'],
      density: 0.1,
    },
  });

  // Frozen Passage North: a narrow descending corridor on the east wall.
  // Bounds: (42, 56, 8, 16) → x: 42–49, z: 56–71
  const frozenPassageNorthId = editor.room(LEVEL_ID, 'frozen_passage_north', 42, 56, 8, 16, {
    roomType: ROOM_TYPES.CORRIDOR,
    elevation: -4,
    sortOrder: 10,
    floorTexture: 'ice',
    wallTexture: 'stone-dark',
    fillRule: {
      type: 'scatter',
      props: [
        'treachery-frozen-stalactite',
        'treachery-snow-drift-mound',
        'treachery-ice-crack-floor',
      ],
      density: 0.15,
    },
  });

  // Ice Crevasse: a jagged crack in the glacier, west side opposite Ptolomea.
  // Bounds: (2, 60, 14, 16) → x: 2–15, z: 60–75
  const iceCrevasseId = editor.room(LEVEL_ID, 'ice_crevasse', 2, 60, 14, 16, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: -4,
    sortOrder: 11,
    floorTexture: 'ice-deep',
    wallTexture: 'stone-dark',
    fillRule: {
      type: 'scatter',
      props: [
        'treachery-ice-formation',
        'treachery-crystalline-spike-wall',
        'treachery-frozen-chain-cluster',
      ],
      density: 0.12,
    },
  });

  // Betrayer Hall: east of Giudecca, a secondary arena of frozen guardians.
  // Bounds: (42, 74, 12, 16) → x: 42–53, z: 74–89
  const betrayerHallId = editor.room(LEVEL_ID, 'betrayer_hall', 42, 74, 12, 16, {
    roomType: ROOM_TYPES.ARENA,
    elevation: -4,
    sortOrder: 12,
    floorTexture: 'ice-deep',
    wallTexture: 'ice-deep',
    fillRule: {
      type: 'scatter',
      props: [
        'treachery-glacial-platform',
        'treachery-frozen-throne',
        'treachery-dark-ice-monolith',
      ],
      density: 0.08,
    },
  });

  // Cocytus West Dock: a frozen landing platform west of the bridge.
  // Offers flanking pickups and an alternate approach path.
  // Bounds: (2, 100, 14, 20) → x: 2–15, z: 100–119
  const cocytusWestDockId = editor.room(LEVEL_ID, 'cocytus_west_dock', 2, 100, 14, 20, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: -5,
    sortOrder: 13,
    floorTexture: 'ice',
    wallTexture: 'stone-dark',
    fillRule: {
      type: 'scatter',
      props: ['treachery-snow-drift-mound', 'treachery-unlit-lantern', 'soul-cage'],
      density: 0.1,
    },
  });

  // Void Overlook: a promontory east of the bridge, peering into Cocytus below.
  // Bounds: (38, 100, 14, 20) → x: 38–51, z: 100–119
  const voidOverlookId = editor.room(LEVEL_ID, 'void_overlook', 38, 100, 14, 20, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: -5,
    sortOrder: 14,
    floorTexture: 'ice-deep',
    wallTexture: 'stone-dark',
    fillRule: {
      type: 'scatter',
      props: [
        'treachery-frozen-stalactite',
        'treachery-ice-formation',
        'treachery-frozen-waterfall',
      ],
      density: 0.1,
    },
  });

  // ── New Connections ───────────────────────────────────────────────────────
  //
  // These connections extend the CRITICAL PATH so the playtest AI traverses
  // all new rooms. The new critical path is:
  //
  //   glacialStairs → caina → cainaWestAnnex → antenora
  //                                           → frozenGallery → frozenPassageNorth
  //                                                            → ptolomea → iceCrevasse
  //                                                                       → giudecca → betrayerHall
  //                                                                                  → voidOverlook
  //                                                                                  → cocytusWestDock
  //   giudecca → cocytusBridge → azazelThrone   (existing main terminus)
  //
  // Note: cocytus_west_dock and void_overlook are side branches off betrayer_hall.

  // Insert Caina West Annex on the main path: caina -> annex -> antenora
  // (existing caina -> antenora connection remains for fallback corridor carving)
  editor.corridor(LEVEL_ID, cainaId, cainaWestAnnexId, 3);
  editor.corridor(LEVEL_ID, cainaWestAnnexId, antenoraId, 3);

  // Insert Frozen Gallery as a required detour: antenora -> gallery -> frozenPassage -> ptolomea
  editor.corridor(LEVEL_ID, antenoraId, frozenGalleryId, 3);
  editor.connect(LEVEL_ID, frozenGalleryId, frozenPassageNorthId, {
    connectionType: CONNECTION_TYPES.CORRIDOR,
    corridorWidth: 2,
    fromElevation: -3,
    toElevation: -4,
  });
  editor.corridor(LEVEL_ID, frozenPassageNorthId, ptolomeaId, 2);

  // Insert Ice Crevasse between ptolomea and giudecca
  editor.corridor(LEVEL_ID, ptolomeaId, iceCrevasseId, 2);
  editor.connect(LEVEL_ID, iceCrevasseId, giudeccaId, {
    connectionType: CONNECTION_TYPES.CORRIDOR,
    corridorWidth: 2,
    fromElevation: -4,
    toElevation: -4,
  });

  // Giudecca -> Betrayer Hall (required before bridge)
  editor.corridor(LEVEL_ID, giudeccaId, betrayerHallId, 2);

  // Betrayer Hall side branches (optional but reachable from betrayer_hall)
  editor.corridor(LEVEL_ID, betrayerHallId, voidOverlookId, 2);
  editor.connect(LEVEL_ID, betrayerHallId, cocytusWestDockId, {
    connectionType: CONNECTION_TYPES.CORRIDOR,
    corridorWidth: 2,
    fromElevation: -4,
    toElevation: -5,
  });

  // ── New Enemies (50+ additional) ──────────────────────────────────────────
  // All positions checked against room bounds.

  // --- Caina West Annex (bounds: 2, 20, 16, 14) → interior x: 3–16, z: 21–32 ---
  // Pre-placed enemies (non-triggered) for playtest coverage
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 4, 22, { roomId: cainaWestAnnexId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 15, 22, { roomId: cainaWestAnnexId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST_ELDER, 9, 31, { roomId: cainaWestAnnexId });
  // 3x goatKnight entombed in ice, awaken on entry
  editor.ambush(
    LEVEL_ID,
    { x: 3, z: 21, w: 13, h: 2 },
    [
      { type: ENEMY_TYPES.FROST_ELDER, x: 6, z: 24 },
      { type: ENEMY_TYPES.FROST_ELDER, x: 10, z: 28 },
      { type: ENEMY_TYPES.FROST_ELDER, x: 15, z: 24 },
    ],
    { roomId: cainaWestAnnexId },
  );
  // 2x shadow_goat patrolling the catacombs
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 5, 30, {
    roomId: cainaWestAnnexId,
    patrol: [
      { x: 5, z: 30 },
      { x: 15, z: 30 },
      { x: 15, z: 22 },
      { x: 5, z: 22 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 10, 26, {
    roomId: cainaWestAnnexId,
    patrol: [
      { x: 10, z: 26 },
      { x: 16, z: 26 },
      { x: 16, z: 31 },
    ],
  });
  // 1x fire_goat behind a monolith, fires through doorway
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 14, 32, {
    roomId: cainaWestAnnexId,
    facing: 0,
  });

  // --- Frozen Gallery (bounds: 38, 40, 14, 12) → interior x: 39–50, z: 41–50 ---
  // 3x goatKnight behind ice columns, close-quarters ambush
  editor.ambush(
    LEVEL_ID,
    { x: 39, z: 41, w: 12, h: 2 },
    [
      { type: ENEMY_TYPES.FROST_ELDER, x: 41, z: 44 },
      { type: ENEMY_TYPES.FROST_ELDER, x: 45, z: 47 },
      { type: ENEMY_TYPES.FROST_ELDER, x: 49, z: 44 },
    ],
    { roomId: frozenGalleryId },
  );
  // 2x shadow_goat hiding behind monoliths
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 40, 48, { roomId: frozenGalleryId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 50, 42, { roomId: frozenGalleryId });
  // 1x fire_goat at far south end
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 45, 49, { roomId: frozenGalleryId });
  // Additional pre-placed enemies (non-triggered) for playtest coverage
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST_ELDER, 42, 43, { roomId: frozenGalleryId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST_ELDER, 49, 49, { roomId: frozenGalleryId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 44, 46, { roomId: frozenGalleryId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 48, 44, { roomId: frozenGalleryId });

  // --- Frozen Passage North (bounds: 42, 56, 8, 16) → interior x: 43–48, z: 57–70 ---
  // 2x ambush at passage turns
  editor.ambush(
    LEVEL_ID,
    { x: 43, z: 58, w: 6, h: 2 },
    [{ type: ENEMY_TYPES.FROST, x: 47, z: 59 }],
    { roomId: frozenPassageNorthId },
  );
  editor.ambush(
    LEVEL_ID,
    { x: 43, z: 64, w: 6, h: 2 },
    [{ type: ENEMY_TYPES.FROST, x: 44, z: 65 }],
    { roomId: frozenPassageNorthId },
  );
  // 2x goatKnight blocking the passage
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST_ELDER, 46, 60, { roomId: frozenPassageNorthId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST_ELDER, 44, 68, { roomId: frozenPassageNorthId });
  // 1x fire_goat sniping from the bottom of the passage
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 46, 69, {
    roomId: frozenPassageNorthId,
    facing: 0,
  });
  // Additional pre-placed enemies for playtest coverage
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 44, 58, { roomId: frozenPassageNorthId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 48, 63, { roomId: frozenPassageNorthId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 45, 67, { roomId: frozenPassageNorthId });

  // --- Ice Crevasse (bounds: 2, 60, 14, 16) → interior x: 3–14, z: 61–74 ---
  // 2-wave encounter: first wave patrols, second ambush on deeper entry
  editor.ambush(
    LEVEL_ID,
    { x: 3, z: 61, w: 11, h: 2 },
    [
      { type: ENEMY_TYPES.FROST, x: 5, z: 63 },
      { type: ENEMY_TYPES.FROST, x: 11, z: 63 },
    ],
    { roomId: iceCrevasseId },
  );
  editor.ambush(
    LEVEL_ID,
    { x: 3, z: 68, w: 11, h: 2 },
    [
      { type: ENEMY_TYPES.FROST_ELDER, x: 7, z: 70 },
      { type: ENEMY_TYPES.FROST, x: 13, z: 72 },
    ],
    { roomId: iceCrevasseId },
  );
  // 2x fire_goat on ledges flanking the crevasse
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 4, 72, {
    roomId: iceCrevasseId,
    facing: Math.PI / 2,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 14, 68, {
    roomId: iceCrevasseId,
    facing: -Math.PI / 2,
  });
  // 1x goatKnight at the far south corner
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST_ELDER, 8, 74, { roomId: iceCrevasseId });
  // Additional pre-placed enemies for playtest coverage
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 5, 62, { roomId: iceCrevasseId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 12, 66, { roomId: iceCrevasseId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST_ELDER, 4, 69, { roomId: iceCrevasseId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 10, 73, { roomId: iceCrevasseId });

  // --- Betrayer Hall (bounds: 42, 74, 12, 16) → interior x: 43–52, z: 75–88 ---
  // Pre-placed enemies (non-triggered) for playtest coverage
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST_ELDER, 44, 76, { roomId: betrayerHallId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST_ELDER, 52, 76, { roomId: betrayerHallId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 47, 82, {
    roomId: betrayerHallId,
    patrol: [
      { x: 47, z: 82 },
      { x: 52, z: 88 },
      { x: 44, z: 88 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 48, 87, { roomId: betrayerHallId });
  // Full 3-wave arena: the east counterpart to Giudecca
  editor.setupArenaWaves(LEVEL_ID, betrayerHallId, { x: 43, z: 75, w: 10, h: 3 }, [
    // Wave 1: goatKnights thaw from the ice
    [
      { type: ENEMY_TYPES.FROST_ELDER, x: 45, z: 78 },
      { type: ENEMY_TYPES.FROST_ELDER, x: 51, z: 78 },
      { type: ENEMY_TYPES.FROST, x: 48, z: 80 },
    ],
    // Wave 2: shadow goats materialise from the dark
    [
      { type: ENEMY_TYPES.FROST, x: 44, z: 84 },
      { type: ENEMY_TYPES.FROST, x: 52, z: 84 },
      { type: ENEMY_TYPES.FROST, x: 48, z: 80 },
      { type: ENEMY_TYPES.FROST, x: 45, z: 86 },
    ],
    // Wave 3: final surge
    [
      { type: ENEMY_TYPES.FROST_ELDER, x: 46, z: 82 },
      { type: ENEMY_TYPES.FROST, x: 52, z: 76 },
      { type: ENEMY_TYPES.FROST, x: 44, z: 86 },
      { type: ENEMY_TYPES.FROST, x: 50, z: 86 },
      { type: ENEMY_TYPES.FROST_ELDER, x: 43, z: 77 },
    ],
  ]);

  // --- Cocytus West Dock (bounds: 2, 100, 14, 20) → interior x: 3–14, z: 101–118 ---
  // Pre-placed enemies (non-triggered) for playtest coverage
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST_ELDER, 4, 102, { roomId: cocytusWestDockId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST_ELDER, 14, 106, { roomId: cocytusWestDockId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 8, 110, { roomId: cocytusWestDockId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 4, 116, { roomId: cocytusWestDockId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 13, 114, { roomId: cocytusWestDockId });
  // Ambush: frozen guardians block the dock approach
  editor.ambush(
    LEVEL_ID,
    { x: 3, z: 101, w: 11, h: 2 },
    [
      { type: ENEMY_TYPES.FROST_ELDER, x: 5, z: 104 },
      { type: ENEMY_TYPES.FROST_ELDER, x: 12, z: 104 },
      { type: ENEMY_TYPES.FROST, x: 9, z: 103 },
    ],
    { roomId: cocytusWestDockId },
  );
  editor.ambush(
    LEVEL_ID,
    { x: 3, z: 110, w: 11, h: 2 },
    [
      { type: ENEMY_TYPES.FROST, x: 4, z: 112 },
      { type: ENEMY_TYPES.FROST, x: 14, z: 112 },
      { type: ENEMY_TYPES.FROST, x: 9, z: 115 },
      { type: ENEMY_TYPES.FROST_ELDER, x: 7, z: 117 },
    ],
    { roomId: cocytusWestDockId },
  );
  // 1x goatKnight patrolling the dock
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST_ELDER, 7, 107, {
    roomId: cocytusWestDockId,
    patrol: [
      { x: 7, z: 107 },
      { x: 13, z: 107 },
      { x: 13, z: 117 },
      { x: 7, z: 117 },
    ],
  });

  // --- Void Overlook (bounds: 38, 100, 14, 20) → interior x: 39–50, z: 101–118 ---
  // Pre-placed enemies (non-triggered) for playtest coverage
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST_ELDER, 40, 102, { roomId: voidOverlookId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST_ELDER, 51, 106, { roomId: voidOverlookId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 45, 110, { roomId: voidOverlookId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 39, 114, { roomId: voidOverlookId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 50, 116, { roomId: voidOverlookId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 41, 117, { roomId: voidOverlookId });
  // Ambush waves from the void-facing overlook
  editor.ambush(
    LEVEL_ID,
    { x: 39, z: 101, w: 12, h: 2 },
    [
      { type: ENEMY_TYPES.FROST_ELDER, x: 41, z: 104 },
      { type: ENEMY_TYPES.FROST_ELDER, x: 49, z: 104 },
      { type: ENEMY_TYPES.FROST, x: 45, z: 103 },
    ],
    { roomId: voidOverlookId },
  );
  editor.ambush(
    LEVEL_ID,
    { x: 39, z: 112, w: 12, h: 2 },
    [
      { type: ENEMY_TYPES.FROST, x: 40, z: 114 },
      { type: ENEMY_TYPES.FROST, x: 50, z: 114 },
      { type: ENEMY_TYPES.FROST, x: 45, z: 116 },
      { type: ENEMY_TYPES.FROST_ELDER, x: 42, z: 117 },
    ],
    { roomId: voidOverlookId },
  );
  // 1x goatKnight standing at the overlook edge
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST_ELDER, 45, 118, {
    roomId: voidOverlookId,
    facing: Math.PI,
  });
  // 1x fire_goat sniping from the overlook railing
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 50, 108, {
    roomId: voidOverlookId,
    facing: -Math.PI / 2,
  });

  // ── New Pickups ───────────────────────────────────────────────────────────

  // Caina West Annex pickups
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 4, 22);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 14, 30);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.FUEL, 9, 26);

  // Frozen Gallery pickups
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 40, 42);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 50, 49);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.FUEL, 45, 46);

  // Frozen Passage North pickups
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 44, 59);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 47, 66);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.FUEL, 43, 62);

  // Ice Crevasse pickups
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 4, 64);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 13, 70);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.FUEL, 8, 67);

  // Betrayer Hall pickups (arena — between waves)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 43, 80);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 52, 80);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 43, 86);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 52, 86);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.FUEL, 48, 83);

  // Cocytus West Dock pickups (reward for the detour)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 4, 102);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 14, 116);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 9, 109);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.FUEL, 4, 114);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.FUEL, 14, 108);

  // Void Overlook pickups
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 40, 102);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 50, 115);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.FUEL, 45, 110);

  // ── New Props ─────────────────────────────────────────────────────────────

  // Caina West Annex: tombs, cages, ice formations
  editor.spawnProp(LEVEL_ID, 'treachery-betrayer-cage', 6, 25, { roomId: cainaWestAnnexId });
  editor.spawnProp(LEVEL_ID, 'treachery-betrayer-cage', 13, 29, { roomId: cainaWestAnnexId });
  editor.spawnProp(LEVEL_ID, 'treachery-ice-formation', 8, 23, { roomId: cainaWestAnnexId });
  editor.spawnProp(LEVEL_ID, 'treachery-ice-formation', 16, 31, { roomId: cainaWestAnnexId });
  editor.spawnProp(LEVEL_ID, 'ice-pillar', 4, 24, { roomId: cainaWestAnnexId });
  editor.spawnProp(LEVEL_ID, 'ice-pillar', 15, 28, { roomId: cainaWestAnnexId });
  editor.spawnProp(LEVEL_ID, 'treachery-frozen-chain-cluster', 9, 22, { roomId: cainaWestAnnexId });
  editor.spawnProp(LEVEL_ID, 'treachery-snow-drift-mound', 3, 32, { roomId: cainaWestAnnexId });

  // Frozen Gallery: colonnade of dark monoliths and frozen banners
  editor.spawnProp(LEVEL_ID, 'treachery-dark-ice-monolith', 40, 42, { roomId: frozenGalleryId });
  editor.spawnProp(LEVEL_ID, 'treachery-dark-ice-monolith', 50, 42, { roomId: frozenGalleryId });
  editor.spawnProp(LEVEL_ID, 'treachery-dark-ice-monolith', 40, 49, { roomId: frozenGalleryId });
  editor.spawnProp(LEVEL_ID, 'treachery-dark-ice-monolith', 50, 49, { roomId: frozenGalleryId });
  editor.spawnProp(LEVEL_ID, 'ice-pillar', 45, 44, { roomId: frozenGalleryId });
  editor.spawnProp(LEVEL_ID, 'treachery-crystalline-spike-wall', 39, 46, {
    roomId: frozenGalleryId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.9,
    },
  });
  editor.spawnProp(LEVEL_ID, 'treachery-frozen-banner', 41, 41, {
    roomId: frozenGalleryId,
    surfaceAnchor: {
      face: 'north',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.8,
    },
  });
  editor.spawnProp(LEVEL_ID, 'treachery-frozen-banner', 49, 41, {
    roomId: frozenGalleryId,
    surfaceAnchor: {
      face: 'north',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.8,
    },
  });

  // Frozen Passage North: stalactites and drifts
  editor.spawnProp(LEVEL_ID, 'treachery-frozen-stalactite', 46, 58, {
    roomId: frozenPassageNorthId,
  });
  editor.spawnProp(LEVEL_ID, 'treachery-frozen-stalactite', 44, 63, {
    roomId: frozenPassageNorthId,
  });
  editor.spawnProp(LEVEL_ID, 'treachery-frozen-stalactite', 48, 68, {
    roomId: frozenPassageNorthId,
  });
  editor.spawnProp(LEVEL_ID, 'treachery-snow-drift-mound', 43, 57, {
    roomId: frozenPassageNorthId,
  });
  editor.spawnProp(LEVEL_ID, 'treachery-ice-crack-floor', 46, 65, { roomId: frozenPassageNorthId });
  editor.spawnProp(LEVEL_ID, 'treachery-unlit-lantern', 43, 61, {
    roomId: frozenPassageNorthId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.8,
    },
  });
  editor.spawnProp(LEVEL_ID, 'treachery-unlit-lantern', 49, 66, {
    roomId: frozenPassageNorthId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.8,
    },
  });

  // Ice Crevasse: jagged ice and chain clusters
  editor.spawnProp(LEVEL_ID, 'treachery-crystalline-spike-wall', 3, 62, {
    roomId: iceCrevasseId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'treachery-crystalline-spike-wall', 14, 70, {
    roomId: iceCrevasseId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'treachery-ice-formation', 5, 66, { roomId: iceCrevasseId });
  editor.spawnProp(LEVEL_ID, 'treachery-ice-formation', 12, 72, { roomId: iceCrevasseId });
  editor.spawnProp(LEVEL_ID, 'treachery-frozen-chain-cluster', 8, 64, { roomId: iceCrevasseId });
  editor.spawnProp(LEVEL_ID, 'treachery-snow-drift-mound', 3, 74, { roomId: iceCrevasseId });
  editor.spawnProp(LEVEL_ID, 'treachery-dark-ice-monolith', 9, 61, { roomId: iceCrevasseId });

  // Betrayer Hall: glacial platforms, frozen thrones, stalactites
  editor.spawnProp(LEVEL_ID, 'treachery-frozen-throne', 48, 83, { roomId: betrayerHallId });
  editor.spawnProp(LEVEL_ID, 'treachery-glacial-platform', 44, 78, { roomId: betrayerHallId });
  editor.spawnProp(LEVEL_ID, 'treachery-glacial-platform', 52, 78, { roomId: betrayerHallId });
  editor.spawnProp(LEVEL_ID, 'treachery-glacial-platform', 44, 86, { roomId: betrayerHallId });
  editor.spawnProp(LEVEL_ID, 'treachery-glacial-platform', 52, 86, { roomId: betrayerHallId });
  editor.spawnProp(LEVEL_ID, 'treachery-frozen-stalactite', 44, 76, { roomId: betrayerHallId });
  editor.spawnProp(LEVEL_ID, 'treachery-frozen-stalactite', 52, 76, { roomId: betrayerHallId });
  editor.spawnProp(LEVEL_ID, 'treachery-frozen-stalactite', 48, 88, { roomId: betrayerHallId });
  editor.spawnProp(LEVEL_ID, 'treachery-dark-ice-monolith', 43, 75, { roomId: betrayerHallId });
  editor.spawnProp(LEVEL_ID, 'treachery-dark-ice-monolith', 53, 75, { roomId: betrayerHallId });
  editor.spawnProp(LEVEL_ID, 'treachery-ice-crack-floor', 48, 82, { roomId: betrayerHallId });

  // Cocytus West Dock: soul cages and lanterns
  editor.spawnProp(LEVEL_ID, 'soul-cage', 4, 103, { roomId: cocytusWestDockId });
  editor.spawnProp(LEVEL_ID, 'soul-cage', 14, 115, { roomId: cocytusWestDockId });
  editor.spawnProp(LEVEL_ID, 'treachery-unlit-lantern', 3, 107, {
    roomId: cocytusWestDockId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.8,
    },
  });
  editor.spawnProp(LEVEL_ID, 'treachery-unlit-lantern', 15, 113, {
    roomId: cocytusWestDockId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.8,
    },
  });
  editor.spawnProp(LEVEL_ID, 'treachery-snow-drift-mound', 3, 118, { roomId: cocytusWestDockId });
  editor.spawnProp(LEVEL_ID, 'treachery-ice-crack-floor', 9, 112, { roomId: cocytusWestDockId });

  // Void Overlook: waterfall, ice formations, void-gazing props
  editor.spawnProp(LEVEL_ID, 'treachery-frozen-waterfall', 51, 110, { roomId: voidOverlookId });
  editor.spawnProp(LEVEL_ID, 'treachery-ice-formation', 40, 104, { roomId: voidOverlookId });
  editor.spawnProp(LEVEL_ID, 'treachery-ice-formation', 50, 116, { roomId: voidOverlookId });
  editor.spawnProp(LEVEL_ID, 'treachery-frozen-stalactite', 41, 108, { roomId: voidOverlookId });
  editor.spawnProp(LEVEL_ID, 'treachery-frozen-stalactite', 51, 114, { roomId: voidOverlookId });
  editor.spawnProp(LEVEL_ID, 'treachery-dark-ice-monolith', 39, 101, { roomId: voidOverlookId });
  editor.spawnProp(LEVEL_ID, 'treachery-dark-ice-monolith', 51, 118, { roomId: voidOverlookId });
  editor.spawnProp(LEVEL_ID, 'treachery-snow-drift-mound', 50, 118, { roomId: voidOverlookId });

  // ── New Triggers ──────────────────────────────────────────────────────────

  // Caina West Annex: lore dialogue on entry (the family betrayers)
  editor.dialogue(
    LEVEL_ID,
    { x: 3, z: 21, w: 13, h: 2 },
    'Here lie those who betrayed their own blood. The ice holds them as they held their secrets.',
    { roomId: cainaWestAnnexId },
  );

  // Frozen Gallery: ambient change on entry — temperature drops, fog thickens
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 39,
    zoneZ: 41,
    zoneW: 12,
    zoneH: 2,
    roomId: frozenGalleryId,
    once: true,
    actionData: { fogDensity: 0.06, ambientColor: '#112288' },
  });

  // Ice Crevasse: lore dialogue — the crack in Cocytus
  editor.dialogue(
    LEVEL_ID,
    { x: 3, z: 61, w: 11, h: 2 },
    'The lake cracked when Lucifer fell. These fissures are older than memory.',
    { roomId: iceCrevasseId },
  );

  // Betrayer Hall: arena lock/ambient shift on wave start
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 42,
    zoneZ: 74,
    zoneW: 12,
    zoneH: 16,
    roomId: betrayerHallId,
    once: true,
    actionData: { type: 'falling_ice', interval: 10, damage: 8, aoe: 1, delay: 3 },
  });

  // Void Overlook: lore dialogue — the abyss beneath
  editor.dialogue(
    LEVEL_ID,
    { x: 39, z: 101, w: 12, h: 2 },
    'Do not look down. The void has a name here. It does not forget yours.',
    { roomId: voidOverlookId },
  );

  // Cocytus West Dock: wind environmental cue
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 2,
    zoneZ: 100,
    zoneW: 14,
    zoneH: 20,
    roomId: cocytusWestDockId,
    once: true,
    actionData: { ambientColor: '#0a1040', fogDensity: 0.04 },
  });

  // ── New Environment Zones (ICE) ───────────────────────────────────────────

  // Caina West Annex: slippery ice floor
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.ICE,
    boundsX: 2,
    boundsZ: 20,
    boundsW: 16,
    boundsH: 14,
    intensity: 0.8,
  });

  // Frozen Gallery: very slippery deep ice
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.ICE,
    boundsX: 38,
    boundsZ: 40,
    boundsW: 14,
    boundsH: 12,
    intensity: 0.9,
  });

  // Frozen Passage North: moderate ice slide
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.ICE,
    boundsX: 42,
    boundsZ: 56,
    boundsW: 8,
    boundsH: 16,
    intensity: 0.75,
  });

  // Ice Crevasse: deep-ice, most slippery
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.ICE,
    boundsX: 2,
    boundsZ: 60,
    boundsW: 14,
    boundsH: 16,
    intensity: 1.0,
  });

  // Betrayer Hall: slippery arena floor
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.ICE,
    boundsX: 42,
    boundsZ: 74,
    boundsW: 12,
    boundsH: 16,
    intensity: 0.85,
  });

  // Cocytus West Dock: near-void cold
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.ICE,
    boundsX: 2,
    boundsZ: 100,
    boundsW: 14,
    boundsH: 20,
    intensity: 0.9,
  });

  // Void Overlook: deep void ice + frost overlay
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.ICE,
    boundsX: 38,
    boundsZ: 100,
    boundsW: 14,
    boundsH: 20,
    intensity: 0.9,
  });

  // Void Overlook: void glow from below
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.VOID,
    boundsX: 38,
    boundsZ: 100,
    boundsW: 14,
    boundsH: 20,
    intensity: 0.05,
  });

  // Cocytus West Dock: frost bite effect
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.FROST,
    boundsX: 2,
    boundsZ: 100,
    boundsW: 14,
    boundsH: 20,
    intensity: 0.6,
  });

  // ── New Decals ────────────────────────────────────────────────────────────

  editor.placeDecals(LEVEL_ID, cainaWestAnnexId, [
    { type: DECAL_TYPES.ICE_FROST, x: 3, z: 22, surface: 'wall' },
    { type: DECAL_TYPES.ICE_FROST, x: 17, z: 30, surface: 'wall' },
    { type: DECAL_TYPES.SNOW_DRIFT, x: 3, z: 32, w: 3, h: 2 },
    { type: DECAL_TYPES.SNOW_DRIFT, x: 15, z: 21, w: 3, h: 2 },
  ]);

  editor.placeDecals(LEVEL_ID, frozenGalleryId, [
    { type: DECAL_TYPES.ICE_FROST, x: 39, z: 42, surface: 'wall' },
    { type: DECAL_TYPES.ICE_FROST, x: 51, z: 48, surface: 'wall' },
    { type: DECAL_TYPES.SNOW_DRIFT, x: 39, z: 50, w: 3, h: 2 },
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 43, z: 45, w: 3, h: 3 },
  ]);

  editor.placeDecals(LEVEL_ID, frozenPassageNorthId, [
    { type: DECAL_TYPES.ICE_FROST, x: 43, z: 58, surface: 'wall' },
    { type: DECAL_TYPES.ICE_FROST, x: 49, z: 66, surface: 'wall' },
    { type: DECAL_TYPES.SNOW_DRIFT, x: 43, z: 70, w: 3, h: 2 },
  ]);

  editor.placeDecals(LEVEL_ID, iceCrevasseId, [
    { type: DECAL_TYPES.ICE_FROST, x: 3, z: 62, surface: 'wall' },
    { type: DECAL_TYPES.ICE_FROST, x: 14, z: 70, surface: 'wall' },
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 6, z: 66, w: 4, h: 4 },
    { type: DECAL_TYPES.SNOW_DRIFT, x: 3, z: 73, w: 3, h: 2 },
  ]);

  editor.placeDecals(LEVEL_ID, betrayerHallId, [
    { type: DECAL_TYPES.ICE_FROST, x: 43, z: 76, surface: 'wall' },
    { type: DECAL_TYPES.ICE_FROST, x: 53, z: 76, surface: 'wall' },
    { type: DECAL_TYPES.ICE_FROST, x: 43, z: 88, surface: 'wall' },
    { type: DECAL_TYPES.ICE_FROST, x: 53, z: 88, surface: 'wall' },
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 46, z: 80, w: 4, h: 4 },
    { type: DECAL_TYPES.SNOW_DRIFT, x: 42, z: 87, w: 3, h: 2 },
  ]);

  editor.placeDecals(LEVEL_ID, cocytusWestDockId, [
    { type: DECAL_TYPES.ICE_FROST, x: 3, z: 102, surface: 'wall' },
    { type: DECAL_TYPES.ICE_FROST, x: 15, z: 114, surface: 'wall' },
    { type: DECAL_TYPES.SNOW_DRIFT, x: 3, z: 118, w: 4, h: 2 },
    { type: DECAL_TYPES.SNOW_DRIFT, x: 14, z: 102, w: 2, h: 2 },
  ]);

  editor.placeDecals(LEVEL_ID, voidOverlookId, [
    { type: DECAL_TYPES.ICE_FROST, x: 39, z: 102, surface: 'wall' },
    { type: DECAL_TYPES.ICE_FROST, x: 51, z: 116, surface: 'wall' },
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 43, z: 108, w: 4, h: 4 },
    { type: DECAL_TYPES.SNOW_DRIFT, x: 39, z: 118, w: 4, h: 2 },
  ]);

  // ── Additional enemy density pass (main path + new rooms) ────────────────
  // These supplement the existing ambush/arena triggers to push playtime to
  // the 15-22 min target. All positions verified within their room bounds.

  // Glacial Stairs extra enemies (bounds: 26, 2, 8, 16 → interior x: 27–32, z: 3–16)
  // Still the entry area — use frostWhelp for learning escalation
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST_WHELP, 28, 5, { roomId: glacialStairsId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST_WHELP, 31, 9, { roomId: glacialStairsId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST_WHELP, 28, 14, { roomId: glacialStairsId });

  // Caina extra enemies (bounds: 22, 22, 16, 14 → interior x: 23–36, z: 23–34)
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST_ELDER, 24, 24, { roomId: cainaId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 35, 24, { roomId: cainaId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 24, 33, { roomId: cainaId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST_ELDER, 35, 33, { roomId: cainaId });

  // Antenora extra enemies (bounds: 24, 40, 12, 16 → interior x: 25–34, z: 41–54)
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 26, 42, { roomId: antenoraId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 33, 44, { roomId: antenoraId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST_ELDER, 26, 50, { roomId: antenoraId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST_ELDER, 33, 52, { roomId: antenoraId });

  // Ptolomea extra enemies (bounds: 23, 60, 14, 10 → interior x: 24–35, z: 61–68)
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 25, 62, { roomId: ptolomeaId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 34, 67, { roomId: ptolomeaId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 30, 65, { roomId: ptolomeaId });

  // Giudecca extra enemies (bounds: 21, 74, 18, 16 → interior x: 22–37, z: 75–88)
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 23, 76, { roomId: giudeccaId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 36, 76, { roomId: giudeccaId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST_ELDER, 23, 86, { roomId: giudeccaId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST_ELDER, 36, 86, { roomId: giudeccaId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 30, 88, { roomId: giudeccaId });

  // Caina West Annex extra enemies
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 7, 23, { roomId: cainaWestAnnexId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 16, 32, { roomId: cainaWestAnnexId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 11, 29, { roomId: cainaWestAnnexId });

  // Frozen Gallery extra enemies
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 40, 45, { roomId: frozenGalleryId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 50, 47, { roomId: frozenGalleryId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 45, 43, { roomId: frozenGalleryId });

  // Frozen Passage North extra enemies
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 43, 61, { roomId: frozenPassageNorthId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 49, 65, { roomId: frozenPassageNorthId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 44, 70, { roomId: frozenPassageNorthId });

  // Ice Crevasse extra enemies
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 7, 64, { roomId: iceCrevasseId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 13, 67, { roomId: iceCrevasseId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST_ELDER, 5, 72, { roomId: iceCrevasseId });

  // Betrayer Hall extra enemies
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 44, 79, { roomId: betrayerHallId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 52, 82, { roomId: betrayerHallId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 48, 87, { roomId: betrayerHallId });

  // Cocytus West Dock extra enemies
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 6, 103, { roomId: cocytusWestDockId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 13, 108, { roomId: cocytusWestDockId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 9, 113, { roomId: cocytusWestDockId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST_ELDER, 4, 117, { roomId: cocytusWestDockId });

  // Void Overlook extra enemies
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 41, 103, { roomId: voidOverlookId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 50, 107, { roomId: voidOverlookId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST_ELDER, 43, 115, { roomId: voidOverlookId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FROST, 51, 111, { roomId: voidOverlookId });

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
