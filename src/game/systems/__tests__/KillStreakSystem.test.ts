/**
 * KillStreakSystem tests — streak counting, tier matching, announcements, reset.
 */

jest.mock('../GameClock', () => {
  let mockTime = 0;
  return {
    getGameTime: jest.fn(() => mockTime),
    __setMockTime: (t: number) => {
      mockTime = t;
    },
  };
});

jest.mock('../AudioSystem', () => ({
  playSound: jest.fn(),
}));

import {
  getAnnouncement,
  getStreakCount,
  registerKill,
  resetKillStreaks,
} from '../KillStreakSystem';

const GameClockMock = require('../GameClock') as {
  getGameTime: jest.Mock;
  __setMockTime: (t: number) => void;
};

beforeEach(() => {
  resetKillStreaks();
  GameClockMock.__setMockTime(0);
  // Reset GameStore so awardXp calls don't bleed
  const { useGameStore } = require('../../../state/GameStore');
  useGameStore.setState({
    leveling: { level: 1, xp: 0, xpToNext: 283 },
  });
});

describe('registerKill / getStreakCount', () => {
  it('starts a new streak on first kill', () => {
    registerKill();
    expect(getStreakCount()).toBe(1);
  });

  it('increments streak on rapid kills within 3s window', () => {
    GameClockMock.__setMockTime(0);
    registerKill();
    GameClockMock.__setMockTime(1000);
    registerKill();
    GameClockMock.__setMockTime(2000);
    registerKill();
    expect(getStreakCount()).toBe(3);
  });

  it('resets streak after 3s gap', () => {
    GameClockMock.__setMockTime(0);
    registerKill();
    registerKill();
    expect(getStreakCount()).toBe(2);

    GameClockMock.__setMockTime(4000); // 4s later
    registerKill();
    expect(getStreakCount()).toBe(1); // fresh streak
  });
});

describe('getAnnouncement', () => {
  it('returns null when streak < 2', () => {
    registerKill();
    expect(getAnnouncement()).toBeNull();
  });

  it('returns DOUBLE KILL at 2 kills', () => {
    registerKill();
    registerKill();
    const ann = getAnnouncement();
    expect(ann).not.toBeNull();
    expect(ann!.label).toBe('DOUBLE KILL');
  });

  it('returns TRIPLE KILL at 3 kills', () => {
    registerKill();
    registerKill();
    registerKill();
    const ann = getAnnouncement();
    expect(ann!.label).toBe('TRIPLE KILL');
  });

  it('returns MASSACRE at 5 kills', () => {
    for (let i = 0; i < 5; i++) registerKill();
    expect(getAnnouncement()!.label).toBe('MASSACRE');
  });

  it('expires announcement after 2s', () => {
    GameClockMock.__setMockTime(0);
    registerKill();
    registerKill();
    expect(getAnnouncement()).not.toBeNull();

    GameClockMock.__setMockTime(2100);
    expect(getAnnouncement()).toBeNull();
  });

  it('returns progress 0-1 based on elapsed time', () => {
    GameClockMock.__setMockTime(0);
    registerKill();
    registerKill();

    GameClockMock.__setMockTime(1000); // halfway through 2s display
    const ann = getAnnouncement();
    expect(ann!.progress).toBeCloseTo(0.5, 1);
  });
});

describe('resetKillStreaks', () => {
  it('clears streak and announcement', () => {
    registerKill();
    registerKill();
    resetKillStreaks();
    expect(getStreakCount()).toBe(0);
    expect(getAnnouncement()).toBeNull();
  });
});
