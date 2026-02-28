/**
 * AssetPipeline — loads all game assets (physics, weapons, enemies, props,
 * music, SFX) with progress tracking. Extracted from GameEngine.tsx.
 */
import type {Scene} from '@babylonjs/core';

import {initAudio, setSfxBuffers} from './AudioSystem';
import {initMusic, setMusicBuffers} from './MusicSystem';
import {initPhysics} from './PhysicsSetup';
import {loadAllMusic, loadAllSfx} from './AssetLoader';
import {loadAllEnemyTemplates} from '../rendering/GoatMeshFactory';
import {loadAllProps} from '../rendering/DungeonProps';
import {loadAllWeapons} from '../ui/WeaponViewModel';

/**
 * Load all 3D models, audio, and physics WASM. Calls `onProgress` as each
 * stage completes with (loaded / total) and a human-readable label.
 */
export async function loadAllAssets(
  scene: Scene,
  onProgress: (pct: number, label: string) => void,
): Promise<void> {
  initAudio();
  initMusic();

  let loaded = 0;
  const total = 6;
  const tick = (label: string) => {
    loaded++;
    onProgress(loaded / total, label);
  };

  onProgress(0, 'Initializing physics...');
  await initPhysics(scene);
  tick('Forging weapons...');

  const audioCtx = new AudioContext();

  await loadAllWeapons(scene);
  tick('Summoning enemies...');

  await loadAllEnemyTemplates(scene);
  tick('Placing props...');

  await loadAllProps(scene);
  tick('Loading music...');

  const musicBuffers = await loadAllMusic(audioCtx);
  tick('Loading sounds...');

  const sfxBufferMap = await loadAllSfx(audioCtx);
  tick('Ready.');

  // Wire decoded audio buffers into playback systems
  setMusicBuffers(musicBuffers);
  setSfxBuffers(sfxBufferMap);
}
