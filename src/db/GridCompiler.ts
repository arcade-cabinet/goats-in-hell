/**
 * GridCompiler — converts room + connection definitions into a MapCell[][] grid.
 *
 * This is a standalone, pure function with no runtime dependencies on the game
 * store or RNG.  It takes structured room/connection data (from the DB schema)
 * and deterministically produces the 2-D tile grid that the renderer consumes.
 */

import { MapCell } from '../game/levels/LevelGenerator';
import type { Connection, Room } from './schema';

// ---------------------------------------------------------------------------
// Grid helpers (internal)
// ---------------------------------------------------------------------------

function inBounds(x: number, z: number, width: number, depth: number): boolean {
  return x >= 0 && x < width && z >= 0 && z < depth;
}

/**
 * Carve a horizontal segment at row `z`, from `x1` to `x2`.
 * Carves `corridorWidth` cells deep (z through z+corridorWidth-1).
 */
function carveHLine(
  grid: MapCell[][],
  x1: number,
  x2: number,
  z: number,
  gridW: number,
  gridD: number,
  cell: MapCell = MapCell.EMPTY,
  corridorWidth = 2,
): void {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  for (let x = minX; x <= maxX; x++) {
    for (let dz = 0; dz < corridorWidth; dz++) {
      if (inBounds(x, z + dz, gridW, gridD)) grid[z + dz][x] = cell;
    }
  }
}

/**
 * Carve a vertical segment at column `x`, from `z1` to `z2`.
 * Carves `corridorWidth` cells wide (x through x+corridorWidth-1).
 */
function carveVLine(
  grid: MapCell[][],
  z1: number,
  z2: number,
  x: number,
  gridW: number,
  gridD: number,
  cell: MapCell = MapCell.EMPTY,
  corridorWidth = 2,
): void {
  const minZ = Math.min(z1, z2);
  const maxZ = Math.max(z1, z2);
  for (let z = minZ; z <= maxZ; z++) {
    for (let dx = 0; dx < corridorWidth; dx++) {
      if (inBounds(x + dx, z, gridW, gridD)) grid[z][x + dx] = cell;
    }
  }
}

/** Return the center cell of a room. */
function roomCenter(room: Room): { x: number; z: number } {
  return {
    x: room.boundsX + Math.floor(room.boundsW / 2),
    z: room.boundsZ + Math.floor(room.boundsH / 2),
  };
}

// ---------------------------------------------------------------------------
// Connection carvers
// ---------------------------------------------------------------------------

/** Carve an L-shaped corridor between two rooms. */
function carveCorridorConnection(
  grid: MapCell[][],
  from: Room,
  to: Room,
  gridW: number,
  gridD: number,
  corridorWidth = 2,
): void {
  const a = roomCenter(from);
  const b = roomCenter(to);

  // Always use horizontal-first L-bend (deterministic)
  carveHLine(grid, a.x, b.x, a.z, gridW, gridD, MapCell.EMPTY, corridorWidth);
  carveVLine(grid, a.z, b.z, b.x, gridW, gridD, MapCell.EMPTY, corridorWidth);
}

/** Place a DOOR cell at the midpoint between two rooms. */
function placeDoorConnection(
  grid: MapCell[][],
  from: Room,
  to: Room,
  width: number,
  depth: number,
): void {
  const a = roomCenter(from);
  const b = roomCenter(to);
  const midX = Math.floor((a.x + b.x) / 2);
  const midZ = Math.floor((a.z + b.z) / 2);
  if (inBounds(midX, midZ, width, depth)) {
    grid[midZ][midX] = MapCell.DOOR;
  }
}

/** Place RAMP cells in a 3x3 section at the L-bend of the corridor. */
function placeStairsConnection(
  grid: MapCell[][],
  from: Room,
  to: Room,
  width: number,
  depth: number,
): void {
  // First carve a corridor so there's a walkable path (stairs always 2-wide)
  carveCorridorConnection(grid, from, to, width, depth, 2);

  const a = roomCenter(from);
  const b = roomCenter(to);
  // The L-bend corner is at (b.x, a.z) for horizontal-first corridors.
  // Place ramps at the midpoint along the corridor path — the bend point
  // is always on the carved path.
  const bendX = b.x;
  const bendZ = a.z;

  for (let dz = -1; dz <= 1; dz++) {
    for (let dx = -1; dx <= 1; dx++) {
      const rx = bendX + dx;
      const rz = bendZ + dz;
      if (inBounds(rx, rz, width, depth) && grid[rz][rx] === MapCell.EMPTY) {
        grid[rz][rx] = MapCell.RAMP;
      }
    }
  }
}

/** Place FLOOR_RAISED cells spanning the gap between two rooms. */
function placeBridgeConnection(
  grid: MapCell[][],
  from: Room,
  to: Room,
  width: number,
  depth: number,
): void {
  const a = roomCenter(from);
  const b = roomCenter(to);

  // Carve with FLOOR_RAISED instead of EMPTY
  carveHLine(grid, a.x, b.x, a.z, width, depth, MapCell.FLOOR_RAISED);
  carveVLine(grid, a.z, b.z, b.x, width, depth, MapCell.FLOOR_RAISED);
}

/** Place a WALL_SECRET cell at the connection point. */
function placeSecretConnection(
  grid: MapCell[][],
  from: Room,
  to: Room,
  width: number,
  depth: number,
): void {
  const a = roomCenter(from);
  const b = roomCenter(to);
  const midX = Math.floor((a.x + b.x) / 2);
  const midZ = Math.floor((a.z + b.z) / 2);
  if (inBounds(midX, midZ, width, depth)) {
    grid[midZ][midX] = MapCell.WALL_SECRET;
  }
}

/** Place an EMPTY cell as a marker for jump pad entity spawning. */
function placeJumpPadConnection(
  grid: MapCell[][],
  from: Room,
  to: Room,
  width: number,
  depth: number,
): void {
  const a = roomCenter(from);
  const b = roomCenter(to);
  const midX = Math.floor((a.x + b.x) / 2);
  const midZ = Math.floor((a.z + b.z) / 2);
  if (inBounds(midX, midZ, width, depth)) {
    grid[midZ][midX] = MapCell.EMPTY;
  }
}


// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Compile a MapCell[][] grid from room and connection definitions.
 *
 * @param width   Grid width in cells
 * @param depth   Grid depth in cells
 * @param rooms   Room records (from DB)
 * @param connections  Connection records (from DB)
 * @param primaryWall  MapCell value used to fill the initial grid
 */
export function compileGrid(
  width: number,
  depth: number,
  rooms: Room[],
  connections: Connection[],
  primaryWall: number,
): MapCell[][] {
  // 1. Initialize grid filled with primaryWall
  const grid: MapCell[][] = [];
  for (let z = 0; z < depth; z++) {
    const row: MapCell[] = [];
    for (let x = 0; x < width; x++) {
      row.push(primaryWall as MapCell);
    }
    grid.push(row);
  }

  // 2. Build room lookup by id
  const roomById = new Map<string, Room>();
  for (const room of rooms) {
    roomById.set(room.id, room);
  }

  // 3. Carve rooms
  for (const room of rooms) {
    const floorCell = room.floorCell != null ? (room.floorCell as MapCell) : MapCell.EMPTY;
    const wallCell = room.wallCell != null ? (room.wallCell as MapCell) : null;

    // Carve interior floor
    for (let rz = room.boundsZ; rz < room.boundsZ + room.boundsH; rz++) {
      for (let rx = room.boundsX; rx < room.boundsX + room.boundsW; rx++) {
        if (inBounds(rx, rz, width, depth)) {
          grid[rz][rx] = floorCell;
        }
      }
    }

    // If a custom wallCell is specified, paint the border ring
    if (wallCell != null) {
      const x0 = room.boundsX - 1;
      const z0 = room.boundsZ - 1;
      const x1 = room.boundsX + room.boundsW;
      const z1 = room.boundsZ + room.boundsH;

      // Top and bottom edges
      for (let rx = x0; rx <= x1; rx++) {
        if (inBounds(rx, z0, width, depth) && grid[z0][rx] === (primaryWall as MapCell)) {
          grid[z0][rx] = wallCell;
        }
        if (inBounds(rx, z1, width, depth) && grid[z1][rx] === (primaryWall as MapCell)) {
          grid[z1][rx] = wallCell;
        }
      }
      // Left and right edges
      for (let rz = z0; rz <= z1; rz++) {
        if (inBounds(x0, rz, width, depth) && grid[rz][x0] === (primaryWall as MapCell)) {
          grid[rz][x0] = wallCell;
        }
        if (inBounds(x1, rz, width, depth) && grid[rz][x1] === (primaryWall as MapCell)) {
          grid[rz][x1] = wallCell;
        }
      }
    }
  }

  // 4. Process connections
  for (const conn of connections) {
    const from = roomById.get(conn.fromRoomId);
    const to = roomById.get(conn.toRoomId);
    if (!from || !to) continue;

    const cw = conn.corridorWidth ?? 2;

    switch (conn.connectionType) {
      case 'corridor':
        carveCorridorConnection(grid, from, to, width, depth, cw);
        break;
      case 'door':
        // Carve corridor first, then place door
        carveCorridorConnection(grid, from, to, width, depth, cw);
        placeDoorConnection(grid, from, to, width, depth);
        break;
      case 'stairs':
        placeStairsConnection(grid, from, to, width, depth);
        break;
      case 'bridge':
        placeBridgeConnection(grid, from, to, width, depth);
        break;
      case 'secret':
        placeSecretConnection(grid, from, to, width, depth);
        break;
      case 'jump_pad':
        placeJumpPadConnection(grid, from, to, width, depth);
        break;
      case 'portal':
        throw new Error(
          `Portal connections are not yet implemented. ` +
            `Connection ${conn.id} (${conn.fromRoomId} → ${conn.toRoomId}) uses type 'portal'.`,
        );
    }
  }

  return grid;
}

/**
 * Pack a MapCell[][] grid into a Uint8Array BLOB (row-major, one byte per cell).
 */
export function packGrid(grid: MapCell[][]): Uint8Array {
  const depth = grid.length;
  if (depth === 0) return new Uint8Array(0);
  const width = grid[0].length;
  const buf = new Uint8Array(depth * width);
  for (let z = 0; z < depth; z++) {
    for (let x = 0; x < width; x++) {
      buf[z * width + x] = grid[z][x];
    }
  }
  return buf;
}

/**
 * Unpack a Uint8Array BLOB back into a MapCell[][] grid.
 */
export function unpackGrid(blob: Uint8Array, width: number, depth: number): MapCell[][] {
  const grid: MapCell[][] = [];
  for (let z = 0; z < depth; z++) {
    const row: MapCell[] = [];
    for (let x = 0; x < width; x++) {
      row.push(blob[z * width + x] as MapCell);
    }
    grid.push(row);
  }
  return grid;
}
