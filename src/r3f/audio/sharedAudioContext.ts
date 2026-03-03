/**
 * Native stub for sharedAudioContext.
 * Web Audio API is unavailable on native iOS/Android.
 * Phase 2: replace with expo-audio implementation.
 */

export function getSharedAudioContext(): AudioContext {
  throw new Error('[sharedAudioContext] Web Audio API is not available on native');
}

export function resumeSharedAudioContext(): void {
  // no-op on native
}
