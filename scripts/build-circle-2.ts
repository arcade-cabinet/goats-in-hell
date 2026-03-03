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
    texturePalette: { exploration: 'marble', arena: 'marble', boss: 'tiles', secret: 'marble' },
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
    floorTexture: 'marble',
    wallTexture: 'tiles',
  });

  // No GAUNTLET type in ROOM_TYPES, use CORRIDOR as closest match
  const windCorridorId = editor.room(LEVEL_ID, 'wind_corridor', 20, 12, 5, 16, {
    roomType: ROOM_TYPES.CORRIDOR,
    elevation: 0,
    sortOrder: 1,
    floorTexture: 'tiles',
    wallTexture: 'marble',
    fillRule: { type: 'scatter', props: ['lust-wind-banner', 'lust-bridge-railing'], density: 0.1 },
  });

  const galleryId = editor.room(LEVEL_ID, 'lovers_gallery', 15, 32, 14, 10, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 2,
    floorTexture: 'marble',
    wallTexture: 'marble',
    fillRule: {
      type: 'scatter',
      props: ['lust-marble-vase', 'lust-rose-thorn-cluster', 'silk-curtain'],
      density: 0.08,
    },
  });

  const boudoirId = editor.room(LEVEL_ID, 'boudoir', 3, 34, 6, 6, {
    roomType: ROOM_TYPES.SECRET,
    elevation: 0,
    sortOrder: 3,
    floorTexture: 'marble',
    fillRule: { type: 'scatter', props: ['silk-curtain', 'lust-golden-chalice'], density: 0.12 },
  });

  const sirenPitId = editor.room(LEVEL_ID, 'siren_pit', 16, 46, 12, 12, {
    roomType: ROOM_TYPES.PLATFORMING,
    elevation: 0,
    sortOrder: 4,
    floorTexture: 'marble',
    fillRule: {
      type: 'scatter',
      props: ['lust-ornate-bed-wrecked', 'lust-velvet-drape', 'ornate-mirror'],
      density: 0.1,
    },
  });

  const tempestHallId = editor.room(LEVEL_ID, 'tempest_hall', 15, 62, 14, 12, {
    roomType: ROOM_TYPES.ARENA,
    elevation: -1,
    sortOrder: 5,
    floorTexture: 'tiles',
    wallTexture: 'marble',
  });

  const sanctumId = editor.room(LEVEL_ID, 'caprone_sanctum', 15, 78, 14, 14, {
    roomType: ROOM_TYPES.BOSS,
    elevation: -1,
    sortOrder: 6,
    floorTexture: 'tiles',
    wallTexture: 'marble',
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
  // EXPANSION — Additional rooms, enemies, and encounters to reach 7-11 min
  // =========================================================================
  // New rooms placed entirely in the open eastern corridor (x >= 30) and the
  // western alcove (x = 0..11) that is clear of existing rooms.
  //
  // Existing room extents (for reference):
  //   antechamber    : x[18..25], z[ 2.. 7]
  //   wind_corridor  : x[20..24], z[12..27]
  //   lovers_gallery : x[15..28], z[32..41]
  //   boudoir        : x[ 3.. 8], z[34..39]
  //   siren_pit      : x[16..27], z[46..57]
  //   tempest_hall   : x[15..28], z[62..73]
  //   caprone_sanctum: x[15..28], z[78..91]
  //
  // New room placement (all on east side x>=30, or west pocket x=0..11):
  //   crimson_baths     : x[30..41], z[ 2..15]  (w=12, h=14)
  //   mirror_hall       : x[30..41], z[20..31]  (w=12, h=12)
  //   torment_gallery   : x[30..41], z[36..45]  (w=12, h=10)
  //   obsession_vault   : x[ 0..11], z[46..57]  (w=12, h=12)
  //   desire_corridor   : x[30..41], z[50..59]  (w=12, h=10)
  // =========================================================================

  // ── NEW ROOM 1: Crimson Baths ─────────────────────────────────────────────
  // Marble bathing hall east of antechamber. Exploration room, fireGoat ambush.
  // Bounds: x=30, z=2, w=12, h=14 → interior x[31..40], z[3..14]
  const crimsonBathsId = editor.room(LEVEL_ID, 'crimson_baths', 30, 2, 12, 14, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 7,
    floorTexture: 'marble',
    wallTexture: 'tiles',
    fillRule: {
      type: 'scatter',
      props: ['lust-marble-vase', 'lust-rose-thorn-cluster', 'lust-velvet-drape'],
      density: 0.18,
    },
  });

  // ── NEW ROOM 2: Mirror Hall ───────────────────────────────────────────────
  // Hall of mirrors feeding confusion. Exploration/ambush, east of wind_corridor.
  // Bounds: x=30, z=20, w=12, h=12 → interior x[31..40], z[21..30]
  const mirrorHallId = editor.room(LEVEL_ID, 'mirror_hall', 30, 20, 12, 12, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 8,
    floorTexture: 'marble',
    wallTexture: 'marble',
    fillRule: {
      type: 'scatter',
      props: ['ornate-mirror', 'lust-cracked-statue', 'silk-curtain'],
      density: 0.2,
    },
  });

  // ── NEW ROOM 3: Torment Gallery ───────────────────────────────────────────
  // Arena east of lovers_gallery. Wave lock with mixed enemies.
  // Bounds: x=30, z=36, w=12, h=10 → interior x[31..40], z[37..44]
  const tormentGalleryId = editor.room(LEVEL_ID, 'torment_gallery', 30, 36, 12, 10, {
    roomType: ROOM_TYPES.ARENA,
    elevation: 0,
    sortOrder: 9,
    floorTexture: 'tiles',
    wallTexture: 'marble',
    fillRule: {
      type: 'scatter',
      props: ['lust-gilded-pillar', 'lust-ember-brazier'],
      density: 0.1,
    },
  });

  // ── NEW ROOM 4: Obsession Vault ───────────────────────────────────────────
  // Secret-ish western pocket. Exploration branching off siren_pit.
  // Bounds: x=0, z=46, w=12, h=12 → interior x[1..10], z[47..56]
  const obsessionVaultId = editor.room(LEVEL_ID, 'obsession_vault', 0, 46, 12, 12, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 10,
    floorTexture: 'marble',
    wallTexture: 'tiles',
    fillRule: {
      type: 'scatter',
      props: ['lust-ornate-bed-wrecked', 'lust-golden-chalice', 'lust-chandelier'],
      density: 0.22,
    },
  });

  // ── NEW ROOM 5: Desire Corridor ───────────────────────────────────────────
  // Long east-side corridor connecting mirror_hall chain to tempest_hall side.
  // Bounds: x=30, z=50, w=12, h=10 → interior x[31..40], z[51..58]
  const desireCorridorId = editor.room(LEVEL_ID, 'desire_corridor', 30, 50, 12, 10, {
    roomType: ROOM_TYPES.CORRIDOR,
    elevation: 0,
    sortOrder: 11,
    floorTexture: 'marble',
    wallTexture: 'marble',
    fillRule: {
      type: 'scatter',
      props: ['lust-wind-banner', 'lust-bridge-railing', 'lust-lava-rock-border'],
      density: 0.12,
    },
  });

  // ── CONNECTIONS: new rooms to existing layout ─────────────────────────────
  // antechamber -> crimson_baths (east branch from entry)
  editor.corridor(LEVEL_ID, antechamberId, crimsonBathsId, 3);
  // crimson_baths -> mirror_hall (south through east side)
  editor.corridor(LEVEL_ID, crimsonBathsId, mirrorHallId, 3);
  // mirror_hall -> torment_gallery (south, east side)
  editor.corridor(LEVEL_ID, mirrorHallId, tormentGalleryId, 3);
  // torment_gallery -> desire_corridor (south, east side)
  editor.corridor(LEVEL_ID, tormentGalleryId, desireCorridorId, 3);
  // desire_corridor -> tempest_hall (west reconnect to main path)
  editor.corridor(LEVEL_ID, desireCorridorId, tempestHallId, 3);
  // siren_pit -> obsession_vault (west branch)
  editor.corridor(LEVEL_ID, sirenPitId, obsessionVaultId, 3);

  // ── ENEMIES: Crimson Baths (x[30..41], z[2..14]) ─────────────────────────
  // 4 hellgoat patrolling the bath columns
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 32, 5, {
    roomId: crimsonBathsId,
    patrol: [
      { x: 32, z: 5 },
      { x: 32, z: 12 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 39, 5, {
    roomId: crimsonBathsId,
    patrol: [
      { x: 39, z: 5 },
      { x: 39, z: 12 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 35, 9, {
    roomId: crimsonBathsId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 37, 13, {
    roomId: crimsonBathsId,
  });
  // 3 fireGoat ranged -- perch on bath ledges
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 31, 3, {
    roomId: crimsonBathsId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 40, 8, {
    roomId: crimsonBathsId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 36, 13, {
    roomId: crimsonBathsId,
  });

  // ── ENEMIES: Mirror Hall (x[30..41], z[20..31]) ───────────────────────────
  // 5 hellgoat — disorienting maze fight
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 31, 22, { roomId: mirrorHallId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 40, 22, { roomId: mirrorHallId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 35, 26, { roomId: mirrorHallId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 31, 29, { roomId: mirrorHallId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 40, 29, { roomId: mirrorHallId });
  // 3 fireGoat ranged from mirror alcoves
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 33, 21, { roomId: mirrorHallId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 38, 25, { roomId: mirrorHallId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 35, 30, { roomId: mirrorHallId });

  // ── ENEMIES: Torment Gallery (x[30..41], z[36..45]) — arena waves ─────────
  // Set up 3-wave arena lock
  // Wave 1: 3 hellgoat charge
  // Wave 2: 2 fireGoat + 2 hellgoat
  // Wave 3: 4 hellgoat + 2 fireGoat surge
  editor.setupArenaWaves(LEVEL_ID, tormentGalleryId, { x: 30, z: 36, w: 12, h: 3 }, [
    // Wave 1
    [
      { type: ENEMY_TYPES.HELLGOAT, x: 31, z: 38 },
      { type: ENEMY_TYPES.HELLGOAT, x: 36, z: 40 },
      { type: ENEMY_TYPES.HELLGOAT, x: 40, z: 38 },
    ],
    // Wave 2
    [
      { type: ENEMY_TYPES.FIRE_GOAT, x: 31, z: 42 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 40, z: 42 },
      { type: ENEMY_TYPES.HELLGOAT, x: 34, z: 37 },
      { type: ENEMY_TYPES.HELLGOAT, x: 37, z: 44 },
    ],
    // Wave 3
    [
      { type: ENEMY_TYPES.HELLGOAT, x: 31, z: 37 },
      { type: ENEMY_TYPES.HELLGOAT, x: 36, z: 43 },
      { type: ENEMY_TYPES.HELLGOAT, x: 40, z: 37 },
      { type: ENEMY_TYPES.HELLGOAT, x: 33, z: 44 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 38, z: 39 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 32, z: 42 },
    ],
  ]);

  // ── ENEMIES: Obsession Vault (x[0..11], z[46..57]) ───────────────────────
  // 4 hellgoat lurking among the obsession shrines
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 2, 48, { roomId: obsessionVaultId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 9, 48, { roomId: obsessionVaultId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 2, 55, { roomId: obsessionVaultId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 9, 55, { roomId: obsessionVaultId });
  // 2 fireGoat from elevated niches
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 5, 49, { roomId: obsessionVaultId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 6, 54, { roomId: obsessionVaultId });

  // ── ENEMIES: Desire Corridor (x[30..41], z[50..59]) ───────────────────────
  // Ambush corridor — enemies lurk behind velvet drapes
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 32, 52, { roomId: desireCorridorId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 39, 52, { roomId: desireCorridorId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 35, 57, { roomId: desireCorridorId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 36, 51, { roomId: desireCorridorId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 31, 56, { roomId: desireCorridorId });

  // ── PICKUPS: new rooms ────────────────────────────────────────────────────
  // Crimson Baths
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 35, 5);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 38, 12);
  // Mirror Hall
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 33, 26);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 38, 28);
  // Torment Gallery (post-arena reward)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 31, 43);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 39, 43);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 35, 44);
  // Obsession Vault (secret cache)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 5, 52);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 8, 50);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 3, 54);
  // Desire Corridor
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 33, 55);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 39, 57);

  // ── PROPS: new rooms (Lust theme) ─────────────────────────────────────────

  // --- Crimson Baths props ---
  // Structural arches at north and south entries
  editor.spawnProp(LEVEL_ID, 'lust-ornate-arch', 36, 2, {
    roomId: crimsonBathsId,
    surfaceAnchor: {
      face: 'south',
      offsetX: 0,
      offsetY: 0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'lust-ornate-arch', 36, 15, {
    roomId: crimsonBathsId,
    surfaceAnchor: {
      face: 'south',
      offsetX: 0,
      offsetY: 0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // Onyx columns flanking bath pools
  editor.spawnProp(LEVEL_ID, 'lust-onyx-column', 31, 5, { roomId: crimsonBathsId });
  editor.spawnProp(LEVEL_ID, 'lust-onyx-column', 40, 5, { roomId: crimsonBathsId });
  editor.spawnProp(LEVEL_ID, 'lust-onyx-column', 31, 12, { roomId: crimsonBathsId });
  editor.spawnProp(LEVEL_ID, 'lust-onyx-column', 40, 12, { roomId: crimsonBathsId });
  // Ember braziers
  editor.spawnProp(LEVEL_ID, 'lust-ember-brazier', 33, 4, { roomId: crimsonBathsId });
  editor.spawnProp(LEVEL_ID, 'lust-ember-brazier', 38, 4, { roomId: crimsonBathsId });
  editor.spawnProp(LEVEL_ID, 'lust-ember-brazier', 33, 13, { roomId: crimsonBathsId });
  editor.spawnProp(LEVEL_ID, 'lust-ember-brazier', 38, 13, { roomId: crimsonBathsId });
  // Chandeliers above
  editor.spawnProp(LEVEL_ID, 'lust-chandelier', 36, 8, { roomId: crimsonBathsId });
  // Rose thorn clusters
  editor.spawnProp(LEVEL_ID, 'lust-rose-thorn-cluster', 34, 9, { roomId: crimsonBathsId });
  editor.spawnProp(LEVEL_ID, 'lust-rose-thorn-cluster', 38, 10, { roomId: crimsonBathsId });
  // Velvet drapes on walls
  editor.spawnProp(LEVEL_ID, 'lust-velvet-drape', 30, 7, {
    roomId: crimsonBathsId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'lust-velvet-drape', 41, 7, {
    roomId: crimsonBathsId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });

  // --- Mirror Hall props ---
  // Structural arch at north entry
  editor.spawnProp(LEVEL_ID, 'lust-ornate-arch', 36, 20, {
    roomId: mirrorHallId,
    surfaceAnchor: {
      face: 'south',
      offsetX: 0,
      offsetY: 0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // Ornate mirrors on every wall — the hall's centerpiece
  editor.spawnProp(LEVEL_ID, 'ornate-mirror', 31, 24, { roomId: mirrorHallId });
  editor.spawnProp(LEVEL_ID, 'ornate-mirror', 36, 21, { roomId: mirrorHallId });
  editor.spawnProp(LEVEL_ID, 'ornate-mirror', 40, 26, { roomId: mirrorHallId });
  editor.spawnProp(LEVEL_ID, 'ornate-mirror', 34, 30, { roomId: mirrorHallId });
  // Cracked statues in alcoves
  editor.spawnProp(LEVEL_ID, 'lust-cracked-statue', 30, 22, { roomId: mirrorHallId });
  editor.spawnProp(LEVEL_ID, 'lust-cracked-statue', 41, 28, { roomId: mirrorHallId });
  // Silk curtains in corners
  editor.spawnProp(LEVEL_ID, 'silk-curtain', 31, 29, { roomId: mirrorHallId });
  editor.spawnProp(LEVEL_ID, 'silk-curtain', 39, 21, { roomId: mirrorHallId });
  // Candelabras at room corners
  editor.spawnProp(LEVEL_ID, 'lust-candelabra', 30, 20, {
    roomId: mirrorHallId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'lust-candelabra', 41, 20, {
    roomId: mirrorHallId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'lust-candelabra', 30, 31, {
    roomId: mirrorHallId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'lust-candelabra', 41, 31, {
    roomId: mirrorHallId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });

  // --- Torment Gallery props ---
  // Gilded pillars framing arena floor
  editor.spawnProp(LEVEL_ID, 'lust-gilded-pillar', 31, 37, { roomId: tormentGalleryId });
  editor.spawnProp(LEVEL_ID, 'lust-gilded-pillar', 40, 37, { roomId: tormentGalleryId });
  editor.spawnProp(LEVEL_ID, 'lust-gilded-pillar', 31, 44, { roomId: tormentGalleryId });
  editor.spawnProp(LEVEL_ID, 'lust-gilded-pillar', 40, 44, { roomId: tormentGalleryId });
  // Ember braziers on raised platform edges
  editor.spawnProp(LEVEL_ID, 'lust-ember-brazier', 30, 40, { roomId: tormentGalleryId });
  editor.spawnProp(LEVEL_ID, 'lust-ember-brazier', 41, 40, { roomId: tormentGalleryId });
  // Lava rock borders along channel edges
  editor.spawnProp(LEVEL_ID, 'lust-lava-rock-border', 33, 41, { roomId: tormentGalleryId });
  editor.spawnProp(LEVEL_ID, 'lust-lava-rock-border', 37, 41, { roomId: tormentGalleryId });
  // Fallen chairs after the carnage
  editor.spawnProp(LEVEL_ID, 'lust-fallen-chair', 34, 43, { roomId: tormentGalleryId });
  editor.spawnProp(LEVEL_ID, 'lust-fallen-chair', 38, 37, { roomId: tormentGalleryId });
  // Wind banners on north and south walls
  editor.spawnProp(LEVEL_ID, 'lust-wind-banner', 31, 36, {
    roomId: tormentGalleryId,
    surfaceAnchor: {
      face: 'north',
      offsetX: 0,
      offsetY: 2.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'lust-wind-banner', 39, 45, {
    roomId: tormentGalleryId,
    surfaceAnchor: {
      face: 'south',
      offsetX: 0,
      offsetY: 2.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });

  // --- Obsession Vault props ---
  // Wrecked beds and golden chalices — objects of desire
  editor.spawnProp(LEVEL_ID, 'lust-ornate-bed-wrecked', 2, 49, { roomId: obsessionVaultId });
  editor.spawnProp(LEVEL_ID, 'lust-ornate-bed-wrecked', 8, 53, { roomId: obsessionVaultId });
  editor.spawnProp(LEVEL_ID, 'lust-golden-chalice', 5, 47, { roomId: obsessionVaultId });
  editor.spawnProp(LEVEL_ID, 'lust-golden-chalice', 9, 55, { roomId: obsessionVaultId });
  // Chandeliers
  editor.spawnProp(LEVEL_ID, 'lust-chandelier', 5, 51, { roomId: obsessionVaultId });
  // Candelabras at corners
  editor.spawnProp(LEVEL_ID, 'lust-candelabra', 0, 46, {
    roomId: obsessionVaultId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'lust-candelabra', 0, 57, {
    roomId: obsessionVaultId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // Velvet drapes and silk curtains
  editor.spawnProp(LEVEL_ID, 'lust-velvet-drape', 3, 51, { roomId: obsessionVaultId });
  editor.spawnProp(LEVEL_ID, 'silk-curtain', 8, 48, { roomId: obsessionVaultId });
  // Perfume censers
  editor.spawnProp(LEVEL_ID, 'lust-perfume-censer', 6, 53, { roomId: obsessionVaultId });

  // --- Desire Corridor props ---
  // Structural arches at north and south entries
  editor.spawnProp(LEVEL_ID, 'lust-ornate-arch', 36, 50, {
    roomId: desireCorridorId,
    surfaceAnchor: {
      face: 'south',
      offsetX: 0,
      offsetY: 0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.9,
    },
  });
  editor.spawnProp(LEVEL_ID, 'lust-ornate-arch', 36, 59, {
    roomId: desireCorridorId,
    surfaceAnchor: {
      face: 'south',
      offsetX: 0,
      offsetY: 0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.9,
    },
  });
  // Wind banners showing the dragging wind
  editor.spawnProp(LEVEL_ID, 'lust-wind-banner', 30, 52, {
    roomId: desireCorridorId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.8,
    },
  });
  editor.spawnProp(LEVEL_ID, 'lust-wind-banner', 30, 56, {
    roomId: desireCorridorId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.8,
    },
  });
  // Bridge railings
  editor.spawnProp(LEVEL_ID, 'lust-bridge-railing', 34, 54, { roomId: desireCorridorId });
  editor.spawnProp(LEVEL_ID, 'lust-bridge-railing', 37, 54, { roomId: desireCorridorId });
  // Lava rock borders at channel edges
  editor.spawnProp(LEVEL_ID, 'lust-lava-rock-border', 31, 54, { roomId: desireCorridorId });
  editor.spawnProp(LEVEL_ID, 'lust-lava-rock-border', 40, 54, { roomId: desireCorridorId });

  // ── AMBUSH TRIGGERS: new rooms ────────────────────────────────────────────

  // Crimson Baths ambush — fire goats open up when player enters deep end
  editor.ambush(
    LEVEL_ID,
    { x: 30, z: 8, w: 12, h: 3 },
    [
      { type: ENEMY_TYPES.FIRE_GOAT, x: 31, z: 10 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 40, z: 10 },
      { type: ENEMY_TYPES.HELLGOAT, x: 35, z: 11 },
    ],
    { roomId: crimsonBathsId },
  );

  // Desire Corridor ambush — hellgoats burst from alcoves
  editor.ambush(
    LEVEL_ID,
    { x: 30, z: 53, w: 12, h: 3 },
    [
      { type: ENEMY_TYPES.HELLGOAT, x: 31, z: 54 },
      { type: ENEMY_TYPES.HELLGOAT, x: 39, z: 55 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 35, z: 56 },
    ],
    { roomId: desireCorridorId },
  );

  // ── ENVIRONMENT ZONES: new rooms ─────────────────────────────────────────

  // Crimson Baths: fire hazard — lava pool in center
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.FIRE,
    boundsX: 33,
    boundsZ: 7,
    boundsW: 5,
    boundsH: 5,
    intensity: 1.0,
  });

  // Mirror Hall: illusion zone — mirrors distort reality
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.ILLUSION,
    boundsX: 30,
    boundsZ: 20,
    boundsW: 12,
    boundsH: 12,
    intensity: 0.6,
  });

  // Torment Gallery: wind cross-blast during arena waves
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.WIND,
    boundsX: 30,
    boundsZ: 36,
    boundsW: 12,
    boundsH: 10,
    intensity: 0.4,
    directionX: 1.0,
    directionZ: 0,
    timerOn: 5.0,
    timerOff: 5.0,
  });

  // Obsession Vault: heavy fog — disorienting desire haze
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.FOG,
    boundsX: 0,
    boundsZ: 46,
    boundsW: 12,
    boundsH: 12,
    intensity: 0.07,
  });

  // Desire Corridor: wind pull southward
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.WIND,
    boundsX: 30,
    boundsZ: 50,
    boundsW: 12,
    boundsH: 10,
    intensity: 0.35,
    directionX: 0,
    directionZ: 1.0,
  });

  // ── DECALS: new rooms ─────────────────────────────────────────────────────
  editor.placeDecals(LEVEL_ID, crimsonBathsId, [
    { type: DECAL_TYPES.WATER_STAIN, x: 33, z: 8, opacity: 0.5 },
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 38, z: 11, opacity: 0.4 },
  ]);

  editor.placeDecals(LEVEL_ID, mirrorHallId, [
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 31, z: 23, opacity: 0.4 },
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 40, z: 29, opacity: 0.4 },
  ]);

  editor.placeDecals(LEVEL_ID, tormentGalleryId, [
    { type: DECAL_TYPES.WATER_STAIN, x: 33, z: 41, opacity: 0.5 },
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 38, z: 37, surface: 'wall', opacity: 0.5 },
  ]);

  editor.placeDecals(LEVEL_ID, obsessionVaultId, [
    { type: DECAL_TYPES.WATER_STAIN, x: 5, z: 52, opacity: 0.5 },
  ]);

  editor.placeDecals(LEVEL_ID, desireCorridorId, [
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 30, z: 54, surface: 'wall', opacity: 0.5 },
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 41, z: 54, surface: 'wall', opacity: 0.5 },
  ]);

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
