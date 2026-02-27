import {
  Color3,
  DynamicTexture,
  PBRMetallicRoughnessMaterial,
  Scene,
} from '@babylonjs/core';
import {COLORS} from '../../constants';

export type WallType = 'stone' | 'flesh' | 'lava' | 'obsidian' | 'door';

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

/** Seeded pseudo-random for reproducible textures */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Parse a hex color string into [r, g, b] 0-255 */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

/** Produce a color string with per-channel variation */
function varyColor(
  baseR: number,
  baseG: number,
  baseB: number,
  variance: number,
  rng: () => number,
): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const r = clamp(baseR + (rng() - 0.5) * 2 * variance);
  const g = clamp(baseG + (rng() - 0.5) * 2 * variance);
  const b = clamp(baseB + (rng() - 0.5) * 2 * variance);
  return `rgb(${r},${g},${b})`;
}

// ---------------------------------------------------------------------------
// 1. STONE WALL TEXTURE
// ---------------------------------------------------------------------------

function generateStoneBaseTexture(
  name: string,
  scene: Scene,
  size: number,
): DynamicTexture {
  const tex = new DynamicTexture(name, size, scene, false);
  const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
  const rng = seededRandom(42);

  const [bgR, bgG, bgB] = hexToRgb(COLORS.wallStone);

  // Fill background (mortar color - darker than stones)
  const mortarR = Math.max(0, bgR - 30);
  const mortarG = Math.max(0, bgG - 30);
  const mortarB = Math.max(0, bgB - 30);
  ctx.fillStyle = `rgb(${mortarR},${mortarG},${mortarB})`;
  ctx.fillRect(0, 0, size, size);

  // Draw stone blocks in a semi-regular grid with variation
  const rows = 8;
  const rowHeight = size / rows;

  for (let row = 0; row < rows; row++) {
    const y = row * rowHeight;
    const offset = row % 2 === 0 ? 0 : rowHeight * 0.8; // stagger every other row
    const cols = 3 + Math.floor(rng() * 3); // 3-5 stones per row
    const colWidth = size / cols;

    for (let col = 0; col < cols; col++) {
      const x = col * colWidth + offset * (rng() - 0.5);
      const w = colWidth - 4 + (rng() - 0.5) * 8;
      const h = rowHeight - 4 + (rng() - 0.5) * 4;

      // Stone base color with per-block variation
      const blockColor = varyColor(bgR, bgG, bgB, 25, rng);
      ctx.fillStyle = blockColor;

      // Rounded rectangle for stone blocks
      const rx = x + 2;
      const ry = y + 2;
      const rw = Math.max(4, w - 2);
      const rh = Math.max(4, h - 2);
      const radius = 3 + rng() * 4;

      ctx.beginPath();
      ctx.moveTo(rx + radius, ry);
      ctx.lineTo(rx + rw - radius, ry);
      ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + radius);
      ctx.lineTo(rx + rw, ry + rh - radius);
      ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - radius, ry + rh);
      ctx.lineTo(rx + radius, ry + rh);
      ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - radius);
      ctx.lineTo(rx, ry + radius);
      ctx.quadraticCurveTo(rx, ry, rx + radius, ry);
      ctx.closePath();
      ctx.fill();

      // Surface details - subtle scratches and pits
      for (let d = 0; d < 5; d++) {
        const dx = rx + rng() * rw;
        const dy = ry + rng() * rh;
        ctx.fillStyle = varyColor(
          bgR - 15,
          bgG - 15,
          bgB - 15,
          10,
          rng,
        );
        ctx.beginPath();
        ctx.arc(dx, dy, 1 + rng() * 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Subtle highlight on top edge
      const highlightColor = varyColor(bgR + 20, bgG + 15, bgB + 10, 8, rng);
      ctx.strokeStyle = highlightColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(rx + radius, ry + 1);
      ctx.lineTo(rx + rw - radius, ry + 1);
      ctx.stroke();

      // Shadow on bottom edge
      ctx.strokeStyle = `rgb(${Math.max(0, bgR - 40)},${Math.max(0, bgG - 40)},${Math.max(0, bgB - 40)})`;
      ctx.beginPath();
      ctx.moveTo(rx + radius, ry + rh - 1);
      ctx.lineTo(rx + rw - radius, ry + rh - 1);
      ctx.stroke();
    }
  }

  // Blood stains scattered
  for (let i = 0; i < 6; i++) {
    const sx = rng() * size;
    const sy = rng() * size;
    const sr = 8 + rng() * 25;
    const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
    grad.addColorStop(0, 'rgba(80,5,5,0.4)');
    grad.addColorStop(0.6, 'rgba(50,0,0,0.2)');
    grad.addColorStop(1, 'rgba(30,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
  }

  tex.hasAlpha = false;
  tex.update();
  return tex;
}

function generateStoneNormalTexture(
  name: string,
  scene: Scene,
  size: number,
): DynamicTexture {
  const tex = new DynamicTexture(name, size, scene, false);
  const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
  const rng = seededRandom(42); // same seed as base for alignment

  // Neutral normal map base (128,128,255) = flat surface pointing up
  ctx.fillStyle = 'rgb(128,128,255)';
  ctx.fillRect(0, 0, size, size);

  // Mortar crevices - draw dark indentations at mortar lines
  const rows = 8;
  const rowHeight = size / rows;

  for (let row = 0; row <= rows; row++) {
    const y = row * rowHeight;
    // Horizontal mortar lines
    ctx.fillStyle = 'rgb(128,100,200)'; // inward-facing normal
    ctx.fillRect(0, y - 2, size, 4);
  }

  for (let row = 0; row < rows; row++) {
    const y = row * rowHeight;
    const offset = row % 2 === 0 ? 0 : rowHeight * 0.8;
    const cols = 3 + Math.floor(rng() * 3);
    const colWidth = size / cols;

    for (let col = 0; col <= cols; col++) {
      const x = col * colWidth + offset * (rng() - 0.5);
      // Vertical mortar lines
      ctx.fillStyle = 'rgb(128,100,200)';
      ctx.fillRect(x - 2, y, 4, rowHeight);
    }

    // Surface bumps within each stone
    for (let col = 0; col < cols; col++) {
      const bx = col * colWidth + offset * (rng() - 0.5);
      for (let b = 0; b < 8; b++) {
        const px = bx + rng() * colWidth;
        const py = y + rng() * rowHeight;
        const br = 3 + rng() * 8;
        const grad = ctx.createRadialGradient(px, py, 0, px, py, br);
        // Slight bump - offset normals
        const nx = 128 + (rng() - 0.5) * 30;
        const ny = 128 + (rng() - 0.5) * 30;
        grad.addColorStop(0, `rgb(${Math.round(nx)},${Math.round(ny)},240)`);
        grad.addColorStop(1, 'rgb(128,128,255)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, br, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  tex.hasAlpha = false;
  tex.update();
  return tex;
}

function generateStoneRoughnessTexture(
  name: string,
  scene: Scene,
  size: number,
): DynamicTexture {
  const tex = new DynamicTexture(name, size, scene, false);
  const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
  const rng = seededRandom(77);

  // Roughness in G channel, metallic in B channel for metallicRoughnessTexture
  // R=0, G=roughness, B=metallic
  // Base: high roughness, low metallic
  ctx.fillStyle = 'rgb(0,220,25)'; // roughness ~0.86, metallic ~0.1
  ctx.fillRect(0, 0, size, size);

  // Vary roughness per area
  for (let i = 0; i < 40; i++) {
    const x = rng() * size;
    const y = rng() * size;
    const r = 10 + rng() * 30;
    const roughness = 180 + Math.floor(rng() * 60); // 0.7 - 0.95
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, `rgb(0,${roughness},25)`);
    grad.addColorStop(1, 'rgb(0,220,25)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  tex.hasAlpha = false;
  tex.update();
  return tex;
}

// ---------------------------------------------------------------------------
// 2. FLESH WALL TEXTURE
// ---------------------------------------------------------------------------

function generateFleshBaseTexture(
  name: string,
  scene: Scene,
  size: number,
): DynamicTexture {
  const tex = new DynamicTexture(name, size, scene, false);
  const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
  const rng = seededRandom(666);

  const [bgR, bgG, bgB] = hexToRgb(COLORS.wallFlesh);

  // Base: dark red organic background
  ctx.fillStyle = `rgb(${bgR},${bgG},${bgB})`;
  ctx.fillRect(0, 0, size, size);

  // Layered organic noise
  for (let layer = 0; layer < 3; layer++) {
    for (let i = 0; i < 80; i++) {
      const x = rng() * size;
      const y = rng() * size;
      const r = 5 + rng() * 40;
      const opacity = 0.15 + rng() * 0.2;
      const cR = bgR + (rng() - 0.3) * 50;
      const cG = bgG + (rng() - 0.6) * 30;
      const cB = bgB + (rng() - 0.6) * 20;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(
        0,
        `rgba(${Math.round(Math.max(0, Math.min(255, cR)))},${Math.round(Math.max(0, Math.min(255, cG)))},${Math.round(Math.max(0, Math.min(255, cB)))},${opacity})`,
      );
      grad.addColorStop(1, `rgba(${bgR},${bgG},${bgB},0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  }

  // Draw branching veins
  const drawVein = (
    startX: number,
    startY: number,
    angle: number,
    length: number,
    width: number,
    depth: number,
  ) => {
    if (depth <= 0 || width < 0.3) return;

    ctx.strokeStyle = `rgba(${140 + Math.floor(rng() * 60)},${10 + Math.floor(rng() * 20)},${20 + Math.floor(rng() * 30)},${0.5 + rng() * 0.3})`;
    ctx.lineWidth = width;
    (ctx as any).lineCap = 'round';

    let cx = startX;
    let cy = startY;
    const segments = Math.floor(length / 8);

    ctx.beginPath();
    ctx.moveTo(cx, cy);

    for (let s = 0; s < segments; s++) {
      const wobble = (rng() - 0.5) * 0.4;
      const a = angle + wobble;
      cx += Math.cos(a) * 8;
      cy += Math.sin(a) * 8;
      ctx.lineTo(cx, cy);

      // Branch chance
      if (rng() < 0.25 && depth > 1) {
        const branchAngle = angle + (rng() - 0.5) * 1.5;
        drawVein(
          cx,
          cy,
          branchAngle,
          length * (0.3 + rng() * 0.3),
          width * 0.5,
          depth - 1,
        );
      }
    }
    ctx.stroke();
  };

  // Major veins
  for (let v = 0; v < 12; v++) {
    const startEdge = Math.floor(rng() * 4);
    let sx: number, sy: number, angle: number;
    switch (startEdge) {
      case 0:
        sx = rng() * size;
        sy = 0;
        angle = Math.PI / 2 + (rng() - 0.5) * 0.8;
        break;
      case 1:
        sx = size;
        sy = rng() * size;
        angle = Math.PI + (rng() - 0.5) * 0.8;
        break;
      case 2:
        sx = rng() * size;
        sy = size;
        angle = -Math.PI / 2 + (rng() - 0.5) * 0.8;
        break;
      default:
        sx = 0;
        sy = rng() * size;
        angle = (rng() - 0.5) * 0.8;
        break;
    }
    drawVein(sx, sy, angle, 100 + rng() * 200, 2 + rng() * 3, 4);
  }

  // Wet/glistening spots
  for (let i = 0; i < 15; i++) {
    const x = rng() * size;
    const y = rng() * size;
    const r = 3 + rng() * 12;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, 'rgba(180,50,60,0.3)');
    grad.addColorStop(0.5, 'rgba(120,20,30,0.15)');
    grad.addColorStop(1, 'rgba(80,10,15,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  tex.hasAlpha = false;
  tex.update();
  return tex;
}

function generateFleshNormalTexture(
  name: string,
  scene: Scene,
  size: number,
): DynamicTexture {
  const tex = new DynamicTexture(name, size, scene, false);
  const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
  const rng = seededRandom(666);

  ctx.fillStyle = 'rgb(128,128,255)';
  ctx.fillRect(0, 0, size, size);

  // Organic undulations
  for (let i = 0; i < 60; i++) {
    const x = rng() * size;
    const y = rng() * size;
    const r = 10 + rng() * 40;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    const nx = 110 + Math.floor(rng() * 36);
    const ny = 110 + Math.floor(rng() * 36);
    grad.addColorStop(0, `rgb(${nx},${ny},230)`);
    grad.addColorStop(1, 'rgb(128,128,255)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Vein ridges
  for (let v = 0; v < 20; v++) {
    let cx = rng() * size;
    let cy = rng() * size;
    const angle = rng() * Math.PI * 2;
    ctx.strokeStyle = 'rgb(140,140,220)';
    ctx.lineWidth = 2 + rng() * 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    for (let s = 0; s < 10; s++) {
      cx += Math.cos(angle + (rng() - 0.5) * 0.5) * 12;
      cy += Math.sin(angle + (rng() - 0.5) * 0.5) * 12;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }

  tex.hasAlpha = false;
  tex.update();
  return tex;
}

function generateFleshEmissiveTexture(
  name: string,
  scene: Scene,
  size: number,
): DynamicTexture {
  const tex = new DynamicTexture(name, size, scene, false);
  const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
  const rng = seededRandom(667);

  // Mostly dark with pulsing hotspots where veins converge
  ctx.fillStyle = 'rgb(15,2,2)';
  ctx.fillRect(0, 0, size, size);

  // Emissive vein glow
  for (let i = 0; i < 25; i++) {
    const x = rng() * size;
    const y = rng() * size;
    const r = 8 + rng() * 30;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, `rgb(${60 + Math.floor(rng() * 40)},${Math.floor(rng() * 12)},${Math.floor(rng() * 12)})`);
    grad.addColorStop(0.6, 'rgb(30,3,3)');
    grad.addColorStop(1, 'rgb(15,2,2)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  tex.hasAlpha = false;
  tex.update();
  return tex;
}

function generateFleshRoughnessTexture(
  name: string,
  scene: Scene,
  size: number,
): DynamicTexture {
  const tex = new DynamicTexture(name, size, scene, false);
  const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
  const rng = seededRandom(668);

  // Medium roughness with wet (smooth) patches
  // G = roughness, B = metallic
  ctx.fillStyle = 'rgb(0,150,12)'; // roughness ~0.59, metallic ~0.05
  ctx.fillRect(0, 0, size, size);

  // Wet spots (lower roughness)
  for (let i = 0; i < 30; i++) {
    const x = rng() * size;
    const y = rng() * size;
    const r = 5 + rng() * 25;
    const roughness = 60 + Math.floor(rng() * 60); // 0.23-0.47 = shiny/wet
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, `rgb(0,${roughness},15)`);
    grad.addColorStop(1, 'rgb(0,150,12)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  tex.hasAlpha = false;
  tex.update();
  return tex;
}

// ---------------------------------------------------------------------------
// 3. LAVA WALL TEXTURE
// ---------------------------------------------------------------------------

function generateLavaBaseTexture(
  name: string,
  scene: Scene,
  size: number,
): DynamicTexture {
  const tex = new DynamicTexture(name, size, scene, false);
  const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
  const rng = seededRandom(1337);

  // Dark basalt background
  ctx.fillStyle = 'rgb(20,12,8)';
  ctx.fillRect(0, 0, size, size);

  // Rocky basalt texture
  for (let i = 0; i < 120; i++) {
    const x = rng() * size;
    const y = rng() * size;
    const r = 3 + rng() * 15;
    const val = 15 + Math.floor(rng() * 20);
    ctx.fillStyle = `rgb(${val},${Math.floor(val * 0.6)},${Math.floor(val * 0.4)})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Lava crack network
  const drawCrack = (
    sx: number,
    sy: number,
    angle: number,
    len: number,
    width: number,
    depth: number,
  ) => {
    if (depth <= 0 || width < 0.5) return;

    let cx = sx;
    let cy = sy;
    const segments = Math.floor(len / 6);

    // Outer glow
    ctx.strokeStyle = `rgba(200,80,10,${0.15 + rng() * 0.1})`;
    ctx.lineWidth = width + 6;
    (ctx as any).lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    const points: Array<[number, number]> = [[cx, cy]];
    let a = angle;
    for (let s = 0; s < segments; s++) {
      a += (rng() - 0.5) * 0.7;
      cx += Math.cos(a) * 6;
      cy += Math.sin(a) * 6;
      ctx.lineTo(cx, cy);
      points.push([cx, cy]);
    }
    ctx.stroke();

    // Hot core
    ctx.strokeStyle = `rgba(255,${140 + Math.floor(rng() * 80)},${20 + Math.floor(rng() * 40)},${0.7 + rng() * 0.3})`;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let p = 1; p < points.length; p++) {
      ctx.lineTo(points[p][0], points[p][1]);
    }
    ctx.stroke();

    // Bright center
    ctx.strokeStyle = `rgba(255,${220 + Math.floor(rng() * 35)},${80 + Math.floor(rng() * 80)},${0.5 + rng() * 0.3})`;
    ctx.lineWidth = Math.max(0.5, width * 0.4);
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let p = 1; p < points.length; p++) {
      ctx.lineTo(points[p][0], points[p][1]);
    }
    ctx.stroke();

    // Branches
    for (let p = 0; p < points.length; p++) {
      if (rng() < 0.3 && depth > 1) {
        drawCrack(
          points[p][0],
          points[p][1],
          a + (rng() - 0.5) * 2,
          len * (0.3 + rng() * 0.3),
          width * 0.5,
          depth - 1,
        );
      }
    }
  };

  // Generate cracks from random points
  for (let i = 0; i < 8; i++) {
    const sx = rng() * size;
    const sy = rng() * size;
    const angle = rng() * Math.PI * 2;
    drawCrack(sx, sy, angle, 80 + rng() * 150, 2 + rng() * 2.5, 4);
  }

  // Hot pools
  for (let i = 0; i < 5; i++) {
    const x = rng() * size;
    const y = rng() * size;
    const r = 5 + rng() * 15;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, 'rgba(255,200,50,0.6)');
    grad.addColorStop(0.3, 'rgba(255,120,20,0.4)');
    grad.addColorStop(0.7, 'rgba(180,40,5,0.2)');
    grad.addColorStop(1, 'rgba(20,12,8,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  tex.hasAlpha = false;
  tex.update();
  return tex;
}

function generateLavaEmissiveTexture(
  name: string,
  scene: Scene,
  size: number,
): DynamicTexture {
  const tex = new DynamicTexture(name, size, scene, false);
  const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
  const rng = seededRandom(1337);

  // Dark base
  ctx.fillStyle = 'rgb(5,2,0)';
  ctx.fillRect(0, 0, size, size);

  // Re-draw the same crack network but as pure emissive light
  // (same seed means same positions)
  const drawEmissiveCrack = (
    sx: number,
    sy: number,
    angle: number,
    len: number,
    width: number,
    depth: number,
  ) => {
    if (depth <= 0 || width < 0.5) return;

    let cx = sx;
    let cy = sy;
    const segments = Math.floor(len / 6);

    // Wide glow
    ctx.strokeStyle = `rgba(200,60,5,${0.3 + rng() * 0.2})`;
    ctx.lineWidth = width + 10;
    (ctx as any).lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    const points: Array<[number, number]> = [[cx, cy]];
    let a = angle;
    for (let s = 0; s < segments; s++) {
      a += (rng() - 0.5) * 0.7;
      cx += Math.cos(a) * 6;
      cy += Math.sin(a) * 6;
      ctx.lineTo(cx, cy);
      points.push([cx, cy]);
    }
    ctx.stroke();

    // Bright emissive core
    ctx.strokeStyle = `rgba(255,${160 + Math.floor(rng() * 60)},${30 + Math.floor(rng() * 40)},0.9)`;
    ctx.lineWidth = width + 2;
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let p = 1; p < points.length; p++) {
      ctx.lineTo(points[p][0], points[p][1]);
    }
    ctx.stroke();

    // White-hot center
    ctx.strokeStyle = `rgba(255,${240 + Math.floor(rng() * 15)},${150 + Math.floor(rng() * 60)},0.7)`;
    ctx.lineWidth = Math.max(0.5, width * 0.5);
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let p = 1; p < points.length; p++) {
      ctx.lineTo(points[p][0], points[p][1]);
    }
    ctx.stroke();

    for (let p = 0; p < points.length; p++) {
      if (rng() < 0.3 && depth > 1) {
        drawEmissiveCrack(
          points[p][0],
          points[p][1],
          a + (rng() - 0.5) * 2,
          len * (0.3 + rng() * 0.3),
          width * 0.5,
          depth - 1,
        );
      }
    }
  };

  for (let i = 0; i < 8; i++) {
    const sx = rng() * size;
    const sy = rng() * size;
    const angle = rng() * Math.PI * 2;
    drawEmissiveCrack(sx, sy, angle, 80 + rng() * 150, 2 + rng() * 2.5, 4);
  }

  // Hot spot pools
  for (let i = 0; i < 5; i++) {
    const x = rng() * size;
    const y = rng() * size;
    const r = 5 + rng() * 15;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, 'rgb(255,220,100)');
    grad.addColorStop(0.4, 'rgb(255,130,20)');
    grad.addColorStop(1, 'rgb(5,2,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  tex.hasAlpha = false;
  tex.update();
  return tex;
}

function generateLavaNormalTexture(
  name: string,
  scene: Scene,
  size: number,
): DynamicTexture {
  const tex = new DynamicTexture(name, size, scene, false);
  const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
  const rng = seededRandom(1338);

  ctx.fillStyle = 'rgb(128,128,255)';
  ctx.fillRect(0, 0, size, size);

  // Rocky surface bumps
  for (let i = 0; i < 100; i++) {
    const x = rng() * size;
    const y = rng() * size;
    const r = 3 + rng() * 15;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    const nx = 100 + Math.floor(rng() * 56);
    const ny = 100 + Math.floor(rng() * 56);
    grad.addColorStop(0, `rgb(${nx},${ny},220)`);
    grad.addColorStop(1, 'rgb(128,128,255)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  tex.hasAlpha = false;
  tex.update();
  return tex;
}

// ---------------------------------------------------------------------------
// 4. OBSIDIAN WALL TEXTURE
// ---------------------------------------------------------------------------

function generateObsidianBaseTexture(
  name: string,
  scene: Scene,
  size: number,
): DynamicTexture {
  const tex = new DynamicTexture(name, size, scene, false);
  const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
  const rng = seededRandom(999);

  const [bgR, bgG, bgB] = hexToRgb(COLORS.wallObsidian);

  // Very dark crystalline base
  ctx.fillStyle = `rgb(${bgR},${bgG},${bgB})`;
  ctx.fillRect(0, 0, size, size);

  // Crystalline facets - geometric shards
  for (let i = 0; i < 50; i++) {
    const cx = rng() * size;
    const cy = rng() * size;
    const points = 3 + Math.floor(rng() * 3);
    const r = 10 + rng() * 40;

    // Slightly brighter facet
    const brightness = rng() * 15;
    ctx.fillStyle = `rgba(${Math.round(bgR + brightness)},${Math.round(bgG + brightness * 0.5)},${Math.round(bgB + brightness * 1.5)},${0.3 + rng() * 0.3})`;

    ctx.beginPath();
    for (let p = 0; p < points; p++) {
      const angle = (p / points) * Math.PI * 2 + rng() * 0.5;
      const dist = r * (0.5 + rng() * 0.5);
      const px = cx + Math.cos(angle) * dist;
      const py = cy + Math.sin(angle) * dist;
      if (p === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // Crystal edge highlight
    ctx.strokeStyle = `rgba(${40 + Math.floor(rng() * 30)},${20 + Math.floor(rng() * 20)},${60 + Math.floor(rng() * 50)},${0.15 + rng() * 0.15})`;
    ctx.lineWidth = 0.5 + rng();
    ctx.stroke();
  }

  // Purple/blue reflective highlights
  for (let i = 0; i < 20; i++) {
    const x = rng() * size;
    const y = rng() * size;
    const r = 2 + rng() * 10;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    const highlight = rng() > 0.5
      ? `rgba(${30 + Math.floor(rng() * 30)},${10 + Math.floor(rng() * 20)},${80 + Math.floor(rng() * 60)},0.25)`
      : `rgba(${15 + Math.floor(rng() * 20)},${15 + Math.floor(rng() * 25)},${60 + Math.floor(rng() * 50)},0.2)`;
    grad.addColorStop(0, highlight);
    grad.addColorStop(1, 'rgba(10,5,16,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Subtle glowing runes/geometric patterns
  const drawRune = (cx: number, cy: number, runeSize: number) => {
    ctx.strokeStyle = `rgba(${40 + Math.floor(rng() * 30)},${15 + Math.floor(rng() * 15)},${70 + Math.floor(rng() * 50)},${0.15 + rng() * 0.1})`;
    ctx.lineWidth = 0.8 + rng() * 0.5;

    const type = Math.floor(rng() * 4);
    switch (type) {
      case 0: {
        // Circle with inscribed triangle
        ctx.beginPath();
        ctx.arc(cx, cy, runeSize, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        for (let p = 0; p < 3; p++) {
          const a = (p / 3) * Math.PI * 2 - Math.PI / 2;
          const px = cx + Math.cos(a) * runeSize;
          const py = cy + Math.sin(a) * runeSize;
          if (p === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
        break;
      }
      case 1: {
        // Pentagram
        ctx.beginPath();
        for (let p = 0; p < 5; p++) {
          const a = (p * 2 / 5) * Math.PI * 2 - Math.PI / 2;
          const px = cx + Math.cos(a) * runeSize;
          const py = cy + Math.sin(a) * runeSize;
          if (p === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
        break;
      }
      case 2: {
        // Concentric diamonds
        for (let d = 0; d < 3; d++) {
          const s = runeSize * (1 - d * 0.3);
          ctx.beginPath();
          ctx.moveTo(cx, cy - s);
          ctx.lineTo(cx + s, cy);
          ctx.lineTo(cx, cy + s);
          ctx.lineTo(cx - s, cy);
          ctx.closePath();
          ctx.stroke();
        }
        break;
      }
      case 3: {
        // Cross with circles
        ctx.beginPath();
        ctx.moveTo(cx - runeSize, cy);
        ctx.lineTo(cx + runeSize, cy);
        ctx.moveTo(cx, cy - runeSize);
        ctx.lineTo(cx, cy + runeSize);
        ctx.stroke();
        for (let corner = 0; corner < 4; corner++) {
          const a = (corner / 4) * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(
            cx + Math.cos(a) * runeSize * 0.7,
            cy + Math.sin(a) * runeSize * 0.7,
            runeSize * 0.2,
            0,
            Math.PI * 2,
          );
          ctx.stroke();
        }
        break;
      }
    }
  };

  for (let i = 0; i < 6; i++) {
    drawRune(
      50 + rng() * (size - 100),
      50 + rng() * (size - 100),
      10 + rng() * 20,
    );
  }

  tex.hasAlpha = false;
  tex.update();
  return tex;
}

function generateObsidianEmissiveTexture(
  name: string,
  scene: Scene,
  size: number,
): DynamicTexture {
  const tex = new DynamicTexture(name, size, scene, false);
  const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
  const rng = seededRandom(999);

  // Nearly black with faint rune glow
  ctx.fillStyle = 'rgb(3,0,6)';
  ctx.fillRect(0, 0, size, size);

  // Skip past the facets/highlights (consume same rng calls as base)
  for (let i = 0; i < 50; i++) {
    rng(); rng(); rng(); rng(); rng(); rng(); rng(); rng(); rng(); rng();
    rng(); rng(); rng(); rng(); rng();
  }
  for (let i = 0; i < 20; i++) {
    rng(); rng(); rng(); rng(); rng(); rng(); rng();
  }

  // Rune glow areas
  for (let i = 0; i < 6; i++) {
    const cx = 50 + rng() * (size - 100);
    const cy = 50 + rng() * (size - 100);
    const runeSize = 10 + rng() * 20;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, runeSize * 2);
    grad.addColorStop(0, `rgba(${50 + Math.floor(rng() * 30)},${15 + Math.floor(rng() * 15)},${100 + Math.floor(rng() * 50)},0.4)`);
    grad.addColorStop(0.5, 'rgba(20,5,50,0.15)');
    grad.addColorStop(1, 'rgba(3,0,6,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, runeSize * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Faint ambient purple shimmer spots
  for (let i = 0; i < 12; i++) {
    const x = rng() * size;
    const y = rng() * size;
    const r = 3 + rng() * 8;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, 'rgba(40,10,80,0.25)');
    grad.addColorStop(1, 'rgba(3,0,6,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  tex.hasAlpha = false;
  tex.update();
  return tex;
}

function generateObsidianNormalTexture(
  name: string,
  scene: Scene,
  size: number,
): DynamicTexture {
  const tex = new DynamicTexture(name, size, scene, false);
  const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
  const rng = seededRandom(1000);

  ctx.fillStyle = 'rgb(128,128,255)';
  ctx.fillRect(0, 0, size, size);

  // Sharp crystalline facet edges
  for (let i = 0; i < 40; i++) {
    const x1 = rng() * size;
    const y1 = rng() * size;
    const angle = rng() * Math.PI * 2;
    const len = 20 + rng() * 60;
    const x2 = x1 + Math.cos(angle) * len;
    const y2 = y1 + Math.sin(angle) * len;

    // Edge creates a normal discontinuity
    const nx = 100 + Math.floor(rng() * 56);
    ctx.strokeStyle = `rgb(${nx},128,240)`;
    ctx.lineWidth = 1 + rng() * 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  tex.hasAlpha = false;
  tex.update();
  return tex;
}

// ---------------------------------------------------------------------------
// 5. DOOR TEXTURE
// ---------------------------------------------------------------------------

function generateDoorBaseTexture(
  name: string,
  scene: Scene,
  size: number,
): DynamicTexture {
  const tex = new DynamicTexture(name, size, scene, false);
  const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
  const rng = seededRandom(555);

  const [bgR, bgG, bgB] = hexToRgb(COLORS.door);

  // Dark iron base
  ctx.fillStyle = `rgb(${bgR},${bgG},${bgB})`;
  ctx.fillRect(0, 0, size, size);

  // Metal plate sections
  const plateRows = 3;
  const plateCols = 2;
  const plateW = size / plateCols;
  const plateH = size / plateRows;
  const plateGap = 6;

  for (let row = 0; row < plateRows; row++) {
    for (let col = 0; col < plateCols; col++) {
      const px = col * plateW + plateGap;
      const py = row * plateH + plateGap;
      const pw = plateW - plateGap * 2;
      const ph = plateH - plateGap * 2;

      // Plate base with slight color variation
      ctx.fillStyle = varyColor(bgR, bgG, bgB, 12, rng);
      ctx.fillRect(px, py, pw, ph);

      // Brushed metal effect - horizontal lines
      for (let line = 0; line < 15; line++) {
        const ly = py + rng() * ph;
        ctx.strokeStyle = `rgba(${bgR + 15},${bgG + 12},${bgB + 8},${0.1 + rng() * 0.12})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(px, ly);
        ctx.lineTo(px + pw, ly);
        ctx.stroke();
      }

      // Top edge highlight
      ctx.strokeStyle = `rgba(${bgR + 30},${bgG + 25},${bgB + 20},0.4)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + pw, py);
      ctx.stroke();

      // Bottom edge shadow
      ctx.strokeStyle = `rgba(${Math.max(0, bgR - 25)},${Math.max(0, bgG - 25)},${Math.max(0, bgB - 25)},0.5)`;
      ctx.beginPath();
      ctx.moveTo(px, py + ph);
      ctx.lineTo(px + pw, py + ph);
      ctx.stroke();

      // Rivets in corners and center edges
      const rivetPositions = [
        [px + 12, py + 12],
        [px + pw - 12, py + 12],
        [px + 12, py + ph - 12],
        [px + pw - 12, py + ph - 12],
        [px + pw / 2, py + 12],
        [px + pw / 2, py + ph - 12],
      ];

      for (const [rx, ry] of rivetPositions) {
        const rivetR = 3 + rng() * 1.5;

        // Rivet shadow
        ctx.fillStyle = `rgba(${Math.max(0, bgR - 30)},${Math.max(0, bgG - 30)},${Math.max(0, bgB - 30)},0.6)`;
        ctx.beginPath();
        ctx.arc(rx + 1, ry + 1, rivetR, 0, Math.PI * 2);
        ctx.fill();

        // Rivet body
        const grad = ctx.createRadialGradient(
          rx - 1,
          ry - 1,
          0,
          rx,
          ry,
          rivetR,
        );
        grad.addColorStop(0, `rgb(${bgR + 20},${bgG + 18},${bgB + 12})`);
        grad.addColorStop(0.7, `rgb(${bgR},${bgG},${bgB})`);
        grad.addColorStop(1, `rgb(${Math.max(0, bgR - 15)},${Math.max(0, bgG - 15)},${Math.max(0, bgB - 15)})`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(rx, ry, rivetR, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Rust patches
  for (let i = 0; i < 12; i++) {
    const x = rng() * size;
    const y = rng() * size;
    const r = 8 + rng() * 25;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    const rustR = 100 + Math.floor(rng() * 50);
    const rustG = 40 + Math.floor(rng() * 25);
    const rustB = 10 + Math.floor(rng() * 15);
    grad.addColorStop(0, `rgba(${rustR},${rustG},${rustB},${0.2 + rng() * 0.15})`);
    grad.addColorStop(0.5, `rgba(${rustR - 20},${rustG - 10},${rustB},${0.1 + rng() * 0.1})`);
    grad.addColorStop(1, `rgba(${bgR},${bgG},${bgB},0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Scratch marks
  for (let i = 0; i < 8; i++) {
    const sx = rng() * size;
    const sy = rng() * size;
    ctx.strokeStyle = `rgba(${bgR + 25},${bgG + 20},${bgB + 15},${0.2 + rng() * 0.15})`;
    ctx.lineWidth = 0.5 + rng() * 1;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + (rng() - 0.5) * 60, sy + (rng() - 0.5) * 60);
    ctx.stroke();
  }

  tex.hasAlpha = false;
  tex.update();
  return tex;
}

function generateDoorNormalTexture(
  name: string,
  scene: Scene,
  size: number,
): DynamicTexture {
  const tex = new DynamicTexture(name, size, scene, false);
  const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
  const rng = seededRandom(556);

  ctx.fillStyle = 'rgb(128,128,255)';
  ctx.fillRect(0, 0, size, size);

  // Plate seam indentations
  const plateRows = 3;
  const plateCols = 2;
  const plateW = size / plateCols;
  const plateH = size / plateRows;

  for (let row = 0; row <= plateRows; row++) {
    const y = row * plateH;
    ctx.fillStyle = 'rgb(128,105,210)';
    ctx.fillRect(0, y - 3, size, 6);
  }
  for (let col = 0; col <= plateCols; col++) {
    const x = col * plateW;
    ctx.fillStyle = 'rgb(105,128,210)';
    ctx.fillRect(x - 3, 0, 6, size);
  }

  // Rivet bumps
  for (let row = 0; row < plateRows; row++) {
    for (let col = 0; col < plateCols; col++) {
      const px = col * plateW + 6;
      const py = row * plateH + 6;
      const pw = plateW - 12;
      const ph = plateH - 12;

      const rivetPositions = [
        [px + 12, py + 12],
        [px + pw - 12, py + 12],
        [px + 12, py + ph - 12],
        [px + pw - 12, py + ph - 12],
        [px + pw / 2, py + 12],
        [px + pw / 2, py + ph - 12],
      ];

      for (const [rx, ry] of rivetPositions) {
        const r = 4 + rng() * 1.5;
        const grad = ctx.createRadialGradient(rx, ry, 0, rx, ry, r);
        grad.addColorStop(0, 'rgb(128,128,200)');
        grad.addColorStop(0.5, 'rgb(145,145,255)');
        grad.addColorStop(1, 'rgb(128,128,255)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(rx, ry, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  tex.hasAlpha = false;
  tex.update();
  return tex;
}

function generateDoorRoughnessTexture(
  name: string,
  scene: Scene,
  size: number,
): DynamicTexture {
  const tex = new DynamicTexture(name, size, scene, false);
  const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
  const rng = seededRandom(557);

  // Metal: moderate roughness, moderate metallic
  // G = roughness, B = metallic
  ctx.fillStyle = 'rgb(0,170,76)'; // roughness ~0.67, metallic ~0.3
  ctx.fillRect(0, 0, size, size);

  // Rust patches are rougher and less metallic
  for (let i = 0; i < 12; i++) {
    const x = rng() * size;
    const y = rng() * size;
    const r = 8 + rng() * 25;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, 'rgb(0,230,20)'); // rougher, less metallic
    grad.addColorStop(1, 'rgb(0,170,76)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  tex.hasAlpha = false;
  tex.update();
  return tex;
}

// ---------------------------------------------------------------------------
// 6. FLOOR TEXTURE
// ---------------------------------------------------------------------------

function generateFloorBaseTexture(
  name: string,
  scene: Scene,
  size: number,
): DynamicTexture {
  const tex = new DynamicTexture(name, size, scene, false);
  const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
  const rng = seededRandom(111);

  const [bgR, bgG, bgB] = hexToRgb(COLORS.floor);

  // Dark earth base
  ctx.fillStyle = `rgb(${bgR},${bgG},${bgB})`;
  ctx.fillRect(0, 0, size, size);

  // Earth/stone texture noise
  for (let i = 0; i < 200; i++) {
    const x = rng() * size;
    const y = rng() * size;
    const r = 2 + rng() * 8;
    ctx.fillStyle = varyColor(bgR, bgG, bgB, 15, rng);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cracked stone pattern
  const drawFloorCrack = (
    sx: number,
    sy: number,
    angle: number,
    len: number,
    width: number,
    depth: number,
  ) => {
    if (depth <= 0 || width < 0.3) return;

    let cx = sx;
    let cy = sy;
    const segments = Math.floor(len / 5);

    ctx.strokeStyle = `rgba(${Math.max(0, bgR - 15)},${Math.max(0, bgG - 3)},${Math.max(0, bgB - 3)},${0.5 + rng() * 0.3})`;
    ctx.lineWidth = width;
    (ctx as any).lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    let a = angle;
    for (let s = 0; s < segments; s++) {
      a += (rng() - 0.5) * 0.8;
      cx += Math.cos(a) * 5;
      cy += Math.sin(a) * 5;
      ctx.lineTo(cx, cy);

      if (rng() < 0.2 && depth > 1) {
        drawFloorCrack(
          cx,
          cy,
          a + (rng() - 0.5) * 1.5,
          len * (0.2 + rng() * 0.3),
          width * 0.6,
          depth - 1,
        );
      }
    }
    ctx.stroke();
  };

  for (let i = 0; i < 10; i++) {
    drawFloorCrack(
      rng() * size,
      rng() * size,
      rng() * Math.PI * 2,
      60 + rng() * 120,
      1 + rng() * 1.5,
      3,
    );
  }

  // Dark red veining (blood seeping through cracks)
  for (let i = 0; i < 8; i++) {
    let cx = rng() * size;
    let cy = rng() * size;
    const angle = rng() * Math.PI * 2;

    ctx.strokeStyle = `rgba(80,5,8,${0.3 + rng() * 0.25})`;
    ctx.lineWidth = 0.5 + rng() * 1.5;
    (ctx as any).lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, cy);

    for (let s = 0; s < 15; s++) {
      cx += Math.cos(angle + (rng() - 0.5) * 0.8) * 8;
      cy += Math.sin(angle + (rng() - 0.5) * 0.8) * 8;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();

    // Blood pooling
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 6 + rng() * 10);
    grad.addColorStop(0, 'rgba(60,3,5,0.25)');
    grad.addColorStop(1, 'rgba(34,5,5,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  // Debris/pebbles
  for (let i = 0; i < 30; i++) {
    const x = rng() * size;
    const y = rng() * size;
    const r = 1 + rng() * 3;
    ctx.fillStyle = varyColor(bgR + 8, bgG + 5, bgB + 3, 8, rng);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  tex.hasAlpha = false;
  tex.update();
  return tex;
}

function generateFloorNormalTexture(
  name: string,
  scene: Scene,
  size: number,
): DynamicTexture {
  const tex = new DynamicTexture(name, size, scene, false);
  const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
  const rng = seededRandom(112);

  ctx.fillStyle = 'rgb(128,128,255)';
  ctx.fillRect(0, 0, size, size);

  // Surface roughness bumps
  for (let i = 0; i < 80; i++) {
    const x = rng() * size;
    const y = rng() * size;
    const r = 3 + rng() * 10;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    const nx = 115 + Math.floor(rng() * 26);
    const ny = 115 + Math.floor(rng() * 26);
    grad.addColorStop(0, `rgb(${nx},${ny},235)`);
    grad.addColorStop(1, 'rgb(128,128,255)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Crack indentations
  for (let i = 0; i < 15; i++) {
    let cx = rng() * size;
    let cy = rng() * size;
    const angle = rng() * Math.PI * 2;
    ctx.strokeStyle = 'rgb(128,110,220)';
    ctx.lineWidth = 1 + rng() * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    for (let s = 0; s < 8; s++) {
      cx += Math.cos(angle + (rng() - 0.5) * 0.7) * 8;
      cy += Math.sin(angle + (rng() - 0.5) * 0.7) * 8;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }

  tex.hasAlpha = false;
  tex.update();
  return tex;
}

// ---------------------------------------------------------------------------
// 7. CEILING TEXTURE
// ---------------------------------------------------------------------------

function generateCeilingBaseTexture(
  name: string,
  scene: Scene,
  size: number,
): DynamicTexture {
  const tex = new DynamicTexture(name, size, scene, false);
  const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
  const rng = seededRandom(222);

  const [bgR, bgG, bgB] = hexToRgb(COLORS.ceiling);

  // Dark organic base
  ctx.fillStyle = `rgb(${bgR},${bgG},${bgB})`;
  ctx.fillRect(0, 0, size, size);

  // Mottled organic texture
  for (let i = 0; i < 150; i++) {
    const x = rng() * size;
    const y = rng() * size;
    const r = 4 + rng() * 20;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(
      0,
      varyColor(bgR, bgG, bgB, 15, rng),
    );
    grad.addColorStop(1, `rgba(${bgR},${bgG},${bgB},0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Dried blood stains - dark reddish brown patches
  for (let i = 0; i < 10; i++) {
    const x = rng() * size;
    const y = rng() * size;
    const r = 10 + rng() * 35;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, `rgba(${40 + Math.floor(rng() * 20)},${Math.floor(rng() * 8)},${5 + Math.floor(rng() * 10)},${0.25 + rng() * 0.15})`);
    grad.addColorStop(0.6, `rgba(${bgR + 5},${bgG},${bgB},${0.1 + rng() * 0.1})`);
    grad.addColorStop(1, `rgba(${bgR},${bgG},${bgB},0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Stalactite-like drip marks
  for (let i = 0; i < 20; i++) {
    const x = rng() * size;
    const y = rng() * size;
    const len = 15 + rng() * 40;
    const w = 2 + rng() * 5;

    // Drip body
    ctx.fillStyle = varyColor(bgR + 5, bgG + 3, bgB + 5, 8, rng);
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y);
    ctx.lineTo(x + w / 2, y);
    ctx.lineTo(x + w * 0.2, y + len);
    ctx.lineTo(x - w * 0.2, y + len);
    ctx.closePath();
    ctx.fill();

    // Drip tip highlight
    ctx.fillStyle = `rgba(${bgR + 12},${bgG + 8},${bgB + 15},0.4)`;
    ctx.beginPath();
    ctx.arc(x, y + len, w * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Dark crevices
  for (let i = 0; i < 6; i++) {
    let cx = rng() * size;
    let cy = rng() * size;
    const angle = rng() * Math.PI * 2;
    ctx.strokeStyle = `rgba(${Math.max(0, bgR - 12)},${Math.max(0, bgG - 15)},${Math.max(0, bgB - 12)},${0.4 + rng() * 0.3})`;
    ctx.lineWidth = 1 + rng() * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    for (let s = 0; s < 10; s++) {
      cx += Math.cos(angle + (rng() - 0.5) * 0.6) * 10;
      cy += Math.sin(angle + (rng() - 0.5) * 0.6) * 10;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }

  tex.hasAlpha = false;
  tex.update();
  return tex;
}

function generateCeilingNormalTexture(
  name: string,
  scene: Scene,
  size: number,
): DynamicTexture {
  const tex = new DynamicTexture(name, size, scene, false);
  const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
  const rng = seededRandom(223);

  ctx.fillStyle = 'rgb(128,128,255)';
  ctx.fillRect(0, 0, size, size);

  // Stalactite bumps - downward facing protrusions
  for (let i = 0; i < 20; i++) {
    const x = rng() * size;
    const y = rng() * size;
    const len = 15 + rng() * 40;
    const w = 4 + rng() * 8;

    // Create a gradient that represents a downward bump
    const grad = ctx.createLinearGradient(x, y, x, y + len);
    grad.addColorStop(0, 'rgb(128,140,255)');
    grad.addColorStop(0.5, 'rgb(128,128,240)');
    grad.addColorStop(1, 'rgb(128,115,255)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y);
    ctx.lineTo(x + w / 2, y);
    ctx.lineTo(x + w * 0.15, y + len);
    ctx.lineTo(x - w * 0.15, y + len);
    ctx.closePath();
    ctx.fill();
  }

  // General bumpy surface
  for (let i = 0; i < 50; i++) {
    const x = rng() * size;
    const y = rng() * size;
    const r = 3 + rng() * 12;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    const nx = 118 + Math.floor(rng() * 20);
    const ny = 118 + Math.floor(rng() * 20);
    grad.addColorStop(0, `rgb(${nx},${ny},240)`);
    grad.addColorStop(1, 'rgb(128,128,255)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  tex.hasAlpha = false;
  tex.update();
  return tex;
}

function generateCeilingEmissiveTexture(
  name: string,
  scene: Scene,
  size: number,
): DynamicTexture {
  const tex = new DynamicTexture(name, size, scene, false);
  const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
  const rng = seededRandom(224);

  // Very faint dark purple glow
  ctx.fillStyle = 'rgb(4,0,8)';
  ctx.fillRect(0, 0, size, size);

  // Sparse dim glow spots
  for (let i = 0; i < 8; i++) {
    const x = rng() * size;
    const y = rng() * size;
    const r = 10 + rng() * 30;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, `rgba(${15 + Math.floor(rng() * 10)},${Math.floor(rng() * 5)},${25 + Math.floor(rng() * 15)},0.3)`);
    grad.addColorStop(1, 'rgba(4,0,8,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  tex.hasAlpha = false;
  tex.update();
  return tex;
}

// ---------------------------------------------------------------------------
// Material creation functions
// ---------------------------------------------------------------------------

export function createWallMaterial(
  name: string,
  wallType: WallType,
  scene: Scene,
): PBRMetallicRoughnessMaterial {
  const mat = new PBRMetallicRoughnessMaterial(name, scene);
  const size = 512;

  switch (wallType) {
    case 'stone': {
      mat.baseColor = Color3.FromHexString(COLORS.wallStone);
      mat.baseTexture = generateStoneBaseTexture(`${name}_baseTex`, scene, size);
      mat.normalTexture = generateStoneNormalTexture(`${name}_normalTex`, scene, size);
      mat.metallicRoughnessTexture = generateStoneRoughnessTexture(`${name}_mrTex`, scene, size);
      mat.metallic = 0.1;
      mat.roughness = 0.9;
      break;
    }
    case 'flesh': {
      mat.baseColor = Color3.FromHexString(COLORS.wallFlesh);
      mat.baseTexture = generateFleshBaseTexture(`${name}_baseTex`, scene, size);
      mat.normalTexture = generateFleshNormalTexture(`${name}_normalTex`, scene, size);
      mat.metallicRoughnessTexture = generateFleshRoughnessTexture(`${name}_mrTex`, scene, size);
      mat.emissiveTexture = generateFleshEmissiveTexture(`${name}_emTex`, scene, size);
      mat.emissiveColor = Color3.FromHexString('#330808');
      mat.metallic = 0.05;
      mat.roughness = 0.6;

      // Animate emissive pulsing
      let time = 0;
      scene.registerBeforeRender(() => {
        time += scene.getEngine().getDeltaTime() * 0.001;
        const pulse = 0.5 + Math.sin(time * 1.8) * 0.35 + Math.sin(time * 3.1) * 0.15;
        mat.emissiveColor = new Color3(
          0.2 * pulse,
          0.03 * pulse,
          0.03 * pulse,
        );
      });
      break;
    }
    case 'lava': {
      mat.baseColor = Color3.FromHexString(COLORS.wallLava);
      mat.baseTexture = generateLavaBaseTexture(`${name}_baseTex`, scene, size);
      mat.normalTexture = generateLavaNormalTexture(`${name}_normalTex`, scene, size);
      mat.emissiveTexture = generateLavaEmissiveTexture(`${name}_emTex`, scene, size);
      mat.emissiveColor = new Color3(1.0, 0.35, 0.02);
      mat.metallic = 0.2;
      mat.roughness = 0.3;
      break;
    }
    case 'obsidian': {
      mat.baseColor = Color3.FromHexString(COLORS.wallObsidian);
      mat.baseTexture = generateObsidianBaseTexture(`${name}_baseTex`, scene, size);
      mat.normalTexture = generateObsidianNormalTexture(`${name}_normalTex`, scene, size);
      mat.emissiveTexture = generateObsidianEmissiveTexture(`${name}_emTex`, scene, size);
      mat.emissiveColor = new Color3(0.1, 0.02, 0.18);
      mat.metallic = 0.9;
      mat.roughness = 0.15;
      break;
    }
    case 'door': {
      mat.baseColor = Color3.FromHexString(COLORS.door);
      mat.baseTexture = generateDoorBaseTexture(`${name}_baseTex`, scene, size);
      mat.normalTexture = generateDoorNormalTexture(`${name}_normalTex`, scene, size);
      mat.metallicRoughnessTexture = generateDoorRoughnessTexture(`${name}_mrTex`, scene, size);
      mat.metallic = 0.3;
      mat.roughness = 0.7;
      break;
    }
  }

  return mat;
}

export function createFloorMaterial(scene: Scene): PBRMetallicRoughnessMaterial {
  const mat = new PBRMetallicRoughnessMaterial('floorMat', scene);
  const size = 512;

  mat.baseColor = Color3.FromHexString(COLORS.floor);
  mat.baseTexture = generateFloorBaseTexture('floor_baseTex', scene, size);
  mat.normalTexture = generateFloorNormalTexture('floor_normalTex', scene, size);
  mat.metallic = 0.1;
  mat.roughness = 0.85;

  return mat;
}

export function createCeilingMaterial(
  scene: Scene,
): PBRMetallicRoughnessMaterial {
  const mat = new PBRMetallicRoughnessMaterial('ceilingMat', scene);
  const size = 512;

  mat.baseColor = Color3.FromHexString(COLORS.ceiling);
  mat.baseTexture = generateCeilingBaseTexture('ceiling_baseTex', scene, size);
  mat.normalTexture = generateCeilingNormalTexture('ceiling_normalTex', scene, size);
  mat.emissiveTexture = generateCeilingEmissiveTexture('ceiling_emTex', scene, size);
  mat.emissiveColor = Color3.FromHexString('#0a0010');
  mat.metallic = 0.05;
  mat.roughness = 0.7;

  return mat;
}
