/**
 * GameStore unit tests — tests save/load, awardXp, difficulty presets,
 * stage sequencing, and the GameState backward-compat shim.
 */

jest.mock('../../game/systems/AudioSystem', () => ({
  playSound: jest.fn(),
}));

jest.mock('../../game/systems/GameClock', () => ({
  getGameTime: jest.fn(() => 0),
}));

import {
  useGameStore,
  DIFFICULTY_PRESETS,
  getLevelBonuses,
  generateSeedPhrase,
  writeSettings,
  GameState,
} from '../GameStore';

beforeEach(() => {
  localStorage.clear();
  // Reset store to clean state
  useGameStore.setState({
    screen: 'mainMenu',
    difficulty: 'normal',
    nightmareFlags: {nightmare: false, permadeath: false, ultraNightmare: false},
    seed: 'test-seed',
    leveling: {level: 1, xp: 0, xpToNext: 283},
    bossesDefeated: [],
    score: 0,
    kills: 0,
    totalKills: 0,
    startTime: Date.now(),
    damageFlash: 0,
    screenShake: 0,
    gunFlash: 0,
    hitMarker: 0,
    hasSave: false,
  });
});

describe('awardXp', () => {
  it('adds XP to the leveling state', () => {
    useGameStore.getState().awardXp(50);
    const {leveling} = useGameStore.getState();
    expect(leveling.xp).toBe(50);
    expect(leveling.level).toBe(1);
  });

  it('levels up when XP exceeds xpToNext', () => {
    // xpForLevel(2) = floor(100 * 2^1.5) = 282
    useGameStore.getState().awardXp(300);
    const {leveling} = useGameStore.getState();
    expect(leveling.level).toBe(2);
    // Remaining XP = 300 - 283 = 17 (xpToNext for level 1 = ceil(100*2^1.5) = 283)
    expect(leveling.xp).toBeLessThan(300);
  });

  it('handles multiple level-ups from large XP', () => {
    useGameStore.getState().awardXp(2000);
    const {leveling} = useGameStore.getState();
    expect(leveling.level).toBeGreaterThan(2);
  });

  it('applies difficulty XP multiplier', () => {
    useGameStore.setState({difficulty: 'easy'});
    useGameStore.getState().awardXp(100);
    const easyXp = useGameStore.getState().leveling.xp;

    // Reset
    useGameStore.setState({
      difficulty: 'hard',
      leveling: {level: 1, xp: 0, xpToNext: 283},
    });
    useGameStore.getState().awardXp(100);
    const hardXp = useGameStore.getState().leveling.xp;

    // Easy mult = 1.3, hard mult = 0.8
    expect(easyXp).toBeGreaterThan(hardXp);
  });
});

describe('getLevelBonuses', () => {
  it('returns no bonus at level 1', () => {
    const bonuses = getLevelBonuses(1);
    expect(bonuses.damageMult).toBe(1);
    expect(bonuses.maxHpBonus).toBe(0);
    expect(bonuses.speedMult).toBe(1);
  });

  it('returns correct bonuses at level 5', () => {
    const bonuses = getLevelBonuses(5);
    expect(bonuses.damageMult).toBeCloseTo(1.2); // 1 + 4*0.05
    expect(bonuses.maxHpBonus).toBe(20); // 4*5
    expect(bonuses.speedMult).toBeCloseTo(1.08); // 1 + 4*0.02
  });
});

describe('save/load', () => {
  it('save roundtrip preserves data via continueGame', () => {
    // Start a game and advance a stage to trigger save
    const store = useGameStore.getState();
    store.startNewGame('hard', {nightmare: false, permadeath: false, ultraNightmare: false}, 'roundtrip-seed');

    // Manually set some state
    useGameStore.setState({
      score: 500,
      totalKills: 10,
    });

    // Advance stage to trigger writeSave
    useGameStore.getState().advanceStage();

    // Verify save was written
    const saveRaw = localStorage.getItem('goats-in-hell-save');
    expect(saveRaw).not.toBeNull();

    // Reset to menu
    useGameStore.getState().resetToMenu();

    // Continue game
    useGameStore.getState().continueGame();

    const restored = useGameStore.getState();
    expect(restored.difficulty).toBe('hard');
    expect(restored.seed).toBe('roundtrip-seed');
    expect(restored.score).toBe(500);
    expect(restored.totalKills).toBe(10);
    expect(restored.screen).toBe('playing');
  });

  it('deleteSave removes save data', () => {
    const store = useGameStore.getState();
    store.startNewGame('normal', {nightmare: false, permadeath: false, ultraNightmare: false}, 'delete-test');
    useGameStore.getState().advanceStage();

    expect(localStorage.getItem('goats-in-hell-save')).not.toBeNull();

    useGameStore.getState().deleteSave();
    expect(localStorage.getItem('goats-in-hell-save')).toBeNull();
    expect(useGameStore.getState().hasSave).toBe(false);
  });

  it('continueGame does nothing if no save exists', () => {
    useGameStore.setState({screen: 'mainMenu', score: 42});
    useGameStore.getState().continueGame();
    // Should not change state
    expect(useGameStore.getState().screen).toBe('mainMenu');
    expect(useGameStore.getState().score).toBe(42);
  });

  it('rejects malformed save data', () => {
    localStorage.setItem('goats-in-hell-save', JSON.stringify({bad: 'data'}));
    useGameStore.setState({screen: 'mainMenu'});
    useGameStore.getState().continueGame();
    // Should not change screen — malformed data is ignored
    expect(useGameStore.getState().screen).toBe('mainMenu');
  });
});

describe('settings persistence', () => {
  it('writes and reads settings', () => {
    writeSettings(0.5, 0.8);
    const raw = localStorage.getItem('goats-in-hell-settings');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.masterVolume).toBe(0.5);
    expect(parsed.mouseSensitivity).toBe(0.8);
  });
});

describe('startNewGame', () => {
  it('sets screen to playing and resets stats', () => {
    useGameStore.setState({score: 999, kills: 50});
    useGameStore.getState().startNewGame(
      'easy',
      {nightmare: false, permadeath: false, ultraNightmare: false},
      'fresh-seed',
    );

    const state = useGameStore.getState();
    expect(state.screen).toBe('playing');
    expect(state.score).toBe(0);
    expect(state.kills).toBe(0);
    expect(state.difficulty).toBe('easy');
    expect(state.seed).toBe('fresh-seed');
  });

  it('forces permadeath when ultraNightmare is set', () => {
    useGameStore.getState().startNewGame(
      'hard',
      {nightmare: true, permadeath: false, ultraNightmare: true},
      'ultra-seed',
    );
    expect(useGameStore.getState().nightmareFlags.permadeath).toBe(true);
  });
});

describe('advanceStage', () => {
  it('increments stage number', () => {
    useGameStore.getState().startNewGame(
      'normal',
      {nightmare: false, permadeath: false, ultraNightmare: false},
      'stage-test',
    );

    useGameStore.getState().advanceStage();

    expect(useGameStore.getState().stage.stageNumber).toBe(2);
  });

  it('resets kills on stage advance', () => {
    useGameStore.getState().startNewGame(
      'normal',
      {nightmare: false, permadeath: false, ultraNightmare: false},
      'kills-test',
    );
    useGameStore.setState({kills: 15});

    useGameStore.getState().advanceStage();

    expect(useGameStore.getState().kills).toBe(0);
  });

  it('sets encounter to boss on stage 5', () => {
    useGameStore.getState().startNewGame(
      'normal',
      {nightmare: false, permadeath: false, ultraNightmare: false},
      'boss-test',
    );
    // Advance through stages 1-4 to reach stage 5
    useGameStore.setState({
      stage: {
        stageNumber: 4,
        floor: 3,
        encounterType: 'arena',
        arenaWave: 0,
        bossId: null,
        enemiesRemaining: 0,
      },
    });

    useGameStore.getState().advanceStage();

    const stage = useGameStore.getState().stage;
    expect(stage.stageNumber).toBe(5);
    expect(stage.encounterType).toBe('boss');
    // bossForStage(5) = bossCycle[floor(5/5) % 4] = bossCycle[1] = 'voidGoat'
    expect(stage.bossId).toBe('voidGoat');
  });

  it('sets arena encounter on stage 4', () => {
    useGameStore.getState().startNewGame(
      'normal',
      {nightmare: false, permadeath: false, ultraNightmare: false},
      'arena-test',
    );
    useGameStore.setState({
      stage: {
        stageNumber: 3,
        floor: 3,
        encounterType: 'explore',
        arenaWave: 0,
        bossId: null,
        enemiesRemaining: 0,
      },
    });

    useGameStore.getState().advanceStage();

    expect(useGameStore.getState().stage.encounterType).toBe('arena');
  });
});

describe('GameState shim', () => {
  it('translates mainMenu screen to "menu"', () => {
    useGameStore.setState({screen: 'mainMenu'});
    expect(GameState.get().screen).toBe('menu');
  });

  it('translates bossIntro screen to "playing"', () => {
    useGameStore.setState({screen: 'bossIntro'});
    expect(GameState.get().screen).toBe('playing');
  });

  it('passes through "playing" unchanged', () => {
    useGameStore.setState({screen: 'playing'});
    expect(GameState.get().screen).toBe('playing');
  });

  it('set() translates legacy "menu" back to "mainMenu"', () => {
    GameState.set({screen: 'menu'});
    expect(useGameStore.getState().screen).toBe('mainMenu');
  });
});

describe('DIFFICULTY_PRESETS', () => {
  it('has correct multipliers for each difficulty', () => {
    expect(DIFFICULTY_PRESETS.easy.enemyHpMult).toBe(0.7);
    expect(DIFFICULTY_PRESETS.normal.enemyHpMult).toBe(1.0);
    expect(DIFFICULTY_PRESETS.hard.enemyHpMult).toBe(1.4);
  });

  it('easy has higher player start HP', () => {
    expect(DIFFICULTY_PRESETS.easy.playerStartHp).toBeGreaterThan(
      DIFFICULTY_PRESETS.normal.playerStartHp,
    );
  });
});

describe('generateSeedPhrase', () => {
  it('returns a hyphenated three-word phrase', () => {
    const seed = generateSeedPhrase();
    const parts = seed.split('-');
    expect(parts.length).toBe(3);
    parts.forEach(part => {
      expect(part.length).toBeGreaterThan(0);
    });
  });
});
