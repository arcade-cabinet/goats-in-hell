/**
 * Door System — engine-agnostic door proximity + animation logic.
 *
 * Tracks door open/close states per grid cell. The R3F level renderer
 * reads these states to animate door meshes.
 */
import type { Entity } from '../entities/components';
import { world } from '../entities/world';
import { CELL_SIZE, MapCell } from '../levels/LevelGenerator';
import { playSound } from './AudioSystem';
import { areDoorsLocked } from './TriggerSystem';

/** Tracks the opening/closing state of door meshes by name. */
export interface DoorState {
  meshName: string;
  openProgress: number; // 0 = closed, 1 = fully open
  opening: boolean;
  closing: boolean;
  closeTimer: number; // ms remaining before auto-close starts
}

const doorStates = new Map<string, DoorState>();
const OPEN_SPEED = 0.003; // progress per ms (~300ms to fully open)
const CLOSE_SPEED = 0.002; // progress per ms (~500ms to close, slightly slower)
const TRIGGER_DISTANCE = 3; // world units from door center to trigger opening
const CLOSE_DELAY = 2000; // ms to wait after player leaves before closing

/** Reset all door state (call on floor transitions). */
export function resetDoorSystem(): void {
  doorStates.clear();
}

/** Get the current door states map (used by R3F renderer). */
export function getDoorStates(): ReadonlyMap<string, DoorState> {
  return doorStates;
}

/**
 * Each frame: find player, check proximity to door cells, animate opening.
 */
export function doorSystemUpdate(grid: MapCell[][], deltaTime: number): void {
  const player = world.entities.find((e: Entity) => e.type === 'player');
  if (!player?.position) return;

  const px = player.position.x;
  const pz = player.position.z;

  // Check all door cells for proximity
  for (let z = 0; z < grid.length; z++) {
    for (let x = 0; x < grid[0].length; x++) {
      if (grid[z][x] !== MapCell.DOOR) continue;

      const doorWorldX = x * CELL_SIZE;
      const doorWorldZ = z * CELL_SIZE;
      const meshName = `wall-${x}-${z}`;

      // Initialize door state if needed
      if (!doorStates.has(meshName)) {
        doorStates.set(meshName, {
          meshName,
          openProgress: 0,
          opening: false,
          closing: false,
          closeTimer: 0,
        });
      }

      const state = doorStates.get(meshName)!;

      // Check distance
      const dx = px - doorWorldX;
      const dz = pz - doorWorldZ;
      const dist = Math.sqrt(dx * dx + dz * dz);

      const locked = areDoorsLocked();
      const playerNear = dist < TRIGGER_DISTANCE;

      // When doors are trigger-locked, force them closed and skip opening logic
      if (locked) {
        if (state.openProgress > 0) {
          state.opening = false;
          state.closing = true;
        }
        // Animate closing only
        if (state.closing && state.openProgress > 0) {
          state.openProgress = Math.max(0, state.openProgress - CLOSE_SPEED * deltaTime * 2);
          if (state.openProgress <= 0) {
            state.openProgress = 0;
            state.closing = false;
          }
        }
        continue;
      }

      // Trigger open when player approaches a closed door
      if (playerNear && !state.opening && !state.closing && state.openProgress === 0) {
        state.opening = true;
        state.closing = false;
        state.closeTimer = 0;
        playSound('door');
      }

      // Cancel closing if player comes back while door is still closing
      if (playerNear && state.closing) {
        state.closing = false;
        state.opening = true;
        state.closeTimer = 0;
      }

      // Start close timer when player moves away from a fully open door
      if (!playerNear && state.openProgress >= 1 && !state.closing && state.opening) {
        state.closeTimer += deltaTime;
        if (state.closeTimer >= CLOSE_DELAY) {
          state.closing = true;
          state.opening = false;
          playSound('doorClose');
        }
      } else if (playerNear) {
        state.closeTimer = 0;
      }

      // Animate opening
      if (state.opening && state.openProgress < 1) {
        state.openProgress = Math.min(1, state.openProgress + OPEN_SPEED * deltaTime);
      }

      // Animate closing
      if (state.closing && state.openProgress > 0) {
        state.openProgress = Math.max(0, state.openProgress - CLOSE_SPEED * deltaTime);

        if (state.openProgress <= 0) {
          state.openProgress = 0;
          state.closing = false;
          state.closeTimer = 0;
        }
      }
    }
  }
}
