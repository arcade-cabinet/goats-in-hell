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
    enemyTypes: ['goatKnight', 'hellgoat'],
    enemyDensity: 1.0,
    pickupDensity: 2.5,
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
  });

  const treasuryId = editor.room(LEVEL_ID, 'treasury', 15, 12, 14, 12, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 1,
  });

  const weightRoomId = editor.room(LEVEL_ID, 'weight_room', 17, 28, 10, 10, {
    roomType: ROOM_TYPES.PUZZLE,
    elevation: 0,
    sortOrder: 2,
  });

  const reliquaryId = editor.room(LEVEL_ID, 'reliquary', 2, 32, 6, 6, {
    roomType: ROOM_TYPES.SECRET,
    elevation: 0,
    sortOrder: 3,
  });

  const auctionHallId = editor.room(LEVEL_ID, 'auction_hall', 16, 42, 12, 12, {
    roomType: ROOM_TYPES.ARENA,
    elevation: 0,
    sortOrder: 4,
  });

  const aureosCourtId = editor.room(LEVEL_ID, 'aureos_court', 15, 58, 14, 14, {
    roomType: ROOM_TYPES.BOSS,
    elevation: -1,
    sortOrder: 5,
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

  // --- Treasury (ground): 2 goatKnight patrol between chest rows ---
  //   Room bounds: (15, 12, 14, 12) -> interior: x=[16..27], z=[13..22]
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 19, 16, {
    roomId: treasuryId,
    patrol: [
      { x: 19, z: 16 },
      { x: 25, z: 16 },
      { x: 25, z: 20 },
      { x: 19, z: 20 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 25, 20, {
    roomId: treasuryId,
    patrol: [
      { x: 25, z: 20 },
      { x: 19, z: 20 },
      { x: 19, z: 16 },
      { x: 25, z: 16 },
    ],
  });

  // --- Treasury (balcony): 2 hellgoat guard balcony ramps ---
  //   Balcony positions near ramp tops at E/W walls
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 16, 14, {
    roomId: treasuryId,
    elevation: 1,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 27, 14, {
    roomId: treasuryId,
    elevation: 1,
  });

  // --- Weight Room: 1 goatKnight on far platform, 1 hellgoat patrolling ---
  //   Room bounds: (17, 28, 10, 10) -> interior: x=[18..25], z=[29..36]
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.GOAT_KNIGHT, 22, 35, {
    roomId: weightRoomId,
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 20, 32, {
    roomId: weightRoomId,
    patrol: [
      { x: 20, z: 32 },
      { x: 24, z: 32 },
      { x: 24, z: 34 },
      { x: 20, z: 34 },
    ],
  });

  // --- Auction Hall: 2 waves via setupArenaWaves ---
  //   Room bounds: (16, 42, 12, 12) -> interior: x=[17..26], z=[43..52]
  //   Trigger zone from table: (17, 43, 10, 2)
  //   Wave 1: 2 goatKnight (N, S) + 2 hellgoat (E, W)
  //   Wave 2: 2 goatKnight (corners) + 2 hellgoat (door-side)
  editor.setupArenaWaves(LEVEL_ID, auctionHallId, { x: 17, z: 43, w: 10, h: 2 }, [
    // Wave 1: 2 goatKnight (N, S) + 2 hellgoat (E, W)
    [
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 22, z: 43 },
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 22, z: 52 },
      { type: ENEMY_TYPES.HELLGOAT, x: 17, z: 48 },
      { type: ENEMY_TYPES.HELLGOAT, x: 26, z: 48 },
    ],
    // Wave 2: 2 goatKnight (corners) + 2 hellgoat (door-side)
    [
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 17, z: 43 },
      { type: ENEMY_TYPES.GOAT_KNIGHT, x: 26, z: 52 },
      { type: ENEMY_TYPES.HELLGOAT, x: 20, z: 43 },
      { type: ENEMY_TYPES.HELLGOAT, x: 24, z: 43 },
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
