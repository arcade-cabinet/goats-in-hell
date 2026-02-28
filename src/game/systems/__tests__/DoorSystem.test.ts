/**
 * DoorSystem tests — door state machine, open/close animation, auto-close timer.
 */

jest.mock('../AudioSystem', () => ({
  playSound: jest.fn(),
}));

jest.mock('../../levels/LevelGenerator', () => ({
  MapCell: { EMPTY: 0, WALL_STONE: 1, WALL_FLESH: 2, WALL_LAVA: 3, WALL_OBSIDIAN: 4, DOOR: 5 },
  CELL_SIZE: 2,
  WALL_HEIGHT: 3,
}));

import type { WeaponId } from '../../entities/components';
import { vec3 as Vector3 } from '../../entities/vec3';
import { world } from '../../entities/world';
import { playSound } from '../AudioSystem';
import { doorSystemUpdate, getDoorStates, resetDoorSystem } from '../DoorSystem';

const DOOR = 5;
const EMPTY = 0;

function makeGrid(size: number, doorX: number, doorZ: number): number[][] {
  const grid: number[][] = [];
  for (let z = 0; z < size; z++) {
    const row: number[] = [];
    for (let x = 0; x < size; x++) {
      row.push(EMPTY);
    }
    grid.push(row);
  }
  grid[doorZ][doorX] = DOOR;
  return grid;
}

function makePlayer(x: number, z: number) {
  const player = {
    id: 'player',
    type: 'player' as const,
    position: Vector3(x, 1, z),
    player: {
      hp: 100,
      maxHp: 100,
      speed: 5,
      sprintMult: 1.5,
      currentWeapon: 'hellPistol' as WeaponId,
      weapons: ['hellPistol' as WeaponId],
      isReloading: false,
      reloadStart: 0,
    },
  };
  world.add(player);
  return player;
}

beforeEach(() => {
  for (const e of [...world.entities]) world.remove(e);
  resetDoorSystem();
  jest.clearAllMocks();
});

describe('resetDoorSystem', () => {
  it('clears all door states', () => {
    // Trigger a door open, then reset
    const grid = makeGrid(10, 5, 5);
    makePlayer(10, 10); // door at (5,5) -> world pos (10,10)
    doorSystemUpdate(grid, 16);
    resetDoorSystem();
    // After reset, door states should be empty
    expect(getDoorStates().size).toBe(0);
    // Calling update again should reinitialize states without error
    doorSystemUpdate(grid, 16);
  });
});

describe('door opening', () => {
  it('opens when player is within trigger distance', () => {
    // Door at grid (3,3) -> world pos (6,6) with CELL_SIZE=2
    const grid = makeGrid(10, 3, 3);
    makePlayer(6, 6); // exactly at door position

    doorSystemUpdate(grid, 500); // large dt to see progress
    expect(playSound).toHaveBeenCalledWith('door');
    const states = getDoorStates();
    const doorState = states.get('wall-3-3');
    expect(doorState).toBeDefined();
    expect(doorState!.openProgress).toBeGreaterThan(0);
  });

  it('does not open when player is far away', () => {
    const grid = makeGrid(10, 3, 3);
    makePlayer(0, 0); // far from door at world pos (6,6)

    doorSystemUpdate(grid, 16);
    expect(playSound).not.toHaveBeenCalled();
  });

  it('does nothing without a player entity', () => {
    const grid = makeGrid(10, 3, 3);
    // No player added
    doorSystemUpdate(grid, 16); // should not throw
  });
});

describe('door auto-close', () => {
  it('starts close timer after player leaves fully open door', () => {
    const grid = makeGrid(10, 3, 3);
    const player = makePlayer(6, 6);

    // Fully open the door (1 / 0.003 = ~333ms)
    doorSystemUpdate(grid, 400);
    const states = getDoorStates();
    const doorState = states.get('wall-3-3');
    expect(doorState!.openProgress).toBeGreaterThanOrEqual(1);

    // Move player away
    player.position = Vector3(0, 1, 0);

    // Wait for close delay (2000ms)
    doorSystemUpdate(grid, 2100);
    expect(playSound).toHaveBeenCalledWith('doorClose');
  });

  it('cancels closing if player returns', () => {
    const grid = makeGrid(10, 3, 3);
    const player = makePlayer(6, 6);

    // Open fully
    doorSystemUpdate(grid, 400);

    // Move away and start close timer (but not enough for full delay)
    player.position = Vector3(0, 1, 0);
    doorSystemUpdate(grid, 1000);

    // Come back before close completes
    player.position = Vector3(6, 1, 6);
    jest.clearAllMocks();
    doorSystemUpdate(grid, 16);
    // Should not have triggered doorClose since we came back
    expect(playSound).not.toHaveBeenCalledWith('doorClose');
  });
});
