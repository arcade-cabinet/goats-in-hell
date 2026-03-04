import { PROP_NAME_MAP, resolveAssetName } from '../propNameMap';

describe('propNameMap', () => {
  test('maps Fantasy Props MegaKit names to Quaternius GLBs', () => {
    expect(resolveAssetName('Torch_Metal')).toBe('prop-torch-mounted');
    expect(resolveAssetName('Column_Stone')).toBe('prop-column');
    expect(resolveAssetName('Barrel')).toBe('prop-barrel');
    expect(resolveAssetName('Chain_Coil')).toBe('chain-hanging-single');
    expect(resolveAssetName('CandleStick_Triple')).toBe('prop-candelabrum-tall');
    expect(resolveAssetName('Chalice')).toBe('prop-chalice');
    expect(resolveAssetName('Chair_1')).toBe('prop-chair');
    expect(resolveAssetName('Chest_Wood')).toBe('prop-chest');
    expect(resolveAssetName('Banner_1')).toBe('prop-banner-wall');
    expect(resolveAssetName('Banner_2')).toBe('prop-banner-wall');
  });

  test('passes through already-correct names unchanged', () => {
    expect(resolveAssetName('prop-barrel')).toBe('prop-barrel');
    expect(resolveAssetName('prop-column')).toBe('prop-column');
    expect(resolveAssetName('lust-marble-throne')).toBe('lust-marble-throne');
  });

  test('passes through unknown names with warning', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(resolveAssetName('NonExistent_Prop')).toBe('NonExistent_Prop');
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('NonExistent_Prop'));
    warnSpy.mockRestore();
  });

  test('map covers all Fantasy Props names used in build scripts', () => {
    const allUsedNames = [
      'Torch_Metal',
      'CandleStick_Triple',
      'Column_Stone',
      'Column_Onyx',
      'Chain_Coil',
      'Banner_1',
      'Banner_2',
      'Barrel',
      'Barrel_Apples',
      'Cage_Small',
      'Vase_2',
      'Vase_4',
      'Vase_Rubble',
      'Chalice',
      'Chair_1',
      'Chest_Wood',
      'Scroll_1',
      'Scroll_2',
      'BookStand',
      'Bookcase_2',
      'Book_5',
      'Book_7',
      'Candle_1',
      'Candle_2',
      'Chandelier',
      'Cabinet',
      'Bench',
      'Bucket_Wooden',
      'Bucket_Metal',
      'Table_Large',
      'Table_Plate',
      'Table_Fork',
      'Table_Knife',
      'Table_Spoon',
      'Mug',
      'SmallBottle',
      'SmallBottles_1',
      'FarmCrate_Apple',
      'Shelf_Arch',
      'Crate_Wooden',
      'Rope_1',
      'Rope_2',
      'Rope_3',
      'Cauldron',
      'Anvil',
      'WeaponStand',
      'Shield_Wooden',
      'Sword_Bronze',
      'Lantern_Wall',
      'Potion_4',
      'Coin_Pile',
      'Coin_Pile_2',
      'Bed_Twin1',
      'Workbench',
      'Crate_Metal',
    ];
    for (const name of allUsedNames) {
      expect(PROP_NAME_MAP[name]).toBeDefined();
    }
  });
});
