/**
 * Asset discovery — scans the `public/models/` directory tree for Meshy AI
 * manifests and returns available asset IDs grouped by category.
 *
 * Used by LevelEditor to expose available props/enemies to agentic build scripts,
 * and by the sync-asset-registry script to keep AssetRegistry.ts up to date.
 */
import { existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Asset IDs grouped by category (general, circle-1, circle-2, ..., bosses). */
export interface AssetManifest {
  general: string[];
  [circleKey: string]: string[];
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Resolve the project root from this file's location (src/db/ -> project root). */
function projectRoot(): string {
  return resolve(__dirname, '..', '..');
}

/**
 * Scan a directory for subdirectories that contain a `manifest.json` file.
 * Returns the `id` field from each manifest, or the directory name as fallback.
 */
function scanForManifests(dir: string): string[] {
  if (!existsSync(dir)) return [];

  const entries = readdirSync(dir, { withFileTypes: true });
  const ids: string[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const manifestPath = join(dir, entry.name, 'manifest.json');
    if (!existsSync(manifestPath)) continue;

    try {
      // Read and parse manifest to get the canonical ID
      const fs = require('node:fs');
      const raw = fs.readFileSync(manifestPath, 'utf-8');
      const manifest = JSON.parse(raw);
      ids.push(manifest.id ?? entry.name);
    } catch {
      // If manifest is malformed, use directory name as fallback
      ids.push(entry.name);
    }
  }

  return ids.sort();
}

/**
 * Scan a top-level category directory (props or enemies) and return
 * an AssetManifest with all discovered groups.
 */
function discoverCategory(categoryDir: string): AssetManifest {
  const result: AssetManifest = { general: [] };

  if (!existsSync(categoryDir)) return result;

  const entries = readdirSync(categoryDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const groupDir = join(categoryDir, entry.name);
    const ids = scanForManifests(groupDir);
    result[entry.name] = ids;
  }

  // Ensure circle-1 through circle-9 always exist as keys
  for (let i = 1; i <= 9; i++) {
    const key = `circle-${i}`;
    if (!result[key]) {
      result[key] = [];
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Scan `public/models/props/` for subdirectories containing `manifest.json`.
 * Returns asset IDs grouped by general and circle-N categories.
 */
export function discoverMeshyProps(): AssetManifest {
  const propsDir = join(projectRoot(), 'public', 'models', 'props');
  return discoverCategory(propsDir);
}

/**
 * Scan `public/models/enemies/` for subdirectories containing `manifest.json`.
 * Returns asset IDs grouped by general, circle-N, and bosses categories.
 */
export function discoverMeshyEnemies(): AssetManifest {
  const enemiesDir = join(projectRoot(), 'public', 'models', 'enemies');
  return discoverCategory(enemiesDir);
}

/**
 * Get all props available for a given circle of Hell.
 * Merges `general` props with circle-specific props (no duplicates).
 */
export function getAvailablePropsForCircle(circle: number): string[] {
  const manifest = discoverMeshyProps();
  const circleKey = `circle-${circle}`;
  const merged = new Set<string>([...manifest.general, ...(manifest[circleKey] ?? [])]);
  return [...merged].sort();
}

/**
 * Get all enemies available for a given circle of Hell.
 * Merges `general` + circle-specific + `bosses` (no duplicates).
 */
export function getAvailableEnemiesForCircle(circle: number): string[] {
  const manifest = discoverMeshyEnemies();
  const circleKey = `circle-${circle}`;
  const merged = new Set<string>([
    ...manifest.general,
    ...(manifest[circleKey] ?? []),
    ...(manifest.bosses ?? []),
  ]);
  return [...merged].sort();
}
