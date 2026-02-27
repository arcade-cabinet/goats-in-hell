import type {Entity} from '../entities/components';
import {world} from '../entities/world';
import {GameState} from '../../state/GameState';

// ---------------------------------------------------------------------------
// Floor completion
// ---------------------------------------------------------------------------

/**
 * Returns true when no entities with an `.enemy` component remain in the world,
 * meaning the player has cleared the current floor.
 */
export function checkFloorComplete(): boolean {
  for (const entity of world.entities) {
    if (entity.enemy) {
      return false;
    }
  }
  return true;
}

/**
 * Advance the player to the next floor.
 * Increments the floor counter, resets per-floor kills, and transitions
 * to the victory screen so the UI can show an interstitial before loading
 * the next level.
 */
export function advanceFloor(): void {
  const state = GameState.get();
  // Don't reset kills here — VictoryScreen needs them.
  // kills are reset when the player clicks DESCEND (via advanceStage()).
  GameState.set({
    floor: state.floor + 1,
    screen: 'victory',
  });
}

// ---------------------------------------------------------------------------
// Player death
// ---------------------------------------------------------------------------

/**
 * Returns true if the player entity is missing or their HP has dropped to
 * zero (or below).
 */
export function checkPlayerDeath(): boolean {
  const player = world.entities.find(
    (e: Entity) => e.type === 'player',
  );

  if (!player || !player.player) {
    return true;
  }

  return player.player.hp <= 0;
}

/**
 * Transition to the death screen so the UI can display a game-over overlay.
 */
export function triggerDeath(): void {
  GameState.set({screen: 'dead'});
}
