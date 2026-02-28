/**
 * Procedural ambient soundscapes per biome.
 *
 * Each floor theme has a distinct sound bed built from Web Audio oscillators
 * and noise generators. Layers crossfade when the theme changes.
 *
 * firePits       — low rumble + crackling fire noise
 * fleshCaverns   — wet squelchy pulse + low moaning drones
 * obsidianFortress — metallic resonance + wind howl
 * theVoid        — eerie sine sweep + sub-bass pulse
 */

import { useGameStore } from '../../state/GameStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BiomeKey = 'firePits' | 'fleshCaverns' | 'obsidianFortress' | 'theVoid';

interface AmbientLayer {
  nodes: AudioNode[];
  gain: GainNode;
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let currentBiome: BiomeKey | null = null;
let activeLayer: AmbientLayer | null = null;

const AMBIENT_VOLUME = 0.06;
const FADE_IN_MS = 2000;
const FADE_OUT_MS = 1500;

// ---------------------------------------------------------------------------
// Init / Dispose
// ---------------------------------------------------------------------------

export function initAmbientSound(): void {
  if (ctx) return;
  ctx = new AudioContext();
  masterGain = ctx.createGain();
  masterGain.gain.value = AMBIENT_VOLUME;
  masterGain.connect(ctx.destination);
}

export function setAmbientVolume(volume: number): void {
  if (masterGain) {
    masterGain.gain.value = Math.max(0, Math.min(0.15, volume));
  }
}

export function disposeAmbientSound(): void {
  stopAmbient();
  if (ctx) {
    ctx.close();
    ctx = null;
    masterGain = null;
  }
}

// ---------------------------------------------------------------------------
// Biome sound builders
// ---------------------------------------------------------------------------

function createFirePits(c: AudioContext, dest: AudioNode): AmbientLayer {
  const gain = c.createGain();
  gain.gain.value = 0;
  gain.connect(dest);
  const nodes: AudioNode[] = [];

  // Deep rumble — sub-bass sawtooth
  const rumble = c.createOscillator();
  rumble.type = 'sawtooth';
  rumble.frequency.value = 32;
  const rumbleGain = c.createGain();
  rumbleGain.gain.value = 0.4;
  rumble.connect(rumbleGain);
  rumbleGain.connect(gain);
  rumble.start();
  nodes.push(rumble);

  // Crackling fire — filtered noise with fast random modulation
  const crackleLen = c.sampleRate * 4;
  const crackleBuffer = c.createBuffer(1, crackleLen, c.sampleRate);
  const crackleData = crackleBuffer.getChannelData(0);
  const rng = useGameStore.getState().rng;
  for (let i = 0; i < crackleLen; i++) {
    // Intermittent bursts simulating fire pops
    const burst = rng() < 0.02 ? 1 : 0;
    crackleData[i] = (rng() * 2 - 1) * (0.1 + burst * 0.6);
  }
  const crackle = c.createBufferSource();
  crackle.buffer = crackleBuffer;
  crackle.loop = true;
  const crackleFilter = c.createBiquadFilter();
  crackleFilter.type = 'highpass';
  crackleFilter.frequency.value = 2000;
  crackle.connect(crackleFilter);
  const crackleGain = c.createGain();
  crackleGain.gain.value = 0.25;
  crackleFilter.connect(crackleGain);
  crackleGain.connect(gain);
  crackle.start();
  nodes.push(crackle);

  // Mid-frequency hum — lava bubbling
  const bubble = c.createOscillator();
  bubble.type = 'sine';
  bubble.frequency.value = 55;
  const bubbleLfo = c.createOscillator();
  bubbleLfo.type = 'sine';
  bubbleLfo.frequency.value = 2.5;
  const lfoGain = c.createGain();
  lfoGain.gain.value = 15;
  bubbleLfo.connect(lfoGain);
  lfoGain.connect(bubble.frequency);
  bubbleLfo.start();
  const bubbleGain = c.createGain();
  bubbleGain.gain.value = 0.15;
  bubble.connect(bubbleGain);
  bubbleGain.connect(gain);
  bubble.start();
  nodes.push(bubble, bubbleLfo);

  return { nodes, gain };
}

function createFleshCaverns(c: AudioContext, dest: AudioNode): AmbientLayer {
  const gain = c.createGain();
  gain.gain.value = 0;
  gain.connect(dest);
  const nodes: AudioNode[] = [];

  // Wet pulsing drone — low triangle with slow LFO
  const drone = c.createOscillator();
  drone.type = 'triangle';
  drone.frequency.value = 45;
  const droneLfo = c.createOscillator();
  droneLfo.type = 'sine';
  droneLfo.frequency.value = 0.3;
  const lfoGain = c.createGain();
  lfoGain.gain.value = 0.3;
  droneLfo.connect(lfoGain);
  lfoGain.connect(drone.frequency);
  droneLfo.start();
  const droneGain = c.createGain();
  droneGain.gain.value = 0.35;
  drone.connect(droneGain);
  droneGain.connect(gain);
  drone.start();
  nodes.push(drone, droneLfo);

  // Squelchy noise — band-pass filtered noise with rhythmic gating
  const sqLen = c.sampleRate * 6;
  const sqBuffer = c.createBuffer(1, sqLen, c.sampleRate);
  const sqData = sqBuffer.getChannelData(0);
  const rng = useGameStore.getState().rng;
  for (let i = 0; i < sqLen; i++) {
    const t = i / c.sampleRate;
    // Slow periodic squelch pulses
    const pulse = Math.max(0, Math.sin(t * 1.2 * Math.PI * 2) * 0.8);
    sqData[i] = (rng() * 2 - 1) * pulse;
  }
  const sqSource = c.createBufferSource();
  sqSource.buffer = sqBuffer;
  sqSource.loop = true;
  const sqFilter = c.createBiquadFilter();
  sqFilter.type = 'bandpass';
  sqFilter.frequency.value = 400;
  sqFilter.Q.value = 3;
  sqSource.connect(sqFilter);
  const sqGain = c.createGain();
  sqGain.gain.value = 0.12;
  sqFilter.connect(sqGain);
  sqGain.connect(gain);
  sqSource.start();
  nodes.push(sqSource);

  // Distant moans — detuned sawtooth pair
  const moan1 = c.createOscillator();
  moan1.type = 'sawtooth';
  moan1.frequency.value = 82;
  const moan2 = c.createOscillator();
  moan2.type = 'sawtooth';
  moan2.frequency.value = 85;
  const moanFilter = c.createBiquadFilter();
  moanFilter.type = 'lowpass';
  moanFilter.frequency.value = 200;
  const moanGain = c.createGain();
  moanGain.gain.value = 0.08;
  moan1.connect(moanFilter);
  moan2.connect(moanFilter);
  moanFilter.connect(moanGain);
  moanGain.connect(gain);
  moan1.start();
  moan2.start();
  nodes.push(moan1, moan2);

  return { nodes, gain };
}

function createObsidianFortress(c: AudioContext, dest: AudioNode): AmbientLayer {
  const gain = c.createGain();
  gain.gain.value = 0;
  gain.connect(dest);
  const nodes: AudioNode[] = [];

  // Metallic resonance — detuned sine cluster
  const freqs = [110, 165, 220.5, 330.7];
  for (const freq of freqs) {
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const oscGain = c.createGain();
    oscGain.gain.value = 0.06;
    osc.connect(oscGain);
    oscGain.connect(gain);
    osc.start();
    nodes.push(osc);
  }

  // Wind howl — filtered noise with slow sweep
  const windLen = c.sampleRate * 8;
  const windBuffer = c.createBuffer(1, windLen, c.sampleRate);
  const windData = windBuffer.getChannelData(0);
  const rng = useGameStore.getState().rng;
  for (let i = 0; i < windLen; i++) {
    windData[i] = rng() * 2 - 1;
  }
  const wind = c.createBufferSource();
  wind.buffer = windBuffer;
  wind.loop = true;
  const windFilter = c.createBiquadFilter();
  windFilter.type = 'bandpass';
  windFilter.frequency.value = 600;
  windFilter.Q.value = 8;
  // Slowly sweep the filter for howling effect
  const sweepLfo = c.createOscillator();
  sweepLfo.type = 'sine';
  sweepLfo.frequency.value = 0.15;
  const sweepGain = c.createGain();
  sweepGain.gain.value = 400;
  sweepLfo.connect(sweepGain);
  sweepGain.connect(windFilter.frequency);
  sweepLfo.start();
  wind.connect(windFilter);
  const windGainNode = c.createGain();
  windGainNode.gain.value = 0.08;
  windFilter.connect(windGainNode);
  windGainNode.connect(gain);
  wind.start();
  nodes.push(wind, sweepLfo);

  // Stone grinding — very low periodic rumble
  const grind = c.createOscillator();
  grind.type = 'square';
  grind.frequency.value = 22;
  const grindFilter = c.createBiquadFilter();
  grindFilter.type = 'lowpass';
  grindFilter.frequency.value = 60;
  const grindGain = c.createGain();
  grindGain.gain.value = 0.1;
  grind.connect(grindFilter);
  grindFilter.connect(grindGain);
  grindGain.connect(gain);
  grind.start();
  nodes.push(grind);

  return { nodes, gain };
}

function createTheVoid(c: AudioContext, dest: AudioNode): AmbientLayer {
  const gain = c.createGain();
  gain.gain.value = 0;
  gain.connect(dest);
  const nodes: AudioNode[] = [];

  // Eerie sine sweep — slowly gliding pitch
  const sweep = c.createOscillator();
  sweep.type = 'sine';
  sweep.frequency.value = 200;
  const sweepLfo = c.createOscillator();
  sweepLfo.type = 'sine';
  sweepLfo.frequency.value = 0.05;
  const lfoAmt = c.createGain();
  lfoAmt.gain.value = 150;
  sweepLfo.connect(lfoAmt);
  lfoAmt.connect(sweep.frequency);
  sweepLfo.start();
  const sweepGain = c.createGain();
  sweepGain.gain.value = 0.15;
  sweep.connect(sweepGain);
  sweepGain.connect(gain);
  sweep.start();
  nodes.push(sweep, sweepLfo);

  // Sub-bass pulse — 20 Hz throb
  const sub = c.createOscillator();
  sub.type = 'sine';
  sub.frequency.value = 20;
  const subLfo = c.createOscillator();
  subLfo.type = 'sine';
  subLfo.frequency.value = 0.4;
  const subLfoGain = c.createGain();
  subLfoGain.gain.value = 0.2;
  subLfo.connect(subLfoGain);
  const subGainNode = c.createGain();
  subGainNode.gain.value = 0.3;
  sub.connect(subGainNode);
  subLfoGain.connect(subGainNode.gain);
  subGainNode.connect(gain);
  sub.start();
  subLfo.start();
  nodes.push(sub, subLfo);

  // Void whispers — high-pass noise with tremolo
  const whisperLen = c.sampleRate * 5;
  const whisperBuf = c.createBuffer(1, whisperLen, c.sampleRate);
  const whisperData = whisperBuf.getChannelData(0);
  const rng = useGameStore.getState().rng;
  for (let i = 0; i < whisperLen; i++) {
    const t = i / c.sampleRate;
    const tremolo = Math.max(0, Math.sin(t * 0.7 * Math.PI * 2));
    whisperData[i] = (rng() * 2 - 1) * tremolo * 0.3;
  }
  const whisper = c.createBufferSource();
  whisper.buffer = whisperBuf;
  whisper.loop = true;
  const whisperFilter = c.createBiquadFilter();
  whisperFilter.type = 'highpass';
  whisperFilter.frequency.value = 3000;
  whisper.connect(whisperFilter);
  const whisperGain = c.createGain();
  whisperGain.gain.value = 0.06;
  whisperFilter.connect(whisperGain);
  whisperGain.connect(gain);
  whisper.start();
  nodes.push(whisper);

  // Dissonant harmonic — tritone interval for unease
  const tri1 = c.createOscillator();
  tri1.type = 'triangle';
  tri1.frequency.value = 146.8;
  const tri2 = c.createOscillator();
  tri2.type = 'triangle';
  tri2.frequency.value = 207.7; // tritone = devil's interval
  const triGain = c.createGain();
  triGain.gain.value = 0.04;
  tri1.connect(triGain);
  tri2.connect(triGain);
  triGain.connect(gain);
  tri1.start();
  tri2.start();
  nodes.push(tri1, tri2);

  return { nodes, gain };
}

// ---------------------------------------------------------------------------
// Biome builders map
// ---------------------------------------------------------------------------

const BIOME_BUILDERS: Record<BiomeKey, (c: AudioContext, dest: AudioNode) => AmbientLayer> = {
  firePits: createFirePits,
  fleshCaverns: createFleshCaverns,
  obsidianFortress: createObsidianFortress,
  theVoid: createTheVoid,
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

function stopAmbient(): void {
  if (!activeLayer || !ctx) return;
  const c = ctx;
  const layer = activeLayer;

  // Fade out
  layer.gain.gain.setValueAtTime(layer.gain.gain.value, c.currentTime);
  layer.gain.gain.linearRampToValueAtTime(0, c.currentTime + FADE_OUT_MS / 1000);

  // Schedule cleanup after fade
  setTimeout(() => {
    for (const node of layer.nodes) {
      try {
        if ('stop' in node && typeof (node as OscillatorNode).stop === 'function') {
          (node as OscillatorNode).stop();
        }
      } catch {
        /* already stopped */
      }
      try {
        node.disconnect();
      } catch {
        /* ignore */
      }
    }
    try {
      layer.gain.disconnect();
    } catch {
      /* ignore */
    }
  }, FADE_OUT_MS + 100);

  activeLayer = null;
  currentBiome = null;
}

/** Start the ambient soundscape for a biome. Crossfades if already playing. */
export function setAmbientBiome(biome: string): void {
  const key = biome as BiomeKey;
  if (key === currentBiome) return;
  if (!BIOME_BUILDERS[key]) return;

  if (!ctx) initAmbientSound();
  const c = ctx!;
  if (c.state === 'suspended') c.resume();

  // Fade out current layer
  if (activeLayer) {
    stopAmbient();
  }

  // Build new layer
  const layer = BIOME_BUILDERS[key](c, masterGain!);

  // Fade in
  layer.gain.gain.setValueAtTime(0, c.currentTime);
  layer.gain.gain.linearRampToValueAtTime(1, c.currentTime + FADE_IN_MS / 1000);

  activeLayer = layer;
  currentBiome = key;
}

/** Update ambient sound state based on game state. Call each frame. */
export function updateAmbientSound(): void {
  const state = useGameStore.getState();
  const screen = state.screen;

  if (
    screen === 'mainMenu' ||
    screen === 'dead' ||
    screen === 'gameComplete' ||
    screen === 'newGame' ||
    screen === 'settings'
  ) {
    if (currentBiome !== null) {
      stopAmbient();
    }
    return;
  }

  if (
    screen === 'playing' ||
    screen === 'paused' ||
    screen === 'victory' ||
    screen === 'bossIntro'
  ) {
    // Map floor to biome theme
    const themes: BiomeKey[] = ['firePits', 'fleshCaverns', 'obsidianFortress', 'theVoid'];
    const idx = (state.stage.floor - 1) % themes.length;
    setAmbientBiome(themes[idx]);
  }
}
