#!/usr/bin/env npx tsx
/**
 * Build script for Circle 6: Heresy -- The Circle of Defiance
 *
 * Translates docs/circles/06-heresy.md into LevelEditor API calls.
 * Run: npx tsx scripts/build-circle-6.ts
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

const LEVEL_ID = 'circle-6-heresy';
const THEME_ID = 'circle-6-heresy';

export async function buildCircle6(dbPath: string) {
  const sqliteDb = new BetterSqlite3(dbPath);
  const db = drizzle(sqliteDb, { schema });
  await migrateAndSeed(db);
  const editor = new LevelEditor(db);

  // =========================================================================
  // 1. THEME (from "Theme Configuration" section)
  // =========================================================================

  editor.createTheme(THEME_ID, {
    name: 'heresy',
    displayName: 'HERESY --- The Circle of Defiance',
    primaryWall: MapCell.WALL_STONE,
    accentWalls: [MapCell.WALL_SECRET, MapCell.WALL_OBSIDIAN],
    fogDensity: 0.03,
    fogColor: '#1a1520',
    ambientColor: '#6633aa',
    ambientIntensity: 0.12,
    skyColor: '#080010',
    particleEffect: 'incense', // Slow-drifting violet particles
    enemyTypes: ['shadowGoat', 'fireGoat'],
    enemyDensity: 1.0, // Standard density
    pickupDensity: 0.7, // Moderate -- rewards exploration
  });

  // =========================================================================
  // 2. LEVEL (from "Identity" + "Grid Dimensions" sections)
  // =========================================================================

  editor.createLevel(LEVEL_ID, {
    name: 'Circle 6: Heresy',
    levelType: 'circle',
    width: 50, // "50 wide"
    depth: 70, // "70 deep" -- boss room at Z=54 + H=14 = 68, fits within 70
    floor: 6,
    themeId: THEME_ID,
    circleNumber: 6,
    sin: 'Defiance',
    guardian: 'Profano',
  });

  // =========================================================================
  // 3. ROOMS (from "Room Placement" table, in sortOrder)
  // =========================================================================
  //
  // | Room              | X  | Z  | W  | H  | Type         | Elevation       | sortOrder |
  // | Narthex           | 21 |  2 |  8 |  6 | exploration  | 0               | 0 |
  // | Nave of Lies      | 18 | 12 | 14 | 10 | exploration  | 0               | 1 |
  // | Confessional      |  8 | 16 |  6 |  6 | exploration  | 0               | 2 |
  // | Catacombs         | 36 | 14 | 10 | 10 | exploration  | -1 (below)      | 3 |
  // | Trial Chamber     | 19 | 32 | 12 | 12 | arena        | 0 (bench at +1) | 4 |
  // | Ossuary           | 10 | 40 |  8 |  8 | exploration  | -1 (below)      | 5 |
  // | Heretic's Library | 36 | 36 |  6 |  8 | secret       | 0               | 6 |
  // | Profano's Chapel  | 18 | 54 | 14 | 14 | boss         | 0               | 7 |

  const narthexId = editor.room(LEVEL_ID, 'narthex', 21, 2, 8, 6, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 0,
  });

  const naveId = editor.room(LEVEL_ID, 'nave_of_lies', 18, 12, 14, 10, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 1,
  });

  const confessionalId = editor.room(LEVEL_ID, 'confessional', 8, 16, 6, 6, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 2,
  });

  // Catacombs: design doc says "maze" type, but no MAZE in ROOM_TYPES.
  // Using EXPLORATION as the closest match (maze is an exploration variant).
  const catacombsId = editor.room(LEVEL_ID, 'catacombs', 36, 14, 10, 10, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: -1,
    sortOrder: 3,
  });

  const trialChamberId = editor.room(LEVEL_ID, 'trial_chamber', 19, 32, 12, 12, {
    roomType: ROOM_TYPES.ARENA,
    elevation: 0,
    sortOrder: 4,
  });

  const ossuaryId = editor.room(LEVEL_ID, 'ossuary', 10, 40, 8, 8, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: -1,
    sortOrder: 5,
  });

  const libraryId = editor.room(LEVEL_ID, 'heretics_library', 36, 36, 6, 8, {
    roomType: ROOM_TYPES.SECRET,
    elevation: 0,
    sortOrder: 6,
  });

  const chapelId = editor.room(LEVEL_ID, 'profano_chapel', 18, 54, 14, 14, {
    roomType: ROOM_TYPES.BOSS,
    elevation: 0,
    sortOrder: 7,
  });

  // =========================================================================
  // 4. CONNECTIONS (from "Connections" table)
  // =========================================================================
  //
  // | From              | To                | Type     | Width | Notes                                   |
  // | Narthex           | Nave of Lies      | corridor | 3     | Arched temple entrance, descending 2 steps |
  // | Nave of Lies      | Confessional      | corridor | 2     | West exit, through side aisle             |
  // | Nave of Lies      | Catacombs         | corridor | 2     | East exit, stairs down (0 to -1)          |
  // | Confessional      | Trial Chamber     | corridor | 2     | South, merges with Catacombs path         |
  // | Catacombs         | Trial Chamber     | corridor | 2     | South, stairs up (-1 to 0)               |
  // | Trial Chamber     | Ossuary           | corridor | 2     | West, stairs down (0 to -1)              |
  // | Trial Chamber     | Heretic's Library | secret   | 2     | WALL_SECRET at east boundary             |
  // | Ossuary           | Profano's Chapel  | corridor | 3     | South, ascending ramp to boss            |

  // Narthex -> Nave of Lies (corridor, width 3)
  editor.corridor(LEVEL_ID, narthexId, naveId, 3);

  // Nave of Lies -> Confessional (corridor, width 2)
  editor.corridor(LEVEL_ID, naveId, confessionalId, 2);

  // Nave of Lies -> Catacombs (stairs, width 2, elev 0 to -1)
  editor.connect(LEVEL_ID, naveId, catacombsId, {
    connectionType: CONNECTION_TYPES.STAIRS,
    corridorWidth: 2,
    fromElevation: 0,
    toElevation: -1,
  });

  // Confessional -> Trial Chamber (corridor, width 2)
  editor.corridor(LEVEL_ID, confessionalId, trialChamberId, 2);

  // Catacombs -> Trial Chamber (stairs, width 2, elev -1 to 0)
  editor.connect(LEVEL_ID, catacombsId, trialChamberId, {
    connectionType: CONNECTION_TYPES.STAIRS,
    corridorWidth: 2,
    fromElevation: -1,
    toElevation: 0,
  });

  // Trial Chamber -> Ossuary (stairs, width 2, elev 0 to -1)
  editor.connect(LEVEL_ID, trialChamberId, ossuaryId, {
    connectionType: CONNECTION_TYPES.STAIRS,
    corridorWidth: 2,
    fromElevation: 0,
    toElevation: -1,
  });

  // Trial Chamber -> Heretic's Library (secret, width 2)
  editor.connect(LEVEL_ID, trialChamberId, libraryId, {
    connectionType: CONNECTION_TYPES.SECRET,
    corridorWidth: 2,
  });

  // Ossuary -> Profano's Chapel (corridor, width 3)
  editor.corridor(LEVEL_ID, ossuaryId, chapelId, 3);

  // =========================================================================
  // 5. ENTITIES: ENEMIES (from "Enemies" table)
  // =========================================================================

  // --- Nave of Lies: 2x fireGoat patrol pew aisles ---
  //   Room bounds: (18, 12, 14, 10) -> interior: x=[19..30], z=[13..20]
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 20, 16, {
    roomId: naveId,
    patrol: [
      { x: 20, z: 14 },
      { x: 20, z: 20 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 29, 16, {
    roomId: naveId,
    patrol: [
      { x: 29, z: 14 },
      { x: 29, z: 20 },
    ],
  });

  // --- Confessional: 1x shadowGoat ambush in booth B (trigger-spawned) ---
  //   Room bounds: (8, 16, 6, 6) -> interior: x=[9..12], z=[17..20]
  //   This is handled by trigger T2 (ambush in booth B)

  // --- Catacombs: 3x shadowGoat roam corridors ---
  //   Room bounds: (36, 14, 10, 10) -> interior: x=[37..44], z=[15..22]
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.SHADOW_GOAT, 38, 16, {
    roomId: catacombsId,
    patrol: [
      { x: 38, z: 16 },
      { x: 42, z: 20 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.SHADOW_GOAT, 42, 18, {
    roomId: catacombsId,
    patrol: [
      { x: 42, z: 18 },
      { x: 38, z: 22 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.SHADOW_GOAT, 40, 22, {
    roomId: catacombsId,
    patrol: [
      { x: 40, z: 22 },
      { x: 44, z: 16 },
    ],
  });

  // --- Trial Chamber: 2 waves using setupArenaWaves ---
  //   Room bounds: (19, 32, 12, 12) -> interior: x=[20..29], z=[33..42]
  //   Trigger zone from T4/T5: (21, 34, 8, 4)
  //   Wave 1: 3x fireGoat on elevated bench
  //   Wave 2: 2x shadowGoat + 2x fireGoat
  editor.setupArenaWaves(LEVEL_ID, trialChamberId, { x: 21, z: 34, w: 8, h: 4 }, [
    // Wave 1: 3x fireGoat on the elevated bench
    [
      { type: ENEMY_TYPES.FIRE_GOAT, x: 23, z: 35 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 25, z: 34 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 27, z: 35 },
    ],
    // Wave 2: 2x shadowGoat + 2x fireGoat
    [
      { type: ENEMY_TYPES.SHADOW_GOAT, x: 20, z: 40 },
      { type: ENEMY_TYPES.SHADOW_GOAT, x: 29, z: 40 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 24, z: 34 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 26, z: 34 },
    ],
  ]);

  // --- Ossuary: 2x shadowGoat lurk among chains ---
  //   Room bounds: (10, 40, 8, 8) -> interior: x=[11..16], z=[41..46]
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.SHADOW_GOAT, 12, 43, {
    roomId: ossuaryId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.SHADOW_GOAT, 16, 45, {
    roomId: ossuaryId,
  });

  // --- Profano's Chapel: 1x shadowGoat guard + boss ---
  //   Room bounds: (18, 54, 14, 14) -> interior: x=[19..30], z=[55..66]
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.SHADOW_GOAT, 25, 56, {
    roomId: chapelId,
  });

  // --- Profano boss entity ---
  //   Room center: (25, 61)
  editor.spawnBoss(LEVEL_ID, 'boss-profano', 25, 61, {
    roomId: chapelId,
    facing: 0,
  });

  // =========================================================================
  // 5b. ENTITIES: PICKUPS (from "Pickups" table)
  // =========================================================================

  // Narthex: ammo (28, 5) -- behind WALL_SECRET alcove
  //   Room bounds: (21, 2, 8, 6) -> interior: x=[22..27], z=[3..6]
  //   (28, 5) is at x=28, which is 21+8-1=28 (east wall). Use x=27 for interior.
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 27, 5);

  // Nave of Lies: health (22, 14) -- west aisle near WALL_SECRET exit
  //   Room bounds: (18, 12, 14, 10) -> interior: x=[19..30], z=[13..20]
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 22, 14);

  // Confessional: health (10, 17) -- inside booth A
  //   Room bounds: (8, 16, 6, 6) -> interior: x=[9..12], z=[17..20]
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 10, 17);

  // Catacombs: ammo (40, 16) -- near first WALL_SECRET shortcut
  //   Room bounds: (36, 14, 10, 10) -> interior: x=[37..44], z=[15..22]
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 40, 16);

  // Catacombs: health (45, 25) -- deep in maze, dead end
  //   x=45 is at 36+10-1=45 (east wall). Use x=44. z=25 is beyond room (14+10=24 max).
  //   Adjust to (44, 22) to stay inside.
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 44, 22);

  // Trial Chamber: ammo (23, 36) -- center floor
  //   Room bounds: (19, 32, 12, 12) -> interior: x=[20..29], z=[33..42]
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 23, 36);

  // Trial Chamber: health (27, 40) -- south, near exit
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 27, 40);

  // Heretic's Library: ammo x2 (38, 39), (40, 41)
  //   Room bounds: (36, 36, 6, 8) -> interior: x=[37..40], z=[37..42]
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 38, 39);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 40, 41);

  // Heretic's Library: health (38, 41) -- on reading podium
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 38, 41);

  // Profano's Chapel: ammo x3 (20, 64), (25, 64), (30, 64)
  //   Room bounds: (18, 54, 14, 14) -> interior: x=[19..30], z=[55..66]
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 20, 64);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 25, 64);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 30, 64);

  // Profano's Chapel: health x2 (19, 55), (31, 55)
  //   x=31 is at 18+14-1=31 (east wall). Use x=30 for interior.
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 19, 55);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 30, 55);

  // =========================================================================
  // 5c. ENTITIES: PROPS (from "Props" table)
  // =========================================================================

  // --- Narthex (bounds: 21, 2, 8, 6) ---
  // 2x Vase_4 (floor, flanking entrance)
  editor.spawnProp(LEVEL_ID, 'Vase_4', 22, 3, { roomId: narthexId });
  editor.spawnProp(LEVEL_ID, 'Vase_4', 27, 3, { roomId: narthexId });
  // 1x Scroll_2 (pedestal)
  editor.spawnProp(LEVEL_ID, 'Scroll_2', 25, 3, { roomId: narthexId });
  // 1x CandleStick_Triple (floor)
  editor.spawnProp(LEVEL_ID, 'CandleStick_Triple', 26, 5, { roomId: narthexId });
  // 1x Banner_2 (north wall, inverted)
  editor.spawnProp(LEVEL_ID, 'Banner_2', 25, 3, {
    roomId: narthexId,
    surfaceAnchor: {
      face: 'south',
      offsetX: 0,
      offsetY: 2.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });

  // --- Nave of Lies (bounds: 18, 12, 14, 10) ---
  // 16x Bench (floor, 4 rows of 4 pews)
  //   Arranged in 4 rows (z=14, 16, 18, 20) x 4 columns (x=20, 23, 26, 29)
  for (const bz of [14, 16, 18, 20]) {
    for (const bx of [20, 23, 26, 29]) {
      editor.spawnProp(LEVEL_ID, 'Bench', bx, bz, { roomId: naveId });
    }
  }
  // 4x CandleStick_Triple (floor, corners)
  editor.spawnProp(LEVEL_ID, 'CandleStick_Triple', 19, 13, { roomId: naveId });
  editor.spawnProp(LEVEL_ID, 'CandleStick_Triple', 30, 13, { roomId: naveId });
  editor.spawnProp(LEVEL_ID, 'CandleStick_Triple', 19, 20, { roomId: naveId });
  editor.spawnProp(LEVEL_ID, 'CandleStick_Triple', 30, 20, { roomId: naveId });
  // 4x Banner_2 (walls, inverted -- 2 on east, 2 on west)
  editor.spawnProp(LEVEL_ID, 'Banner_2', 19, 15, {
    roomId: naveId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 2.8,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Banner_2', 19, 19, {
    roomId: naveId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 2.8,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Banner_2', 30, 15, {
    roomId: naveId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 2.8,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Banner_2', 30, 19, {
    roomId: naveId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 2.8,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });

  // --- Confessional (bounds: 8, 16, 6, 6) ---
  // 3x Cabinet (floor, forming booths)
  editor.spawnProp(LEVEL_ID, 'Cabinet', 9, 17, { roomId: confessionalId });
  editor.spawnProp(LEVEL_ID, 'Cabinet', 9, 19, { roomId: confessionalId });
  editor.spawnProp(LEVEL_ID, 'Cabinet', 9, 20, { roomId: confessionalId });
  // 1x Candle_2 (east wall)
  editor.spawnProp(LEVEL_ID, 'Candle_2', 12, 18, {
    roomId: confessionalId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });

  // --- Catacombs (bounds: 36, 14, 10, 10) ---
  // 3x Torch_Metal (walls, safe path intersections -- lit)
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 37, 16, {
    roomId: catacombsId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 41, 19, {
    roomId: catacombsId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 38, 22, {
    roomId: catacombsId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 2x Torch_Metal (walls, trap paths -- extinguished/dark)
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 44, 17, {
    roomId: catacombsId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 40, 21, {
    roomId: catacombsId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 4x Vase_2 (floor, dead ends)
  editor.spawnProp(LEVEL_ID, 'Vase_2', 37, 18, { roomId: catacombsId });
  editor.spawnProp(LEVEL_ID, 'Vase_2', 43, 15, { roomId: catacombsId });
  editor.spawnProp(LEVEL_ID, 'Vase_2', 39, 20, { roomId: catacombsId });
  editor.spawnProp(LEVEL_ID, 'Vase_2', 44, 22, { roomId: catacombsId });
  // 3x Vase_4 (floor, intersections)
  editor.spawnProp(LEVEL_ID, 'Vase_4', 40, 16, { roomId: catacombsId });
  editor.spawnProp(LEVEL_ID, 'Vase_4', 38, 19, { roomId: catacombsId });
  editor.spawnProp(LEVEL_ID, 'Vase_4', 42, 21, { roomId: catacombsId });

  // --- Trial Chamber (bounds: 19, 32, 12, 12) ---
  // 2x Bench (elevated bench/judge platform)
  editor.spawnProp(LEVEL_ID, 'Bench', 23, 35, { roomId: trialChamberId });
  editor.spawnProp(LEVEL_ID, 'Bench', 26, 35, { roomId: trialChamberId });
  // 1x BookStand (bench podium)
  editor.spawnProp(LEVEL_ID, 'BookStand', 25, 34, { roomId: trialChamberId });
  // 4x CandleStick_Triple (floor, corners)
  editor.spawnProp(LEVEL_ID, 'CandleStick_Triple', 20, 33, { roomId: trialChamberId });
  editor.spawnProp(LEVEL_ID, 'CandleStick_Triple', 29, 33, { roomId: trialChamberId });
  editor.spawnProp(LEVEL_ID, 'CandleStick_Triple', 20, 42, { roomId: trialChamberId });
  editor.spawnProp(LEVEL_ID, 'CandleStick_Triple', 29, 42, { roomId: trialChamberId });

  // --- Ossuary (bounds: 10, 40, 8, 8) ---
  // 5x Chain_Coil (ceiling-hung)
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 12, 42, { roomId: ossuaryId });
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 15, 42, { roomId: ossuaryId });
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 13, 44, { roomId: ossuaryId });
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 12, 46, { roomId: ossuaryId });
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 15, 46, { roomId: ossuaryId });
  // 4x Vase_2 (floor)
  editor.spawnProp(LEVEL_ID, 'Vase_2', 11, 41, { roomId: ossuaryId });
  editor.spawnProp(LEVEL_ID, 'Vase_2', 16, 41, { roomId: ossuaryId });
  editor.spawnProp(LEVEL_ID, 'Vase_2', 11, 46, { roomId: ossuaryId });
  editor.spawnProp(LEVEL_ID, 'Vase_2', 16, 46, { roomId: ossuaryId });
  // 2x Vase_4 (floor)
  editor.spawnProp(LEVEL_ID, 'Vase_4', 13, 41, { roomId: ossuaryId });
  editor.spawnProp(LEVEL_ID, 'Vase_4', 14, 46, { roomId: ossuaryId });

  // --- Heretic's Library (bounds: 36, 36, 6, 8) ---
  // 4x Bookcase_2 (walls)
  editor.spawnProp(LEVEL_ID, 'Bookcase_2', 37, 38, { roomId: libraryId });
  editor.spawnProp(LEVEL_ID, 'Bookcase_2', 37, 41, { roomId: libraryId });
  editor.spawnProp(LEVEL_ID, 'Bookcase_2', 40, 38, { roomId: libraryId });
  editor.spawnProp(LEVEL_ID, 'Bookcase_2', 40, 41, { roomId: libraryId });
  // 1x BookStand (center)
  editor.spawnProp(LEVEL_ID, 'BookStand', 39, 40, { roomId: libraryId });
  // 3x Book_5 (floor)
  editor.spawnProp(LEVEL_ID, 'Book_5', 38, 39, { roomId: libraryId });
  editor.spawnProp(LEVEL_ID, 'Book_5', 39, 42, { roomId: libraryId });
  editor.spawnProp(LEVEL_ID, 'Book_5', 40, 39, { roomId: libraryId });
  // 2x Book_7 (floor)
  editor.spawnProp(LEVEL_ID, 'Book_7', 38, 42, { roomId: libraryId });
  editor.spawnProp(LEVEL_ID, 'Book_7', 40, 42, { roomId: libraryId });
  // 2x Scroll_1 (shelves)
  editor.spawnProp(LEVEL_ID, 'Scroll_1', 37, 40, { roomId: libraryId });
  editor.spawnProp(LEVEL_ID, 'Scroll_1', 40, 40, { roomId: libraryId });
  // 1x CandleStick_Triple (floor)
  editor.spawnProp(LEVEL_ID, 'CandleStick_Triple', 39, 38, { roomId: libraryId });

  // --- Profano's Chapel (bounds: 18, 54, 14, 14) ---
  // 5x CandleStick_Triple (floor, pentagram points)
  editor.spawnProp(LEVEL_ID, 'CandleStick_Triple', 21, 56, { roomId: chapelId });
  editor.spawnProp(LEVEL_ID, 'CandleStick_Triple', 29, 56, { roomId: chapelId });
  editor.spawnProp(LEVEL_ID, 'CandleStick_Triple', 20, 62, { roomId: chapelId });
  editor.spawnProp(LEVEL_ID, 'CandleStick_Triple', 30, 62, { roomId: chapelId });
  editor.spawnProp(LEVEL_ID, 'CandleStick_Triple', 25, 66, { roomId: chapelId });
  // 1x BookStand (center altar)
  editor.spawnProp(LEVEL_ID, 'BookStand', 25, 61, { roomId: chapelId });
  // 1x Chandelier (ceiling center)
  editor.spawnProp(LEVEL_ID, 'Chandelier', 25, 61, { roomId: chapelId });
  // 2x Chalice (altar surface)
  editor.spawnProp(LEVEL_ID, 'Chalice', 24, 61, { roomId: chapelId });
  editor.spawnProp(LEVEL_ID, 'Chalice', 26, 61, { roomId: chapelId });
  // 2x Banner_2 (walls, inverted)
  editor.spawnProp(LEVEL_ID, 'Banner_2', 25, 55, {
    roomId: chapelId,
    surfaceAnchor: {
      face: 'south',
      offsetX: 0,
      offsetY: 3.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Banner_2', 25, 66, {
    roomId: chapelId,
    surfaceAnchor: {
      face: 'north',
      offsetX: 0,
      offsetY: 3.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });

  // =========================================================================
  // 6. TRIGGERS (from "Triggers" table)
  // =========================================================================
  //
  // NOTE: T4-T7 (Trial Chamber lock/wave/unlock) were created by setupArenaWaves() above.
  // Remaining triggers to create manually:

  // T1: Nave of Lies FLOOR_VOID trap -- floorCollapse
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 23,
    zoneZ: 17,
    zoneW: 3,
    zoneH: 4,
    roomId: naveId,
    once: true,
    actionData: {
      type: 'floorCollapse',
      cells: [
        { x: 24, z: 17 },
        { x: 24, z: 18 },
        { x: 25, z: 18 },
        { x: 25, z: 19 },
        { x: 24, z: 19 },
        { x: 24, z: 20 },
      ],
      damage: 25,
    },
  });

  // T2: Confessional booth B ambush -- shadowGoat
  editor.ambush(
    LEVEL_ID,
    { x: 9, z: 18, w: 2, h: 2 },
    [{ type: ENEMY_TYPES.SHADOW_GOAT, x: 10, z: 18 }],
    { roomId: confessionalId },
  );

  // T3: Catacombs ambientChange -- fog thickens on entry
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 37,
    zoneZ: 14,
    zoneW: 10,
    zoneH: 2,
    roomId: catacombsId,
    once: true,
    actionData: { fogDensity: 0.06, fogColor: '#120e18' },
  });

  // T8: bossIntro -- player enters chapel entrance zone
  editor.bossIntro(
    LEVEL_ID,
    { x: 20, z: 55, w: 10, h: 3 },
    'Truth is the first heresy. I am its priestess.',
    { roomId: chapelId },
  );

  // T9: lockDoors on boss intro (with 3s delay)
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.LOCK_DOORS,
    zoneX: 20,
    zoneZ: 55,
    zoneW: 10,
    zoneH: 3,
    roomId: chapelId,
    once: true,
    delay: 3,
  });

  // T10: bossPhase2 -- Boss HP < 60% (camera inversion, fog surge)
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 18,
    zoneZ: 54,
    zoneW: 14,
    zoneH: 14,
    roomId: chapelId,
    once: true,
    actionData: {
      condition: 'bossHpBelow60',
      phase: 2,
      effect: 'cameraInvert',
      fogDensity: 0.1,
      fogColor: '#201020',
    },
  });

  // T11: bossPhase3 -- Boss HP < 30% (floor collapse cycle)
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 18,
    zoneZ: 54,
    zoneW: 14,
    zoneH: 14,
    roomId: chapelId,
    once: true,
    actionData: {
      condition: 'bossHpBelow30',
      phase: 3,
      effect: 'floorCollapse',
      collapseInterval: 4000,
      collapseCount: 4,
      collapseDuration: 3000,
    },
  });

  // =========================================================================
  // 7. ENVIRONMENT ZONES (from "Environment Zones" table)
  // =========================================================================

  // Temple fog: full level, baseline incense haze
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.FOG,
    boundsX: 0,
    boundsZ: 0,
    boundsW: 50,
    boundsH: 70,
    intensity: 0.3,
  });

  // Catacombs darkness: thicker underground fog
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.FOG,
    boundsX: 36,
    boundsZ: 14,
    boundsW: 10,
    boundsH: 10,
    intensity: 0.6,
  });

  // Nave void trap: damage zone on FLOOR_VOID cells
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.VOID,
    boundsX: 23,
    boundsZ: 17,
    boundsW: 3,
    boundsH: 4,
    intensity: 25.0,
  });

  // Catacomb void trap 1
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.VOID,
    boundsX: 44,
    boundsZ: 20,
    boundsW: 2,
    boundsH: 1,
    intensity: 25.0,
  });

  // Catacomb void trap 2
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.VOID,
    boundsX: 40,
    boundsZ: 23,
    boundsW: 2,
    boundsH: 1,
    intensity: 25.0,
  });

  // Chapel pentagram: purple particle effect
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.ILLUSION,
    boundsX: 22,
    boundsZ: 58,
    boundsW: 6,
    boundsH: 6,
    intensity: 1.0,
  });

  // =========================================================================
  // 8. PLAYER SPAWN (from "Player Spawn" section)
  // =========================================================================
  //   Position: (25, 5) -- center of Narthex
  //   Facing: pi (south -- facing toward Nave of Lies)

  editor.setPlayerSpawn(LEVEL_ID, 25, 5, Math.PI);

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
    throw new Error('Circle 6 (Heresy) level validation failed');
  }
  console.log('Circle 6 (Heresy) built successfully');
  if (result.warnings.length > 0) {
    console.log('Warnings:', result.warnings);
  }
}
