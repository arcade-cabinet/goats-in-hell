import { MapCell } from '../../game/levels/LevelGenerator';
import { compileGrid, packGrid, unpackGrid } from '../GridCompiler';
import type { Connection, Room } from '../schema';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a minimal Room record with only the fields compileGrid uses. */
function makeRoom(
  overrides: Partial<Room> & Pick<Room, 'id' | 'boundsX' | 'boundsZ' | 'boundsW' | 'boundsH'>,
): Room {
  return {
    levelId: 'lvl-1',
    name: overrides.id,
    roomType: 'exploration',
    elevation: 0,
    floorCell: null,
    wallCell: null,
    sortOrder: 0,
    ...overrides,
  } as Room;
}

/** Create a minimal Connection record. */
function makeConnection(
  overrides: Partial<Connection> &
    Pick<Connection, 'id' | 'fromRoomId' | 'toRoomId' | 'connectionType'>,
): Connection {
  return {
    levelId: 'lvl-1',
    corridorWidth: 2,
    direction: null,
    fromElevation: null,
    toElevation: null,
    length: null,
    ...overrides,
  } as Connection;
}

/** Count how many cells in the grid match a given value. */
function countCells(grid: MapCell[][], cell: MapCell): number {
  let n = 0;
  for (const row of grid) {
    for (const c of row) {
      if (c === cell) n++;
    }
  }
  return n;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('compileGrid', () => {
  it('carves two rooms connected by a corridor on a 10x10 grid', () => {
    const rooms: Room[] = [
      makeRoom({ id: 'r1', boundsX: 1, boundsZ: 1, boundsW: 3, boundsH: 3 }),
      makeRoom({ id: 'r2', boundsX: 6, boundsZ: 6, boundsW: 3, boundsH: 3 }),
    ];
    const connections: Connection[] = [
      makeConnection({ id: 'c1', fromRoomId: 'r1', toRoomId: 'r2', connectionType: 'corridor' }),
    ];

    const grid = compileGrid(10, 10, rooms, connections, MapCell.WALL_STONE);

    // Room 1 interior should be EMPTY (3x3 = 9 cells)
    for (let z = 1; z <= 3; z++) {
      for (let x = 1; x <= 3; x++) {
        expect(grid[z][x]).toBe(MapCell.EMPTY);
      }
    }

    // Room 2 interior should be EMPTY (3x3 = 9 cells)
    for (let z = 6; z <= 8; z++) {
      for (let x = 6; x <= 8; x++) {
        expect(grid[z][x]).toBe(MapCell.EMPTY);
      }
    }

    // Corridor should create EMPTY cells connecting them.
    // Center of r1 = (2, 2), center of r2 = (7, 7).
    // Horizontal-first L-bend: carve H from x=2→7 at z=2 (and z=3),
    // then carve V from z=2→7 at x=7 (and x=8).
    // Check a corridor-only cell (not inside either room)
    expect(grid[2][5]).toBe(MapCell.EMPTY); // horizontal segment
    expect(grid[5][7]).toBe(MapCell.EMPTY); // vertical segment

    // Grid border cells not touched by rooms/corridors should still be walls
    expect(grid[0][0]).toBe(MapCell.WALL_STONE);
    expect(grid[9][9]).toBe(MapCell.WALL_STONE);
  });

  it('uses floorCell override for a room', () => {
    const rooms: Room[] = [
      makeRoom({
        id: 'r1',
        boundsX: 1,
        boundsZ: 1,
        boundsW: 3,
        boundsH: 3,
        floorCell: MapCell.FLOOR_RAISED,
      }),
    ];

    const grid = compileGrid(6, 6, rooms, [], MapCell.WALL_STONE);

    for (let z = 1; z <= 3; z++) {
      for (let x = 1; x <= 3; x++) {
        expect(grid[z][x]).toBe(MapCell.FLOOR_RAISED);
      }
    }
    // Walls outside the room should be untouched
    expect(grid[0][0]).toBe(MapCell.WALL_STONE);
  });

  it('uses wallCell override to paint room border', () => {
    const rooms: Room[] = [
      makeRoom({
        id: 'r1',
        boundsX: 2,
        boundsZ: 2,
        boundsW: 3,
        boundsH: 3,
        wallCell: MapCell.WALL_OBSIDIAN,
      }),
    ];

    const grid = compileGrid(8, 8, rooms, [], MapCell.WALL_STONE);

    // Border ring should be WALL_OBSIDIAN
    expect(grid[1][2]).toBe(MapCell.WALL_OBSIDIAN); // top edge
    expect(grid[5][2]).toBe(MapCell.WALL_OBSIDIAN); // bottom edge
    expect(grid[2][1]).toBe(MapCell.WALL_OBSIDIAN); // left edge
    expect(grid[2][5]).toBe(MapCell.WALL_OBSIDIAN); // right edge

    // Interior should be EMPTY
    expect(grid[3][3]).toBe(MapCell.EMPTY);
  });

  it('places RAMP cells for stairs connection', () => {
    const rooms: Room[] = [
      makeRoom({ id: 'r1', boundsX: 1, boundsZ: 1, boundsW: 3, boundsH: 3 }),
      makeRoom({ id: 'r2', boundsX: 7, boundsZ: 7, boundsW: 3, boundsH: 3 }),
    ];
    const connections: Connection[] = [
      makeConnection({ id: 'c1', fromRoomId: 'r1', toRoomId: 'r2', connectionType: 'stairs' }),
    ];

    const grid = compileGrid(12, 12, rooms, connections, MapCell.WALL_STONE);

    // L-bend corridor: horizontal from r1 center (2,2) to r2.x center (8),
    // then vertical from r1.z center (2) to r2.z center (8) at x=8.
    // Ramps are placed at the bend point (8, 2) in a 3x3 area.
    const rampCount = countCells(grid, MapCell.RAMP);
    expect(rampCount).toBeGreaterThan(0);

    // The bend point should be a ramp (corridor carved through here)
    expect(grid[2][8]).toBe(MapCell.RAMP);
  });

  it('places DOOR cell for door connection', () => {
    const rooms: Room[] = [
      makeRoom({ id: 'r1', boundsX: 1, boundsZ: 1, boundsW: 3, boundsH: 3 }),
      makeRoom({ id: 'r2', boundsX: 6, boundsZ: 1, boundsW: 3, boundsH: 3 }),
    ];
    const connections: Connection[] = [
      makeConnection({ id: 'c1', fromRoomId: 'r1', toRoomId: 'r2', connectionType: 'door' }),
    ];

    const grid = compileGrid(10, 6, rooms, connections, MapCell.WALL_STONE);

    // Centers: r1=(2,2), r2=(7,2). Midpoint = (4,2).
    expect(grid[2][4]).toBe(MapCell.DOOR);
  });

  it('places FLOOR_RAISED cells for bridge connection', () => {
    const rooms: Room[] = [
      makeRoom({ id: 'r1', boundsX: 1, boundsZ: 1, boundsW: 3, boundsH: 3 }),
      makeRoom({ id: 'r2', boundsX: 7, boundsZ: 1, boundsW: 3, boundsH: 3 }),
    ];
    const connections: Connection[] = [
      makeConnection({ id: 'c1', fromRoomId: 'r1', toRoomId: 'r2', connectionType: 'bridge' }),
    ];

    const grid = compileGrid(12, 6, rooms, connections, MapCell.WALL_STONE);

    // Corridor between rooms carved with FLOOR_RAISED
    // Horizontal from x=2→8 at z=2 (and z=3)
    expect(grid[2][5]).toBe(MapCell.FLOOR_RAISED);
    expect(grid[3][5]).toBe(MapCell.FLOOR_RAISED);
  });

  it('places WALL_SECRET cell for secret connection', () => {
    const rooms: Room[] = [
      makeRoom({ id: 'r1', boundsX: 1, boundsZ: 1, boundsW: 3, boundsH: 3 }),
      makeRoom({ id: 'r2', boundsX: 7, boundsZ: 1, boundsW: 3, boundsH: 3 }),
    ];
    const connections: Connection[] = [
      makeConnection({ id: 'c1', fromRoomId: 'r1', toRoomId: 'r2', connectionType: 'secret' }),
    ];

    const grid = compileGrid(12, 6, rooms, connections, MapCell.WALL_STONE);

    // Midpoint between (2,2) and (8,2) = (5,2)
    expect(grid[2][5]).toBe(MapCell.WALL_SECRET);
  });

  it('handles an empty grid with no rooms or connections', () => {
    const grid = compileGrid(5, 5, [], [], MapCell.WALL_FLESH);

    expect(grid.length).toBe(5);
    expect(grid[0].length).toBe(5);
    expect(countCells(grid, MapCell.WALL_FLESH)).toBe(25);
  });
});

describe('packGrid / unpackGrid', () => {
  it('round-trips a simple grid', () => {
    const rooms: Room[] = [makeRoom({ id: 'r1', boundsX: 1, boundsZ: 1, boundsW: 2, boundsH: 2 })];
    const grid = compileGrid(5, 5, rooms, [], MapCell.WALL_STONE);

    const blob = packGrid(grid);
    expect(blob).toBeInstanceOf(Uint8Array);
    expect(blob.length).toBe(25); // 5 * 5

    const restored = unpackGrid(blob, 5, 5);
    expect(restored).toEqual(grid);
  });

  it('round-trips an empty grid', () => {
    const grid: MapCell[][] = [];
    const blob = packGrid(grid);
    expect(blob.length).toBe(0);
  });

  it('preserves all MapCell values', () => {
    // Build a 1-row grid with one of each MapCell value
    const allCells = [
      MapCell.EMPTY,
      MapCell.WALL_STONE,
      MapCell.WALL_FLESH,
      MapCell.WALL_LAVA,
      MapCell.WALL_OBSIDIAN,
      MapCell.DOOR,
      MapCell.FLOOR_LAVA,
      MapCell.FLOOR_RAISED,
      MapCell.RAMP,
      MapCell.WALL_SECRET,
      MapCell.FLOOR_VOID,
    ];
    const grid: MapCell[][] = [allCells];

    const blob = packGrid(grid);
    const restored = unpackGrid(blob, allCells.length, 1);
    expect(restored).toEqual(grid);
  });
});
