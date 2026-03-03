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
    texturePalette: { exploration: 'brick', arena: 'stone-dark', boss: 'tiles', secret: 'brick' },
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
    floorTexture: 'stone-dark',
    wallTexture: 'brick',
    fillRule: {
      type: 'scatter',
      props: ['heresy-church-pew', 'heresy-confessional-booth', 'heresy-torn-scripture-slab'],
      density: 0.08,
    },
  });

  const confessionalId = editor.room(LEVEL_ID, 'confessional', 8, 16, 6, 6, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 2,
    floorTexture: 'stone-dark',
    fillRule: {
      type: 'scatter',
      props: ['heresy-corrupted-reliquary', 'heretic-tome', 'inverted-cross'],
      density: 0.15,
    },
  });

  // Catacombs: design doc says "maze" type, but no MAZE in ROOM_TYPES.
  // Using EXPLORATION as the closest match (maze is an exploration variant).
  const catacombsId = editor.room(LEVEL_ID, 'catacombs', 36, 14, 10, 10, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: -1,
    sortOrder: 3,
    floorTexture: 'brick',
    wallTexture: 'brick',
    fillRule: {
      type: 'scatter',
      props: ['heresy-catacomb-torch', 'heresy-bone-urn', 'heresy-cracked-marble-pillar'],
      density: 0.1,
    },
  });

  const trialChamberId = editor.room(LEVEL_ID, 'trial_chamber', 19, 32, 12, 12, {
    roomType: ROOM_TYPES.ARENA,
    elevation: 0,
    sortOrder: 4,
    floorTexture: 'tiles',
    wallTexture: 'stone-dark',
    fillRule: {
      type: 'scatter',
      props: ['heresy-burning-pyre', 'heresy-toppled-altar', 'heresy-shattered-icon'],
      density: 0.08,
    },
  });

  const ossuaryId = editor.room(LEVEL_ID, 'ossuary', 10, 40, 8, 8, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: -1,
    sortOrder: 5,
    floorTexture: 'tiles',
    wallTexture: 'stone-dark',
    fillRule: {
      type: 'scatter',
      props: ['heresy-pentagram-floor-tile', 'heresy-broken-stained-glass'],
      density: 0.1,
    },
  });

  const libraryId = editor.room(LEVEL_ID, 'heretics_library', 36, 36, 6, 8, {
    roomType: ROOM_TYPES.SECRET,
    elevation: 0,
    sortOrder: 6,
    floorTexture: 'stone-dark',
    wallTexture: 'brick',
    fillRule: {
      type: 'scatter',
      props: ['heresy-forbidden-bookcase', 'heresy-profane-symbol', 'heresy-corrupted-reliquary'],
      density: 0.12,
    },
  });

  const chapelId = editor.room(LEVEL_ID, 'profano_chapel', 18, 54, 14, 14, {
    roomType: ROOM_TYPES.BOSS,
    elevation: 0,
    sortOrder: 7,
    floorTexture: 'tiles',
    wallTexture: 'tiles',
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
  // 5c. ENTITIES: PROPS (from 3D Spatial Design)
  // =========================================================================

  // --- Narthex (bounds: 21, 2, 8, 6) ---
  // Structural: 2x heresy-desecrated-arch
  editor.spawnProp(LEVEL_ID, 'heresy-desecrated-arch', 25, 2, { roomId: narthexId });
  editor.spawnProp(LEVEL_ID, 'heresy-desecrated-arch', 25, 7, { roomId: narthexId });
  // 2x heresy-bone-urn (flanking entrance)
  editor.spawnProp(LEVEL_ID, 'heresy-bone-urn', 22, 3, { roomId: narthexId });
  editor.spawnProp(LEVEL_ID, 'heresy-bone-urn', 28, 3, { roomId: narthexId });
  // 1x heresy-torn-scripture-slab (pedestal)
  editor.spawnProp(LEVEL_ID, 'heresy-torn-scripture-slab', 24, 3, { roomId: narthexId });
  // 1x inverted-cross (near east WALL_SECRET)
  editor.spawnProp(LEVEL_ID, 'inverted-cross', 26, 4, { roomId: narthexId });

  // --- Nave of Lies (bounds: 18, 12, 14, 10) ---
  // Structural: 4x heresy-cracked-marble-pillar
  editor.spawnProp(LEVEL_ID, 'heresy-cracked-marble-pillar', 20, 13, { roomId: naveId });
  editor.spawnProp(LEVEL_ID, 'heresy-cracked-marble-pillar', 30, 13, { roomId: naveId });
  editor.spawnProp(LEVEL_ID, 'heresy-cracked-marble-pillar', 20, 19, { roomId: naveId });
  editor.spawnProp(LEVEL_ID, 'heresy-cracked-marble-pillar', 30, 19, { roomId: naveId });
  // 16x heresy-church-pew (4 rows of 4)
  for (const bz of [14, 16, 18, 20]) {
    for (const bx of [20, 23, 26, 29]) {
      editor.spawnProp(LEVEL_ID, 'heresy-church-pew', bx, bz, { roomId: naveId });
    }
  }
  // 4x inverted-cross (walls)
  editor.spawnProp(LEVEL_ID, 'inverted-cross', 18, 14, { roomId: naveId });
  editor.spawnProp(LEVEL_ID, 'inverted-cross', 32, 14, { roomId: naveId });
  editor.spawnProp(LEVEL_ID, 'inverted-cross', 18, 19, { roomId: naveId });
  editor.spawnProp(LEVEL_ID, 'inverted-cross', 32, 19, { roomId: naveId });
  // 1x heresy-profane-symbol (north wall center)
  editor.spawnProp(LEVEL_ID, 'heresy-profane-symbol', 25, 12, { roomId: naveId });
  // 1x heresy-shattered-icon (near south wall)
  editor.spawnProp(LEVEL_ID, 'heresy-shattered-icon', 22, 21, { roomId: naveId });

  // --- Confessional (bounds: 8, 16, 6, 6) ---
  // 3x heresy-confessional-booth (forming booths)
  editor.spawnProp(LEVEL_ID, 'heresy-confessional-booth', 9, 17, { roomId: confessionalId });
  editor.spawnProp(LEVEL_ID, 'heresy-confessional-booth', 9, 18, { roomId: confessionalId });
  editor.spawnProp(LEVEL_ID, 'heresy-confessional-booth', 9, 19, { roomId: confessionalId });
  // 1x heresy-catacomb-torch (east wall candle)
  editor.spawnProp(LEVEL_ID, 'heresy-catacomb-torch', 13, 18, { roomId: confessionalId });

  // --- Catacombs (bounds: 36, 14, 10, 10) ---
  // 4x heresy-bone-urn (dead ends)
  editor.spawnProp(LEVEL_ID, 'heresy-bone-urn', 37, 18, { roomId: catacombsId });
  editor.spawnProp(LEVEL_ID, 'heresy-bone-urn', 45, 17, { roomId: catacombsId });
  editor.spawnProp(LEVEL_ID, 'heresy-bone-urn', 38, 22, { roomId: catacombsId });
  editor.spawnProp(LEVEL_ID, 'heresy-bone-urn', 43, 23, { roomId: catacombsId });
  // 3x heresy-catacomb-torch (safe intersections, lit)
  editor.spawnProp(LEVEL_ID, 'heresy-catacomb-torch', 37, 16, { roomId: catacombsId });
  editor.spawnProp(LEVEL_ID, 'heresy-catacomb-torch', 42, 18, { roomId: catacombsId });
  editor.spawnProp(LEVEL_ID, 'heresy-catacomb-torch', 45, 23, { roomId: catacombsId });
  // 2x heresy-catacomb-torch (trap paths, extinguished)
  editor.spawnProp(LEVEL_ID, 'heresy-catacomb-torch', 38, 20, { roomId: catacombsId });
  editor.spawnProp(LEVEL_ID, 'heresy-catacomb-torch', 43, 21, { roomId: catacombsId });
  // 1x heresy-corrupted-reliquary (maze niche)
  editor.spawnProp(LEVEL_ID, 'heresy-corrupted-reliquary', 40, 20, { roomId: catacombsId });
  // 3x heresy-bone-shelf (corridor wall niches)
  editor.spawnProp(LEVEL_ID, 'heresy-bone-shelf', 38, 16, { roomId: catacombsId });
  editor.spawnProp(LEVEL_ID, 'heresy-bone-shelf', 44, 19, { roomId: catacombsId });
  editor.spawnProp(LEVEL_ID, 'heresy-bone-shelf', 41, 23, { roomId: catacombsId });
  // 2x heresy-skull-pile (dead ends)
  editor.spawnProp(LEVEL_ID, 'heresy-skull-pile', 37, 19, { roomId: catacombsId });
  editor.spawnProp(LEVEL_ID, 'heresy-skull-pile', 44, 22, { roomId: catacombsId });
  // 3x heresy-scattered-bones (corridor floors)
  editor.spawnProp(LEVEL_ID, 'heresy-scattered-bones', 39, 18, { roomId: catacombsId });
  editor.spawnProp(LEVEL_ID, 'heresy-scattered-bones', 42, 21, { roomId: catacombsId });
  editor.spawnProp(LEVEL_ID, 'heresy-scattered-bones', 38, 23, { roomId: catacombsId });

  // --- Trial Chamber (bounds: 19, 32, 12, 12) ---
  // Structural: 2x heresy-cracked-marble-pillar
  editor.spawnProp(LEVEL_ID, 'heresy-cracked-marble-pillar', 20, 33, { roomId: trialChamberId });
  editor.spawnProp(LEVEL_ID, 'heresy-cracked-marble-pillar', 30, 33, { roomId: trialChamberId });
  // 2x heresy-church-pew (judge bench seating)
  editor.spawnProp(LEVEL_ID, 'heresy-church-pew', 23, 35, { roomId: trialChamberId });
  editor.spawnProp(LEVEL_ID, 'heresy-church-pew', 27, 35, { roomId: trialChamberId });
  // 1x heretic-tome (judge's podium)
  editor.spawnProp(LEVEL_ID, 'heretic-tome', 25, 35, { roomId: trialChamberId });
  // 2x heresy-broken-stained-glass (walls)
  editor.spawnProp(LEVEL_ID, 'heresy-broken-stained-glass', 20, 38, { roomId: trialChamberId });
  editor.spawnProp(LEVEL_ID, 'heresy-broken-stained-glass', 30, 38, { roomId: trialChamberId });
  // 1x heresy-toppled-altar (south floor)
  editor.spawnProp(LEVEL_ID, 'heresy-toppled-altar', 23, 42, { roomId: trialChamberId });
  // 1x heresy-profane-symbol (south wall)
  editor.spawnProp(LEVEL_ID, 'heresy-profane-symbol', 25, 43, { roomId: trialChamberId });
  // 1x heresy-torn-scripture-slab (bench surface)
  editor.spawnProp(LEVEL_ID, 'heresy-torn-scripture-slab', 22, 36, { roomId: trialChamberId });
  // 1x heresy-shattered-icon (south floor near exit)
  editor.spawnProp(LEVEL_ID, 'heresy-shattered-icon', 27, 42, { roomId: trialChamberId });
  // 2x inverted-cross (walls)
  editor.spawnProp(LEVEL_ID, 'inverted-cross', 20, 38, { roomId: trialChamberId });
  editor.spawnProp(LEVEL_ID, 'inverted-cross', 30, 38, { roomId: trialChamberId });

  // --- Ossuary (bounds: 10, 40, 8, 8) ---
  // 4x heresy-bone-urn
  editor.spawnProp(LEVEL_ID, 'heresy-bone-urn', 12, 42, { roomId: ossuaryId });
  editor.spawnProp(LEVEL_ID, 'heresy-bone-urn', 16, 42, { roomId: ossuaryId });
  editor.spawnProp(LEVEL_ID, 'heresy-bone-urn', 11, 45, { roomId: ossuaryId });
  editor.spawnProp(LEVEL_ID, 'heresy-bone-urn', 17, 45, { roomId: ossuaryId });
  // 6x heresy-bone-shelf (walls)
  editor.spawnProp(LEVEL_ID, 'heresy-bone-shelf', 11, 41, { roomId: ossuaryId });
  editor.spawnProp(LEVEL_ID, 'heresy-bone-shelf', 17, 41, { roomId: ossuaryId });
  editor.spawnProp(LEVEL_ID, 'heresy-bone-shelf', 10, 44, { roomId: ossuaryId });
  editor.spawnProp(LEVEL_ID, 'heresy-bone-shelf', 18, 44, { roomId: ossuaryId });
  editor.spawnProp(LEVEL_ID, 'heresy-bone-shelf', 11, 47, { roomId: ossuaryId });
  editor.spawnProp(LEVEL_ID, 'heresy-bone-shelf', 17, 47, { roomId: ossuaryId });
  // 2x heresy-skull-pile (floor)
  editor.spawnProp(LEVEL_ID, 'heresy-skull-pile', 14, 42, { roomId: ossuaryId });
  editor.spawnProp(LEVEL_ID, 'heresy-skull-pile', 13, 46, { roomId: ossuaryId });
  // 3x heresy-scattered-bones (floor)
  editor.spawnProp(LEVEL_ID, 'heresy-scattered-bones', 12, 44, { roomId: ossuaryId });
  editor.spawnProp(LEVEL_ID, 'heresy-scattered-bones', 16, 44, { roomId: ossuaryId });
  editor.spawnProp(LEVEL_ID, 'heresy-scattered-bones', 14, 45, { roomId: ossuaryId });
  // 3x wrath-chain-curtain (ceiling-hung, reduced)
  editor.spawnProp(LEVEL_ID, 'wrath-chain-curtain', 12, 41, { roomId: ossuaryId });
  editor.spawnProp(LEVEL_ID, 'wrath-chain-curtain', 14, 43, { roomId: ossuaryId });
  editor.spawnProp(LEVEL_ID, 'wrath-chain-curtain', 16, 46, { roomId: ossuaryId });
  // 1x heresy-corrupted-reliquary (center floor)
  editor.spawnProp(LEVEL_ID, 'heresy-corrupted-reliquary', 14, 44, { roomId: ossuaryId });

  // --- Heretic's Library (bounds: 36, 36, 6, 8) ---
  // 4x heresy-forbidden-bookcase (walls)
  editor.spawnProp(LEVEL_ID, 'heresy-forbidden-bookcase', 37, 37, { roomId: libraryId });
  editor.spawnProp(LEVEL_ID, 'heresy-forbidden-bookcase', 41, 37, { roomId: libraryId });
  editor.spawnProp(LEVEL_ID, 'heresy-forbidden-bookcase', 36, 40, { roomId: libraryId });
  editor.spawnProp(LEVEL_ID, 'heresy-forbidden-bookcase', 42, 40, { roomId: libraryId });
  // 1x heretic-tome (center reading podium)
  editor.spawnProp(LEVEL_ID, 'heretic-tome', 39, 40, { roomId: libraryId });
  // 2x heresy-torn-scripture-slab (floor, scattered)
  editor.spawnProp(LEVEL_ID, 'heresy-torn-scripture-slab', 38, 42, { roomId: libraryId });
  editor.spawnProp(LEVEL_ID, 'heresy-torn-scripture-slab', 40, 43, { roomId: libraryId });

  // --- Profano's Chapel (bounds: 18, 54, 14, 14) ---
  // Structural: 1x heresy-desecrated-arch (entrance)
  editor.spawnProp(LEVEL_ID, 'heresy-desecrated-arch', 25, 54, { roomId: chapelId });
  // Structural: 4x heresy-cracked-marble-pillar (columns)
  editor.spawnProp(LEVEL_ID, 'heresy-cracked-marble-pillar', 19, 56, { roomId: chapelId });
  editor.spawnProp(LEVEL_ID, 'heresy-cracked-marble-pillar', 31, 56, { roomId: chapelId });
  editor.spawnProp(LEVEL_ID, 'heresy-cracked-marble-pillar', 19, 66, { roomId: chapelId });
  editor.spawnProp(LEVEL_ID, 'heresy-cracked-marble-pillar', 31, 66, { roomId: chapelId });
  // 1x heresy-pentagram-floor-tile (center floor)
  editor.spawnProp(LEVEL_ID, 'heresy-pentagram-floor-tile', 25, 61, { roomId: chapelId });
  // 1x heresy-ritual-chandelier (ceiling center)
  editor.spawnProp(LEVEL_ID, 'heresy-ritual-chandelier', 25, 61, { roomId: chapelId });
  // 1x heretic-tome (center altar)
  editor.spawnProp(LEVEL_ID, 'heretic-tome', 25, 61, { roomId: chapelId });
  // 2x inverted-cross (walls)
  editor.spawnProp(LEVEL_ID, 'inverted-cross', 20, 55, { roomId: chapelId });
  editor.spawnProp(LEVEL_ID, 'inverted-cross', 30, 67, { roomId: chapelId });
  // 2x heresy-cracked-baptismal-font (corners)
  editor.spawnProp(LEVEL_ID, 'heresy-cracked-baptismal-font', 20, 66, { roomId: chapelId });
  editor.spawnProp(LEVEL_ID, 'heresy-cracked-baptismal-font', 30, 56, { roomId: chapelId });
  // 1x heresy-profane-symbol (north wall center)
  editor.spawnProp(LEVEL_ID, 'heresy-profane-symbol', 25, 55, { roomId: chapelId });
  // 1x heresy-burning-pyre (west edge)
  editor.spawnProp(LEVEL_ID, 'heresy-burning-pyre', 19, 61, { roomId: chapelId });

  // =========================================================================
  // 5d. DECALS (from design doc Leaking001-003, Stain001 mappings)
  // =========================================================================

  // --- Narthex: water seepage on walls near ceiling (ancient temple) ---
  editor.placeDecals(LEVEL_ID, narthexId, [
    { type: DECAL_TYPES.WATER_STAIN, x: 21, z: 4, surface: 'wall' },
    { type: DECAL_TYPES.WATER_STAIN, x: 29, z: 4, surface: 'wall' },
  ]);

  // --- Nave of Lies: water seepage + scorch marks near FLOOR_VOID trap ---
  //   FLOOR_VOID trap cells: (24,17), (24,18), (25,18), (25,19), (24,19), (24,20)
  //   Scorch marks placed around edges as gameplay hints
  editor.placeDecals(LEVEL_ID, naveId, [
    { type: DECAL_TYPES.WATER_STAIN, x: 18, z: 15, surface: 'wall' },
    { type: DECAL_TYPES.WATER_STAIN, x: 32, z: 15, surface: 'wall' },
    { type: DECAL_TYPES.SCORCH_MARK, x: 23, z: 17 },
    { type: DECAL_TYPES.SCORCH_MARK, x: 26, z: 18 },
    { type: DECAL_TYPES.SCORCH_MARK, x: 23, z: 20 },
  ]);

  // --- Confessional: water stains on walls near ceiling ---
  editor.placeDecals(LEVEL_ID, confessionalId, [
    { type: DECAL_TYPES.WATER_STAIN, x: 8, z: 18, surface: 'wall' },
  ]);

  // --- Catacombs: water seepage + scorch marks near FLOOR_VOID traps ---
  //   Void trap 1 at (44, 20, 2, 1), void trap 2 at (40, 23, 2, 1)
  editor.placeDecals(LEVEL_ID, catacombsId, [
    { type: DECAL_TYPES.WATER_STAIN, x: 36, z: 16, surface: 'wall' },
    { type: DECAL_TYPES.WATER_STAIN, x: 46, z: 16, surface: 'wall' },
    { type: DECAL_TYPES.SCORCH_MARK, x: 43, z: 20 },
    { type: DECAL_TYPES.SCORCH_MARK, x: 39, z: 23 },
  ]);

  // --- Trial Chamber: water stains on walls near ceiling ---
  editor.placeDecals(LEVEL_ID, trialChamberId, [
    { type: DECAL_TYPES.WATER_STAIN, x: 19, z: 36, surface: 'wall' },
    { type: DECAL_TYPES.WATER_STAIN, x: 31, z: 36, surface: 'wall' },
  ]);

  // --- Profano's Chapel: water seepage on all walls ---
  editor.placeDecals(LEVEL_ID, chapelId, [
    { type: DECAL_TYPES.WATER_STAIN, x: 18, z: 58, surface: 'wall' },
    { type: DECAL_TYPES.WATER_STAIN, x: 32, z: 58, surface: 'wall' },
    { type: DECAL_TYPES.WATER_STAIN, x: 18, z: 64, surface: 'wall' },
    { type: DECAL_TYPES.WATER_STAIN, x: 32, z: 64, surface: 'wall' },
  ]);

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
  // EXPANSION — 6 new rooms, 35+ enemies, new encounters
  // =========================================================================
  //
  // Existing room bounds (for non-overlap reference):
  //   Narthex           (21,  2,  8,  6) → x:[21..28], z:[2..7]
  //   Nave of Lies      (18, 12, 14, 10) → x:[18..31], z:[12..21]
  //   Confessional      ( 8, 16,  6,  6) → x:[8..13],  z:[16..21]
  //   Catacombs         (36, 14, 10, 10) → x:[36..45], z:[14..23]
  //   Trial Chamber     (19, 32, 12, 12) → x:[19..30], z:[32..43]
  //   Ossuary           (10, 40,  8,  8) → x:[10..17], z:[40..47]
  //   Heretic's Library (36, 36,  6,  8) → x:[36..41], z:[36..43]
  //   Profano's Chapel  (18, 54, 14, 14) → x:[18..31], z:[54..67]
  //
  // New rooms placed in open grid areas (level is 50 wide x 70 deep):
  //   Inquisitor's Antechamber ( 1, 22,  9,  8) → x:[1..9],  z:[22..29] CLEAR
  //   Forbidden Scriptorium    (32, 24, 10, 10) → x:[32..41],z:[24..33] CLEAR
  //   Ritual Pit               ( 1, 32,  9,  8) → x:[1..9],  z:[32..39] CLEAR
  //   Crypt of the Damned      (32, 44, 10, 10) → x:[32..41],z:[44..53] CLEAR
  //   Penitent's Corridor      ( 1, 40,  9, 10) → x:[1..9],  z:[40..49] CLEAR
  //   Vestibule of Doubt       (33, 54, 10, 12) → x:[33..42],z:[54..65] CLEAR

  // ── New Rooms ────────────────────────────────────────────────────────────

  // Inquisitor's Antechamber: interrogation room south of Confessional
  // x:[1..9], z:[22..29]
  const inquisitorId = editor.room(LEVEL_ID, 'inquisitors_antechamber', 1, 22, 9, 8, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 8,
    floorTexture: 'stone-dark',
    wallTexture: 'brick',
    fillRule: {
      type: 'scatter',
      props: ['heresy-church-pew', 'heresy-bone-urn', 'heresy-confessional-booth'],
      density: 0.2,
    },
  });

  // Forbidden Scriptorium: secret archive east of Trial Chamber, south of Catacombs
  // x:[32..41], z:[24..33]
  const scriptoriumId = editor.room(LEVEL_ID, 'forbidden_scriptorium', 32, 24, 10, 10, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 9,
    floorTexture: 'stone-dark',
    wallTexture: 'brick',
    fillRule: {
      type: 'scatter',
      props: ['heresy-forbidden-bookcase', 'heretic-tome', 'heresy-torn-scripture-slab'],
      density: 0.18,
    },
  });

  // Ritual Pit: sunken arena south of Inquisitor's Antechamber
  // x:[1..9], z:[32..39]
  const ritualPitId = editor.room(LEVEL_ID, 'ritual_pit', 1, 32, 9, 8, {
    roomType: ROOM_TYPES.ARENA,
    elevation: -1,
    sortOrder: 10,
    floorTexture: 'tiles',
    wallTexture: 'stone-dark',
    fillRule: {
      type: 'scatter',
      props: ['heresy-burning-pyre', 'heresy-pentagram-floor-tile', 'heresy-toppled-altar'],
      density: 0.12,
    },
  });

  // Crypt of the Damned: sealed burial vault below Heretic's Library
  // x:[32..41], z:[44..53]
  const cryptId = editor.room(LEVEL_ID, 'crypt_of_the_damned', 32, 44, 10, 10, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: -1,
    sortOrder: 11,
    floorTexture: 'brick',
    wallTexture: 'brick',
    fillRule: {
      type: 'scatter',
      props: ['heresy-bone-urn', 'heresy-catacomb-torch', 'heresy-cracked-marble-pillar'],
      density: 0.15,
    },
  });

  // Penitent's Corridor: winding passage connecting west crypts to Ossuary
  // x:[1..9], z:[40..49]
  const penitentCorridorId = editor.room(LEVEL_ID, 'penitents_corridor', 1, 40, 9, 10, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 12,
    floorTexture: 'stone-dark',
    wallTexture: 'brick',
    fillRule: {
      type: 'scatter',
      props: ['heresy-shattered-icon', 'heresy-profane-symbol', 'heresy-torn-scripture-slab'],
      density: 0.1,
    },
  });

  // Vestibule of Doubt: antechamber approach to Profano's Chapel from the east
  // x:[33..42], z:[54..65]
  const vestibuleOfDoubtId = editor.room(LEVEL_ID, 'vestibule_of_doubt', 33, 54, 10, 12, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 13,
    floorTexture: 'tiles',
    wallTexture: 'stone-dark',
    fillRule: {
      type: 'scatter',
      props: ['heresy-broken-stained-glass', 'heresy-desecrated-arch', 'inverted-cross'],
      density: 0.12,
    },
  });

  // ── New Connections ───────────────────────────────────────────────────────

  // Confessional south → Inquisitor's Antechamber north
  editor.corridor(LEVEL_ID, confessionalId, inquisitorId, 2);

  // Inquisitor's Antechamber south → Ritual Pit (stairs down, -1)
  editor.connect(LEVEL_ID, inquisitorId, ritualPitId, {
    connectionType: CONNECTION_TYPES.STAIRS,
    corridorWidth: 2,
    fromElevation: 0,
    toElevation: -1,
  });

  // Catacombs south → Forbidden Scriptorium (stairs up, -1 to 0)
  editor.connect(LEVEL_ID, catacombsId, scriptoriumId, {
    connectionType: CONNECTION_TYPES.STAIRS,
    corridorWidth: 2,
    fromElevation: -1,
    toElevation: 0,
  });

  // Trial Chamber east → Forbidden Scriptorium west (corridor)
  editor.corridor(LEVEL_ID, trialChamberId, scriptoriumId, 2);

  // Ritual Pit south → Penitent's Corridor (stairs up, -1 to 0)
  editor.connect(LEVEL_ID, ritualPitId, penitentCorridorId, {
    connectionType: CONNECTION_TYPES.STAIRS,
    corridorWidth: 2,
    fromElevation: -1,
    toElevation: 0,
  });

  // Penitent's Corridor east → Ossuary west (corridor)
  editor.corridor(LEVEL_ID, penitentCorridorId, ossuaryId, 2);

  // Heretic's Library south → Crypt of the Damned north (stairs down, 0 to -1)
  editor.connect(LEVEL_ID, libraryId, cryptId, {
    connectionType: CONNECTION_TYPES.STAIRS,
    corridorWidth: 2,
    fromElevation: 0,
    toElevation: -1,
  });

  // Crypt of the Damned south → Vestibule of Doubt north (stairs up, -1 to 0)
  editor.connect(LEVEL_ID, cryptId, vestibuleOfDoubtId, {
    connectionType: CONNECTION_TYPES.STAIRS,
    corridorWidth: 2,
    fromElevation: -1,
    toElevation: 0,
  });

  // Vestibule of Doubt west → Profano's Chapel east (corridor, width 3)
  editor.corridor(LEVEL_ID, vestibuleOfDoubtId, chapelId, 3);

  // ── New Enemies ────────────────────────────────────────────────────────────
  // Target: 35+ additional enemies spread across 6 new rooms
  //
  // Inquisitor's Antechamber (1, 22, 9, 8) → interior x:[2..9], z:[23..29]
  // 4x GOAT_KNIGHT (inquisitors — heavy armored patrols)
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 3, 24, {
    roomId: inquisitorId,
    patrol: [
      { x: 3, z: 24 },
      { x: 8, z: 28 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 8, 24, {
    roomId: inquisitorId,
    patrol: [
      { x: 8, z: 24 },
      { x: 3, z: 28 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 5, 26, {
    roomId: inquisitorId,
    patrol: [
      { x: 2, z: 26 },
      { x: 8, z: 26 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 5, 28, {
    roomId: inquisitorId,
  });

  // Forbidden Scriptorium (32, 24, 10, 10) → interior x:[33..41], z:[25..33]
  // 6x mix: corrupted scholars (HELLGOAT) + archive guards (GOAT_KNIGHT)
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 34, 26, {
    roomId: scriptoriumId,
    patrol: [
      { x: 34, z: 25 },
      { x: 40, z: 25 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 34, 30, {
    roomId: scriptoriumId,
    patrol: [
      { x: 34, z: 30 },
      { x: 40, z: 30 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 37, 27, {
    roomId: scriptoriumId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 40, 26, {
    roomId: scriptoriumId,
    patrol: [
      { x: 40, z: 25 },
      { x: 40, z: 33 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 33, 32, {
    roomId: scriptoriumId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.SHADOW_GOAT, 37, 32, {
    roomId: scriptoriumId,
  });

  // Ritual Pit (1, 32, 9, 8) → interior x:[2..9], z:[33..39]
  // Arena waves: 3 waves of cultist ambush (HELLGOAT + SHADOW_GOAT)
  editor.setupArenaWaves(LEVEL_ID, ritualPitId, { x: 2, z: 33, w: 7, h: 4 }, [
    // Wave 1: 3x HELLGOAT (first cultists emerge from the pyre)
    [
      { type: ENEMY_TYPES.HELLGOAT, x: 3, z: 34 },
      { type: ENEMY_TYPES.HELLGOAT, x: 5, z: 33 },
      { type: ENEMY_TYPES.HELLGOAT, x: 8, z: 34 },
    ],
    // Wave 2: 2x SHADOW_GOAT flank from the walls
    [
      { type: ENEMY_TYPES.SHADOW_GOAT, x: 2, z: 38 },
      { type: ENEMY_TYPES.SHADOW_GOAT, x: 8, z: 38 },
    ],
    // Wave 3: 1x GOAT_KNIGHT as pit champion
    [
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 5, z: 36 },
      { type: ENEMY_TYPES.HELLGOAT, x: 3, z: 37 },
      { type: ENEMY_TYPES.HELLGOAT, x: 7, z: 37 },
    ],
  ]);

  // Crypt of the Damned (32, 44, 10, 10) → interior x:[33..41], z:[45..53]
  // 7x tomb guardians lurking among sarcophagi
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.SHADOW_GOAT, 34, 46, {
    roomId: cryptId,
    patrol: [
      { x: 34, z: 45 },
      { x: 34, z: 53 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.SHADOW_GOAT, 40, 46, {
    roomId: cryptId,
    patrol: [
      { x: 40, z: 45 },
      { x: 40, z: 53 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.SHADOW_GOAT, 37, 49, {
    roomId: cryptId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 33, 52, {
    roomId: cryptId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 40, 52, {
    roomId: cryptId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 36, 51, {
    roomId: cryptId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 38, 47, {
    roomId: cryptId,
  });

  // Penitent's Corridor (1, 40, 9, 10) → interior x:[2..9], z:[41..49]
  // 5x gauntlet of penitent monks (HELLGOAT patrol through corridor)
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 3, 42, {
    roomId: penitentCorridorId,
    patrol: [
      { x: 2, z: 42 },
      { x: 8, z: 42 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 5, 44, {
    roomId: penitentCorridorId,
    patrol: [
      { x: 2, z: 44 },
      { x: 8, z: 44 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 3, 47, {
    roomId: penitentCorridorId,
    patrol: [
      { x: 2, z: 47 },
      { x: 8, z: 47 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.SHADOW_GOAT, 7, 45, {
    roomId: penitentCorridorId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.SHADOW_GOAT, 4, 48, {
    roomId: penitentCorridorId,
  });

  // Vestibule of Doubt (33, 54, 10, 12) → interior x:[34..42], z:[55..65]
  // 7x mixed elite guard before the chapel
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 35, 56, {
    roomId: vestibuleOfDoubtId,
    patrol: [
      { x: 35, z: 55 },
      { x: 35, z: 65 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 41, 56, {
    roomId: vestibuleOfDoubtId,
    patrol: [
      { x: 41, z: 55 },
      { x: 41, z: 65 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 38, 60, {
    roomId: vestibuleOfDoubtId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 35, 63, {
    roomId: vestibuleOfDoubtId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 41, 63, {
    roomId: vestibuleOfDoubtId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.SHADOW_GOAT, 37, 58, {
    roomId: vestibuleOfDoubtId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.SHADOW_GOAT, 39, 64, {
    roomId: vestibuleOfDoubtId,
  });

  // ── ENEMIES: CONFESSIONAL (static lurkers) ────────────────────────────
  // Room bounds: (8, 16, 6, 6) → interior x=[9..12], z=[17..20] (walls at x=8,13 z=16,21)
  // 2 shadow goats hiding in confession booths
  // Note: (10,18) is the ambush trigger entity → use (11,18); patrol uses interior cells only
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.SHADOW_GOAT, 11, 18, {
    roomId: confessionalId,
    patrol: [
      { x: 10, z: 17 },
      { x: 12, z: 20 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.SHADOW_GOAT, 12, 19, {
    roomId: confessionalId,
    patrol: [
      { x: 12, z: 17 },
      { x: 10, z: 20 },
    ],
  });

  // ── ENEMIES: TRIAL CHAMBER (pre-wave sentinels) ───────────────────────
  // Room bounds: (19, 32, 12, 12) → interior x=[20..29], z=[33..42]
  // 3 fire goat/shadow goat sentinels before the arena wave trigger
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 21, 35, { roomId: trialChamberId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 28, 35, { roomId: trialChamberId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.SHADOW_GOAT, 24, 41, { roomId: trialChamberId });

  // ── ENEMIES: OSSUARY (additional tomb guardians) ──────────────────────
  // Room bounds: (10, 40, 8, 8) → interior x=[11..16], z=[41..46]
  // 3 more guardians among the burial niches
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.SHADOW_GOAT, 13, 42, { roomId: ossuaryId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 12, 45, { roomId: ossuaryId }); // (11,45) occupied by heresy-bone-urn prop
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.SHADOW_GOAT, 15, 44, { roomId: ossuaryId });

  // ── New Pickups ────────────────────────────────────────────────────────────

  // Inquisitor's Antechamber: health near entry, ammo near torture rack
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 4, 23);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 7, 28);

  // Forbidden Scriptorium: ammo x2 (behind bookcases), health (reading table)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 33, 25);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 40, 32);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 36, 29);

  // Ritual Pit: ammo near entry (before waves lock)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 3, 33);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 7, 39);

  // Crypt of the Damned: ammo hidden in sarcophagus alcove, health near exit
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 33, 46);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 40, 50);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 37, 53);

  // Penitent's Corridor: ammo scattered along gauntlet
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 5, 41);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 2, 48);

  // Vestibule of Doubt: ammo x2 flanking the approach, health near chapel door
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 34, 55);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 41, 55);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 38, 64);

  // ── New Props ────────────────────────────────────────────────────────────

  // --- Inquisitor's Antechamber (bounds: 1, 22, 9, 8) ---
  editor.spawnProp(LEVEL_ID, 'heresy-cracked-marble-pillar', 2, 23, { roomId: inquisitorId });
  editor.spawnProp(LEVEL_ID, 'heresy-cracked-marble-pillar', 9, 23, { roomId: inquisitorId });
  editor.spawnProp(LEVEL_ID, 'heresy-confessional-booth', 2, 26, { roomId: inquisitorId });
  editor.spawnProp(LEVEL_ID, 'heresy-confessional-booth', 8, 26, { roomId: inquisitorId });
  editor.spawnProp(LEVEL_ID, 'heresy-catacomb-torch', 1, 25, { roomId: inquisitorId });
  editor.spawnProp(LEVEL_ID, 'heresy-catacomb-torch', 9, 25, { roomId: inquisitorId });
  editor.spawnProp(LEVEL_ID, 'inverted-cross', 5, 22, { roomId: inquisitorId });
  editor.spawnProp(LEVEL_ID, 'heresy-torn-scripture-slab', 5, 28, { roomId: inquisitorId });

  // --- Forbidden Scriptorium (bounds: 32, 24, 10, 10) ---
  editor.spawnProp(LEVEL_ID, 'heresy-forbidden-bookcase', 33, 25, { roomId: scriptoriumId });
  editor.spawnProp(LEVEL_ID, 'heresy-forbidden-bookcase', 33, 29, { roomId: scriptoriumId });
  editor.spawnProp(LEVEL_ID, 'heresy-forbidden-bookcase', 41, 25, { roomId: scriptoriumId });
  editor.spawnProp(LEVEL_ID, 'heresy-forbidden-bookcase', 41, 29, { roomId: scriptoriumId });
  editor.spawnProp(LEVEL_ID, 'heretic-tome', 37, 28, { roomId: scriptoriumId });
  editor.spawnProp(LEVEL_ID, 'heresy-profane-symbol', 37, 24, { roomId: scriptoriumId });
  editor.spawnProp(LEVEL_ID, 'heresy-catacomb-torch', 33, 27, { roomId: scriptoriumId });
  editor.spawnProp(LEVEL_ID, 'heresy-catacomb-torch', 41, 27, { roomId: scriptoriumId });
  editor.spawnProp(LEVEL_ID, 'heresy-bone-urn', 34, 33, { roomId: scriptoriumId });
  editor.spawnProp(LEVEL_ID, 'heresy-bone-urn', 40, 33, { roomId: scriptoriumId });

  // --- Ritual Pit (bounds: 1, 32, 9, 8) ---
  editor.spawnProp(LEVEL_ID, 'heresy-burning-pyre', 5, 35, { roomId: ritualPitId });
  editor.spawnProp(LEVEL_ID, 'heresy-pentagram-floor-tile', 5, 36, { roomId: ritualPitId });
  editor.spawnProp(LEVEL_ID, 'heresy-toppled-altar', 2, 38, { roomId: ritualPitId });
  editor.spawnProp(LEVEL_ID, 'heresy-toppled-altar', 8, 38, { roomId: ritualPitId });
  editor.spawnProp(LEVEL_ID, 'inverted-cross', 1, 36, { roomId: ritualPitId });
  editor.spawnProp(LEVEL_ID, 'inverted-cross', 9, 36, { roomId: ritualPitId });
  editor.spawnProp(LEVEL_ID, 'heresy-shattered-icon', 5, 32, { roomId: ritualPitId });

  // --- Crypt of the Damned (bounds: 32, 44, 10, 10) ---
  editor.spawnProp(LEVEL_ID, 'heresy-bone-urn', 33, 45, { roomId: cryptId });
  editor.spawnProp(LEVEL_ID, 'heresy-bone-urn', 41, 45, { roomId: cryptId });
  editor.spawnProp(LEVEL_ID, 'heresy-bone-urn', 33, 52, { roomId: cryptId });
  editor.spawnProp(LEVEL_ID, 'heresy-bone-urn', 41, 52, { roomId: cryptId });
  editor.spawnProp(LEVEL_ID, 'heresy-catacomb-torch', 33, 48, { roomId: cryptId });
  editor.spawnProp(LEVEL_ID, 'heresy-catacomb-torch', 41, 48, { roomId: cryptId });
  editor.spawnProp(LEVEL_ID, 'heresy-cracked-marble-pillar', 34, 46, { roomId: cryptId });
  editor.spawnProp(LEVEL_ID, 'heresy-cracked-marble-pillar', 40, 46, { roomId: cryptId });
  editor.spawnProp(LEVEL_ID, 'heresy-corrupted-reliquary', 37, 49, { roomId: cryptId });
  editor.spawnProp(LEVEL_ID, 'heresy-profane-symbol', 37, 44, { roomId: cryptId });

  // --- Penitent's Corridor (bounds: 1, 40, 9, 10) ---
  editor.spawnProp(LEVEL_ID, 'heresy-catacomb-torch', 1, 42, { roomId: penitentCorridorId });
  editor.spawnProp(LEVEL_ID, 'heresy-catacomb-torch', 9, 42, { roomId: penitentCorridorId });
  editor.spawnProp(LEVEL_ID, 'heresy-catacomb-torch', 1, 46, { roomId: penitentCorridorId });
  editor.spawnProp(LEVEL_ID, 'heresy-catacomb-torch', 9, 46, { roomId: penitentCorridorId });
  editor.spawnProp(LEVEL_ID, 'heresy-shattered-icon', 5, 41, { roomId: penitentCorridorId });
  editor.spawnProp(LEVEL_ID, 'heresy-torn-scripture-slab', 3, 45, { roomId: penitentCorridorId });
  editor.spawnProp(LEVEL_ID, 'heresy-torn-scripture-slab', 7, 48, { roomId: penitentCorridorId });

  // --- Vestibule of Doubt (bounds: 33, 54, 10, 12) ---
  editor.spawnProp(LEVEL_ID, 'heresy-cracked-marble-pillar', 34, 55, {
    roomId: vestibuleOfDoubtId,
  });
  editor.spawnProp(LEVEL_ID, 'heresy-cracked-marble-pillar', 42, 55, {
    roomId: vestibuleOfDoubtId,
  });
  editor.spawnProp(LEVEL_ID, 'heresy-cracked-marble-pillar', 34, 64, {
    roomId: vestibuleOfDoubtId,
  });
  editor.spawnProp(LEVEL_ID, 'heresy-cracked-marble-pillar', 42, 64, {
    roomId: vestibuleOfDoubtId,
  });
  editor.spawnProp(LEVEL_ID, 'heresy-desecrated-arch', 38, 54, { roomId: vestibuleOfDoubtId });
  editor.spawnProp(LEVEL_ID, 'inverted-cross', 34, 60, { roomId: vestibuleOfDoubtId });
  editor.spawnProp(LEVEL_ID, 'inverted-cross', 42, 60, { roomId: vestibuleOfDoubtId });
  editor.spawnProp(LEVEL_ID, 'heresy-broken-stained-glass', 36, 57, { roomId: vestibuleOfDoubtId });
  editor.spawnProp(LEVEL_ID, 'heresy-broken-stained-glass', 40, 57, { roomId: vestibuleOfDoubtId });
  editor.spawnProp(LEVEL_ID, 'heresy-ritual-chandelier', 38, 60, { roomId: vestibuleOfDoubtId });
  editor.spawnProp(LEVEL_ID, 'heresy-profane-symbol', 38, 65, { roomId: vestibuleOfDoubtId });

  // ── New Triggers ───────────────────────────────────────────────────────────

  // Inquisitor's Antechamber: ritual ambush when player enters (lockDoors + spawnWave)
  editor.ambush(
    LEVEL_ID,
    { x: 2, z: 23, w: 7, h: 3 },
    [
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 3, z: 25 },
      { type: ENEMY_TYPES.HELLGOAT, x: 7, z: 25 },
    ],
    { roomId: inquisitorId },
  );

  // Forbidden Scriptorium: fog thickens on entry (archive's cold dread)
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 33,
    zoneZ: 24,
    zoneW: 10,
    zoneH: 2,
    roomId: scriptoriumId,
    once: true,
    actionData: { fogDensity: 0.07, fogColor: '#100c18' },
  });

  // Crypt of the Damned: tomb ambush — shadow goats awaken from sarcophagi
  editor.ambush(
    LEVEL_ID,
    { x: 33, z: 45, w: 8, h: 3 },
    [
      { type: ENEMY_TYPES.SHADOW_GOAT, x: 35, z: 47 },
      { type: ENEMY_TYPES.SHADOW_GOAT, x: 39, z: 47 },
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 37, z: 52 },
    ],
    { roomId: cryptId },
  );

  // Vestibule of Doubt: lockDoors + elite guard triggered on entry
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.LOCK_DOORS,
    zoneX: 34,
    zoneZ: 55,
    zoneW: 8,
    zoneH: 3,
    roomId: vestibuleOfDoubtId,
    once: true,
    delay: 1,
  });

  // Vestibule of Doubt: dialogue — Profano taunts from across the threshold
  editor.dialogue(
    LEVEL_ID,
    { x: 34, z: 55, w: 8, h: 3 },
    'You approach the altar of truth. Let doubt be your undoing.',
    { roomId: vestibuleOfDoubtId },
  );

  // ── New Environment Zones ─────────────────────────────────────────────────

  // Inquisitor's Antechamber: oppressive incense fog
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.FOG,
    boundsX: 1,
    boundsZ: 22,
    boundsW: 9,
    boundsH: 8,
    intensity: 0.5,
  });

  // Forbidden Scriptorium: cold reading-room darkness
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.FOG,
    boundsX: 32,
    boundsZ: 24,
    boundsW: 10,
    boundsH: 10,
    intensity: 0.55,
  });

  // Ritual Pit: hellfire zone at the pyre center
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.FIRE,
    boundsX: 3,
    boundsZ: 34,
    boundsW: 5,
    boundsH: 4,
    intensity: 0.8,
  });

  // Crypt of the Damned: underground darkness (dense fog)
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.FOG,
    boundsX: 32,
    boundsZ: 44,
    boundsW: 10,
    boundsH: 10,
    intensity: 0.65,
  });

  // Penitent's Corridor: thin persistent fog throughout
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.FOG,
    boundsX: 1,
    boundsZ: 40,
    boundsW: 9,
    boundsH: 10,
    intensity: 0.45,
  });

  // Vestibule of Doubt: illusion zone — Profano's mirage effect
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.ILLUSION,
    boundsX: 35,
    boundsZ: 58,
    boundsW: 6,
    boundsH: 6,
    intensity: 0.8,
  });

  // END EXPANSION

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
