/**
 * Asset loading utilities — resolves Metro require() IDs to URIs and provides
 * typed helpers for loading audio buffers.
 *
 * 3D model/texture loading is now handled by R3F hooks (useGLTF, useTexture).
 * This module retains only the audio loading pipeline which uses Web Audio API.
 */
import {Asset} from 'expo-asset';

import {
  MUSIC_ASSETS,
  SFX_ASSETS,
  type MusicAssetKey,
  type SfxAssetKey,
} from './AssetRegistry';

// ---------------------------------------------------------------------------
// URI resolution
// ---------------------------------------------------------------------------

/** Resolve a Metro require() module ID to a fetchable URI string. */
function resolveAssetUri(moduleId: number | string): string {
  if (typeof moduleId === 'string') return moduleId;
  const asset = Asset.fromModule(moduleId);
  return asset.uri;
}

// ---------------------------------------------------------------------------
// Audio loading
// ---------------------------------------------------------------------------

/** Fetch and decode an OGG audio file into an AudioBuffer. */
async function loadAudioBuffer(
  moduleId: number,
  audioCtx: AudioContext,
): Promise<AudioBuffer> {
  const uri = resolveAssetUri(moduleId);
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
  const entries = Object.entries(MUSIC_ASSETS) as [MusicAssetKey, number][];
  await Promise.all(
    entries.map(async ([key, moduleId]) => {
      const buffer = await loadAudioBuffer(moduleId, audioCtx);
      map.set(key, buffer);
    }),
  );
  return map;
}

/** Load all SFX into a map of AudioBuffer arrays (variants per sound). */
export async function loadAllSfx(
  audioCtx: AudioContext,
): Promise<Map<string, AudioBuffer[]>> {
  const map = new Map<string, AudioBuffer[]>();
  const entries = Object.entries(SFX_ASSETS) as [SfxAssetKey, number][];

  await Promise.all(
    entries.map(async ([key, moduleId]) => {
      const buffer = await loadAudioBuffer(moduleId, audioCtx);
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
