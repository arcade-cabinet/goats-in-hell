import {Vector3} from '@babylonjs/core';
import type {Entity, EntityType} from '../entities/components';
import {world} from '../entities/world';
import {GameState} from '../../state/GameState';

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

let currentWave = 0;
let waveActive = false;
let spawnTimer = 0;
let enemiesSpawnedThisWave = 0;
let totalEnemiesForWave = 0;
let killStreak = 0;
let lastKillTime = 0;
let scoreMultiplier = 1;
let lastKnownKills = 0;

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

/** Reset all wave system state to initial values. */
export function resetWaveSystem(): void {
  currentWave = 0;
  waveActive = false;
  spawnTimer = 0;
  enemiesSpawnedThisWave = 0;
  totalEnemiesForWave = 0;
  killStreak = 0;
  lastKillTime = 0;
  scoreMultiplier = 1;
  lastKnownKills = 0;
}

// ---------------------------------------------------------------------------
// Wave progression
// ---------------------------------------------------------------------------

/** Begin the next wave by incrementing the counter and preparing spawn state. */
export function startNextWave(): void {
  currentWave++;
  waveActive = true;
  spawnTimer = 0;
  enemiesSpawnedThisWave = 0;
  totalEnemiesForWave = Math.min(30, 3 + currentWave * 2);
}

// ---------------------------------------------------------------------------
// Enemy type selection
// ---------------------------------------------------------------------------

/** Pick a random enemy type from the pool available at the given wave. */
export function getEnemyTypeForWave(wave: number): EntityType {
  const pool: EntityType[] = ['goat'];

  if (wave >= 3) {
    pool.push('hellgoat');
  }
  if (wave >= 5) {
    pool.push('fireGoat');
  }
  if (wave >= 7) {
    pool.push('shadowGoat');
  }
  if (wave >= 9) {
    pool.push('goatKnight');
  }

  // Every 5th wave has a 10% chance for an archGoat
  if (wave % 5 === 0 && Math.random() < 0.1) {
    return 'archGoat';
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

// ---------------------------------------------------------------------------
// Enemy stats
// ---------------------------------------------------------------------------

type EnemyStats = {
  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
  attackRange: number;
  scoreValue: number;
  canShoot?: boolean;
  isInvisible?: boolean;
  isArmored?: boolean;
  armorHp?: number;
};

/** Return base stats for the given enemy type. */
export function getEnemyStats(type: EntityType): EnemyStats {
  switch (type) {
    case 'goat':
      return {
        hp: 5,
        maxHp: 5,
        damage: 5,
        speed: 0.04,
        attackRange: 2,
        scoreValue: 100,
      };
    case 'hellgoat':
      return {
        hp: 8,
        maxHp: 8,
        damage: 8,
        speed: 0.06,
        attackRange: 2,
        scoreValue: 250,
      };
    case 'fireGoat':
      return {
        hp: 6,
        maxHp: 6,
        damage: 4,
        speed: 0.03,
        attackRange: 2,
        scoreValue: 200,
        canShoot: true,
      };
    case 'shadowGoat':
      return {
        hp: 4,
        maxHp: 4,
        damage: 10,
        speed: 0.07,
        attackRange: 1.5,
        scoreValue: 300,
        isInvisible: true,
      };
    case 'goatKnight':
      return {
        hp: 15,
        maxHp: 15,
        damage: 12,
        speed: 0.03,
        attackRange: 2,
        scoreValue: 400,
        isArmored: true,
        armorHp: 5,
      };
    case 'archGoat':
      return {
        hp: 100,
        maxHp: 100,
        damage: 15,
        speed: 0.02,
        attackRange: 3,
        scoreValue: 1000,
      };
    default:
      return {
        hp: 5,
        maxHp: 5,
        damage: 5,
        speed: 0.04,
        attackRange: 2,
        scoreValue: 100,
      };
  }
}

// ---------------------------------------------------------------------------
// Main update loop
// ---------------------------------------------------------------------------

/** Call once per frame to drive wave spawning and kill-streak tracking. */
export function waveSystemUpdate(deltaTime: number, arenaSize: number): void {
  const state = GameState.get();

  // ------------------------------------------------------------------
  // Count remaining enemies
  // ------------------------------------------------------------------
  let enemyCount = 0;
  for (const entity of world.entities) {
    if (entity.enemy) {
      enemyCount++;
    }
  }

  // ------------------------------------------------------------------
  // If no enemies remain and the wave is not actively spawning, start next
  // ------------------------------------------------------------------
  if (enemyCount === 0 && !waveActive) {
    startNextWave();
  }

  // ------------------------------------------------------------------
  // Spawn enemies while the wave is active
  // ------------------------------------------------------------------
  if (waveActive && enemiesSpawnedThisWave < totalEnemiesForWave) {
    spawnTimer--;

    if (spawnTimer <= 0) {
      // Pick a random edge spawn point
      const edge = Math.floor(Math.random() * 4);
      let sx: number;
      let sz: number;

      switch (edge) {
        case 0: // top edge
          sx = 2 + Math.floor(Math.random() * (arenaSize - 4));
          sz = 1;
          break;
        case 1: // bottom edge
          sx = 2 + Math.floor(Math.random() * (arenaSize - 4));
          sz = arenaSize - 2;
          break;
        case 2: // left edge
          sx = 1;
          sz = 2 + Math.floor(Math.random() * (arenaSize - 4));
          break;
        default: // right edge
          sx = arenaSize - 2;
          sz = 2 + Math.floor(Math.random() * (arenaSize - 4));
          break;
      }

      const enemyType = getEnemyTypeForWave(currentWave);
      const stats = getEnemyStats(enemyType);

      const entity: Entity = {
        type: enemyType,
        position: new Vector3(sx * 2, 0, sz * 2), // multiply by CELL_SIZE (2)
        enemy: {
          hp: stats.hp,
          maxHp: stats.maxHp,
          damage: stats.damage,
          speed: stats.speed,
          attackRange: stats.attackRange,
          alert: true, // arena enemies are always alert
          attackCooldown: 0,
          scoreValue: stats.scoreValue,
          canShoot: stats.canShoot,
          isArmored: stats.isArmored,
          armorHp: stats.armorHp,
          isInvisible: stats.isInvisible,
        },
      };

      world.add(entity);

      spawnTimer = 60; // one enemy per second at 60fps
      enemiesSpawnedThisWave++;
    }

    // All enemies for this wave have been spawned - let the player clear them
    if (enemiesSpawnedThisWave >= totalEnemiesForWave) {
      waveActive = false;
    }
  }

  // ------------------------------------------------------------------
  // Kill streak tracking
  // ------------------------------------------------------------------
  const currentKills = state.kills;
  const now = Date.now();

  if (currentKills > lastKnownKills) {
    // A kill just happened
    if (now - lastKillTime < 3000) {
      // Within 3 seconds of last kill - extend the streak
      killStreak += currentKills - lastKnownKills;
      scoreMultiplier = Math.min(3, 1 + killStreak * 0.1);
    } else {
      // Streak broken - reset
      killStreak = 1;
      scoreMultiplier = 1;
    }
    lastKillTime = now;
    lastKnownKills = currentKills;
  } else if (now - lastKillTime >= 3000 && killStreak > 0) {
    // No kills for 3 seconds - reset streak
    killStreak = 0;
    scoreMultiplier = 1;
  }
}

// ---------------------------------------------------------------------------
// HUD info
// ---------------------------------------------------------------------------

/** Return current wave state for HUD display. */
export function getWaveInfo(): {
  wave: number;
  multiplier: number;
  streak: number;
} {
  return {
    wave: currentWave,
    multiplier: scoreMultiplier,
    streak: killStreak,
  };
}
