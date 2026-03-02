#!/usr/bin/env node
/**
 * generate-assets.mjs -- Batch generate game assets via Meshy AI.
 *
 * Manifests live alongside their output GLBs in assets/models/:
 *   assets/models/props/{general,circle-N}/<id>/manifest.json   → refined.glb (prop-direct pipeline)
 *   assets/models/enemies/{general,circle-N,bosses}/<id>/manifest.json → animations/*.glb (enemy pipeline)
 *
 * The content generator reads the manifest, runs the pipeline, and writes
 * artifacts directly into the manifest's directory — no copy step needed.
 *
 * Usage:
 *   node scripts/generate-assets.mjs [props|enemies] [--step <id>] [--group <name>] [<asset-id>]
 *   pnpm generate:props                          # all props
 *   pnpm generate:enemies                        # all enemies
 *   pnpm generate:enemies -- --group bosses       # all bosses
 *   pnpm generate:props -- --step preview bone-pile  # preview step only for one prop
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = resolve(__dirname, '..');
const ASSETS_DIR = join(PROJECT_DIR, 'assets', 'models');
const PIPELINE_DEFS = join(PROJECT_DIR, 'pipelines', 'definitions');
const TASK_DEFS = join(
  PROJECT_DIR,
  'node_modules',
  '@agentic-dev-library',
  'meshy-content-generator',
  'tasks',
  'definitions',
);

// ── Parse args ──────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
let assetType = ''; // 'props' or 'enemies'
let stepFlag = '';
let targetGroup = '';
let targetAsset = '';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--step') {
    stepFlag = args[++i];
    continue;
  }
  if (args[i] === '--group') {
    targetGroup = args[++i];
    continue;
  }
  if (args[i] === 'props' || args[i] === 'enemies') {
    assetType = args[i];
    continue;
  }
  targetAsset = args[i];
}

if (!assetType) {
  console.error(
    'Usage: node scripts/generate-assets.mjs <props|enemies> [--step <id>] [--group <name>] [<asset-id>]',
  );
  process.exit(1);
}

// ── Load API key from .env ──────────────────────────────────────────────────

const envPath = join(PROJECT_DIR, '.env');
let apiKey = process.env.MESHY_API_KEY || '';
if (!apiKey && existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^MESHY_API_KEY=(.+)$/);
    if (match) {
      apiKey = match[1].trim();
      break;
    }
  }
}
if (!apiKey) {
  console.error('ERROR: MESHY_API_KEY not found in environment or .env');
  console.error('  Set it in .env or export it directly.');
  console.error('  Get your key at https://app.meshy.ai/settings/api');
  process.exit(1);
}

// ── Collect asset directories ───────────────────────────────────────────────

const TYPE_DIR = join(ASSETS_DIR, assetType);

/** @returns {string[]} Absolute paths to directories containing manifest.json */
function collectAssetDirs() {
  if (targetAsset) {
    // Search all groups for this specific asset
    for (const group of readdirSync(TYPE_DIR)) {
      const candidate = join(TYPE_DIR, group, targetAsset);
      if (existsSync(join(candidate, 'manifest.json'))) return [candidate];
    }
    console.error(`ERROR: Asset '${targetAsset}' not found in any group under ${TYPE_DIR}`);
    process.exit(1);
  }

  if (targetGroup) {
    const groupDir = join(TYPE_DIR, targetGroup);
    if (!existsSync(groupDir)) {
      console.error(`ERROR: Group '${targetGroup}' not found at ${groupDir}`);
      process.exit(1);
    }
    return readdirSync(groupDir)
      .map((p) => join(groupDir, p))
      .filter((p) => existsSync(join(p, 'manifest.json')));
  }

  // All assets in all groups
  const dirs = [];
  for (const group of readdirSync(TYPE_DIR).sort()) {
    const groupDir = join(TYPE_DIR, group);
    try {
      for (const asset of readdirSync(groupDir).sort()) {
        const assetDir = join(groupDir, asset);
        if (existsSync(join(assetDir, 'manifest.json'))) dirs.push(assetDir);
      }
    } catch {
      /* not a directory or contains only GLBs */
    }
  }
  return dirs;
}

const assetDirs = collectAssetDirs();

// ── Determine pipeline name from first manifest ─────────────────────────────

function getPipelineName(manifestDir) {
  const manifest = JSON.parse(readFileSync(join(manifestDir, 'manifest.json'), 'utf8'));
  return manifest.pipeline;
}

console.log(`=== Meshy ${assetType} Generation Pipeline ===`);
console.log(`Assets to generate: ${assetDirs.length}`);
if (stepFlag) console.log(`Step filter: ${stepFlag}`);
if (targetGroup) console.log(`Group filter: ${targetGroup}`);
console.log('');

// ── Run content-gen for each asset ──────────────────────────────────────────

let success = 0;
let failed = 0;

for (const assetDir of assetDirs) {
  const assetId = basename(assetDir);
  const group = basename(dirname(assetDir));
  const pipelineName = getPipelineName(assetDir);

  console.log(`--- [${group}] ${pipelineName}: ${assetId} ---`);

  const cmdArgs = [
    'content-gen',
    'run',
    pipelineName,
    assetDir,
    '--pipelines',
    PIPELINE_DEFS,
    '--tasks',
    TASK_DEFS,
    '--meshy-api-key',
    apiKey,
  ];
  if (stepFlag) cmdArgs.push('--step', stepFlag);

  try {
    execFileSync('pnpm', ['exec', ...cmdArgs], {
      stdio: 'inherit',
      cwd: PROJECT_DIR,
      timeout: 600_000, // 10 min per asset (enemies have more steps)
    });
    console.log(`  OK: ${assetId}`);
    success++;
  } catch (err) {
    console.error(`  FAILED: ${assetId}`, err.message || '');
    failed++;
  }
  console.log('');
}

console.log('=== Results ===');
console.log(`Succeeded: ${success}`);
console.log(`Failed: ${failed}`);

if (success > 0) {
  console.log('\nArtifacts written directly to asset directories.');
  if (assetType === 'props') {
    console.log('  Props: <asset-dir>/refined.glb');
  } else {
    console.log('  Enemies: <asset-dir>/animations/<name>.glb');
  }
  console.log('\nNext steps:');
  console.log('  1. Update AssetRegistry.ts with new asset entries');
  console.log('  2. Test in-game: npx expo start --web --port 8085');
}

process.exit(failed > 0 ? 1 : 0);
