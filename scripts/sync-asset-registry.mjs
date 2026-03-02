#!/usr/bin/env node
/**
 * sync-asset-registry.mjs -- Sync Meshy AI prop and setpiece manifests into AssetRegistry.ts.
 *
 * Scans `assets/models/props/` and `assets/models/setpieces/` for manifests that have a
 * corresponding `refined.glb`, reads existing registry entries, and adds NEW entries
 * (doesn't overwrite existing ones).
 *
 * Props:     registered as 'prop-{id}'     in PROP_MODEL_ASSETS
 * Setpieces: registered as 'setpiece-{id}' in SETPIECE_MODEL_ASSETS
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
const SETPIECES_DIR = join(PROJECT_DIR, 'assets', 'models', 'setpieces');
const REGISTRY_PATH = join(PROJECT_DIR, 'src', 'game', 'systems', 'AssetRegistry.ts');

// ── Parse args ──────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

// ── Discover assets with refined.glb ─────────────────────────────────────────

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

function discoverAllInDir(baseDir) {
  const all = [];
  if (!existsSync(baseDir)) return all;

  const groups = readdirSync(baseDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  for (const group of groups) {
    const groupDir = join(baseDir, group);
    all.push(...scanGroup(groupDir, group));
  }

  return all;
}

function discoverAllProps() {
  if (!existsSync(PROPS_DIR)) {
    console.error(`Props directory not found: ${PROPS_DIR}`);
    process.exit(1);
  }
  return discoverAllInDir(PROPS_DIR);
}

function discoverAllSetpieces() {
  return discoverAllInDir(SETPIECES_DIR);
}

// ── Read existing registry entries ──────────────────────────────────────────

function readExistingKeysWithPrefix(registrySource, prefix) {
  const keys = new Set();
  // Manually scan line by line to avoid regex exec() ambiguity
  const lines = registrySource.split('\n');
  const searchPrefix = `'${prefix}-`;
  for (const line of lines) {
    const trimmed = line.trimStart();
    if (!trimmed.startsWith(searchPrefix)) continue;
    const closeQuote = trimmed.indexOf("'", searchPrefix.length);
    if (closeQuote === -1) continue;
    const key = trimmed.slice(1, closeQuote);
    if (
      trimmed
        .slice(closeQuote + 1)
        .trimStart()
        .startsWith(': require(')
    ) {
      keys.add(key);
    }
  }
  return keys;
}

/**
 * Insert new entries before the closing marker of a named const block.
 * Finds the EARLIEST '} as const' in the block (handles both '} as const;'
 * and '} as const satisfies ...' variants) so that adjacent blocks don't
 * accidentally capture each other's closing markers.
 */
function insertIntoBlock(source, blockName, insertionBlock) {
  const blockStart = source.indexOf(`export const ${blockName}`);
  if (blockStart === -1) throw new Error(`Could not find ${blockName} in AssetRegistry.ts`);

  const afterBlock = source.substring(blockStart);
  // Use the shared prefix to find the earliest closing marker regardless of variant
  const idx = afterBlock.indexOf('} as const');
  if (idx === -1) throw new Error(`Could not find closing marker for ${blockName}`);

  const insertionIndex = blockStart + idx;
  return source.slice(0, insertionIndex) + insertionBlock + source.slice(insertionIndex);
}

// ── Main ────────────────────────────────────────────────────────────────────

console.log(`Scanning ${PROPS_DIR} for Meshy props with refined.glb...`);
const discoveredProps = discoverAllProps();
console.log(`Found ${discoveredProps.length} prop(s) with refined.glb.`);

console.log();
console.log(`Scanning ${SETPIECES_DIR} for Meshy set pieces with refined.glb...`);
const discoveredSetpieces = discoverAllSetpieces();
console.log(`Found ${discoveredSetpieces.length} set piece(s) with refined.glb.`);

if (discoveredProps.length === 0 && discoveredSetpieces.length === 0) {
  console.log('\nNothing to sync. Run pnpm generate:props / generate:setpieces first.');
  process.exit(0);
}

// Read registry
let registrySource = readFileSync(REGISTRY_PATH, 'utf-8');
const existingPropKeys = readExistingKeysWithPrefix(registrySource, 'prop');
const existingSetpieceKeys = readExistingKeysWithPrefix(registrySource, 'setpiece');

// Filter to only new entries
const newProps = discoveredProps.filter((d) => !existingPropKeys.has(`prop-${d.id}`));
const newSetpieces = discoveredSetpieces.filter(
  (d) => !existingSetpieceKeys.has(`setpiece-${d.id}`),
);

console.log();
console.log(
  `Existing PROP_MODEL_ASSETS keys:     ${existingPropKeys.size}  (${newProps.length} new)`,
);
console.log(
  `Existing SETPIECE_MODEL_ASSETS keys: ${existingSetpieceKeys.size}  (${newSetpieces.length} new)`,
);

if (newProps.length === 0 && newSetpieces.length === 0) {
  console.log('\nRegistry is already up to date.');
  process.exit(0);
}

if (newProps.length > 0) {
  console.log('\nProps to add:');
  for (const e of newProps) console.log(`  + prop-${e.id} (${e.group}/${e.id}/refined.glb)`);
}
if (newSetpieces.length > 0) {
  console.log('\nSet pieces to add:');
  for (const e of newSetpieces)
    console.log(`  + setpiece-${e.id} (${e.group}/${e.id}/refined.glb)`);
}

if (dryRun) {
  console.log('\n[dry-run] No changes written. Remove --dry-run to apply.');
  process.exit(0);
}

// Apply props
if (newProps.length > 0) {
  const propLines = newProps.map((e) => `  'prop-${e.id}': require('${e.glbRelPath}'),`);
  const propBlock = `  // Meshy AI generated props\n${propLines.join('\n')}\n`;
  try {
    registrySource = insertIntoBlock(registrySource, 'PROP_MODEL_ASSETS', propBlock);
  } catch (err) {
    console.error(`ERROR: ${err.message}`);
    process.exit(1);
  }
}

// Apply setpieces
if (newSetpieces.length > 0) {
  const spLines = newSetpieces.map((e) => `  'setpiece-${e.id}': require('${e.glbRelPath}'),`);
  const spBlock = `  // Meshy AI generated set pieces\n${spLines.join('\n')}\n`;
  try {
    registrySource = insertIntoBlock(registrySource, 'SETPIECE_MODEL_ASSETS', spBlock);
  } catch (err) {
    console.error(`ERROR: ${err.message}`);
    process.exit(1);
  }
}

writeFileSync(REGISTRY_PATH, registrySource, 'utf-8');
console.log();
console.log(
  `Wrote ${newProps.length} prop + ${newSetpieces.length} set piece entries to AssetRegistry.ts`,
);
