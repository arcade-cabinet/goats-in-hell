/** EnemyStats -- canonical base stats for every enemy type, loaded from config/enemies.json. */
import { enemyConfig } from '../../config';
import type { Entity, EntityType } from './components';

type EnemyStatBlock = Omit<NonNullable<Entity['enemy']>, 'alert' | 'attackCooldown'>;

/**
 * Return the base combat stats for a given enemy type.
 * These are the pre-difficulty-scaling values used by EntitySpawner.
 * Alert state and attack cooldown are initialized separately at spawn time.
 *
 * @param type - The entity type to look up stats for.
 * @returns Base enemy stats excluding runtime state fields.
 */
export function getEnemyStats(type: EntityType): EnemyStatBlock {
  const cfg = (enemyConfig as Record<string, Partial<EnemyStatBlock>>)[type] ?? enemyConfig.default;
  const def = enemyConfig.default;

  return {
    hp: cfg.hp ?? def.hp,
    maxHp: cfg.hp ?? def.hp,
    damage: cfg.damage ?? def.damage,
    speed: cfg.speed ?? def.speed,
    attackRange: cfg.attackRange ?? def.attackRange,
    scoreValue: cfg.scoreValue ?? def.scoreValue,
    ...(cfg.canShoot ? { canShoot: true, shootCooldown: cfg.shootCooldown ?? 90 } : {}),
    ...(cfg.isInvisible ? { isInvisible: true, visibilityAlpha: cfg.visibilityAlpha ?? 0.2 } : {}),
    ...(cfg.isArmored
      ? {
          isArmored: true,
          armorHp: cfg.armorHp ?? 5,
          armorMaxHp: cfg.armorMaxHp ?? cfg.armorHp ?? 5,
        }
      : {}),
  };
}
