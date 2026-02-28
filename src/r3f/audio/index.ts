/**
 * Audio systems barrel export for the R3F rewrite.
 *
 * Re-exports all audio system APIs from a single entry point.
 */

// SFX system
export {
  initAudio,
  disposeAudio,
  playSound,
  playPositionalSfx,
  setMasterVolume,
  setSfxBuffers,
  loadAllSfx,
  getAudioContext,
  type SoundType,
  type AudioPosition,
} from './AudioSystem';

// Music system
export {
  initMusic,
  disposeMusic,
  updateMusic,
  playTrack,
  stopMusic,
  setMusicMasterVolume,
  setMusicBuffers,
  loadAllMusic,
  getMusicAudioContext,
} from './MusicSystem';

// Ambient sound system
export {
  initAmbientSound,
  disposeAmbientSound,
  updateAmbientSound,
  setAmbientBiome,
  setAmbientVolume,
} from './AmbientSoundSystem';
