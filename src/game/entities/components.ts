import {Mesh, Vector3, ParticleSystem} from '@babylonjs/core';

export type EntityType =
  | 'player'
  | 'goat' | 'hellgoat' | 'fireGoat' | 'shadowGoat' | 'goatKnight'
  | 'archGoat' | 'infernoGoat' | 'voidGoat' | 'ironGoat'
  | 'projectile'
  | 'health' | 'ammo' | 'weaponPickup'
  | 'door' | 'decoration'
  | 'hazard_spikes' | 'hazard_barrel';

export type WeaponId = 'hellPistol' | 'brimShotgun' | 'hellfireCannon' | 'goatsBane';

export type Entity = {
  id?: string;
  type?: EntityType;

  // Transform
  position?: Vector3;
  rotation?: Vector3;
  velocity?: Vector3;
  scale?: Vector3;

  // Rendering
  mesh?: Mesh;
  particles?: ParticleSystem;

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
    // Boss-specific ability cooldowns
    _fireRingCd?: number;
    _slamCd?: number;
  };

  // Weapon ammo (per-weapon)
  ammo?: Record<WeaponId, {current: number; reserve: number; magSize: number}>;

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
    pickupType: 'health' | 'ammo' | 'weapon';
    value: number;
    weaponId?: WeaponId;
    active: boolean;
  };

  // Door
  door?: {open: boolean; opening: boolean; openProgress: number};

  // Environmental hazard
  hazard?: {
    hazardType: 'spikes' | 'barrel';
    damage: number;
    cooldown: number;
    hp?: number; // for destructible hazards like barrels
  };
};
