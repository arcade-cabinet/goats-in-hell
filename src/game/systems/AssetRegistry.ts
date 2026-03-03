/**
 * Static asset registry — maps asset keys to URL paths for cross-platform loading.
 * Models and audio are served from public/ as static files (not bundled by Metro).
 * Textures and WASM remain as Metro require() — they are still bundled assets.
 * Keys are used by ModelLoader / AudioSystem to fetch resources via getAssetUrl().
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
  'weapon-pistol': 'models/weapons/weapon-pistol.glb',
  // Pump-Action Shotgun
  'weapon-shotgun': 'models/weapons/weapon-shotgun.glb',
  // AK-47 → hellfire assault cannon
  'weapon-cannon': 'models/weapons/weapon-cannon.glb',
  // Bazooka (RPG-7) → Goat's Bane rocket launcher
  'weapon-launcher': 'models/weapons/weapon-launcher.glb',
  // Flamethrower — uses cannon as stand-in until dedicated model is exported
  'weapon-flamethrower': 'models/weapons/weapon-cannon.glb',
} as const;

export type WeaponModelKey = keyof typeof WEAPON_MODEL_ASSETS;

// ---------------------------------------------------------------------------
// Models — Projectiles
// ---------------------------------------------------------------------------

export const PROJECTILE_MODEL_ASSETS = {
  'projectile-bullet-small': 'models/projectiles/projectile-bullet-small.glb',
  'projectile-bullet-large': 'models/projectiles/projectile-bullet-large.glb',
  'projectile-shell': 'models/projectiles/projectile-shell.glb',
  'projectile-rocket': 'models/projectiles/projectile-rocket.glb',
} as const;

export type ProjectileModelKey = keyof typeof PROJECTILE_MODEL_ASSETS;

// ---------------------------------------------------------------------------
// Models — Enemies
// ---------------------------------------------------------------------------

export const ENEMY_MODEL_ASSETS = {
  // General mob types — Meshy AI-generated rigged meshes
  'enemy-goat': 'models/enemies/general/goat-grunt/model.glb',
  'enemy-hellgoat': 'models/enemies/circle-1/goat-shade/model.glb',
  'enemy-fireGoat': 'models/enemies/circle-5/goat-berserker/model.glb',
  'enemy-shadowGoat': 'models/enemies/general/goat-scout/model.glb',
  'enemy-goatKnight': 'models/enemies/general/goat-brute/model.glb',
  'enemy-plagueGoat': 'models/enemies/circle-3/goat-glutton/model.glb',
  // Boss entity models (also used via BOSS_MODEL_ASSETS for direct boss display)
  'enemy-archGoat': 'models/enemies/bosses/boss-azazel/model.glb',
  'enemy-infernoGoat': 'models/enemies/bosses/boss-furia/model.glb',
  'enemy-voidGoat': 'models/enemies/bosses/boss-profano/model.glb',
  'enemy-ironGoat': 'models/enemies/bosses/boss-il-macello/model.glb',
} as const;

export type EnemyModelKey = keyof typeof ENEMY_MODEL_ASSETS;

// ---------------------------------------------------------------------------
// Models — Circle Bosses (Meshy AI-generated, one per circle of Hell)
// ---------------------------------------------------------------------------

export const BOSS_MODEL_ASSETS = {
  'boss-il-vecchio': 'models/enemies/bosses/boss-il-vecchio/model.glb',
  'boss-caprone': 'models/enemies/bosses/boss-caprone/model.glb',
  'boss-vorago': 'models/enemies/bosses/boss-vorago/model.glb',
  'boss-aureo': 'models/enemies/bosses/boss-aureo/model.glb',
  'boss-furia': 'models/enemies/bosses/boss-furia/model.glb',
  'boss-profano': 'models/enemies/bosses/boss-profano/model.glb',
  'boss-il-macello': 'models/enemies/bosses/boss-il-macello/model.glb',
  'boss-inganno': 'models/enemies/bosses/boss-inganno/model.glb',
  'boss-azazel': 'models/enemies/bosses/boss-azazel/model.glb',
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
// Models — Enemy Animations (Meshy pre-rendered GLB clips, per enemy type)
// Each role maps to the best-fit Meshy animation for that combat state.
// ---------------------------------------------------------------------------

export const ENEMY_ANIMATION_ASSETS = {
  'enemy-goat': {
    walk: 'models/enemies/general/goat-grunt/animations/Zombie_Walk.glb',
    attack: 'models/enemies/general/goat-grunt/animations/Left_Slash.glb',
    hit: 'models/enemies/general/goat-grunt/animations/Face_Punch_Reaction.glb',
    death: 'models/enemies/general/goat-grunt/animations/Fall_Dead_from_Abdominal_Injury.glb',
  },
  'enemy-hellgoat': {
    walk: 'models/enemies/circle-1/goat-shade/animations/Stumble_Walk.glb',
    attack: 'models/enemies/circle-1/goat-shade/animations/Angry_Ground_Stomp.glb',
    hit: 'models/enemies/circle-1/goat-shade/animations/Mummy_Stagger.glb',
    death: 'models/enemies/circle-1/goat-shade/animations/Dead.glb',
  },
  'enemy-fireGoat': {
    walk: 'models/enemies/circle-5/goat-berserker/animations/Lean_Forward_Sprint.glb',
    attack: 'models/enemies/circle-5/goat-berserker/animations/Axe_Spin_Attack.glb',
    hit: 'models/enemies/circle-5/goat-berserker/animations/BeHit_FlyUp.glb',
    death: 'models/enemies/circle-5/goat-berserker/animations/Knock_Down.glb',
  },
  'enemy-shadowGoat': {
    walk: 'models/enemies/general/goat-scout/animations/Lean_Forward_Sprint.glb',
    attack: 'models/enemies/general/goat-scout/animations/Fast_Punch_Combo.glb',
    hit: 'models/enemies/general/goat-scout/animations/Face_Punch_Reaction_2.glb',
    death: 'models/enemies/general/goat-scout/animations/Electrocuted_Fall.glb',
  },
  'enemy-goatKnight': {
    walk: 'models/enemies/general/goat-brute/animations/Zombie_Walk.glb',
    attack: 'models/enemies/general/goat-brute/animations/Charged_Ground_Slam.glb',
    hit: 'models/enemies/general/goat-brute/animations/BeHit_FlyUp.glb',
    death: 'models/enemies/general/goat-brute/animations/Knock_Down.glb',
  },
  'enemy-plagueGoat': {
    walk: 'models/enemies/circle-3/goat-glutton/animations/Stumble_Walk.glb',
    attack: 'models/enemies/circle-3/goat-glutton/animations/mage_soell_cast.glb',
    hit: 'models/enemies/circle-3/goat-glutton/animations/BeHit_FlyUp.glb',
    death: 'models/enemies/circle-3/goat-glutton/animations/Knock_Down_1.glb',
  },
  'enemy-archGoat': {
    walk: 'models/enemies/bosses/boss-azazel/animations/Zombie_Walk.glb',
    attack: 'models/enemies/bosses/boss-azazel/animations/Axe_Spin_Attack.glb',
    hit: 'models/enemies/bosses/boss-azazel/animations/BeHit_FlyUp.glb',
    death: 'models/enemies/bosses/boss-azazel/animations/Knock_Down.glb',
  },
  'enemy-infernoGoat': {
    walk: 'models/enemies/bosses/boss-furia/animations/Lean_Forward_Sprint.glb',
    attack: 'models/enemies/bosses/boss-furia/animations/Axe_Spin_Attack.glb',
    hit: 'models/enemies/bosses/boss-furia/animations/BeHit_FlyUp.glb',
    death: 'models/enemies/bosses/boss-furia/animations/Knock_Down.glb',
  },
  'enemy-voidGoat': {
    walk: 'models/enemies/bosses/boss-profano/animations/Zombie_Walk.glb',
    attack: 'models/enemies/bosses/boss-profano/animations/Charged_Ground_Slam.glb',
    hit: 'models/enemies/bosses/boss-profano/animations/Face_Punch_Reaction.glb',
    death: 'models/enemies/bosses/boss-profano/animations/Dead.glb',
  },
  'enemy-ironGoat': {
    walk: 'models/enemies/bosses/boss-il-macello/animations/Zombie_Walk.glb',
    attack: 'models/enemies/bosses/boss-il-macello/animations/Charged_Axe_Chop.glb',
    hit: 'models/enemies/bosses/boss-il-macello/animations/BeHit_FlyUp.glb',
    death: 'models/enemies/bosses/boss-il-macello/animations/Knock_Down.glb',
  },
} as const;

// ---------------------------------------------------------------------------
// Models — Dungeon Props (Quaternius Medieval Dungeon)
// ---------------------------------------------------------------------------

export const PROP_MODEL_ASSETS = {
  // Remapped from old Kenney props
  'prop-firebasket': 'models/props/general/woodfire.glb',
  'prop-candle': 'models/props/general/candle.glb',
  'prop-candle-multi': 'models/props/general/candelabrum.glb',
  'prop-altar': 'models/props/general/pedestal.glb',
  'prop-column': 'models/props/general/column.glb',
  'prop-chalice': 'models/props/general/chalice.glb',
  'prop-bowl': 'models/props/general/pot.glb',
  'prop-spikes': 'models/props/general/spikes.glb',
  'prop-barrel': 'models/props/general/barrel.glb',
  'prop-torch-lit': 'models/props/general/torch.glb',
  'prop-torch-mounted': 'models/props/general/torch-wall.glb',
  'prop-chest': 'models/props/general/chest.glb',
  'prop-chest-gold': 'models/props/general/chest-gold.glb',
  // New Quaternius props — Modular Dungeon Pack
  'prop-column-broken': 'models/props/general/column-broken.glb',
  'prop-column-broken2': 'models/props/general/column-broken2.glb',
  'prop-candelabrum-tall': 'models/props/general/candelabrum-tall.glb',
  'prop-bones': 'models/props/general/bones.glb',
  'prop-bones2': 'models/props/general/bones2.glb',
  'prop-book-open': 'models/props/general/book-open.glb',
  'prop-carpet': 'models/props/general/carpet.glb',
  'prop-potion': 'models/props/general/potion.glb',
  'prop-rock1': 'models/props/general/rock1.glb',
  'prop-rock2': 'models/props/general/rock2.glb',
  'prop-rock3': 'models/props/general/rock3.glb',
  'prop-bars': 'models/props/general/bars.glb',
  'prop-window': 'models/props/general/window.glb',
  'prop-wall-rocks': 'models/props/general/wall-rocks.glb',
  // New Quaternius props — Updated Modular Dungeon
  'prop-banner': 'models/props/general/banner.glb',
  'prop-banner-wall': 'models/props/general/banner-wall.glb',
  'prop-cobweb': 'models/props/general/cobweb.glb',
  'prop-cobweb2': 'models/props/general/cobweb2.glb',
  'prop-skull': 'models/props/general/skull.glb',
  'prop-chair': 'models/props/general/chair.glb',
  'prop-table': 'models/props/general/table.glb',
  'prop-table-small': 'models/props/general/table-small.glb',
  'prop-pedestal': 'models/props/general/pedestal.glb',
  'prop-pedestal2': 'models/props/general/pedestal2.glb',
  'prop-sword-mount': 'models/props/general/sword-mount.glb',
  'prop-crate': 'models/props/general/crate.glb',
  'prop-trap-spikes': 'models/props/general/trap-spikes.glb',
  'prop-vase': 'models/props/general/vase.glb',
  'prop-bucket': 'models/props/general/bucket.glb',
  'prop-arch': 'models/props/general/arch.glb',
  'prop-arch-door': 'models/props/general/arch-door.glb',
  // New Quaternius props — Ultimate Modular Ruins Pack
  'prop-bear-trap': 'models/props/general/bear-trap.glb',
  'prop-bookcase': 'models/props/general/bookcase.glb',
  'prop-cart': 'models/props/general/cart.glb',
  'prop-candles': 'models/props/general/candles.glb',
  'prop-dead-tree': 'models/props/general/dead-tree.glb',
  'prop-broken-pot': 'models/props/general/broken-pot.glb',
  // New Quaternius props — Ultimate RPG Items Pack
  'prop-bone': 'models/props/general/bone.glb',
  'prop-crystal': 'models/props/general/crystal.glb',
  'prop-crystal2': 'models/props/general/crystal2.glb',
  'prop-rpg-skull': 'models/props/general/rpg-skull.glb',
  'prop-rpg-skull2': 'models/props/general/rpg-skull2.glb',
  'prop-health-potion': 'models/props/general/health-potion.glb',
  'prop-mana-potion': 'models/props/general/mana-potion.glb',
  'prop-key': 'models/props/general/key.glb',
  // New Quaternius props — Medieval Weapons Pack (wall decorations)
  'prop-scythe': 'models/props/general/scythe.glb',
  'prop-axe-wall': 'models/props/general/axe-wall.glb',
  'prop-shield-wall': 'models/props/general/shield-wall.glb',
  'prop-sword-wall': 'models/props/general/sword-wall.glb',
  // Meshy AI generated props
  'prop-fog-lantern': 'models/props/circle-1/fog-lantern/refined.glb',
  'prop-limbo-banner-tattered': 'models/props/circle-1/limbo-banner-tattered/refined.glb',
  'prop-limbo-bone-pile': 'models/props/circle-1/limbo-bone-pile/refined.glb',
  'prop-limbo-broken-altar': 'models/props/circle-1/limbo-broken-altar/refined.glb',
  'prop-limbo-cage': 'models/props/circle-1/limbo-cage/refined.glb',
  'prop-limbo-chain-cluster': 'models/props/circle-1/limbo-chain-cluster/refined.glb',
  'prop-limbo-cobweb-cluster': 'models/props/circle-1/limbo-cobweb-cluster/refined.glb',
  'prop-limbo-dried-fountain': 'models/props/circle-1/limbo-dried-fountain/refined.glb',
  'prop-limbo-inscription-tablet': 'models/props/circle-1/limbo-inscription-tablet/refined.glb',
  'prop-limbo-moss-growth': 'models/props/circle-1/limbo-moss-growth/refined.glb',
  'prop-limbo-ritual-circle': 'models/props/circle-1/limbo-ritual-circle/refined.glb',
  'prop-limbo-rubble-scatter': 'models/props/circle-1/limbo-rubble-scatter/refined.glb',
  'prop-limbo-sarcophagus': 'models/props/circle-1/limbo-sarcophagus/refined.glb',
  'prop-limbo-skull-pile': 'models/props/circle-1/limbo-skull-pile/refined.glb',
  'prop-limbo-spike-cluster': 'models/props/circle-1/limbo-spike-cluster/refined.glb',
  'prop-limbo-stone-bench': 'models/props/circle-1/limbo-stone-bench/refined.glb',
  'prop-limbo-stone-lectern': 'models/props/circle-1/limbo-stone-lectern/refined.glb',
  'prop-limbo-tombstone': 'models/props/circle-1/limbo-tombstone/refined.glb',
  'prop-limbo-torch-bracket': 'models/props/circle-1/limbo-torch-bracket/refined.glb',
  'prop-limbo-vase-rubble': 'models/props/circle-1/limbo-vase-rubble/refined.glb',
  'prop-lust-candelabra': 'models/props/circle-2/lust-candelabra/refined.glb',
  'prop-lust-chandelier': 'models/props/circle-2/lust-chandelier/refined.glb',
  'prop-lust-cracked-statue': 'models/props/circle-2/lust-cracked-statue/refined.glb',
  'prop-lust-ember-brazier': 'models/props/circle-2/lust-ember-brazier/refined.glb',
  'prop-lust-fallen-chair': 'models/props/circle-2/lust-fallen-chair/refined.glb',
  'prop-lust-floor-carpet': 'models/props/circle-2/lust-floor-carpet/refined.glb',
  'prop-lust-golden-chalice': 'models/props/circle-2/lust-golden-chalice/refined.glb',
  'prop-lust-lava-rock-border': 'models/props/circle-2/lust-lava-rock-border/refined.glb',
  'prop-lust-marble-vase': 'models/props/circle-2/lust-marble-vase/refined.glb',
  'prop-lust-ornate-bed-wrecked': 'models/props/circle-2/lust-ornate-bed-wrecked/refined.glb',
  'prop-lust-perfume-censer': 'models/props/circle-2/lust-perfume-censer/refined.glb',
  'prop-lust-rose-thorn-cluster': 'models/props/circle-2/lust-rose-thorn-cluster/refined.glb',
  'prop-lust-shattered-goblet': 'models/props/circle-2/lust-shattered-goblet/refined.glb',
  'prop-lust-velvet-drape': 'models/props/circle-2/lust-velvet-drape/refined.glb',
  'prop-lust-wind-banner': 'models/props/circle-2/lust-wind-banner/refined.glb',
  'prop-ornate-mirror': 'models/props/circle-2/ornate-mirror/refined.glb',
  'prop-silk-curtain': 'models/props/circle-2/silk-curtain/refined.glb',
  'prop-bile-cauldron': 'models/props/circle-3/bile-cauldron/refined.glb',
  'prop-feast-table': 'models/props/circle-3/feast-table/refined.glb',
  'prop-gluttony-acid-pool-edge': 'models/props/circle-3/gluttony-acid-pool-edge/refined.glb',
  'prop-gluttony-bile-pool-surface': 'models/props/circle-3/gluttony-bile-pool-surface/refined.glb',
  'prop-gluttony-bone-plate': 'models/props/circle-3/gluttony-bone-plate/refined.glb',
  'prop-gluttony-dripping-stalactite':
    'models/props/circle-3/gluttony-dripping-stalactite/refined.glb',
  'prop-gluttony-lantern-wall-green':
    'models/props/circle-3/gluttony-lantern-wall-green/refined.glb',
  'prop-gluttony-maggot-mound': 'models/props/circle-3/gluttony-maggot-mound/refined.glb',
  'prop-gluttony-meat-carcass': 'models/props/circle-3/gluttony-meat-carcass/refined.glb',
  'prop-gluttony-mucus-web': 'models/props/circle-3/gluttony-mucus-web/refined.glb',
  'prop-gluttony-overflowing-goblet':
    'models/props/circle-3/gluttony-overflowing-goblet/refined.glb',
  'prop-gluttony-pantry-chest': 'models/props/circle-3/gluttony-pantry-chest/refined.glb',
  'prop-gluttony-rope-tendril': 'models/props/circle-3/gluttony-rope-tendril/refined.glb',
  'prop-gluttony-rotten-crate': 'models/props/circle-3/gluttony-rotten-crate/refined.glb',
  'prop-gluttony-rotting-barrel': 'models/props/circle-3/gluttony-rotting-barrel/refined.glb',
  'prop-gluttony-slop-bucket': 'models/props/circle-3/gluttony-slop-bucket/refined.glb',
  'prop-gluttony-stomach-wall-growth':
    'models/props/circle-3/gluttony-stomach-wall-growth/refined.glb',
  'prop-gluttony-swollen-cask': 'models/props/circle-3/gluttony-swollen-cask/refined.glb',
  'prop-coin-pile': 'models/props/circle-4/coin-pile/refined.glb',
  'prop-golden-idol': 'models/props/circle-4/golden-idol/refined.glb',
  'prop-greed-ammo-scatter': 'models/props/circle-4/greed-ammo-scatter/refined.glb',
  'prop-greed-chest-pedestal': 'models/props/circle-4/greed-chest-pedestal/refined.glb',
  'prop-greed-coin-cascade': 'models/props/circle-4/greed-coin-cascade/refined.glb',
  'prop-greed-gear-mechanism': 'models/props/circle-4/greed-gear-mechanism/refined.glb',
  'prop-greed-gold-bar-stack': 'models/props/circle-4/greed-gold-bar-stack/refined.glb',
  'prop-greed-gold-chain': 'models/props/circle-4/greed-gold-chain/refined.glb',
  'prop-greed-golden-banner': 'models/props/circle-4/greed-golden-banner/refined.glb',
  'prop-greed-golden-candelabra': 'models/props/circle-4/greed-golden-candelabra/refined.glb',
  'prop-greed-golden-chalice': 'models/props/circle-4/greed-golden-chalice/refined.glb',
  'prop-greed-golden-key-display': 'models/props/circle-4/greed-golden-key-display/refined.glb',
  'prop-greed-golden-throne': 'models/props/circle-4/greed-golden-throne/refined.glb',
  'prop-greed-golden-vase': 'models/props/circle-4/greed-golden-vase/refined.glb',
  'prop-greed-jeweled-pedestal': 'models/props/circle-4/greed-jeweled-pedestal/refined.glb',
  'prop-greed-pressure-plate': 'models/props/circle-4/greed-pressure-plate/refined.glb',
  'prop-greed-safe-door': 'models/props/circle-4/greed-safe-door/refined.glb',
  'prop-greed-skeletal-goat': 'models/props/circle-4/greed-skeletal-goat/refined.glb',
  'prop-greed-treasure-chest': 'models/props/circle-4/greed-treasure-chest/refined.glb',
  'prop-lava-altar': 'models/props/circle-5/lava-altar/refined.glb',
  'prop-wrath-anvil': 'models/props/circle-5/wrath-anvil/refined.glb',
  'prop-wrath-caged-lantern': 'models/props/circle-5/wrath-caged-lantern/refined.glb',
  'prop-wrath-chain-curtain': 'models/props/circle-5/wrath-chain-curtain/refined.glb',
  'prop-wrath-dented-iron-door': 'models/props/circle-5/wrath-dented-iron-door/refined.glb',
  'prop-wrath-explosive-barrel': 'models/props/circle-5/wrath-explosive-barrel/refined.glb',
  'prop-wrath-iron-grate': 'models/props/circle-5/wrath-iron-grate/refined.glb',
  'prop-wrath-punching-bag-chain': 'models/props/circle-5/wrath-punching-bag-chain/refined.glb',
  'prop-wrath-rage-furnace': 'models/props/circle-5/wrath-rage-furnace/refined.glb',
  'prop-wrath-rusted-cage': 'models/props/circle-5/wrath-rusted-cage/refined.glb',
  'prop-wrath-shattered-weapon-rack':
    'models/props/circle-5/wrath-shattered-weapon-rack/refined.glb',
  'prop-wrath-smashed-barrier': 'models/props/circle-5/wrath-smashed-barrier/refined.glb',
  'prop-wrath-war-banner': 'models/props/circle-5/wrath-war-banner/refined.glb',
  'prop-wrath-weapon-pedestal': 'models/props/circle-5/wrath-weapon-pedestal/refined.glb',
  'prop-demon-throne': 'models/props/circle-6/demon-throne/refined.glb',
  'prop-heresy-bone-shelf': 'models/props/circle-6/heresy-bone-shelf/refined.glb',
  'prop-heresy-bone-urn': 'models/props/circle-6/heresy-bone-urn/refined.glb',
  'prop-heresy-broken-stained-glass':
    'models/props/circle-6/heresy-broken-stained-glass/refined.glb',
  'prop-heresy-burning-pyre': 'models/props/circle-6/heresy-burning-pyre/refined.glb',
  'prop-heresy-catacomb-torch': 'models/props/circle-6/heresy-catacomb-torch/refined.glb',
  'prop-heresy-church-pew': 'models/props/circle-6/heresy-church-pew/refined.glb',
  'prop-heresy-confessional-booth': 'models/props/circle-6/heresy-confessional-booth/refined.glb',
  'prop-heresy-corrupted-reliquary': 'models/props/circle-6/heresy-corrupted-reliquary/refined.glb',
  'prop-heresy-cracked-baptismal-font':
    'models/props/circle-6/heresy-cracked-baptismal-font/refined.glb',
  'prop-heresy-forbidden-bookcase': 'models/props/circle-6/heresy-forbidden-bookcase/refined.glb',
  'prop-heresy-pentagram-floor-tile':
    'models/props/circle-6/heresy-pentagram-floor-tile/refined.glb',
  'prop-heresy-profane-symbol': 'models/props/circle-6/heresy-profane-symbol/refined.glb',
  'prop-heresy-ritual-chandelier': 'models/props/circle-6/heresy-ritual-chandelier/refined.glb',
  'prop-heresy-scattered-bones': 'models/props/circle-6/heresy-scattered-bones/refined.glb',
  'prop-heresy-shattered-icon': 'models/props/circle-6/heresy-shattered-icon/refined.glb',
  'prop-heresy-skull-pile': 'models/props/circle-6/heresy-skull-pile/refined.glb',
  'prop-heresy-toppled-altar': 'models/props/circle-6/heresy-toppled-altar/refined.glb',
  'prop-heretic-tome': 'models/props/circle-6/heretic-tome/refined.glb',
  'prop-inverted-cross': 'models/props/circle-6/inverted-cross/refined.glb',
  'prop-blood-trough': 'models/props/circle-7/blood-trough/refined.glb',
  'prop-meat-hook': 'models/props/circle-7/meat-hook/refined.glb',
  'prop-torture-rack': 'models/props/circle-7/torture-rack/refined.glb',
  'prop-violence-blood-cauldron': 'models/props/circle-7/violence-blood-cauldron/refined.glb',
  'prop-violence-blood-gutter': 'models/props/circle-7/violence-blood-gutter/refined.glb',
  'prop-violence-blood-pool': 'models/props/circle-7/violence-blood-pool/refined.glb',
  'prop-violence-bone-grinder': 'models/props/circle-7/violence-bone-grinder/refined.glb',
  'prop-violence-butcher-block': 'models/props/circle-7/violence-butcher-block/refined.glb',
  'prop-violence-chain-conveyor': 'models/props/circle-7/violence-chain-conveyor/refined.glb',
  'prop-violence-fire-geyser-vent': 'models/props/circle-7/violence-fire-geyser-vent/refined.glb',
  'prop-violence-hook-rack': 'models/props/circle-7/violence-hook-rack/refined.glb',
  'prop-violence-industrial-cage': 'models/props/circle-7/violence-industrial-cage/refined.glb',
  'prop-violence-metal-crate-stack': 'models/props/circle-7/violence-metal-crate-stack/refined.glb',
  'prop-violence-rusted-anvil': 'models/props/circle-7/violence-rusted-anvil/refined.glb',
  'prop-violence-sawblade-decoration':
    'models/props/circle-7/violence-sawblade-decoration/refined.glb',
  'prop-violence-stone-altar': 'models/props/circle-7/violence-stone-altar/refined.glb',
  'prop-false-door': 'models/props/circle-8/false-door/refined.glb',
  'prop-fraud-broken-chandelier': 'models/props/circle-8/fraud-broken-chandelier/refined.glb',
  'prop-fraud-coin-pile': 'models/props/circle-8/fraud-coin-pile/refined.glb',
  'prop-fraud-cracked-mosaic-floor': 'models/props/circle-8/fraud-cracked-mosaic-floor/refined.glb',
  'prop-fraud-forked-tongue-relief': 'models/props/circle-8/fraud-forked-tongue-relief/refined.glb',
  'prop-fraud-gambling-table': 'models/props/circle-8/fraud-gambling-table/refined.glb',
  'prop-fraud-golden-banner': 'models/props/circle-8/fraud-golden-banner/refined.glb',
  'prop-fraud-marble-debris': 'models/props/circle-8/fraud-marble-debris/refined.glb',
  'prop-fraud-marble-pedestal': 'models/props/circle-8/fraud-marble-pedestal/refined.glb',
  'prop-fraud-mirror-shard': 'models/props/circle-8/fraud-mirror-shard/refined.glb',
  'prop-fraud-silhouette-prop': 'models/props/circle-8/fraud-silhouette-prop/refined.glb',
  'prop-fraud-stage-curtain': 'models/props/circle-8/fraud-stage-curtain/refined.glb',
  'prop-fraud-two-faced-bust': 'models/props/circle-8/fraud-two-faced-bust/refined.glb',
  'prop-trick-chest': 'models/props/circle-8/trick-chest/refined.glb',
  'prop-frozen-goat': 'models/props/circle-9/frozen-goat/refined.glb',
  'prop-soul-cage': 'models/props/circle-9/soul-cage/refined.glb',
  'prop-treachery-betrayer-cage': 'models/props/circle-9/treachery-betrayer-cage/refined.glb',
  'prop-treachery-crystalline-spike-wall':
    'models/props/circle-9/treachery-crystalline-spike-wall/refined.glb',
  'prop-treachery-dark-ice-monolith':
    'models/props/circle-9/treachery-dark-ice-monolith/refined.glb',
  'prop-treachery-frost-chalice': 'models/props/circle-9/treachery-frost-chalice/refined.glb',
  'prop-treachery-frozen-banner': 'models/props/circle-9/treachery-frozen-banner/refined.glb',
  'prop-treachery-frozen-chain-cluster':
    'models/props/circle-9/treachery-frozen-chain-cluster/refined.glb',
  'prop-treachery-frozen-feast-table':
    'models/props/circle-9/treachery-frozen-feast-table/refined.glb',
  'prop-treachery-frozen-stalactite':
    'models/props/circle-9/treachery-frozen-stalactite/refined.glb',
  'prop-treachery-frozen-sword': 'models/props/circle-9/treachery-frozen-sword/refined.glb',
  'prop-treachery-frozen-throne': 'models/props/circle-9/treachery-frozen-throne/refined.glb',
  'prop-treachery-frozen-waterfall': 'models/props/circle-9/treachery-frozen-waterfall/refined.glb',
  'prop-treachery-ice-crack-floor': 'models/props/circle-9/treachery-ice-crack-floor/refined.glb',
  'prop-treachery-ice-formation': 'models/props/circle-9/treachery-ice-formation/refined.glb',
  'prop-treachery-snow-drift-mound': 'models/props/circle-9/treachery-snow-drift-mound/refined.glb',
  'prop-treachery-unlit-lantern': 'models/props/circle-9/treachery-unlit-lantern/refined.glb',
  // Meshy AI generated props
  'prop-blood-candle': 'models/props/general/blood-candle/refined.glb',
  'prop-bone-pile': 'models/props/general/bone-pile/refined.glb',
  'prop-chain-hanging-cluster': 'models/props/general/chain-hanging-cluster/refined.glb',
  'prop-chain-hanging-single': 'models/props/general/chain-hanging-single/refined.glb',
  'prop-chain-wall-mounted': 'models/props/general/chain-wall-mounted/refined.glb',
  'prop-chandelier-iron': 'models/props/general/chandelier-iron/refined.glb',
  'prop-cobweb-large': 'models/props/general/cobweb-large/refined.glb',
  'prop-debris-scatter': 'models/props/general/debris-scatter/refined.glb',
  'prop-fire-pit-large': 'models/props/general/fire-pit-large/refined.glb',
  'prop-fire-pit-small': 'models/props/general/fire-pit-small/refined.glb',
  'prop-floor-drain': 'models/props/general/floor-drain/refined.glb',
  'prop-floor-rug-tattered': 'models/props/general/floor-rug-tattered/refined.glb',
  'prop-floor-tile-cracked': 'models/props/general/floor-tile-cracked/refined.glb',
  'prop-hell-torch': 'models/props/general/hell-torch/refined.glb',
  'prop-hellfire-brazier': 'models/props/general/hellfire-brazier/refined.glb',
  'prop-offering-skull-bowl': 'models/props/general/offering-skull-bowl/refined.glb',
  'prop-pentagram-floor': 'models/props/general/pentagram-floor/refined.glb',
  'prop-poison-pool': 'models/props/general/poison-pool/refined.glb',
  'prop-pressure-plate-stone': 'models/props/general/pressure-plate-stone/refined.glb',
  'prop-rope-hanging': 'models/props/general/rope-hanging/refined.glb',
  'prop-rubble-pile-large': 'models/props/general/rubble-pile-large/refined.glb',
  'prop-rubble-pile-small': 'models/props/general/rubble-pile-small/refined.glb',
  'prop-sacrificial-chalice': 'models/props/general/sacrificial-chalice/refined.glb',
  'prop-skull-candelabra': 'models/props/general/skull-candelabra/refined.glb',
  'prop-spike-bed-large': 'models/props/general/spike-bed-large/refined.glb',
  'prop-spike-bed-small': 'models/props/general/spike-bed-small/refined.glb',
  'prop-spike-wall-cluster': 'models/props/general/spike-wall-cluster/refined.glb',
  'prop-stalactite-cluster': 'models/props/general/stalactite-cluster/refined.glb',
  'prop-stone-sarcophagus': 'models/props/general/stone-sarcophagus/refined.glb',
  'prop-thorn-cluster-large': 'models/props/general/thorn-cluster-large/refined.glb',
  'prop-thorn-cluster-small': 'models/props/general/thorn-cluster-small/refined.glb',
  'prop-torch-sconce-ornate': 'models/props/general/torch-sconce-ornate/refined.glb',
  'prop-torch-sconce-simple': 'models/props/general/torch-sconce-simple/refined.glb',
  // Meshy AI generated props
  'prop-demon-relief': 'models/props/general/demon-relief/refined.glb',
  // Meshy AI generated props
  'prop-lust-marble-throne': 'models/props/circle-2/lust-marble-throne/refined.glb',
  'prop-fire-grate': 'models/props/general/fire-grate/refined.glb',
  // ---------------------------------------------------------------------------
  // Graveyard Pack — PBR FBX→GLB, realistic horror aesthetic (all in Circle 1
  // but usable in any circle: Heresy (6) and Treachery (9) especially)
  // ---------------------------------------------------------------------------
  'prop-limbo-grave-tombstone-1': 'models/props/circle-1/limbo-grave-tombstone-1/model.glb',
  'prop-limbo-grave-tombstone-2': 'models/props/circle-1/limbo-grave-tombstone-2/model.glb',
  'prop-limbo-grave-tombstone-3': 'models/props/circle-1/limbo-grave-tombstone-3/model.glb',
  'prop-limbo-grave-tombstone-4': 'models/props/circle-1/limbo-grave-tombstone-4/model.glb',
  'prop-limbo-grave-tombstone-5': 'models/props/circle-1/limbo-grave-tombstone-5/model.glb',
  'prop-limbo-grave-tombstone-6': 'models/props/circle-1/limbo-grave-tombstone-6/model.glb',
  'prop-limbo-grave-tombstone-7': 'models/props/circle-1/limbo-grave-tombstone-7/model.glb',
  'prop-limbo-grave-tombstone-8': 'models/props/circle-1/limbo-grave-tombstone-8/model.glb',
  'prop-limbo-grave-tombstone-9': 'models/props/circle-1/limbo-grave-tombstone-9/model.glb',
  'prop-limbo-grave-coffin-1': 'models/props/circle-1/limbo-grave-coffin-1/model.glb',
  'prop-limbo-grave-coffin-2': 'models/props/circle-1/limbo-grave-coffin-2/model.glb',
  'prop-limbo-grave-coffin-3': 'models/props/circle-1/limbo-grave-coffin-3/model.glb',
  'prop-limbo-grave-sarcophagus': 'models/props/circle-1/limbo-grave-sarcophagus/model.glb',
  'prop-limbo-cemetery-gate': 'models/props/circle-1/limbo-cemetery-gate/model.glb',
  'prop-limbo-cemetery-fence': 'models/props/circle-1/limbo-cemetery-fence/model.glb',
  'prop-limbo-grave-cross-1': 'models/props/circle-1/limbo-grave-cross-1/model.glb',
  'prop-limbo-grave-cross-2': 'models/props/circle-1/limbo-grave-cross-2/model.glb',
  'prop-limbo-grave-cross-3': 'models/props/circle-1/limbo-grave-cross-3/model.glb',
  'prop-limbo-grave-cross-4': 'models/props/circle-1/limbo-grave-cross-4/model.glb',
  'prop-limbo-grave-cross-5': 'models/props/circle-1/limbo-grave-cross-5/model.glb',
  'prop-limbo-grave-cross-6': 'models/props/circle-1/limbo-grave-cross-6/model.glb',
  'prop-limbo-grave-mound-1': 'models/props/circle-1/limbo-grave-mound-1/model.glb',
  'prop-limbo-grave-mound-2': 'models/props/circle-1/limbo-grave-mound-2/model.glb',
  'prop-limbo-cemetery-post': 'models/props/circle-1/limbo-cemetery-post/model.glb',
  'prop-limbo-grave-lamp': 'models/props/circle-1/limbo-grave-lamp/model.glb',
  'prop-limbo-grave-lantern': 'models/props/circle-1/limbo-grave-lantern/model.glb',
  'prop-limbo-grave-shovel': 'models/props/circle-1/limbo-grave-shovel/model.glb',
  'prop-limbo-grave-vase': 'models/props/circle-1/limbo-grave-vase/model.glb',
  'prop-limbo-grave-incense-holder': 'models/props/circle-1/limbo-grave-incense-holder/model.glb',
  'prop-limbo-grave-stand': 'models/props/circle-1/limbo-grave-stand/model.glb',
  'prop-limbo-grave-candle': 'models/props/circle-1/limbo-grave-candle/model.glb',
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
  'setpiece-limbo-ancient-pillar': 'models/setpieces/circle-1/limbo-ancient-pillar/refined.glb',
  'setpiece-limbo-broken-pillar': 'models/setpieces/circle-1/limbo-broken-pillar/refined.glb',
  'setpiece-limbo-cracked-floor-slab':
    'models/setpieces/circle-1/limbo-cracked-floor-slab/refined.glb',
  'setpiece-limbo-fallen-column': 'models/setpieces/circle-1/limbo-fallen-column/refined.glb',
  'setpiece-limbo-iron-gate': 'models/setpieces/circle-1/limbo-iron-gate/refined.glb',
  'setpiece-limbo-wall-sconce': 'models/setpieces/circle-1/limbo-wall-sconce/refined.glb',
  'setpiece-lust-bridge-railing': 'models/setpieces/circle-2/lust-bridge-railing/refined.glb',
  'setpiece-lust-gilded-pillar': 'models/setpieces/circle-2/lust-gilded-pillar/refined.glb',
  'setpiece-lust-onyx-column': 'models/setpieces/circle-2/lust-onyx-column/refined.glb',
  'setpiece-gluttony-fungus-pillar': 'models/setpieces/circle-3/gluttony-fungus-pillar/refined.glb',
  'setpiece-gluttony-organic-column':
    'models/setpieces/circle-3/gluttony-organic-column/refined.glb',
  'setpiece-gluttony-shelf-arch': 'models/setpieces/circle-3/gluttony-shelf-arch/refined.glb',
  'setpiece-greed-diamond-plate-platform':
    'models/setpieces/circle-4/greed-diamond-plate-platform/refined.glb',
  'setpiece-greed-gold-pillar': 'models/setpieces/circle-4/greed-gold-pillar/refined.glb',
  'setpiece-greed-vault-arch': 'models/setpieces/circle-4/greed-vault-arch/refined.glb',
  'setpiece-wrath-anger-graffiti-slab':
    'models/setpieces/circle-5/wrath-anger-graffiti-slab/refined.glb',
  'setpiece-wrath-blood-spattered-slab':
    'models/setpieces/circle-5/wrath-blood-spattered-slab/refined.glb',
  'setpiece-wrath-corroded-pipe-pillar':
    'models/setpieces/circle-5/wrath-corroded-pipe-pillar/refined.glb',
  'setpiece-wrath-jagged-arch': 'models/setpieces/circle-5/wrath-jagged-arch/refined.glb',
  'setpiece-wrath-pit-tier-ring': 'models/setpieces/circle-5/wrath-pit-tier-ring/refined.glb',
  'setpiece-wrath-stone-island': 'models/setpieces/circle-5/wrath-stone-island/refined.glb',
  'setpiece-heresy-cracked-marble-pillar':
    'models/setpieces/circle-6/heresy-cracked-marble-pillar/refined.glb',
  'setpiece-heresy-desecrated-arch': 'models/setpieces/circle-6/heresy-desecrated-arch/refined.glb',
  'setpiece-heresy-torn-scripture-slab':
    'models/setpieces/circle-6/heresy-torn-scripture-slab/refined.glb',
  'setpiece-violence-blood-river-arch':
    'models/setpieces/circle-7/violence-blood-river-arch/refined.glb',
  'setpiece-violence-grating-panel': 'models/setpieces/circle-7/violence-grating-panel/refined.glb',
  'setpiece-violence-industrial-arch':
    'models/setpieces/circle-7/violence-industrial-arch/refined.glb',
  'setpiece-violence-iron-railing': 'models/setpieces/circle-7/violence-iron-railing/refined.glb',
  'setpiece-violence-pier-overlook': 'models/setpieces/circle-7/violence-pier-overlook/refined.glb',
  'setpiece-violence-riveted-pipe-pillar':
    'models/setpieces/circle-7/violence-riveted-pipe-pillar/refined.glb',
  'setpiece-violence-rusted-walkway-platform':
    'models/setpieces/circle-7/violence-rusted-walkway-platform/refined.glb',
  'setpiece-violence-thorn-column': 'models/setpieces/circle-7/violence-thorn-column/refined.glb',
  'setpiece-violence-walkway-pillar':
    'models/setpieces/circle-7/violence-walkway-pillar/refined.glb',
  'setpiece-fraud-crumbling-facade': 'models/setpieces/circle-8/fraud-crumbling-facade/refined.glb',
  'setpiece-fraud-fake-column': 'models/setpieces/circle-8/fraud-fake-column/refined.glb',
  'setpiece-fraud-onyx-wall-panel': 'models/setpieces/circle-8/fraud-onyx-wall-panel/refined.glb',
  'setpiece-fraud-ornate-arch': 'models/setpieces/circle-8/fraud-ornate-arch/refined.glb',
  'setpiece-fraud-ornate-railing': 'models/setpieces/circle-8/fraud-ornate-railing/refined.glb',
  'setpiece-fraud-ramp-platform': 'models/setpieces/circle-8/fraud-ramp-platform/refined.glb',
  'setpiece-fraud-shifting-wall-segment':
    'models/setpieces/circle-8/fraud-shifting-wall-segment/refined.glb',
  'setpiece-fraud-theatrical-column':
    'models/setpieces/circle-8/fraud-theatrical-column/refined.glb',
  'setpiece-ice-pillar': 'models/setpieces/circle-9/ice-pillar/refined.glb',
  'setpiece-treachery-frost-shattered-column':
    'models/setpieces/circle-9/treachery-frost-shattered-column/refined.glb',
  'setpiece-treachery-glacial-platform':
    'models/setpieces/circle-9/treachery-glacial-platform/refined.glb',
  'setpiece-treachery-ice-arch': 'models/setpieces/circle-9/treachery-ice-arch/refined.glb',
  'setpiece-treachery-ice-bridge-segment':
    'models/setpieces/circle-9/treachery-ice-bridge-segment/refined.glb',
  // Meshy AI generated set pieces
  'setpiece-limbo-crumbling-arch': 'models/setpieces/circle-1/limbo-crumbling-arch/refined.glb',
  'setpiece-lust-coffered-ceiling-tile':
    'models/setpieces/circle-2/lust-coffered-ceiling-tile/refined.glb',
  'setpiece-lust-ornate-arch': 'models/setpieces/circle-2/lust-ornate-arch/refined.glb',
  'setpiece-gluttony-bloated-arch': 'models/setpieces/circle-3/gluttony-bloated-arch/refined.glb',
  'setpiece-gluttony-flesh-door-frame':
    'models/setpieces/circle-3/gluttony-flesh-door-frame/refined.glb',
  'setpiece-arch-broken': 'models/setpieces/general/arch-broken/refined.glb',
  // Meshy AI generated set pieces
  'setpiece-bone-column': 'models/setpieces/general/bone-column/refined.glb',
  // Meshy AI generated set pieces
  'setpiece-arch-gothic': 'models/setpieces/general/arch-gothic/refined.glb',
  'setpiece-arch-stone-large': 'models/setpieces/general/arch-stone-large/refined.glb',
  // Meshy AI generated set pieces
  'setpiece-arch-rounded': 'models/setpieces/general/arch-rounded/refined.glb',
  'setpiece-arch-stone-medium': 'models/setpieces/general/arch-stone-medium/refined.glb',
  'setpiece-arch-stone-small': 'models/setpieces/general/arch-stone-small/refined.glb',
  'setpiece-bridge-railing': 'models/setpieces/general/bridge-railing/refined.glb',
  'setpiece-bridge-segment-stone': 'models/setpieces/general/bridge-segment-stone/refined.glb',
  'setpiece-ceiling-beam': 'models/setpieces/general/ceiling-beam/refined.glb',
  'setpiece-doorframe-arch': 'models/setpieces/general/doorframe-arch/refined.glb',
  'setpiece-doorframe-stone-heavy': 'models/setpieces/general/doorframe-stone-heavy/refined.glb',
  'setpiece-doorframe-stone-simple': 'models/setpieces/general/doorframe-stone-simple/refined.glb',
  'setpiece-floor-grating': 'models/setpieces/general/floor-grating/refined.glb',
  'setpiece-gate-iron-bars': 'models/setpieces/general/gate-iron-bars/refined.glb',
  'setpiece-pillar-broken': 'models/setpieces/general/pillar-broken/refined.glb',
  'setpiece-pillar-round-classical': 'models/setpieces/general/pillar-round-classical/refined.glb',
  'setpiece-pillar-round-plain': 'models/setpieces/general/pillar-round-plain/refined.glb',
  'setpiece-pillar-square-short': 'models/setpieces/general/pillar-square-short/refined.glb',
  'setpiece-pillar-square-tall': 'models/setpieces/general/pillar-square-tall/refined.glb',
  'setpiece-pillar-twisted': 'models/setpieces/general/pillar-twisted/refined.glb',
  'setpiece-portcullis-frame': 'models/setpieces/general/portcullis-frame/refined.glb',
  'setpiece-ramp-stone-short': 'models/setpieces/general/ramp-stone-short/refined.glb',
  'setpiece-stairs-spiral-quarter': 'models/setpieces/general/stairs-spiral-quarter/refined.glb',
  'setpiece-stairs-straight-long': 'models/setpieces/general/stairs-straight-long/refined.glb',
  'setpiece-stairs-straight-short': 'models/setpieces/general/stairs-straight-short/refined.glb',
  'setpiece-wall-buttress': 'models/setpieces/general/wall-buttress/refined.glb',
} as const;

export type SetpieceModelKey = keyof typeof SETPIECE_MODEL_ASSETS;

// ---------------------------------------------------------------------------
// Audio — Music (OGG, converted from WAV)
// ---------------------------------------------------------------------------

export const MUSIC_ASSETS = {
  'music-menu': 'audio/music/whispering-shadows.ogg',
  'music-exploration': 'audio/music/exploration.ogg',
  'music-tense': 'audio/music/tense.ogg',
  'music-boss': 'audio/music/boss.ogg',
  'music-dark': 'audio/music/dark.ogg',
  'music-death-metal': 'audio/music/death-metal.ogg',
  'music-violence': 'audio/music/violence.ogg',
  'music-revenge': 'audio/music/revenge.ogg',
  'music-gothic': 'audio/music/gothic-picture.ogg',
} as const;

export type MusicAssetKey = keyof typeof MUSIC_ASSETS;

// ---------------------------------------------------------------------------
// Audio — SFX (Kenney OGG)
// ---------------------------------------------------------------------------

export const SFX_ASSETS = {
  // Pistol (laserSmall)
  'sfx-pistol-0': 'audio/sfx/laserSmall_000.ogg',
  'sfx-pistol-1': 'audio/sfx/laserSmall_001.ogg',
  'sfx-pistol-2': 'audio/sfx/laserSmall_002.ogg',
  // Shotgun (laserLarge)
  'sfx-shotgun-0': 'audio/sfx/laserLarge_000.ogg',
  'sfx-shotgun-1': 'audio/sfx/laserLarge_001.ogg',
  'sfx-shotgun-2': 'audio/sfx/laserLarge_002.ogg',
  // Cannon (lowFrequency explosion)
  'sfx-cannon-0': 'audio/sfx/lowFrequency_explosion_000.ogg',
  // Impact (impactMetal)
  'sfx-impact-0': 'audio/sfx/impactMetal_000.ogg',
  'sfx-impact-1': 'audio/sfx/impactMetal_001.ogg',
  'sfx-impact-2': 'audio/sfx/impactMetal_002.ogg',
  'sfx-impact-3': 'audio/sfx/impactMetal_003.ogg',
  // Explosion (explosionCrunch)
  'sfx-explosion-0': 'audio/sfx/explosionCrunch_000.ogg',
  'sfx-explosion-1': 'audio/sfx/explosionCrunch_001.ogg',
  'sfx-explosion-2': 'audio/sfx/explosionCrunch_002.ogg',
  'sfx-explosion-3': 'audio/sfx/explosionCrunch_003.ogg',
  // Door
  'sfx-doorOpen-0': 'audio/sfx/doorOpen_1.ogg',
  'sfx-doorOpen-1': 'audio/sfx/doorOpen_2.ogg',
  'sfx-doorClose-0': 'audio/sfx/doorClose_1.ogg',
  'sfx-doorClose-1': 'audio/sfx/doorClose_2.ogg',
  // Footsteps
  'sfx-footstep-0': 'audio/sfx/footstep_concrete_000.ogg',
  'sfx-footstep-1': 'audio/sfx/footstep_concrete_001.ogg',
  'sfx-footstep-2': 'audio/sfx/footstep_concrete_002.ogg',
  'sfx-footstep-3': 'audio/sfx/footstep_concrete_003.ogg',
  'sfx-footstep-4': 'audio/sfx/footstep_concrete_004.ogg',
} as const;

export type SfxAssetKey = keyof typeof SFX_ASSETS;

// ---------------------------------------------------------------------------
// Physics (Havok WASM binary)
// ---------------------------------------------------------------------------

export const PHYSICS_ASSETS = {
  'havok-wasm': require('../../../assets/HavokPhysics.wasm'),
} as const;
