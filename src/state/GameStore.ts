/**
 * Zustand game store – single source of truth for all game state.
 *
 * Replaces the old GameState singleton with proper React-integrated state.
 * Supports: difficulty, seeded runs, logarithmic leveling, boss progression,
 * unified floor/arena/boss encounter flow, and screen effects.
 */
import {create} from 'zustand';
import seedrandom from 'seedrandom';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type GameScreen =
  | 'mainMenu'
  | 'newGame'       // difficulty + seed selection
  | 'settings'
  | 'playing'
  | 'paused'
  | 'dead'
  | 'victory'       // between-stage interstitial
  | 'bossIntro';    // boss entrance cutscene-ish

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

export const DIFFICULTY_PRESETS: Record<Difficulty, DifficultyModifiers> = {
  easy: {
    label: 'Fledgling',
    enemyHpMult: 0.7,
    enemyDmgMult: 0.6,
    enemySpeedMult: 0.85,
    playerStartHp: 150,
    xpMult: 1.3,
    pickupDensityMult: 1.5,
  },
  normal: {
    label: 'Condemned',
    enemyHpMult: 1.0,
    enemyDmgMult: 1.0,
    enemySpeedMult: 1.0,
    playerStartHp: 100,
    xpMult: 1.0,
    pickupDensityMult: 1.0,
  },
  hard: {
    label: 'Forsaken',
    enemyHpMult: 1.4,
    enemyDmgMult: 1.5,
    enemySpeedMult: 1.2,
    playerStartHp: 75,
    xpMult: 0.8,
    pickupDensityMult: 0.7,
  },
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
  /** 'explore' = roguelike floor, 'arena' = survival wave, 'boss' = boss encounter. */
  encounterType: 'explore' | 'arena' | 'boss';
  /** For arena: which wave we're on. */
  arenaWave: number;
  /** Boss archetype ID if encounter is 'boss'. */
  bossId: string | null;
  /** Enemies remaining on this stage. */
  enemiesRemaining: number;
}

export interface GameStoreState {
  // --- Screen & flow ---
  screen: GameScreen;

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

  // --- Screen effects (decay each frame) ---
  damageFlash: number;
  screenShake: number;
  gunFlash: number;

  // --- Autoplay (e2e testing) ---
  /** When true, Yuka AI governor controls the player. */
  autoplay: boolean;

  // --- Actions ---
  /** Start a new run with the given config. */
  startNewGame: (
    difficulty: Difficulty,
    nightmareFlags: NightmareFlags,
    seed: string,
  ) => void;
  /** Advance to the next stage. */
  advanceStage: () => void;
  /** Award XP and handle level-ups. */
  awardXp: (amount: number) => void;
  /** Record a boss defeat. */
  defeatBoss: (bossId: string) => void;
  /** Set partial state (for effects, kills, etc.). */
  patch: (partial: Partial<GameStoreState>) => void;
  /** Full reset to main menu. */
  resetToMenu: () => void;
}

// ---------------------------------------------------------------------------
// Logarithmic leveling formula
// ---------------------------------------------------------------------------

/** XP required for a given level: 100 * level^1.5 */
function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

// ---------------------------------------------------------------------------
// Stage sequencing: determines what encounter type comes next
// ---------------------------------------------------------------------------

/**
 * Decides the next encounter type based on stage number.
 * Pattern: 3 explore floors → 1 arena wave → boss every 5 stages.
 */
function nextEncounterType(
  stageNumber: number,
): 'explore' | 'arena' | 'boss' {
  if (stageNumber > 0 && stageNumber % 5 === 0) return 'boss';
  if (stageNumber % 5 === 4) return 'arena';
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
  'burning', 'cursed', 'damned', 'fallen', 'wretched',
  'infernal', 'hollow', 'screaming', 'rusted', 'blackened',
  'molten', 'shattered', 'unholy', 'bleeding', 'twisted',
  'forsaken', 'rotting', 'vengeful', 'ashen', 'doomed',
  'sulfurous', 'tormented', 'vile', 'fetid', 'smoldering',
  'abyssal', 'profane', 'sundered', 'blighted', 'cinder',
];

const NOUNS = [
  'goat', 'skull', 'flame', 'throne', 'pyre',
  'abyss', 'horn', 'crypt', 'ember', 'pit',
  'brimstone', 'furnace', 'idol', 'altar', 'sigil',
  'chalice', 'bone', 'scepter', 'gate', 'void',
  'maw', 'cauldron', 'pentacle', 'hoof', 'cage',
];

/** Generate a random adjective-adjective-noun seed using Math.random. */
export function generateSeedPhrase(): string {
  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
  return `${pick(ADJECTIVES)}-${pick(ADJECTIVES)}-${pick(NOUNS)}`;
}

/** Get the word pools for UI display / rerolling. */
export const SEED_POOLS = {ADJECTIVES, NOUNS} as const;

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

function createInitialStage(): StageState {
  return {
    stageNumber: 1,
    floor: 1,
    encounterType: 'explore',
    arenaWave: 0,
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

    difficulty: 'normal',
    nightmareFlags: {nightmare: false, permadeath: false, ultraNightmare: false},
    seed: generateSeedPhrase(),
    rng: seedrandom(generateSeedPhrase()),

    stage: createInitialStage(),
    leveling: createInitialLeveling(),
    bossesDefeated: [],

    score: 0,
    kills: 0,
    totalKills: 0,
    startTime: Date.now(),

    damageFlash: 0,
    screenShake: 0,
    gunFlash: 0,

    autoplay: typeof window !== 'undefined' &&
      new URLSearchParams(window.location?.search ?? '').has('autoplay'),

    // --- Actions ---

    startNewGame: (difficulty, nightmareFlags, seed) => {
      set({
        screen: 'playing',
        difficulty,
        nightmareFlags: nightmareFlags.ultraNightmare
          ? {...nightmareFlags, permadeath: true}
          : nightmareFlags,
        seed,
        rng: seedrandom(seed),
        stage: createInitialStage(),
        leveling: createInitialLeveling(),
        bossesDefeated: [],
        score: 0,
        kills: 0,
        totalKills: 0,
        startTime: Date.now(),
        damageFlash: 0,
        screenShake: 0,
        gunFlash: 0,
      });
    },

    advanceStage: () => {
      const {stage} = get();
      const next = stage.stageNumber + 1;
      const encounterType = nextEncounterType(next);
      const bossId = encounterType === 'boss' ? bossForStage(next) : null;

      set({
        screen: encounterType === 'boss' ? 'bossIntro' : 'victory',
        stage: {
          stageNumber: next,
          floor: encounterType === 'explore' ? stage.floor + 1 : stage.floor,
          encounterType,
          arenaWave: encounterType === 'arena' ? 1 : 0,
          bossId,
          enemiesRemaining: 0,
        },
        kills: 0,
      });
    },

    awardXp: (amount) => {
      const {leveling, difficulty} = get();
      const mult = DIFFICULTY_PRESETS[difficulty].xpMult;
      let xp = leveling.xp + Math.floor(amount * mult);
      let level = leveling.level;
      let xpToNext = leveling.xpToNext;

      while (xp >= xpToNext) {
        xp -= xpToNext;
        level++;
        xpToNext = xpForLevel(level + 1);
      }

      set({leveling: {level, xp, xpToNext}});
    },

    defeatBoss: (bossId) => {
      set(s => ({bossesDefeated: [...s.bossesDefeated, bossId]}));
    },

    patch: (partial) => set(partial as any),

    resetToMenu: () => {
      set({
        screen: 'mainMenu',
        damageFlash: 0,
        screenShake: 0,
        gunFlash: 0,
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
      screen: s.screen === 'mainMenu' || s.screen === 'newGame' || s.screen === 'settings'
        ? 'menu' as const
        : s.screen === 'bossIntro'
          ? 'playing' as const
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
    };
  },
  set(partial: Record<string, any>) {
    // Translate legacy screen names to new store values
    if (partial.screen === 'menu' || partial.screen === 'modeSelect') {
      partial = {...partial, screen: 'mainMenu'};
    }
    useGameStore.setState(partial as any);
  },
  reset() {
    useGameStore.getState().resetToMenu();
  },
  subscribe(listener: (state: any) => void) {
    return useGameStore.subscribe((state) => listener(GameState.get()));
  },
};
