import type {Scene} from '@babylonjs/core';
import {Vector3} from '@babylonjs/core';
import type {Entity} from '../entities/components';
import {world} from '../entities/world';
import {playSound} from './AudioSystem';
import {CELL_SIZE, MapCell, WALL_HEIGHT} from '../levels/LevelGenerator';

/** Tracks the opening/closing state of door meshes by name. */
interface DoorState {
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

/**
 * Each frame: find player, check proximity to door meshes, animate opening.
 * Door meshes are named "wall-{x}-{z}" and correspond to MapCell.DOOR cells.
 */
export function doorSystemUpdate(
  scene: Scene,
  grid: MapCell[][],
  deltaTime: number,
): void {
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

      const playerNear = dist < TRIGGER_DISTANCE;

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

        const mesh = scene.getMeshByName(meshName);
        if (mesh) {
          // Slide upward into ceiling
          mesh.position.y = (WALL_HEIGHT / 2) + state.openProgress * WALL_HEIGHT;

          // Once fully open, disable collision so player walks through
          if (state.openProgress >= 1) {
            mesh.checkCollisions = false;
            mesh.isPickable = false;
          }
        }
      }

      // Animate closing
      if (state.closing && state.openProgress > 0) {
        state.openProgress = Math.max(0, state.openProgress - CLOSE_SPEED * deltaTime);

        const mesh = scene.getMeshByName(meshName);
        if (mesh) {
          mesh.position.y = (WALL_HEIGHT / 2) + state.openProgress * WALL_HEIGHT;

          // Re-enable collision once fully closed
          if (state.openProgress <= 0) {
            state.openProgress = 0;
            state.closing = false;
            state.closeTimer = 0;
            mesh.checkCollisions = true;
            mesh.isPickable = true;
          }
        }
      }
    }
  }
}
