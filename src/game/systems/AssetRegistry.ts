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
} as const;

export type WeaponModelKey = keyof typeof WEAPON_MODEL_ASSETS;

// ---------------------------------------------------------------------------
// Models — Enemies
// ---------------------------------------------------------------------------

export const ENEMY_MODEL_ASSETS = {
  // Goat variants — all use the DemonicGoat base model at different scales/materials
  'enemy-goat': require('../../../assets/models/enemies/demonic-goat.glb'),
  'enemy-hellgoat': require('../../../assets/models/enemies/demonic-goat.glb'),
  'enemy-goatKnight': require('../../../assets/models/enemies/demonic-goat.glb'),
  // Specialized enemy models — distinct silhouettes for gameplay readability
  'enemy-fireGoat': require('../../../assets/models/enemies/phantom.glb'),
  'enemy-shadowGoat': require('../../../assets/models/enemies/wraith.glb'),
  // Boss models — unique per boss for visual impact
  'enemy-archGoat': require('../../../assets/models/enemies/alienmonster.glb'),
  'enemy-infernoGoat': require('../../../assets/models/enemies/spider.glb'),
  'enemy-voidGoat': require('../../../assets/models/enemies/character-ghost.glb'),
  'enemy-ironGoat': require('../../../assets/models/enemies/Skeleton_Mage.glb'),
  // Skeleton trash mobs (for future horde variants)
  'enemy-skeleton': require('../../../assets/models/enemies/Skeleton_Minion.glb'),
  'enemy-skeletonWarrior': require('../../../assets/models/enemies/Skeleton_Warrior.glb'),
  'enemy-skeletonRogue': require('../../../assets/models/enemies/Skeleton_Rogue.glb'),
} as const;

export type EnemyModelKey = keyof typeof ENEMY_MODEL_ASSETS;

// ---------------------------------------------------------------------------
// Models — Dungeon Props (Kenney Graveyard)
// ---------------------------------------------------------------------------

export const PROP_MODEL_ASSETS = {
  'prop-firebasket': require('../../../assets/models/props/fire-basket.glb'),
  'prop-candle': require('../../../assets/models/props/candle.glb'),
  'prop-candle-multi': require('../../../assets/models/props/candle-multiple.glb'),
  'prop-altar': require('../../../assets/models/props/altar-stone.glb'),
  'prop-coffin': require('../../../assets/models/props/coffin.glb'),
  'prop-column': require('../../../assets/models/props/column-large.glb'),
  'prop-chalice': require('../../../assets/models/props/detail-chalice.glb'),
  'prop-bowl': require('../../../assets/models/props/detail-bowl.glb'),
  'prop-spikes': require('../../../assets/models/props/floor_tile_big_spikes.glb'),
  'prop-barrel': require('../../../assets/models/props/barrel_large.glb'),
  'prop-barrel-small': require('../../../assets/models/props/barrel_small.glb'),
  'prop-torch-lit': require('../../../assets/models/props/torch_lit.glb'),
  'prop-torch-mounted': require('../../../assets/models/props/torch_mounted.glb'),
  'prop-chest': require('../../../assets/models/props/chest.glb'),
  'prop-chest-gold': require('../../../assets/models/props/chest_gold.glb'),
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
