/**
 * HUD Minimap — HTML Canvas 2D minimap rendering.
 */
import {Rectangle, Control, Image as GuiImage} from '@babylonjs/gui';
import type {AdvancedDynamicTexture} from '@babylonjs/gui';
import {world} from '../../entities/world';
import type {Entity} from '../../entities/components';
import {getActiveLevel} from '../../levels/activeLevelRef';
import {CELL_SIZE} from '../../levels/LevelGenerator';

export interface MinimapControls {
  container: Rectangle;
  image: GuiImage;
  canvas: HTMLCanvasElement | null;
  ctx: CanvasRenderingContext2D | null;
  lastUpdate: number;
}

export function createMinimap(gui: AdvancedDynamicTexture): MinimapControls {
  const container = new Rectangle('minimap');
  container.width = '130px';
  container.height = '130px';
  container.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
  container.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
  container.left = -20;
  container.top = -80;
  container.thickness = 1;
  container.color = 'rgba(204, 0, 0, 0.3)';
  container.background = 'rgba(0, 0, 0, 0.7)';
  container.isVisible = false;
  gui.addControl(container);

  const image = new GuiImage('minimapImg', '');
  image.width = 1;
  image.height = 1;
  image.stretch = GuiImage.STRETCH_UNIFORM;
  container.addControl(image);

  let canvas: HTMLCanvasElement | null = null;
  let ctx: CanvasRenderingContext2D | null = null;
  if (typeof document !== 'undefined') {
    canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    ctx = canvas.getContext('2d');
  }

  return {container, image, canvas, ctx, lastUpdate: 0};
}

function getPlayer(): Entity | undefined {
  return world.entities.find(e => e.type === 'player');
}

export function updateMinimap(
  controls: MinimapControls,
  encounterType: string,
): number {
  const show = encounterType === 'explore';
  controls.container.isVisible = show;
  if (!show || !controls.canvas || !controls.ctx) return controls.lastUpdate;

  controls.lastUpdate++;
  if (controls.lastUpdate < 6) return controls.lastUpdate;
  controls.lastUpdate = 0;

  const level = getActiveLevel();
  if (!level) return 0;

  const ctx = controls.ctx;
  const size = 128;
  const {grid, width, depth} = level;
  const cellPx = size / Math.max(width, depth);

  ctx.fillStyle = '#0a0505';
  ctx.fillRect(0, 0, size, size);

  for (let z = 0; z < depth; z++) {
    for (let x = 0; x < width; x++) {
      const cell = grid[z][x];
      if (cell === 0) continue;
      switch (cell) {
        case 1: ctx.fillStyle = '#443333'; break;
        case 2: ctx.fillStyle = '#553322'; break;
        case 3: ctx.fillStyle = '#553300'; break;
        case 4: ctx.fillStyle = '#222233'; break;
        case 5: ctx.fillStyle = '#885522'; break;
        case 6: ctx.fillStyle = '#ff4400'; break;
        case 7: ctx.fillStyle = '#556677'; break;
        case 8: ctx.fillStyle = '#667755'; break;
        case 10: ctx.fillStyle = '#220044'; break;
        case 9: {
          const shimmer = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;
          const g = Math.floor(40 * shimmer);
          ctx.fillStyle = `rgb(${50 + g}, ${30 + g}, ${60 + g})`;
          break;
        }
        default: ctx.fillStyle = '#333333';
      }
      ctx.fillRect(x * cellPx, z * cellPx, cellPx, cellPx);
    }
  }

  ctx.fillStyle = '#ff2200';
  for (const e of world.entities) {
    if (!e.enemy || !e.position) continue;
    const ex = (e.position.x / CELL_SIZE) * cellPx;
    const ez = (e.position.z / CELL_SIZE) * cellPx;
    ctx.beginPath();
    ctx.arc(ex, ez, Math.max(1.5, cellPx * 0.4), 0, Math.PI * 2);
    ctx.fill();
  }

  for (const e of world.entities) {
    if (!e.pickup?.active || !e.position) continue;
    ctx.fillStyle = e.pickup.pickupType === 'health' ? '#44ff44'
      : e.pickup.pickupType === 'weapon' ? '#ff44ff'
      : e.pickup.pickupType === 'powerup' ? '#ffffff'
      : '#ffaa00';
    const px = (e.position.x / CELL_SIZE) * cellPx;
    const pz = (e.position.z / CELL_SIZE) * cellPx;
    ctx.beginPath();
    ctx.arc(px, pz, Math.max(1, cellPx * 0.3), 0, Math.PI * 2);
    ctx.fill();
  }

  const player = getPlayer();
  if (player?.position) {
    const ppx = (player.position.x / CELL_SIZE) * cellPx;
    const ppz = (player.position.z / CELL_SIZE) * cellPx;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ppx, ppz, Math.max(2, cellPx * 0.6), 0, Math.PI * 2);
    ctx.fill();
  }

  controls.image.source = controls.canvas.toDataURL();
  return 0;
}
