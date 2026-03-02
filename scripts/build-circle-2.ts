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
  // Structural: 2x ornate arches (N entrance, S exit)
  editor.spawnProp(LEVEL_ID, 'lust-ornate-arch', 22, 2, {
    roomId: antechamberId,
    surfaceAnchor: {
      face: 'south',
      offsetX: 0,
      offsetY: 0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'lust-ornate-arch', 22, 7, {
    roomId: antechamberId,
    surfaceAnchor: {
      face: 'south',
      offsetX: 0,
      offsetY: 0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 4x lust-candelabra (wall, corners)
  editor.spawnProp(LEVEL_ID, 'lust-candelabra', 18, 3, {
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
  editor.spawnProp(LEVEL_ID, 'lust-candelabra', 25, 3, {
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
  editor.spawnProp(LEVEL_ID, 'lust-candelabra', 18, 7, {
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
  editor.spawnProp(LEVEL_ID, 'lust-candelabra', 25, 7, {
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
  // 2x lust-marble-vase floor pedestals
  editor.spawnProp(LEVEL_ID, 'lust-marble-vase', 20, 4, { roomId: antechamberId });
  editor.spawnProp(LEVEL_ID, 'lust-marble-vase', 23, 4, { roomId: antechamberId });
  // 1x lust-velvet-drape above north entrance
  editor.spawnProp(LEVEL_ID, 'lust-velvet-drape', 22, 2, {
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
  // 1x lust-coffered-ceiling-tile ceiling
  editor.spawnProp(LEVEL_ID, 'lust-coffered-ceiling-tile', 22, 4, { roomId: antechamberId });
  // 1x lust-rose-thorn-cluster near south exit
  editor.spawnProp(LEVEL_ID, 'lust-rose-thorn-cluster', 18, 6, { roomId: antechamberId });
  // 1x lust-perfume-censer near north wall
  editor.spawnProp(LEVEL_ID, 'lust-perfume-censer', 21, 3, { roomId: antechamberId });
  // 1x lust-floor-carpet center floor
  editor.spawnProp(LEVEL_ID, 'lust-floor-carpet', 20, 4, { roomId: antechamberId });

  // --- Wind Corridor (bounds: 20, 12, 5, 16) ---
  //   Interior: x=[21..23], z=[13..26]
  // Structural: 2x ornate arches (N entrance, S exit)
  editor.spawnProp(LEVEL_ID, 'lust-ornate-arch', 22, 12, {
    roomId: windCorridorId,
    surfaceAnchor: {
      face: 'south',
      offsetX: 0,
      offsetY: 0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.9,
    },
  });
  editor.spawnProp(LEVEL_ID, 'lust-ornate-arch', 22, 27, {
    roomId: windCorridorId,
    surfaceAnchor: {
      face: 'south',
      offsetX: 0,
      offsetY: 0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.9,
    },
  });
  // 4x lust-wind-banner (W wall, show wind direction)
  editor.spawnProp(LEVEL_ID, 'lust-wind-banner', 20, 14, {
    roomId: windCorridorId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.8,
    },
  });
  editor.spawnProp(LEVEL_ID, 'lust-wind-banner', 20, 18, {
    roomId: windCorridorId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.8,
    },
  });
  editor.spawnProp(LEVEL_ID, 'lust-wind-banner', 20, 22, {
    roomId: windCorridorId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.8,
    },
  });
  editor.spawnProp(LEVEL_ID, 'lust-wind-banner', 20, 26, {
    roomId: windCorridorId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.8,
    },
  });
  // 2x lust-candelabra (E wall)
  editor.spawnProp(LEVEL_ID, 'lust-candelabra', 24, 16, {
    roomId: windCorridorId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.9,
    },
  });
  editor.spawnProp(LEVEL_ID, 'lust-candelabra', 24, 24, {
    roomId: windCorridorId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.9,
    },
  });
  // lust-lava-rock-border channel edges
  editor.spawnProp(LEVEL_ID, 'lust-lava-rock-border', 20, 16, { roomId: windCorridorId });
  editor.spawnProp(LEVEL_ID, 'lust-lava-rock-border', 24, 16, { roomId: windCorridorId });
  // 1x lust-ember-brazier walkway north end
  editor.spawnProp(LEVEL_ID, 'lust-ember-brazier', 22, 12, { roomId: windCorridorId });

  // --- Lover's Gallery (bounds: 15, 32, 14, 10) ---
  //   Interior: x=[16..27], z=[33..40]
  // Structural: 8x lust-onyx-column (2 rows of 4)
  editor.spawnProp(LEVEL_ID, 'lust-onyx-column', 17, 33, { roomId: galleryId });
  editor.spawnProp(LEVEL_ID, 'lust-onyx-column', 20, 33, { roomId: galleryId });
  editor.spawnProp(LEVEL_ID, 'lust-onyx-column', 23, 33, { roomId: galleryId });
  editor.spawnProp(LEVEL_ID, 'lust-onyx-column', 26, 33, { roomId: galleryId });
  editor.spawnProp(LEVEL_ID, 'lust-onyx-column', 17, 38, { roomId: galleryId });
  editor.spawnProp(LEVEL_ID, 'lust-onyx-column', 20, 38, { roomId: galleryId });
  editor.spawnProp(LEVEL_ID, 'lust-onyx-column', 23, 38, { roomId: galleryId });
  editor.spawnProp(LEVEL_ID, 'lust-onyx-column', 26, 38, { roomId: galleryId });
  // Structural: 2x ornate arches (N entrance, S exit)
  editor.spawnProp(LEVEL_ID, 'lust-ornate-arch', 22, 32, {
    roomId: galleryId,
    surfaceAnchor: {
      face: 'south',
      offsetX: 0,
      offsetY: 0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'lust-ornate-arch', 22, 41, {
    roomId: galleryId,
    surfaceAnchor: {
      face: 'south',
      offsetX: 0,
      offsetY: 0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 4x lust-candelabra (corners)
  editor.spawnProp(LEVEL_ID, 'lust-candelabra', 15, 32, {
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
  editor.spawnProp(LEVEL_ID, 'lust-candelabra', 28, 32, {
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
  editor.spawnProp(LEVEL_ID, 'lust-candelabra', 15, 41, {
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
  editor.spawnProp(LEVEL_ID, 'lust-candelabra', 28, 41, {
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
  // 4x lust-velvet-drape (walls between columns)
  editor.spawnProp(LEVEL_ID, 'lust-velvet-drape', 16, 34, { roomId: galleryId });
  editor.spawnProp(LEVEL_ID, 'lust-velvet-drape', 27, 34, { roomId: galleryId });
  editor.spawnProp(LEVEL_ID, 'lust-velvet-drape', 16, 39, { roomId: galleryId });
  editor.spawnProp(LEVEL_ID, 'lust-velvet-drape', 27, 39, { roomId: galleryId });
  // 2x lust-fallen-chair
  editor.spawnProp(LEVEL_ID, 'lust-fallen-chair', 18, 36, { roomId: galleryId });
  editor.spawnProp(LEVEL_ID, 'lust-fallen-chair', 25, 37, { roomId: galleryId });
  // 2x lust-golden-chalice near chairs
  editor.spawnProp(LEVEL_ID, 'lust-golden-chalice', 19, 36, { roomId: galleryId });
  editor.spawnProp(LEVEL_ID, 'lust-golden-chalice', 24, 38, { roomId: galleryId });
  // 2x lust-marble-vase floor pedestals
  editor.spawnProp(LEVEL_ID, 'lust-marble-vase', 17, 35, { roomId: galleryId });
  editor.spawnProp(LEVEL_ID, 'lust-marble-vase', 25, 39, { roomId: galleryId });
  // 1x lust-cracked-statue west wall alcove
  editor.spawnProp(LEVEL_ID, 'lust-cracked-statue', 15, 36, { roomId: galleryId });
  // 1x lust-lava-rock-border east wall
  editor.spawnProp(LEVEL_ID, 'lust-lava-rock-border', 28, 36, { roomId: galleryId });
  // 1x lust-rose-thorn-cluster near secret wall
  editor.spawnProp(LEVEL_ID, 'lust-rose-thorn-cluster', 16, 40, { roomId: galleryId });
  // 2x lust-shattered-goblet near chairs
  editor.spawnProp(LEVEL_ID, 'lust-shattered-goblet', 19, 37, { roomId: galleryId });
  editor.spawnProp(LEVEL_ID, 'lust-shattered-goblet', 24, 36, { roomId: galleryId });

  // --- Siren Pit (bounds: 16, 46, 12, 12) ---
  //   Interior: x=[17..26], z=[47..56]
  // Structural: ornate arch at N entry
  editor.spawnProp(LEVEL_ID, 'lust-ornate-arch', 22, 46, {
    roomId: sirenPitId,
    surfaceAnchor: {
      face: 'south',
      offsetX: 0,
      offsetY: 0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // lust-bridge-railing on ramp outer edges
  editor.spawnProp(LEVEL_ID, 'lust-bridge-railing', 24, 48, { roomId: sirenPitId });
  editor.spawnProp(LEVEL_ID, 'lust-bridge-railing', 24, 50, { roomId: sirenPitId });
  // 2x lust-candelabra high on walls
  editor.spawnProp(LEVEL_ID, 'lust-candelabra', 16, 47, {
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
  editor.spawnProp(LEVEL_ID, 'lust-candelabra', 27, 47, {
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
  // 1x lust-chandelier ceiling center over lava
  editor.spawnProp(LEVEL_ID, 'lust-chandelier', 22, 52, { roomId: sirenPitId });
  // lust-lava-rock-border around lava core
  editor.spawnProp(LEVEL_ID, 'lust-lava-rock-border', 20, 50, { roomId: sirenPitId });
  editor.spawnProp(LEVEL_ID, 'lust-lava-rock-border', 23, 53, { roomId: sirenPitId });
  // 3x limbo-chain-cluster over lava (reused from C1)
  editor.spawnProp(LEVEL_ID, 'limbo-chain-cluster', 21, 51, { roomId: sirenPitId });
  editor.spawnProp(LEVEL_ID, 'limbo-chain-cluster', 23, 51, { roomId: sirenPitId });
  editor.spawnProp(LEVEL_ID, 'limbo-chain-cluster', 22, 53, { roomId: sirenPitId });
  // 3x lust-ember-brazier at ramp segments
  editor.spawnProp(LEVEL_ID, 'lust-ember-brazier', 17, 48, { roomId: sirenPitId });
  editor.spawnProp(LEVEL_ID, 'lust-ember-brazier', 22, 54, { roomId: sirenPitId });
  editor.spawnProp(LEVEL_ID, 'lust-ember-brazier', 19, 56, { roomId: sirenPitId });
  // 1x lust-cracked-statue east wall niche
  editor.spawnProp(LEVEL_ID, 'lust-cracked-statue', 26, 50, { roomId: sirenPitId });

  // --- Tempest Hall (bounds: 15, 62, 14, 12) ---
  //   Interior: x=[16..27], z=[63..72]
  // Structural: 2x ornate arches (N entrance, S grand doorway)
  editor.spawnProp(LEVEL_ID, 'lust-ornate-arch', 22, 62, {
    roomId: tempestHallId,
    surfaceAnchor: {
      face: 'south',
      offsetX: 0,
      offsetY: 0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'lust-ornate-arch', 22, 73, {
    roomId: tempestHallId,
    surfaceAnchor: {
      face: 'south',
      offsetX: 0,
      offsetY: 0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.2,
    },
  });
  // 4x lust-candelabra (corners)
  editor.spawnProp(LEVEL_ID, 'lust-candelabra', 15, 62, {
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
  editor.spawnProp(LEVEL_ID, 'lust-candelabra', 28, 62, {
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
  editor.spawnProp(LEVEL_ID, 'lust-candelabra', 15, 73, {
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
  editor.spawnProp(LEVEL_ID, 'lust-candelabra', 28, 73, {
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
  // 2x lust-wind-banner (N/S walls)
  editor.spawnProp(LEVEL_ID, 'lust-wind-banner', 16, 66, {
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
  editor.spawnProp(LEVEL_ID, 'lust-wind-banner', 27, 66, {
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
  // lust-lava-rock-border channel edges
  editor.spawnProp(LEVEL_ID, 'lust-lava-rock-border', 19, 66, { roomId: tempestHallId });
  editor.spawnProp(LEVEL_ID, 'lust-lava-rock-border', 22, 66, { roomId: tempestHallId });
  editor.spawnProp(LEVEL_ID, 'lust-lava-rock-border', 25, 66, { roomId: tempestHallId });
  // lust-bridge-railing at bridge crossings
  editor.spawnProp(LEVEL_ID, 'lust-bridge-railing', 20, 65, { roomId: tempestHallId });
  editor.spawnProp(LEVEL_ID, 'lust-bridge-railing', 23, 70, { roomId: tempestHallId });
  // 2x lust-ember-brazier on raised platforms
  editor.spawnProp(LEVEL_ID, 'lust-ember-brazier', 15, 66, { roomId: tempestHallId });
  editor.spawnProp(LEVEL_ID, 'lust-ember-brazier', 28, 66, { roomId: tempestHallId });
  // 1x ornate-mirror west platform alcove
  editor.spawnProp(LEVEL_ID, 'ornate-mirror', 16, 63, { roomId: tempestHallId });
  // 4x lust-gilded-pillar at bridge entrances
  editor.spawnProp(LEVEL_ID, 'lust-gilded-pillar', 19, 63, { roomId: tempestHallId });
  editor.spawnProp(LEVEL_ID, 'lust-gilded-pillar', 22, 63, { roomId: tempestHallId });
  editor.spawnProp(LEVEL_ID, 'lust-gilded-pillar', 19, 72, { roomId: tempestHallId });
  editor.spawnProp(LEVEL_ID, 'lust-gilded-pillar', 22, 72, { roomId: tempestHallId });
  // 2x lust-cracked-statue on raised platforms
  editor.spawnProp(LEVEL_ID, 'lust-cracked-statue', 15, 67, { roomId: tempestHallId });
  editor.spawnProp(LEVEL_ID, 'lust-cracked-statue', 28, 69, { roomId: tempestHallId });

  // --- Boudoir (bounds: 3, 34, 6, 6) ---
  //   Interior: x=[4..7], z=[35..38]
  // Structural: ornate arch at east entry
  editor.spawnProp(LEVEL_ID, 'lust-ornate-arch', 8, 36, {
    roomId: boudoirId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.8,
    },
  });
  // 4x lust-candelabra (corners)
  editor.spawnProp(LEVEL_ID, 'lust-candelabra', 3, 34, {
    roomId: boudoirId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.8,
    },
  });
  editor.spawnProp(LEVEL_ID, 'lust-candelabra', 8, 34, {
    roomId: boudoirId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.8,
    },
  });
  editor.spawnProp(LEVEL_ID, 'lust-candelabra', 3, 39, {
    roomId: boudoirId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.8,
    },
  });
  editor.spawnProp(LEVEL_ID, 'lust-candelabra', 8, 39, {
    roomId: boudoirId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.8,
    },
  });
  // 1x lust-chandelier ceiling center
  editor.spawnProp(LEVEL_ID, 'lust-chandelier', 5, 36, { roomId: boudoirId });
  // 1x lust-ornate-bed-wrecked
  editor.spawnProp(LEVEL_ID, 'lust-ornate-bed-wrecked', 4, 36, { roomId: boudoirId });
  // 1x lust-golden-chalice pedestal
  editor.spawnProp(LEVEL_ID, 'lust-golden-chalice', 5, 38, { roomId: boudoirId });
  // 2x lust-marble-vase flanking bed
  editor.spawnProp(LEVEL_ID, 'lust-marble-vase', 3, 36, { roomId: boudoirId });
  editor.spawnProp(LEVEL_ID, 'lust-marble-vase', 7, 36, { roomId: boudoirId });
  // 1x silk-curtain near north wall
  editor.spawnProp(LEVEL_ID, 'silk-curtain', 4, 34, { roomId: boudoirId });
  // 1x lust-velvet-drape framing entry inside
  editor.spawnProp(LEVEL_ID, 'lust-velvet-drape', 8, 37, { roomId: boudoirId });
  // 1x ornate-mirror north wall
  editor.spawnProp(LEVEL_ID, 'ornate-mirror', 6, 34, { roomId: boudoirId });

  // --- Caprone's Sanctum (bounds: 15, 78, 14, 14) ---
  //   Interior: x=[16..27], z=[79..90]
  // Structural: ornate arch grand entrance
  editor.spawnProp(LEVEL_ID, 'lust-ornate-arch', 22, 78, {
    roomId: sanctumId,
    surfaceAnchor: {
      face: 'south',
      offsetX: 0,
      offsetY: 0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.3,
    },
  });
  // Structural: 4x lust-onyx-column dais corners
  editor.spawnProp(LEVEL_ID, 'lust-onyx-column', 18, 82, { roomId: sanctumId });
  editor.spawnProp(LEVEL_ID, 'lust-onyx-column', 26, 82, { roomId: sanctumId });
  editor.spawnProp(LEVEL_ID, 'lust-onyx-column', 18, 86, { roomId: sanctumId });
  editor.spawnProp(LEVEL_ID, 'lust-onyx-column', 26, 86, { roomId: sanctumId });
  // 1x lust-marble-throne center of dais
  editor.spawnProp(LEVEL_ID, 'lust-marble-throne', 22, 83, { roomId: sanctumId });
  // 4x lust-candelabra (corners)
  editor.spawnProp(LEVEL_ID, 'lust-candelabra', 15, 78, {
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
  editor.spawnProp(LEVEL_ID, 'lust-candelabra', 28, 78, {
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
  editor.spawnProp(LEVEL_ID, 'lust-candelabra', 15, 91, {
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
  editor.spawnProp(LEVEL_ID, 'lust-candelabra', 28, 91, {
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
  // 2x lust-chandelier ceiling flanking dais
  editor.spawnProp(LEVEL_ID, 'lust-chandelier', 20, 82, { roomId: sanctumId });
  editor.spawnProp(LEVEL_ID, 'lust-chandelier', 24, 82, { roomId: sanctumId });
  // 2x lust-velvet-drape flanking entrance
  editor.spawnProp(LEVEL_ID, 'lust-velvet-drape', 16, 78, { roomId: sanctumId });
  editor.spawnProp(LEVEL_ID, 'lust-velvet-drape', 27, 78, { roomId: sanctumId });
  // lust-lava-rock-border channel edges
  editor.spawnProp(LEVEL_ID, 'lust-lava-rock-border', 17, 86, { roomId: sanctumId });
  editor.spawnProp(LEVEL_ID, 'lust-lava-rock-border', 21, 86, { roomId: sanctumId });
  editor.spawnProp(LEVEL_ID, 'lust-lava-rock-border', 25, 86, { roomId: sanctumId });
  // 1x lust-bridge-railing center channel bridge
  editor.spawnProp(LEVEL_ID, 'lust-bridge-railing', 22, 86, { roomId: sanctumId });
  // 2x lust-cracked-statue entrance alcoves
  editor.spawnProp(LEVEL_ID, 'lust-cracked-statue', 16, 80, { roomId: sanctumId });
  editor.spawnProp(LEVEL_ID, 'lust-cracked-statue', 27, 80, { roomId: sanctumId });
  // 2x lust-rose-thorn-cluster south corners
  editor.spawnProp(LEVEL_ID, 'lust-rose-thorn-cluster', 17, 90, { roomId: sanctumId });
  editor.spawnProp(LEVEL_ID, 'lust-rose-thorn-cluster', 26, 90, { roomId: sanctumId });
  // 2x lust-perfume-censer near entrance
  editor.spawnProp(LEVEL_ID, 'lust-perfume-censer', 19, 79, { roomId: sanctumId });
  editor.spawnProp(LEVEL_ID, 'lust-perfume-censer', 25, 79, { roomId: sanctumId });
  // 1x lust-floor-carpet dais surface
  editor.spawnProp(LEVEL_ID, 'lust-floor-carpet', 19, 82, { roomId: sanctumId });
  // 2x lust-ember-brazier flanking throne
  editor.spawnProp(LEVEL_ID, 'lust-ember-brazier', 19, 83, { roomId: sanctumId });
  editor.spawnProp(LEVEL_ID, 'lust-ember-brazier', 25, 83, { roomId: sanctumId });

  // =========================================================================
  // 5d. DECALS (heat damage stains near lava, wind erosion cracks)
  // =========================================================================

  // --- Antechamber (bounds: 18, 2, 8, 6) ---
  // Minimal — entry room, just light cracks
  editor.placeDecals(LEVEL_ID, antechamberId, [
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 20, z: 6, opacity: 0.4 },
  ]);

  // --- Wind Corridor (bounds: 20, 12, 5, 16) ---
  // Water stains near lava channels, concrete cracks from wind erosion
  editor.placeDecals(LEVEL_ID, windCorridorId, [
    { type: DECAL_TYPES.WATER_STAIN, x: 20, z: 15, surface: 'wall', opacity: 0.5 },
    { type: DECAL_TYPES.WATER_STAIN, x: 24, z: 20, surface: 'wall', opacity: 0.4 },
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 22, z: 18, opacity: 0.5 },
  ]);

  // --- Lover's Gallery (bounds: 15, 32, 14, 10) ---
  // Water stains near east lava channel
  editor.placeDecals(LEVEL_ID, galleryId, [
    { type: DECAL_TYPES.WATER_STAIN, x: 28, z: 35, surface: 'wall', opacity: 0.5 },
    { type: DECAL_TYPES.WATER_STAIN, x: 28, z: 39, surface: 'wall', opacity: 0.4 },
  ]);

  // --- Siren Pit (bounds: 16, 46, 12, 12) ---
  // Concrete cracks from wind, water stains near lava core
  editor.placeDecals(LEVEL_ID, sirenPitId, [
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 18, z: 48, opacity: 0.5 },
    { type: DECAL_TYPES.WATER_STAIN, x: 22, z: 54, opacity: 0.4 },
  ]);

  // --- Tempest Hall (bounds: 15, 62, 14, 12) ---
  // Wind erosion cracks on walls and floor
  editor.placeDecals(LEVEL_ID, tempestHallId, [
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 15, z: 65, surface: 'wall', opacity: 0.5 },
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 28, z: 70, surface: 'wall', opacity: 0.5 },
  ]);

  // --- Caprone's Sanctum (bounds: 15, 78, 14, 14) ---
  // Water stains near lava channels, cracks near throne
  editor.placeDecals(LEVEL_ID, sanctumId, [
    { type: DECAL_TYPES.WATER_STAIN, x: 17, z: 86, opacity: 0.5 },
    { type: DECAL_TYPES.WATER_STAIN, x: 25, z: 86, opacity: 0.4 },
  ]);

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
