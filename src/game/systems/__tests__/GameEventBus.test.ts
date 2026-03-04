import { type GameEvent, GameEventBus } from '../telemetry/GameEventBus';

describe('GameEventBus', () => {
  let bus: GameEventBus;
  beforeEach(() => {
    bus = new GameEventBus();
  });

  it('delivers events to subscribers', () => {
    const received: GameEvent[] = [];
    bus.on('enemy_killed', (e) => received.push(e));
    bus.emit({
      type: 'enemy_killed',
      entityId: 'g1',
      enemyType: 'goat',
      weapon: 'hellPistol',
      position: { x: 0, y: 0, z: 0 },
    });
    expect(received).toHaveLength(1);
    expect(received[0].type).toBe('enemy_killed');
  });

  it('does not deliver to unsubscribed listeners', () => {
    const received: GameEvent[] = [];
    const unsub = bus.on('enemy_killed', (e) => received.push(e));
    unsub();
    bus.emit({
      type: 'enemy_killed',
      entityId: 'g1',
      enemyType: 'goat',
      weapon: 'hellPistol',
      position: { x: 0, y: 0, z: 0 },
    });
    expect(received).toHaveLength(0);
  });

  it('delivers to wildcard subscribers', () => {
    const received: GameEvent[] = [];
    bus.on('*', (e) => received.push(e));
    bus.emit({ type: 'trigger_fired', triggerId: 't1', action: 'spawnWave' });
    bus.emit({ type: 'door_locked' });
    expect(received).toHaveLength(2);
  });
});
