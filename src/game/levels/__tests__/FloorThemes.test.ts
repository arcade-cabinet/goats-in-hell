/**
 * FloorThemes tests — theme cycling, properties, floor-to-theme mapping.
 */

import {getThemeForFloor, FloorTheme} from '../FloorThemes';

describe('getThemeForFloor', () => {
  it('floor 1 returns firePits', () => {
    const theme = getThemeForFloor(1);
    expect(theme.name).toBe('firePits');
    expect(theme.displayName).toBe('THE FIRE PITS');
  });

  it('floor 2 returns fleshCaverns', () => {
    expect(getThemeForFloor(2).name).toBe('fleshCaverns');
  });

  it('floor 3 returns obsidianFortress', () => {
    expect(getThemeForFloor(3).name).toBe('obsidianFortress');
  });

  it('floor 4 returns theVoid', () => {
    expect(getThemeForFloor(4).name).toBe('theVoid');
  });

  it('floor 5 cycles back to firePits', () => {
    expect(getThemeForFloor(5).name).toBe('firePits');
  });

  it('floor 8 cycles to theVoid', () => {
    expect(getThemeForFloor(8).name).toBe('theVoid');
  });

  it('floor 20 cycles correctly (20-1=19, 19%4=3 -> theVoid)', () => {
    expect(getThemeForFloor(20).name).toBe('theVoid');
  });
});

describe('theme properties', () => {
  it('all themes have required fields', () => {
    for (let floor = 1; floor <= 4; floor++) {
      const theme = getThemeForFloor(floor);
      expect(theme.name).toBeTruthy();
      expect(theme.displayName).toBeTruthy();
      expect(theme.primaryWall).toBeGreaterThan(0);
      expect(theme.accentWalls.length).toBeGreaterThan(0);
      expect(theme.enemyTypes.length).toBeGreaterThan(0);
      expect(theme.enemyDensity).toBeGreaterThan(0);
      expect(theme.pickupDensity).toBeGreaterThan(0);
      expect(theme.ambientColor).toMatch(/^#/);
    }
  });

  it('enemy density increases from firePits to theVoid', () => {
    const densities = [1, 2, 3, 4].map(f => getThemeForFloor(f).enemyDensity);
    for (let i = 1; i < densities.length; i++) {
      expect(densities[i]).toBeGreaterThanOrEqual(densities[i - 1]);
    }
  });

  it('each theme has unique display name', () => {
    const names = new Set([1, 2, 3, 4].map(f => getThemeForFloor(f).displayName));
    expect(names.size).toBe(4);
  });
});
