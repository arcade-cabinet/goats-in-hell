/**
 * HUD Debug Overlay — autoplay AI debug info display.
 */
import {Rectangle, TextBlock, StackPanel, Control} from '@babylonjs/gui';
import type {AdvancedDynamicTexture} from '@babylonjs/gui';
import {useGameStore} from '../../../state/GameStore';
import {FONT} from './constants';

export interface DebugOverlayControls {
  container: StackPanel;
  stateText: TextBlock;
  targetText: TextBlock;
  weaponText: TextBlock;
  steerText: TextBlock;
  stateColors: Record<string, string>;
}

export function createDebugOverlay(gui: AdvancedDynamicTexture): DebugOverlayControls {
  const STATE_COLORS: Record<string, string> = {
    hunt: '#ff4444',
    heal: '#44ff44',
    flee: '#ffaa00',
    explore: '#4488ff',
  };

  const container = new StackPanel('autoplayPanel');
  container.width = '180px';
  container.adaptHeightToChildren = true;
  container.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
  container.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
  container.left = -20;
  container.top = 52;
  container.background = 'rgba(0, 0, 0, 0.85)';
  container.isVisible = false;
  gui.addControl(container);

  const header = new TextBlock('apHeader', 'AUTOPLAY');
  header.fontFamily = FONT;
  header.fontSize = 11;
  header.fontWeight = 'bold';
  header.color = '#44ff44';
  header.height = '18px';
  container.addControl(header);

  const divider = new Rectangle('apDiv');
  divider.width = 0.9;
  divider.height = '1px';
  divider.background = 'rgba(68, 255, 68, 0.15)';
  divider.thickness = 0;
  container.addControl(divider);

  const makeRow = (name: string, label: string): TextBlock => {
    const row = new StackPanel(`ap-${name}`);
    row.isVertical = false;
    row.height = '16px';
    row.width = 1;
    container.addControl(row);

    const lbl = new TextBlock(`apl-${name}`, label);
    lbl.fontFamily = FONT;
    lbl.fontSize = 9;
    lbl.color = '#668866';
    lbl.width = 0.35;
    lbl.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    lbl.paddingLeft = 6;
    row.addControl(lbl);

    const val = new TextBlock(`apv-${name}`, '...');
    val.fontFamily = FONT;
    val.fontSize = 11;
    val.fontWeight = 'bold';
    val.color = '#cccccc';
    val.width = 0.65;
    val.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    val.paddingRight = 6;
    row.addControl(val);

    return val;
  };

  const stateText = makeRow('state', 'STATE');
  const targetText = makeRow('target', 'TARGET');
  const weaponText = makeRow('weapon', 'WEAPON');
  const steerText = makeRow('steer', 'STEER');

  return {container, stateText, targetText, weaponText, steerText, stateColors: STATE_COLORS};
}

export function updateDebugOverlay(
  controls: DebugOverlayControls,
  state: ReturnType<typeof useGameStore.getState>,
): void {
  if (!state.autoplay) {
    controls.container.isVisible = false;
    return;
  }

  controls.container.isVisible = true;
  const gov = typeof window !== 'undefined' ? (window as any).__aiGovernor : null;
  if (gov?.getDebugInfo) {
    const info = gov.getDebugInfo();
    controls.stateText.text = info.state?.toUpperCase() ?? '...';
    controls.stateText.color = controls.stateColors[info.state] ?? '#888888';
    controls.targetText.text = `${info.targetType} (${info.targetDist}u)`;
    controls.weaponText.text = info.weapon ?? '...';
    controls.steerText.text = info.steering ?? '...';
  }
}
