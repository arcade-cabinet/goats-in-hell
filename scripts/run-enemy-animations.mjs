#!/usr/bin/env node
/**
 * run-enemy-animations.mjs -- Standalone animation runner for Meshy rigged enemies.
 *
 * Bypasses content-gen for the animation step, which requires integer action_id
 * values that content-gen's lookup mechanism cannot supply via CLI.
 *
 * For each enemy manifest where tasks.rigging.status === 'SUCCEEDED' and
 * animations aren't yet complete, this script:
 *   1. Maps each animationTask.animations path string → integer Meshy action_id
 *   2. POSTs to POST /openapi/v1/animations
 *   3. Polls until SUCCEEDED or FAILED
 *   4. Downloads the GLB to <asset-dir>/animations/<animName>.glb
 *   5. Updates the manifest with task status
 *
 * Animation IDs were resolved from the Meshy action library. Paths with no exact
 * match use the closest available animation (noted in ANIMATION_IDS below).
 *
 * Usage:
 *   node scripts/run-enemy-animations.mjs [--group <name>] [<asset-id>]
 *   pnpm generate:animations                    # all rigged enemies
 *   pnpm generate:animations -- --group bosses  # bosses only
 *   pnpm generate:animations -- boss-aureo      # single enemy
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = resolve(__dirname, '..');
const ENEMIES_DIR = join(PROJECT_DIR, 'assets', 'models', 'enemies');
const MESHY_API_BASE = 'https://api.meshy.ai/openapi/v1';

// ── Animation ID lookup table ────────────────────────────────────────────────
//
// Maps the hierarchical path string used in animationTask.animations to the
// integer action_id required by the Meshy API POST /openapi/v1/animations.
//
// Paths marked [CLOSEST MATCH] have no exact entry in the Meshy library;
// the nearest semantically-equivalent animation is used instead.

const ANIMATION_IDS = {
  // Walk/Run
  'WalkAndRun.Walking.Zombie_Walk': 112, // [CLOSEST MATCH] Monster_Walk
  'WalkAndRun.Walking.Stumble_Walk': 562,
  'WalkAndRun.Running.Lean_Forward_Sprint': 509,

  // Idle / Taunts
  'DailyActions.Idle.Angry_Ground_Stomp': 255,
  'DailyActions.Idle.Angry_Ground_Stomp_1': 256,
  'DailyActions.Idle.Angry_Ground_Stomp_2': 257,
  'Fighting.Transitioning.Chest_Pound_Taunt': 88,

  // Getting Hit
  'Fighting.GettingHit.BeHit_FlyUp': 7,
  'Fighting.GettingHit.Face_Punch_Reaction': 174,
  'Fighting.GettingHit.Face_Punch_Reaction_1': 175,
  'Fighting.GettingHit.Face_Punch_Reaction_2': 176,

  // Death / Dying
  'Fighting.Dying.Knock_Down': 187,
  'Fighting.Dying.Knock_Down_1': 190,
  'Fighting.Dying.Dead': 8,
  'Fighting.Dying.Electrocuted_Fall': 181,
  'Fighting.Dying.Fall_Dead_from_Abdominal_Injury': 188,
  'Fighting.Dying.Shot_and_Blown_Back': 182,

  // Weapon Attacks
  'Fighting.AttackingwithWeapon.Charged_Axe_Chop': 237,
  'Fighting.AttackingwithWeapon.Axe_Spin_Attack': 238,
  'Fighting.AttackingwithWeapon.Charged_Slash': 242,
  'Fighting.AttackingwithWeapon.Thrust_Slash': 240,
  'Fighting.AttackingwithWeapon.Left_Slash': 97,

  // Spell / Magic
  'Fighting.CastingSpell.Charged_Spell_Cast': 125,
  'Fighting.CastingSpell.Charged_Spell_Cast_1': 126,
  'Fighting.CastingSpell.Charged_Ground_Slam': 127,
  'Fighting.CastingSpell.mage_soell_cast': 129,
  'Fighting.CastingSpell.mage_soell_cast_1': 130,
  'Fighting.CastingSpell.mage_soell_cast_2': 131,

  // Punching
  'Fighting.Punching.Fast_Punch_Combo': 198, // [CLOSEST MATCH] Punch_Combo
  'Fighting.Punching.Hook_Punch': 193, // [CLOSEST MATCH] Left_Hook_from_Guard

  // Body Movements
  'BodyMovements.Acting.Mummy_Stagger': 113,
  'BodyMovements.Acting.Zombie_Scream': 386,
};

// ── Parse args ───────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
let targetGroup = '';
let targetAsset = '';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--group') {
    targetGroup = args[++i];
    continue;
  }
  // Positional: asset ID
  if (!args[i].startsWith('-')) {
    targetAsset = args[i];
  }
}

// ── Load API key ─────────────────────────────────────────────────────────────

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
  process.exit(1);
}

// ── Collect enemy manifest directories ──────────────────────────────────────

function collectEnemyDirs() {
  if (targetAsset) {
    // Search all groups for this specific enemy
    for (const group of readdirSync(ENEMIES_DIR)) {
      const candidate = join(ENEMIES_DIR, group, targetAsset);
      if (existsSync(join(candidate, 'manifest.json'))) return [candidate];
    }
    console.error(`ERROR: Enemy '${targetAsset}' not found in ${ENEMIES_DIR}`);
    process.exit(1);
  }

  const dirs = [];
  const groups = targetGroup
    ? [targetGroup]
    : readdirSync(ENEMIES_DIR).filter((g) => {
        try {
          return readdirSync(join(ENEMIES_DIR, g), { withFileTypes: true }).some((e) =>
            e.isDirectory(),
          );
        } catch {
          return false;
        }
      });

  for (const group of groups.sort()) {
    const groupDir = join(ENEMIES_DIR, group);
    if (!existsSync(groupDir)) {
      console.error(`ERROR: Group '${group}' not found at ${groupDir}`);
      process.exit(1);
    }
    try {
      for (const entry of readdirSync(groupDir).sort()) {
        const assetDir = join(groupDir, entry);
        if (existsSync(join(assetDir, 'manifest.json'))) dirs.push(assetDir);
      }
    } catch {
      /* not a directory */
    }
  }
  return dirs;
}

// ── Meshy API helpers ────────────────────────────────────────────────────────

async function postAnimation(rigTaskId, actionId) {
  const body = { rig_task_id: rigTaskId, action_id: actionId };
  const res = await fetch(`${MESHY_API_BASE}/animations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST /animations failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  // Meshy animation POST returns { "result": "<task-id>" } (string), not { "id": "..." }
  const taskId = typeof data.result === 'string' ? data.result : (data.id ?? data.result?.id);
  if (!taskId) throw new Error(`POST /animations: no task ID in response: ${JSON.stringify(data)}`);
  console.log(`    → task ID: ${taskId}`);
  return taskId;
}

async function pollAnimation(taskId, label, maxWaitMs = 600_000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    await sleep(15_000);
    const pollUrl = `${MESHY_API_BASE}/animations/${taskId}`;
    const res = await fetch(pollUrl, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`  Poll error for ${label}: GET ${pollUrl} → ${res.status} ${body}`);
      return null;
    }
    const data = await res.json();
    if (data.status === 'SUCCEEDED') {
      return data.result?.animation_glb_url ?? null;
    }
    if (data.status === 'FAILED' || data.status === 'EXPIRED') {
      console.error(`  ✗ ${label}: ${data.status}`);
      return null;
    }
    const elapsed = Math.round((Date.now() - start) / 1000);
    console.log(`  … ${label}: ${data.status} (${elapsed}s)`);
  }
  console.error(`  ✗ Timeout for ${label}`);
  return null;
}

async function downloadGlb(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const buffer = await res.arrayBuffer();
  writeFileSync(destPath, Buffer.from(buffer));
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Per-enemy animation runner ───────────────────────────────────────────────

async function runAnimationsForEnemy(assetDir) {
  const manifestPath = join(assetDir, 'manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const _id = manifest.id ?? basename(assetDir);

  const rigStatus = manifest.tasks?.rigging?.status;
  if (rigStatus !== 'SUCCEEDED') {
    console.log(`  [skip] rigging ${rigStatus ?? 'NOT_STARTED'} — run full pipeline first`);
    return { skipped: true };
  }

  const rigTaskId = manifest.tasks.rigging.taskId;
  const animationPaths = manifest.animationTask?.animations ?? [];

  if (animationPaths.length === 0) {
    console.log('  [skip] No animations defined in manifest');
    return { skipped: true };
  }

  const animDir = join(assetDir, 'animations');
  mkdirSync(animDir, { recursive: true });

  // Ensure tasks.animations map exists
  if (!manifest.tasks.animations) manifest.tasks.animations = {};

  let succeeded = 0;
  let failed = 0;
  let skipped = 0;

  for (const animPath of animationPaths) {
    // Last segment of the path becomes the filename
    const animName = animPath.split('.').pop();
    const glbPath = join(animDir, `${animName}.glb`);
    const existing = manifest.tasks.animations[animPath];

    // Already downloaded
    if (existing?.status === 'SUCCEEDED' && existsSync(glbPath)) {
      console.log(`  ✓ ${animName}: already complete`);
      skipped++;
      continue;
    }

    const actionId = ANIMATION_IDS[animPath];
    if (actionId === undefined) {
      console.warn(`  [warn] No action_id mapped for: ${animPath} — add it to ANIMATION_IDS`);
      failed++;
      continue;
    }

    // Submit (or resume a pending/in-progress task)
    let taskId = existing?.taskId;
    const resumable =
      taskId && (existing?.status === 'PENDING' || existing?.status === 'IN_PROGRESS');

    if (!taskId || existing?.status === 'FAILED' || existing?.status === 'EXPIRED') {
      console.log(`  ▶ Submitting ${animName} (action_id=${actionId})…`);
      try {
        taskId = await postAnimation(rigTaskId, actionId);
      } catch (err) {
        console.error(`  ✗ Submit error for ${animName}: ${err.message}`);
        failed++;
        continue;
      }
      manifest.tasks.animations[animPath] = { taskId, status: 'PENDING', actionId };
      writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    } else if (resumable) {
      console.log(`  ↻ Resuming ${animName} (task: ${taskId})`);
    }

    // Poll
    const glbUrl = await pollAnimation(taskId, animName);
    if (!glbUrl) {
      manifest.tasks.animations[animPath] = {
        ...manifest.tasks.animations[animPath],
        taskId,
        status: 'FAILED',
        actionId,
      };
      writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      failed++;
      continue;
    }

    // Download
    console.log(`  ↓ Downloading ${animName}.glb…`);
    try {
      await downloadGlb(glbUrl, glbPath);
    } catch (err) {
      console.error(`  ✗ Download error for ${animName}: ${err.message}`);
      manifest.tasks.animations[animPath] = {
        ...manifest.tasks.animations[animPath],
        taskId,
        status: 'FAILED',
        actionId,
      };
      writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      failed++;
      continue;
    }

    manifest.tasks.animations[animPath] = {
      taskId,
      status: 'SUCCEEDED',
      actionId,
      artifact: `animations/${animName}.glb`,
    };
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`  ✓ ${animName}`);
    succeeded++;
  }

  return { succeeded, failed, skipped };
}

// ── Main ─────────────────────────────────────────────────────────────────────

const enemyDirs = collectEnemyDirs();

console.log('=== Enemy Animation Runner ===');
console.log(`Enemies to process: ${enemyDirs.length}`);
if (targetGroup) console.log(`Group filter: ${targetGroup}`);
if (targetAsset) console.log(`Asset filter: ${targetAsset}`);
console.log('');

let totalSucceeded = 0;
let totalFailed = 0;
let totalSkipped = 0;
let pipelineSkipped = 0;

for (const assetDir of enemyDirs) {
  const id = basename(assetDir);
  const group = basename(dirname(assetDir));
  console.log(`--- [${group}] ${id} ---`);

  const result = await runAnimationsForEnemy(assetDir);

  if (result.skipped === true) {
    pipelineSkipped++;
  } else {
    totalSucceeded += result.succeeded ?? 0;
    totalFailed += result.failed ?? 0;
    totalSkipped += result.skipped ?? 0;
  }
  console.log('');
}

console.log('=== Results ===');
console.log(`Animation clips succeeded: ${totalSucceeded}`);
console.log(`Animation clips failed:    ${totalFailed}`);
console.log(`Animation clips skipped:   ${totalSkipped} (already done)`);
console.log(`Enemies skipped:           ${pipelineSkipped} (rigging not complete)`);

if (pipelineSkipped > 0) {
  console.log('\nTo rig remaining enemies:');
  console.log('  pnpm generate:enemies -- --step rigging');
}

if (totalFailed > 0) {
  process.exit(1);
}
