/**
 * Backward-compatible re-export layer.
 *
 * The real state now lives in GameStore.ts (Zustand).
 * This file preserves the old API (GameState.get/set/reset/subscribe)
 * so existing systems keep working without a big-bang migration.
 */
export {GameState} from './GameStore';

// Legacy screen type that old consumers expect
export type GameScreen = 'menu' | 'playing' | 'paused' | 'dead' | 'victory' | 'modeSelect';
export type GameMode = 'roguelike' | 'arena' | 'campaign';

export type GameStateData = {
  screen: GameScreen;
  mode: GameMode;
  floor: number;
  score: number;
  kills: number;
  totalKills: number;
  startTime: number;
  damageFlash: number;
  screenShake: number;
  gunFlash: number;
};
