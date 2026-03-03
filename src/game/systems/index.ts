/**
 * Game systems barrel export.
 *
 * Re-exports all engine-agnostic ECS systems: AI, audio, combat,
 * doors, enemies, game clock, hazards, kill streaks, music,
 * pickups, player damage, power-ups, progression, secrets,
 * waves, assets, and damage events.
 */

// AI
export {
  type AICamera,
  type AIDebugInfo,
  AIGovernor,
  type AIOutputFrame,
  type AIState,
} from './AIGovernor';
export { aiSystemReset, aiSystemUpdate } from './AISystem';

// Ambient sound
export {
  disposeAmbientSound,
  initAmbientSound,
  setAmbientBiome,
  setAmbientVolume,
  updateAmbientSound,
} from './AmbientSoundSystem';

// Assets
export {
  type LoadProgress,
  loadAllMusic,
  loadAllSfx,
  type ProgressCallback,
} from './AssetLoader';
export { loadAllAssets } from './AssetPipeline';
export {
  ENEMY_MODEL_ASSETS,
  TEXTURE_ASSETS,
  type TextureAssetKey,
  WEAPON_MODEL_ASSETS,
  type WeaponModelKey,
} from './AssetRegistry';

// Audio
export {
  initAudio,
  playSound,
  type SoundType,
  setMasterVolume,
  setSfxBuffers,
} from './AudioSystem';

// Combat
export {
  combatSystemUpdate,
  damageEnemy,
  handleEnemyKill,
  removeEntity,
} from './CombatSystem';
// Doors
export {
  type DoorState,
  doorSystemUpdate,
  getDoorStates,
  resetDoorSystem,
} from './DoorSystem';
// Damage events
export {
  clearDamageEvents,
  consumeDamageEvents,
  type DamageEvent,
  pushDamageEvent,
} from './damageEvents';

// Enemy projectile bridge
export {
  clearEnemyProjectileBridge,
  type SpawnEnemyProjectileFn,
  setEnemyProjectileBridge,
  spawnEnemyProjectile,
} from './EnemyProjectileBridge';

// Entity spawner
export { ENEMY_TYPES, spawnBoss, spawnLevelEntities } from './EntitySpawner';

// Game clock
export {
  getFrameCount,
  getGameDelta,
  getGameTime,
  resetGameClock,
  tickGameClock,
} from './GameClock';

// Hazards
export {
  damageBarrel,
  hazardSystemUpdate,
  resetHazardSystem,
} from './HazardSystem';

// Kill streaks
export {
  getAnnouncement,
  getStreakCount,
  registerKill,
  resetKillStreaks,
} from './KillStreakSystem';

// Music
export {
  initMusic,
  playTrack,
  setMusicBuffers,
  setMusicMasterVolume,
  stopMusic,
} from './MusicSystem';

// Pickups
export { pickupSystemUpdate } from './PickupSystem';

// Player damage bridge
export {
  bridgeDamagePlayer,
  clearPlayerDamageBridge,
  type DamagePlayerFn,
  setPlayerDamageBridge,
} from './PlayerDamageBridge';

// Power-ups
export {
  activatePowerUp,
  getDamageMultiplier,
  POWERUP_CONFIG,
  type PowerUpType,
  powerUpSystemUpdate,
} from './PowerUpSystem';

// Progression
export {
  advanceFloor,
  checkFloorComplete,
  checkPlayerDeath,
  resetFloorProgression,
  trackEnemySpawn,
} from './ProgressionSystem';

// Secret rooms
export {
  checkSecretWalls,
  getSecretNotifyTimer,
  getSecretsFound,
  resetSecrets,
  tickSecretTimer,
} from './SecretRoomSystem';
