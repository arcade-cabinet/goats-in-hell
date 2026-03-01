#!/usr/bin/env npx tsx
/**
 * Build script for Circle 2: Lust — The Circle of Desire
 *
 * Translates docs/circles/02-lust.md into LevelEditor API calls.
 * Run: npx tsx scripts/build-circle-2.ts
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

const LEVEL_ID = 'circle-2-lust';
const THEME_ID = 'circle-2-lust';

export async function buildCircle2(dbPath: string) {
  const sqliteDb = new BetterSqlite3(dbPath);
  const db = drizzle(sqliteDb, { schema });
  await migrateAndSeed(db);
  const editor = new LevelEditor(db);

  // =========================================================================
  // 1. THEME (from "Theme Configuration" section)
  // =========================================================================

  editor.createTheme(THEME_ID, {
    name: 'lust',
    displayName: 'LUST \u2014 The Circle of Desire',
    primaryWall: MapCell.WALL_STONE, // Marble-textured stone
    accentWalls: [MapCell.WALL_LAVA], // Lava borders as accent
    fogDensity: 0.03,
    fogColor: '#2e1a1a',
    ambientColor: '#cc8844',
    ambientIntensity: 0.2,
    skyColor: '#1a0a0a',
    particleEffect: 'embers', // Floating ember particles from lava
    enemyTypes: ['hellgoat', 'fireGoat'],
    enemyDensity: 1.0, // Standard density
    pickupDensity: 0.7, // Moderate
  });

  // =========================================================================
  // 2. LEVEL (from "Identity" + "Grid Dimensions" sections)
  // =========================================================================

  editor.createLevel(LEVEL_ID, {
    name: 'Circle 2: Lust',
    levelType: 'circle',
    width: 45, // "45 wide"
    depth: 95, // Rooms extend to z=92 (Sanctum at z=78 + h=14), need extra margin
    floor: 2,
    themeId: THEME_ID,
    circleNumber: 2,
    sin: 'Desire',
    guardian: 'Caprone',
  });

  // =========================================================================
  // 3. ROOMS (from "Room Placement" table, in sortOrder)
  // =========================================================================
  //
  // | Room              | X  | Z  | W  | H  | Type          | Elevation       | sortOrder |
  // | Antechamber       | 18 |  2 |  8 |  6 | exploration   | 0               | 0         |
  // | Wind Corridor     | 20 | 12 |  5 | 16 | gauntlet      | 0               | 1         |
  // | Lover's Gallery   | 15 | 32 | 14 | 10 | exploration   | 0               | 2         |
  // | Boudoir           |  3 | 34 |  6 |  6 | secret        | 0               | 3         |
  // | Siren Pit         | 16 | 46 | 12 | 12 | platforming   | 0 (center=-2)   | 4         |
  // | Tempest Hall      | 15 | 62 | 14 | 12 | arena         | -1              | 5         |
  // | Caprone's Sanctum | 15 | 78 | 14 | 14 | boss          | -1              | 6         |

  const antechamberId = editor.room(LEVEL_ID, 'antechamber', 18, 2, 8, 6, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 0,
  });

  // No GAUNTLET type in ROOM_TYPES, use CORRIDOR as closest match
  const windCorridorId = editor.room(LEVEL_ID, 'wind_corridor', 20, 12, 5, 16, {
    roomType: ROOM_TYPES.CORRIDOR,
    elevation: 0,
    sortOrder: 1,
  });

  const galleryId = editor.room(LEVEL_ID, 'lovers_gallery', 15, 32, 14, 10, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 2,
  });

  const boudoirId = editor.room(LEVEL_ID, 'boudoir', 3, 34, 6, 6, {
    roomType: ROOM_TYPES.SECRET,
    elevation: 0,
    sortOrder: 3,
  });

  const sirenPitId = editor.room(LEVEL_ID, 'siren_pit', 16, 46, 12, 12, {
    roomType: ROOM_TYPES.PLATFORMING,
    elevation: 0,
    sortOrder: 4,
  });

  const tempestHallId = editor.room(LEVEL_ID, 'tempest_hall', 15, 62, 14, 12, {
    roomType: ROOM_TYPES.ARENA,
    elevation: -1,
    sortOrder: 5,
  });

  const sanctumId = editor.room(LEVEL_ID, 'caprone_sanctum', 15, 78, 14, 14, {
    roomType: ROOM_TYPES.BOSS,
    elevation: -1,
    sortOrder: 6,
  });

  // =========================================================================
  // 4. CONNECTIONS (from "Connections" table)
  // =========================================================================
  //
  // | From              | To                | Type          | Width | Notes                        |
  // | Antechamber       | Wind Corridor     | corridor      | 3     | Transition to narrow gauntlet|
  // | Wind Corridor     | Lover's Gallery   | corridor      | 3     | Opens up into wider space    |
  // | Lover's Gallery   | Boudoir           | secret        | 2     | WALL_SECRET on west wall     |
  // | Lover's Gallery   | Siren Pit         | corridor      | 3     | Main path continues south    |
  // | Siren Pit         | Tempest Hall      | corridor+ramp | 3     | Ascending from -2 to -1      |
  // | Tempest Hall      | Caprone's Sanctum | grand doorway | 4     | Wide ceremonial entrance     |

  editor.corridor(LEVEL_ID, antechamberId, windCorridorId, 3);

  editor.corridor(LEVEL_ID, windCorridorId, galleryId, 3);

  editor.connect(LEVEL_ID, galleryId, boudoirId, {
    connectionType: CONNECTION_TYPES.SECRET,
    corridorWidth: 2,
  });

  editor.corridor(LEVEL_ID, galleryId, sirenPitId, 3);

  // Siren Pit -> Tempest Hall: corridor with ascending ramp
  editor.connect(LEVEL_ID, sirenPitId, tempestHallId, {
    connectionType: CONNECTION_TYPES.STAIRS,
    corridorWidth: 3,
    fromElevation: -2,
    toElevation: -1,
  });

  // Tempest Hall -> Caprone's Sanctum: grand doorway (wide door, width 4)
  editor.connect(LEVEL_ID, tempestHallId, sanctumId, {
    connectionType: CONNECTION_TYPES.DOOR,
    corridorWidth: 4,
  });

  // =========================================================================
  // 5. ENTITIES: ENEMIES (from "Enemies" table)
  // =========================================================================

  // Lover's Gallery: 3 fireGoat (ranged, from behind columns)
  //   Room bounds: (15, 32, 14, 10) -> interior: x=[16..27], z=[33..40]
  //   Positions from design doc: N balcony (18,33), center column (22,36), SE corner (27,40)
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 18, 33, {
    roomId: galleryId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 22, 36, {
    roomId: galleryId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 27, 40, {
    roomId: galleryId,
  });

  // Lover's Gallery: 2 hellgoat (melee patrol between columns)
  //   W side (17,37), E side (26,37)
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 17, 37, {
    roomId: galleryId,
    patrol: [
      { x: 17, z: 37 },
      { x: 17, z: 34 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 26, 37, {
    roomId: galleryId,
    patrol: [
      { x: 26, z: 37 },
      { x: 26, z: 34 },
    ],
  });

  // Siren Pit: 2 fireGoat (ranged from ledge niches)
  //   Room bounds: (16, 46, 12, 12) -> interior: x=[17..26], z=[47..56]
  //   E ledge elev -0.5 (26,49), W ledge elev -1.5 (18,54)
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 26, 49, {
    roomId: sirenPitId,
    elevation: -0.5,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 18, 54, {
    roomId: sirenPitId,
    elevation: -1.5,
  });

  // Siren Pit: 1 hellgoat (melee, bottom landing)
  //   Bottom (22,56), elev -2.0
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 22, 56, {
    roomId: sirenPitId,
    elevation: -2.0,
  });

  // Tempest Hall: 2 waves via setupArenaWaves
  //   Room bounds: (15, 62, 14, 12) -> interior: x=[16..27], z=[63..72]
  //   Trigger zone from table: (17, 64, 10, 4)
  //   Wave 1: 3 hellgoat (melee, charge across bridges)
  //     NW platform (16,63), center lane (22,67), SE platform (27,71)
  //   Wave 2: 2 fireGoat + 2 hellgoat (mixed)
  //     W platform (16,69), E platform (27,65), center N (22,63), center S (22,71)
  editor.setupArenaWaves(LEVEL_ID, tempestHallId, { x: 17, z: 64, w: 10, h: 4 }, [
    // Wave 1: 3 hellgoats
    [
      { type: ENEMY_TYPES.HELLGOAT, x: 16, z: 63 },
      { type: ENEMY_TYPES.HELLGOAT, x: 22, z: 67 },
      { type: ENEMY_TYPES.HELLGOAT, x: 27, z: 71 },
    ],
    // Wave 2: 2 fireGoat + 2 hellgoat
    [
      { type: ENEMY_TYPES.FIRE_GOAT, x: 16, z: 69 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 27, z: 65 },
      { type: ENEMY_TYPES.HELLGOAT, x: 22, z: 63 },
      { type: ENEMY_TYPES.HELLGOAT, x: 22, z: 71 },
    ],
  ]);

  // Boss: Caprone on throne dais
  //   Room bounds: (15, 78, 14, 14) -> center dais area: (22, 83)
  editor.spawnBoss(LEVEL_ID, 'caprone', 22, 83, {
    roomId: sanctumId,
    facing: 0, // faces north toward entrance
  });

  // =========================================================================
  // 5b. ENTITIES: PICKUPS (from "Pickups" table)
  // =========================================================================

  // Antechamber: ammo (22, 5) -- starting supply
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 22, 5);

  // Wind Corridor: health (22, 20) -- midway reward
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 22, 20);

  // Lover's Gallery: ammo (22, 36) -- center, risky wind exposure
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 22, 36);

  // Lover's Gallery: health (22, 39) -- south center, near exit
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 22, 39);

  // Siren Pit: ammo (25, 56) -- bottom landing
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 25, 56);

  // Siren Pit: health (23, 56) -- bottom landing reward
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 23, 56);

  // Boudoir: health (7, 36) -- guaranteed safe
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 7, 36);

  // Boudoir: ammo x 2 at (5, 38) and (7, 38)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 5, 38);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 7, 38);

  // Tempest Hall: ammo on W platform (16, 67)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 16, 67);

  // Tempest Hall: health on E platform (27, 67)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 27, 67);

  // Boss chamber: ammo x 2 at NW (17, 80) and NE (27, 80)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 17, 80);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 27, 80);

  // Boss chamber: health x 2 at SW (17, 88) and SE (27, 88)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 17, 88);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 27, 88);

  // =========================================================================
  // 5c. ENTITIES: PROPS (from "Props" table per room)
  // =========================================================================

  // --- Antechamber (bounds: 18, 2, 8, 6) ---
  //   Interior: x=[19..24], z=[3..6]
  // 4x CandleStick_Triple (wall, corners)
  editor.spawnProp(LEVEL_ID, 'CandleStick_Triple', 19, 3, {
    roomId: antechamberId,
    surfaceAnchor: {
      face: 'north',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'CandleStick_Triple', 24, 3, {
    roomId: antechamberId,
    surfaceAnchor: {
      face: 'north',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'CandleStick_Triple', 19, 6, {
    roomId: antechamberId,
    surfaceAnchor: {
      face: 'south',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'CandleStick_Triple', 24, 6, {
    roomId: antechamberId,
    surfaceAnchor: {
      face: 'south',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 2x Vase_2
  editor.spawnProp(LEVEL_ID, 'Vase_2', 20, 4, { roomId: antechamberId });
  editor.spawnProp(LEVEL_ID, 'Vase_2', 23, 4, { roomId: antechamberId });
  // 1x Banner_1 (N wall)
  editor.spawnProp(LEVEL_ID, 'Banner_1', 22, 3, {
    roomId: antechamberId,
    surfaceAnchor: {
      face: 'north',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });

  // --- Wind Corridor (bounds: 20, 12, 5, 16) ---
  //   Interior: x=[21..23], z=[13..26]
  // 4x Banner_2 (W wall, show wind direction)
  editor.spawnProp(LEVEL_ID, 'Banner_2', 21, 14, {
    roomId: windCorridorId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Banner_2', 21, 18, {
    roomId: windCorridorId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Banner_2', 21, 22, {
    roomId: windCorridorId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Banner_2', 21, 26, {
    roomId: windCorridorId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 2x CandleStick_Triple (E wall)
  editor.spawnProp(LEVEL_ID, 'CandleStick_Triple', 23, 16, {
    roomId: windCorridorId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'CandleStick_Triple', 23, 24, {
    roomId: windCorridorId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });

  // --- Lover's Gallery (bounds: 15, 32, 14, 10) ---
  //   Interior: x=[16..27], z=[33..40]
  // 8x Onyx columns (structural, 2 rows of 4)
  editor.spawnProp(LEVEL_ID, 'Column_Onyx', 18, 34, { roomId: galleryId });
  editor.spawnProp(LEVEL_ID, 'Column_Onyx', 21, 34, { roomId: galleryId });
  editor.spawnProp(LEVEL_ID, 'Column_Onyx', 24, 34, { roomId: galleryId });
  editor.spawnProp(LEVEL_ID, 'Column_Onyx', 27, 34, { roomId: galleryId });
  editor.spawnProp(LEVEL_ID, 'Column_Onyx', 18, 38, { roomId: galleryId });
  editor.spawnProp(LEVEL_ID, 'Column_Onyx', 21, 38, { roomId: galleryId });
  editor.spawnProp(LEVEL_ID, 'Column_Onyx', 24, 38, { roomId: galleryId });
  editor.spawnProp(LEVEL_ID, 'Column_Onyx', 27, 38, { roomId: galleryId });
  // 4x CandleStick_Triple (walls, corners)
  editor.spawnProp(LEVEL_ID, 'CandleStick_Triple', 16, 33, {
    roomId: galleryId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'CandleStick_Triple', 27, 33, {
    roomId: galleryId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'CandleStick_Triple', 16, 40, {
    roomId: galleryId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'CandleStick_Triple', 27, 40, {
    roomId: galleryId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 4x Banner_1 (walls, N and S alternating)
  editor.spawnProp(LEVEL_ID, 'Banner_1', 19, 33, {
    roomId: galleryId,
    surfaceAnchor: {
      face: 'north',
      offsetX: 0,
      offsetY: 2.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Banner_1', 25, 33, {
    roomId: galleryId,
    surfaceAnchor: {
      face: 'north',
      offsetX: 0,
      offsetY: 2.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Banner_1', 19, 40, {
    roomId: galleryId,
    surfaceAnchor: {
      face: 'south',
      offsetX: 0,
      offsetY: 2.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Banner_1', 25, 40, {
    roomId: galleryId,
    surfaceAnchor: {
      face: 'south',
      offsetX: 0,
      offsetY: 2.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 2x Chair_1
  editor.spawnProp(LEVEL_ID, 'Chair_1', 19, 36, { roomId: galleryId });
  editor.spawnProp(LEVEL_ID, 'Chair_1', 25, 36, { roomId: galleryId });
  // 2x Chalice
  editor.spawnProp(LEVEL_ID, 'Chalice', 20, 36, { roomId: galleryId });
  editor.spawnProp(LEVEL_ID, 'Chalice', 26, 36, { roomId: galleryId });
  // 2x Vase_4
  editor.spawnProp(LEVEL_ID, 'Vase_4', 17, 35, { roomId: galleryId });
  editor.spawnProp(LEVEL_ID, 'Vase_4', 25, 39, { roomId: galleryId });

  // --- Siren Pit (bounds: 16, 46, 12, 12) ---
  //   Interior: x=[17..26], z=[47..56]
  // 2x CandleStick_Triple (walls)
  editor.spawnProp(LEVEL_ID, 'CandleStick_Triple', 17, 49, {
    roomId: sirenPitId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'CandleStick_Triple', 26, 53, {
    roomId: sirenPitId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 3x Chain_Coil (ceiling, over lava pit)
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 21, 50, { roomId: sirenPitId });
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 22, 52, { roomId: sirenPitId });
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 23, 50, { roomId: sirenPitId });
  // 1x Chandelier (ceiling center)
  editor.spawnProp(LEVEL_ID, 'Chandelier', 22, 51, { roomId: sirenPitId });

  // --- Tempest Hall (bounds: 15, 62, 14, 12) ---
  //   Interior: x=[16..27], z=[63..72]
  // 4x CandleStick_Triple (walls, corners)
  editor.spawnProp(LEVEL_ID, 'CandleStick_Triple', 16, 63, {
    roomId: tempestHallId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'CandleStick_Triple', 27, 63, {
    roomId: tempestHallId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'CandleStick_Triple', 16, 72, {
    roomId: tempestHallId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'CandleStick_Triple', 27, 72, {
    roomId: tempestHallId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 2x Banner_1 (N and S walls)
  editor.spawnProp(LEVEL_ID, 'Banner_1', 22, 63, {
    roomId: tempestHallId,
    surfaceAnchor: {
      face: 'north',
      offsetX: 0,
      offsetY: 2.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Banner_1', 22, 72, {
    roomId: tempestHallId,
    surfaceAnchor: {
      face: 'south',
      offsetX: 0,
      offsetY: 2.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 2x Barrel (on raised platforms, safe zone markers)
  editor.spawnProp(LEVEL_ID, 'Barrel', 16, 67, { roomId: tempestHallId });
  editor.spawnProp(LEVEL_ID, 'Barrel', 27, 67, { roomId: tempestHallId });

  // --- Boudoir (bounds: 3, 34, 6, 6) ---
  //   Interior: x=[4..7], z=[35..38]
  // 4x CandleStick_Triple (walls, corners)
  editor.spawnProp(LEVEL_ID, 'CandleStick_Triple', 4, 35, {
    roomId: boudoirId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'CandleStick_Triple', 7, 35, {
    roomId: boudoirId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'CandleStick_Triple', 4, 38, {
    roomId: boudoirId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'CandleStick_Triple', 7, 38, {
    roomId: boudoirId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 1x Chandelier (ceiling center)
  editor.spawnProp(LEVEL_ID, 'Chandelier', 5, 36, { roomId: boudoirId });
  // 1x Bed_Twin1
  editor.spawnProp(LEVEL_ID, 'Bed_Twin1', 4, 36, { roomId: boudoirId });
  // 1x Table_Large (holds Scroll_1)
  editor.spawnProp(LEVEL_ID, 'Table_Large', 6, 36, { roomId: boudoirId });
  // 1x Scroll_1 (on table)
  editor.spawnProp(LEVEL_ID, 'Scroll_1', 6, 36, { roomId: boudoirId });
  // 1x Chalice (floor pedestal)
  editor.spawnProp(LEVEL_ID, 'Chalice', 5, 38, { roomId: boudoirId });
  // 2x Vase_2 (flanking bed)
  editor.spawnProp(LEVEL_ID, 'Vase_2', 4, 35, { roomId: boudoirId });
  editor.spawnProp(LEVEL_ID, 'Vase_2', 4, 37, { roomId: boudoirId });

  // --- Caprone's Sanctum (bounds: 15, 78, 14, 14) ---
  //   Interior: x=[16..27], z=[79..90]
  // 4x CandleStick_Triple (corners)
  editor.spawnProp(LEVEL_ID, 'CandleStick_Triple', 16, 79, {
    roomId: sanctumId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'CandleStick_Triple', 27, 79, {
    roomId: sanctumId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'CandleStick_Triple', 16, 90, {
    roomId: sanctumId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'CandleStick_Triple', 27, 90, {
    roomId: sanctumId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 2x Chandelier (ceiling, flanking throne dais)
  editor.spawnProp(LEVEL_ID, 'Chandelier', 19, 83, { roomId: sanctumId });
  editor.spawnProp(LEVEL_ID, 'Chandelier', 25, 83, { roomId: sanctumId });
  // 2x Banner_1 (N wall, flanking entrance)
  editor.spawnProp(LEVEL_ID, 'Banner_1', 19, 79, {
    roomId: sanctumId,
    surfaceAnchor: {
      face: 'north',
      offsetX: 0,
      offsetY: 3.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Banner_1', 25, 79, {
    roomId: sanctumId,
    surfaceAnchor: {
      face: 'north',
      offsetX: 0,
      offsetY: 3.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 4x Onyx columns (corners of dais, structural)
  editor.spawnProp(LEVEL_ID, 'Column_Onyx', 19, 82, { roomId: sanctumId });
  editor.spawnProp(LEVEL_ID, 'Column_Onyx', 25, 82, { roomId: sanctumId });
  editor.spawnProp(LEVEL_ID, 'Column_Onyx', 19, 86, { roomId: sanctumId });
  editor.spawnProp(LEVEL_ID, 'Column_Onyx', 25, 86, { roomId: sanctumId });
  // 1x Throne (Chest_Wood reskinned)
  editor.spawnProp(LEVEL_ID, 'Chest_Wood', 22, 83, { roomId: sanctumId });

  // =========================================================================
  // 6. TRIGGERS (from "Triggers" table)
  // =========================================================================
  //
  // NOTE: T5-T8 (Tempest Hall arena) were already created by setupArenaWaves().

  // T1: ambientChange on Wind Corridor entry (wind active)
  //   Zone: (20, 12, 5, 4)
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 20,
    zoneZ: 12,
    zoneW: 5,
    zoneH: 4,
    roomId: windCorridorId,
    once: true,
    actionData: {
      windActive: true,
      windDir: 'E',
      text: 'The wind tugs at you...',
    },
  });

  // T2: spawnWave on Lover's Gallery entry
  //   Zone: (15, 32, 14, 2)
  editor.ambush(
    LEVEL_ID,
    { x: 15, z: 32, w: 14, h: 2 },
    [
      { type: ENEMY_TYPES.FIRE_GOAT, x: 18, z: 33 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 22, z: 36 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 27, z: 40 },
      { type: ENEMY_TYPES.HELLGOAT, x: 17, z: 37 },
      { type: ENEMY_TYPES.HELLGOAT, x: 26, z: 37 },
    ],
    { roomId: galleryId },
  );

  // T3: spawnWave on Siren Pit entry
  //   Zone: (16, 46, 12, 2)
  editor.ambush(
    LEVEL_ID,
    { x: 16, z: 46, w: 12, h: 2 },
    [
      { type: ENEMY_TYPES.FIRE_GOAT, x: 26, z: 49 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 18, z: 54 },
      { type: ENEMY_TYPES.HELLGOAT, x: 22, z: 56 },
    ],
    { roomId: sirenPitId },
  );

  // T4: ambientChange on Siren Pit entry (inward wind)
  //   Zone: (16, 46, 12, 2)
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 16,
    zoneZ: 46,
    zoneW: 12,
    zoneH: 2,
    roomId: sirenPitId,
    once: true,
    actionData: { windDir: 'inward', windIntensity: 0.6 },
  });

  // T9: ambientChange on Tempest Hall wave 2 clear (wind dies)
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 15,
    zoneZ: 62,
    zoneW: 14,
    zoneH: 12,
    roomId: tempestHallId,
    once: true,
    actionData: {
      windActive: false,
      condition: 'allEnemiesKilled',
      text: 'The wind dies...',
    },
  });

  // T10: bossIntro -- player enters Caprone's Sanctum
  //   Zone: (17, 79, 10, 2)
  editor.bossIntro(
    LEVEL_ID,
    { x: 17, z: 79, w: 10, h: 2 },
    'Come closer, little goat. Everyone comes closer eventually.',
    { roomId: sanctumId },
  );

  // T11: lockDoors on boss intro (with 3s delay)
  //   Zone: (17, 79, 10, 2)
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.LOCK_DOORS,
    zoneX: 17,
    zoneZ: 79,
    zoneW: 10,
    zoneH: 2,
    roomId: sanctumId,
    once: true,
    delay: 3,
  });

  // T12: ambientChange when boss HP < 50% (wind rotating)
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 15,
    zoneZ: 78,
    zoneW: 14,
    zoneH: 14,
    roomId: sanctumId,
    once: true,
    actionData: {
      windMode: 'rotating',
      windPeriod: 10,
      condition: 'bossHpBelow50',
    },
  });

  // T13: ambientChange when boss HP < 25% (lava rise, fog, wind speed)
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 15,
    zoneZ: 78,
    zoneW: 14,
    zoneH: 14,
    roomId: sanctumId,
    once: true,
    actionData: {
      lavaRise: true,
      fogDensity: 0.06,
      windPeriod: 6,
      condition: 'bossHpBelow25',
    },
  });

  // =========================================================================
  // 7. ENVIRONMENT ZONES (from "Environment Zones" table)
  // =========================================================================

  // Wind Corridor crosswind: W->E, pulsing 3s on / 2s off
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.WIND,
    boundsX: 20,
    boundsZ: 12,
    boundsW: 5,
    boundsH: 16,
    intensity: 0.5,
    directionX: 1.0,
    directionZ: 0,
    timerOn: 3.0,
    timerOff: 2.0,
  });

  // Lover's Gallery wind: W->E, constant steady push
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.WIND,
    boundsX: 15,
    boundsZ: 32,
    boundsW: 14,
    boundsH: 10,
    intensity: 0.35,
    directionX: 1.0,
    directionZ: 0,
  });

  // Siren Pit inward pull: constant toward center + down
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.WIND,
    boundsX: 16,
    boundsZ: 46,
    boundsW: 12,
    boundsH: 12,
    intensity: 0.6,
    directionX: 0,
    directionZ: 0, // "inward" handled by runtime; directionX/Z set to 0 as placeholder
  });

  // Tempest Hall shifting wind: W->E / E->W, period 8s
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.WIND,
    boundsX: 15,
    boundsZ: 62,
    boundsW: 14,
    boundsH: 12,
    intensity: 0.4,
    directionX: 1.0,
    directionZ: 0,
    timerOn: 8.0,
    timerOff: 8.0,
  });

  // Boss chamber siren pull (phase 1): toward boss (N)
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.WIND,
    boundsX: 15,
    boundsZ: 78,
    boundsW: 14,
    boundsH: 14,
    intensity: 0.5,
    directionX: 0,
    directionZ: -1.0, // North = negative Z
  });

  // Lava channel E (Gallery): 1 cell wide lava strip
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.FIRE,
    boundsX: 28,
    boundsZ: 32,
    boundsW: 1,
    boundsH: 10,
    intensity: 1.0,
  });

  // Lava channels (Wind Corridor): 1 cell wide each side
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.FIRE,
    boundsX: 20,
    boundsZ: 12,
    boundsW: 1,
    boundsH: 16,
    intensity: 1.0,
  });
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.FIRE,
    boundsX: 24,
    boundsZ: 12,
    boundsW: 1,
    boundsH: 16,
    intensity: 1.0,
  });

  // Siren Pit lava core: 4x4 center
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.FIRE,
    boundsX: 20,
    boundsZ: 50,
    boundsW: 4,
    boundsH: 4,
    intensity: 1.0,
  });

  // Lava channels (Tempest Hall): 3 channels N-S
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.FIRE,
    boundsX: 19,
    boundsZ: 62,
    boundsW: 1,
    boundsH: 12,
    intensity: 1.0,
  });
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.FIRE,
    boundsX: 22,
    boundsZ: 62,
    boundsW: 1,
    boundsH: 12,
    intensity: 1.0,
  });
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.FIRE,
    boundsX: 25,
    boundsZ: 62,
    boundsW: 1,
    boundsH: 12,
    intensity: 1.0,
  });

  // Lava channels (Boss): 3 E-W channels in southern half
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.FIRE,
    boundsX: 17,
    boundsZ: 86,
    boundsW: 3,
    boundsH: 1,
    intensity: 1.0,
  });
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.FIRE,
    boundsX: 21,
    boundsZ: 86,
    boundsW: 3,
    boundsH: 1,
    intensity: 1.0,
  });
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.FIRE,
    boundsX: 25,
    boundsZ: 86,
    boundsW: 3,
    boundsH: 1,
    intensity: 1.0,
  });

  // =========================================================================
  // 8. PLAYER SPAWN (from "Player Spawn" section)
  // =========================================================================
  //   Position: (22, 4) -- center of Antechamber
  //   Facing: pi (south -- toward Wind Corridor)

  editor.setPlayerSpawn(LEVEL_ID, 22, 4, Math.PI);

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
    throw new Error('Circle 2 (Lust) level validation failed');
  }
  console.log('Circle 2 (Lust) built successfully');
  if (result.warnings.length > 0) {
    console.log('Warnings:', result.warnings);
  }
}
