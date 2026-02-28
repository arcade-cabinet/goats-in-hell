import {useGameStore} from '../../state/GameStore';

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

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;

/** Pre-loaded SFX buffer groups, keyed by prefix (e.g. 'sfx-pistol'). */
let sfxBuffers: Map<string, AudioBuffer[]> | null = null;

export function initAudio(): void {
  if (!audioCtx) {
    audioCtx = new AudioContext();
    masterGain = audioCtx.createGain();
    masterGain.connect(audioCtx.destination);
    masterGain.gain.value = 0.7;
  }
}

export function setMasterVolume(volume: number): void {
  if (masterGain) {
    masterGain.gain.value = Math.max(0, Math.min(1, volume));
  }
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
function playBufferSound(groupKey: string, gain: number = 1.0): void {
  if (!audioCtx || !sfxBuffers) return;
  const buffers = sfxBuffers.get(groupKey);
  if (!buffers || buffers.length === 0) return;

  const r = useGameStore.getState().rng;
  const buffer = buffers[Math.floor(r() * buffers.length)];
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;

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
  osc.frequency.exponentialRampToValueAtTime(
    Math.max(endFreq, 0.001),
    startTime + duration,
  );

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
  // Randomize pitch and duration for variety
  const pitchVar = 320 + useGameStore.getState().rng() * 200; // 320-520 Hz
  const endPitch = 40 + useGameStore.getState().rng() * 40; // 40-80 Hz
  const dur = 0.3 + useGameStore.getState().rng() * 0.15; // 0.3-0.45s
  scheduleOsc(ctx, 'sawtooth', pitchVar, endPitch, 0.4, dur, dest, t);
}

function playGoatAlert(ctx: AudioContext): void {
  const t = ctx.currentTime;
  const dest = getOutput(ctx);
  const rngFn = useGameStore.getState().rng;
  const basePitch = 160 + rngFn() * 100; // 160-260 Hz
  const peakPitch = basePitch + 100 + rngFn() * 100; // +100-200 Hz
  const dur = 0.25 + rngFn() * 0.1;

  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(basePitch, t);
  osc.frequency.linearRampToValueAtTime(peakPitch, t + dur * 0.5);
  osc.frequency.linearRampToValueAtTime(basePitch, t + dur);

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0.25, t);
  gainNode.gain.exponentialRampToValueAtTime(0.001, t + dur);

  osc.connect(gainNode);
  gainNode.connect(dest);

  osc.start(t);
  osc.stop(t + dur);
}

function playPickup(ctx: AudioContext): void {
  const t = ctx.currentTime;
  const dest = getOutput(ctx);
  const noteDuration = 0.1;
  scheduleOsc(ctx, 'sine', 440, 440, noteDuration, 0.2, dest, t);
  scheduleOsc(ctx, 'sine', 660, 660, noteDuration, 0.2, dest, t + noteDuration);
  scheduleOsc(ctx, 'sine', 880, 880, noteDuration, 0.2, dest, t + noteDuration * 2);
}

function playHurt(ctx: AudioContext): void {
  const t = ctx.currentTime;
  const dest = getOutput(ctx);
  scheduleOsc(ctx, 'square', 100, 40, 0.2, 0.3, dest, t);
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
      playBufferSound('sfx-pistol', 0.4);
      break;
    case 'bigshot':
      playBufferSound('sfx-cannon', 0.8);
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
