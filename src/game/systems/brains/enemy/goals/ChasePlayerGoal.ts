import type { GameEntity } from 'yuka';
import { Goal } from 'yuka';
import type { Entity } from '../../../../entities/components';
import { vec3Distance } from '../../../../entities/vec3';
import type { BrainContext } from '../../BrainContext';
import { astar } from '../../pathfinding/AStar';

const CHASE_SPEED = 3.0;
const WAYPOINT_THRESHOLD = 0.5;

/**
 * ChasePlayerGoal — move toward player using A* grid pathfinding.
 *
 * On activate(), computes a waypoint path via A*. On execute(), advances
 * the entity along waypoints each frame. Falls back to direct distance
 * check when A* returns no path (e.g. already adjacent or grid unavailable).
 */
export class ChasePlayerGoal extends Goal<GameEntity> {
  private entity: Entity;
  private ctx: BrainContext;
  private waypoints: [number, number][] = [];
  private wpIdx = 0;

  constructor(entity: Entity, ctx: BrainContext) {
    super();
    this.entity = entity;
    this.ctx = ctx;
  }

  activate(): void {
    this.status = Goal.STATUS.ACTIVE;

    const pos = this.entity.position!;
    const ppos = this.ctx.playerPos;
    const cs = this.ctx.cellSize;

    const startGX = Math.round(pos.x / cs);
    const startGZ = Math.round(pos.z / cs);
    const endGX = Math.round(ppos.x / cs);
    const endGZ = Math.round(ppos.z / cs);

    this.waypoints = astar(this.ctx.grid, startGX, startGZ, endGX, endGZ);
    this.wpIdx = 0;
  }

  execute(): void {
    const pos = this.entity.position!;
    const dist = vec3Distance(pos, this.ctx.playerPos);

    // Arrived at attack range — done regardless of waypoint state
    if (dist <= this.entity.enemy!.attackRange) {
      this.status = Goal.STATUS.COMPLETED;
      return;
    }

    if (this.waypoints.length > 0 && this.wpIdx < this.waypoints.length) {
      const wp = this.waypoints[this.wpIdx];
      const cs = this.ctx.cellSize;
      const wpX = wp[0] * cs;
      const wpZ = wp[1] * cs;

      const dx = wpX - pos.x;
      const dz = wpZ - pos.z;
      const wpDist = Math.sqrt(dx * dx + dz * dz);

      if (wpDist < WAYPOINT_THRESHOLD) {
        this.wpIdx++;
        if (this.wpIdx >= this.waypoints.length) {
          this.status = Goal.STATUS.COMPLETED;
        }
        return;
      }

      // Step toward current waypoint
      const dt = this.ctx.deltaTime / 1000;
      const step = Math.min(CHASE_SPEED * dt, wpDist);
      const inv = step / wpDist;
      pos.x += dx * inv;
      pos.z += dz * inv;
    }
    // Fallback (no waypoints): stay ACTIVE, distance check above handles completion
  }

  terminate(): void {
    this.waypoints = [];
    this.wpIdx = 0;
  }
}
