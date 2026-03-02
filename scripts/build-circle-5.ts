#!/usr/bin/env npx tsx
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
  // 5c. ENTITIES: PROPS (from 3D Spatial Design)
  // =========================================================================

  // --- Gate of Dis (bounds: 19, 2, 10, 6) ---
  // Structural: 1x wrath-jagged-arch (gate), 1x wrath-dented-iron-door (exit)
  editor.spawnProp(LEVEL_ID, 'wrath-jagged-arch', 24, 2, { roomId: gateOfDisId });
  editor.spawnProp(LEVEL_ID, 'wrath-dented-iron-door', 24, 7, { roomId: gateOfDisId });
  // 2x wrath-anvil (flanking entrance)
  editor.spawnProp(LEVEL_ID, 'wrath-anvil', 20, 3, { roomId: gateOfDisId });
  editor.spawnProp(LEVEL_ID, 'wrath-anvil', 28, 3, { roomId: gateOfDisId });
  // 4x wrath-chain-curtain (hanging from ceiling)
  editor.spawnProp(LEVEL_ID, 'wrath-chain-curtain', 22, 3, { roomId: gateOfDisId });
  editor.spawnProp(LEVEL_ID, 'wrath-chain-curtain', 26, 3, { roomId: gateOfDisId });
  editor.spawnProp(LEVEL_ID, 'wrath-chain-curtain', 22, 6, { roomId: gateOfDisId });
  editor.spawnProp(LEVEL_ID, 'wrath-chain-curtain', 26, 6, { roomId: gateOfDisId });
  // 1x wrath-war-banner (above gate)
  editor.spawnProp(LEVEL_ID, 'wrath-war-banner', 24, 2, { roomId: gateOfDisId });
  // 1x wrath-anger-graffiti-slab (west wall)
  editor.spawnProp(LEVEL_ID, 'wrath-anger-graffiti-slab', 20, 6, { roomId: gateOfDisId });

  // --- Blood Marsh (bounds: 16, 12, 16, 14) ---
  // Structural: 5x wrath-stone-island
  editor.spawnProp(LEVEL_ID, 'wrath-stone-island', 18, 14, { roomId: bloodMarshId });
  editor.spawnProp(LEVEL_ID, 'wrath-stone-island', 24, 14, { roomId: bloodMarshId });
  editor.spawnProp(LEVEL_ID, 'wrath-stone-island', 22, 19, { roomId: bloodMarshId });
  editor.spawnProp(LEVEL_ID, 'wrath-stone-island', 18, 23, { roomId: bloodMarshId });
  editor.spawnProp(LEVEL_ID, 'wrath-stone-island', 26, 23, { roomId: bloodMarshId });
  // 3x wrath-rusted-cage (on islands)
  editor.spawnProp(LEVEL_ID, 'wrath-rusted-cage', 19, 15, { roomId: bloodMarshId });
  editor.spawnProp(LEVEL_ID, 'wrath-rusted-cage', 24, 20, { roomId: bloodMarshId });
  editor.spawnProp(LEVEL_ID, 'wrath-rusted-cage', 27, 24, { roomId: bloodMarshId });
  // 2x wrath-rage-furnace (on islands)
  editor.spawnProp(LEVEL_ID, 'wrath-rage-furnace', 23, 19, { roomId: bloodMarshId });
  editor.spawnProp(LEVEL_ID, 'wrath-rage-furnace', 19, 15, { roomId: bloodMarshId });
  // 6x wrath-chain-curtain (hanging from ceiling)
  editor.spawnProp(LEVEL_ID, 'wrath-chain-curtain', 20, 15, { roomId: bloodMarshId });
  editor.spawnProp(LEVEL_ID, 'wrath-chain-curtain', 25, 15, { roomId: bloodMarshId });
  editor.spawnProp(LEVEL_ID, 'wrath-chain-curtain', 22, 18, { roomId: bloodMarshId });
  editor.spawnProp(LEVEL_ID, 'wrath-chain-curtain', 20, 22, { roomId: bloodMarshId });
  editor.spawnProp(LEVEL_ID, 'wrath-chain-curtain', 26, 22, { roomId: bloodMarshId });
  editor.spawnProp(LEVEL_ID, 'wrath-chain-curtain', 23, 21, { roomId: bloodMarshId });
  // 2x wrath-blood-spattered-slab (walls)
  editor.spawnProp(LEVEL_ID, 'wrath-blood-spattered-slab', 17, 18, { roomId: bloodMarshId });
  editor.spawnProp(LEVEL_ID, 'wrath-blood-spattered-slab', 31, 22, { roomId: bloodMarshId });
  // 2x wrath-corroded-pipe-pillar
  editor.spawnProp(LEVEL_ID, 'wrath-corroded-pipe-pillar', 20, 19, { roomId: bloodMarshId });
  editor.spawnProp(LEVEL_ID, 'wrath-corroded-pipe-pillar', 17, 14, { roomId: bloodMarshId });
  // 1x wrath-smashed-barrier
  editor.spawnProp(LEVEL_ID, 'wrath-smashed-barrier', 26, 15, { roomId: bloodMarshId });
  // 1x wrath-iron-grate (on ISL3 center floor)
  editor.spawnProp(LEVEL_ID, 'wrath-iron-grate', 22, 20, { roomId: bloodMarshId });

  // --- Rage Pit (bounds: 22, 30, 12, 12) ---
  // Structural: 4x wrath-pit-tier-ring
  editor.spawnProp(LEVEL_ID, 'wrath-pit-tier-ring', 23, 31, { roomId: ragePitId });
  editor.spawnProp(LEVEL_ID, 'wrath-pit-tier-ring', 24, 32, { roomId: ragePitId });
  editor.spawnProp(LEVEL_ID, 'wrath-pit-tier-ring', 25, 33, { roomId: ragePitId });
  editor.spawnProp(LEVEL_ID, 'wrath-pit-tier-ring', 26, 34, { roomId: ragePitId });
  // 3x wrath-rusted-cage (tier edges)
  editor.spawnProp(LEVEL_ID, 'wrath-rusted-cage', 23, 31, { roomId: ragePitId });
  editor.spawnProp(LEVEL_ID, 'wrath-rusted-cage', 33, 31, { roomId: ragePitId });
  editor.spawnProp(LEVEL_ID, 'wrath-rusted-cage', 28, 38, { roomId: ragePitId });
  // 4x wrath-chain-curtain (hanging from ceiling center)
  editor.spawnProp(LEVEL_ID, 'wrath-chain-curtain', 27, 35, { roomId: ragePitId });
  editor.spawnProp(LEVEL_ID, 'wrath-chain-curtain', 29, 35, { roomId: ragePitId });
  editor.spawnProp(LEVEL_ID, 'wrath-chain-curtain', 27, 37, { roomId: ragePitId });
  editor.spawnProp(LEVEL_ID, 'wrath-chain-curtain', 29, 37, { roomId: ragePitId });
  // 2x wrath-smashed-barrier (tier debris)
  editor.spawnProp(LEVEL_ID, 'wrath-smashed-barrier', 24, 36, { roomId: ragePitId });
  editor.spawnProp(LEVEL_ID, 'wrath-smashed-barrier', 30, 34, { roomId: ragePitId });
  // 1x wrath-blood-spattered-slab
  editor.spawnProp(LEVEL_ID, 'wrath-blood-spattered-slab', 25, 39, { roomId: ragePitId });
  // 2x wrath-corroded-pipe-pillar (rim)
  editor.spawnProp(LEVEL_ID, 'wrath-corroded-pipe-pillar', 23, 31, { roomId: ragePitId });
  editor.spawnProp(LEVEL_ID, 'wrath-corroded-pipe-pillar', 33, 41, { roomId: ragePitId });
  // 1x wrath-iron-grate (pit center)
  editor.spawnProp(LEVEL_ID, 'wrath-iron-grate', 27, 37, { roomId: ragePitId });
  // 1x wrath-punching-bag-chain
  editor.spawnProp(LEVEL_ID, 'wrath-punching-bag-chain', 28, 36, { roomId: ragePitId });

  // --- Arsenal (bounds: 14, 46, 12, 6) ---
  // Structural: 1x wrath-jagged-arch (entry), 1x wrath-weapon-pedestal (Goat's Bane)
  editor.spawnProp(LEVEL_ID, 'wrath-jagged-arch', 20, 46, { roomId: arsenalId });
  editor.spawnProp(LEVEL_ID, 'wrath-weapon-pedestal', 20, 50, { roomId: arsenalId });
  // 4x wrath-shattered-weapon-rack (walls)
  editor.spawnProp(LEVEL_ID, 'wrath-shattered-weapon-rack', 15, 48, { roomId: arsenalId });
  editor.spawnProp(LEVEL_ID, 'wrath-shattered-weapon-rack', 25, 48, { roomId: arsenalId });
  editor.spawnProp(LEVEL_ID, 'wrath-shattered-weapon-rack', 15, 50, { roomId: arsenalId });
  editor.spawnProp(LEVEL_ID, 'wrath-shattered-weapon-rack', 25, 50, { roomId: arsenalId });
  // 1x wrath-smashed-barrier (floor debris)
  editor.spawnProp(LEVEL_ID, 'wrath-smashed-barrier', 16, 49, { roomId: arsenalId });
  // 1x wrath-anger-graffiti-slab (west wall near entry)
  editor.spawnProp(LEVEL_ID, 'wrath-anger-graffiti-slab', 15, 47, { roomId: arsenalId });
  // 1x wrath-blood-spattered-slab (east wall near entry)
  editor.spawnProp(LEVEL_ID, 'wrath-blood-spattered-slab', 25, 47, { roomId: arsenalId });

  // --- Berserker Arena (bounds: 15, 56, 14, 14) ---
  // Structural: 1x wrath-jagged-arch (entry), 1x wrath-dented-iron-door (exit)
  editor.spawnProp(LEVEL_ID, 'wrath-jagged-arch', 22, 56, { roomId: berserkerArenaId });
  editor.spawnProp(LEVEL_ID, 'wrath-dented-iron-door', 16, 69, { roomId: berserkerArenaId });
  // 8x wrath-explosive-barrel (ring around center)
  editor.spawnProp(LEVEL_ID, 'wrath-explosive-barrel', 17, 58, { roomId: berserkerArenaId });
  editor.spawnProp(LEVEL_ID, 'wrath-explosive-barrel', 27, 58, { roomId: berserkerArenaId });
  editor.spawnProp(LEVEL_ID, 'wrath-explosive-barrel', 17, 62, { roomId: berserkerArenaId });
  editor.spawnProp(LEVEL_ID, 'wrath-explosive-barrel', 27, 62, { roomId: berserkerArenaId });
  editor.spawnProp(LEVEL_ID, 'wrath-explosive-barrel', 17, 66, { roomId: berserkerArenaId });
  editor.spawnProp(LEVEL_ID, 'wrath-explosive-barrel', 27, 66, { roomId: berserkerArenaId });
  editor.spawnProp(LEVEL_ID, 'wrath-explosive-barrel', 20, 58, { roomId: berserkerArenaId });
  editor.spawnProp(LEVEL_ID, 'wrath-explosive-barrel', 24, 66, { roomId: berserkerArenaId });
  // 6x wrath-chain-curtain (hanging from ceiling)
  editor.spawnProp(LEVEL_ID, 'wrath-chain-curtain', 19, 59, { roomId: berserkerArenaId });
  editor.spawnProp(LEVEL_ID, 'wrath-chain-curtain', 25, 59, { roomId: berserkerArenaId });
  editor.spawnProp(LEVEL_ID, 'wrath-chain-curtain', 19, 65, { roomId: berserkerArenaId });
  editor.spawnProp(LEVEL_ID, 'wrath-chain-curtain', 25, 65, { roomId: berserkerArenaId });
  editor.spawnProp(LEVEL_ID, 'wrath-chain-curtain', 22, 59, { roomId: berserkerArenaId });
  editor.spawnProp(LEVEL_ID, 'wrath-chain-curtain', 22, 65, { roomId: berserkerArenaId });
  // 2x wrath-caged-lantern (overhead, E/W walls)
  editor.spawnProp(LEVEL_ID, 'wrath-caged-lantern', 15, 60, { roomId: berserkerArenaId });
  editor.spawnProp(LEVEL_ID, 'wrath-caged-lantern', 29, 60, { roomId: berserkerArenaId });

  // --- Shrine of Fury (bounds: 2, 74, 6, 6) ---
  // 1x wrath-smashed-barrier (west corner, minimal)
  editor.spawnProp(LEVEL_ID, 'wrath-smashed-barrier', 3, 75, { roomId: shrineOfFuryId });
  // 1x wrath-iron-grate (floor center)
  editor.spawnProp(LEVEL_ID, 'wrath-iron-grate', 5, 77, { roomId: shrineOfFuryId });
  // 1x wrath-caged-lantern (ceiling center)
  editor.spawnProp(LEVEL_ID, 'wrath-caged-lantern', 5, 76, { roomId: shrineOfFuryId });

  // --- Gauntlet (bounds: 21, 74, 6, 20) ---
  // Structural: 2x wrath-jagged-arch (entry/exit)
  editor.spawnProp(LEVEL_ID, 'wrath-jagged-arch', 23, 74, { roomId: gauntletId });
  editor.spawnProp(LEVEL_ID, 'wrath-jagged-arch', 23, 93, { roomId: gauntletId });
  // 6x wrath-chain-curtain (ceiling intervals)
  editor.spawnProp(LEVEL_ID, 'wrath-chain-curtain', 22, 76, { roomId: gauntletId });
  editor.spawnProp(LEVEL_ID, 'wrath-chain-curtain', 22, 82, { roomId: gauntletId });
  editor.spawnProp(LEVEL_ID, 'wrath-chain-curtain', 22, 88, { roomId: gauntletId });
  editor.spawnProp(LEVEL_ID, 'wrath-chain-curtain', 22, 92, { roomId: gauntletId });
  editor.spawnProp(LEVEL_ID, 'wrath-chain-curtain', 24, 80, { roomId: gauntletId });
  editor.spawnProp(LEVEL_ID, 'wrath-chain-curtain', 24, 86, { roomId: gauntletId });
  // 3x wrath-war-banner (walls, tattered)
  editor.spawnProp(LEVEL_ID, 'wrath-war-banner', 21, 78, { roomId: gauntletId });
  editor.spawnProp(LEVEL_ID, 'wrath-war-banner', 25, 84, { roomId: gauntletId });
  editor.spawnProp(LEVEL_ID, 'wrath-war-banner', 21, 90, { roomId: gauntletId });
  // 2x wrath-smashed-barrier (ramp tops)
  editor.spawnProp(LEVEL_ID, 'wrath-smashed-barrier', 23, 79, { roomId: gauntletId });
  editor.spawnProp(LEVEL_ID, 'wrath-smashed-barrier', 23, 85, { roomId: gauntletId });
  // 2x wrath-blood-spattered-slab (walls near ramps)
  editor.spawnProp(LEVEL_ID, 'wrath-blood-spattered-slab', 22, 80, { roomId: gauntletId });
  editor.spawnProp(LEVEL_ID, 'wrath-blood-spattered-slab', 24, 88, { roomId: gauntletId });

  // --- Boss colosseum (bounds: 16, 98, 16, 16) ---
  // Structural: 1x wrath-jagged-arch (entrance)
  editor.spawnProp(LEVEL_ID, 'wrath-jagged-arch', 24, 98, { roomId: colosseumId });
  // 4x wrath-anvil (cardinal points)
  editor.spawnProp(LEVEL_ID, 'wrath-anvil', 16, 106, { roomId: colosseumId });
  editor.spawnProp(LEVEL_ID, 'wrath-anvil', 32, 106, { roomId: colosseumId });
  editor.spawnProp(LEVEL_ID, 'wrath-anvil', 24, 98, { roomId: colosseumId });
  editor.spawnProp(LEVEL_ID, 'wrath-anvil', 24, 113, { roomId: colosseumId });
  // 8x wrath-chain-curtain (ceiling ring)
  editor.spawnProp(LEVEL_ID, 'wrath-chain-curtain', 20, 101, { roomId: colosseumId });
  editor.spawnProp(LEVEL_ID, 'wrath-chain-curtain', 28, 101, { roomId: colosseumId });
  editor.spawnProp(LEVEL_ID, 'wrath-chain-curtain', 18, 106, { roomId: colosseumId });
  editor.spawnProp(LEVEL_ID, 'wrath-chain-curtain', 30, 106, { roomId: colosseumId });
  editor.spawnProp(LEVEL_ID, 'wrath-chain-curtain', 20, 111, { roomId: colosseumId });
  editor.spawnProp(LEVEL_ID, 'wrath-chain-curtain', 28, 111, { roomId: colosseumId });
  editor.spawnProp(LEVEL_ID, 'wrath-chain-curtain', 24, 101, { roomId: colosseumId });
  editor.spawnProp(LEVEL_ID, 'wrath-chain-curtain', 24, 111, { roomId: colosseumId });
  // 2x wrath-war-banner (entrance flanking)
  editor.spawnProp(LEVEL_ID, 'wrath-war-banner', 22, 98, { roomId: colosseumId });
  editor.spawnProp(LEVEL_ID, 'wrath-war-banner', 26, 98, { roomId: colosseumId });
  // 2x wrath-blood-spattered-slab (sand floor)
  editor.spawnProp(LEVEL_ID, 'wrath-blood-spattered-slab', 20, 104, { roomId: colosseumId });
  editor.spawnProp(LEVEL_ID, 'wrath-blood-spattered-slab', 28, 108, { roomId: colosseumId });
  // 2x wrath-smashed-barrier (sand floor)
  editor.spawnProp(LEVEL_ID, 'wrath-smashed-barrier', 19, 110, { roomId: colosseumId });
  editor.spawnProp(LEVEL_ID, 'wrath-smashed-barrier', 29, 102, { roomId: colosseumId });
  // 1x wrath-iron-grate (center floor)
  editor.spawnProp(LEVEL_ID, 'wrath-iron-grate', 24, 106, { roomId: colosseumId });

  // =========================================================================
  // 5d. DECALS (from design doc Scratches007, Rust001, Leaking001 mappings)
  // =========================================================================

  // --- Gate of Dis: rage claw marks on walls ---
  editor.placeDecals(LEVEL_ID, gateOfDisId, [
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 19, z: 4, surface: 'wall' },
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 29, z: 4, surface: 'wall' },
  ]);

  // --- Blood Marsh: blood stains + rust on corroded pipes ---
  editor.placeDecals(LEVEL_ID, bloodMarshId, [
    { type: DECAL_TYPES.BLOOD_STAIN, x: 20, z: 18 },
    { type: DECAL_TYPES.BLOOD_STAIN, x: 28, z: 20 },
    { type: DECAL_TYPES.RUST_PATCH, x: 20, z: 19 },
    { type: DECAL_TYPES.RUST_PATCH, x: 17, z: 14 },
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 16, z: 18, surface: 'wall' },
  ]);

  // --- Rage Pit: claw marks everywhere + blood stains near combat ---
  editor.placeDecals(LEVEL_ID, ragePitId, [
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 22, z: 34, surface: 'wall' },
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 34, z: 34, surface: 'wall' },
    { type: DECAL_TYPES.BLOOD_STAIN, x: 26, z: 35 },
    { type: DECAL_TYPES.BLOOD_STAIN, x: 30, z: 35 },
  ]);

  // --- Arsenal: rust on weapon racks + claw marks ---
  editor.placeDecals(LEVEL_ID, arsenalId, [
    { type: DECAL_TYPES.RUST_PATCH, x: 15, z: 48 },
    { type: DECAL_TYPES.RUST_PATCH, x: 25, z: 48 },
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 14, z: 49, surface: 'wall' },
  ]);

  // --- Berserker Arena: heavy damage everywhere ---
  editor.placeDecals(LEVEL_ID, berserkerArenaId, [
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 15, z: 60, surface: 'wall' },
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 29, z: 60, surface: 'wall' },
    { type: DECAL_TYPES.BLOOD_STAIN, x: 22, z: 62 },
    { type: DECAL_TYPES.BLOOD_STAIN, x: 19, z: 65 },
    { type: DECAL_TYPES.RUST_PATCH, x: 17, z: 58 },
  ]);

  // --- Boss Colosseum: blood-soaked sand + claw marks ---
  editor.placeDecals(LEVEL_ID, colosseumId, [
    { type: DECAL_TYPES.BLOOD_STAIN, x: 20, z: 104 },
    { type: DECAL_TYPES.BLOOD_STAIN, x: 28, z: 108 },
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 16, z: 106, surface: 'wall' },
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 32, z: 106, surface: 'wall' },
    { type: DECAL_TYPES.RUST_PATCH, x: 24, z: 106 },
  ]);

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
