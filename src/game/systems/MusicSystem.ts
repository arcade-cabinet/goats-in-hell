/**
 * File-based music system — plays pre-loaded OGG tracks via Web Audio API.
 *
 * Replaces the procedural drone/pad synthesis with recorded music tracks.
 * Crossfades between tracks on state transitions.
 */

import {useGameStore} from '../../state/GameStore';
import type {MusicAssetKey} from './AssetRegistry';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MusicTrack = 'menu' | 'exploration' | 'tense' | 'boss' | 'dark';

const TRACK_TO_ASSET: Record<MusicTrack, MusicAssetKey> = {
  menu: 'music-menu',
  exploration: 'music-exploration',
  tense: 'music-tense',
  boss: 'music-boss',
  dark: 'music-dark',
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
// Init
// ---------------------------------------------------------------------------

export function initMusic(): void {
  if (ctx) return;
  ctx = new AudioContext();
  masterGain = ctx.createGain();
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

// ---------------------------------------------------------------------------
// Track playback
// ---------------------------------------------------------------------------

export function playTrack(track: MusicTrack): void {
  if (track === currentTrack) return;
  stopMusic();
  currentTrack = track;

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
      try { src.stop(); } catch { /* already stopped */ }
      try { src.disconnect(); } catch { /* ignore */ }
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
  } else if (screen === 'playing' || screen === 'paused' || screen === 'victory' || screen === 'bossIntro') {
    const encounter = state.stage.encounterType;
    if (encounter === 'boss') {
      desired = 'boss';
    } else {
      // Map floor themes to music tracks
      const themes = ['firePits', 'fleshCaverns', 'obsidianFortress', 'theVoid'];
      const idx = (state.stage.floor - 1) % themes.length;
      const themeName = themes[idx];
      // firePits/fleshCaverns → exploration, obsidianFortress → tense, theVoid → dark
      const themeToTrack: Record<string, MusicTrack> = {
        firePits: 'exploration',
        fleshCaverns: 'exploration',
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

export function disposeMusic(): void {
  stopMusic();
  if (ctx) {
    ctx.close();
    ctx = null;
    masterGain = null;
    musicGain = null;
  }
}
