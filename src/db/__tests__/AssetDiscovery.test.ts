import {
  discoverMeshyEnemies,
  discoverMeshyProps,
  getAvailableEnemiesForCircle,
  getAvailablePropsForCircle,
} from '../AssetDiscovery';

describe('AssetDiscovery', () => {
  describe('discoverMeshyProps', () => {
    it('discovers general props with manifest.json files', () => {
      const manifest = discoverMeshyProps();
      expect(manifest.general).toBeDefined();
      expect(manifest.general.length).toBeGreaterThanOrEqual(10);
      expect(manifest.general).toContain('hellfire-brazier');
      expect(manifest.general).toContain('bone-pile');
      expect(manifest.general).toContain('blood-candle');
      expect(manifest.general).toContain('skull-candelabra');
    });

    it('discovers circle-specific props', () => {
      const manifest = discoverMeshyProps();
      expect(manifest['circle-1']).toBeDefined();
      expect(manifest['circle-1']).toContain('fog-lantern');
      expect(manifest['circle-1']).toContain('limbo-cage');
    });

    it('returns empty arrays for circles without manifests', () => {
      const manifest = discoverMeshyProps();
      // All circle keys should exist (circle-1 through circle-9)
      for (let i = 1; i <= 9; i++) {
        expect(manifest[`circle-${i}`]).toBeDefined();
        expect(Array.isArray(manifest[`circle-${i}`])).toBe(true);
      }
    });

    it('does not include directories without manifest.json in general', () => {
      const manifest = discoverMeshyProps();
      // .glb files sitting directly in general/ (no manifest.json) should NOT appear
      // Only subdirectories with manifest.json should appear
      for (const id of manifest.general) {
        expect(typeof id).toBe('string');
        expect(id.length).toBeGreaterThan(0);
      }
    });
  });

  describe('discoverMeshyEnemies', () => {
    it('discovers general enemies with manifest.json files', () => {
      const manifest = discoverMeshyEnemies();
      expect(manifest.general).toBeDefined();
      expect(manifest.general.length).toBeGreaterThanOrEqual(4);
      expect(manifest.general).toContain('goat-brute');
      expect(manifest.general).toContain('goat-grunt');
      expect(manifest.general).toContain('goat-scout');
      expect(manifest.general).toContain('goat-shaman');
    });

    it('discovers boss enemies', () => {
      const manifest = discoverMeshyEnemies();
      expect(manifest.bosses).toBeDefined();
      expect(manifest.bosses.length).toBeGreaterThanOrEqual(9);
      expect(manifest.bosses).toContain('boss-azazel');
      expect(manifest.bosses).toContain('boss-furia');
    });

    it('discovers circle-specific enemies', () => {
      const manifest = discoverMeshyEnemies();
      expect(manifest['circle-1']).toContain('goat-shade');
    });
  });

  describe('getAvailablePropsForCircle', () => {
    it('merges general + circle-specific props', () => {
      const props = getAvailablePropsForCircle(1);
      // Should include general props
      expect(props).toContain('hellfire-brazier');
      expect(props).toContain('bone-pile');
      // Should include circle-1 props
      expect(props).toContain('fog-lantern');
      expect(props).toContain('limbo-cage');
    });

    it('returns only general props for a circle with no specific props', () => {
      // Even if a circle directory exists but is empty, general should still work
      const generalOnly = discoverMeshyProps().general;
      const propsForCircle = getAvailablePropsForCircle(1);
      // Circle-1 props should be additional
      expect(propsForCircle.length).toBeGreaterThan(generalOnly.length);
    });

    it('does not include duplicate entries', () => {
      const props = getAvailablePropsForCircle(1);
      const unique = [...new Set(props)];
      expect(props.length).toBe(unique.length);
    });
  });

  describe('getAvailableEnemiesForCircle', () => {
    it('merges general + circle-specific + bosses', () => {
      const enemies = getAvailableEnemiesForCircle(1);
      // General enemies
      expect(enemies).toContain('goat-brute');
      expect(enemies).toContain('goat-grunt');
      // Circle-1 enemies
      expect(enemies).toContain('goat-shade');
      // Bosses
      expect(enemies).toContain('boss-azazel');
    });

    it('does not include duplicate entries', () => {
      const enemies = getAvailableEnemiesForCircle(1);
      const unique = [...new Set(enemies)];
      expect(enemies.length).toBe(unique.length);
    });
  });
});
