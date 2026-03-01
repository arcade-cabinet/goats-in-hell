#!/usr/bin/env npx tsx
import path from 'node:path';
/**
 * CLI script to playtest all (or a single) level in the database.
 *
 * Usage:
 *   npx tsx scripts/playtest-all.ts              # test all levels
 *   npx tsx scripts/playtest-all.ts --level foo   # test one level
 *   npx tsx scripts/playtest-all.ts --verbose     # full diagnostics
 */
import BetterSqlite3 from 'better-sqlite3';
import { eq } from 'drizzle-orm';
import { initFromBetterSqlite } from '../src/db/connection';
import { toLevelData } from '../src/db/LevelDbAdapter';
import { migrateAndSeed } from '../src/db/migrate';
import { type PlaytestResult, runPlaytest } from '../src/db/PlaytestRunner';
import * as schema from '../src/db/schema';

// ---------------------------------------------------------------------------
// ANSI color helpers
// ---------------------------------------------------------------------------

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);

function getFlag(name: string): boolean {
  return args.includes(`--${name}`);
}

function getOption(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1 || idx + 1 >= args.length) return undefined;
  return args[idx + 1];
}

const verbose = getFlag('verbose');
const singleLevelId = getOption('level');

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const dbPath = path.resolve(process.cwd(), 'assets', 'levels.db');
  const sqliteDb = new BetterSqlite3(dbPath);
  sqliteDb.pragma('journal_mode = WAL');
  sqliteDb.pragma('foreign_keys = ON');

  const db = initFromBetterSqlite(sqliteDb);

  await migrateAndSeed(db);

  // Query level IDs
  let levelIds: string[];

  if (singleLevelId) {
    // Verify level exists
    const row = db
      .select({ id: schema.levels.id })
      .from(schema.levels)
      .where(eq(schema.levels.id, singleLevelId))
      .get();

    if (!row) {
      console.error(`${RED}Level not found: ${singleLevelId}${RESET}`);
      sqliteDb.close();
      process.exit(1);
    }
    levelIds = [singleLevelId];
  } else {
    levelIds = db
      .select({ id: schema.levels.id })
      .from(schema.levels)
      .all()
      .map((r) => r.id);
  }

  if (levelIds.length === 0) {
    console.log('No levels found in database');
    sqliteDb.close();
    process.exit(0);
  }

  console.log(
    `Playtesting ${singleLevelId ? `level ${singleLevelId}` : 'all levels'} in ${dbPath}...\n`,
  );

  // ---------------------------------------------------------------------------
  // Run playtests
  // ---------------------------------------------------------------------------

  let passed = 0;
  let failed = 0;

  for (const levelId of levelIds) {
    let levelData: ReturnType<typeof toLevelData> | undefined;
    try {
      levelData = toLevelData(db, levelId);
    } catch (err) {
      console.log(
        `${RED}\u2717${RESET} ${levelId.padEnd(24)} ${RED}ERROR${RESET}  ${(err as Error).message}`,
      );
      failed++;
      continue;
    }

    // Fetch rooms for this level
    const rooms = db.select().from(schema.rooms).where(eq(schema.rooms.levelId, levelId)).all();

    let result: PlaytestResult;
    try {
      result = runPlaytest(levelData, rooms, { maxDuration: 120 });
    } catch (err) {
      console.log(
        `${RED}\u2717${RESET} ${levelId.padEnd(24)} ${RED}ERROR${RESET}  ${(err as Error).message}`,
      );
      failed++;
      continue;
    }

    if (result.passed) {
      passed++;
      const duration = `${result.duration.toFixed(1)}s`;
      const roomInfo = `rooms: ${result.roomsVisited.length}/${result.roomsTotal}`;
      const enemyInfo = `enemies: ${result.enemiesKilled}/${result.enemiesTotal}`;
      console.log(
        `${GREEN}\u2713${RESET} ${levelId.padEnd(24)} ${DIM}${duration.padStart(7)}${RESET}  ${roomInfo}  ${enemyInfo}`,
      );
    } else {
      failed++;
      const roomInfo = `rooms: ${result.roomsVisited.length}/${result.roomsTotal}`;
      const enemyInfo = `enemies: ${result.enemiesKilled}/${result.enemiesTotal}`;
      console.log(
        `${RED}\u2717${RESET} ${levelId.padEnd(24)} ${RED}FAIL${RESET}    ${roomInfo}  ${enemyInfo}`,
      );
    }

    // Print softlocks
    for (const sl of result.softlocks) {
      console.log(`  ${YELLOW}\u2514\u2500 ${sl}${RESET}`);
    }

    // Print unreachable rooms
    for (const ur of result.unreachableRooms) {
      console.log(`  ${YELLOW}\u2514\u2500 Unreachable: ${ur}${RESET}`);
    }

    // Verbose diagnostics
    if (verbose && result.diagnostics.length > 0) {
      for (const diag of result.diagnostics) {
        console.log(`  ${DIM}\u2514\u2500 ${diag}${RESET}`);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------

  const total = passed + failed;
  const summaryColor = failed > 0 ? RED : GREEN;
  console.log(`\n${summaryColor}Summary: ${passed}/${total} passed${RESET}`);

  sqliteDb.close();
  process.exit(failed > 0 ? 1 : 0);
}

main();
