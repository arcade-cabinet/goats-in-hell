#!/usr/bin/env npx tsx
/**
 * Build script for Circle 7: Violence -- The Circle of Bloodshed
 *
 * Translates docs/circles/07-violence.md into LevelEditor API calls.
 * Run: npx tsx scripts/build-circle-7.ts
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

const LEVEL_ID = 'circle-7-violence';
const THEME_ID = 'circle-7-violence';

export async function buildCircle7(dbPath: string) {
  const sqliteDb = new BetterSqlite3(dbPath);
  const db = drizzle(sqliteDb, { schema });
  await migrateAndSeed(db);
  const editor = new LevelEditor(db);

  // =========================================================================
  // 1. THEME (from "Theme Configuration" section)
  // =========================================================================

  editor.createTheme(THEME_ID, {
    name: 'violence',
    displayName: 'VIOLENCE --- The Circle of Bloodshed',
    primaryWall: MapCell.WALL_STONE,
    accentWalls: [MapCell.WALL_LAVA, MapCell.WALL_OBSIDIAN],
    fogDensity: 0.05,
    fogColor: '#2a0808',
    ambientColor: '#aa2200',
    ambientIntensity: 0.18,
    skyColor: '#0a0000',
    particleEffect: 'blood',
    enemyTypes: ['goatKnight', 'fireGoat', 'hellgoat'],
    enemyDensity: 1.4,
    pickupDensity: 0.9,
  });

  // =========================================================================
  // 2. LEVEL (from "Identity" + "Grid Dimensions" sections)
  // =========================================================================

  editor.createLevel(LEVEL_ID, {
    name: 'Circle 7: Violence',
    levelType: 'circle',
    width: 60,
    depth: 110, // Boss room at Z=94 + H=16 = 110
    floor: 7,
    themeId: THEME_ID,
    circleNumber: 7,
    sin: 'Bloodshed',
    guardian: 'Il Macello',
  });

  // =========================================================================
  // 3. ROOMS (from "Room Placement" table, in sortOrder)
  // =========================================================================
  //
  // | Room                  | X  | Z  | W  | H  | Type         | Elevation           | sortOrder |
  // | Pier                  | 26 |  2 |  8 |  6 | exploration  | +2 (raised)         | 0 |
  // | Blood River           | 20 | 12 | 20 | 14 | exploration  | 0 (blood) +0.5 walk | 1 |
  // | River Banks           |  8 | 20 |  8 |  6 | exploration  | 0                   | 2 |
  // | Thorny Passage        | 44 | 18 |  6 | 16 | platforming  | 0,1,2 (varies)      | 3 |
  // | Thornwood             | 36 | 38 | 14 | 12 | exploration  | 0                   | 4 |
  // | Burning Shore         | 16 | 54 | 18 | 10 | exploration  | 0                   | 5 |
  // | Flamethrower Shrine   | 22 | 68 |  6 |  6 | exploration  | 0                   | 6 |
  // | Slaughterhouse        | 18 | 78 | 14 | 12 | arena        | 0                   | 7 |
  // | Butcher's Hook        | 36 | 82 |  6 |  6 | secret       | 0                   | 8 |
  // | Il Macello's Abattoir | 17 | 94 | 16 | 16 | boss         | -1 (below)          | 9 |

  const pierId = editor.room(LEVEL_ID, 'pier', 26, 2, 8, 6, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 2,
    sortOrder: 0,
  });

  const bloodRiverId = editor.room(LEVEL_ID, 'blood_river', 20, 12, 20, 14, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 1,
  });

  const riverBanksId = editor.room(LEVEL_ID, 'river_banks', 8, 20, 8, 6, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 2,
  });

  const thornyPassageId = editor.room(LEVEL_ID, 'thorny_passage', 44, 18, 6, 16, {
    roomType: ROOM_TYPES.PLATFORMING,
    elevation: 0,
    sortOrder: 3,
  });

  const thornwoodId = editor.room(LEVEL_ID, 'thornwood', 36, 38, 14, 12, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 4,
  });

  const burningShoreId = editor.room(LEVEL_ID, 'burning_shore', 16, 54, 18, 10, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 5,
  });

  const flamethrowerShrineId = editor.room(LEVEL_ID, 'flamethrower_shrine', 22, 68, 6, 6, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 6,
  });

  const slaughterhouseId = editor.room(LEVEL_ID, 'slaughterhouse', 18, 78, 14, 12, {
    roomType: ROOM_TYPES.ARENA,
    elevation: 0,
    sortOrder: 7,
  });

  const butchersHookId = editor.room(LEVEL_ID, 'butchers_hook', 36, 82, 6, 6, {
    roomType: ROOM_TYPES.SECRET,
    elevation: 0,
    sortOrder: 8,
  });

  const abattoirId = editor.room(LEVEL_ID, 'il_macello_abattoir', 17, 94, 16, 16, {
    roomType: ROOM_TYPES.BOSS,
    elevation: -1,
    sortOrder: 9,
  });

  // =========================================================================
  // 4. CONNECTIONS (from "Connections" table)
  // =========================================================================
  //
  // | From                 | To                   | Type     | Width | Notes                         |
  // | Pier                 | Blood River          | stairs   | 3     | Descending, elev +2 to 0      |
  // | Blood River          | River Banks          | corridor | 3     | West exit                     |
  // | Blood River          | Thorny Passage       | corridor | 2     | East exit, narrow             |
  // | River Banks          | Burning Shore        | corridor | 2     | South, long                   |
  // | Thorny Passage       | Thornwood            | corridor | 2     | South, thorn-lined            |
  // | Thornwood            | Burning Shore        | corridor | 3     | Southwest, opens to expanse   |
  // | Burning Shore        | Flamethrower Shrine  | corridor | 2     | South, descending             |
  // | Flamethrower Shrine  | Slaughterhouse       | corridor | 3     | South, industrial transition  |
  // | Slaughterhouse       | Butcher's Hook       | secret   | 2     | WALL_SECRET east              |
  // | Slaughterhouse       | Il Macello's Abattoir| stairs   | 3     | South, descending to -1       |

  // Pier -> Blood River (stairs, width 3, descending +2 to 0)
  editor.connect(LEVEL_ID, pierId, bloodRiverId, {
    connectionType: CONNECTION_TYPES.STAIRS,
    corridorWidth: 3,
    fromElevation: 2,
    toElevation: 0,
  });

  // Blood River -> River Banks (corridor, width 3)
  editor.corridor(LEVEL_ID, bloodRiverId, riverBanksId, 3);

  // Blood River -> Thorny Passage (corridor, width 2)
  editor.corridor(LEVEL_ID, bloodRiverId, thornyPassageId, 2);

  // River Banks -> Burning Shore (corridor, width 2)
  editor.corridor(LEVEL_ID, riverBanksId, burningShoreId, 2);

  // Thorny Passage -> Thornwood (corridor, width 2)
  editor.corridor(LEVEL_ID, thornyPassageId, thornwoodId, 2);

  // Thornwood -> Burning Shore (corridor, width 3)
  editor.corridor(LEVEL_ID, thornwoodId, burningShoreId, 3);

  // Burning Shore -> Flamethrower Shrine (corridor, width 2)
  editor.corridor(LEVEL_ID, burningShoreId, flamethrowerShrineId, 2);

  // Flamethrower Shrine -> Slaughterhouse (corridor, width 3)
  editor.corridor(LEVEL_ID, flamethrowerShrineId, slaughterhouseId, 3);

  // Slaughterhouse -> Butcher's Hook (secret, width 2)
  editor.connect(LEVEL_ID, slaughterhouseId, butchersHookId, {
    connectionType: CONNECTION_TYPES.SECRET,
    corridorWidth: 2,
  });

  // Slaughterhouse -> Il Macello's Abattoir (stairs, width 3, descending 0 to -1)
  editor.connect(LEVEL_ID, slaughterhouseId, abattoirId, {
    connectionType: CONNECTION_TYPES.STAIRS,
    corridorWidth: 3,
    fromElevation: 0,
    toElevation: -1,
  });

  // =========================================================================
  // 5. ENTITIES: ENEMIES (from "Enemies" table)
  // =========================================================================

  // --- Blood River: 3x goatKnight patrol walkway intersections ---
  // Room bounds: (20, 12, 20, 14) -> interior: x=[21..38], z=[13..24]
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 25, 16, {
    roomId: bloodRiverId,
    patrol: [
      { x: 25, z: 16 },
      { x: 30, z: 20 },
      { x: 25, z: 24 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 32, 18, {
    roomId: bloodRiverId,
    patrol: [
      { x: 32, z: 18 },
      { x: 36, z: 22 },
      { x: 28, z: 22 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 36, 22, {
    roomId: bloodRiverId,
    patrol: [
      { x: 36, z: 22 },
      { x: 30, z: 16 },
      { x: 36, z: 18 },
    ],
  });

  // --- River Banks: 1x fireGoat ---
  // Room bounds: (8, 20, 8, 6) -> interior: x=[9..14], z=[21..24]
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 13, 23, {
    roomId: riverBanksId,
  });

  // --- Thorny Passage: 2x fireGoat on elevated sections ---
  // Room bounds: (44, 18, 6, 16) -> interior: x=[45..48], z=[19..32]
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 46, 24, {
    roomId: thornyPassageId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 47, 28, {
    roomId: thornyPassageId,
  });

  // --- Thornwood: 1x goatKnight, 1x hellgoat, 1x fireGoat ---
  // Room bounds: (36, 38, 14, 12) -> interior: x=[37..48], z=[39..48]
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 40, 40, {
    roomId: thornwoodId,
    patrol: [
      { x: 40, z: 40 },
      { x: 45, z: 42 },
      { x: 40, z: 44 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 43, 44, {
    roomId: thornwoodId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 46, 47, {
    roomId: thornwoodId,
  });

  // --- Burning Shore: 4x fireGoat spread across expanse ---
  // Room bounds: (16, 54, 18, 10) -> interior: x=[17..32], z=[55..62]
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 20, 56, {
    roomId: burningShoreId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 28, 57, {
    roomId: burningShoreId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 22, 60, {
    roomId: burningShoreId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 30, 61, {
    roomId: burningShoreId,
  });

  // --- Slaughterhouse: 3 waves using setupArenaWaves ---
  // Room bounds: (18, 78, 14, 12) -> interior: x=[19..30], z=[79..88]
  // Trigger zone from T6/T7: (20, 79, 10, 4)
  editor.setupArenaWaves(LEVEL_ID, slaughterhouseId, { x: 20, z: 79, w: 10, h: 4 }, [
    // Wave 1: 3x goatKnight
    [
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 20, z: 80 },
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 25, z: 79 },
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 29, z: 80 },
    ],
    // Wave 2: 3x fireGoat
    [
      { type: ENEMY_TYPES.FIRE_GOAT, x: 19, z: 82 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 30, z: 82 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 25, z: 88 },
    ],
    // Wave 3: 2x goatKnight + 2x hellgoat + 1x fireGoat
    [
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 20, z: 79 },
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 29, z: 79 },
      { type: ENEMY_TYPES.HELLGOAT, x: 22, z: 85 },
      { type: ENEMY_TYPES.HELLGOAT, x: 27, z: 85 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 25, z: 88 },
    ],
  ]);

  // --- Boss: Il Macello ---
  // Room bounds: (17, 94, 16, 16) -> center: (25, 102)
  editor.spawnBoss(LEVEL_ID, 'il-macello', 27, 104, {
    roomId: abattoirId,
    facing: 0,
  });

  // =========================================================================
  // 5b. ENTITIES: PICKUPS (from "Pickups" table)
  // =========================================================================

  // Pier: ammo (29, 6)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 29, 6);

  // Blood River: ammo (35, 22) — dead-end walkway
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 35, 22);

  // Blood River: health (24, 20) — walkway intersection
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 24, 20);

  // River Banks: health (11, 24)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 11, 24);

  // Thorny Passage: ammo (46, 30)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 46, 30);

  // Thornwood: health (42, 44) — center of lanes
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 42, 44);

  // Burning Shore: ammo x2 (18, 62), (32, 62)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 18, 62);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 32, 62);

  // Burning Shore: health (25, 58)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 25, 58);

  // Flamethrower Shrine: weapon (flamethrower) (25, 71)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.WEAPON_FLAMETHROWER, 25, 71);

  // Flamethrower Shrine: health (24, 72)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 24, 72);

  // Slaughterhouse (between waves): ammo x2 (20, 88), (30, 88)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 20, 88);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 30, 88);

  // Slaughterhouse (between waves): health (25, 88)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 25, 88);

  // Butcher's Hook: ammo x2 (38, 84), (40, 84)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 38, 84);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 40, 84);

  // Butcher's Hook: health x2 (38, 86), (40, 86)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 38, 86);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 40, 86);

  // Il Macello's Abattoir: ammo x2 (19, 108), (31, 108) — south corners
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 19, 108);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 31, 108);

  // Il Macello's Abattoir: health x2 (19, 96), (31, 96) — north corners
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 19, 96);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 31, 96);

  // --- Fuel pickups ---
  // Slaughterhouse: fuel (25, 85) — center, between waves
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.FUEL, 25, 85);

  // Butcher's Hook: fuel (37, 83) — near entrance
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.FUEL, 37, 83);

  // Il Macello's Abattoir: fuel x2 (31, 95), (19, 107) — NE, SW corners
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.FUEL, 31, 95);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.FUEL, 19, 107);

  // =========================================================================
  // 5c. ENTITIES: PROPS (from "Props" table)
  // =========================================================================

  // --- Pier (bounds: 26, 2, 8, 6) ---
  // 2x Torch_Metal (east/west walls)
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 27, 3, {
    roomId: pierId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 32, 3, {
    roomId: pierId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 1x Rope_1 (railing edge)
  editor.spawnProp(LEVEL_ID, 'Rope_1', 30, 3, { roomId: pierId });
  // 1x Cauldron (floor)
  editor.spawnProp(LEVEL_ID, 'Cauldron', 31, 5, { roomId: pierId });
  // 1x Barrel (floor)
  editor.spawnProp(LEVEL_ID, 'Barrel', 28, 6, { roomId: pierId });

  // --- Blood River (bounds: 20, 12, 20, 14) ---
  // 6x Torch_Metal (on walkway pillars)
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 23, 14, { roomId: bloodRiverId });
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 28, 16, { roomId: bloodRiverId });
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 35, 15, { roomId: bloodRiverId });
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 24, 20, { roomId: bloodRiverId });
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 32, 22, { roomId: bloodRiverId });
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 37, 23, { roomId: bloodRiverId });

  // --- River Banks (bounds: 8, 20, 8, 6) ---
  // 1x Torch_Metal (north wall)
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 12, 21, {
    roomId: riverBanksId,
    surfaceAnchor: {
      face: 'north',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 2x Barrel (floor)
  editor.spawnProp(LEVEL_ID, 'Barrel', 14, 22, { roomId: riverBanksId });
  editor.spawnProp(LEVEL_ID, 'Barrel', 14, 24, { roomId: riverBanksId });
  // 1x Cauldron (floor)
  editor.spawnProp(LEVEL_ID, 'Cauldron', 10, 23, { roomId: riverBanksId });

  // --- Thorny Passage (bounds: 44, 18, 6, 16) ---
  // 2x Rope_3 (hanging, marking safe path)
  editor.spawnProp(LEVEL_ID, 'Rope_3', 47, 24, { roomId: thornyPassageId });
  editor.spawnProp(LEVEL_ID, 'Rope_3', 47, 30, { roomId: thornyPassageId });

  // --- Thornwood (bounds: 36, 38, 14, 12) ---
  // 1x Torch_Metal (south wall)
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 46, 48, {
    roomId: thornwoodId,
    surfaceAnchor: {
      face: 'south',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });

  // --- Burning Shore (bounds: 16, 54, 18, 10) ---
  // None (deliberate emptiness)

  // --- Flamethrower Shrine (bounds: 22, 68, 6, 6) ---
  // 1x CandleStick_Triple (altar)
  editor.spawnProp(LEVEL_ID, 'CandleStick_Triple', 25, 72, { roomId: flamethrowerShrineId });
  // 2x Torch_Metal (east/west walls)
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 23, 70, {
    roomId: flamethrowerShrineId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.8,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 26, 70, {
    roomId: flamethrowerShrineId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.8,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 1x Cauldron (floor)
  editor.spawnProp(LEVEL_ID, 'Cauldron', 26, 72, { roomId: flamethrowerShrineId });

  // --- Slaughterhouse (bounds: 18, 78, 14, 12) ---
  // 9x Chain_Coil (ceiling, 3x3 grid)
  const chainPositions = [
    [21, 80],
    [25, 80],
    [29, 80],
    [21, 84],
    [25, 84],
    [29, 84],
    [21, 87],
    [25, 87],
    [29, 87],
  ];
  for (const [cx, cz] of chainPositions) {
    editor.spawnProp(LEVEL_ID, 'Chain_Coil', cx, cz, { roomId: slaughterhouseId });
  }
  // 4x Lantern_Wall (walls)
  editor.spawnProp(LEVEL_ID, 'Lantern_Wall', 19, 80, {
    roomId: slaughterhouseId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 2.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Lantern_Wall', 30, 80, {
    roomId: slaughterhouseId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 2.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Lantern_Wall', 19, 86, {
    roomId: slaughterhouseId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 2.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Lantern_Wall', 30, 86, {
    roomId: slaughterhouseId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 2.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 4x Crate_Metal (floor)
  editor.spawnProp(LEVEL_ID, 'Crate_Metal', 20, 82, { roomId: slaughterhouseId });
  editor.spawnProp(LEVEL_ID, 'Crate_Metal', 29, 82, { roomId: slaughterhouseId });
  editor.spawnProp(LEVEL_ID, 'Crate_Metal', 20, 86, { roomId: slaughterhouseId });
  editor.spawnProp(LEVEL_ID, 'Crate_Metal', 29, 86, { roomId: slaughterhouseId });
  // 2x Workbench (floor)
  editor.spawnProp(LEVEL_ID, 'Workbench', 24, 82, { roomId: slaughterhouseId });
  editor.spawnProp(LEVEL_ID, 'Workbench', 24, 86, { roomId: slaughterhouseId });
  // 1x Anvil (floor)
  editor.spawnProp(LEVEL_ID, 'Anvil', 26, 83, { roomId: slaughterhouseId });
  // 2x Bucket_Metal (floor)
  editor.spawnProp(LEVEL_ID, 'Bucket_Metal', 22, 84, { roomId: slaughterhouseId });
  editor.spawnProp(LEVEL_ID, 'Bucket_Metal', 27, 84, { roomId: slaughterhouseId });

  // --- Butcher's Hook (bounds: 36, 82, 6, 6) ---
  // 4x Crate_Metal
  editor.spawnProp(LEVEL_ID, 'Crate_Metal', 37, 83, { roomId: butchersHookId });
  editor.spawnProp(LEVEL_ID, 'Crate_Metal', 40, 83, { roomId: butchersHookId });
  editor.spawnProp(LEVEL_ID, 'Crate_Metal', 37, 86, { roomId: butchersHookId });
  editor.spawnProp(LEVEL_ID, 'Crate_Metal', 40, 86, { roomId: butchersHookId });
  // 2x Barrel
  editor.spawnProp(LEVEL_ID, 'Barrel', 38, 85, { roomId: butchersHookId });
  editor.spawnProp(LEVEL_ID, 'Barrel', 39, 85, { roomId: butchersHookId });
  // 1x Lantern_Wall (north wall)
  editor.spawnProp(LEVEL_ID, 'Lantern_Wall', 39, 83, {
    roomId: butchersHookId,
    surfaceAnchor: {
      face: 'north',
      offsetX: 0,
      offsetY: 2.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });

  // --- Il Macello's Abattoir (bounds: 17, 94, 16, 16) ---
  // 8x Chain_Coil (ceiling)
  const abattoirChains = [
    [21, 97],
    [28, 97],
    [24, 100],
    [21, 103],
    [28, 103],
    [24, 106],
    [21, 106],
    [28, 100],
  ];
  for (const [cx, cz] of abattoirChains) {
    editor.spawnProp(LEVEL_ID, 'Chain_Coil', cx, cz, { roomId: abattoirId });
  }
  // 4x Torch_Metal (corners)
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 18, 95, {
    roomId: abattoirId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 2.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 31, 95, {
    roomId: abattoirId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 2.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 18, 108, {
    roomId: abattoirId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 2.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 31, 108, {
    roomId: abattoirId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 2.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 1x Chandelier (ceiling center)
  editor.spawnProp(LEVEL_ID, 'Chandelier', 25, 107, { roomId: abattoirId });
  // 2x Sword_Bronze (south wall)
  editor.spawnProp(LEVEL_ID, 'Sword_Bronze', 22, 108, {
    roomId: abattoirId,
    surfaceAnchor: {
      face: 'south',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Sword_Bronze', 28, 108, {
    roomId: abattoirId,
    surfaceAnchor: {
      face: 'south',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 2x Shield_Wooden (south wall)
  editor.spawnProp(LEVEL_ID, 'Shield_Wooden', 23, 108, {
    roomId: abattoirId,
    surfaceAnchor: {
      face: 'south',
      offsetX: 0,
      offsetY: 2.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Shield_Wooden', 27, 108, {
    roomId: abattoirId,
    surfaceAnchor: {
      face: 'south',
      offsetX: 0,
      offsetY: 2.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });

  // =========================================================================
  // 6. TRIGGERS (from "Triggers" table)
  // =========================================================================
  //
  // NOTE: T6-T10 (Slaughterhouse arena) were created by setupArenaWaves() above.
  // Remaining triggers to create manually:

  // T1: startBleeding — full Pier zone
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 26,
    zoneZ: 2,
    zoneW: 8,
    zoneH: 6,
    roomId: pierId,
    once: true,
    actionData: { type: 'startBleeding', drainRate: 1, killRestore: 10 },
  });

  // T2: ambientChange — Blood River fog
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 20,
    zoneZ: 12,
    zoneW: 20,
    zoneH: 14,
    roomId: bloodRiverId,
    once: true,
    actionData: { fogDensity: 0.05, fogColor: '#2a0808' },
  });

  // T3: ambientChange — Thorny Passage fog
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 44,
    zoneZ: 18,
    zoneW: 6,
    zoneH: 16,
    roomId: thornyPassageId,
    once: true,
    actionData: { fogDensity: 0.07, fogColor: '#1a0505' },
  });

  // T4: ambientChange — Burning Shore fog
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 16,
    zoneZ: 54,
    zoneW: 18,
    zoneH: 10,
    roomId: burningShoreId,
    once: true,
    actionData: { fogDensity: 0.03, fogColor: '#331505' },
  });

  // T5: weaponPickup — Flamethrower Shrine altar
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.DIALOGUE,
    zoneX: 24,
    zoneZ: 70,
    zoneW: 2,
    zoneH: 2,
    roomId: flamethrowerShrineId,
    once: true,
    actionData: { text: 'The wilderness gave you fire. Use it.' },
  });

  // T11: bossIntro — boss chamber entrance zone
  editor.bossIntro(
    LEVEL_ID,
    { x: 19, z: 95, w: 12, h: 3 },
    'Meat. That is all you are. Meat on hooks.',
    { roomId: abattoirId },
  );

  // T12: lockDoors on boss intro (with 3s delay)
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.LOCK_DOORS,
    zoneX: 19,
    zoneZ: 95,
    zoneW: 12,
    zoneH: 3,
    roomId: abattoirId,
    once: true,
    delay: 3,
  });

  // T13: bossPhase — Boss HP < 60%
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 17,
    zoneZ: 94,
    zoneW: 16,
    zoneH: 16,
    roomId: abattoirId,
    once: true,
    actionData: { condition: 'bossHpBelow60', phase: 2, enableChainGrapple: true },
  });

  // T14: bossPhase — Boss HP < 30% (floor retraction)
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 17,
    zoneZ: 94,
    zoneW: 16,
    zoneH: 16,
    roomId: abattoirId,
    once: true,
    actionData: {
      condition: 'bossHpBelow30',
      phase: 3,
      floorRetractInterval: 4000,
      floorRetractOrder: 'edges-inward',
      panelSize: 3,
      fogDensity: 0.08,
      fogColor: '#2a0000',
    },
  });

  // =========================================================================
  // 7. ENVIRONMENT ZONES (from "Environment Zones" table)
  // =========================================================================

  // Global bleeding — full level drain zone
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.BLOOD,
    boundsX: 0,
    boundsZ: 0,
    boundsW: 60,
    boundsH: 110,
    intensity: 1.0,
  });

  // Blood River liquid — damage zone
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.FIRE,
    boundsX: 20,
    boundsZ: 12,
    boundsW: 20,
    boundsH: 14,
    intensity: 2.0,
  });

  // Thorn walls (passage) — damage zone
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.CRUSHING,
    boundsX: 44,
    boundsZ: 18,
    boundsW: 6,
    boundsH: 16,
    intensity: 5.0,
  });

  // Thorn columns (Thornwood) — damage zone
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.CRUSHING,
    boundsX: 36,
    boundsZ: 38,
    boundsW: 14,
    boundsH: 12,
    intensity: 5.0,
  });

  // Fire geysers 1-6
  const geysers: [number, number][] = [
    [18, 55],
    [28, 55],
    [23, 57],
    [18, 59],
    [30, 59],
    [24, 61],
  ];
  for (const [gx, gz] of geysers) {
    editor.addEnvironmentZone(LEVEL_ID, {
      envType: ENV_TYPES.FIRE,
      boundsX: gx,
      boundsZ: gz,
      boundsW: 2,
      boundsH: 2,
      intensity: 8.0,
    });
  }

  // Abattoir void — below retracted floor panels
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.VOID,
    boundsX: 17,
    boundsZ: 94,
    boundsW: 16,
    boundsH: 16,
    intensity: 15.0,
  });

  // =========================================================================
  // 8. PLAYER SPAWN (from "Player Spawn" section)
  // =========================================================================
  // Position: (30, 5) — center of Pier
  // Facing: pi (south — facing toward Blood River below)

  editor.setPlayerSpawn(LEVEL_ID, 30, 5, Math.PI);

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
    throw new Error('Circle 7 (Violence) level validation failed');
  }
  console.log('Circle 7 (Violence) built successfully');
  if (result.warnings.length > 0) {
    console.log('Warnings:', result.warnings);
  }
}
