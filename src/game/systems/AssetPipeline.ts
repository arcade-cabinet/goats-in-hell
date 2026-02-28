/**
 * AssetPipeline — loads game assets with progress tracking.
 *
 * With the Babylon.js removal, 3D model loading is handled by R3F's
 * useGLTF/useTexture hooks. This module now only handles audio loading
 * (which is engine-agnostic Web Audio API).
 */

import { loadAllMusic, loadAllSfx } from './AssetLoader';
import { initAudio, setSfxBuffers } from './AudioSystem';
import { initMusic, setMusicBuffers } from './MusicSystem';

/**
 * Load audio assets. Calls `onProgress` as each stage completes.
 */
export async function loadAllAssets(
  onProgress: (pct: number, label: string) => void,
): Promise<void> {
  initAudio();
  initMusic();

  let loaded = 0;
  const total = 2;
  const tick = (label: string) => {
    loaded++;
    onProgress(loaded / total, label);
  };

  const audioCtx = new AudioContext();

  onProgress(0, 'Loading music...');
  const musicBuffers = await loadAllMusic(audioCtx);
  tick('Loading sounds...');

  const sfxBufferMap = await loadAllSfx(audioCtx);
  tick('Ready.');

  // Wire decoded audio buffers into playback systems
  setMusicBuffers(musicBuffers);
  setSfxBuffers(sfxBufferMap);
}
