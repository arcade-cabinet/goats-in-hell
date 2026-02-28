/**
 * damageEvents tests — push, consume, clear, expiry.
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

import { vec3 as Vector3 } from '../../entities/vec3';
import { clearDamageEvents, consumeDamageEvents, pushDamageEvent } from '../damageEvents';

const GameClockMock = require('../GameClock') as {
  getGameTime: jest.Mock;
  __setMockTime: (t: number) => void;
};

beforeEach(() => {
  clearDamageEvents();
  GameClockMock.__setMockTime(0);
});

describe('pushDamageEvent', () => {
  it('adds an event with correct amount and crit flag', () => {
    pushDamageEvent(25, Vector3(1, 0, 1), true);
    const events = consumeDamageEvents();
    expect(events).toHaveLength(1);
    expect(events[0].amount).toBe(25);
    expect(events[0].isCrit).toBe(true);
  });

  it('increments event id for each push', () => {
    pushDamageEvent(10, Vector3(0, 0, 0));
    pushDamageEvent(20, Vector3(1, 0, 1));
    const events = consumeDamageEvents();
    expect(events[0].id).not.toBe(events[1].id);
  });

  it('clones position (no shared reference)', () => {
    const pos = Vector3(5, 0, 5);
    pushDamageEvent(10, pos);
    pos.x = 99;
    const events = consumeDamageEvents();
    expect(events[0].position.x).toBe(5);
  });
});

describe('consumeDamageEvents', () => {
  it('prunes events older than 1200ms', () => {
    GameClockMock.__setMockTime(0);
    pushDamageEvent(10, Vector3(0, 0, 0));

    GameClockMock.__setMockTime(1300);
    const events = consumeDamageEvents();
    expect(events).toHaveLength(0);
  });

  it('keeps events within 1200ms', () => {
    GameClockMock.__setMockTime(0);
    pushDamageEvent(10, Vector3(0, 0, 0));

    GameClockMock.__setMockTime(1000);
    const events = consumeDamageEvents();
    expect(events).toHaveLength(1);
  });
});

describe('clearDamageEvents', () => {
  it('removes all events', () => {
    pushDamageEvent(10, Vector3(0, 0, 0));
    pushDamageEvent(20, Vector3(1, 0, 1));
    clearDamageEvents();
    expect(consumeDamageEvents()).toHaveLength(0);
  });
});
