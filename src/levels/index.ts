/**
 * Levels index -- statically imports all 9 circle levels.
 *
 * Metro bundles these at build time. No runtime fetch needed.
 * Each JSON is validated against LevelSchema on import.
 */

import rawCircle1 from '../../config/levels/circle-1.json';
import rawCircle2 from '../../config/levels/circle-2.json';
import rawCircle3 from '../../config/levels/circle-3.json';
import rawCircle4 from '../../config/levels/circle-4.json';
import rawCircle5 from '../../config/levels/circle-5.json';
import rawCircle6 from '../../config/levels/circle-6.json';
import rawCircle7 from '../../config/levels/circle-7.json';
import rawCircle8 from '../../config/levels/circle-8.json';
import rawCircle9 from '../../config/levels/circle-9.json';
import { type CompiledLevel, LevelSchema } from './LevelSchema';

export const CIRCLE_LEVELS: CompiledLevel[] = [
  LevelSchema.parse(rawCircle1),
  LevelSchema.parse(rawCircle2),
  LevelSchema.parse(rawCircle3),
  LevelSchema.parse(rawCircle4),
  LevelSchema.parse(rawCircle5),
  LevelSchema.parse(rawCircle6),
  LevelSchema.parse(rawCircle7),
  LevelSchema.parse(rawCircle8),
  LevelSchema.parse(rawCircle9),
];

/** Get level data for a circle (1-9). Throws if out of range. */
export function getCircleLevel(circleNumber: number): CompiledLevel {
  if (circleNumber < 1 || circleNumber > 9) {
    throw new Error(`Invalid circle: ${circleNumber}`);
  }
  return CIRCLE_LEVELS[circleNumber - 1];
}
