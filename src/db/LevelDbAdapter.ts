/**
 * Converts DB level data into the LevelData interface consumed by the
 * rendering pipeline. Bridges the Drizzle ORM schema with the engine-
 * agnostic game types (LevelData, FloorTheme, SpawnData).
 */
import { eq } from 'drizzle-orm';
import { CELL_SIZE } from '../constants';
import type { EntityType } from '../game/entities/components';
import type { FloorTheme } from '../game/levels/FloorThemes';
import type { LevelData } from '../game/levels/LevelData';
import type { RuntimeTrigger, RuntimeTriggeredEntity } from '../game/systems/TriggerSystem';
import type { DrizzleDb } from './connection';
import { unpackGrid } from './GridCompiler';
import type { Theme } from './schema';
import * as schema from './schema';

/**
 * Convert a DB theme row into the FloorTheme interface used by the game.
 */
export function toFloorTheme(dbTheme: Theme): FloorTheme {
  return {
    name: dbTheme.name,
    displayName: dbTheme.displayName,
    primaryWall: dbTheme.primaryWall,
    accentWalls: dbTheme.accentWalls,
    enemyTypes: (dbTheme.enemyTypes ?? []) as EntityType[],
    enemyDensity: dbTheme.enemyDensity,
    pickupDensity: dbTheme.pickupDensity,
    ambientColor: dbTheme.ambientColor,
  };
}

/**
 * Load a level from the database and convert it into the LevelData format
 * consumed by the renderer and game systems.
 *
 * - Unpacks the compiled grid BLOB into a MapCell[][] via GridCompiler.
 * - Fetches non-triggered entities and maps them to SpawnData.
 * - Converts the theme row to a FloorTheme.
 * - Scales playerSpawn from grid coordinates to world coordinates.
 */
// ---------------------------------------------------------------------------
// RuntimeEnvZone — runtime representation of an environment zone
// ---------------------------------------------------------------------------

export interface RuntimeEnvZone {
  id: string;
  envType: string;
  /** World X coordinate (grid * CELL_SIZE). */
  x: number;
  /** World Z coordinate (grid * CELL_SIZE). */
  z: number;
  /** World width. */
  w: number;
  /** World height (depth). */
  h: number;
  intensity: number;
  dirX: number;
  dirZ: number;
  /** Milliseconds active (0 = always on). */
  timerOn: number;
  /** Milliseconds inactive. */
  timerOff: number;
}

/**
 * Load environment zones from the database for a given level and convert
 * grid coordinates to world coordinates.
 */
export function toEnvironmentZones(db: DrizzleDb, levelId: string): RuntimeEnvZone[] {
  const rows = db
    .select()
    .from(schema.environmentZones)
    .where(eq(schema.environmentZones.levelId, levelId))
    .all();

  return rows.map((row) => ({
    id: row.id,
    envType: row.envType,
    x: row.boundsX * CELL_SIZE,
    z: row.boundsZ * CELL_SIZE,
    w: row.boundsW * CELL_SIZE,
    h: row.boundsH * CELL_SIZE,
    intensity: row.intensity,
    dirX: row.directionX ?? 0,
    dirZ: row.directionZ ?? 0,
    timerOn: row.timerOn ?? 0,
    timerOff: row.timerOff ?? 0,
  }));
}

// ---------------------------------------------------------------------------
// Triggers + triggered entities
// ---------------------------------------------------------------------------

/**
 * Load all triggers and trigger-gated entities for a level from the database.
 * Converts grid coordinates to world coordinates.
 */
export function toTriggersAndEntities(
  db: DrizzleDb,
  levelId: string,
): { triggers: RuntimeTrigger[]; triggeredEntities: RuntimeTriggeredEntity[] } {
  // Fetch all triggers for this level
  const triggerRows = db
    .select()
    .from(schema.triggers)
    .where(eq(schema.triggers.levelId, levelId))
    .all();

  // Fetch all entities with a triggerId for this level
  const entityRows = db
    .select()
    .from(schema.entities)
    .where(eq(schema.entities.levelId, levelId))
    .all()
    .filter((e) => e.triggerId !== null);

  // Build trigger ID to linked entity IDs map
  const triggerEntityMap = new Map<string, string[]>();
  for (const e of entityRows) {
    const tid = e.triggerId!;
    if (!triggerEntityMap.has(tid)) {
      triggerEntityMap.set(tid, []);
    }
    triggerEntityMap.get(tid)!.push(e.id);
  }

  const triggers: RuntimeTrigger[] = triggerRows.map((row) => ({
    id: row.id,
    action: row.action,
    zoneX: row.zoneX * CELL_SIZE,
    zoneZ: row.zoneZ * CELL_SIZE,
    zoneW: row.zoneW * CELL_SIZE,
    zoneH: row.zoneH * CELL_SIZE,
    once: row.once,
    fired: false,
    delay: row.delay * 1000, // DB stores seconds, runtime uses ms
    pendingFireTime: 0,
    actionData: row.actionData ?? null,
    linkedEntityIds: triggerEntityMap.get(row.id) ?? [],
  }));

  const triggeredEntities: RuntimeTriggeredEntity[] = entityRows.map((e) => ({
    entityType: e.entityType,
    x: e.x * CELL_SIZE,
    z: e.z * CELL_SIZE,
    facing: e.facing,
    triggerId: e.triggerId!,
    overrides: (e.overrides as Record<string, unknown>) ?? null,
    spawnCategory: e.spawnCategory,
  }));

  return { triggers, triggeredEntities };
}

// ---------------------------------------------------------------------------
// toLevelData
// ---------------------------------------------------------------------------

export function toLevelData(db: DrizzleDb, levelId: string): LevelData {
  // Fetch the level row
  const levelRows = db.select().from(schema.levels).where(eq(schema.levels.id, levelId)).all();

  if (levelRows.length === 0) {
    throw new Error(`Level not found: ${levelId}`);
  }

  const level = levelRows[0];

  // Unpack compiled grid BLOB -> MapCell[][]
  if (!level.compiledGrid) {
    throw new Error(`Level ${levelId} has no compiled grid`);
  }

  const rawGrid = level.compiledGrid;
  const gridBlob =
    rawGrid instanceof Uint8Array ? rawGrid : new Uint8Array(rawGrid as ArrayBufferLike);

  const expectedSize = level.width * level.depth;
  if (gridBlob.length !== expectedSize) {
    throw new Error(
      `Level ${levelId} compiled grid blob size mismatch: ` +
        `expected ${expectedSize} bytes (${level.width}x${level.depth}), got ${gridBlob.length}`,
    );
  }

  const grid = unpackGrid(gridBlob, level.width, level.depth);

  // Fetch entities that are NOT trigger-gated (trigger_id IS NULL)
  const entityRows = db
    .select()
    .from(schema.entities)
    .where(eq(schema.entities.levelId, levelId))
    .all()
    .filter((e) => e.triggerId === null);

  // Convert entity rows to SpawnData format
  // Entity positions in DB are grid coordinates; SpawnData uses world coordinates
  const spawns = entityRows.map((e) => {
    const spawn: { type: string; x: number; z: number; weaponId?: string; rotation?: number } = {
      type: e.entityType,
      x: e.x * CELL_SIZE,
      z: e.z * CELL_SIZE,
    };

    // Include optional fields only when present
    if (e.overrides && typeof e.overrides === 'object' && 'weaponId' in e.overrides) {
      spawn.weaponId = (e.overrides as { weaponId: string }).weaponId;
    }

    if (e.facing !== 0) {
      spawn.rotation = e.facing;
    }

    return spawn;
  });

  // Fetch theme row
  const themeRows = db
    .select()
    .from(schema.themes)
    .where(eq(schema.themes.id, level.themeId))
    .all();

  if (themeRows.length === 0) {
    throw new Error(`Theme not found: ${level.themeId}`);
  }

  const theme = toFloorTheme(themeRows[0]);

  return {
    width: level.width,
    depth: level.depth,
    floor: level.floor,
    grid,
    playerSpawn: {
      x: level.spawnX * CELL_SIZE,
      y: 1,
      z: level.spawnZ * CELL_SIZE,
    },
    spawns,
    theme,
    levelId,
  };
}
