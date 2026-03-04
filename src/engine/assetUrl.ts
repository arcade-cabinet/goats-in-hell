import { Platform } from 'react-native';

/**
 * Derive the Expo web base path from the HTML document.
 * Checks for a <base> tag first, then falls back to extracting the path
 * prefix from Expo's script tags (which are reliably prefixed with
 * experiments.baseUrl from app.json).
 *
 * Returns '' when running on native or when no base path is detected
 * (i.e. deployed at the domain root).
 */
export function getWebBasePath(): string {
  if (typeof document === 'undefined') return '';
  // 1. Honour <base> tag if present
  const base = document.querySelector('base');
  if (base?.href) return new URL(base.href).pathname.replace(/\/$/, '');
  // 2. Fallback: Expo prefixes <script src> with experiments.baseUrl
  const script = document.querySelector('script[src*="/_expo/"]');
  const src = script?.getAttribute('src') ?? '';
  if (!src) return '';
  // Handle both absolute (https://...) and root-relative (/goats-in-hell/...) src values
  const url = src.startsWith('http') ? new URL(src) : new URL(src, document.baseURI);
  // Strip the /_expo/... suffix to get just the base path
  const basePath = url.pathname.replace(/\/_expo\/.*$/, '');
  return basePath.replace(/\/$/, '');
}

/**
 * Resolve a server-relative asset subpath to a full URL.
 *
 * Expo web serves static files from the project root, so
 * `'models/weapons/weapon-pistol.glb'` → `/models/weapons/weapon-pistol.glb`.
 *
 * On native, Metro serves assets from the bundler root — no prefix needed.
 */
export function getAssetUrl(subpath: string): string {
  const basePath = Platform.OS === 'web' ? getWebBasePath() : '';
  return `${basePath}/${subpath}`;
}
