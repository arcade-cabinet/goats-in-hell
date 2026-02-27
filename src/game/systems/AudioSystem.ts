export type SoundType =
  | 'shoot'
  | 'shotgun'
  | 'rapid'
  | 'bigshot'
  | 'hit'
  | 'goat_die'
  | 'goat_alert'
  | 'pickup'
  | 'hurt'
  | 'door'
  | 'empty'
  | 'reload'
  | 'boss_hit'
  | 'explosion';

let audioCtx: AudioContext | null = null;

export function initAudio(): void {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a noise buffer filled with random samples that decay exponentially. */
function createNoiseBuffer(
  ctx: AudioContext,
  duration: number,
  decayRate: number = 4,
): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    data[i] = (Math.random() * 2 - 1) * Math.exp(-decayRate * t);
  }
  return buffer;
}

/** Schedule an oscillator that sweeps from startFreq to endFreq over duration. */
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

/** Play a noise burst through a gain envelope. */
function scheduleNoise(
  ctx: AudioContext,
  duration: number,
  gain: number,
  decayRate: number,
  destination: AudioNode,
  startTime: number,
): void {
  const buffer = createNoiseBuffer(ctx, duration, decayRate);
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
// Sound designs
// ---------------------------------------------------------------------------

function playShoot(ctx: AudioContext): void {
  const t = ctx.currentTime;
  const dest = ctx.destination;
  // Sawtooth 150->40Hz over 150ms
  scheduleOsc(ctx, 'sawtooth', 150, 40, 0.15, 0.3, dest, t);
  // Noise burst for gunshot crack
  scheduleNoise(ctx, 0.15, 0.4, 15, dest, t);
}

function playShotgun(ctx: AudioContext): void {
  const t = ctx.currentTime;
  const dest = ctx.destination;
  // Sawtooth 80->25Hz over 250ms (louder than shoot)
  scheduleOsc(ctx, 'sawtooth', 80, 25, 0.25, 0.5, dest, t);
  // Heavy noise burst
  scheduleNoise(ctx, 0.25, 0.6, 8, dest, t);
}

function playRapid(ctx: AudioContext): void {
  const t = ctx.currentTime;
  const dest = ctx.destination;
  // Similar to shoot but shorter (80ms), quieter
  scheduleOsc(ctx, 'sawtooth', 150, 40, 0.08, 0.15, dest, t);
  scheduleNoise(ctx, 0.08, 0.2, 20, dest, t);
}

function playBigshot(ctx: AudioContext): void {
  const t = ctx.currentTime;
  const dest = ctx.destination;
  // Deep sawtooth 60->15Hz over 500ms
  scheduleOsc(ctx, 'sawtooth', 60, 15, 0.5, 0.5, dest, t);
  // Heavy rumble noise
  scheduleNoise(ctx, 0.5, 0.5, 4, dest, t);
}

function playHit(ctx: AudioContext): void {
  const t = ctx.currentTime;
  const dest = ctx.destination;
  // Square 200->80Hz over 100ms
  scheduleOsc(ctx, 'square', 200, 80, 0.1, 0.25, dest, t);
}

function playGoatDie(ctx: AudioContext): void {
  const t = ctx.currentTime;
  const dest = ctx.destination;
  // Sawtooth 400->60Hz over 400ms (dying screech)
  scheduleOsc(ctx, 'sawtooth', 400, 60, 0.4, 0.35, dest, t);
}

function playGoatAlert(ctx: AudioContext): void {
  const t = ctx.currentTime;
  const dest = ctx.destination;
  // Sawtooth 200->350->200Hz (alerting bleat) - two segments
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(200, t);
  osc.frequency.linearRampToValueAtTime(350, t + 0.15);
  osc.frequency.linearRampToValueAtTime(200, t + 0.3);

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0.25, t);
  gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

  osc.connect(gainNode);
  gainNode.connect(dest);

  osc.start(t);
  osc.stop(t + 0.3);
}

function playPickup(ctx: AudioContext): void {
  const t = ctx.currentTime;
  const dest = ctx.destination;
  // Sine 440->660->880Hz ascending arpeggio (reward chime)
  const noteDuration = 0.1;

  scheduleOsc(ctx, 'sine', 440, 440, noteDuration, 0.2, dest, t);
  scheduleOsc(
    ctx,
    'sine',
    660,
    660,
    noteDuration,
    0.2,
    dest,
    t + noteDuration,
  );
  scheduleOsc(
    ctx,
    'sine',
    880,
    880,
    noteDuration,
    0.2,
    dest,
    t + noteDuration * 2,
  );
}

function playHurt(ctx: AudioContext): void {
  const t = ctx.currentTime;
  const dest = ctx.destination;
  // Square 100->40Hz over 200ms
  scheduleOsc(ctx, 'square', 100, 40, 0.2, 0.3, dest, t);
}

function playDoor(ctx: AudioContext): void {
  const t = ctx.currentTime;
  const dest = ctx.destination;
  // Triangle 80->120Hz over 400ms (creaking)
  scheduleOsc(ctx, 'triangle', 80, 120, 0.4, 0.2, dest, t);
}

function playEmpty(ctx: AudioContext): void {
  const t = ctx.currentTime;
  const dest = ctx.destination;
  // Triangle 80Hz, 50ms (dry click)
  scheduleOsc(ctx, 'triangle', 80, 80, 0.05, 0.15, dest, t);
}

function playReload(ctx: AudioContext): void {
  const t = ctx.currentTime;
  const dest = ctx.destination;
  // Triangle 300->500Hz over 150ms (mechanical click)
  scheduleOsc(ctx, 'triangle', 300, 500, 0.15, 0.2, dest, t);
}

function playBossHit(ctx: AudioContext): void {
  const t = ctx.currentTime;
  const dest = ctx.destination;
  // Square 60->30Hz over 300ms (deep impact)
  scheduleOsc(ctx, 'square', 60, 30, 0.3, 0.4, dest, t);
}

function playExplosion(ctx: AudioContext): void {
  const t = ctx.currentTime;
  const dest = ctx.destination;
  // Sawtooth 60->15Hz over 500ms
  scheduleOsc(ctx, 'sawtooth', 60, 15, 0.5, 0.5, dest, t);
  // Long rumble noise buffer
  scheduleNoise(ctx, 0.8, 0.6, 3, dest, t);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function playSound(type: SoundType): void {
  if (!audioCtx) {
    initAudio();
  }
  const ctx = audioCtx!;

  // Resume context if it was suspended (browser autoplay policy)
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  switch (type) {
    case 'shoot':
      playShoot(ctx);
      break;
    case 'shotgun':
      playShotgun(ctx);
      break;
    case 'rapid':
      playRapid(ctx);
      break;
    case 'bigshot':
      playBigshot(ctx);
      break;
    case 'hit':
      playHit(ctx);
      break;
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
    case 'door':
      playDoor(ctx);
      break;
    case 'empty':
      playEmpty(ctx);
      break;
    case 'reload':
      playReload(ctx);
      break;
    case 'boss_hit':
      playBossHit(ctx);
      break;
    case 'explosion':
      playExplosion(ctx);
      break;
  }
}
