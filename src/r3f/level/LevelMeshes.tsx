/**
 * LevelMeshes — R3F component that imperatively creates Three.js geometry
 * for walls, floors, ceilings, and special tiles (lava, platforms, ramps,
 * void pits) from a MapCell grid.
 *
 * Uses InstancedMesh for walls (one per wall type) and merged PlaneGeometry
 * for floor/ceiling. All meshes are added to the scene imperatively via
 * useThree() to avoid Reactylon JSX type conflicts.
 *
 * LevelColliders is a separate declarative component for Rapier physics.
 */

import { useThree } from '@react-three/fiber';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three/webgpu';
import { CELL_SIZE, WALL_HEIGHT } from '../../constants';
import type { FloorTheme } from '../../game/levels/FloorThemes';
import { MapCell, PLATFORM_HEIGHT } from '../../game/levels/LevelGenerator';
import {
  createCeilingMaterial,
  createDoorMaterial,
  createFloorMaterial,
  createLavaMaterial,
  createPlatformMaterial,
  createRampMaterial,
  createVoidPitMaterial,
  disposeCachedMaterials,
  getWallTypeMaterial,
} from './Materials';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LevelMeshesProps {
  grid: MapCell[][];
  theme: FloorTheme;
  width: number;
  depth: number;
}

export interface WallPosition {
  x: number;
  y: number;
  z: number;
}

interface CellMeshData {
  wallPositions: Map<number, { x: number; y: number; z: number }[]>;
  floorCells: { x: number; z: number }[];
  lavaCells: { x: number; z: number }[];
  platformCells: { x: number; z: number }[];
  rampCells: { x: number; z: number }[];
  voidCells: { x: number; z: number }[];
  doorPositions: { x: number; y: number; z: number }[];
}

// ---------------------------------------------------------------------------
// Wall type helpers
// ---------------------------------------------------------------------------

function isWallCell(cell: MapCell): boolean {
  return (
    cell === MapCell.WALL_STONE ||
    cell === MapCell.WALL_FLESH ||
    cell === MapCell.WALL_LAVA ||
    cell === MapCell.WALL_OBSIDIAN ||
    cell === MapCell.WALL_SECRET
  );
}

/** Get the effective wall type value for a cell (secret walls use theme primary). */
function getWallTypeValue(cell: MapCell, theme: FloorTheme): number {
  if (cell === MapCell.WALL_SECRET) return theme.primaryWall;
  return cell;
}

// ---------------------------------------------------------------------------
// Grid analysis: classify cells and collect positions
// ---------------------------------------------------------------------------

function analyzeGrid(
  grid: MapCell[][],
  theme: FloorTheme,
  width: number,
  depth: number,
): CellMeshData {
  const wallPositions = new Map<number, { x: number; y: number; z: number }[]>();
  const floorCells: { x: number; z: number }[] = [];
  const lavaCells: { x: number; z: number }[] = [];
  const platformCells: { x: number; z: number }[] = [];
  const rampCells: { x: number; z: number }[] = [];
  const voidCells: { x: number; z: number }[] = [];
  const doorPositions: { x: number; y: number; z: number }[] = [];

  for (let row = 0; row < depth; row++) {
    for (let col = 0; col < width; col++) {
      const cell = grid[row][col];
      // Grid to world: x = col * CELL_SIZE, z = -row * CELL_SIZE (negate Z for Three.js)
      const worldX = col * CELL_SIZE;
      const worldZ = -row * CELL_SIZE;

      if (isWallCell(cell)) {
        const wallType = getWallTypeValue(cell, theme);
        if (!wallPositions.has(wallType)) {
          wallPositions.set(wallType, []);
        }
        wallPositions.get(wallType)!.push({
          x: worldX,
          y: WALL_HEIGHT / 2,
          z: worldZ,
        });
      } else if (cell === MapCell.DOOR) {
        doorPositions.push({
          x: worldX,
          y: WALL_HEIGHT / 2,
          z: worldZ,
        });
        // Doors also get a floor
        floorCells.push({ x: col, z: row });
      } else if (cell === MapCell.EMPTY) {
        floorCells.push({ x: col, z: row });
      } else if (cell === MapCell.FLOOR_LAVA) {
        lavaCells.push({ x: col, z: row });
      } else if (cell === MapCell.FLOOR_RAISED) {
        platformCells.push({ x: col, z: row });
      } else if (cell === MapCell.RAMP) {
        rampCells.push({ x: col, z: row });
      } else if (cell === MapCell.FLOOR_VOID) {
        voidCells.push({ x: col, z: row });
      }
    }
  }

  return {
    wallPositions,
    floorCells,
    lavaCells,
    platformCells,
    rampCells,
    voidCells,
    doorPositions,
  };
}

// ---------------------------------------------------------------------------
// LevelMeshes Component — imperative Three.js mesh creation
// ---------------------------------------------------------------------------

/**
 * Creates all level geometry imperatively using Three.js and adds it to
 * the R3F scene. Does NOT use JSX mesh elements to avoid Reactylon type
 * conflicts.
 *
 * Returns null (no React DOM output). All rendering is side-effectful.
 */
export function LevelMeshes({ grid, theme, width, depth }: LevelMeshesProps): null {
  const scene = useThree((state) => state.scene);

  // Memoize grid analysis so it only recalculates when inputs change
  const meshData = useMemo(
    () => analyzeGrid(grid, theme, width, depth),
    [grid, theme, width, depth],
  );

  useEffect(() => {
    const createdObjects: THREE.Object3D[] = [];

    // -----------------------------------------------------------------------
    // Floor: single large plane at y=0
    // -----------------------------------------------------------------------
    const floorGeo = new THREE.PlaneGeometry(width * CELL_SIZE, depth * CELL_SIZE);
    floorGeo.rotateX(-Math.PI / 2); // Lay flat (face up)
    const floorMat = createFloorMaterial(theme);
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    // Center the floor plane over the grid
    // Grid spans from col 0..width-1 and row 0..depth-1
    // World X center: (width-1) * CELL_SIZE / 2
    // World Z center: -(depth-1) * CELL_SIZE / 2  (negated)
    floorMesh.position.set(((width - 1) * CELL_SIZE) / 2, 0, -((depth - 1) * CELL_SIZE) / 2);
    floorMesh.receiveShadow = true;
    floorMesh.name = 'level-floor';
    scene.add(floorMesh);
    createdObjects.push(floorMesh);

    // -----------------------------------------------------------------------
    // Ceiling: single large plane at y=WALL_HEIGHT, facing down
    // -----------------------------------------------------------------------
    const ceilingGeo = new THREE.PlaneGeometry(width * CELL_SIZE, depth * CELL_SIZE);
    ceilingGeo.rotateX(Math.PI / 2); // Face down
    const ceilingMat = createCeilingMaterial(theme);
    const ceilingMesh = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceilingMesh.position.set(
      ((width - 1) * CELL_SIZE) / 2,
      WALL_HEIGHT,
      -((depth - 1) * CELL_SIZE) / 2,
    );
    ceilingMesh.name = 'level-ceiling';
    scene.add(ceilingMesh);
    createdObjects.push(ceilingMesh);

    // -----------------------------------------------------------------------
    // Walls: InstancedMesh per wall type
    // -----------------------------------------------------------------------
    const wallBoxGeo = new THREE.BoxGeometry(CELL_SIZE, WALL_HEIGHT, CELL_SIZE);
    const tempMatrix = new THREE.Matrix4();

    for (const [wallType, positions] of meshData.wallPositions) {
      if (positions.length === 0) continue;

      const mat = getWallTypeMaterial(wallType);
      const instanced = new THREE.InstancedMesh(wallBoxGeo, mat, positions.length);
      instanced.name = `level-walls-type-${wallType}`;
      instanced.castShadow = true;
      instanced.receiveShadow = true;

      for (let i = 0; i < positions.length; i++) {
        const pos = positions[i];
        tempMatrix.makeTranslation(pos.x, pos.y, pos.z);
        instanced.setMatrixAt(i, tempMatrix);
      }

      instanced.instanceMatrix.needsUpdate = true;
      scene.add(instanced);
      createdObjects.push(instanced);
    }

    // -----------------------------------------------------------------------
    // Door cells: InstancedMesh (slightly shorter than walls)
    // -----------------------------------------------------------------------
    if (meshData.doorPositions.length > 0) {
      const doorGeo = new THREE.BoxGeometry(CELL_SIZE, WALL_HEIGHT * 0.8, CELL_SIZE);
      const doorMat = createDoorMaterial();
      const doorInstanced = new THREE.InstancedMesh(
        doorGeo,
        doorMat,
        meshData.doorPositions.length,
      );
      doorInstanced.name = 'level-doors';
      doorInstanced.castShadow = true;
      doorInstanced.receiveShadow = true;

      for (let i = 0; i < meshData.doorPositions.length; i++) {
        const pos = meshData.doorPositions[i];
        tempMatrix.makeTranslation(pos.x, WALL_HEIGHT * 0.4, pos.z);
        doorInstanced.setMatrixAt(i, tempMatrix);
      }

      doorInstanced.instanceMatrix.needsUpdate = true;
      scene.add(doorInstanced);
      createdObjects.push(doorInstanced);
    }

    // -----------------------------------------------------------------------
    // Lava floor tiles: InstancedMesh (thin box at y=0.03)
    // -----------------------------------------------------------------------
    if (meshData.lavaCells.length > 0) {
      const lavaGeo = new THREE.BoxGeometry(CELL_SIZE, 0.05, CELL_SIZE);
      const lavaMat = createLavaMaterial();
      const lavaInstanced = new THREE.InstancedMesh(lavaGeo, lavaMat, meshData.lavaCells.length);
      lavaInstanced.name = 'level-lava';

      for (let i = 0; i < meshData.lavaCells.length; i++) {
        const cell = meshData.lavaCells[i];
        tempMatrix.makeTranslation(cell.x * CELL_SIZE, 0.03, -cell.z * CELL_SIZE);
        lavaInstanced.setMatrixAt(i, tempMatrix);
      }

      lavaInstanced.instanceMatrix.needsUpdate = true;
      scene.add(lavaInstanced);
      createdObjects.push(lavaInstanced);
    }

    // -----------------------------------------------------------------------
    // Raised platforms: InstancedMesh (box with PLATFORM_HEIGHT)
    // -----------------------------------------------------------------------
    if (meshData.platformCells.length > 0) {
      const platformGeo = new THREE.BoxGeometry(CELL_SIZE, PLATFORM_HEIGHT, CELL_SIZE);
      const platformMat = createPlatformMaterial();
      const platformInstanced = new THREE.InstancedMesh(
        platformGeo,
        platformMat,
        meshData.platformCells.length,
      );
      platformInstanced.name = 'level-platforms';
      platformInstanced.castShadow = true;
      platformInstanced.receiveShadow = true;

      for (let i = 0; i < meshData.platformCells.length; i++) {
        const cell = meshData.platformCells[i];
        tempMatrix.makeTranslation(cell.x * CELL_SIZE, PLATFORM_HEIGHT / 2, -cell.z * CELL_SIZE);
        platformInstanced.setMatrixAt(i, tempMatrix);
      }

      platformInstanced.instanceMatrix.needsUpdate = true;
      scene.add(platformInstanced);
      createdObjects.push(platformInstanced);
    }

    // -----------------------------------------------------------------------
    // Ramps: InstancedMesh (half-height box)
    // -----------------------------------------------------------------------
    if (meshData.rampCells.length > 0) {
      const rampHeight = PLATFORM_HEIGHT * 0.5;
      const rampGeo = new THREE.BoxGeometry(CELL_SIZE, rampHeight, CELL_SIZE);
      const rampMat = createRampMaterial();
      const rampInstanced = new THREE.InstancedMesh(rampGeo, rampMat, meshData.rampCells.length);
      rampInstanced.name = 'level-ramps';
      rampInstanced.castShadow = true;
      rampInstanced.receiveShadow = true;

      for (let i = 0; i < meshData.rampCells.length; i++) {
        const cell = meshData.rampCells[i];
        tempMatrix.makeTranslation(cell.x * CELL_SIZE, rampHeight / 2, -cell.z * CELL_SIZE);
        rampInstanced.setMatrixAt(i, tempMatrix);
      }

      rampInstanced.instanceMatrix.needsUpdate = true;
      scene.add(rampInstanced);
      createdObjects.push(rampInstanced);
    }

    // -----------------------------------------------------------------------
    // Void pits: InstancedMesh (thin box at y=-0.02, semi-transparent)
    // -----------------------------------------------------------------------
    if (meshData.voidCells.length > 0) {
      const voidGeo = new THREE.BoxGeometry(CELL_SIZE, 0.05, CELL_SIZE);
      const voidMat = createVoidPitMaterial();
      const voidInstanced = new THREE.InstancedMesh(voidGeo, voidMat, meshData.voidCells.length);
      voidInstanced.name = 'level-void-pits';

      for (let i = 0; i < meshData.voidCells.length; i++) {
        const cell = meshData.voidCells[i];
        tempMatrix.makeTranslation(cell.x * CELL_SIZE, -0.02, -cell.z * CELL_SIZE);
        voidInstanced.setMatrixAt(i, tempMatrix);
      }

      voidInstanced.instanceMatrix.needsUpdate = true;
      scene.add(voidInstanced);
      createdObjects.push(voidInstanced);
    }

    // -----------------------------------------------------------------------
    // Cleanup on unmount or when dependencies change
    // -----------------------------------------------------------------------
    return () => {
      // Track whether wallBoxGeo has already been disposed (shared across wall InstancedMeshes)
      let wallBoxGeoDisposed = false;

      for (const obj of createdObjects) {
        scene.remove(obj);

        if (obj instanceof THREE.Mesh || obj instanceof THREE.InstancedMesh) {
          // Dispose geometry — but only dispose wallBoxGeo once
          if (obj.geometry === wallBoxGeo) {
            if (!wallBoxGeoDisposed) {
              obj.geometry.dispose();
              wallBoxGeoDisposed = true;
            }
          } else {
            obj.geometry.dispose();
          }

          // Dispose material(s) attached to this mesh
          const mat = obj.material;
          if (Array.isArray(mat)) {
            for (const m of mat) {
              if (m instanceof THREE.Material) m.dispose();
            }
          } else if (mat instanceof THREE.Material) {
            mat.dispose();
          }
        }
      }

      // Clear the material cache since the materials above are now disposed
      disposeCachedMaterials();
    };
  }, [scene, theme, meshData, depth, width]);

  return null;
}

// ---------------------------------------------------------------------------
// LevelColliders Component — Rapier physics colliders (declarative)
// ---------------------------------------------------------------------------

export interface LevelCollidersProps {
  wallPositions: WallPosition[];
  doorPositions?: WallPosition[];
  platformPositions?: WallPosition[];
  rampPositions?: WallPosition[];
  floorWidth: number;
  floorDepth: number;
  /** Center X of the level floor in world units */
  floorCenterX: number;
  /** Center Z of the level floor in world units (negated for Three.js) */
  floorCenterZ: number;
}

/**
 * Declarative Rapier colliders for the level geometry.
 *
 * Renders RigidBody + CuboidCollider for each wall, door, platform, and ramp.
 * Also creates a single large floor collider.
 *
 * Rapier JSX components do not conflict with Reactylon's JSX augmentation.
 */
export function LevelColliders({
  wallPositions,
  doorPositions = [],
  platformPositions = [],
  rampPositions = [],
  floorWidth,
  floorDepth,
  floorCenterX,
  floorCenterZ,
}: LevelCollidersProps): React.JSX.Element {
  const halfCell = CELL_SIZE / 2;
  const halfWallH = WALL_HEIGHT / 2;
  const halfPlatformH = PLATFORM_HEIGHT / 2;
  const halfRampH = (PLATFORM_HEIGHT * 0.5) / 2;

  return (
    <>
      {/* Floor collider: thin box at y = -0.5 */}
      <RigidBody type="fixed" position={[floorCenterX, -0.5, floorCenterZ]}>
        <CuboidCollider args={[floorWidth / 2, 0.5, floorDepth / 2]} />
      </RigidBody>

      {/* Wall colliders */}
      {wallPositions.map((pos, i) => (
        <RigidBody key={`wall-${i}`} type="fixed" position={[pos.x, pos.y, pos.z]}>
          <CuboidCollider args={[halfCell, halfWallH, halfCell]} />
        </RigidBody>
      ))}

      {/* Door colliders (same size as walls for collision) */}
      {doorPositions.map((pos, i) => (
        <RigidBody key={`door-${i}`} type="fixed" position={[pos.x, pos.y, pos.z]}>
          <CuboidCollider args={[halfCell, halfWallH, halfCell]} />
        </RigidBody>
      ))}

      {/* Platform colliders */}
      {platformPositions.map((pos, i) => (
        <RigidBody key={`platform-${i}`} type="fixed" position={[pos.x, pos.y, pos.z]}>
          <CuboidCollider args={[halfCell, halfPlatformH, halfCell]} />
        </RigidBody>
      ))}

      {/* Ramp colliders */}
      {rampPositions.map((pos, i) => (
        <RigidBody key={`ramp-${i}`} type="fixed" position={[pos.x, pos.y, pos.z]}>
          <CuboidCollider args={[halfCell, halfRampH, halfCell]} />
        </RigidBody>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Helper: extract collider positions from a grid (for use by parent)
// ---------------------------------------------------------------------------

export interface ColliderData {
  wallPositions: WallPosition[];
  doorPositions: WallPosition[];
  platformPositions: WallPosition[];
  rampPositions: WallPosition[];
  floorWidth: number;
  floorDepth: number;
  floorCenterX: number;
  floorCenterZ: number;
}

/**
 * Extract all collider positions from a level grid.
 * Call this once and pass the result to both LevelMeshes (for visuals)
 * and LevelColliders (for physics).
 */
export function extractColliderData(
  grid: MapCell[][],
  _theme: FloorTheme,
  width: number,
  depth: number,
): ColliderData {
  const wallPositions: WallPosition[] = [];
  const doorPositions: WallPosition[] = [];
  const platformPositions: WallPosition[] = [];
  const rampPositions: WallPosition[] = [];

  for (let row = 0; row < depth; row++) {
    for (let col = 0; col < width; col++) {
      const cell = grid[row][col];
      const worldX = col * CELL_SIZE;
      const worldZ = -row * CELL_SIZE;

      if (isWallCell(cell)) {
        wallPositions.push({ x: worldX, y: WALL_HEIGHT / 2, z: worldZ });
      } else if (cell === MapCell.DOOR) {
        doorPositions.push({ x: worldX, y: WALL_HEIGHT / 2, z: worldZ });
      } else if (cell === MapCell.FLOOR_RAISED) {
        platformPositions.push({ x: worldX, y: PLATFORM_HEIGHT / 2, z: worldZ });
      } else if (cell === MapCell.RAMP) {
        const rampHeight = PLATFORM_HEIGHT * 0.5;
        rampPositions.push({ x: worldX, y: rampHeight / 2, z: worldZ });
      }
    }
  }

  return {
    wallPositions,
    doorPositions,
    platformPositions,
    rampPositions,
    floorWidth: width * CELL_SIZE,
    floorDepth: depth * CELL_SIZE,
    floorCenterX: ((width - 1) * CELL_SIZE) / 2,
    floorCenterZ: -((depth - 1) * CELL_SIZE) / 2,
  };
}
