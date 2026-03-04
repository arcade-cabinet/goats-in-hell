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

const LEVEL_ID = 'circle-4-greed';
const THEME_ID = 'circle-4-greed';

export async function buildCircle4(dbPath: string) {
  const sqliteDb = new BetterSqlite3(dbPath);
  const db = drizzle(sqliteDb, { schema });
  await migrateAndSeed(db);
  const editor = new LevelEditor(db);

  // =========================================================================
  // 1. THEME (from "Theme Configuration" section)
  // =========================================================================

  editor.createTheme(THEME_ID, {
    name: 'greed',
    displayName: 'GREED -- The Circle of Avarice',
    primaryWall: MapCell.WALL_OBSIDIAN,
    accentWalls: [MapCell.WALL_STONE],
    fogDensity: 0.03,
    fogColor: '#1f1a08',
    ambientColor: '#ffcc44',
    ambientIntensity: 0.2,
    skyColor: '#0a0800',
    particleEffect: 'goldDust',
    enemyTypes: ['hoarder', 'hoarderWhelp', 'hoarderElder'],
    enemyDensity: 1.0,
    pickupDensity: 2.5,
    texturePalette: { exploration: 'tiles', arena: 'marble', boss: 'tiles', secret: 'marble' },
  });

  // =========================================================================
  // 2. LEVEL (from "Identity" + "Grid Dimensions" sections)
  // =========================================================================

  editor.createLevel(LEVEL_ID, {
    name: 'Circle 4: Greed',
    levelType: 'circle',
    width: 44,
    depth: 73, // Boss room extends to z=72
    floor: 4,
    themeId: THEME_ID,
    circleNumber: 4,
    sin: 'Avarice',
    guardian: 'Aureo',
  });

  // =========================================================================
  // 3. ROOMS (from "Room Placement" table, in sortOrder)
  // =========================================================================
  //
  //   | Room             | X  | Z  | W  | H  | Type        | Elevation                    | sortOrder |
  //   | Vault Entrance   | 18 |  2 |  8 |  6 | exploration | 0                            | 0         |
  //   | Treasury         | 15 | 12 | 14 | 12 | exploration | 0 (balcony=1)                | 1         |
  //   | Weight Room      | 17 | 28 | 10 | 10 | puzzle      | 0 (plates=-1 when sunk)      | 2         |
  //   | Reliquary        |  2 | 32 |  6 |  6 | secret      | 0                            | 3         |
  //   | Auction Hall     | 16 | 42 | 12 | 12 | arena       | 0                            | 4         |
  //   | Aureo's Court    | 15 | 58 | 14 | 14 | boss        | -1 (sunken throne)           | 5         |

  const vaultEntranceId = editor.room(LEVEL_ID, 'vault_entrance', 18, 2, 8, 6, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 0,
    floorTexture: 'tiles',
    wallTexture: 'marble',
    fillRule: {
      type: 'scatter',
      props: ['coin-pile', 'greed-golden-vase', 'greed-treasure-chest'],
      density: 0.08,
    },
  });

  const treasuryId = editor.room(LEVEL_ID, 'treasury', 15, 12, 14, 12, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 1,
    floorTexture: 'marble',
    wallTexture: 'tiles',
    fillRule: {
      type: 'scatter',
      props: ['greed-gold-bar-stack', 'greed-coin-cascade', 'coin-pile'],
      density: 0.1,
    },
  });

  const weightRoomId = editor.room(LEVEL_ID, 'weight_room', 17, 28, 10, 10, {
    roomType: ROOM_TYPES.PUZZLE,
    elevation: 0,
    sortOrder: 2,
    floorTexture: 'metal',
    wallTexture: 'marble',
    fillRule: {
      type: 'scatter',
      props: ['greed-gear-mechanism', 'greed-gold-chain'],
      density: 0.1,
    },
  });

  const reliquaryId = editor.room(LEVEL_ID, 'reliquary', 2, 32, 6, 6, {
    roomType: ROOM_TYPES.SECRET,
    elevation: 0,
    sortOrder: 3,
    floorTexture: 'tiles',
    fillRule: {
      type: 'scatter',
      props: ['greed-treasure-chest', 'greed-chest-pedestal', 'coin-pile'],
      density: 0.2,
    },
  });

  const auctionHallId = editor.room(LEVEL_ID, 'auction_hall', 16, 42, 12, 12, {
    roomType: ROOM_TYPES.ARENA,
    elevation: 0,
    sortOrder: 4,
    floorTexture: 'marble',
    fillRule: {
      type: 'scatter',
      props: ['golden-idol', 'greed-jeweled-pedestal', 'greed-golden-chalice'],
      density: 0.08,
    },
  });

  const aureosCourtId = editor.room(LEVEL_ID, 'aureos_court', 15, 58, 14, 14, {
    roomType: ROOM_TYPES.BOSS,
    elevation: -1,
    sortOrder: 5,
    floorTexture: 'tiles',
    wallTexture: 'tiles',
  });

  // =========================================================================
  // 4. CONNECTIONS (from "Connections" table)
  // =========================================================================
  //
  //   | From           | To             | Type     | Width | Notes                            |
  //   | Vault Entrance | Treasury       | corridor | 3     | Wide, inviting, gold-lit          |
  //   | Treasury       | Weight Room    | corridor | 2     | Narrowing, oppressive             |
  //   | Weight Room    | Reliquary      | secret   | 2     | WALL_SECRET on west wall          |
  //   | Weight Room    | Auction Hall   | corridor | 2     | Main path forward                 |
  //   | Auction Hall   | Aureo's Court  | corridor | 3     | Descending stairs (elev 0 to -1)  |

  // Vault Entrance -> Treasury (corridor, width 3)
  editor.corridor(LEVEL_ID, vaultEntranceId, treasuryId, 3);

  // Treasury -> Weight Room (corridor, width 2)
  editor.corridor(LEVEL_ID, treasuryId, weightRoomId, 2);

  // Weight Room -> Reliquary (secret, width 2)
  editor.connect(LEVEL_ID, weightRoomId, reliquaryId, {
    connectionType: CONNECTION_TYPES.SECRET,
    corridorWidth: 2,
  });

  // Weight Room -> Auction Hall (corridor, width 2)
  editor.corridor(LEVEL_ID, weightRoomId, auctionHallId, 2);

  // Auction Hall -> Aureo's Court (stairs, width 3, descending 0 -> -1)
  editor.connect(LEVEL_ID, auctionHallId, aureosCourtId, {
    connectionType: CONNECTION_TYPES.STAIRS,
    corridorWidth: 3,
    fromElevation: 0,
    toElevation: -1,
  });

  // =========================================================================
  // 5. ENTITIES: ENEMIES (from "Enemies" table)
  // =========================================================================

  // --- Treasury (ground): 2 hoarderWhelp patrol between chest rows ---
  //   Room bounds: (15, 12, 14, 12) -> interior: x=[16..27], z=[13..22]
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HOARDER_WHELP, 19, 16, {
    roomId: treasuryId,
    patrol: [
      { x: 19, z: 16 },
      { x: 25, z: 16 },
      { x: 25, z: 20 },
      { x: 19, z: 20 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HOARDER_WHELP, 25, 20, {
    roomId: treasuryId,
    patrol: [
      { x: 25, z: 20 },
      { x: 19, z: 20 },
      { x: 19, z: 16 },
      { x: 25, z: 16 },
    ],
  });

  // --- Treasury (balcony): 2 hellgoat guard balcony ramps ---
  //   Balcony positions away from ramp walls to avoid corridor interference
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HOARDER, 17, 14, {
    roomId: treasuryId,
    elevation: 1,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HOARDER, 25, 14, {
    roomId: treasuryId,
    elevation: 1,
  });

  // --- Weight Room: 1 hoarderWhelp on far platform, 1 hellgoat patrolling ---
  //   Room bounds: (17, 28, 10, 10) -> interior: x=[18..25], z=[29..36]
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HOARDER_WHELP, 22, 35, {
    roomId: weightRoomId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HOARDER, 22, 33, {
    roomId: weightRoomId,
  });

  // --- Auction Hall: 2 waves via setupArenaWaves ---
  //   Room bounds: (16, 42, 12, 12) -> interior: x=[17..26], z=[43..52]
  //   Trigger zone from table: (17, 43, 10, 2)
  //   Wave 1: 2 goatKnight (N, S) + 2 hellgoat (E, W)
  //   Wave 2: 2 goatKnight (corners) + 2 hellgoat (door-side)
  editor.setupArenaWaves(LEVEL_ID, auctionHallId, { x: 17, z: 43, w: 10, h: 2 }, [
    // Wave 1: 2 hoarderWhelp (N, S) + 2 hellgoat (E, W)
    [
      { type: ENEMY_TYPES.HOARDER_WHELP, x: 22, z: 43 },
      { type: ENEMY_TYPES.HOARDER_WHELP, x: 22, z: 52 },
      { type: ENEMY_TYPES.HOARDER, x: 17, z: 48 },
      { type: ENEMY_TYPES.HOARDER, x: 26, z: 48 },
    ],
    // Wave 2: 2 hoarderElder (corners) + 2 hellgoat (door-side)
    [
      { type: ENEMY_TYPES.HOARDER_ELDER, x: 17, z: 43 },
      { type: ENEMY_TYPES.HOARDER_ELDER, x: 26, z: 52 },
      { type: ENEMY_TYPES.HOARDER, x: 20, z: 43 },
      { type: ENEMY_TYPES.HOARDER, x: 24, z: 43 },
    ],
  ]);

  // --- Boss chamber: Aureo boss entity ---
  //   Room bounds: (15, 58, 14, 14) -> center: (22, 65)
  //   Boss faces south (toward entrance), so facing = Math.PI
  editor.spawnBoss(LEVEL_ID, 'boss-aureo', 22, 63, {
    roomId: aureosCourtId,
    facing: Math.PI,
  });

  // =========================================================================
  // 5b. ENTITIES: PICKUPS (from "Pickups" table)
  // =========================================================================

  // Vault Entrance: ammo (21, 5) center, ammo (24, 4) east wall
  //   Room bounds: (18, 2, 8, 6) -> interior: x=[19..24], z=[3..6]
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 21, 5);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 24, 4);

  // Treasury (ground): ammo x 3 at (17,15), (22,15), (27,18)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 17, 15);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 22, 15);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 27, 18);

  // Treasury (balcony): ammo x 4 at (16,13), (16,22), (28,13), (28,22)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 16, 13);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 16, 22);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 28, 13);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 28, 22);

  // Treasury (ground): health (22, 20) south center
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 22, 20);

  // Weight Room: ammo x 2 at (19, 30), (25, 30)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 19, 30);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 25, 30);

  // Weight Room: health (22, 36) exit side
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 22, 36);

  // Reliquary: ammo x 2 at (4, 34), (6, 36)
  //   Room bounds: (2, 32, 6, 6) -> interior: x=[3..6], z=[33..36]
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 4, 34);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 6, 36);

  // Reliquary: health x 2 at (3, 36), (7, 34)
  //   Note: x=7 is at bounds 2+6-1=7, which is x=boundsX+W-1. Interior max is 2+6-2=6.
  //   Adjust (7, 34) to (6, 34) to stay inside room interior.
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 3, 36);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 6, 34);

  // Auction Hall (between waves): ammo (22, 46) center
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 22, 46);

  // Auction Hall (between waves): health (20, 50) south
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 20, 50);

  // Boss chamber: ammo x 2 at (16, 59), (28, 59) NE, NW corners
  //   Room bounds: (15, 58, 14, 14) -> interior: x=[16..27], z=[59..70]
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 16, 59);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 27, 59);

  // Boss chamber: ammo x 2 at (16, 70), (28, 70) SE, SW corners
  //   Adjust (28, 70) to (27, 70) to stay inside interior
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 16, 70);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 27, 70);

  // Boss chamber: health x 2 at (22, 59), (22, 70) N and S center edges
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 22, 59);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 22, 70);

  // =========================================================================
  // 5c. ENTITIES: PROPS (from 3D Spatial Design)
  // =========================================================================

  // --- Vault Entrance (bounds: 18, 2, 8, 6) ---
  // Structural: 2x greed-vault-arch
  editor.spawnProp(LEVEL_ID, 'greed-vault-arch', 22, 2, { roomId: vaultEntranceId });
  editor.spawnProp(LEVEL_ID, 'greed-vault-arch', 22, 7, { roomId: vaultEntranceId });
  // 2x greed-golden-vase (flanking entrance)
  editor.spawnProp(LEVEL_ID, 'greed-golden-vase', 19, 4, { roomId: vaultEntranceId });
  editor.spawnProp(LEVEL_ID, 'greed-golden-vase', 25, 4, { roomId: vaultEntranceId });
  // 5x coin-pile (floor scatter)
  editor.spawnProp(LEVEL_ID, 'coin-pile', 20, 3, { roomId: vaultEntranceId });
  editor.spawnProp(LEVEL_ID, 'coin-pile', 21, 6, { roomId: vaultEntranceId });
  editor.spawnProp(LEVEL_ID, 'coin-pile', 24, 5, { roomId: vaultEntranceId });
  editor.spawnProp(LEVEL_ID, 'coin-pile', 19, 6, { roomId: vaultEntranceId });
  editor.spawnProp(LEVEL_ID, 'coin-pile', 25, 3, { roomId: vaultEntranceId });
  // 2x greed-gold-bar-stack
  editor.spawnProp(LEVEL_ID, 'greed-gold-bar-stack', 20, 4, { roomId: vaultEntranceId });
  editor.spawnProp(LEVEL_ID, 'greed-gold-bar-stack', 24, 3, { roomId: vaultEntranceId });
  // 1x greed-chest-pedestal + 1x greed-treasure-chest (center)
  editor.spawnProp(LEVEL_ID, 'greed-chest-pedestal', 23, 4, { roomId: vaultEntranceId });
  editor.spawnProp(LEVEL_ID, 'greed-treasure-chest', 23, 4, { roomId: vaultEntranceId });

  // --- Treasury (bounds: 15, 12, 14, 12) ---
  // Structural: 4x greed-gold-pillar (balcony anchors)
  editor.spawnProp(LEVEL_ID, 'greed-gold-pillar', 16, 13, { roomId: treasuryId });
  editor.spawnProp(LEVEL_ID, 'greed-gold-pillar', 28, 13, { roomId: treasuryId });
  editor.spawnProp(LEVEL_ID, 'greed-gold-pillar', 16, 22, { roomId: treasuryId });
  editor.spawnProp(LEVEL_ID, 'greed-gold-pillar', 28, 22, { roomId: treasuryId });
  // Structural: 2x greed-diamond-plate-platform (balconies)
  editor.spawnProp(LEVEL_ID, 'greed-diamond-plate-platform', 16, 13, {
    roomId: treasuryId,
    elevation: 1,
  });
  editor.spawnProp(LEVEL_ID, 'greed-diamond-plate-platform', 27, 13, {
    roomId: treasuryId,
    elevation: 1,
  });
  // 8x greed-chest-pedestal (2 rows of 4)
  editor.spawnProp(LEVEL_ID, 'greed-chest-pedestal', 18, 15, { roomId: treasuryId });
  editor.spawnProp(LEVEL_ID, 'greed-chest-pedestal', 21, 15, { roomId: treasuryId });
  editor.spawnProp(LEVEL_ID, 'greed-chest-pedestal', 24, 15, { roomId: treasuryId });
  editor.spawnProp(LEVEL_ID, 'greed-chest-pedestal', 27, 15, { roomId: treasuryId });
  editor.spawnProp(LEVEL_ID, 'greed-chest-pedestal', 18, 19, { roomId: treasuryId });
  editor.spawnProp(LEVEL_ID, 'greed-chest-pedestal', 21, 19, { roomId: treasuryId });
  editor.spawnProp(LEVEL_ID, 'greed-chest-pedestal', 24, 19, { roomId: treasuryId });
  editor.spawnProp(LEVEL_ID, 'greed-chest-pedestal', 27, 19, { roomId: treasuryId });
  // 8x greed-treasure-chest (on pedestals)
  editor.spawnProp(LEVEL_ID, 'greed-treasure-chest', 18, 15, { roomId: treasuryId });
  editor.spawnProp(LEVEL_ID, 'greed-treasure-chest', 21, 15, { roomId: treasuryId });
  editor.spawnProp(LEVEL_ID, 'greed-treasure-chest', 24, 15, { roomId: treasuryId });
  editor.spawnProp(LEVEL_ID, 'greed-treasure-chest', 27, 15, { roomId: treasuryId });
  editor.spawnProp(LEVEL_ID, 'greed-treasure-chest', 18, 19, { roomId: treasuryId });
  editor.spawnProp(LEVEL_ID, 'greed-treasure-chest', 21, 19, { roomId: treasuryId });
  editor.spawnProp(LEVEL_ID, 'greed-treasure-chest', 24, 19, { roomId: treasuryId });
  editor.spawnProp(LEVEL_ID, 'greed-treasure-chest', 27, 19, { roomId: treasuryId });
  // 6x coin-pile (between chests)
  editor.spawnProp(LEVEL_ID, 'coin-pile', 19, 16, { roomId: treasuryId });
  editor.spawnProp(LEVEL_ID, 'coin-pile', 22, 16, { roomId: treasuryId });
  editor.spawnProp(LEVEL_ID, 'coin-pile', 25, 16, { roomId: treasuryId });
  editor.spawnProp(LEVEL_ID, 'coin-pile', 19, 20, { roomId: treasuryId });
  editor.spawnProp(LEVEL_ID, 'coin-pile', 22, 20, { roomId: treasuryId });
  editor.spawnProp(LEVEL_ID, 'coin-pile', 25, 20, { roomId: treasuryId });
  // 2x greed-golden-chalice (table surfaces)
  editor.spawnProp(LEVEL_ID, 'greed-golden-chalice', 20, 16, { roomId: treasuryId });
  editor.spawnProp(LEVEL_ID, 'greed-golden-chalice', 24, 19, { roomId: treasuryId });
  // 4x greed-golden-candelabra (balcony corners)
  editor.spawnProp(LEVEL_ID, 'greed-golden-candelabra', 16, 13, {
    roomId: treasuryId,
    elevation: 1,
  });
  editor.spawnProp(LEVEL_ID, 'greed-golden-candelabra', 28, 13, {
    roomId: treasuryId,
    elevation: 1,
  });
  editor.spawnProp(LEVEL_ID, 'greed-golden-candelabra', 16, 22, {
    roomId: treasuryId,
    elevation: 1,
  });
  editor.spawnProp(LEVEL_ID, 'greed-golden-candelabra', 28, 22, {
    roomId: treasuryId,
    elevation: 1,
  });

  // --- Weight Room (bounds: 17, 28, 10, 10) ---
  // Structural: 2x greed-safe-door
  editor.spawnProp(LEVEL_ID, 'greed-safe-door', 22, 28, { roomId: weightRoomId });
  editor.spawnProp(LEVEL_ID, 'greed-safe-door', 22, 37, { roomId: weightRoomId });
  // 16x greed-pressure-plate (4x4 grid)
  for (let pz = 29; pz <= 36; pz += 2) {
    for (let px = 18; px <= 25; px += 2) {
      editor.spawnProp(LEVEL_ID, 'greed-pressure-plate', px, pz, { roomId: weightRoomId });
    }
  }
  // 4x greed-gear-mechanism (walls)
  editor.spawnProp(LEVEL_ID, 'greed-gear-mechanism', 17, 30, { roomId: weightRoomId });
  editor.spawnProp(LEVEL_ID, 'greed-gear-mechanism', 27, 30, { roomId: weightRoomId });
  editor.spawnProp(LEVEL_ID, 'greed-gear-mechanism', 17, 34, { roomId: weightRoomId });
  editor.spawnProp(LEVEL_ID, 'greed-gear-mechanism', 27, 34, { roomId: weightRoomId });
  // 2x greed-gold-bar-stack (far side bait)
  editor.spawnProp(LEVEL_ID, 'greed-gold-bar-stack', 19, 30, { roomId: weightRoomId });
  editor.spawnProp(LEVEL_ID, 'greed-gold-bar-stack', 25, 30, { roomId: weightRoomId });
  // 1x greed-skeletal-goat (environmental teach)
  editor.spawnProp(LEVEL_ID, 'greed-skeletal-goat', 20, 29, { roomId: weightRoomId });
  // 2x greed-ammo-scatter (around skeletal goat)
  editor.spawnProp(LEVEL_ID, 'greed-ammo-scatter', 20, 29, { roomId: weightRoomId });
  editor.spawnProp(LEVEL_ID, 'greed-ammo-scatter', 21, 30, { roomId: weightRoomId });
  // 2x coin-pile (floor atmosphere)
  editor.spawnProp(LEVEL_ID, 'coin-pile', 18, 33, { roomId: weightRoomId });
  editor.spawnProp(LEVEL_ID, 'coin-pile', 25, 36, { roomId: weightRoomId });
  // --- Playtest density audit additions (CRITICALLY EMPTY per audit) ---
  // 2x prop-bones (remains of crushed sinners)
  editor.spawnProp(LEVEL_ID, 'prop-bones', 19, 35, { roomId: weightRoomId });
  editor.spawnProp(LEVEL_ID, 'prop-bones', 24, 31, { roomId: weightRoomId });
  // 2x prop-skull (among bones)
  editor.spawnProp(LEVEL_ID, 'prop-skull', 18, 31, { roomId: weightRoomId });
  editor.spawnProp(LEVEL_ID, 'prop-skull', 25, 35, { roomId: weightRoomId });
  // 2x prop-torch-mounted (walls, desperately needed lighting)
  editor.spawnProp(LEVEL_ID, 'prop-torch-mounted', 17, 32, {
    roomId: weightRoomId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'prop-torch-mounted', 26, 32, {
    roomId: weightRoomId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });

  // --- Reliquary (bounds: 2, 32, 6, 6) ---
  // Structural: 1x greed-vault-arch (hidden entrance)
  editor.spawnProp(LEVEL_ID, 'greed-vault-arch', 2, 35, { roomId: reliquaryId });
  // 1x greed-golden-key-display (north wall)
  editor.spawnProp(LEVEL_ID, 'greed-golden-key-display', 4, 33, { roomId: reliquaryId });
  // 1x greed-jeweled-pedestal + 1x greed-treasure-chest (center)
  editor.spawnProp(LEVEL_ID, 'greed-jeweled-pedestal', 4, 35, { roomId: reliquaryId });
  editor.spawnProp(LEVEL_ID, 'greed-treasure-chest', 4, 35, { roomId: reliquaryId });
  // 2x greed-golden-chalice (south shelf)
  editor.spawnProp(LEVEL_ID, 'greed-golden-chalice', 3, 36, { roomId: reliquaryId });
  editor.spawnProp(LEVEL_ID, 'greed-golden-chalice', 6, 36, { roomId: reliquaryId });
  // --- Playtest density audit addition ---
  // 1x prop-pedestal under treasure chest (elevates the hero piece)
  editor.spawnProp(LEVEL_ID, 'prop-pedestal', 4, 35, { roomId: reliquaryId });

  // --- Auction Hall (bounds: 16, 42, 12, 12) ---
  // 4x greed-gold-pillar (structural, destructible)
  editor.spawnProp(LEVEL_ID, 'greed-gold-pillar', 19, 45, { roomId: auctionHallId });
  editor.spawnProp(LEVEL_ID, 'greed-gold-pillar', 25, 45, { roomId: auctionHallId });
  editor.spawnProp(LEVEL_ID, 'greed-gold-pillar', 19, 51, { roomId: auctionHallId });
  editor.spawnProp(LEVEL_ID, 'greed-gold-pillar', 25, 51, { roomId: auctionHallId });
  // 4x coin-pile (at pillar bases, destructible triggers)
  editor.spawnProp(LEVEL_ID, 'coin-pile', 19, 45, { roomId: auctionHallId });
  editor.spawnProp(LEVEL_ID, 'coin-pile', 25, 45, { roomId: auctionHallId });
  editor.spawnProp(LEVEL_ID, 'coin-pile', 19, 51, { roomId: auctionHallId });
  editor.spawnProp(LEVEL_ID, 'coin-pile', 25, 51, { roomId: auctionHallId });
  // 2x greed-golden-banner (walls)
  editor.spawnProp(LEVEL_ID, 'greed-golden-banner', 17, 43, {
    roomId: auctionHallId,
    surfaceAnchor: {
      face: 'north',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'greed-golden-banner', 27, 53, {
    roomId: auctionHallId,
    surfaceAnchor: {
      face: 'south',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 2x greed-treasure-chest (edge decoration)
  editor.spawnProp(LEVEL_ID, 'greed-treasure-chest', 17, 51, { roomId: auctionHallId });
  editor.spawnProp(LEVEL_ID, 'greed-treasure-chest', 27, 45, { roomId: auctionHallId });
  // 2x coin-pile (floor scatter, edge fill)
  editor.spawnProp(LEVEL_ID, 'coin-pile', 17, 48, { roomId: auctionHallId });
  editor.spawnProp(LEVEL_ID, 'coin-pile', 27, 48, { roomId: auctionHallId });
  // 2x greed-golden-vase (corners)
  editor.spawnProp(LEVEL_ID, 'greed-golden-vase', 16, 43, { roomId: auctionHallId });
  editor.spawnProp(LEVEL_ID, 'greed-golden-vase', 28, 53, { roomId: auctionHallId });
  // --- Playtest density audit additions ---
  // 1x prop-column (center north, structural accent)
  editor.spawnProp(LEVEL_ID, 'prop-column', 22, 44, { roomId: auctionHallId });
  // 3x prop-broken-pot (scattered debris, evidence of past violence)
  editor.spawnProp(LEVEL_ID, 'prop-broken-pot', 18, 48, { roomId: auctionHallId });
  editor.spawnProp(LEVEL_ID, 'prop-broken-pot', 26, 46, { roomId: auctionHallId });
  editor.spawnProp(LEVEL_ID, 'prop-broken-pot', 21, 52, { roomId: auctionHallId });

  // --- Boss chamber: Aureo's Court (bounds: 15, 58, 14, 14) ---
  // Structural: 1x greed-golden-throne (north-center dais)
  editor.spawnProp(LEVEL_ID, 'greed-golden-throne', 22, 59, { roomId: aureosCourtId });
  // Structural: 1x greed-vault-arch (entrance)
  editor.spawnProp(LEVEL_ID, 'greed-vault-arch', 22, 58, { roomId: aureosCourtId });
  // 6x greed-golden-candelabra (perimeter ring)
  editor.spawnProp(LEVEL_ID, 'greed-golden-candelabra', 17, 60, { roomId: aureosCourtId });
  editor.spawnProp(LEVEL_ID, 'greed-golden-candelabra', 27, 60, { roomId: aureosCourtId });
  editor.spawnProp(LEVEL_ID, 'greed-golden-candelabra', 17, 65, { roomId: aureosCourtId });
  editor.spawnProp(LEVEL_ID, 'greed-golden-candelabra', 27, 65, { roomId: aureosCourtId });
  editor.spawnProp(LEVEL_ID, 'greed-golden-candelabra', 17, 70, { roomId: aureosCourtId });
  editor.spawnProp(LEVEL_ID, 'greed-golden-candelabra', 27, 70, { roomId: aureosCourtId });
  // 4x greed-gold-chain (hanging from ceiling)
  editor.spawnProp(LEVEL_ID, 'greed-gold-chain', 19, 61, { roomId: aureosCourtId });
  editor.spawnProp(LEVEL_ID, 'greed-gold-chain', 25, 61, { roomId: aureosCourtId });
  editor.spawnProp(LEVEL_ID, 'greed-gold-chain', 19, 69, { roomId: aureosCourtId });
  editor.spawnProp(LEVEL_ID, 'greed-gold-chain', 25, 69, { roomId: aureosCourtId });
  // 2x greed-golden-banner (flanking throne)
  editor.spawnProp(LEVEL_ID, 'greed-golden-banner', 20, 59, {
    roomId: aureosCourtId,
    surfaceAnchor: {
      face: 'north',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'greed-golden-banner', 24, 59, {
    roomId: aureosCourtId,
    surfaceAnchor: {
      face: 'north',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 8x coin-pile (floor scatter)
  editor.spawnProp(LEVEL_ID, 'coin-pile', 18, 63, { roomId: aureosCourtId });
  editor.spawnProp(LEVEL_ID, 'coin-pile', 26, 63, { roomId: aureosCourtId });
  editor.spawnProp(LEVEL_ID, 'coin-pile', 18, 68, { roomId: aureosCourtId });
  editor.spawnProp(LEVEL_ID, 'coin-pile', 26, 68, { roomId: aureosCourtId });
  editor.spawnProp(LEVEL_ID, 'coin-pile', 22, 62, { roomId: aureosCourtId });
  editor.spawnProp(LEVEL_ID, 'coin-pile', 22, 67, { roomId: aureosCourtId });
  editor.spawnProp(LEVEL_ID, 'coin-pile', 19, 65, { roomId: aureosCourtId });
  editor.spawnProp(LEVEL_ID, 'coin-pile', 25, 65, { roomId: aureosCourtId });
  // 2x greed-coin-cascade (near throne dais)
  editor.spawnProp(LEVEL_ID, 'greed-coin-cascade', 21, 59, { roomId: aureosCourtId });
  editor.spawnProp(LEVEL_ID, 'greed-coin-cascade', 23, 59, { roomId: aureosCourtId });
  // 2x greed-golden-vase (perimeter)
  editor.spawnProp(LEVEL_ID, 'greed-golden-vase', 17, 60, { roomId: aureosCourtId });
  editor.spawnProp(LEVEL_ID, 'greed-golden-vase', 27, 60, { roomId: aureosCourtId });
  // --- Playtest density audit additions ---
  // 2x prop-column flanking throne (structural gravitas)
  editor.spawnProp(LEVEL_ID, 'prop-column', 19, 59, { roomId: aureosCourtId });
  editor.spawnProp(LEVEL_ID, 'prop-column', 25, 59, { roomId: aureosCourtId });
  // 1x prop-chest-gold (throne-side treasure display)
  editor.spawnProp(LEVEL_ID, 'prop-chest-gold', 22, 60, { roomId: aureosCourtId });

  // =========================================================================
  // 5d. DECALS (from design doc Scratches004 + Fingerprints002 mappings)
  // =========================================================================

  // --- Vault Entrance: fingerprint stains near coin-piles and treasure chest ---
  editor.placeDecals(LEVEL_ID, vaultEntranceId, [
    { type: DECAL_TYPES.WATER_STAIN, x: 20, z: 3, opacity: 0.3 },
    { type: DECAL_TYPES.WATER_STAIN, x: 23, z: 4, opacity: 0.3 },
  ]);

  // --- Treasury: clawing marks on walls + fingerprints near treasure chests ---
  editor.placeDecals(LEVEL_ID, treasuryId, [
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 15, z: 16, surface: 'wall' },
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 29, z: 16, surface: 'wall' },
    { type: DECAL_TYPES.WATER_STAIN, x: 18, z: 15, opacity: 0.3 },
    { type: DECAL_TYPES.WATER_STAIN, x: 27, z: 19, opacity: 0.3 },
  ]);

  // --- Weight Room: desperate clawing on walls near floor ---
  editor.placeDecals(LEVEL_ID, weightRoomId, [
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 17, z: 32, surface: 'wall' },
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 27, z: 32, surface: 'wall' },
  ]);

  // --- Auction Hall: clawing marks + fingerprints near treasure ---
  editor.placeDecals(LEVEL_ID, auctionHallId, [
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 16, z: 48, surface: 'wall' },
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 28, z: 48, surface: 'wall' },
    { type: DECAL_TYPES.WATER_STAIN, x: 17, z: 51, opacity: 0.3 },
    { type: DECAL_TYPES.WATER_STAIN, x: 27, z: 45, opacity: 0.3 },
  ]);

  // --- Aureo's Court: clawing marks + fingerprints near coin cascades ---
  editor.placeDecals(LEVEL_ID, aureosCourtId, [
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 15, z: 63, surface: 'wall' },
    { type: DECAL_TYPES.CONCRETE_CRACK, x: 29, z: 63, surface: 'wall' },
    { type: DECAL_TYPES.WATER_STAIN, x: 21, z: 59, opacity: 0.3 },
    { type: DECAL_TYPES.WATER_STAIN, x: 23, z: 59, opacity: 0.3 },
  ]);

  // =========================================================================
  // 6. TRIGGERS (from "Triggers" table)
  // =========================================================================
  //
  // NOTE: T4-T7 (Auction Hall arena lock/wave/unlock) were created by setupArenaWaves() above.
  //
  // Remaining triggers:

  // T1: Treasury showHint -- balcony temptation
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.DIALOGUE,
    zoneX: 16,
    zoneZ: 13,
    zoneW: 12,
    zoneH: 2,
    roomId: treasuryId,
    once: true,
    actionData: { text: 'The balcony gleams with ammunition. But weight has consequence here.' },
  });

  // T2: Weight Room activatePressurePlates (custom trigger)
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.PLATFORM_MOVE,
    zoneX: 18,
    zoneZ: 29,
    zoneW: 8,
    zoneH: 8,
    roomId: weightRoomId,
    once: false,
    actionData: { sinkRate: 0.5, sinkDepth: -1, condition: 'ammoAbove150' },
  });

  // T3: Weight Room showHint -- "The floor groans..."
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.DIALOGUE,
    zoneX: 18,
    zoneZ: 29,
    zoneW: 8,
    zoneH: 8,
    roomId: weightRoomId,
    once: true,
    actionData: { text: 'The floor groans beneath your burden. Let go.' },
  });

  // T8: destroyPillar triggers (4 pillars in Auction Hall)
  // P1-P4 positions: (19,45), (24,45), (19,50), (24,50)
  for (let i = 0; i < 4; i++) {
    const px = [19, 24, 19, 24][i];
    const pz = [45, 45, 50, 50][i];
    editor.addTrigger(LEVEL_ID, {
      action: TRIGGER_ACTIONS.PLATFORM_MOVE,
      zoneX: px,
      zoneZ: pz,
      zoneW: 1,
      zoneH: 1,
      roomId: auctionHallId,
      once: true,
      actionData: { pillarId: i + 1, rubbleElevation: 0.5, condition: 'coinPileDestroyed' },
    });
  }

  // T9: Boss intro -- player enters boss chamber entrance zone
  //   Zone from table: (16, 59, 12, 2)
  editor.bossIntro(
    LEVEL_ID,
    { x: 16, z: 59, w: 12, h: 2 },
    'Everything you carry was taken from another. I will take it from you.',
    { roomId: aureosCourtId },
  );

  // T10: lockDoors on boss intro (with 3s delay)
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.LOCK_DOORS,
    zoneX: 16,
    zoneZ: 59,
    zoneW: 12,
    zoneH: 2,
    roomId: aureosCourtId,
    once: true,
    delay: 3,
  });

  // T11: bossPhase2 when boss HP < 66%
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 15,
    zoneZ: 58,
    zoneW: 14,
    zoneH: 14,
    roomId: aureosCourtId,
    once: true,
    actionData: { condition: 'bossHpBelow66', action: 'stealWeapon', interval: 20 },
  });

  // T12: bossPhase3 when boss HP < 33%
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 15,
    zoneZ: 58,
    zoneW: 14,
    zoneH: 14,
    roomId: aureosCourtId,
    once: true,
    actionData: {
      condition: 'bossHpBelow33',
      action: 'stealAllWeapons',
      scatterPositions: [
        [16, 59],
        [27, 59],
        [16, 70],
        [27, 70],
      ],
    },
  });

  // =========================================================================
  // 7. ENVIRONMENT ZONES (from "Environment Zones" table)
  // =========================================================================

  // Global warmth: full level, ambientTint, intensity 0.6
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.FIRE,
    boundsX: 0,
    boundsZ: 0,
    boundsW: 44,
    boundsH: 66,
    intensity: 0.6,
  });

  // Weight Room creak SFX zone
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.WIND,
    boundsX: 18,
    boundsZ: 29,
    boundsW: 8,
    boundsH: 8,
    intensity: 0.5,
  });

  // Boss coin storm particle zone
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.FIRE,
    boundsX: 15,
    boundsZ: 58,
    boundsW: 14,
    boundsH: 14,
    intensity: 0.4,
  });

  // =========================================================================
  // 8. PLAYER SPAWN (from "Player Spawn" section)
  // =========================================================================
  //   Position: (22, 5) -- center of Vault Entrance
  //   Facing: pi (south -- facing toward Treasury)

  editor.setPlayerSpawn(LEVEL_ID, 22, 5, Math.PI);

  // =========================================================================
  // EXPANSION: 6 NEW ROOMS + CONNECTIONS + ENEMIES + PICKUPS + TRIGGERS
  //
  // Existing room footprints (x_min..x_max, z_min..z_max):
  //   vault_entrance : x=18..25, z=2..7
  //   treasury       : x=15..28, z=12..23
  //   weight_room    : x=17..26, z=28..37
  //   reliquary      : x=2..7,   z=32..37
  //   auction_hall   : x=16..27, z=42..53
  //   aureos_court   : x=15..28, z=58..71
  //
  // New rooms placed in open grid areas (no overlaps):
  //   coin_counting_room : x=30, z=12, w=10, h=10  → x=30..39, z=12..21
  //   vault_annex        : x=0,  z=12, w=10, h=10  → x=0..9,   z=12..21
  //   guard_barracks     : x=30, z=24, w=10, h=10  → x=30..39, z=24..33 (connected from weight_room east)
  //   offering_chamber   : x=0,  z=22, w=10, h=10  → x=0..9,   z=22..31
  //   smelting_chamber   : x=0,  z=42, w=12, h=12  → x=0..11,  z=42..53
  //   deep_vault         : x=30, z=42, w=10, h=10  → x=30..39, z=42..51
  // =========================================================================

  // ── NEW ROOMS ─────────────────────────────────────────────────────────────

  // Coin Counting Room (x=30, z=12, w=10, h=10)
  // Guards count and sort the hoard. Rows of ledger-desks piled with coins.
  const coinCountingRoomId = editor.room(LEVEL_ID, 'coin_counting_room', 30, 12, 10, 10, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 6,
    floorTexture: 'tiles',
    wallTexture: 'marble',
    fillRule: {
      type: 'scatter',
      props: ['coin-pile', 'greed-coin-cascade', 'greed-gold-bar-stack'],
      density: 0.35,
    },
  });

  // Vault Annex (x=0, z=12, w=10, h=10)
  // A dusty overflow annex crammed with confiscated treasures.
  const vaultAnnexId = editor.room(LEVEL_ID, 'vault_annex', 0, 12, 10, 10, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 7,
    floorTexture: 'stone',
    wallTexture: 'tiles',
    fillRule: {
      type: 'scatter',
      props: ['greed-treasure-chest', 'greed-jeweled-pedestal', 'coin-pile'],
      density: 0.25,
    },
  });

  // Guard Barracks (x=30, z=24, w=10, h=10)
  // Elite goatKnight garrison connected from the Weight Room to the east.
  // Armor racks, coin piles, the stench of gold.
  const guardBarracksId = editor.room(LEVEL_ID, 'guard_barracks', 30, 24, 10, 10, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 8,
    floorTexture: 'marble',
    wallTexture: 'marble',
    fillRule: {
      type: 'scatter',
      props: ['greed-weapon-pedestal', 'greed-safe-door', 'coin-pile'],
      density: 0.15,
    },
  });

  // Offering Chamber (x=0, z=22, w=10, h=10)
  // Sinners left offerings here. Altars bear idols and chalices.
  // NOTE: shifted north to z=22 to avoid overlapping reliquary (x=2..7, z=32..37)
  const offeringChamberId = editor.room(LEVEL_ID, 'offering_chamber', 0, 22, 10, 10, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 9,
    floorTexture: 'tiles',
    wallTexture: 'marble',
    fillRule: {
      type: 'scatter',
      props: ['golden-idol', 'greed-golden-chalice', 'greed-golden-vase'],
      density: 0.2,
    },
  });

  // Smelting Chamber (x=0, z=42, w=12, h=12)
  // Molten gold poured endlessly into useless molds. Arena ambush.
  const smeltingChamberId = editor.room(LEVEL_ID, 'smelting_chamber', 0, 42, 12, 12, {
    roomType: ROOM_TYPES.ARENA,
    elevation: 0,
    sortOrder: 10,
    floorTexture: 'metal',
    wallTexture: 'tiles',
    fillRule: {
      type: 'scatter',
      props: ['coin-pile', 'greed-gold-bar-stack', 'greed-coin-cascade'],
      density: 0.2,
    },
  });

  // Deep Vault (x=30, z=42, w=10, h=10)
  // The innermost sanctum of Aureo's hoard. Heavily guarded. Weapon pickup reward.
  const deepVaultId = editor.room(LEVEL_ID, 'deep_vault', 30, 42, 10, 10, {
    roomType: ROOM_TYPES.SECRET,
    elevation: 0,
    sortOrder: 11,
    floorTexture: 'marble',
    wallTexture: 'marble',
    fillRule: {
      type: 'scatter',
      props: ['greed-treasure-chest', 'greed-chest-pedestal', 'golden-idol'],
      density: 0.3,
    },
  });

  // ── NEW CONNECTIONS ───────────────────────────────────────────────────────

  // Treasury (center: 22,18) -> Coin Counting Room (center: 35,17): east branch
  editor.corridor(LEVEL_ID, treasuryId, coinCountingRoomId, 2);

  // Treasury (center: 22,18) -> Vault Annex (center: 5,17): west branch
  editor.corridor(LEVEL_ID, treasuryId, vaultAnnexId, 2);

  // Weight Room (center: 22,33) -> Guard Barracks (center: 35,29): east branch
  // NOTE: using weight_room as anchor avoids the tight z=22-23 gap issue
  editor.corridor(LEVEL_ID, weightRoomId, guardBarracksId, 2);

  // Vault Annex (center: 5,17) -> Offering Chamber (center: 5,27): south
  editor.corridor(LEVEL_ID, vaultAnnexId, offeringChamberId, 2);

  // Auction Hall (center: 22,48) -> Smelting Chamber (center: 6,48): west branch
  editor.corridor(LEVEL_ID, auctionHallId, smeltingChamberId, 2);

  // Auction Hall (center: 22,48) -> Deep Vault (center: 35,47): secret east branch
  editor.connect(LEVEL_ID, auctionHallId, deepVaultId, {
    connectionType: CONNECTION_TYPES.SECRET,
    corridorWidth: 2,
  });

  // ── NEW ENEMIES ───────────────────────────────────────────────────────────
  //
  // Coin Counting Room (x=30, z=12, w=10, h=10) interior: x=[31..38], z=[13..20]
  // 5 hoarderElder counting guards + 2 hellgoat -- packed with hostile accountants

  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HOARDER_ELDER, 33, 15, {
    roomId: coinCountingRoomId,
    patrol: [
      { x: 33, z: 14 },
      { x: 33, z: 19 },
      { x: 37, z: 19 },
      { x: 37, z: 14 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HOARDER_ELDER, 37, 19, {
    roomId: coinCountingRoomId,
    patrol: [
      { x: 37, z: 19 },
      { x: 37, z: 14 },
      { x: 33, z: 14 },
      { x: 33, z: 19 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HOARDER_ELDER, 31, 14, {
    roomId: coinCountingRoomId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HOARDER_ELDER, 38, 19, {
    roomId: coinCountingRoomId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HOARDER_ELDER, 34, 13, {
    roomId: coinCountingRoomId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HOARDER, 35, 17, {
    roomId: coinCountingRoomId,
    patrol: [
      { x: 32, z: 17 },
      { x: 38, z: 17 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HOARDER, 31, 19, {
    roomId: coinCountingRoomId,
  });

  // Vault Annex (x=0, z=12, w=10, h=10) interior: x=[1..8], z=[13..20]
  // 3 hoarderElder overseers and 2 hellgoat scouts -- cramped annex patrol

  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HOARDER_ELDER, 3, 15, {
    roomId: vaultAnnexId,
    patrol: [
      { x: 3, z: 14 },
      { x: 3, z: 20 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HOARDER_ELDER, 7, 18, {
    roomId: vaultAnnexId,
    patrol: [
      { x: 7, z: 14 },
      { x: 7, z: 20 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HOARDER_ELDER, 5, 14, {
    roomId: vaultAnnexId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HOARDER, 5, 17, {
    roomId: vaultAnnexId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HOARDER, 8, 14, {
    roomId: vaultAnnexId,
  });

  // Guard Barracks (x=30, z=24, w=10, h=10) interior: x=[31..38], z=[25..32]
  // 4 hoarderElder + 2 hellgoat
  // All placed in the center of the room (x=33..36, z=26..30) away from all walls

  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HOARDER_ELDER, 33, 27, {
    roomId: guardBarracksId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HOARDER_ELDER, 36, 27, {
    roomId: guardBarracksId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HOARDER_ELDER, 33, 30, {
    roomId: guardBarracksId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HOARDER_ELDER, 36, 30, {
    roomId: guardBarracksId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HOARDER, 34, 26, {
    roomId: guardBarracksId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HOARDER, 35, 29, {
    roomId: guardBarracksId,
  });

  // Offering Chamber (x=0, z=22, w=10, h=10) interior: x=[1..8], z=[23..30]
  // 4 pre-placed guards defending the idols (no ambush trigger to avoid corridor blockage)

  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HOARDER_ELDER, 3, 25, {
    roomId: offeringChamberId,
    patrol: [
      { x: 3, z: 24 },
      { x: 3, z: 29 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HOARDER_ELDER, 7, 28, {
    roomId: offeringChamberId,
    patrol: [
      { x: 7, z: 24 },
      { x: 7, z: 29 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HOARDER, 5, 27, {
    roomId: offeringChamberId,
    patrol: [
      { x: 3, z: 27 },
      { x: 7, z: 27 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HOARDER, 6, 24, {
    roomId: offeringChamberId,
  });

  // Smelting Chamber (x=0, z=42, w=12, h=12) interior: x=[1..10], z=[43..52]
  // 3 pre-placed smelter guards + Arena: 2 waves of greed guardians

  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HOARDER_ELDER, 3, 50, {
    roomId: smeltingChamberId,
    patrol: [
      { x: 3, z: 44 },
      { x: 3, z: 51 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HOARDER_ELDER, 9, 45, {
    roomId: smeltingChamberId,
    patrol: [
      { x: 9, z: 44 },
      { x: 9, z: 51 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HOARDER, 6, 47, {
    roomId: smeltingChamberId,
  });

  // Arena: 2 waves of greed guardians defending the smelters
  editor.setupArenaWaves(LEVEL_ID, smeltingChamberId, { x: 1, z: 43, w: 10, h: 2 }, [
    // Wave 1: 2 hoarderElder (N, S) + 2 hellgoat (E, W)
    [
      { type: ENEMY_TYPES.HOARDER_ELDER, x: 6, z: 44 },
      { type: ENEMY_TYPES.HOARDER_ELDER, x: 6, z: 51 },
      { type: ENEMY_TYPES.HOARDER, x: 1, z: 47 },
      { type: ENEMY_TYPES.HOARDER, x: 10, z: 47 },
    ],
    // Wave 2: 3 hoarderElder (corners + center) + 2 hellgoat (flanking)
    [
      { type: ENEMY_TYPES.HOARDER_ELDER, x: 2, z: 44 },
      { type: ENEMY_TYPES.HOARDER_ELDER, x: 10, z: 51 },
      { type: ENEMY_TYPES.HOARDER_ELDER, x: 6, z: 48 },
      { type: ENEMY_TYPES.HOARDER, x: 2, z: 51 },
      { type: ENEMY_TYPES.HOARDER, x: 10, z: 44 },
    ],
  ]);

  // Deep Vault (x=30, z=42, w=10, h=10) interior: x=[31..38], z=[43..50]
  // No enemies — this is a pure loot room reached via secret passage.
  // In a SECRET room the PlaytestRunner cannot path here (WALL_SECRET blocks A*),
  // so placing enemies would keep them permanently in enemiesAlive and cause a softlock.
  // The reward is the weapon pickup below. In real gameplay the player may find it
  // by discovering the secret wall in the auction hall.

  // ── NEW PICKUPS ───────────────────────────────────────────────────────────

  // Coin Counting Room: ammo x 3 spread, health x 1
  //   interior: x=[31..38], z=[13..20]
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 32, 14);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 36, 17);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 32, 20);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 35, 19);

  // Vault Annex: ammo x 2, health x 1
  //   interior: x=[1..8], z=[13..20]
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 3, 14);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 7, 19);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 5, 19);

  // Guard Barracks: ammo x 3
  //   interior: x=[31..38], z=[25..32]
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 32, 26);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 37, 30);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 34, 28);

  // Offering Chamber: ammo x 2, health x 1
  //   interior: x=[1..8], z=[23..30]
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 2, 25);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 7, 29);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 4, 29);

  // Smelting Chamber: ammo x 3, health x 1 (between arena waves)
  //   interior: x=[1..10], z=[43..52]
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 3, 48);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 9, 48);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 6, 52);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 6, 45);

  // Deep Vault: weapon cannon reward (the point of the secret room) + ammo x 2
  //   interior: x=[31..38], z=[43..50]
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.WEAPON_CANNON, 35, 47);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 31, 44);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 38, 49);

  // ── NEW PROPS ─────────────────────────────────────────────────────────────

  // --- Coin Counting Room (bounds: 30, 12, 10, 10) ---
  // 4x greed-gold-bar-stack (counting rows)
  editor.spawnProp(LEVEL_ID, 'greed-gold-bar-stack', 32, 14, { roomId: coinCountingRoomId });
  editor.spawnProp(LEVEL_ID, 'greed-gold-bar-stack', 32, 17, { roomId: coinCountingRoomId });
  editor.spawnProp(LEVEL_ID, 'greed-gold-bar-stack', 36, 14, { roomId: coinCountingRoomId });
  editor.spawnProp(LEVEL_ID, 'greed-gold-bar-stack', 36, 17, { roomId: coinCountingRoomId });
  // 4x coin-pile
  editor.spawnProp(LEVEL_ID, 'coin-pile', 33, 15, { roomId: coinCountingRoomId });
  editor.spawnProp(LEVEL_ID, 'coin-pile', 35, 19, { roomId: coinCountingRoomId });
  editor.spawnProp(LEVEL_ID, 'coin-pile', 37, 15, { roomId: coinCountingRoomId });
  editor.spawnProp(LEVEL_ID, 'coin-pile', 31, 19, { roomId: coinCountingRoomId });
  // 2x greed-coin-cascade (corner displays)
  editor.spawnProp(LEVEL_ID, 'greed-coin-cascade', 31, 13, { roomId: coinCountingRoomId });
  editor.spawnProp(LEVEL_ID, 'greed-coin-cascade', 38, 20, { roomId: coinCountingRoomId });
  // 2x greed-golden-candelabra (lighting)
  editor.spawnProp(LEVEL_ID, 'greed-golden-candelabra', 31, 13, { roomId: coinCountingRoomId });
  editor.spawnProp(LEVEL_ID, 'greed-golden-candelabra', 38, 13, { roomId: coinCountingRoomId });

  // --- Vault Annex (bounds: 0, 12, 10, 10) ---
  // 3x greed-treasure-chest
  editor.spawnProp(LEVEL_ID, 'greed-treasure-chest', 2, 14, { roomId: vaultAnnexId });
  editor.spawnProp(LEVEL_ID, 'greed-treasure-chest', 6, 14, { roomId: vaultAnnexId });
  editor.spawnProp(LEVEL_ID, 'greed-treasure-chest', 4, 20, { roomId: vaultAnnexId });
  // 3x greed-jeweled-pedestal
  editor.spawnProp(LEVEL_ID, 'greed-jeweled-pedestal', 2, 18, { roomId: vaultAnnexId });
  editor.spawnProp(LEVEL_ID, 'greed-jeweled-pedestal', 7, 17, { roomId: vaultAnnexId });
  editor.spawnProp(LEVEL_ID, 'greed-jeweled-pedestal', 4, 15, { roomId: vaultAnnexId });
  // 4x coin-pile
  editor.spawnProp(LEVEL_ID, 'coin-pile', 3, 16, { roomId: vaultAnnexId });
  editor.spawnProp(LEVEL_ID, 'coin-pile', 6, 19, { roomId: vaultAnnexId });
  editor.spawnProp(LEVEL_ID, 'coin-pile', 8, 15, { roomId: vaultAnnexId });
  editor.spawnProp(LEVEL_ID, 'coin-pile', 1, 20, { roomId: vaultAnnexId });
  // 1x greed-golden-key-display (north wall)
  editor.spawnProp(LEVEL_ID, 'greed-golden-key-display', 5, 13, { roomId: vaultAnnexId });

  // --- Guard Barracks (bounds: 30, 24, 10, 10) ---
  // Minimal props -- east side only to keep west/center pathways clear
  // 4x coin-pile (east side floor scatter)
  editor.spawnProp(LEVEL_ID, 'coin-pile', 37, 26, { roomId: guardBarracksId });
  editor.spawnProp(LEVEL_ID, 'coin-pile', 38, 29, { roomId: guardBarracksId });
  editor.spawnProp(LEVEL_ID, 'coin-pile', 36, 31, { roomId: guardBarracksId });
  editor.spawnProp(LEVEL_ID, 'coin-pile', 35, 28, { roomId: guardBarracksId });
  // 2x greed-golden-banner (walls)
  editor.spawnProp(LEVEL_ID, 'greed-golden-banner', 31, 25, {
    roomId: guardBarracksId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'greed-golden-banner', 38, 32, {
    roomId: guardBarracksId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });

  // --- Offering Chamber (bounds: 0, 22, 10, 10) interior: x=[1..8], z=[23..30] ---
  // 3x golden-idol (altar display)
  editor.spawnProp(LEVEL_ID, 'golden-idol', 2, 24, { roomId: offeringChamberId });
  editor.spawnProp(LEVEL_ID, 'golden-idol', 5, 23, { roomId: offeringChamberId });
  editor.spawnProp(LEVEL_ID, 'golden-idol', 8, 24, { roomId: offeringChamberId });
  // 4x greed-golden-chalice
  editor.spawnProp(LEVEL_ID, 'greed-golden-chalice', 2, 28, { roomId: offeringChamberId });
  editor.spawnProp(LEVEL_ID, 'greed-golden-chalice', 4, 30, { roomId: offeringChamberId });
  editor.spawnProp(LEVEL_ID, 'greed-golden-chalice', 7, 27, { roomId: offeringChamberId });
  editor.spawnProp(LEVEL_ID, 'greed-golden-chalice', 8, 30, { roomId: offeringChamberId });
  // 3x greed-chest-pedestal + coin-pile
  editor.spawnProp(LEVEL_ID, 'greed-chest-pedestal', 3, 26, { roomId: offeringChamberId });
  editor.spawnProp(LEVEL_ID, 'greed-chest-pedestal', 7, 25, { roomId: offeringChamberId });
  editor.spawnProp(LEVEL_ID, 'coin-pile', 5, 26, { roomId: offeringChamberId });
  editor.spawnProp(LEVEL_ID, 'coin-pile', 3, 29, { roomId: offeringChamberId });

  // --- Smelting Chamber (bounds: 0, 42, 12, 12) ---
  // 4x greed-gold-pillar (arena cover)
  editor.spawnProp(LEVEL_ID, 'greed-gold-pillar', 3, 45, { roomId: smeltingChamberId });
  editor.spawnProp(LEVEL_ID, 'greed-gold-pillar', 9, 45, { roomId: smeltingChamberId });
  editor.spawnProp(LEVEL_ID, 'greed-gold-pillar', 3, 51, { roomId: smeltingChamberId });
  editor.spawnProp(LEVEL_ID, 'greed-gold-pillar', 9, 51, { roomId: smeltingChamberId });
  // 6x coin-pile
  editor.spawnProp(LEVEL_ID, 'coin-pile', 1, 44, { roomId: smeltingChamberId });
  editor.spawnProp(LEVEL_ID, 'coin-pile', 10, 44, { roomId: smeltingChamberId });
  editor.spawnProp(LEVEL_ID, 'coin-pile', 1, 51, { roomId: smeltingChamberId });
  editor.spawnProp(LEVEL_ID, 'coin-pile', 10, 51, { roomId: smeltingChamberId });
  editor.spawnProp(LEVEL_ID, 'coin-pile', 5, 48, { roomId: smeltingChamberId });
  editor.spawnProp(LEVEL_ID, 'coin-pile', 7, 48, { roomId: smeltingChamberId });
  // 2x greed-gold-bar-stack (smelting output)
  editor.spawnProp(LEVEL_ID, 'greed-gold-bar-stack', 2, 47, { roomId: smeltingChamberId });
  editor.spawnProp(LEVEL_ID, 'greed-gold-bar-stack', 9, 50, { roomId: smeltingChamberId });
  // 2x greed-golden-candelabra
  editor.spawnProp(LEVEL_ID, 'greed-golden-candelabra', 1, 43, { roomId: smeltingChamberId });
  editor.spawnProp(LEVEL_ID, 'greed-golden-candelabra', 10, 43, { roomId: smeltingChamberId });

  // --- Deep Vault (bounds: 30, 42, 10, 10) ---
  // 4x greed-treasure-chest (the prize pile)
  editor.spawnProp(LEVEL_ID, 'greed-treasure-chest', 32, 44, { roomId: deepVaultId });
  editor.spawnProp(LEVEL_ID, 'greed-treasure-chest', 37, 44, { roomId: deepVaultId });
  editor.spawnProp(LEVEL_ID, 'greed-treasure-chest', 32, 49, { roomId: deepVaultId });
  editor.spawnProp(LEVEL_ID, 'greed-treasure-chest', 37, 49, { roomId: deepVaultId });
  // 2x greed-jeweled-pedestal (weapon display)
  editor.spawnProp(LEVEL_ID, 'greed-jeweled-pedestal', 34, 47, { roomId: deepVaultId });
  editor.spawnProp(LEVEL_ID, 'greed-jeweled-pedestal', 36, 47, { roomId: deepVaultId });
  // 4x golden-idol
  editor.spawnProp(LEVEL_ID, 'golden-idol', 31, 44, { roomId: deepVaultId });
  editor.spawnProp(LEVEL_ID, 'golden-idol', 38, 44, { roomId: deepVaultId });
  editor.spawnProp(LEVEL_ID, 'golden-idol', 31, 49, { roomId: deepVaultId });
  editor.spawnProp(LEVEL_ID, 'golden-idol', 38, 49, { roomId: deepVaultId });
  // 4x coin-pile
  editor.spawnProp(LEVEL_ID, 'coin-pile', 33, 46, { roomId: deepVaultId });
  editor.spawnProp(LEVEL_ID, 'coin-pile', 36, 46, { roomId: deepVaultId });
  editor.spawnProp(LEVEL_ID, 'coin-pile', 33, 49, { roomId: deepVaultId });
  editor.spawnProp(LEVEL_ID, 'coin-pile', 36, 49, { roomId: deepVaultId });
  // 2x greed-golden-candelabra
  editor.spawnProp(LEVEL_ID, 'greed-golden-candelabra', 31, 43, { roomId: deepVaultId });
  editor.spawnProp(LEVEL_ID, 'greed-golden-candelabra', 38, 43, { roomId: deepVaultId });
  // 1x greed-golden-banner (north wall, ceremonial)
  editor.spawnProp(LEVEL_ID, 'greed-golden-banner', 35, 42, {
    roomId: deepVaultId,
    surfaceAnchor: {
      face: 'north',
      offsetX: 0,
      offsetY: 2.0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });

  // ── DEEP VAULT ENEMIES (jump-scare guardians behind the secret wall) ───────
  // 4 hoarderElder elite guards stationed around the hoard.
  // These ARE correct here — PlaytestRunner now traverses WALL_SECRET cells,
  // so the simulation agent will find and kill them through the secret passage.
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HOARDER_ELDER, 32, 44, { roomId: deepVaultId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HOARDER_ELDER, 37, 44, { roomId: deepVaultId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HOARDER_ELDER, 32, 49, { roomId: deepVaultId });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HOARDER_ELDER, 37, 49, { roomId: deepVaultId });
  // Ambush: 2 more elders emerge when player enters the inner sanctum
  editor.ambush(
    LEVEL_ID,
    { x: 30, z: 42, w: 10, h: 10 },
    [
      { type: ENEMY_TYPES.HOARDER_ELDER, x: 34, z: 46 },
      { type: ENEMY_TYPES.HOARDER_ELDER, x: 35, z: 46 },
    ],
    { roomId: deepVaultId },
  );

  // ── NEW TRIGGERS ──────────────────────────────────────────────────────────

  // Coin Counting Room: dialogue hint -- "They count what can never be enough."
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.DIALOGUE,
    zoneX: 31,
    zoneZ: 13,
    zoneW: 8,
    zoneH: 2,
    roomId: coinCountingRoomId,
    once: true,
    actionData: {
      text: 'They count what can never be enough. Every pile is a reminder of what was stolen.',
    },
  });

  // Offering Chamber: dialogue hint -- "They gave everything and received nothing."
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.DIALOGUE,
    zoneX: 1,
    zoneZ: 23,
    zoneW: 8,
    zoneH: 2,
    roomId: offeringChamberId,
    once: true,
    actionData: { text: 'They gave everything and received nothing. The idols demanded more.' },
  });

  // Guard Barracks: dialogue on entry -- elite guardians alert
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.DIALOGUE,
    zoneX: 31,
    zoneZ: 25,
    zoneW: 8,
    zoneH: 2,
    roomId: guardBarracksId,
    once: true,
    actionData: {
      text: 'The garrison stands ready. Every coin in this vault was bought with blood.',
    },
  });

  // Deep Vault: dialogue on entry -- "The deepest greed: to own what cannot be owned."
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.DIALOGUE,
    zoneX: 31,
    zoneZ: 43,
    zoneW: 8,
    zoneH: 2,
    roomId: deepVaultId,
    once: true,
    actionData: {
      text: 'The deepest greed: to own what cannot be owned. Take it. Suffer the weight.',
    },
  });

  // ── NEW ENVIRONMENT ZONES ─────────────────────────────────────────────────

  // East wing (coin counting + guard barracks): goldDust fire zone
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.FIRE,
    boundsX: 30,
    boundsZ: 12,
    boundsW: 14,
    boundsH: 22,
    intensity: 0.5,
  });

  // West wing (vault annex + offering chamber): dim oppressive zone
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.FOG,
    boundsX: 0,
    boundsZ: 12,
    boundsW: 10,
    boundsH: 22,
    intensity: 0.4,
  });

  // Smelting Chamber: intense fire/heat zone
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.FIRE,
    boundsX: 0,
    boundsZ: 42,
    boundsW: 12,
    boundsH: 12,
    intensity: 0.8,
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
    throw new Error('Circle 4 (Greed) level validation failed');
  }
  console.log('Circle 4 (Greed) built successfully');
  if (result.warnings.length > 0) {
    console.log('Warnings:', result.warnings);
  }
}
