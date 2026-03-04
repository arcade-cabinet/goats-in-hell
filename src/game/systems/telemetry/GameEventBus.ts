import type { Vec3, WeaponId } from '../../entities/components';

export type GameEvent =
  | { type: 'enemy_alert'; entityId: string; enemyType: string; position: Vec3 }
  | {
      type: 'enemy_killed';
      entityId: string;
      enemyType: string;
      weapon: WeaponId;
      position: Vec3;
    }
  | { type: 'player_damaged'; amount: number; source: string; position: Vec3 }
  | { type: 'player_death'; circleNumber: number; roomId?: string }
  | { type: 'pickup_collected'; pickupType: string; value: number; position: Vec3 }
  | { type: 'trigger_fired'; triggerId: string; action: string }
  | { type: 'door_locked' | 'door_unlocked' }
  | { type: 'hazard_activated'; hazardType: string; entityId: string }
  | { type: 'boss_phase'; bossId: string; phase: number; hpPercent: number }
  | { type: 'floor_complete'; circleNumber: number; encounterType: string; timeMs: number }
  | { type: 'screenshot'; filename: string; event: string }
  | { type: 'weapon_switched'; from: WeaponId; to: WeaponId };

type Listener = (event: GameEvent) => void;

export class GameEventBus {
  private listeners = new Map<string, Set<Listener>>();

  on(eventType: string, listener: Listener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener);
    return () => {
      this.listeners.get(eventType)?.delete(listener);
    };
  }

  emit(event: GameEvent): void {
    for (const fn of this.listeners.get(event.type) ?? []) fn(event);
    for (const fn of this.listeners.get('*') ?? []) fn(event);
  }

  clear(): void {
    this.listeners.clear();
  }
}

/** Singleton event bus for the game. */
export const gameEventBus = new GameEventBus();
