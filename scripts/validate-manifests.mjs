#!/usr/bin/env node
/**
 * validate-manifests.mjs — CI guard for asset manifest integrity.
 *
 * Scans all manifest.json files under public/models/ and checks that:
 *   1. Every artifact file referenced in tasks.*.artifacts.* actually exists on disk.
 *   2. SUCCEEDED tasks have at least one artifact (no silently empty artifacts).
 *   3. Animation task artifact paths are reachable.
 *
 * Exit code 0 = all manifests valid.
 * Exit code 1 = one or more failures (printed to stderr).
 *
 * Usage:
 *   node scripts/validate-manifests.mjs
 *   node scripts/validate-manifests.mjs --warn-only   # exit 0 even on issues (for debugging)
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const MODELS_DIR = join(ROOT, 'public', 'models');

const WARN_ONLY = process.argv.includes('--warn-only');

// ---------------------------------------------------------------------------
// Collect manifest files
// ---------------------------------------------------------------------------

function* findManifests(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* findManifests(fullPath);
    } else if (entry.name === 'manifest.json') {
      yield fullPath;
    }
  }
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

/**
 * Resolve an artifact path relative to the manifest's directory.
 * Handles both "model.glb" and "animations/Zombie_Walk.glb" forms.
 */
function resolveArtifact(manifestDir, artifactValue) {
  return join(manifestDir, artifactValue);
}

/**
 * Validate a single manifest file.
 * Returns array of error strings (empty = valid).
 */
function validateManifest(manifestPath) {
  const errors = [];
  const manifestDir = dirname(manifestPath);
  const relPath = manifestPath.replace(`${ROOT}/`, '');

  let data;
  try {
    data = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch (e) {
    return [`${relPath}: invalid JSON — ${e.message}`];
  }

  const { id, tasks } = data;
  if (!id) errors.push(`${relPath}: missing required field "id"`);
  if (!tasks) return errors; // no tasks to validate

  for (const [taskName, taskData] of Object.entries(tasks)) {
    // Skip the "animations" task — it's an object of sub-tasks, handled below
    if (taskName === 'animations') {
      for (const [animName, animData] of Object.entries(taskData)) {
        if (typeof animData !== 'object') continue;

        const { status, artifact } = animData;

        if (status === 'SUCCEEDED') {
          if (!artifact) {
            errors.push(
              `${relPath}[${taskName}.${animName}]: SUCCEEDED but missing "artifact" field`,
            );
          } else {
            const filePath = resolveArtifact(manifestDir, artifact);
            if (!existsSync(filePath)) {
              errors.push(
                `${relPath}[${taskName}.${animName}]: artifact "${artifact}" not found on disk`,
              );
            }
          }
        }
      }
      continue;
    }

    // Standard tasks (text-to-3d-preview, text-to-3d-refine, rigging, etc.)
    if (typeof taskData !== 'object') continue;

    const { status, artifacts } = taskData;

    // Warn if a SUCCEEDED task has empty artifacts (may indicate incomplete pipeline).
    // Exception: enemy pipeline only keeps the final rigged model.glb — preview/refine
    // GLBs are intermediate steps intentionally not downloaded.
    const isEnemyPipeline = data.pipeline === 'enemy';
    const INTERMEDIATE_TASKS = ['text-to-3d-preview', 'text-to-3d-refine'];
    if (status === 'SUCCEEDED' && artifacts && Object.keys(artifacts).length === 0) {
      const ARTIFACT_PRODUCING_TASKS = ['text-to-3d-preview', 'text-to-3d-refine', 'rigging'];
      if (ARTIFACT_PRODUCING_TASKS.includes(taskName)) {
        if (isEnemyPipeline && INTERMEDIATE_TASKS.includes(taskName)) {
          // Expected: enemy pipeline discards intermediate preview/refine GLBs
        } else {
          errors.push(`${relPath}[${taskName}]: SUCCEEDED but artifacts is empty {}`);
        }
      }
    }

    // Check each referenced artifact file exists
    if (artifacts && typeof artifacts === 'object') {
      for (const [artifactKey, artifactValue] of Object.entries(artifacts)) {
        if (typeof artifactValue !== 'string') continue;
        const filePath = resolveArtifact(manifestDir, artifactValue);
        if (!existsSync(filePath)) {
          errors.push(
            `${relPath}[${taskName}.artifacts.${artifactKey}]: file "${artifactValue}" not found on disk`,
          );
        }
      }
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

if (!existsSync(MODELS_DIR)) {
  console.error(`validate-manifests: models directory not found: ${MODELS_DIR}`);
  process.exit(1);
}

const allErrors = [];
let manifestCount = 0;

for (const manifestPath of findManifests(MODELS_DIR)) {
  manifestCount++;
  const errors = validateManifest(manifestPath);
  allErrors.push(...errors);
}

console.log(`Validated ${manifestCount} manifests in public/models/`);

if (allErrors.length === 0) {
  console.log('✓ All manifests valid — no missing artifacts.');
  process.exit(0);
} else {
  console.error(`\n✗ ${allErrors.length} manifest issue(s) found:\n`);
  for (const err of allErrors) {
    console.error(`  • ${err}`);
  }
  console.error('');

  if (WARN_ONLY) {
    console.warn('(--warn-only: exiting 0 despite failures)');
    process.exit(0);
  }
  process.exit(1);
}
