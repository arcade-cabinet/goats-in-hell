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
    texturePalette: {
      exploration: 'concrete',
      arena: 'metal',
      boss: 'metal-dark',
      secret: 'concrete',
    },
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
    floorTexture: 'concrete',
    wallTexture: 'metal',
  });

  const bloodMarshId = editor.room(LEVEL_ID, 'blood_marsh', 16, 12, 16, 14, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 1,
    floorTexture: 'concrete',
    wallTexture: 'concrete',
    fillRule: {
      type: 'scatter',
      props: ['wrath-explosive-barrel', 'wrath-smashed-barrier', 'wrath-anger-graffiti-slab'],
      density: 0.1,
    },
  });

  const ragePitId = editor.room(LEVEL_ID, 'rage_pit', 22, 30, 12, 12, {
    roomType: ROOM_TYPES.PLATFORMING,
    elevation: -2,
    sortOrder: 2,
    floorTexture: 'lava',
    wallTexture: 'concrete',
    fillRule: { type: 'scatter', props: ['lava-altar', 'wrath-stone-island'], density: 0.06 },
  });

  const arsenalId = editor.room(LEVEL_ID, 'arsenal', 14, 46, 12, 6, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 3,
    floorTexture: 'metal',
    wallTexture: 'concrete',
    fillRule: {
      type: 'scatter',
      props: ['wrath-shattered-weapon-rack', 'wrath-war-banner', 'wrath-weapon-pedestal'],
      density: 0.08,
    },
  });

  const berserkerArenaId = editor.room(LEVEL_ID, 'berserker_arena', 15, 56, 14, 14, {
    roomType: ROOM_TYPES.ARENA,
    elevation: 0,
    sortOrder: 4,
    floorTexture: 'concrete',
    wallTexture: 'metal',
    fillRule: {
      type: 'scatter',
      props: ['wrath-rusted-cage', 'wrath-punching-bag-chain', 'wrath-chain-curtain'],
      density: 0.1,
    },
  });

  const shrineOfFuryId = editor.room(LEVEL_ID, 'shrine_of_fury', 2, 74, 6, 6, {
    roomType: ROOM_TYPES.SECRET,
    elevation: 0,
    sortOrder: 5,
    floorTexture: 'concrete',
  });

  const gauntletId = editor.room(LEVEL_ID, 'gauntlet', 21, 74, 6, 20, {
    roomType: ROOM_TYPES.CORRIDOR,
    elevation: 0,
    sortOrder: 6,
    floorTexture: 'metal',
    wallTexture: 'metal',
    fillRule: {
      type: 'scatter',
      props: ['wrath-anvil', 'wrath-rage-furnace', 'wrath-dented-iron-door'],
      density: 0.1,
    },
  });

  const colosseumId = editor.room(LEVEL_ID, 'furias_colosseum', 16, 98, 16, 16, {
    roomType: ROOM_TYPES.BOSS,
    elevation: 0,
    sortOrder: 7,
    floorTexture: 'metal-dark',
    wallTexture: 'metal-dark',
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

  // Arsenal -> Berserker Arena (corridor, width 2)
  // Width 2 avoids a dead-end pocket at x=24 in Arsenal's south wall/corridor gap
  editor.corridor(LEVEL_ID, arsenalId, berserkerArenaId, 2);

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

  // --- Blood Marsh: enemies converted to ambush-only to fix A* nav dead ends.
  //   The WATER slow zone + dense solid props makes static enemy positions
  //   unreliable for the headless playtest bot. Use ambush triggers instead.
  editor.ambush(
    LEVEL_ID,
    { x: 17, z: 13, w: 14, h: 4 },
    [
      { type: ENEMY_TYPES.FIRE_GOAT, x: 21, z: 16 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 29, z: 16 },
      { type: ENEMY_TYPES.HELLGOAT, x: 25, z: 21 },
    ],
    { roomId: bloodMarshId },
  );
  editor.ambush(
    LEVEL_ID,
    { x: 17, z: 18, w: 14, h: 4 },
    [
      { type: ENEMY_TYPES.FIRE_GOAT, x: 28, z: 23 },
      { type: ENEMY_TYPES.HELLGOAT, x: 22, z: 23 },
    ],
    { roomId: bloodMarshId },
  );

  // --- Rage Pit: ambush-only enemies (prop-dense platforming room with multi-corridor mouths).
  //   The east corridor to Forge Pit + dense solid props create nav dead-ends for static enemies.
  //   Use ambush triggers so enemies only materialize when player is already inside the room.
  //   Room bounds: (22, 30, 12, 12) -> interior: x=[23..33], z=[31..41]
  //   Safe spawn positions: avoid props and all corridor mouth areas (north ~z=30, south ~z=42, east ~x=33)

  // Ambush 1: player walks south into pit center — hellgoats drop from rim
  editor.ambush(
    LEVEL_ID,
    { x: 23, z: 32, w: 8, h: 2 },
    [
      { type: ENEMY_TYPES.HELLGOAT, x: 32, z: 40 },
      { type: ENEMY_TYPES.HELLGOAT, x: 23, z: 38 },
    ],
    { roomId: ragePitId },
  );

  // Ambush 2: player crosses pit center — fire goats leap from south
  editor.ambush(
    LEVEL_ID,
    { x: 23, z: 36, w: 8, h: 2 },
    [
      { type: ENEMY_TYPES.FIRE_GOAT, x: 32, z: 32 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 23, z: 33 },
    ],
    { roomId: ragePitId },
  );

  // --- Arsenal: 1 goatKnight guards Goat's Bane + 1 fireGoat near entrance ---
  //   Room bounds: (14, 46, 12, 6) -> interior: x=[15..24], z=[47..50]
  // Arsenal: ambush-only enemies. Room is narrow (12x6) with many side-wall props
  // and 3 corridor connections (north: Blood Marsh, north: Rage Pit, south: Arena).
  // Static enemies in tight rooms with many props reliably dead-end the A* bot.
  // Trigger at entry; enemies spawn center-south near the pedestal.
  editor.ambush(
    LEVEL_ID,
    { x: 15, z: 47, w: 10, h: 2 },
    [
      { type: ENEMY_TYPES.FIRE_GOAT, x: 20, z: 50 },
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 23, z: 49 },
    ],
    { roomId: arsenalId },
  );

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

  // Arsenal: weapon (Goat's Bane) on pedestal at (17, 49), health + ammo near north entry
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.WEAPON_LAUNCHER, 17, 49);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 22, 48);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 19, 47);

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
  // Arsenal is narrow (12x6) with three corridors (two north, one south).
  // All props placed on the outermost wall cells only (z=47, x=15 or x=25) to keep
  // interior walkable. No props at z=49-51 or x=19-22 to preserve all corridor approaches.
  editor.spawnProp(LEVEL_ID, 'wrath-jagged-arch', 20, 46, { roomId: arsenalId });
  editor.spawnProp(LEVEL_ID, 'wrath-anger-graffiti-slab', 15, 47, { roomId: arsenalId });
  editor.spawnProp(LEVEL_ID, 'wrath-blood-spattered-slab', 25, 47, { roomId: arsenalId });

  // --- Berserker Arena (bounds: 15, 56, 14, 14) ---
  // Structural: 1x wrath-jagged-arch (entry), 1x wrath-dented-iron-door (exit)
  // Arch moved to (20,57) — one row inside the arena, off the corridor entry cells (22-24,56)
  editor.spawnProp(LEVEL_ID, 'wrath-jagged-arch', 20, 57, { roomId: berserkerArenaId });
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
  // EXPANSION — Additional rooms, enemies, triggers, and environment zones
  // added to bring play time from ~2 min to 10–15 min.
  //
  // New room map (all coords grid):
  //   Forge Pit          x=34, z=30, w=12, h=12  (right of Rage Pit)
  //   Punishment Corridor x=34, z=46, w=10, h=10  (right of Arsenal)
  //   War Hall           x=33, z=56, w=12, h=14  (right of Berserker Arena)
  //   Ember Passage      x=32, z=70, w=10, h=8   (below War Hall)
  //   Lava Shelf         x=30, z=78, w=12, h=12  (hazard room, joins Gauntlet)
  //   Blood Vault        x=0,  z=56, w=12, h=14  (secret left of Berserker Arena)
  //
  // Overlap check (existing rooms):
  //   Gate of Dis     x:[19..29), z:[2..8)
  //   Blood Marsh     x:[16..32), z:[12..26)
  //   Rage Pit        x:[22..34), z:[30..42)
  //   Arsenal         x:[14..26), z:[46..52)
  //   Berserker Arena x:[15..29), z:[56..70)
  //   Shrine of Fury  x:[2..8),  z:[74..80)
  //   Gauntlet        x:[21..27), z:[74..94)
  //   Colosseum       x:[16..32), z:[98..114)
  //   — None of the new rooms overlap any existing room. ✓
  // =========================================================================

  // ── New Rooms ─────────────────────────────────────────────────────────────

  // Forge Pit: lava-floored arena east of Rage Pit (x=34, z=30, w=12, h=12)
  //   interior: x=[35..44), z=[31..41)  center: (40, 36)
  const forgePitId = editor.room(LEVEL_ID, 'forge_pit', 34, 30, 12, 12, {
    roomType: ROOM_TYPES.ARENA,
    elevation: 0,
    sortOrder: 8,
    floorTexture: 'lava',
    wallTexture: 'metal',
    fillRule: {
      type: 'scatter',
      props: ['wrath-rage-furnace', 'wrath-explosive-barrel', 'wrath-iron-grate'],
      density: 0.12,
    },
  });

  // Punishment Corridor: narrow gauntlet right of Arsenal (x=34, z=46, w=10, h=10)
  //   interior: x=[35..43), z=[47..55)  center: (39, 51)
  const punishmentCorridorId = editor.room(LEVEL_ID, 'punishment_corridor', 34, 46, 10, 10, {
    roomType: ROOM_TYPES.CORRIDOR,
    elevation: 0,
    sortOrder: 9,
    floorTexture: 'concrete',
    wallTexture: 'metal',
    fillRule: {
      type: 'scatter',
      props: ['wrath-punching-bag-chain', 'wrath-chain-curtain', 'wrath-blood-spattered-slab'],
      density: 0.1,
    },
  });

  // War Hall: second main arena east of Berserker Arena (x=33, z=56, w=12, h=14)
  //   interior: x=[34..44), z=[57..69)  center: (39, 63)
  const warHallId = editor.room(LEVEL_ID, 'war_hall', 33, 56, 12, 14, {
    roomType: ROOM_TYPES.ARENA,
    elevation: 0,
    sortOrder: 10,
    floorTexture: 'metal',
    wallTexture: 'metal-dark',
    fillRule: {
      type: 'scatter',
      props: ['wrath-rusted-cage', 'wrath-explosive-barrel', 'wrath-war-banner'],
      density: 0.1,
    },
  });

  // Ember Passage: smoky descent corridor below War Hall (x=32, z=70, w=10, h=8)
  //   interior: x=[33..41), z=[71..77)  center: (37, 74)
  const emberPassageId = editor.room(LEVEL_ID, 'ember_passage', 32, 70, 10, 8, {
    roomType: ROOM_TYPES.CORRIDOR,
    elevation: 0,
    sortOrder: 11,
    floorTexture: 'concrete',
    wallTexture: 'concrete',
    fillRule: {
      type: 'scatter',
      props: ['wrath-smashed-barrier', 'wrath-anger-graffiti-slab', 'wrath-corroded-pipe-pillar'],
      density: 0.08,
    },
  });

  // Lava Shelf: platforming room with lava hazards (x=30, z=78, w=12, h=12)
  //   interior: x=[31..41), z=[79..89)  center: (36, 84)
  const lavaShelfId = editor.room(LEVEL_ID, 'lava_shelf', 30, 78, 12, 12, {
    roomType: ROOM_TYPES.PLATFORMING,
    elevation: -1,
    sortOrder: 12,
    floorTexture: 'lava',
    wallTexture: 'metal',
    fillRule: {
      type: 'scatter',
      props: ['lava-altar', 'wrath-stone-island', 'wrath-pit-tier-ring'],
      density: 0.07,
    },
  });

  // Blood Vault: secret exploration room left of Berserker Arena (x=0, z=56, w=12, h=14)
  //   interior: x=[1..11), z=[57..69)  center: (6, 63)
  const bloodVaultId = editor.room(LEVEL_ID, 'blood_vault', 0, 56, 12, 14, {
    roomType: ROOM_TYPES.SECRET,
    elevation: 0,
    sortOrder: 13,
    floorTexture: 'concrete',
    wallTexture: 'stone-dark',
    fillRule: {
      type: 'scatter',
      props: ['wrath-caged-lantern', 'wrath-iron-grate', 'wrath-war-banner'],
      density: 0.06,
    },
  });

  // ── New Connections ───────────────────────────────────────────────────────

  // Rage Pit -> Forge Pit (corridor, width 2) — east branch
  editor.corridor(LEVEL_ID, ragePitId, forgePitId, 2);

  // Forge Pit -> Punishment Corridor (corridor, width 2) — south descent
  editor.corridor(LEVEL_ID, forgePitId, punishmentCorridorId, 2);

  // Punishment Corridor -> War Hall (corridor, width 2) — south entry
  editor.corridor(LEVEL_ID, punishmentCorridorId, warHallId, 2);

  // Berserker Arena -> War Hall (corridor, width 2) — east exit to War Hall
  editor.corridor(LEVEL_ID, berserkerArenaId, warHallId, 2);

  // War Hall -> Ember Passage (corridor, width 2) — south descent
  editor.corridor(LEVEL_ID, warHallId, emberPassageId, 2);

  // Ember Passage -> Lava Shelf (corridor, width 2) — south into lava hazards
  editor.corridor(LEVEL_ID, emberPassageId, lavaShelfId, 2);

  // Lava Shelf -> Gauntlet (corridor, width 2) — west merge into final gauntlet
  editor.corridor(LEVEL_ID, lavaShelfId, gauntletId, 2);

  // Berserker Arena -> Blood Vault (secret, width 2) — second secret: west wall
  editor.connect(LEVEL_ID, berserkerArenaId, bloodVaultId, {
    connectionType: CONNECTION_TYPES.SECRET,
    corridorWidth: 2,
  });

  // =========================================================================
  // STATIC ENEMIES — large enemy roster for play-time estimation.
  //   ALL in open accessible rooms, placed 2+ cells clear of:
  //   - corridor mouth cells (identified per-room below)
  //   - solid blocking props
  //   - room walls (at least 1 cell inside interior)
  // =========================================================================

  // --- Gate of Dis (x=19,z=2,w=10,h=6): interior x=[20..28], z=[3..7] ---
  //   South corridor to Blood Marsh exits at z=7, center x=24. Width 2 → x=[24,25].
  //   Keep enemies west (x≤22) or east (x≥27) of corridor mouth.
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 21, 5, { roomId: gateOfDisId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 27, 5, { roomId: gateOfDisId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 21, 4, { roomId: gateOfDisId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 27, 4, { roomId: gateOfDisId });

  // --- Berserker Arena (x=15,z=56,w=14,h=14): interior x=[16..28], z=[57..69] ---
  //   North corridor from Arsenal enters around x=22-23. East corridor to War Hall at z=63-64.
  //   South corridor to Gauntlet at z=69, x=24-25.
  //   Explosive barrels: (17,58),(27,58),(20,58),(17,62),(27,62),(17,66),(27,66),(24,66)
  //   Chain curtains: (19,59),(25,59),(19,65),(25,65),(22,59),(22,65)
  //   Safe positions: center band z=60-64, clear of barrels and corridor mouths
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 18, 61, { roomId: berserkerArenaId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 26, 61, { roomId: berserkerArenaId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 21, 64, { roomId: berserkerArenaId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 23, 60, { roomId: berserkerArenaId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 18, 64, { roomId: berserkerArenaId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 26, 64, { roomId: berserkerArenaId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 21, 67, { roomId: berserkerArenaId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 23, 67, { roomId: berserkerArenaId });

  // --- Forge Pit (x=34,z=30,w=12,h=12): interior x=[35..45], z=[31..41] ---
  //   Props: rage-furnace (36,32),(43,32),(36,40),(43,40); barrels (35,34),(44,34),(35,38),(44,38);
  //          iron-grate (39,36); chain-curtain (39,31),(39,40); war-banner (34,36)
  //   Safe: center x=38-44, z=33-39
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 41, 34, { roomId: forgePitId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 37, 38, { roomId: forgePitId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 44, 37, { roomId: forgePitId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 38, 34, { roomId: forgePitId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 42, 39, { roomId: forgePitId });

  // --- Punishment Corridor (x=34,z=46,w=10,h=10): interior x=[35..43], z=[47..55] ---
  //   Props: punching-bag (36,48),(42,52); chain-curtain (38,50); smashed-barrier (39,54)
  //   Safe: x=37-41, z=48-53 with 2+ clearance from props
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 40, 48, { roomId: punishmentCorridorId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 36, 52, { roomId: punishmentCorridorId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 41, 51, { roomId: punishmentCorridorId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 37, 54, { roomId: punishmentCorridorId });

  // --- War Hall (x=33,z=56,w=12,h=14): interior x=[34..44], z=[57..69] ---
  //   Props: rusted-cage (35,59),(43,59),(35,67),(43,67); barrels (36,58),(43,58),(36,67),(43,67);
  //          chain-curtain (37,62),(41,62); war-banner (33,63),(44,63)
  //   West entry corridor from BerserkerArena at z=63-64. North entry from PunCorridor.
  //   Safe positions avoid props and corridor mouths at z=63-64 and x=33
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 34, 58, { roomId: warHallId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 44, 58, { roomId: warHallId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 35, 62, { roomId: warHallId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 43, 62, { roomId: warHallId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 37, 65, { roomId: warHallId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 41, 65, { roomId: warHallId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 39, 58, { roomId: warHallId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 37, 68, { roomId: warHallId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 41, 68, { roomId: warHallId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 39, 60, { roomId: warHallId });

  // --- Ember Passage (x=32,z=70,w=10,h=8): interior x=[33..41], z=[71..77] ---
  //   Props: smashed-barrier (35,73), corroded-pipe-pillar (33,71),(40,75),
  //          chain-curtain (37,73), anger-graffiti-slab (33,76)
  //   Safe positions: (40,72),(34,76),(38,76),(36,72) — 2+ cells from all props
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 40, 72, { roomId: emberPassageId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 34, 76, { roomId: emberPassageId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 38, 76, { roomId: emberPassageId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 36, 72, { roomId: emberPassageId });

  // --- Lava Shelf (x=30,z=78,w=12,h=12): interior x=[31..41], z=[79..89] ---
  //   Props: lava-altar (33,80),(39,82); chain-curtain (36,80),(36,84); iron-grate (34,82);
  //          caged-lantern (31,81),(41,81)
  //   Safe: south quadrant (z=85-88) and east quadrant (x=38-41) clear of props
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 32, 86, { roomId: lavaShelfId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 40, 84, { roomId: lavaShelfId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 38, 87, { roomId: lavaShelfId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 32, 83, { roomId: lavaShelfId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 40, 88, { roomId: lavaShelfId });

  // --- Gauntlet (x=21,z=74,w=6,h=20): interior x=[22..26], z=[75..93] ---
  //   Only 4 cells wide with ambush triggers every ~4 cells.
  //   Skip static enemies; all Gauntlet combat via ambush.

  // --- Furia's Colosseum (x=16,z=98,w=16,h=16): interior x=[17..31], z=[99..113] ---
  //   Boss at (24,106). Corridor from Gauntlet at z=98, x=22-24 (width 3).
  //   Large open room — all quadrant positions safe.
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 18, 101, { roomId: colosseumId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 30, 101, { roomId: colosseumId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 18, 110, { roomId: colosseumId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 30, 110, { roomId: colosseumId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 19, 105, { roomId: colosseumId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 29, 105, { roomId: colosseumId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 20, 112, { roomId: colosseumId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.FIRE_GOAT, 28, 112, { roomId: colosseumId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 18, 104, { roomId: colosseumId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 30, 104, { roomId: colosseumId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 22, 102, { roomId: colosseumId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 26, 108, { roomId: colosseumId });

  // ── New Enemies ───────────────────────────────────────────────────────────

  // --- Forge Pit arena waves (x=34,z=30,w=12,h=12) interior: x=[35..45], z=[31..41]
  //   Trigger zone covers the entry mouth
  editor.setupArenaWaves(LEVEL_ID, forgePitId, { x: 35, z: 31, w: 8, h: 2 }, [
    // Wave 1: 4 fireGoats from corners (fast ranged)
    [
      { type: ENEMY_TYPES.FIRE_GOAT, x: 35, z: 35 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 44, z: 35 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 35, z: 39 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 44, z: 39 },
    ],
    // Wave 2: 2 goatKnights charging from north + 2 fireGoat flanking
    [
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 37, z: 32 },
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 42, z: 32 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 35, z: 38 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 44, z: 38 },
    ],
    // Wave 3: 1 hellgoat (mini) + 2 goatKnight berserkers
    [
      { type: ENEMY_TYPES.HELLGOAT, x: 39, z: 36 },
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 35, z: 32 },
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 44, z: 40 },
    ],
  ]);

  // --- Punishment Corridor ambushes (x=34,z=46,w=10,h=10) interior: x=[35..43], z=[47..55]
  //   Three ambush points as player marches south
  editor.ambush(
    LEVEL_ID,
    { x: 35, z: 49, w: 8, h: 2 },
    [
      { type: ENEMY_TYPES.HELLGOAT, x: 36, z: 47 },
      { type: ENEMY_TYPES.HELLGOAT, x: 42, z: 48 },
    ],
    { roomId: punishmentCorridorId },
  );
  editor.ambush(
    LEVEL_ID,
    { x: 35, z: 52, w: 8, h: 2 },
    [
      { type: ENEMY_TYPES.FIRE_GOAT, x: 38, z: 54 },
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 40, z: 47 },
    ],
    { roomId: punishmentCorridorId },
  );
  editor.ambush(
    LEVEL_ID,
    { x: 35, z: 54, w: 8, h: 2 },
    [
      { type: ENEMY_TYPES.HELLGOAT, x: 36, z: 54 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 42, z: 54 },
    ],
    { roomId: punishmentCorridorId },
  );

  // --- War Hall arena waves (x=33,z=56,w=12,h=14) interior: x=[34..44], z=[57..69]
  //   Trigger zone covers the entry
  editor.setupArenaWaves(LEVEL_ID, warHallId, { x: 34, z: 57, w: 10, h: 2 }, [
    // Wave 1: 3 hellgoats from S wall + 2 fireGoat from corners
    [
      { type: ENEMY_TYPES.HELLGOAT, x: 36, z: 68 },
      { type: ENEMY_TYPES.HELLGOAT, x: 39, z: 68 },
      { type: ENEMY_TYPES.HELLGOAT, x: 43, z: 68 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 34, z: 62 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 44, z: 62 },
    ],
    // Wave 2: 3 goatKnights spread
    [
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 35, z: 58 },
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 39, z: 64 },
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 44, z: 58 },
    ],
    // Wave 3: Berserker hellgoat + 2 fireGoat + 1 goatKnight
    [
      { type: ENEMY_TYPES.HELLGOAT, x: 39, z: 63 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 34, z: 60 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 44, z: 60 },
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 39, z: 68 },
    ],
  ]);

  // --- Ember Passage ambushes (x=32,z=70,w=10,h=8) interior: x=[33..41], z=[71..77]
  editor.ambush(
    LEVEL_ID,
    { x: 33, z: 72, w: 8, h: 2 },
    [
      { type: ENEMY_TYPES.HELLGOAT, x: 34, z: 72 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 40, z: 75 },
    ],
    { roomId: emberPassageId },
  );
  editor.ambush(
    LEVEL_ID,
    { x: 33, z: 75, w: 8, h: 2 },
    [
      { type: ENEMY_TYPES.HELLGOAT, x: 38, z: 76 },
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 34, z: 75 },
    ],
    { roomId: emberPassageId },
  );
  // Extra ambush (compensates for empty Lava Shelf)
  editor.ambush(
    LEVEL_ID,
    { x: 33, z: 71, w: 8, h: 2 },
    [
      { type: ENEMY_TYPES.FIRE_GOAT, x: 36, z: 72 },
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 39, z: 71 },
      { type: ENEMY_TYPES.HELLGOAT, x: 34, z: 74 },
    ],
    { roomId: emberPassageId },
  );

  // --- Lava Shelf: no stationary enemies — pure hazard traversal room.
  //     Lava floor deals DPS, forcing player to move fast. Enemies replaced with
  //     ambush spawns in the Ember Passage to keep pressure up.
  //     (Removed to fix A* pathfinder dead-end in lava room.)

  // --- Blood Vault: ambush-only enemies (SECRET room — A* bot never enters).
  //   Static enemies in secret rooms leave the PlaytestRunner bot stuck in an infinite
  //   no-target loop (enemies alive but unreachable). Use ambush triggers instead so
  //   enemies only exist after a real player has discovered the secret passage.
  //   Room: x=0,z=56,w=12,h=14 — interior: x=[1..11], z=[57..69]
  editor.ambush(
    LEVEL_ID,
    { x: 1, z: 57, w: 10, h: 2 },
    [
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 6, z: 62 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 3, z: 60 },
      { type: ENEMY_TYPES.FIRE_GOAT, x: 10, z: 66 },
    ],
    { roomId: bloodVaultId },
  );

  // ── New Pickups ───────────────────────────────────────────────────────────

  // Forge Pit: health + ammo (after clearing each wave)
  //   interior: x=[35..45], z=[31..41]
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 39, 36);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 35, 31);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 44, 40);

  // Punishment Corridor: health mid-run + ammo at exit
  //   interior: x=[35..43], z=[47..55]
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 39, 51);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 36, 53);

  // War Hall: ammo x3 + health x2 scattered for arena play
  //   interior: x=[34..44], z=[57..69]
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 36, 60);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 43, 67);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 39, 64);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 35, 65);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 43, 60);

  // Ember Passage: ammo only — tight resource pressure
  //   interior: x=[33..41], z=[71..77]
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 37, 74);

  // Lava Shelf: health x2 on raised islands (reward for hazard navigation)
  //   interior: x=[31..41], z=[79..89]  — pickups in center band only
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 33, 80);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 39, 80);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 36, 82);

  // Blood Vault: big reward for secret discovery — health x3 + ammo x2 + cannon
  //   interior: x=[1..11], z=[57..69]
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 3, 59);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 6, 63);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 10, 67);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 3, 67);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 10, 59);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.WEAPON_CANNON, 6, 65);

  // ── New Props ─────────────────────────────────────────────────────────────

  // --- Forge Pit props (x=34,z=30,w=12,h=12) interior: x=[35..45], z=[31..41]
  editor.spawnProp(LEVEL_ID, 'wrath-rage-furnace', 36, 32, { roomId: forgePitId });
  editor.spawnProp(LEVEL_ID, 'wrath-rage-furnace', 43, 32, { roomId: forgePitId });
  editor.spawnProp(LEVEL_ID, 'wrath-anvil', 36, 40, { roomId: forgePitId });
  editor.spawnProp(LEVEL_ID, 'wrath-anvil', 43, 40, { roomId: forgePitId });
  editor.spawnProp(LEVEL_ID, 'wrath-explosive-barrel', 35, 34, { roomId: forgePitId });
  editor.spawnProp(LEVEL_ID, 'wrath-explosive-barrel', 44, 34, { roomId: forgePitId });
  editor.spawnProp(LEVEL_ID, 'wrath-explosive-barrel', 35, 38, { roomId: forgePitId });
  editor.spawnProp(LEVEL_ID, 'wrath-explosive-barrel', 44, 38, { roomId: forgePitId });
  editor.spawnProp(LEVEL_ID, 'wrath-iron-grate', 39, 36, { roomId: forgePitId });
  editor.spawnProp(LEVEL_ID, 'wrath-chain-curtain', 39, 31, { roomId: forgePitId });
  editor.spawnProp(LEVEL_ID, 'wrath-chain-curtain', 39, 40, { roomId: forgePitId });
  editor.spawnProp(LEVEL_ID, 'wrath-war-banner', 34, 36, { roomId: forgePitId });
  editor.spawnProp(LEVEL_ID, 'wrath-caged-lantern', 35, 36, { roomId: forgePitId });
  editor.spawnProp(LEVEL_ID, 'wrath-caged-lantern', 44, 36, { roomId: forgePitId });

  // --- Punishment Corridor props (x=34,z=46,w=10,h=10) interior: x=[35..43], z=[47..55]
  editor.spawnProp(LEVEL_ID, 'wrath-punching-bag-chain', 36, 48, { roomId: punishmentCorridorId });
  editor.spawnProp(LEVEL_ID, 'wrath-punching-bag-chain', 42, 52, { roomId: punishmentCorridorId });
  editor.spawnProp(LEVEL_ID, 'wrath-chain-curtain', 38, 50, { roomId: punishmentCorridorId });
  editor.spawnProp(LEVEL_ID, 'wrath-blood-spattered-slab', 35, 53, {
    roomId: punishmentCorridorId,
  });
  editor.spawnProp(LEVEL_ID, 'wrath-anger-graffiti-slab', 43, 47, { roomId: punishmentCorridorId });
  editor.spawnProp(LEVEL_ID, 'wrath-smashed-barrier', 39, 54, { roomId: punishmentCorridorId });

  // --- War Hall props (x=33,z=56,w=12,h=14) interior: x=[34..44], z=[57..69]
  editor.spawnProp(LEVEL_ID, 'wrath-jagged-arch', 39, 56, { roomId: warHallId });
  editor.spawnProp(LEVEL_ID, 'wrath-war-banner', 33, 63, { roomId: warHallId });
  editor.spawnProp(LEVEL_ID, 'wrath-war-banner', 44, 63, { roomId: warHallId });
  editor.spawnProp(LEVEL_ID, 'wrath-rusted-cage', 35, 59, { roomId: warHallId });
  editor.spawnProp(LEVEL_ID, 'wrath-rusted-cage', 43, 59, { roomId: warHallId });
  editor.spawnProp(LEVEL_ID, 'wrath-rusted-cage', 35, 67, { roomId: warHallId });
  editor.spawnProp(LEVEL_ID, 'wrath-rusted-cage', 43, 67, { roomId: warHallId });
  editor.spawnProp(LEVEL_ID, 'wrath-explosive-barrel', 36, 58, { roomId: warHallId });
  editor.spawnProp(LEVEL_ID, 'wrath-explosive-barrel', 43, 58, { roomId: warHallId });
  editor.spawnProp(LEVEL_ID, 'wrath-explosive-barrel', 36, 67, { roomId: warHallId });
  editor.spawnProp(LEVEL_ID, 'wrath-explosive-barrel', 43, 67, { roomId: warHallId });
  editor.spawnProp(LEVEL_ID, 'wrath-chain-curtain', 37, 62, { roomId: warHallId });
  editor.spawnProp(LEVEL_ID, 'wrath-chain-curtain', 41, 62, { roomId: warHallId });
  editor.spawnProp(LEVEL_ID, 'wrath-caged-lantern', 34, 63, { roomId: warHallId });
  editor.spawnProp(LEVEL_ID, 'wrath-caged-lantern', 44, 63, { roomId: warHallId });
  editor.spawnProp(LEVEL_ID, 'wrath-blood-spattered-slab', 39, 68, { roomId: warHallId });

  // --- Ember Passage props (x=32,z=70,w=10,h=8) interior: x=[33..41], z=[71..77]
  editor.spawnProp(LEVEL_ID, 'wrath-smashed-barrier', 35, 73, { roomId: emberPassageId });
  editor.spawnProp(LEVEL_ID, 'wrath-corroded-pipe-pillar', 33, 71, { roomId: emberPassageId });
  editor.spawnProp(LEVEL_ID, 'wrath-corroded-pipe-pillar', 40, 75, { roomId: emberPassageId });
  editor.spawnProp(LEVEL_ID, 'wrath-chain-curtain', 37, 73, { roomId: emberPassageId });
  editor.spawnProp(LEVEL_ID, 'wrath-anger-graffiti-slab', 33, 76, { roomId: emberPassageId });

  // --- Lava Shelf props (x=30,z=78,w=12,h=12) interior: x=[31..41], z=[79..89]
  //     Only non-blocking decorative props to avoid nav dead ends.
  editor.spawnProp(LEVEL_ID, 'lava-altar', 33, 80, { roomId: lavaShelfId });
  editor.spawnProp(LEVEL_ID, 'lava-altar', 39, 82, { roomId: lavaShelfId });
  editor.spawnProp(LEVEL_ID, 'wrath-chain-curtain', 36, 80, { roomId: lavaShelfId });
  editor.spawnProp(LEVEL_ID, 'wrath-chain-curtain', 36, 84, { roomId: lavaShelfId });
  editor.spawnProp(LEVEL_ID, 'wrath-iron-grate', 34, 82, { roomId: lavaShelfId });
  editor.spawnProp(LEVEL_ID, 'wrath-caged-lantern', 31, 81, { roomId: lavaShelfId });
  editor.spawnProp(LEVEL_ID, 'wrath-caged-lantern', 41, 81, { roomId: lavaShelfId });

  // --- Blood Vault props (x=0,z=56,w=12,h=14) interior: x=[1..11], z=[57..69]
  editor.spawnProp(LEVEL_ID, 'wrath-smashed-barrier', 2, 58, { roomId: bloodVaultId });
  editor.spawnProp(LEVEL_ID, 'wrath-caged-lantern', 6, 63, { roomId: bloodVaultId });
  editor.spawnProp(LEVEL_ID, 'wrath-iron-grate', 6, 64, { roomId: bloodVaultId });
  editor.spawnProp(LEVEL_ID, 'wrath-weapon-pedestal', 6, 65, { roomId: bloodVaultId });
  editor.spawnProp(LEVEL_ID, 'wrath-war-banner', 1, 63, { roomId: bloodVaultId });
  editor.spawnProp(LEVEL_ID, 'wrath-war-banner', 11, 63, { roomId: bloodVaultId });
  editor.spawnProp(LEVEL_ID, 'wrath-blood-spattered-slab', 2, 67, { roomId: bloodVaultId });
  editor.spawnProp(LEVEL_ID, 'wrath-blood-spattered-slab', 10, 58, { roomId: bloodVaultId });

  // ── New Decals ────────────────────────────────────────────────────────────

  editor.placeDecals(LEVEL_ID, forgePitId, [
    { type: DECAL_TYPES.BLOOD_STAIN, x: 39, z: 36 },
    { type: DECAL_TYPES.SCORCH_MARK, x: 36, z: 32 },
    { type: DECAL_TYPES.SCORCH_MARK, x: 43, z: 32 },
    { type: DECAL_TYPES.RUST_PATCH, x: 35, z: 34 },
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 34, z: 36, surface: 'wall' },
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 45, z: 36, surface: 'wall' },
  ]);

  editor.placeDecals(LEVEL_ID, punishmentCorridorId, [
    { type: DECAL_TYPES.BLOOD_STAIN, x: 38, z: 50 },
    { type: DECAL_TYPES.RUST_PATCH, x: 36, z: 53 },
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 34, z: 51, surface: 'wall' },
  ]);

  editor.placeDecals(LEVEL_ID, warHallId, [
    { type: DECAL_TYPES.BLOOD_STAIN, x: 37, z: 63 },
    { type: DECAL_TYPES.BLOOD_STAIN, x: 42, z: 63 },
    { type: DECAL_TYPES.SCORCH_MARK, x: 36, z: 58 },
    { type: DECAL_TYPES.SCORCH_MARK, x: 43, z: 58 },
    { type: DECAL_TYPES.RUST_PATCH, x: 39, z: 67 },
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 33, z: 63, surface: 'wall' },
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 44, z: 63, surface: 'wall' },
  ]);

  editor.placeDecals(LEVEL_ID, lavaShelfId, [
    { type: DECAL_TYPES.BLOOD_STAIN, x: 36, z: 82 },
    { type: DECAL_TYPES.SCORCH_MARK, x: 33, z: 80 },
    { type: DECAL_TYPES.SCORCH_MARK, x: 39, z: 82 },
  ]);

  editor.placeDecals(LEVEL_ID, bloodVaultId, [
    { type: DECAL_TYPES.BLOOD_STAIN, x: 6, z: 63 },
    { type: DECAL_TYPES.RUST_PATCH, x: 3, z: 60 },
    { type: DECAL_TYPES.RUST_PATCH, x: 10, z: 66 },
  ]);

  // ── New Triggers ──────────────────────────────────────────────────────────

  // Forge Pit entry dialogue — player discovers the east path
  editor.dialogue(
    LEVEL_ID,
    { x: 35, z: 31, w: 8, h: 2 },
    'The forges never cool here. Neither do the dead.',
    { roomId: forgePitId },
  );

  // Punishment Corridor escalation
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 35,
    zoneZ: 47,
    zoneW: 8,
    zoneH: 2,
    roomId: punishmentCorridorId,
    once: true,
    actionData: { speedIncrease: 0.1, interval: 4, cap: 0.6, condition: 'firstCombat' },
  });

  // War Hall entry dialogue
  editor.dialogue(LEVEL_ID, { x: 34, z: 57, w: 10, h: 2 }, 'WAR NEVER ENDS. NEITHER WILL YOU.', {
    roomId: warHallId,
  });

  // War Hall explosive barrel triggers (4 barrels)
  const warHallBarrels = [
    [36, 58],
    [43, 58],
    [36, 67],
    [43, 67],
  ];
  for (const [bx, bz] of warHallBarrels) {
    editor.addTrigger(LEVEL_ID, {
      action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
      zoneX: bx,
      zoneZ: bz,
      zoneW: 1,
      zoneH: 1,
      roomId: warHallId,
      once: true,
      actionData: { condition: 'barrelDamage', radius: 2, damage: 15 },
    });
  }

  // Lava Shelf escalation — lava burns, must move fast
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 31,
    zoneZ: 79,
    zoneW: 10,
    zoneH: 10,
    roomId: lavaShelfId,
    once: true,
    actionData: { speedIncrease: 0.15, interval: 3, cap: 0.6, condition: 'firstCombat' },
  });

  // Blood Vault secret reveal + dialogue
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.SECRET_REVEAL,
    zoneX: 1,
    zoneZ: 57,
    zoneW: 10,
    zoneH: 2,
    roomId: bloodVaultId,
    once: true,
    actionData: { roomId: bloodVaultId },
  });
  editor.dialogue(
    LEVEL_ID,
    { x: 1, z: 58, w: 10, h: 2 },
    'Rage built this vault. Fury sealed it. You opened it.',
    { roomId: bloodVaultId },
  );

  // ── New Environment Zones ─────────────────────────────────────────────────

  // Forge Pit: intense fire zone (lava floor + heat shimmer)
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.FIRE,
    boundsX: 34,
    boundsZ: 30,
    boundsW: 12,
    boundsH: 12,
    intensity: 1.0,
    timerOn: 2.0,
    timerOff: 1.0,
  });

  // Punishment Corridor: smoke + heat distortion
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.FOG,
    boundsX: 34,
    boundsZ: 46,
    boundsW: 10,
    boundsH: 10,
    intensity: 0.4,
  });

  // War Hall: arena fire (ring of heat)
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.FIRE,
    boundsX: 33,
    boundsZ: 56,
    boundsW: 12,
    boundsH: 14,
    intensity: 0.85,
  });

  // Ember Passage: thick choking smoke
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.FOG,
    boundsX: 32,
    boundsZ: 70,
    boundsW: 10,
    boundsH: 8,
    intensity: 0.5,
  });

  // Lava Shelf: lava floor zones + upward wind (heat draft)
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.FIRE,
    boundsX: 30,
    boundsZ: 78,
    boundsW: 12,
    boundsH: 12,
    intensity: 0.9,
  });
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.WIND,
    boundsX: 33,
    boundsZ: 82,
    boundsW: 6,
    boundsH: 6,
    intensity: 0.3,
    directionX: 0,
    directionZ: -1,
  });

  // Blood Vault: muted damp stone atmosphere (contrast from rage)
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.FOG,
    boundsX: 0,
    boundsZ: 56,
    boundsW: 12,
    boundsH: 14,
    intensity: 0.25,
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
    throw new Error('Circle 5 (Wrath) level validation failed');
  }
  console.log('Circle 5 (Wrath) built successfully');
  if (result.warnings.length > 0) {
    console.log('Warnings:', result.warnings);
  }
}
