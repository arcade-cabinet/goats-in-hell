#!/usr/bin/env npx tsx
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

const LEVEL_ID = 'circle-5-wrath';
const THEME_ID = 'circle-5-wrath';

export async function buildCircle5(dbPath: string) {
  const sqliteDb = new BetterSqlite3(dbPath);
  const db = drizzle(sqliteDb, { schema });
  await migrateAndSeed(db);
  const editor = new LevelEditor(db);

  // =========================================================================
  // 1. THEME (from "Theme Configuration" section)
  // =========================================================================

  editor.createTheme(THEME_ID, {
    name: 'wrath',
    displayName: 'WRATH -- The Circle of Rage',
    primaryWall: MapCell.WALL_STONE,
    accentWalls: [MapCell.WALL_OBSIDIAN],
    fogDensity: 0.03,
    fogColor: '#1a0808',
    ambientColor: '#ff4411',
    ambientIntensity: 0.22,
    skyColor: '#0a0000',
    particleEffect: 'embers',
    enemyTypes: ['fireGoat', 'hellgoat', 'goatKnight'],
    enemyDensity: 1.4,
    pickupDensity: 1.0,
  });

  // =========================================================================
  // 2. LEVEL (from "Identity" + "Grid Dimensions" sections)
  // =========================================================================

  editor.createLevel(LEVEL_ID, {
    name: 'Circle 5: Wrath',
    levelType: 'circle',
    width: 48,
    depth: 114, // Boss room at Z=98 + H=16 = 114
    floor: 5,
    themeId: THEME_ID,
    circleNumber: 5,
    sin: 'Rage',
    guardian: 'Furia',
  });

  // =========================================================================
  // 3. ROOMS (from "Room Placement" table, in sortOrder)
  // =========================================================================
  //
  //   | Room               | X  | Z  | W  | H  | Type          | Elevation                            | sortOrder |
  //   | Gate of Dis        | 19 |  2 | 10 |  6 | exploration   | 0                                    | 0         |
  //   | Blood Marsh        | 16 | 12 | 16 | 14 | exploration   | 0 (marsh=-0.5, islands=0)            | 1         |
  //   | Rage Pit           | 22 | 30 | 12 | 12 | platforming   | -2 (center) to 0 (rim)               | 2         |
  //   | Arsenal            | 14 | 46 | 12 |  6 | exploration   | 0                                    | 3         |
  //   | Berserker Arena    | 15 | 56 | 14 | 14 | arena         | 0                                    | 4         |
  //   | Shrine of Fury     |  2 | 74 |  6 |  6 | secret        | 0                                    | 5         |
  //   | Gauntlet           | 21 | 74 |  6 | 20 | corridor      | 0 to -1 (descending ramps)           | 6         |
  //   | Furia's Colosseum  | 16 | 98 | 16 | 16 | boss          | 0                                    | 7         |

  const gateOfDisId = editor.room(LEVEL_ID, 'gate_of_dis', 19, 2, 10, 6, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 0,
  });

  const bloodMarshId = editor.room(LEVEL_ID, 'blood_marsh', 16, 12, 16, 14, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 1,
  });

  const ragePitId = editor.room(LEVEL_ID, 'rage_pit', 22, 30, 12, 12, {
    roomType: ROOM_TYPES.PLATFORMING,
    elevation: -2,
    sortOrder: 2,
  });

  const arsenalId = editor.room(LEVEL_ID, 'arsenal', 14, 46, 12, 6, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 3,
  });

  const berserkerArenaId = editor.room(LEVEL_ID, 'berserker_arena', 15, 56, 14, 14, {
    roomType: ROOM_TYPES.ARENA,
    elevation: 0,
    sortOrder: 4,
  });

  const shrineOfFuryId = editor.room(LEVEL_ID, 'shrine_of_fury', 2, 74, 6, 6, {
    roomType: ROOM_TYPES.SECRET,
    elevation: 0,
    sortOrder: 5,
  });

  const gauntletId = editor.room(LEVEL_ID, 'gauntlet', 21, 74, 6, 20, {
    roomType: ROOM_TYPES.CORRIDOR,
    elevation: 0,
    sortOrder: 6,
  });

  const colosseumId = editor.room(LEVEL_ID, 'furias_colosseum', 16, 98, 16, 16, {
    roomType: ROOM_TYPES.BOSS,
    elevation: 0,
    sortOrder: 7,
  });

  // =========================================================================
  // 4. CONNECTIONS (from "Connections" table)
  // =========================================================================
  //
  //   | From            | To              | Type     | Width | Notes                               |
  //   | Gate of Dis     | Blood Marsh     | corridor | 3     | Wide, descent into marsh             |
  //   | Blood Marsh     | Rage Pit        | corridor | 2     | East-side exit, elevated over marsh  |
  //   | Blood Marsh     | Arsenal         | corridor | 2     | West-side path, optional order       |
  //   | Rage Pit        | Arsenal         | corridor | 2     | South exit from pit rim              |
  //   | Arsenal         | Berserker Arena | corridor | 3     | Wide, arena entrance                 |
  //   | Berserker Arena | Shrine of Fury  | secret   | 2     | WALL_SECRET on west wall             |
  //   | Berserker Arena | Gauntlet        | corridor | 2     | East exit, the gauntlet begins       |
  //   | Gauntlet        | Colosseum       | corridor | 3     | Final approach, widening             |

  // Gate of Dis -> Blood Marsh (corridor, width 3)
  editor.corridor(LEVEL_ID, gateOfDisId, bloodMarshId, 3);

  // Blood Marsh -> Rage Pit (corridor, width 2)
  editor.corridor(LEVEL_ID, bloodMarshId, ragePitId, 2);

  // Blood Marsh -> Arsenal (corridor, width 2)
  editor.corridor(LEVEL_ID, bloodMarshId, arsenalId, 2);

  // Rage Pit -> Arsenal (corridor, width 2)
  editor.corridor(LEVEL_ID, ragePitId, arsenalId, 2);

  // Arsenal -> Berserker Arena (corridor, width 3)
  editor.corridor(LEVEL_ID, arsenalId, berserkerArenaId, 3);

  // Berserker Arena -> Shrine of Fury (secret, width 2)
  editor.connect(LEVEL_ID, berserkerArenaId, shrineOfFuryId, {
    connectionType: CONNECTION_TYPES.SECRET,
    corridorWidth: 2,
  });

  // Berserker Arena -> Gauntlet (corridor, width 2)
  editor.corridor(LEVEL_ID, berserkerArenaId, gauntletId, 2);

  // Gauntlet -> Colosseum (corridor, width 3)
  editor.corridor(LEVEL_ID, gauntletId, colosseumId, 3);

  // =========================================================================
  // 5. ENTITIES: ENEMIES (from "Enemies" table)
  // =========================================================================

  // --- Blood Marsh: 3 fireGoat on raised islands + 2 hellgoat wading ---
  //   Room bounds: (16, 12, 16, 14) -> interior: x=[17..30], z=[13..24]
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 19, 15, {
    roomId: bloodMarshId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 25, 15, {
    roomId: bloodMarshId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 23, 20, {
    roomId: bloodMarshId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 20, 18, {
    roomId: bloodMarshId,
    patrol: [
      { x: 20, z: 18 },
      { x: 24, z: 22 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 28, 20, {
    roomId: bloodMarshId,
    patrol: [
      { x: 28, z: 20 },
      { x: 24, z: 16 },
    ],
  });

  // --- Rage Pit: 2 hellgoat tier 1/pit + 2 fireGoat tier 2 ---
  //   Room bounds: (22, 30, 12, 12) -> interior: x=[23..32], z=[31..40]
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 26, 35, {
    roomId: ragePitId,
    elevation: -2,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 30, 35, {
    roomId: ragePitId,
    elevation: -2,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 25, 33, {
    roomId: ragePitId,
    elevation: -1,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 31, 37, {
    roomId: ragePitId,
    elevation: -1,
  });

  // --- Arsenal: 1 goatKnight guards Goat's Bane + 1 fireGoat near entrance ---
  //   Room bounds: (14, 46, 12, 6) -> interior: x=[15..24], z=[47..50]
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 20, 50, {
    roomId: arsenalId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 16, 48, {
    roomId: arsenalId,
  });

  // --- Berserker Arena: 3 rounds via setupArenaWaves ---
  //   Room bounds: (15, 56, 14, 14) -> interior: x=[16..27], z=[57..68]
  //   Trigger zone from table: (16, 57, 12, 2)
  //   R1: 3 fireGoat (E, W, N edges)
  //   R2: 2 goatKnight (N, S)
  //   R3: 1 hellgoat mini-boss (center) + 1 fireGoat + 1 goatKnight
  editor.setupArenaWaves(LEVEL_ID, berserkerArenaId, { x: 16, z: 57, w: 12, h: 2 }, [
    // Round 1: 3 fireGoats from edges
    [
      { type: ENEMY_TYPES.FIRE_GOAT, x: 27, z: 62 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 16, z: 62 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 22, z: 57 },
    ],
    // Round 2: 2 goatKnights from N and S
    [
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 22, z: 57 },
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 22, z: 68 },
    ],
    // Round 3: mini-boss hellgoat (center) + 1 fireGoat + 1 goatKnight
    [
      { type: ENEMY_TYPES.HELLGOAT, x: 22, z: 62 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 16, z: 58 },
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 27, z: 67 },
    ],
  ]);

  // --- Gauntlet: 3 hellgoat (spawn behind) + 2 fireGoat (spawn ahead) ---
  //   Room bounds: (21, 74, 6, 20) -> interior: x=[22..25], z=[75..92]
  //   These are ambush spawns triggered by position

  // Gauntlet ambush 1: hellgoat spawns behind at Z+4
  editor.ambush(
    LEVEL_ID,
    { x: 22, z: 78, w: 4, h: 2 },
    [{ type: ENEMY_TYPES.HELLGOAT, x: 23, z: 76 }],
    { roomId: gauntletId },
  );

  // Gauntlet ambush 2: hellgoat spawns behind at Z+8
  editor.ambush(
    LEVEL_ID,
    { x: 22, z: 82, w: 4, h: 2 },
    [{ type: ENEMY_TYPES.HELLGOAT, x: 23, z: 78 }],
    { roomId: gauntletId },
  );

  // Gauntlet ambush 3: hellgoat spawns behind at Z+14
  editor.ambush(
    LEVEL_ID,
    { x: 22, z: 88, w: 4, h: 2 },
    [{ type: ENEMY_TYPES.HELLGOAT, x: 23, z: 84 }],
    { roomId: gauntletId },
  );

  // Gauntlet ahead spawn 1: fireGoat
  editor.ambush(
    LEVEL_ID,
    { x: 22, z: 76, w: 4, h: 2 },
    [{ type: ENEMY_TYPES.FIRE_GOAT, x: 24, z: 80 }],
    { roomId: gauntletId },
  );

  // Gauntlet ahead spawn 2: fireGoat
  editor.ambush(
    LEVEL_ID,
    { x: 22, z: 86, w: 4, h: 2 },
    [{ type: ENEMY_TYPES.FIRE_GOAT, x: 24, z: 90 }],
    { roomId: gauntletId },
  );

  // --- Boss colosseum: Furia boss entity ---
  //   Room bounds: (16, 98, 16, 16) -> center: (24, 106)
  editor.spawnBoss(LEVEL_ID, 'boss-furia', 24, 106, {
    roomId: colosseumId,
    facing: 0,
    overrides: { hp: 300, phases: 3 },
  });

  // =========================================================================
  // 5b. ENTITIES: PICKUPS (from "Pickups" table)
  // =========================================================================

  // Gate of Dis: ammo (23, 5) center-east, health (21, 5) center-west
  //   Room bounds: (19, 2, 10, 6) -> interior: x=[20..27], z=[3..6]
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 23, 5);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 21, 5);

  // Blood Marsh: ammo (18, 14) island NW
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 18, 14);
  // Blood Marsh: ammo (29, 14) island NE
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 29, 14);
  // Blood Marsh: health (28, 22) island SE
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 28, 22);
  // Blood Marsh: ammo (19, 23) near south exit
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 19, 23);

  // Rage Pit: health (28, 34) tier 2
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 28, 34);
  // Rage Pit: ammo (24, 30) rim -- note: z=30 is at room boundary, use z=31
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 24, 31);

  // Arsenal: weapon (Goat's Bane) at (20, 51) -- note room depth: z max interior is 50
  //   Room bounds: (14, 46, 12, 6) -> interior: x=[15..24], z=[47..50]
  //   Adjust (20, 51) to (20, 50) to stay inside
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.WEAPON_LAUNCHER, 20, 50);
  // Arsenal: health (21, 51) -> adjusted to (21, 50)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 21, 50);
  // Arsenal: ammo (16, 48) near entrance
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 16, 48);

  // Berserker Arena (R1 clear): ammo (22, 62) center
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 22, 62);
  // Berserker Arena (R2 clear): health (22, 60) center-north
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 22, 60);
  // Berserker Arena (R2 clear): ammo (22, 68) center-south
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 22, 68);

  // Gauntlet (1/3 mark): health (23, 81), ammo (22, 80)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 23, 81);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 22, 80);
  // Gauntlet (2/3 mark): health (23, 87)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 23, 87);

  // Shrine of Fury: health x 2 at (4, 76), (6, 78)
  //   Room bounds: (2, 74, 6, 6) -> interior: x=[3..6], z=[75..78]
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 4, 76);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 6, 78);
  // Shrine of Fury: ammo x 2 at (3, 78), (7, 76)
  //   Adjust (7, 76) to (6, 76) to stay within interior
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 3, 78);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 6, 76);

  // Boss colosseum: ammo x 3 at (18, 100), (30, 100), (24, 112)
  //   Room bounds: (16, 98, 16, 16) -> interior: x=[17..30], z=[99..112]
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 18, 100);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 30, 100);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 24, 112);
  // Boss colosseum: health x 2 at (18, 112), (30, 112)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 18, 112);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 30, 112);

  // =========================================================================
  // 5c. ENTITIES: PROPS (from "Props" table)
  // =========================================================================

  // --- Gate of Dis (bounds: 19, 2, 10, 6) ---
  // 2x Anvil (flanking entrance, floor)
  editor.spawnProp(LEVEL_ID, 'Anvil', 20, 3, { roomId: gateOfDisId });
  editor.spawnProp(LEVEL_ID, 'Anvil', 27, 3, { roomId: gateOfDisId });
  // 3x Torch_Metal (walls, surfaceAnchor: N/E/W)
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 24, 3, {
    roomId: gateOfDisId,
    surfaceAnchor: {
      face: 'north',
      offsetX: 0,
      offsetY: 1.8,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 20, 5, {
    roomId: gateOfDisId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.8,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 27, 5, {
    roomId: gateOfDisId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.8,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 4x Chain_Coil (hanging from ceiling)
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 21, 4, { roomId: gateOfDisId });
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 26, 4, { roomId: gateOfDisId });
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 21, 6, { roomId: gateOfDisId });
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 26, 6, { roomId: gateOfDisId });
  // 1x Banner_1 (above door)
  editor.spawnProp(LEVEL_ID, 'Banner_1', 24, 3, {
    roomId: gateOfDisId,
    surfaceAnchor: {
      face: 'north',
      offsetX: 0,
      offsetY: 2.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });

  // --- Blood Marsh (bounds: 16, 12, 16, 14) ---
  // 3x Torch_Metal (on islands, floor-standing)
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 19, 14, { roomId: bloodMarshId });
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 24, 20, { roomId: bloodMarshId });
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 27, 24, { roomId: bloodMarshId });
  // 2x Cauldron (on central islands)
  editor.spawnProp(LEVEL_ID, 'Cauldron', 23, 19, { roomId: bloodMarshId });
  editor.spawnProp(LEVEL_ID, 'Cauldron', 20, 23, { roomId: bloodMarshId });
  // 3x Cage_Small (on islands)
  editor.spawnProp(LEVEL_ID, 'Cage_Small', 25, 15, { roomId: bloodMarshId });
  editor.spawnProp(LEVEL_ID, 'Cage_Small', 19, 24, { roomId: bloodMarshId });
  editor.spawnProp(LEVEL_ID, 'Cage_Small', 27, 23, { roomId: bloodMarshId });
  // 6x Chain_Coil (hanging from ceiling)
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 18, 14, { roomId: bloodMarshId });
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 24, 14, { roomId: bloodMarshId });
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 30, 14, { roomId: bloodMarshId });
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 18, 22, { roomId: bloodMarshId });
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 24, 22, { roomId: bloodMarshId });
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 30, 22, { roomId: bloodMarshId });

  // --- Rage Pit (bounds: 22, 30, 12, 12) ---
  // 2x Torch_Metal (walls at rim)
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 23, 31, {
    roomId: ragePitId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 32, 31, {
    roomId: ragePitId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 3x Cage_Small (on tier edges)
  editor.spawnProp(LEVEL_ID, 'Cage_Small', 25, 33, { roomId: ragePitId });
  editor.spawnProp(LEVEL_ID, 'Cage_Small', 31, 37, { roomId: ragePitId });
  editor.spawnProp(LEVEL_ID, 'Cage_Small', 27, 40, { roomId: ragePitId });
  // 4x Chain_Coil (hanging from ceiling center)
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 26, 34, { roomId: ragePitId });
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 30, 34, { roomId: ragePitId });
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 26, 38, { roomId: ragePitId });
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 30, 38, { roomId: ragePitId });

  // --- Arsenal (bounds: 14, 46, 12, 6) ---
  // 6x WeaponStand (walls, 3 per side)
  editor.spawnProp(LEVEL_ID, 'WeaponStand', 15, 47, {
    roomId: arsenalId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 0.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'WeaponStand', 15, 49, {
    roomId: arsenalId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 0.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'WeaponStand', 15, 50, {
    roomId: arsenalId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 0.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'WeaponStand', 24, 47, {
    roomId: arsenalId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 0.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'WeaponStand', 24, 49, {
    roomId: arsenalId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 0.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'WeaponStand', 24, 50, {
    roomId: arsenalId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 0.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 4x Shield_Wooden (walls, between stands)
  editor.spawnProp(LEVEL_ID, 'Shield_Wooden', 15, 48, {
    roomId: arsenalId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Shield_Wooden', 24, 48, {
    roomId: arsenalId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Shield_Wooden', 15, 50, {
    roomId: arsenalId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Shield_Wooden', 24, 50, {
    roomId: arsenalId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 4x Sword_Bronze (walls, crossed pairs)
  editor.spawnProp(LEVEL_ID, 'Sword_Bronze', 15, 47, {
    roomId: arsenalId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.4,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Sword_Bronze', 24, 47, {
    roomId: arsenalId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.4,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Sword_Bronze', 15, 49, {
    roomId: arsenalId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.4,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Sword_Bronze', 24, 49, {
    roomId: arsenalId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.4,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 2x Torch_Metal (walls near entrance)
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 16, 47, {
    roomId: arsenalId,
    surfaceAnchor: {
      face: 'north',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 23, 47, {
    roomId: arsenalId,
    surfaceAnchor: {
      face: 'north',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });

  // --- Berserker Arena (bounds: 15, 56, 14, 14) ---
  // 8x Barrel (destructible, explosive, ring around center)
  editor.spawnProp(LEVEL_ID, 'Barrel', 17, 58, { roomId: berserkerArenaId });
  editor.spawnProp(LEVEL_ID, 'Barrel', 26, 58, { roomId: berserkerArenaId });
  editor.spawnProp(LEVEL_ID, 'Barrel', 17, 62, { roomId: berserkerArenaId });
  editor.spawnProp(LEVEL_ID, 'Barrel', 26, 62, { roomId: berserkerArenaId });
  editor.spawnProp(LEVEL_ID, 'Barrel', 17, 66, { roomId: berserkerArenaId });
  editor.spawnProp(LEVEL_ID, 'Barrel', 26, 66, { roomId: berserkerArenaId });
  editor.spawnProp(LEVEL_ID, 'Barrel', 20, 58, { roomId: berserkerArenaId });
  editor.spawnProp(LEVEL_ID, 'Barrel', 23, 66, { roomId: berserkerArenaId });
  // 4x Torch_Metal (walls, N/S/E/W)
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 22, 57, {
    roomId: berserkerArenaId,
    surfaceAnchor: {
      face: 'north',
      offsetX: 0,
      offsetY: 1.8,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 22, 68, {
    roomId: berserkerArenaId,
    surfaceAnchor: {
      face: 'south',
      offsetX: 0,
      offsetY: 1.8,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 16, 62, {
    roomId: berserkerArenaId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.8,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 27, 62, {
    roomId: berserkerArenaId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.8,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 6x Chain_Coil (hanging from ceiling)
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 18, 59, { roomId: berserkerArenaId });
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 25, 59, { roomId: berserkerArenaId });
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 18, 64, { roomId: berserkerArenaId });
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 25, 64, { roomId: berserkerArenaId });
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 18, 67, { roomId: berserkerArenaId });
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 25, 67, { roomId: berserkerArenaId });
  // 2x Lantern_Wall (overhead caged light, E/W walls)
  editor.spawnProp(LEVEL_ID, 'Lantern_Wall', 16, 60, {
    roomId: berserkerArenaId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Lantern_Wall', 27, 60, {
    roomId: berserkerArenaId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });

  // --- Shrine of Fury (bounds: 2, 74, 6, 6) ---
  // 2x Torch_Metal (walls, E/W)
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 3, 76, {
    roomId: shrineOfFuryId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 6, 76, {
    roomId: shrineOfFuryId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 1x Scroll_2 (wall pedestal)
  editor.spawnProp(LEVEL_ID, 'Scroll_2', 5, 75, { roomId: shrineOfFuryId });
  // 1x Bench (center)
  editor.spawnProp(LEVEL_ID, 'Bench', 4, 77, { roomId: shrineOfFuryId });
  // 1x Bucket_Metal (floor corner)
  editor.spawnProp(LEVEL_ID, 'Bucket_Metal', 3, 78, { roomId: shrineOfFuryId });

  // --- Gauntlet (bounds: 21, 74, 6, 20) ---
  // 4x Torch_Metal (walls at intervals, E/W alternating)
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 22, 76, {
    roomId: gauntletId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 25, 81, {
    roomId: gauntletId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 22, 86, {
    roomId: gauntletId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 25, 91, {
    roomId: gauntletId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 3x Banner_1 (walls, tattered war banners)
  editor.spawnProp(LEVEL_ID, 'Banner_1', 22, 79, {
    roomId: gauntletId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Banner_1', 25, 84, {
    roomId: gauntletId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Banner_1', 22, 89, {
    roomId: gauntletId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 4x Chain_Coil (hanging from ceiling at intervals)
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 23, 77, { roomId: gauntletId });
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 23, 82, { roomId: gauntletId });
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 23, 87, { roomId: gauntletId });
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 23, 92, { roomId: gauntletId });

  // --- Boss colosseum (bounds: 16, 98, 16, 16) ---
  // 8x Torch_Metal (perimeter ring, floor-standing on sand)
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 17, 99, { roomId: colosseumId });
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 30, 99, { roomId: colosseumId });
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 17, 104, { roomId: colosseumId });
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 30, 104, { roomId: colosseumId });
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 17, 109, { roomId: colosseumId });
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 30, 109, { roomId: colosseumId });
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 17, 112, { roomId: colosseumId });
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 30, 112, { roomId: colosseumId });
  // 8x Chain_Coil (hanging from ceiling in ring)
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 19, 100, { roomId: colosseumId });
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 28, 100, { roomId: colosseumId });
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 19, 105, { roomId: colosseumId });
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 28, 105, { roomId: colosseumId });
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 19, 110, { roomId: colosseumId });
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 28, 110, { roomId: colosseumId });
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 24, 100, { roomId: colosseumId });
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 24, 110, { roomId: colosseumId });
  // 2x Banner_1 (entrance flanking)
  editor.spawnProp(LEVEL_ID, 'Banner_1', 20, 99, {
    roomId: colosseumId,
    surfaceAnchor: {
      face: 'north',
      offsetX: 0,
      offsetY: 2.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'Banner_1', 27, 99, {
    roomId: colosseumId,
    surfaceAnchor: {
      face: 'north',
      offsetX: 0,
      offsetY: 2.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 4x Anvil (perimeter at cardinal points)
  editor.spawnProp(LEVEL_ID, 'Anvil', 24, 99, { roomId: colosseumId });
  editor.spawnProp(LEVEL_ID, 'Anvil', 24, 112, { roomId: colosseumId });
  editor.spawnProp(LEVEL_ID, 'Anvil', 17, 106, { roomId: colosseumId });
  editor.spawnProp(LEVEL_ID, 'Anvil', 30, 106, { roomId: colosseumId });

  // =========================================================================
  // 6. TRIGGERS (from "Triggers" table)
  // =========================================================================
  //
  // NOTE: T6-T10 (Berserker Arena lock/wave/unlock) were created by setupArenaWaves() above.
  // NOTE: Gauntlet ambushes (T12-T16) were created by ambush() calls above.
  //
  // Remaining triggers:

  // T1: Gate of Dis showHint
  editor.dialogue(
    LEVEL_ID,
    { x: 20, z: 6, w: 8, h: 2 },
    'Beyond this gate, rage festers. Speed is survival.',
    { roomId: gateOfDisId },
  );

  // T2: Blood Marsh startEscalation
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 17,
    zoneZ: 13,
    zoneW: 14,
    zoneH: 12,
    roomId: bloodMarshId,
    once: true,
    actionData: { speedIncrease: 0.1, interval: 5, cap: 0.6, condition: 'firstCombat' },
  });

  // T3: Rage Pit startEscalation
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 23,
    zoneZ: 31,
    zoneW: 10,
    zoneH: 10,
    roomId: ragePitId,
    once: true,
    actionData: { speedIncrease: 0.1, interval: 5, cap: 0.6, condition: 'firstCombat' },
  });

  // T4: Arsenal startEscalation
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 15,
    zoneZ: 47,
    zoneW: 10,
    zoneH: 4,
    roomId: arsenalId,
    once: true,
    actionData: { speedIncrease: 0.1, interval: 5, cap: 0.6, condition: 'firstCombat' },
  });

  // T5: Arsenal Goat's Bane hint
  editor.dialogue(
    LEVEL_ID,
    { x: 19, z: 50, w: 3, h: 2 },
    "The Goat's Bane. For when one bullet is not enough.",
    { roomId: arsenalId },
  );

  // T11: Berserker barrel explosion triggers (8 barrels)
  // Using ambient change with custom data for barrel explosions
  const barrelPositions = [
    [17, 58],
    [26, 58],
    [17, 62],
    [26, 62],
    [17, 66],
    [26, 66],
    [20, 58],
    [23, 66],
  ];
  for (const [bx, bz] of barrelPositions) {
    editor.addTrigger(LEVEL_ID, {
      action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
      zoneX: bx,
      zoneZ: bz,
      zoneW: 1,
      zoneH: 1,
      roomId: berserkerArenaId,
      once: true,
      actionData: { condition: 'barrelDamage', radius: 2, damage: 15 },
    });
  }

  // T17: Boss intro -- player enters colosseum entrance
  editor.bossIntro(
    LEVEL_ID,
    { x: 17, z: 99, w: 14, h: 2 },
    'RAGE. RAGE UNTIL THERE IS NOTHING LEFT.',
    { roomId: colosseumId },
  );

  // T18: lockDoors on boss intro (with 3s delay)
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.LOCK_DOORS,
    zoneX: 17,
    zoneZ: 99,
    zoneW: 14,
    zoneH: 2,
    roomId: colosseumId,
    once: true,
    delay: 3,
  });

  // T19: bossPhase2 -- Boss HP < 60% (180 HP)
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 16,
    zoneZ: 98,
    zoneW: 16,
    zoneH: 16,
    roomId: colosseumId,
    once: true,
    actionData: { condition: 'bossHpBelow60', action: 'ripChains', whipRange: 4 },
  });

  // T20: bossPhase3 -- Boss HP < 25% (75 HP)
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 16,
    zoneZ: 98,
    zoneW: 16,
    zoneH: 16,
    roomId: colosseumId,
    once: true,
    actionData: {
      condition: 'bossHpBelow25',
      action: 'berserkerMode',
      wallCloseRate: 1,
      wallCloseInterval: 5,
      minSize: 4,
    },
  });

  // T21: ambientChange when boss HP < 25% (fog to pure red)
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 16,
    zoneZ: 98,
    zoneW: 16,
    zoneH: 16,
    roomId: colosseumId,
    once: true,
    actionData: { fogDensity: 0.06, fogColor: '#2a0000', condition: 'bossHpBelow25' },
  });

  // =========================================================================
  // 7. ENVIRONMENT ZONES (from "Environment Zones" table)
  // =========================================================================

  // Global rage: full level, red-orange tint, intensity 0.7
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.FIRE,
    boundsX: 0,
    boundsZ: 0,
    boundsW: 48,
    boundsH: 96,
    intensity: 0.7,
  });

  // Blood Marsh liquid: slow zone
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.WATER,
    boundsX: 17,
    boundsZ: 13,
    boundsW: 14,
    boundsH: 12,
    intensity: 0.6,
  });

  // Blood Marsh steam particles
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.FOG,
    boundsX: 17,
    boundsZ: 13,
    boundsW: 14,
    boundsH: 12,
    intensity: 0.3,
  });

  // Rage Pit downdraft: wind pulling downward
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.WIND,
    boundsX: 25,
    boundsZ: 33,
    boundsW: 6,
    boundsH: 6,
    intensity: 0.2,
    directionX: 0,
    directionZ: 1,
  });

  // Berserker Arena heat: extra red intensity
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.FIRE,
    boundsX: 15,
    boundsZ: 56,
    boundsW: 14,
    boundsH: 14,
    intensity: 0.8,
  });

  // Colosseum sand particles
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.WIND,
    boundsX: 16,
    boundsZ: 98,
    boundsW: 16,
    boundsH: 16,
    intensity: 0.4,
  });

  // =========================================================================
  // 8. PLAYER SPAWN (from "Player Spawn" section)
  // =========================================================================
  //   Position: (24, 5) -- center of Gate of Dis
  //   Facing: pi (south -- facing the sealed gate to Blood Marsh)

  editor.setPlayerSpawn(LEVEL_ID, 24, 5, Math.PI);

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
    throw new Error('Circle 5 (Wrath) level validation failed');
  }
  console.log('Circle 5 (Wrath) built successfully');
  if (result.warnings.length > 0) {
    console.log('Warnings:', result.warnings);
  }
}
