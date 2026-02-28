/**
 * Secret Room System — detects when the player discovers hidden rooms.
 *
 * Engine-agnostic: tracks discovered secrets and emits events. The R3F
 * level renderer is responsible for hiding/showing secret walls based on
 * the grid state updated here.
 */
import type {Vec3} from '../entities/components';
import {vec3Distance} from '../entities/vec3';
import {MapCell} from '../levels/LevelGenerator';
import {playSound} from './AudioSystem';
import {GameState} from '../../state/GameState';
import {useGameStore} from '../../state/GameStore';
import type {LevelData} from '../levels/LevelData';
import {CELL_SIZE} from '../levels/LevelGenerator';

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
 * Check if the player is close to any secret wall cell. If so, open it.
 */
export function checkSecretWalls(
  playerPos: Vec3,
  level: LevelData,
): void {
  const DISCOVER_RANGE = 1.8;
  const grid = level.grid;

  for (let z = 0; z < grid.length; z++) {
    for (let x = 0; x < grid[0].length; x++) {
      if (grid[z][x] !== MapCell.WALL_SECRET) continue;

      const wallX = x * CELL_SIZE;
      const wallZ = z * CELL_SIZE;
      const dist = vec3Distance(playerPos, {x: wallX, y: playerPos.y, z: wallZ});

      if (dist < DISCOVER_RANGE) {
        openSecretWall(x, z, level);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Internal
// ---------------------------------------------------------------------------

function openSecretWall(
  gridX: number,
  gridZ: number,
  level: LevelData,
): void {
  // Update the grid to remove the wall
  if (level.grid[gridZ]?.[gridX] !== undefined) {
    level.grid[gridZ][gridX] = MapCell.EMPTY;
  }

  // Effects
  secretsFound++;
  secretNotifyTimer = NOTIFY_DURATION;
  playSound('pickup');
  GameState.set({screenShake: 6});

  // Award bonus score
  const store = useGameStore.getState();
  useGameStore.setState({score: store.score + 500});
}
