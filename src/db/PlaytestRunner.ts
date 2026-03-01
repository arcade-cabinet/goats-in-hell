/**
 * Headless level playtest simulation.
 *
 * Validates that a generated level is completable by running a simple AI agent
 * through it using pure grid-based movement and A* pathfinding.
 * No Three.js, Rapier, or React — just math on the MapCell grid.
 */
import { CELL_SIZE } from '../constants';
import type { LevelData } from '../game/levels/LevelData';
import { LevelGenerator, type MapCell } from '../game/levels/LevelGenerator';
import type { Room } from './schema';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PlaytestResult {
  passed: boolean;
  duration: number; // simulated seconds
  roomsVisited: string[];
  roomsTotal: number;
  enemiesKilled: number;
  enemiesTotal: number;
  softlocks: string[]; // "Player stuck at (12, 8) for 15s"
  unreachableRooms: string[];
  diagnostics: string[];
}

interface AgentState {
  x: number; // grid X
  z: number; // grid Z
  hp: number;
  speed: number; // cells per second
  targetRoom: number | null;
  targetEnemy: number | null; // index into enemySpawns, used after all rooms visited
}

interface GridPos {
  x: number;
  z: number;
}

// ---------------------------------------------------------------------------
// Enemy type detection
// ---------------------------------------------------------------------------

const ENEMY_TYPES = new Set([
  'goat',
  'hellgoat',
  'fireGoat',
  'shadowGoat',
  'goatKnight',
  'archGoat',
]);

// ---------------------------------------------------------------------------
// A* pathfinding (4-directional, Manhattan heuristic)
// ---------------------------------------------------------------------------

function astar(
  grid: MapCell[][],
  start: GridPos,
  goal: GridPos,
  width: number,
  depth: number,
): GridPos[] | null {
  const key = (x: number, z: number) => z * width + x;

  const gScore = new Map<number, number>();
  const fScore = new Map<number, number>();
  const cameFrom = new Map<number, number>();

  const startKey = key(start.x, start.z);
  const goalKey = key(goal.x, goal.z);

  gScore.set(startKey, 0);
  fScore.set(startKey, Math.abs(goal.x - start.x) + Math.abs(goal.z - start.z));

  // Simple priority queue (array sorted on insert — fine for dungeon-sized grids)
  const open: number[] = [startKey];
  const closed = new Set<number>();

  const dirs: GridPos[] = [
    { x: 0, z: -1 },
    { x: 0, z: 1 },
    { x: -1, z: 0 },
    { x: 1, z: 0 },
  ];

  while (open.length > 0) {
    // Pick node with lowest fScore
    let bestIdx = 0;
    let bestF = fScore.get(open[0]) ?? Infinity;
    for (let i = 1; i < open.length; i++) {
      const f = fScore.get(open[i]) ?? Infinity;
      if (f < bestF) {
        bestF = f;
        bestIdx = i;
      }
    }
    const currentKey = open[bestIdx];
    open.splice(bestIdx, 1);

    if (currentKey === goalKey) {
      // Reconstruct path
      const path: GridPos[] = [];
      let k = goalKey;
      while (k !== startKey) {
        path.push({ x: k % width, z: Math.floor(k / width) });
        const prev = cameFrom.get(k);
        if (prev === undefined) break;
        k = prev;
      }
      path.reverse();
      return path;
    }

    closed.add(currentKey);

    const cx = currentKey % width;
    const cz = Math.floor(currentKey / width);
    const currentG = gScore.get(currentKey) ?? Infinity;

    for (const d of dirs) {
      const nx = cx + d.x;
      const nz = cz + d.z;
      if (nx < 0 || nx >= width || nz < 0 || nz >= depth) continue;
      if (!LevelGenerator.isWalkable(grid[nz][nx])) continue;

      const nk = key(nx, nz);
      if (closed.has(nk)) continue;

      const tentativeG = currentG + 1;
      if (tentativeG < (gScore.get(nk) ?? Infinity)) {
        cameFrom.set(nk, currentKey);
        gScore.set(nk, tentativeG);
        fScore.set(nk, tentativeG + Math.abs(goal.x - nx) + Math.abs(goal.z - nz));
        if (!open.includes(nk)) {
          open.push(nk);
        }
      }
    }
  }

  return null; // no path
}

// ---------------------------------------------------------------------------
// BFS reachability check
// ---------------------------------------------------------------------------

function bfsReachable(
  grid: MapCell[][],
  start: GridPos,
  target: GridPos,
  width: number,
  depth: number,
): boolean {
  const key = (x: number, z: number) => z * width + x;
  const visited = new Set<number>();
  const queue: GridPos[] = [start];
  visited.add(key(start.x, start.z));
  const targetKey = key(target.x, target.z);

  const dirs: GridPos[] = [
    { x: 0, z: -1 },
    { x: 0, z: 1 },
    { x: -1, z: 0 },
    { x: 1, z: 0 },
  ];

  while (queue.length > 0) {
    const cur = queue.shift()!;
    const ck = key(cur.x, cur.z);
    if (ck === targetKey) return true;

    for (const d of dirs) {
      const nx = cur.x + d.x;
      const nz = cur.z + d.z;
      if (nx < 0 || nx >= width || nz < 0 || nz >= depth) continue;
      const nk = key(nx, nz);
      if (visited.has(nk)) continue;
      if (!LevelGenerator.isWalkable(grid[nz][nx])) continue;
      visited.add(nk);
      queue.push({ x: nx, z: nz });
    }
  }

  return false;
}

// ---------------------------------------------------------------------------
// Room helper: check if a grid position is inside a room
// ---------------------------------------------------------------------------

function isInsideRoom(room: Room, gx: number, gz: number): boolean {
  return (
    gx >= room.boundsX &&
    gx < room.boundsX + room.boundsW &&
    gz >= room.boundsZ &&
    gz < room.boundsZ + room.boundsH
  );
}

function roomCenter(room: Room): GridPos {
  return {
    x: room.boundsX + Math.floor(room.boundsW / 2),
    z: room.boundsZ + Math.floor(room.boundsH / 2),
  };
}

// ---------------------------------------------------------------------------
// Main simulation
// ---------------------------------------------------------------------------

export function runPlaytest(
  levelData: LevelData,
  rooms: Room[],
  opts?: { maxDuration?: number },
): PlaytestResult {
  const maxDuration = opts?.maxDuration ?? 120; // seconds
  const dt = 1 / 60; // fixed 60fps timestep

  const { grid, width, depth, spawns, playerSpawn } = levelData;

  // --- Identify enemies ---
  const enemySpawns = spawns.filter((s) => ENEMY_TYPES.has(s.type));
  const enemiesAlive = new Set<number>(); // indices into enemySpawns
  for (let i = 0; i < enemySpawns.length; i++) {
    enemiesAlive.add(i);
  }
  // Track per-enemy kill timers (seconds remaining before kill completes)
  const enemyKillTimers = new Map<number, number>();

  // --- Agent state ---
  const agent: AgentState = {
    x: playerSpawn.x / CELL_SIZE,
    z: playerSpawn.z / CELL_SIZE,
    hp: 100,
    speed: 5, // cells per second
    targetRoom: null,
    targetEnemy: null,
  };

  // --- Room tracking ---
  const visitedRoomIds = new Set<string>();
  const roomCount = rooms.length;

  // --- Path state ---
  let currentPath: GridPos[] | null = null;
  let pathIndex = 0;

  // --- Softlock detection ---
  const positionHistory: GridPos[] = [];
  let lastHistoryTime = 0;
  const softlocks: string[] = [];
  let consecutiveSoftlocks = 0;

  // --- Result tracking ---
  const diagnostics: string[] = [];
  let enemiesKilled = 0;
  let simTime = 0;

  // --- Check initial room ---
  for (const room of rooms) {
    if (isInsideRoom(room, Math.round(agent.x), Math.round(agent.z))) {
      visitedRoomIds.add(room.id);
    }
  }

  // --- Simulation loop ---
  while (simTime < maxDuration) {
    // Abort on too many softlocks
    if (consecutiveSoftlocks >= 3) {
      diagnostics.push(`Aborted: ${consecutiveSoftlocks} consecutive softlocks`);
      break;
    }

    // --- Pick target ---
    const allRoomsVisitedNow = visitedRoomIds.size === roomCount;

    if (!allRoomsVisitedNow) {
      // Phase 1: visit all rooms
      if (agent.targetRoom === null || visitedRoomIds.has(rooms[agent.targetRoom]?.id)) {
        let bestDist = Infinity;
        let bestIdx: number | null = null;
        for (let i = 0; i < rooms.length; i++) {
          if (visitedRoomIds.has(rooms[i].id)) continue;
          const center = roomCenter(rooms[i]);
          const dist = Math.abs(center.x - agent.x) + Math.abs(center.z - agent.z);
          if (dist < bestDist) {
            bestDist = dist;
            bestIdx = i;
          }
        }
        agent.targetRoom = bestIdx;
        agent.targetEnemy = null;
        currentPath = null;
      }
    } else if (enemiesAlive.size > 0) {
      // Phase 2: hunt remaining enemies
      agent.targetRoom = null;
      if (agent.targetEnemy === null || !enemiesAlive.has(agent.targetEnemy)) {
        let bestDist = Infinity;
        let bestIdx: number | null = null;
        for (const ei of enemiesAlive) {
          const spawn = enemySpawns[ei];
          const ex = spawn.x / CELL_SIZE;
          const ez = spawn.z / CELL_SIZE;
          const dist = Math.abs(ex - agent.x) + Math.abs(ez - agent.z);
          if (dist < bestDist) {
            bestDist = dist;
            bestIdx = ei;
          }
        }
        agent.targetEnemy = bestIdx;
        currentPath = null;
      }
    }

    // --- Pathfind ---
    if (currentPath === null) {
      let targetPos: GridPos | null = null;
      if (agent.targetRoom !== null) {
        targetPos = roomCenter(rooms[agent.targetRoom]);
      } else if (agent.targetEnemy !== null) {
        const spawn = enemySpawns[agent.targetEnemy];
        targetPos = { x: Math.round(spawn.x / CELL_SIZE), z: Math.round(spawn.z / CELL_SIZE) };
      }

      if (targetPos !== null) {
        const startGrid: GridPos = { x: Math.round(agent.x), z: Math.round(agent.z) };
        currentPath = astar(grid, startGrid, targetPos, width, depth);
        pathIndex = 0;

        if (currentPath === null) {
          const label =
            agent.targetRoom !== null
              ? `room ${rooms[agent.targetRoom].id}`
              : `enemy ${agent.targetEnemy}`;
          diagnostics.push(`No path to ${label} from (${startGrid.x}, ${startGrid.z})`);
          agent.targetRoom = null;
          agent.targetEnemy = null;
          simTime += dt;
          continue;
        }
      }
    }

    // --- Move toward next path node ---
    if (currentPath !== null && pathIndex < currentPath.length) {
      const target = currentPath[pathIndex];
      const dx = target.x - agent.x;
      const dz = target.z - agent.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 0.1) {
        // Arrived at this node
        agent.x = target.x;
        agent.z = target.z;
        pathIndex++;
      } else {
        const step = agent.speed * dt;
        const moveRatio = Math.min(step / dist, 1);
        agent.x += dx * moveRatio;
        agent.z += dz * moveRatio;
      }
    } else if (currentPath !== null && pathIndex >= currentPath.length) {
      // Path complete — clear it to pick next target
      currentPath = null;
      agent.targetRoom = null;
      agent.targetEnemy = null;
    }

    // --- Check room visits ---
    const agentGX = Math.round(agent.x);
    const agentGZ = Math.round(agent.z);
    for (const room of rooms) {
      if (!visitedRoomIds.has(room.id) && isInsideRoom(room, agentGX, agentGZ)) {
        visitedRoomIds.add(room.id);
      }
    }

    // --- Simulate combat ---
    for (const ei of enemiesAlive) {
      const spawn = enemySpawns[ei];
      const enemyGX = Math.round(spawn.x / CELL_SIZE);
      const enemyGZ = Math.round(spawn.z / CELL_SIZE);

      if (agentGX === enemyGX && agentGZ === enemyGZ) {
        // Start kill timer if not already started
        if (!enemyKillTimers.has(ei)) {
          enemyKillTimers.set(ei, 0.5);
        }
      }
    }

    // Tick kill timers
    for (const [ei, remaining] of enemyKillTimers) {
      const newRemaining = remaining - dt;
      if (newRemaining <= 0) {
        enemiesAlive.delete(ei);
        enemyKillTimers.delete(ei);
        enemiesKilled++;
      } else {
        enemyKillTimers.set(ei, newRemaining);
      }
    }

    // --- Softlock detection (every 1 simulated second) ---
    if (simTime - lastHistoryTime >= 1) {
      positionHistory.push({ x: agentGX, z: agentGZ });
      lastHistoryTime = simTime;

      if (positionHistory.length >= 10) {
        const recent = positionHistory.slice(-10);
        const first = recent[0];
        const stuck = recent.every(
          (p) => Math.abs(p.x - first.x) <= 1 && Math.abs(p.z - first.z) <= 1,
        );
        if (stuck) {
          const msg = `Player stuck at (${first.x}, ${first.z}) for ${positionHistory.length >= 10 ? 10 : positionHistory.length}s`;
          softlocks.push(msg);
          consecutiveSoftlocks++;
          diagnostics.push(msg);
          // Reset history to avoid repeated detections of same spot
          positionHistory.length = 0;
        } else {
          consecutiveSoftlocks = 0;
        }
      }
    }

    simTime += dt;

    // Early exit if all rooms visited and all enemies killed
    if (visitedRoomIds.size === roomCount && enemiesAlive.size === 0) {
      break;
    }
  }

  // --- Unreachable room detection ---
  const unreachableRooms: string[] = [];
  const spawnGrid: GridPos = {
    x: Math.round(playerSpawn.x / CELL_SIZE),
    z: Math.round(playerSpawn.z / CELL_SIZE),
  };

  for (const room of rooms) {
    if (visitedRoomIds.has(room.id)) continue;
    const center = roomCenter(room);
    if (!bfsReachable(grid, spawnGrid, center, width, depth)) {
      unreachableRooms.push(room.id);
    }
  }

  // --- Pass condition ---
  const allRoomsVisited = visitedRoomIds.size === roomCount;
  const allEnemiesKilled = enemiesKilled === enemySpawns.length && enemySpawns.length > 0;
  const fatalSoftlocks = consecutiveSoftlocks >= 3;
  const passed = (allRoomsVisited || allEnemiesKilled) && !fatalSoftlocks;

  return {
    passed,
    duration: Math.round(simTime * 100) / 100,
    roomsVisited: Array.from(visitedRoomIds),
    roomsTotal: roomCount,
    enemiesKilled,
    enemiesTotal: enemySpawns.length,
    softlocks,
    unreachableRooms,
    diagnostics,
  };
}
