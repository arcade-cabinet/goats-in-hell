/**
 * Diagnostic test — captures full console output + network failures
 * to pinpoint why the loading screen never resolves.
 *
 * Run: pnpm exec playwright test e2e/pages-diagnostic.spec.ts --reporter=list
 */
import { test } from '@playwright/test';

const PAGES_URL = 'https://arcade-cabinet.github.io/goats-in-hell/';
const SHOT = (name: string) => `e2e/screenshots/diagnostic/${name}.png`;

test.beforeAll(async () => {
  const fs = await import('node:fs');
  fs.mkdirSync('e2e/screenshots/diagnostic', { recursive: true });
});

test('diagnose: loading screen hang', async ({ page }) => {
  const logs: string[] = [];
  const failed: string[] = [];

  // Capture ALL console messages
  page.on('console', (msg) => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
  });
  page.on('pageerror', (err) => {
    logs.push(`[pageerror] ${err.message}`);
  });

  // Capture all failed network requests
  page.on('requestfailed', (req) => {
    failed.push(`FAIL ${req.method()} ${req.url()} — ${req.failure()?.errorText}`);
  });

  // Track responses to identify slow/large downloads
  const _slowRequests: string[] = [];
  page.on('response', (resp) => {
    const status = resp.status();
    if (status >= 400) {
      failed.push(`HTTP ${status} ${resp.url()}`);
    }
  });

  console.log('→ Navigating to ?autoplay...');
  await page.goto(`${PAGES_URL}?autoplay`, { waitUntil: 'load', timeout: 60_000 });
  await page.screenshot({ path: SHOT('t0-loaded') });

  // Poll for loading resolution every 10s up to 60s
  for (const secs of [10, 20, 30, 45, 60]) {
    await page.waitForTimeout(10_000);
    const shot = `t${secs}s`;
    await page.screenshot({ path: SHOT(shot) });

    // Check if loading overlay is gone (rendererReady=true)
    const overlayVisible = await page.evaluate(() => {
      const divs = Array.from(document.querySelectorAll('div'));
      return divs.some((d) => d.textContent?.includes('DESCENDING INTO HELL'));
    });

    // Check canvas exists
    const canvasCount = await page.evaluate(() => document.querySelectorAll('canvas').length);

    console.log(`[${secs}s] loading overlay: ${overlayVisible}, canvases: ${canvasCount}`);

    if (!overlayVisible) {
      console.log(`✓ Game loaded after ${secs}s!`);
      break;
    }
  }

  // Dump all console logs
  console.log('\n=== CONSOLE LOGS ===');
  for (const log of logs) {
    console.log(log);
  }

  // Dump network failures
  console.log('\n=== NETWORK FAILURES ===');
  if (failed.length === 0) {
    console.log('(none)');
  } else {
    for (const f of failed) {
      console.log(f);
    }
  }

  // Take final screenshot
  await page.screenshot({ path: SHOT('final') });
});
