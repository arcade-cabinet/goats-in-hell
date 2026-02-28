/**
 * Audio systems barrel export for the R3F rewrite.
 *
 * Re-exports all audio system APIs from a single entry point.
 */

// Ambient sound system
export {
  disposeAmbientSound,
  initAmbientSound,
  setAmbientBiome,
  setAmbientVolume,
  updateAmbientSound,
} from './AmbientSoundSystem';
// SFX system
export {
  type AudioPosition,
  disposeAudio,
  getAudioContext,
  initAudio,
  loadAllSfx,
  playPositionalSfx,
  playSound,
  type SoundType,
  setMasterVolume,
  setSfxBuffers,
} from './AudioSystem';
// Music system
export {
  disposeMusic,
  getMusicAudioContext,
  initMusic,
  loadAllMusic,
  playTrack,
  setMusicBuffers,
  setMusicMasterVolume,
  stopMusic,
  updateMusic,
} from './MusicSystem';
