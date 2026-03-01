/**
 * Level editor API — builds levels by writing to the SQLite database.
 *
 * Usage:
 *   const editor = new LevelEditor(db);
 *   editor.createLevel('limbo-1', { name: 'Limbo', ... });
 *   const r1 = editor.room('limbo-1', 'spawn', 5, 5, 8, 8);
 *   const r2 = editor.room('limbo-1', 'arena', 20, 5, 10, 10);
 *   editor.corridor('limbo-1', r1, r2);
 *   editor.setPlayerSpawn('limbo-1', 9, 9);
 *   editor.spawnEnemy('limbo-1', 'goat', 25, 10);
 *   editor.compile('limbo-1');
 */
import { eq } from 'drizzle-orm';

import type { DrizzleDb } from './connection';
import { compileGrid, packGrid } from './GridCompiler';
import * as schema from './schema';

// ---------------------------------------------------------------------------
// ID generation
// ---------------------------------------------------------------------------

let _counter = 0;

function generateId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    // Fallback for environments without crypto.randomUUID
    _counter++;
    return `id-${Date.now()}-${_counter}`;
  }
}

// ---------------------------------------------------------------------------
// Validation result
// ---------------------------------------------------------------------------

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ---------------------------------------------------------------------------
// LevelEditor
// ---------------------------------------------------------------------------

export class LevelEditor {
  private db: DrizzleDb;

  constructor(db: DrizzleDb) {
    this.db = db;
  }

  // -------------------------------------------------------------------------
  // Core methods
  // -------------------------------------------------------------------------

  createLevel(
    id: string,
    opts: {
      name: string;
      levelType: 'circle' | 'procedural' | 'arena' | 'boss';
      width: number;
      depth: number;
      floor: number;
      themeId: string;
      circleNumber?: number;
      sin?: string;
      guardian?: string;
      music?: string;
      ambientSound?: string;
      spawnX?: number;
      spawnZ?: number;
      spawnFacing?: number;
    },
  ): void {
    this.db
      .insert(schema.levels)
      .values({
        id,
        name: opts.name,
        levelType: opts.levelType,
        width: opts.width,
        depth: opts.depth,
        floor: opts.floor,
        themeId: opts.themeId,
        circleNumber: opts.circleNumber,
        sin: opts.sin,
        guardian: opts.guardian,
        music: opts.music,
        ambientSound: opts.ambientSound,
        spawnX: opts.spawnX ?? 0,
        spawnZ: opts.spawnZ ?? 0,
        spawnFacing: opts.spawnFacing ?? 0,
      })
      .run();
  }

  addRoom(
    levelId: string,
    name: string,
    opts: {
      roomType: string;
      boundsX: number;
      boundsZ: number;
      boundsW: number;
      boundsH: number;
      elevation?: number;
      floorCell?: number;
      wallCell?: number;
      sortOrder?: number;
    },
  ): string {
    const id = generateId();
    this.db
      .insert(schema.rooms)
      .values({
        id,
        levelId,
        name,
        roomType: opts.roomType,
        boundsX: opts.boundsX,
        boundsZ: opts.boundsZ,
        boundsW: opts.boundsW,
        boundsH: opts.boundsH,
        elevation: opts.elevation,
        floorCell: opts.floorCell,
        wallCell: opts.wallCell,
        sortOrder: opts.sortOrder,
      })
      .run();
    return id;
  }

  connect(
    levelId: string,
    fromRoomId: string,
    toRoomId: string,
    opts: {
      connectionType: string;
      corridorWidth?: number;
      direction?: string;
      fromElevation?: number;
      toElevation?: number;
      length?: number;
    },
  ): string {
    const id = generateId();
    this.db
      .insert(schema.connections)
      .values({
        id,
        levelId,
        fromRoomId,
        toRoomId,
        connectionType: opts.connectionType,
        corridorWidth: opts.corridorWidth,
        direction: opts.direction,
        fromElevation: opts.fromElevation,
        toElevation: opts.toElevation,
        length: opts.length,
      })
      .run();
    return id;
  }

  addEntity(
    levelId: string,
    opts: {
      entityType: string;
      x: number;
      z: number;
      spawnCategory: 'enemy' | 'pickup' | 'prop' | 'hazard' | 'boss';
      roomId?: string;
      elevation?: number;
      facing?: number;
      patrol?: Array<{ x: number; z: number }>;
      triggerId?: string;
      overrides?: Record<string, unknown>;
      surfaceAnchor?: {
        face: string;
        offsetX: number;
        offsetY: number;
        offsetZ: number;
        rotation: number[];
        scale: number;
      };
    },
  ): string {
    const id = generateId();
    this.db
      .insert(schema.entities)
      .values({
        id,
        levelId,
        entityType: opts.entityType,
        x: opts.x,
        z: opts.z,
        spawnCategory: opts.spawnCategory,
        roomId: opts.roomId,
        elevation: opts.elevation,
        facing: opts.facing,
        patrol: opts.patrol,
        triggerId: opts.triggerId,
        overrides: opts.overrides,
        surfaceAnchor: opts.surfaceAnchor,
      })
      .run();
    return id;
  }

  addTrigger(
    levelId: string,
    opts: {
      action: string;
      zoneX: number;
      zoneZ: number;
      zoneW: number;
      zoneH: number;
      roomId?: string;
      once?: boolean;
      delay?: number;
      actionData?: Record<string, unknown>;
    },
  ): string {
    const id = generateId();
    this.db
      .insert(schema.triggers)
      .values({
        id,
        levelId,
        action: opts.action,
        zoneX: opts.zoneX,
        zoneZ: opts.zoneZ,
        zoneW: opts.zoneW,
        zoneH: opts.zoneH,
        roomId: opts.roomId,
        once: opts.once,
        delay: opts.delay,
        actionData: opts.actionData,
      })
      .run();
    return id;
  }

  addEnvironmentZone(
    levelId: string,
    opts: {
      envType: string;
      boundsX: number;
      boundsZ: number;
      boundsW: number;
      boundsH: number;
      intensity?: number;
      directionX?: number;
      directionZ?: number;
      timerOn?: number;
      timerOff?: number;
    },
  ): string {
    const id = generateId();
    this.db
      .insert(schema.environmentZones)
      .values({
        id,
        levelId,
        envType: opts.envType,
        boundsX: opts.boundsX,
        boundsZ: opts.boundsZ,
        boundsW: opts.boundsW,
        boundsH: opts.boundsH,
        intensity: opts.intensity,
        directionX: opts.directionX,
        directionZ: opts.directionZ,
        timerOn: opts.timerOn,
        timerOff: opts.timerOff,
      })
      .run();
    return id;
  }

  // -------------------------------------------------------------------------
  // compile — rasterize rooms/connections into a grid BLOB
  // -------------------------------------------------------------------------

  compile(levelId: string): void {
    const level = this.db.select().from(schema.levels).where(eq(schema.levels.id, levelId)).get();
    if (!level) throw new Error(`Level not found: ${levelId}`);

    const theme = this.db
      .select()
      .from(schema.themes)
      .where(eq(schema.themes.id, level.themeId))
      .get();
    if (!theme) throw new Error(`Theme not found: ${level.themeId}`);

    const levelRooms = this.db
      .select()
      .from(schema.rooms)
      .where(eq(schema.rooms.levelId, levelId))
      .all();

    const levelConnections = this.db
      .select()
      .from(schema.connections)
      .where(eq(schema.connections.levelId, levelId))
      .all();

    const grid = compileGrid(
      level.width,
      level.depth,
      levelRooms,
      levelConnections,
      theme.primaryWall,
    );

    const packed = packGrid(grid);

    this.db
      .update(schema.levels)
      .set({ compiledGrid: Buffer.from(packed) })
      .where(eq(schema.levels.id, levelId))
      .run();
  }

  // -------------------------------------------------------------------------
  // validate — structural checks on the level
  // -------------------------------------------------------------------------

  validate(levelId: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const level = this.db.select().from(schema.levels).where(eq(schema.levels.id, levelId)).get();
    if (!level) {
      return { valid: false, errors: [`Level not found: ${levelId}`], warnings };
    }

    const levelRooms = this.db
      .select()
      .from(schema.rooms)
      .where(eq(schema.rooms.levelId, levelId))
      .all();

    const levelConnections = this.db
      .select()
      .from(schema.connections)
      .where(eq(schema.connections.levelId, levelId))
      .all();

    const levelEntities = this.db
      .select()
      .from(schema.entities)
      .where(eq(schema.entities.levelId, levelId))
      .all();

    // Check: at least one room exists
    if (levelRooms.length === 0) {
      errors.push('Level has no rooms');
      return { valid: false, errors, warnings };
    }

    // Check: spawn point is inside a room
    const spawnInRoom = levelRooms.some(
      (r) =>
        level.spawnX >= r.boundsX &&
        level.spawnX < r.boundsX + r.boundsW &&
        level.spawnZ >= r.boundsZ &&
        level.spawnZ < r.boundsZ + r.boundsH,
    );
    if (!spawnInRoom) {
      errors.push(`Spawn point (${level.spawnX}, ${level.spawnZ}) is not inside any room`);
    }

    // Check: no entity spawns outside level bounds
    for (const entity of levelEntities) {
      if (entity.x < 0 || entity.x >= level.width || entity.z < 0 || entity.z >= level.depth) {
        errors.push(
          `Entity '${entity.entityType}' at (${entity.x}, ${entity.z}) is outside level bounds (${level.width}x${level.depth})`,
        );
      }
    }

    // Build adjacency list for room graph
    const _roomIds = new Set(levelRooms.map((r) => r.id));
    const adjacency = new Map<string, Set<string>>();
    for (const r of levelRooms) {
      adjacency.set(r.id, new Set());
    }
    for (const conn of levelConnections) {
      adjacency.get(conn.fromRoomId)?.add(conn.toRoomId);
      adjacency.get(conn.toRoomId)?.add(conn.fromRoomId);
    }

    // Find the spawn room (room containing spawn point)
    const spawnRoom = levelRooms.find(
      (r) =>
        level.spawnX >= r.boundsX &&
        level.spawnX < r.boundsX + r.boundsW &&
        level.spawnZ >= r.boundsZ &&
        level.spawnZ < r.boundsZ + r.boundsH,
    );

    // Check: all rooms reachable from spawn room (BFS)
    if (spawnRoom) {
      const visited = new Set<string>();
      const queue = [spawnRoom.id];
      visited.add(spawnRoom.id);

      while (queue.length > 0) {
        const current = queue.shift()!;
        const neighbors = adjacency.get(current);
        if (neighbors) {
          for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
              visited.add(neighbor);
              queue.push(neighbor);
            }
          }
        }
      }

      for (const r of levelRooms) {
        if (!visited.has(r.id)) {
          errors.push(`Room '${r.name}' (${r.id}) is not reachable from spawn`);
        }
      }
    }

    // Check: DAG has no cycles (DFS with recursion tracking)
    // Use directed edges only (from → to) for cycle detection
    const directedAdj = new Map<string, Set<string>>();
    for (const r of levelRooms) {
      directedAdj.set(r.id, new Set());
    }
    for (const conn of levelConnections) {
      directedAdj.get(conn.fromRoomId)?.add(conn.toRoomId);
    }

    const WHITE = 0; // unvisited
    const GRAY = 1; // in current recursion stack
    const BLACK = 2; // fully processed
    const color = new Map<string, number>();
    for (const r of levelRooms) {
      color.set(r.id, WHITE);
    }

    let hasCycle = false;
    const dfs = (nodeId: string) => {
      color.set(nodeId, GRAY);
      const neighbors = directedAdj.get(nodeId);
      if (neighbors) {
        for (const neighbor of neighbors) {
          const c = color.get(neighbor);
          if (c === GRAY) {
            hasCycle = true;
            return;
          }
          if (c === WHITE) {
            dfs(neighbor);
            if (hasCycle) return;
          }
        }
      }
      color.set(nodeId, BLACK);
    };

    for (const r of levelRooms) {
      if (color.get(r.id) === WHITE) {
        dfs(r.id);
        if (hasCycle) break;
      }
    }

    if (hasCycle) {
      errors.push('Room connection graph contains a cycle');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  // -------------------------------------------------------------------------
  // Convenience methods
  // -------------------------------------------------------------------------

  room(
    levelId: string,
    name: string,
    x: number,
    z: number,
    w: number,
    h: number,
    opts?: Partial<{
      roomType: string;
      elevation: number;
      floorCell: number;
      wallCell: number;
      sortOrder: number;
    }>,
  ): string {
    return this.addRoom(levelId, name, {
      roomType: opts?.roomType ?? 'exploration',
      boundsX: x,
      boundsZ: z,
      boundsW: w,
      boundsH: h,
      elevation: opts?.elevation,
      floorCell: opts?.floorCell,
      wallCell: opts?.wallCell,
      sortOrder: opts?.sortOrder,
    });
  }

  corridor(levelId: string, fromRoomId: string, toRoomId: string, width?: number): string {
    return this.connect(levelId, fromRoomId, toRoomId, {
      connectionType: 'corridor',
      corridorWidth: width ?? 2,
    });
  }

  spawnEnemy(
    levelId: string,
    type: string,
    x: number,
    z: number,
    opts?: {
      roomId?: string;
      elevation?: number;
      facing?: number;
      patrol?: Array<{ x: number; z: number }>;
      overrides?: Record<string, unknown>;
    },
  ): string {
    return this.addEntity(levelId, {
      entityType: type,
      x,
      z,
      spawnCategory: 'enemy',
      roomId: opts?.roomId,
      elevation: opts?.elevation,
      facing: opts?.facing,
      patrol: opts?.patrol,
      overrides: opts?.overrides,
    });
  }

  spawnPickup(levelId: string, type: string, x: number, z: number): string {
    return this.addEntity(levelId, {
      entityType: type,
      x,
      z,
      spawnCategory: 'pickup',
    });
  }

  spawnProp(
    levelId: string,
    type: string,
    x: number,
    z: number,
    opts?: {
      roomId?: string;
      elevation?: number;
      facing?: number;
      surfaceAnchor?: {
        face: string;
        offsetX: number;
        offsetY: number;
        offsetZ: number;
        rotation: number[];
        scale: number;
      };
    },
  ): string {
    return this.addEntity(levelId, {
      entityType: type,
      x,
      z,
      spawnCategory: 'prop',
      roomId: opts?.roomId,
      elevation: opts?.elevation,
      facing: opts?.facing,
      surfaceAnchor: opts?.surfaceAnchor,
    });
  }

  setPlayerSpawn(levelId: string, x: number, z: number, facing?: number): void {
    this.db
      .update(schema.levels)
      .set({
        spawnX: x,
        spawnZ: z,
        spawnFacing: facing ?? 0,
      })
      .where(eq(schema.levels.id, levelId))
      .run();
  }
}
