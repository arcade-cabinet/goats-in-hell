/**
 * Native stub for AudioSystem.
 * Web Audio API is unavailable on native iOS/Android.
 * On web, Metro resolves to AudioSystem.web.ts instead of this file.
 * Phase 2: replace with expo-audio implementation.
 */

export type SoundType =
  | 'shoot'
  | 'shotgun'
  | 'rapid'
  | 'bigshot'
  | 'hit'
  | 'headshot'
  | 'goat_die'
  | 'goat_alert'
  | 'pickup'
  | 'hurt'
  | 'door'
  | 'doorClose'
  | 'empty'
  | 'reload'
  | 'reload_complete'
  | 'weapon_switch'
  | 'boss_hit'
  | 'explosion'
  | 'death_sting'
  | 'victory_sting'
  | 'boss_defeat'
  | 'game_complete'
  | 'footstep';

export interface AudioPosition {
  x: number;
  y: number;
  z: number;
}

export function initAudio(): void {}
export function setMasterVolume(_volume: number): void {}
export function disposeAudio(): void {}
export function setSfxBuffers(_buffers: Map<string, AudioBuffer[]>): void {}
export function playSound(_type: SoundType): void {}
export function playPositionalSfx(
  _soundId: string,
  _position: AudioPosition,
  _listenerPosition: AudioPosition,
): void {}
export async function loadAllSfx(_ctx: AudioContext): Promise<Map<string, AudioBuffer[]>> {
  return new Map();
}
export function getAudioContext(): AudioContext {
  throw new Error('[AudioSystem] Web Audio API is not available on native');
}
