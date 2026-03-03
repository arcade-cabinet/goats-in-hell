#!/usr/bin/env npx tsx
/**
 * Build all 9 Dante circle levels into assets/levels.db.
 *
 * Each circle's build function creates its own DB connection and runs
 * migrateAndSeed, so the first one initializes the schema and subsequent
 * ones are idempotent.
 *
 * Usage:
 *   npx tsx scripts/build-all-circles.ts
 *   npx tsx scripts/build-all-circles.ts --circle 3     # build only circle 3
 *   npx tsx scripts/build-all-circles.ts --skip-playtest # skip playtest step
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';

// Circle build functions — each takes a dbPath string
import { buildCircle1 } from './build-circle-1';
import { buildCircle2 } from './build-circle-2';
import { buildCircle3 } from './build-circle-3';
import { buildCircle4 } from './build-circle-4';
import { buildCircle5 } from './build-circle-5';
import { buildCircle6 } from './build-circle-6';
import { buildCircle7 } from './build-circle-7';
import { buildCircle8 } from './build-circle-8';
import { buildCircle9 } from './build-circle-9';

// ---------------------------------------------------------------------------
// ANSI color helpers
// ---------------------------------------------------------------------------

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

// ---------------------------------------------------------------------------
// Play time targets (min, max) per circle number
// ---------------------------------------------------------------------------

const PLAY_TIME_TARGETS: Record<number, [number, number]> = {
  1: [5, 8],
  2: [7, 11],
  3: [8, 12],
  4: [8, 12],
  5: [10, 15],
  6: [10, 15],
  7: [12, 18],
  8: [12, 18],
  9: [15, 22],
};

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);

function getOption(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1 || idx + 1 >= args.length) return undefined;
  return args[idx + 1];
}

function getFlag(name: string): boolean {
  return args.includes(`--${name}`);
}

const singleCircle = getOption('circle');
const skipPlaytest = getFlag('skip-playtest');

// ---------------------------------------------------------------------------
// Circle registry
// ---------------------------------------------------------------------------

const circles: Array<{
  number: number;
  name: string;
  build: (dbPath: string) => Promise<void>;
}> = [
  { number: 1, name: 'Limbo', build: buildCircle1 },
  { number: 2, name: 'Lust', build: buildCircle2 },
  { number: 3, name: 'Gluttony', build: buildCircle3 },
  { number: 4, name: 'Greed', build: buildCircle4 },
  { number: 5, name: 'Wrath', build: buildCircle5 },
  { number: 6, name: 'Heresy', build: buildCircle6 },
  { number: 7, name: 'Violence', build: buildCircle7 },
  { number: 8, name: 'Fraud', build: buildCircle8 },
  { number: 9, name: 'Treachery', build: buildCircle9 },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const dbPath = path.resolve(process.cwd(), 'assets', 'levels.db');

  // Filter to single circle if requested
  const toBuild = singleCircle ? circles.filter((c) => c.number === Number(singleCircle)) : circles;

  if (toBuild.length === 0) {
    console.error(`${RED}Circle ${singleCircle} not found (valid: 1-9)${RESET}`);
    process.exit(1);
  }

  console.log(`Building ${toBuild.length} circle(s) into ${dbPath}\n`);

  let passed = 0;
  let failed = 0;

  for (const circle of toBuild) {
    const label = `Circle ${circle.number}: ${circle.name}`;
    const start = Date.now();
    try {
      await circle.build(dbPath);
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      console.log(`${GREEN}✓${RESET} ${label.padEnd(24)} ${DIM}${elapsed}s${RESET}`);
      passed++;
    } catch (err) {
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      console.log(`${RED}✗${RESET} ${label.padEnd(24)} ${DIM}${elapsed}s${RESET}`);
      console.error(`  ${RED}${(err as Error).message}${RESET}`);
      failed++;
    }
  }

  // Summary
  const total = passed + failed;
  const color = failed > 0 ? RED : GREEN;
  console.log(`\n${color}Build: ${passed}/${total} circles built successfully${RESET}`);

  if (failed > 0) {
    process.exit(1);
  }

  // Run playtest if not skipped
  if (!skipPlaytest) {
    // Print play time targets for reference
    console.log(`\n${DIM}Play time targets:${RESET}`);
    for (const circle of toBuild) {
      const [minT, maxT] = PLAY_TIME_TARGETS[circle.number];
      console.log(`  ${DIM}Circle ${circle.number} ${circle.name}: ${minT}–${maxT} min${RESET}`);
    }
    console.log(`\n${DIM}Running playtest on all built levels...${RESET}\n`);
    try {
      execFileSync('npx', ['tsx', 'scripts/playtest-all.ts'], {
        stdio: 'inherit',
        cwd: process.cwd(),
      });
    } catch {
      console.error(`\n${RED}Playtest failed — see errors above${RESET}`);
      process.exit(1);
    }
  }
}

main();
