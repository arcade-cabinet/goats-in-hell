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

/**
 * Union of all entity type identifiers used by the ECS.
 * Encompasses player, enemy variants, projectiles, pickups, doors, and hazards.
 */
export type EntityType =
  | 'player'
  | 'goat'
  | 'hellgoat'
  | 'fireGoat'
  | 'shadowGoat'
  | 'goatKnight'
  | 'plagueGoat'
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

/** Identifier for each weapon type the player can equip. */
export type WeaponId =
  | 'hellPistol'
  | 'brimShotgun'
  | 'hellfireCannon'
  | 'goatsBane'
  | 'brimstoneFlamethrower';

/**
 * Core ECS entity shape — every entity in the game is a sparse bag of these
 * optional component groups. Miniplex queries filter on which components
 * are present (e.g. `world.with("enemy", "position")`).
 */
export type Entity = {
  id?: string;
  type?: EntityType;

  // --- Transform ---
  position?: Vec3;
  rotation?: Vec3;
  /** Per-frame velocity vector, consumed by physics/movement systems. */
  velocity?: Vec3;
  scale?: Vec3;

  // --- Player ---
  /** Present only on the single player entity. */
  player?: {
    hp: number;
    maxHp: number;
    /** Base movement speed in world-units/frame. */
    speed: number;
    /** Multiplier applied when sprint input is held. */
    sprintMult: number;
    currentWeapon: WeaponId;
    /** Ordered list of weapons the player has collected. */
    weapons: WeaponId[];
    isReloading: boolean;
    /** Timestamp (ms) when the current reload began. */
    reloadStart: number;
    /** Current fuel for flamethrower (0-100). */
    fuel: number;
    /** Max fuel capacity. */
    fuelMax: number;
  };

  // --- Enemy ---
  /** Present on all enemy entities (regular mobs + bosses). */
  enemy?: {
    hp: number;
    maxHp: number;
    /** Melee damage dealt per attack. */
    damage: number;
    /** Movement speed in world-units/frame. */
    speed: number;
    /** Distance (world units) at which the enemy can strike. */
    attackRange: number;
    /** True once the enemy has detected the player. */
    alert: boolean;
    /** Frames remaining before the enemy can attack again. */
    attackCooldown: number;
    /** XP/score awarded on kill. */
    scoreValue: number;
    // Type-specific
    /** Whether this enemy fires ranged projectiles. */
    canShoot?: boolean;
    /** Frames between ranged shots. */
    shootCooldown?: number;
    /** Whether this enemy has an armor layer that absorbs damage first. */
    isArmored?: boolean;
    /** Current armor hit-points (absorb damage before HP). */
    armorHp?: number;
    /** Maximum armor hit-points (for armor bar UI). */
    armorMaxHp?: number;
    /** Whether this enemy uses stealth (reduced alpha). */
    isInvisible?: boolean;
    /** Mesh opacity when stealthed (0 = fully invisible, 1 = visible). */
    visibilityAlpha?: number;
    /** Milliseconds remaining of stagger (hit-stun). */
    staggerTimer?: number;
    /** X component of knockback direction during stagger. */
    staggerDirX?: number;
    /** Z component of knockback direction during stagger. */
    staggerDirZ?: number;
    /** Boss ability cooldown — fire ring attack (frames). */
    _fireRingCd?: number;
    /** Boss ability cooldown — ground slam attack (frames). */
    _slamCd?: number;
  };

  /** Per-weapon ammo state — keyed by WeaponId. */
  ammo?: Record<WeaponId, { current: number; reserve: number; magSize: number }>;

  /** Present on in-flight projectile entities. */
  projectile?: {
    /** Remaining lifetime in frames before auto-despawn. */
    life: number;
    damage: number;
    /** Travel speed in world-units/frame. */
    speed: number;
    /** Who fired this projectile — determines friendly-fire rules. */
    owner: 'player' | 'enemy';
    /** Area-of-effect radius (world units). Undefined = single-target. */
    aoe?: number;
  };

  /** Present on collectible pickup entities (health, ammo, weapons, power-ups). */
  pickup?: {
    pickupType: 'health' | 'ammo' | 'weapon' | 'powerup';
    /** Amount restored or granted (HP for health, rounds for ammo). */
    value: number;
    /** Weapon granted when pickupType is 'weapon'. */
    weaponId?: WeaponId;
    /** Power-up variant when pickupType is 'powerup'. */
    powerUpType?: import('../systems/PowerUpSystem').PowerUpType;
    /** False once collected — pending removal from the world. */
    active: boolean;
  };

  /** Present on door entities — animated open/close state. */
  door?: {
    open: boolean;
    opening: boolean /** 0-1 open animation progress. */;
    openProgress: number;
  };

  /** Present on environmental hazard entities (spike traps, barrels). */
  hazard?: {
    hazardType: 'spikes' | 'barrel';
    /** Damage dealt on contact or explosion. */
    damage: number;
    /** Frames until the hazard can damage again. */
    cooldown: number;
    /** Hit-points for destructible hazards (e.g. barrels). */
    hp?: number;
  };
};
