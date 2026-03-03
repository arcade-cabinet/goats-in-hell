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
    texturePalette: { exploration: 'marble', arena: 'tiles', boss: 'marble', secret: 'stone-dark' },
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
    floorTexture: 'marble',
    wallTexture: 'tiles',
  });

  const hallOfMirrorsId = editor.room(LEVEL_ID, 'hall_of_mirrors', 23, 12, 14, 10, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 1,
    floorTexture: 'marble',
    wallTexture: 'marble',
    fillRule: {
      type: 'scatter',
      props: ['fraud-mirror-shard', 'fraud-two-faced-bust', 'fraud-fake-column'],
      density: 0.1,
    },
  });

  const bolgiaFlatId = editor.room(LEVEL_ID, 'bolgia_flatterers', 8, 26, 12, 8, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 2,
    floorTexture: 'tiles',
    wallTexture: 'marble',
    fillRule: {
      type: 'scatter',
      props: ['fraud-stage-curtain', 'fraud-theatrical-column', 'fraud-silhouette-prop'],
      density: 0.08,
    },
  });

  const bolgiaThievesId = editor.room(LEVEL_ID, 'bolgia_thieves', 34, 26, 10, 8, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 3,
    floorTexture: 'marble',
    wallTexture: 'tiles',
    fillRule: {
      type: 'scatter',
      props: ['fraud-gambling-table', 'fraud-coin-pile', 'trick-chest'],
      density: 0.1,
    },
  });

  const shiftingMazeId = editor.room(LEVEL_ID, 'shifting_maze', 32, 38, 14, 14, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 4,
    floorTexture: 'stone-dark',
    wallTexture: 'marble',
    fillRule: {
      type: 'scatter',
      props: ['fraud-shifting-wall-segment', 'fraud-crumbling-facade', 'fraud-fake-column'],
      density: 0.12,
    },
  });

  const counterfeitArenaId = editor.room(LEVEL_ID, 'counterfeit_arena', 22, 56, 12, 12, {
    roomType: ROOM_TYPES.ARENA,
    elevation: 0,
    sortOrder: 5,
    floorTexture: 'marble',
    fillRule: {
      type: 'scatter',
      props: ['fraud-marble-debris', 'fraud-cracked-mosaic-floor'],
      density: 0.1,
    },
  });

  const mimicDenId = editor.room(LEVEL_ID, 'mimics_den', 24, 72, 8, 8, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 6,
    floorTexture: 'stone-dark',
    fillRule: {
      type: 'scatter',
      props: ['false-door', 'fraud-forked-tongue-relief'],
      density: 0.1,
    },
  });

  const serenissimaId = editor.room(LEVEL_ID, 'serenissima', 36, 72, 6, 6, {
    roomType: ROOM_TYPES.SECRET,
    elevation: 0,
    sortOrder: 7,
    floorTexture: 'stone-dark',
    fillRule: {
      type: 'scatter',
      props: ['fraud-onyx-wall-panel', 'fraud-marble-pedestal'],
      density: 0.12,
    },
  });

  const ingannoParlerId = editor.room(LEVEL_ID, 'inganno_parlor', 21, 84, 14, 14, {
    roomType: ROOM_TYPES.BOSS,
    elevation: -1,
    sortOrder: 8,
    floorTexture: 'marble',
    wallTexture: 'marble',
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
  // EXPANSION — Additional rooms, connections, enemies, and triggers
  // added to bring estimated play time from ~2.3 min to 12–18 min.
  // =========================================================================

  // ── Expansion: update level grid depth to 120 to accommodate new content ──
  // (New rooms stay within existing z=0..98 range except for the extended
  //  west/east corridors — grid width 60 already fits everything.)

  // =========================================================================
  // EX-1. NEW ROOMS
  // =========================================================================
  //
  // Grid occupancy of existing rooms (no new rooms may overlap these):
  //   portico          x=[25,35)  z=[2,8)
  //   hall_of_mirrors  x=[23,37)  z=[12,22)
  //   bolgia_flat      x=[8,20)   z=[26,34)
  //   bolgia_thieves   x=[34,44)  z=[26,34)
  //   shifting_maze    x=[32,46)  z=[38,52)
  //   counterfeit_arena x=[22,34) z=[56,68)
  //   mimics_den       x=[24,32)  z=[72,80)
  //   serenissima      x=[36,42)  z=[72,78)
  //   inganno_parlor   x=[21,35)  z=[84,98)
  //
  // New rooms placed in clear zones:
  //   illusory_gallery      x=[2,16)   z=[12,22)  — west of hall_of_mirrors
  //   false_treasury        x=[46,58)  z=[26,36)  — east of bolgia_thieves
  //   mirror_labyrinth      x=[2,18)   z=[38,52)  — west of shifting_maze
  //   deceivers_corridor    x=[46,58)  z=[40,52)  — east of shifting_maze
  //   architects_chamber    x=[2,16)   z=[56,68)  — west of counterfeit_arena
  //   phantom_vault         x=[36,48)  z=[56,68)  — east of counterfeit_arena

  // EX-1a. Illusory Gallery — exploration, west wing mirror hall
  // Bounds: x=2, z=12, w=14, h=10 → x=[2,16), z=[12,22)
  const illusoryGalleryId = editor.room(LEVEL_ID, 'illusory_gallery', 2, 12, 14, 10, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 9,
    floorTexture: 'marble',
    wallTexture: 'marble',
    fillRule: {
      type: 'scatter',
      props: ['fraud-mirror-shard', 'fraud-two-faced-bust', 'fraud-fake-column'],
      density: 0.12,
    },
  });

  // EX-1b. False Treasury — exploration, east wing lure room
  // Bounds: x=46, z=26, w=12, h=10 → x=[46,58), z=[26,36)
  const falseTreasuryId = editor.room(LEVEL_ID, 'false_treasury', 46, 26, 12, 10, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 10,
    floorTexture: 'marble',
    wallTexture: 'tiles',
    fillRule: {
      type: 'scatter',
      props: ['fraud-gambling-table', 'fraud-coin-pile', 'trick-chest', 'fraud-marble-pedestal'],
      density: 0.15,
    },
  });

  // EX-1c. Mirror Labyrinth — exploration, west side maze
  // Bounds: x=2, z=38, w=16, h=14 → x=[2,18), z=[38,52)
  const mirrorLabyrinthId = editor.room(LEVEL_ID, 'mirror_labyrinth', 2, 38, 16, 14, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 11,
    floorTexture: 'stone-dark',
    wallTexture: 'marble',
    fillRule: {
      type: 'scatter',
      props: ['fraud-mirror-shard', 'fraud-shifting-wall-segment', 'fraud-crumbling-facade'],
      density: 0.14,
    },
  });

  // EX-1d. Deceiver's Corridor — exploration, east side gauntlet
  // Bounds: x=46, z=40, w=12, h=12 → x=[46,58), z=[40,52)
  const deceiversCorridorId = editor.room(LEVEL_ID, 'deceivers_corridor', 46, 40, 12, 12, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 12,
    floorTexture: 'tiles',
    wallTexture: 'stone-dark',
    fillRule: {
      type: 'scatter',
      props: ['fraud-silhouette-prop', 'fraud-forked-tongue-relief', 'false-door'],
      density: 0.1,
    },
  });

  // EX-1e. Architect's Chamber — arena, west side showdown
  // Bounds: x=2, z=56, w=14, h=12 → x=[2,16), z=[56,68)
  const architectsChamber = editor.room(LEVEL_ID, 'architects_chamber', 2, 56, 14, 12, {
    roomType: ROOM_TYPES.ARENA,
    elevation: 0,
    sortOrder: 13,
    floorTexture: 'marble',
    wallTexture: 'marble',
    fillRule: {
      type: 'scatter',
      props: ['fraud-marble-debris', 'fraud-cracked-mosaic-floor', 'fraud-fake-column'],
      density: 0.1,
    },
  });

  // EX-1f. Phantom Vault — secret, east side reward
  // Bounds: x=36, z=56, w=12, h=12 → x=[36,48), z=[56,68)
  const phantomVaultId = editor.room(LEVEL_ID, 'phantom_vault', 36, 56, 12, 12, {
    roomType: ROOM_TYPES.SECRET,
    elevation: 0,
    sortOrder: 14,
    floorTexture: 'stone-dark',
    wallTexture: 'marble',
    fillRule: {
      type: 'scatter',
      props: ['fraud-onyx-wall-panel', 'fraud-marble-pedestal', 'fraud-mirror-shard'],
      density: 0.12,
    },
  });

  // =========================================================================
  // EX-2. NEW CONNECTIONS
  // =========================================================================

  // Illusory Gallery ↔ Hall of Mirrors (corridor, width 2)
  // illusory_gallery east edge (x=16) neighbors hall_of_mirrors west edge (x=23)
  editor.corridor(LEVEL_ID, illusoryGalleryId, hallOfMirrorsId, 2);

  // False Treasury ↔ Bolgia of Thieves (corridor, width 2)
  // bolgia_thieves east edge (x=44) neighbors false_treasury west edge (x=46)
  editor.corridor(LEVEL_ID, falseTreasuryId, bolgiaThievesId, 2);

  // Mirror Labyrinth ↔ Bolgia of Flatterers (corridor, width 2)
  // mirror_labyrinth east edge (x=18) neighbors bolgia_flat west edge (x=8) — south
  editor.corridor(LEVEL_ID, mirrorLabyrinthId, bolgiaFlatId, 2);

  // Deceiver's Corridor ↔ Shifting Maze (corridor, width 2)
  // shifting_maze east edge (x=46) neighbors deceivers_corridor west edge (x=46)
  editor.corridor(LEVEL_ID, deceiversCorridorId, shiftingMazeId, 2);

  // Mirror Labyrinth ↔ Architect's Chamber (corridor, width 2)
  // mirror_labyrinth south edge (z=52) neighbors architects_chamber north edge (z=56)
  editor.corridor(LEVEL_ID, mirrorLabyrinthId, architectsChamber, 2);

  // Architect's Chamber ↔ Counterfeit Arena (corridor, width 2)
  // architects_chamber east edge (x=16) connects to counterfeit_arena west edge (x=22)
  editor.corridor(LEVEL_ID, architectsChamber, counterfeitArenaId, 2);

  // Phantom Vault ↔ Counterfeit Arena (secret, width 2)
  // counterfeit_arena east edge (x=34) neighbors phantom_vault west edge (x=36)
  editor.connect(LEVEL_ID, counterfeitArenaId, phantomVaultId, {
    connectionType: CONNECTION_TYPES.SECRET,
    corridorWidth: 2,
  });

  // Phantom Vault ↔ Mimic's Den (corridor, width 2)
  // phantom_vault south side (z=68) connects toward mimics_den (z=72)
  editor.corridor(LEVEL_ID, phantomVaultId, mimicDenId, 2);

  // Deceiver's Corridor ↔ False Treasury (corridor, width 2)
  // false_treasury south edge (z=36) and deceivers_corridor north edge (z=40) — link the east wing
  editor.corridor(LEVEL_ID, falseTreasuryId, deceiversCorridorId, 2);

  // =========================================================================
  // EX-3. NEW ENEMIES — 45+ total across 6 new rooms
  // =========================================================================

  // ── Illusory Gallery (bounds: 2, 12, 14, 10) → interior: x=[3,15], z=[13,21] ──
  // 4x shadowGoat — patrol the mirrored alcoves
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.SHADOW_GOAT, 5, 14, {
    roomId: illusoryGalleryId,
    patrol: [
      { x: 5, z: 14 },
      { x: 13, z: 14 },
      { x: 9, z: 20 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.SHADOW_GOAT, 13, 14, {
    roomId: illusoryGalleryId,
    patrol: [
      { x: 13, z: 14 },
      { x: 9, z: 20 },
      { x: 5, z: 14 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.SHADOW_GOAT, 5, 20, {
    roomId: illusoryGalleryId,
    patrol: [
      { x: 5, z: 20 },
      { x: 13, z: 20 },
      { x: 9, z: 14 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.SHADOW_GOAT, 13, 20, {
    roomId: illusoryGalleryId,
  });
  // 3x hellgoat — ambush from mirror alcoves
  editor.ambush(
    LEVEL_ID,
    { x: 3, z: 12, w: 12, h: 2 },
    [
      { type: ENEMY_TYPES.HELLGOAT, x: 5, z: 16 },
      { type: ENEMY_TYPES.HELLGOAT, x: 9, z: 18 },
      { type: ENEMY_TYPES.HELLGOAT, x: 13, z: 16 },
    ],
    { roomId: illusoryGalleryId },
  );
  // 2x mimic disguised as props
  editor.spawnEnemy(LEVEL_ID, 'mimic', 7, 17, { roomId: illusoryGalleryId });
  editor.spawnEnemy(LEVEL_ID, 'mimic', 12, 19, { roomId: illusoryGalleryId });

  // ── False Treasury (bounds: 46, 26, 12, 10) → interior: x=[47,57], z=[27,35] ──
  // 3x hellgoat — guarding treasure hoard
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 49, 29, {
    roomId: falseTreasuryId,
    patrol: [
      { x: 49, z: 29 },
      { x: 55, z: 29 },
      { x: 52, z: 33 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 55, 29, {
    roomId: falseTreasuryId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 52, 33, {
    roomId: falseTreasuryId,
  });
  // 2x goatKnight — elite guards
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 48, 28, {
    roomId: falseTreasuryId,
    patrol: [
      { x: 48, z: 28 },
      { x: 48, z: 34 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 56, 28, {
    roomId: falseTreasuryId,
    patrol: [
      { x: 56, z: 28 },
      { x: 56, z: 34 },
    ],
  });
  // 3x mimic — disguised among coin piles
  editor.spawnEnemy(LEVEL_ID, 'mimic', 51, 30, { roomId: falseTreasuryId });
  editor.spawnEnemy(LEVEL_ID, 'mimic', 53, 27, { roomId: falseTreasuryId });
  editor.spawnEnemy(LEVEL_ID, 'mimic', 55, 33, { roomId: falseTreasuryId });

  // ── Mirror Labyrinth (bounds: 2, 38, 16, 14) → interior: x=[3,17], z=[39,51] ──
  // 4x shadowGoat — patrol the maze corridors
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.SHADOW_GOAT, 5, 41, {
    roomId: mirrorLabyrinthId,
    patrol: [
      { x: 5, z: 41 },
      { x: 15, z: 41 },
      { x: 10, z: 46 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.SHADOW_GOAT, 15, 41, {
    roomId: mirrorLabyrinthId,
    patrol: [
      { x: 15, z: 41 },
      { x: 10, z: 46 },
      { x: 5, z: 41 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.SHADOW_GOAT, 4, 49, {
    roomId: mirrorLabyrinthId,
    patrol: [
      { x: 4, z: 49 },
      { x: 16, z: 49 },
      { x: 10, z: 44 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.SHADOW_GOAT, 16, 49, {
    roomId: mirrorLabyrinthId,
  });
  // 3x hellgoat — ambush from wall segments
  editor.ambush(
    LEVEL_ID,
    { x: 3, z: 44, w: 12, h: 4 },
    [
      { type: ENEMY_TYPES.HELLGOAT, x: 6, z: 44 },
      { type: ENEMY_TYPES.HELLGOAT, x: 10, z: 47 },
      { type: ENEMY_TYPES.HELLGOAT, x: 15, z: 44 },
    ],
    { roomId: mirrorLabyrinthId },
  );
  // 2x fireGoat — revealed as walls shift
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 8, 43, {
    roomId: mirrorLabyrinthId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 13, 50, {
    roomId: mirrorLabyrinthId,
  });

  // ── Deceiver's Corridor (bounds: 46, 40, 12, 12) → interior: x=[47,57], z=[41,51] ──
  // 3x shadowGoat — lurking in false doorways
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.SHADOW_GOAT, 49, 43, {
    roomId: deceiversCorridorId,
    patrol: [
      { x: 49, z: 43 },
      { x: 55, z: 43 },
      { x: 52, z: 49 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.SHADOW_GOAT, 55, 43, {
    roomId: deceiversCorridorId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.SHADOW_GOAT, 52, 49, {
    roomId: deceiversCorridorId,
  });
  // 2x goatKnight — flanking gauntlet
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 48, 42, {
    roomId: deceiversCorridorId,
    patrol: [
      { x: 48, z: 42 },
      { x: 56, z: 42 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 56, 50, {
    roomId: deceiversCorridorId,
  });
  // Ambush: 3x hellgoat burst from false doors
  editor.ambush(
    LEVEL_ID,
    { x: 47, z: 45, w: 8, h: 3 },
    [
      { type: ENEMY_TYPES.HELLGOAT, x: 49, z: 47 },
      { type: ENEMY_TYPES.HELLGOAT, x: 52, z: 45 },
      { type: ENEMY_TYPES.HELLGOAT, x: 55, z: 47 },
    ],
    { roomId: deceiversCorridorId },
  );

  // ── Architect's Chamber (bounds: 2, 56, 14, 12) → interior: x=[3,15], z=[57,67] ──
  // Arena waves: Wave 1: goatKnight x2 + hellgoat x2; Wave 2: shadowGoat x3 + fireGoat x1
  editor.setupArenaWaves(LEVEL_ID, architectsChamber, { x: 4, z: 58, w: 10, h: 8 }, [
    [
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 4, z: 62 },
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 14, z: 62 },
      { type: ENEMY_TYPES.HELLGOAT, x: 4, z: 58 },
      { type: ENEMY_TYPES.HELLGOAT, x: 14, z: 66 },
    ],
    [
      { type: ENEMY_TYPES.SHADOW_GOAT, x: 5, z: 60 },
      { type: ENEMY_TYPES.SHADOW_GOAT, x: 13, z: 60 },
      { type: ENEMY_TYPES.SHADOW_GOAT, x: 9, z: 65 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 9, z: 58 },
    ],
  ]);
  // 2x mimic — reward lure
  editor.spawnEnemy(LEVEL_ID, 'mimic', 6, 64, { roomId: architectsChamber });
  editor.spawnEnemy(LEVEL_ID, 'mimic', 12, 64, { roomId: architectsChamber });

  // ── Phantom Vault (bounds: 36, 56, 12, 12) → interior: x=[37,47], z=[57,67] ──
  // 3x goatKnight — elite vault guardians
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 39, 59, {
    roomId: phantomVaultId,
    patrol: [
      { x: 39, z: 59 },
      { x: 45, z: 59 },
      { x: 42, z: 65 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 45, 59, {
    roomId: phantomVaultId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 42, 65, {
    roomId: phantomVaultId,
  });
  // 2x fireGoat — patrolling vault perimeter
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 38, 64, {
    roomId: phantomVaultId,
    patrol: [
      { x: 38, z: 64 },
      { x: 46, z: 64 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 46, 57, {
    roomId: phantomVaultId,
  });
  // 2x mimic — disguised in treasure cluster
  editor.spawnEnemy(LEVEL_ID, 'mimic', 41, 62, { roomId: phantomVaultId });
  editor.spawnEnemy(LEVEL_ID, 'mimic', 43, 58, { roomId: phantomVaultId });

  // =========================================================================
  // EX-4. NEW PICKUPS
  // =========================================================================

  // Illusory Gallery
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 7, 15);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 11, 20);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 14, 18);

  // False Treasury
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 50, 27);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 54, 33);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 56, 29);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.FUEL, 52, 31);

  // Mirror Labyrinth
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 6, 44);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 14, 48);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 10, 50);

  // Deceiver's Corridor
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 50, 44);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 54, 48);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.FUEL, 48, 50);

  // Architect's Chamber
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 5, 60);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 13, 64);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 9, 66);

  // Phantom Vault — generous reward for finding the secret
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 38, 60);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 45, 64);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 40, 66);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 44, 58);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.FUEL, 42, 62);

  // =========================================================================
  // EX-5. NEW PROPS
  // =========================================================================

  // ── Illusory Gallery (bounds: 2, 12, 14, 10) ──
  editor.spawnProp(LEVEL_ID, 'fraud-mirror-shard', 6, 14, { roomId: illusoryGalleryId });
  editor.spawnProp(LEVEL_ID, 'fraud-mirror-shard', 12, 14, { roomId: illusoryGalleryId });
  editor.spawnProp(LEVEL_ID, 'fraud-mirror-shard', 6, 20, { roomId: illusoryGalleryId });
  editor.spawnProp(LEVEL_ID, 'fraud-mirror-shard', 12, 20, { roomId: illusoryGalleryId });
  editor.spawnProp(LEVEL_ID, 'fraud-two-faced-bust', 4, 17, { roomId: illusoryGalleryId });
  editor.spawnProp(LEVEL_ID, 'fraud-two-faced-bust', 14, 17, { roomId: illusoryGalleryId });
  editor.spawnProp(LEVEL_ID, 'fraud-ornate-arch', 9, 13, { roomId: illusoryGalleryId });
  editor.spawnProp(LEVEL_ID, 'torch-sconce-ornate', 3, 16, {
    roomId: illusoryGalleryId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.8,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'torch-sconce-ornate', 14, 16, {
    roomId: illusoryGalleryId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.8,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });

  // ── False Treasury (bounds: 46, 26, 12, 10) ──
  editor.spawnProp(LEVEL_ID, 'fraud-coin-pile', 49, 28, { roomId: falseTreasuryId });
  editor.spawnProp(LEVEL_ID, 'fraud-coin-pile', 53, 28, { roomId: falseTreasuryId });
  editor.spawnProp(LEVEL_ID, 'fraud-coin-pile', 56, 32, { roomId: falseTreasuryId });
  editor.spawnProp(LEVEL_ID, 'trick-chest', 50, 30, { roomId: falseTreasuryId });
  editor.spawnProp(LEVEL_ID, 'trick-chest', 54, 34, { roomId: falseTreasuryId });
  editor.spawnProp(LEVEL_ID, 'fraud-marble-pedestal', 52, 31, { roomId: falseTreasuryId });
  editor.spawnProp(LEVEL_ID, 'fraud-golden-banner', 47, 27, {
    roomId: falseTreasuryId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'fraud-golden-banner', 56, 27, {
    roomId: falseTreasuryId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'fraud-ornate-arch', 52, 27, { roomId: falseTreasuryId });

  // ── Mirror Labyrinth (bounds: 2, 38, 16, 14) ──
  editor.spawnProp(LEVEL_ID, 'fraud-shifting-wall-segment', 6, 41, { roomId: mirrorLabyrinthId });
  editor.spawnProp(LEVEL_ID, 'fraud-shifting-wall-segment', 10, 44, { roomId: mirrorLabyrinthId });
  editor.spawnProp(LEVEL_ID, 'fraud-shifting-wall-segment', 14, 47, { roomId: mirrorLabyrinthId });
  editor.spawnProp(LEVEL_ID, 'fraud-shifting-wall-segment', 6, 49, { roomId: mirrorLabyrinthId });
  editor.spawnProp(LEVEL_ID, 'fraud-mirror-shard', 4, 42, { roomId: mirrorLabyrinthId });
  editor.spawnProp(LEVEL_ID, 'fraud-mirror-shard', 15, 44, { roomId: mirrorLabyrinthId });
  editor.spawnProp(LEVEL_ID, 'fraud-mirror-shard', 9, 50, { roomId: mirrorLabyrinthId });
  editor.spawnProp(LEVEL_ID, 'fraud-cracked-mosaic-floor', 8, 43, { roomId: mirrorLabyrinthId });
  editor.spawnProp(LEVEL_ID, 'fraud-cracked-mosaic-floor', 13, 47, { roomId: mirrorLabyrinthId });
  editor.spawnProp(LEVEL_ID, 'torch-sconce-ornate', 3, 44, {
    roomId: mirrorLabyrinthId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.8,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'torch-sconce-ornate', 16, 48, {
    roomId: mirrorLabyrinthId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.8,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });

  // ── Deceiver's Corridor (bounds: 46, 40, 12, 12) ──
  editor.spawnProp(LEVEL_ID, 'false-door', 47, 44, { roomId: deceiversCorridorId });
  editor.spawnProp(LEVEL_ID, 'false-door', 56, 48, { roomId: deceiversCorridorId });
  editor.spawnProp(LEVEL_ID, 'fraud-forked-tongue-relief', 52, 41, {
    roomId: deceiversCorridorId,
    surfaceAnchor: {
      face: 'north',
      offsetX: 0,
      offsetY: 1.2,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.8,
    },
  });
  editor.spawnProp(LEVEL_ID, 'fraud-silhouette-prop', 49, 46, { roomId: deceiversCorridorId });
  editor.spawnProp(LEVEL_ID, 'fraud-silhouette-prop', 54, 49, { roomId: deceiversCorridorId });
  editor.spawnProp(LEVEL_ID, 'torch-sconce-ornate', 47, 46, {
    roomId: deceiversCorridorId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.8,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'torch-sconce-ornate', 57, 44, {
    roomId: deceiversCorridorId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.8,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });

  // ── Architect's Chamber (bounds: 2, 56, 14, 12) ──
  editor.spawnProp(LEVEL_ID, 'fraud-fake-column', 5, 58, { roomId: architectsChamber });
  editor.spawnProp(LEVEL_ID, 'fraud-fake-column', 13, 58, { roomId: architectsChamber });
  editor.spawnProp(LEVEL_ID, 'fraud-fake-column', 5, 66, { roomId: architectsChamber });
  editor.spawnProp(LEVEL_ID, 'fraud-fake-column', 13, 66, { roomId: architectsChamber });
  editor.spawnProp(LEVEL_ID, 'fraud-crumbling-facade', 3, 63, { roomId: architectsChamber });
  editor.spawnProp(LEVEL_ID, 'fraud-marble-debris', 9, 65, { roomId: architectsChamber });
  editor.spawnProp(LEVEL_ID, 'fraud-ornate-arch', 8, 57, { roomId: architectsChamber });
  editor.spawnProp(LEVEL_ID, 'torch-sconce-ornate', 3, 61, {
    roomId: architectsChamber,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.8,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'torch-sconce-ornate', 14, 63, {
    roomId: architectsChamber,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.8,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });

  // ── Phantom Vault (bounds: 36, 56, 12, 12) ──
  editor.spawnProp(LEVEL_ID, 'fraud-onyx-wall-panel', 38, 58, { roomId: phantomVaultId });
  editor.spawnProp(LEVEL_ID, 'fraud-onyx-wall-panel', 44, 58, { roomId: phantomVaultId });
  editor.spawnProp(LEVEL_ID, 'fraud-onyx-wall-panel', 38, 66, { roomId: phantomVaultId });
  editor.spawnProp(LEVEL_ID, 'fraud-onyx-wall-panel', 44, 66, { roomId: phantomVaultId });
  editor.spawnProp(LEVEL_ID, 'fraud-marble-pedestal', 42, 62, { roomId: phantomVaultId });
  editor.spawnProp(LEVEL_ID, 'fraud-mirror-shard', 39, 63, { roomId: phantomVaultId });
  editor.spawnProp(LEVEL_ID, 'fraud-mirror-shard', 45, 61, { roomId: phantomVaultId });
  editor.spawnProp(LEVEL_ID, 'fraud-coin-pile', 40, 65, { roomId: phantomVaultId });
  editor.spawnProp(LEVEL_ID, 'fraud-coin-pile', 44, 57, { roomId: phantomVaultId });
  editor.spawnProp(LEVEL_ID, 'torch-sconce-ornate', 37, 62, {
    roomId: phantomVaultId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.8,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'torch-sconce-ornate', 47, 60, {
    roomId: phantomVaultId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.8,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });

  // =========================================================================
  // EX-6. NEW DECALS
  // =========================================================================

  editor.placeDecals(LEVEL_ID, illusoryGalleryId, [
    { type: DECAL_TYPES.RUST_PATCH, x: 5, z: 14, opacity: 0.35 },
    { type: DECAL_TYPES.RUST_PATCH, x: 13, z: 20, opacity: 0.3 },
    { type: DECAL_TYPES.WATER_STAIN, x: 3, z: 16, surface: 'wall', opacity: 0.35 },
  ]);

  editor.placeDecals(LEVEL_ID, falseTreasuryId, [
    { type: DECAL_TYPES.RUST_PATCH, x: 51, z: 29, opacity: 0.4 },
    { type: DECAL_TYPES.RUST_PATCH, x: 55, z: 33, opacity: 0.3 },
    { type: DECAL_TYPES.WATER_STAIN, x: 47, z: 30, surface: 'wall', opacity: 0.35 },
  ]);

  editor.placeDecals(LEVEL_ID, mirrorLabyrinthId, [
    { type: DECAL_TYPES.RUST_PATCH, x: 6, z: 41, opacity: 0.4 },
    { type: DECAL_TYPES.RUST_PATCH, x: 14, z: 49, opacity: 0.35 },
    { type: DECAL_TYPES.WATER_STAIN, x: 3, z: 45, surface: 'wall', opacity: 0.3 },
  ]);

  editor.placeDecals(LEVEL_ID, deceiversCorridorId, [
    { type: DECAL_TYPES.RUST_PATCH, x: 50, z: 43, opacity: 0.35 },
    { type: DECAL_TYPES.WATER_STAIN, x: 57, z: 46, surface: 'wall', opacity: 0.3 },
  ]);

  editor.placeDecals(LEVEL_ID, architectsChamber, [
    { type: DECAL_TYPES.RUST_PATCH, x: 5, z: 58, opacity: 0.35 },
    { type: DECAL_TYPES.RUST_PATCH, x: 13, z: 66, opacity: 0.35 },
    { type: DECAL_TYPES.WATER_STAIN, x: 3, z: 62, surface: 'wall', opacity: 0.3 },
  ]);

  editor.placeDecals(LEVEL_ID, phantomVaultId, [
    { type: DECAL_TYPES.RUST_PATCH, x: 40, z: 62, opacity: 0.3 },
    { type: DECAL_TYPES.WATER_STAIN, x: 37, z: 63, surface: 'wall', opacity: 0.25 },
  ]);

  // =========================================================================
  // EX-7. NEW TRIGGERS — encounter sequences and ambushes
  // =========================================================================

  // Illusory Gallery: lockOnEntry to trap the player while shadowGoats patrol
  editor.lockOnEntry(LEVEL_ID, illusoryGalleryId, { x: 3, z: 12, w: 12, h: 2 });

  // False Treasury: ambush trigger — goatKnights activate when player nears center
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 49,
    zoneZ: 29,
    zoneW: 6,
    zoneH: 4,
    roomId: falseTreasuryId,
    once: true,
    actionData: { type: 'revealGuards', message: 'The gold is a lie.' },
  });

  // Mirror Labyrinth: shiftWalls trigger — walls rearrange every 10 seconds
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 3,
    zoneZ: 39,
    zoneW: 14,
    zoneH: 12,
    roomId: mirrorLabyrinthId,
    once: false,
    actionData: { type: 'shiftWalls', wallSegments: 4, maxShift: 2, cooldown: 10 },
  });

  // Deceiver's Corridor: illusion zone thickens fog on entry
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 47,
    zoneZ: 41,
    zoneW: 10,
    zoneH: 2,
    roomId: deceiversCorridorId,
    once: true,
    actionData: { type: 'fogThicken', fogDensity: 0.08 },
  });

  // Architect's Chamber: standard arena lock — handled by setupArenaWaves above.
  // Add a dialogue trigger at entry to provide narrative context.
  editor.dialogue(LEVEL_ID, { x: 3, z: 56, w: 12, h: 2 }, 'Even the pillars here are lies.', {
    roomId: architectsChamber,
  });

  // Phantom Vault: reveal secret on entry — rewarding the observant player
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.SECRET_REVEAL,
    zoneX: 37,
    zoneZ: 57,
    zoneW: 10,
    zoneH: 2,
    roomId: phantomVaultId,
    once: true,
  });

  // =========================================================================
  // EX-8. NEW ENVIRONMENT ZONES
  // =========================================================================

  // Illusory Gallery — high illusion intensity (mirrors confuse)
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.ILLUSION,
    boundsX: 2,
    boundsZ: 12,
    boundsW: 14,
    boundsH: 10,
    intensity: 0.7,
  });

  // False Treasury — mild fog (gilded haze)
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.FOG,
    boundsX: 46,
    boundsZ: 26,
    boundsW: 12,
    boundsH: 10,
    intensity: 0.4,
  });

  // Mirror Labyrinth — heavy illusion + fog overlay
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.ILLUSION,
    boundsX: 2,
    boundsZ: 38,
    boundsW: 16,
    boundsH: 14,
    intensity: 0.9,
  });

  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.FOG,
    boundsX: 2,
    boundsZ: 38,
    boundsW: 16,
    boundsH: 14,
    intensity: 0.65,
  });

  // Deceiver's Corridor — void darkness
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.VOID,
    boundsX: 46,
    boundsZ: 40,
    boundsW: 12,
    boundsH: 12,
    intensity: 0.5,
  });

  // Phantom Vault — subtle illusion (things aren't what they seem)
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.ILLUSION,
    boundsX: 36,
    boundsZ: 56,
    boundsW: 12,
    boundsH: 12,
    intensity: 0.6,
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
  // EX-9. FIX CONNECTIVITY — Phantom Vault reachability
  // =========================================================================
  // The phantom_vault's secret connection from counterfeit_arena is not
  // traversed by the A* playtest.  Add a regular corridor to serenissima
  // (x=[36,42), z=[72,78)) which is already connected to mimics_den, so the
  // vault becomes reachable via: counterfeit_arena → mimics_den → serenissima
  // → phantom_vault (or directly from phantom_vault → mimics_den corridor).
  // Also add an explicit corridor from shifting_maze → phantom_vault so the
  // east wing forms a full loop.
  //
  // phantom_vault: x=[36,48), z=[56,68)
  // serenissima:   x=[36,42), z=[72,78)  — gap between them at z=[68,72)
  // shifting_maze: x=[32,46), z=[38,52)  — gap at z=[52,56)
  //
  // Connect phantom_vault ↔ serenissima (corridor, width 2)
  editor.corridor(LEVEL_ID, phantomVaultId, serenissimaId, 2);

  // =========================================================================
  // EX-10. ADDITIONAL ENEMIES — push play time above 12 min target
  // =========================================================================
  // Current: ~9.6 min with 32 enemies. Need ~25% more combat content.
  // Adding 2 more waves of enemies spread across high-traffic rooms.

  // Illusory Gallery bonus patrol — 2x fireGoat roaming the gallery
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 9, 15, {
    roomId: illusoryGalleryId,
    patrol: [
      { x: 9, z: 15 },
      { x: 9, z: 20 },
      { x: 14, z: 17 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 4, 19, {
    roomId: illusoryGalleryId,
  });

  // Mirror Labyrinth bonus — 2x goatKnight blocking the exit
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 10, 49, {
    roomId: mirrorLabyrinthId,
    patrol: [
      { x: 10, z: 49 },
      { x: 16, z: 49 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 5, 51, {
    roomId: mirrorLabyrinthId,
  });

  // Deceiver's Corridor bonus — 2x fireGoat in the dark gauntlet
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 51, 41, {
    roomId: deceiversCorridorId,
    patrol: [
      { x: 51, z: 41 },
      { x: 51, z: 50 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 55, 50, {
    roomId: deceiversCorridorId,
  });

  // False Treasury bonus — 1x extra goatKnight, the hidden sentinel
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 52, 35, {
    roomId: falseTreasuryId,
    patrol: [
      { x: 52, z: 35 },
      { x: 47, z: 35 },
    ],
  });

  // Phantom Vault bonus — 1x shadowGoat lurking near the bonus loot
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.SHADOW_GOAT, 43, 63, {
    roomId: phantomVaultId,
    patrol: [
      { x: 43, z: 63 },
      { x: 38, z: 63 },
      { x: 40, z: 58 },
    ],
  });

  // Architect's Chamber bonus mimics — 2 additional disguised enemies
  editor.spawnEnemy(LEVEL_ID, 'mimic', 4, 60, { roomId: architectsChamber });
  editor.spawnEnemy(LEVEL_ID, 'mimic', 13, 62, { roomId: architectsChamber });

  // ── Extra patrol enemies spread across expansion rooms ──
  // These are always-active (not wave-gated) so the playtest counts them.

  // Illusory Gallery — 2 more hellgoat sentinels at entry arch
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 5, 13, { roomId: illusoryGalleryId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 13, 13, { roomId: illusoryGalleryId });

  // False Treasury — 2 more hellgoat guards flanking the chest display
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 47, 31, { roomId: falseTreasuryId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 57, 31, { roomId: falseTreasuryId });

  // Mirror Labyrinth — 2 more shadowGoat wanderers (the maze is large)
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.SHADOW_GOAT, 7, 40, {
    roomId: mirrorLabyrinthId,
    patrol: [
      { x: 7, z: 40 },
      { x: 15, z: 50 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.SHADOW_GOAT, 15, 40, {
    roomId: mirrorLabyrinthId,
    patrol: [
      { x: 15, z: 40 },
      { x: 7, z: 50 },
    ],
  });

  // Deceiver's Corridor — 2 more shadowGoat behind false doors
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.SHADOW_GOAT, 48, 44, { roomId: deceiversCorridorId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.SHADOW_GOAT, 56, 48, { roomId: deceiversCorridorId });

  // Phantom Vault — 2 more goatKnight elites guarding the true cache
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 37, 57, { roomId: phantomVaultId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 46, 66, { roomId: phantomVaultId });

  // Hall of Mirrors — 2 bonus fireGoat to reinforce the opening area
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 26, 17, { roomId: hallOfMirrorsId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 34, 19, { roomId: hallOfMirrorsId });

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
