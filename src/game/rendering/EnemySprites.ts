import {DynamicTexture} from '@babylonjs/core';
import type {Scene} from '@babylonjs/core';
import type {EntityType} from '../entities/components';

// ---------------------------------------------------------------------------
// Enemy sprite texture cache – one DynamicTexture per enemy type
// ---------------------------------------------------------------------------

const cache = new Map<string, DynamicTexture>();
const SIZE = 256;

export function getEnemySpriteTexture(
  type: EntityType,
  scene: Scene,
): DynamicTexture {
  const key = `enemySprite-${type}`;
  if (cache.has(key)) return cache.get(key)!;

  const tex = new DynamicTexture(key, SIZE, scene, false);
  const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
  tex.hasAlpha = true;
  ctx.clearRect(0, 0, SIZE, SIZE);

  switch (type) {
    case 'goat':
      drawGoat(ctx);
      break;
    case 'hellgoat':
      drawHellGoat(ctx);
      break;
    case 'fireGoat':
      drawFireGoat(ctx);
      break;
    case 'shadowGoat':
      drawShadowGoat(ctx);
      break;
    case 'goatKnight':
      drawGoatKnight(ctx);
      break;
    case 'archGoat':
      drawArchGoat(ctx);
      break;
    default:
      drawGoat(ctx);
  }

  tex.update();
  cache.set(key, tex);
  return tex;
}

// ---------------------------------------------------------------------------
// Shared goat anatomy primitives
// ---------------------------------------------------------------------------

/** Draw a curved horn from base to tip. */
function drawHorn(
  ctx: CanvasRenderingContext2D,
  baseX: number,
  baseY: number,
  tipX: number,
  tipY: number,
  cpX: number,
  cpY: number,
  width: number,
  color: string,
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.quadraticCurveTo(cpX, cpY, tipX, tipY);
  ctx.stroke();
  // Taper: draw again thinner on top
  ctx.lineWidth = width * 0.5;
  ctx.strokeStyle = lighten(color, 30);
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.quadraticCurveTo(cpX, cpY, tipX, tipY);
  ctx.stroke();
  ctx.restore();
}

/** Draw a rectangular goat eye with horizontal slit pupil. */
function drawGoatEye(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  irisColor: string,
  glowColor: string,
  glowAmount = 8,
) {
  ctx.save();
  // Glow
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = glowAmount;
  // Eye white (slightly yellowish for goats)
  ctx.fillStyle = '#e8dcc0';
  ctx.beginPath();
  ctx.ellipse(cx, cy, radius * 1.3, radius, 0, 0, Math.PI * 2);
  ctx.fill();
  // Iris
  ctx.fillStyle = irisColor;
  ctx.beginPath();
  ctx.ellipse(cx, cy, radius * 0.9, radius * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();
  // Horizontal rectangular pupil (distinctive goat feature)
  ctx.fillStyle = '#000000';
  ctx.fillRect(cx - radius * 0.8, cy - radius * 0.2, radius * 1.6, radius * 0.4);
  ctx.shadowBlur = 0;
  ctx.restore();
}

/** Draw a simple hoof at the bottom of a leg. */
function drawHoof(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  color: string,
) {
  ctx.fillStyle = color;
  // Split hoof shape
  ctx.beginPath();
  ctx.moveTo(x - width / 2, y);
  ctx.lineTo(x - width / 2 - 2, y + 6);
  ctx.lineTo(x - 1, y + 5);
  ctx.lineTo(x - 1, y);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + width / 2, y);
  ctx.lineTo(x + width / 2 + 2, y + 6);
  ctx.lineTo(x + 1, y + 5);
  ctx.lineTo(x + 1, y);
  ctx.fill();
}

/** Draw goat legs (front-facing view: 4 legs visible). */
function drawLegs(
  ctx: CanvasRenderingContext2D,
  cx: number,
  bodyBottom: number,
  legLength: number,
  bodyWidth: number,
  furColor: string,
  hoofColor: string,
) {
  const legWidth = 12;
  // Back legs (wider, slightly behind)
  const backLegSpread = bodyWidth * 0.4;
  ctx.fillStyle = darken(furColor, 20);
  // Back left
  ctx.fillRect(cx - backLegSpread - legWidth / 2, bodyBottom - 5, legWidth, legLength);
  drawHoof(ctx, cx - backLegSpread, bodyBottom - 5 + legLength, legWidth, hoofColor);
  // Back right
  ctx.fillRect(cx + backLegSpread - legWidth / 2, bodyBottom - 5, legWidth, legLength);
  drawHoof(ctx, cx + backLegSpread, bodyBottom - 5 + legLength, legWidth, hoofColor);

  // Front legs (narrower, slightly in front)
  const frontLegSpread = bodyWidth * 0.22;
  ctx.fillStyle = furColor;
  // Front left
  ctx.fillRect(cx - frontLegSpread - legWidth / 2, bodyBottom - 2, legWidth, legLength);
  drawHoof(ctx, cx - frontLegSpread, bodyBottom - 2 + legLength, legWidth, hoofColor);
  // Front right
  ctx.fillRect(cx + frontLegSpread - legWidth / 2, bodyBottom - 2, legWidth, legLength);
  drawHoof(ctx, cx + frontLegSpread, bodyBottom - 2 + legLength, legWidth, hoofColor);
}

/** Draw a goat beard (tuft under chin). */
function drawBeard(
  ctx: CanvasRenderingContext2D,
  cx: number,
  chinY: number,
  color: string,
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx - 4, chinY);
  ctx.lineTo(cx, chinY + 14);
  ctx.lineTo(cx + 4, chinY);
  ctx.fill();
  // Extra wispy bits
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 2, chinY + 2);
  ctx.lineTo(cx - 5, chinY + 12);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 2, chinY + 2);
  ctx.lineTo(cx + 5, chinY + 12);
  ctx.stroke();
}

/** Draw pointed goat ears. */
function drawEars(
  ctx: CanvasRenderingContext2D,
  cx: number,
  headTop: number,
  headWidth: number,
  color: string,
  innerColor: string,
) {
  const earLen = 18;
  // Left ear
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx - headWidth * 0.7, headTop + 12);
  ctx.lineTo(cx - headWidth * 0.7 - earLen, headTop + 5);
  ctx.lineTo(cx - headWidth * 0.5, headTop + 18);
  ctx.fill();
  ctx.fillStyle = innerColor;
  ctx.beginPath();
  ctx.moveTo(cx - headWidth * 0.65, headTop + 14);
  ctx.lineTo(cx - headWidth * 0.7 - earLen * 0.6, headTop + 9);
  ctx.lineTo(cx - headWidth * 0.55, headTop + 17);
  ctx.fill();
  // Right ear
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx + headWidth * 0.7, headTop + 12);
  ctx.lineTo(cx + headWidth * 0.7 + earLen, headTop + 5);
  ctx.lineTo(cx + headWidth * 0.5, headTop + 18);
  ctx.fill();
  ctx.fillStyle = innerColor;
  ctx.beginPath();
  ctx.moveTo(cx + headWidth * 0.65, headTop + 14);
  ctx.lineTo(cx + headWidth * 0.7 + earLen * 0.6, headTop + 9);
  ctx.lineTo(cx + headWidth * 0.55, headTop + 17);
  ctx.fill();
}

/** Draw the goat snout/muzzle (front-facing view). */
function drawSnout(
  ctx: CanvasRenderingContext2D,
  cx: number,
  muzzleTop: number,
  color: string,
  noseColor: string,
) {
  // Muzzle bump
  ctx.fillStyle = lighten(color, 15);
  ctx.beginPath();
  ctx.ellipse(cx, muzzleTop + 8, 14, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  // Nostrils
  ctx.fillStyle = noseColor;
  ctx.beginPath();
  ctx.ellipse(cx - 5, muzzleTop + 8, 3, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 5, muzzleTop + 8, 3, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
}

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------

function lighten(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  return `rgb(${Math.min(255, rgb.r + amount)}, ${Math.min(255, rgb.g + amount)}, ${Math.min(255, rgb.b + amount)})`;
}

function darken(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  return `rgb(${Math.max(0, rgb.r - amount)}, ${Math.max(0, rgb.g - amount)}, ${Math.max(0, rgb.b - amount)})`;
}

function hexToRgb(hex: string): {r: number; g: number; b: number} {
  const c = hex.replace('#', '');
  return {
    r: parseInt(c.substring(0, 2), 16),
    g: parseInt(c.substring(2, 4), 16),
    b: parseInt(c.substring(4, 6), 16),
  };
}

// ---------------------------------------------------------------------------
// Individual enemy type renderers (256x256 canvas)
// ---------------------------------------------------------------------------

const CX = SIZE / 2; // 128

/** Standard brown goat – the basic enemy. */
function drawGoat(ctx: CanvasRenderingContext2D) {
  const fur = '#6a5642';
  const furDark = '#4a3622';
  const hoofColor = '#2a1a0a';

  // --- Body (barrel-shaped torso, front-facing) ---
  const bodyTop = 95;
  const bodyBot = 158;
  const bodyW = 48;

  ctx.fillStyle = fur;
  ctx.beginPath();
  ctx.ellipse(CX, (bodyTop + bodyBot) / 2, bodyW, (bodyBot - bodyTop) / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  // Chest tuft
  ctx.fillStyle = lighten(fur, 20);
  ctx.beginPath();
  ctx.ellipse(CX, bodyTop + 15, 20, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // --- Legs ---
  drawLegs(ctx, CX, bodyBot, 52, bodyW, fur, hoofColor);

  // --- Neck ---
  ctx.fillStyle = fur;
  ctx.fillRect(CX - 14, 72, 28, 28);

  // --- Head ---
  const headCY = 58;
  const headW = 22;
  const headH = 24;
  ctx.fillStyle = fur;
  ctx.beginPath();
  ctx.ellipse(CX, headCY, headW, headH, 0, 0, Math.PI * 2);
  ctx.fill();

  // --- Ears ---
  drawEars(ctx, CX, headCY - headH, headW, fur, '#8a6a52');

  // --- Horns (curved backward) ---
  drawHorn(ctx, CX - 14, headCY - 18, CX - 32, headCY - 50, CX - 30, headCY - 28, 6, '#8a7a6a');
  drawHorn(ctx, CX + 14, headCY - 18, CX + 32, headCY - 50, CX + 30, headCY - 28, 6, '#8a7a6a');

  // --- Snout ---
  drawSnout(ctx, CX, headCY + 8, fur, furDark);

  // --- Eyes (glowing red – demonic) ---
  drawGoatEye(ctx, CX - 9, headCY - 4, 5, '#cc3300', '#ff0000', 6);
  drawGoatEye(ctx, CX + 9, headCY - 4, 5, '#cc3300', '#ff0000', 6);

  // --- Beard ---
  drawBeard(ctx, CX, headCY + 20, furDark);
}

/** Hell goat – darker red, larger horns, more aggressive stance. */
function drawHellGoat(ctx: CanvasRenderingContext2D) {
  const fur = '#7a2e24';
  const furDark = '#4a1a10';
  const hoofColor = '#1a0800';

  // Body (slightly larger)
  const bodyTop = 88;
  const bodyBot = 160;
  const bodyW = 52;

  ctx.fillStyle = fur;
  ctx.beginPath();
  ctx.ellipse(CX, (bodyTop + bodyBot) / 2, bodyW, (bodyBot - bodyTop) / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  // Dark underbelly
  ctx.fillStyle = furDark;
  ctx.beginPath();
  ctx.ellipse(CX, bodyBot - 15, bodyW * 0.7, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  drawLegs(ctx, CX, bodyBot, 50, bodyW, fur, hoofColor);

  // Neck (thicker)
  ctx.fillStyle = fur;
  ctx.fillRect(CX - 16, 68, 32, 26);

  // Head
  const headCY = 54;
  const headW = 24;
  const headH = 26;
  ctx.fillStyle = fur;
  ctx.beginPath();
  ctx.ellipse(CX, headCY, headW, headH, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ears
  drawEars(ctx, CX, headCY - headH, headW, fur, '#5a2020');

  // Large curved horns
  drawHorn(ctx, CX - 16, headCY - 20, CX - 42, headCY - 62, CX - 38, headCY - 30, 8, '#aa4422');
  drawHorn(ctx, CX + 16, headCY - 20, CX + 42, headCY - 62, CX + 38, headCY - 30, 8, '#aa4422');
  // Horn tips glow
  ctx.save();
  ctx.shadowColor = '#ff4400';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#ff6600';
  ctx.beginPath();
  ctx.arc(CX - 42, headCY - 62, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(CX + 42, headCY - 62, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Snout
  drawSnout(ctx, CX, headCY + 10, fur, '#1a0800');

  // Eyes (fiery orange-yellow)
  drawGoatEye(ctx, CX - 10, headCY - 4, 6, '#ff6600', '#ff4400', 10);
  drawGoatEye(ctx, CX + 10, headCY - 4, 6, '#ff6600', '#ff4400', 10);

  // Beard (longer, more scraggly)
  drawBeard(ctx, CX, headCY + 22, furDark);
  ctx.strokeStyle = furDark;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(CX, headCY + 22);
  ctx.lineTo(CX, headCY + 38);
  ctx.stroke();

  // Scars across face
  ctx.strokeStyle = '#aa3322';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(CX - 18, headCY - 10);
  ctx.lineTo(CX - 5, headCY + 5);
  ctx.stroke();
}

/** Fire goat – wreathed in flames, glowing orange body. */
function drawFireGoat(ctx: CanvasRenderingContext2D) {
  const fur = '#cc5500';
  const furDark = '#883300';
  const hoofColor = '#331100';

  // Flame aura behind the goat (draw first)
  ctx.save();
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2;
    const r = 70 + Math.random() * 20;
    const flameR = 8 + Math.random() * 12;
    const alpha = 0.15 + Math.random() * 0.2;
    ctx.fillStyle = `rgba(255, ${60 + Math.random() * 80}, 0, ${alpha})`;
    ctx.beginPath();
    ctx.arc(CX + Math.cos(angle) * r, 120 + Math.sin(angle) * r * 0.8, flameR, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Body
  const bodyTop = 92;
  const bodyBot = 155;
  const bodyW = 46;
  ctx.fillStyle = fur;
  ctx.beginPath();
  ctx.ellipse(CX, (bodyTop + bodyBot) / 2, bodyW, (bodyBot - bodyTop) / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  // Hot belly glow
  ctx.fillStyle = 'rgba(255, 150, 0, 0.3)';
  ctx.beginPath();
  ctx.ellipse(CX, (bodyTop + bodyBot) / 2 + 5, bodyW * 0.6, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  drawLegs(ctx, CX, bodyBot, 50, bodyW, fur, hoofColor);

  // Neck
  ctx.fillStyle = fur;
  ctx.fillRect(CX - 13, 72, 26, 25);

  // Head
  const headCY = 58;
  ctx.fillStyle = fur;
  ctx.beginPath();
  ctx.ellipse(CX, headCY, 21, 23, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ears
  drawEars(ctx, CX, headCY - 23, 21, fur, '#ff8800');

  // Horns (on fire)
  ctx.save();
  ctx.shadowColor = '#ff4400';
  ctx.shadowBlur = 12;
  drawHorn(ctx, CX - 14, headCY - 18, CX - 30, headCY - 52, CX - 28, headCY - 28, 6, '#ff8800');
  drawHorn(ctx, CX + 14, headCY - 18, CX + 30, headCY - 52, CX + 28, headCY - 28, 6, '#ff8800');
  ctx.restore();

  // Snout
  drawSnout(ctx, CX, headCY + 8, fur, furDark);

  // Eyes (pure white-hot)
  drawGoatEye(ctx, CX - 9, headCY - 4, 5, '#ffffff', '#ffaa00', 12);
  drawGoatEye(ctx, CX + 9, headCY - 4, 5, '#ffffff', '#ffaa00', 12);

  // Beard (on fire)
  ctx.save();
  ctx.shadowColor = '#ff6600';
  ctx.shadowBlur = 8;
  drawBeard(ctx, CX, headCY + 20, '#ff8800');
  ctx.restore();

  // Rising flame wisps from body
  ctx.save();
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 6; i++) {
    const fx = CX + (Math.random() - 0.5) * 60;
    const fy = bodyTop - 10 - Math.random() * 30;
    ctx.fillStyle = `rgba(255, ${100 + Math.random() * 100}, 0, 0.4)`;
    ctx.beginPath();
    ctx.ellipse(fx, fy, 4 + Math.random() * 4, 8 + Math.random() * 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Shadow goat – ethereal, semi-transparent, purple wisps. */
function drawShadowGoat(ctx: CanvasRenderingContext2D) {
  const fur = 'rgba(30, 12, 45, 0.8)';
  const hoofColor = 'rgba(10, 0, 20, 0.6)';

  // Ethereal shadow wisps (background)
  ctx.save();
  for (let i = 0; i < 10; i++) {
    const wx = CX + (Math.random() - 0.5) * 80;
    const wy = 80 + Math.random() * 120;
    ctx.strokeStyle = `rgba(80, 20, 120, ${0.1 + Math.random() * 0.15})`;
    ctx.lineWidth = 2 + Math.random() * 3;
    ctx.beginPath();
    ctx.moveTo(wx, wy);
    ctx.quadraticCurveTo(
      wx + (Math.random() - 0.5) * 40,
      wy + 20 + Math.random() * 20,
      wx + (Math.random() - 0.5) * 30,
      wy + 40 + Math.random() * 20,
    );
    ctx.stroke();
  }
  ctx.restore();

  // Body (semi-transparent)
  const bodyTop = 92;
  const bodyBot = 156;
  const bodyW = 44;
  ctx.fillStyle = fur;
  ctx.beginPath();
  ctx.ellipse(CX, (bodyTop + bodyBot) / 2, bodyW, (bodyBot - bodyTop) / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs (ghostly)
  const legWidth = 10;
  const legLen = 48;
  ctx.fillStyle = 'rgba(25, 10, 40, 0.6)';
  for (const xOff of [-18, -6, 6, 18]) {
    ctx.fillRect(CX + xOff - legWidth / 2, bodyBot - 3, legWidth, legLen);
    // Hooves dissolve into wisps instead of solid
    ctx.strokeStyle = 'rgba(80, 20, 120, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(CX + xOff - 3, bodyBot + legLen);
    ctx.lineTo(CX + xOff - 6, bodyBot + legLen + 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(CX + xOff + 3, bodyBot + legLen);
    ctx.lineTo(CX + xOff + 6, bodyBot + legLen + 10);
    ctx.stroke();
  }

  // Neck
  ctx.fillStyle = fur;
  ctx.fillRect(CX - 12, 72, 24, 25);

  // Head
  const headCY = 58;
  ctx.fillStyle = fur;
  ctx.beginPath();
  ctx.ellipse(CX, headCY, 20, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ears (pointed, more bat-like)
  ctx.fillStyle = 'rgba(40, 15, 60, 0.7)';
  ctx.beginPath();
  ctx.moveTo(CX - 18, headCY - 8);
  ctx.lineTo(CX - 34, headCY - 30);
  ctx.lineTo(CX - 10, headCY - 5);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(CX + 18, headCY - 8);
  ctx.lineTo(CX + 34, headCY - 30);
  ctx.lineTo(CX + 10, headCY - 5);
  ctx.fill();

  // Horns (ethereal, translucent)
  ctx.save();
  ctx.globalAlpha = 0.6;
  drawHorn(ctx, CX - 12, headCY - 16, CX - 28, headCY - 48, CX - 26, headCY - 26, 5, '#6622aa');
  drawHorn(ctx, CX + 12, headCY - 16, CX + 28, headCY - 48, CX + 26, headCY - 26, 5, '#6622aa');
  ctx.restore();

  // Snout (faint)
  ctx.fillStyle = 'rgba(40, 20, 55, 0.6)';
  ctx.beginPath();
  ctx.ellipse(CX, headCY + 14, 12, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(10, 0, 20, 0.5)';
  ctx.beginPath();
  ctx.ellipse(CX - 4, headCY + 14, 2.5, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(CX + 4, headCY + 14, 2.5, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eyes (piercing purple glow — the most visible feature)
  ctx.save();
  ctx.shadowColor = '#8800ff';
  ctx.shadowBlur = 20;
  ctx.fillStyle = '#bb66ff';
  ctx.beginPath();
  ctx.ellipse(CX - 8, headCY - 2, 5, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000000';
  ctx.fillRect(CX - 12, headCY - 3, 8, 2);
  ctx.beginPath();
  ctx.ellipse(CX + 8, headCY - 2, 5, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#bb66ff';
  ctx.beginPath();
  ctx.ellipse(CX + 8, headCY - 2, 5, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000000';
  ctx.fillRect(CX + 4, headCY - 3, 8, 2);
  ctx.restore();

  // Beard (wispy, fading)
  ctx.strokeStyle = 'rgba(60, 20, 80, 0.4)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(CX + (i - 1.5) * 3, headCY + 22);
    ctx.lineTo(CX + (i - 1.5) * 5, headCY + 35 + Math.random() * 5);
    ctx.stroke();
  }
}

/** Goat Knight – armored goat with plate mail, helmet visor. */
function drawGoatKnight(ctx: CanvasRenderingContext2D) {
  const armor = '#667788';
  const armorDark = '#445566';
  const armorLight = '#8899aa';
  const hoofColor = '#334455';

  // Body — armored plate shape (more rectangular than organic)
  const bodyTop = 85;
  const bodyBot = 160;
  const bodyW = 52;

  // Back plate
  ctx.fillStyle = armorDark;
  ctx.beginPath();
  ctx.moveTo(CX - bodyW, bodyTop + 5);
  ctx.lineTo(CX - bodyW - 4, bodyBot);
  ctx.lineTo(CX + bodyW + 4, bodyBot);
  ctx.lineTo(CX + bodyW, bodyTop + 5);
  ctx.closePath();
  ctx.fill();

  // Front breastplate
  ctx.fillStyle = armor;
  ctx.beginPath();
  ctx.moveTo(CX - bodyW + 5, bodyTop);
  ctx.lineTo(CX - bodyW + 2, bodyBot - 5);
  ctx.lineTo(CX + bodyW - 2, bodyBot - 5);
  ctx.lineTo(CX + bodyW - 5, bodyTop);
  ctx.closePath();
  ctx.fill();

  // Plate detail: center seam
  ctx.strokeStyle = armorLight;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(CX, bodyTop + 5);
  ctx.lineTo(CX, bodyBot - 8);
  ctx.stroke();

  // Shoulder pauldrons
  ctx.fillStyle = armorDark;
  ctx.beginPath();
  ctx.ellipse(CX - bodyW - 5, bodyTop + 12, 16, 10, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(CX + bodyW + 5, bodyTop + 12, 16, 10, 0.3, 0, Math.PI * 2);
  ctx.fill();
  // Rivets
  ctx.fillStyle = armorLight;
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(CX + sx * (bodyW + 5), bodyTop + 8, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(CX + sx * (bodyW + 5), bodyTop + 16, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Armored legs (greaves)
  const legWidth = 14;
  const legLen = 48;
  for (const xOff of [-22, -8, 8, 22]) {
    ctx.fillStyle = xOff === -22 || xOff === 22 ? armorDark : armor;
    ctx.fillRect(CX + xOff - legWidth / 2, bodyBot - 3, legWidth, legLen);
    // Knee plate
    ctx.fillStyle = armorLight;
    ctx.beginPath();
    ctx.ellipse(CX + xOff, bodyBot + 18, legWidth / 2 + 1, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    drawHoof(ctx, CX + xOff, bodyBot - 3 + legLen, legWidth, hoofColor);
  }

  // Neck guard
  ctx.fillStyle = armorDark;
  ctx.fillRect(CX - 16, 65, 32, 24);

  // Helmet
  const headCY = 50;
  const headW = 24;
  ctx.fillStyle = armor;
  ctx.beginPath();
  ctx.ellipse(CX, headCY, headW, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  // Helmet crest
  ctx.fillStyle = armorDark;
  ctx.beginPath();
  ctx.moveTo(CX - 3, headCY - 26);
  ctx.lineTo(CX, headCY - 32);
  ctx.lineTo(CX + 3, headCY - 26);
  ctx.fill();

  // Visor slit (glowing red eyes behind)
  ctx.save();
  ctx.shadowColor = '#ff0000';
  ctx.shadowBlur = 8;
  ctx.fillStyle = '#ff2200';
  ctx.fillRect(CX - 16, headCY - 4, 32, 5);
  // Two brighter eye points within the slit
  ctx.fillStyle = '#ff6644';
  ctx.beginPath();
  ctx.arc(CX - 8, headCY - 1, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(CX + 8, headCY - 1, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Snout guard (ventilated)
  ctx.fillStyle = armorDark;
  ctx.beginPath();
  ctx.ellipse(CX, headCY + 12, 14, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  // Ventilation slits
  ctx.strokeStyle = '#222222';
  ctx.lineWidth = 1;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(CX + i * 4, headCY + 6);
    ctx.lineTo(CX + i * 4, headCY + 16);
    ctx.stroke();
  }

  // Horns punching through helmet
  drawHorn(ctx, CX - 18, headCY - 18, CX - 36, headCY - 55, CX - 34, headCY - 30, 7, '#888888');
  drawHorn(ctx, CX + 18, headCY - 18, CX + 36, headCY - 55, CX + 34, headCY - 30, 7, '#888888');
}

/** Arch Goat – massive demonic boss with crown, arcane markings, third eye. */
function drawArchGoat(ctx: CanvasRenderingContext2D) {
  const fur = '#5a1420';
  const furDark = '#3a0a10';
  const hoofColor = '#1a0008';

  // Arcane circle behind the goat (background aura)
  ctx.save();
  ctx.strokeStyle = '#ff00aa';
  ctx.shadowColor = '#ff00ff';
  ctx.shadowBlur = 15;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(CX, 115, 90, 0, Math.PI * 2);
  ctx.stroke();
  // Pentagram points
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const px = CX + Math.cos(a) * 90;
    const py = 115 + Math.sin(a) * 90;
    ctx.fillStyle = '#ff00aa';
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Massive body
  const bodyTop = 80;
  const bodyBot = 165;
  const bodyW = 58;
  ctx.fillStyle = fur;
  ctx.beginPath();
  ctx.ellipse(CX, (bodyTop + bodyBot) / 2, bodyW, (bodyBot - bodyTop) / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  // Arcane markings on body
  ctx.save();
  ctx.strokeStyle = '#ff0066';
  ctx.shadowColor = '#ff0088';
  ctx.shadowBlur = 6;
  ctx.lineWidth = 1.5;
  // Inverted triangle
  ctx.beginPath();
  ctx.moveTo(CX, bodyTop + 10);
  ctx.lineTo(CX - 25, bodyBot - 30);
  ctx.lineTo(CX + 25, bodyBot - 30);
  ctx.closePath();
  ctx.stroke();
  // Circle in triangle
  ctx.beginPath();
  ctx.arc(CX, (bodyTop + bodyBot) / 2, 16, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Muscular legs (thicker)
  const legWidth = 16;
  const legLen = 46;
  for (const xOff of [-24, -8, 8, 24]) {
    ctx.fillStyle = xOff === -24 || xOff === 24 ? furDark : fur;
    ctx.fillRect(CX + xOff - legWidth / 2, bodyBot - 3, legWidth, legLen);
    drawHoof(ctx, CX + xOff, bodyBot - 3 + legLen, legWidth + 2, hoofColor);
  }

  // Thick neck
  ctx.fillStyle = fur;
  ctx.fillRect(CX - 18, 58, 36, 28);

  // Head (larger)
  const headCY = 44;
  const headW = 28;
  const headH = 30;
  ctx.fillStyle = fur;
  ctx.beginPath();
  ctx.ellipse(CX, headCY, headW, headH, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ears (large, pointed)
  drawEars(ctx, CX, headCY - headH, headW, fur, '#7a2030');

  // Massive crown horns (golden)
  ctx.save();
  ctx.shadowColor = '#ffcc00';
  ctx.shadowBlur = 10;
  drawHorn(ctx, CX - 20, headCY - 22, CX - 52, headCY - 72, CX - 48, headCY - 36, 9, '#ccaa00');
  drawHorn(ctx, CX + 20, headCY - 22, CX + 52, headCY - 72, CX + 48, headCY - 36, 9, '#ccaa00');
  // Secondary horn branches
  drawHorn(ctx, CX - 35, headCY - 50, CX - 50, headCY - 80, CX - 48, headCY - 60, 5, '#ddbb00');
  drawHorn(ctx, CX + 35, headCY - 50, CX + 50, headCY - 80, CX + 48, headCY - 60, 5, '#ddbb00');
  ctx.restore();

  // Snout
  drawSnout(ctx, CX, headCY + 12, fur, furDark);

  // TWO regular eyes + THIRD eye
  drawGoatEye(ctx, CX - 12, headCY - 2, 6, '#ff0000', '#ff0000', 12);
  drawGoatEye(ctx, CX + 12, headCY - 2, 6, '#ff0000', '#ff0000', 12);
  // Third eye (forehead)
  ctx.save();
  ctx.shadowColor = '#ff00ff';
  ctx.shadowBlur = 15;
  ctx.fillStyle = '#ff00cc';
  ctx.beginPath();
  ctx.ellipse(CX, headCY - 16, 5, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000000';
  ctx.fillRect(CX - 4, headCY - 17, 8, 2);
  ctx.restore();

  // Beard (long, forked)
  drawBeard(ctx, CX, headCY + 24, furDark);
  ctx.strokeStyle = furDark;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(CX - 2, headCY + 30);
  ctx.lineTo(CX - 8, headCY + 48);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(CX + 2, headCY + 30);
  ctx.lineTo(CX + 8, headCY + 48);
  ctx.stroke();
}
