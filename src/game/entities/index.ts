/**
 * Game entities barrel export.
 *
 * Re-exports ECS components, enemy stat tables, vector utilities,
 * and the Miniplex world instance.
 */

// ECS component types
export type {
  Entity,
  EntityType,
  Vec3,
  WeaponId,
} from './components';

// Enemy stat lookup
export { getEnemyStats } from './enemyStats';

// Engine-agnostic Vec3 utilities
export {
  vec3,
  vec3Add,
  vec3AddInPlace,
  vec3Clone,
  vec3Distance,
  vec3Length,
  vec3Normalize,
  vec3Scale,
  vec3ScaleInPlace,
  vec3Subtract,
  vec3Zero,
} from './vec3';

// Miniplex ECS world
export { world } from './world';
