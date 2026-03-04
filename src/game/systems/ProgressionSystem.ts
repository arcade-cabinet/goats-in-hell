/**
 * ProgressionSystem -- floor completion and player death detection.
 *
 * Tracks how many enemies were spawned on the current floor and provides
 * checks for floor completion (all enemies killed) and player death (HP <= 0).
 * Handles permadeath save deletion on death.
 */
import { GameState } from '../../state/GameState';
import { useGameStore } from '../../state/GameStore';
import type { Entity } from '../entities/components';
import { world } from '../entities/world';
import { gameEventBus } from './telemetry/GameEventBus';
import { screenshotService } from './telemetry/ScreenshotService';

// ---------------------------------------------------------------------------
// Floor completion
// ---------------------------------------------------------------------------

/**
 * Number of enemies spawned for the current floor.
 * Prevents auto-completing floors where no enemies were generated.
 */
let enemiesSpawnedThisFloor = 0;

/** Increment the enemy spawn counter. Call once per enemy entity added. */
export function trackEnemySpawn(): void {
  enemiesSpawnedThisFloor++;
}

/** Reset the floor progression state. Call on floor transitions. */
export function resetFloorProgression(): void {
  enemiesSpawnedThisFloor = 0;
}

/**
 * Returns true when no entities with an `.enemy` component remain in the world
 * AND at least one enemy was spawned this floor, meaning the player has cleared
 * the current floor.
 */
export function checkFloorComplete(): boolean {
  // Don't auto-complete floors where no enemies were spawned
  if (enemiesSpawnedThisFloor === 0) return false;

  for (const entity of world.entities) {
    if (entity.enemy) {
      return false;
    }
  }
  return true;
}

/**
 * Advance the player to the next floor.
 * Transitions to the victory screen so the UI can show an interstitial
 * before loading the next level. Floor number is advanced by advanceStage()
 * when the player clicks DESCEND on the VictoryScreen.
 */
export function advanceFloor(): void {
  const { circleNumber, stage } = useGameStore.getState();
  gameEventBus.emit({
    type: 'floor_complete',
    circleNumber,
    encounterType: stage.encounterType,
    timeMs: Date.now(),
  });
  screenshotService.request(`circle-${circleNumber}-complete`);
  GameState.set({ screen: 'victory' });
}

// ---------------------------------------------------------------------------
// Player death
// ---------------------------------------------------------------------------

/**
 * Returns true if the player entity is missing or their HP has dropped to
 * zero (or below).
 */
export function checkPlayerDeath(): boolean {
  const player = world.entities.find((e: Entity) => e.type === 'player');

  if (!player || !player.player) {
    return true;
  }

  return player.player.hp <= 0;
}

/**
 * Transition to the death screen so the UI can display a game-over overlay.
 */
export function triggerDeath(): void {
  gameEventBus.emit({ type: 'player_death', circleNumber: useGameStore.getState().circleNumber });
  GameState.set({ screen: 'dead' });

  // Permadeath: delete save on death
  const { nightmareFlags, deleteSave } = useGameStore.getState();
  if (nightmareFlags.permadeath) {
    deleteSave();
  }
}
