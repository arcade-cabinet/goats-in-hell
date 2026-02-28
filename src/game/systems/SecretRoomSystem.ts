/**
 * Secret Room System — detects when the player discovers hidden rooms
 * by shooting or walking close to secret walls.
 *
 * Secret walls (MapCell.WALL_SECRET) are rendered as normal walls but
 * have mesh metadata `isSecret: true`. When triggered, the wall mesh
 * is disposed and the grid cell is set to EMPTY, revealing the room.
 */
import {Scene, Vector3, Mesh} from '@babylonjs/core';
import {MapCell} from '../levels/LevelGenerator';
import {playSound} from './AudioSystem';
import {GameState} from '../../state/GameState';
import {useGameStore} from '../../state/GameStore';
import type {LevelData} from '../GameEngine';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let secretsFound = 0;
let secretNotifyTimer = 0;
const NOTIFY_DURATION = 120; // ~2 seconds at 60fps

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Reset secrets between floors. */
export function resetSecrets(): void {
  secretsFound = 0;
  secretNotifyTimer = 0;
}

/** Get the notification timer for "SECRET FOUND!" HUD display. */
export function getSecretNotifyTimer(): number {
  return secretNotifyTimer;
}

/** Total secrets discovered this run. */
export function getSecretsFound(): number {
  return secretsFound;
}

/** Tick the notification timer. Called each frame by HUD. */
export function tickSecretTimer(): void {
  if (secretNotifyTimer > 0) secretNotifyTimer--;
}

/**
 * Check if the player is close to any secret wall. If so, open it.
 * Called each frame from the game loop.
 */
export function checkSecretWalls(
  scene: Scene,
  playerPos: Vector3,
  level: LevelData,
  levelMeshes: Mesh[],
): void {
  const DISCOVER_RANGE = 1.8; // player must be within this range

  for (let i = levelMeshes.length - 1; i >= 0; i--) {
    const mesh = levelMeshes[i];
    if (!mesh.metadata?.isSecret) continue;

    const dist = Vector3.Distance(playerPos, mesh.position);
    if (dist < DISCOVER_RANGE) {
      openSecretWall(mesh, level, levelMeshes, i);
    }
  }
}

/**
 * Check if a raycast (from shooting) hit a secret wall.
 * Called from the weapon system when a hitscan hits geometry.
 */
export function checkSecretWallShot(
  hitMeshName: string,
  level: LevelData,
  levelMeshes: Mesh[],
): boolean {
  for (let i = levelMeshes.length - 1; i >= 0; i--) {
    const mesh = levelMeshes[i];
    if (!mesh.metadata?.isSecret) continue;
    if (mesh.name === hitMeshName) {
      openSecretWall(mesh, level, levelMeshes, i);
      return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Internal
// ---------------------------------------------------------------------------

function openSecretWall(
  mesh: Mesh,
  level: LevelData,
  levelMeshes: Mesh[],
  index: number,
): void {
  const {gridX, gridZ} = mesh.metadata;

  // Update the grid to remove the wall
  if (level.grid[gridZ]?.[gridX] !== undefined) {
    level.grid[gridZ][gridX] = MapCell.EMPTY;
  }

  // Remove the mesh
  mesh.dispose();
  levelMeshes.splice(index, 1);

  // Effects
  secretsFound++;
  secretNotifyTimer = NOTIFY_DURATION;
  playSound('pickup'); // reuse the pickup chime for now
  GameState.set({screenShake: 6});

  // Award bonus score
  const store = useGameStore.getState();
  useGameStore.setState({score: store.score + 500});
}
