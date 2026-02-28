import type { Vec3 } from '../entities/components';
import { vec3Clone } from '../entities/vec3';
import { getGameTime } from './GameClock';

export interface DamageEvent {
  id: number;
  amount: number;
  position: Vec3;
  /** Game-time timestamp when the damage occurred (ms from GameClock). */
  time: number;
  isCrit?: boolean;
}

let nextId = 0;
const events: DamageEvent[] = [];

/** Max age before events are automatically pruned (ms of game time). */
const MAX_AGE = 1200;

/** Record a new damage event. Call from CombatSystem when damage is dealt. */
export function pushDamageEvent(amount: number, position: Vec3, isCrit?: boolean): void {
  events.push({
    id: nextId++,
    amount,
    position: vec3Clone(position),
    time: getGameTime(),
    isCrit,
  });
}

/** Return current events and prune expired ones. Called by HUD each tick. */
export function consumeDamageEvents(): DamageEvent[] {
  const gameTime = getGameTime();
  // Remove expired
  for (let i = events.length - 1; i >= 0; i--) {
    if (gameTime - events[i].time > MAX_AGE) {
      events.splice(i, 1);
    }
  }
  return events;
}

/** Clear all events (call on level reset). */
export function clearDamageEvents(): void {
  events.length = 0;
}
