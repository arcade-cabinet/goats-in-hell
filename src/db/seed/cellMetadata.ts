/**
 * Seed data for cell_metadata table.
 *
 * Maps each MapCell enum value to its behavioral properties for the
 * playtest runner and level validation. These values mirror the runtime
 * behavior in LevelGenerator.isWalkable() and LevelGenerator.getElevation().
 */
import type { NewCellMeta } from '../schema';

// MapCell enum values (from LevelGenerator.ts)
// EMPTY=0, WALL_STONE=1, WALL_FLESH=2, WALL_LAVA=3, WALL_OBSIDIAN=4,
// DOOR=5, FLOOR_LAVA=6, FLOOR_RAISED=7, RAMP=8, WALL_SECRET=9, FLOOR_VOID=10

export const CELL_METADATA_SEED: NewCellMeta[] = [
  {
    mapCell: 0, // EMPTY
    name: 'EMPTY',
    category: 'floor',
    isWalkable: true,
    isSolid: false,
    damagePerSecond: 0,
    movementSpeedMult: 1.0,
    isDestructible: false,
  },
  {
    mapCell: 1, // WALL_STONE
    name: 'WALL_STONE',
    category: 'wall',
    isWalkable: false,
    isSolid: true,
    damagePerSecond: 0,
    movementSpeedMult: 0,
    isDestructible: false,
  },
  {
    mapCell: 2, // WALL_FLESH
    name: 'WALL_FLESH',
    category: 'wall',
    isWalkable: false,
    isSolid: true,
    damagePerSecond: 0,
    movementSpeedMult: 0,
    isDestructible: false,
  },
  {
    mapCell: 3, // WALL_LAVA
    name: 'WALL_LAVA',
    category: 'wall',
    isWalkable: false,
    isSolid: true,
    damagePerSecond: 0,
    movementSpeedMult: 0,
    isDestructible: false,
  },
  {
    mapCell: 4, // WALL_OBSIDIAN
    name: 'WALL_OBSIDIAN',
    category: 'wall',
    isWalkable: false,
    isSolid: true,
    damagePerSecond: 0,
    movementSpeedMult: 0,
    isDestructible: false,
  },
  {
    mapCell: 5, // DOOR
    name: 'DOOR',
    category: 'door',
    isWalkable: true,
    isSolid: false, // open by default; DoorSystem handles locking
    damagePerSecond: 0,
    movementSpeedMult: 0.8,
    isDestructible: false,
  },
  {
    mapCell: 6, // FLOOR_LAVA
    name: 'FLOOR_LAVA',
    category: 'hazard',
    isWalkable: true,
    isSolid: false,
    damagePerSecond: 15,
    movementSpeedMult: 0.6,
    isDestructible: false,
  },
  {
    mapCell: 7, // FLOOR_RAISED
    name: 'FLOOR_RAISED',
    category: 'platform',
    isWalkable: true,
    isSolid: false,
    damagePerSecond: 0,
    movementSpeedMult: 1.0,
    isDestructible: false,
  },
  {
    mapCell: 8, // RAMP
    name: 'RAMP',
    category: 'ramp',
    isWalkable: true,
    isSolid: false,
    damagePerSecond: 0,
    movementSpeedMult: 0.85,
    isDestructible: false,
  },
  {
    mapCell: 9, // WALL_SECRET
    name: 'WALL_SECRET',
    category: 'special',
    isWalkable: false, // appears as wall until activated
    isSolid: true,
    damagePerSecond: 0,
    movementSpeedMult: 0,
    isDestructible: true,
  },
  {
    mapCell: 10, // FLOOR_VOID
    name: 'FLOOR_VOID',
    category: 'hazard',
    isWalkable: true,
    isSolid: false,
    damagePerSecond: 9999, // instant death
    movementSpeedMult: 1.0,
    isDestructible: false,
  },
];
