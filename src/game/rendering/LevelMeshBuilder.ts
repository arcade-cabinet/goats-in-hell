/**
 * LevelMeshBuilder — creates wall, floor, ceiling, and special-tile geometry
 * for a level. Extracted from GameEngine.tsx.
 */
import {
  Color3,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  Vector3,
} from '@babylonjs/core';
import type {Scene} from '@babylonjs/core';
import {
  CELL_SIZE,
  MapCell,
  PLATFORM_HEIGHT,
  WALL_HEIGHT,
} from '../levels/LevelGenerator';
import type {FloorTheme} from '../levels/FloorThemes';
import type {WallType} from './Materials';
import type {LevelData} from '../GameEngine';

/** Map a MapCell enum value to a material wall type key. */
function mapCellToWallType(cell: MapCell, theme?: FloorTheme): WallType | null {
  switch (cell) {
    case MapCell.WALL_STONE:
      return 'stone';
    case MapCell.WALL_FLESH:
      return 'flesh';
    case MapCell.WALL_LAVA:
      return 'lava';
    case MapCell.WALL_OBSIDIAN:
      return 'obsidian';
    case MapCell.DOOR:
      return 'door';
    case MapCell.WALL_SECRET:
      return theme ? mapCellToWallType(theme.primaryWall as MapCell) ?? 'stone' : 'stone';
    default:
      return null;
  }
}

export interface LevelMaterials {
  stone: StandardMaterial;
  flesh: StandardMaterial;
  lava: StandardMaterial;
  obsidian: StandardMaterial;
  door: StandardMaterial;
  floor: StandardMaterial;
  ceiling: StandardMaterial;
}

/**
 * Build all static level geometry (floor, ceiling, walls, lava tiles, platforms,
 * void pits, ramps) and return the created meshes.
 */
export function buildLevelMeshes(
  level: LevelData,
  materials: LevelMaterials,
  scene: Scene,
): Mesh[] {
  const created: Mesh[] = [];

  // Floor
  const floorMesh = MeshBuilder.CreateGround(
    'floor',
    {width: level.width * CELL_SIZE, height: level.depth * CELL_SIZE},
    scene,
  );
  floorMesh.position = new Vector3(
    (level.width * CELL_SIZE) / 2, 0, (level.depth * CELL_SIZE) / 2,
  );
  floorMesh.receiveShadows = true;
  floorMesh.checkCollisions = true;
  floorMesh.material = materials.floor;
  created.push(floorMesh);

  // Ceiling
  const ceilingMesh = MeshBuilder.CreateGround(
    'ceiling',
    {width: level.width * CELL_SIZE, height: level.depth * CELL_SIZE},
    scene,
  );
  ceilingMesh.position = new Vector3(
    (level.width * CELL_SIZE) / 2, WALL_HEIGHT, (level.depth * CELL_SIZE) / 2,
  );
  ceilingMesh.rotation = new Vector3(Math.PI, 0, 0);
  ceilingMesh.material = materials.ceiling;
  created.push(ceilingMesh);

  // Walls + lava floor tiles + special geometry
  for (let z = 0; z < level.depth; z++) {
    for (let x = 0; x < level.width; x++) {
      const cell = level.grid[z][x];

      if (cell === MapCell.FLOOR_LAVA) {
        const lava = MeshBuilder.CreateBox(
          `lava-${x}-${z}`,
          {width: CELL_SIZE, height: 0.05, depth: CELL_SIZE},
          scene,
        );
        lava.position = new Vector3(x * CELL_SIZE, 0.03, z * CELL_SIZE);
        lava.receiveShadows = false;
        lava.material = materials.lava;
        created.push(lava);
        continue;
      }

      if (cell === MapCell.FLOOR_RAISED) {
        const platform = MeshBuilder.CreateBox(
          `platform-${x}-${z}`,
          {width: CELL_SIZE, height: PLATFORM_HEIGHT, depth: CELL_SIZE},
          scene,
        );
        platform.position = new Vector3(x * CELL_SIZE, PLATFORM_HEIGHT / 2, z * CELL_SIZE);
        platform.receiveShadows = true;
        platform.checkCollisions = true;
        platform.material = materials.obsidian;
        created.push(platform);
        continue;
      }

      if (cell === MapCell.FLOOR_VOID) {
        const voidPit = MeshBuilder.CreateBox(
          `void-${x}-${z}`,
          {width: CELL_SIZE, height: 0.05, depth: CELL_SIZE},
          scene,
        );
        voidPit.position = new Vector3(x * CELL_SIZE, -0.02, z * CELL_SIZE);
        voidPit.receiveShadows = false;
        voidPit.isPickable = false;
        const voidMat = new StandardMaterial(`voidMat-${x}-${z}`, scene);
        voidMat.diffuseColor = new Color3(0.05, 0, 0.1);
        voidMat.emissiveColor = new Color3(0.15, 0, 0.25);
        voidMat.alpha = 0.6;
        voidPit.material = voidMat;
        created.push(voidPit);
        continue;
      }

      if (cell === MapCell.RAMP) {
        const ramp = MeshBuilder.CreateBox(
          `ramp-${x}-${z}`,
          {width: CELL_SIZE, height: PLATFORM_HEIGHT * 0.5, depth: CELL_SIZE},
          scene,
        );
        ramp.position = new Vector3(x * CELL_SIZE, PLATFORM_HEIGHT * 0.25, z * CELL_SIZE);
        ramp.receiveShadows = true;
        ramp.checkCollisions = true;
        ramp.material = materials.stone;
        created.push(ramp);
        continue;
      }

      const wallType = mapCellToWallType(cell, level.theme);
      if (!wallType) continue;

      const wall = MeshBuilder.CreateBox(
        `wall-${x}-${z}`,
        {width: CELL_SIZE, height: WALL_HEIGHT, depth: CELL_SIZE},
        scene,
      );
      wall.position = new Vector3(x * CELL_SIZE, WALL_HEIGHT / 2, z * CELL_SIZE);
      wall.receiveShadows = true;
      wall.checkCollisions = true;
      wall.material = materials[wallType];
      created.push(wall);

      if (cell === MapCell.WALL_SECRET) {
        wall.name = `secret-wall-${x}-${z}`;
        wall.metadata = {...(wall.metadata ?? {}), isSecret: true, gridX: x, gridZ: z};
      }
    }
  }

  return created;
}

/** Dispose all level meshes. */
export function disposeLevelMeshes(meshes: Mesh[]): void {
  for (const m of meshes) {
    m.dispose();
  }
}
