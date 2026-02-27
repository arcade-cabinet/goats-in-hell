import {Vector3} from '@babylonjs/core';
import {getThemeForFloor, type FloorTheme} from './FloorThemes';
import {generateBossArena} from './BossArenas';

export const CELL_SIZE = 2; // matches BLOCK_SIZE
export const WALL_HEIGHT = 3;

export enum MapCell {
  EMPTY = 0,
  WALL_STONE = 1,
  WALL_FLESH = 2,
  WALL_LAVA = 3,
  WALL_OBSIDIAN = 4,
  DOOR = 5,
}

export type SpawnData = {x: number; z: number; type: string; weaponId?: string};

export class LevelGenerator {
  width: number;
  depth: number;
  floor: number;
  theme: FloorTheme;
  grid: MapCell[][] = [];
  spawns: SpawnData[] = [];
  playerSpawn: Vector3 = Vector3.Zero();

  constructor(width: number, depth: number, floor: number = 1) {
    this.floor = floor;
    this.theme = getThemeForFloor(floor);

    // Scale grid size with floor, capped at 50
    this.width = Math.min(50, width + floor * 2);
    this.depth = Math.min(50, depth + floor * 2);

    // Fill with theme's primary wall type
    for (let z = 0; z < this.depth; z++) {
      const row: MapCell[] = [];
      for (let x = 0; x < this.width; x++) {
        row.push(this.theme.primaryWall as MapCell);
      }
      this.grid.push(row);
    }
  }

  generate() {
    const theme = this.theme;

    // Simple Drunkard's Walk for rooms and corridors
    let x = Math.floor(this.width / 2);
    let z = Math.floor(this.depth / 2);
    this.playerSpawn = new Vector3(x * CELL_SIZE, 1, z * CELL_SIZE);

    const playerCellX = x;
    const playerCellZ = z;

    const steps = Math.floor(this.width * this.depth * 0.4);

    for (let i = 0; i < steps; i++) {
      const wasWall = this.grid[z][x] !== MapCell.EMPTY;
      this.grid[z][x] = MapCell.EMPTY;

      // Randomly create a room (modulated by enemy density)
      if (Math.random() > 0.95) {
        const roomSize = Math.floor(Math.random() * 3) + 2;
        for (let rz = -roomSize; rz <= roomSize; rz++) {
          for (let rx = -roomSize; rx <= roomSize; rx++) {
            const nx = Math.max(1, Math.min(this.width - 2, x + rx));
            const nz = Math.max(1, Math.min(this.depth - 2, z + rz));
            this.grid[nz][nx] = MapCell.EMPTY;
          }
        }
        // Maybe spawn enemy (frequency scaled by theme.enemyDensity)
        // Min 8 cells Manhattan distance from spawn (16 world units > ALERT_RADIUS)
        const distFromSpawn = Math.abs(x - playerCellX) + Math.abs(z - playerCellZ);
        if (
          Math.random() < theme.enemyDensity &&
          distFromSpawn >= 8
        ) {
          const type =
            theme.enemyTypes[
              Math.floor(Math.random() * theme.enemyTypes.length)
            ];
          this.spawns.push({x: x * CELL_SIZE, z: z * CELL_SIZE, type});
        }
        // Maybe spawn pickup (frequency scaled by theme.pickupDensity)
        if (Math.random() < theme.pickupDensity) {
          const type = Math.random() > 0.5 ? 'health' : 'ammo';
          this.spawns.push({
            x: (x + 1) * CELL_SIZE,
            z: (z + 1) * CELL_SIZE,
            type,
          });
        }
      } else if (wasWall) {
        // Corridor cell carving — spawn enemies along corridors
        const distFromPlayer = Math.abs(x - playerCellX) + Math.abs(z - playerCellZ);
        const corridorEnemyChance = 0.03 * (1 + (this.floor - 1) * 0.15);
        if (distFromPlayer >= 8 && Math.random() < corridorEnemyChance) {
          const type =
            theme.enemyTypes[
              Math.floor(Math.random() * theme.enemyTypes.length)
            ];
          this.spawns.push({x: x * CELL_SIZE, z: z * CELL_SIZE, type});
        }
      }

      // Move
      const dir = Math.floor(Math.random() * 4);
      if (dir === 0) {
        x = Math.max(1, x - 1);
      } else if (dir === 1) {
        x = Math.min(this.width - 2, x + 1);
      } else if (dir === 2) {
        z = Math.max(1, z - 1);
      } else if (dir === 3) {
        z = Math.min(this.depth - 2, z + 1);
      }
    }

    // Decorate walls with theme accent walls
    for (let r = 1; r < this.depth - 1; r++) {
      for (let c = 1; c < this.width - 1; c++) {
        if (
          this.grid[r][c] === (theme.primaryWall as MapCell) &&
          Math.random() > 0.8
        ) {
          const accentWalls = theme.accentWalls;
          this.grid[r][c] = accentWalls[
            Math.floor(Math.random() * accentWalls.length)
          ] as MapCell;
        }
      }
    }

    // Every 5th floor: embed boss arena and spawn archGoat
    if (this.floor % 5 === 0) {
      this.embedBossArena();
    }

    // Place door cells at natural choke points
    this.placeDoors();

    // Place weapon pickups
    this.placeWeaponPickups(playerCellX, playerCellZ);
  }

  private embedBossArena() {
    const arena = generateBossArena();
    const arenaSize = arena.length; // 15x15

    // Place arena in the center of the map
    const offsetX = Math.floor((this.width - arenaSize) / 2);
    const offsetZ = Math.floor((this.depth - arenaSize) / 2);

    for (let az = 0; az < arenaSize; az++) {
      for (let ax = 0; ax < arenaSize; ax++) {
        const gx = offsetX + ax;
        const gz = offsetZ + az;
        if (gx >= 0 && gx < this.width && gz >= 0 && gz < this.depth) {
          this.grid[gz][gx] = arena[az][ax] as MapCell;
        }
      }
    }

    // Spawn archGoat in center of arena
    const centerX = offsetX + Math.floor(arenaSize / 2);
    const centerZ = offsetZ + Math.floor(arenaSize / 2);
    this.spawns.push({
      x: centerX * CELL_SIZE,
      z: centerZ * CELL_SIZE,
      type: 'archGoat',
    });

    // Spawn extra elite enemies around the boss arena
    this.spawnBossArenaElites(offsetX, offsetZ, arenaSize);

    // Carve connectivity corridors from each arena edge outward
    this.carveArenaCorridors(offsetX, offsetZ, arenaSize);
  }

  /**
   * Carve 2-wide corridors from the center of each arena edge outward
   * until hitting an existing open cell, ensuring the boss arena is
   * reachable from the rest of the map.
   */
  private carveArenaCorridors(
    offsetX: number,
    offsetZ: number,
    arenaSize: number
  ) {
    const centerX = offsetX + Math.floor(arenaSize / 2);
    const centerZ = offsetZ + Math.floor(arenaSize / 2);

    // Define the 4 edge midpoints and their outward directions
    const edges: {startX: number; startZ: number; dx: number; dz: number}[] = [
      // Top edge (z = offsetZ), carve upward (dz = -1)
      {startX: centerX, startZ: offsetZ - 1, dx: 0, dz: -1},
      // Bottom edge (z = offsetZ + arenaSize - 1), carve downward (dz = +1)
      {startX: centerX, startZ: offsetZ + arenaSize, dx: 0, dz: 1},
      // Left edge (x = offsetX), carve left (dx = -1)
      {startX: offsetX - 1, startZ: centerZ, dx: -1, dz: 0},
      // Right edge (x = offsetX + arenaSize - 1), carve right (dx = +1)
      {startX: offsetX + arenaSize, startZ: centerZ, dx: 1, dz: 0},
    ];

    for (const edge of edges) {
      let cx = edge.startX;
      let cz = edge.startZ;

      // Also open the arena wall cell at the entry point so the corridor
      // actually connects to the interior of the arena
      const entryX = cx - edge.dx;
      const entryZ = cz - edge.dz;
      if (this.inBounds(entryX, entryZ)) {
        this.grid[entryZ][entryX] = MapCell.EMPTY;
      }
      // Second cell of the 2-wide entry
      if (edge.dx === 0) {
        // Corridor runs vertically, widen horizontally
        if (this.inBounds(entryX + 1, entryZ)) {
          this.grid[entryZ][entryX + 1] = MapCell.EMPTY;
        }
      } else {
        // Corridor runs horizontally, widen vertically
        if (this.inBounds(entryX, entryZ + 1)) {
          this.grid[entryZ + 1][entryX] = MapCell.EMPTY;
        }
      }

      // Carve outward until we hit an existing open cell or the map edge
      const maxCarve = Math.max(this.width, this.depth);
      for (let step = 0; step < maxCarve; step++) {
        if (!this.inBounds(cx, cz)) break;

        // Check if this cell (or its 2-wide neighbor) is already open
        // before we carve, meaning we've connected to the existing map
        const alreadyOpen = this.grid[cz][cx] === MapCell.EMPTY;
        const neighborAlreadyOpen = edge.dx === 0
          ? this.inBounds(cx + 1, cz) && this.grid[cz][cx + 1] === MapCell.EMPTY
          : this.inBounds(cx, cz + 1) && this.grid[cz + 1][cx] === MapCell.EMPTY;

        // Carve the 2-wide corridor
        this.grid[cz][cx] = MapCell.EMPTY;
        if (edge.dx === 0) {
          // Vertical corridor — widen along x
          if (this.inBounds(cx + 1, cz)) {
            this.grid[cz][cx + 1] = MapCell.EMPTY;
          }
        } else {
          // Horizontal corridor — widen along z
          if (this.inBounds(cx, cz + 1)) {
            this.grid[cz + 1][cx] = MapCell.EMPTY;
          }
        }

        // If the cell was already open before carving, we've connected
        if (alreadyOpen || neighborAlreadyOpen) {
          break;
        }

        cx += edge.dx;
        cz += edge.dz;
      }
    }
  }

  /**
   * Spawn extra elite enemies around the boss arena on boss floors.
   */
  private spawnBossArenaElites(
    offsetX: number,
    offsetZ: number,
    arenaSize: number
  ) {
    const theme = this.theme;
    // Place elites inside the arena near the edges
    const elitePositions: {x: number; z: number}[] = [
      {x: offsetX + 2, z: offsetZ + 2},
      {x: offsetX + arenaSize - 3, z: offsetZ + 2},
      {x: offsetX + 2, z: offsetZ + arenaSize - 3},
      {x: offsetX + arenaSize - 3, z: offsetZ + arenaSize - 3},
      {x: offsetX + Math.floor(arenaSize / 2), z: offsetZ + 2},
      {x: offsetX + Math.floor(arenaSize / 2), z: offsetZ + arenaSize - 3},
    ];

    for (const pos of elitePositions) {
      if (
        this.inBounds(pos.x, pos.z) &&
        this.grid[pos.z][pos.x] === MapCell.EMPTY
      ) {
        // Pick a strong enemy type for elite spawns
        const eliteTypes = theme.enemyTypes.filter(
          t => t !== 'goat'
        );
        const type =
          eliteTypes.length > 0
            ? eliteTypes[Math.floor(Math.random() * eliteTypes.length)]
            : theme.enemyTypes[
                Math.floor(Math.random() * theme.enemyTypes.length)
              ];
        this.spawns.push({x: pos.x * CELL_SIZE, z: pos.z * CELL_SIZE, type});
      }
    }
  }

  /**
   * Scan for narrow corridors and place DOOR cells at natural choke points.
   * A choke point is an empty cell with walls on both sides along the same axis.
   */
  private placeDoors() {
    for (let z = 1; z < this.depth - 1; z++) {
      for (let x = 1; x < this.width - 1; x++) {
        if (this.grid[z][x] !== MapCell.EMPTY) continue;

        const wallAbove = this.isWall(x, z - 1);
        const wallBelow = this.isWall(x, z + 1);
        const wallLeft = this.isWall(x - 1, z);
        const wallRight = this.isWall(x + 1, z);

        // Horizontal corridor choke: walls above and below, open left and right
        const horizontalChoke =
          wallAbove && wallBelow && !wallLeft && !wallRight;
        // Vertical corridor choke: walls left and right, open above and below
        const verticalChoke =
          wallLeft && wallRight && !wallAbove && !wallBelow;

        if ((horizontalChoke || verticalChoke) && Math.random() < 0.15) {
          this.grid[z][x] = MapCell.DOOR;
        }
      }
    }
  }

  /**
   * Place weapon pickups at random open cells far from the player spawn.
   * The player starts with hellPistol; other weapons are unlocked by floor.
   */
  private placeWeaponPickups(playerCellX: number, playerCellZ: number) {
    const weaponsByFloor: {weaponId: string; minFloor: number}[] = [
      {weaponId: 'brimShotgun', minFloor: 1},
      {weaponId: 'hellfireCannon', minFloor: 2},
      {weaponId: 'goatsBane', minFloor: 3},
    ];

    // Collect all open cells at least 10 cells away from player spawn
    const candidates: {x: number; z: number}[] = [];
    for (let z = 1; z < this.depth - 1; z++) {
      for (let x = 1; x < this.width - 1; x++) {
        if (this.grid[z][x] !== MapCell.EMPTY) continue;
        const dist = Math.abs(x - playerCellX) + Math.abs(z - playerCellZ);
        if (dist >= 10) {
          candidates.push({x, z});
        }
      }
    }

    // Shuffle candidates using Fisher-Yates
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    // Place each eligible weapon once, picking from shuffled candidates
    let placed = 0;
    for (const weapon of weaponsByFloor) {
      if (this.floor < weapon.minFloor) continue;
      if (placed >= candidates.length) break;

      const cell = candidates[placed];
      this.spawns.push({
        x: cell.x * CELL_SIZE,
        z: cell.z * CELL_SIZE,
        type: 'weaponPickup',
        weaponId: weapon.weaponId,
      });
      placed++;
    }
  }

  private inBounds(x: number, z: number): boolean {
    return x >= 0 && x < this.width && z >= 0 && z < this.depth;
  }

  private isWall(x: number, z: number): boolean {
    if (!this.inBounds(x, z)) return true;
    const cell = this.grid[z][x];
    return (
      cell === MapCell.WALL_STONE ||
      cell === MapCell.WALL_FLESH ||
      cell === MapCell.WALL_LAVA ||
      cell === MapCell.WALL_OBSIDIAN
    );
  }
}
