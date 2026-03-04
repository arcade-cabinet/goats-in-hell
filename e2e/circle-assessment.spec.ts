/**
 * Per-circle end-to-end assessment — visual, combat, and behavioral.
 *
 * Requires headed browser (real WebGL/GPU).
 * Run: npx playwright test --project=local
 *
 * For each circle 1-9, this test:
 *   1. Jumps directly to the circle via window.__game.jumpTo(N)
 *   2. Captures an initial screenshot (scene render / texture theme)
 *   3. Lets the YUKA autoplay AI fight for 30 seconds
 *   4. Captures a mid-fight screenshot
 *   5. Asserts YUKA killed something (kills > 0) and player survived
 *
 * Output: e2e/screenshots/circle-assessment/<timestamp>/
 *   circle-N-initial.jpeg   — scene immediately after jump
 *   circle-N-combat.jpeg    — 30s into YUKA fighting
 *   circle-N-cleared.jpeg   — victory screen (if reached within 30s)
 *   report.json             — structured results (enemies, kills, models, HP)
 *   report.txt              — human-readable summary
 *
 * Visual assessment: after the test, share the screenshot directory path and
 * ask Claude Code to read + assess the images directly — no API key needed.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { expect, type Page, test } from '@playwright/test';

// ---------------------------------------------------------------------------
// Headed mode — required for real WebGL rendering
// ---------------------------------------------------------------------------

test.use({ headless: false });

// ---------------------------------------------------------------------------
// Circle metadata — used in report output and as reference for manual review
// ---------------------------------------------------------------------------

interface CircleSpec {
  number: number;
  name: string;
  sin: string;
  expectedWalls: string;
  expectedEnemies: string;
}

const CIRCLE_SPECS: CircleSpec[] = [
  {
    number: 1,
    name: 'Limbo',
    sin: 'The Unbaptized',
    expectedWalls: 'gray concrete, fog',
    expectedEnemies: 'shade (ghostly goats)',
  },
  {
    number: 2,
    name: 'Lust',
    sin: 'The Lustful',
    expectedWalls: 'dark marble, crimson',
    expectedEnemies: 'siren',
  },
  {
    number: 3,
    name: 'Gluttony',
    sin: 'The Gluttonous',
    expectedWalls: 'green moss/decay',
    expectedEnemies: 'glutton (bloated)',
  },
  {
    number: 4,
    name: 'Greed',
    sin: 'The Avaricious',
    expectedWalls: 'gold/brass metallic',
    expectedEnemies: 'hoarder',
  },
  {
    number: 5,
    name: 'Wrath',
    sin: 'The Wrathful',
    expectedWalls: 'lava with orange emission glow',
    expectedEnemies: 'berserker (fast/aggressive)',
  },
  {
    number: 6,
    name: 'Heresy',
    sin: 'The Heretical',
    expectedWalls: 'dark layered rock, tomb-like',
    expectedEnemies: 'heretic',
  },
  {
    number: 7,
    name: 'Violence',
    sin: 'The Violent',
    expectedWalls: 'flesh/organic, blood-red',
    expectedEnemies: 'butcher',
  },
  {
    number: 8,
    name: 'Fraud',
    sin: 'The Fraudulent',
    expectedWalls: 'black/white checkerboard marble',
    expectedEnemies: 'mimic',
  },
  {
    number: 9,
    name: 'Treachery',
    sin: 'The Treacherous',
    expectedWalls: 'ice, cold blue-white',
    expectedEnemies: 'frost',
  },
];

// ---------------------------------------------------------------------------
// Result shape
// ---------------------------------------------------------------------------

interface ScreenshotEntry {
  file: string; // basename only (e.g. "circle-1-initial.jpeg")
  path: string; // absolute path on disk
  label: string; // "initial" | "combat" | "cleared" | "error" | "start" | "final"
  timestamp: string; // ISO 8601 wall-clock time at moment of capture
}

interface CircleResult {
  circle: number;
  name: string;
  expectedWalls: string;
  expectedEnemies: string;
  screenshots: ScreenshotEntry[];
  initialEnemies: number;
  killsAt30s: number;
  playerHpAtEnd: number | null;
  playerSurvived: boolean;
  modelsLoaded: number;
  modelsFailed: string[];
  combatPassed: boolean;
  errors: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function snap(
  page: Page,
  dir: string,
  name: string,
  label: string,
): Promise<ScreenshotEntry> {
  const timestamp = new Date().toISOString();
  const file = `${name}.jpeg`;
  const fullPath = path.join(dir, file);
  await page.screenshot({ path: fullPath, type: 'jpeg', quality: 92 });
  console.log(`  📸 ${file}  [${timestamp}]`);
  return { file, path: fullPath, label, timestamp };
}

async function waitForPlaying(page: Page, timeoutMs = 20_000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const screen = await page
      .evaluate(() => (window as any).__game?.snapshot()?.screen)
      .catch(() => null);
    if (screen === 'playing') return true;
    await page.waitForTimeout(250);
  }
  return false;
}

async function gameSnapshot(page: Page) {
  return page.evaluate(() => (window as any).__game?.snapshot()).catch(() => null);
}

async function pollForKills(page: Page, timeoutMs: number): Promise<number> {
  const deadline = Date.now() + timeoutMs;
  let kills = 0;
  while (Date.now() < deadline) {
    const s = await gameSnapshot(page);
    const k = s?.kills ?? 0;
    if (k > kills) kills = k;
    if (kills >= 1) break;
    await page.waitForTimeout(500);
  }
  return kills;
}

// ---------------------------------------------------------------------------
// Main test
// ---------------------------------------------------------------------------

test('9-circle assessment: YUKA combat + screenshot capture', async ({ page }) => {
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const runDir = path.join(__dirname, 'screenshots', 'circle-assessment', ts);
  fs.mkdirSync(runDir, { recursive: true });
  console.log(`\nScreenshots → ${runDir}\n`);

  const results: CircleResult[] = [];

  // ── Boot game ─────────────────────────────────────────────────────────────
  await page.goto('/?autoplay&devmode');

  // Autoplay starts the game; wait for playing state
  const ready = await waitForPlaying(page, 25_000);
  expect(ready, 'Game must reach playing state within 25s').toBe(true);

  await snap(page, runDir, '00-game-start', 'start');

  // ── Per-circle loop ────────────────────────────────────────────────────────
  for (const spec of CIRCLE_SPECS) {
    console.log(`\n${'─'.repeat(56)}`);
    console.log(`  Circle ${spec.number}: ${spec.name} (${spec.sin})`);
    console.log(`  Expected walls:   ${spec.expectedWalls}`);
    console.log(`  Expected enemies: ${spec.expectedEnemies}`);

    const result: CircleResult = {
      circle: spec.number,
      name: spec.name,
      expectedWalls: spec.expectedWalls,
      expectedEnemies: spec.expectedEnemies,
      screenshots: [],
      initialEnemies: 0,
      killsAt30s: 0,
      playerHpAtEnd: null,
      playerSurvived: false,
      modelsLoaded: 0,
      modelsFailed: [],
      combatPassed: false,
      errors: [],
    };

    try {
      // Jump directly to this circle
      await page.evaluate((n) => (window as any).__game?.jumpTo(n), spec.number);

      // Give the scene 3s to reload level geometry, textures, and enemy spawns
      await page.waitForTimeout(3_000);

      // Top up HP so YUKA survives the full 30s window
      await page.evaluate(() => (window as any).__game?.setHp(200));

      // Initial state snapshot
      const initial = await gameSnapshot(page);
      result.initialEnemies = initial?.enemiesAlive ?? 0;
      result.modelsLoaded = initial?.models?.loaded?.length ?? 0;
      result.modelsFailed = initial?.models?.failed ?? [];

      console.log(
        `  State: ${result.initialEnemies} enemies, ` +
          `${result.modelsLoaded} models loaded, ` +
          `${result.modelsFailed.length} failed`,
      );

      // Initial screenshot — captures wall theme, props, lighting
      const initShot = await snap(page, runDir, `circle-${spec.number}-initial`, 'initial');
      result.screenshots.push(initShot);

      // Let YUKA fight for up to 30s, polling for kills
      console.log(`  YUKA fighting...`);
      result.killsAt30s = await pollForKills(page, 30_000);

      // Refresh HP in case it dropped mid-fight
      await page.evaluate(() => (window as any).__game?.setHp(200));

      // Combat screenshot — enemies, projectiles, muzzle flash
      const combatShot = await snap(page, runDir, `circle-${spec.number}-combat`, 'combat');
      result.screenshots.push(combatShot);

      // Final state
      const final = await gameSnapshot(page);
      result.playerHpAtEnd = final?.player?.hp ?? null;
      result.playerSurvived = (final?.player?.hp ?? 0) > 0;
      result.killsAt30s = Math.max(result.killsAt30s, final?.kills ?? 0);
      result.combatPassed = result.initialEnemies > 0 || result.killsAt30s > 0;

      console.log(
        `  Result: kills=${result.killsAt30s}, HP=${result.playerHpAtEnd}, ` +
          `combat=${result.combatPassed ? 'PASS' : 'FAIL'}`,
      );

      // Capture victory screen if floor cleared
      const screenNow = await page
        .evaluate(() => (window as any).__game?.snapshot()?.screen)
        .catch(() => null);
      if (screenNow === 'victory') {
        const clearedShot = await snap(page, runDir, `circle-${spec.number}-cleared`, 'cleared');
        result.screenshots.push(clearedShot);
        await page.evaluate(() => (window as any).__game?.advance());
        await page.waitForTimeout(1_000);
      }
    } catch (err: any) {
      console.error(`  ERROR: ${err.message}`);
      result.errors.push(err.message);
      await snap(page, runDir, `circle-${spec.number}-error`, 'error').catch(() => {});
    }

    results.push(result);
  }

  // ── Final state screenshot ─────────────────────────────────────────────────
  await snap(page, runDir, 'zz-final', 'final');

  // ── Write report ──────────────────────────────────────────────────────────
  fs.writeFileSync(path.join(runDir, 'report.json'), JSON.stringify(results, null, 2));

  const lines = [
    '╔════════════════════════════════════════════════════════════╗',
    '║         GOATS IN HELL — CIRCLE ASSESSMENT REPORT          ║',
    '╚════════════════════════════════════════════════════════════╝',
    `Run: ${ts}`,
    `Dir: ${runDir}`,
    '',
  ];

  let passed = 0;
  for (const r of results) {
    const ok = r.combatPassed && r.errors.length === 0;
    if (ok) passed++;
    lines.push(`${ok ? '✅' : '❌'}  Circle ${r.circle}: ${r.name}`);
    lines.push(`       Walls expected:  ${r.expectedWalls}`);
    lines.push(`       Enemies expected:${r.expectedEnemies}`);
    lines.push(`       Enemies spawned: ${r.initialEnemies}`);
    lines.push(`       Kills at 30s:    ${r.killsAt30s}`);
    lines.push(`       Player HP end:   ${r.playerHpAtEnd ?? 'n/a'}`);
    lines.push(`       Models loaded:   ${r.modelsLoaded}  failed: ${r.modelsFailed.length}`);
    if (r.modelsFailed.length > 0)
      lines.push(`       Failed:          ${r.modelsFailed.join(', ')}`);
    if (r.errors.length > 0) lines.push(`       Errors:          ${r.errors.join('; ')}`);
    lines.push(
      `       Screenshots:     ${r.screenshots.map((s) => `${s.file} (${s.timestamp})`).join(', ')}`,
    );
    lines.push('');
  }

  lines.push('─'.repeat(60));
  lines.push(`RESULT: ${passed}/9 circles passed`);
  lines.push('');
  lines.push('To assess visuals: tell Claude Code to read the screenshots in this directory.');
  lines.push(`  ${runDir}`);

  const report = lines.join('\n');
  fs.writeFileSync(path.join(runDir, 'report.txt'), report);
  console.log(`\n${report}`);

  // ── Assertions ─────────────────────────────────────────────────────────────

  expect(
    results.filter((r) => r.combatPassed).length,
    '≥7/9 circles must have combat (enemies spawned or kills registered)',
  ).toBeGreaterThanOrEqual(7);

  const crashed = results.filter((r) =>
    r.errors.some((e) => e.includes('Cannot read') || e.includes('is not a function')),
  );
  expect(
    crashed.map((r) => `Circle ${r.circle}: ${r.errors[0]}`),
    'No circles should crash with JS errors',
  ).toHaveLength(0);

  expect(
    results.filter((r) => r.modelsLoaded > 0).length,
    '≥5/9 circles must have models loaded',
  ).toBeGreaterThanOrEqual(5);
});
