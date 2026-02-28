/**
 * Wall-mounted lore messages — DynamicTexture planes placed against walls
 * in dungeon corridors. Displays randomized hellish flavor text.
 */
import {
  DynamicTexture,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
} from '@babylonjs/core';

import {useGameStore} from '../../state/GameStore';

// ---------------------------------------------------------------------------
// Lore text pools — grouped by theme for variety
// ---------------------------------------------------------------------------

const LORE_GENERIC = [
  'THE GOATS WERE\nHERE FIRST',
  'ABANDON ALL\nHAY, YE WHO\nENTER',
  'BLEAT UNTO\nTHE VOID',
  'THE HOOVES\nOF JUDGMENT\nAPPROACH',
  'HELL IS\nOTHER GOATS',
  'NO SOUL\nESCAPES THE\nBLEATING',
  'THEIR EYES\nSEE ALL\nTHEIR HORNS\nPIERCE ALL',
  'THE GRASS\nIS ALWAYS\nGREENER\nIN HELL',
  'DO NOT\nFEED THE\nGOATS',
  'BEWARE THE\nTIN CAN\nOF DAMNATION',
  'EVEN DEMONS\nFEAR THE\nGOAT',
  'BRIMSTONE\nTASTES LIKE\nCHICKEN',
  'TURN BACK\nOR BE\nHEADBUTTED\nTO OBLIVION',
  'PROPERTY OF\nSATAN\'S\nPETTING ZOO',
];

const LORE_FIRE = [
  'THE FLAMES\nHUNGER FOR\nYOUR FLESH',
  'FIRE GOATS\nDO NOT\nFORGIVE',
  'EVERY BLAZE\nBEGAN WITH\nA SINGLE\nBLEAT',
  'MOLTEN HOOVES\nSHALL TRAMPLE\nTHE UNWORTHY',
];

const LORE_FLESH = [
  'THE WALLS\nARE WATCHING\nYOU',
  'FLESH AND\nBONE AND\nGOAT',
  'THE CAVERNS\nBREATHE WITH\nHATRED',
  'DO NOT TOUCH\nTHE WALLS\nTHEY FEEL\nEVERYTHING',
];

const LORE_VOID = [
  'THE VOID\nGOAT DREAMS\nOF YOU',
  'SHADOWS ARE\nJUST GOATS\nYOU CANNOT\nSEE',
  'IN DARKNESS\nTHERE IS\nONLY BLEAT',
  'THE ABYSS\nBLEATS BACK',
];

const LORE_BOSS_WARNING = [
  'SOMETHING\nTERRIBLE\nAWAITS\nAHEAD',
  'THE HERD\nLEADER\nKNOWS YOU\nARE HERE',
  'PREPARE\nTO MEET\nYOUR\nSHEPHERD',
];

// ---------------------------------------------------------------------------
// Message selection
// ---------------------------------------------------------------------------

/** Shorthand for the store's seeded PRNG. */
function rng(): number {
  return useGameStore.getState().rng();
}

function pickMessage(themeName: string, floor: number): string {
  const pools = [LORE_GENERIC];

  if (themeName === 'firePits') pools.push(LORE_FIRE);
  if (themeName === 'fleshCaverns') pools.push(LORE_FLESH);
  if (themeName === 'voidTemple' || themeName === 'obsidianFortress') pools.push(LORE_VOID);

  // Boss warning on floors just before a boss (every 5th stage)
  if (floor % 5 === 4) pools.push(LORE_BOSS_WARNING);

  // Flatten and pick
  const all = pools.flat();
  return all[Math.floor(rng() * all.length)];
}

// ---------------------------------------------------------------------------
// Mesh creation
// ---------------------------------------------------------------------------

const PLAQUE_WIDTH = 1.4;
const PLAQUE_HEIGHT = 1.0;
const TEX_RES = 256;

/**
 * Create a wall-mounted lore plaque mesh at the given position and rotation.
 * Returns the mesh (caller is responsible for disposal).
 */
export function createLoreMessage(
  position: Vector3,
  rotation: number,
  floor: number,
  themeName: string,
  scene: Scene,
): Mesh {
  const text = pickMessage(themeName, floor);

  // Dynamic texture for the text
  const tex = new DynamicTexture(`loreTex-${position.x}-${position.z}`, TEX_RES, scene, false);
  const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;

  // Dark background with slight color tint per theme
  ctx.fillStyle = themeName === 'firePits' ? '#1a0800'
    : themeName === 'fleshCaverns' ? '#1a0010'
    : '#0a0a12';
  ctx.fillRect(0, 0, TEX_RES, TEX_RES);

  // Scratchy border
  ctx.strokeStyle = '#443322';
  ctx.lineWidth = 4;
  ctx.strokeRect(8, 8, TEX_RES - 16, TEX_RES - 16);

  // Text rendering
  const lines = text.split('\n');
  const fontSize = lines.length > 3 ? 26 : 32;
  ctx.font = `bold ${fontSize}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Blood-red text with slight variation
  const r = 180 + Math.floor(rng() * 60);
  const g = Math.floor(rng() * 30);
  const b = Math.floor(rng() * 20);
  ctx.fillStyle = `rgb(${r},${g},${b})`;

  const lineHeight = fontSize + 4;
  const totalHeight = lines.length * lineHeight;
  const startY = (TEX_RES - totalHeight) / 2 + fontSize / 2;

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], TEX_RES / 2, startY + i * lineHeight);
  }

  tex.update();

  // Create thin plane mesh
  const plane = MeshBuilder.CreatePlane(
    `lore-${position.x}-${position.z}`,
    {width: PLAQUE_WIDTH, height: PLAQUE_HEIGHT},
    scene,
  );

  const mat = new StandardMaterial(`loreMat-${position.x}-${position.z}`, scene);
  mat.diffuseTexture = tex;
  mat.emissiveTexture = tex; // self-illuminated so readable in dark dungeons
  mat.disableLighting = true;
  mat.backFaceCulling = true;
  plane.material = mat;

  // Position against wall: slightly offset from wall center
  plane.position = new Vector3(position.x, 1.4, position.z);
  plane.rotation.y = rotation;

  // Offset slightly forward from the wall so it doesn't z-fight
  const offsetX = Math.sin(rotation) * 0.05;
  const offsetZ = Math.cos(rotation) * 0.05;
  plane.position.x += offsetX;
  plane.position.z += offsetZ;

  return plane;
}
