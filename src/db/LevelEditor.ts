/**
 * Level editor API — builds levels by writing to the SQLite database.
 *
 * Designed for agentic use: all coordinates are GRID coordinates (not world).
 * World conversion happens at runtime via CELL_SIZE (1 grid cell = 2 world units).
 *
 * Usage:
 *   const editor = new LevelEditor(db);
 *   editor.createTheme('circle-1-limbo', { ... });
 *   editor.createLevel('circle-1-limbo', { ... });
 *   const r1 = editor.room('circle-1-limbo', 'vestibule', 16, 2, 8, 6);
 *   const r2 = editor.room('circle-1-limbo', 'fog_hall', 14, 12, 12, 10);
 *   editor.corridor('circle-1-limbo', r1, r2, 3);
 *   editor.spawnEnemy('circle-1-limbo', 'hellgoat', 20, 17, { roomId: r2 });
 *   editor.setPlayerSpawn('circle-1-limbo', 20, 5, Math.PI);
 *   editor.compile('circle-1-limbo');
 *   const result = editor.validate('circle-1-limbo');
 */
import { eq } from 'drizzle-orm';

import { MapCell } from '../game/levels/LevelGenerator';
import { resolveAssetName } from '../game/propNameMap';
import { getAvailableEnemiesForCircle, getAvailablePropsForCircle } from './AssetDiscovery';
import type { DrizzleDb } from './connection';
import { compileGrid, packGrid } from './GridCompiler';
import * as schema from './schema';

// Re-export MapCell so agents can use LevelEditor.MapCell.WALL_STONE
export { MapCell };

// ---------------------------------------------------------------------------
// Agentic constants — use these instead of magic strings
// ---------------------------------------------------------------------------

/** Canonical trigger action strings — use instead of magic strings in build scripts. */
export const TRIGGER_ACTIONS = {
  SPAWN_WAVE: 'spawnWave',
  LOCK_DOORS: 'lockDoors',
  UNLOCK_DOORS: 'unlockDoors',
  DIALOGUE: 'dialogue',
  AMBIENT_CHANGE: 'ambientChange',
  BOSS_INTRO: 'bossIntro',
  SECRET_REVEAL: 'secretReveal',
  PLATFORM_MOVE: 'platformMove',
} as const;

/** Canonical room type strings — determines gameplay behavior and validation. */
export const ROOM_TYPES = {
  EXPLORATION: 'exploration',
  ARENA: 'arena',
  BOSS: 'boss',
  SECRET: 'secret',
  HUB: 'hub',
  PLATFORMING: 'platforming',
  CORRIDOR: 'corridor',
  PUZZLE: 'puzzle',
} as const;

/** Canonical room connection type strings — how two rooms are linked. */
export const CONNECTION_TYPES = {
  CORRIDOR: 'corridor',
  DOOR: 'door',
  STAIRS: 'stairs',
  PORTAL: 'portal',
  SECRET: 'secret',
  BRIDGE: 'bridge',
  JUMP_PAD: 'jump_pad',
} as const;

/** Canonical environment zone type strings — elemental effects applied to areas. */
export const ENV_TYPES = {
  WIND: 'wind',
  ICE: 'ice',
  WATER: 'water',
  FIRE: 'fire',
  FOG: 'fog',
  FROST: 'frost',
  VOID: 'void',
  BLOOD: 'blood',
  ILLUSION: 'illusion',
  CRUSHING: 'crushing',
} as const;

/** Entity spawn categories — determines how the runtime interprets spawned entities. */
export const SPAWN_CATEGORIES = {
  ENEMY: 'enemy',
  PICKUP: 'pickup',
  PROP: 'prop',
  HAZARD: 'hazard',
  BOSS: 'boss',
} as const;

/** Canonical decal surface targets — where the decal projects onto. */
export const DECAL_SURFACES = {
  FLOOR: 'floor',
  WALL: 'wall',
  CEILING: 'ceiling',
} as const;

/** Canonical decal type identifiers for use in build scripts. */
export const DECAL_TYPES = {
  ICE_FROST: 'ice-frost',
  SNOW_DRIFT: 'snow-drift',
  CONCRETE_CRACK: 'concrete-crack',
  BLOOD_STAIN: 'blood-stain',
  RUST_PATCH: 'rust-patch',
  SCORCH_MARK: 'scorch-mark',
  MOSS_PATCH: 'moss-patch',
  WATER_STAIN: 'water-stain',
} as const;

/** Canonical enemy type identifiers for use in build scripts. */
export const ENEMY_TYPES = {
  // General mob types (used across multiple circles)
  GOAT: 'goat', // Basic grunt — goat-grunt model
  HELLGOAT: 'hellgoat', // Circle 1 shade — goat-shade model
  SHADOW_GOAT: 'shadowGoat', // Scout/stealth — goat-scout model
  GOAT_KNIGHT: 'goatKnight', // Heavy brute — goat-brute model
  SHAMAN: 'shaman', // Ranged caster — goat-shaman model
  // Circle 1: Limbo — Shade hierarchy
  SHADE_WHELP: 'shadeWhelp', // weak, wispy shade (young soul)
  SHADE: 'hellgoat', // standard shade (goat-shade model, hellgoat entity type)
  SHADE_ELDER: 'shadeElder', // ancient lingering shade
  // Circle 2: Lust — Siren hierarchy
  SIREN_WHELP: 'sirenWhelp', // young thrall, frantic
  SIREN: 'siren', // standard siren
  SIREN_ELDER: 'sirenElder', // ancient seductress
  // Circle 3: Gluttony — Glutton hierarchy
  GLUTTON_WHELP: 'gluttonWhelp', // bloated runt
  GLUTTON: 'glutton', // standard glutton
  GLUTTON_ELDER: 'gluttonElder', // grotesque elder
  // Circle 4: Greed — Hoarder hierarchy
  HOARDER_WHELP: 'hoarderWhelp', // petty thief
  HOARDER: 'hoarder', // standard hoarder
  HOARDER_ELDER: 'hoarderElder', // gold-armored warden
  // Circle 5: Wrath — Berserker hierarchy
  BERSERKER_WHELP: 'berserkerWhelp', // frenzied runt
  BERSERKER: 'berserker', // standard berserker
  BERSERKER_ELDER: 'berserkerElder', // rage-incarnate elder
  // Circle 6: Heresy — Heretic hierarchy
  HERETIC_WHELP: 'hereticWhelp', // acolyte
  HERETIC: 'heretic', // standard heretic
  HERETIC_ELDER: 'hereticElder', // arch-heretic
  // Circle 7: Violence — Butcher hierarchy
  BUTCHER_WHELP: 'butcherWhelp', // apprentice butcher
  BUTCHER: 'butcher', // standard butcher
  BUTCHER_ELDER: 'butcherElder', // grand butcher
  // Circle 8: Fraud — Mimic hierarchy
  MIMIC_WHELP: 'mimicWhelp', // shapeshifter runt
  MIMIC_ENEMY: 'mimic', // standard mimic
  MIMIC_ELDER: 'mimicElder', // perfect deceiver
  // Circle 9: Treachery — Frost hierarchy
  FROST_WHELP: 'frostWhelp', // frozen shard
  FROST: 'frost', // standard frost
  FROST_ELDER: 'frostElder', // permafrost ancient
  // Legacy aliases (kept for backward-compat)
  FIRE_GOAT: 'fireGoat',
} as const;

/** Canonical pickup type identifiers (health, ammo, weapons). */
export const PICKUP_TYPES = {
  HEALTH: 'health',
  AMMO: 'ammo',
  FUEL: 'fuel',
  WEAPON_SHOTGUN: 'weapon_shotgun',
  WEAPON_CANNON: 'weapon_cannon',
  WEAPON_LAUNCHER: 'weapon_launcher',
  WEAPON_FLAMETHROWER: 'weapon_flamethrower',
} as const;

// ---------------------------------------------------------------------------
// ID generation
// ---------------------------------------------------------------------------

let _counter = 0;

function generateId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    // Fallback for environments without crypto.randomUUID
    _counter++;
    return `id-${Date.now()}-${_counter}`;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function roomContainsPoint(
  r: { boundsX: number; boundsZ: number; boundsW: number; boundsH: number },
  x: number,
  z: number,
): boolean {
  return x >= r.boundsX && x < r.boundsX + r.boundsW && z >= r.boundsZ && z < r.boundsZ + r.boundsH;
}

function roomsOverlap(
  a: { boundsX: number; boundsZ: number; boundsW: number; boundsH: number },
  b: { boundsX: number; boundsZ: number; boundsW: number; boundsH: number },
): boolean {
  return (
    a.boundsX < b.boundsX + b.boundsW &&
    a.boundsX + a.boundsW > b.boundsX &&
    a.boundsZ < b.boundsZ + b.boundsH &&
    a.boundsZ + a.boundsH > b.boundsZ
  );
}

function roomCenter(r: { boundsX: number; boundsZ: number; boundsW: number; boundsH: number }): {
  x: number;
  z: number;
} {
  return {
    x: Math.floor(r.boundsX + r.boundsW / 2),
    z: Math.floor(r.boundsZ + r.boundsH / 2),
  };
}

// ---------------------------------------------------------------------------
// Validation result
// ---------------------------------------------------------------------------

/** Result of `LevelEditor.validate()` — actionable errors and warnings. */
export interface ValidationResult {
  /** True if no blocking errors were found. */
  valid: boolean;
  /** Blocking issues that must be fixed (e.g. unreachable rooms, out-of-bounds spawns). */
  errors: string[];
  /** Non-blocking observations (e.g. empty rooms, overlapping bounds). */
  warnings: string[];
}

// ---------------------------------------------------------------------------
// Texture + fill-rule types for procedural rendering
// ---------------------------------------------------------------------------

/** Identifier for a PBR texture set from the AmbientCG library. */
export type TextureId =
  | 'stone'
  | 'stone-dark'
  | 'brick'
  | 'concrete'
  | 'ground'
  | 'ice'
  | 'ice-deep'
  | 'lava'
  | 'lava-dark'
  | 'lava-cold'
  | 'leather'
  | 'marble'
  | 'metal'
  | 'metal-dark'
  | 'moss'
  | 'tiles';

/** Procedural prop-scatter rule attached to a room. */
export interface FillRule {
  type: 'scatter' | 'edge' | 'none';
  /** AssetRegistry prop keys WITHOUT the 'prop-' prefix */
  props: string[];
  /** 0.0–1.0: fraction of eligible floor cells that receive a prop */
  density: number;
  avoidSpawns?: boolean;
  randomRotation?: boolean;
}

/** Per-room visual descriptor included in CompiledVisual. */
export interface CompiledRoomVisual {
  id: string;
  name: string;
  bounds: { x: number; z: number; w: number; h: number };
  elevation: number;
  roomType: string;
  floorTexture: TextureId | null;
  wallTexture: TextureId | null;
  ceilingTexture: TextureId | null;
  fillRule: FillRule | null;
}

/** Complete visual description of a compiled level, stored as JSON on the levels table. */
export interface CompiledVisual {
  version: 1;
  rooms: CompiledRoomVisual[];
  theme: {
    primaryWall: number;
    texturePalette: Partial<Record<string, TextureId>>;
    roomFillRules: Partial<Record<string, FillRule>>;
  };
}

// ---------------------------------------------------------------------------
// LevelEditor
// ---------------------------------------------------------------------------

/**
 * Agentic level-building API — writes rooms, connections, entities, and
 * triggers to the SQLite database. All coordinates are GRID coordinates;
 * world-space conversion happens at runtime via CELL_SIZE.
 *
 * Typical workflow:
 * 1. `createTheme()` + `createLevel()` to set up metadata
 * 2. `room()` / `corridor()` to define geometry
 * 3. `spawnEnemy()` / `spawnPickup()` / `spawnProp()` / `spawnBoss()` for entities
 * 4. `lockOnEntry()` / `ambush()` / `setupArenaWaves()` for encounters
 * 5. `setPlayerSpawn()` to place the player
 * 6. `compile()` to rasterize geometry into a grid BLOB
 * 7. `validate()` to check for structural issues
 */
export class LevelEditor {
  private db: DrizzleDb;

  /** @param db - Drizzle ORM database instance (better-sqlite3 or sql.js). */
  constructor(db: DrizzleDb) {
    this.db = db;
  }

  // -------------------------------------------------------------------------
  // Getter methods — introspection for agents
  // -------------------------------------------------------------------------

  /** Fetch a level row by ID, or null if not found. */
  getLevel(levelId: string) {
    return this.db.select().from(schema.levels).where(eq(schema.levels.id, levelId)).get() ?? null;
  }

  /** Fetch all rooms belonging to a level. */
  getRooms(levelId: string) {
    return this.db.select().from(schema.rooms).where(eq(schema.rooms.levelId, levelId)).all();
  }

  /** Find a room by its human-readable name within a level, or null. */
  getRoomByName(levelId: string, name: string) {
    return (
      this.db
        .select()
        .from(schema.rooms)
        .where(eq(schema.rooms.levelId, levelId))
        .all()
        .find((r) => r.name === name) ?? null
    );
  }

  /** Fetch all entities for a level, optionally filtered by spawn category. */
  getEntities(levelId: string, spawnCategory?: string) {
    const all = this.db
      .select()
      .from(schema.entities)
      .where(eq(schema.entities.levelId, levelId))
      .all();
    if (spawnCategory) return all.filter((e) => e.spawnCategory === spawnCategory);
    return all;
  }

  /** Fetch all triggers for a level. */
  getTriggers(levelId: string) {
    return this.db.select().from(schema.triggers).where(eq(schema.triggers.levelId, levelId)).all();
  }

  /** Fetch all environment zones for a level. */
  getEnvironmentZones(levelId: string) {
    return this.db
      .select()
      .from(schema.environmentZones)
      .where(eq(schema.environmentZones.levelId, levelId))
      .all();
  }

  /** Fetch all room connections for a level. */
  getConnections(levelId: string) {
    return this.db
      .select()
      .from(schema.connections)
      .where(eq(schema.connections.levelId, levelId))
      .all();
  }

  /** Fetch all decals for a level. */
  getDecals(levelId: string) {
    return this.db.select().from(schema.decals).where(eq(schema.decals.levelId, levelId)).all();
  }

  // -------------------------------------------------------------------------
  // Lifecycle methods
  // -------------------------------------------------------------------------

  /**
   * Delete a level and ALL its child data (rooms, entities, triggers,
   * connections, environment zones, decals). The theme is left intact
   * since themes can be shared. Call before rebuilding a level.
   */
  deleteLevel(levelId: string): void {
    // Child tables have ON DELETE CASCADE, but Drizzle doesn't enforce FK
    // constraints by default in better-sqlite3, so delete explicitly.
    this.db.delete(schema.decals).where(eq(schema.decals.levelId, levelId)).run();
    this.db
      .delete(schema.environmentZones)
      .where(eq(schema.environmentZones.levelId, levelId))
      .run();
    this.db.delete(schema.entities).where(eq(schema.entities.levelId, levelId)).run();
    this.db.delete(schema.triggers).where(eq(schema.triggers.levelId, levelId)).run();
    this.db.delete(schema.connections).where(eq(schema.connections.levelId, levelId)).run();
    this.db.delete(schema.rooms).where(eq(schema.rooms.levelId, levelId)).run();
    this.db.delete(schema.levels).where(eq(schema.levels.id, levelId)).run();
  }

  // -------------------------------------------------------------------------
  // Core methods
  // -------------------------------------------------------------------------

  /**
   * Upsert a floor theme into the database. Safe to call repeatedly — if the
   * theme already exists it will be updated in place.
   * @param id - Unique theme identifier (e.g. 'circle-1-limbo').
   * @param opts - Theme configuration (walls, colors, fog, enemy roster).
   */
  createTheme(
    id: string,
    opts: {
      name: string;
      displayName: string;
      primaryWall: number;
      accentWalls: number[];
      fogDensity?: number;
      fogColor?: string;
      ambientColor: string;
      ambientIntensity?: number;
      skyColor?: string;
      particleEffect?: string | null;
      enemyTypes?: string[];
      enemyDensity?: number;
      pickupDensity?: number;
      texturePalette?: Partial<Record<string, TextureId>>;
      roomFillRules?: Partial<Record<string, FillRule>>;
    },
  ): void {
    const values = {
      id,
      name: opts.name,
      displayName: opts.displayName,
      primaryWall: opts.primaryWall,
      accentWalls: opts.accentWalls,
      fogDensity: opts.fogDensity ?? 0.03,
      fogColor: opts.fogColor ?? '#000000',
      ambientColor: opts.ambientColor,
      ambientIntensity: opts.ambientIntensity ?? 0.3,
      skyColor: opts.skyColor ?? '#000000',
      particleEffect: opts.particleEffect ?? null,
      enemyTypes: opts.enemyTypes ?? [],
      enemyDensity: opts.enemyDensity ?? 1.0,
      pickupDensity: opts.pickupDensity ?? 0.6,
      texturePalette: opts.texturePalette ? JSON.stringify(opts.texturePalette) : null,
      roomFillRules: opts.roomFillRules ? JSON.stringify(opts.roomFillRules) : null,
    };
    this.db
      .insert(schema.themes)
      .values(values)
      .onConflictDoUpdate({
        target: schema.themes.id,
        set: values,
      })
      .run();
  }

  /**
   * Create a level. If it already exists, deletes it first (cascade) and
   * recreates from scratch to ensure a clean slate.
   * @param id - Unique level identifier (e.g. 'circle-1-limbo').
   * @param opts - Level metadata (dimensions, floor, theme, audio).
   */
  createLevel(
    id: string,
    opts: {
      name: string;
      levelType: 'circle' | 'procedural' | 'arena' | 'boss';
      width: number;
      depth: number;
      floor: number;
      themeId: string;
      circleNumber?: number;
      sin?: string;
      guardian?: string;
      music?: string;
      ambientSound?: string;
      spawnX?: number;
      spawnZ?: number;
      spawnFacing?: number;
    },
  ): void {
    // Delete existing level + all child rows for a clean rebuild
    this.deleteLevel(id);

    this.db
      .insert(schema.levels)
      .values({
        id,
        name: opts.name,
        levelType: opts.levelType,
        width: opts.width,
        depth: opts.depth,
        floor: opts.floor,
        themeId: opts.themeId,
        circleNumber: opts.circleNumber,
        sin: opts.sin,
        guardian: opts.guardian,
        music: opts.music,
        ambientSound: opts.ambientSound,
        spawnX: opts.spawnX ?? 0,
        spawnZ: opts.spawnZ ?? 0,
        spawnFacing: opts.spawnFacing ?? 0,
      })
      .run();
  }

  /**
   * Insert a room with explicit bounds and type.
   * Prefer the `room()` convenience method for simpler call signatures.
   * @param levelId - Parent level ID.
   * @param name - Human-readable room name (e.g. 'vestibule', 'arena_pit').
   * @param opts - Room bounds (grid coords), type, elevation, and cell overrides.
   * @returns The generated room ID (UUID).
   */
  addRoom(
    levelId: string,
    name: string,
    opts: {
      roomType: string;
      boundsX: number;
      boundsZ: number;
      boundsW: number;
      boundsH: number;
      elevation?: number;
      floorCell?: number;
      wallCell?: number;
      sortOrder?: number;
      floorTexture?: TextureId;
      wallTexture?: TextureId;
      ceilingTexture?: TextureId;
      fillRule?: FillRule;
    },
  ): string {
    const id = generateId();
    this.db
      .insert(schema.rooms)
      .values({
        id,
        levelId,
        name,
        roomType: opts.roomType,
        boundsX: opts.boundsX,
        boundsZ: opts.boundsZ,
        boundsW: opts.boundsW,
        boundsH: opts.boundsH,
        elevation: opts.elevation,
        floorCell: opts.floorCell,
        wallCell: opts.wallCell,
        sortOrder: opts.sortOrder,
        floorTexture: opts.floorTexture ?? null,
        wallTexture: opts.wallTexture ?? null,
        ceilingTexture: opts.ceilingTexture ?? null,
        fillRule: opts.fillRule ? JSON.stringify(opts.fillRule) : null,
      })
      .run();
    return id;
  }

  /**
   * Create a directed connection between two rooms.
   * @param levelId - Parent level ID.
   * @param fromRoomId - Source room ID.
   * @param toRoomId - Destination room ID.
   * @param opts - Connection type, corridor width, direction, and elevation.
   * @returns The generated connection ID (UUID).
   */
  connect(
    levelId: string,
    fromRoomId: string,
    toRoomId: string,
    opts: {
      connectionType: string;
      corridorWidth?: number;
      direction?: string;
      fromElevation?: number;
      toElevation?: number;
      length?: number;
    },
  ): string {
    const id = generateId();
    this.db
      .insert(schema.connections)
      .values({
        id,
        levelId,
        fromRoomId,
        toRoomId,
        connectionType: opts.connectionType,
        corridorWidth: opts.corridorWidth,
        direction: opts.direction,
        fromElevation: opts.fromElevation,
        toElevation: opts.toElevation,
        length: opts.length,
      })
      .run();
    return id;
  }

  /**
   * Insert a generic entity spawn. Prefer convenience methods (`spawnEnemy`, `spawnPickup`, etc.).
   * @param levelId - Parent level ID.
   * @param opts - Entity type, grid position, spawn category, and optional overrides.
   * @returns The generated entity ID (UUID).
   */
  addEntity(
    levelId: string,
    opts: {
      entityType: string;
      x: number;
      z: number;
      spawnCategory: 'enemy' | 'pickup' | 'prop' | 'hazard' | 'boss';
      roomId?: string;
      elevation?: number;
      facing?: number;
      patrol?: Array<{ x: number; z: number }>;
      triggerId?: string;
      overrides?: Record<string, unknown>;
      surfaceAnchor?: {
        face: string;
        offsetX: number;
        offsetY: number;
        offsetZ: number;
        rotation: number[];
        scale: number;
      };
    },
  ): string {
    const id = generateId();
    this.db
      .insert(schema.entities)
      .values({
        id,
        levelId,
        entityType: opts.entityType,
        x: opts.x,
        z: opts.z,
        spawnCategory: opts.spawnCategory,
        roomId: opts.roomId,
        elevation: opts.elevation,
        facing: opts.facing,
        patrol: opts.patrol,
        triggerId: opts.triggerId,
        overrides: opts.overrides,
        surfaceAnchor: opts.surfaceAnchor,
      })
      .run();
    return id;
  }

  /**
   * Insert a trigger zone that fires an action when the player enters.
   * @param levelId - Parent level ID.
   * @param opts - Action type, zone bounds, and optional delay/data.
   * @returns The generated trigger ID (UUID).
   */
  addTrigger(
    levelId: string,
    opts: {
      action: string;
      zoneX: number;
      zoneZ: number;
      zoneW: number;
      zoneH: number;
      roomId?: string;
      once?: boolean;
      delay?: number;
      actionData?: Record<string, unknown>;
    },
  ): string {
    const id = generateId();
    this.db
      .insert(schema.triggers)
      .values({
        id,
        levelId,
        action: opts.action,
        zoneX: opts.zoneX,
        zoneZ: opts.zoneZ,
        zoneW: opts.zoneW,
        zoneH: opts.zoneH,
        roomId: opts.roomId,
        once: opts.once,
        delay: opts.delay,
        actionData: opts.actionData,
      })
      .run();
    return id;
  }

  /**
   * Insert an environment zone (wind, fire, fog, etc.) with optional cycling timers.
   * @param levelId - Parent level ID.
   * @param opts - Zone type, bounds, intensity, and optional wind direction / timers.
   * @returns The generated zone ID (UUID).
   */
  addEnvironmentZone(
    levelId: string,
    opts: {
      envType: string;
      boundsX: number;
      boundsZ: number;
      boundsW: number;
      boundsH: number;
      intensity?: number;
      directionX?: number;
      directionZ?: number;
      timerOn?: number;
      timerOff?: number;
    },
  ): string {
    const id = generateId();
    this.db
      .insert(schema.environmentZones)
      .values({
        id,
        levelId,
        envType: opts.envType,
        boundsX: opts.boundsX,
        boundsZ: opts.boundsZ,
        boundsW: opts.boundsW,
        boundsH: opts.boundsH,
        intensity: opts.intensity,
        directionX: opts.directionX,
        directionZ: opts.directionZ,
        timerOn: opts.timerOn,
        timerOff: opts.timerOff,
      })
      .run();
    return id;
  }

  // -------------------------------------------------------------------------
  // compile — rasterize rooms/connections into a grid BLOB
  // -------------------------------------------------------------------------

  /**
   * Rasterize rooms and connections into a MapCell[][] grid BLOB and store it
   * on the level row. Must be called after all rooms/connections are added.
   * @param levelId - Level to compile.
   * @throws If the level or its theme is not found.
   */
  compile(levelId: string): void {
    const level = this.db.select().from(schema.levels).where(eq(schema.levels.id, levelId)).get();
    if (!level) throw new Error(`Level not found: ${levelId}`);

    const theme = this.db
      .select()
      .from(schema.themes)
      .where(eq(schema.themes.id, level.themeId))
      .get();
    if (!theme) throw new Error(`Theme not found: ${level.themeId}`);

    const levelRooms = this.db
      .select()
      .from(schema.rooms)
      .where(eq(schema.rooms.levelId, levelId))
      .all();

    const levelConnections = this.db
      .select()
      .from(schema.connections)
      .where(eq(schema.connections.levelId, levelId))
      .all();

    const grid = compileGrid(
      level.width,
      level.depth,
      levelRooms,
      levelConnections,
      theme.primaryWall,
    );

    const packed = packGrid(grid);

    // Build CompiledVisual from rooms + theme
    const compiledVisual: CompiledVisual = {
      version: 1,
      rooms: levelRooms.map((r) => ({
        id: r.id,
        name: r.name,
        bounds: { x: r.boundsX, z: r.boundsZ, w: r.boundsW, h: r.boundsH },
        elevation: r.elevation,
        roomType: r.roomType,
        floorTexture: (r.floorTexture as TextureId | null) ?? null,
        wallTexture: (r.wallTexture as TextureId | null) ?? null,
        ceilingTexture: (r.ceilingTexture as TextureId | null) ?? null,
        fillRule: r.fillRule ? (JSON.parse(r.fillRule) as FillRule) : null,
      })),
      theme: {
        primaryWall: theme.primaryWall,
        texturePalette: theme.texturePalette
          ? (JSON.parse(theme.texturePalette) as Partial<Record<string, TextureId>>)
          : {},
        roomFillRules: theme.roomFillRules
          ? (JSON.parse(theme.roomFillRules) as Partial<Record<string, FillRule>>)
          : {},
      },
    };

    this.db
      .update(schema.levels)
      .set({ compiledGrid: Buffer.from(packed), compiledVisual: JSON.stringify(compiledVisual) })
      .where(eq(schema.levels.id, levelId))
      .run();
  }

  // -------------------------------------------------------------------------
  // validate — structural checks on the level (with actionable errors)
  // -------------------------------------------------------------------------

  /**
   * Run structural validation on a level — checks bounds, reachability,
   * spawn placement, trigger integrity, and cycle detection.
   * @param levelId - Level to validate.
   * @returns Validation result with actionable error messages and suggestions.
   */
  validate(levelId: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const level = this.db.select().from(schema.levels).where(eq(schema.levels.id, levelId)).get();
    if (!level) {
      return {
        valid: false,
        errors: [`Level not found: '${levelId}'. Check the level ID passed to createLevel().`],
        warnings,
      };
    }

    const levelRooms = this.db
      .select()
      .from(schema.rooms)
      .where(eq(schema.rooms.levelId, levelId))
      .all();

    const levelConnections = this.db
      .select()
      .from(schema.connections)
      .where(eq(schema.connections.levelId, levelId))
      .all();

    const levelEntities = this.db
      .select()
      .from(schema.entities)
      .where(eq(schema.entities.levelId, levelId))
      .all();

    const levelTriggers = this.db
      .select()
      .from(schema.triggers)
      .where(eq(schema.triggers.levelId, levelId))
      .all();

    // Check: at least one room exists
    if (levelRooms.length === 0) {
      errors.push('Level has no rooms. Call editor.room() to add at least one room.');
      return { valid: false, errors, warnings };
    }

    // Check: spawn point is inside a room
    const spawnRoom = levelRooms.find((r) => roomContainsPoint(r, level.spawnX, level.spawnZ));
    if (!spawnRoom) {
      const nearest = levelRooms
        .map((r) => {
          const c = roomCenter(r);
          return { room: r, dist: Math.abs(c.x - level.spawnX) + Math.abs(c.z - level.spawnZ) };
        })
        .sort((a, b) => a.dist - b.dist)[0];
      const suggestion = nearest
        ? ` Nearest room is '${nearest.room.name}' at (${nearest.room.boundsX},${nearest.room.boundsZ}) size ${nearest.room.boundsW}x${nearest.room.boundsH}. Try setPlayerSpawn('${levelId}', ${roomCenter(nearest.room).x}, ${roomCenter(nearest.room).z}).`
        : '';
      errors.push(
        `Spawn point (${level.spawnX}, ${level.spawnZ}) is not inside any room.${suggestion}`,
      );
    }

    // Check: rooms within level bounds
    for (const r of levelRooms) {
      if (
        r.boundsX < 0 ||
        r.boundsZ < 0 ||
        r.boundsX + r.boundsW > level.width ||
        r.boundsZ + r.boundsH > level.depth
      ) {
        errors.push(
          `Room '${r.name}' bounds (${r.boundsX},${r.boundsZ} ${r.boundsW}x${r.boundsH}) exceed level bounds (${level.width}x${level.depth}). ` +
            `Room extends to (${r.boundsX + r.boundsW},${r.boundsZ + r.boundsH}) but level max is (${level.width},${level.depth}).`,
        );
      }
    }

    // Check: room overlap detection
    for (let i = 0; i < levelRooms.length; i++) {
      for (let j = i + 1; j < levelRooms.length; j++) {
        if (roomsOverlap(levelRooms[i], levelRooms[j])) {
          warnings.push(
            `Rooms '${levelRooms[i].name}' and '${levelRooms[j].name}' have overlapping bounds. This may cause unexpected grid compilation results.`,
          );
        }
      }
    }

    // Check: no entity spawns outside level bounds
    for (const entity of levelEntities) {
      if (entity.x < 0 || entity.x >= level.width || entity.z < 0 || entity.z >= level.depth) {
        errors.push(
          `Entity '${entity.entityType}' at (${entity.x}, ${entity.z}) is outside level bounds (${level.width}x${level.depth}). ` +
            `Valid range: x=[0,${level.width - 1}], z=[0,${level.depth - 1}].`,
        );
      }
    }

    // Check: trigger zones within level bounds
    for (const trigger of levelTriggers) {
      if (
        trigger.zoneX < 0 ||
        trigger.zoneZ < 0 ||
        trigger.zoneX + trigger.zoneW > level.width ||
        trigger.zoneZ + trigger.zoneH > level.depth
      ) {
        errors.push(
          `Trigger '${trigger.action}' zone (${trigger.zoneX},${trigger.zoneZ} ${trigger.zoneW}x${trigger.zoneH}) exceeds level bounds (${level.width}x${level.depth}).`,
        );
      }
    }

    // Check: entity-to-trigger FK integrity
    const triggerIds = new Set(levelTriggers.map((t) => t.id));
    for (const entity of levelEntities) {
      if (entity.triggerId && !triggerIds.has(entity.triggerId)) {
        errors.push(
          `Entity '${entity.entityType}' at (${entity.x},${entity.z}) references non-existent trigger '${entity.triggerId}'. ` +
            `Available triggers: [${[...triggerIds].join(', ')}].`,
        );
      }
    }

    // Build adjacency list for room graph
    const adjacency = new Map<string, Set<string>>();
    for (const r of levelRooms) {
      adjacency.set(r.id, new Set());
    }
    for (const conn of levelConnections) {
      adjacency.get(conn.fromRoomId)?.add(conn.toRoomId);
      adjacency.get(conn.toRoomId)?.add(conn.fromRoomId);
    }

    // Check: all rooms reachable from spawn room (BFS)
    if (spawnRoom) {
      const visited = new Set<string>();
      const queue = [spawnRoom.id];
      visited.add(spawnRoom.id);

      while (queue.length > 0) {
        const current = queue.shift()!;
        const neighbors = adjacency.get(current);
        if (neighbors) {
          for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
              visited.add(neighbor);
              queue.push(neighbor);
            }
          }
        }
      }

      for (const r of levelRooms) {
        if (!visited.has(r.id)) {
          // Find which connected rooms could reach it
          const connectedRooms = levelRooms.filter((cr) => visited.has(cr.id));
          const nearestConnected = connectedRooms
            .map((cr) => {
              const c1 = roomCenter(cr);
              const c2 = roomCenter(r);
              return { room: cr, dist: Math.abs(c1.x - c2.x) + Math.abs(c1.z - c2.z) };
            })
            .sort((a, b) => a.dist - b.dist)[0];
          const suggestion = nearestConnected
            ? ` Add a connection: editor.corridor('${levelId}', <${nearestConnected.room.name}_id>, <${r.name}_id>).`
            : '';
          errors.push(
            `Room '${r.name}' is not reachable from spawn room '${spawnRoom.name}'.${suggestion}`,
          );
        }
      }
    }

    // Check: DAG has no cycles (DFS with recursion tracking)
    const directedAdj = new Map<string, Set<string>>();
    for (const r of levelRooms) {
      directedAdj.set(r.id, new Set());
    }
    for (const conn of levelConnections) {
      directedAdj.get(conn.fromRoomId)?.add(conn.toRoomId);
    }

    const WHITE = 0;
    const GRAY = 1;
    const BLACK = 2;
    const color = new Map<string, number>();
    for (const r of levelRooms) {
      color.set(r.id, WHITE);
    }

    let hasCycle = false;
    let cycleNodes: string[] = [];
    const dfs = (nodeId: string, path: string[]) => {
      color.set(nodeId, GRAY);
      const neighbors = directedAdj.get(nodeId);
      if (neighbors) {
        for (const neighbor of neighbors) {
          const c = color.get(neighbor);
          if (c === GRAY) {
            hasCycle = true;
            cycleNodes = [...path, nodeId, neighbor];
            return;
          }
          if (c === WHITE) {
            dfs(neighbor, [...path, nodeId]);
            if (hasCycle) return;
          }
        }
      }
      color.set(nodeId, BLACK);
    };

    for (const r of levelRooms) {
      if (color.get(r.id) === WHITE) {
        dfs(r.id, []);
        if (hasCycle) break;
      }
    }

    if (hasCycle) {
      const cycleRoomNames = cycleNodes.map((id) => {
        const r = levelRooms.find((room) => room.id === id);
        return r ? `'${r.name}'` : id;
      });
      errors.push(
        `Room connection graph contains a cycle: ${cycleRoomNames.join(' -> ')}. ` +
          `Remove or reverse one connection to break the cycle.`,
      );
    }

    // Warnings: rooms with no entities
    const entityRoomIds = new Set(levelEntities.filter((e) => e.roomId).map((e) => e.roomId));
    for (const r of levelRooms) {
      if (r.roomType !== 'corridor' && !entityRoomIds.has(r.id)) {
        // Check if any entity position falls inside this room
        const hasEntityInBounds = levelEntities.some((e) => roomContainsPoint(r, e.x, e.z));
        if (!hasEntityInBounds) {
          warnings.push(
            `Room '${r.name}' (${r.roomType}) has no entities. Consider adding enemies, pickups, or props.`,
          );
        }
      }
    }

    // Warnings: dead-end rooms (only 1 connection, not boss/secret)
    for (const r of levelRooms) {
      const connCount = adjacency.get(r.id)?.size ?? 0;
      if (connCount === 0 && levelRooms.length > 1) {
        warnings.push(`Room '${r.name}' has no connections at all.`);
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  // -------------------------------------------------------------------------
  // Convenience methods — common patterns
  // -------------------------------------------------------------------------

  /**
   * Shorthand for `addRoom()` with positional x/z/w/h arguments.
   * @param levelId - Parent level ID.
   * @param name - Human-readable room name.
   * @param x - Left edge grid X coordinate.
   * @param z - Top edge grid Z coordinate.
   * @param w - Width in grid cells.
   * @param h - Depth in grid cells.
   * @param opts - Optional room type, elevation, and cell overrides.
   * @returns The generated room ID (UUID).
   */
  room(
    levelId: string,
    name: string,
    x: number,
    z: number,
    w: number,
    h: number,
    opts?: Partial<{
      roomType: string;
      elevation: number;
      floorCell: number;
      wallCell: number;
      sortOrder: number;
      floorTexture: TextureId;
      wallTexture: TextureId;
      ceilingTexture: TextureId;
      fillRule: FillRule;
    }>,
  ): string {
    return this.addRoom(levelId, name, {
      roomType: opts?.roomType ?? 'exploration',
      boundsX: x,
      boundsZ: z,
      boundsW: w,
      boundsH: h,
      elevation: opts?.elevation,
      floorCell: opts?.floorCell,
      wallCell: opts?.wallCell,
      sortOrder: opts?.sortOrder,
      floorTexture: opts?.floorTexture,
      wallTexture: opts?.wallTexture,
      ceilingTexture: opts?.ceilingTexture,
      fillRule: opts?.fillRule,
    });
  }

  /**
   * Shorthand for `connect()` with type='corridor'.
   * @param width - Corridor width in grid cells (default 2).
   * @returns The generated connection ID (UUID).
   */
  corridor(levelId: string, fromRoomId: string, toRoomId: string, width?: number): string {
    return this.connect(levelId, fromRoomId, toRoomId, {
      connectionType: 'corridor',
      corridorWidth: width ?? 2,
    });
  }

  /**
   * Spawn an enemy entity at grid coordinates.
   * @param type - Enemy type identifier (use ENEMY_TYPES constants).
   * @param x - Grid X coordinate.
   * @param z - Grid Z coordinate.
   * @returns The generated entity ID (UUID).
   */
  spawnEnemy(
    levelId: string,
    type: string,
    x: number,
    z: number,
    opts?: {
      roomId?: string;
      elevation?: number;
      facing?: number;
      patrol?: Array<{ x: number; z: number }>;
      overrides?: Record<string, unknown>;
    },
  ): string {
    return this.addEntity(levelId, {
      entityType: type,
      x,
      z,
      spawnCategory: 'enemy',
      roomId: opts?.roomId,
      elevation: opts?.elevation,
      facing: opts?.facing,
      patrol: opts?.patrol,
      overrides: opts?.overrides,
    });
  }

  /**
   * Spawn a pickup entity at grid coordinates.
   * @param type - Pickup type identifier (use PICKUP_TYPES constants).
   * @returns The generated entity ID (UUID).
   */
  spawnPickup(levelId: string, type: string, x: number, z: number): string {
    return this.addEntity(levelId, {
      entityType: type,
      x,
      z,
      spawnCategory: 'pickup',
    });
  }

  /**
   * Spawn a decorative prop at grid coordinates with optional surface anchor.
   * @param type - Prop type identifier (e.g. 'prop_candle', 'prop_coffin').
   * @returns The generated entity ID (UUID).
   */
  spawnProp(
    levelId: string,
    type: string,
    x: number,
    z: number,
    opts?: {
      roomId?: string;
      elevation?: number;
      facing?: number;
      surfaceAnchor?: {
        face: string;
        offsetX: number;
        offsetY: number;
        offsetZ: number;
        rotation: number[];
        scale: number;
      };
    },
  ): string {
    const resolvedType = resolveAssetName(type);
    return this.addEntity(levelId, {
      entityType: resolvedType,
      x,
      z,
      spawnCategory: 'prop',
      roomId: opts?.roomId,
      elevation: opts?.elevation,
      facing: opts?.facing,
      surfaceAnchor: opts?.surfaceAnchor,
    });
  }

  /**
   * Spawn a boss entity (separate from regular enemies for clarity).
   * Uses spawnCategory='boss' which affects AI governor behavior.
   */
  spawnBoss(
    levelId: string,
    type: string,
    x: number,
    z: number,
    opts?: {
      roomId?: string;
      facing?: number;
      overrides?: Record<string, unknown>;
    },
  ): string {
    return this.addEntity(levelId, {
      entityType: type,
      x,
      z,
      spawnCategory: 'boss',
      roomId: opts?.roomId,
      facing: opts?.facing,
      overrides: opts?.overrides,
    });
  }

  /**
   * Set up a lock-on-entry arena pattern:
   * 1. Player enters trigger zone → doors lock
   * 2. Enemies spawn in waves
   * 3. All enemies killed → doors unlock
   *
   * Returns the trigger IDs for further customization.
   */
  lockOnEntry(
    levelId: string,
    roomId: string,
    triggerZone: { x: number; z: number; w: number; h: number },
  ): { lockTriggerId: string; unlockTriggerId: string } {
    const lockTriggerId = this.addTrigger(levelId, {
      action: TRIGGER_ACTIONS.LOCK_DOORS,
      zoneX: triggerZone.x,
      zoneZ: triggerZone.z,
      zoneW: triggerZone.w,
      zoneH: triggerZone.h,
      roomId,
      once: true,
    });
    const unlockTriggerId = this.addTrigger(levelId, {
      action: TRIGGER_ACTIONS.UNLOCK_DOORS,
      zoneX: triggerZone.x,
      zoneZ: triggerZone.z,
      zoneW: triggerZone.w,
      zoneH: triggerZone.h,
      roomId,
      once: true,
      actionData: { condition: 'allEnemiesKilled' },
    });
    return { lockTriggerId, unlockTriggerId };
  }

  /**
   * Set up an ambush: player enters zone → enemies spawn.
   * Returns the spawn trigger ID so entities can reference it.
   */
  ambush(
    levelId: string,
    triggerZone: { x: number; z: number; w: number; h: number },
    enemies: Array<{ type: string; x: number; z: number }>,
    opts?: { roomId?: string },
  ): string {
    const triggerId = this.addTrigger(levelId, {
      action: TRIGGER_ACTIONS.SPAWN_WAVE,
      zoneX: triggerZone.x,
      zoneZ: triggerZone.z,
      zoneW: triggerZone.w,
      zoneH: triggerZone.h,
      roomId: opts?.roomId,
      once: true,
      actionData: {
        enemies: enemies.map((e) => ({ type: e.type, count: 1 })),
      },
    });

    // Also create entities tied to this trigger
    for (const enemy of enemies) {
      this.addEntity(levelId, {
        entityType: enemy.type,
        x: enemy.x,
        z: enemy.z,
        spawnCategory: 'enemy',
        roomId: opts?.roomId,
        triggerId,
      });
    }

    return triggerId;
  }

  /**
   * Set up arena waves with lock/unlock:
   * 1. Player enters → doors lock
   * 2. Wave N spawns
   * 3. Wave N cleared → Wave N+1 spawns
   * 4. Final wave cleared → doors unlock
   *
   * Returns trigger IDs for all waves.
   */
  setupArenaWaves(
    levelId: string,
    roomId: string,
    triggerZone: { x: number; z: number; w: number; h: number },
    waves: Array<Array<{ type: string; x: number; z: number }>>,
  ): { lockTriggerId: string; waveTriggersIds: string[]; unlockTriggerId: string } {
    const { lockTriggerId, unlockTriggerId } = this.lockOnEntry(levelId, roomId, triggerZone);

    const waveTriggersIds: string[] = [];
    for (let i = 0; i < waves.length; i++) {
      const wave = waves[i];
      const triggerId = this.addTrigger(levelId, {
        action: TRIGGER_ACTIONS.SPAWN_WAVE,
        zoneX: triggerZone.x,
        zoneZ: triggerZone.z,
        zoneW: triggerZone.w,
        zoneH: triggerZone.h,
        roomId,
        once: true,
        actionData: {
          waveIndex: i,
          enemies: wave.map((e) => ({ type: e.type, count: 1 })),
        },
      });
      waveTriggersIds.push(triggerId);

      // Create entities for this wave
      for (const enemy of wave) {
        this.addEntity(levelId, {
          entityType: enemy.type,
          x: enemy.x,
          z: enemy.z,
          spawnCategory: 'enemy',
          roomId,
          triggerId,
        });
      }
    }

    return { lockTriggerId, waveTriggersIds, unlockTriggerId };
  }

  /**
   * Add a boss intro dialogue trigger.
   */
  bossIntro(
    levelId: string,
    triggerZone: { x: number; z: number; w: number; h: number },
    text: string,
    opts?: { roomId?: string; delay?: number },
  ): string {
    return this.addTrigger(levelId, {
      action: TRIGGER_ACTIONS.BOSS_INTRO,
      zoneX: triggerZone.x,
      zoneZ: triggerZone.z,
      zoneW: triggerZone.w,
      zoneH: triggerZone.h,
      roomId: opts?.roomId,
      once: true,
      delay: opts?.delay,
      actionData: { text },
    });
  }

  /**
   * Add a dialogue/lore trigger zone.
   */
  dialogue(
    levelId: string,
    triggerZone: { x: number; z: number; w: number; h: number },
    text: string,
    opts?: { roomId?: string },
  ): string {
    return this.addTrigger(levelId, {
      action: TRIGGER_ACTIONS.DIALOGUE,
      zoneX: triggerZone.x,
      zoneZ: triggerZone.z,
      zoneW: triggerZone.w,
      zoneH: triggerZone.h,
      roomId: opts?.roomId,
      once: true,
      actionData: { text },
    });
  }

  /**
   * Set the player spawn point for a level.
   * @param x - Grid X coordinate.
   * @param z - Grid Z coordinate.
   * @param facing - Initial facing direction in radians (default 0 = +Z).
   */
  setPlayerSpawn(levelId: string, x: number, z: number, facing?: number): void {
    this.db
      .update(schema.levels)
      .set({
        spawnX: x,
        spawnZ: z,
        spawnFacing: facing ?? 0,
      })
      .where(eq(schema.levels.id, levelId))
      .run();
  }

  // -------------------------------------------------------------------------
  // Asset discovery — delegate to AssetDiscovery module
  // -------------------------------------------------------------------------

  /**
   * Get Meshy AI prop asset IDs available for a given circle.
   * Merges general props with circle-specific props.
   * @param circle - Circle number (1-9).
   * @returns Sorted array of asset ID strings (e.g. 'hellfire-brazier', 'fog-lantern').
   */
  getAvailableProps(circle: number): string[] {
    return getAvailablePropsForCircle(circle);
  }

  /**
   * Get Meshy AI enemy asset IDs available for a given circle.
   * Merges general enemies with circle-specific enemies and bosses.
   * @param circle - Circle number (1-9).
   * @returns Sorted array of asset ID strings (e.g. 'goat-brute', 'boss-azazel').
   */
  getAvailableEnemies(circle: number): string[] {
    return getAvailableEnemiesForCircle(circle);
  }

  // -------------------------------------------------------------------------
  // decorateRoom — batch prop placement
  // -------------------------------------------------------------------------

  /**
   * Batch-place multiple decorative props in a room via `spawnProp()`.
   * @param levelId - Parent level ID.
   * @param roomId - Room to decorate.
   * @param decorations - Array of prop specifications with type, position, and optional surface anchor.
   * @returns Array of generated entity IDs (one per decoration).
   */
  decorateRoom(
    levelId: string,
    roomId: string,
    decorations: Array<{
      type: string;
      x: number;
      z: number;
      elevation?: number;
      facing?: number;
      surfaceAnchor?: {
        face: string;
        offsetX: number;
        offsetY: number;
        offsetZ: number;
        rotation: number[];
        scale: number;
      };
    }>,
  ): string[] {
    const ids: string[] = [];
    for (const dec of decorations) {
      const id = this.spawnProp(levelId, dec.type, dec.x, dec.z, {
        roomId,
        elevation: dec.elevation,
        facing: dec.facing,
        surfaceAnchor: dec.surfaceAnchor,
      });
      ids.push(id);
    }
    return ids;
  }

  // -------------------------------------------------------------------------
  // Decals — surface texture decoration
  // -------------------------------------------------------------------------

  /**
   * Place a decal (surface texture overlay) at grid coordinates.
   * Decals project onto floor, wall, or ceiling geometry as translucent
   * texture patches (frost, cracks, stains, etc.).
   *
   * @param levelId - Parent level ID.
   * @param type - Decal type identifier (use DECAL_TYPES constants).
   * @param x - Grid X coordinate (center of decal).
   * @param z - Grid Z coordinate (center of decal).
   * @param opts - Optional width, height, rotation, opacity, surface, roomId.
   * @returns The generated decal ID (UUID).
   */
  placeDecal(
    levelId: string,
    type: string,
    x: number,
    z: number,
    opts?: {
      w?: number;
      h?: number;
      rotation?: number;
      opacity?: number;
      surface?: 'floor' | 'wall' | 'ceiling';
      roomId?: string;
    },
  ): string {
    const id = generateId();
    this.db
      .insert(schema.decals)
      .values({
        id,
        levelId,
        decalType: type,
        x,
        z,
        w: opts?.w ?? 2,
        h: opts?.h ?? 2,
        rotation: opts?.rotation ?? 0,
        opacity: opts?.opacity ?? 0.8,
        surface: opts?.surface ?? 'floor',
        roomId: opts?.roomId,
      })
      .run();
    return id;
  }

  /**
   * Batch-place multiple decals in a room.
   * @param levelId - Parent level ID.
   * @param roomId - Room to decorate.
   * @param decals - Array of decal specifications.
   * @returns Array of generated decal IDs.
   */
  placeDecals(
    levelId: string,
    roomId: string,
    decals: Array<{
      type: string;
      x: number;
      z: number;
      w?: number;
      h?: number;
      rotation?: number;
      opacity?: number;
      surface?: 'floor' | 'wall' | 'ceiling';
    }>,
  ): string[] {
    const ids: string[] = [];
    for (const decal of decals) {
      const id = this.placeDecal(levelId, decal.type, decal.x, decal.z, {
        ...decal,
        roomId,
      });
      ids.push(id);
    }
    return ids;
  }
}
