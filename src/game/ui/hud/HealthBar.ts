/**
 * HUD Health Bar — HP bar, HP text, low-HP vignette.
 */
import {Rectangle, TextBlock, StackPanel, Control} from '@babylonjs/gui';
import type {AdvancedDynamicTexture} from '@babylonjs/gui';
import type {Entity} from '../../entities/components';
import {getGameTime} from '../../systems/GameClock';
import {FONT} from './constants';

function getHealthColor(ratio: number): string {
  if (ratio > 0.6) return '#44ff44';
  if (ratio > 0.35) return '#ffcc00';
  if (ratio > 0.15) return '#ff6600';
  return '#ff2200';
}

export interface HealthBarControls {
  healthBarInner: Rectangle;
  healthLabel: TextBlock;
  healthValueText: TextBlock;
  vignette: Rectangle;
}

export function createHealthBar(gui: AdvancedDynamicTexture): HealthBarControls {
  // Low HP vignette
  const vignette = new Rectangle('vignette');
  vignette.width = 1;
  vignette.height = 1;
  vignette.thickness = 40;
  vignette.color = 'rgba(200, 0, 0, 0.25)';
  vignette.background = 'transparent';
  vignette.isVisible = false;
  gui.addControl(vignette);

  const panel = new StackPanel('healthPanel');
  panel.width = '240px';
  panel.height = '60px';
  panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
  panel.left = 20;
  panel.top = -20;
  panel.background = 'rgba(10, 5, 5, 0.75)';
  gui.addControl(panel);

  const barOuter = new Rectangle('hpBarOuter');
  barOuter.width = '210px';
  barOuter.height = '16px';
  barOuter.background = '#1a0505';
  barOuter.thickness = 1;
  barOuter.color = 'rgba(204, 0, 0, 0.25)';
  barOuter.paddingTop = 8;
  panel.addControl(barOuter);

  const healthBarInner = new Rectangle('hpBarInner');
  healthBarInner.width = 1;
  healthBarInner.height = 1;
  healthBarInner.background = '#44ff44';
  healthBarInner.thickness = 0;
  healthBarInner.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  barOuter.addControl(healthBarInner);

  for (const p of [0.25, 0.5, 0.75]) {
    const tick = new Rectangle(`hpTick${p}`);
    tick.width = '1px';
    tick.height = 1;
    tick.background = 'rgba(0, 0, 0, 0.4)';
    tick.thickness = 0;
    tick.left = p;
    tick.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    barOuter.addControl(tick);
  }

  const textRow = new StackPanel('hpTextRow');
  textRow.isVertical = false;
  textRow.height = '24px';
  textRow.paddingTop = 4;
  panel.addControl(textRow);

  const healthLabel = new TextBlock('hpLabel', 'HP');
  healthLabel.fontFamily = FONT;
  healthLabel.fontSize = 12;
  healthLabel.color = '#44ff44';
  healthLabel.fontWeight = 'bold';
  healthLabel.width = '40px';
  healthLabel.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  healthLabel.paddingLeft = 6;
  textRow.addControl(healthLabel);

  const healthValueText = new TextBlock('hpValue', '100/100');
  healthValueText.fontFamily = FONT;
  healthValueText.fontSize = 16;
  healthValueText.color = '#ccbbaa';
  healthValueText.fontWeight = 'bold';
  healthValueText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  textRow.addControl(healthValueText);

  return {healthBarInner, healthLabel, healthValueText, vignette};
}

export function updateHealthBar(controls: HealthBarControls, player: Entity): void {
  const hp = player.player?.hp ?? 0;
  const maxHp = player.player?.maxHp ?? 100;
  const ratio = maxHp > 0 ? hp / maxHp : 0;
  const color = getHealthColor(ratio);

  controls.healthBarInner.width = ratio;
  controls.healthBarInner.background = color;
  controls.healthLabel.color = color;
  controls.healthValueText.text = `${hp}/${maxHp}`;

  const isLow = ratio < 0.5;
  controls.vignette.isVisible = isLow;
  if (isLow) {
    const severity = 1 - ratio / 0.5;
    const pulse = severity * (0.25 + Math.sin(getGameTime() * 0.01) * 0.12);
    const thickness = Math.round(30 + severity * 60);
    controls.vignette.thickness = thickness;
    controls.vignette.color = `rgba(180, 0, 0, ${pulse.toFixed(2)})`;
  }
}
