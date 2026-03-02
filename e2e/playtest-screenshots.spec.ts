/**
 * Autoplay playtest screenshot suite.
 *
 * Opens the game in autoplay mode, lets the AI governor play through circles,
 * and captures named screenshots at significant game moments for visual assessment:
 *
 *   - fl{N}-load.jpeg        — Floor loads, HUD visible
 *   - fl{N}-first-kill.jpeg  — First kill on that floor
 *   - fl{N}-boss.jpeg        — Boss encounter tag appears
 *   - fl{N}-cleared.jpeg     — "FLOOR CLEARED" overlay
 *   - death.jpeg             — "YOU DIED" screen
 *   - game-complete.jpeg     — Game complete screen
 *   - periodic-{N}s.jpeg     — Every 30s during play (general state)
 *
 * Usage:
 *   # Ensure dev server is running first:
 *   pnpm web:start &
 *
 *   # Run the playtest:
 *   npx playwright test e2e/playtest-screenshots.spec.ts --reporter=line
 *
 * Screenshots are saved to e2e/screenshots/<timestamp>/ for each run.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { expect, type Page, test } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Directory for this run's screenshots, created fresh each run. */
function makeRunDir(): string {
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const dir = path.join(__dirname, 'screenshots', ts);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/** Save a JPEG screenshot with a descriptive name. */
async function snap(page: Page, dir: string, name: string): Promise<void> {
  const file = path.join(dir, `${name}.jpeg`);
  await page.screenshot({ path: file, type: 'jpeg', quality: 85 });
  console.log(`  📸 ${name}.jpeg`);
}

/**
 * Read the current floor number from the HUD "FL {N}" text.
 * Returns 0 if not found (menu, death, etc.).
 */
async function readFloor(page: Page): Promise<number> {
  try {
    const el = page.locator('text=/^FL \\d+$/').first();
    const text = await el.textContent({ timeout: 500 });
    return text ? parseInt(text.replace('FL ', ''), 10) : 0;
  } catch {
    return 0;
  }
}

/**
 * Read current kill count from "KILLS {N}" HUD text.
 * Returns -1 if not found.
 */
async function readKills(page: Page): Promise<number> {
  try {
    const el = page.locator('text=/^KILLS \\d+$/').first();
    const text = await el.textContent({ timeout: 500 });
    return text ? parseInt(text.replace('KILLS ', ''), 10) : -1;
  } catch {
    return -1;
  }
}

/** Check if a text string is visible on page right now. */
async function isVisible(page: Page, text: string): Promise<boolean> {
  try {
    await page.locator(`text=${text}`).first().waitFor({ state: 'visible', timeout: 300 });
    return true;
  } catch {
    return false;
  }
}

/** Click a button by its text, if it's visible. */
async function clickIfVisible(page: Page, buttonText: string): Promise<boolean> {
  try {
    const btn = page.locator(`text=${buttonText}`).first();
    await btn.waitFor({ state: 'visible', timeout: 500 });
    await btn.click();
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Main test
// ---------------------------------------------------------------------------

test('AI autoplay full playthrough with screenshots', async ({ page }) => {
  const dir = makeRunDir();
  console.log(`\nSaving screenshots to: ${dir}\n`);

  // Track per-floor state
  const floorFirstKillCaptured = new Set<number>();
  const floorLoadCaptured = new Set<number>();
  const floorBossCaptured = new Set<number>();
  const floorClearedCaptured = new Set<number>();

  let lastPeriodicSec = 0;
  let gameDone = false;
  const startTime = Date.now();

  // -------------------------------------------------------------------------
  // Step 1: Navigate to game with autoplay param
  // -------------------------------------------------------------------------
  await page.goto('/?autoplay');

  // Wait for the main menu to appear
  await page.locator('text=NEW GAME').waitFor({ state: 'visible', timeout: 15_000 });
  await snap(page, dir, '00-main-menu');

  // -------------------------------------------------------------------------
  // Step 2: Start new game
  // -------------------------------------------------------------------------
  await page.locator('text=NEW GAME').click();

  // Wait for HUD (FL 1 appears when the game starts)
  await page.locator('text=/^FL \\d+$/').waitFor({ state: 'visible', timeout: 20_000 });
  await snap(page, dir, '00-game-start');

  // -------------------------------------------------------------------------
  // Step 3: Monitor loop — poll every 250ms for significant events
  // -------------------------------------------------------------------------
  const MAX_DURATION_MS = 8 * 60 * 1000; // 8-minute timeout

  while (!gameDone && Date.now() - startTime < MAX_DURATION_MS) {
    const elapsedSec = Math.floor((Date.now() - startTime) / 1000);

    // -- Periodic snapshot every 30 seconds --
    if (elapsedSec - lastPeriodicSec >= 30) {
      lastPeriodicSec = elapsedSec;
      await snap(page, dir, `periodic-${String(elapsedSec).padStart(4, '0')}s`);
    }

    // -- Check for terminal screens --
    if (await isVisible(page, 'YOU DIED')) {
      await snap(page, dir, 'death');
      gameDone = true;
      break;
    }
    if (await isVisible(page, 'THE SCAPEGOAT RISES')) {
      await snap(page, dir, 'game-complete');
      gameDone = true;
      break;
    }
    if (await isVisible(page, "HELL'S GUARDIAN")) {
      await snap(page, dir, 'game-complete');
      gameDone = true;
      break;
    }

    // -- Check for FLOOR CLEARED overlay --
    if (await isVisible(page, 'FLOOR CLEARED')) {
      const floor = await readFloor(page);
      if (!floorClearedCaptured.has(floor)) {
        floorClearedCaptured.add(floor);
        await snap(page, dir, `fl${floor}-cleared`);
      }

      // Auto-click "DESCEND DEEPER" to advance the AI through the interstitial
      await clickIfVisible(page, 'DESCEND DEEPER');
      await page.waitForTimeout(500);
      continue;
    }

    // -- Check for BOSS intro screen --
    if (await isVisible(page, 'ENTER THE ARENA')) {
      // Capture before clicking enter
      const floor = await readFloor(page);
      if (!floorBossCaptured.has(floor)) {
        floorBossCaptured.add(floor);
        await snap(page, dir, `fl${floor}-boss-intro`);
      }
      await clickIfVisible(page, 'ENTER THE ARENA');
      await page.waitForTimeout(500);
      continue;
    }

    // -- Check active play state --
    const floor = await readFloor(page);
    if (floor > 0) {
      // Floor load screenshot
      if (!floorLoadCaptured.has(floor)) {
        floorLoadCaptured.add(floor);
        // Brief wait for scene to render before screenshotting
        await page.waitForTimeout(1000);
        await snap(page, dir, `fl${floor.toString().padStart(2, '0')}-load`);
      }

      // Boss encounter tag in HUD
      if (!floorBossCaptured.has(floor) && (await isVisible(page, 'BOSS'))) {
        floorBossCaptured.add(floor);
        await snap(page, dir, `fl${floor.toString().padStart(2, '0')}-boss`);
      }

      // First kill on this floor
      if (!floorFirstKillCaptured.has(floor)) {
        const kills = await readKills(page);
        if (kills > 0) {
          floorFirstKillCaptured.add(floor);
          await snap(page, dir, `fl${floor.toString().padStart(2, '0')}-first-kill`);
        }
      }
    }

    // Poll at 250ms
    await page.waitForTimeout(250);
  }

  // -------------------------------------------------------------------------
  // Step 4: Final summary screenshot
  // -------------------------------------------------------------------------
  await snap(page, dir, 'zz-final-state');

  const elapsed = Math.round((Date.now() - startTime) / 1000);
  console.log(`\nPlaytest complete in ${elapsed}s`);
  console.log(`Floors visited: ${[...floorLoadCaptured].sort().join(', ')}`);
  console.log(`Floors cleared: ${[...floorClearedCaptured].sort().join(', ')}`);
  console.log(`Screenshots: ${dir}`);

  // The test passes whether the AI died or completed — we just want the screenshots
  expect(floorLoadCaptured.size).toBeGreaterThan(0);
});
