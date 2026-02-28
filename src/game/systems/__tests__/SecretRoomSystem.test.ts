/**
 * SecretRoomSystem tests — state management (secrets found, notification timer).
 *
 * The checkSecretWalls() and openSecretWall() functions require Scene + Mesh
 * objects too complex to mock effectively. We test the pure state functions.
 */

jest.mock('../AudioSystem', () => ({
  playSound: jest.fn(),
}));

jest.mock('../GameClock', () => ({
  getGameTime: jest.fn(() => 0),
}));

jest.mock('../../levels/LevelGenerator', () => ({
  MapCell: {EMPTY: 0, WALL_STONE: 1, WALL_FLESH: 2, WALL_LAVA: 3, WALL_OBSIDIAN: 4, DOOR: 5, WALL_SECRET: 6, VOID: 7},
  CELL_SIZE: 2,
  WALL_HEIGHT: 3,
}));

import {
  resetSecrets,
  getSecretNotifyTimer,
  getSecretsFound,
  tickSecretTimer,
} from '../SecretRoomSystem';

beforeEach(() => {
  resetSecrets();
});

describe('resetSecrets', () => {
  it('resets secrets found to zero', () => {
    // We can't easily trigger a secret discovery without full mocks,
    // but we can verify the reset behavior
    expect(getSecretsFound()).toBe(0);
  });

  it('resets notification timer to zero', () => {
    expect(getSecretNotifyTimer()).toBe(0);
  });
});

describe('tickSecretTimer', () => {
  it('does not go below zero', () => {
    tickSecretTimer();
    expect(getSecretNotifyTimer()).toBe(0);
  });
});

describe('getSecretsFound', () => {
  it('starts at zero after reset', () => {
    resetSecrets();
    expect(getSecretsFound()).toBe(0);
  });
});
