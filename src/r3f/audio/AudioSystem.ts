/**
 * Web Audio API sound effects system for the R3F rewrite.
 *
 * Ported from src/game/systems/AudioSystem.ts — pure Web Audio API,
 * no engine-specific dependencies.
 *
 * Supports:
 * - Pre-loaded SFX buffer playback with random variant selection
 * - Procedural stings (goat_die, death_sting, victory_sting, etc.)
 * - Optional 3D positional audio via playPositionalSfx()
 * - Master volume control integrated with useGameStore
 */

import { useGameStore } from '../../state/GameStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

/** 3D position vector for positional audio. */
export interface AudioPosition {
  x: number;
  y: number;
  z: number;
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;

/** Pre-loaded SFX buffer groups, keyed by prefix (e.g. 'sfx-pistol'). */
let sfxBuffers: Map<string, AudioBuffer[]> | null = null;

// ---------------------------------------------------------------------------
// Init / Dispose
// ---------------------------------------------------------------------------

export function initAudio(): void {
  if (!audioCtx) {
    audioCtx = new AudioContext();
    masterGain = audioCtx.createGain();
    masterGain.connect(audioCtx.destination);
    // Read initial volume from store
    masterGain.gain.value = useGameStore.getState().masterVolume;
  }
}

export function setMasterVolume(volume: number): void {
  if (masterGain) {
    masterGain.gain.value = Math.max(0, Math.min(1, volume));
  }
}

export function disposeAudio(): void {
  if (audioCtx) {
    audioCtx.close();
    audioCtx = null;
    masterGain = null;
  }
  sfxBuffers = null;
}

/**
 * Provide the pre-loaded SFX audio buffers from the asset loading phase.
 */
export function setSfxBuffers(buffers: Map<string, AudioBuffer[]>): void {
  sfxBuffers = buffers;
}

// ---------------------------------------------------------------------------
// Buffer-based playback
// ---------------------------------------------------------------------------

function getOutput(ctx: AudioContext): AudioNode {
  return masterGain ?? ctx.destination;
}

/** Play a random variant from a buffer group. */
function playBufferSound(groupKey: string, gain: number = 1.0, playbackRate: number = 1.0): void {
  if (!audioCtx || !sfxBuffers) return;
  const buffers = sfxBuffers.get(groupKey);
  if (!buffers || buffers.length === 0) return;

  const r = useGameStore.getState().rng;
  const buffer = buffers[Math.floor(r() * buffers.length)];
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = playbackRate;

  const gainNode = audioCtx.createGain();
  gainNode.gain.value = gain;
  source.connect(gainNode);
  gainNode.connect(getOutput(audioCtx));
  source.start();
}

/** Play a buffer with pitch variation for natural feel. */
function playBufferVaried(groupKey: string, gain: number = 1.0, pitchRange = 0.1): void {
  if (!audioCtx || !sfxBuffers) return;
  const buffers = sfxBuffers.get(groupKey);
  if (!buffers || buffers.length === 0) return;

  const r = useGameStore.getState().rng;
  const buffer = buffers[Math.floor(r() * buffers.length)];
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = 1 + (r() - 0.5) * 2 * pitchRange;

  const gainNode = audioCtx.createGain();
  gainNode.gain.value = gain;
  source.connect(gainNode);
  gainNode.connect(getOutput(audioCtx));
  source.start();
}

// ---------------------------------------------------------------------------
// 3D Positional audio
// ---------------------------------------------------------------------------

/**
 * Play a sound at a 3D position relative to the listener.
 * Uses Web Audio PannerNode for spatial falloff.
 */
export function playPositionalSfx(
  soundId: string,
  position: AudioPosition,
  listenerPosition: AudioPosition,
): void {
  if (!audioCtx || !sfxBuffers) return;
  const buffers = sfxBuffers.get(soundId);
  if (!buffers || buffers.length === 0) return;

  const ctx = audioCtx;
  if (ctx.state === 'suspended') ctx.resume();

  // Update listener position
  const listener = ctx.listener;
  if (listener.positionX) {
    listener.positionX.value = listenerPosition.x;
    listener.positionY.value = listenerPosition.y;
    listener.positionZ.value = listenerPosition.z;
  } else {
    // Fallback for older browsers
    listener.setPosition(listenerPosition.x, listenerPosition.y, listenerPosition.z);
  }

  const r = useGameStore.getState().rng;
  const buffer = buffers[Math.floor(r() * buffers.length)];
  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const panner = ctx.createPanner();
  panner.panningModel = 'HRTF';
  panner.distanceModel = 'inverse';
  panner.refDistance = 1;
  panner.maxDistance = 50;
  panner.rolloffFactor = 1;
  panner.positionX.value = position.x;
  panner.positionY.value = position.y;
  panner.positionZ.value = position.z;

  source.connect(panner);
  panner.connect(getOutput(ctx));
  source.start();
}

// ---------------------------------------------------------------------------
// Procedural helpers (kept for stings)
// ---------------------------------------------------------------------------

function scheduleOsc(
  ctx: AudioContext,
  type: OscillatorType,
  startFreq: number,
  endFreq: number,
  duration: number,
  gain: number,
  destination: AudioNode,
  startTime: number,
): void {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(startFreq, startTime);
  osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 0.001), startTime + duration);

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(gain, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.connect(gainNode);
  gainNode.connect(destination);

  osc.start(startTime);
  osc.stop(startTime + duration);
}

function scheduleNoise(
  ctx: AudioContext,
  duration: number,
  gain: number,
  decayRate: number,
  destination: AudioNode,
  startTime: number,
): void {
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    data[i] = (useGameStore.getState().rng() * 2 - 1) * Math.exp(-decayRate * t);
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(gain, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  source.connect(gainNode);
  gainNode.connect(destination);

  source.start(startTime);
  source.stop(startTime + duration);
}

// ---------------------------------------------------------------------------
// Procedural stings (kept — these are distinctive and excellent)
// ---------------------------------------------------------------------------

function playGoatDie(ctx: AudioContext): void {
  const t = ctx.currentTime;
  const dest = getOutput(ctx);
  const rngFn = useGameStore.getState().rng;
  // Randomize pitch and duration for variety
  const pitchVar = 320 + rngFn() * 200; // 320-520 Hz
  const endPitch = 40 + rngFn() * 40; // 40-80 Hz
  const dur = 0.45 + rngFn() * 0.15; // 0.45-0.6s (longer decay)

  // Primary descending sawtooth
  scheduleOsc(ctx, 'sawtooth', pitchVar, endPitch, dur, 0.3, dest, t);
  // Sub-bass one octave lower for meatiness
  scheduleOsc(ctx, 'sawtooth', pitchVar / 2, endPitch / 2, dur, 0.2, dest, t);
  // Short noise burst for attack transient
  scheduleNoise(ctx, 0.08, 0.25, 30, dest, t);
}

function playGoatAlert(ctx: AudioContext): void {
  const t = ctx.currentTime;
  const dest = getOutput(ctx);
  const rngFn = useGameStore.getState().rng;
  const basePitch = 160 + rngFn() * 100; // 160-260 Hz
  const peakPitch = basePitch + 100 + rngFn() * 100; // +100-200 Hz
  const dur = 0.3 + rngFn() * 0.1; // slightly longer sustain

  // Waveshaper for aggressive distortion
  const shaper = ctx.createWaveShaper();
  const curve = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    const x = i / 128 - 1;
    curve[i] = ((Math.PI + 3) * x) / (Math.PI + 3 * Math.abs(x));
  }
  shaper.curve = curve;
  shaper.oversample = '2x';
  shaper.connect(dest);

  // Primary sawtooth — ascending bark
  const osc1 = ctx.createOscillator();
  osc1.type = 'sawtooth';
  osc1.frequency.setValueAtTime(basePitch, t);
  osc1.frequency.linearRampToValueAtTime(peakPitch, t + dur * 0.5);
  osc1.frequency.linearRampToValueAtTime(basePitch, t + dur);

  const gain1 = ctx.createGain();
  gain1.gain.setValueAtTime(0.2, t);
  gain1.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc1.connect(gain1);
  gain1.connect(shaper);
  osc1.start(t);
  osc1.stop(t + dur);

  // 3rd harmonic for aggressive overtone
  const osc2 = ctx.createOscillator();
  osc2.type = 'sawtooth';
  osc2.frequency.setValueAtTime(basePitch * 3, t);
  osc2.frequency.linearRampToValueAtTime(peakPitch * 3, t + dur * 0.5);
  osc2.frequency.linearRampToValueAtTime(basePitch * 3, t + dur);

  const gain2 = ctx.createGain();
  gain2.gain.setValueAtTime(0.1, t);
  gain2.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc2.connect(gain2);
  gain2.connect(shaper);
  osc2.start(t);
  osc2.stop(t + dur);
}

function playPickup(ctx: AudioContext): void {
  const t = ctx.currentTime;
  const dest = getOutput(ctx);
  // Quick major chord arpeggio (C5-E5-G5-C6)
  const notes = [523, 659, 784, 1047];
  const step = 0.07;
  for (let i = 0; i < notes.length; i++) {
    scheduleOsc(ctx, 'sine', notes[i], notes[i], 0.12, 0.2, dest, t + i * step);
  }
  // Shimmer: high-frequency triangle at low volume
  scheduleOsc(ctx, 'triangle', 3000, 4000, 0.35, 0.06, dest, t);
}

function playHurt(ctx: AudioContext): void {
  const t = ctx.currentTime;
  const dest = getOutput(ctx);

  // Low-frequency thump (sine at 60Hz, short decay)
  scheduleOsc(ctx, 'sine', 60, 30, 0.15, 0.35, dest, t);

  // Crunchy bandpass-filtered noise
  const noiseDur = 0.12;
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * noiseDur);
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  const rngFn = useGameStore.getState().rng;
  for (let i = 0; i < length; i++) {
    const tSample = i / sampleRate;
    data[i] = (rngFn() * 2 - 1) * Math.exp(-20 * tSample);
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = 800;
  bandpass.Q.value = 2.5;

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0.3, t);
  gainNode.gain.exponentialRampToValueAtTime(0.001, t + noiseDur);

  source.connect(bandpass);
  bandpass.connect(gainNode);
  gainNode.connect(dest);
  source.start(t);
  source.stop(t + noiseDur);
}

function playEmpty(ctx: AudioContext): void {
  const t = ctx.currentTime;
  const dest = getOutput(ctx);
  scheduleOsc(ctx, 'triangle', 80, 80, 0.05, 0.15, dest, t);
}

function playReload(ctx: AudioContext): void {
  const t = ctx.currentTime;
  const dest = getOutput(ctx);
  scheduleOsc(ctx, 'triangle', 300, 500, 0.15, 0.2, dest, t);
}

function playReloadComplete(ctx: AudioContext): void {
  const t = ctx.currentTime;
  const dest = getOutput(ctx);
  scheduleOsc(ctx, 'triangle', 500, 800, 0.08, 0.2, dest, t);
  scheduleOsc(ctx, 'triangle', 700, 1000, 0.06, 0.15, dest, t + 0.08);
}

function playWeaponSwitch(ctx: AudioContext): void {
  const t = ctx.currentTime;
  const dest = getOutput(ctx);
  scheduleOsc(ctx, 'square', 200, 400, 0.08, 0.12, dest, t);
  scheduleNoise(ctx, 0.05, 0.1, 25, dest, t);
}

function playHeadshot(ctx: AudioContext): void {
  const t = ctx.currentTime;
  const dest = getOutput(ctx);
  // Sharp metallic "ding" — distinctive and satisfying
  scheduleOsc(ctx, 'sine', 1200, 1200, 0.08, 0.25, dest, t);
  scheduleOsc(ctx, 'sine', 1800, 1800, 0.06, 0.15, dest, t + 0.03);
  scheduleOsc(ctx, 'triangle', 2400, 2400, 0.04, 0.1, dest, t + 0.05);
}

function playDeathSting(ctx: AudioContext): void {
  const t = ctx.currentTime;
  const dest = getOutput(ctx);
  scheduleOsc(ctx, 'sawtooth', 200, 30, 1.5, 0.4, dest, t);
  scheduleOsc(ctx, 'square', 150, 20, 1.5, 0.25, dest, t + 0.1);
  scheduleNoise(ctx, 1.5, 0.3, 2, dest, t);
}

function playVictorySting(ctx: AudioContext): void {
  const t = ctx.currentTime;
  const dest = getOutput(ctx);
  scheduleOsc(ctx, 'sine', 440, 440, 0.3, 0.2, dest, t);
  scheduleOsc(ctx, 'sine', 554, 554, 0.3, 0.2, dest, t + 0.15);
  scheduleOsc(ctx, 'sine', 659, 659, 0.3, 0.2, dest, t + 0.3);
  scheduleOsc(ctx, 'sine', 880, 880, 0.4, 0.25, dest, t + 0.45);
}

function playBossDefeat(ctx: AudioContext): void {
  const t = ctx.currentTime;
  const dest = getOutput(ctx);
  scheduleOsc(ctx, 'sawtooth', 110, 110, 0.5, 0.3, dest, t);
  scheduleOsc(ctx, 'sawtooth', 165, 165, 0.5, 0.25, dest, t);
  scheduleOsc(ctx, 'sine', 330, 330, 0.2, 0.2, dest, t + 0.3);
  scheduleOsc(ctx, 'sine', 440, 440, 0.2, 0.2, dest, t + 0.5);
  scheduleOsc(ctx, 'sine', 550, 550, 0.2, 0.2, dest, t + 0.7);
  scheduleOsc(ctx, 'sine', 660, 660, 0.4, 0.3, dest, t + 0.9);
  scheduleOsc(ctx, 'sine', 880, 880, 0.6, 0.3, dest, t + 1.1);
}

function playGameComplete(ctx: AudioContext): void {
  const t = ctx.currentTime;
  const dest = getOutput(ctx);
  const notes = [220, 262, 330, 392, 440, 523, 659, 880];
  notes.forEach((freq, i) => {
    scheduleOsc(ctx, 'sine', freq, freq, 0.4, 0.2, dest, t + i * 0.2);
  });
  scheduleOsc(ctx, 'sine', 440, 440, 1.5, 0.15, dest, t + 1.6);
  scheduleOsc(ctx, 'sine', 554, 554, 1.5, 0.12, dest, t + 1.6);
  scheduleOsc(ctx, 'sine', 659, 659, 1.5, 0.12, dest, t + 1.6);
  scheduleOsc(ctx, 'sine', 880, 880, 1.5, 0.1, dest, t + 1.6);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function playSound(type: SoundType): void {
  if (!audioCtx) {
    initAudio();
  }
  const ctx = audioCtx!;

  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  switch (type) {
    // File-based sounds
    case 'shoot':
      playBufferSound('sfx-pistol', 0.6);
      break;
    case 'shotgun':
      playBufferSound('sfx-shotgun', 0.7);
      break;
    case 'rapid':
      playBufferSound('sfx-pistol', 0.5, 0.6);
      break;
    case 'bigshot':
      playBufferSound('sfx-cannon', 0.8, 0.9 + Math.random() * 0.2);
      break;
    case 'hit':
      playBufferSound('sfx-impact', 0.5);
      break;
    case 'boss_hit':
      playBufferSound('sfx-impact', 0.7);
      break;
    case 'headshot':
      playHeadshot(ctx);
      break;
    case 'door':
      playBufferSound('sfx-doorOpen', 0.5);
      break;
    case 'doorClose':
      playBufferSound('sfx-doorClose', 0.5);
      break;
    case 'explosion':
      playBufferSound('sfx-explosion', 0.7);
      break;
    case 'footstep':
      playBufferVaried('sfx-footstep', 0.3, 0.1);
      break;

    // Procedural stings (kept)
    case 'goat_die':
      playGoatDie(ctx);
      break;
    case 'goat_alert':
      playGoatAlert(ctx);
      break;
    case 'pickup':
      playPickup(ctx);
      break;
    case 'hurt':
      playHurt(ctx);
      break;
    case 'empty':
      playEmpty(ctx);
      break;
    case 'reload':
      playReload(ctx);
      break;
    case 'reload_complete':
      playReloadComplete(ctx);
      break;
    case 'weapon_switch':
      playWeaponSwitch(ctx);
      break;
    case 'death_sting':
      playDeathSting(ctx);
      break;
    case 'victory_sting':
      playVictorySting(ctx);
      break;
    case 'boss_defeat':
      playBossDefeat(ctx);
      break;
    case 'game_complete':
      playGameComplete(ctx);
      break;
  }
}

// ---------------------------------------------------------------------------
// Audio buffer loading utilities (engine-agnostic)
// ---------------------------------------------------------------------------

/**
 * Resolve a Metro require() module ID to a fetchable URI string.
 * Uses expo-asset for React Native / Expo projects.
 */
function resolveAssetUri(moduleId: number | string): string {
  if (typeof moduleId === 'string') return moduleId;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Asset } = require('expo-asset');
  const asset = Asset.fromModule(moduleId);
  return asset.uri;
}

/** Fetch and decode an OGG audio file into an AudioBuffer. */
async function loadAudioBuffer(moduleId: number, ctx: AudioContext): Promise<AudioBuffer> {
  const uri = resolveAssetUri(moduleId);
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error(`Audio fetch failed: ${response.status} ${response.statusText} for ${uri}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return ctx.decodeAudioData(arrayBuffer);
}

/**
 * Load all SFX from the AssetRegistry into grouped AudioBuffer arrays.
 * Groups by prefix: 'sfx-pistol-0' -> 'sfx-pistol'.
 */
export async function loadAllSfx(ctx: AudioContext): Promise<Map<string, AudioBuffer[]>> {
  // Late import to avoid circular dependency at module load time
  const { SFX_ASSETS } = await import('../../game/systems/AssetRegistry');
  type SfxAssetKey = keyof typeof SFX_ASSETS;

  const map = new Map<string, AudioBuffer[]>();
  const entries = Object.entries(SFX_ASSETS) as [SfxAssetKey, number][];

  await Promise.all(
    entries.map(async ([key, moduleId]) => {
      const buffer = await loadAudioBuffer(moduleId, ctx);
      // Group by prefix: 'sfx-pistol-0' -> 'sfx-pistol'
      const groupKey = key.replace(/-\d+$/, '');
      if (!map.has(groupKey)) {
        map.set(groupKey, []);
      }
      map.get(groupKey)!.push(buffer);
    }),
  );
  return map;
}

/** Get the audio context (initializes if needed). */
export function getAudioContext(): AudioContext {
  if (!audioCtx) initAudio();
  return audioCtx!;
}
