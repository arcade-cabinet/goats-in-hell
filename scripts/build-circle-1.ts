#!/usr/bin/env npx tsx
/**
 * Build script for Circle 1: Limbo — The Circle of Ignorance
 *
 * Translates docs/circles/01-limbo.md into LevelEditor API calls.
 * Run: npx tsx scripts/build-circle-1.ts
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

const LEVEL_ID = 'circle-1-limbo';
const THEME_ID = 'circle-1-limbo';

export async function buildCircle1(dbPath: string) {
  const sqliteDb = new BetterSqlite3(dbPath);
  const db = drizzle(sqliteDb, { schema });
  await migrateAndSeed(db);
  const editor = new LevelEditor(db);

  // =========================================================================
  // 1. THEME (from "Theme Configuration" section)
  // =========================================================================

  editor.createTheme(THEME_ID, {
    name: 'limbo',
    displayName: 'LIMBO \u2014 The Circle of Ignorance',
    primaryWall: MapCell.WALL_STONE,
    accentWalls: [MapCell.WALL_STONE], // No accent variation -- monotone
    fogDensity: 0.08,
    fogColor: '#0d0d1a',
    ambientColor: '#2233aa',
    ambientIntensity: 0.15,
    skyColor: '#000000',
    particleEffect: null, // No particles -- stillness
    enemyTypes: ['hellgoat'],
    enemyDensity: 0.8, // Below average -- sparse, deliberate
    pickupDensity: 0.5, // Scarce -- first circle teaches resource awareness
  });

  // =========================================================================
  // 2. LEVEL (from "Identity" + "Grid Dimensions" sections)
  // =========================================================================

  editor.createLevel(LEVEL_ID, {
    name: 'Circle 1: Limbo',
    levelType: 'circle',
    width: 40, // "40 wide"
    depth: 55, // Boss room extends to z=54
    floor: 1,
    themeId: THEME_ID,
    circleNumber: 1,
    sin: 'Ignorance',
    guardian: 'Il Vecchio',
  });

  // =========================================================================
  // 3. ROOMS (from "Room Placement" table, in sortOrder)
  // =========================================================================
  //
  // | Room                 | X  | Z  | W  | H  | Type          | Elevation    | sortOrder |
  // | Vestibule            | 16 |  2 |  8 |  6 | exploration   | 0            | 0         |
  // | Fog Hall             | 14 | 12 | 12 | 10 | exploration   | 0            | 1         |
  // | Crypt                | 30 | 14 |  6 |  6 | secret        | 0            | 2         |
  // | Bone Pit             |  2 | 14 |  8 |  8 | platforming   | 0 (edges=1)  | 3         |
  // | Columns              | 15 | 26 | 10 | 12 | arena         | 0            | 4         |
  // | Il Vecchio's Chamber | 14 | 42 | 12 | 12 | boss          | -1 (below)   | 5         |

  const vestibuleId = editor.room(LEVEL_ID, 'vestibule', 16, 2, 8, 6, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 0,
  });

  const fogHallId = editor.room(LEVEL_ID, 'fog_hall', 14, 12, 12, 10, {
    roomType: ROOM_TYPES.EXPLORATION,
    elevation: 0,
    sortOrder: 1,
  });

  const cryptId = editor.room(LEVEL_ID, 'crypt', 30, 14, 6, 6, {
    roomType: ROOM_TYPES.SECRET,
    elevation: 0,
    sortOrder: 2,
  });

  const bonePitId = editor.room(LEVEL_ID, 'bone_pit', 2, 14, 8, 8, {
    roomType: ROOM_TYPES.PLATFORMING,
    elevation: 0,
    sortOrder: 3,
  });

  const columnsId = editor.room(LEVEL_ID, 'columns', 15, 26, 10, 12, {
    roomType: ROOM_TYPES.ARENA,
    elevation: 0,
    sortOrder: 4,
  });

  const bossChamberId = editor.room(LEVEL_ID, 'il_vecchio_chamber', 14, 42, 12, 12, {
    roomType: ROOM_TYPES.BOSS,
    elevation: -1,
    sortOrder: 5,
  });

  // =========================================================================
  // 4. CONNECTIONS (from "Connections" table)
  // =========================================================================
  //
  // | From       | To                   | Type     | Width | Notes                      |
  // | Vestibule  | Fog Hall             | corridor | 3     | Wide, welcoming            |
  // | Fog Hall   | Crypt                | secret   | 2     | WALL_SECRET at boundary    |
  // | Fog Hall   | Bone Pit             | corridor | 2     | Side branch (optional)     |
  // | Fog Hall   | Columns              | corridor | 2     | Main path forward          |
  // | Columns    | Il Vecchio's Chamber | stairs   | 3     | Descending stairs          |

  // Vestibule -> Fog Hall (corridor, width 3)
  editor.corridor(LEVEL_ID, vestibuleId, fogHallId, 3);

  // Fog Hall -> Crypt (secret, width 2)
  editor.connect(LEVEL_ID, fogHallId, cryptId, {
    connectionType: CONNECTION_TYPES.SECRET,
    corridorWidth: 2,
  });

  // Fog Hall -> Bone Pit (corridor, width 2)
  editor.corridor(LEVEL_ID, fogHallId, bonePitId, 2);

  // Fog Hall -> Columns (corridor, width 2)
  editor.corridor(LEVEL_ID, fogHallId, columnsId, 2);

  // Columns -> Il Vecchio's Chamber (stairs, width 3, descending 0 -> -1)
  editor.connect(LEVEL_ID, columnsId, bossChamberId, {
    connectionType: CONNECTION_TYPES.STAIRS,
    corridorWidth: 3,
    fromElevation: 0,
    toElevation: -1,
  });

  // =========================================================================
  // 5. ENTITIES: ENEMIES (from "Enemies" table)
  // =========================================================================

  // Fog Hall: 3 hellgoat patrol (pre-placed, triangle loop)
  //   Room bounds: (14, 12, 12, 10) -> interior: x=[15..24], z=[13..20]
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 17, 15, {
    roomId: fogHallId,
    patrol: [
      { x: 17, z: 15 },
      { x: 23, z: 15 },
      { x: 20, z: 20 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 23, 15, {
    roomId: fogHallId,
    patrol: [
      { x: 23, z: 15 },
      { x: 20, z: 20 },
      { x: 17, z: 15 },
    ],
  });
  editor.spawnEnemy(LEVEL_ID, ENEMY_TYPES.HELLGOAT, 20, 20, {
    roomId: fogHallId,
    patrol: [
      { x: 20, z: 20 },
      { x: 17, z: 15 },
      { x: 23, z: 15 },
    ],
  });

  // Bone Pit: 3 hellgoat ambush (trigger-spawned)
  //   Room bounds: (2, 14, 8, 8) -> interior: x=[3..8], z=[15..20]
  //   Trigger zone from table: (3, 16, 6, 4)
  editor.ambush(
    LEVEL_ID,
    { x: 3, z: 16, w: 6, h: 4 },
    [
      { type: ENEMY_TYPES.HELLGOAT, x: 4, z: 17 },
      { type: ENEMY_TYPES.HELLGOAT, x: 6, z: 19 },
      { type: ENEMY_TYPES.HELLGOAT, x: 8, z: 17 },
    ],
    { roomId: bonePitId },
  );

  // Columns: 2 waves of 3 hellgoat each (arena lock + wave pattern)
  //   Room bounds: (15, 26, 10, 12) -> interior: x=[16..23], z=[27..36]
  //   Trigger zone from table: (17, 28, 6, 6)
  editor.setupArenaWaves(LEVEL_ID, columnsId, { x: 17, z: 28, w: 6, h: 6 }, [
    // Wave 1: 3 hellgoats from edges
    [
      { type: ENEMY_TYPES.HELLGOAT, x: 16, z: 32 },
      { type: ENEMY_TYPES.HELLGOAT, x: 20, z: 27 },
      { type: ENEMY_TYPES.HELLGOAT, x: 23, z: 32 },
    ],
    // Wave 2: 3 hellgoats from corners
    [
      { type: ENEMY_TYPES.HELLGOAT, x: 16, z: 27 },
      { type: ENEMY_TYPES.HELLGOAT, x: 23, z: 27 },
      { type: ENEMY_TYPES.HELLGOAT, x: 20, z: 36 },
    ],
  ]);

  // Boss chamber: Il Vecchio boss entity
  //   Room bounds: (14, 42, 12, 12) -> center: (20, 48)
  editor.spawnBoss(LEVEL_ID, 'il-vecchio', 20, 48, {
    roomId: bossChamberId,
    facing: 0,
  });

  // =========================================================================
  // 5b. ENTITIES: PICKUPS (from "Pickups" table)
  // =========================================================================

  // Vestibule: ammo near south exit
  //   Room bounds: (16, 2, 8, 6) -> south exit area: x=20, z=6
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 20, 6);

  // Fog Hall: ammo at center
  //   Room bounds: (14, 12, 12, 10) -> center: (20, 17)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 20, 17);

  // Crypt: weapon (shotgun) at center
  //   Room bounds: (30, 14, 6, 6) -> center: (33, 17)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.WEAPON_SHOTGUN, 33, 17);

  // Crypt: ammo near scroll
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 34, 16);

  // Bone Pit: ammo x 2, spread
  //   Room bounds: (2, 14, 8, 8) -> interior spread
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 4, 18);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 8, 18);

  // Bone Pit: health at center
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 6, 18);

  // Columns: ammo at north (between waves)
  //   Room bounds: (15, 26, 10, 12) -> north: (20, 27)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 20, 27);

  // Columns: health at south (between waves)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 20, 36);

  // Boss chamber: ammo x 2 at NE and SW corners
  //   Room bounds: (14, 42, 12, 12)
  //   NE corner: (24, 43), SW corner: (15, 52)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 24, 43);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.AMMO, 15, 52);

  // Boss chamber: health x 2 at NW and SE corners
  //   NW corner: (15, 43), SE corner: (24, 52)
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 15, 43);
  editor.spawnPickup(LEVEL_ID, PICKUP_TYPES.HEALTH, 24, 52);

  // =========================================================================
  // 5c. ENTITIES: PROPS (from "Props" table)
  // =========================================================================

  // --- Vestibule (bounds: 16, 2, 8, 6) ---
  // Structural: crumbling arch + inscription tablet
  editor.spawnProp(LEVEL_ID, 'limbo-crumbling-arch', 16, 2, {
    roomId: vestibuleId,
    surfaceAnchor: {
      face: 'south',
      offsetX: 0,
      offsetY: 0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'limbo-inscription-tablet', 20, 2, {
    roomId: vestibuleId,
    surfaceAnchor: {
      face: 'south',
      offsetX: 0,
      offsetY: 0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.8,
    },
  });
  // 2x limbo-torch-bracket on walls
  editor.spawnProp(LEVEL_ID, 'limbo-torch-bracket', 16, 3, {
    roomId: vestibuleId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'limbo-torch-bracket', 23, 3, {
    roomId: vestibuleId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 2x limbo-vase-rubble flanking center
  editor.spawnProp(LEVEL_ID, 'limbo-vase-rubble', 18, 4, { roomId: vestibuleId });
  editor.spawnProp(LEVEL_ID, 'limbo-vase-rubble', 22, 4, { roomId: vestibuleId });
  // 1x limbo-stone-bench near south exit
  editor.spawnProp(LEVEL_ID, 'limbo-stone-bench', 17, 6, { roomId: vestibuleId });
  // 2x limbo-cobweb-cluster in corners
  editor.spawnProp(LEVEL_ID, 'limbo-cobweb-cluster', 16, 2, { roomId: vestibuleId });
  editor.spawnProp(LEVEL_ID, 'limbo-cobweb-cluster', 23, 2, { roomId: vestibuleId });
  // 1x limbo-cracked-floor-slab center floor
  editor.spawnProp(LEVEL_ID, 'limbo-cracked-floor-slab', 19, 5, { roomId: vestibuleId });
  // 2x limbo-rubble-scatter near walls
  editor.spawnProp(LEVEL_ID, 'limbo-rubble-scatter', 17, 3, { roomId: vestibuleId });
  editor.spawnProp(LEVEL_ID, 'limbo-rubble-scatter', 23, 5, { roomId: vestibuleId });

  // --- Fog Hall (bounds: 14, 12, 12, 10) ---
  // Structural: 2x ancient pillars flanking entrance, iron gate, crumbling arch
  editor.spawnProp(LEVEL_ID, 'limbo-ancient-pillar', 16, 14, { roomId: fogHallId });
  editor.spawnProp(LEVEL_ID, 'limbo-ancient-pillar', 23, 14, { roomId: fogHallId });
  editor.spawnProp(LEVEL_ID, 'limbo-iron-gate', 14, 21, {
    roomId: fogHallId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'limbo-crumbling-arch', 19, 21, {
    roomId: fogHallId,
    surfaceAnchor: {
      face: 'south',
      offsetX: 0,
      offsetY: 0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 2x limbo-torch-bracket on north wall
  editor.spawnProp(LEVEL_ID, 'limbo-torch-bracket', 14, 13, {
    roomId: fogHallId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'limbo-torch-bracket', 25, 13, {
    roomId: fogHallId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 2x limbo-cage floor-standing
  editor.spawnProp(LEVEL_ID, 'limbo-cage', 17, 16, { roomId: fogHallId });
  editor.spawnProp(LEVEL_ID, 'limbo-cage', 21, 18, { roomId: fogHallId });
  // 3x limbo-vase-rubble scattered
  editor.spawnProp(LEVEL_ID, 'limbo-vase-rubble', 15, 15, { roomId: fogHallId });
  editor.spawnProp(LEVEL_ID, 'limbo-vase-rubble', 20, 17, { roomId: fogHallId });
  editor.spawnProp(LEVEL_ID, 'limbo-vase-rubble', 24, 19, { roomId: fogHallId });
  // 1x limbo-fallen-column lying on floor
  editor.spawnProp(LEVEL_ID, 'limbo-fallen-column', 22, 15, { roomId: fogHallId });
  // 1x limbo-moss-growth along west wall base
  editor.spawnProp(LEVEL_ID, 'limbo-moss-growth', 14, 18, { roomId: fogHallId });
  // 1x limbo-bone-pile near south corridor
  editor.spawnProp(LEVEL_ID, 'limbo-bone-pile', 18, 20, { roomId: fogHallId });
  // 2x limbo-tombstone scattered in fog
  editor.spawnProp(LEVEL_ID, 'limbo-tombstone', 16, 19, { roomId: fogHallId });
  editor.spawnProp(LEVEL_ID, 'limbo-tombstone', 24, 17, { roomId: fogHallId });
  // 1x limbo-cobweb-cluster SE corner
  editor.spawnProp(LEVEL_ID, 'limbo-cobweb-cluster', 25, 18, { roomId: fogHallId });

  // --- Crypt (bounds: 30, 14, 6, 6) ---
  // Structural: crumbling arch at secret entrance
  editor.spawnProp(LEVEL_ID, 'limbo-crumbling-arch', 30, 14, {
    roomId: cryptId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.8,
    },
  });
  // 1x limbo-torch-bracket east wall
  editor.spawnProp(LEVEL_ID, 'limbo-torch-bracket', 31, 15, {
    roomId: cryptId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 1x limbo-stone-lectern for scroll
  editor.spawnProp(LEVEL_ID, 'limbo-stone-lectern', 33, 16, { roomId: cryptId });
  // 2x limbo-moss-growth walls and floor
  editor.spawnProp(LEVEL_ID, 'limbo-moss-growth', 30, 16, { roomId: cryptId });
  editor.spawnProp(LEVEL_ID, 'limbo-moss-growth', 34, 18, { roomId: cryptId });
  // 1x limbo-sarcophagus south side
  editor.spawnProp(LEVEL_ID, 'limbo-sarcophagus', 32, 18, { roomId: cryptId });
  // 1x limbo-cobweb-cluster NE corner
  editor.spawnProp(LEVEL_ID, 'limbo-cobweb-cluster', 35, 14, { roomId: cryptId });
  // 1x limbo-skull-pile near sarcophagus
  editor.spawnProp(LEVEL_ID, 'limbo-skull-pile', 33, 18, { roomId: cryptId });
  // 1x limbo-cobweb-cluster SW corner
  editor.spawnProp(LEVEL_ID, 'limbo-cobweb-cluster', 30, 19, { roomId: cryptId });

  // --- Bone Pit (bounds: 2, 14, 8, 8) ---
  // Structural: crumbling arch west entrance
  editor.spawnProp(LEVEL_ID, 'limbo-crumbling-arch', 2, 14, {
    roomId: bonePitId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 0.9,
    },
  });
  // 3x limbo-chain-cluster ceiling-hung
  editor.spawnProp(LEVEL_ID, 'limbo-chain-cluster', 4, 15, { roomId: bonePitId });
  editor.spawnProp(LEVEL_ID, 'limbo-chain-cluster', 7, 17, { roomId: bonePitId });
  editor.spawnProp(LEVEL_ID, 'limbo-chain-cluster', 5, 19, { roomId: bonePitId });
  // 3x limbo-bone-pile scattered
  editor.spawnProp(LEVEL_ID, 'limbo-bone-pile', 3, 16, { roomId: bonePitId });
  editor.spawnProp(LEVEL_ID, 'limbo-bone-pile', 6, 18, { roomId: bonePitId });
  editor.spawnProp(LEVEL_ID, 'limbo-bone-pile', 8, 20, { roomId: bonePitId });
  // 1x limbo-bone-pile center floor (larger)
  editor.spawnProp(LEVEL_ID, 'limbo-bone-pile', 5, 17, { roomId: bonePitId });
  // 1x limbo-torch-bracket near entrance
  editor.spawnProp(LEVEL_ID, 'limbo-torch-bracket', 2, 15, {
    roomId: bonePitId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 2x limbo-tombstone along east wall
  editor.spawnProp(LEVEL_ID, 'limbo-tombstone', 9, 15, { roomId: bonePitId });
  editor.spawnProp(LEVEL_ID, 'limbo-tombstone', 9, 19, { roomId: bonePitId });
  // 1x limbo-broken-altar south center
  editor.spawnProp(LEVEL_ID, 'limbo-broken-altar', 5, 21, { roomId: bonePitId });
  // 1x fog-lantern ceiling-hung near entrance
  editor.spawnProp(LEVEL_ID, 'fog-lantern', 7, 14, { roomId: bonePitId });
  // 2x limbo-spike-cluster pit edges
  editor.spawnProp(LEVEL_ID, 'limbo-spike-cluster', 3, 20, { roomId: bonePitId });
  editor.spawnProp(LEVEL_ID, 'limbo-spike-cluster', 8, 16, { roomId: bonePitId });
  // 1x limbo-skull-pile near east wall
  editor.spawnProp(LEVEL_ID, 'limbo-skull-pile', 7, 19, { roomId: bonePitId });

  // --- Columns (bounds: 15, 26, 10, 12) ---
  // Structural: 6x ancient pillars in 2x3 grid (LOS blockers)
  editor.spawnProp(LEVEL_ID, 'limbo-ancient-pillar', 17, 28, { roomId: columnsId });
  editor.spawnProp(LEVEL_ID, 'limbo-ancient-pillar', 20, 28, { roomId: columnsId });
  editor.spawnProp(LEVEL_ID, 'limbo-ancient-pillar', 23, 28, { roomId: columnsId });
  editor.spawnProp(LEVEL_ID, 'limbo-ancient-pillar', 17, 33, { roomId: columnsId });
  editor.spawnProp(LEVEL_ID, 'limbo-ancient-pillar', 20, 33, { roomId: columnsId });
  editor.spawnProp(LEVEL_ID, 'limbo-ancient-pillar', 23, 33, { roomId: columnsId });
  // Structural: crumbling arch at south exit
  editor.spawnProp(LEVEL_ID, 'limbo-crumbling-arch', 19, 37, {
    roomId: columnsId,
    surfaceAnchor: {
      face: 'south',
      offsetX: 0,
      offsetY: 0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 4x limbo-torch-bracket arena lighting (N and S walls)
  editor.spawnProp(LEVEL_ID, 'limbo-torch-bracket', 15, 27, {
    roomId: columnsId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'limbo-torch-bracket', 24, 27, {
    roomId: columnsId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'limbo-torch-bracket', 15, 36, {
    roomId: columnsId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'limbo-torch-bracket', 24, 36, {
    roomId: columnsId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 2x limbo-banner-tattered east/west walls
  editor.spawnProp(LEVEL_ID, 'limbo-banner-tattered', 15, 30, { roomId: columnsId });
  editor.spawnProp(LEVEL_ID, 'limbo-banner-tattered', 24, 30, { roomId: columnsId });
  // 1x limbo-cracked-floor-slab center floor
  editor.spawnProp(LEVEL_ID, 'limbo-cracked-floor-slab', 19, 31, { roomId: columnsId });
  // 2x limbo-vase-rubble corners
  editor.spawnProp(LEVEL_ID, 'limbo-vase-rubble', 16, 29, { roomId: columnsId });
  editor.spawnProp(LEVEL_ID, 'limbo-vase-rubble', 23, 35, { roomId: columnsId });
  // 1x limbo-stone-bench east wall alcove
  editor.spawnProp(LEVEL_ID, 'limbo-stone-bench', 24, 28, { roomId: columnsId });
  // 1x limbo-broken-pillar near row 1
  editor.spawnProp(LEVEL_ID, 'limbo-broken-pillar', 18, 30, { roomId: columnsId });
  // 2x limbo-rubble-scatter at column bases
  editor.spawnProp(LEVEL_ID, 'limbo-rubble-scatter', 20, 31, { roomId: columnsId });
  editor.spawnProp(LEVEL_ID, 'limbo-rubble-scatter', 22, 34, { roomId: columnsId });

  // --- Boss Chamber (bounds: 14, 42, 12, 12) ---
  // Structural: crumbling arch north entrance
  editor.spawnProp(LEVEL_ID, 'limbo-crumbling-arch', 19, 42, {
    roomId: bossChamberId,
    surfaceAnchor: {
      face: 'south',
      offsetX: 0,
      offsetY: 0,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.2,
    },
  });
  // Structural: 4x ancient pillars flanking entrance and mid-room
  editor.spawnProp(LEVEL_ID, 'limbo-ancient-pillar', 15, 44, { roomId: bossChamberId });
  editor.spawnProp(LEVEL_ID, 'limbo-ancient-pillar', 24, 44, { roomId: bossChamberId });
  editor.spawnProp(LEVEL_ID, 'limbo-ancient-pillar', 15, 51, { roomId: bossChamberId });
  editor.spawnProp(LEVEL_ID, 'limbo-ancient-pillar', 24, 51, { roomId: bossChamberId });
  // 3x limbo-torch-bracket (2 entrance, 1 behind boss)
  editor.spawnProp(LEVEL_ID, 'limbo-torch-bracket', 15, 43, {
    roomId: bossChamberId,
    surfaceAnchor: {
      face: 'west',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'limbo-torch-bracket', 24, 43, {
    roomId: bossChamberId,
    surfaceAnchor: {
      face: 'east',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  editor.spawnProp(LEVEL_ID, 'limbo-torch-bracket', 19, 52, {
    roomId: bossChamberId,
    surfaceAnchor: {
      face: 'south',
      offsetX: 0,
      offsetY: 1.5,
      offsetZ: 0,
      rotation: [0, 0, 0],
      scale: 1.0,
    },
  });
  // 2x limbo-banner-tattered flanking entrance
  editor.spawnProp(LEVEL_ID, 'limbo-banner-tattered', 16, 43, { roomId: bossChamberId });
  editor.spawnProp(LEVEL_ID, 'limbo-banner-tattered', 23, 43, { roomId: bossChamberId });
  // 2x limbo-sarcophagus alcoves
  editor.spawnProp(LEVEL_ID, 'limbo-sarcophagus', 16, 50, { roomId: bossChamberId });
  editor.spawnProp(LEVEL_ID, 'limbo-sarcophagus', 23, 50, { roomId: bossChamberId });
  // 1x limbo-broken-altar center floor
  editor.spawnProp(LEVEL_ID, 'limbo-broken-altar', 20, 48, { roomId: bossChamberId });
  // 2x limbo-tombstone near boss
  editor.spawnProp(LEVEL_ID, 'limbo-tombstone', 17, 52, { roomId: bossChamberId });
  editor.spawnProp(LEVEL_ID, 'limbo-tombstone', 22, 52, { roomId: bossChamberId });
  // 1x limbo-dried-fountain near entrance
  editor.spawnProp(LEVEL_ID, 'limbo-dried-fountain', 20, 44, { roomId: bossChamberId });
  // 1x limbo-bone-pile SE corner
  editor.spawnProp(LEVEL_ID, 'limbo-bone-pile', 25, 52, { roomId: bossChamberId });
  // 2x limbo-wall-sconce side walls
  editor.spawnProp(LEVEL_ID, 'limbo-wall-sconce', 14, 47, { roomId: bossChamberId });
  editor.spawnProp(LEVEL_ID, 'limbo-wall-sconce', 25, 47, { roomId: bossChamberId });
  // 1x limbo-inscription-tablet near entrance
  editor.spawnProp(LEVEL_ID, 'limbo-inscription-tablet', 16, 42, { roomId: bossChamberId });
  // 2x limbo-skull-pile base of side pillars
  editor.spawnProp(LEVEL_ID, 'limbo-skull-pile', 14, 50, { roomId: bossChamberId });
  editor.spawnProp(LEVEL_ID, 'limbo-skull-pile', 25, 50, { roomId: bossChamberId });
  // 1x limbo-ritual-circle center floor
  editor.spawnProp(LEVEL_ID, 'limbo-ritual-circle', 20, 47, { roomId: bossChamberId });
  // 2x limbo-rubble-scatter near entrance pillars
  editor.spawnProp(LEVEL_ID, 'limbo-rubble-scatter', 17, 45, { roomId: bossChamberId });
  editor.spawnProp(LEVEL_ID, 'limbo-rubble-scatter', 22, 45, { roomId: bossChamberId });

  // =========================================================================
  // 5d. DECALS (water seepage stains — Limbo's damp, foggy atmosphere)
  // =========================================================================

  // --- Vestibule (bounds: 16, 2, 8, 6) ---
  editor.placeDecals(LEVEL_ID, vestibuleId, [
    { type: DECAL_TYPES.WATER_STAIN, x: 16, z: 4, surface: 'wall', opacity: 0.5 },
    { type: DECAL_TYPES.WATER_STAIN, x: 23, z: 5, surface: 'wall', opacity: 0.4 },
  ]);

  // --- Fog Hall (bounds: 14, 12, 12, 10) ---
  editor.placeDecals(LEVEL_ID, fogHallId, [
    { type: DECAL_TYPES.WATER_STAIN, x: 14, z: 15, surface: 'wall', opacity: 0.5 },
    { type: DECAL_TYPES.WATER_STAIN, x: 25, z: 17, surface: 'wall', opacity: 0.6 },
    { type: DECAL_TYPES.WATER_STAIN, x: 18, z: 21, surface: 'wall', opacity: 0.4 },
  ]);

  // --- Crypt (bounds: 30, 14, 6, 6) ---
  editor.placeDecals(LEVEL_ID, cryptId, [
    { type: DECAL_TYPES.WATER_STAIN, x: 30, z: 17, surface: 'wall', opacity: 0.5 },
    { type: DECAL_TYPES.WATER_STAIN, x: 35, z: 15, surface: 'wall', opacity: 0.4 },
  ]);

  // --- Bone Pit (bounds: 2, 14, 8, 8) ---
  editor.placeDecals(LEVEL_ID, bonePitId, [
    { type: DECAL_TYPES.WATER_STAIN, x: 2, z: 17, surface: 'wall', opacity: 0.6 },
    { type: DECAL_TYPES.WATER_STAIN, x: 9, z: 16, surface: 'wall', opacity: 0.5 },
    { type: DECAL_TYPES.WATER_STAIN, x: 5, z: 21, opacity: 0.4 },
  ]);

  // --- Columns (bounds: 15, 26, 10, 12) ---
  editor.placeDecals(LEVEL_ID, columnsId, [
    { type: DECAL_TYPES.WATER_STAIN, x: 15, z: 29, surface: 'wall', opacity: 0.5 },
    { type: DECAL_TYPES.WATER_STAIN, x: 24, z: 34, surface: 'wall', opacity: 0.4 },
  ]);

  // --- Boss Chamber (bounds: 14, 42, 12, 12) ---
  editor.placeDecals(LEVEL_ID, bossChamberId, [
    { type: DECAL_TYPES.WATER_STAIN, x: 14, z: 46, surface: 'wall', opacity: 0.6 },
    { type: DECAL_TYPES.WATER_STAIN, x: 25, z: 49, surface: 'wall', opacity: 0.5 },
    { type: DECAL_TYPES.WATER_STAIN, x: 20, z: 53, opacity: 0.4 },
  ]);

  // =========================================================================
  // 6. TRIGGERS (from "Triggers" table)
  // =========================================================================
  //
  // NOTE: T1 (Bone Pit ambush) was already created by editor.ambush() above.
  // NOTE: T2-T5 (Columns arena) were already created by editor.setupArenaWaves() above.

  // T6: ambientChange on wave 2 clear (fog lifts to 0.04)
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 15,
    zoneZ: 26,
    zoneW: 10,
    zoneH: 12,
    roomId: columnsId,
    once: true,
    actionData: { fogDensity: 0.04, condition: 'allEnemiesKilled' },
  });

  // T7: bossIntro -- player enters boss chamber entrance zone
  //   Zone from table: (15, 43, 10, 2)
  editor.bossIntro(
    LEVEL_ID,
    { x: 15, z: 43, w: 10, h: 2 },
    'You carry what is not yours, little goat. I have watched the gate since before memory. All who pass carry sin. You carry more than most.',
    { roomId: bossChamberId },
  );

  // T8: lockDoors on boss intro (with 3s delay)
  //   Zone from table: (15, 43, 10, 2)
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.LOCK_DOORS,
    zoneX: 15,
    zoneZ: 43,
    zoneW: 10,
    zoneH: 2,
    roomId: bossChamberId,
    once: true,
    delay: 3,
  });

  // T9: ambientChange when boss HP < 50% (fog surges to 0.12)
  editor.addTrigger(LEVEL_ID, {
    action: TRIGGER_ACTIONS.AMBIENT_CHANGE,
    zoneX: 14,
    zoneZ: 42,
    zoneW: 12,
    zoneH: 12,
    roomId: bossChamberId,
    once: true,
    actionData: {
      fogDensity: 0.12,
      fogColor: '#0a0a15',
      condition: 'bossHpBelow50',
    },
  });

  // =========================================================================
  // 7. ENVIRONMENT ZONES (from "Environment Zones" table)
  // =========================================================================

  // Global fog: full level, intensity 0.8
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.FOG,
    boundsX: 0,
    boundsZ: 0,
    boundsW: 40,
    boundsH: 50,
    intensity: 0.8,
  });

  // Bone Pit wind: subtle updraft
  //   Bone Pit room bounds: (2, 14, 8, 8)
  editor.addEnvironmentZone(LEVEL_ID, {
    envType: ENV_TYPES.WIND,
    boundsX: 2,
    boundsZ: 14,
    boundsW: 8,
    boundsH: 8,
    intensity: 0.3,
    directionX: 0,
    directionZ: -1, // Updraft (negative Z)
  });

  // =========================================================================
  // 8. PLAYER SPAWN (from "Player Spawn" section)
  // =========================================================================
  //   Position: (20, 5) -- center of Vestibule
  //   Facing: pi (south -- facing toward Fog Hall)

  editor.setPlayerSpawn(LEVEL_ID, 20, 5, Math.PI);

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
    throw new Error('Circle 1 (Limbo) level validation failed');
  }
  console.log('Circle 1 (Limbo) built successfully');
  if (result.warnings.length > 0) {
    console.log('Warnings:', result.warnings);
  }
}
