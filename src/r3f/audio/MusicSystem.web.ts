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
import { getSharedAudioContext } from './sharedAudioContext';

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
let pendingStopTimeout: ReturnType<typeof setTimeout> | null = null;

const MUSIC_VOLUME = 0.12;
const FADE_MS = 300;

// ---------------------------------------------------------------------------
// Init / Dispose
// ---------------------------------------------------------------------------

export function initMusic(): void {
  if (ctx) return;
  ctx = getSharedAudioContext();
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
    // Don't close the shared AudioContext — other subsystems may still use it.
    // Just disconnect our gain nodes and drop the references.
    if (musicGain) musicGain.disconnect();
    if (masterGain) masterGain.disconnect();
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

  try {
    if (!ctx) initMusic();
    const c = ctx!;
    if (c.state === 'suspended') c.resume();

    if (!bufferMap) return;
    const assetKey = TRACK_TO_ASSET[track];
    const buffer = bufferMap.get(assetKey);
    if (!buffer) return;

    const source = c.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(musicGain!);
    source.start();
    // Set currentTrack and activeSource only AFTER source.start() succeeds
    // to avoid stale references if start() throws
    currentTrack = track;
    activeSource = source;
  } catch (err) {
    console.warn('[MusicSystem] playTrack error:', err);
  }
}

export function stopMusic(): void {
  // Cancel any pending cleanup from a previous stop
  if (pendingStopTimeout !== null) {
    clearTimeout(pendingStopTimeout);
    pendingStopTimeout = null;
  }

  if (activeSource && ctx && musicGain) {
    try {
      const c = ctx;
      const fadeEnd = c.currentTime + FADE_MS / 1000;
      musicGain.gain.setValueAtTime(musicGain.gain.value, c.currentTime);
      musicGain.gain.linearRampToValueAtTime(0, fadeEnd);

      const src = activeSource;
      const gain = musicGain;
      pendingStopTimeout = setTimeout(() => {
        pendingStopTimeout = null;
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
        // Only reset gain if it's still our gain node (not disposed)
        if (musicGain === gain) {
          gain.gain.cancelScheduledValues(0);
          gain.gain.value = MUSIC_VOLUME;
        }
      }, FADE_MS + 50);
    } catch (err) {
      console.warn('[MusicSystem] stopMusic error:', err);
    }
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

import { getAssetUrl } from '../../engine/assetUrl';

/** Fetch and decode an OGG audio file from a static URL into an AudioBuffer. */
async function loadAudioBuffer(subpath: string, audioCtx: AudioContext): Promise<AudioBuffer> {
  const uri = getAssetUrl(subpath);
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
  const entries = Object.entries(MUSIC_ASSETS) as [MusicAssetKey, string][];
  const results = await Promise.allSettled(
    entries.map(async ([key, subpath]) => {
      const buffer = await loadAudioBuffer(subpath, audioCtx);
      map.set(key, buffer);
    }),
  );
  // Log any individual track failures without killing the whole load
  for (let i = 0; i < results.length; i++) {
    if (results[i].status === 'rejected') {
      console.warn(
        `[MusicSystem] Failed to load track "${entries[i][0]}":`,
        (results[i] as PromiseRejectedResult).reason,
      );
    }
  }
  return map;
}

/** Get the music AudioContext (initializes if needed). */
export function getMusicAudioContext(): AudioContext {
  if (!ctx) initMusic();
  return ctx!;
}
