#!/usr/bin/env npx tsx
import * as fs from 'node:fs';
import * as path from 'node:path';
/**
 * export-levels.ts — Export compiled circle levels from levels.db to JSON.
 *
 * Reads each circle level (1-9) from the SQLite database, converts it to the
 * full LevelData shape (including triggers, env zones, decals), and writes
 * individual JSON files to config/levels/circle-{1..9}.json.
 *
 * Also computes `requiredTextureKeys` (the TEXTURE_ASSETS keys needed for this
 * circle's walls, floors, ceilings, doors, and decals) at export time so the
 * runtime LoadingScreen can load exactly the right textures without hardcoded
 * lookup tables.
 *
 * Run: npx tsx scripts/export-levels.ts
 * Output: config/levels/circle-{1..9}.json
 */
import BetterSqlite3 from 'better-sqlite3';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { CELL_SIZE } from '../src/constants';
import {
  toDecals,
  toEnvironmentZones,
  toLevelData,
  toTriggersAndEntities,
} from '../src/db/LevelDbAdapter';
import { migrateAndSeed } from '../src/db/migrate';
import * as schema from '../src/db/schema';

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DB_PATH = path.join(PROJECT_ROOT, 'assets', 'levels.db');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'config', 'levels');

// ---------------------------------------------------------------------------
// Texture key computation — build-time only, NOT shipped in game runtime.
// These tables mirror Materials.ts structures. LoadingScreen reads the
// computed result from the JSON; it never needs these tables itself.
// ---------------------------------------------------------------------------

/** Wall texture key lists by theme name. Mirrors Materials.ts WALL_TEXTURE_SETS. */
const THEME_WALL_TEXTURE_KEYS: Record<string, string[]> = {
  limbo: ['limbo-color', 'limbo-normal', 'limbo-roughness'],
  lust: ['lust-color', 'lust-normal', 'lust-roughness'],
  gluttony: ['gluttony-color', 'gluttony-normal', 'gluttony-roughness'],
  greed: ['greed-color', 'greed-normal', 'greed-roughness', 'greed-metalness'],
  wrath: ['lava-color', 'lava-normal', 'lava-roughness', 'lava-emission'],
  heresy: ['heresy-color', 'heresy-normal', 'heresy-roughness'],
  violence: ['flesh-color', 'flesh-normal', 'flesh-roughness'],
  fraud: ['fraud-color', 'fraud-normal', 'fraud-roughness'],
  treachery: ['treachery-color', 'treachery-normal', 'treachery-roughness'],
  firePits: ['stone-color', 'stone-normal', 'stone-roughness'],
  fleshCaverns: ['flesh-color', 'flesh-normal', 'flesh-roughness'],
  obsidianFortress: ['obsidian-color', 'obsidian-normal', 'obsidian-roughness'],
  theVoid: ['obsidian-color', 'obsidian-normal', 'obsidian-roughness'],
};

/** Accent wall texture keys by MapCell value. Mirrors Materials.ts WALL_TYPE_TEXTURE_SETS. */
const WALL_CELL_TEXTURE_KEYS: Record<number, string[]> = {
  1: ['stone-color', 'stone-normal', 'stone-roughness'],
  2: ['flesh-color', 'flesh-normal', 'flesh-roughness'],
  3: ['lava-color', 'lava-normal', 'lava-roughness', 'lava-emission'],
  4: ['obsidian-color', 'obsidian-normal', 'obsidian-roughness'],
};

/** Always needed: floor, ceiling, doors appear in every level. */
const SHARED_TEXTURE_KEYS = [
  'floor-color',
  'floor-normal',
  'floor-roughness',
  'ceiling-color',
  'ceiling-normal',
  'ceiling-roughness',
  'door-color',
  'door-normal',
  'door-roughness',
  'door-metalness',
];

/** Texture keys by decal type (matches decals.decalType DB column values). */
const DECAL_TEXTURE_KEYS: Record<string, string[]> = {
  leaking001: [
    'decal-leaking001-color',
    'decal-leaking001-normal',
    'decal-leaking001-opacity',
    'decal-leaking001-roughness',
  ],
  leaking005: [
    'decal-leaking005-color',
    'decal-leaking005-normal',
    'decal-leaking005-opacity',
    'decal-leaking005-roughness',
  ],
  damage001: [
    'decal-damage001-color',
    'decal-damage001-normal',
    'decal-damage001-opacity',
    'decal-damage001-roughness',
  ],
};

function computeRequiredTextureKeys(
  themeName: string,
  accentWallCells: number[],
  decalTypes: string[],
): string[] {
  const keys = new Set<string>(SHARED_TEXTURE_KEYS);

  // Theme wall textures
  for (const k of THEME_WALL_TEXTURE_KEYS[themeName] ?? []) keys.add(k);

  // Accent wall type textures (per-room overrides)
  for (const cell of accentWallCells) {
    for (const k of WALL_CELL_TEXTURE_KEYS[cell] ?? []) keys.add(k);
  }

  // Decal textures present in this level
  for (const decalType of decalTypes) {
    for (const k of DECAL_TEXTURE_KEYS[decalType] ?? []) keys.add(k);
  }

  return [...keys];
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // Open database
  if (!fs.existsSync(DB_PATH)) {
    console.error(`Database not found: ${DB_PATH}`);
    process.exit(1);
  }

  const sqliteDb = new BetterSqlite3(DB_PATH);
  const db = drizzle(sqliteDb, { schema });
  await migrateAndSeed(db);

  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let successCount = 0;
  let failCount = 0;

  for (let circleNum = 1; circleNum <= 9; circleNum++) {
    try {
      // Find the circle level
      const rows = db
        .select()
        .from(schema.levels)
        .where(eq(schema.levels.circleNumber, circleNum))
        .all()
        .filter(
          (l) =>
            (l.levelType === 'procedural' || l.levelType === 'circle') && l.compiledGrid !== null,
        );

      if (rows.length === 0) {
        console.warn(`  [SKIP] Circle ${circleNum}: no level found in database`);
        failCount++;
        continue;
      }

      const levelRow = rows[0];
      const levelId = levelRow.id;

      // Convert to LevelData
      const levelData = toLevelData(db, levelId);

      // Load triggers + triggered entities
      const { triggers, triggeredEntities } = toTriggersAndEntities(db, levelId);

      // Load environment zones
      const envZones = toEnvironmentZones(db, levelId);

      // Load decals
      const decals = toDecals(db, levelId);

      // ── Build spawnCategory map for non-triggered entities ──────────────
      // DB stores entities at grid coords (e.x, e.z). toLevelData converts to
      // world coords (grid * CELL_SIZE), so spawns are world-space in the JSON.
      // We build the lookup key in grid coords to match the DB.
      const entityRows = db
        .select()
        .from(schema.entities)
        .where(eq(schema.entities.levelId, levelId))
        .all()
        .filter((e) => e.triggerId === null);

      const spawnCategoryMap = new Map<string, string>();
      for (const e of entityRows) {
        spawnCategoryMap.set(`${e.entityType}:${e.x}:${e.z}`, e.spawnCategory);
      }

      // Augment spawns with spawnCategory (world→grid: divide by CELL_SIZE)
      const spawnsWithCategory = levelData.spawns.map((spawn) => ({
        ...spawn,
        spawnCategory:
          spawnCategoryMap.get(`${spawn.type}:${spawn.x / CELL_SIZE}:${spawn.z / CELL_SIZE}`) ??
          'unknown',
      }));

      // ── Compute requiredTextureKeys ─────────────────────────────────────
      const decalTypes = [...new Set((decals ?? []).map((d) => d.decalType))];
      const requiredTextureKeys = computeRequiredTextureKeys(
        levelData.theme.name,
        levelData.theme.accentWalls,
        decalTypes,
      );

      // Compose the full JSON shape
      const output = {
        circleNumber: circleNum,
        id: levelId,
        name: levelRow.name,
        width: levelData.width,
        depth: levelData.depth,
        floor: levelData.floor,
        grid: levelData.grid,
        playerSpawn: levelData.playerSpawn,
        spawns: spawnsWithCategory,
        theme: levelData.theme,
        requiredTextureKeys,
        envZones: envZones.length > 0 ? envZones : undefined,
        decals: decals.length > 0 ? decals : undefined,
        triggers: triggers.length > 0 ? triggers : undefined,
        triggeredEntities: triggeredEntities.length > 0 ? triggeredEntities : undefined,
      };

      // Write JSON file
      const outPath = path.join(OUTPUT_DIR, `circle-${circleNum}.json`);
      fs.writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`);
      console.log(
        `  [OK] Circle ${circleNum}: ${outPath} (${levelData.spawns.length} spawns, ${triggers.length} triggers, ${requiredTextureKeys.length} texture keys)`,
      );
      successCount++;
    } catch (err) {
      console.error(`  [FAIL] Circle ${circleNum}:`, err);
      failCount++;
    }
  }

  sqliteDb.close();
  console.log(`\nDone: ${successCount} exported, ${failCount} failed/skipped`);
  if (failCount > 0) {
    process.exit(1);
  }
}

main();
