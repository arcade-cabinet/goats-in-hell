/**
 * Zod schema for compiled level JSON data.
 *
 * Validates the full LevelData shape including triggers, environment zones,
 * and decals that are embedded in the exported JSON files.
 */
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Sub-schemas
// ---------------------------------------------------------------------------

const Vec3Schema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

const SpawnDataSchema = z.object({
  type: z.string(),
  x: z.number(),
  z: z.number(),
  weaponId: z.string().optional(),
  rotation: z.number().optional(),
  /** Entity category — used by LoadingScreen to derive model keys without runtime lookup tables. */
  spawnCategory: z.string().optional(),
});

const FloorThemeSchema = z.object({
  name: z.string(),
  displayName: z.string(),
  primaryWall: z.number().int(),
  accentWalls: z.array(z.number().int()),
  enemyTypes: z.array(z.string()),
  enemyDensity: z.number(),
  pickupDensity: z.number(),
  ambientColor: z.string(),
});

const RuntimeEnvZoneSchema = z.object({
  id: z.string(),
  envType: z.string(),
  x: z.number(),
  z: z.number(),
  w: z.number(),
  h: z.number(),
  intensity: z.number(),
  dirX: z.number(),
  dirZ: z.number(),
  timerOn: z.number(),
  timerOff: z.number(),
});

const RuntimeDecalSchema = z.object({
  id: z.string(),
  decalType: z.string(),
  x: z.number(),
  z: z.number(),
  w: z.number(),
  h: z.number(),
  rotation: z.number(),
  opacity: z.number(),
  surface: z.string(),
});

const RuntimeTriggerSchema = z.object({
  id: z.string(),
  action: z.string(),
  zoneX: z.number(),
  zoneZ: z.number(),
  zoneW: z.number(),
  zoneH: z.number(),
  once: z.boolean(),
  fired: z.boolean(),
  delay: z.number(),
  pendingFireTime: z.number(),
  actionData: z.record(z.string(), z.unknown()).nullable(),
  linkedEntityIds: z.array(z.string()),
});

const RuntimeTriggeredEntitySchema = z.object({
  entityType: z.string(),
  x: z.number(),
  z: z.number(),
  facing: z.number(),
  triggerId: z.string(),
  overrides: z.record(z.string(), z.unknown()).nullable(),
  spawnCategory: z.string(),
});

// ---------------------------------------------------------------------------
// Main schema
// ---------------------------------------------------------------------------

export const LevelSchema = z.object({
  circleNumber: z.number().int().min(1).max(9),
  id: z.string(),
  name: z.string(),
  width: z.number().int(),
  depth: z.number().int(),
  floor: z.number().int(),
  grid: z.array(z.array(z.number().int())),
  playerSpawn: Vec3Schema,
  spawns: z.array(SpawnDataSchema),
  theme: FloorThemeSchema,
  envZones: z.array(RuntimeEnvZoneSchema).optional(),
  decals: z.array(RuntimeDecalSchema).optional(),
  triggers: z.array(RuntimeTriggerSchema).optional(),
  triggeredEntities: z.array(RuntimeTriggeredEntitySchema).optional(),
  /**
   * TEXTURE_ASSETS keys required by this circle's walls, floors, ceilings,
   * doors, and decals. Computed at export time by export-levels.ts so the
   * LoadingScreen can load exactly the right textures with no runtime lookup tables.
   */
  requiredTextureKeys: z.array(z.string()).optional().default([]),
});

export type CompiledLevel = z.infer<typeof LevelSchema>;
