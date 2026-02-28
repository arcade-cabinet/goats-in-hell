/**
 * Engine-agnostic ECS component types.
 *
 * Previously used Babylon.js Vector3/Mesh/ParticleSystem — now uses
 * plain Vec3 objects. Rendering is managed by R3F components that
 * read these ECS positions each frame.
 */

/** Simple 3D vector — engine-agnostic replacement for Babylon Vector3. */
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export type EntityType =
  | 'player'
  | 'goat'
  | 'hellgoat'
  | 'fireGoat'
  | 'shadowGoat'
  | 'goatKnight'
  | 'archGoat'
  | 'infernoGoat'
  | 'voidGoat'
  | 'ironGoat'
  | 'projectile'
  | 'health'
  | 'ammo'
  | 'weaponPickup'
  | 'powerup'
  | 'door'
  | 'decoration'
  | 'hazard_spikes'
  | 'hazard_barrel';

export type WeaponId = 'hellPistol' | 'brimShotgun' | 'hellfireCannon' | 'goatsBane';

export type Entity = {
  id?: string;
  type?: EntityType;

  // Transform
  position?: Vec3;
  rotation?: Vec3;
  velocity?: Vec3;
  scale?: Vec3;

  // Player
  player?: {
    hp: number;
    maxHp: number;
    speed: number;
    sprintMult: number;
    currentWeapon: WeaponId;
    weapons: WeaponId[];
    isReloading: boolean;
    reloadStart: number;
  };

  // Enemy
  enemy?: {
    hp: number;
    maxHp: number;
    damage: number;
    speed: number;
    attackRange: number;
    alert: boolean;
    attackCooldown: number;
    scoreValue: number;
    // Type-specific
    canShoot?: boolean;
    shootCooldown?: number;
    isArmored?: boolean;
    armorHp?: number;
    armorMaxHp?: number;
    isInvisible?: boolean;
    visibilityAlpha?: number;
    // Stagger state
    staggerTimer?: number; // ms remaining of stagger
    staggerDirX?: number; // knockback direction
    staggerDirZ?: number;
    // Boss-specific ability cooldowns
    _fireRingCd?: number;
    _slamCd?: number;
  };

  // Weapon ammo (per-weapon)
  ammo?: Record<WeaponId, { current: number; reserve: number; magSize: number }>;

  // Projectile
  projectile?: {
    life: number;
    damage: number;
    speed: number;
    owner: 'player' | 'enemy';
    aoe?: number;
  };

  // Pickup
  pickup?: {
    pickupType: 'health' | 'ammo' | 'weapon' | 'powerup';
    value: number;
    weaponId?: WeaponId;
    powerUpType?: import('../systems/PowerUpSystem').PowerUpType;
    active: boolean;
  };

  // Door
  door?: { open: boolean; opening: boolean; openProgress: number };

  // Environmental hazard
  hazard?: {
    hazardType: 'spikes' | 'barrel';
    damage: number;
    cooldown: number;
    hp?: number; // for destructible hazards like barrels
  };
};
