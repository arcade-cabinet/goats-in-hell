/**
 * File-based music system for the R3F rewrite.
 *
 * Ported from src/game/systems/MusicSystem.ts — pure Web Audio API,
 * no engine-specific dependencies.
 *
 * Plays pre-loaded OGG tracks via Web Audio API.
 * Crossfades between tracks on state transitions.
 * Track selection based on encounter type and floor theme.
 */

import type { MusicAssetKey } from '../../game/systems/AssetRegistry';
import { useGameStore } from '../../state/GameStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MusicTrack =
  | 'menu'
  | 'exploration'
  | 'tense'
  | 'boss'
  | 'dark'
  | 'death-metal'
  | 'violence'
  | 'revenge'
  | 'gothic';

const TRACK_TO_ASSET: Record<MusicTrack, MusicAssetKey> = {
  menu: 'music-menu',
  exploration: 'music-exploration',
  tense: 'music-tense',
  boss: 'music-boss',
  dark: 'music-dark',
  'death-metal': 'music-death-metal',
  violence: 'music-violence',
  revenge: 'music-revenge',
  gothic: 'music-gothic',
};

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let musicGain: GainNode | null = null;

let currentTrack: MusicTrack | null = null;
let activeSource: AudioBufferSourceNode | null = null;
let bufferMap: Map<MusicAssetKey, AudioBuffer> | null = null;

const MUSIC_VOLUME = 0.12;
const FADE_MS = 300;

// ---------------------------------------------------------------------------
// Init / Dispose
// ---------------------------------------------------------------------------

export function initMusic(): void {
  if (ctx) return;
  ctx = new AudioContext();
  masterGain = ctx.createGain();
  // Read initial volume from store
  masterGain.gain.value = useGameStore.getState().masterVolume;
  masterGain.connect(ctx.destination);

  musicGain = ctx.createGain();
  musicGain.gain.value = MUSIC_VOLUME;
  musicGain.connect(masterGain);
}

export function setMusicMasterVolume(volume: number): void {
  if (masterGain) {
    masterGain.gain.value = Math.max(0, Math.min(1, volume));
  }
}

/**
 * Provide the pre-loaded audio buffers from the asset loading phase.
 * Must be called before any tracks can play.
 */
export function setMusicBuffers(buffers: Map<MusicAssetKey, AudioBuffer>): void {
  bufferMap = buffers;
}

export function disposeMusic(): void {
  stopMusic();
  if (ctx) {
    ctx.close();
    ctx = null;
    masterGain = null;
    musicGain = null;
  }
}

// ---------------------------------------------------------------------------
// Track playback
// ---------------------------------------------------------------------------

export function playTrack(track: MusicTrack): void {
  if (track === currentTrack) return;
  stopMusic();

  if (!ctx) initMusic();
  const c = ctx!;
  if (c.state === 'suspended') c.resume();

  if (!bufferMap) return;
  const assetKey = TRACK_TO_ASSET[track];
  const buffer = bufferMap.get(assetKey);
  if (!buffer) return;

  // Set currentTrack only after confirming we can actually play
  currentTrack = track;

  const source = c.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.connect(musicGain!);
  source.start();
  activeSource = source;
}

export function stopMusic(): void {
  if (activeSource && ctx && musicGain) {
    const c = ctx;
    const fadeEnd = c.currentTime + FADE_MS / 1000;
    musicGain.gain.setValueAtTime(musicGain.gain.value, c.currentTime);
    musicGain.gain.linearRampToValueAtTime(0, fadeEnd);

    const src = activeSource;
    setTimeout(() => {
      try {
        src.stop();
      } catch {
        /* already stopped */
      }
      try {
        src.disconnect();
      } catch {
        /* ignore */
      }
      if (musicGain) {
        musicGain.gain.cancelScheduledValues(0);
        musicGain.gain.value = MUSIC_VOLUME;
      }
    }, FADE_MS + 50);
  }
  activeSource = null;
  currentTrack = null;
}

// ---------------------------------------------------------------------------
// Auto-track selection based on game state
// ---------------------------------------------------------------------------

export function updateMusic(): void {
  const state = useGameStore.getState();
  const screen = state.screen;

  let desired: MusicTrack | null = null;

  if (screen === 'mainMenu' || screen === 'newGame' || screen === 'settings') {
    desired = 'menu';
  } else if (screen === 'dead' || screen === 'gameComplete') {
    desired = null;
  } else if (
    screen === 'playing' ||
    screen === 'paused' ||
    screen === 'victory' ||
    screen === 'bossIntro'
  ) {
    const encounter = state.stage.encounterType;
    if (encounter === 'boss') {
      // Boss fights: heavy tracks that escalate the tension
      const bossFloor = state.stage.floor;
      desired = bossFloor >= 15 ? 'revenge' : 'boss';
    } else if (encounter === 'arena') {
      // Arena survival: aggressive combat music
      const arenaFloor = state.stage.floor;
      desired = arenaFloor >= 10 ? 'violence' : 'death-metal';
    } else {
      // Exploration: vary by floor theme, intensify with progression
      const themes = ['firePits', 'fleshCaverns', 'obsidianFortress', 'theVoid'];
      const idx = (state.stage.floor - 1) % themes.length;
      const themeName = themes[idx];
      const themeToTrack: Record<string, MusicTrack> = {
        firePits: 'exploration',
        fleshCaverns: 'gothic',
        obsidianFortress: 'tense',
        theVoid: 'dark',
      };
      desired = themeToTrack[themeName] ?? 'exploration';
    }
  }

  if (desired === null && currentTrack !== null) {
    stopMusic();
  } else if (desired !== null && desired !== currentTrack) {
    playTrack(desired);
  }
}

// ---------------------------------------------------------------------------
// Audio buffer loading utilities
// ---------------------------------------------------------------------------

/**
 * Resolve a Metro require() module ID to a fetchable URI string.
 */
function resolveAssetUri(moduleId: number | string): string {
  if (typeof moduleId === 'string') return moduleId;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Asset } = require('expo-asset');
  const asset = Asset.fromModule(moduleId);
  return asset.uri;
}

/** Fetch and decode an OGG audio file into an AudioBuffer. */
async function loadAudioBuffer(moduleId: number, audioCtx: AudioContext): Promise<AudioBuffer> {
  const uri = resolveAssetUri(moduleId);
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error(`Audio fetch failed: ${response.status} ${response.statusText} for ${uri}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return audioCtx.decodeAudioData(arrayBuffer);
}

/** Load all music tracks into a map of AudioBuffers. */
export async function loadAllMusic(
  audioCtx: AudioContext,
): Promise<Map<MusicAssetKey, AudioBuffer>> {
  // Late import to avoid circular dependency at module load time
  const { MUSIC_ASSETS } = await import('../../game/systems/AssetRegistry');

  const map = new Map<MusicAssetKey, AudioBuffer>();
  const entries = Object.entries(MUSIC_ASSETS) as [MusicAssetKey, number][];
  await Promise.all(
    entries.map(async ([key, moduleId]) => {
      const buffer = await loadAudioBuffer(moduleId, audioCtx);
      map.set(key, buffer);
    }),
  );
  return map;
}

/** Get the music AudioContext (initializes if needed). */
export function getMusicAudioContext(): AudioContext {
  if (!ctx) initMusic();
  return ctx!;
}
