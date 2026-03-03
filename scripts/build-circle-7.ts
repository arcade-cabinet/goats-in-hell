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
    texturePalette: {
      exploration: 'metal',
      arena: 'metal-dark',
      boss: 'metal-dark',
      secret: 'metal',
    },
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
    floorTexture: 'concrete',
    wallTexture: 'metal',
  });

  const bloodRiverId = editor.room(LEVEL_ID, 'blood_river', 20, 12, 20, 14, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 1,
    floorTexture: 'lava-dark',
    wallTexture: 'metal',
    fillRule: {
      type: 'scatter',
      props: ['violence-blood-pool', 'violence-blood-gutter', 'blood-trough'],
      density: 0.08,
    },
  });

  const riverBanksId = editor.room(LEVEL_ID, 'river_banks', 8, 20, 8, 6, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 2,
    floorTexture: 'concrete',
    wallTexture: 'metal',
    fillRule: {
      type: 'scatter',
      props: ['violence-iron-railing', 'violence-walkway-pillar'],
      density: 0.1,
    },
  });

  const thornyPassageId = editor.room(LEVEL_ID, 'thorny_passage', 44, 18, 6, 16, {
    roomType: ROOM_TYPES.PLATFORMING,
    elevation: 0,
    sortOrder: 3,
    floorTexture: 'concrete',
    wallTexture: 'concrete',
    fillRule: {
      type: 'scatter',
      props: ['violence-thorn-column', 'thorn-cluster-large'],
      density: 0.12,
    },
  });

  const thornwoodId = editor.room(LEVEL_ID, 'thornwood', 36, 38, 14, 12, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 4,
    floorTexture: 'concrete',
    wallTexture: 'metal',
    fillRule: {
      type: 'scatter',
      props: ['violence-thorn-column', 'violence-rusted-anvil', 'wrath-iron-grate'],
      density: 0.1,
    },
  });

  const burningShoreId = editor.room(LEVEL_ID, 'burning_shore', 16, 54, 18, 10, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 5,
    floorTexture: 'lava',
    wallTexture: 'concrete',
    fillRule: {
      type: 'scatter',
      props: ['violence-fire-geyser-vent', 'violence-stone-altar'],
      density: 0.08,
    },
  });

  const flamethrowerShrineId = editor.room(LEVEL_ID, 'flamethrower_shrine', 22, 68, 6, 6, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 6,
    floorTexture: 'metal',
    wallTexture: 'metal',
  });

  const slaughterhouseId = editor.room(LEVEL_ID, 'slaughterhouse', 18, 78, 14, 12, {
    roomType: ROOM_TYPES.ARENA,
    elevation: 0,
    sortOrder: 7,
    floorTexture: 'metal-dark',
    wallTexture: 'metal-dark',
    fillRule: {
      type: 'scatter',
      props: ['violence-chain-conveyor', 'violence-hook-rack', 'meat-hook', 'torture-rack'],
      density: 0.08,
    },
  });

  const butchersHookId = editor.room(LEVEL_ID, 'butchers_hook', 36, 82, 6, 6, {
    roomType: ROOM_TYPES.SECRET,
    elevation: 0,
    sortOrder: 8,
    floorTexture: 'metal-dark',
    fillRule: {
      type: 'scatter',
      props: ['meat-hook', 'blood-trough'],
      density: 0.15,
    },
  });

  const abattoirId = editor.room(LEVEL_ID, 'il_macello_abattoir', 17, 94, 16, 16, {
    roomType: ROOM_TYPES.BOSS,
    elevation: -1,
    sortOrder: 9,
    floorTexture: 'metal-dark',
    wallTexture: 'metal-dark',
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
  // 2x torch-sconce-ornate (east/west walls)
  editor.spawnProp(LEVEL_ID, 'torch-sconce-ornate', 27, 3, {
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
  editor.spawnProp(LEVEL_ID, 'torch-sconce-ornate', 32, 3, {
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
  // 1x violence-iron-railing (west pier edge)
  editor.spawnProp(LEVEL_ID, 'violence-iron-railing', 27, 5, { roomId: pierId });
  // 1x violence-blood-cauldron (floor, pier edge)
  editor.spawnProp(LEVEL_ID, 'violence-blood-cauldron', 31, 4, { roomId: pierId });
  // 1x blood-trough (near stairs)
  editor.spawnProp(LEVEL_ID, 'blood-trough', 28, 6, { roomId: pierId });
  // 1x bone-pile (NE corner)
  editor.spawnProp(LEVEL_ID, 'bone-pile', 33, 3, { roomId: pierId });
  // 1x violence-industrial-arch (south door)
  editor.spawnProp(LEVEL_ID, 'violence-industrial-arch', 30, 7, { roomId: pierId });
  // 1x violence-pier-overlook (east/west edges)
  editor.spawnProp(LEVEL_ID, 'violence-pier-overlook', 27, 4, { roomId: pierId });
  // 1x violence-walkway-pillar (south stair flanks)
  editor.spawnProp(LEVEL_ID, 'violence-walkway-pillar', 32, 6, { roomId: pierId });

  // --- Blood River (bounds: 20, 12, 20, 14) ---
  // 6x violence-walkway-pillar (support pillars rising from blood)
  editor.spawnProp(LEVEL_ID, 'violence-walkway-pillar', 23, 14, { roomId: bloodRiverId });
  editor.spawnProp(LEVEL_ID, 'violence-walkway-pillar', 28, 16, { roomId: bloodRiverId });
  editor.spawnProp(LEVEL_ID, 'violence-walkway-pillar', 35, 15, { roomId: bloodRiverId });
  editor.spawnProp(LEVEL_ID, 'violence-walkway-pillar', 24, 20, { roomId: bloodRiverId });
  editor.spawnProp(LEVEL_ID, 'violence-walkway-pillar', 32, 22, { roomId: bloodRiverId });
  editor.spawnProp(LEVEL_ID, 'violence-walkway-pillar', 37, 23, { roomId: bloodRiverId });
  // 6x torch-sconce-ornate (on walkway pillars)
  editor.spawnProp(LEVEL_ID, 'torch-sconce-ornate', 23, 14, { roomId: bloodRiverId });
  editor.spawnProp(LEVEL_ID, 'torch-sconce-ornate', 28, 16, { roomId: bloodRiverId });
  editor.spawnProp(LEVEL_ID, 'torch-sconce-ornate', 35, 15, { roomId: bloodRiverId });
  editor.spawnProp(LEVEL_ID, 'torch-sconce-ornate', 24, 20, { roomId: bloodRiverId });
  editor.spawnProp(LEVEL_ID, 'torch-sconce-ornate', 32, 22, { roomId: bloodRiverId });
  editor.spawnProp(LEVEL_ID, 'torch-sconce-ornate', 37, 23, { roomId: bloodRiverId });
  // 1x violence-blood-river-arch (walkway junction hero piece)
  editor.spawnProp(LEVEL_ID, 'violence-blood-river-arch', 30, 14, { roomId: bloodRiverId });
  // 3x violence-rusted-walkway-platform (dead-end platforms)
  editor.spawnProp(LEVEL_ID, 'violence-rusted-walkway-platform', 22, 18, { roomId: bloodRiverId });
  editor.spawnProp(LEVEL_ID, 'violence-rusted-walkway-platform', 36, 24, { roomId: bloodRiverId });
  editor.spawnProp(LEVEL_ID, 'violence-rusted-walkway-platform', 38, 16, { roomId: bloodRiverId });
  // 2x violence-blood-pool (between walkways)
  editor.spawnProp(LEVEL_ID, 'violence-blood-pool', 26, 18, { roomId: bloodRiverId });
  editor.spawnProp(LEVEL_ID, 'violence-blood-pool', 34, 20, { roomId: bloodRiverId });
  // 2x violence-iron-railing (walkway edges)
  editor.spawnProp(LEVEL_ID, 'violence-iron-railing', 25, 16, { roomId: bloodRiverId });
  editor.spawnProp(LEVEL_ID, 'violence-iron-railing', 33, 20, { roomId: bloodRiverId });
  // 1x blood-trough (walkway edge)
  editor.spawnProp(LEVEL_ID, 'blood-trough', 24, 18, { roomId: bloodRiverId });
  // 2x violence-blood-gutter (drainage channels)
  editor.spawnProp(LEVEL_ID, 'violence-blood-gutter', 26, 20, { roomId: bloodRiverId });
  editor.spawnProp(LEVEL_ID, 'violence-blood-gutter', 32, 16, { roomId: bloodRiverId });
  // 1x bone-pile (dead-end walkway)
  editor.spawnProp(LEVEL_ID, 'bone-pile', 35, 22, { roomId: bloodRiverId });

  // --- River Banks (bounds: 8, 20, 8, 6) ---
  // 1x torch-sconce-ornate (north wall)
  editor.spawnProp(LEVEL_ID, 'torch-sconce-ornate', 12, 21, {
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
  // 1x violence-industrial-arch (north door)
  editor.spawnProp(LEVEL_ID, 'violence-industrial-arch', 12, 21, { roomId: riverBanksId });
  // 1x violence-blood-cauldron (near north entrance)
  editor.spawnProp(LEVEL_ID, 'violence-blood-cauldron', 10, 21, { roomId: riverBanksId });
  // 1x bone-pile (south half)
  editor.spawnProp(LEVEL_ID, 'bone-pile', 14, 23, { roomId: riverBanksId });
  // 1x rubble-pile-small (west side)
  editor.spawnProp(LEVEL_ID, 'rubble-pile-small', 9, 22, { roomId: riverBanksId });

  // --- Thorny Passage (bounds: 44, 18, 6, 16) ---
  // 8x violence-thorn-column (along both walls)
  editor.spawnProp(LEVEL_ID, 'violence-thorn-column', 45, 19, { roomId: thornyPassageId });
  editor.spawnProp(LEVEL_ID, 'violence-thorn-column', 48, 20, { roomId: thornyPassageId });
  editor.spawnProp(LEVEL_ID, 'violence-thorn-column', 45, 23, { roomId: thornyPassageId });
  editor.spawnProp(LEVEL_ID, 'violence-thorn-column', 48, 24, { roomId: thornyPassageId });
  editor.spawnProp(LEVEL_ID, 'violence-thorn-column', 45, 27, { roomId: thornyPassageId });
  editor.spawnProp(LEVEL_ID, 'violence-thorn-column', 48, 28, { roomId: thornyPassageId });
  editor.spawnProp(LEVEL_ID, 'violence-thorn-column', 45, 31, { roomId: thornyPassageId });
  editor.spawnProp(LEVEL_ID, 'violence-thorn-column', 48, 32, { roomId: thornyPassageId });
  // 1x violence-blood-pool (base of first ramp)
  editor.spawnProp(LEVEL_ID, 'violence-blood-pool', 46, 22, { roomId: thornyPassageId });
  // 2x rope-hanging (ceiling, passage midpoints)
  editor.spawnProp(LEVEL_ID, 'rope-hanging', 47, 25, { roomId: thornyPassageId });
  editor.spawnProp(LEVEL_ID, 'rope-hanging', 47, 29, { roomId: thornyPassageId });
  // 2x spike-bed-small (ramp transitions)
  editor.spawnProp(LEVEL_ID, 'spike-bed-small', 45, 20, { roomId: thornyPassageId });
  editor.spawnProp(LEVEL_ID, 'spike-bed-small', 45, 32, { roomId: thornyPassageId });

  // --- Thornwood (bounds: 36, 38, 14, 12) ---
  // 1x torch-sconce-simple (south exit only)
  editor.spawnProp(LEVEL_ID, 'torch-sconce-simple', 46, 48, {
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
  // 1x violence-sawblade-decoration (north wall)
  editor.spawnProp(LEVEL_ID, 'violence-sawblade-decoration', 37, 39, { roomId: thornwoodId });
  // 1x violence-blood-pool (center lane intersection)
  editor.spawnProp(LEVEL_ID, 'violence-blood-pool', 40, 42, { roomId: thornwoodId });
  // 4x bone-pile (at dead-end column clusters)
  editor.spawnProp(LEVEL_ID, 'bone-pile', 39, 43, { roomId: thornwoodId });
  editor.spawnProp(LEVEL_ID, 'bone-pile', 44, 41, { roomId: thornwoodId });
  editor.spawnProp(LEVEL_ID, 'bone-pile', 37, 47, { roomId: thornwoodId });
  editor.spawnProp(LEVEL_ID, 'bone-pile', 43, 49, { roomId: thornwoodId });

  // --- Burning Shore (bounds: 16, 54, 18, 10) ---
  // 6x violence-fire-geyser-vent (marking geyser eruption points)
  editor.spawnProp(LEVEL_ID, 'violence-fire-geyser-vent', 18, 55, { roomId: burningShoreId });
  editor.spawnProp(LEVEL_ID, 'violence-fire-geyser-vent', 28, 55, { roomId: burningShoreId });
  editor.spawnProp(LEVEL_ID, 'violence-fire-geyser-vent', 23, 57, { roomId: burningShoreId });
  editor.spawnProp(LEVEL_ID, 'violence-fire-geyser-vent', 18, 59, { roomId: burningShoreId });
  editor.spawnProp(LEVEL_ID, 'violence-fire-geyser-vent', 30, 59, { roomId: burningShoreId });
  editor.spawnProp(LEVEL_ID, 'violence-fire-geyser-vent', 24, 61, { roomId: burningShoreId });
  // 2x fire-pit-small (between geysers)
  editor.spawnProp(LEVEL_ID, 'fire-pit-small', 20, 56, { roomId: burningShoreId });
  editor.spawnProp(LEVEL_ID, 'fire-pit-small', 26, 60, { roomId: burningShoreId });
  // 1x rubble-pile-small (visual break)
  editor.spawnProp(LEVEL_ID, 'rubble-pile-small', 22, 58, { roomId: burningShoreId });

  // --- Flamethrower Shrine (bounds: 22, 68, 6, 6) ---
  // 1x violence-stone-altar (center)
  editor.spawnProp(LEVEL_ID, 'violence-stone-altar', 24, 71, { roomId: flamethrowerShrineId });
  // 1x skull-candelabra (behind altar)
  editor.spawnProp(LEVEL_ID, 'skull-candelabra', 24, 70, { roomId: flamethrowerShrineId });
  // 2x torch-sconce-ornate (east/west walls, warm gold)
  editor.spawnProp(LEVEL_ID, 'torch-sconce-ornate', 23, 70, {
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
  editor.spawnProp(LEVEL_ID, 'torch-sconce-ornate', 26, 70, {
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
  // 1x violence-blood-cauldron (cold, empty)
  editor.spawnProp(LEVEL_ID, 'violence-blood-cauldron', 23, 72, { roomId: flamethrowerShrineId });
  // 2x bone-column (flanking entrance)
  editor.spawnProp(LEVEL_ID, 'bone-column', 23, 69, { roomId: flamethrowerShrineId });
  editor.spawnProp(LEVEL_ID, 'bone-column', 25, 69, { roomId: flamethrowerShrineId });

  // --- Slaughterhouse (bounds: 18, 78, 14, 12) ---
  // 9x meat-hook (ceiling, 3x3 grid)
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
    editor.spawnProp(LEVEL_ID, 'meat-hook', cx, cz, { roomId: slaughterhouseId });
  }
  // 4x torch-sconce-ornate (walls, industrial yellow)
  editor.spawnProp(LEVEL_ID, 'torch-sconce-ornate', 19, 80, {
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
  editor.spawnProp(LEVEL_ID, 'torch-sconce-ornate', 30, 80, {
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
  editor.spawnProp(LEVEL_ID, 'torch-sconce-ornate', 19, 86, {
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
  editor.spawnProp(LEVEL_ID, 'torch-sconce-ornate', 30, 86, {
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
  // 4x violence-metal-crate-stack (floor, partial cover)
  editor.spawnProp(LEVEL_ID, 'violence-metal-crate-stack', 20, 82, { roomId: slaughterhouseId });
  editor.spawnProp(LEVEL_ID, 'violence-metal-crate-stack', 29, 82, { roomId: slaughterhouseId });
  editor.spawnProp(LEVEL_ID, 'violence-metal-crate-stack', 20, 86, { roomId: slaughterhouseId });
  editor.spawnProp(LEVEL_ID, 'violence-metal-crate-stack', 29, 86, { roomId: slaughterhouseId });
  // 1x violence-butcher-block (center)
  editor.spawnProp(LEVEL_ID, 'violence-butcher-block', 25, 83, { roomId: slaughterhouseId });
  // 1x violence-rusted-anvil (NW corner)
  editor.spawnProp(LEVEL_ID, 'violence-rusted-anvil', 19, 79, { roomId: slaughterhouseId });
  // 1x violence-bone-grinder (SE area)
  editor.spawnProp(LEVEL_ID, 'violence-bone-grinder', 30, 85, { roomId: slaughterhouseId });
  // 1x violence-blood-gutter (center south)
  editor.spawnProp(LEVEL_ID, 'violence-blood-gutter', 22, 86, { roomId: slaughterhouseId });
  // 1x violence-hook-rack (north center)
  editor.spawnProp(LEVEL_ID, 'violence-hook-rack', 25, 80, { roomId: slaughterhouseId });
  // 1x violence-sawblade-decoration (west wall)
  editor.spawnProp(LEVEL_ID, 'violence-sawblade-decoration', 18, 82, { roomId: slaughterhouseId });
  // 1x violence-industrial-arch (north entrance)
  editor.spawnProp(LEVEL_ID, 'violence-industrial-arch', 25, 79, { roomId: slaughterhouseId });

  // --- Butcher's Hook (bounds: 36, 82, 6, 6) ---
  // 2x violence-metal-crate-stack (corners)
  editor.spawnProp(LEVEL_ID, 'violence-metal-crate-stack', 37, 83, { roomId: butchersHookId });
  editor.spawnProp(LEVEL_ID, 'violence-metal-crate-stack', 40, 83, { roomId: butchersHookId });
  // 1x violence-blood-gutter (floor center)
  editor.spawnProp(LEVEL_ID, 'violence-blood-gutter', 38, 85, { roomId: butchersHookId });
  // 1x torch-sconce-simple (north wall)
  editor.spawnProp(LEVEL_ID, 'torch-sconce-simple', 39, 83, {
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
  // 8x meat-hook (ceiling)
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
    editor.spawnProp(LEVEL_ID, 'meat-hook', cx, cz, { roomId: abattoirId });
  }
  // 4x torch-sconce-ornate (corners, deep orange)
  editor.spawnProp(LEVEL_ID, 'torch-sconce-ornate', 18, 95, {
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
  editor.spawnProp(LEVEL_ID, 'torch-sconce-ornate', 31, 95, {
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
  editor.spawnProp(LEVEL_ID, 'torch-sconce-ornate', 18, 108, {
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
  editor.spawnProp(LEVEL_ID, 'torch-sconce-ornate', 31, 108, {
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
  // 1x chandelier-iron (ceiling center)
  editor.spawnProp(LEVEL_ID, 'chandelier-iron', 25, 107, { roomId: abattoirId });
  // 2x violence-sawblade-decoration (south wall trophies)
  editor.spawnProp(LEVEL_ID, 'violence-sawblade-decoration', 22, 108, {
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
  editor.spawnProp(LEVEL_ID, 'violence-sawblade-decoration', 28, 108, {
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
  // 2x violence-industrial-cage (north corners)
  editor.spawnProp(LEVEL_ID, 'violence-industrial-cage', 19, 96, { roomId: abattoirId });
  editor.spawnProp(LEVEL_ID, 'violence-industrial-cage', 31, 96, { roomId: abattoirId });
  // 1x violence-blood-pool (center floor cosmetic)
  editor.spawnProp(LEVEL_ID, 'violence-blood-pool', 25, 102, { roomId: abattoirId });
  // 1x violence-bone-grinder (SW corner)
  editor.spawnProp(LEVEL_ID, 'violence-bone-grinder', 19, 108, { roomId: abattoirId });
  // 1x violence-blood-gutter (center floor)
  editor.spawnProp(LEVEL_ID, 'violence-blood-gutter', 25, 100, { roomId: abattoirId });
  // 1x violence-hook-rack (SE corner)
  editor.spawnProp(LEVEL_ID, 'violence-hook-rack', 31, 108, { roomId: abattoirId });
  // 1x violence-butcher-block (west side)
  editor.spawnProp(LEVEL_ID, 'violence-butcher-block', 19, 103, { roomId: abattoirId });
  // 1x violence-industrial-arch (north entrance, massive)
  editor.spawnProp(LEVEL_ID, 'violence-industrial-arch', 25, 95, { roomId: abattoirId });
  // 1x violence-chain-conveyor (ceiling, spanning N-S)
  editor.spawnProp(LEVEL_ID, 'violence-chain-conveyor', 25, 100, { roomId: abattoirId });

  // =========================================================================
  // 5d. DECALS (blood stains, scorch marks — Violence theme)
  // =========================================================================

  // --- Pier (bounds: 26, 2, 8, 6) ---
  // Blood seepage on walls near cauldron + blood trough
  editor.placeDecals(LEVEL_ID, pierId, [
    { type: DECAL_TYPES.BLOOD_STAIN, x: 31, z: 4, w: 2, h: 2, surface: 'wall' },
    { type: DECAL_TYPES.BLOOD_STAIN, x: 28, z: 6, w: 2, h: 3 },
  ]);

  // --- Blood River (bounds: 20, 12, 20, 14) ---
  // Heavy blood stains on walkway surfaces and walls
  editor.placeDecals(LEVEL_ID, bloodRiverId, [
    { type: DECAL_TYPES.BLOOD_STAIN, x: 26, z: 18, w: 3, h: 3 },
    { type: DECAL_TYPES.BLOOD_STAIN, x: 34, z: 20, w: 3, h: 3 },
    { type: DECAL_TYPES.BLOOD_STAIN, x: 23, z: 14, w: 2, h: 2, surface: 'wall' },
    { type: DECAL_TYPES.BLOOD_STAIN, x: 37, z: 23, w: 2, h: 2, surface: 'wall' },
  ]);

  // --- River Banks (bounds: 8, 20, 8, 6) ---
  // Blood pools near entrance
  editor.placeDecals(LEVEL_ID, riverBanksId, [
    { type: DECAL_TYPES.BLOOD_STAIN, x: 12, z: 22, w: 3, h: 2 },
  ]);

  // --- Thorny Passage (bounds: 44, 18, 6, 16) ---
  // Blood stains at ramp bases where thorns wound
  editor.placeDecals(LEVEL_ID, thornyPassageId, [
    { type: DECAL_TYPES.BLOOD_STAIN, x: 46, z: 22, w: 2, h: 2 },
    { type: DECAL_TYPES.BLOOD_STAIN, x: 46, z: 30, w: 2, h: 2 },
  ]);

  // --- Thornwood (bounds: 36, 38, 14, 12) ---
  // Blood pools at column dead-ends
  editor.placeDecals(LEVEL_ID, thornwoodId, [
    { type: DECAL_TYPES.BLOOD_STAIN, x: 40, z: 42, w: 3, h: 3 },
    { type: DECAL_TYPES.BLOOD_STAIN, x: 44, z: 47, w: 2, h: 2 },
  ]);

  // --- Burning Shore (bounds: 16, 54, 18, 10) ---
  // Scorch marks at fire geyser positions + blood stain near edges
  editor.placeDecals(LEVEL_ID, burningShoreId, [
    { type: DECAL_TYPES.SCORCH_MARK, x: 18, z: 55, w: 3, h: 3 },
    { type: DECAL_TYPES.SCORCH_MARK, x: 28, z: 55, w: 3, h: 3 },
    { type: DECAL_TYPES.SCORCH_MARK, x: 23, z: 57, w: 3, h: 3 },
    { type: DECAL_TYPES.SCORCH_MARK, x: 18, z: 59, w: 3, h: 3 },
    { type: DECAL_TYPES.SCORCH_MARK, x: 30, z: 59, w: 3, h: 3 },
    { type: DECAL_TYPES.SCORCH_MARK, x: 24, z: 61, w: 3, h: 3 },
    { type: DECAL_TYPES.BLOOD_STAIN, x: 20, z: 62, w: 2, h: 2, opacity: 0.5 },
  ]);

  // --- Flamethrower Shrine (bounds: 22, 68, 6, 6) ---
  // Scorch marks around altar
  editor.placeDecals(LEVEL_ID, flamethrowerShrineId, [
    { type: DECAL_TYPES.SCORCH_MARK, x: 24, z: 71, w: 2, h: 2, opacity: 0.6 },
  ]);

  // --- Slaughterhouse (bounds: 18, 78, 14, 12) ---
  // Heavy blood stains on floor + wall seepage
  editor.placeDecals(LEVEL_ID, slaughterhouseId, [
    { type: DECAL_TYPES.BLOOD_STAIN, x: 25, z: 83, w: 3, h: 3 },
    { type: DECAL_TYPES.BLOOD_STAIN, x: 22, z: 86, w: 2, h: 3 },
    { type: DECAL_TYPES.BLOOD_STAIN, x: 19, z: 82, w: 2, h: 2, surface: 'wall' },
    { type: DECAL_TYPES.BLOOD_STAIN, x: 30, z: 85, w: 2, h: 2, surface: 'wall' },
  ]);

  // --- Butcher's Hook (bounds: 36, 82, 6, 6) ---
  // Blood stains near gutter
  editor.placeDecals(LEVEL_ID, butchersHookId, [
    { type: DECAL_TYPES.BLOOD_STAIN, x: 38, z: 85, w: 3, h: 2 },
  ]);

  // --- Il Macello's Abattoir (bounds: 17, 94, 16, 16) ---
  // Blood pools + scorch marks from fire geysers / boss arena
  editor.placeDecals(LEVEL_ID, abattoirId, [
    { type: DECAL_TYPES.BLOOD_STAIN, x: 25, z: 102, w: 4, h: 4 },
    { type: DECAL_TYPES.BLOOD_STAIN, x: 19, z: 100, w: 2, h: 3, surface: 'wall' },
    { type: DECAL_TYPES.BLOOD_STAIN, x: 31, z: 100, w: 2, h: 3, surface: 'wall' },
    { type: DECAL_TYPES.SCORCH_MARK, x: 22, z: 98, w: 3, h: 3, opacity: 0.6 },
    { type: DECAL_TYPES.SCORCH_MARK, x: 28, z: 106, w: 3, h: 3, opacity: 0.6 },
  ]);

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

  // Blood River liquid — damage zone (blood type, not fire — river is dark red)
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.BLOOD,
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
  // EXPANSION: 6 NEW ROOMS to bring play time to 12-18 minutes
  // =========================================================================
  //
  // Existing room bounds summary (for overlap verification):
  //   Pier:                x:26-34, z:2-8
  //   Blood River:         x:20-40, z:12-26
  //   River Banks:         x:8-16,  z:20-26
  //   Thorny Passage:      x:44-50, z:18-34
  //   Thornwood:           x:36-50, z:38-50
  //   Burning Shore:       x:16-34, z:54-64
  //   Flamethrower Shrine: x:22-28, z:68-74
  //   Slaughterhouse:      x:18-32, z:78-90
  //   Butcher's Hook:      x:36-42, z:82-88
  //   Il Macello Abattoir: x:17-33, z:94-110
  //
  // New rooms (no overlaps verified):
  //   Blood Processing Plant: x:0-8,  z:26-38
  //   Bone Yard:              x:0-12, z:40-52
  //   Industrial Forge:       x:50-60, z:34-50
  //   Chain Works:            x:36-50, z:52-66
  //   Slaughter Annex:        x:36-46, z:68-78
  //   Overflow Cistern:       x:4-16,  z:64-78

  // ── EX-ROOM 1: Blood Processing Plant ─────────────────────────────────────
  // West of River Banks. A rusted industrial pump station that pushes blood
  // through corroded pipes into the river. arena room — ambush on entry.
  // Bounds: (0, 26, 8, 12) → x:0-8, z:26-38
  const bloodProcessingPlantId = editor.room(LEVEL_ID, 'blood_processing_plant', 0, 26, 8, 12, {
    roomType: ROOM_TYPES.ARENA,
    elevation: 0,
    sortOrder: 10,
    floorTexture: 'metal-dark',
    wallTexture: 'metal',
    fillRule: {
      type: 'scatter',
      props: ['violence-blood-pool', 'violence-blood-gutter', 'violence-riveted-pipe-pillar'],
      density: 0.25,
    },
  });

  // ── EX-ROOM 2: Bone Yard ──────────────────────────────────────────────────
  // South of Blood Processing Plant. An open field of bones and skulls from
  // the victims processed above. Exploration with heavy enemy density.
  // Bounds: (0, 40, 12, 12) → x:0-12, z:40-52
  const boneYardId = editor.room(LEVEL_ID, 'bone_yard', 0, 40, 12, 12, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 11,
    floorTexture: 'concrete',
    wallTexture: 'metal',
    fillRule: {
      type: 'scatter',
      props: ['bone-pile', 'violence-blood-pool', 'violence-stone-altar'],
      density: 0.2,
    },
  });

  // ── EX-ROOM 3: Industrial Forge ───────────────────────────────────────────
  // East of Thorny Passage — an extension of the industrial complex east flank.
  // Where weapons of torture are manufactured. Platforming + arena hybrid.
  // Bounds: (50, 34, 10, 16) → x:50-60, z:34-50
  const industrialForgeId = editor.room(LEVEL_ID, 'industrial_forge', 50, 34, 10, 16, {
    roomType: ROOM_TYPES.ARENA,
    elevation: 0,
    sortOrder: 12,
    floorTexture: 'metal-dark',
    wallTexture: 'metal-dark',
    fillRule: {
      type: 'scatter',
      props: ['violence-rusted-anvil', 'violence-metal-crate-stack', 'violence-bone-grinder'],
      density: 0.2,
    },
  });

  // ── EX-ROOM 4: Chain Works ────────────────────────────────────────────────
  // South of Industrial Forge / east of Burning Shore approach. A vast chain-
  // driven conveyor system that carries carcasses. Dense industrial feel.
  // Bounds: (36, 52, 14, 14) → x:36-50, z:52-66
  const chainWorksId = editor.room(LEVEL_ID, 'chain_works', 36, 52, 14, 14, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 13,
    floorTexture: 'metal-dark',
    wallTexture: 'metal',
    fillRule: {
      type: 'scatter',
      props: [
        'violence-chain-conveyor',
        'violence-hook-rack',
        'meat-hook',
        'violence-metal-crate-stack',
      ],
      density: 0.2,
    },
  });

  // ── EX-ROOM 5: Slaughter Annex ────────────────────────────────────────────
  // East of Flamethrower Shrine / north of Butcher's Hook. Connects the Chain
  // Works path back to the Slaughterhouse hub. Ambush arena room.
  // Bounds: (36, 68, 10, 10) → x:36-46, z:68-78
  const slaughterAnnexId = editor.room(LEVEL_ID, 'slaughter_annex', 36, 68, 10, 10, {
    roomType: ROOM_TYPES.ARENA,
    elevation: 0,
    sortOrder: 14,
    floorTexture: 'metal-dark',
    wallTexture: 'metal-dark',
    fillRule: {
      type: 'scatter',
      props: ['torture-rack', 'violence-hook-rack', 'meat-hook', 'violence-blood-pool'],
      density: 0.25,
    },
  });

  // ── EX-ROOM 6: Overflow Cistern ───────────────────────────────────────────
  // West side, between Bone Yard south and Burning Shore west. A massive
  // underground cistern filled with collected blood — swimming hazard arena.
  // Bounds: (4, 64, 12, 14) → x:4-16, z:64-78
  const overflowCisternId = editor.room(LEVEL_ID, 'overflow_cistern', 4, 64, 12, 14, {
    roomType: ROOM_TYPES.ARENA,
    elevation: 0,
    sortOrder: 15,
    floorTexture: 'lava-dark',
    wallTexture: 'metal',
    fillRule: {
      type: 'scatter',
      props: [
        'violence-blood-pool',
        'blood-trough',
        'violence-blood-gutter',
        'violence-industrial-cage',
      ],
      density: 0.25,
    },
  });

  // =========================================================================
  // EXPANSION: CONNECTIONS for new rooms
  // =========================================================================

  // River Banks → Blood Processing Plant (west branch off River Banks)
  editor.corridor(LEVEL_ID, riverBanksId, bloodProcessingPlantId, 3);

  // Blood Processing Plant → Bone Yard (south through the processing complex)
  editor.corridor(LEVEL_ID, bloodProcessingPlantId, boneYardId, 3);

  // Bone Yard → Overflow Cistern (south-east path into cistern)
  editor.corridor(LEVEL_ID, boneYardId, overflowCisternId, 3);

  // Thorny Passage → Industrial Forge (east exit into forge complex)
  editor.corridor(LEVEL_ID, thornyPassageId, industrialForgeId, 2);

  // Industrial Forge → Chain Works (south through chain-driven production floor)
  editor.corridor(LEVEL_ID, industrialForgeId, chainWorksId, 2);

  // Chain Works → Slaughter Annex (south-west junction to annex)
  editor.corridor(LEVEL_ID, chainWorksId, slaughterAnnexId, 2);

  // Slaughter Annex → Slaughterhouse (merging with main path at slaughterhouse)
  editor.corridor(LEVEL_ID, slaughterAnnexId, slaughterhouseId, 3);

  // Overflow Cistern → Slaughterhouse (western approach to slaughterhouse)
  editor.corridor(LEVEL_ID, overflowCisternId, slaughterhouseId, 2);

  // =========================================================================
  // EXPANSION: ENEMIES — 48 additional enemies
  // =========================================================================

  // ── Blood Processing Plant (bounds: 0, 26, 8, 12) → interior x:1-7, z:27-37
  // Ambush: 3 waves via setupArenaWaves
  editor.setupArenaWaves(LEVEL_ID, bloodProcessingPlantId, { x: 1, z: 27, w: 6, h: 4 }, [
    // Wave 1: 3x hellgoat charging from pump stations
    [
      { type: ENEMY_TYPES.HELLGOAT, x: 2, z: 28 },
      { type: ENEMY_TYPES.HELLGOAT, x: 5, z: 29 },
      { type: ENEMY_TYPES.HELLGOAT, x: 3, z: 32 },
    ],
    // Wave 2: 2x goatKnight + 2x fireGoat
    [
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 1, z: 30 },
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 6, z: 30 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 3, z: 35 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 5, z: 35 },
    ],
    // Wave 3: 1x goatKnight + 3x hellgoat
    [
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 3, z: 28 },
      { type: ENEMY_TYPES.HELLGOAT, x: 1, z: 33 },
      { type: ENEMY_TYPES.HELLGOAT, x: 4, z: 36 },
      { type: ENEMY_TYPES.HELLGOAT, x: 6, z: 33 },
    ],
  ]);

  // ── Bone Yard (bounds: 0, 40, 12, 12) → interior x:1-11, z:41-51
  // Heavy patrol — 5 enemies spread across bone field
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 2, 42, {
    roomId: boneYardId,
    patrol: [
      { x: 2, z: 42 },
      { x: 6, z: 44 },
      { x: 2, z: 48 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 8, 43, {
    roomId: boneYardId,
    patrol: [
      { x: 8, z: 43 },
      { x: 10, z: 47 },
      { x: 6, z: 49 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 4, 46, {
    roomId: boneYardId,
    patrol: [
      { x: 4, z: 46 },
      { x: 8, z: 48 },
      { x: 4, z: 50 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 10, 44, { roomId: boneYardId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 2, 50, { roomId: boneYardId });

  // ── Industrial Forge (bounds: 50, 34, 10, 16) → interior x:51-59, z:35-49
  // Ambush arena: 3 waves of industrial demons
  editor.setupArenaWaves(LEVEL_ID, industrialForgeId, { x: 51, z: 35, w: 8, h: 4 }, [
    // Wave 1: 4x hellgoat swarming from forge stations
    [
      { type: ENEMY_TYPES.HELLGOAT, x: 52, z: 36 },
      { type: ENEMY_TYPES.HELLGOAT, x: 56, z: 36 },
      { type: ENEMY_TYPES.HELLGOAT, x: 52, z: 42 },
      { type: ENEMY_TYPES.HELLGOAT, x: 57, z: 42 },
    ],
    // Wave 2: 2x goatKnight flanking
    [
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 51, z: 38 },
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 58, z: 38 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 55, z: 44 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 55, z: 48 },
    ],
    // Wave 3: 2x goatKnight + 2x hellgoat
    [
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 52, z: 35 },
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 58, z: 35 },
      { type: ENEMY_TYPES.HELLGOAT, x: 54, z: 44 },
      { type: ENEMY_TYPES.HELLGOAT, x: 56, z: 48 },
    ],
  ]);

  // ── Chain Works (bounds: 36, 52, 14, 14) → interior x:37-49, z:53-65
  // Mixed patrol — chain demons riding the conveyor system
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 38, 54, {
    roomId: chainWorksId,
    patrol: [
      { x: 38, z: 54 },
      { x: 47, z: 56 },
      { x: 44, z: 62 },
      { x: 38, z: 60 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 45, 58, {
    roomId: chainWorksId,
    patrol: [
      { x: 45, z: 58 },
      { x: 38, z: 60 },
      { x: 43, z: 64 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 40, 56, { roomId: chainWorksId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 46, 62, { roomId: chainWorksId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 43, 53, { roomId: chainWorksId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 48, 64, { roomId: chainWorksId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 37, 64, { roomId: chainWorksId });

  // ── Slaughter Annex (bounds: 36, 68, 10, 10) → interior x:37-45, z:69-77
  // Intense ambush — 3 wave arena before merging with Slaughterhouse
  editor.setupArenaWaves(LEVEL_ID, slaughterAnnexId, { x: 37, z: 69, w: 8, h: 4 }, [
    // Wave 1: 3x hellgoat from hooks
    [
      { type: ENEMY_TYPES.HELLGOAT, x: 38, z: 70 },
      { type: ENEMY_TYPES.HELLGOAT, x: 42, z: 71 },
      { type: ENEMY_TYPES.HELLGOAT, x: 44, z: 70 },
    ],
    // Wave 2: 2x goatKnight + 1x fireGoat
    [
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 37, z: 73 },
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 45, z: 73 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 41, z: 76 },
    ],
    // Wave 3: 1x goatKnight + 2x hellgoat + 1x fireGoat (bloodbath finale)
    [
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 41, z: 69 },
      { type: ENEMY_TYPES.HELLGOAT, x: 38, z: 75 },
      { type: ENEMY_TYPES.HELLGOAT, x: 45, z: 75 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 41, z: 76 },
    ],
  ]);

  // ── Overflow Cistern (bounds: 4, 64, 12, 14) → interior x:5-15, z:65-77
  // Blood swimming hazard arena — enemies wade in blood pool
  editor.setupArenaWaves(LEVEL_ID, overflowCisternId, { x: 5, z: 65, w: 9, h: 4 }, [
    // Wave 1: 4x hellgoat — wade through blood to reach player
    [
      { type: ENEMY_TYPES.HELLGOAT, x: 6, z: 66 },
      { type: ENEMY_TYPES.HELLGOAT, x: 12, z: 66 },
      { type: ENEMY_TYPES.HELLGOAT, x: 6, z: 72 },
      { type: ENEMY_TYPES.HELLGOAT, x: 12, z: 72 },
    ],
    // Wave 2: 2x goatKnight + 2x fireGoat from walls
    [
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 5, z: 69 },
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 14, z: 69 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 9, z: 65 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 9, z: 76 },
    ],
  ]);

  // =========================================================================
  // EXPANSION: PICKUPS for new rooms
  // =========================================================================

  // Blood Processing Plant: ammo x2, health x1, fuel x1
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 2, 36);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 6, 36);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 4, 35);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.FUEL, 3, 37);

  // Bone Yard: health x2, ammo x1
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 2, 47);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 9, 49);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 6, 51);

  // Industrial Forge: ammo x2, health x1, fuel x2
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 52, 45);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 57, 45);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 55, 48);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.FUEL, 51, 47);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.FUEL, 58, 47);

  // Chain Works: ammo x2, health x1, fuel x1
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 38, 63);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 47, 63);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 43, 65);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.FUEL, 40, 64);

  // Slaughter Annex: ammo x2, health x2, fuel x1
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 38, 76);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 44, 76);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 37, 75);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 45, 75);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.FUEL, 41, 77);

  // Overflow Cistern: health x2, ammo x2, fuel x1
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 5, 70);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 14, 70);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 5, 76);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 14, 76);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.FUEL, 9, 73);

  // =========================================================================
  // EXPANSION: PROPS for new rooms
  // =========================================================================

  // ── Blood Processing Plant (bounds: 0, 26, 8, 12) ──────────────────────
  // Corroded pipe pillars, blood gutters, industrial hooks
  editor.spawnProp(LEVEL_ID, 'violence-riveted-pipe-pillar', 1, 28, {
    roomId: bloodProcessingPlantId,
  });
  editor.spawnProp(LEVEL_ID, 'violence-riveted-pipe-pillar', 6, 28, {
    roomId: bloodProcessingPlantId,
  });
  editor.spawnProp(LEVEL_ID, 'violence-riveted-pipe-pillar', 1, 34, {
    roomId: bloodProcessingPlantId,
  });
  editor.spawnProp(LEVEL_ID, 'violence-riveted-pipe-pillar', 6, 34, {
    roomId: bloodProcessingPlantId,
  });
  editor.spawnProp(LEVEL_ID, 'violence-blood-gutter', 3, 30, { roomId: bloodProcessingPlantId });
  editor.spawnProp(LEVEL_ID, 'violence-blood-gutter', 3, 34, { roomId: bloodProcessingPlantId });
  editor.spawnProp(LEVEL_ID, 'violence-hook-rack', 4, 32, { roomId: bloodProcessingPlantId });
  editor.spawnProp(LEVEL_ID, 'violence-blood-pool', 2, 36, { roomId: bloodProcessingPlantId });
  editor.spawnProp(LEVEL_ID, 'violence-blood-pool', 5, 36, { roomId: bloodProcessingPlantId });
  editor.spawnProp(LEVEL_ID, 'torch-sconce-simple', 1, 27, {
    roomId: bloodProcessingPlantId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 2.2,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'torch-sconce-simple', 6, 27, {
    roomId: bloodProcessingPlantId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 2.2,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });

  // ── Bone Yard (bounds: 0, 40, 12, 12) ─────────────────────────────────
  // Bone piles, stone altars, blood pools scattered like a graveyard
  editor.spawnProp(LEVEL_ID, 'bone-pile', 2, 41, { roomId: boneYardId });
  editor.spawnProp(LEVEL_ID, 'bone-pile', 7, 43, { roomId: boneYardId });
  editor.spawnProp(LEVEL_ID, 'bone-pile', 4, 48, { roomId: boneYardId });
  editor.spawnProp(LEVEL_ID, 'bone-pile', 10, 50, { roomId: boneYardId });
  editor.spawnProp(LEVEL_ID, 'bone-pile', 1, 51, { roomId: boneYardId });
  editor.spawnProp(LEVEL_ID, 'violence-stone-altar', 5, 45, { roomId: boneYardId });
  editor.spawnProp(LEVEL_ID, 'violence-blood-pool', 3, 44, { roomId: boneYardId });
  editor.spawnProp(LEVEL_ID, 'violence-blood-pool', 9, 47, { roomId: boneYardId });
  editor.spawnProp(LEVEL_ID, 'rubble-pile-small', 8, 41, { roomId: boneYardId });
  editor.spawnProp(LEVEL_ID, 'rubble-pile-large', 2, 50, { roomId: boneYardId });
  editor.spawnProp(LEVEL_ID, 'torch-sconce-simple', 1, 41, {
    roomId: boneYardId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 2.2,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'torch-sconce-simple', 10, 41, {
    roomId: boneYardId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 2.2,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });

  // ── Industrial Forge (bounds: 50, 34, 10, 16) ─────────────────────────
  // Anvils, bone grinders, crate stacks — industrial murder factory
  editor.spawnProp(LEVEL_ID, 'violence-rusted-anvil', 52, 36, { roomId: industrialForgeId });
  editor.spawnProp(LEVEL_ID, 'violence-rusted-anvil', 57, 36, { roomId: industrialForgeId });
  editor.spawnProp(LEVEL_ID, 'violence-bone-grinder', 52, 44, { roomId: industrialForgeId });
  editor.spawnProp(LEVEL_ID, 'violence-bone-grinder', 57, 44, { roomId: industrialForgeId });
  editor.spawnProp(LEVEL_ID, 'violence-metal-crate-stack', 51, 40, { roomId: industrialForgeId });
  editor.spawnProp(LEVEL_ID, 'violence-metal-crate-stack', 58, 40, { roomId: industrialForgeId });
  editor.spawnProp(LEVEL_ID, 'violence-metal-crate-stack', 54, 46, { roomId: industrialForgeId });
  editor.spawnProp(LEVEL_ID, 'violence-butcher-block', 55, 42, { roomId: industrialForgeId });
  editor.spawnProp(LEVEL_ID, 'violence-sawblade-decoration', 51, 35, { roomId: industrialForgeId });
  editor.spawnProp(LEVEL_ID, 'violence-blood-pool', 55, 38, { roomId: industrialForgeId });
  editor.spawnProp(LEVEL_ID, 'meat-hook', 53, 37, { roomId: industrialForgeId });
  editor.spawnProp(LEVEL_ID, 'meat-hook', 57, 37, { roomId: industrialForgeId });
  editor.spawnProp(LEVEL_ID, 'meat-hook', 53, 43, { roomId: industrialForgeId });
  editor.spawnProp(LEVEL_ID, 'meat-hook', 57, 43, { roomId: industrialForgeId });
  editor.spawnProp(LEVEL_ID, 'torch-sconce-ornate', 51, 36, {
    roomId: industrialForgeId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 2.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'torch-sconce-ornate', 59, 36, {
    roomId: industrialForgeId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 2.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'torch-sconce-ornate', 51, 46, {
    roomId: industrialForgeId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 2.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'torch-sconce-ornate', 59, 46, {
    roomId: industrialForgeId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 2.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });

  // ── Chain Works (bounds: 36, 52, 14, 14) ──────────────────────────────
  // Conveyor chains, hook racks, crate stacks — production line of suffering
  editor.spawnProp(LEVEL_ID, 'violence-chain-conveyor', 40, 55, { roomId: chainWorksId });
  editor.spawnProp(LEVEL_ID, 'violence-chain-conveyor', 44, 59, { roomId: chainWorksId });
  editor.spawnProp(LEVEL_ID, 'violence-chain-conveyor', 40, 63, { roomId: chainWorksId });
  editor.spawnProp(LEVEL_ID, 'violence-hook-rack', 38, 55, { roomId: chainWorksId });
  editor.spawnProp(LEVEL_ID, 'violence-hook-rack', 47, 61, { roomId: chainWorksId });
  editor.spawnProp(LEVEL_ID, 'meat-hook', 39, 57, { roomId: chainWorksId });
  editor.spawnProp(LEVEL_ID, 'meat-hook', 44, 57, { roomId: chainWorksId });
  editor.spawnProp(LEVEL_ID, 'meat-hook', 48, 61, { roomId: chainWorksId });
  editor.spawnProp(LEVEL_ID, 'meat-hook', 39, 64, { roomId: chainWorksId });
  editor.spawnProp(LEVEL_ID, 'violence-metal-crate-stack', 37, 54, { roomId: chainWorksId });
  editor.spawnProp(LEVEL_ID, 'violence-metal-crate-stack', 48, 54, { roomId: chainWorksId });
  editor.spawnProp(LEVEL_ID, 'violence-metal-crate-stack', 37, 62, { roomId: chainWorksId });
  editor.spawnProp(LEVEL_ID, 'violence-metal-crate-stack', 48, 64, { roomId: chainWorksId });
  editor.spawnProp(LEVEL_ID, 'violence-blood-gutter', 42, 59, { roomId: chainWorksId });
  editor.spawnProp(LEVEL_ID, 'violence-blood-pool', 44, 63, { roomId: chainWorksId });
  editor.spawnProp(LEVEL_ID, 'torch-sconce-ornate', 37, 53, {
    roomId: chainWorksId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 2.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'torch-sconce-ornate', 49, 53, {
    roomId: chainWorksId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 2.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'torch-sconce-ornate', 37, 63, {
    roomId: chainWorksId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 2.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });

  // ── Slaughter Annex (bounds: 36, 68, 10, 10) ─────────────────────────
  // Torture racks, hooks, blood pools — pre-slaughterhouse processing room
  editor.spawnProp(LEVEL_ID, 'torture-rack', 38, 70, { roomId: slaughterAnnexId });
  editor.spawnProp(LEVEL_ID, 'torture-rack', 44, 70, { roomId: slaughterAnnexId });
  editor.spawnProp(LEVEL_ID, 'violence-hook-rack', 41, 72, { roomId: slaughterAnnexId });
  editor.spawnProp(LEVEL_ID, 'meat-hook', 38, 72, { roomId: slaughterAnnexId });
  editor.spawnProp(LEVEL_ID, 'meat-hook', 44, 72, { roomId: slaughterAnnexId });
  editor.spawnProp(LEVEL_ID, 'meat-hook', 38, 75, { roomId: slaughterAnnexId });
  editor.spawnProp(LEVEL_ID, 'meat-hook', 44, 75, { roomId: slaughterAnnexId });
  editor.spawnProp(LEVEL_ID, 'violence-blood-pool', 41, 74, { roomId: slaughterAnnexId });
  editor.spawnProp(LEVEL_ID, 'violence-blood-gutter', 39, 76, { roomId: slaughterAnnexId });
  editor.spawnProp(LEVEL_ID, 'violence-sawblade-decoration', 37, 69, { roomId: slaughterAnnexId });
  editor.spawnProp(LEVEL_ID, 'torch-sconce-ornate', 37, 70, {
    roomId: slaughterAnnexId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 2.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'torch-sconce-ornate', 45, 70, {
    roomId: slaughterAnnexId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 2.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });

  // ── Overflow Cistern (bounds: 4, 64, 12, 14) ─────────────────────────
  // Blood pools, industrial cages, blood troughs — blood collection facility
  editor.spawnProp(LEVEL_ID, 'violence-blood-pool', 6, 66, { roomId: overflowCisternId });
  editor.spawnProp(LEVEL_ID, 'violence-blood-pool', 12, 66, { roomId: overflowCisternId });
  editor.spawnProp(LEVEL_ID, 'violence-blood-pool', 6, 72, { roomId: overflowCisternId });
  editor.spawnProp(LEVEL_ID, 'violence-blood-pool', 12, 72, { roomId: overflowCisternId });
  editor.spawnProp(LEVEL_ID, 'violence-blood-pool', 9, 69, { roomId: overflowCisternId });
  editor.spawnProp(LEVEL_ID, 'blood-trough', 5, 68, { roomId: overflowCisternId });
  editor.spawnProp(LEVEL_ID, 'blood-trough', 13, 68, { roomId: overflowCisternId });
  editor.spawnProp(LEVEL_ID, 'blood-trough', 5, 74, { roomId: overflowCisternId });
  editor.spawnProp(LEVEL_ID, 'blood-trough', 13, 74, { roomId: overflowCisternId });
  editor.spawnProp(LEVEL_ID, 'violence-industrial-cage', 5, 65, { roomId: overflowCisternId });
  editor.spawnProp(LEVEL_ID, 'violence-industrial-cage', 13, 65, { roomId: overflowCisternId });
  editor.spawnProp(LEVEL_ID, 'violence-industrial-cage', 5, 76, { roomId: overflowCisternId });
  editor.spawnProp(LEVEL_ID, 'violence-industrial-cage', 13, 76, { roomId: overflowCisternId });
  editor.spawnProp(LEVEL_ID, 'violence-blood-gutter', 9, 65, { roomId: overflowCisternId });
  editor.spawnProp(LEVEL_ID, 'violence-blood-gutter', 9, 75, { roomId: overflowCisternId });
  editor.spawnProp(LEVEL_ID, 'torch-sconce-simple', 5, 65, {
    roomId: overflowCisternId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 2.2,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'torch-sconce-simple', 14, 65, {
    roomId: overflowCisternId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 2.2,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'torch-sconce-simple', 5, 75, {
    roomId: overflowCisternId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 2.2,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });

  // =========================================================================
  // EXPANSION: DECALS for new rooms
  // =========================================================================

  // Blood Processing Plant: heavy blood stains everywhere
  editor.placeDecals(LEVEL_ID, bloodProcessingPlantId, [
    { type: DECAL_TYPES.BLOOD_STAIN, x: 3, z: 30, w: 3, h: 3 },
    { type: DECAL_TYPES.BLOOD_STAIN, x: 1, z: 35, w: 2, h: 2 },
    { type: DECAL_TYPES.BLOOD_STAIN, x: 5, z: 35, w: 2, h: 2 },
    { type: DECAL_TYPES.BLOOD_STAIN, x: 1, z: 28, w: 2, h: 2, surface: 'wall' },
  ]);

  // Bone Yard: blood pools under bone piles
  editor.placeDecals(LEVEL_ID, boneYardId, [
    { type: DECAL_TYPES.BLOOD_STAIN, x: 4, z: 43, w: 3, h: 3 },
    { type: DECAL_TYPES.BLOOD_STAIN, x: 8, z: 49, w: 3, h: 3 },
    { type: DECAL_TYPES.BLOOD_STAIN, x: 1, z: 50, w: 2, h: 2 },
  ]);

  // Industrial Forge: scorch marks from forge fires + blood stains
  editor.placeDecals(LEVEL_ID, industrialForgeId, [
    { type: DECAL_TYPES.SCORCH_MARK, x: 52, z: 36, w: 3, h: 3 },
    { type: DECAL_TYPES.SCORCH_MARK, x: 57, z: 44, w: 3, h: 3 },
    { type: DECAL_TYPES.BLOOD_STAIN, x: 55, z: 40, w: 3, h: 4 },
  ]);

  // Chain Works: blood stains from processed carcasses
  editor.placeDecals(LEVEL_ID, chainWorksId, [
    { type: DECAL_TYPES.BLOOD_STAIN, x: 41, z: 57, w: 3, h: 3 },
    { type: DECAL_TYPES.BLOOD_STAIN, x: 45, z: 63, w: 3, h: 3 },
    { type: DECAL_TYPES.BLOOD_STAIN, x: 37, z: 53, w: 2, h: 2, surface: 'wall' },
  ]);

  // Slaughter Annex: heavy blood from torture racks
  editor.placeDecals(LEVEL_ID, slaughterAnnexId, [
    { type: DECAL_TYPES.BLOOD_STAIN, x: 39, z: 72, w: 4, h: 4 },
    { type: DECAL_TYPES.BLOOD_STAIN, x: 43, z: 75, w: 2, h: 2, surface: 'wall' },
  ]);

  // Overflow Cistern: blood everywhere — dripping walls and floor
  editor.placeDecals(LEVEL_ID, overflowCisternId, [
    { type: DECAL_TYPES.BLOOD_STAIN, x: 7, z: 68, w: 4, h: 4 },
    { type: DECAL_TYPES.BLOOD_STAIN, x: 5, z: 73, w: 3, h: 3 },
    { type: DECAL_TYPES.BLOOD_STAIN, x: 12, z: 73, w: 3, h: 3 },
    { type: DECAL_TYPES.BLOOD_STAIN, x: 5, z: 65, w: 2, h: 2, surface: 'wall' },
    { type: DECAL_TYPES.BLOOD_STAIN, x: 13, z: 65, w: 2, h: 2, surface: 'wall' },
  ]);

  // =========================================================================
  // EXPANSION: TRIGGERS for new rooms
  // =========================================================================

  // Blood Processing Plant: ambient fog change on entry
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 0,
    zoneZ: 26,
    zoneW: 8,
    zoneH: 12,
    roomId: bloodProcessingPlantId,
    once: true,
    actionData: { fogDensity: 0.07, fogColor: '#1a0505' },
  });

  // Bone Yard: dialogue on entry — lore about the bone fields
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.DIALOGUE,
    zoneX: 1,
    zoneZ: 41,
    zoneW: 10,
    zoneH: 3,
    roomId: boneYardId,
    once: true,
    actionData: {
      text: 'These bones fed the river. Every one of them thought they were the exception.',
    },
  });

  // Industrial Forge: ambient + dialogue on entry
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 50,
    zoneZ: 34,
    zoneW: 10,
    zoneH: 16,
    roomId: industrialForgeId,
    once: true,
    actionData: { fogDensity: 0.06, fogColor: '#1a0808' },
  });

  // Chain Works: ambient change — deep industrial haze
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 36,
    zoneZ: 52,
    zoneW: 14,
    zoneH: 14,
    roomId: chainWorksId,
    once: true,
    actionData: { fogDensity: 0.06, fogColor: '#1a0808' },
  });

  // Slaughter Annex: lock doors on entry (arena)
  editor.lockOnEntry(LEVEL_ID, slaughterAnnexId, { x: 37, z: 69, w: 8, h: 4 });

  // Overflow Cistern: ambient change — blood mist
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 4,
    zoneZ: 64,
    zoneW: 12,
    zoneH: 14,
    roomId: overflowCisternId,
    once: true,
    actionData: { fogDensity: 0.08, fogColor: '#2a0808' },
  });

  // =========================================================================
  // EXPANSION: ENVIRONMENT ZONES for new rooms
  // =========================================================================

  // Blood Processing Plant: blood zone
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.BLOOD,
    boundsX: 0,
    boundsZ: 26,
    boundsW: 8,
    boundsH: 12,
    intensity: 2.0,
  });

  // Industrial Forge: fire hazard from forge furnaces
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.FIRE,
    boundsX: 51,
    boundsZ: 37,
    boundsW: 2,
    boundsH: 2,
    intensity: 6.0,
  });
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.FIRE,
    boundsX: 57,
    boundsZ: 43,
    boundsW: 2,
    boundsH: 2,
    intensity: 6.0,
  });

  // Chain Works: blood zone — dripping from conveyor
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.BLOOD,
    boundsX: 36,
    boundsZ: 52,
    boundsW: 14,
    boundsH: 14,
    intensity: 1.5,
  });

  // Overflow Cistern: deep blood zone — swimming in collected blood
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.BLOOD,
    boundsX: 4,
    boundsZ: 64,
    boundsW: 12,
    boundsH: 14,
    intensity: 3.0,
  });

  // =========================================================================
  // EXPANSION 2: 2 MORE ROOMS + ADDITIONAL PATROL ENEMIES for 12-18 min target
  // =========================================================================
  //
  // Additional rooms (no overlaps — existing bounds verified above):
  //   Bone Disposal Shaft: x:0-12,  z:54-64  (connects Bone Yard → Overflow Cistern via south path)
  //   Slaughter Wing:      x:34-46, z:90-102 (connects Slaughterhouse south, pre-boss staging)

  // ── EX-ROOM 7: Bone Disposal Shaft ────────────────────────────────────────
  // South of Bone Yard, west of Burning Shore. A shaft where bone fragments
  // are disposed of — dim, cramped, patrolled by scavenging hellgoats.
  // Bounds: (0, 54, 12, 10) → x:0-12, z:54-64

  const boneDisposalShaftId = editor.room(LEVEL_ID, 'bone_disposal_shaft', 0, 54, 12, 10, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 16,
    floorTexture: 'concrete',
    wallTexture: 'metal',
    fillRule: {
      type: 'scatter',
      props: ['bone-pile', 'rubble-pile-small', 'violence-blood-pool'],
      density: 0.18,
    },
  });

  // ── EX-ROOM 8: Slaughter Wing ─────────────────────────────────────────────
  // South of Slaughterhouse, east of the Abattoir — a staging wing where
  // condemned are held before the boss encounter. Dense combat zone.
  // Bounds: (34, 90, 12, 12) → x:34-46, z:90-102

  const slaughterWingId = editor.room(LEVEL_ID, 'slaughter_wing', 34, 90, 12, 12, {
    roomType: ROOM_TYPES.ARENA,
    elevation: 0,
    sortOrder: 17,
    floorTexture: 'metal-dark',
    wallTexture: 'metal-dark',
    fillRule: {
      type: 'scatter',
      props: ['violence-hook-rack', 'meat-hook', 'torture-rack', 'violence-metal-crate-stack'],
      density: 0.25,
    },
  });

  // ── Connections for 2 additional rooms ────────────────────────────────────

  // Bone Yard → Bone Disposal Shaft (straight south)
  editor.corridor(LEVEL_ID, boneYardId, boneDisposalShaftId, 3);

  // Bone Disposal Shaft → Overflow Cistern (east into cistern)
  editor.corridor(LEVEL_ID, boneDisposalShaftId, overflowCisternId, 2);

  // Slaughterhouse → Slaughter Wing (south staging area)
  editor.corridor(LEVEL_ID, slaughterhouseId, slaughterWingId, 3);

  // Slaughter Wing → Il Macello's Abattoir (final descent to boss)
  editor.corridor(LEVEL_ID, slaughterWingId, abattoirId, 3);

  // ── Bone Disposal Shaft enemies (bounds: 0, 54, 12, 10) → x:1-11, z:55-63
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 2, 56, {
    roomId: boneDisposalShaftId,
    patrol: [
      { x: 2, z: 56 },
      { x: 8, z: 58 },
      { x: 4, z: 62 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 9, 57, {
    roomId: boneDisposalShaftId,
    patrol: [
      { x: 9, z: 57 },
      { x: 4, z: 59 },
      { x: 9, z: 62 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 5, 60, {
    roomId: boneDisposalShaftId,
    patrol: [
      { x: 5, z: 60 },
      { x: 10, z: 62 },
      { x: 5, z: 55 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 10, 55, { roomId: boneDisposalShaftId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 2, 63, { roomId: boneDisposalShaftId });

  // ── Slaughter Wing enemies (bounds: 34, 90, 12, 12) → x:35-45, z:91-101
  // Arena wave — intensive final push before boss
  editor.setupArenaWaves(LEVEL_ID, slaughterWingId, { x: 35, z: 91, w: 10, h: 4 }, [
    [
      { type: ENEMY_TYPES.HELLGOAT, x: 36, z: 92 },
      { type: ENEMY_TYPES.HELLGOAT, x: 40, z: 92 },
      { type: ENEMY_TYPES.HELLGOAT, x: 44, z: 92 },
      { type: ENEMY_TYPES.HELLGOAT, x: 36, z: 97 },
    ],
    [
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 35, z: 94 },
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 44, z: 94 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 38, z: 99 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 43, z: 99 },
    ],
    [
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 36, z: 91 },
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 44, z: 91 },
      { type: ENEMY_TYPES.HELLGOAT, x: 38, z: 96 },
      { type: ENEMY_TYPES.HELLGOAT, x: 42, z: 100 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 40, z: 100 },
    ],
  ]);

  // Also add standalone patrol in Slaughter Wing for playtest coverage
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 39, 95, {
    roomId: slaughterWingId,
    patrol: [
      { x: 39, z: 95 },
      { x: 43, z: 98 },
      { x: 36, z: 98 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 35, 101, { roomId: slaughterWingId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 45, 101, { roomId: slaughterWingId });

  // ── Additional patrol enemies in existing new rooms (boosts play time estimate)

  // Blood Processing Plant: 2 extra standalone patrols
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 3, 30, {
    roomId: bloodProcessingPlantId,
    patrol: [
      { x: 3, z: 30 },
      { x: 6, z: 33 },
      { x: 2, z: 36 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 5, 27, { roomId: bloodProcessingPlantId });

  // Bone Yard: 2 extra standalone patrols
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 5, 51, {
    roomId: boneYardId,
    patrol: [
      { x: 5, z: 51 },
      { x: 10, z: 48 },
      { x: 7, z: 44 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 1, 44, { roomId: boneYardId });

  // Industrial Forge: 2 extra standalone patrols
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 53, 40, {
    roomId: industrialForgeId,
    patrol: [
      { x: 53, z: 40 },
      { x: 58, z: 43 },
      { x: 54, z: 47 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 57, 35, { roomId: industrialForgeId });

  // Chain Works: 3 extra standalone patrols
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 42, 55, {
    roomId: chainWorksId,
    patrol: [
      { x: 42, z: 55 },
      { x: 48, z: 58 },
      { x: 42, z: 64 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 37, 60, { roomId: chainWorksId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 49, 63, { roomId: chainWorksId });

  // Overflow Cistern: 2 extra standalone patrols
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 6, 68, {
    roomId: overflowCisternId,
    patrol: [
      { x: 6, z: 68 },
      { x: 13, z: 71 },
      { x: 7, z: 76 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 14, 76, { roomId: overflowCisternId });

  // ── Pickups for new rooms ─────────────────────────────────────────────────

  // Bone Disposal Shaft: health x2, ammo x1
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 3, 62);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 9, 62);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 6, 63);

  // Slaughter Wing: health x2, ammo x2, fuel x1
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 35, 100);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 45, 100);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 35, 93);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 45, 93);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.FUEL, 40, 101);

  // ── Props for new rooms ───────────────────────────────────────────────────

  // Bone Disposal Shaft: bone piles and blood
  editor.spawnProp(LEVEL_ID, 'bone-pile', 1, 55, { roomId: boneDisposalShaftId });
  editor.spawnProp(LEVEL_ID, 'bone-pile', 6, 57, { roomId: boneDisposalShaftId });
  editor.spawnProp(LEVEL_ID, 'bone-pile', 10, 60, { roomId: boneDisposalShaftId });
  editor.spawnProp(LEVEL_ID, 'bone-pile', 3, 62, { roomId: boneDisposalShaftId });
  editor.spawnProp(LEVEL_ID, 'violence-blood-pool', 5, 58, { roomId: boneDisposalShaftId });
  editor.spawnProp(LEVEL_ID, 'violence-blood-pool', 8, 62, { roomId: boneDisposalShaftId });
  editor.spawnProp(LEVEL_ID, 'rubble-pile-small', 2, 59, { roomId: boneDisposalShaftId });
  editor.spawnProp(LEVEL_ID, 'rubble-pile-large', 9, 56, { roomId: boneDisposalShaftId });
  editor.spawnProp(LEVEL_ID, 'torch-sconce-simple', 1, 55, {
    roomId: boneDisposalShaftId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'torch-sconce-simple', 10, 55, {
    roomId: boneDisposalShaftId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });

  // Slaughter Wing: industrial execution chamber dressing
  editor.spawnProp(LEVEL_ID, 'torture-rack', 36, 93, { roomId: slaughterWingId });
  editor.spawnProp(LEVEL_ID, 'torture-rack', 44, 93, { roomId: slaughterWingId });
  editor.spawnProp(LEVEL_ID, 'meat-hook', 37, 95, { roomId: slaughterWingId });
  editor.spawnProp(LEVEL_ID, 'meat-hook', 43, 95, { roomId: slaughterWingId });
  editor.spawnProp(LEVEL_ID, 'meat-hook', 37, 99, { roomId: slaughterWingId });
  editor.spawnProp(LEVEL_ID, 'meat-hook', 43, 99, { roomId: slaughterWingId });
  editor.spawnProp(LEVEL_ID, 'violence-hook-rack', 40, 97, { roomId: slaughterWingId });
  editor.spawnProp(LEVEL_ID, 'violence-blood-pool', 40, 100, { roomId: slaughterWingId });
  editor.spawnProp(LEVEL_ID, 'violence-blood-gutter', 36, 99, { roomId: slaughterWingId });
  editor.spawnProp(LEVEL_ID, 'violence-metal-crate-stack', 35, 96, { roomId: slaughterWingId });
  editor.spawnProp(LEVEL_ID, 'violence-metal-crate-stack', 44, 96, { roomId: slaughterWingId });
  editor.spawnProp(LEVEL_ID, 'torch-sconce-ornate', 35, 91, {
    roomId: slaughterWingId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 2.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'torch-sconce-ornate', 45, 91, {
    roomId: slaughterWingId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 2.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'torch-sconce-ornate', 35, 100, {
    roomId: slaughterWingId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 2.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'torch-sconce-ornate', 45, 100, {
    roomId: slaughterWingId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 2.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });

  // ── Decals for new rooms ──────────────────────────────────────────────────

  editor.placeDecals(LEVEL_ID, boneDisposalShaftId, [
    { type: DECAL_TYPES.BLOOD_STAIN, x: 4, z: 57, w: 3, h: 3 },
    { type: DECAL_TYPES.BLOOD_STAIN, x: 8, z: 62, w: 3, h: 2 },
  ]);

  editor.placeDecals(LEVEL_ID, slaughterWingId, [
    { type: DECAL_TYPES.BLOOD_STAIN, x: 38, z: 96, w: 4, h: 4 },
    { type: DECAL_TYPES.BLOOD_STAIN, x: 35, z: 100, w: 2, h: 2, surface: 'wall' },
    { type: DECAL_TYPES.BLOOD_STAIN, x: 44, z: 100, w: 2, h: 2, surface: 'wall' },
  ]);

  // ── Environment zones for new rooms ──────────────────────────────────────

  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.BLOOD,
    boundsX: 0,
    boundsZ: 54,
    boundsW: 12,
    boundsH: 10,
    intensity: 2.0,
  });

  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.BLOOD,
    boundsX: 34,
    boundsZ: 90,
    boundsW: 12,
    boundsH: 12,
    intensity: 2.5,
  });

  // ── Triggers for new rooms ────────────────────────────────────────────────

  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 0,
    zoneZ: 54,
    zoneW: 12,
    zoneH: 10,
    roomId: boneDisposalShaftId,
    once: true,
    actionData: { fogDensity: 0.08, fogColor: '#1a0505' },
  });

  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 34,
    zoneZ: 90,
    zoneW: 12,
    zoneH: 12,
    roomId: slaughterWingId,
    once: true,
    actionData: { fogDensity: 0.07, fogColor: '#1a0808' },
  });

  // ── Final density pass: additional patrol enemies for play time target ──
  // These standalone patrols directly increase the play time estimate.
  // Targeting the longest rooms and thinly-covered areas.

  // River Banks: 2 more (original only had 1)
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 10, 22, {
    roomId: riverBanksId,
    patrol: [
      { x: 10, z: 22 },
      { x: 14, z: 24 },
      { x: 9, z: 25 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 13, 24, { roomId: riverBanksId });

  // Flamethrower Shrine: 1 guardian (original had none)
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 24, 71, { roomId: flamethrowerShrineId });

  // Burning Shore: 2 more patrol enemies (original had 4, add 2 more for coverage)
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 18, 60, {
    roomId: burningShoreId,
    patrol: [
      { x: 18, z: 60 },
      { x: 28, z: 62 },
      { x: 32, z: 57 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 32, 56, { roomId: burningShoreId });

  // Thornwood: 2 more patrol enemies (original had 3)
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 48, 42, {
    roomId: thornwoodId,
    patrol: [
      { x: 48, z: 42 },
      { x: 44, z: 47 },
      { x: 38, z: 44 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 37, 48, { roomId: thornwoodId });

  // Blood River: 2 more patrol enemies (original had 3)
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 21, 18, { roomId: bloodRiverId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 37, 15, { roomId: bloodRiverId });

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
