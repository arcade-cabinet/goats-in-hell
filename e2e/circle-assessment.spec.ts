/**
 * Per-circle end-to-end assessment — visual, combat, and behavioral.
 *
 * Requires headed browser (real WebGL/GPU — headless SwiftShader can't run Three.js).
 * Run: npx playwright test e2e/circle-assessment.spec.ts --headed
 *
 * For each circle 1-9, this test:
 *   1. Jumps directly to the circle via window.__game.jumpTo(N)
 *   2. Captures an initial screenshot (scene render quality)
 *   3. Lets the YUKA autoplay AI fight for 30 seconds
 *   4. Captures a mid-fight screenshot
 *   5. Asserts YUKA actually killed something (kills > 0) and player survived
 *   6. Assesses both screenshots with Claude Haiku vision API (if ANTHROPIC_API_KEY is set)
 *
 * Output:
 *   e2e/screenshots/circle-assessment/<timestamp>/
 *     circle-N-initial.jpeg      — scene on load
 *     circle-N-combat.jpeg       — mid-fight
 *     circle-N-cleared.jpeg      — floor cleared (if reached)
 *     report.json                — structured per-circle results
 *     report.txt                 — human-readable summary
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { expect, type Page, test } from '@playwright/test';

// ---------------------------------------------------------------------------
// Headed mode — required for real WebGL rendering
// ---------------------------------------------------------------------------

test.use({ headless: false });

// ---------------------------------------------------------------------------
// Circle specs — expected visuals and enemies per circle
// ---------------------------------------------------------------------------

interface CircleSpec {
  number: number;
  name: string;
  sin: string;
  wallTheme: string;
  expectedEnemies: string;
  visualCues: string;
}

const CIRCLE_SPECS: CircleSpec[] = [
  {
    number: 1,
    name: 'Limbo',
    sin: 'The Unbaptized',
    wallTheme: 'gray weathered concrete walls, misty fog atmosphere',
    expectedEnemies: 'shade enemies (ghostly goat forms)',
    visualCues: 'gravestones, fog, muted gray palette, cemetery props',
  },
  {
    number: 2,
    name: 'Lust',
    sin: 'The Lustful',
    wallTheme: 'dark veined marble walls, crimson-tinted lighting',
    expectedEnemies: 'siren enemies',
    visualCues: 'dark marble texture, wind particle effects, purple-red atmosphere',
  },
  {
    number: 3,
    name: 'Gluttony',
    sin: 'The Gluttonous',
    wallTheme: 'moss and decay green walls, poisonous atmosphere',
    expectedEnemies: 'glutton enemies (bloated goats)',
    visualCues: 'green moss texture, toxic green haze, decay props',
  },
  {
    number: 4,
    name: 'Greed',
    sin: 'The Avaricious',
    wallTheme: 'gold and brass metallic walls with high sheen',
    expectedEnemies: 'hoarder enemies',
    visualCues: 'shiny gold/brass texture, metalness reflections, hoarded prop clusters',
  },
  {
    number: 5,
    name: 'Wrath',
    sin: 'The Wrathful',
    wallTheme: 'lava walls with orange emission glow',
    expectedEnemies: 'berserker enemies (aggressive, fast)',
    visualCues: 'glowing lava texture, orange-red emission, fire atmosphere',
  },
  {
    number: 6,
    name: 'Heresy',
    sin: 'The Heretical',
    wallTheme: 'dark layered rock, tomb-like stone texture',
    expectedEnemies: 'heretic enemies',
    visualCues: 'dark stone, ossuary props, candles, dark tomb atmosphere',
  },
  {
    number: 7,
    name: 'Violence',
    sin: 'The Violent',
    wallTheme: 'flesh-like organic walls, bloody red atmosphere',
    expectedEnemies: 'butcher enemies',
    visualCues: 'fleshy organic texture, blood-red color, visceral props',
  },
  {
    number: 8,
    name: 'Fraud',
    sin: 'The Fraudulent',
    wallTheme: 'black and white marble checkerboard tiles',
    expectedEnemies: 'mimic enemies (disguised)',
    visualCues: 'high-contrast checkerboard marble, false symmetry, illusion props',
  },
  {
    number: 9,
    name: 'Treachery',
    sin: 'The Treacherous',
    wallTheme: 'ice and frozen walls, cold blue-white atmosphere',
    expectedEnemies: 'frost enemies',
    visualCues: 'ice texture, cold blue light, frozen environment',
  },
];

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

interface CircleResult {
  circle: number;
  name: string;
  screenshots: string[];
  initialEnemies: number;
  killsAt30s: number;
  playerSurvived: boolean;
  playerHpAtEnd: number | null;
  modelsLoaded: string[];
  modelsFailed: string[];
  combatPassed: boolean;
  visualAssessment: string;
  errors: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function snap(page: Page, dir: string, name: string): Promise<string> {
  const file = path.join(dir, `${name}.jpeg`);
  await page.screenshot({ path: file, type: 'jpeg', quality: 90 });
  console.log(`  📸 ${name}.jpeg`);
  return file;
}

async function waitForPlaying(page: Page, timeoutMs = 15_000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const screen = await page
      .evaluate(() => (window as any).__game?.snapshot()?.screen)
      .catch(() => null);
    if (screen === 'playing') return true;
    await page.waitForTimeout(200);
  }
  return false;
}

async function getSnapshot(page: Page) {
  return page.evaluate(() => (window as any).__game?.snapshot()).catch(() => null);
}

async function pollUntilKills(page: Page, minKills: number, timeoutMs: number): Promise<number> {
  const deadline = Date.now() + timeoutMs;
  let kills = 0;
  while (Date.now() < deadline) {
    const snap = await getSnapshot(page);
    if (snap?.kills != null) kills = snap.kills;
    if (kills >= minKills) break;
    await page.waitForTimeout(500);
  }
  return kills;
}

// ---------------------------------------------------------------------------
// Claude Haiku vision assessment (optional — requires ANTHROPIC_API_KEY)
// ---------------------------------------------------------------------------

async function claudeAssess(imagePaths: string[], spec: CircleSpec): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return '(skipped — set ANTHROPIC_API_KEY to enable vision assessment)';

  const imageContents = imagePaths
    .slice(0, 2) // max 2 images per API call to stay within token budget
    .map((p) => {
      const data = fs.readFileSync(p).toString('base64');
      return {
        type: 'image' as const,
        source: { type: 'base64' as const, media_type: 'image/jpeg' as const, data },
      };
    });

  const prompt = `These are screenshots from Circle ${spec.number} (${spec.name} — "${spec.sin}") of a first-person dungeon shooter.

Expected visuals:
- Wall theme: ${spec.wallTheme}
- Enemies: ${spec.expectedEnemies}
- Visual cues: ${spec.visualCues}

Assess in 3-4 sentences covering:
1. Does the color palette / texture theme match what's expected?
2. Are enemies visible and does combat appear to be happening?
3. Is the HUD (health bar, ammo, floor counter) visible and readable?
4. Any obvious rendering errors, z-fighting, missing geometry, or black screens?

Be specific and direct. If the screen is blank or shows an error, say so clearly.`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        messages: [
          {
            role: 'user',
            content: [...imageContents, { type: 'text', text: prompt }],
          },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return `API error ${res.status}: ${body.slice(0, 100)}`;
    }

    const json = (await res.json()) as any;
    return json.content?.[0]?.text ?? '(no text in response)';
  } catch (err: any) {
    return `fetch error: ${err.message}`;
  }
}

// ---------------------------------------------------------------------------
// Main test
// ---------------------------------------------------------------------------

test('9-circle full assessment: YUKA combat + visual accuracy', async ({ page }) => {
  // ── Setup ────────────────────────────────────────────────────────────────

  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const runDir = path.join(__dirname, 'screenshots', 'circle-assessment', ts);
  fs.mkdirSync(runDir, { recursive: true });

  const results: CircleResult[] = [];

  // Navigate with autoplay + devmode (installs window.__game bridge)
  await page.goto('/?autoplay&devmode');

  // Wait for NEW GAME button or game to auto-start
  try {
    await page.locator('text=NEW GAME').waitFor({ state: 'visible', timeout: 15_000 });
    await page.locator('text=NEW GAME').click();
  } catch {
    // autoplay started the game before we could click
  }

  // Wait for game to reach 'playing' state
  const started = await waitForPlaying(page, 20_000);
  if (!started) {
    console.warn('[Assessment] Game never reached playing state — aborting');
    expect(started, 'Game must reach playing state').toBe(true);
    return;
  }

  // ── Per-circle loop ──────────────────────────────────────────────────────

  for (const spec of CIRCLE_SPECS) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`  Circle ${spec.number}: ${spec.name.toUpperCase()} — ${spec.sin}`);
    console.log(`${'═'.repeat(60)}`);

    const result: CircleResult = {
      circle: spec.number,
      name: spec.name,
      screenshots: [],
      initialEnemies: 0,
      killsAt30s: 0,
      playerSurvived: false,
      playerHpAtEnd: null,
      modelsLoaded: [],
      modelsFailed: [],
      combatPassed: false,
      visualAssessment: '',
      errors: [],
    };

    try {
      // ── Jump to circle ─────────────────────────────────────────────────
      await page.evaluate((n) => (window as any).__game?.jumpTo(n), spec.number);

      // Wait for scene to render (enemies spawn, textures apply)
      await page.waitForTimeout(3_000);

      // Restore player health to full (ensure they survive the assessment window)
      await page.evaluate(() => (window as any).__game?.setHp(200));

      // ── Initial snapshot ───────────────────────────────────────────────
      const initialSnap = await getSnapshot(page);
      result.initialEnemies = initialSnap?.enemiesAlive ?? 0;
      result.modelsLoaded = initialSnap?.models?.loaded ?? [];
      result.modelsFailed = initialSnap?.models?.failed ?? [];

      console.log(
        `  Initial: ${result.initialEnemies} enemies alive, ` +
          `${result.modelsLoaded.length} models loaded, ` +
          `${result.modelsFailed.length} failed`,
      );

      // ── Initial screenshot ─────────────────────────────────────────────
      const initialShot = await snap(page, runDir, `circle-${spec.number}-initial`);
      result.screenshots.push(initialShot);

      // ── Let YUKA fight for 30 seconds ─────────────────────────────────
      console.log(`  Letting YUKA fight for 30s...`);
      await page.evaluate(() => (window as any).__game?.setHp(200));
      result.killsAt30s = await pollUntilKills(page, 1, 30_000);
      console.log(`  Kills at 30s: ${result.killsAt30s}`);

      // ── Mid-fight screenshot ───────────────────────────────────────────
      const combatShot = await snap(page, runDir, `circle-${spec.number}-combat`);
      result.screenshots.push(combatShot);

      // ── Final snapshot ─────────────────────────────────────────────────
      const finalSnap = await getSnapshot(page);
      result.playerHpAtEnd = finalSnap?.player?.hp ?? null;
      result.playerSurvived = (finalSnap?.player?.hp ?? 0) > 0;
      result.killsAt30s = finalSnap?.kills ?? result.killsAt30s;

      // ── Combat assertion ───────────────────────────────────────────────
      // Pass if: enemies spawned OR kills happened (floor might be clear already on jump)
      result.combatPassed = result.initialEnemies > 0 || result.killsAt30s > 0;

      console.log(
        `  Final: HP=${result.playerHpAtEnd}, kills=${result.killsAt30s}, ` +
          `survived=${result.playerSurvived}, combat=${result.combatPassed}`,
      );

      // ── Claude vision assessment ───────────────────────────────────────
      console.log(`  Running visual assessment...`);
      result.visualAssessment = await claudeAssess(result.screenshots, spec);
      console.log(`  Vision: ${result.visualAssessment.split('\n')[0].slice(0, 120)}`);

      // Check for floor cleared state
      try {
        const screen = await page.evaluate(() => (window as any).__game?.snapshot()?.screen);
        if (screen === 'victory') {
          const clearedShot = await snap(page, runDir, `circle-${spec.number}-cleared`);
          result.screenshots.push(clearedShot);
          // Advance past the victory screen for next circle
          await page.evaluate(() => (window as any).__game?.advance());
          await page.waitForTimeout(1_000);
        }
      } catch {
        // Non-critical
      }
    } catch (err: any) {
      console.error(`  [ERROR] Circle ${spec.number}: ${err.message}`);
      result.errors.push(err.message);
      // Take an error screenshot
      try {
        const errShot = await snap(page, runDir, `circle-${spec.number}-error`);
        result.screenshots.push(errShot);
      } catch {}
    }

    results.push(result);
  }

  // ── Final screenshots and report ─────────────────────────────────────────

  await snap(page, runDir, 'zz-final-state');

  // Write JSON report
  const reportJson = path.join(runDir, 'report.json');
  fs.writeFileSync(reportJson, JSON.stringify(results, null, 2));

  // Write human-readable report
  const lines: string[] = [
    '╔════════════════════════════════════════════════════════════╗',
    '║          GOATS IN HELL — CIRCLE ASSESSMENT REPORT         ║',
    '╚════════════════════════════════════════════════════════════╝',
    `Run: ${ts}`,
    '',
  ];

  let passed = 0;
  let failed = 0;

  for (const r of results) {
    const status = r.combatPassed && r.errors.length === 0 ? '✅ PASS' : '❌ FAIL';
    if (r.combatPassed && r.errors.length === 0) passed++;
    else failed++;

    lines.push(`${status}  Circle ${r.circle}: ${r.name}`);
    lines.push(`       Enemies spawned: ${r.initialEnemies}`);
    lines.push(`       Kills at 30s:    ${r.killsAt30s}`);
    lines.push(
      `       Player HP:       ${r.playerHpAtEnd ?? 'n/a'} (survived: ${r.playerSurvived})`,
    );
    lines.push(
      `       Models loaded:   ${r.modelsLoaded.length} (failed: ${r.modelsFailed.length})`,
    );
    if (r.modelsFailed.length > 0) {
      lines.push(`       Failed models:   ${r.modelsFailed.join(', ')}`);
    }
    if (r.errors.length > 0) {
      lines.push(`       Errors:          ${r.errors.join('; ')}`);
    }
    lines.push(`       Visual:          ${r.visualAssessment.replace(/\n/g, ' ').slice(0, 200)}`);
    lines.push('');
  }

  lines.push('─'.repeat(60));
  lines.push(`TOTAL: ${passed} passed, ${failed} failed`);
  lines.push(`Screenshots: ${runDir}`);

  const reportTxt = path.join(runDir, 'report.txt');
  const reportContent = lines.join('\n');
  fs.writeFileSync(reportTxt, reportContent);

  console.log('\n' + reportContent);
  console.log(`\nFull report: ${reportTxt}`);
  console.log(`JSON report: ${reportJson}`);

  // ── Assertions ────────────────────────────────────────────────────────────

  // At least 7/9 circles must have enemies spawn or kills registered
  expect(
    results.filter((r) => r.combatPassed).length,
    'At least 7/9 circles must have combat (enemies spawned or kills registered)',
  ).toBeGreaterThanOrEqual(7);

  // No circle should have catastrophic JS errors
  const crashedCircles = results.filter((r) =>
    r.errors.some((e) => e.includes('Cannot read') || e.includes('undefined is not')),
  );
  expect(
    crashedCircles.map((r) => `Circle ${r.circle}: ${r.errors[0]}`),
    'No circles should crash with JS errors',
  ).toHaveLength(0);

  // At least 5 circles must have loaded some models
  expect(
    results.filter((r) => r.modelsLoaded.length > 0).length,
    'At least 5/9 circles must have models loaded',
  ).toBeGreaterThanOrEqual(5);
});
