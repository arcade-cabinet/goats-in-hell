/** EnemyStats -- canonical base stats for every enemy type in the game. */
import type { Entity, EntityType } from './components';

/**
 * Return the base combat stats for a given enemy type.
 * These are the pre-difficulty-scaling values used by EntitySpawner.
 * Alert state and attack cooldown are initialized separately at spawn time.
 *
 * @param type - The entity type to look up stats for.
 * @returns Base enemy stats excluding runtime state fields.
 */
export function getEnemyStats(
  type: EntityType,
): Omit<NonNullable<Entity['enemy']>, 'alert' | 'attackCooldown'> {
  switch (type) {
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
        shootCooldown: 90,
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
        visibilityAlpha: 0.15,
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
        canShoot: true,
        shootCooldown: 120,
      };
    case 'infernoGoat':
      return {
        hp: 80,
        maxHp: 80,
        damage: 12,
        speed: 0.03,
        attackRange: 3,
        scoreValue: 1200,
        canShoot: true,
        shootCooldown: 60,
      };
    case 'voidGoat':
      return {
        hp: 60,
        maxHp: 60,
        damage: 18,
        speed: 0.05,
        attackRange: 2.5,
        scoreValue: 1500,
        isInvisible: true,
        visibilityAlpha: 0.3,
      };
    case 'ironGoat':
      return {
        hp: 150,
        maxHp: 150,
        damage: 20,
        speed: 0.015,
        attackRange: 2.5,
        scoreValue: 1800,
        isArmored: true,
        armorHp: 30,
        armorMaxHp: 30,
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
