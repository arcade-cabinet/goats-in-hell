/**
 * Asset loading utilities — provides typed helpers for loading audio buffers.
 * Audio files are served from public/ as static files and loaded via fetch.
 *
 * 3D model/texture loading is handled by R3F hooks (useGLTF, useTexture).
 * This module retains only the audio loading pipeline which uses Web Audio API.
 */
import { getAssetUrl } from '../../engine/assetUrl';

import { MUSIC_ASSETS, type MusicAssetKey, SFX_ASSETS, type SfxAssetKey } from './AssetRegistry';

// ---------------------------------------------------------------------------
// Audio loading
// ---------------------------------------------------------------------------

/** Fetch and decode an OGG audio file into an AudioBuffer. */
async function loadAudioBuffer(subpath: string, audioCtx: AudioContext): Promise<AudioBuffer> {
  const uri = getAssetUrl(subpath);
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error(`Audio fetch failed: ${response.status} ${response.statusText} for ${uri}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return audioCtx.decodeAudioData(arrayBuffer);
}

/** Load all music tracks into a map of AudioBuffers. */
export async function loadAllMusic(
  audioCtx: AudioContext,
): Promise<Map<MusicAssetKey, AudioBuffer>> {
  const map = new Map<MusicAssetKey, AudioBuffer>();
  const entries = Object.entries(MUSIC_ASSETS) as [MusicAssetKey, string][];
  await Promise.all(
    entries.map(async ([key, subpath]) => {
      const buffer = await loadAudioBuffer(subpath, audioCtx);
      map.set(key, buffer);
    }),
  );
  return map;
}

/** Load all SFX into a map of AudioBuffer arrays (variants per sound). */
export async function loadAllSfx(audioCtx: AudioContext): Promise<Map<string, AudioBuffer[]>> {
  const map = new Map<string, AudioBuffer[]>();
  const entries = Object.entries(SFX_ASSETS) as [SfxAssetKey, string][];

  await Promise.all(
    entries.map(async ([key, subpath]) => {
      const buffer = await loadAudioBuffer(subpath, audioCtx);
      // Group by prefix: 'sfx-pistol-0' → 'sfx-pistol'
      const groupKey = key.replace(/-\d+$/, '');
      if (!map.has(groupKey)) {
        map.set(groupKey, []);
      }
      map.get(groupKey)!.push(buffer);
    }),
  );
  return map;
}

// ---------------------------------------------------------------------------
// Progress tracking
// ---------------------------------------------------------------------------

export interface LoadProgress {
  loaded: number;
  total: number;
  label: string;
}

export type ProgressCallback = (progress: LoadProgress) => void;
