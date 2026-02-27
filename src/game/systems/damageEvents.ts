import {Vector3} from '@babylonjs/core';

export interface DamageEvent {
  id: number;
  amount: number;
  position: Vector3;
  /** Timestamp when the damage occurred (Date.now()). */
  time: number;
  isCrit?: boolean;
}

let nextId = 0;
const events: DamageEvent[] = [];

/** Max age before events are automatically pruned (ms). */
const MAX_AGE = 1200;

/** Record a new damage event. Call from CombatSystem when damage is dealt. */
export function pushDamageEvent(amount: number, position: Vector3, isCrit?: boolean): void {
  events.push({
    id: nextId++,
    amount,
    position: position.clone(),
    time: Date.now(),
    isCrit,
  });
}

/** Return current events and prune expired ones. Called by HUD each tick. */
export function consumeDamageEvents(): DamageEvent[] {
  const now = Date.now();
  // Remove expired
  for (let i = events.length - 1; i >= 0; i--) {
    if (now - events[i].time > MAX_AGE) {
      events.splice(i, 1);
    }
  }
  return events;
}

/** Clear all events (call on level reset). */
export function clearDamageEvents(): void {
  events.length = 0;
}
