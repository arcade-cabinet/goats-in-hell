import { CELL_SIZE, WALL_HEIGHT } from '../../constants';
import { useGameStore } from '../../state/GameStore';
import type { Vec3 } from '../entities/components';
import { vec3, vec3Zero } from '../entities/vec3';
import { generateBossArena } from './BossArenas';
import { type FloorTheme, getThemeForFloor } from './FloorThemes';

// Re-export from constants for consumers that import from this module
export { CELL_SIZE, WALL_HEIGHT };

/** Shorthand for the store's seeded PRNG — deterministic per-seed. */
function rng(): number {
  return useGameStore.getState().rng();
}

export enum MapCell {
  EMPTY = 0,
  WALL_STONE = 1,
  WALL_FLESH = 2,
  WALL_LAVA = 3,
  WALL_OBSIDIAN = 4,
  DOOR = 5,
  FLOOR_LAVA = 6,
  FLOOR_RAISED = 7, // Elevated platform floor
  RAMP = 8, // Connects ground to raised platform
  WALL_SECRET = 9, // Looks like normal wall but can be opened
  FLOOR_VOID = 10, // Void pit — instant death for anything that falls in
}

export type SpawnData = {
  x: number;
  z: number;
  type: string;
  weaponId?: string;
  rotation?: number;
  elevation?: number;
};

/** Room data from BSP generation. */
interface BspRoom {
  x: number;
  z: number;
  w: number;
  h: number;
  elevation: number; // 0 = ground level, 1 = raised platform (Y + PLATFORM_HEIGHT)
}

/** Height of raised platforms in world units. */
export const PLATFORM_HEIGHT = 2;

/** MapCell values for multi-height geometry. */

export class LevelGenerator {
  width: number;
  depth: number;
  floor: number;
  theme: FloorTheme;
  grid: MapCell[][] = [];
  spawns: SpawnData[] = [];
  playerSpawn: Vec3 = vec3Zero();

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

  // ---------------------------------------------------------------------------
  // BSP Dungeon Generation
  // ---------------------------------------------------------------------------

  generate() {
    const theme = this.theme;

    // BSP dungeon generation: partition → rooms → corridors → populate
    const rooms = this.bspGenerate();

    // Pick the room closest to center as the player spawn room
    const centerX = Math.floor(this.width / 2);
    const centerZ = Math.floor(this.depth / 2);
    let spawnRoom = rooms[0];
    let bestDist = Infinity;
    for (const room of rooms) {
      const rx = room.x + Math.floor(room.w / 2);
      const rz = room.z + Math.floor(room.h / 2);
      const d = Math.abs(rx - centerX) + Math.abs(rz - centerZ);
      if (d < bestDist) {
        bestDist = d;
        spawnRoom = room;
      }
    }
    // Force spawn room to ground level
    if (spawnRoom.elevation !== 0) {
      spawnRoom.elevation = 0;
      for (let rz = spawnRoom.z; rz < spawnRoom.z + spawnRoom.h; rz++) {
        for (let rx = spawnRoom.x; rx < spawnRoom.x + spawnRoom.w; rx++) {
          if (this.inBounds(rx, rz)) this.grid[rz][rx] = MapCell.EMPTY;
        }
      }
    }
    const playerCellX = spawnRoom.x + Math.floor(spawnRoom.w / 2);
    const playerCellZ = spawnRoom.z + Math.floor(spawnRoom.h / 2);
    this.playerSpawn = vec3(playerCellX * CELL_SIZE, 1, playerCellZ * CELL_SIZE);

    // Populate rooms with enemies and pickups.
    // Sort rooms by descending distance from spawn so the furthest rooms are
    // populated first — guarantees at least one room gets enemies even when
    // BSP generates tightly-clustered rooms.
    const sortedRooms = rooms
      .map((room) => {
        const cx = room.x + Math.floor(room.w / 2);
        const cz = room.z + Math.floor(room.h / 2);
        const dist = Math.abs(cx - playerCellX) + Math.abs(cz - playerCellZ);
        return { room, dist };
      })
      .sort((a, b) => b.dist - a.dist);

    let totalEnemiesSpawned = 0;

    for (const { room, dist: distFromSpawn } of sortedRooms) {
      // Skip the spawn room (distance < 3 grid cells from player start).
      // Reduced from 5 to 3 so small maps still get enemy rooms.
      if (distFromSpawn < 3) continue;

      // Enemies: scale count by room area, floor, and theme density
      const roomArea = room.w * room.h;
      const baseEnemies = Math.max(1, Math.floor(roomArea / 12));
      const floorScale = 1 + (this.floor - 1) * 0.1;
      const enemyCount = Math.floor(baseEnemies * theme.enemyDensity * floorScale);

      for (let e = 0; e < enemyCount; e++) {
        const ex = room.x + 1 + Math.floor(rng() * Math.max(1, room.w - 2));
        const ez = room.z + 1 + Math.floor(rng() * Math.max(1, room.h - 2));
        if (this.grid[ez]?.[ex] !== MapCell.EMPTY) continue;
        const type = theme.enemyTypes[Math.floor(rng() * theme.enemyTypes.length)];
        this.spawns.push({ x: ex * CELL_SIZE, z: ez * CELL_SIZE, type });
        totalEnemiesSpawned++;
      }

      // Pickups: ammo and health
      if (rng() < theme.pickupDensity) {
        const px = room.x + 1 + Math.floor(rng() * Math.max(1, room.w - 2));
        const pz = room.z + 1 + Math.floor(rng() * Math.max(1, room.h - 2));
        if (this.grid[pz]?.[px] === MapCell.EMPTY) {
          this.spawns.push({
            x: px * CELL_SIZE,
            z: pz * CELL_SIZE,
            type: rng() > 0.5 ? 'health' : 'ammo',
          });
        }
      }
    }

    // Safety net: if no enemies were spawned (all rooms too close to spawn),
    // force-spawn at least 2 enemies in the room furthest from the player.
    if (totalEnemiesSpawned === 0 && sortedRooms.length > 0) {
      const furthestRoom = sortedRooms[0].room;
      for (let e = 0; e < 2; e++) {
        const ex = furthestRoom.x + 1 + Math.floor(rng() * Math.max(1, furthestRoom.w - 2));
        const ez = furthestRoom.z + 1 + Math.floor(rng() * Math.max(1, furthestRoom.h - 2));
        // Validate the cell is walkable (EMPTY) before spawning
        if (this.grid[ez]?.[ex] !== MapCell.EMPTY) continue;
        const type = theme.enemyTypes[Math.floor(rng() * theme.enemyTypes.length)];
        this.spawns.push({ x: ex * CELL_SIZE, z: ez * CELL_SIZE, type });
      }
    }

    // Decorate walls with theme accent walls
    for (let r = 1; r < this.depth - 1; r++) {
      for (let c = 1; c < this.width - 1; c++) {
        if (this.grid[r][c] === (theme.primaryWall as MapCell) && rng() > 0.8) {
          const accentWalls = theme.accentWalls;
          this.grid[r][c] = accentWalls[Math.floor(rng() * accentWalls.length)] as MapCell;
        }
      }
    }

    // Scatter lava floor hazards in fire-themed areas
    if (theme.accentWalls.includes(MapCell.WALL_LAVA) || theme.primaryWall === MapCell.WALL_LAVA) {
      const lavaChance = theme.name === 'firePits' ? 0.08 : 0.04;
      for (let rz = 1; rz < this.depth - 1; rz++) {
        for (let rx = 1; rx < this.width - 1; rx++) {
          if (this.grid[rz][rx] !== MapCell.EMPTY) continue;
          const distFromSpawn = Math.abs(rx - playerCellX) + Math.abs(rz - playerCellZ);
          if (distFromSpawn < 5) continue;
          if (rng() < lavaChance) {
            this.grid[rz][rx] = MapCell.FLOOR_LAVA;
          }
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

    // Place power-up pickups (rare: ~40% chance per floor, starting floor 2)
    this.placePowerUps(playerCellX, playerCellZ);

    // Place decorative props
    this.placeProps(playerCellX, playerCellZ);

    // Place lore messages on walls
    this.placeLoreMessages(playerCellX, playerCellZ);

    // Place environmental hazards
    this.placeHazards(playerCellX, playerCellZ);

    // Place secret treasure rooms
    this.placeSecretRooms(playerCellX, playerCellZ);

    // Place void pits (theVoid biome only)
    this.placeVoidPits(playerCellX, playerCellZ);
  }

  // ---------------------------------------------------------------------------
  // BSP Tree: recursive space partitioning into rooms
  // ---------------------------------------------------------------------------

  private bspGenerate(): BspRoom[] {
    const MIN_PARTITION = 8; // Minimum partition size before we stop splitting
    const MIN_ROOM = 4; // Minimum room dimension
    const ROOM_PADDING = 1; // Wall gap between room edge and partition edge

    interface Partition {
      x: number;
      z: number;
      w: number;
      h: number;
      left?: Partition;
      right?: Partition;
      room?: BspRoom;
    }

    const root: Partition = { x: 1, z: 1, w: this.width - 2, h: this.depth - 2 };
    const leaves: Partition[] = [];

    // Recursive split
    const split = (node: Partition, depth: number) => {
      // Stop splitting if too small or random chance at deeper levels
      if (node.w < MIN_PARTITION * 2 && node.h < MIN_PARTITION * 2) {
        leaves.push(node);
        return;
      }
      if (depth > 5 && rng() < 0.3) {
        leaves.push(node);
        return;
      }

      // Decide split direction: prefer splitting the longer axis
      let splitH: boolean;
      if (node.w > node.h * 1.3) {
        splitH = false; // Split vertically (along x)
      } else if (node.h > node.w * 1.3) {
        splitH = true; // Split horizontally (along z)
      } else {
        splitH = rng() < 0.5;
      }

      if (splitH) {
        // Horizontal split: divide along z axis
        if (node.h < MIN_PARTITION * 2) {
          leaves.push(node);
          return;
        }
        const splitZ = MIN_PARTITION + Math.floor(rng() * (node.h - MIN_PARTITION * 2 + 1));
        node.left = { x: node.x, z: node.z, w: node.w, h: splitZ };
        node.right = { x: node.x, z: node.z + splitZ, w: node.w, h: node.h - splitZ };
      } else {
        // Vertical split: divide along x axis
        if (node.w < MIN_PARTITION * 2) {
          leaves.push(node);
          return;
        }
        const splitX = MIN_PARTITION + Math.floor(rng() * (node.w - MIN_PARTITION * 2 + 1));
        node.left = { x: node.x, z: node.z, w: splitX, h: node.h };
        node.right = { x: node.x + splitX, z: node.z, w: node.w - splitX, h: node.h };
      }

      split(node.left!, depth + 1);
      split(node.right!, depth + 1);
    };

    split(root, 0);

    // Place rooms inside each leaf partition
    const rooms: BspRoom[] = [];
    for (const leaf of leaves) {
      const maxW = leaf.w - ROOM_PADDING * 2;
      const maxH = leaf.h - ROOM_PADDING * 2;
      if (maxW < MIN_ROOM || maxH < MIN_ROOM) continue;

      const roomW = MIN_ROOM + Math.floor(rng() * (maxW - MIN_ROOM + 1));
      const roomH = MIN_ROOM + Math.floor(rng() * (maxH - MIN_ROOM + 1));
      const roomX = leaf.x + ROOM_PADDING + Math.floor(rng() * (maxW - roomW + 1));
      const roomZ = leaf.z + ROOM_PADDING + Math.floor(rng() * (maxH - roomH + 1));

      // ~30% of rooms are elevated platforms (not on floor 1 — ease player in)
      const isRaised = this.floor > 1 && rng() < 0.3;
      const room: BspRoom = { x: roomX, z: roomZ, w: roomW, h: roomH, elevation: isRaised ? 1 : 0 };
      leaf.room = room;
      rooms.push(room);

      // Carve room into grid
      const cellType = isRaised ? MapCell.FLOOR_RAISED : MapCell.EMPTY;
      for (let rz = roomZ; rz < roomZ + roomH; rz++) {
        for (let rx = roomX; rx < roomX + roomW; rx++) {
          if (this.inBounds(rx, rz)) {
            this.grid[rz][rx] = cellType;
          }
        }
      }
    }

    // Connect rooms: walk up the BSP tree, connecting sibling partitions
    const getRoom = (node: Partition): BspRoom | null => {
      if (node.room) return node.room;
      if (node.left) return getRoom(node.left);
      if (node.right) return getRoom(node.right);
      return null;
    };

    const connect = (node: Partition) => {
      if (!node.left || !node.right) return;
      connect(node.left);
      connect(node.right);

      const roomA = getRoom(node.left);
      const roomB = getRoom(node.right);
      if (roomA && roomB) {
        this.carveCorridor(roomA, roomB);
      }
    };

    connect(root);

    return rooms;
  }

  /**
   * Carve an L-shaped corridor between the centers of two rooms.
   * The corridor is 2 cells wide for comfortable FPS movement.
   * When connecting rooms at different elevations, place RAMP cells
   * at the transition point for the player to walk/jump up.
   */
  private carveCorridor(a: BspRoom, b: BspRoom): void {
    const ax = a.x + Math.floor(a.w / 2);
    const az = a.z + Math.floor(a.h / 2);
    const bx = b.x + Math.floor(b.w / 2);
    const bz = b.z + Math.floor(b.h / 2);
    const needsRamp = a.elevation !== b.elevation;

    // Randomly choose L-bend direction
    const horizontalFirst = rng() < 0.5;

    if (horizontalFirst) {
      this.carveHLine(ax, bx, az);
      this.carveVLine(az, bz, bx);
    } else {
      this.carveVLine(az, bz, ax);
      this.carveHLine(ax, bx, bz);
    }

    // Place ramp cells at the midpoint of the corridor if elevation changes
    if (needsRamp) {
      const midX = Math.floor((ax + bx) / 2);
      const midZ = Math.floor((az + bz) / 2);
      // 3-cell ramp section
      for (let dz = -1; dz <= 1; dz++) {
        for (let dx = -1; dx <= 1; dx++) {
          const rx = midX + dx;
          const rz = midZ + dz;
          if (this.inBounds(rx, rz) && this.grid[rz][rx] !== (this.theme.primaryWall as MapCell)) {
            this.grid[rz][rx] = MapCell.RAMP;
          }
        }
      }
    }
  }

  /** Carve a 2-wide horizontal corridor segment. */
  private carveHLine(x1: number, x2: number, z: number): void {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    for (let x = minX; x <= maxX; x++) {
      if (this.inBounds(x, z)) this.grid[z][x] = MapCell.EMPTY;
      if (this.inBounds(x, z + 1)) this.grid[z + 1][x] = MapCell.EMPTY;
    }
  }

  /** Carve a 2-wide vertical corridor segment. */
  private carveVLine(z1: number, z2: number, x: number): void {
    const minZ = Math.min(z1, z2);
    const maxZ = Math.max(z1, z2);
    for (let z = minZ; z <= maxZ; z++) {
      if (this.inBounds(x, z)) this.grid[z][x] = MapCell.EMPTY;
      if (this.inBounds(x + 1, z)) this.grid[z][x + 1] = MapCell.EMPTY;
    }
  }

  // ---------------------------------------------------------------------------
  // Environmental Hazards
  // ---------------------------------------------------------------------------

  /**
   * Place spike traps and explosive barrels throughout the dungeon.
   * Spikes appear in corridors, barrels appear in rooms.
   */
  private placeHazards(playerCellX: number, playerCellZ: number) {
    const spikeChance = 0.02 + this.floor * 0.003;
    const barrelChance = 0.015 + this.floor * 0.002;

    for (let z = 2; z < this.depth - 2; z++) {
      for (let x = 2; x < this.width - 2; x++) {
        if (this.grid[z][x] !== MapCell.EMPTY) continue;
        const distFromSpawn = Math.abs(x - playerCellX) + Math.abs(z - playerCellZ);
        if (distFromSpawn < 8) continue;

        const wallNeighbors =
          (this.isWall(x - 1, z) ? 1 : 0) +
          (this.isWall(x + 1, z) ? 1 : 0) +
          (this.isWall(x, z - 1) ? 1 : 0) +
          (this.isWall(x, z + 1) ? 1 : 0);

        // Spike traps: prefer corridor cells (exactly 2 opposing walls)
        if (wallNeighbors === 2 && rng() < spikeChance) {
          this.spawns.push({
            x: x * CELL_SIZE,
            z: z * CELL_SIZE,
            type: 'hazard_spikes',
          });
          continue;
        }

        // Explosive barrels: prefer open room cells (0-1 walls)
        if (wallNeighbors <= 1 && rng() < barrelChance) {
          this.spawns.push({
            x: x * CELL_SIZE,
            z: z * CELL_SIZE,
            type: 'hazard_barrel',
            rotation: rng() * Math.PI * 2,
          });
        }
      }
    }
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
  private carveArenaCorridors(offsetX: number, offsetZ: number, arenaSize: number) {
    const centerX = offsetX + Math.floor(arenaSize / 2);
    const centerZ = offsetZ + Math.floor(arenaSize / 2);

    // Define the 4 edge midpoints and their outward directions
    const edges: { startX: number; startZ: number; dx: number; dz: number }[] = [
      // Top edge (z = offsetZ), carve upward (dz = -1)
      { startX: centerX, startZ: offsetZ - 1, dx: 0, dz: -1 },
      // Bottom edge (z = offsetZ + arenaSize - 1), carve downward (dz = +1)
      { startX: centerX, startZ: offsetZ + arenaSize, dx: 0, dz: 1 },
      // Left edge (x = offsetX), carve left (dx = -1)
      { startX: offsetX - 1, startZ: centerZ, dx: -1, dz: 0 },
      // Right edge (x = offsetX + arenaSize - 1), carve right (dx = +1)
      { startX: offsetX + arenaSize, startZ: centerZ, dx: 1, dz: 0 },
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
        const neighborAlreadyOpen =
          edge.dx === 0
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
  private spawnBossArenaElites(offsetX: number, offsetZ: number, arenaSize: number) {
    const theme = this.theme;
    // Place elites inside the arena near the edges
    const elitePositions: { x: number; z: number }[] = [
      { x: offsetX + 2, z: offsetZ + 2 },
      { x: offsetX + arenaSize - 3, z: offsetZ + 2 },
      { x: offsetX + 2, z: offsetZ + arenaSize - 3 },
      { x: offsetX + arenaSize - 3, z: offsetZ + arenaSize - 3 },
      { x: offsetX + Math.floor(arenaSize / 2), z: offsetZ + 2 },
      { x: offsetX + Math.floor(arenaSize / 2), z: offsetZ + arenaSize - 3 },
    ];

    for (const pos of elitePositions) {
      if (this.inBounds(pos.x, pos.z) && this.grid[pos.z][pos.x] === MapCell.EMPTY) {
        // Pick a strong enemy type for elite spawns
        const eliteTypes = theme.enemyTypes.filter((t) => t !== 'goat');
        const type =
          eliteTypes.length > 0
            ? eliteTypes[Math.floor(rng() * eliteTypes.length)]
            : theme.enemyTypes[Math.floor(rng() * theme.enemyTypes.length)];
        this.spawns.push({ x: pos.x * CELL_SIZE, z: pos.z * CELL_SIZE, type });
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
        const horizontalChoke = wallAbove && wallBelow && !wallLeft && !wallRight;
        // Vertical corridor choke: walls left and right, open above and below
        const verticalChoke = wallLeft && wallRight && !wallAbove && !wallBelow;

        if ((horizontalChoke || verticalChoke) && rng() < 0.15) {
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
    const weaponsByFloor: { weaponId: string; minFloor: number }[] = [
      { weaponId: 'brimShotgun', minFloor: 1 },
      { weaponId: 'hellfireCannon', minFloor: 2 },
      { weaponId: 'goatsBane', minFloor: 3 },
    ];

    // Collect all open cells at least 10 cells away from player spawn
    const candidates: { x: number; z: number }[] = [];
    for (let z = 1; z < this.depth - 1; z++) {
      for (let x = 1; x < this.width - 1; x++) {
        if (this.grid[z][x] !== MapCell.EMPTY) continue;
        const dist = Math.abs(x - playerCellX) + Math.abs(z - playerCellZ);
        if (dist >= 10) {
          candidates.push({ x, z });
        }
      }
    }

    // Shuffle candidates using Fisher-Yates
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
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

  /**
   * Place a single power-up pickup on the map (rare).
   * Only spawns from floor 2+, with a 40% chance per floor.
   */
  private placePowerUps(playerCellX: number, playerCellZ: number) {
    if (this.floor < 2) return;
    if (rng() > 0.4) return; // 40% chance

    // Find open cells far from player
    const candidates: { x: number; z: number }[] = [];
    for (let z = 1; z < this.depth - 1; z++) {
      for (let x = 1; x < this.width - 1; x++) {
        if (this.grid[z][x] !== MapCell.EMPTY) continue;
        const dist = Math.abs(x - playerCellX) + Math.abs(z - playerCellZ);
        if (dist >= 8) {
          candidates.push({ x, z });
        }
      }
    }

    if (candidates.length === 0) return;
    const cell = candidates[Math.floor(rng() * candidates.length)];

    this.spawns.push({
      x: cell.x * CELL_SIZE,
      z: cell.z * CELL_SIZE,
      type: 'powerup',
    });
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
      cell === MapCell.WALL_OBSIDIAN ||
      cell === MapCell.WALL_SECRET
    );
  }

  /** Check if a cell is walkable (any non-wall). */
  static isWalkable(cell: MapCell): boolean {
    return (
      cell === MapCell.EMPTY ||
      cell === MapCell.DOOR ||
      cell === MapCell.FLOOR_LAVA ||
      cell === MapCell.FLOOR_RAISED ||
      cell === MapCell.RAMP ||
      cell === MapCell.FLOOR_VOID
    );
  }

  /**
   * Get the floor elevation at a grid cell.
   * Ground=0, Raised=PLATFORM_HEIGHT, Ramp=half.
   */
  static getElevation(cell: MapCell): number {
    if (cell === MapCell.FLOOR_RAISED) return PLATFORM_HEIGHT;
    if (cell === MapCell.RAMP) return PLATFORM_HEIGHT * 0.5;
    return 0;
  }

  /**
   * Place decorative prop spawn points based on cell adjacency to walls.
   * Prop density varies by floor theme.
   */
  private placeProps(playerCellX: number, playerCellZ: number) {
    const theme = this.theme;
    const isFireTheme = theme.name === 'firePits';
    const isFleshTheme = theme.name === 'fleshCaverns';

    // Base chances per category
    const wallPropChance = isFireTheme ? 0.15 : isFleshTheme ? 0.08 : 0.1;
    const cornerPropChance = 0.15;
    const scatterChance = 0.02;

    for (let z = 1; z < this.depth - 1; z++) {
      for (let x = 1; x < this.width - 1; x++) {
        if (this.grid[z][x] !== MapCell.EMPTY) continue;

        // Skip cells near player spawn (5 cell radius)
        const distFromSpawn = Math.abs(x - playerCellX) + Math.abs(z - playerCellZ);
        if (distFromSpawn < 5) continue;

        const wallNeighbors =
          (this.isWall(x - 1, z) ? 1 : 0) +
          (this.isWall(x + 1, z) ? 1 : 0) +
          (this.isWall(x, z - 1) ? 1 : 0) +
          (this.isWall(x, z + 1) ? 1 : 0);
        const rotation = rng() * Math.PI * 2;

        // Wall-adjacent cells: fire-baskets or candles
        if (wallNeighbors === 1 && rng() < wallPropChance) {
          const type = isFireTheme
            ? rng() > 0.4
              ? 'prop_firebasket'
              : 'prop_candle'
            : rng() > 0.6
              ? 'prop_candle_multi'
              : 'prop_candle';
          this.spawns.push({
            x: x * CELL_SIZE,
            z: z * CELL_SIZE,
            type,
            rotation,
          });
          continue;
        }

        // Corner cells (2+ wall neighbors): coffins or columns
        if (wallNeighbors >= 2 && rng() < cornerPropChance) {
          const type = rng() > 0.5 ? 'prop_coffin' : 'prop_column';
          this.spawns.push({
            x: x * CELL_SIZE,
            z: z * CELL_SIZE,
            type,
            rotation,
          });
          continue;
        }

        // Scattered floor decoration far from spawn
        if (distFromSpawn >= 10 && rng() < scatterChance) {
          const type = rng() > 0.5 ? 'prop_chalice' : 'prop_bowl';
          this.spawns.push({
            x: x * CELL_SIZE,
            z: z * CELL_SIZE,
            type,
            rotation,
          });
        }
      }
    }
  }

  /**
   * Place 0-2 secret rooms per floor. A secret room is a small 3x3 space
   * carved behind a wall, connected to the dungeon by a single WALL_SECRET
   * cell. Contains guaranteed rare loot.
   */
  private placeSecretRooms(playerCellX: number, playerCellZ: number) {
    if (this.floor < 2) return; // No secrets on floor 1

    // 0-2 secret rooms per floor
    const count = rng() < 0.4 ? 2 : rng() < 0.6 ? 1 : 0;
    if (count === 0) return;

    // Find candidate positions: wall cells adjacent to an empty corridor cell
    // with enough space behind the wall for a 3x3 room
    interface SecretCandidate {
      wallX: number;
      wallZ: number;
      roomCenterX: number;
      roomCenterZ: number;
      direction: 'n' | 's' | 'e' | 'w';
    }

    const candidates: SecretCandidate[] = [];

    for (let z = 4; z < this.depth - 4; z++) {
      for (let x = 4; x < this.width - 4; x++) {
        if (!this.isWall(x, z)) continue;

        const distFromSpawn = Math.abs(x - playerCellX) + Math.abs(z - playerCellZ);
        if (distFromSpawn < 8) continue;

        // Check each direction: wall cell has open corridor on one side
        // and enough solid wall behind it for a 3x3 room
        const dirs: { dx: number; dz: number; dir: SecretCandidate['direction'] }[] = [
          { dx: 0, dz: -1, dir: 'n' }, // corridor to the north, room to the south
          { dx: 0, dz: 1, dir: 's' },
          { dx: -1, dz: 0, dir: 'w' },
          { dx: 1, dz: 0, dir: 'e' },
        ];

        for (const { dx, dz, dir } of dirs) {
          // Corridor cell adjacent to the wall
          const corridorX = x + dx;
          const corridorZ = z + dz;
          if (!this.inBounds(corridorX, corridorZ)) continue;
          if (this.grid[corridorZ][corridorX] !== MapCell.EMPTY) continue;

          // Room center is 2 cells behind the wall (opposite direction from corridor)
          const roomCenterX = x - dx * 2;
          const roomCenterZ = z - dz * 2;

          // Check if 3x3 area behind is all solid wall
          let canPlace = true;
          for (let rz = -1; rz <= 1; rz++) {
            for (let rx = -1; rx <= 1; rx++) {
              const cx = roomCenterX + rx;
              const cz = roomCenterZ + rz;
              if (!this.inBounds(cx, cz) || !this.isWall(cx, cz)) {
                canPlace = false;
                break;
              }
            }
            if (!canPlace) break;
          }

          if (canPlace) {
            candidates.push({ wallX: x, wallZ: z, roomCenterX, roomCenterZ, direction: dir });
          }
        }
      }
    }

    // Shuffle and pick
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    let placed = 0;
    for (const c of candidates) {
      if (placed >= count) break;

      // Carve 3x3 room
      for (let rz = -1; rz <= 1; rz++) {
        for (let rx = -1; rx <= 1; rx++) {
          this.grid[c.roomCenterZ + rz][c.roomCenterX + rx] = MapCell.EMPTY;
        }
      }

      // Place secret wall at the connection point
      this.grid[c.wallZ][c.wallX] = MapCell.WALL_SECRET;

      // Also carve the cell between wall and room center (the "throat")
      const throatX =
        c.wallX + (c.roomCenterX - c.wallX > 0 ? 1 : c.roomCenterX - c.wallX < 0 ? -1 : 0);
      const throatZ =
        c.wallZ + (c.roomCenterZ - c.wallZ > 0 ? 1 : c.roomCenterZ - c.wallZ < 0 ? -1 : 0);
      if (this.inBounds(throatX, throatZ)) {
        this.grid[throatZ][throatX] = MapCell.EMPTY;
      }

      // Spawn rare loot in the room center
      const lootTypes = ['weaponPickup', 'powerup', 'ammo', 'health'];
      const lootType = lootTypes[Math.floor(rng() * lootTypes.length)];

      if (lootType === 'weaponPickup') {
        const weaponIds = ['brimShotgun', 'hellfireCannon', 'goatsBane'];
        this.spawns.push({
          x: c.roomCenterX * CELL_SIZE,
          z: c.roomCenterZ * CELL_SIZE,
          type: 'weaponPickup',
          weaponId: weaponIds[Math.floor(rng() * weaponIds.length)],
        });
      } else if (lootType === 'powerup') {
        this.spawns.push({
          x: c.roomCenterX * CELL_SIZE,
          z: c.roomCenterZ * CELL_SIZE,
          type: 'powerup',
        });
      } else {
        // Generous ammo + health combo
        this.spawns.push({
          x: (c.roomCenterX - 1) * CELL_SIZE,
          z: c.roomCenterZ * CELL_SIZE,
          type: 'ammo',
        });
        this.spawns.push({
          x: (c.roomCenterX + 1) * CELL_SIZE,
          z: c.roomCenterZ * CELL_SIZE,
          type: 'health',
        });
      }

      placed++;
    }
  }

  /**
   * Place void pits in theVoid biome. Pits are 1x1 empty floor cells
   * that act as instant kill zones. Only placed in open room cells
   * far from the player and corridors.
   */
  private placeVoidPits(playerCellX: number, playerCellZ: number) {
    if (this.theme.name !== 'theVoid') return;

    const pitChance = 0.04 + this.floor * 0.002; // increases with floor

    for (let z = 3; z < this.depth - 3; z++) {
      for (let x = 3; x < this.width - 3; x++) {
        if (this.grid[z][x] !== MapCell.EMPTY) continue;

        const distFromSpawn = Math.abs(x - playerCellX) + Math.abs(z - playerCellZ);
        if (distFromSpawn < 8) continue;

        // Only place in open areas (0-1 wall neighbors) to avoid blocking corridors
        const wallNeighbors =
          (this.isWall(x - 1, z) ? 1 : 0) +
          (this.isWall(x + 1, z) ? 1 : 0) +
          (this.isWall(x, z - 1) ? 1 : 0) +
          (this.isWall(x, z + 1) ? 1 : 0);
        if (wallNeighbors > 1) continue;

        // Don't place adjacent to other void pits (prevents impassable clusters)
        const hasAdjacentPit =
          (this.inBounds(x - 1, z) && this.grid[z][x - 1] === MapCell.FLOOR_VOID) ||
          (this.inBounds(x + 1, z) && this.grid[z][x + 1] === MapCell.FLOOR_VOID) ||
          (this.inBounds(x, z - 1) && this.grid[z - 1][x] === MapCell.FLOOR_VOID) ||
          (this.inBounds(x, z + 1) && this.grid[z + 1][x] === MapCell.FLOOR_VOID);
        if (hasAdjacentPit) continue;

        if (rng() < pitChance) {
          this.grid[z][x] = MapCell.FLOOR_VOID;
        }
      }
    }
  }

  private placeLoreMessages(playerCellX: number, playerCellZ: number) {
    // 1-3 lore messages per floor, starting floor 2
    if (this.floor < 2) return;
    const count = 1 + Math.floor(rng() * 3);
    let placed = 0;
    const candidates: { x: number; z: number; rotation: number }[] = [];

    // Find wall-adjacent empty cells where a plaque could hang
    for (let z = 2; z < this.depth - 2; z++) {
      for (let x = 2; x < this.width - 2; x++) {
        if (this.grid[z][x] !== MapCell.EMPTY) continue;
        const distFromSpawn = Math.abs(x - playerCellX) + Math.abs(z - playerCellZ);
        if (distFromSpawn < 6) continue;

        // Check each wall neighbor — pick one direction the text faces away from
        if (this.isWall(x, z - 1))
          candidates.push({ x, z, rotation: 0 }); // faces +Z
        else if (this.isWall(x, z + 1))
          candidates.push({ x, z, rotation: Math.PI }); // faces -Z
        else if (this.isWall(x - 1, z))
          candidates.push({ x, z, rotation: Math.PI / 2 }); // faces +X
        else if (this.isWall(x + 1, z)) candidates.push({ x, z, rotation: -Math.PI / 2 }); // faces -X
      }
    }

    // Shuffle and pick
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    for (const c of candidates) {
      if (placed >= count) break;
      this.spawns.push({
        x: c.x * CELL_SIZE,
        z: c.z * CELL_SIZE,
        type: 'lore_message',
        rotation: c.rotation,
      });
      placed++;
    }
  }
}
