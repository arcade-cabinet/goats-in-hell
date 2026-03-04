#!/usr/bin/env node
// Downloads model.glb from Meshy rigging API for enemies that have rigging
// task IDs but empty artifacts.

import { createWriteStream, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';

const API_KEY = process.env.MESHY_API_KEY;
if (!API_KEY) throw new Error('MESHY_API_KEY not set');

const BASE_DIR = new URL('../public/models/enemies', import.meta.url).pathname;

const ENEMIES = [
  { dir: 'circle-2/goat-siren-elder', riggingTaskId: '019cb739-d993-75b0-9e2e-7cc101d07e76' },
  { dir: 'circle-2/goat-siren-whelp', riggingTaskId: '019cb73e-b7ee-74bb-a462-e29de3ba101b' },
  { dir: 'circle-4/goat-hoarder-elder', riggingTaskId: '019cb73e-b7ed-76b4-9142-37ec76cc7e60' },
  { dir: 'circle-5/goat-berserker-whelp', riggingTaskId: '019cb73e-b7e3-7817-bf9c-d526805146e0' },
  { dir: 'circle-8/goat-mimic-elder', riggingTaskId: '019cb73e-e3ba-7819-87b6-648781773264' },
  { dir: 'circle-8/goat-mimic-whelp', riggingTaskId: '019cb73e-b7eb-74ba-8a9e-38bc32ca0c2a' },
  { dir: 'circle-9/goat-frost-elder', riggingTaskId: '019cb740-06bb-76ff-85a8-e9bd8329066d' },
];

async function downloadFile(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  const dir = path.dirname(destPath);
  mkdirSync(dir, { recursive: true });
  await pipeline(res.body, createWriteStream(destPath));
}

async function main() {
  for (const { dir, riggingTaskId } of ENEMIES) {
    const destPath = path.join(BASE_DIR, dir, 'model.glb');
    if (existsSync(destPath)) {
      const stat = (await import('node:fs')).statSync(destPath);
      console.log(`✓ ${dir}/model.glb already exists (${(stat.size / 1024 / 1024).toFixed(1)}MB)`);
      continue;
    }

    console.log(`⟳ ${dir} — fetching rigging task ${riggingTaskId}...`);
    const taskRes = await fetch(`https://api.meshy.ai/openapi/v1/rigging/${riggingTaskId}`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    if (!taskRes.ok) {
      console.error(`  ✗ API error ${taskRes.status} for ${riggingTaskId}`);
      continue;
    }

    const data = await taskRes.json();
    const glbUrl = data?.result?.rigged_character_glb_url;
    if (!glbUrl) {
      console.error(
        `  ✗ No rigged_character_glb_url in response:`,
        JSON.stringify(data).slice(0, 200),
      );
      continue;
    }

    console.log(`  ↓ Downloading from ${glbUrl.slice(0, 80)}...`);
    await downloadFile(glbUrl, destPath);
    const stat = (await import('node:fs')).statSync(destPath);
    console.log(`  ✓ Saved ${(stat.size / 1024 / 1024).toFixed(1)}MB → ${destPath}`);
  }

  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
