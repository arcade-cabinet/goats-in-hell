// MapCell values from LevelGenerator.ts
const EMPTY = 0;
const WALL_STONE = 1;
const WALL_LAVA = 3;
const WALL_OBSIDIAN = 4;

/**
 * Generates a simple open arena with scattered cover pillars for survival mode.
 *
 * @param size - Width and depth of the square arena grid (default 20).
 * @returns A size x size grid of MapCell values.
 */
export function generateArena(size: number = 20): number[][] {
  const grid: number[][] = [];

  // Create the base grid: edges are WALL_OBSIDIAN, interior is EMPTY
  for (let z = 0; z < size; z++) {
    const row: number[] = [];
    for (let x = 0; x < size; x++) {
      if (z === 0 || z === size - 1 || x === 0 || x === size - 1) {
        row.push(WALL_OBSIDIAN);
      } else {
        row.push(EMPTY);
      }
    }
    grid.push(row);
  }

  // Place 6-10 random 2x2 cover pillars
  const pillarCount = 6 + Math.floor(Math.random() * 5); // 6..10 inclusive
  const placedPillars: {x: number; z: number}[] = [];

  let attempts = 0;
  const maxAttempts = 200;

  while (placedPillars.length < pillarCount && attempts < maxAttempts) {
    attempts++;

    // Random position at least 3 cells from each edge.
    // The pillar is 2x2, occupying (px, pz) to (px+1, pz+1),
    // so the bottom-right corner must also be at least 3 from the far edge.
    const px = 3 + Math.floor(Math.random() * (size - 7)); // 3 .. size-5
    const pz = 3 + Math.floor(Math.random() * (size - 7));

    // Ensure at least 3 cells apart from every other placed pillar
    let tooClose = false;
    for (const other of placedPillars) {
      const dx = Math.abs(px - other.x);
      const dz = Math.abs(pz - other.z);
      if (dx < 3 && dz < 3) {
        tooClose = true;
        break;
      }
    }

    if (tooClose) {
      continue;
    }

    // Choose pillar wall type: WALL_LAVA or WALL_STONE
    const wallType = Math.random() < 0.5 ? WALL_LAVA : WALL_STONE;

    // Place 2x2 block
    grid[pz][px] = wallType;
    grid[pz][px + 1] = wallType;
    grid[pz + 1][px] = wallType;
    grid[pz + 1][px + 1] = wallType;

    placedPillars.push({x: px, z: pz});
  }

  return grid;
}

/**
 * Returns the player spawn point for the arena (center of the grid).
 */
export function getArenaPlayerSpawn(size: number): {x: number; z: number} {
  return {x: Math.floor(size / 2), z: Math.floor(size / 2)};
}
