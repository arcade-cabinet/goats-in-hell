import type { GameEntity } from 'yuka';
import { Think } from 'yuka';
import { PlayerSurvivalEval } from './evaluators/PlayerSurvivalEval';
import { PlayThroughEval } from './evaluators/PlayThroughEval';
import type { PlayerGoalDriver } from './PlayerGoalDriver';

export type { PlayerGoalDriver };

/**
 * createPlayerBrain — builds a Think brain for the autoplay player.
 *
 * The brain has two evaluators:
 *   - PlayThroughEval (base 1.0) — always wants to complete the game
 *   - PlayerSurvivalEval (base 1.5) — spikes when HP is critical, triggers flee
 *
 * The driver handles all movement/combat output (implemented by AIGovernor).
 */
export function createPlayerBrain(
  driver: PlayerGoalDriver,
  getHpRatio: () => number,
): Think<GameEntity> {
  const brain = new Think<GameEntity>({} as GameEntity);

  const survivalEval = new PlayerSurvivalEval(getHpRatio);
  survivalEval.setDriver(driver);

  const playthroughEval = new PlayThroughEval();
  playthroughEval.setDriver(driver);

  brain.addEvaluator(playthroughEval);
  brain.addEvaluator(survivalEval);

  return brain;
}
