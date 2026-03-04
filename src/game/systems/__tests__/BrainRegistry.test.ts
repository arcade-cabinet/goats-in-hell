jest.mock('../AudioSystem', () => ({ playSound: jest.fn() }));
jest.mock('../GameClock', () => ({ getGameTime: jest.fn(() => 0) }));

import { buildBrainContext } from '../brains/BrainContext';
import { BrainRegistry } from '../brains/BrainRegistry';

describe('BrainRegistry', () => {
  let registry: BrainRegistry;

  beforeEach(() => {
    registry = new BrainRegistry();
  });

  it('registers and retrieves a brain by entity ID', () => {
    const mockBrain = { execute: jest.fn(), status: 'inactive' } as any;
    registry.register('enemy-1', mockBrain);
    expect(registry.get('enemy-1')).toBe(mockBrain);
  });

  it('unregisters a brain', () => {
    const mockBrain = {
      execute: jest.fn(),
      terminate: jest.fn(),
      status: 'inactive',
    } as any;
    registry.register('enemy-1', mockBrain);
    registry.unregister('enemy-1');
    expect(registry.get('enemy-1')).toBeUndefined();
  });

  it('reset clears all brains', () => {
    const mockBrain = {
      execute: jest.fn(),
      terminate: jest.fn(),
      status: 'inactive',
    } as any;
    registry.register('enemy-1', mockBrain);
    registry.register('enemy-2', mockBrain);
    registry.reset();
    expect(registry.size).toBe(0);
  });
});

describe('buildBrainContext', () => {
  it('builds a context snapshot from game state', () => {
    const ctx = buildBrainContext(
      { x: 5, y: 1, z: 10 },
      80,
      100,
      'hellPistol',
      [
        [0, 1],
        [0, 0],
      ],
      2,
      1,
      'explore',
      'playing',
      16,
      100,
    );
    expect(ctx.playerPos.x).toBe(5);
    expect(ctx.gridW).toBe(2);
    expect(ctx.gridH).toBe(2);
    expect(ctx.dtScale).toBeCloseTo(1);
  });
});
