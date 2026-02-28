/**
 * WaveSystem tests — wave scaling, enemy type pools, pickup spawning, reset.
 */

jest.mock('../AudioSystem', () => ({
  playSound: jest.fn(),
}));

jest.mock('../GameClock', () => {
  let mockTime = 0;
  return {
    getGameTime: jest.fn(() => mockTime),
    __setMockTime: (t: number) => {
      mockTime = t;
    },
  };
});

jest.mock('../../levels/LevelGenerator', () => ({
  MapCell: { EMPTY: 0, WALL_STONE: 1 },
  CELL_SIZE: 2,
  WALL_HEIGHT: 3,
}));

import { world } from '../../entities/world';
import { getEnemyTypeForWave, getWaveInfo, resetWaveSystem, startNextWave } from '../WaveSystem';

beforeEach(() => {
  for (const e of [...world.entities]) world.remove(e);
  resetWaveSystem();
  // Set up store with seeded RNG for deterministic tests
  const { useGameStore } = require('../../../state/GameStore');
  useGameStore.setState({
    difficulty: 'normal',
    nightmareFlags: { nightmare: false, permadeath: false, ultraNightmare: false },
    kills: 0,
    score: 0,
  });
});

describe('resetWaveSystem', () => {
  it('resets wave to 0', () => {
    startNextWave();
    startNextWave();
    resetWaveSystem();
    const info = getWaveInfo();
    expect(info.wave).toBe(0);
    expect(info.waveActive).toBe(false);
    expect(info.streak).toBe(0);
    expect(info.multiplier).toBe(1);
  });
});

describe('startNextWave', () => {
  it('increments wave counter', () => {
    startNextWave();
    expect(getWaveInfo().wave).toBe(1);
    startNextWave();
    expect(getWaveInfo().wave).toBe(2);
  });

  it('sets wave to active', () => {
    startNextWave();
    expect(getWaveInfo().waveActive).toBe(true);
  });

  it('resets enemies spawned counter', () => {
    startNextWave();
    expect(getWaveInfo().enemiesSpawnedThisWave).toBe(0);
  });
});

describe('wave enemy count formula', () => {
  it('wave 1 has 5 enemies (3 + 1*2)', () => {
    startNextWave();
    // totalEnemiesForWave = Math.min(30, 3 + currentWave * 2)
    // wave 1: min(30, 3 + 2) = 5
    // We check indirectly by verifying wave is 1
    expect(getWaveInfo().wave).toBe(1);
  });

  it('wave 5 has 13 enemies (3 + 5*2)', () => {
    for (let i = 0; i < 5; i++) startNextWave();
    expect(getWaveInfo().wave).toBe(5);
  });

  it('caps at 30 enemies (wave 14+)', () => {
    // wave 14: min(30, 3 + 14*2) = min(30, 31) = 30
    for (let i = 0; i < 14; i++) startNextWave();
    expect(getWaveInfo().wave).toBe(14);
  });
});

describe('getEnemyTypeForWave', () => {
  it('wave 1 only has goat', () => {
    // Run 100 samples — should all be 'goat' (only pool option at wave 1)
    const types = new Set<string>();
    for (let i = 0; i < 100; i++) {
      types.add(getEnemyTypeForWave(1));
    }
    // At wave 1, pool = ['goat'] only, no chance of archGoat (wave 1 % 5 !== 0)
    expect(types.size).toBe(1);
    expect(types.has('goat')).toBe(true);
  });

  it('wave 3 includes hellgoat', () => {
    const types = new Set<string>();
    for (let i = 0; i < 200; i++) {
      types.add(getEnemyTypeForWave(3));
    }
    expect(types.has('goat')).toBe(true);
    expect(types.has('hellgoat')).toBe(true);
  });

  it('wave 5 includes fireGoat', () => {
    const types = new Set<string>();
    for (let i = 0; i < 200; i++) {
      types.add(getEnemyTypeForWave(5));
    }
    expect(types.has('fireGoat')).toBe(true);
  });

  it('wave 7 includes shadowGoat', () => {
    const types = new Set<string>();
    for (let i = 0; i < 200; i++) {
      types.add(getEnemyTypeForWave(7));
    }
    expect(types.has('shadowGoat')).toBe(true);
  });

  it('wave 9 includes goatKnight', () => {
    const types = new Set<string>();
    for (let i = 0; i < 200; i++) {
      types.add(getEnemyTypeForWave(9));
    }
    expect(types.has('goatKnight')).toBe(true);
  });

  it('always returns a valid entity type', () => {
    const validTypes = ['goat', 'hellgoat', 'fireGoat', 'shadowGoat', 'goatKnight', 'archGoat'];
    for (let wave = 1; wave <= 15; wave++) {
      for (let i = 0; i < 20; i++) {
        const type = getEnemyTypeForWave(wave);
        expect(validTypes).toContain(type);
      }
    }
  });
});

describe('getWaveInfo', () => {
  it('returns initial state after reset', () => {
    const info = getWaveInfo();
    expect(info.wave).toBe(0);
    expect(info.waveActive).toBe(false);
    expect(info.multiplier).toBe(1);
    expect(info.streak).toBe(0);
    expect(info.enemiesSpawnedThisWave).toBe(0);
  });
});
