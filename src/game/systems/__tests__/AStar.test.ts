/**
 * A* pathfinding — unit tests for the octile-distance heuristic implementation.
 */
import { astar } from '../brains/pathfinding/AStar';

// 0 = walkable, 1 = wall
const OPEN: number[][] = [
  [0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0],
];

const WALLED: number[][] = [
  [0, 0, 0, 0, 0],
  [0, 1, 1, 1, 0],
  [0, 1, 0, 1, 0],
  [0, 1, 1, 1, 0],
  [0, 0, 0, 0, 0],
];

const BLOCKED: number[][] = [
  [0, 1, 0],
  [0, 1, 0],
  [0, 1, 0],
];

describe('astar', () => {
  it('returns [end] when start === end', () => {
    const path = astar(OPEN, 2, 2, 2, 2);
    expect(path).toEqual([[2, 2]]);
  });

  it('finds straight horizontal path in open grid', () => {
    const path = astar(OPEN, 0, 0, 4, 0);
    expect(path.length).toBeGreaterThan(0);
    expect(path[0]).toEqual([0, 0]);
    expect(path[path.length - 1]).toEqual([4, 0]);
  });

  it('finds path around a box of walls', () => {
    const path = astar(WALLED, 0, 0, 4, 4);
    expect(path.length).toBeGreaterThan(0);
    expect(path[path.length - 1]).toEqual([4, 4]);
    // All cells in path must be walkable
    for (const [x, y] of path) {
      expect(WALLED[y][x]).toBe(0);
    }
  });

  it('returns [] when no path exists', () => {
    const path = astar(BLOCKED, 0, 0, 2, 0);
    expect(path).toEqual([]);
  });

  it('returns [] when start is out of bounds', () => {
    const path = astar(OPEN, -1, 0, 2, 2);
    expect(path).toEqual([]);
  });
});
