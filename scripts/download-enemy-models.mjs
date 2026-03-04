#!/usr/bin/env node
/**
 * download-enemy-models.mjs -- Download rigged base model GLBs from Meshy.
 *
 * For each enemy manifest where tasks.rigging.status === 'SUCCEEDED' and
 * model.glb is missing, fetches the rigged model URL from:
 *   GET https://api.meshy.ai/openapi/v1/rigging/<rig_task_id>
 * and downloads the GLB to <asset-dir>/model.glb.
 *
 * Usage:
 *   node scripts/download-enemy-models.mjs             # all enemies
 *   node scripts/download-enemy-models.mjs --dry-run   # show what would download
 *   node scripts/download-enemy-models.mjs --group bosses
 *   node scripts/download-enemy-models.mjs goat-grunt  # single enemy
 *   pnpm download:enemy-models
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = resolve(__dirname, '..');
const ENEMIES_DIR = join(PROJECT_DIR, 'public', 'models', 'enemies');
const MESHY_API_BASE = 'https://api.meshy.ai/openapi/v1';

// ── Parse args ───────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
let targetGroup = '';
let targetAsset = '';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--group') {
    targetGroup = args[++i];
    continue;
  }
  if (args[i] === '--dry-run') continue;
  if (!args[i].startsWith('-')) targetAsset = args[i];
}

// ── Load API key ─────────────────────────────────────────────────────────────

const envPath = join(PROJECT_DIR, '.env');
let apiKey = process.env.MESHY_API_KEY || '';
if (!apiKey && existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^MESHY_API_KEY=(.+)$/);
    if (m) {
      apiKey = m[1].trim();
      break;
    }
  }
}
if (!apiKey) {
  console.error('ERROR: MESHY_API_KEY not found');
  process.exit(1);
}

// ── Collect enemy dirs ────────────────────────────────────────────────────────

function collectEnemyDirs() {
  if (targetAsset) {
    for (const group of readdirSync(ENEMIES_DIR)) {
      const candidate = join(ENEMIES_DIR, group, targetAsset);
      if (existsSync(join(candidate, 'manifest.json'))) return [candidate];
    }
    console.error(`ERROR: Enemy '${targetAsset}' not found`);
    process.exit(1);
  }

  const dirs = [];
  const groups = targetGroup ? [targetGroup] : readdirSync(ENEMIES_DIR).sort();
  for (const group of groups) {
    const groupDir = join(ENEMIES_DIR, group);
    if (!existsSync(groupDir)) continue;
    try {
      for (const entry of readdirSync(groupDir).sort()) {
        const assetDir = join(groupDir, entry);
        if (existsSync(join(assetDir, 'manifest.json'))) dirs.push(assetDir);
      }
    } catch {
      /* not a dir */
    }
  }
  return dirs;
}

// ── Meshy API ────────────────────────────────────────────────────────────────

async function getRiggingResult(rigTaskId) {
  const url = `${MESHY_API_BASE}/rigging/${rigTaskId}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`GET ${url} → ${res.status} ${body}`);
  }
  return res.json();
}

async function downloadGlb(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status} ${url}`);
  const buf = await res.arrayBuffer();
  writeFileSync(destPath, Buffer.from(buf));
  const kb = Math.round(buf.byteLength / 1024);
  return kb;
}

// ── Per-enemy download ───────────────────────────────────────────────────────

async function downloadModelForEnemy(assetDir) {
  const manifestPath = join(assetDir, 'manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const id = manifest.id ?? basename(assetDir);
  const group = basename(dirname(assetDir));

  const modelPath = join(assetDir, 'model.glb');

  // Already downloaded
  if (existsSync(modelPath)) {
    const sizeKb = Math.round(readFileSync(modelPath).length / 1024);
    console.log(`  ✓ already downloaded: model.glb (${sizeKb} KB)`);
    return 'already_done';
  }

  const rigStatus = manifest.tasks?.rigging?.status;
  if (rigStatus !== 'SUCCEEDED') {
    console.log(`  [skip] rigging status: ${rigStatus ?? 'NOT_STARTED'}`);
    return 'skipped';
  }

  const rigTaskId = manifest.tasks.rigging.taskId;
  console.log(`  Fetching rigging result for task ${rigTaskId}...`);

  if (dryRun) {
    console.log(`  [dry-run] would download ${group}/${id}/model.glb`);
    return 'dry_run';
  }

  try {
    const data = await getRiggingResult(rigTaskId);

    // Meshy rigging response: { result: { rigged_character_glb_url: "..." } }
    const glbUrl = data.result?.rigged_character_glb_url ?? data.model_urls?.glb;
    if (!glbUrl) {
      console.error(`  ✗ No GLB URL in rigging response: ${JSON.stringify(data).slice(0, 200)}`);
      return 'failed';
    }

    console.log(`  ↓ Downloading model.glb...`);
    const sizeKb = await downloadGlb(glbUrl, modelPath);
    console.log(`  ✓ model.glb (${sizeKb} KB)`);

    // Update manifest artifact
    if (manifest.tasks.rigging.artifacts === undefined) {
      manifest.tasks.rigging.artifacts = {};
    }
    manifest.tasks.rigging.artifacts.model = 'model.glb';
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    return 'downloaded';
  } catch (err) {
    console.error(`  ✗ ${err.message}`);
    return 'failed';
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

const enemyDirs = collectEnemyDirs();

console.log(`=== Meshy Enemy Model Downloader ===`);
console.log(`Enemies to check: ${enemyDirs.length}`);
if (dryRun) console.log('Mode: DRY RUN (no files written)');
if (targetGroup) console.log(`Group: ${targetGroup}`);
if (targetAsset) console.log(`Asset: ${targetAsset}`);
console.log('');

const counts = { downloaded: 0, already_done: 0, skipped: 0, failed: 0, dry_run: 0 };

for (const assetDir of enemyDirs) {
  const id = basename(assetDir);
  const group = basename(dirname(assetDir));
  console.log(`--- [${group}] ${id} ---`);
  const result = await downloadModelForEnemy(assetDir);
  counts[result] = (counts[result] ?? 0) + 1;
  console.log('');
}

console.log('=== Results ===');
console.log(`Downloaded:   ${counts.downloaded ?? 0}`);
console.log(`Already done: ${counts.already_done ?? 0}`);
console.log(`Skipped:      ${counts.skipped ?? 0} (rigging not complete)`);
console.log(`Failed:       ${counts.failed ?? 0}`);

if ((counts.downloaded ?? 0) > 0) {
  console.log('\nNext: pnpm sync:registry to wire models into AssetRegistry.ts');
}

process.exit((counts.failed ?? 0) > 0 ? 1 : 0);
