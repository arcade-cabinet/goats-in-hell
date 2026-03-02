/**
 * TriggerSystem -- manages trigger zones from the level database.
 *
 * On level load, all triggers and their linked entities are fetched from the DB.
 * Each frame, the player's position is checked against unfired trigger zones.
 * When a trigger fires, it executes the associated action (spawn enemies,
 * lock/unlock doors, show dialogue, boss intro, reveal secrets, etc.).
 */

import { CELL_SIZE } from '../../constants';
import { DIFFICULTY_PRESETS, useGameStore } from '../../state/GameStore';
import type { EntityType, WeaponId } from '../entities/components';
import { getEnemyStats } from '../entities/enemyStats';
import { vec3 } from '../entities/vec3';
import { world } from '../entities/world';
import type { MapCell } from '../levels/LevelGenerator';
import { trackEnemySpawn } from './ProgressionSystem';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RuntimeTrigger {
  id: string;
  action: string;
  zoneX: number; // world coords
  zoneZ: number;
  zoneW: number; // world size
  zoneH: number;
  once: boolean;
  fired: boolean;
  delay: number; // ms delay before firing
  pendingFireTime: number; // timestamp when delay expires (0 = not pending)
  actionData: Record<string, unknown> | null;
  linkedEntityIds: string[];
}

export interface RuntimeTriggeredEntity {
  entityType: string;
  x: number; // world coords
  z: number; // world coords
  facing: number;
  triggerId: string;
  overrides: Record<string, unknown> | null;
  spawnCategory: string;
}

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

let _triggers: RuntimeTrigger[] = [];
let _triggeredEntities: RuntimeTriggeredEntity[] = [];
let _spawnCounter = 0;
let _levelGrid: MapCell[][] | null = null;

// Dialogue state
let _dialogueText: string | null = null;
let _dialogueExpiry = 0;
const DIALOGUE_DURATION = 4000; // ms

// ---------------------------------------------------------------------------
// Init / Reset
// ---------------------------------------------------------------------------

/**
 * Initialize the trigger system with triggers and their linked entities.
 * Called on level load. Grid reference is needed for secret_reveal action.
 */
export function initTriggerSystem(
  triggers: RuntimeTrigger[],
  triggeredEntities: RuntimeTriggeredEntity[],
  grid?: MapCell[][],
): void {
  _triggers = triggers;
  _triggeredEntities = triggeredEntities;
  _spawnCounter = 0;
  _levelGrid = grid ?? null;
  _dialogueText = null;
  _dialogueExpiry = 0;
}

/** Reset all trigger state (call on level change). */
export function resetTriggerSystem(): void {
  _triggers = [];
  _triggeredEntities = [];
  _spawnCounter = 0;
  _levelGrid = null;
  _dialogueText = null;
  _dialogueExpiry = 0;
}

// ---------------------------------------------------------------------------
// Per-frame update
// ---------------------------------------------------------------------------

/** Call each frame with the player's current world-space position. */
export function triggerSystemUpdate(playerX: number, playerZ: number, _deltaMs: number): void {
  const now = Date.now();

  // Tick dialogue timer
  if (_dialogueText !== null && now >= _dialogueExpiry) {
    _dialogueText = null;
  }

  for (const trigger of _triggers) {
    if (trigger.once && trigger.fired) continue;

    // Check if player is inside trigger zone (world coords)
    const inZone =
      playerX >= trigger.zoneX &&
      playerX <= trigger.zoneX + trigger.zoneW &&
      playerZ >= trigger.zoneZ &&
      playerZ <= trigger.zoneZ + trigger.zoneH;

    if (!inZone) {
      // Reset pending fire if player leaves zone before delay elapses
      trigger.pendingFireTime = 0;
      continue;
    }

    // Handle delay
    if (trigger.delay > 0) {
      if (trigger.pendingFireTime === 0) {
        trigger.pendingFireTime = now + trigger.delay;
        continue;
      }
      if (now < trigger.pendingFireTime) {
        continue;
      }
    }

    // Fire the trigger
    if (trigger.once) {
      trigger.fired = true;
    }
    trigger.pendingFireTime = 0;

    executeTriggerAction(trigger);
  }
}

// ---------------------------------------------------------------------------
// Action execution
// ---------------------------------------------------------------------------

function executeTriggerAction(trigger: RuntimeTrigger): void {
  switch (trigger.action) {
    case 'spawnWave':
      spawnTriggeredEntities(trigger);
      break;
    case 'lockDoors':
      lockAllDoors();
      break;
    case 'unlockDoors':
      handleUnlockDoors(trigger);
      break;
    case 'dialogue':
      showDialogue(trigger);
      break;
    case 'bossIntro':
      showBossIntro(trigger);
      break;
    case 'secretReveal':
      revealSecrets(trigger);
      break;
    case 'ambientChange':
      // Ambient changes are handled by the environment zone system
      break;
    default:
      break;
  }
}

// ---------------------------------------------------------------------------
// Action: spawn_wave
// ---------------------------------------------------------------------------

function spawnTriggeredEntities(trigger: RuntimeTrigger): void {
  const entitiesToSpawn = _triggeredEntities.filter((e) => e.triggerId === trigger.id);
  if (entitiesToSpawn.length === 0) return;

  const storeState = useGameStore.getState();
  const { difficulty, nightmareFlags } = storeState;
  const diffMods = DIFFICULTY_PRESETS[difficulty];
  const nightmareDmgMult = nightmareFlags.nightmare || nightmareFlags.ultraNightmare ? 2 : 1;

  const ENEMY_TYPES: EntityType[] = [
    'goat',
    'hellgoat',
    'fireGoat',
    'shadowGoat',
    'goatKnight',
    'archGoat',
    'infernoGoat',
    'voidGoat',
    'ironGoat',
  ];

  for (const ent of entitiesToSpawn) {
    _spawnCounter++;
    const entityType = ent.entityType as EntityType;

    if (ENEMY_TYPES.includes(entityType)) {
      const stats = getEnemyStats(entityType);
      const scaledHp = Math.ceil(stats.hp * diffMods.enemyHpMult);
      const scaledMaxHp = Math.ceil(stats.maxHp * diffMods.enemyHpMult);
      const scaledDmg = Math.ceil(stats.damage * diffMods.enemyDmgMult * nightmareDmgMult);
      const scaledSpeed = stats.speed * diffMods.enemySpeedMult;
      world.add({
        id: `trigger-enemy-${_spawnCounter}`,
        type: entityType,
        position: vec3(ent.x, 1, ent.z),
        enemy: {
          ...stats,
          hp: scaledHp,
          maxHp: scaledMaxHp,
          damage: scaledDmg,
          speed: scaledSpeed,
          alert: true, // triggered enemies are always alert
          attackCooldown: 0,
        },
      });
      trackEnemySpawn();
    } else if (ent.spawnCategory === 'pickup' || entityType === 'health' || entityType === 'ammo') {
      const isNightmare = nightmareFlags.nightmare || nightmareFlags.ultraNightmare;
      if (isNightmare && entityType === 'health') continue;
      const baseValue = entityType === 'health' ? 25 : 8;
      world.add({
        id: `trigger-pickup-${_spawnCounter}`,
        type: entityType,
        position: vec3(ent.x, 0.5, ent.z),
        pickup: {
          pickupType: entityType as 'health' | 'ammo',
          value: baseValue,
          active: true,
        },
      });
    } else if (entityType === 'weaponPickup') {
      const weaponId =
        ent.overrides && 'weaponId' in ent.overrides
          ? (ent.overrides.weaponId as WeaponId)
          : ('hellPistol' as WeaponId);
      world.add({
        id: `trigger-weapon-${_spawnCounter}`,
        type: 'weaponPickup',
        position: vec3(ent.x, 0.5, ent.z),
        pickup: {
          pickupType: 'weapon',
          value: 0,
          active: true,
          weaponId,
        },
      });
    } else if (ent.spawnCategory === 'boss') {
      const stats = getEnemyStats(entityType);
      const scaledHp = Math.ceil(stats.hp * diffMods.enemyHpMult * 1.5);
      const scaledMaxHp = Math.ceil(stats.maxHp * diffMods.enemyHpMult * 1.5);
      const scaledDmg = Math.ceil(stats.damage * diffMods.enemyDmgMult * nightmareDmgMult);
      world.add({
        id: `trigger-boss-${_spawnCounter}`,
        type: entityType,
        position: vec3(ent.x, 1, ent.z),
        enemy: {
          ...stats,
          hp: scaledHp,
          maxHp: scaledMaxHp,
          damage: scaledDmg,
          speed: stats.speed * diffMods.enemySpeedMult,
          alert: true,
          attackCooldown: 0,
        },
      });
      trackEnemySpawn();
    }
  }
}

// ---------------------------------------------------------------------------
// Action: lock_doors / unlock_doors
// ---------------------------------------------------------------------------

function lockAllDoors(): void {
  // Set all door cells to "locked" by updating their DoorSystem state.
  // The DoorSystem doesn't have a lock API, so we just set all doors to closed
  // by removing any entities near doors and blocking their opening.
  // For now, we store a flag that the DoorSystem can check.
  _doorsLocked = true;
}

function handleUnlockDoors(trigger: RuntimeTrigger): void {
  const condition = trigger.actionData?.condition as string | undefined;

  if (condition === 'allEnemiesKilled') {
    // Register a watcher that unlocks when all enemies are dead
    _unlockWhenClear = true;
  } else {
    _doorsLocked = false;
  }
}

let _doorsLocked = false;
let _unlockWhenClear = false;

/** Returns true if doors are currently locked by a trigger. */
export function areDoorsLocked(): boolean {
  // Check if we should auto-unlock
  if (_doorsLocked && _unlockWhenClear) {
    const enemies = world.entities.filter((e) => e.enemy);
    if (enemies.length === 0) {
      _doorsLocked = false;
      _unlockWhenClear = false;
    }
  }
  return _doorsLocked;
}

// ---------------------------------------------------------------------------
// Action: dialogue
// ---------------------------------------------------------------------------

function showDialogue(trigger: RuntimeTrigger): void {
  const text = trigger.actionData?.text as string | undefined;
  if (!text) return;
  const duration = (trigger.actionData?.duration as number) ?? DIALOGUE_DURATION;
  _dialogueText = text;
  _dialogueExpiry = Date.now() + duration;
}

// ---------------------------------------------------------------------------
// Action: boss_intro
// ---------------------------------------------------------------------------

function showBossIntro(trigger: RuntimeTrigger): void {
  const text = trigger.actionData?.text as string | undefined;
  // Show dialogue text AND transition to boss intro screen
  if (text) {
    _dialogueText = text;
    _dialogueExpiry = Date.now() + 5000;
  }
  useGameStore.getState().patch({ screen: 'bossIntro' });
}

// ---------------------------------------------------------------------------
// Action: secret_reveal
// ---------------------------------------------------------------------------

function revealSecrets(trigger: RuntimeTrigger): void {
  if (!_levelGrid) return;

  // MapCell.WALL_SECRET = 9 — change to MapCell.EMPTY = 0
  const WALL_SECRET = 9;
  const EMPTY = 0;

  // If actionData specifies a zone, only reveal within that zone
  const data = trigger.actionData;
  if (data && typeof data.x === 'number' && typeof data.z === 'number') {
    const gx = data.x as number;
    const gz = data.z as number;
    if (_levelGrid[gz]?.[gx] === WALL_SECRET) {
      _levelGrid[gz][gx] = EMPTY;
    }
    return;
  }

  // Otherwise reveal all secret walls in the trigger zone (grid coords)
  const gridMinX = Math.floor(trigger.zoneX / CELL_SIZE);
  const gridMinZ = Math.floor(trigger.zoneZ / CELL_SIZE);
  const gridMaxX = Math.ceil((trigger.zoneX + trigger.zoneW) / CELL_SIZE);
  const gridMaxZ = Math.ceil((trigger.zoneZ + trigger.zoneH) / CELL_SIZE);

  for (let z = gridMinZ; z <= gridMaxZ && z < _levelGrid.length; z++) {
    for (let x = gridMinX; x <= gridMaxX && x < (_levelGrid[0]?.length ?? 0); x++) {
      if (_levelGrid[z]?.[x] === WALL_SECRET) {
        _levelGrid[z][x] = EMPTY;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Dialogue accessor (for HUD)
// ---------------------------------------------------------------------------

/**
 * Get the active dialogue text and its fade opacity.
 * Returns null if no dialogue is currently active.
 */
export function getActiveDialogue(): { text: string; opacity: number } | null {
  if (_dialogueText === null) return null;
  const now = Date.now();
  if (now >= _dialogueExpiry) {
    _dialogueText = null;
    return null;
  }

  const remaining = _dialogueExpiry - now;
  // Fade in during first 300ms, fade out during last 500ms
  const elapsed = DIALOGUE_DURATION - remaining;

  let opacity = 1;
  if (elapsed < 300) {
    opacity = elapsed / 300;
  } else if (remaining < 500) {
    opacity = remaining / 500;
  }

  return { text: _dialogueText, opacity };
}
