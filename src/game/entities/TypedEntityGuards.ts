import type { Entity, WeaponId } from './components';

// Typed entity subtypes — narrow Entity to guarantee specific components exist
export type PlayerEntity = Entity & {
  type: 'player';
  player: NonNullable<Entity['player']>;
  ammo: NonNullable<Entity['ammo']>;
  position: NonNullable<Entity['position']>;
};

export type EnemyEntity = Entity & {
  enemy: NonNullable<Entity['enemy']>;
  position: NonNullable<Entity['position']>;
};

export type ProjectileEntity = Entity & {
  projectile: NonNullable<Entity['projectile']>;
  position: NonNullable<Entity['position']>;
};

export type PickupEntity = Entity & {
  pickup: NonNullable<Entity['pickup']>;
  position: NonNullable<Entity['position']>;
};

// Type guard functions
export function isPlayerEntity(e: Entity): e is PlayerEntity {
  return e.type === 'player' && !!e.player && !!e.ammo && !!e.position;
}

export function isEnemyEntity(e: Entity): e is EnemyEntity {
  return !!e.enemy && !!e.position;
}

export function isProjectileEntity(e: Entity): e is ProjectileEntity {
  return !!e.projectile && !!e.position;
}

export function isPickupEntity(e: Entity): e is PickupEntity {
  return !!e.pickup && !!e.position;
}

/** Get the ammo state for the player's currently equipped weapon. */
export function getActiveAmmo(
  player: PlayerEntity,
): { current: number; reserve: number; magSize: number } | undefined {
  return player.ammo[player.player.currentWeapon as WeaponId];
}
