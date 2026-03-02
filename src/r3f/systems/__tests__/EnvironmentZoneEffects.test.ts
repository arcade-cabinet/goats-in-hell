/**
 * Tests for EnvironmentZoneEffects — zone containment checks,
 * speed modifiers, and wind force application.
 */

// Mock CombatSystem.damagePlayer before importing the module under test
jest.mock('../CombatSystem', () => ({
  damagePlayer: jest.fn(() => true),
}));

import type { RuntimeEnvZone } from '../../../db/LevelDbAdapter';
import { damagePlayer } from '../CombatSystem';
import {
  getWindForce,
  getZoneSpeedMult,
  resetZoneEffects,
  updateZoneEffects,
} from '../EnvironmentZoneEffects';

const mockedDamagePlayer = damagePlayer as jest.MockedFunction<typeof damagePlayer>;

function makeZone(overrides: Partial<RuntimeEnvZone> & { envType: string }): RuntimeEnvZone {
  const { envType, ...rest } = overrides;
  return {
    id: 'test-zone',
    envType,
    x: 0,
    z: 0,
    w: 10,
    h: 10,
    intensity: 1.0,
    dirX: 0,
    dirZ: 0,
    timerOn: 0,
    timerOff: 0,
    ...rest,
  };
}

describe('EnvironmentZoneEffects', () => {
  beforeEach(() => {
    resetZoneEffects();
    mockedDamagePlayer.mockClear();
  });

  describe('getZoneSpeedMult', () => {
    it('returns 1 when no zones are active', () => {
      updateZoneEffects(5, 5, [], 16);
      expect(getZoneSpeedMult()).toBe(1);
    });

    it('returns 0.5 when player is inside an ice zone', () => {
      const zones = [makeZone({ envType: 'ice', x: 0, z: 0, w: 10, h: 10 })];
      updateZoneEffects(5, 5, zones, 16);
      expect(getZoneSpeedMult()).toBe(0.5);
    });

    it('returns 0.5 for frost zones', () => {
      const zones = [makeZone({ envType: 'frost', x: 0, z: 0, w: 10, h: 10 })];
      updateZoneEffects(5, 5, zones, 16);
      expect(getZoneSpeedMult()).toBe(0.5);
    });

    it('returns 1 when player is outside the ice zone', () => {
      const zones = [makeZone({ envType: 'ice', x: 20, z: 20, w: 5, h: 5 })];
      updateZoneEffects(5, 5, zones, 16);
      expect(getZoneSpeedMult()).toBe(1);
    });

    it('resets to 1 each frame', () => {
      const zones = [makeZone({ envType: 'ice', x: 0, z: 0, w: 10, h: 10 })];
      updateZoneEffects(5, 5, zones, 16);
      expect(getZoneSpeedMult()).toBe(0.5);

      // Player steps outside
      updateZoneEffects(15, 15, zones, 16);
      expect(getZoneSpeedMult()).toBe(1);
    });
  });

  describe('getWindForce', () => {
    it('returns zero wind when no zones active', () => {
      updateZoneEffects(5, 5, [], 16);
      const wind = getWindForce();
      expect(wind.x).toBe(0);
      expect(wind.z).toBe(0);
    });

    it('applies wind force when player is inside wind zone', () => {
      const zones = [
        makeZone({
          envType: 'wind',
          x: 0,
          z: 0,
          w: 10,
          h: 10,
          dirX: 1,
          dirZ: 0,
          intensity: 1.0,
        }),
      ];
      updateZoneEffects(5, 5, zones, 16);
      const wind = getWindForce();
      expect(wind.x).toBe(4); // dirX * intensity * 4
      expect(wind.z).toBe(0);
    });

    it('sums multiple wind zones', () => {
      const zones = [
        makeZone({
          id: 'wind-1',
          envType: 'wind',
          x: 0,
          z: 0,
          w: 10,
          h: 10,
          dirX: 1,
          dirZ: 0,
          intensity: 0.5,
        }),
        makeZone({
          id: 'wind-2',
          envType: 'wind',
          x: 0,
          z: 0,
          w: 10,
          h: 10,
          dirX: 0,
          dirZ: 1,
          intensity: 1.0,
        }),
      ];
      updateZoneEffects(5, 5, zones, 16);
      const wind = getWindForce();
      expect(wind.x).toBe(2); // 1 * 0.5 * 4
      expect(wind.z).toBe(4); // 1 * 1.0 * 4
    });
  });

  describe('fire/acid damage', () => {
    it('deals damage over time when player is in fire zone', () => {
      const zones = [makeZone({ envType: 'fire', intensity: 1.0 })];

      // Simulate 1 second of exposure — 5 DPS at intensity 1
      updateZoneEffects(5, 5, zones, 1000);
      expect(mockedDamagePlayer).toHaveBeenCalledWith(5);
    });

    it('deals damage from acid zones', () => {
      const zones = [makeZone({ envType: 'acid', intensity: 1.0 })];
      updateZoneEffects(5, 5, zones, 1000);
      expect(mockedDamagePlayer).toHaveBeenCalledWith(5);
    });

    it('does not deal damage when player is outside fire zone', () => {
      const zones = [makeZone({ envType: 'fire', x: 50, z: 50, w: 5, h: 5 })];
      updateZoneEffects(5, 5, zones, 1000);
      expect(mockedDamagePlayer).not.toHaveBeenCalled();
    });

    it('accumulates fractional damage across frames', () => {
      const zones = [makeZone({ envType: 'fire', intensity: 1.0 })];

      // At 5 DPS, 100ms = 0.5 damage — should not tick yet
      updateZoneEffects(5, 5, zones, 100);
      expect(mockedDamagePlayer).not.toHaveBeenCalled();

      // Another 100ms = 1.0 accumulated — should tick 1 damage
      updateZoneEffects(5, 5, zones, 100);
      expect(mockedDamagePlayer).toHaveBeenCalledWith(1);
    });

    it('scales damage with intensity', () => {
      const zones = [makeZone({ envType: 'fire', intensity: 0.5 })];

      // 0.5 intensity * 5 DPS = 2.5 DPS, 1 second = 2 damage (floor)
      updateZoneEffects(5, 5, zones, 1000);
      expect(mockedDamagePlayer).toHaveBeenCalledWith(2);
    });
  });

  describe('zone bounds containment', () => {
    it('detects player at zone boundary (edge-inclusive)', () => {
      const zones = [makeZone({ envType: 'ice', x: 10, z: 10, w: 5, h: 5 })];

      // Player at exact left edge
      updateZoneEffects(10, 12, zones, 16);
      expect(getZoneSpeedMult()).toBe(0.5);

      // Player at exact right edge
      resetZoneEffects();
      updateZoneEffects(15, 12, zones, 16);
      expect(getZoneSpeedMult()).toBe(0.5);
    });

    it('excludes player just outside zone', () => {
      const zones = [makeZone({ envType: 'ice', x: 10, z: 10, w: 5, h: 5 })];

      updateZoneEffects(9.99, 12, zones, 16);
      expect(getZoneSpeedMult()).toBe(1);
    });
  });

  describe('resetZoneEffects', () => {
    it('resets speed mult to 1 and wind to zero', () => {
      const zones = [
        makeZone({ envType: 'ice' }),
        makeZone({ id: 'w', envType: 'wind', dirX: 1, dirZ: 1 }),
      ];
      updateZoneEffects(5, 5, zones, 16);
      expect(getZoneSpeedMult()).toBe(0.5);
      expect(getWindForce().x).not.toBe(0);

      resetZoneEffects();
      expect(getZoneSpeedMult()).toBe(1);
      expect(getWindForce().x).toBe(0);
      expect(getWindForce().z).toBe(0);
    });
  });

  describe('non-gameplay zones', () => {
    it('fog zone does not affect speed or damage', () => {
      const zones = [makeZone({ envType: 'fog' })];
      updateZoneEffects(5, 5, zones, 1000);
      expect(getZoneSpeedMult()).toBe(1);
      expect(mockedDamagePlayer).not.toHaveBeenCalled();
    });

    it('blood zone does not affect speed or damage', () => {
      const zones = [makeZone({ envType: 'blood' })];
      updateZoneEffects(5, 5, zones, 1000);
      expect(getZoneSpeedMult()).toBe(1);
      expect(mockedDamagePlayer).not.toHaveBeenCalled();
    });

    it('void zone does not affect speed or damage', () => {
      const zones = [makeZone({ envType: 'void' })];
      updateZoneEffects(5, 5, zones, 1000);
      expect(getZoneSpeedMult()).toBe(1);
      expect(mockedDamagePlayer).not.toHaveBeenCalled();
    });

    it('illusion zone does not affect speed or damage', () => {
      const zones = [makeZone({ envType: 'illusion' })];
      updateZoneEffects(5, 5, zones, 1000);
      expect(getZoneSpeedMult()).toBe(1);
      expect(mockedDamagePlayer).not.toHaveBeenCalled();
    });
  });
});
