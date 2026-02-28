/**
 * Shared AudioContext singleton for all audio subsystems.
 *
 * Browsers limit the number of AudioContext instances (typically 6),
 * so sharing a single context across AudioSystem, MusicSystem, and
 * AmbientSoundSystem prevents hitting that cap and avoids unnecessary
 * resource duplication.
 */

let sharedCtx: AudioContext | null = null;

export function getSharedAudioContext(): AudioContext {
  if (!sharedCtx) sharedCtx = new AudioContext();
  return sharedCtx;
}

export function resumeSharedAudioContext(): void {
  if (sharedCtx?.state === 'suspended') sharedCtx.resume();
}
