/**
 * EntitySpawner — creates ECS entities for enemies, pickups, hazards, props,
 * lore terminals, and boss encounters. Extracted from GameEngine.tsx.
 */
import {Mesh, Vector3} from '@babylonjs/core';
import type {Scene} from '@babylonjs/core';
import type {EntityType, WeaponId} from '../entities/components';
import {world} from '../entities/world';
import {getEnemyStats} from '../entities/enemyStats';
import {CELL_SIZE} from '../levels/LevelGenerator';
import {BOSS_ARENA_PICKUP_POSITIONS} from '../levels/BossArenas';
import {createProp} from '../rendering/DungeonProps';
import type {PropType} from '../rendering/DungeonProps';
import {createLoreMessage} from '../rendering/LoreMessages';
import {useGameStore} from '../../state/GameStore';
import type {PowerUpType} from '../systems/PowerUpSystem';
import type {LevelData} from '../GameEngine';

const ENEMY_TYPES: EntityType[] = [
  'goat', 'hellgoat', 'fireGoat', 'shadowGoat', 'goatKnight',
  'archGoat', 'infernoGoat', 'voidGoat', 'ironGoat',
];

const PROP_TYPES = new Set([
  'prop_firebasket', 'prop_candle', 'prop_candle_multi', 'prop_altar',
  'prop_coffin', 'prop_column', 'prop_chalice', 'prop_bowl',
]);

export {ENEMY_TYPES};

interface DiffMods {
  enemyHpMult: number;
  enemyDmgMult: number;
  enemySpeedMult: number;
  pickupDensityMult: number;
}

/**
 * Spawn all entities from level spawn data. Returns meshes created for props
 * and lore terminals (caller manages their lifecycle).
 */
export function spawnLevelEntities(
  levelData: LevelData,
  diffMods: DiffMods,
  nightmareDmgMult: number,
  isNightmare: boolean,
  scene: Scene,
): Mesh[] {
  const propMeshes: Mesh[] = [];

  levelData.spawns.forEach((spawn, idx) => {
    if (isNightmare && spawn.type === 'health') return;

    const entityType = spawn.type as EntityType;
    if (ENEMY_TYPES.includes(entityType)) {
      const stats = getEnemyStats(entityType);
      const scaledHp = Math.ceil(stats.hp * diffMods.enemyHpMult);
      const scaledMaxHp = Math.ceil(stats.maxHp * diffMods.enemyHpMult);
      const scaledDmg = Math.ceil(stats.damage * diffMods.enemyDmgMult * nightmareDmgMult);
      const scaledSpeed = stats.speed * diffMods.enemySpeedMult;
      world.add({
        id: `enemy-${idx}`,
        type: entityType,
        position: new Vector3(spawn.x, 1, spawn.z),
        enemy: {
          ...stats,
          hp: scaledHp,
          maxHp: scaledMaxHp,
          damage: scaledDmg,
          speed: scaledSpeed,
          alert: false,
          attackCooldown: 0,
        },
      });
    } else if (spawn.type === 'health' || spawn.type === 'ammo') {
      if (diffMods.pickupDensityMult < 1 && useGameStore.getState().rng() > diffMods.pickupDensityMult) return;
      const baseValue = spawn.type === 'health' ? 25 : 8;
      const scaledValue = Math.max(1, Math.round(baseValue * Math.min(1.5, diffMods.pickupDensityMult)));
      world.add({
        id: `pickup-${idx}`,
        type: entityType,
        position: new Vector3(spawn.x, 0.5, spawn.z),
        pickup: {
          pickupType: spawn.type as 'health' | 'ammo',
          value: scaledValue,
          active: true,
        },
      });
    } else if (spawn.type === 'weaponPickup' && spawn.weaponId) {
      world.add({
        id: `weapon-${idx}`,
        type: 'weaponPickup',
        position: new Vector3(spawn.x, 0.5, spawn.z),
        pickup: {
          pickupType: 'weapon',
          value: 0,
          active: true,
          weaponId: spawn.weaponId as WeaponId,
        },
      });
    } else if (spawn.type === 'powerup') {
      const powerUpTypes: PowerUpType[] = ['quadDamage', 'hellSpeed', 'demonShield'];
      const seededRng = useGameStore.getState().rng;
      const pType = powerUpTypes[Math.floor(seededRng() * powerUpTypes.length)];
      world.add({
        id: `powerup-${idx}`,
        type: 'powerup',
        position: new Vector3(spawn.x, 0.8, spawn.z),
        pickup: {
          pickupType: 'powerup',
          value: 0,
          active: true,
          powerUpType: pType,
        },
      });
    } else if (spawn.type === 'hazard_spikes') {
      world.add({
        id: `hazard-spike-${idx}`,
        type: 'hazard_spikes',
        position: new Vector3(spawn.x, 0, spawn.z),
        hazard: {hazardType: 'spikes', damage: 10, cooldown: 0},
      });
    } else if (spawn.type === 'hazard_barrel') {
      world.add({
        id: `hazard-barrel-${idx}`,
        type: 'hazard_barrel',
        position: new Vector3(spawn.x, 0.5, spawn.z),
        hazard: {hazardType: 'barrel', damage: 50, cooldown: 0, hp: 20},
      });
    } else if (PROP_TYPES.has(spawn.type)) {
      const propMesh = createProp(
        spawn.type as PropType,
        new Vector3(spawn.x, 0, spawn.z),
        spawn.rotation ?? 0,
        scene,
      );
      if (propMesh) {
        propMeshes.push(propMesh);
      }
    } else if (spawn.type === 'lore_message') {
      const loreMesh = createLoreMessage(
        new Vector3(spawn.x, 0, spawn.z),
        spawn.rotation ?? 0,
        levelData.floor,
        levelData.theme.name,
        scene,
      );
      propMeshes.push(loreMesh);
    }
  });

  return propMeshes;
}

/**
 * Spawn a boss entity and its arena pickups.
 */
export function spawnBoss(
  bossId: string,
  levelData: LevelData,
  diffMods: DiffMods,
  nightmareDmgMult: number,
  isNightmare: boolean,
): void {
  const bossType: EntityType = ENEMY_TYPES.includes(bossId as EntityType)
    ? (bossId as EntityType) : 'archGoat';
  const bossStats = getEnemyStats(bossType);
  const scaledBossHp = Math.ceil(bossStats.hp * diffMods.enemyHpMult * 1.5);
  const scaledBossMaxHp = Math.ceil(bossStats.maxHp * diffMods.enemyHpMult * 1.5);
  const scaledBossDmg = Math.ceil(bossStats.damage * diffMods.enemyDmgMult * nightmareDmgMult);
  world.add({
    id: `boss-${bossType}-${levelData.floor}`,
    type: bossType,
    position: new Vector3(
      Math.floor(levelData.width / 2) * CELL_SIZE,
      1,
      Math.floor(levelData.depth / 2) * CELL_SIZE,
    ),
    enemy: {
      ...bossStats,
      hp: scaledBossHp,
      maxHp: scaledBossMaxHp,
      damage: scaledBossDmg,
      speed: bossStats.speed * diffMods.enemySpeedMult,
      alert: true,
      attackCooldown: 0,
    },
  });

  // Spawn initial pickups in boss arena at corner positions
  const bossPickups: {type: 'ammo' | 'health'; value: number}[] = [
    {type: 'ammo', value: 18},
    {type: 'ammo', value: 18},
    {type: 'ammo', value: 18},
    {type: 'health', value: 30},
  ];
  BOSS_ARENA_PICKUP_POSITIONS.forEach((pos, i) => {
    const [px, pz] = pos;
    const spec = bossPickups[i];
    if (spec.type === 'health' && isNightmare) return;
    world.add({
      id: `boss-pickup-${i}`,
      type: spec.type,
      position: new Vector3(px * CELL_SIZE, 0.5, pz * CELL_SIZE),
      pickup: {
        pickupType: spec.type,
        value: spec.value,
        active: true,
      },
    });
  });
}
