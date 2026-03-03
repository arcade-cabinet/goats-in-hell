import { expect, test } from '@playwright/test';

const PAGES_URL = 'https://arcade-cabinet.github.io/goats-in-hell/';

test('GitHub Pages: main menu renders correctly', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(`PAGE ERROR: ${err.message}`));

  await page.goto(PAGES_URL, { waitUntil: 'load', timeout: 30_000 });
  await page.screenshot({ path: 'e2e/screenshots/pages-smoke/main-page.png' });

  const title = await page.title();
  console.log(`Title: "${title}"`);
  console.log(`Console errors: ${errors.length}`);
  if (errors.length > 0) console.log('Errors:', errors.slice(0, 3));

  // Title must be correct
  expect(title).toContain('Goats');

  // Main menu buttons must be visible
  await expect(page.getByText('NEW GAME')).toBeVisible();
  await expect(page.getByText('SETTINGS')).toBeVisible();

  // No JS errors (canvas errors from headless WebGL are acceptable)
  const criticalErrors = errors.filter(
    (e) => !e.includes('WebGL') && !e.includes('canvas') && !e.includes('CONTEXT_LOST'),
  );
  expect(criticalErrors).toHaveLength(0);
});

test('GitHub Pages: GLB model asset is accessible', async ({ request }) => {
  const resp = await request.head(`${PAGES_URL}models/enemies/general/goat-grunt/model.glb`);
  console.log(`model.glb HTTP status: ${resp.status()}`);
  expect([200, 206]).toContain(resp.status());
});

test('GitHub Pages: audio asset is accessible', async ({ request }) => {
  const resp = await request.head(`${PAGES_URL}audio/music/boss.ogg`);
  console.log(`boss.ogg HTTP status: ${resp.status()}`);
  expect([200, 206]).toContain(resp.status());
});
