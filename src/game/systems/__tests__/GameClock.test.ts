/**
 * GameClock tests — tick accumulation, reset, frame count.
 */

import {
  tickGameClock,
  resetGameClock,
  getGameTime,
  getGameDelta,
  getFrameCount,
} from '../GameClock';

beforeEach(() => {
  resetGameClock();
});

describe('tickGameClock', () => {
  it('accumulates game time across ticks', () => {
    tickGameClock(16);
    tickGameClock(16);
    tickGameClock(16);
    expect(getGameTime()).toBe(48);
  });

  it('stores the last delta', () => {
    tickGameClock(16);
    tickGameClock(33);
    expect(getGameDelta()).toBe(33);
  });

  it('increments frame count', () => {
    tickGameClock(16);
    tickGameClock(16);
    expect(getFrameCount()).toBe(2);
  });
});

describe('resetGameClock', () => {
  it('resets time to zero', () => {
    tickGameClock(100);
    resetGameClock();
    expect(getGameTime()).toBe(0);
    expect(getGameDelta()).toBe(0);
    expect(getFrameCount()).toBe(0);
  });
});

describe('getGameTime', () => {
  it('starts at zero', () => {
    expect(getGameTime()).toBe(0);
  });
});
