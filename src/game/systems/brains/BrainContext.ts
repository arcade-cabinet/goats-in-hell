import type { GameScreen } from '../../../state/GameStore';
import type { Vec3, WeaponId } from '../../entities/components';

export interface BrainContext {
  playerPos: Vec3;
  playerHp: number;
  playerMaxHp: number;
  playerWeapon: WeaponId;
  grid: number[][];
  gridW: number;
  gridH: number;
  cellSize: number;
  circleNumber: number;
  encounterType: 'explore' | 'arena' | 'boss';
  screen: GameScreen;
  deltaTime: number;
  dtScale: number;
  gameTime: number;
}

export function buildBrainContext(
  playerPos: Vec3,
  playerHp: number,
  playerMaxHp: number,
  playerWeapon: WeaponId,
  grid: number[][],
  cellSize: number,
  circleNumber: number,
  encounterType: 'explore' | 'arena' | 'boss',
  screen: GameScreen,
  deltaTime: number,
  gameTime: number,
): BrainContext {
  return {
    playerPos,
    playerHp,
    playerMaxHp,
    playerWeapon,
    grid,
    gridW: grid.length > 0 ? (grid[0]?.length ?? 0) : 0,
    gridH: grid.length,
    cellSize,
    circleNumber,
    encounterType,
    screen,
    deltaTime,
    dtScale: deltaTime / 16,
    gameTime,
  };
}
