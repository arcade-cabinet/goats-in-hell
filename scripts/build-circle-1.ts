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
  // 2x Torch_Metal on walls
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 17, 3, {
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
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 22, 3, {
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
  // 1x Scroll_2 (inscription)
  editor.spawnProp(LEVEL_ID, 'Scroll_2', 20, 3, { roomId: vestibuleId });
  // 2x Vase_Rubble
  editor.spawnProp(LEVEL_ID, 'Vase_Rubble', 18, 6, { roomId: vestibuleId });
  editor.spawnProp(LEVEL_ID, 'Vase_Rubble', 22, 6, { roomId: vestibuleId });

  // --- Fog Hall (bounds: 14, 12, 12, 10) ---
  // 2x Torch_Metal
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 15, 14, {
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
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 24, 14, {
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
  // 2x Cage_Small
  editor.spawnProp(LEVEL_ID, 'Cage_Small', 17, 18, { roomId: fogHallId });
  editor.spawnProp(LEVEL_ID, 'Cage_Small', 23, 18, { roomId: fogHallId });
  // 3x Vase_Rubble
  editor.spawnProp(LEVEL_ID, 'Vase_Rubble', 16, 20, { roomId: fogHallId });
  editor.spawnProp(LEVEL_ID, 'Vase_Rubble', 20, 13, { roomId: fogHallId });
  editor.spawnProp(LEVEL_ID, 'Vase_Rubble', 24, 20, { roomId: fogHallId });

  // --- Crypt (bounds: 30, 14, 6, 6) ---
  // 1x Torch_Metal
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 31, 15, {
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
  // 1x BookStand (for scroll)
  editor.spawnProp(LEVEL_ID, 'BookStand', 33, 16, { roomId: cryptId });

  // --- Bone Pit (bounds: 2, 14, 8, 8) ---
  // 3x Chain_Coil (hanging from ceiling)
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 4, 16, { roomId: bonePitId });
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 6, 18, { roomId: bonePitId });
  editor.spawnProp(LEVEL_ID, 'Chain_Coil', 8, 20, { roomId: bonePitId });
  // 1x Barrel
  editor.spawnProp(LEVEL_ID, 'Barrel', 5, 20, { roomId: bonePitId });

  // --- Columns (bounds: 15, 26, 10, 12) ---
  // 6x stone columns (structural, break LOS) in 2x3 grid
  editor.spawnProp(LEVEL_ID, 'Column_Stone', 18, 29, { roomId: columnsId });
  editor.spawnProp(LEVEL_ID, 'Column_Stone', 22, 29, { roomId: columnsId });
  editor.spawnProp(LEVEL_ID, 'Column_Stone', 18, 32, { roomId: columnsId });
  editor.spawnProp(LEVEL_ID, 'Column_Stone', 22, 32, { roomId: columnsId });
  editor.spawnProp(LEVEL_ID, 'Column_Stone', 18, 35, { roomId: columnsId });
  editor.spawnProp(LEVEL_ID, 'Column_Stone', 22, 35, { roomId: columnsId });
  // 2x Torch_Metal
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 16, 28, {
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
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 23, 28, {
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

  // --- Boss Chamber (bounds: 14, 42, 12, 12) ---
  // 3x Torch_Metal (2 at entrance, 1 behind boss)
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 16, 43, {
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
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 24, 43, {
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
  editor.spawnProp(LEVEL_ID, 'Torch_Metal', 20, 52, {
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
  // 2x Banner_1
  editor.spawnProp(LEVEL_ID, 'Banner_1', 17, 52, { roomId: bossChamberId });
  editor.spawnProp(LEVEL_ID, 'Banner_1', 23, 52, { roomId: bossChamberId });

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
