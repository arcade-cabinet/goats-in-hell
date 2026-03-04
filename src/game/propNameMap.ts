/**
 * Maps legacy Fantasy Props MegaKit prop names (PascalCase/underscore)
 * to actual asset names (kebab-case with prefix).
 *
 * Three tiers of resolution:
 * 1. Direct Quaternius match (has GLB, renders now)
 * 2. Meshy general prop match (manifest exists, GLB pending)
 * 3. Circle-specific Meshy match (manifest exists, GLB pending)
 *
 * Names already in correct format pass through unchanged.
 */
export const PROP_NAME_MAP: Record<string, string> = {
  // === Lighting ===
  Torch_Metal: 'prop-torch-mounted',
  CandleStick_Triple: 'prop-candelabrum-tall',
  Candle_1: 'prop-candle',
  Candle_2: 'prop-candle',
  Chandelier: 'prop-candelabrum-tall',
  Lantern_Wall: 'prop-torch-mounted',

  // === Structural ===
  Column_Stone: 'prop-column',
  Column_Onyx: 'prop-column',
  Bench: 'prop-chair',

  // === Chains / Hanging ===
  Chain_Coil: 'chain-hanging-single',
  Rope_1: 'chain-hanging-single',
  Rope_2: 'chain-hanging-single',
  Rope_3: 'chain-hanging-single',

  // === Containers ===
  Barrel: 'prop-barrel',
  Barrel_Apples: 'prop-barrel',
  Bucket_Wooden: 'prop-bucket',
  Bucket_Metal: 'prop-bucket',
  Crate_Wooden: 'prop-crate',
  Crate_Metal: 'prop-crate',
  Chest_Wood: 'prop-chest',

  // === Decor ===
  Banner_1: 'prop-banner-wall',
  Banner_2: 'prop-banner-wall',
  Vase_2: 'prop-vase',
  Vase_4: 'prop-vase',
  Vase_Rubble: 'prop-broken-pot',
  Cage_Small: 'prop-cage',

  // === Furniture ===
  Chair_1: 'prop-chair',
  Table_Large: 'prop-table',
  Bed_Twin1: 'prop-chest',
  Cabinet: 'prop-bookcase',
  Bookcase_2: 'prop-bookcase',

  // === Tableware ===
  Chalice: 'prop-chalice',
  Mug: 'prop-bowl',
  Table_Plate: 'prop-bowl',
  Table_Fork: 'prop-bowl',
  Table_Knife: 'prop-bowl',
  Table_Spoon: 'prop-bowl',
  SmallBottle: 'prop-potion',
  SmallBottles_1: 'prop-potion',
  Potion_4: 'prop-potion',
  Coin_Pile: 'prop-chest-gold',
  Coin_Pile_2: 'prop-chest-gold',

  // === Books / Scrolls ===
  BookStand: 'prop-book-open',
  Book_5: 'prop-book-open',
  Book_7: 'prop-book-open',
  Scroll_1: 'prop-book-open',
  Scroll_2: 'prop-book-open',

  // === Food / Farm ===
  FarmCrate_Apple: 'prop-crate',
  Shelf_Arch: 'prop-bookcase',
  Cauldron: 'prop-firebasket',

  // === Weapons / Military ===
  Anvil: 'prop-anvil',
  WeaponStand: 'prop-sword-wall',
  Shield_Wooden: 'prop-shield-wall',
  Sword_Bronze: 'prop-sword-wall',
  Workbench: 'prop-table',
};

/**
 * Resolve a prop name to its actual asset GLB name.
 * If the name is already in correct format (kebab-case), pass through.
 * If it's a Fantasy Props MegaKit name, map it.
 * Unknown names pass through with a console warning.
 */
export function resolveAssetName(name: string): string {
  if (name.includes('-') && !name.includes('_')) return name;

  const mapped = PROP_NAME_MAP[name];
  if (mapped) return mapped;

  console.warn(`[propNameMap] Unknown prop name: "${name}" — passing through unmapped`);
  return name;
}
