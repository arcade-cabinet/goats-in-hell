/** World -- singleton Miniplex ECS world that holds all game entities. */
import { World } from 'miniplex';
import type { Entity } from './components';

/** Global ECS world instance — all entities live here and are queried by game systems. */
export const world = new World<Entity>();
