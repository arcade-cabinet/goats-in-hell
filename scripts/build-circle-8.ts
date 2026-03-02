#!/usr/bin/env npx tsx
/**
 * Build script for Circle 8: Fraud — The Circle of Deception
 *
 * Translates docs/circles/08-fraud.md into LevelEditor API calls.
 * Run: npx tsx scripts/build-circle-8.ts
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

const LEVEL_ID = 'circle-8-fraud';
const THEME_ID = 'circle-8-fraud';

export async function buildCircle8(dbPath: string) {
  const sqliteDb = new BetterSqlite3(dbPath);
  const db = drizzle(sqliteDb, { schema });
  await migrateAndSeed(db);
  const editor = new LevelEditor(db);

  // =========================================================================
  // 1. THEME (from "Theme Configuration" section)
  // =========================================================================

  editor.createTheme(THEME_ID, {
    name: 'fraud',
    displayName: 'FRAUD — The Circle of Deception',
    primaryWall: MapCell.WALL_STONE,
    accentWalls: [MapCell.WALL_OBSIDIAN],
    fogDensity: 0.03,
    fogColor: '#221810',
    ambientColor: '#ffcc88',
    ambientIntensity: 0.2,
    skyColor: '#1a0e05',
    particleEffect: 'dust_motes',
    enemyTypes: ['shadowGoat', 'hellgoat', 'mimic'],
    enemyDensity: 1.0,
    pickupDensity: 1.5,
  });

  // =========================================================================
  // 2. LEVEL (from "Identity" + "Grid Dimensions" sections)
  // =========================================================================

  editor.createLevel(LEVEL_ID, {
    name: 'Circle 8: Fraud',
    levelType: 'circle',
    width: 60,
    depth: 99, // Boss room extends to z=98
    floor: 8,
    themeId: THEME_ID,
    circleNumber: 8,
    sin: 'Deception',
    guardian: 'Inganno',
  });

  // =========================================================================
  // 3. ROOMS (from "Room Placement" table, in sortOrder)
  // =========================================================================
  //
  // | Room                   | X  | Z  | W  | H  | Type         | Elevation           | sortOrder |
  // | Portico                | 25 |  2 | 10 |  6 | exploration  | 0                   | 0 |
  // | Hall of Mirrors        | 23 | 12 | 14 | 10 | exploration  | 0                   | 1 |
  // | Bolgia of Flatterers   |  8 | 26 | 12 |  8 | exploration  | 0                   | 2 |
  // | Bolgia of Thieves      | 34 | 26 | 10 |  8 | exploration  | 0                   | 3 |
  // | Shifting Maze          | 32 | 38 | 14 | 14 | exploration  | 0                   | 4 |
  // | Counterfeit Arena      | 22 | 56 | 12 | 12 | arena        | 0 (center raised)   | 5 |
  // | Mimic's Den            | 24 | 72 |  8 |  8 | exploration  | 0                   | 6 |
  // | Serenissima            | 36 | 72 |  6 |  6 | secret       | 0                   | 7 |
  // | Inganno's Parlor       | 21 | 84 | 14 | 14 | boss         | -1 (below)          | 8 |

  const porticoId = editor.room(LEVEL_ID, 'portico', 25, 2, 10, 6, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 0,
  });

  const hallOfMirrorsId = editor.room(LEVEL_ID, 'hall_of_mirrors', 23, 12, 14, 10, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 1,
  });

  const bolgiaFlatId = editor.room(LEVEL_ID, 'bolgia_flatterers', 8, 26, 12, 8, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 2,
  });

  const bolgiaThievesId = editor.room(LEVEL_ID, 'bolgia_thieves', 34, 26, 10, 8, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 3,
  });

  const shiftingMazeId = editor.room(LEVEL_ID, 'shifting_maze', 32, 38, 14, 14, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 4,
  });

  const counterfeitArenaId = editor.room(LEVEL_ID, 'counterfeit_arena', 22, 56, 12, 12, {
    roomType: ROOM_TYPES.ARENA,
    elevation: 0,
    sortOrder: 5,
  });

  const mimicDenId = editor.room(LEVEL_ID, 'mimics_den', 24, 72, 8, 8, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 6,
  });

  const serenissimaId = editor.room(LEVEL_ID, 'serenissima', 36, 72, 6, 6, {
    roomType: ROOM_TYPES.SECRET,
    elevation: 0,
    sortOrder: 7,
  });

  const ingannoParlerId = editor.room(LEVEL_ID, 'inganno_parlor', 21, 84, 14, 14, {
    roomType: ROOM_TYPES.BOSS,
    elevation: -1,
    sortOrder: 8,
  });

  // =========================================================================
  // 4. CONNECTIONS (from "Connections" table)
  // =========================================================================
  //
  // | From                   | To                   | Type     | Width | Notes                          |
  // | Portico                | Hall of Mirrors      | corridor | 3     | Grand entrance                 |
  // | Hall of Mirrors        | Bolgia of Flatterers | corridor | 2     | West branch                    |
  // | Hall of Mirrors        | Bolgia of Thieves    | corridor | 2     | East branch                    |
  // | Bolgia of Flatterers   | Counterfeit Arena    | corridor | 2     | Reconnects west path           |
  // | Bolgia of Thieves      | Shifting Maze        | corridor | 2     | East path continues            |
  // | Shifting Maze          | Counterfeit Arena    | corridor | 2     | Maze exit to arena             |
  // | Counterfeit Arena      | Mimic's Den          | corridor | 2     | Descent begins                 |
  // | Mimic's Den            | Serenissima          | secret   | 2     | WALL_SECRET east wall          |
  // | Mimic's Den            | Inganno's Parlor     | stairs   | 3     | Descending, ornate banister    |

  // Portico -> Hall of Mirrors (corridor, width 3)
  editor.corridor(LEVEL_ID, porticoId, hallOfMirrorsId, 3);

  // Hall of Mirrors -> Bolgia of Flatterers (corridor, width 2)
  editor.corridor(LEVEL_ID, hallOfMirrorsId, bolgiaFlatId, 2);

  // Hall of Mirrors -> Bolgia of Thieves (corridor, width 2)
  editor.corridor(LEVEL_ID, hallOfMirrorsId, bolgiaThievesId, 2);

  // Bolgia of Flatterers -> Counterfeit Arena (corridor, width 2)
  editor.corridor(LEVEL_ID, bolgiaFlatId, counterfeitArenaId, 2);

  // Bolgia of Thieves -> Shifting Maze (corridor, width 2)
  editor.corridor(LEVEL_ID, bolgiaThievesId, shiftingMazeId, 2);

  // Shifting Maze -> Counterfeit Arena (corridor, width 2)
  editor.corridor(LEVEL_ID, shiftingMazeId, counterfeitArenaId, 2);

  // Counterfeit Arena -> Mimic's Den (corridor, width 2)
  editor.corridor(LEVEL_ID, counterfeitArenaId, mimicDenId, 2);

  // Mimic's Den -> Serenissima (secret, width 2)
  editor.connect(LEVEL_ID, mimicDenId, serenissimaId, {
    connectionType: CONNECTION_TYPES.SECRET,
    corridorWidth: 2,
  });

  // Mimic's Den -> Inganno's Parlor (stairs, width 3, 0 -> -1)
  editor.connect(LEVEL_ID, mimicDenId, ingannoParlerId, {
    connectionType: CONNECTION_TYPES.STAIRS,
    corridorWidth: 3,
    fromElevation: 0,
    toElevation: -1,
  });

  // =========================================================================
  // 5. ENTITIES: ENEMIES (from "Enemies" table)
  // =========================================================================

  // --- Hall of Mirrors: 3x shadowGoat patrol near walls ---
  // Room bounds: (23, 12, 14, 10) -> interior: x=[24..35], z=[13..20]
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.SHADOW_GOAT, 25, 15, {
    roomId: hallOfMirrorsId,
    patrol: [
      { x: 25, z: 15 },
      { x: 34, z: 15 },
      { x: 30, z: 20 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.SHADOW_GOAT, 34, 15, {
    roomId: hallOfMirrorsId,
    patrol: [
      { x: 34, z: 15 },
      { x: 30, z: 20 },
      { x: 25, z: 15 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.SHADOW_GOAT, 30, 20, {
    roomId: hallOfMirrorsId,
    patrol: [
      { x: 30, z: 20 },
      { x: 25, z: 15 },
      { x: 34, z: 15 },
    ],
  });

  // --- Bolgia of Flatterers: 2x hellgoat (disguised as friendly, trigger-spawned) ---
  // Room bounds: (8, 26, 12, 8) -> interior: x=[9..18], z=[27..32]
  // These spawn via trigger T2 when player reaches center
  // Using ambush() convenience method which creates trigger + linked entities

  editor.ambush(
    LEVEL_ID,
    { x: 10, z: 26, w: 8, h: 2 },
    [
      { type: ENEMY_TYPES.HELLGOAT, x: 11, z: 27 },
      { type: ENEMY_TYPES.HELLGOAT, x: 17, z: 27 },
    ],
    { roomId: bolgiaFlatId },
  );

  // Bolgia of Flatterers: 2x mimic (pickup disguise)
  // Mimics are enemies that look like pickups
  editor.spawnEnemy(LEVEL_ID, 'mimic', 12, 30, {
    roomId: bolgiaFlatId,
  });
  editor.spawnEnemy(LEVEL_ID, 'mimic', 16, 32, {
    roomId: bolgiaFlatId,
  });

  // --- Bolgia of Thieves: 2x shadowGoat (ambush) + 1x hellgoat ---
  // Room bounds: (34, 26, 10, 8) -> interior: x=[35..42], z=[27..32]
  // shadowGoats appear when pickups vanish — using ambush() convenience method
  editor.ambush(
    LEVEL_ID,
    { x: 36, z: 28, w: 4, h: 2 },
    [
      { type: ENEMY_TYPES.SHADOW_GOAT, x: 37, z: 31 },
      { type: ENEMY_TYPES.SHADOW_GOAT, x: 41, z: 31 },
    ],
    { roomId: bolgiaThievesId },
  );
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 39, 29, {
    roomId: bolgiaThievesId,
    patrol: [
      { x: 39, z: 29 },
      { x: 36, z: 32 },
      { x: 42, z: 32 },
    ],
  });

  // --- Shifting Maze: 4x shadowGoat + 3x hellgoat ---
  // Room bounds: (32, 38, 14, 14) -> interior: x=[33..44], z=[39..50]
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.SHADOW_GOAT, 35, 41, {
    roomId: shiftingMazeId,
    patrol: [
      { x: 35, z: 41 },
      { x: 40, z: 44 },
      { x: 35, z: 47 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.SHADOW_GOAT, 42, 40, {
    roomId: shiftingMazeId,
    patrol: [
      { x: 42, z: 40 },
      { x: 38, z: 43 },
      { x: 42, z: 46 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.SHADOW_GOAT, 36, 48, {
    roomId: shiftingMazeId,
    patrol: [
      { x: 36, z: 48 },
      { x: 40, z: 50 },
      { x: 44, z: 48 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.SHADOW_GOAT, 43, 49, {
    roomId: shiftingMazeId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 37, 44, {
    roomId: shiftingMazeId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 41, 42, {
    roomId: shiftingMazeId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 39, 48, {
    roomId: shiftingMazeId,
  });

  // --- Counterfeit Arena: waves + mimics ---
  // Room bounds: (22, 56, 12, 12) -> interior: x=[23..32], z=[57..66]
  // Arena uses setupArenaWaves for lock/wave/unlock pattern
  // Wave 1: 3x hellgoat, Wave 2: 2x shadowGoat
  editor.setupArenaWaves(LEVEL_ID, counterfeitArenaId, { x: 24, z: 58, w: 8, h: 8 }, [
    // Wave 1: 3 hellgoats from edges
    [
      { type: ENEMY_TYPES.HELLGOAT, x: 23, z: 62 },
      { type: ENEMY_TYPES.HELLGOAT, x: 28, z: 57 },
      { type: ENEMY_TYPES.HELLGOAT, x: 32, z: 62 },
    ],
    // Wave 2: 2 shadowGoats flank from ramps
    [
      { type: ENEMY_TYPES.SHADOW_GOAT, x: 24, z: 60 },
      { type: ENEMY_TYPES.SHADOW_GOAT, x: 31, z: 64 },
    ],
  ]);

  // Counterfeit Arena mimics: 4 of 6 "columns" are mimics
  editor.spawnEnemy(LEVEL_ID, 'mimic', 24, 58, { roomId: counterfeitArenaId });
  editor.spawnEnemy(LEVEL_ID, 'mimic', 28, 58, { roomId: counterfeitArenaId });
  editor.spawnEnemy(LEVEL_ID, 'mimic', 24, 64, { roomId: counterfeitArenaId });
  editor.spawnEnemy(LEVEL_ID, 'mimic', 28, 64, { roomId: counterfeitArenaId });

  // --- Mimic's Den: 4x mimic (mixed among 8 real pickups) ---
  // Room bounds: (24, 72, 8, 8) -> interior: x=[25..30], z=[73..78]
  editor.spawnEnemy(LEVEL_ID, 'mimic', 27, 75, { roomId: mimicDenId });
  editor.spawnEnemy(LEVEL_ID, 'mimic', 29, 77, { roomId: mimicDenId });
  editor.spawnEnemy(LEVEL_ID, 'mimic', 26, 74, { roomId: mimicDenId });
  editor.spawnEnemy(LEVEL_ID, 'mimic', 30, 74, { roomId: mimicDenId });

  // --- Boss: Inganno ---
  // Room bounds: (21, 84, 14, 14) -> center: (28, 91)
  editor.spawnBoss(LEVEL_ID, 'inganno', 28, 89, {
    roomId: ingannoParlerId,
    facing: 0,
  });

  // =========================================================================
  // 5b. ENTITIES: PICKUPS (from "Pickups" table)
  // =========================================================================

  // Portico: ammo (29, 5) — safe, establishes false trust
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 29, 5);

  // Portico: health (27, 4) — safe
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 27, 4);

  // Hall of Mirrors: ammo (28, 16) — center, real
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 28, 16);

  // Bolgia of Flatterers: ammo (10, 28) — NW, real, behind banner
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 10, 28);
  // Note: (12,30) and (16,32) are MIMICs — already placed as enemies above

  // Bolgia of Thieves: health (38, 28) — N, vanishes on approach
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 38, 28);

  // Bolgia of Thieves: ammo x2 (36, 32), (40, 30) — shuffle positions
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 36, 32);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 40, 30);

  // Shifting Maze: ammo (38, 44) — center, real
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 38, 44);

  // Shifting Maze: health (42, 50) — near exit, real
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 42, 50);

  // Counterfeit Arena: ammo x2 (25, 60), (31, 64)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 25, 60);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 31, 64);

  // Counterfeit Arena: health (28, 58) — N center
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 28, 58);

  // Mimic's Den: health x4 (25,73), (27,75), (29,77), (31,73)
  // 2 real, 2 are mimics (already spawned as enemies)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 25, 73);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 31, 73);

  // Mimic's Den: ammo x4 (26,74), (28,76), (30,74), (25,78)
  // 2 real, 2 are mimics (already spawned as enemies)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 28, 76);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 25, 78);

  // Serenissima: health x2 (38, 74), (40, 76) — ALL real
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 38, 74);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 40, 76);

  // Serenissima: ammo x2 (39, 73), (39, 77) — ALL real
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 39, 73);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 39, 77);

  // Boss chamber: ammo x2 (23, 86), (33, 96) — NW, SE corners
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 23, 86);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 33, 96);

  // Boss chamber: health x2 (33, 86), (23, 96) — NE, SW corners
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 33, 86);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 23, 96);

  // Fuel pickups
  // Portico: fuel near exit
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.FUEL, 30, 6);

  // Counterfeit Arena: fuel center, between waves
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.FUEL, 28, 62);

  // Inganno's Parlor: fuel NE corner
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.FUEL, 33, 86);

  // =========================================================================
  // 5c. ENTITIES: PROPS (from "Props" table)
  // =========================================================================

  // --- Portico (bounds: 25, 2, 10, 6) ---
  // 2x chandelier-iron (ceiling)
  editor.spawnProp(LEVEL_ID, 'chandelier-iron', 28, 3, { roomId: porticoId });
  editor.spawnProp(LEVEL_ID, 'chandelier-iron', 32, 3, { roomId: porticoId });
  // 1x fraud-ornate-arch (south corridor entrance)
  editor.spawnProp(LEVEL_ID, 'fraud-ornate-arch', 30, 7, { roomId: porticoId });
  // 1x fraud-ornate-railing (flanking entrance N wall)
  editor.spawnProp(LEVEL_ID, 'fraud-ornate-railing', 30, 3, { roomId: porticoId });
  // 1x fraud-two-faced-bust (NW pedestal)
  editor.spawnProp(LEVEL_ID, 'fraud-two-faced-bust', 27, 3, { roomId: porticoId });
  // 2x fraud-golden-banner (E/W walls)
  editor.spawnProp(LEVEL_ID, 'fraud-golden-banner', 26, 4, {
    roomId: porticoId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'fraud-golden-banner', 33, 4, {
    roomId: porticoId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 2x fraud-marble-pedestal (flanking entrance)
  editor.spawnProp(LEVEL_ID, 'fraud-marble-pedestal', 26, 3, { roomId: porticoId });
  editor.spawnProp(LEVEL_ID, 'fraud-marble-pedestal', 34, 3, { roomId: porticoId });

  // --- Hall of Mirrors (bounds: 23, 12, 14, 10) ---
  // 6x fraud-onyx-wall-panel (N/S walls, structural)
  editor.spawnProp(LEVEL_ID, 'fraud-onyx-wall-panel', 25, 13, { roomId: hallOfMirrorsId });
  editor.spawnProp(LEVEL_ID, 'fraud-onyx-wall-panel', 30, 13, { roomId: hallOfMirrorsId });
  editor.spawnProp(LEVEL_ID, 'fraud-onyx-wall-panel', 35, 13, { roomId: hallOfMirrorsId });
  editor.spawnProp(LEVEL_ID, 'fraud-onyx-wall-panel', 25, 20, { roomId: hallOfMirrorsId });
  editor.spawnProp(LEVEL_ID, 'fraud-onyx-wall-panel', 30, 20, { roomId: hallOfMirrorsId });
  editor.spawnProp(LEVEL_ID, 'fraud-onyx-wall-panel', 35, 20, { roomId: hallOfMirrorsId });
  // 2x fraud-ornate-arch (west/east exit corridors)
  editor.spawnProp(LEVEL_ID, 'fraud-ornate-arch', 24, 17, { roomId: hallOfMirrorsId });
  editor.spawnProp(LEVEL_ID, 'fraud-ornate-arch', 35, 17, { roomId: hallOfMirrorsId });
  // 3x fraud-mirror-shard (between onyx panels)
  editor.spawnProp(LEVEL_ID, 'fraud-mirror-shard', 27, 15, { roomId: hallOfMirrorsId });
  editor.spawnProp(LEVEL_ID, 'fraud-mirror-shard', 32, 16, { roomId: hallOfMirrorsId });
  editor.spawnProp(LEVEL_ID, 'fraud-mirror-shard', 29, 19, { roomId: hallOfMirrorsId });
  // 2x fraud-marble-pedestal (near columns)
  editor.spawnProp(LEVEL_ID, 'fraud-marble-pedestal', 25, 14, { roomId: hallOfMirrorsId });
  editor.spawnProp(LEVEL_ID, 'fraud-marble-pedestal', 35, 14, { roomId: hallOfMirrorsId });

  // --- Bolgia of Flatterers (bounds: 8, 26, 12, 8) ---
  // 1x fraud-ornate-arch (north entrance)
  editor.spawnProp(LEVEL_ID, 'fraud-ornate-arch', 14, 27, { roomId: bolgiaFlatId });
  // 1x fraud-ramp-platform (north end, +0.5 elevation)
  editor.spawnProp(LEVEL_ID, 'fraud-ramp-platform', 10, 26, { roomId: bolgiaFlatId });
  // 4x fraud-silhouette-prop (north platform, narrative critical)
  editor.spawnProp(LEVEL_ID, 'fraud-silhouette-prop', 10, 27, { roomId: bolgiaFlatId });
  editor.spawnProp(LEVEL_ID, 'fraud-silhouette-prop', 12, 27, { roomId: bolgiaFlatId });
  editor.spawnProp(LEVEL_ID, 'fraud-silhouette-prop', 14, 27, { roomId: bolgiaFlatId });
  editor.spawnProp(LEVEL_ID, 'fraud-silhouette-prop', 16, 27, { roomId: bolgiaFlatId });
  // 2x fraud-golden-banner (N wall, one conceals ammo)
  editor.spawnProp(LEVEL_ID, 'fraud-golden-banner', 11, 27, {
    roomId: bolgiaFlatId,
    surfaceAnchor: {
      face: 'north',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'fraud-golden-banner', 16, 27, {
    roomId: bolgiaFlatId,
    surfaceAnchor: {
      face: 'north',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 1x fraud-forked-tongue-relief (south wall)
  editor.spawnProp(LEVEL_ID, 'fraud-forked-tongue-relief', 10, 30, { roomId: bolgiaFlatId });
  // 1x fraud-coin-pile (near table)
  editor.spawnProp(LEVEL_ID, 'fraud-coin-pile', 14, 29, { roomId: bolgiaFlatId });

  // --- Bolgia of Thieves (bounds: 34, 26, 10, 8) ---
  // 1x fraud-ornate-arch (north entrance)
  editor.spawnProp(LEVEL_ID, 'fraud-ornate-arch', 39, 27, { roomId: bolgiaThievesId });
  // 3x fraud-coin-pile (floor, decoy)
  editor.spawnProp(LEVEL_ID, 'fraud-coin-pile', 36, 28, { roomId: bolgiaThievesId });
  editor.spawnProp(LEVEL_ID, 'fraud-coin-pile', 39, 30, { roomId: bolgiaThievesId });
  editor.spawnProp(LEVEL_ID, 'fraud-coin-pile', 42, 28, { roomId: bolgiaThievesId });
  // 2x trick-chest (floor, deception)
  editor.spawnProp(LEVEL_ID, 'trick-chest', 36, 28, { roomId: bolgiaThievesId });
  editor.spawnProp(LEVEL_ID, 'trick-chest', 40, 32, { roomId: bolgiaThievesId });
  // 1x fraud-marble-pedestal (center)
  editor.spawnProp(LEVEL_ID, 'fraud-marble-pedestal', 38, 30, { roomId: bolgiaThievesId });
  // 1x false-door (east wall, deception)
  editor.spawnProp(LEVEL_ID, 'false-door', 42, 30, { roomId: bolgiaThievesId });

  // --- Shifting Maze (bounds: 32, 38, 14, 14) ---
  // 6x fraud-shifting-wall-segment (moveable walls)
  editor.spawnProp(LEVEL_ID, 'fraud-shifting-wall-segment', 35, 40, { roomId: shiftingMazeId });
  editor.spawnProp(LEVEL_ID, 'fraud-shifting-wall-segment', 40, 42, { roomId: shiftingMazeId });
  editor.spawnProp(LEVEL_ID, 'fraud-shifting-wall-segment', 37, 44, { roomId: shiftingMazeId });
  editor.spawnProp(LEVEL_ID, 'fraud-shifting-wall-segment', 42, 46, { roomId: shiftingMazeId });
  editor.spawnProp(LEVEL_ID, 'fraud-shifting-wall-segment', 35, 48, { roomId: shiftingMazeId });
  editor.spawnProp(LEVEL_ID, 'fraud-shifting-wall-segment', 40, 50, { roomId: shiftingMazeId });
  // 2x torch-sconce-ornate (fixed outer walls, only reliable landmarks)
  editor.spawnProp(LEVEL_ID, 'torch-sconce-ornate', 33, 40, {
    roomId: shiftingMazeId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.8,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'torch-sconce-ornate', 44, 48, {
    roomId: shiftingMazeId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.8,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 4x fraud-cracked-mosaic-floor (breadcrumbs, shift with walls)
  editor.spawnProp(LEVEL_ID, 'fraud-cracked-mosaic-floor', 35, 42, { roomId: shiftingMazeId });
  editor.spawnProp(LEVEL_ID, 'fraud-cracked-mosaic-floor', 40, 45, { roomId: shiftingMazeId });
  editor.spawnProp(LEVEL_ID, 'fraud-cracked-mosaic-floor', 37, 49, { roomId: shiftingMazeId });
  editor.spawnProp(LEVEL_ID, 'fraud-cracked-mosaic-floor', 43, 41, { roomId: shiftingMazeId });

  // --- Counterfeit Arena (bounds: 22, 56, 12, 12) ---
  // 6x fraud-fake-column (2 rows of 3; 4 are mimic hosts, 2 real)
  editor.spawnProp(LEVEL_ID, 'fraud-fake-column', 25, 58, { roomId: counterfeitArenaId });
  editor.spawnProp(LEVEL_ID, 'fraud-fake-column', 28, 58, { roomId: counterfeitArenaId });
  editor.spawnProp(LEVEL_ID, 'fraud-fake-column', 31, 58, { roomId: counterfeitArenaId });
  editor.spawnProp(LEVEL_ID, 'fraud-fake-column', 25, 64, { roomId: counterfeitArenaId });
  editor.spawnProp(LEVEL_ID, 'fraud-fake-column', 28, 64, { roomId: counterfeitArenaId });
  editor.spawnProp(LEVEL_ID, 'fraud-fake-column', 31, 64, { roomId: counterfeitArenaId });
  // 2x fraud-ramp-platform (center, real cover, +1 cell elevation)
  editor.spawnProp(LEVEL_ID, 'fraud-ramp-platform', 26, 61, { roomId: counterfeitArenaId });
  editor.spawnProp(LEVEL_ID, 'fraud-ramp-platform', 30, 61, { roomId: counterfeitArenaId });
  // 1x fraud-ornate-arch (north entrance, twin archways)
  editor.spawnProp(LEVEL_ID, 'fraud-ornate-arch', 27, 57, { roomId: counterfeitArenaId });
  // 2x torch-sconce-ornate (N/S walls)
  editor.spawnProp(LEVEL_ID, 'torch-sconce-ornate', 23, 57, {
    roomId: counterfeitArenaId,
    surfaceAnchor: {
      face: 'north',
      offsetX: 0,
      offsetY: 1.8,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'torch-sconce-ornate', 32, 66, {
    roomId: counterfeitArenaId,
    surfaceAnchor: {
      face: 'south',
      offsetX: 0,
      offsetY: 1.8,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 1x fraud-cracked-mosaic-floor (center, callback to Circle 1)
  editor.spawnProp(LEVEL_ID, 'fraud-cracked-mosaic-floor', 28, 61, { roomId: counterfeitArenaId });
  // 1x fraud-crumbling-facade (near entrance, visual decay)
  editor.spawnProp(LEVEL_ID, 'fraud-crumbling-facade', 22, 57, { roomId: counterfeitArenaId });

  // --- Mimic's Den (bounds: 24, 72, 8, 8) ---
  // 2x torch-sconce-ornate (E/W walls)
  editor.spawnProp(LEVEL_ID, 'torch-sconce-ornate', 25, 75, {
    roomId: mimicDenId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.8,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'torch-sconce-ornate', 30, 75, {
    roomId: mimicDenId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.8,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 1x fraud-gambling-table (center, the "one honest object")
  editor.spawnProp(LEVEL_ID, 'fraud-gambling-table', 28, 76, { roomId: mimicDenId });
  // 2x fraud-coin-pile (floor, mixed with pickups)
  editor.spawnProp(LEVEL_ID, 'fraud-coin-pile', 26, 78, { roomId: mimicDenId });
  editor.spawnProp(LEVEL_ID, 'fraud-coin-pile', 29, 78, { roomId: mimicDenId });
  // 1x fraud-forked-tongue-relief (N wall, deception symbol)
  editor.spawnProp(LEVEL_ID, 'fraud-forked-tongue-relief', 28, 73, {
    roomId: mimicDenId,
    surfaceAnchor: {
      face: 'north',
      offsetX: 0,
      offsetY: 1.2,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.7,
    },
  });

  // --- Serenissima (bounds: 36, 72, 6, 6) ---
  // 1x chest-gold (center, the genuine treasure)
  editor.spawnProp(LEVEL_ID, 'chest-gold', 39, 75, { roomId: serenissimaId });
  // 1x book-open (beside chest, lore scroll)
  editor.spawnProp(LEVEL_ID, 'book-open', 39, 76, { roomId: serenissimaId });
  // 2x candle (flanking chest, warm light)
  editor.spawnProp(LEVEL_ID, 'candle', 38, 74, { roomId: serenissimaId });
  editor.spawnProp(LEVEL_ID, 'candle', 40, 74, { roomId: serenissimaId });
  // 1x carpet (floor, under chest, warmth)
  editor.spawnProp(LEVEL_ID, 'carpet', 39, 75, { roomId: serenissimaId });
  // 2x cobweb (upper corners, undisturbed)
  editor.spawnProp(LEVEL_ID, 'cobweb', 37, 73, { roomId: serenissimaId });
  editor.spawnProp(LEVEL_ID, 'cobweb', 41, 73, { roomId: serenissimaId });

  // --- Inganno's Parlor (bounds: 21, 84, 14, 14) ---
  // 1x fraud-ornate-arch (north entrance, grand stairway descent)
  editor.spawnProp(LEVEL_ID, 'fraud-ornate-arch', 28, 85, { roomId: ingannoParlerId });
  // 1x fraud-ornate-railing (north stair descent)
  editor.spawnProp(LEVEL_ID, 'fraud-ornate-railing', 28, 86, { roomId: ingannoParlerId });
  // 1x fraud-broken-chandelier (ceiling, grand, damages in phase 3)
  editor.spawnProp(LEVEL_ID, 'fraud-broken-chandelier', 28, 91, { roomId: ingannoParlerId });
  // 2x bookcase (E/W walls)
  editor.spawnProp(LEVEL_ID, 'bookcase', 22, 89, {
    roomId: ingannoParlerId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'bookcase', 33, 89, {
    roomId: ingannoParlerId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 2x fraud-golden-banner (N wall, flanking Inganno's seat)
  editor.spawnProp(LEVEL_ID, 'fraud-golden-banner', 25, 85, {
    roomId: ingannoParlerId,
    surfaceAnchor: {
      face: 'north',
      offsetX: 0,
      offsetY: 2.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.2,
    },
  });
  editor.spawnProp(LEVEL_ID, 'fraud-golden-banner', 31, 85, {
    roomId: ingannoParlerId,
    surfaceAnchor: {
      face: 'north',
      offsetX: 0,
      offsetY: 2.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.2,
    },
  });
  // 1x fraud-two-faced-bust (near entrance, thematic foreshadowing)
  editor.spawnProp(LEVEL_ID, 'fraud-two-faced-bust', 22, 85, { roomId: ingannoParlerId });
  // 1x fraud-crumbling-facade (walls, phase 3 reveal)
  editor.spawnProp(LEVEL_ID, 'fraud-crumbling-facade', 33, 92, { roomId: ingannoParlerId });
  // 1x fraud-marble-debris (floor scatter, phase 3 obstacles)
  editor.spawnProp(LEVEL_ID, 'fraud-marble-debris', 26, 93, { roomId: ingannoParlerId });
  // 2x fraud-stage-curtain (E/W walls behind bookcases)
  editor.spawnProp(LEVEL_ID, 'fraud-stage-curtain', 22, 92, {
    roomId: ingannoParlerId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'fraud-stage-curtain', 33, 92, {
    roomId: ingannoParlerId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 1x fraud-forked-tongue-relief (behind Inganno's seat)
  editor.spawnProp(LEVEL_ID, 'fraud-forked-tongue-relief', 28, 85, {
    roomId: ingannoParlerId,
    surfaceAnchor: {
      face: 'north',
      offsetX: 0,
      offsetY: 1.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.6,
    },
  });
  // 4x candelabrum-tall (all faces)
  editor.spawnProp(LEVEL_ID, 'candelabrum-tall', 22, 86, {
    roomId: ingannoParlerId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'candelabrum-tall', 33, 86, {
    roomId: ingannoParlerId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'candelabrum-tall', 22, 96, {
    roomId: ingannoParlerId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'candelabrum-tall', 33, 96, {
    roomId: ingannoParlerId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });

  // =========================================================================
  // 5d. DECALS (rust patches, water stains — Fraud theme, subtle opacity)
  // =========================================================================
  // Thematically: fraud = beautiful facade hiding corruption.
  // Rust patches on floors near wall seams (truth bleeding through).
  // Water stains on walls near ceiling in Bolgia rooms (moisture/decay).
  // All decals are SUBTLE — opacity 0.3-0.4.

  // --- Portico (bounds: 25, 2, 10, 6) ---
  // Subtle rust beneath pristine marble near pedestal bases
  editor.placeDecals(LEVEL_ID, porticoId, [
    { type: DECAL_TYPES.RUST_PATCH, x: 26, z: 3, opacity: 0.3 },
    { type: DECAL_TYPES.RUST_PATCH, x: 34, z: 3, opacity: 0.3 },
  ]);

  // --- Hall of Mirrors (bounds: 23, 12, 14, 10) ---
  // Rust seeping at floor seams near onyx panels
  editor.placeDecals(LEVEL_ID, hallOfMirrorsId, [
    { type: DECAL_TYPES.RUST_PATCH, x: 25, z: 13, opacity: 0.35 },
    { type: DECAL_TYPES.RUST_PATCH, x: 35, z: 20, opacity: 0.35 },
  ]);

  // --- Bolgia of Flatterers (bounds: 8, 26, 12, 8) ---
  // Water stains on walls (ceiling moisture), rust on floor
  editor.placeDecals(LEVEL_ID, bolgiaFlatId, [
    { type: DECAL_TYPES.WATER_STAIN, x: 9, z: 27, surface: 'wall', opacity: 0.4 },
    { type: DECAL_TYPES.WATER_STAIN, x: 18, z: 30, surface: 'wall', opacity: 0.35 },
    { type: DECAL_TYPES.RUST_PATCH, x: 14, z: 32, opacity: 0.3 },
  ]);

  // --- Bolgia of Thieves (bounds: 34, 26, 10, 8) ---
  // Water stains near ceiling, rust under coin piles
  editor.placeDecals(LEVEL_ID, bolgiaThievesId, [
    { type: DECAL_TYPES.WATER_STAIN, x: 35, z: 27, surface: 'wall', opacity: 0.35 },
    { type: DECAL_TYPES.RUST_PATCH, x: 39, z: 30, opacity: 0.3 },
  ]);

  // --- Shifting Maze (bounds: 32, 38, 14, 14) ---
  // Rust on floor near wall segments (the facade cracking)
  editor.placeDecals(LEVEL_ID, shiftingMazeId, [
    { type: DECAL_TYPES.RUST_PATCH, x: 35, z: 40, opacity: 0.4 },
    { type: DECAL_TYPES.RUST_PATCH, x: 42, z: 46, opacity: 0.3 },
  ]);

  // --- Counterfeit Arena (bounds: 22, 56, 12, 12) ---
  // Rust around fake columns, water stains on walls
  editor.placeDecals(LEVEL_ID, counterfeitArenaId, [
    { type: DECAL_TYPES.RUST_PATCH, x: 25, z: 58, opacity: 0.35 },
    { type: DECAL_TYPES.RUST_PATCH, x: 31, z: 64, opacity: 0.35 },
    { type: DECAL_TYPES.WATER_STAIN, x: 23, z: 60, surface: 'wall', opacity: 0.3 },
  ]);

  // --- Mimic's Den (bounds: 24, 72, 8, 8) ---
  // Rust under gambling table
  editor.placeDecals(LEVEL_ID, mimicDenId, [
    { type: DECAL_TYPES.RUST_PATCH, x: 28, z: 76, opacity: 0.4 },
  ]);

  // --- Inganno's Parlor (bounds: 21, 84, 14, 14) ---
  // Rust and water stains — the beautiful room decaying
  editor.placeDecals(LEVEL_ID, ingannoParlerId, [
    { type: DECAL_TYPES.RUST_PATCH, x: 26, z: 93, w: 3, h: 3, opacity: 0.4 },
    { type: DECAL_TYPES.RUST_PATCH, x: 33, z: 92, opacity: 0.35 },
    { type: DECAL_TYPES.WATER_STAIN, x: 22, z: 89, surface: 'wall', opacity: 0.3 },
    { type: DECAL_TYPES.WATER_STAIN, x: 33, z: 89, surface: 'wall', opacity: 0.3 },
  ]);

  // =========================================================================
  // 6. TRIGGERS (from "Triggers" table)
  // =========================================================================
  //
  // NOTE: Arena waves (T6-T10) were created by setupArenaWaves() above.
  // NOTE: Bolgia Flatterers trigger (T2) and Bolgia Thieves trigger (T4)
  //       were created above when spawning enemies.
  // Remaining triggers to create manually:

  // T1: revealMimics — Bolgia of Flatterers center zone
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 10,
    zoneZ: 28,
    zoneW: 8,
    zoneH: 4,
    roomId: bolgiaFlatId,
    once: true,
    actionData: { type: 'revealMimics', mimicIds: ['mimic-flat-1', 'mimic-flat-2'] },
  });

  // T3: shufflePickups — Bolgia of Thieves repeating
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 35,
    zoneZ: 27,
    zoneW: 8,
    zoneH: 6,
    roomId: bolgiaThievesId,
    once: false,
    actionData: { type: 'shufflePickups', cooldown: 5 },
  });

  // T5: shiftWalls — Shifting Maze repeating
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 33,
    zoneZ: 39,
    zoneW: 12,
    zoneH: 12,
    roomId: shiftingMazeId,
    once: false,
    actionData: { type: 'shiftWalls', wallSegments: 6, maxShift: 2, cooldown: 8 },
  });

  // T11: randomizeMimics — Mimic's Den
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 25,
    zoneZ: 73,
    zoneW: 6,
    zoneH: 6,
    roomId: mimicDenId,
    once: true,
    actionData: { type: 'randomizeMimics', totalPickups: 8, mimicCount: 4 },
  });

  // T12: bossIntro — boss chamber entrance zone
  editor.bossIntro(
    LEVEL_ID,
    { x: 25, z: 87, w: 6, h: 2 },
    'Welcome, little goat. You must be so tired. Sit. Rest.',
    { roomId: ingannoParlerId },
  );

  // T14: lockDoors on boss activate (with 2s delay)
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.LOCK_DOORS,
    zoneX: 26,
    zoneZ: 88,
    zoneW: 4,
    zoneH: 3,
    roomId: ingannoParlerId,
    once: true,
    delay: 2,
  });

  // T15: bossPhaseChange — Boss HP < 60%
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 21,
    zoneZ: 84,
    zoneW: 14,
    zoneH: 14,
    roomId: ingannoParlerId,
    once: true,
    actionData: { condition: 'bossHpBelow60', phase: 2, action: 'spawnMirrorClone' },
  });

  // T16: bossPhaseChange — Boss HP < 30%
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 21,
    zoneZ: 84,
    zoneW: 14,
    zoneH: 14,
    roomId: ingannoParlerId,
    once: true,
    actionData: { condition: 'bossHpBelow30', phase: 3, action: 'revealTrueForm' },
  });

  // T17: ambientChange — Boss HP < 30% (texture swap, lighting)
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 21,
    zoneZ: 84,
    zoneW: 14,
    zoneH: 14,
    roomId: ingannoParlerId,
    once: true,
    actionData: {
      condition: 'bossHpBelow30',
      textures: 'swap_marble_rust',
      lightColor: '#4466cc',
      fogDensity: 0.01,
    },
  });

  // =========================================================================
  // 7. ENVIRONMENT ZONES (from "Environment Zones" table)
  // =========================================================================

  // Global warm haze — full level
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.FOG,
    boundsX: 0,
    boundsZ: 0,
    boundsW: 60,
    boundsH: 90,
    intensity: 0.3,
  });

  // Hall of Mirrors reflections (specular) — using ILLUSION as closest env type
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.ILLUSION,
    boundsX: 23,
    boundsZ: 12,
    boundsW: 14,
    boundsH: 10,
    intensity: 0.6,
  });

  // Shifting Maze disorientation — thicker fog
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.FOG,
    boundsX: 32,
    boundsZ: 38,
    boundsW: 14,
    boundsH: 14,
    intensity: 0.6,
  });

  // Boss reveal — fog clears at phase 3
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.FOG,
    boundsX: 21,
    boundsZ: 84,
    boundsW: 14,
    boundsH: 14,
    intensity: 0.0,
  });

  // Mimic proximity — danger zone
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.ILLUSION,
    boundsX: 24,
    boundsZ: 72,
    boundsW: 8,
    boundsH: 8,
    intensity: 0.8,
  });

  // =========================================================================
  // 8. PLAYER SPAWN (from "Player Spawn" section)
  // =========================================================================
  // Position: (30, 5) — center of Portico
  // Facing: 0 (north — facing into the beautiful palace)

  editor.setPlayerSpawn(LEVEL_ID, 30, 5, 0);

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
    throw new Error('Circle 8 (Fraud) level validation failed');
  }
  console.log('Circle 8 (Fraud) built successfully');
  if (result.warnings.length > 0) {
    console.log('Warnings:', result.warnings);
  }
}
