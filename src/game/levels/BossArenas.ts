// MapCell values from LevelGenerator.ts
const EMPTY = 0;
const WALL_OBSIDIAN = 4;
const WALL_LAVA = 3;

const ARENA_SIZE = 15;

const PILLAR_POSITIONS: [number, number][] = [
  [4, 4],
  [10, 4],
  [4, 10],
  [10, 10],
  [7, 3],
  [7, 11],
];

export function generateBossArena(): number[][] {
  const grid: number[][] = [];

  for (let z = 0; z < ARENA_SIZE; z++) {
    const row: number[] = [];
    for (let x = 0; x < ARENA_SIZE; x++) {
      // Edges are obsidian walls
      if (z === 0 || z === ARENA_SIZE - 1 || x === 0 || x === ARENA_SIZE - 1) {
        row.push(WALL_OBSIDIAN);
      } else {
        row.push(EMPTY);
      }
    }
    grid.push(row);
  }

  // Place symmetrical cover pillars
  for (const [px, pz] of PILLAR_POSITIONS) {
    grid[pz][px] = WALL_LAVA;
  }

  return grid;
}
