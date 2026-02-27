import type {Scene} from '@babylonjs/core';
import {Vector3} from '@babylonjs/core';
import type {Entity} from '../entities/components';
import {world} from '../entities/world';
import {playSound} from './AudioSystem';
import {CELL_SIZE, MapCell, WALL_HEIGHT} from '../levels/LevelGenerator';

/** Tracks the opening state of door meshes by name. */
interface DoorState {
  meshName: string;
  openProgress: number; // 0 = closed, 1 = fully open
  opening: boolean;
}

const doorStates = new Map<string, DoorState>();
const OPEN_SPEED = 0.003; // progress per ms (~300ms to fully open)
const TRIGGER_DISTANCE = 3; // world units from door center to trigger opening

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
        });
      }

      const state = doorStates.get(meshName)!;

      // Check distance
      const dx = px - doorWorldX;
      const dz = pz - doorWorldZ;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < TRIGGER_DISTANCE && !state.opening && state.openProgress === 0) {
        state.opening = true;
        playSound('door');
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
    }
  }
}
