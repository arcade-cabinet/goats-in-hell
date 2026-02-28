/**
 * HUD Crosshair — 4 arms + center dot with dynamic spread.
 */
import {Rectangle, Ellipse} from '@babylonjs/gui';
import type {AdvancedDynamicTexture} from '@babylonjs/gui';
import type {Entity} from '../../entities/components';
import {weapons} from '../../weapons/weapons';

export interface CrosshairControls {
  top: Rectangle;
  bottom: Rectangle;
  left: Rectangle;
  right: Rectangle;
  dot: Ellipse;
  currentGap: number;
}

export function createCrosshair(gui: AdvancedDynamicTexture): CrosshairControls {
  const color = 'rgba(255, 80, 60, 0.75)';
  const length = 14;
  const thick = 2;
  const gap = 5;

  const top = new Rectangle('xhTop');
  top.width = `${thick}px`;
  top.height = `${length}px`;
  top.background = color;
  top.thickness = 0;
  top.top = -(gap + length / 2);
  gui.addControl(top);

  const bottom = new Rectangle('xhBot');
  bottom.width = `${thick}px`;
  bottom.height = `${length}px`;
  bottom.background = color;
  bottom.thickness = 0;
  bottom.top = gap + length / 2;
  gui.addControl(bottom);

  const left = new Rectangle('xhLeft');
  left.width = `${length}px`;
  left.height = `${thick}px`;
  left.background = color;
  left.thickness = 0;
  left.left = -(gap + length / 2);
  gui.addControl(left);

  const right = new Rectangle('xhRight');
  right.width = `${length}px`;
  right.height = `${thick}px`;
  right.background = color;
  right.thickness = 0;
  right.left = gap + length / 2;
  gui.addControl(right);

  const dot = new Ellipse('xhDot');
  dot.width = '2px';
  dot.height = '2px';
  dot.background = color;
  dot.thickness = 0;
  gui.addControl(dot);

  return {top, bottom, left, right, dot, currentGap: 5};
}

export function updateCrosshair(controls: CrosshairControls, hitMarker: number, player: Entity): number {
  const hit = hitMarker > 0;
  const color = hit ? '#ffffff' : 'rgba(255, 80, 60, 0.75)';
  controls.top.background = color;
  controls.bottom.background = color;
  controls.left.background = color;
  controls.right.background = color;
  controls.dot.background = color;
  controls.dot.width = hit ? '4px' : '2px';
  controls.dot.height = hit ? '4px' : '2px';

  const wid = player.player?.currentWeapon ?? 'hellPistol';
  const weaponSpread = (weapons[wid]?.spread ?? 0) * 100;

  const vel = player.velocity;
  const speed = vel ? Math.sqrt(vel.x * vel.x + vel.z * vel.z) : 0;
  const movePenalty = Math.min(speed * 60, 10);

  const hitRecoil = hit ? hitMarker * 8 : 0;

  const targetGap = 5 + weaponSpread + movePenalty + hitRecoil;
  const newGap = controls.currentGap + (targetGap - controls.currentGap) * 0.25;

  const baseLen = 14;
  controls.top.top = -(newGap + baseLen / 2);
  controls.bottom.top = newGap + baseLen / 2;
  controls.left.left = -(newGap + baseLen / 2);
  controls.right.left = newGap + baseLen / 2;

  return newGap;
}
