#!/usr/bin/env node
/**
 * sync-asset-registry.mjs -- Sync Meshy AI prop manifests into AssetRegistry.ts.
 *
 * Scans `assets/models/props/` for manifests that have a corresponding `refined.glb`,
 * reads existing PROP_MODEL_ASSETS entries from `src/game/systems/AssetRegistry.ts`,
 * and adds NEW entries (doesn't overwrite existing ones).
 *
 * Usage:
 *   node scripts/sync-asset-registry.mjs            # apply changes
 *   node scripts/sync-asset-registry.mjs --dry-run   # preview only
 *   pnpm sync:registry                               # apply changes
 *   pnpm sync:registry:dry                            # preview only
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = resolve(__dirname, '..');
const PROPS_DIR = join(PROJECT_DIR, 'assets', 'models', 'props');
const REGISTRY_PATH = join(PROJECT_DIR, 'src', 'game', 'systems', 'AssetRegistry.ts');

// ── Parse args ──────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

// ── Discover props with refined.glb ─────────────────────────────────────────

/**
 * Scan a group directory (e.g. 'general', 'circle-1') for manifest.json
 * files that have a sibling refined.glb.
 * @returns Array of { id, group, glbRelPath }
 */
function scanGroup(groupDir, groupName) {
  const results = [];
  if (!existsSync(groupDir)) return results;

  const entries = readdirSync(groupDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const manifestPath = join(groupDir, entry.name, 'manifest.json');
    const refinedPath = join(groupDir, entry.name, 'refined.glb');

    if (!existsSync(manifestPath)) continue;
    if (!existsSync(refinedPath)) {
      console.log(`  [skip] ${groupName}/${entry.name}: no refined.glb found`);
      continue;
    }

    try {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
      const id = manifest.id ?? entry.name;
      // Build the require path relative to AssetRegistry.ts location
      const registryDir = dirname(REGISTRY_PATH);
      const relPath = relative(registryDir, refinedPath).replace(/\\/g, '/');
      results.push({ id, group: groupName, glbRelPath: relPath });
    } catch (err) {
      console.warn(`  [warn] ${groupName}/${entry.name}: malformed manifest.json — ${err.message}`);
    }
  }

  return results;
}

function discoverAllProps() {
  const all = [];
  if (!existsSync(PROPS_DIR)) {
    console.error(`Props directory not found: ${PROPS_DIR}`);
    process.exit(1);
  }

  const groups = readdirSync(PROPS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  for (const group of groups) {
    const groupDir = join(PROPS_DIR, group);
    all.push(...scanGroup(groupDir, group));
  }

  return all;
}

// ── Read existing registry entries ──────────────────────────────────────────

function readExistingPropKeys(registrySource) {
  const keys = new Set();
  // Match lines like:  'prop-something': require(
  const re = /^\s*'(prop-[^']+)':\s*require\(/gm;
  for (;;) {
    const match = re.exec(registrySource);
    if (match === null) break;
    keys.add(match[1]);
  }
  return keys;
}

// ── Main ────────────────────────────────────────────────────────────────────

console.log(`Scanning ${PROPS_DIR} for Meshy props with refined.glb...`);
console.log();

const discovered = discoverAllProps();

console.log();
console.log(`Found ${discovered.length} prop(s) with refined.glb.`);

if (discovered.length === 0) {
  console.log('Nothing to sync. Run pnpm generate:props to create refined.glb files first.');
  process.exit(0);
}

// Read registry
const registrySource = readFileSync(REGISTRY_PATH, 'utf-8');
const existingKeys = readExistingPropKeys(registrySource);

// Filter to only new entries
const newEntries = discovered.filter((d) => {
  const key = `prop-${d.id}`;
  return !existingKeys.has(key);
});

console.log(`Existing PROP_MODEL_ASSETS keys: ${existingKeys.size}`);
console.log(`New entries to add: ${newEntries.length}`);

if (newEntries.length === 0) {
  console.log('Registry is already up to date.');
  process.exit(0);
}

// Build insertion text
const lines = newEntries.map((e) => {
  return `  'prop-${e.id}': require('${e.glbRelPath}'),`;
});
const insertionBlock = `  // Meshy AI generated props\n${lines.join('\n')}\n`;

console.log();
console.log('Entries to add:');
for (const e of newEntries) {
  console.log(`  + prop-${e.id} (${e.group}/${e.id}/refined.glb)`);
}

if (dryRun) {
  console.log();
  console.log('[dry-run] No changes written. Remove --dry-run to apply.');
  process.exit(0);
}

// Find insertion point: before the closing `} as const satisfies` or `} as const;`
// for PROP_MODEL_ASSETS
const closingMarkers = ['} as const satisfies', '} as const;'];
let insertionIndex = -1;

// Find the PROP_MODEL_ASSETS block first
const propBlockStart = registrySource.indexOf('export const PROP_MODEL_ASSETS');
if (propBlockStart === -1) {
  console.error('Could not find PROP_MODEL_ASSETS in AssetRegistry.ts');
  process.exit(1);
}

// From the start of PROP_MODEL_ASSETS, find the closing marker
const afterPropBlock = registrySource.substring(propBlockStart);
for (const marker of closingMarkers) {
  const idx = afterPropBlock.indexOf(marker);
  if (idx !== -1) {
    insertionIndex = propBlockStart + idx;
    break;
  }
}

if (insertionIndex === -1) {
  console.error('Could not find closing marker for PROP_MODEL_ASSETS in AssetRegistry.ts');
  process.exit(1);
}

// Insert before the closing marker
const updated =
  registrySource.slice(0, insertionIndex) + insertionBlock + registrySource.slice(insertionIndex);

writeFileSync(REGISTRY_PATH, updated, 'utf-8');
console.log();
console.log(`Wrote ${newEntries.length} new entries to ${REGISTRY_PATH}`);
