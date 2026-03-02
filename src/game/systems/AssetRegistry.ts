/**
 * Static asset registry — all require() calls in one place so Metro can
 * resolve them at bundle time.  Keys are used by AssetLoader to fetch URIs.
 */

// ---------------------------------------------------------------------------
// Textures (AmbientCG PBR — JPG, 1K)
// ---------------------------------------------------------------------------

export const TEXTURE_ASSETS = {
  // Lava walls (Lava001)
  'lava-color': require('../../../assets/textures/Lava001_Color.jpg'),
  'lava-normal': require('../../../assets/textures/Lava001_NormalGL.jpg'),
  'lava-roughness': require('../../../assets/textures/Lava001_Roughness.jpg'),
  'lava-emission': require('../../../assets/textures/Lava001_Emission.jpg'),
  // Stone walls (Bricks006)
  'stone-color': require('../../../assets/textures/Bricks006_Color.jpg'),
  'stone-normal': require('../../../assets/textures/Bricks006_NormalGL.jpg'),
  'stone-roughness': require('../../../assets/textures/Bricks006_Roughness.jpg'),
  // Flesh walls (Lava003)
  'flesh-color': require('../../../assets/textures/Lava003_Color.jpg'),
  'flesh-normal': require('../../../assets/textures/Lava003_NormalGL.jpg'),
  'flesh-roughness': require('../../../assets/textures/Lava003_Roughness.jpg'),
  // Obsidian walls (Lava004)
  'obsidian-color': require('../../../assets/textures/Lava004_Color.jpg'),
  'obsidian-normal': require('../../../assets/textures/Lava004_NormalGL.jpg'),
  'obsidian-roughness': require('../../../assets/textures/Lava004_Roughness.jpg'),
  // Floor (Ground001)
  'floor-color': require('../../../assets/textures/Ground001_Color.jpg'),
  'floor-normal': require('../../../assets/textures/Ground001_NormalGL.jpg'),
  'floor-roughness': require('../../../assets/textures/Ground001_Roughness.jpg'),
  // Ceiling (Rock001)
  'ceiling-color': require('../../../assets/textures/Rock001_Color.jpg'),
  'ceiling-normal': require('../../../assets/textures/Rock001_NormalGL.jpg'),
  'ceiling-roughness': require('../../../assets/textures/Rock001_Roughness.jpg'),
  // Door (Metal001)
  'door-color': require('../../../assets/textures/Metal001_Color.jpg'),
  'door-normal': require('../../../assets/textures/Metal001_NormalGL.jpg'),
  'door-roughness': require('../../../assets/textures/Metal001_Roughness.jpg'),
  'door-metalness': require('../../../assets/textures/Metal001_Metalness.jpg'),
  // Circle 1: Limbo (Concrete020 — gray weathered concrete)
  'limbo-color': require('../../../assets/textures/Concrete020_Color.jpg'),
  'limbo-normal': require('../../../assets/textures/Concrete020_NormalGL.jpg'),
  'limbo-roughness': require('../../../assets/textures/Concrete020_Roughness.jpg'),
  // Circle 2: Lust (Marble006 — dark veined marble)
  'lust-color': require('../../../assets/textures/Marble006_Color.jpg'),
  'lust-normal': require('../../../assets/textures/Marble006_NormalGL.jpg'),
  'lust-roughness': require('../../../assets/textures/Marble006_Roughness.jpg'),
  // Circle 3: Gluttony (Moss001 — green moss/decay)
  'gluttony-color': require('../../../assets/textures/Moss001_Color.jpg'),
  'gluttony-normal': require('../../../assets/textures/Moss001_NormalGL.jpg'),
  'gluttony-roughness': require('../../../assets/textures/Moss001_Roughness.jpg'),
  // Circle 4: Greed (Metal034 — gold/brass)
  'greed-color': require('../../../assets/textures/Metal034_Color.jpg'),
  'greed-normal': require('../../../assets/textures/Metal034_NormalGL.jpg'),
  'greed-roughness': require('../../../assets/textures/Metal034_Roughness.jpg'),
  'greed-metalness': require('../../../assets/textures/Metal034_Metalness.jpg'),
  // Circle 5: Wrath — uses existing lava-* keys (Lava001)
  // Circle 6: Heresy (Rock022 — dark layered rock, tomb-like)
  'heresy-color': require('../../../assets/textures/Rock022_Color.jpg'),
  'heresy-normal': require('../../../assets/textures/Rock022_NormalGL.jpg'),
  'heresy-roughness': require('../../../assets/textures/Rock022_Roughness.jpg'),
  // Circle 7: Violence — uses existing flesh-* keys (Lava003)
  // Circle 8: Fraud (Tiles074 — black/white marble checkerboard)
  'fraud-color': require('../../../assets/textures/Tiles074_Color.jpg'),
  'fraud-normal': require('../../../assets/textures/Tiles074_NormalGL.jpg'),
  'fraud-roughness': require('../../../assets/textures/Tiles074_Roughness.jpg'),
  // Circle 9: Treachery (Ice002 — frozen ice)
  'treachery-color': require('../../../assets/textures/Ice002_Color.jpg'),
  'treachery-normal': require('../../../assets/textures/Ice002_NormalGL.jpg'),
  'treachery-roughness': require('../../../assets/textures/Ice002_Roughness.jpg'),
  // Decals — AmbientCG decal overlays (Color + Opacity + Normal + Roughness)
  'decal-leaking001-color': require('../../../assets/textures/decals/Leaking001_Color.jpg'),
  'decal-leaking001-normal': require('../../../assets/textures/decals/Leaking001_NormalGL.jpg'),
  'decal-leaking001-opacity': require('../../../assets/textures/decals/Leaking001_Opacity.jpg'),
  'decal-leaking001-roughness': require('../../../assets/textures/decals/Leaking001_Roughness.jpg'),
  'decal-leaking005-color': require('../../../assets/textures/decals/Leaking005_Color.jpg'),
  'decal-leaking005-normal': require('../../../assets/textures/decals/Leaking005_NormalGL.jpg'),
  'decal-leaking005-opacity': require('../../../assets/textures/decals/Leaking005_Opacity.jpg'),
  'decal-leaking005-roughness': require('../../../assets/textures/decals/Leaking005_Roughness.jpg'),
  'decal-damage001-color': require('../../../assets/textures/decals/AsphaltDamage001_Color.jpg'),
  'decal-damage001-normal': require('../../../assets/textures/decals/AsphaltDamage001_NormalGL.jpg'),
  'decal-damage001-opacity': require('../../../assets/textures/decals/AsphaltDamage001_Opacity.jpg'),
  'decal-damage001-roughness': require('../../../assets/textures/decals/AsphaltDamage001_Roughness.jpg'),
} as const;

export type TextureAssetKey = keyof typeof TEXTURE_ASSETS;

// ---------------------------------------------------------------------------
// Models — Weapons (Stylized Guns 3D Models PRO)
// ---------------------------------------------------------------------------

export const WEAPON_MODEL_ASSETS = {
  // MAC-10 → pistol sidearm
  'weapon-pistol': require('../../../assets/models/weapons/weapon-pistol.glb'),
  // Pump-Action Shotgun
  'weapon-shotgun': require('../../../assets/models/weapons/weapon-shotgun.glb'),
  // AK-47 → hellfire assault cannon
  'weapon-cannon': require('../../../assets/models/weapons/weapon-cannon.glb'),
  // Bazooka (RPG-7) → Goat's Bane rocket launcher
  'weapon-launcher': require('../../../assets/models/weapons/weapon-launcher.glb'),
  // Flamethrower — uses cannon as stand-in until dedicated model is exported
  'weapon-flamethrower': require('../../../assets/models/weapons/weapon-cannon.glb'),
} as const;

export type WeaponModelKey = keyof typeof WEAPON_MODEL_ASSETS;

// ---------------------------------------------------------------------------
// Models — Projectiles
// ---------------------------------------------------------------------------

export const PROJECTILE_MODEL_ASSETS = {
  'projectile-bullet-small': require('../../../assets/models/projectiles/projectile-bullet-small.glb'),
  'projectile-bullet-large': require('../../../assets/models/projectiles/projectile-bullet-large.glb'),
  'projectile-shell': require('../../../assets/models/projectiles/projectile-shell.glb'),
  'projectile-rocket': require('../../../assets/models/projectiles/projectile-rocket.glb'),
} as const;

export type ProjectileModelKey = keyof typeof PROJECTILE_MODEL_ASSETS;

// ---------------------------------------------------------------------------
// Models — Enemies
// ---------------------------------------------------------------------------

export const ENEMY_MODEL_ASSETS = {
  // Trash mobs — Goatman variants (animated, 11 anims each)
  'enemy-goat': require('../../../assets/models/enemies/goatman-brown.glb'),
  'enemy-hellgoat': require('../../../assets/models/enemies/goatman-crimson.glb'),
  'enemy-fireGoat': require('../../../assets/models/enemies/goatman-dark.glb'),
  'enemy-shadowGoat': require('../../../assets/models/enemies/goatman-gray.glb'),
  'enemy-goatKnight': require('../../../assets/models/enemies/goatman-blue.glb'),
  // Circle-specific mob variant (Gluttony, etc.)
  'enemy-plagueGoat': require('../../../assets/models/enemies/goatman-green.glb'),
  // Boss models — Dainir variants (one per circle, crafted from DAZ base)
  'enemy-archGoat': require('../../../assets/models/bosses/boss-azazel.glb'),
  'enemy-infernoGoat': require('../../../assets/models/bosses/boss-furia.glb'),
  'enemy-voidGoat': require('../../../assets/models/bosses/boss-profano.glb'),
  'enemy-ironGoat': require('../../../assets/models/bosses/boss-il-macello.glb'),
} as const;

export type EnemyModelKey = keyof typeof ENEMY_MODEL_ASSETS;

// ---------------------------------------------------------------------------
// Models — Circle Bosses (Dainir for Genesis 9, one per circle of Hell)
// ---------------------------------------------------------------------------

export const BOSS_MODEL_ASSETS = {
  'boss-il-vecchio': require('../../../assets/models/bosses/boss-il-vecchio.glb'),
  'boss-caprone': require('../../../assets/models/bosses/boss-caprone.glb'),
  'boss-vorago': require('../../../assets/models/bosses/boss-vorago.glb'),
  'boss-aureo': require('../../../assets/models/bosses/boss-aureo.glb'),
  'boss-furia': require('../../../assets/models/bosses/boss-furia.glb'),
  'boss-profano': require('../../../assets/models/bosses/boss-profano.glb'),
  'boss-il-macello': require('../../../assets/models/bosses/boss-il-macello.glb'),
  'boss-inganno': require('../../../assets/models/bosses/boss-inganno.glb'),
  'boss-azazel': require('../../../assets/models/bosses/boss-azazel.glb'),
} as const;

export type BossModelKey = keyof typeof BOSS_MODEL_ASSETS;

/**
 * Map circle number (1-9) to the boss model key for that circle.
 */
export const CIRCLE_BOSS_MAP: Record<number, BossModelKey> = {
  1: 'boss-il-vecchio',
  2: 'boss-caprone',
  3: 'boss-vorago',
  4: 'boss-aureo',
  5: 'boss-furia',
  6: 'boss-profano',
  7: 'boss-il-macello',
  8: 'boss-inganno',
  9: 'boss-azazel',
};

// ---------------------------------------------------------------------------
// Models — Dungeon Props (Quaternius Medieval Dungeon)
// ---------------------------------------------------------------------------

export const PROP_MODEL_ASSETS = {
  // Remapped from old Kenney props
  'prop-firebasket': require('../../../assets/models/props/general/woodfire.glb'),
  'prop-candle': require('../../../assets/models/props/general/candle.glb'),
  'prop-candle-multi': require('../../../assets/models/props/general/candelabrum.glb'),
  'prop-altar': require('../../../assets/models/props/general/pedestal.glb'),
  'prop-column': require('../../../assets/models/props/general/column.glb'),
  'prop-chalice': require('../../../assets/models/props/general/chalice.glb'),
  'prop-bowl': require('../../../assets/models/props/general/pot.glb'),
  'prop-spikes': require('../../../assets/models/props/general/spikes.glb'),
  'prop-barrel': require('../../../assets/models/props/general/barrel.glb'),
  'prop-torch-lit': require('../../../assets/models/props/general/torch.glb'),
  'prop-torch-mounted': require('../../../assets/models/props/general/torch-wall.glb'),
  'prop-chest': require('../../../assets/models/props/general/chest.glb'),
  'prop-chest-gold': require('../../../assets/models/props/general/chest-gold.glb'),
  // New Quaternius props — Modular Dungeon Pack
  'prop-column-broken': require('../../../assets/models/props/general/column-broken.glb'),
  'prop-column-broken2': require('../../../assets/models/props/general/column-broken2.glb'),
  'prop-candelabrum-tall': require('../../../assets/models/props/general/candelabrum-tall.glb'),
  'prop-bones': require('../../../assets/models/props/general/bones.glb'),
  'prop-bones2': require('../../../assets/models/props/general/bones2.glb'),
  'prop-book-open': require('../../../assets/models/props/general/book-open.glb'),
  'prop-carpet': require('../../../assets/models/props/general/carpet.glb'),
  'prop-potion': require('../../../assets/models/props/general/potion.glb'),
  'prop-rock1': require('../../../assets/models/props/general/rock1.glb'),
  'prop-rock2': require('../../../assets/models/props/general/rock2.glb'),
  'prop-rock3': require('../../../assets/models/props/general/rock3.glb'),
  'prop-bars': require('../../../assets/models/props/general/bars.glb'),
  'prop-window': require('../../../assets/models/props/general/window.glb'),
  'prop-wall-rocks': require('../../../assets/models/props/general/wall-rocks.glb'),
  // New Quaternius props — Updated Modular Dungeon
  'prop-banner': require('../../../assets/models/props/general/banner.glb'),
  'prop-banner-wall': require('../../../assets/models/props/general/banner-wall.glb'),
  'prop-cobweb': require('../../../assets/models/props/general/cobweb.glb'),
  'prop-cobweb2': require('../../../assets/models/props/general/cobweb2.glb'),
  'prop-skull': require('../../../assets/models/props/general/skull.glb'),
  'prop-chair': require('../../../assets/models/props/general/chair.glb'),
  'prop-table': require('../../../assets/models/props/general/table.glb'),
  'prop-table-small': require('../../../assets/models/props/general/table-small.glb'),
  'prop-pedestal': require('../../../assets/models/props/general/pedestal.glb'),
  'prop-pedestal2': require('../../../assets/models/props/general/pedestal2.glb'),
  'prop-sword-mount': require('../../../assets/models/props/general/sword-mount.glb'),
  'prop-crate': require('../../../assets/models/props/general/crate.glb'),
  'prop-trap-spikes': require('../../../assets/models/props/general/trap-spikes.glb'),
  'prop-vase': require('../../../assets/models/props/general/vase.glb'),
  'prop-bucket': require('../../../assets/models/props/general/bucket.glb'),
  'prop-arch': require('../../../assets/models/props/general/arch.glb'),
  'prop-arch-door': require('../../../assets/models/props/general/arch-door.glb'),
  // New Quaternius props — Ultimate Modular Ruins Pack
  'prop-bear-trap': require('../../../assets/models/props/general/bear-trap.glb'),
  'prop-bookcase': require('../../../assets/models/props/general/bookcase.glb'),
  'prop-cart': require('../../../assets/models/props/general/cart.glb'),
  'prop-candles': require('../../../assets/models/props/general/candles.glb'),
  'prop-dead-tree': require('../../../assets/models/props/general/dead-tree.glb'),
  'prop-broken-pot': require('../../../assets/models/props/general/broken-pot.glb'),
  // New Quaternius props — Ultimate RPG Items Pack
  'prop-bone': require('../../../assets/models/props/general/bone.glb'),
  'prop-crystal': require('../../../assets/models/props/general/crystal.glb'),
  'prop-crystal2': require('../../../assets/models/props/general/crystal2.glb'),
  'prop-rpg-skull': require('../../../assets/models/props/general/rpg-skull.glb'),
  'prop-rpg-skull2': require('../../../assets/models/props/general/rpg-skull2.glb'),
  'prop-health-potion': require('../../../assets/models/props/general/health-potion.glb'),
  'prop-mana-potion': require('../../../assets/models/props/general/mana-potion.glb'),
  'prop-key': require('../../../assets/models/props/general/key.glb'),
  // New Quaternius props — Medieval Weapons Pack (wall decorations)
  'prop-scythe': require('../../../assets/models/props/general/scythe.glb'),
  'prop-axe-wall': require('../../../assets/models/props/general/axe-wall.glb'),
  'prop-shield-wall': require('../../../assets/models/props/general/shield-wall.glb'),
  'prop-sword-wall': require('../../../assets/models/props/general/sword-wall.glb'),
  // Meshy AI generated props
  'prop-fog-lantern': require('../../../assets/models/props/circle-1/fog-lantern/refined.glb'),
  'prop-limbo-banner-tattered': require('../../../assets/models/props/circle-1/limbo-banner-tattered/refined.glb'),
  'prop-limbo-bone-pile': require('../../../assets/models/props/circle-1/limbo-bone-pile/refined.glb'),
  'prop-limbo-broken-altar': require('../../../assets/models/props/circle-1/limbo-broken-altar/refined.glb'),
  'prop-limbo-cage': require('../../../assets/models/props/circle-1/limbo-cage/refined.glb'),
  'prop-limbo-chain-cluster': require('../../../assets/models/props/circle-1/limbo-chain-cluster/refined.glb'),
  'prop-limbo-cobweb-cluster': require('../../../assets/models/props/circle-1/limbo-cobweb-cluster/refined.glb'),
  'prop-limbo-dried-fountain': require('../../../assets/models/props/circle-1/limbo-dried-fountain/refined.glb'),
  'prop-limbo-inscription-tablet': require('../../../assets/models/props/circle-1/limbo-inscription-tablet/refined.glb'),
  'prop-limbo-moss-growth': require('../../../assets/models/props/circle-1/limbo-moss-growth/refined.glb'),
  'prop-limbo-ritual-circle': require('../../../assets/models/props/circle-1/limbo-ritual-circle/refined.glb'),
  'prop-limbo-rubble-scatter': require('../../../assets/models/props/circle-1/limbo-rubble-scatter/refined.glb'),
  'prop-limbo-sarcophagus': require('../../../assets/models/props/circle-1/limbo-sarcophagus/refined.glb'),
  'prop-limbo-skull-pile': require('../../../assets/models/props/circle-1/limbo-skull-pile/refined.glb'),
  'prop-limbo-spike-cluster': require('../../../assets/models/props/circle-1/limbo-spike-cluster/refined.glb'),
  'prop-limbo-stone-bench': require('../../../assets/models/props/circle-1/limbo-stone-bench/refined.glb'),
  'prop-limbo-stone-lectern': require('../../../assets/models/props/circle-1/limbo-stone-lectern/refined.glb'),
  'prop-limbo-tombstone': require('../../../assets/models/props/circle-1/limbo-tombstone/refined.glb'),
  'prop-limbo-torch-bracket': require('../../../assets/models/props/circle-1/limbo-torch-bracket/refined.glb'),
  'prop-limbo-vase-rubble': require('../../../assets/models/props/circle-1/limbo-vase-rubble/refined.glb'),
  'prop-lust-candelabra': require('../../../assets/models/props/circle-2/lust-candelabra/refined.glb'),
  'prop-lust-chandelier': require('../../../assets/models/props/circle-2/lust-chandelier/refined.glb'),
  'prop-lust-cracked-statue': require('../../../assets/models/props/circle-2/lust-cracked-statue/refined.glb'),
  'prop-lust-ember-brazier': require('../../../assets/models/props/circle-2/lust-ember-brazier/refined.glb'),
  'prop-lust-fallen-chair': require('../../../assets/models/props/circle-2/lust-fallen-chair/refined.glb'),
  'prop-lust-floor-carpet': require('../../../assets/models/props/circle-2/lust-floor-carpet/refined.glb'),
  'prop-lust-golden-chalice': require('../../../assets/models/props/circle-2/lust-golden-chalice/refined.glb'),
  'prop-lust-lava-rock-border': require('../../../assets/models/props/circle-2/lust-lava-rock-border/refined.glb'),
  'prop-lust-marble-vase': require('../../../assets/models/props/circle-2/lust-marble-vase/refined.glb'),
  'prop-lust-ornate-bed-wrecked': require('../../../assets/models/props/circle-2/lust-ornate-bed-wrecked/refined.glb'),
  'prop-lust-perfume-censer': require('../../../assets/models/props/circle-2/lust-perfume-censer/refined.glb'),
  'prop-lust-rose-thorn-cluster': require('../../../assets/models/props/circle-2/lust-rose-thorn-cluster/refined.glb'),
  'prop-lust-shattered-goblet': require('../../../assets/models/props/circle-2/lust-shattered-goblet/refined.glb'),
  'prop-lust-velvet-drape': require('../../../assets/models/props/circle-2/lust-velvet-drape/refined.glb'),
  'prop-lust-wind-banner': require('../../../assets/models/props/circle-2/lust-wind-banner/refined.glb'),
  'prop-ornate-mirror': require('../../../assets/models/props/circle-2/ornate-mirror/refined.glb'),
  'prop-silk-curtain': require('../../../assets/models/props/circle-2/silk-curtain/refined.glb'),
  'prop-bile-cauldron': require('../../../assets/models/props/circle-3/bile-cauldron/refined.glb'),
  'prop-feast-table': require('../../../assets/models/props/circle-3/feast-table/refined.glb'),
  'prop-gluttony-acid-pool-edge': require('../../../assets/models/props/circle-3/gluttony-acid-pool-edge/refined.glb'),
  'prop-gluttony-bile-pool-surface': require('../../../assets/models/props/circle-3/gluttony-bile-pool-surface/refined.glb'),
  'prop-gluttony-bone-plate': require('../../../assets/models/props/circle-3/gluttony-bone-plate/refined.glb'),
  'prop-gluttony-dripping-stalactite': require('../../../assets/models/props/circle-3/gluttony-dripping-stalactite/refined.glb'),
  'prop-gluttony-lantern-wall-green': require('../../../assets/models/props/circle-3/gluttony-lantern-wall-green/refined.glb'),
  'prop-gluttony-maggot-mound': require('../../../assets/models/props/circle-3/gluttony-maggot-mound/refined.glb'),
  'prop-gluttony-meat-carcass': require('../../../assets/models/props/circle-3/gluttony-meat-carcass/refined.glb'),
  'prop-gluttony-mucus-web': require('../../../assets/models/props/circle-3/gluttony-mucus-web/refined.glb'),
  'prop-gluttony-overflowing-goblet': require('../../../assets/models/props/circle-3/gluttony-overflowing-goblet/refined.glb'),
  'prop-gluttony-pantry-chest': require('../../../assets/models/props/circle-3/gluttony-pantry-chest/refined.glb'),
  'prop-gluttony-rope-tendril': require('../../../assets/models/props/circle-3/gluttony-rope-tendril/refined.glb'),
  'prop-gluttony-rotten-crate': require('../../../assets/models/props/circle-3/gluttony-rotten-crate/refined.glb'),
  'prop-gluttony-rotting-barrel': require('../../../assets/models/props/circle-3/gluttony-rotting-barrel/refined.glb'),
  'prop-gluttony-slop-bucket': require('../../../assets/models/props/circle-3/gluttony-slop-bucket/refined.glb'),
  'prop-gluttony-stomach-wall-growth': require('../../../assets/models/props/circle-3/gluttony-stomach-wall-growth/refined.glb'),
  'prop-gluttony-swollen-cask': require('../../../assets/models/props/circle-3/gluttony-swollen-cask/refined.glb'),
  'prop-coin-pile': require('../../../assets/models/props/circle-4/coin-pile/refined.glb'),
  'prop-golden-idol': require('../../../assets/models/props/circle-4/golden-idol/refined.glb'),
  'prop-greed-ammo-scatter': require('../../../assets/models/props/circle-4/greed-ammo-scatter/refined.glb'),
  'prop-greed-chest-pedestal': require('../../../assets/models/props/circle-4/greed-chest-pedestal/refined.glb'),
  'prop-greed-coin-cascade': require('../../../assets/models/props/circle-4/greed-coin-cascade/refined.glb'),
  'prop-greed-gear-mechanism': require('../../../assets/models/props/circle-4/greed-gear-mechanism/refined.glb'),
  'prop-greed-gold-bar-stack': require('../../../assets/models/props/circle-4/greed-gold-bar-stack/refined.glb'),
  'prop-greed-gold-chain': require('../../../assets/models/props/circle-4/greed-gold-chain/refined.glb'),
  'prop-greed-golden-banner': require('../../../assets/models/props/circle-4/greed-golden-banner/refined.glb'),
  'prop-greed-golden-candelabra': require('../../../assets/models/props/circle-4/greed-golden-candelabra/refined.glb'),
  'prop-greed-golden-chalice': require('../../../assets/models/props/circle-4/greed-golden-chalice/refined.glb'),
  'prop-greed-golden-key-display': require('../../../assets/models/props/circle-4/greed-golden-key-display/refined.glb'),
  'prop-greed-golden-throne': require('../../../assets/models/props/circle-4/greed-golden-throne/refined.glb'),
  'prop-greed-golden-vase': require('../../../assets/models/props/circle-4/greed-golden-vase/refined.glb'),
  'prop-greed-jeweled-pedestal': require('../../../assets/models/props/circle-4/greed-jeweled-pedestal/refined.glb'),
  'prop-greed-pressure-plate': require('../../../assets/models/props/circle-4/greed-pressure-plate/refined.glb'),
  'prop-greed-safe-door': require('../../../assets/models/props/circle-4/greed-safe-door/refined.glb'),
  'prop-greed-skeletal-goat': require('../../../assets/models/props/circle-4/greed-skeletal-goat/refined.glb'),
  'prop-greed-treasure-chest': require('../../../assets/models/props/circle-4/greed-treasure-chest/refined.glb'),
  'prop-lava-altar': require('../../../assets/models/props/circle-5/lava-altar/refined.glb'),
  'prop-wrath-anvil': require('../../../assets/models/props/circle-5/wrath-anvil/refined.glb'),
  'prop-wrath-caged-lantern': require('../../../assets/models/props/circle-5/wrath-caged-lantern/refined.glb'),
  'prop-wrath-chain-curtain': require('../../../assets/models/props/circle-5/wrath-chain-curtain/refined.glb'),
  'prop-wrath-dented-iron-door': require('../../../assets/models/props/circle-5/wrath-dented-iron-door/refined.glb'),
  'prop-wrath-explosive-barrel': require('../../../assets/models/props/circle-5/wrath-explosive-barrel/refined.glb'),
  'prop-wrath-iron-grate': require('../../../assets/models/props/circle-5/wrath-iron-grate/refined.glb'),
  'prop-wrath-punching-bag-chain': require('../../../assets/models/props/circle-5/wrath-punching-bag-chain/refined.glb'),
  'prop-wrath-rage-furnace': require('../../../assets/models/props/circle-5/wrath-rage-furnace/refined.glb'),
  'prop-wrath-rusted-cage': require('../../../assets/models/props/circle-5/wrath-rusted-cage/refined.glb'),
  'prop-wrath-shattered-weapon-rack': require('../../../assets/models/props/circle-5/wrath-shattered-weapon-rack/refined.glb'),
  'prop-wrath-smashed-barrier': require('../../../assets/models/props/circle-5/wrath-smashed-barrier/refined.glb'),
  'prop-wrath-war-banner': require('../../../assets/models/props/circle-5/wrath-war-banner/refined.glb'),
  'prop-wrath-weapon-pedestal': require('../../../assets/models/props/circle-5/wrath-weapon-pedestal/refined.glb'),
  'prop-demon-throne': require('../../../assets/models/props/circle-6/demon-throne/refined.glb'),
  'prop-heresy-bone-shelf': require('../../../assets/models/props/circle-6/heresy-bone-shelf/refined.glb'),
  'prop-heresy-bone-urn': require('../../../assets/models/props/circle-6/heresy-bone-urn/refined.glb'),
  'prop-heresy-broken-stained-glass': require('../../../assets/models/props/circle-6/heresy-broken-stained-glass/refined.glb'),
  'prop-heresy-burning-pyre': require('../../../assets/models/props/circle-6/heresy-burning-pyre/refined.glb'),
  'prop-heresy-catacomb-torch': require('../../../assets/models/props/circle-6/heresy-catacomb-torch/refined.glb'),
  'prop-heresy-church-pew': require('../../../assets/models/props/circle-6/heresy-church-pew/refined.glb'),
  'prop-heresy-confessional-booth': require('../../../assets/models/props/circle-6/heresy-confessional-booth/refined.glb'),
  'prop-heresy-corrupted-reliquary': require('../../../assets/models/props/circle-6/heresy-corrupted-reliquary/refined.glb'),
  'prop-heresy-cracked-baptismal-font': require('../../../assets/models/props/circle-6/heresy-cracked-baptismal-font/refined.glb'),
  'prop-heresy-forbidden-bookcase': require('../../../assets/models/props/circle-6/heresy-forbidden-bookcase/refined.glb'),
  'prop-heresy-pentagram-floor-tile': require('../../../assets/models/props/circle-6/heresy-pentagram-floor-tile/refined.glb'),
  'prop-heresy-profane-symbol': require('../../../assets/models/props/circle-6/heresy-profane-symbol/refined.glb'),
  'prop-heresy-ritual-chandelier': require('../../../assets/models/props/circle-6/heresy-ritual-chandelier/refined.glb'),
  'prop-heresy-scattered-bones': require('../../../assets/models/props/circle-6/heresy-scattered-bones/refined.glb'),
  'prop-heresy-shattered-icon': require('../../../assets/models/props/circle-6/heresy-shattered-icon/refined.glb'),
  'prop-heresy-skull-pile': require('../../../assets/models/props/circle-6/heresy-skull-pile/refined.glb'),
  'prop-heresy-toppled-altar': require('../../../assets/models/props/circle-6/heresy-toppled-altar/refined.glb'),
  'prop-heretic-tome': require('../../../assets/models/props/circle-6/heretic-tome/refined.glb'),
  'prop-inverted-cross': require('../../../assets/models/props/circle-6/inverted-cross/refined.glb'),
  'prop-blood-trough': require('../../../assets/models/props/circle-7/blood-trough/refined.glb'),
  'prop-meat-hook': require('../../../assets/models/props/circle-7/meat-hook/refined.glb'),
  'prop-torture-rack': require('../../../assets/models/props/circle-7/torture-rack/refined.glb'),
  'prop-violence-blood-cauldron': require('../../../assets/models/props/circle-7/violence-blood-cauldron/refined.glb'),
  'prop-violence-blood-gutter': require('../../../assets/models/props/circle-7/violence-blood-gutter/refined.glb'),
  'prop-violence-blood-pool': require('../../../assets/models/props/circle-7/violence-blood-pool/refined.glb'),
  'prop-violence-bone-grinder': require('../../../assets/models/props/circle-7/violence-bone-grinder/refined.glb'),
  'prop-violence-butcher-block': require('../../../assets/models/props/circle-7/violence-butcher-block/refined.glb'),
  'prop-violence-chain-conveyor': require('../../../assets/models/props/circle-7/violence-chain-conveyor/refined.glb'),
  'prop-violence-fire-geyser-vent': require('../../../assets/models/props/circle-7/violence-fire-geyser-vent/refined.glb'),
  'prop-violence-hook-rack': require('../../../assets/models/props/circle-7/violence-hook-rack/refined.glb'),
  'prop-violence-industrial-cage': require('../../../assets/models/props/circle-7/violence-industrial-cage/refined.glb'),
  'prop-violence-metal-crate-stack': require('../../../assets/models/props/circle-7/violence-metal-crate-stack/refined.glb'),
  'prop-violence-rusted-anvil': require('../../../assets/models/props/circle-7/violence-rusted-anvil/refined.glb'),
  'prop-violence-sawblade-decoration': require('../../../assets/models/props/circle-7/violence-sawblade-decoration/refined.glb'),
  'prop-violence-stone-altar': require('../../../assets/models/props/circle-7/violence-stone-altar/refined.glb'),
  'prop-false-door': require('../../../assets/models/props/circle-8/false-door/refined.glb'),
  'prop-fraud-broken-chandelier': require('../../../assets/models/props/circle-8/fraud-broken-chandelier/refined.glb'),
  'prop-fraud-coin-pile': require('../../../assets/models/props/circle-8/fraud-coin-pile/refined.glb'),
  'prop-fraud-cracked-mosaic-floor': require('../../../assets/models/props/circle-8/fraud-cracked-mosaic-floor/refined.glb'),
  'prop-fraud-forked-tongue-relief': require('../../../assets/models/props/circle-8/fraud-forked-tongue-relief/refined.glb'),
  'prop-fraud-gambling-table': require('../../../assets/models/props/circle-8/fraud-gambling-table/refined.glb'),
  'prop-fraud-golden-banner': require('../../../assets/models/props/circle-8/fraud-golden-banner/refined.glb'),
  'prop-fraud-marble-debris': require('../../../assets/models/props/circle-8/fraud-marble-debris/refined.glb'),
  'prop-fraud-marble-pedestal': require('../../../assets/models/props/circle-8/fraud-marble-pedestal/refined.glb'),
  'prop-fraud-mirror-shard': require('../../../assets/models/props/circle-8/fraud-mirror-shard/refined.glb'),
  'prop-fraud-silhouette-prop': require('../../../assets/models/props/circle-8/fraud-silhouette-prop/refined.glb'),
  'prop-fraud-stage-curtain': require('../../../assets/models/props/circle-8/fraud-stage-curtain/refined.glb'),
  'prop-fraud-two-faced-bust': require('../../../assets/models/props/circle-8/fraud-two-faced-bust/refined.glb'),
  'prop-trick-chest': require('../../../assets/models/props/circle-8/trick-chest/refined.glb'),
  'prop-frozen-goat': require('../../../assets/models/props/circle-9/frozen-goat/refined.glb'),
  'prop-soul-cage': require('../../../assets/models/props/circle-9/soul-cage/refined.glb'),
  'prop-treachery-betrayer-cage': require('../../../assets/models/props/circle-9/treachery-betrayer-cage/refined.glb'),
  'prop-treachery-crystalline-spike-wall': require('../../../assets/models/props/circle-9/treachery-crystalline-spike-wall/refined.glb'),
  'prop-treachery-dark-ice-monolith': require('../../../assets/models/props/circle-9/treachery-dark-ice-monolith/refined.glb'),
  'prop-treachery-frost-chalice': require('../../../assets/models/props/circle-9/treachery-frost-chalice/refined.glb'),
  'prop-treachery-frozen-banner': require('../../../assets/models/props/circle-9/treachery-frozen-banner/refined.glb'),
  'prop-treachery-frozen-chain-cluster': require('../../../assets/models/props/circle-9/treachery-frozen-chain-cluster/refined.glb'),
  'prop-treachery-frozen-feast-table': require('../../../assets/models/props/circle-9/treachery-frozen-feast-table/refined.glb'),
  'prop-treachery-frozen-stalactite': require('../../../assets/models/props/circle-9/treachery-frozen-stalactite/refined.glb'),
  'prop-treachery-frozen-sword': require('../../../assets/models/props/circle-9/treachery-frozen-sword/refined.glb'),
  'prop-treachery-frozen-throne': require('../../../assets/models/props/circle-9/treachery-frozen-throne/refined.glb'),
  'prop-treachery-frozen-waterfall': require('../../../assets/models/props/circle-9/treachery-frozen-waterfall/refined.glb'),
  'prop-treachery-ice-crack-floor': require('../../../assets/models/props/circle-9/treachery-ice-crack-floor/refined.glb'),
  'prop-treachery-ice-formation': require('../../../assets/models/props/circle-9/treachery-ice-formation/refined.glb'),
  'prop-treachery-snow-drift-mound': require('../../../assets/models/props/circle-9/treachery-snow-drift-mound/refined.glb'),
  'prop-treachery-unlit-lantern': require('../../../assets/models/props/circle-9/treachery-unlit-lantern/refined.glb'),
  // Meshy AI generated props
  'prop-blood-candle': require('../../../assets/models/props/general/blood-candle/refined.glb'),
  'prop-bone-pile': require('../../../assets/models/props/general/bone-pile/refined.glb'),
  'prop-chain-hanging-cluster': require('../../../assets/models/props/general/chain-hanging-cluster/refined.glb'),
  'prop-chain-hanging-single': require('../../../assets/models/props/general/chain-hanging-single/refined.glb'),
  'prop-chain-wall-mounted': require('../../../assets/models/props/general/chain-wall-mounted/refined.glb'),
  'prop-chandelier-iron': require('../../../assets/models/props/general/chandelier-iron/refined.glb'),
  'prop-cobweb-large': require('../../../assets/models/props/general/cobweb-large/refined.glb'),
  'prop-debris-scatter': require('../../../assets/models/props/general/debris-scatter/refined.glb'),
  'prop-fire-pit-large': require('../../../assets/models/props/general/fire-pit-large/refined.glb'),
  'prop-fire-pit-small': require('../../../assets/models/props/general/fire-pit-small/refined.glb'),
  'prop-floor-drain': require('../../../assets/models/props/general/floor-drain/refined.glb'),
  'prop-floor-rug-tattered': require('../../../assets/models/props/general/floor-rug-tattered/refined.glb'),
  'prop-floor-tile-cracked': require('../../../assets/models/props/general/floor-tile-cracked/refined.glb'),
  'prop-hell-torch': require('../../../assets/models/props/general/hell-torch/refined.glb'),
  'prop-hellfire-brazier': require('../../../assets/models/props/general/hellfire-brazier/refined.glb'),
  'prop-offering-skull-bowl': require('../../../assets/models/props/general/offering-skull-bowl/refined.glb'),
  'prop-pentagram-floor': require('../../../assets/models/props/general/pentagram-floor/refined.glb'),
  'prop-poison-pool': require('../../../assets/models/props/general/poison-pool/refined.glb'),
  'prop-pressure-plate-stone': require('../../../assets/models/props/general/pressure-plate-stone/refined.glb'),
  'prop-rope-hanging': require('../../../assets/models/props/general/rope-hanging/refined.glb'),
  'prop-rubble-pile-large': require('../../../assets/models/props/general/rubble-pile-large/refined.glb'),
  'prop-rubble-pile-small': require('../../../assets/models/props/general/rubble-pile-small/refined.glb'),
  'prop-sacrificial-chalice': require('../../../assets/models/props/general/sacrificial-chalice/refined.glb'),
  'prop-skull-candelabra': require('../../../assets/models/props/general/skull-candelabra/refined.glb'),
  'prop-spike-bed-large': require('../../../assets/models/props/general/spike-bed-large/refined.glb'),
  'prop-spike-bed-small': require('../../../assets/models/props/general/spike-bed-small/refined.glb'),
  'prop-spike-wall-cluster': require('../../../assets/models/props/general/spike-wall-cluster/refined.glb'),
  'prop-stalactite-cluster': require('../../../assets/models/props/general/stalactite-cluster/refined.glb'),
  'prop-stone-sarcophagus': require('../../../assets/models/props/general/stone-sarcophagus/refined.glb'),
  'prop-thorn-cluster-large': require('../../../assets/models/props/general/thorn-cluster-large/refined.glb'),
  'prop-thorn-cluster-small': require('../../../assets/models/props/general/thorn-cluster-small/refined.glb'),
  'prop-torch-sconce-ornate': require('../../../assets/models/props/general/torch-sconce-ornate/refined.glb'),
  'prop-torch-sconce-simple': require('../../../assets/models/props/general/torch-sconce-simple/refined.glb'),
  // Meshy AI generated props
  'prop-demon-relief': require('../../../assets/models/props/general/demon-relief/refined.glb'),
  // Meshy AI generated props
  'prop-lust-marble-throne': require('../../../assets/models/props/circle-2/lust-marble-throne/refined.glb'),
  'prop-fire-grate': require('../../../assets/models/props/general/fire-grate/refined.glb'),
} as const;

export type PropModelKey = keyof typeof PROP_MODEL_ASSETS;

// ---------------------------------------------------------------------------
// Models — Dungeon Set Pieces (Meshy AI — structural level elements)
// Set pieces are structural: arches, columns, doorframes, stairs, railings, etc.
// Keys follow the pattern 'setpiece-{id}' matching the manifest id field.
// Populated by: pnpm sync:registry
// ---------------------------------------------------------------------------

export const SETPIECE_MODEL_ASSETS = {
  // Meshy AI generated set pieces
  'setpiece-limbo-ancient-pillar': require('../../../assets/models/setpieces/circle-1/limbo-ancient-pillar/refined.glb'),
  'setpiece-limbo-broken-pillar': require('../../../assets/models/setpieces/circle-1/limbo-broken-pillar/refined.glb'),
  'setpiece-limbo-cracked-floor-slab': require('../../../assets/models/setpieces/circle-1/limbo-cracked-floor-slab/refined.glb'),
  'setpiece-limbo-fallen-column': require('../../../assets/models/setpieces/circle-1/limbo-fallen-column/refined.glb'),
  'setpiece-limbo-iron-gate': require('../../../assets/models/setpieces/circle-1/limbo-iron-gate/refined.glb'),
  'setpiece-limbo-wall-sconce': require('../../../assets/models/setpieces/circle-1/limbo-wall-sconce/refined.glb'),
  'setpiece-lust-bridge-railing': require('../../../assets/models/setpieces/circle-2/lust-bridge-railing/refined.glb'),
  'setpiece-lust-gilded-pillar': require('../../../assets/models/setpieces/circle-2/lust-gilded-pillar/refined.glb'),
  'setpiece-lust-onyx-column': require('../../../assets/models/setpieces/circle-2/lust-onyx-column/refined.glb'),
  'setpiece-gluttony-fungus-pillar': require('../../../assets/models/setpieces/circle-3/gluttony-fungus-pillar/refined.glb'),
  'setpiece-gluttony-organic-column': require('../../../assets/models/setpieces/circle-3/gluttony-organic-column/refined.glb'),
  'setpiece-gluttony-shelf-arch': require('../../../assets/models/setpieces/circle-3/gluttony-shelf-arch/refined.glb'),
  'setpiece-greed-diamond-plate-platform': require('../../../assets/models/setpieces/circle-4/greed-diamond-plate-platform/refined.glb'),
  'setpiece-greed-gold-pillar': require('../../../assets/models/setpieces/circle-4/greed-gold-pillar/refined.glb'),
  'setpiece-greed-vault-arch': require('../../../assets/models/setpieces/circle-4/greed-vault-arch/refined.glb'),
  'setpiece-wrath-anger-graffiti-slab': require('../../../assets/models/setpieces/circle-5/wrath-anger-graffiti-slab/refined.glb'),
  'setpiece-wrath-blood-spattered-slab': require('../../../assets/models/setpieces/circle-5/wrath-blood-spattered-slab/refined.glb'),
  'setpiece-wrath-corroded-pipe-pillar': require('../../../assets/models/setpieces/circle-5/wrath-corroded-pipe-pillar/refined.glb'),
  'setpiece-wrath-jagged-arch': require('../../../assets/models/setpieces/circle-5/wrath-jagged-arch/refined.glb'),
  'setpiece-wrath-pit-tier-ring': require('../../../assets/models/setpieces/circle-5/wrath-pit-tier-ring/refined.glb'),
  'setpiece-wrath-stone-island': require('../../../assets/models/setpieces/circle-5/wrath-stone-island/refined.glb'),
  'setpiece-heresy-cracked-marble-pillar': require('../../../assets/models/setpieces/circle-6/heresy-cracked-marble-pillar/refined.glb'),
  'setpiece-heresy-desecrated-arch': require('../../../assets/models/setpieces/circle-6/heresy-desecrated-arch/refined.glb'),
  'setpiece-heresy-torn-scripture-slab': require('../../../assets/models/setpieces/circle-6/heresy-torn-scripture-slab/refined.glb'),
  'setpiece-violence-blood-river-arch': require('../../../assets/models/setpieces/circle-7/violence-blood-river-arch/refined.glb'),
  'setpiece-violence-grating-panel': require('../../../assets/models/setpieces/circle-7/violence-grating-panel/refined.glb'),
  'setpiece-violence-industrial-arch': require('../../../assets/models/setpieces/circle-7/violence-industrial-arch/refined.glb'),
  'setpiece-violence-iron-railing': require('../../../assets/models/setpieces/circle-7/violence-iron-railing/refined.glb'),
  'setpiece-violence-pier-overlook': require('../../../assets/models/setpieces/circle-7/violence-pier-overlook/refined.glb'),
  'setpiece-violence-riveted-pipe-pillar': require('../../../assets/models/setpieces/circle-7/violence-riveted-pipe-pillar/refined.glb'),
  'setpiece-violence-rusted-walkway-platform': require('../../../assets/models/setpieces/circle-7/violence-rusted-walkway-platform/refined.glb'),
  'setpiece-violence-thorn-column': require('../../../assets/models/setpieces/circle-7/violence-thorn-column/refined.glb'),
  'setpiece-violence-walkway-pillar': require('../../../assets/models/setpieces/circle-7/violence-walkway-pillar/refined.glb'),
  'setpiece-fraud-crumbling-facade': require('../../../assets/models/setpieces/circle-8/fraud-crumbling-facade/refined.glb'),
  'setpiece-fraud-fake-column': require('../../../assets/models/setpieces/circle-8/fraud-fake-column/refined.glb'),
  'setpiece-fraud-onyx-wall-panel': require('../../../assets/models/setpieces/circle-8/fraud-onyx-wall-panel/refined.glb'),
  'setpiece-fraud-ornate-arch': require('../../../assets/models/setpieces/circle-8/fraud-ornate-arch/refined.glb'),
  'setpiece-fraud-ornate-railing': require('../../../assets/models/setpieces/circle-8/fraud-ornate-railing/refined.glb'),
  'setpiece-fraud-ramp-platform': require('../../../assets/models/setpieces/circle-8/fraud-ramp-platform/refined.glb'),
  'setpiece-fraud-shifting-wall-segment': require('../../../assets/models/setpieces/circle-8/fraud-shifting-wall-segment/refined.glb'),
  'setpiece-fraud-theatrical-column': require('../../../assets/models/setpieces/circle-8/fraud-theatrical-column/refined.glb'),
  'setpiece-ice-pillar': require('../../../assets/models/setpieces/circle-9/ice-pillar/refined.glb'),
  'setpiece-treachery-frost-shattered-column': require('../../../assets/models/setpieces/circle-9/treachery-frost-shattered-column/refined.glb'),
  'setpiece-treachery-glacial-platform': require('../../../assets/models/setpieces/circle-9/treachery-glacial-platform/refined.glb'),
  'setpiece-treachery-ice-arch': require('../../../assets/models/setpieces/circle-9/treachery-ice-arch/refined.glb'),
  'setpiece-treachery-ice-bridge-segment': require('../../../assets/models/setpieces/circle-9/treachery-ice-bridge-segment/refined.glb'),
  // Meshy AI generated set pieces
  'setpiece-limbo-crumbling-arch': require('../../../assets/models/setpieces/circle-1/limbo-crumbling-arch/refined.glb'),
  'setpiece-lust-coffered-ceiling-tile': require('../../../assets/models/setpieces/circle-2/lust-coffered-ceiling-tile/refined.glb'),
  'setpiece-lust-ornate-arch': require('../../../assets/models/setpieces/circle-2/lust-ornate-arch/refined.glb'),
  'setpiece-gluttony-bloated-arch': require('../../../assets/models/setpieces/circle-3/gluttony-bloated-arch/refined.glb'),
  'setpiece-gluttony-flesh-door-frame': require('../../../assets/models/setpieces/circle-3/gluttony-flesh-door-frame/refined.glb'),
  'setpiece-arch-broken': require('../../../assets/models/setpieces/general/arch-broken/refined.glb'),
  // Meshy AI generated set pieces
  'setpiece-bone-column': require('../../../assets/models/setpieces/general/bone-column/refined.glb'),
  // Meshy AI generated set pieces
  'setpiece-arch-gothic': require('../../../assets/models/setpieces/general/arch-gothic/refined.glb'),
  'setpiece-arch-stone-large': require('../../../assets/models/setpieces/general/arch-stone-large/refined.glb'),
  // Meshy AI generated set pieces
  'setpiece-arch-rounded': require('../../../assets/models/setpieces/general/arch-rounded/refined.glb'),
  'setpiece-arch-stone-medium': require('../../../assets/models/setpieces/general/arch-stone-medium/refined.glb'),
  'setpiece-arch-stone-small': require('../../../assets/models/setpieces/general/arch-stone-small/refined.glb'),
  'setpiece-bridge-railing': require('../../../assets/models/setpieces/general/bridge-railing/refined.glb'),
  'setpiece-bridge-segment-stone': require('../../../assets/models/setpieces/general/bridge-segment-stone/refined.glb'),
  'setpiece-ceiling-beam': require('../../../assets/models/setpieces/general/ceiling-beam/refined.glb'),
  'setpiece-doorframe-arch': require('../../../assets/models/setpieces/general/doorframe-arch/refined.glb'),
  'setpiece-doorframe-stone-heavy': require('../../../assets/models/setpieces/general/doorframe-stone-heavy/refined.glb'),
  'setpiece-doorframe-stone-simple': require('../../../assets/models/setpieces/general/doorframe-stone-simple/refined.glb'),
  'setpiece-floor-grating': require('../../../assets/models/setpieces/general/floor-grating/refined.glb'),
  'setpiece-gate-iron-bars': require('../../../assets/models/setpieces/general/gate-iron-bars/refined.glb'),
  'setpiece-pillar-broken': require('../../../assets/models/setpieces/general/pillar-broken/refined.glb'),
  'setpiece-pillar-round-classical': require('../../../assets/models/setpieces/general/pillar-round-classical/refined.glb'),
  'setpiece-pillar-round-plain': require('../../../assets/models/setpieces/general/pillar-round-plain/refined.glb'),
  'setpiece-pillar-square-short': require('../../../assets/models/setpieces/general/pillar-square-short/refined.glb'),
  'setpiece-pillar-square-tall': require('../../../assets/models/setpieces/general/pillar-square-tall/refined.glb'),
  'setpiece-pillar-twisted': require('../../../assets/models/setpieces/general/pillar-twisted/refined.glb'),
  'setpiece-portcullis-frame': require('../../../assets/models/setpieces/general/portcullis-frame/refined.glb'),
  'setpiece-ramp-stone-short': require('../../../assets/models/setpieces/general/ramp-stone-short/refined.glb'),
  'setpiece-stairs-spiral-quarter': require('../../../assets/models/setpieces/general/stairs-spiral-quarter/refined.glb'),
  'setpiece-stairs-straight-long': require('../../../assets/models/setpieces/general/stairs-straight-long/refined.glb'),
  'setpiece-stairs-straight-short': require('../../../assets/models/setpieces/general/stairs-straight-short/refined.glb'),
  'setpiece-wall-buttress': require('../../../assets/models/setpieces/general/wall-buttress/refined.glb'),
} as const satisfies Record<string, unknown>;

export type SetpieceModelKey = keyof typeof SETPIECE_MODEL_ASSETS;

// ---------------------------------------------------------------------------
// Audio — Music (OGG, converted from WAV)
// ---------------------------------------------------------------------------

export const MUSIC_ASSETS = {
  'music-menu': require('../../../assets/audio/music/whispering-shadows.ogg'),
  'music-exploration': require('../../../assets/audio/music/exploration.ogg'),
  'music-tense': require('../../../assets/audio/music/tense.ogg'),
  'music-boss': require('../../../assets/audio/music/boss.ogg'),
  'music-dark': require('../../../assets/audio/music/dark.ogg'),
  'music-death-metal': require('../../../assets/audio/music/death-metal.ogg'),
  'music-violence': require('../../../assets/audio/music/violence.ogg'),
  'music-revenge': require('../../../assets/audio/music/revenge.ogg'),
  'music-gothic': require('../../../assets/audio/music/gothic-picture.ogg'),
} as const;

export type MusicAssetKey = keyof typeof MUSIC_ASSETS;

// ---------------------------------------------------------------------------
// Audio — SFX (Kenney OGG)
// ---------------------------------------------------------------------------

export const SFX_ASSETS = {
  // Pistol (laserSmall)
  'sfx-pistol-0': require('../../../assets/audio/sfx/laserSmall_000.ogg'),
  'sfx-pistol-1': require('../../../assets/audio/sfx/laserSmall_001.ogg'),
  'sfx-pistol-2': require('../../../assets/audio/sfx/laserSmall_002.ogg'),
  // Shotgun (laserLarge)
  'sfx-shotgun-0': require('../../../assets/audio/sfx/laserLarge_000.ogg'),
  'sfx-shotgun-1': require('../../../assets/audio/sfx/laserLarge_001.ogg'),
  'sfx-shotgun-2': require('../../../assets/audio/sfx/laserLarge_002.ogg'),
  // Cannon (lowFrequency explosion)
  'sfx-cannon-0': require('../../../assets/audio/sfx/lowFrequency_explosion_000.ogg'),
  // Impact (impactMetal)
  'sfx-impact-0': require('../../../assets/audio/sfx/impactMetal_000.ogg'),
  'sfx-impact-1': require('../../../assets/audio/sfx/impactMetal_001.ogg'),
  'sfx-impact-2': require('../../../assets/audio/sfx/impactMetal_002.ogg'),
  'sfx-impact-3': require('../../../assets/audio/sfx/impactMetal_003.ogg'),
  // Explosion (explosionCrunch)
  'sfx-explosion-0': require('../../../assets/audio/sfx/explosionCrunch_000.ogg'),
  'sfx-explosion-1': require('../../../assets/audio/sfx/explosionCrunch_001.ogg'),
  'sfx-explosion-2': require('../../../assets/audio/sfx/explosionCrunch_002.ogg'),
  'sfx-explosion-3': require('../../../assets/audio/sfx/explosionCrunch_003.ogg'),
  // Door
  'sfx-doorOpen-0': require('../../../assets/audio/sfx/doorOpen_1.ogg'),
  'sfx-doorOpen-1': require('../../../assets/audio/sfx/doorOpen_2.ogg'),
  'sfx-doorClose-0': require('../../../assets/audio/sfx/doorClose_1.ogg'),
  'sfx-doorClose-1': require('../../../assets/audio/sfx/doorClose_2.ogg'),
  // Footsteps
  'sfx-footstep-0': require('../../../assets/audio/sfx/footstep_concrete_000.ogg'),
  'sfx-footstep-1': require('../../../assets/audio/sfx/footstep_concrete_001.ogg'),
  'sfx-footstep-2': require('../../../assets/audio/sfx/footstep_concrete_002.ogg'),
  'sfx-footstep-3': require('../../../assets/audio/sfx/footstep_concrete_003.ogg'),
  'sfx-footstep-4': require('../../../assets/audio/sfx/footstep_concrete_004.ogg'),
} as const;

export type SfxAssetKey = keyof typeof SFX_ASSETS;

// ---------------------------------------------------------------------------
// Physics (Havok WASM binary)
// ---------------------------------------------------------------------------

export const PHYSICS_ASSETS = {
  'havok-wasm': require('../../../assets/HavokPhysics.wasm'),
} as const;
