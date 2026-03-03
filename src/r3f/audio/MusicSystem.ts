/**
 * Native stub for MusicSystem.
 * Web Audio API is unavailable on native iOS/Android.
 * Phase 2: replace with expo-audio implementation.
 */

import type { MusicAssetKey } from '../../game/systems/AssetRegistry';

export function initMusic(): void {}
export function setMusicMasterVolume(_volume: number): void {}
export function setMusicBuffers(_buffers: Map<MusicAssetKey, AudioBuffer>): void {}
export function disposeMusic(): void {}
export function playTrack(_track: string): void {}
export function stopMusic(): void {}
export function updateMusic(): void {}
export async function loadAllMusic(
  _audioCtx: AudioContext,
): Promise<Map<MusicAssetKey, AudioBuffer>> {
  return new Map();
}
export function getMusicAudioContext(): AudioContext {
  throw new Error('[MusicSystem] Web Audio API is not available on native');
}
