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
} as const;

export type TextureAssetKey = keyof typeof TEXTURE_ASSETS;

// ---------------------------------------------------------------------------
// Models — Weapons (Kenney Blaster Kit)
// ---------------------------------------------------------------------------

export const WEAPON_MODEL_ASSETS = {
  'weapon-pistol': require('../../../assets/models/weapons/blaster-a.glb'),
  'weapon-shotgun': require('../../../assets/models/weapons/blaster-c.glb'),
  'weapon-cannon': require('../../../assets/models/weapons/blaster-g.glb'),
  'weapon-launcher': require('../../../assets/models/weapons/blaster-n.glb'),
  // Flamethrower — reuses blaster-g as placeholder until dedicated model is added
  'weapon-flamethrower': require('../../../assets/models/weapons/blaster-g.glb'),
} as const;

export type WeaponModelKey = keyof typeof WEAPON_MODEL_ASSETS;

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
} as const;

export type PropModelKey = keyof typeof PROP_MODEL_ASSETS;

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
