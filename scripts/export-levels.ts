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
 * Run: npx tsx scripts/export-levels.ts
 * Output: config/levels/circle-{1..9}.json
 */
import BetterSqlite3 from 'better-sqlite3';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';
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
        spawns: levelData.spawns,
        theme: levelData.theme,
        envZones: envZones.length > 0 ? envZones : undefined,
        decals: decals.length > 0 ? decals : undefined,
        triggers: triggers.length > 0 ? triggers : undefined,
        triggeredEntities: triggeredEntities.length > 0 ? triggeredEntities : undefined,
      };

      // Write JSON file
      const outPath = path.join(OUTPUT_DIR, `circle-${circleNum}.json`);
      fs.writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`);
      console.log(
        `  [OK] Circle ${circleNum}: ${outPath} (${levelData.spawns.length} spawns, ${triggers.length} triggers)`,
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
