/**
 * enemyStats tests — verify all enemy type stats are correct and consistent.
 */

import type { EntityType } from '../components';
import { getEnemyStats } from '../enemyStats';

const REGULAR_TYPES: EntityType[] = ['hellgoat', 'fireGoat', 'shadowGoat', 'goatKnight'];
const BOSS_TYPES: EntityType[] = ['archGoat', 'infernoGoat', 'voidGoat', 'ironGoat'];

describe('getEnemyStats', () => {
  it('returns stats for all regular enemy types', () => {
    for (const type of REGULAR_TYPES) {
      const stats = getEnemyStats(type);
      expect(stats.hp).toBeGreaterThan(0);
      expect(stats.maxHp).toBe(stats.hp);
      expect(stats.damage).toBeGreaterThan(0);
      expect(stats.speed).toBeGreaterThan(0);
      expect(stats.attackRange).toBeGreaterThan(0);
      expect(stats.scoreValue).toBeGreaterThan(0);
    }
  });

  it('returns stats for all boss types', () => {
    for (const type of BOSS_TYPES) {
      const stats = getEnemyStats(type);
      expect(stats.hp).toBeGreaterThanOrEqual(60);
      expect(stats.scoreValue).toBeGreaterThanOrEqual(1000);
    }
  });

  it('bosses have more HP than regular enemies', () => {
    const maxRegularHp = Math.max(...REGULAR_TYPES.map((t) => getEnemyStats(t).hp));
    const minBossHp = Math.min(...BOSS_TYPES.map((t) => getEnemyStats(t).hp));
    expect(minBossHp).toBeGreaterThan(maxRegularHp);
  });

  it('bosses have higher score values than regular enemies', () => {
    const maxRegularScore = Math.max(...REGULAR_TYPES.map((t) => getEnemyStats(t).scoreValue));
    const minBossScore = Math.min(...BOSS_TYPES.map((t) => getEnemyStats(t).scoreValue));
    expect(minBossScore).toBeGreaterThan(maxRegularScore);
  });

  it('fireGoat can shoot', () => {
    const stats = getEnemyStats('fireGoat');
    expect(stats.canShoot).toBe(true);
    expect(stats.shootCooldown).toBeGreaterThan(0);
  });

  it('shadowGoat is invisible', () => {
    const stats = getEnemyStats('shadowGoat');
    expect(stats.isInvisible).toBe(true);
    expect(stats.visibilityAlpha).toBeLessThan(1);
  });

  it('goatKnight is armored', () => {
    const stats = getEnemyStats('goatKnight');
    expect(stats.isArmored).toBe(true);
    expect(stats.armorHp).toBeGreaterThan(0);
  });

  it('ironGoat has armor with maxHp tracking', () => {
    const stats = getEnemyStats('ironGoat');
    expect(stats.isArmored).toBe(true);
    expect(stats.armorHp).toBe(30);
    expect(stats.armorMaxHp).toBe(30);
  });

  it('returns default stats for unknown type', () => {
    const stats = getEnemyStats('unknown_type' as EntityType);
    expect(stats.hp).toBe(5);
    expect(stats.maxHp).toBe(5);
    expect(stats.scoreValue).toBe(100);
  });

  it('hp equals maxHp for all types', () => {
    for (const type of [...REGULAR_TYPES, ...BOSS_TYPES]) {
      const stats = getEnemyStats(type);
      expect(stats.hp).toBe(stats.maxHp);
    }
  });
});
