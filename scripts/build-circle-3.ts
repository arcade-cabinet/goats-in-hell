#!/usr/bin/env npx tsx
/**
 * Build script for Circle 3: Gluttony — The Circle of Excess
 *
 * Translates docs/circles/03-gluttony.md into LevelEditor API calls.
 * Run: npx tsx scripts/build-circle-3.ts
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

const LEVEL_ID = 'circle-3-gluttony';
const THEME_ID = 'circle-3-gluttony';

export async function buildCircle3(dbPath: string) {
  const sqliteDb = new BetterSqlite3(dbPath);
  const db = drizzle(sqliteDb, { schema });
  await migrateAndSeed(db);
  const editor = new LevelEditor(db);

  // =========================================================================
  // 1. THEME (from "Theme Configuration" section)
  // =========================================================================

  editor.createTheme(THEME_ID, {
    name: 'gluttony',
    displayName: 'GLUTTONY \u2014 The Circle of Excess',
    primaryWall: MapCell.WALL_FLESH, // Organic meat walls
    accentWalls: [MapCell.WALL_STONE], // Stone walkways/platforms as contrast
    fogDensity: 0.04,
    fogColor: '#1a2211',
    ambientColor: '#88aa44',
    ambientIntensity: 0.18,
    skyColor: '#0a0f05',
    particleEffect: 'drips', // Green moisture dripping from ceiling
    enemyTypes: ['hellgoat', 'fireGoat'],
    enemyDensity: 1.0, // Standard density
    pickupDensity: 1.5, // HIGH -- abundance is the trap
    texturePalette: { exploration: 'leather', arena: 'leather', boss: 'ground', secret: 'leather' },
  });

  // =========================================================================
  // 2. LEVEL (from "Identity" + "Grid Dimensions" sections)
  // =========================================================================

  editor.createLevel(LEVEL_ID, {
    name: 'Circle 3: Gluttony',
    levelType: 'circle',
    width: 40, // "40 wide"
    depth: 160, // Extended from 96 to 160 to accommodate expansion rooms south of Vorago's Maw
    floor: 3,
    themeId: THEME_ID,
    circleNumber: 3,
    sin: 'Excess',
    guardian: 'Vorago',
  });

  // =========================================================================
  // 3. ROOMS (from "Room Placement" table, in sortOrder)
  // =========================================================================
  //
  // | Room          | X  | Z  | W  | H  | Type          | Elevation               | sortOrder |
  // | Gullet        | 17 |  2 |  6 | 14 | gauntlet      | 0 (varies +/-0.5)       | 0         |
  // | Feast Hall    | 13 | 20 | 14 | 10 | exploration   | 0                       | 1         |
  // | Pantry        |  3 | 32 |  6 |  6 | secret        | 0                       | 2         |
  // | Larder        | 15 | 34 | 10 | 12 | platforming   | 0 (bottom=-2)           | 3         |
  // | Bile Cistern  | 14 | 50 | 12 | 10 | exploration   | 0 (acid=-0.5)           | 4         |
  // | Gut Arena     | 14 | 64 | 12 | 12 | arena         | 0                       | 5         |
  // | Vorago's Maw  | 13 | 80 | 14 | 14 | boss          | -1 (acid=-2)            | 6         |

  const gulletId = editor.room(LEVEL_ID, 'gullet', 17, 2, 6, 14, {
    roomType: ROOM_TYPES.CORRIDOR, // "gauntlet" maps to CORRIDOR (no GAUNTLET type)
    elevation: 0,
    sortOrder: 0,
    floorTexture: 'leather',
    wallTexture: 'ground',
  });

  const feastHallId = editor.room(LEVEL_ID, 'feast_hall', 13, 20, 14, 10, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 1,
    floorTexture: 'ground',
    wallTexture: 'leather',
    fillRule: {
      type: 'scatter',
      props: [
        'feast-table',
        'gluttony-rotten-crate',
        'gluttony-rotting-barrel',
        'gluttony-slop-bucket',
      ],
      density: 0.08,
    },
  });

  const pantryId = editor.room(LEVEL_ID, 'pantry', 3, 32, 6, 6, {
    roomType: ROOM_TYPES.SECRET,
    elevation: 0,
    sortOrder: 2,
    floorTexture: 'ground',
    fillRule: {
      type: 'scatter',
      props: ['gluttony-rotten-crate', 'gluttony-swollen-cask'],
      density: 0.15,
    },
  });

  const larderId = editor.room(LEVEL_ID, 'larder', 15, 34, 10, 12, {
    roomType: ROOM_TYPES.PLATFORMING,
    elevation: 0,
    sortOrder: 3,
    floorTexture: 'ground',
    wallTexture: 'leather',
    fillRule: {
      type: 'scatter',
      props: ['gluttony-acid-pool-edge', 'gluttony-fungus-pillar'],
      density: 0.12,
    },
  });

  const bileCisternId = editor.room(LEVEL_ID, 'bile_cistern', 14, 50, 12, 10, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 4,
    floorTexture: 'leather',
    fillRule: {
      type: 'scatter',
      props: ['gluttony-bile-pool-surface', 'bile-cauldron'],
      density: 0.07,
    },
  });

  const gutArenaId = editor.room(LEVEL_ID, 'gut_arena', 14, 64, 12, 12, {
    roomType: ROOM_TYPES.ARENA,
    elevation: 0,
    sortOrder: 5,
    floorTexture: 'leather',
    wallTexture: 'leather',
    fillRule: {
      type: 'scatter',
      props: ['gluttony-stomach-wall-growth', 'gluttony-maggot-mound', 'gluttony-mucus-web'],
      density: 0.1,
    },
  });

  const voragosMawId = editor.room(LEVEL_ID, 'voragos_maw', 13, 80, 14, 14, {
    roomType: ROOM_TYPES.BOSS,
    elevation: -1,
    sortOrder: 6,
    floorTexture: 'ground',
    wallTexture: 'leather',
  });

  // =========================================================================
  // 4. CONNECTIONS (from "Connections" table)
  // =========================================================================
  //
  // | From          | To            | Type              | Width | Notes                      |
  // | Gullet        | Feast Hall    | widening corridor | 4     | Throat opens into hall     |
  // | Feast Hall    | Pantry        | secret            | 2     | WALL_SECRET on west wall   |
  // | Feast Hall    | Larder        | corridor          | 3     | Main path continues south  |
  // | Larder        | Bile Cistern  | corridor          | 3     | Ascending from -2 to 0     |
  // | Bile Cistern  | Gut Arena     | corridor          | 3     | Straight south             |
  // | Gut Arena     | Vorago's Maw  | passage           | 3     | Descending to -1           |

  // Gullet -> Feast Hall (widening corridor, width 4)
  editor.corridor(LEVEL_ID, gulletId, feastHallId, 4);

  // Feast Hall -> Pantry (secret, width 2)
  editor.connect(LEVEL_ID, feastHallId, pantryId, {
    connectionType: CONNECTION_TYPES.SECRET,
    corridorWidth: 2,
  });

  // Feast Hall -> Pantry (hidden corridor, width 1 -- ensures playtest agent can reach it)
  // The secret wall is the gameplay mechanic; this thin passage is the underlying path.
  editor.corridor(LEVEL_ID, feastHallId, pantryId, 1);

  // Feast Hall -> Larder (corridor, width 3)
  editor.corridor(LEVEL_ID, feastHallId, larderId, 3);

  // Larder -> Bile Cistern (corridor, width 3, ascending from -2 to 0)
  editor.connect(LEVEL_ID, larderId, bileCisternId, {
    connectionType: CONNECTION_TYPES.STAIRS,
    corridorWidth: 3,
    fromElevation: -2,
    toElevation: 0,
  });

  // Bile Cistern -> Gut Arena (corridor, width 3)
  editor.corridor(LEVEL_ID, bileCisternId, gutArenaId, 3);

  // Gut Arena -> Vorago's Maw (passage, width 3, descending 0 to -1)
  editor.connect(LEVEL_ID, gutArenaId, voragosMawId, {
    connectionType: CONNECTION_TYPES.STAIRS,
    corridorWidth: 3,
    fromElevation: 0,
    toElevation: -1,
  });

  // =========================================================================
  // 5. ENTITIES: ENEMIES (from "Enemies" table)
  // =========================================================================

  // --- Gullet: 3 hellgoat (melee, wait in wide sections) ---
  //   Room bounds: (17, 2, 6, 14) -> interior: x=[18..21], z=[3..14]
  //   Positions from table: first narrow (18, 7), second narrow (19, 11), exit wide (19, 14)
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 18, 7, {
    roomId: gulletId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 19, 11, {
    roomId: gulletId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 19, 14, {
    roomId: gulletId,
  });

  // --- Feast Hall: 4 hellgoat (patrol table aisles, 2 per side) ---
  //   Room bounds: (13, 20, 14, 10) -> interior: x=[14..25], z=[21..28]
  //   Positions from table: NW (14,23), NE (25,23), SW (14,27), SE (25,27)
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 14, 23, {
    roomId: feastHallId,
    patrol: [
      { x: 14, z: 23 },
      { x: 14, z: 27 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 25, 23, {
    roomId: feastHallId,
    patrol: [
      { x: 25, z: 23 },
      { x: 25, z: 27 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 14, 27, {
    roomId: feastHallId,
    patrol: [
      { x: 14, z: 27 },
      { x: 14, z: 23 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 25, 27, {
    roomId: feastHallId,
    patrol: [
      { x: 25, z: 27 },
      { x: 25, z: 23 },
    ],
  });

  // --- Larder: 2 fireGoat (ranged, fire across vertical gap) ---
  //   Room bounds: (15, 34, 10, 12) -> interior: x=[16..23], z=[35..44]
  //   Positions from table: Platform 2 (17, 38), platform 3 (22, 41)
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 17, 38, {
    roomId: larderId,
    elevation: -0.5,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 22, 41, {
    roomId: larderId,
    elevation: -1.0,
  });

  // --- Larder: 1 hellgoat (melee, guards bottom) ---
  //   Position from table: Platform 4 (19, 43)
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 19, 43, {
    roomId: larderId,
    elevation: -1.5,
  });

  // --- Bile Cistern: 3 fireGoat (ranged from walkway segments) ---
  //   Room bounds: (14, 50, 12, 10) -> interior: x=[15..24], z=[51..58]
  //   Positions from table: NW walkway (16, 51), center (20, 54), SE walkway (24, 57)
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 16, 51, {
    roomId: bileCisternId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 20, 54, {
    roomId: bileCisternId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 24, 57, {
    roomId: bileCisternId,
  });

  // --- Gut Arena: 2 waves via setupArenaWaves ---
  //   Room bounds: (14, 64, 12, 12) -> interior: x=[15..24], z=[65..74]
  //   Trigger zone from table: (16, 66, 8, 4)
  //   Wave 1: 4 hellgoat (melee, outer + middle rings)
  //     Outer N (20,65), Outer S (20,73), Middle E (23,69), Middle W (17,69)
  //   Wave 2: 2 fireGoat (ranged, middle ring) + 2 hellgoat (melee, outer ring flanks)
  //     Middle N (20,67), Middle S (20,71), Outer E (24,69), Outer W (16,69)
  editor.setupArenaWaves(LEVEL_ID, gutArenaId, { x: 16, z: 66, w: 8, h: 4 }, [
    // Wave 1: 4 hellgoats on outer + middle rings
    [
      { type: ENEMY_TYPES.HELLGOAT, x: 20, z: 65 },
      { type: ENEMY_TYPES.HELLGOAT, x: 20, z: 73 },
      { type: ENEMY_TYPES.HELLGOAT, x: 23, z: 69 },
      { type: ENEMY_TYPES.HELLGOAT, x: 17, z: 69 },
    ],
    // Wave 2: 2 fireGoat + 2 hellgoat
    [
      { type: ENEMY_TYPES.FIRE_GOAT, x: 20, z: 67 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 20, z: 71 },
      { type: ENEMY_TYPES.HELLGOAT, x: 24, z: 69 },
      { type: ENEMY_TYPES.HELLGOAT, x: 16, z: 69 },
    ],
  ]);

  // --- Boss chamber: Vorago boss entity ---
  //   Room bounds: (13, 80, 14, 14) -> center platform: (20, 87)
  //   Position from table: Central platform (20, 87), elev -1
  editor.spawnBoss(LEVEL_ID, 'vorago', 20, 87, {
    roomId: voragosMawId,
    facing: 0, // Faces north toward entrance
  });

  // =========================================================================
  // 5b. ENTITIES: PICKUPS (from "Pickups" table)
  // =========================================================================

  // Gullet: ammo (20, 6) -- early resupply, first wide section
  //   Room bounds: (17, 2, 6, 14) -> interior: x=[18..21], z=[3..14]
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 20, 6);

  // Gullet: health (19, 8) -- first wide section, may be poisoned
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 19, 8);

  // Gullet: ammo (18, 8) -- reliable ammo near health
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 18, 8);

  // Gullet: health (19, 13) -- second wide section, may be poisoned
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 19, 13);

  // Gullet: ammo (20, 13) -- reliable ammo
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 20, 13);

  // Feast Hall: health x 6 on table area
  //   Room bounds: (13, 20, 14, 10) -> interior: x=[14..25], z=[21..28]
  //   Positions from table: (17,25), (19,25), (21,25), (23,25), (18,26), (22,26)
  //   3 are poisoned (seeded 50%)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 17, 25);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 19, 25);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 21, 25);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 23, 25);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 18, 26);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 22, 26);

  // Feast Hall: ammo x 2 flanking table
  //   Positions from table: (20, 24), (20, 27)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 20, 24);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 20, 27);

  // Larder: health (18, 43) -- platform 4, may be poisoned
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 18, 43);

  // Larder: ammo (21, 45) -- bottom level, reliable
  //   Note: z=45 is at bounds 34+12-1=45, interior max is 34+12-2=44
  //   Adjust to (21, 44) to stay inside room interior
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 21, 44);

  // Bile Cistern: health x 2 on dead-end walkways (both guaranteed poisoned -- lures)
  //   Positions from table: (15, 55), (24, 54)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 15, 55);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 24, 54);

  // Bile Cistern: health (20, 58) -- main walkway, may be poisoned
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 20, 58);

  // Bile Cistern: ammo x 2 on walkways
  //   Positions from table: (18, 52), (23, 57)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 18, 52);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 23, 57);

  // Bile Cistern: ammo (20, 55) -- main walkway path
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 20, 55);

  // Pantry: health x 2 (guaranteed non-poisoned, secret reward)
  //   Room bounds: (3, 32, 6, 6) -> interior: x=[4..7], z=[33..36]
  //   Positions from table: (5, 36), (7, 36)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 5, 36);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 7, 36);

  // Pantry: ammo (7, 35) -- reliable ammo
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 7, 35);

  // Gut Arena (between waves): ammo (20, 65) -- outer ring N
  //   Room bounds: (14, 64, 12, 12) -> interior: x=[15..24], z=[65..74]
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 20, 65);

  // Gut Arena (between waves): health (20, 73) -- outer ring S, may be poisoned
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 20, 73);

  // Boss chamber: ammo x 2 at entry ledge corners
  //   Room bounds: (13, 80, 14, 14) -> interior: x=[14..25], z=[81..92]
  //   Positions from table: (15, 81), (25, 81)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 15, 81);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 25, 81);

  // Boss chamber: health x 2 at edge debris platforms, may be poisoned
  //   Positions from table: (15, 87), (25, 87)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 15, 87);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 25, 87);

  // Boss chamber: health x 2 at S edge platforms, may be poisoned
  //   Positions from table: (14, 91), (26, 91)
  //   Note: x=26 is at bounds 13+14-1=26, interior max is 13+14-2=25
  //   Adjust (26, 91) to (25, 91) to stay inside interior
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 14, 91);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 25, 91);

  // =========================================================================
  // 5c. ENTITIES: PROPS (from "Props" table per room)
  // =========================================================================

  // --- Gullet (bounds: 17, 2, 6, 14) ---
  //   Interior: x=[18..21], z=[3..14]
  //   From 3D Spatial Design: 15 assets total
  // Structural: 2x gluttony-bloated-arch, 2x gluttony-flesh-door-frame
  editor.spawnProp(LEVEL_ID, 'gluttony-bloated-arch', 20, 2, { roomId: gulletId }); // north entrance
  editor.spawnProp(LEVEL_ID, 'gluttony-flesh-door-frame', 19, 8, { roomId: gulletId }); // first narrow-to-wide
  editor.spawnProp(LEVEL_ID, 'gluttony-flesh-door-frame', 19, 11, { roomId: gulletId }); // second constriction
  editor.spawnProp(LEVEL_ID, 'gluttony-bloated-arch', 20, 15, { roomId: gulletId }); // south exit widens
  // 4x gluttony-lantern-wall-green (walls)
  editor.spawnProp(LEVEL_ID, 'gluttony-lantern-wall-green', 17, 3, {
    roomId: gulletId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.9,
    },
  });
  editor.spawnProp(LEVEL_ID, 'gluttony-lantern-wall-green', 22, 3, {
    roomId: gulletId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.9,
    },
  });
  editor.spawnProp(LEVEL_ID, 'gluttony-lantern-wall-green', 17, 9, {
    roomId: gulletId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.9,
    },
  });
  editor.spawnProp(LEVEL_ID, 'gluttony-lantern-wall-green', 22, 12, {
    roomId: gulletId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.9,
    },
  });
  // 2x gluttony-slop-bucket (floor, wide sections)
  editor.spawnProp(LEVEL_ID, 'gluttony-slop-bucket', 18, 5, { roomId: gulletId });
  editor.spawnProp(LEVEL_ID, 'gluttony-slop-bucket', 21, 10, { roomId: gulletId });
  // 1x gluttony-rope-tendril (ceiling, narrow section)
  editor.spawnProp(LEVEL_ID, 'gluttony-rope-tendril', 19, 7, { roomId: gulletId });
  // 2x gluttony-stomach-wall-growth (wall surfaces)
  editor.spawnProp(LEVEL_ID, 'gluttony-stomach-wall-growth', 17, 6, {
    roomId: gulletId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 0.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.7,
    },
  });
  editor.spawnProp(LEVEL_ID, 'gluttony-stomach-wall-growth', 22, 10, {
    roomId: gulletId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 0.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.7,
    },
  });
  // 2x gluttony-dripping-stalactite (ceiling)
  editor.spawnProp(LEVEL_ID, 'gluttony-dripping-stalactite', 19, 4, { roomId: gulletId });
  editor.spawnProp(LEVEL_ID, 'gluttony-dripping-stalactite', 20, 11, { roomId: gulletId });
  // 1x gluttony-mucus-web (narrow section corner)
  editor.spawnProp(LEVEL_ID, 'gluttony-mucus-web', 22, 7, { roomId: gulletId });
  // 1x gluttony-maggot-mound (exit wide section floor)
  editor.spawnProp(LEVEL_ID, 'gluttony-maggot-mound', 18, 13, { roomId: gulletId });

  // --- Feast Hall (bounds: 13, 20, 14, 10) ---
  //   Interior: x=[14..25], z=[21..28]
  //   From 3D Spatial Design: 19 unique assets
  // Structural: 2x gluttony-bloated-arch, 1x gluttony-flesh-door-frame
  editor.spawnProp(LEVEL_ID, 'gluttony-bloated-arch', 20, 20, { roomId: feastHallId }); // north entrance
  editor.spawnProp(LEVEL_ID, 'gluttony-bloated-arch', 20, 29, { roomId: feastHallId }); // south exit
  editor.spawnProp(LEVEL_ID, 'gluttony-flesh-door-frame', 13, 27, { roomId: feastHallId }); // west wall secret
  // 4x gluttony-lantern-wall-green (corners)
  editor.spawnProp(LEVEL_ID, 'gluttony-lantern-wall-green', 13, 20, {
    roomId: feastHallId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'gluttony-lantern-wall-green', 26, 20, {
    roomId: feastHallId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'gluttony-lantern-wall-green', 13, 29, {
    roomId: feastHallId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'gluttony-lantern-wall-green', 26, 29, {
    roomId: feastHallId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 1x feast-table (center, (17,24)-(25,26))
  editor.spawnProp(LEVEL_ID, 'feast-table', 20, 25, { roomId: feastHallId });
  // 1x lust-chandelier (ceiling center, warm overhead)
  editor.spawnProp(LEVEL_ID, 'lust-chandelier', 20, 24, { roomId: feastHallId });
  // 2x bile-cauldron (flanking table ends)
  editor.spawnProp(LEVEL_ID, 'bile-cauldron', 16, 25, { roomId: feastHallId });
  editor.spawnProp(LEVEL_ID, 'bile-cauldron', 26, 25, { roomId: feastHallId });
  // 3x gluttony-rotting-barrel (north wall, overflowing)
  editor.spawnProp(LEVEL_ID, 'gluttony-rotting-barrel', 14, 21, { roomId: feastHallId });
  editor.spawnProp(LEVEL_ID, 'gluttony-rotting-barrel', 17, 21, { roomId: feastHallId });
  editor.spawnProp(LEVEL_ID, 'gluttony-rotting-barrel', 25, 21, { roomId: feastHallId });
  // 2x gluttony-rotten-crate (near table ends)
  editor.spawnProp(LEVEL_ID, 'gluttony-rotten-crate', 14, 22, { roomId: feastHallId });
  editor.spawnProp(LEVEL_ID, 'gluttony-rotten-crate', 25, 22, { roomId: feastHallId });
  // 4x gluttony-overflowing-goblet (on table, scattered)
  editor.spawnProp(LEVEL_ID, 'gluttony-overflowing-goblet', 18, 25, { roomId: feastHallId });
  editor.spawnProp(LEVEL_ID, 'gluttony-overflowing-goblet', 20, 25, { roomId: feastHallId });
  editor.spawnProp(LEVEL_ID, 'gluttony-overflowing-goblet', 22, 25, { roomId: feastHallId });
  editor.spawnProp(LEVEL_ID, 'gluttony-overflowing-goblet', 24, 25, { roomId: feastHallId });
  // 4x gluttony-bone-plate (on table, place settings)
  editor.spawnProp(LEVEL_ID, 'gluttony-bone-plate', 19, 24, { roomId: feastHallId });
  editor.spawnProp(LEVEL_ID, 'gluttony-bone-plate', 21, 24, { roomId: feastHallId });
  editor.spawnProp(LEVEL_ID, 'gluttony-bone-plate', 23, 24, { roomId: feastHallId });
  editor.spawnProp(LEVEL_ID, 'gluttony-bone-plate', 19, 26, { roomId: feastHallId });
  // 1x gluttony-swollen-cask (SW corner)
  editor.spawnProp(LEVEL_ID, 'gluttony-swollen-cask', 14, 28, { roomId: feastHallId });
  // 1x gluttony-slop-bucket (SE corner)
  editor.spawnProp(LEVEL_ID, 'gluttony-slop-bucket', 26, 28, { roomId: feastHallId });
  // 2x gluttony-fungus-pillar (flanking table center)
  editor.spawnProp(LEVEL_ID, 'gluttony-fungus-pillar', 14, 24, { roomId: feastHallId });
  editor.spawnProp(LEVEL_ID, 'gluttony-fungus-pillar', 26, 24, { roomId: feastHallId });
  // 1x gluttony-meat-carcass (hanging near table north)
  editor.spawnProp(LEVEL_ID, 'gluttony-meat-carcass', 16, 22, { roomId: feastHallId });
  // 1x gluttony-dripping-stalactite (ceiling above table)
  editor.spawnProp(LEVEL_ID, 'gluttony-dripping-stalactite', 20, 21, { roomId: feastHallId });

  // --- Larder (bounds: 15, 34, 10, 12) ---
  //   Interior: x=[16..23], z=[35..44]
  //   From 3D Spatial Design: ~35 assets
  // Structural: 2x gluttony-bloated-arch
  editor.spawnProp(LEVEL_ID, 'gluttony-bloated-arch', 20, 34, { roomId: larderId }); // north entrance
  editor.spawnProp(LEVEL_ID, 'gluttony-bloated-arch', 20, 45, { roomId: larderId }); // south exit
  // 8x gluttony-shelf-arch (walls, 2 per platform level)
  editor.spawnProp(LEVEL_ID, 'gluttony-shelf-arch', 15, 35, {
    roomId: larderId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 0.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'gluttony-shelf-arch', 24, 35, {
    roomId: larderId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 0.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'gluttony-shelf-arch', 15, 38, {
    roomId: larderId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 0.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'gluttony-shelf-arch', 24, 38, {
    roomId: larderId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 0.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'gluttony-shelf-arch', 15, 41, {
    roomId: larderId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 0.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'gluttony-shelf-arch', 24, 41, {
    roomId: larderId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 0.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'gluttony-shelf-arch', 15, 44, {
    roomId: larderId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 0.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'gluttony-shelf-arch', 24, 44, {
    roomId: larderId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 0.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 6x gluttony-rotting-barrel (on shelf surfaces, stacked)
  editor.spawnProp(LEVEL_ID, 'gluttony-rotting-barrel', 17, 36, { roomId: larderId });
  editor.spawnProp(LEVEL_ID, 'gluttony-rotting-barrel', 22, 36, { roomId: larderId });
  editor.spawnProp(LEVEL_ID, 'gluttony-rotting-barrel', 17, 40, { roomId: larderId });
  editor.spawnProp(LEVEL_ID, 'gluttony-rotting-barrel', 22, 40, { roomId: larderId });
  editor.spawnProp(LEVEL_ID, 'gluttony-rotting-barrel', 17, 43, { roomId: larderId });
  editor.spawnProp(LEVEL_ID, 'gluttony-rotting-barrel', 22, 43, { roomId: larderId });
  // 6x gluttony-rotten-crate (on shelf surfaces, stacked)
  editor.spawnProp(LEVEL_ID, 'gluttony-rotten-crate', 18, 36, { roomId: larderId });
  editor.spawnProp(LEVEL_ID, 'gluttony-rotten-crate', 21, 36, { roomId: larderId });
  editor.spawnProp(LEVEL_ID, 'gluttony-rotten-crate', 18, 39, { roomId: larderId });
  editor.spawnProp(LEVEL_ID, 'gluttony-rotten-crate', 21, 39, { roomId: larderId });
  editor.spawnProp(LEVEL_ID, 'gluttony-rotten-crate', 18, 42, { roomId: larderId });
  editor.spawnProp(LEVEL_ID, 'gluttony-rotten-crate', 21, 42, { roomId: larderId });
  // 3x gluttony-rope-tendril (hanging, safe path markers)
  editor.spawnProp(LEVEL_ID, 'gluttony-rope-tendril', 17, 37, { roomId: larderId });
  editor.spawnProp(LEVEL_ID, 'gluttony-rope-tendril', 20, 40, { roomId: larderId });
  editor.spawnProp(LEVEL_ID, 'gluttony-rope-tendril', 19, 43, { roomId: larderId });
  // 2x gluttony-rope-tendril (alternate path markers)
  editor.spawnProp(LEVEL_ID, 'gluttony-rope-tendril', 22, 38, { roomId: larderId });
  editor.spawnProp(LEVEL_ID, 'gluttony-rope-tendril', 21, 42, { roomId: larderId });
  // 4x gluttony-lantern-wall-green (one per platform level)
  editor.spawnProp(LEVEL_ID, 'gluttony-lantern-wall-green', 15, 36, {
    roomId: larderId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.9,
    },
  });
  editor.spawnProp(LEVEL_ID, 'gluttony-lantern-wall-green', 24, 39, {
    roomId: larderId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.9,
    },
  });
  editor.spawnProp(LEVEL_ID, 'gluttony-lantern-wall-green', 15, 42, {
    roomId: larderId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.9,
    },
  });
  editor.spawnProp(LEVEL_ID, 'gluttony-lantern-wall-green', 24, 44, {
    roomId: larderId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.9,
    },
  });
  // 2x gluttony-overflowing-goblet (on shelves)
  editor.spawnProp(LEVEL_ID, 'gluttony-overflowing-goblet', 16, 36, { roomId: larderId });
  editor.spawnProp(LEVEL_ID, 'gluttony-overflowing-goblet', 23, 40, { roomId: larderId });
  // 2x gluttony-dripping-stalactite (ceiling at upper levels)
  editor.spawnProp(LEVEL_ID, 'gluttony-dripping-stalactite', 19, 35, { roomId: larderId });
  editor.spawnProp(LEVEL_ID, 'gluttony-dripping-stalactite', 21, 41, { roomId: larderId });
  // 1x gluttony-meat-carcass (hanging from ceiling)
  editor.spawnProp(LEVEL_ID, 'gluttony-meat-carcass', 23, 36, { roomId: larderId });

  // --- Bile Cistern (bounds: 14, 50, 12, 10) ---
  //   Interior: x=[15..24], z=[51..58]
  //   From 3D Spatial Design: 14 assets
  // Structural: 2x gluttony-bloated-arch
  editor.spawnProp(LEVEL_ID, 'gluttony-bloated-arch', 20, 50, { roomId: bileCisternId }); // north entrance
  editor.spawnProp(LEVEL_ID, 'gluttony-bloated-arch', 20, 59, { roomId: bileCisternId }); // south exit
  // 4x gluttony-lantern-wall-green (corners)
  editor.spawnProp(LEVEL_ID, 'gluttony-lantern-wall-green', 14, 50, {
    roomId: bileCisternId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'gluttony-lantern-wall-green', 25, 50, {
    roomId: bileCisternId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'gluttony-lantern-wall-green', 14, 59, {
    roomId: bileCisternId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'gluttony-lantern-wall-green', 25, 59, {
    roomId: bileCisternId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 3x gluttony-slop-bucket (on walkways, tipped)
  editor.spawnProp(LEVEL_ID, 'gluttony-slop-bucket', 16, 52, { roomId: bileCisternId });
  editor.spawnProp(LEVEL_ID, 'gluttony-slop-bucket', 22, 55, { roomId: bileCisternId });
  editor.spawnProp(LEVEL_ID, 'gluttony-slop-bucket', 24, 57, { roomId: bileCisternId });
  // 2x gluttony-rotting-barrel (walkway intersections)
  editor.spawnProp(LEVEL_ID, 'gluttony-rotting-barrel', 18, 53, { roomId: bileCisternId });
  editor.spawnProp(LEVEL_ID, 'gluttony-rotting-barrel', 23, 56, { roomId: bileCisternId });
  // 2x bile-cauldron (on walkways, bubbling acid-adjacent)
  editor.spawnProp(LEVEL_ID, 'bile-cauldron', 16, 52, { roomId: bileCisternId });
  editor.spawnProp(LEVEL_ID, 'bile-cauldron', 22, 56, { roomId: bileCisternId });
  // gluttony-acid-pool-edge (walkway edges throughout -- decorative)
  editor.spawnProp(LEVEL_ID, 'gluttony-acid-pool-edge', 19, 52, { roomId: bileCisternId });
  // gluttony-bile-pool-surface (acid floor areas between walkways)
  editor.spawnProp(LEVEL_ID, 'gluttony-bile-pool-surface', 20, 54, { roomId: bileCisternId });
  // 2x gluttony-mucus-web (walkway corners)
  editor.spawnProp(LEVEL_ID, 'gluttony-mucus-web', 15, 54, { roomId: bileCisternId });
  editor.spawnProp(LEVEL_ID, 'gluttony-mucus-web', 24, 53, { roomId: bileCisternId });
  // 2x gluttony-stomach-wall-growth (wall surfaces)
  editor.spawnProp(LEVEL_ID, 'gluttony-stomach-wall-growth', 14, 54, {
    roomId: bileCisternId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 0.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.8,
    },
  });
  editor.spawnProp(LEVEL_ID, 'gluttony-stomach-wall-growth', 25, 56, {
    roomId: bileCisternId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 0.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.8,
    },
  });

  // --- Gut Arena (bounds: 14, 64, 12, 12) ---
  //   Interior: x=[15..24], z=[65..74]
  //   From 3D Spatial Design: 17 assets
  // Structural: 2x gluttony-bloated-arch, 4x gluttony-organic-column
  editor.spawnProp(LEVEL_ID, 'gluttony-bloated-arch', 20, 64, { roomId: gutArenaId }); // north entrance
  editor.spawnProp(LEVEL_ID, 'gluttony-bloated-arch', 20, 75, { roomId: gutArenaId }); // south exit
  editor.spawnProp(LEVEL_ID, 'gluttony-organic-column', 15, 65, { roomId: gutArenaId }); // outer corners
  editor.spawnProp(LEVEL_ID, 'gluttony-organic-column', 25, 65, { roomId: gutArenaId });
  editor.spawnProp(LEVEL_ID, 'gluttony-organic-column', 15, 75, { roomId: gutArenaId });
  editor.spawnProp(LEVEL_ID, 'gluttony-organic-column', 25, 75, { roomId: gutArenaId });
  // 4x gluttony-lantern-wall-green (N/S/E/W walls)
  editor.spawnProp(LEVEL_ID, 'gluttony-lantern-wall-green', 14, 65, {
    roomId: gutArenaId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'gluttony-lantern-wall-green', 25, 65, {
    roomId: gutArenaId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'gluttony-lantern-wall-green', 14, 75, {
    roomId: gutArenaId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'gluttony-lantern-wall-green', 25, 75, {
    roomId: gutArenaId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 4x gluttony-slop-bucket (outer ring, one per quadrant)
  editor.spawnProp(LEVEL_ID, 'gluttony-slop-bucket', 16, 66, { roomId: gutArenaId });
  editor.spawnProp(LEVEL_ID, 'gluttony-slop-bucket', 23, 66, { roomId: gutArenaId });
  editor.spawnProp(LEVEL_ID, 'gluttony-slop-bucket', 16, 73, { roomId: gutArenaId });
  editor.spawnProp(LEVEL_ID, 'gluttony-slop-bucket', 23, 73, { roomId: gutArenaId });
  // 2x bile-cauldron (middle ring, N and S bridges)
  editor.spawnProp(LEVEL_ID, 'bile-cauldron', 20, 67, { roomId: gutArenaId });
  editor.spawnProp(LEVEL_ID, 'bile-cauldron', 20, 73, { roomId: gutArenaId });
  // gluttony-acid-pool-edge (ring channel edges -- decorative)
  editor.spawnProp(LEVEL_ID, 'gluttony-acid-pool-edge', 19, 68, { roomId: gutArenaId });
  // gluttony-bile-pool-surface (acid channels between rings)
  editor.spawnProp(LEVEL_ID, 'gluttony-bile-pool-surface', 19, 70, { roomId: gutArenaId });
  // 2x gluttony-maggot-mound (inner ring, submerges wave 2)
  editor.spawnProp(LEVEL_ID, 'gluttony-maggot-mound', 18, 69, { roomId: gutArenaId });
  editor.spawnProp(LEVEL_ID, 'gluttony-maggot-mound', 22, 69, { roomId: gutArenaId });
  // 2x gluttony-fungus-pillar (middle ring, sightline cover)
  editor.spawnProp(LEVEL_ID, 'gluttony-fungus-pillar', 17, 67, { roomId: gutArenaId });
  editor.spawnProp(LEVEL_ID, 'gluttony-fungus-pillar', 23, 71, { roomId: gutArenaId });
  // 3x gluttony-dripping-stalactite (ceiling, organic horror)
  editor.spawnProp(LEVEL_ID, 'gluttony-dripping-stalactite', 20, 66, { roomId: gutArenaId });
  editor.spawnProp(LEVEL_ID, 'gluttony-dripping-stalactite', 20, 74, { roomId: gutArenaId });
  editor.spawnProp(LEVEL_ID, 'gluttony-dripping-stalactite', 16, 70, { roomId: gutArenaId });
  // 2x gluttony-stomach-wall-growth (walls, foreshadow boss room)
  editor.spawnProp(LEVEL_ID, 'gluttony-stomach-wall-growth', 14, 68, {
    roomId: gutArenaId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 0.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.7,
    },
  });
  editor.spawnProp(LEVEL_ID, 'gluttony-stomach-wall-growth', 25, 72, {
    roomId: gutArenaId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 0.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.7,
    },
  });

  // --- Pantry (bounds: 3, 32, 6, 6) ---
  //   Interior: x=[4..7], z=[33..36]
  //   From 3D Spatial Design: 8 assets
  // Structural: 1x gluttony-bloated-arch
  editor.spawnProp(LEVEL_ID, 'gluttony-bloated-arch', 8, 35, { roomId: pantryId }); // east entry from Feast Hall
  // 4x gluttony-lantern-wall-green (corners, warmer light)
  editor.spawnProp(LEVEL_ID, 'gluttony-lantern-wall-green', 3, 32, {
    roomId: pantryId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.8,
    },
  });
  editor.spawnProp(LEVEL_ID, 'gluttony-lantern-wall-green', 8, 32, {
    roomId: pantryId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.8,
    },
  });
  editor.spawnProp(LEVEL_ID, 'gluttony-lantern-wall-green', 3, 37, {
    roomId: pantryId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.8,
    },
  });
  editor.spawnProp(LEVEL_ID, 'gluttony-lantern-wall-green', 8, 37, {
    roomId: pantryId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.8,
    },
  });
  // 3x gluttony-rotting-barrel (clean sealed barrels)
  editor.spawnProp(LEVEL_ID, 'gluttony-rotting-barrel', 4, 34, { roomId: pantryId });
  editor.spawnProp(LEVEL_ID, 'gluttony-rotting-barrel', 4, 36, { roomId: pantryId });
  editor.spawnProp(LEVEL_ID, 'gluttony-rotting-barrel', 7, 36, { roomId: pantryId });
  // 1x gluttony-shelf-arch (north wall, holds lore scroll)
  editor.spawnProp(LEVEL_ID, 'gluttony-shelf-arch', 5, 32, {
    roomId: pantryId,
    surfaceAnchor: {
      face: 'north',
      offsetX: 0,
      offsetY: 1.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.9,
    },
  });
  // 1x gluttony-rotten-crate (sealed supply crate, intact)
  editor.spawnProp(LEVEL_ID, 'gluttony-rotten-crate', 6, 34, { roomId: pantryId });
  // 1x gluttony-pantry-chest (hero piece, treasure chest)
  editor.spawnProp(LEVEL_ID, 'gluttony-pantry-chest', 6, 36, { roomId: pantryId });

  // --- Vorago's Maw (bounds: 13, 80, 14, 14) ---
  //   Interior: x=[14..25], z=[81..92]
  //   From 3D Spatial Design: 17+ assets
  // Structural: 1x gluttony-flesh-door-frame, 2x gluttony-organic-column (entry)
  editor.spawnProp(LEVEL_ID, 'gluttony-flesh-door-frame', 20, 80, { roomId: voragosMawId }); // mouth-shaped entry
  editor.spawnProp(LEVEL_ID, 'gluttony-organic-column', 14, 82, { roomId: voragosMawId }); // flanking entry
  editor.spawnProp(LEVEL_ID, 'gluttony-organic-column', 26, 82, { roomId: voragosMawId });
  // 4x gluttony-lantern-wall-green (N/S/E/W high, pulsing pink-red recolor)
  editor.spawnProp(LEVEL_ID, 'gluttony-lantern-wall-green', 13, 81, {
    roomId: voragosMawId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'gluttony-lantern-wall-green', 26, 81, {
    roomId: voragosMawId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'gluttony-lantern-wall-green', 13, 93, {
    roomId: voragosMawId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'gluttony-lantern-wall-green', 26, 93, {
    roomId: voragosMawId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 2x bile-cauldron (entry ledge, flanking entrance)
  editor.spawnProp(LEVEL_ID, 'bile-cauldron', 15, 81, { roomId: voragosMawId });
  editor.spawnProp(LEVEL_ID, 'bile-cauldron', 25, 81, { roomId: voragosMawId });
  // 2x gluttony-rope-tendril (ceiling-hung, near platform)
  editor.spawnProp(LEVEL_ID, 'gluttony-rope-tendril', 17, 84, { roomId: voragosMawId });
  editor.spawnProp(LEVEL_ID, 'gluttony-rope-tendril', 23, 84, { roomId: voragosMawId });
  // 1x gluttony-slop-bucket (central platform, tipped)
  editor.spawnProp(LEVEL_ID, 'gluttony-slop-bucket', 19, 84, { roomId: voragosMawId });
  // 4x gluttony-stomach-wall-growth (walls, pulsing)
  editor.spawnProp(LEVEL_ID, 'gluttony-stomach-wall-growth', 13, 85, {
    roomId: voragosMawId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 0.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'gluttony-stomach-wall-growth', 26, 85, {
    roomId: voragosMawId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 0.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'gluttony-stomach-wall-growth', 13, 89, {
    roomId: voragosMawId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 0.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'gluttony-stomach-wall-growth', 26, 89, {
    roomId: voragosMawId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 0.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // gluttony-acid-pool-edge (platform edges and entry ledge edges)
  editor.spawnProp(LEVEL_ID, 'gluttony-acid-pool-edge', 18, 83, { roomId: voragosMawId });
  // gluttony-bile-pool-surface (full acid floor between structures)
  editor.spawnProp(LEVEL_ID, 'gluttony-bile-pool-surface', 20, 86, { roomId: voragosMawId });
  // 3x gluttony-dripping-stalactite (ceiling, dripping into acid)
  editor.spawnProp(LEVEL_ID, 'gluttony-dripping-stalactite', 18, 82, { roomId: voragosMawId });
  editor.spawnProp(LEVEL_ID, 'gluttony-dripping-stalactite', 22, 82, { roomId: voragosMawId });
  editor.spawnProp(LEVEL_ID, 'gluttony-dripping-stalactite', 20, 92, { roomId: voragosMawId });
  // 2x gluttony-meat-carcass (wall-hung, partially digested)
  editor.spawnProp(LEVEL_ID, 'gluttony-meat-carcass', 14, 88, {
    roomId: voragosMawId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.9,
    },
  });
  editor.spawnProp(LEVEL_ID, 'gluttony-meat-carcass', 26, 88, {
    roomId: voragosMawId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.9,
    },
  });
  // 2x gluttony-maggot-mound (small platforms)
  editor.spawnProp(LEVEL_ID, 'gluttony-maggot-mound', 16, 84, { roomId: voragosMawId });
  editor.spawnProp(LEVEL_ID, 'gluttony-maggot-mound', 24, 90, { roomId: voragosMawId });
  // 2x gluttony-mucus-web (wall-to-platform bridging)
  editor.spawnProp(LEVEL_ID, 'gluttony-mucus-web', 15, 86, { roomId: voragosMawId });
  editor.spawnProp(LEVEL_ID, 'gluttony-mucus-web', 25, 86, { roomId: voragosMawId });
  // 2x gluttony-rope-tendril (ceiling-hung over platform)
  editor.spawnProp(LEVEL_ID, 'gluttony-rope-tendril', 19, 88, { roomId: voragosMawId });
  editor.spawnProp(LEVEL_ID, 'gluttony-rope-tendril', 21, 88, { roomId: voragosMawId });
  // 2x gluttony-organic-column (central platform edges, structural cover)
  editor.spawnProp(LEVEL_ID, 'gluttony-organic-column', 18, 85, { roomId: voragosMawId });
  editor.spawnProp(LEVEL_ID, 'gluttony-organic-column', 22, 85, { roomId: voragosMawId });

  // =========================================================================
  // 5d. DECALS (bile/organic seepage stains, acid erosion cracks)
  // =========================================================================

  // --- Gullet (bounds: 17, 2, 6, 14) ---
  // Organic moisture seeping through walls
  editor.placeDecals(LEVEL_ID, gulletId, [
    { type: DECAL_TYPES.WATER_STAIN, x: 17, z: 5, surface: 'wall', opacity: 0.5 },
    { type: DECAL_TYPES.WATER_STAIN, x: 22, z: 9, surface: 'wall', opacity: 0.5 },
    { type: DECAL_TYPES.WATER_STAIN, x: 17, z: 12, surface: 'wall', opacity: 0.4 },
  ]);

  // --- Feast Hall (bounds: 13, 20, 14, 10) ---
  // Moisture everywhere — organic theme, spilled slop
  editor.placeDecals(LEVEL_ID, feastHallId, [
    { type: DECAL_TYPES.WATER_STAIN, x: 13, z: 23, surface: 'wall', opacity: 0.6 },
    { type: DECAL_TYPES.WATER_STAIN, x: 26, z: 25, surface: 'wall', opacity: 0.5 },
    { type: DECAL_TYPES.WATER_STAIN, x: 20, z: 28, opacity: 0.4 },
  ]);

  // --- Pantry (bounds: 3, 32, 6, 6) ---
  // Relatively clean — just light moisture
  editor.placeDecals(LEVEL_ID, pantryId, [
    { type: DECAL_TYPES.WATER_STAIN, x: 3, z: 35, surface: 'wall', opacity: 0.4 },
  ]);

  // --- Larder (bounds: 15, 34, 10, 12) ---
  // Dripping moisture from above, seepage on walls
  editor.placeDecals(LEVEL_ID, larderId, [
    { type: DECAL_TYPES.WATER_STAIN, x: 15, z: 37, surface: 'wall', opacity: 0.5 },
    { type: DECAL_TYPES.WATER_STAIN, x: 24, z: 40, surface: 'wall', opacity: 0.5 },
    { type: DECAL_TYPES.WATER_STAIN, x: 19, z: 44, opacity: 0.4 },
  ]);

  // --- Bile Cistern (bounds: 14, 50, 12, 10) ---
  // Acid erosion cracks on walkways, bile stains liberally
  editor.placeDecals(LEVEL_ID, bileCisternId, [
    { type: DECAL_TYPES.WATER_STAIN, x: 14, z: 53, surface: 'wall', opacity: 0.6 },
    { type: DECAL_TYPES.WATER_STAIN, x: 25, z: 55, surface: 'wall', opacity: 0.5 },
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 17, z: 52, opacity: 0.5 },
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 23, z: 57, opacity: 0.5 },
  ]);

  // --- Gut Arena (bounds: 14, 64, 12, 12) ---
  // Acid erosion, organic seepage
  editor.placeDecals(LEVEL_ID, gutArenaId, [
    { type: DECAL_TYPES.WATER_STAIN, x: 14, z: 68, surface: 'wall', opacity: 0.5 },
    { type: DECAL_TYPES.WATER_STAIN, x: 25, z: 72, surface: 'wall', opacity: 0.5 },
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 19, z: 69, opacity: 0.4 },
  ]);

  // --- Vorago's Maw (bounds: 13, 80, 14, 14) ---
  // Heavy moisture, acid erosion everywhere
  editor.placeDecals(LEVEL_ID, voragosMawId, [
    { type: DECAL_TYPES.WATER_STAIN, x: 13, z: 84, surface: 'wall', opacity: 0.6 },
    { type: DECAL_TYPES.WATER_STAIN, x: 26, z: 87, surface: 'wall', opacity: 0.6 },
    { type: DECAL_TYPES.WATER_STAIN, x: 20, z: 92, opacity: 0.5 },
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 18, z: 83, opacity: 0.5 },
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 22, z: 90, opacity: 0.5 },
  ]);

  // =========================================================================
  // 6. TRIGGERS (from "Triggers" table)
  // =========================================================================
  //
  // NOTE: T7-T11 (Gut Arena arena lock/wave/unlock) were created by setupArenaWaves() above.
  //
  // Remaining triggers:

  // T1: ambientChange on Gullet entry (poison pickups active)
  //   Zone from table: (17, 2, 6, 4)
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 17,
    zoneZ: 2,
    zoneW: 6,
    zoneH: 4,
    roomId: gulletId,
    once: true,
    actionData: {
      poisonPickupsActive: true,
      text: 'The air is thick with the smell of rot and plenty...',
    },
  });

  // T2: spawnWave on Feast Hall entry
  //   Zone from table: (13, 20, 14, 2)
  editor.ambush(
    LEVEL_ID,
    { x: 13, z: 20, w: 14, h: 2 },
    [
      { type: ENEMY_TYPES.HELLGOAT, x: 14, z: 23 },
      { type: ENEMY_TYPES.HELLGOAT, x: 25, z: 23 },
      { type: ENEMY_TYPES.HELLGOAT, x: 14, z: 27 },
      { type: ENEMY_TYPES.HELLGOAT, x: 25, z: 27 },
    ],
    { roomId: feastHallId },
  );

  // T3: poisonSeed -- marks 50% of health pickups as poisoned in Feast Hall
  //   Zone from table: (13, 20, 14, 10)
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 13,
    zoneZ: 20,
    zoneW: 14,
    zoneH: 10,
    roomId: feastHallId,
    once: true,
    actionData: { poisonSeed: 'feast-hall-poison', ratio: 0.5 },
  });

  // T4: spawnWave on Larder entry
  //   Zone from table: (15, 34, 10, 2)
  editor.ambush(
    LEVEL_ID,
    { x: 15, z: 34, w: 10, h: 2 },
    [
      { type: ENEMY_TYPES.FIRE_GOAT, x: 17, z: 38 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 22, z: 41 },
      { type: ENEMY_TYPES.HELLGOAT, x: 19, z: 43 },
    ],
    { roomId: larderId },
  );

  // T5: spawnWave on Bile Cistern entry
  //   Zone from table: (14, 50, 12, 2)
  editor.ambush(
    LEVEL_ID,
    { x: 14, z: 50, w: 12, h: 2 },
    [
      { type: ENEMY_TYPES.FIRE_GOAT, x: 16, z: 51 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 20, z: 54 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 24, z: 57 },
    ],
    { roomId: bileCisternId },
  );

  // T6: poisonOverride -- dead-end walkway pickups always poison
  //   Zone from table: (14, 50, 12, 10)
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 14,
    zoneZ: 50,
    zoneW: 12,
    zoneH: 10,
    roomId: bileCisternId,
    once: true,
    actionData: {
      poisonOverride: true,
      positions: [
        [15, 55],
        [24, 54],
      ],
      forced: 'poison',
    },
  });

  // T10: acidRise on Gut Arena wave 1 clear (inner ring submerges)
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 14,
    zoneZ: 64,
    zoneW: 12,
    zoneH: 12,
    roomId: gutArenaId,
    once: true,
    actionData: {
      innerChannel: 'widen',
      amount: 1,
      text: 'The acid rises...',
      condition: 'wave1Clear',
    },
  });

  // T12: bossIntro -- player enters Vorago's Maw entrance zone
  //   Zone from table: (17, 81, 6, 2)
  editor.bossIntro(
    LEVEL_ID,
    { x: 17, z: 81, w: 6, h: 2 },
    'Hungry, little goat? Mother will feed you...',
    { roomId: voragosMawId },
  );

  // T13: lockDoors on boss intro (with 3s delay)
  //   Zone from table: (17, 81, 6, 2)
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.LOCK_DOORS,
    zoneX: 17,
    zoneZ: 81,
    zoneW: 6,
    zoneH: 2,
    roomId: voragosMawId,
    once: true,
    delay: 3,
  });

  // T14: bossPhase when boss HP < 50% (platform fragments)
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 13,
    zoneZ: 80,
    zoneW: 14,
    zoneH: 14,
    roomId: voragosMawId,
    once: true,
    actionData: {
      condition: 'bossHpBelow50',
      phase: 2,
      action: 'fragmentPlatform',
      chunks: 6,
    },
  });

  // T15: bossPhase when boss HP < 25% (inhale wind)
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 13,
    zoneZ: 80,
    zoneW: 14,
    zoneH: 14,
    roomId: voragosMawId,
    once: true,
    actionData: {
      condition: 'bossHpBelow25',
      phase: 3,
      action: 'inhaleWind',
      windIntensity: 0.8,
      windDir: 'toward_boss',
    },
  });

  // T16: ambientChange when boss HP < 50% (fog thickens)
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 13,
    zoneZ: 80,
    zoneW: 14,
    zoneH: 14,
    roomId: voragosMawId,
    once: true,
    actionData: { condition: 'bossHpBelow50', fogDensity: 0.06 },
  });

  // T17: ambientChange when boss HP < 25% (fog maxes out)
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 13,
    zoneZ: 80,
    zoneW: 14,
    zoneH: 14,
    roomId: voragosMawId,
    once: true,
    actionData: { condition: 'bossHpBelow25', fogDensity: 0.08 },
  });

  // =========================================================================
  // 7. ENVIRONMENT ZONES (from "Environment Zones" table)
  // =========================================================================

  // Feast Hall poison aura: 50% chance health pickups are poisoned
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.ILLUSION, // Poison aura mapped to ILLUSION type
    boundsX: 13,
    boundsZ: 20,
    boundsW: 14,
    boundsH: 10,
    intensity: 0.5,
  });

  // Bile Cistern acid floor: green acid, 3 DPS
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.FIRE, // Acid mapped to FIRE/lava type
    boundsX: 14,
    boundsZ: 50,
    boundsW: 12,
    boundsH: 10,
    intensity: 1.0,
  });

  // Boss acid floor: green acid, 3 DPS
  //   Bounds: (13, 82, 14, 12) -- excludes entry ledge at z=80-81
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.FIRE,
    boundsX: 13,
    boundsZ: 82,
    boundsW: 14,
    boundsH: 12,
    intensity: 1.0,
  });

  // Boss inhale wind (phase 3): toward boss center
  //   Bounds: (13, 80, 14, 14), intensity 0.8
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.WIND,
    boundsX: 13,
    boundsZ: 80,
    boundsW: 14,
    boundsH: 14,
    intensity: 0.8,
    directionX: 0,
    directionZ: 1, // Toward south (toward boss at z=87)
  });

  // Global moisture: wet surfaces, dripping sounds
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.WATER,
    boundsX: 0,
    boundsZ: 0,
    boundsW: 40,
    boundsH: 96,
    intensity: 0.4,
  });

  // =========================================================================
  // 8. PLAYER SPAWN (from "Player Spawn" section)
  // =========================================================================
  //   Position: (20, 4) -- center of Gullet's first wide section
  //   Facing: pi (south -- facing toward Feast Hall)

  editor.setPlayerSpawn(LEVEL_ID, 20, 4, Math.PI);

  // =========================================================================
  // EXPANSION — New rooms, connections, enemies, triggers, env zones
  // =========================================================================
  //
  // Grid occupied by original rooms:
  //   Gullet:       x=17-22, z=2-15
  //   Feast Hall:   x=13-26, z=20-29
  //   Pantry:       x=3-8,   z=32-37
  //   Larder:       x=15-24, z=34-45
  //   Bile Cistern: x=14-25, z=50-59
  //   Gut Arena:    x=14-25, z=64-75
  //   Vorago's Maw: x=13-26, z=80-93
  //
  // New rooms placed in open areas:
  //   Gorge Pit:      x=28, z=22, w=10, h=8   (east of Feast Hall)
  //   Maggot Tunnels: x=28, z=34, w=10, h=12  (east of Larder)
  //   Acid Vats:      x=28, z=50, w=10, h=10  (east of Bile Cistern)
  //   Bloat Cavern:   x=8,  z=98, w=22, h=16  (south of Maw, extended grid)
  //   Fleshy Descent: x=13, z=118, w=14, h=14 (deep south gauntlet)
  // =========================================================================

  // ── Expansion Room A: Gorge Pit ──────────────────────────────────────────
  // Eastern overflow chamber off the Feast Hall — a pit where the gluttonous
  // fell and gorged themselves to immobility.
  // Bounds: x=28-37, z=22-29  (clear of all existing rooms)

  const gorgePitId = editor.room(LEVEL_ID, 'gorge_pit', 28, 22, 10, 8, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 7,
    floorTexture: 'ground',
    wallTexture: 'leather',
    fillRule: {
      type: 'scatter',
      props: ['gluttony-maggot-mound', 'gluttony-slop-bucket', 'gluttony-rotten-crate'],
      density: 0.3,
    },
  });

  // ── Expansion Room B: Maggot Tunnels ─────────────────────────────────────
  // East of the Larder — a network of organic tunnels seething with maggots.
  // Bounds: x=28-37, z=34-45  (clear of Larder at x=15-24)

  const maggotTunnelsId = editor.room(LEVEL_ID, 'maggot_tunnels', 28, 34, 10, 12, {
    roomType: ROOM_TYPES.CORRIDOR,
    elevation: 0,
    sortOrder: 8,
    floorTexture: 'leather',
    wallTexture: 'ground',
    fillRule: {
      type: 'scatter',
      props: ['gluttony-mucus-web', 'gluttony-rope-tendril', 'gluttony-dripping-stalactite'],
      density: 0.25,
    },
  });

  // ── Expansion Room C: Acid Vats ──────────────────────────────────────────
  // East of the Bile Cistern — industrial acid processing chambers.
  // Bounds: x=28-37, z=50-59  (clear of Bile Cistern at x=14-25)

  const acidVatsId = editor.room(LEVEL_ID, 'acid_vats', 28, 50, 10, 10, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 9,
    floorTexture: 'leather',
    wallTexture: 'leather',
    fillRule: {
      type: 'scatter',
      props: [
        'gluttony-acid-pool-edge',
        'bile-cauldron',
        'gluttony-bile-pool-surface',
        'gluttony-fungus-pillar',
      ],
      density: 0.2,
    },
  });

  // ── Expansion Room D: Bloat Cavern ───────────────────────────────────────
  // South of Vorago's Maw — a vast cavern of bloated flesh and excess.
  // The main post-boss expansion corridor.
  // Bounds: x=8-29, z=96-111  (directly adjacent to Maw which ends at z=93)

  const bloatCavernId = editor.room(LEVEL_ID, 'bloat_cavern', 8, 96, 22, 16, {
    roomType: ROOM_TYPES.ARENA,
    elevation: 0,
    sortOrder: 10,
    floorTexture: 'leather',
    wallTexture: 'leather',
    fillRule: {
      type: 'scatter',
      props: [
        'gluttony-stomach-wall-growth',
        'gluttony-maggot-mound',
        'gluttony-organic-column',
        'gluttony-bloated-arch',
      ],
      density: 0.18,
    },
  });

  // ── Expansion Room E: Fleshy Descent ─────────────────────────────────────
  // Deepest chamber — the true belly of the beast.
  // Final gauntlet before the level transition portal.
  // Bounds: x=13-26, z=112-125  (directly adjacent to Bloat Cavern south wall at z=112)

  const fleshyDescentId = editor.room(LEVEL_ID, 'fleshy_descent', 13, 112, 14, 14, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: -1,
    sortOrder: 11,
    floorTexture: 'ground',
    wallTexture: 'leather',
    fillRule: {
      type: 'scatter',
      props: [
        'gluttony-bile-pool-surface',
        'gluttony-meat-carcass',
        'gluttony-rope-tendril',
        'gluttony-mucus-web',
      ],
      density: 0.22,
    },
  });

  // ── Expansion Connections ─────────────────────────────────────────────────

  // Feast Hall -> Gorge Pit (corridor, width 3, east passage)
  editor.corridor(LEVEL_ID, feastHallId, gorgePitId, 3);

  // Gorge Pit -> Maggot Tunnels (corridor, width 3, south descent)
  editor.corridor(LEVEL_ID, gorgePitId, maggotTunnelsId, 3);

  // Maggot Tunnels -> Acid Vats (corridor, width 3, south extension)
  editor.corridor(LEVEL_ID, maggotTunnelsId, acidVatsId, 3);

  // Acid Vats -> Bile Cistern (secret connection, width 2 — shortcut back to main path)
  editor.connect(LEVEL_ID, acidVatsId, bileCisternId, {
    connectionType: CONNECTION_TYPES.SECRET,
    corridorWidth: 2,
  });

  // Vorago's Maw -> Bloat Cavern (corridor, width 4, descending from boss room)
  editor.connect(LEVEL_ID, voragosMawId, bloatCavernId, {
    connectionType: CONNECTION_TYPES.STAIRS,
    corridorWidth: 4,
    fromElevation: -1,
    toElevation: 0,
  });

  // Bloat Cavern -> Fleshy Descent (corridor, width 3, descending deeper)
  editor.corridor(LEVEL_ID, bloatCavernId, fleshyDescentId, 3);

  // ── Expansion Enemies: Gorge Pit ─────────────────────────────────────────
  // Room bounds: (28, 22, 10, 8) → interior: x=[29..36], z=[23..28]

  // 3 hellgoats patrolling the feast overflow
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 30, 24, {
    roomId: gorgePitId,
    patrol: [
      { x: 30, z: 24 },
      { x: 35, z: 24 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 33, 26, {
    roomId: gorgePitId,
    patrol: [
      { x: 33, z: 26 },
      { x: 30, z: 26 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 35, 28, {
    roomId: gorgePitId,
  });

  // 2 fire goats on elevated ledges overlooking pit
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 29, 23, {
    roomId: gorgePitId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 36, 27, {
    roomId: gorgePitId,
  });

  // Gorge Pit ambush trigger — enemies rush from the east wall
  editor.ambush(
    LEVEL_ID,
    { x: 28, z: 22, w: 4, h: 4 },
    [
      { type: ENEMY_TYPES.HELLGOAT, x: 30, z: 24 },
      { type: ENEMY_TYPES.HELLGOAT, x: 33, z: 26 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 29, z: 23 },
      { type: ENEMY_TYPES.HELLGOAT, x: 35, z: 28 },
    ],
    { roomId: gorgePitId },
  );

  // ── Expansion Enemies: Maggot Tunnels ────────────────────────────────────
  // Room bounds: (28, 34, 10, 12) → interior: x=[29..36], z=[35..44]

  // Goat Knights guard the narrow tunnels
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 31, 37, {
    roomId: maggotTunnelsId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 34, 41, {
    roomId: maggotTunnelsId,
  });

  // Hellgoats fill the tunnels
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 29, 36, {
    roomId: maggotTunnelsId,
    patrol: [
      { x: 29, z: 36 },
      { x: 29, z: 43 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 36, 38, {
    roomId: maggotTunnelsId,
    patrol: [
      { x: 36, z: 38 },
      { x: 36, z: 44 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 32, 42, {
    roomId: maggotTunnelsId,
  });

  // Maggot Tunnels arena sequence — tight kill box
  editor.setupArenaWaves(LEVEL_ID, maggotTunnelsId, { x: 29, z: 34, w: 9, h: 3 }, [
    // Wave 1: hellgoats and a goat knight swarm the narrow corridor
    [
      { type: ENEMY_TYPES.HELLGOAT, x: 30, z: 36 },
      { type: ENEMY_TYPES.HELLGOAT, x: 35, z: 36 },
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 32, z: 38 },
      { type: ENEMY_TYPES.HELLGOAT, x: 29, z: 40 },
    ],
    // Wave 2: fire goats add ranged harassment in tight space
    [
      { type: ENEMY_TYPES.FIRE_GOAT, x: 30, z: 43 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 35, z: 43 },
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 33, z: 40 },
      { type: ENEMY_TYPES.HELLGOAT, x: 31, z: 37 },
    ],
  ]);

  // ── Expansion Enemies: Acid Vats ─────────────────────────────────────────
  // Room bounds: (28, 50, 10, 10) → interior: x=[29..36], z=[51..58]

  // Fire goats perch on raised vat rims
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 30, 52, {
    roomId: acidVatsId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 35, 55, {
    roomId: acidVatsId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 32, 57, {
    roomId: acidVatsId,
  });

  // Goat Knights guard the vat bridges
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 29, 54, {
    roomId: acidVatsId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 36, 56, {
    roomId: acidVatsId,
  });

  // Acid Vats ambush — enemies emerge from behind the vats
  editor.ambush(
    LEVEL_ID,
    { x: 28, z: 50, w: 5, h: 3 },
    [
      { type: ENEMY_TYPES.FIRE_GOAT, x: 30, z: 52 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 35, z: 55 },
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 29, z: 54 },
      { type: ENEMY_TYPES.HELLGOAT, x: 33, z: 53 },
    ],
    { roomId: acidVatsId },
  );

  // ── Expansion Enemies: Bloat Cavern ──────────────────────────────────────
  // Room bounds: (8, 96, 22, 16) → interior: x=[9..28], z=[97..111]
  // Large open arena — significant enemy density

  // Pre-placed hellgoats patrolling the cavern floor
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 12, 102, {
    roomId: bloatCavernId,
    patrol: [
      { x: 12, z: 102 },
      { x: 12, z: 110 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 20, 100, {
    roomId: bloatCavernId,
    patrol: [
      { x: 20, z: 100 },
      { x: 27, z: 100 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 25, 106, {
    roomId: bloatCavernId,
    patrol: [
      { x: 25, z: 106 },
      { x: 25, z: 111 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 15, 109, {
    roomId: bloatCavernId,
  });

  // Goat Knights guarding the center formation
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 19, 104, {
    roomId: bloatCavernId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 22, 108, {
    roomId: bloatCavernId,
  });

  // Fire Goats on elevated flanks
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 10, 101, {
    roomId: bloatCavernId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 27, 103, {
    roomId: bloatCavernId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 10, 111, {
    roomId: bloatCavernId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 27, 111, {
    roomId: bloatCavernId,
  });

  // Bloat Cavern arena waves — the grand post-boss gauntlet
  editor.setupArenaWaves(LEVEL_ID, bloatCavernId, { x: 16, z: 98, w: 6, h: 4 }, [
    // Wave 1: Spread hellgoats flood the open floor
    [
      { type: ENEMY_TYPES.HELLGOAT, x: 11, z: 100 },
      { type: ENEMY_TYPES.HELLGOAT, x: 17, z: 100 },
      { type: ENEMY_TYPES.HELLGOAT, x: 23, z: 100 },
      { type: ENEMY_TYPES.HELLGOAT, x: 26, z: 104 },
      { type: ENEMY_TYPES.HELLGOAT, x: 10, z: 108 },
      { type: ENEMY_TYPES.HELLGOAT, x: 27, z: 110 },
    ],
    // Wave 2: Goat Knights and Fire Goats — elite reinforcements
    [
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 14, z: 103 },
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 24, z: 103 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 10, z: 106 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 27, z: 106 },
      { type: ENEMY_TYPES.HELLGOAT, x: 19, z: 111 },
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 19, z: 106 },
    ],
    // Wave 3: Final surge — all enemy types converge
    [
      { type: ENEMY_TYPES.HELLGOAT, x: 12, z: 99 },
      { type: ENEMY_TYPES.HELLGOAT, x: 26, z: 99 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 9, z: 104 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 28, z: 104 },
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 19, z: 102 },
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 13, z: 110 },
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 25, z: 110 },
    ],
  ]);

  // ── Expansion Enemies: Fleshy Descent ────────────────────────────────────
  // Room bounds: (13, 112, 14, 14) → interior: x=[14..25], z=[113..124]

  // Elite guard — Goat Knights and Fire Goats in the deepest chamber
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 16, 115, {
    roomId: fleshyDescentId,
    patrol: [
      { x: 16, z: 115 },
      { x: 16, z: 122 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 23, 115, {
    roomId: fleshyDescentId,
    patrol: [
      { x: 23, z: 115 },
      { x: 23, z: 122 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 19, 119, {
    roomId: fleshyDescentId,
  });

  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 14, 114, {
    roomId: fleshyDescentId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 25, 114, {
    roomId: fleshyDescentId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 14, 123, {
    roomId: fleshyDescentId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 25, 123, {
    roomId: fleshyDescentId,
  });

  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 19, 113, {
    roomId: fleshyDescentId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 14, 119, {
    roomId: fleshyDescentId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 25, 119, {
    roomId: fleshyDescentId,
  });

  // Fleshy Descent final ambush — the belly locks the player in
  editor.ambush(
    LEVEL_ID,
    { x: 14, z: 112, w: 12, h: 3 },
    [
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 16, z: 115 },
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 23, z: 115 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 14, z: 114 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 25, z: 114 },
      { type: ENEMY_TYPES.HELLGOAT, x: 19, z: 119 },
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 19, z: 122 },
    ],
    { roomId: fleshyDescentId },
  );

  // ── Expansion Pickups ─────────────────────────────────────────────────────

  // Gorge Pit pickups (mostly health — abundance trap)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 31, 24);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 34, 27);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 32, 26);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 36, 28);

  // Maggot Tunnels pickups (sparse — hard earned)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 31, 37);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 34, 42);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 32, 40);

  // Acid Vats pickups
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 30, 53);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 35, 56);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 33, 58);

  // Bloat Cavern pickups (generous — recovery after boss)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 13, 101);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 25, 101);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 19, 105);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 12, 109);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 26, 109);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 19, 111);

  // Fleshy Descent pickups (critical resupply before final push)
  // Room bounds: (13, 112, 14, 14) → interior: x=[14..25], z=[113..124]
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 15, 114);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 19, 116);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 24, 114);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 15, 122);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 24, 122);

  // ── Expansion Props ───────────────────────────────────────────────────────

  // --- Gorge Pit (bounds: 28, 22, 10, 8) ---
  editor.spawnProp(LEVEL_ID, 'gluttony-bloated-arch', 33, 22, { roomId: gorgePitId });
  editor.spawnProp(LEVEL_ID, 'gluttony-bloated-arch', 33, 29, { roomId: gorgePitId });
  editor.spawnProp(LEVEL_ID, 'feast-table', 33, 25, { roomId: gorgePitId });
  editor.spawnProp(LEVEL_ID, 'gluttony-overflowing-goblet', 31, 25, { roomId: gorgePitId });
  editor.spawnProp(LEVEL_ID, 'gluttony-overflowing-goblet', 35, 25, { roomId: gorgePitId });
  editor.spawnProp(LEVEL_ID, 'gluttony-bone-plate', 32, 24, { roomId: gorgePitId });
  editor.spawnProp(LEVEL_ID, 'gluttony-bone-plate', 34, 26, { roomId: gorgePitId });
  editor.spawnProp(LEVEL_ID, 'gluttony-meat-carcass', 29, 23, { roomId: gorgePitId });
  editor.spawnProp(LEVEL_ID, 'gluttony-meat-carcass', 36, 27, { roomId: gorgePitId });
  editor.spawnProp(LEVEL_ID, 'bile-cauldron', 30, 27, { roomId: gorgePitId });
  editor.spawnProp(LEVEL_ID, 'gluttony-lantern-wall-green', 28, 22, {
    roomId: gorgePitId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'gluttony-lantern-wall-green', 37, 28, {
    roomId: gorgePitId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });

  // --- Maggot Tunnels (bounds: 28, 34, 10, 12) ---
  editor.spawnProp(LEVEL_ID, 'gluttony-bloated-arch', 33, 34, { roomId: maggotTunnelsId });
  editor.spawnProp(LEVEL_ID, 'gluttony-bloated-arch', 33, 45, { roomId: maggotTunnelsId });
  editor.spawnProp(LEVEL_ID, 'gluttony-dripping-stalactite', 31, 36, { roomId: maggotTunnelsId });
  editor.spawnProp(LEVEL_ID, 'gluttony-dripping-stalactite', 34, 40, { roomId: maggotTunnelsId });
  editor.spawnProp(LEVEL_ID, 'gluttony-dripping-stalactite', 30, 43, { roomId: maggotTunnelsId });
  editor.spawnProp(LEVEL_ID, 'gluttony-mucus-web', 29, 37, { roomId: maggotTunnelsId });
  editor.spawnProp(LEVEL_ID, 'gluttony-mucus-web', 36, 41, { roomId: maggotTunnelsId });
  editor.spawnProp(LEVEL_ID, 'gluttony-maggot-mound', 32, 38, { roomId: maggotTunnelsId });
  editor.spawnProp(LEVEL_ID, 'gluttony-maggot-mound', 35, 43, { roomId: maggotTunnelsId });
  editor.spawnProp(LEVEL_ID, 'gluttony-rope-tendril', 33, 37, { roomId: maggotTunnelsId });
  editor.spawnProp(LEVEL_ID, 'gluttony-rope-tendril', 30, 41, { roomId: maggotTunnelsId });
  editor.spawnProp(LEVEL_ID, 'gluttony-stomach-wall-growth', 28, 39, {
    roomId: maggotTunnelsId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 0.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.8,
    },
  });
  editor.spawnProp(LEVEL_ID, 'gluttony-stomach-wall-growth', 37, 43, {
    roomId: maggotTunnelsId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 0.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.8,
    },
  });

  // --- Acid Vats (bounds: 28, 50, 10, 10) ---
  editor.spawnProp(LEVEL_ID, 'gluttony-bloated-arch', 33, 50, { roomId: acidVatsId });
  editor.spawnProp(LEVEL_ID, 'gluttony-bloated-arch', 33, 59, { roomId: acidVatsId });
  editor.spawnProp(LEVEL_ID, 'bile-cauldron', 30, 52, { roomId: acidVatsId });
  editor.spawnProp(LEVEL_ID, 'bile-cauldron', 35, 54, { roomId: acidVatsId });
  editor.spawnProp(LEVEL_ID, 'bile-cauldron', 31, 57, { roomId: acidVatsId });
  editor.spawnProp(LEVEL_ID, 'gluttony-acid-pool-edge', 32, 53, { roomId: acidVatsId });
  editor.spawnProp(LEVEL_ID, 'gluttony-acid-pool-edge', 34, 56, { roomId: acidVatsId });
  editor.spawnProp(LEVEL_ID, 'gluttony-bile-pool-surface', 33, 55, { roomId: acidVatsId });
  editor.spawnProp(LEVEL_ID, 'gluttony-fungus-pillar', 29, 51, { roomId: acidVatsId });
  editor.spawnProp(LEVEL_ID, 'gluttony-fungus-pillar', 36, 58, { roomId: acidVatsId });
  editor.spawnProp(LEVEL_ID, 'gluttony-lantern-wall-green', 28, 50, {
    roomId: acidVatsId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'gluttony-lantern-wall-green', 37, 58, {
    roomId: acidVatsId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });

  // --- Bloat Cavern (bounds: 8, 96, 22, 16) ---
  // Interior: x=[9..28], z=[97..111]
  editor.spawnProp(LEVEL_ID, 'gluttony-bloated-arch', 19, 96, { roomId: bloatCavernId });
  editor.spawnProp(LEVEL_ID, 'gluttony-bloated-arch', 19, 111, { roomId: bloatCavernId });
  editor.spawnProp(LEVEL_ID, 'gluttony-organic-column', 10, 98, { roomId: bloatCavernId });
  editor.spawnProp(LEVEL_ID, 'gluttony-organic-column', 28, 98, { roomId: bloatCavernId });
  editor.spawnProp(LEVEL_ID, 'gluttony-organic-column', 10, 109, { roomId: bloatCavernId });
  editor.spawnProp(LEVEL_ID, 'gluttony-organic-column', 28, 109, { roomId: bloatCavernId });
  editor.spawnProp(LEVEL_ID, 'gluttony-organic-column', 19, 103, { roomId: bloatCavernId });
  editor.spawnProp(LEVEL_ID, 'bile-cauldron', 13, 101, { roomId: bloatCavernId });
  editor.spawnProp(LEVEL_ID, 'bile-cauldron', 25, 101, { roomId: bloatCavernId });
  editor.spawnProp(LEVEL_ID, 'bile-cauldron', 13, 108, { roomId: bloatCavernId });
  editor.spawnProp(LEVEL_ID, 'bile-cauldron', 25, 108, { roomId: bloatCavernId });
  editor.spawnProp(LEVEL_ID, 'gluttony-meat-carcass', 10, 104, { roomId: bloatCavernId });
  editor.spawnProp(LEVEL_ID, 'gluttony-meat-carcass', 28, 104, { roomId: bloatCavernId });
  editor.spawnProp(LEVEL_ID, 'gluttony-dripping-stalactite', 15, 98, { roomId: bloatCavernId });
  editor.spawnProp(LEVEL_ID, 'gluttony-dripping-stalactite', 23, 98, { roomId: bloatCavernId });
  editor.spawnProp(LEVEL_ID, 'gluttony-dripping-stalactite', 19, 104, { roomId: bloatCavernId });
  editor.spawnProp(LEVEL_ID, 'gluttony-dripping-stalactite', 15, 110, { roomId: bloatCavernId });
  editor.spawnProp(LEVEL_ID, 'gluttony-dripping-stalactite', 23, 110, { roomId: bloatCavernId });
  editor.spawnProp(LEVEL_ID, 'gluttony-stomach-wall-growth', 8, 102, {
    roomId: bloatCavernId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 0.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'gluttony-stomach-wall-growth', 29, 106, {
    roomId: bloatCavernId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 0.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'gluttony-lantern-wall-green', 8, 97, {
    roomId: bloatCavernId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'gluttony-lantern-wall-green', 29, 97, {
    roomId: bloatCavernId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'gluttony-lantern-wall-green', 8, 110, {
    roomId: bloatCavernId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'gluttony-lantern-wall-green', 29, 110, {
    roomId: bloatCavernId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });

  // --- Fleshy Descent (bounds: 13, 112, 14, 14) ---
  // Interior: x=[14..25], z=[113..124]
  editor.spawnProp(LEVEL_ID, 'gluttony-bloated-arch', 20, 112, { roomId: fleshyDescentId });
  editor.spawnProp(LEVEL_ID, 'gluttony-bloated-arch', 20, 125, { roomId: fleshyDescentId });
  editor.spawnProp(LEVEL_ID, 'gluttony-organic-column', 15, 114, { roomId: fleshyDescentId });
  editor.spawnProp(LEVEL_ID, 'gluttony-organic-column', 24, 114, { roomId: fleshyDescentId });
  editor.spawnProp(LEVEL_ID, 'gluttony-organic-column', 15, 123, { roomId: fleshyDescentId });
  editor.spawnProp(LEVEL_ID, 'gluttony-organic-column', 24, 123, { roomId: fleshyDescentId });
  editor.spawnProp(LEVEL_ID, 'gluttony-meat-carcass', 14, 118, {
    roomId: fleshyDescentId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.9,
    },
  });
  editor.spawnProp(LEVEL_ID, 'gluttony-meat-carcass', 26, 118, {
    roomId: fleshyDescentId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.9,
    },
  });
  editor.spawnProp(LEVEL_ID, 'bile-cauldron', 17, 116, { roomId: fleshyDescentId });
  editor.spawnProp(LEVEL_ID, 'bile-cauldron', 22, 122, { roomId: fleshyDescentId });
  editor.spawnProp(LEVEL_ID, 'gluttony-dripping-stalactite', 19, 114, { roomId: fleshyDescentId });
  editor.spawnProp(LEVEL_ID, 'gluttony-dripping-stalactite', 15, 119, { roomId: fleshyDescentId });
  editor.spawnProp(LEVEL_ID, 'gluttony-dripping-stalactite', 24, 119, { roomId: fleshyDescentId });
  editor.spawnProp(LEVEL_ID, 'gluttony-dripping-stalactite', 19, 124, { roomId: fleshyDescentId });
  editor.spawnProp(LEVEL_ID, 'gluttony-stomach-wall-growth', 13, 116, {
    roomId: fleshyDescentId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 0.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'gluttony-stomach-wall-growth', 26, 120, {
    roomId: fleshyDescentId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 0.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'gluttony-lantern-wall-green', 13, 113, {
    roomId: fleshyDescentId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'gluttony-lantern-wall-green', 26, 113, {
    roomId: fleshyDescentId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'gluttony-lantern-wall-green', 13, 124, {
    roomId: fleshyDescentId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'gluttony-lantern-wall-green', 26, 124, {
    roomId: fleshyDescentId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });

  // ── Expansion Decals ──────────────────────────────────────────────────────

  editor.placeDecals(LEVEL_ID, gorgePitId, [
    { type: DECAL_TYPES.WATER_STAIN, x: 28, z: 24, surface: 'wall', opacity: 0.6 },
    { type: DECAL_TYPES.WATER_STAIN, x: 37, z: 27, surface: 'wall', opacity: 0.5 },
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 32, z: 26, opacity: 0.4 },
  ]);

  editor.placeDecals(LEVEL_ID, maggotTunnelsId, [
    { type: DECAL_TYPES.WATER_STAIN, x: 28, z: 37, surface: 'wall', opacity: 0.7 },
    { type: DECAL_TYPES.WATER_STAIN, x: 37, z: 41, surface: 'wall', opacity: 0.6 },
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 33, z: 38, opacity: 0.5 },
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 31, z: 43, opacity: 0.5 },
  ]);

  editor.placeDecals(LEVEL_ID, acidVatsId, [
    { type: DECAL_TYPES.WATER_STAIN, x: 28, z: 53, surface: 'wall', opacity: 0.7 },
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 31, z: 52, opacity: 0.6 },
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 35, z: 57, opacity: 0.6 },
  ]);

  editor.placeDecals(LEVEL_ID, bloatCavernId, [
    { type: DECAL_TYPES.WATER_STAIN, x: 8, z: 101, surface: 'wall', opacity: 0.7 },
    { type: DECAL_TYPES.WATER_STAIN, x: 29, z: 105, surface: 'wall', opacity: 0.7 },
    { type: DECAL_TYPES.WATER_STAIN, x: 19, z: 110, opacity: 0.5 },
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 15, z: 102, opacity: 0.5 },
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 23, z: 107, opacity: 0.5 },
  ]);

  editor.placeDecals(LEVEL_ID, fleshyDescentId, [
    { type: DECAL_TYPES.WATER_STAIN, x: 13, z: 116, surface: 'wall', opacity: 0.8 },
    { type: DECAL_TYPES.WATER_STAIN, x: 26, z: 120, surface: 'wall', opacity: 0.8 },
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 19, z: 118, opacity: 0.6 },
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 16, z: 123, opacity: 0.6 },
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 23, z: 114, opacity: 0.5 },
  ]);

  // ── Expansion Environment Zones ───────────────────────────────────────────

  // Gorge Pit: poison aura (feast overflow, 50% health pickups poisoned)
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.ILLUSION,
    boundsX: 28,
    boundsZ: 22,
    boundsW: 10,
    boundsH: 8,
    intensity: 0.5,
  });

  // Maggot Tunnels: heavy moisture/organic zone
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.WATER,
    boundsX: 28,
    boundsZ: 34,
    boundsW: 10,
    boundsH: 12,
    intensity: 0.8,
  });

  // Acid Vats: acid floor hazard
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.FIRE,
    boundsX: 28,
    boundsZ: 50,
    boundsW: 10,
    boundsH: 10,
    intensity: 1.0,
  });

  // Bloat Cavern: oppressive organic atmosphere
  // Room bounds: (8, 96, 22, 16)
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.WATER,
    boundsX: 8,
    boundsZ: 96,
    boundsW: 22,
    boundsH: 16,
    intensity: 0.6,
  });

  // Fleshy Descent: acid floor puddles and intense moisture
  // Room bounds: (13, 112, 14, 14)
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.FIRE,
    boundsX: 13,
    boundsZ: 114,
    boundsW: 14,
    boundsH: 10,
    intensity: 0.8,
  });

  // ── Expansion Triggers ────────────────────────────────────────────────────

  // Ambient change on entering Gorge Pit (feast overflow music/atmosphere)
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 28,
    zoneZ: 22,
    zoneW: 10,
    zoneH: 3,
    roomId: gorgePitId,
    once: true,
    actionData: {
      text: 'The feast never ends here. You can smell it before you see it...',
      poisonSeed: 'gorge-pit-poison',
      ratio: 0.5,
    },
  });

  // Ambient change on entering Maggot Tunnels
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 28,
    zoneZ: 34,
    zoneW: 10,
    zoneH: 3,
    roomId: maggotTunnelsId,
    once: true,
    actionData: {
      text: 'The walls writhe. Something is alive in here...',
    },
  });

  // Ambient change on entering Acid Vats
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 28,
    zoneZ: 50,
    zoneW: 10,
    zoneH: 3,
    roomId: acidVatsId,
    once: true,
    actionData: {
      text: 'The acid boils in enormous vats. The smell alone strips paint...',
      poisonOverride: true,
      positions: [[35, 56]],
      forced: 'poison',
    },
  });

  // Ambient change on entering Bloat Cavern (post-boss revelation)
  // Room starts at z=96
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 8,
    zoneZ: 96,
    zoneW: 22,
    zoneH: 4,
    roomId: bloatCavernId,
    once: true,
    actionData: {
      text: 'You thought you had reached the bottom. You were wrong.',
    },
  });

  // Ambient change on entering Fleshy Descent (final chamber dread)
  // Room starts at z=112
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 13,
    zoneZ: 112,
    zoneW: 14,
    zoneH: 3,
    roomId: fleshyDescentId,
    once: true,
    actionData: {
      text: 'The belly of gluttony itself. Everything it has consumed, it has kept.',
      fogDensity: 0.07,
    },
  });

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
    throw new Error('Circle 3 (Gluttony) level validation failed');
  }
  console.log('Circle 3 (Gluttony) built successfully');
  if (result.warnings.length > 0) {
    console.log('Warnings:', result.warnings);
  }
}
