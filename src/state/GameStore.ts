/**
 * Zustand game store – single source of truth for all game state.
 *
 * Replaces the old GameState singleton with proper React-integrated state.
 * Supports: difficulty, seeded runs, logarithmic leveling, boss progression,
 * unified floor/arena/boss encounter flow, and screen effects.
 */

import seedrandom from 'seedrandom';
import { create } from 'zustand';
import { difficultyConfig } from '../config';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type GameScreen =
  | 'mainMenu'
  | 'newGame' // difficulty + seed selection
  | 'settings'
  | 'loading' // asset loading before gameplay
  | 'playing'
  | 'paused'
  | 'dead'
  | 'victory' // between-stage interstitial
  | 'bossIntro' // boss entrance cutscene-ish
  | 'gameComplete'; // escaped hell — final stats + credits

export type Difficulty = 'easy' | 'normal' | 'hard';

export interface DifficultyModifiers {
  /** Display name. */
  label: string;
  /** Enemy HP multiplier. */
  enemyHpMult: number;
  /** Enemy damage multiplier. */
  enemyDmgMult: number;
  /** Enemy speed multiplier. */
  enemySpeedMult: number;
  /** Player starting HP. */
  playerStartHp: number;
  /** XP gain multiplier (higher = faster leveling). */
  xpMult: number;
  /** Pickup spawn density multiplier. */
  pickupDensityMult: number;
}

/** Difficulty presets loaded from config/difficulty.json. */
export const DIFFICULTY_PRESETS: Record<Difficulty, DifficultyModifiers> = {
  easy: difficultyConfig.easy,
  normal: difficultyConfig.normal,
  hard: difficultyConfig.hard,
};

export interface NightmareFlags {
  /** Nightmare mode: enemies are faster, no health pickups, doubled damage. */
  nightmare: boolean;
  /** Permadeath: save is deleted on death. */
  permadeath: boolean;
  /** Ultra Nightmare: permadeath forced, no toggling off, extra boss phases. */
  ultraNightmare: boolean;
}

/** Boss archetype definition. */
export interface BossArchetype {
  id: string;
  name: string;
  /** Stage number at which this boss appears. */
  stageThreshold: number;
  /** Entity type to spawn. */
  entityType: string;
  /** HP multiplier on top of difficulty. */
  hpMult: number;
  /** Minion types spawned during fight. */
  minionTypes: string[];
  /** Loot table weights: weaponId -> weight. */
  lootWeights: Record<string, number>;
}

/** Logarithmic leveling state. */
export interface LevelingState {
  /** Current player level (1-based). */
  level: number;
  /** Current XP. */
  xp: number;
  /** XP required for next level. */
  xpToNext: number;
}

/** The stage describes the current encounter within the run. */
export interface StageState {
  /** Global stage counter (monotonically increasing). */
  stageNumber: number;
  /** Current floor within this stage. */
  floor: number;
  /** 'explore' = dungeon circle, 'boss' = boss encounter. */
  encounterType: 'explore' | 'boss';
  /** Boss archetype ID if encounter is 'boss'. */
  bossId: string | null;
  /** Enemies remaining on this stage. */
  enemiesRemaining: number;
}

export interface GameStoreState {
  // --- Screen & flow ---
  screen: GameScreen;

  // --- Level database ---
  /** True once the SQLite level DB has been initialized and is queryable. */
  dbReady: boolean;
  /** Whether to load levels from the database or use procedural generation. */
  levelSource: 'procedural' | 'database';
  /** Current circle of Hell (1-9). Each circle is a hand-crafted DB level. */
  circleNumber: number;

  // --- Run configuration (set during New Game) ---
  difficulty: Difficulty;
  nightmareFlags: NightmareFlags;
  /** Seed string in adjective-adjective-noun form. */
  seed: string;
  /** Seeded PRNG instance. */
  rng: () => number;

  // --- Progression ---
  stage: StageState;
  leveling: LevelingState;
  /** Boss archetypes defeated this run. */
  bossesDefeated: string[];

  // --- Session stats ---
  score: number;
  kills: number;
  totalKills: number;
  startTime: number;

  // --- Kill tracking (ending system) ---
  /** Enemies killed in locked arenas and boss fights. */
  mandatoryKills: number;
  /** Enemies killed in exploration rooms (avoidable). */
  optionalKills: number;
  /** Total optional enemies spawned across all levels. */
  optionalEnemiesTotal: number;

  // --- Screen effects (decay each frame) ---
  damageFlash: number;
  screenShake: number;
  gunFlash: number;
  hitMarker: number;

  // --- Settings ---
  /** Master volume 0-1. */
  masterVolume: number;
  /** Mouse sensitivity (camera angular sensibility inverse). */
  mouseSensitivity: number;
  /** Touch look sensitivity 0.1-2.0. */
  touchLookSensitivity: number;
  /** Gamepad look sensitivity 0.1-2.0. */
  gamepadLookSensitivity: number;
  /** Gamepad deadzone 0.05-0.4. */
  gamepadDeadzone: number;
  /** Gyroscope sensitivity 0.1-2.0. */
  gyroSensitivity: number;
  /** Whether gyroscope aiming is enabled. */
  gyroEnabled: boolean;
  /** Whether haptic feedback is enabled. */
  hapticsEnabled: boolean;

  // --- Exploration tracking ---
  /** Rooms visited this run, keyed by circle number. Foundation for map fog-of-war. */
  visitedRooms: Record<number, string[]>;

  // --- Autoplay (e2e testing) ---
  /** When true, Yuka AI governor controls the player. */
  autoplay: boolean;

  // --- Actions ---
  /** Start a new run with the given config. */
  startNewGame: (difficulty: Difficulty, nightmareFlags: NightmareFlags, seed: string) => void;
  /** Advance to the next stage. */
  advanceStage: () => void;
  /** Award XP and handle level-ups. */
  awardXp: (amount: number) => void;
  /** Record a boss defeat. */
  defeatBoss: (bossId: string) => void;
  /** Set the DB readiness flag. */
  setDbReady: (ready: boolean) => void;
  /** Switch between procedural and database level sources. */
  setLevelSource: (source: 'procedural' | 'database') => void;
  /** Set the current circle number (1-9). */
  setCircleNumber: (n: number) => void;
  /** Record a mandatory kill (arena/boss). */
  recordMandatoryKill: () => void;
  /** Record an optional kill (explore). */
  recordOptionalKill: () => void;
  /** Add to the total optional enemies spawned count. */
  addOptionalEnemies: (count: number) => void;
  /** Set partial state (for effects, kills, etc.). */
  patch: (partial: Partial<GameStoreState>) => void;
  /** Record a room as visited this run. No-op if already recorded. */
  addVisitedRoom: (circleNumber: number, roomId: string) => void;
  /** Full reset to main menu. */
  resetToMenu: () => void;

  // --- Save/Load ---
  /** Whether a saved run exists in localStorage. */
  hasSave: boolean;
  /** Restored player state from save (consumed by GameEngine on load). */
  restoredPlayerState: PlayerSnapshot | null;
  /** Continue a saved run. */
  continueGame: () => void;
  /** Delete the saved run (permadeath or manual). */
  deleteSave: () => void;
}

// ---------------------------------------------------------------------------
// Logarithmic leveling formula
// ---------------------------------------------------------------------------

/** XP required for a given level: 100 * level^1.5 */
function xpForLevel(level: number): number {
  return Math.floor(100 * level ** 1.5);
}

// ---------------------------------------------------------------------------
// Level bonuses — per-level stat multipliers
// ---------------------------------------------------------------------------

export interface LevelBonuses {
  /** Outgoing damage multiplier (1.0 = baseline). */
  damageMult: number;
  /** Max HP bonus (flat, added to base maxHp). */
  maxHpBonus: number;
  /** Move speed multiplier (1.0 = baseline). */
  speedMult: number;
}

/**
 * Returns stat bonuses for a given player level.
 * Each level grants: +5% damage, +5 max HP, +2% speed.
 */
export function getLevelBonuses(level: number): LevelBonuses {
  const bonus = level - 1; // level 1 = no bonus
  return {
    damageMult: 1 + bonus * 0.05,
    maxHpBonus: bonus * 5,
    speedMult: 1 + bonus * 0.02,
  };
}

// ---------------------------------------------------------------------------
// Stage sequencing: determines what encounter type comes next
// ---------------------------------------------------------------------------

/**
 * Decides the next encounter type based on stage number.
 * Pattern: 4 explore circles → boss every 5 stages.
 */
function nextEncounterType(stageNumber: number): 'explore' | 'boss' {
  if (stageNumber > 0 && stageNumber % 5 === 0) return 'boss';
  return 'explore';
}

/** Pick the boss archetype for a given stage. */
function bossForStage(stageNumber: number): string {
  const bossCycle = ['infernoGoat', 'voidGoat', 'ironGoat', 'archGoat'];
  const idx = Math.floor(stageNumber / 5) % bossCycle.length;
  return bossCycle[idx];
}

// ---------------------------------------------------------------------------
// Seed word pools (brand-associated)
// ---------------------------------------------------------------------------

const ADJECTIVES = [
  'burning',
  'cursed',
  'damned',
  'fallen',
  'wretched',
  'infernal',
  'hollow',
  'screaming',
  'rusted',
  'blackened',
  'molten',
  'shattered',
  'unholy',
  'bleeding',
  'twisted',
  'forsaken',
  'rotting',
  'vengeful',
  'ashen',
  'doomed',
  'sulfurous',
  'tormented',
  'vile',
  'fetid',
  'smoldering',
  'abyssal',
  'profane',
  'sundered',
  'blighted',
  'cinder',
];

const NOUNS = [
  'goat',
  'skull',
  'flame',
  'throne',
  'pyre',
  'abyss',
  'horn',
  'crypt',
  'ember',
  'pit',
  'brimstone',
  'furnace',
  'idol',
  'altar',
  'sigil',
  'chalice',
  'bone',
  'scepter',
  'gate',
  'void',
  'maw',
  'cauldron',
  'pentacle',
  'hoof',
  'cage',
];

/** Generate a random adjective-adjective-noun seed using Math.random. */
export function generateSeedPhrase(): string {
  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
  return `${pick(ADJECTIVES)}-${pick(ADJECTIVES)}-${pick(NOUNS)}`;
}

/** Get the word pools for UI display / rerolling. */
export const SEED_POOLS = { ADJECTIVES, NOUNS } as const;

// ---------------------------------------------------------------------------
// Save/Load persistence
// ---------------------------------------------------------------------------

const SAVE_KEY = 'goats-in-hell-save';
const SETTINGS_KEY = 'goats-in-hell-settings';

interface SaveData {
  version: number;
  difficulty: Difficulty;
  nightmareFlags: NightmareFlags;
  seed: string;
  stage: StageState;
  leveling: LevelingState;
  bossesDefeated: string[];
  score: number;
  totalKills: number;
  elapsedMs: number; // accumulated play time
  circleNumber?: number;
  mandatoryKills?: number;
  optionalKills?: number;
  optionalEnemiesTotal?: number;
  playerHp?: number;
  currentWeapon?: string;
  ammoReserves?: Record<string, number>;
}

/** Optional player state from ECS, passed in when available. */
interface PlayerSnapshot {
  playerHp?: number;
  currentWeapon?: string;
  ammoReserves?: Record<string, number>;
}

/** Last known player snapshot, updated by game engine via savePlayerSnapshot(). */
let cachedPlayerSnapshot: PlayerSnapshot = {};

/** Called by the game engine to cache player ECS state for the next save. */
export function savePlayerSnapshot(snapshot: PlayerSnapshot): void {
  cachedPlayerSnapshot = snapshot;
}

/** Get the cached player ECS snapshot (latest HP, weapon, ammo). */
export function getPlayerSnapshot(): PlayerSnapshot {
  return cachedPlayerSnapshot;
}

/** Callback invoked after a successful save. Set by BabylonHUD to show toast. */
let onSaveCallback: (() => void) | null = null;

/** Register a callback to be called after each save. */
export function registerOnSave(cb: () => void): void {
  onSaveCallback = cb;
}

function writeSave(state: GameStoreState): void {
  const data: SaveData = {
    version: 2,
    difficulty: state.difficulty,
    nightmareFlags: state.nightmareFlags,
    seed: state.seed,
    stage: state.stage,
    leveling: state.leveling,
    bossesDefeated: state.bossesDefeated,
    score: state.score,
    totalKills: state.totalKills,
    elapsedMs: Date.now() - state.startTime,
    circleNumber: state.circleNumber,
    mandatoryKills: state.mandatoryKills,
    optionalKills: state.optionalKills,
    optionalEnemiesTotal: state.optionalEnemiesTotal,
    playerHp: cachedPlayerSnapshot.playerHp,
    currentWeapon: cachedPlayerSnapshot.currentWeapon,
    ammoReserves: cachedPlayerSnapshot.ammoReserves,
  };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    if (onSaveCallback) onSaveCallback();
  } catch {
    // localStorage may be unavailable or full — silently fail
  }
}

function isValidSave(data: unknown): data is SaveData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  const baseValid =
    typeof d.difficulty === 'string' &&
    ['easy', 'normal', 'hard'].includes(d.difficulty) &&
    typeof d.seed === 'string' &&
    typeof d.score === 'number' &&
    Number.isFinite(d.score) &&
    d.score >= 0 &&
    typeof d.totalKills === 'number' &&
    Number.isFinite(d.totalKills) &&
    d.totalKills >= 0 &&
    typeof d.elapsedMs === 'number' &&
    Number.isFinite(d.elapsedMs) &&
    d.elapsedMs >= 0 &&
    d.stage !== null &&
    typeof d.stage === 'object' &&
    d.leveling !== null &&
    typeof d.leveling === 'object' &&
    d.nightmareFlags !== null &&
    typeof d.nightmareFlags === 'object' &&
    Array.isArray(d.bossesDefeated);
  if (!baseValid) return false;

  // Version 1 (legacy, no version field) — accept as-is
  if (d.version === undefined) {
    (d as any).version = 1;
    return true;
  }

  // New fields are optional — no extra validation needed
  return typeof d.version === 'number';
}

function readSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!isValidSave(parsed)) return null;
    // Version 1 saves won't have player state fields — they stay undefined
    return parsed;
  } catch {
    return null;
  }
}

function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // ignore
  }
}

function hasSavedGame(): boolean {
  try {
    return localStorage.getItem(SAVE_KEY) !== null;
  } catch {
    return false;
  }
}

export interface SettingsData {
  masterVolume: number;
  mouseSensitivity: number;
  touchLookSensitivity?: number;
  gamepadLookSensitivity?: number;
  gamepadDeadzone?: number;
  gyroSensitivity?: number;
  gyroEnabled?: boolean;
  hapticsEnabled?: boolean;
}

export function writeSettings(settings: SettingsData): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

function readSettings(): SettingsData | null {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.masterVolume === 'number' &&
      Number.isFinite(parsed.masterVolume) &&
      typeof parsed?.mouseSensitivity === 'number' &&
      Number.isFinite(parsed.mouseSensitivity)
    ) {
      const result: SettingsData = {
        masterVolume: Math.max(0, Math.min(1, parsed.masterVolume)),
        mouseSensitivity: Math.max(0.1, Math.min(1, parsed.mouseSensitivity)),
      };
      if (
        typeof parsed.touchLookSensitivity === 'number' &&
        Number.isFinite(parsed.touchLookSensitivity)
      ) {
        result.touchLookSensitivity = Math.max(0.1, Math.min(2, parsed.touchLookSensitivity));
      }
      if (
        typeof parsed.gamepadLookSensitivity === 'number' &&
        Number.isFinite(parsed.gamepadLookSensitivity)
      ) {
        result.gamepadLookSensitivity = Math.max(0.1, Math.min(2, parsed.gamepadLookSensitivity));
      }
      if (typeof parsed.gamepadDeadzone === 'number' && Number.isFinite(parsed.gamepadDeadzone)) {
        result.gamepadDeadzone = Math.max(0.05, Math.min(0.4, parsed.gamepadDeadzone));
      }
      if (typeof parsed.gyroSensitivity === 'number' && Number.isFinite(parsed.gyroSensitivity)) {
        result.gyroSensitivity = Math.max(0.1, Math.min(2, parsed.gyroSensitivity));
      }
      if (typeof parsed.gyroEnabled === 'boolean') {
        result.gyroEnabled = parsed.gyroEnabled;
      }
      if (typeof parsed.hapticsEnabled === 'boolean') {
        result.hapticsEnabled = parsed.hapticsEnabled;
      }
      return result;
    }
    return null;
  } catch {
    return null;
  }
}

const savedSettings = readSettings();
const initialSeed = generateSeedPhrase();

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

function createInitialStage(): StageState {
  return {
    stageNumber: 1,
    floor: 1,
    encounterType: 'explore',
    bossId: null,
    enemiesRemaining: 0,
  };
}

function createInitialLeveling(): LevelingState {
  return {
    level: 1,
    xp: 0,
    xpToNext: xpForLevel(2),
  };
}

export const useGameStore = create<GameStoreState>()((set, get) => ({
  // --- Defaults ---
  screen: 'mainMenu',

  dbReady: false,
  levelSource:
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location?.search ?? '').get('levels') === 'procedural'
      ? 'procedural'
      : 'database',
  circleNumber: 1,

  difficulty: 'normal',
  nightmareFlags: { nightmare: false, permadeath: false, ultraNightmare: false },
  seed: initialSeed,
  rng: seedrandom(initialSeed),

  stage: createInitialStage(),
  leveling: createInitialLeveling(),
  bossesDefeated: [],

  score: 0,
  kills: 0,
  totalKills: 0,
  startTime: Date.now(),

  mandatoryKills: 0,
  optionalKills: 0,
  optionalEnemiesTotal: 0,

  damageFlash: 0,
  screenShake: 0,
  gunFlash: 0,
  hitMarker: 0,

  masterVolume: savedSettings?.masterVolume ?? 0.7,
  mouseSensitivity: savedSettings?.mouseSensitivity ?? 0.5,
  touchLookSensitivity: savedSettings?.touchLookSensitivity ?? 1.0,
  gamepadLookSensitivity: savedSettings?.gamepadLookSensitivity ?? 1.0,
  gamepadDeadzone: savedSettings?.gamepadDeadzone ?? 0.15,
  gyroSensitivity: savedSettings?.gyroSensitivity ?? 1.0,
  gyroEnabled: savedSettings?.gyroEnabled ?? false,
  hapticsEnabled: savedSettings?.hapticsEnabled ?? true,

  visitedRooms: {},

  autoplay:
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location?.search ?? '').has('autoplay'),

  hasSave: hasSavedGame(),
  restoredPlayerState: null,

  // --- Actions ---

  startNewGame: (difficulty, nightmareFlags, seed) => {
    cachedPlayerSnapshot = {};
    set({
      screen: 'playing',
      difficulty,
      nightmareFlags: nightmareFlags.ultraNightmare
        ? { ...nightmareFlags, permadeath: true }
        : nightmareFlags,
      seed,
      rng: seedrandom(seed),
      stage: createInitialStage(),
      leveling: createInitialLeveling(),
      bossesDefeated: [],
      circleNumber: 1,
      score: 0,
      kills: 0,
      totalKills: 0,
      mandatoryKills: 0,
      optionalKills: 0,
      optionalEnemiesTotal: 0,
      startTime: Date.now(),
      damageFlash: 0,
      screenShake: 0,
      gunFlash: 0,
      hitMarker: 0,
      restoredPlayerState: null,
      visitedRooms: {},
    });
  },

  advanceStage: () => {
    const { stage, circleNumber } = get();

    // Circle-based completion: after defeating a circle's boss, advance to
    // the next circle. After Circle 9, the game is complete.
    if (stage.encounterType === 'boss') {
      if (circleNumber >= 9) {
        clearSave();
        set({ screen: 'gameComplete', hasSave: false });
        return;
      }
      // Advance to next circle
      const nextCircle = circleNumber + 1;
      const next = stage.stageNumber + 1;
      const encounterType = nextEncounterType(next);
      const bossId = encounterType === 'boss' ? bossForStage(next) : null;

      set({
        circleNumber: nextCircle,
        screen: encounterType === 'boss' ? 'bossIntro' : 'victory',
        stage: {
          stageNumber: next,
          floor: encounterType === 'explore' ? stage.floor + 1 : stage.floor,
          encounterType,
          bossId,
          enemiesRemaining: 0,
        },
        kills: 0,
      });
    } else {
      const next = stage.stageNumber + 1;
      const encounterType = nextEncounterType(next);
      const bossId = encounterType === 'boss' ? bossForStage(next) : null;

      set({
        screen: encounterType === 'boss' ? 'bossIntro' : 'victory',
        stage: {
          stageNumber: next,
          floor: encounterType === 'explore' ? stage.floor + 1 : stage.floor,
          encounterType,
          bossId,
          enemiesRemaining: 0,
        },
        kills: 0,
      });
    }

    // Persist save after advancing
    writeSave(get());
    set({ hasSave: true });
  },

  awardXp: (amount) => {
    const { leveling, difficulty } = get();
    const mult = DIFFICULTY_PRESETS[difficulty].xpMult;
    let xp = leveling.xp + Math.floor(amount * mult);
    let level = leveling.level;
    let xpToNext = leveling.xpToNext;

    while (xp >= xpToNext) {
      xp -= xpToNext;
      level++;
      xpToNext = xpForLevel(level + 1);
    }

    set({ leveling: { level, xp, xpToNext } });
  },

  defeatBoss: (bossId) => {
    set((s) => ({ bossesDefeated: [...s.bossesDefeated, bossId] }));
    writeSave(get());
  },

  setDbReady: (ready) => set({ dbReady: ready }),
  setLevelSource: (source) => set({ levelSource: source }),
  setCircleNumber: (n) => set({ circleNumber: n }),

  recordMandatoryKill: () => set((s) => ({ mandatoryKills: s.mandatoryKills + 1 })),
  recordOptionalKill: () => set((s) => ({ optionalKills: s.optionalKills + 1 })),
  addOptionalEnemies: (count) =>
    set((s) => ({ optionalEnemiesTotal: s.optionalEnemiesTotal + count })),

  addVisitedRoom: (circleNumber, roomId) =>
    set((s) => {
      const existing = s.visitedRooms[circleNumber] ?? [];
      if (existing.includes(roomId)) return s;
      return {
        visitedRooms: {
          ...s.visitedRooms,
          [circleNumber]: [...existing, roomId],
        },
      };
    }),

  patch: (partial) => set(partial as any),

  continueGame: () => {
    const save = readSave();
    if (!save) return;

    // Restore player state from v2+ saves
    const restoredPlayerState: PlayerSnapshot | null =
      save.version >= 2 && (save.playerHp !== undefined || save.currentWeapon !== undefined)
        ? {
            playerHp: save.playerHp,
            currentWeapon: save.currentWeapon,
            ammoReserves: save.ammoReserves,
          }
        : null;

    set({
      screen: 'playing',
      difficulty: save.difficulty,
      nightmareFlags: save.nightmareFlags.ultraNightmare
        ? { ...save.nightmareFlags, permadeath: true }
        : save.nightmareFlags,
      seed: save.seed,
      rng: seedrandom(save.seed),
      stage: save.stage,
      leveling: save.leveling,
      bossesDefeated: save.bossesDefeated,
      circleNumber: save.circleNumber ?? 1,
      score: save.score,
      kills: 0,
      totalKills: save.totalKills,
      mandatoryKills: save.mandatoryKills ?? 0,
      optionalKills: save.optionalKills ?? 0,
      optionalEnemiesTotal: save.optionalEnemiesTotal ?? 0,
      startTime: Date.now() - save.elapsedMs,
      damageFlash: 0,
      screenShake: 0,
      gunFlash: 0,
      hitMarker: 0,
      restoredPlayerState,
      visitedRooms: {},
    });
  },

  deleteSave: () => {
    clearSave();
    set({ hasSave: false });
  },

  resetToMenu: () => {
    set({
      screen: 'mainMenu',
      damageFlash: 0,
      screenShake: 0,
      gunFlash: 0,
      hitMarker: 0,
      hasSave: hasSavedGame(),
    });
  },
}));

// ---------------------------------------------------------------------------
// Backward-compatible GameState shim (for systems that haven't migrated)
// ---------------------------------------------------------------------------

export const GameState = {
  get() {
    const s = useGameStore.getState();
    return {
      screen:
        s.screen === 'mainMenu' || s.screen === 'newGame' || s.screen === 'settings'
          ? ('menu' as const)
          : s.screen === 'bossIntro'
            ? ('playing' as const)
            : s.screen === 'gameComplete'
              ? ('victory' as const)
              : s.screen,
      mode: 'roguelike' as const,
      floor: s.stage.floor,
      score: s.score,
      kills: s.kills,
      totalKills: s.totalKills,
      startTime: s.startTime,
      damageFlash: s.damageFlash,
      screenShake: s.screenShake,
      gunFlash: s.gunFlash,
      hitMarker: s.hitMarker,
    };
  },
  set(partial: Record<string, any>) {
    // Translate legacy screen names to new store values
    if (partial.screen === 'menu' || partial.screen === 'modeSelect') {
      partial = { ...partial, screen: 'mainMenu' };
    }
    useGameStore.setState(partial as any);
  },
  reset() {
    useGameStore.getState().resetToMenu();
  },
  subscribe(listener: (state: any) => void) {
    return useGameStore.subscribe(() => listener(GameState.get()));
  },
};
