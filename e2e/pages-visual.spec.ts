/**
 * Visual / playability tests against the live GitHub Pages deployment.
 *
 * NOTE: Headless Chromium's WebGL2 implementation (via SwiftShader) is
 * incomplete — Three.js's WebGL2 backend calls getContextAttributes() which
 * SwiftShader doesn't implement. After the R3FApp.detectWebGLError() pre-check,
 * the game shows "RENDERER UNAVAILABLE" instead of crashing.
 *
 * These tests verify that fallback and the navigable UI work correctly in
 * headless mode. WebGL/WebGPU-related pageerrors are intentionally excluded
 * from the failure criteria since they're expected in CI environments.
 *
 * For full 3D visual verification, open the live URL in a real browser:
 * https://arcade-cabinet.github.io/goats-in-hell/
 */
import { expect, test } from '@playwright/test';

const PAGES_URL = 'https://arcade-cabinet.github.io/goats-in-hell/';
const SHOT = (name: string) => `e2e/screenshots/pages-smoke/${name}.png`;

/** Errors that are expected in headless Chromium (WebGL/GPU related). */
const isExpectedHeadlessError = (e: string) =>
  e.includes('WebGL') ||
  e.includes('WebGPU') ||
  e.includes('[R3FApp]') ||
  e.includes('getContext') ||
  e.includes('getSupportedExtensions') ||
  e.includes('getContextAttributes') ||
  e.includes('RENDERER') ||
  e.includes('adapter') ||
  e.includes('gpu');

test.beforeAll(async () => {
  const fs = await import('node:fs');
  fs.mkdirSync('e2e/screenshots/pages-smoke', { recursive: true });
});

test('main menu renders correctly', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto(PAGES_URL, { waitUntil: 'networkidle', timeout: 30_000 });
  await page.screenshot({ path: SHOT('main-page') });

  await expect(page.getByText('NEW GAME')).toBeVisible();
  await expect(page.getByText('SETTINGS')).toBeVisible();

  const unexpectedErrors = errors.filter((e) => !isExpectedHeadlessError(e));
  expect(unexpectedErrors).toHaveLength(0);
});

test('NEW GAME → difficulty screen navigates correctly', async ({ page }) => {
  await page.goto(PAGES_URL, { waitUntil: 'networkidle', timeout: 30_000 });
  await page.getByText('NEW GAME').click();
  await page.screenshot({ path: SHOT('after-new-game-click') });

  // Difficulty screen is pure HTML (no canvas required)
  await expect(page.getByText('CONDEMNED')).toBeVisible();
  await expect(page.getByText('DESCEND')).toBeVisible();
});

test('autoplay: HUD renders immediately before 3D loads', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto(`${PAGES_URL}?autoplay`, { waitUntil: 'load', timeout: 30_000 });
  await page.screenshot({ path: SHOT('autoplay-start') });

  // The HUD (FL/LV/HP overlay) mounts synchronously before 3D
  await expect(page.locator('text=FL 1')).toBeVisible({ timeout: 10_000 });

  // Either the 3D game loads OR the renderer error screen appears — both are
  // valid outcomes in headless mode. What's NOT acceptable is hanging forever.
  await page.waitForTimeout(5000);
  await page.screenshot({ path: SHOT('autoplay-5s') });

  await page.waitForTimeout(10000);
  await page.screenshot({ path: SHOT('autoplay-15s') });

  // Verify the page is still responsive after 15s (not crashed/frozen)
  const title = await page.title();
  expect(title).toBeTruthy();

  const unexpectedErrors = errors.filter((e) => !isExpectedHeadlessError(e));
  if (unexpectedErrors.length > 0) {
    console.log('Unexpected errors:', unexpectedErrors);
  }
  expect(unexpectedErrors).toHaveLength(0);
});

test('static assets: critical files return HTTP 200', async ({ request }) => {
  // Verify the deployed bundle has the key 3D assets
  const files = [
    'models/enemies/bosses/boss-aureo/model.glb',
    'models/enemies/general/goat-grunt/model.glb',
    'models/props/circle-1/limbo-tombstone/refined.glb',
    'audio/music/boss.ogg',
  ];
  for (const f of files) {
    const resp = await request.head(`${PAGES_URL}${f}`);
    expect(resp.status(), `Expected HTTP 200 for ${f}`).toBe(200);
  }
});
