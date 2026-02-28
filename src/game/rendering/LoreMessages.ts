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
// Extended lore — longer narrative for proximity reading
// ---------------------------------------------------------------------------

const EXTENDED_LORE: Record<string, string> = {
  'THE GOATS WERE\nHERE FIRST': 'Long before demons claimed these pits, the goats ruled. Their hooves carved the first tunnels. Their bleating echoed through the primordial void. We are merely guests in their domain.',
  'ABANDON ALL\nHAY, YE WHO\nENTER': 'The great poet Baa-nte wrote these words at the gates of the Ninth Pasture. None who entered ever returned to graze again.',
  'HELL IS\nOTHER GOATS': 'The philosopher Jean-Bleat Sartre understood: true torment is being trapped in a room with goats who judge you silently with their rectangular pupils.',
  'THE GRASS\nIS ALWAYS\nGREENER\nIN HELL': 'Ironic, given that nothing grows here but contempt and sulfur crystals. The goats eat both.',
  'DO NOT\nFEED THE\nGOATS': 'FACILITY WARNING: Feeding the specimens accelerates mutation. Last incident resulted in 47 casualties and one very satisfied goat.',
  'BEWARE THE\nTIN CAN\nOF DAMNATION': 'The Sacred Tin Can of Baphomet — whoever feeds it to the Arch-Goat shall either gain untold power or be digested. The odds are not in your favor.',
  'PROPERTY OF\nSATAN\'S\nPETTING ZOO': 'NOTICE: This level has been condemned by Infernal Health & Safety. The goats were deemed too dangerous for public interaction. The petting zoo is permanently closed.',
  'THE FLAMES\nHUNGER FOR\nYOUR FLESH': 'The fire pits are not merely geological. They are alive. They are hungry. And they have learned that human flesh tastes better when seasoned with fear.',
  'THE WALLS\nARE WATCHING\nYOU': 'The flesh caverns were once a living creature. It was so vast that demons built their fortress inside its corpse. Some say it is not entirely dead.',
  'THE VOID\nGOAT DREAMS\nOF YOU': 'In the deepest layer of Hell, a goat sleeps and dreams of every soul that has ever lived. When it wakes, they say, all of reality will be consumed.',
  'THE ABYSS\nBLEATS BACK': 'Nietzsche was wrong about the abyss. It does not merely gaze. It bleats. Endlessly. The sound drives lesser demons to madness.',
  'SOMETHING\nTERRIBLE\nAWAITS\nAHEAD': 'The Herd Leader stirs in its chamber. It has been waiting for a challenger. It has been waiting for you. Do not disappoint it — a quick death would be a mercy.',
};

// Fallback extended text for messages without specific entries
const EXTENDED_FALLBACK = [
  'These walls have witnessed countless souls fall to the hooves of the damned. You will not be the last.',
  'The goats remember everything. Every intruder. Every bullet. Every scream. They keep score.',
  'Deeper you go, stronger they become. The question is not whether you will die, but how many you take with you.',
  'Someone carved this message in haste. The scratches suggest they were interrupted. By what, you can only imagine.',
  'The air here tastes of sulfur and regret. Press onward, or join the others who gave up and became goat feed.',
];

// ---------------------------------------------------------------------------
// Lore registry — tracks positions + text for proximity interaction
// ---------------------------------------------------------------------------

export interface LoreEntry {
  position: Vector3;
  text: string;
  extendedText: string;
}

const loreRegistry: LoreEntry[] = [];

/** Get all registered lore entries for proximity checking. */
export function getLoreEntries(): readonly LoreEntry[] {
  return loreRegistry;
}

/** Clear lore registry between floors. */
export function clearLoreRegistry(): void {
  loreRegistry.length = 0;
}

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

  // Register in lore registry for proximity interaction
  const extendedText = EXTENDED_LORE[text]
    ?? EXTENDED_FALLBACK[Math.floor(rng() * EXTENDED_FALLBACK.length)];
  loreRegistry.push({
    position: new Vector3(position.x, 1.4, position.z),
    text: text.replace(/\n/g, ' '),
    extendedText,
  });

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
