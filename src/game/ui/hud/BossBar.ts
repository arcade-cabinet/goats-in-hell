/**
 * HUD Boss Health Bar — boss HP bar, name, phase-2 flash.
 */
import {Rectangle, TextBlock, StackPanel, Control} from '@babylonjs/gui';
import type {AdvancedDynamicTexture} from '@babylonjs/gui';
import {world} from '../../entities/world';
import {GameState} from '../../../state/GameState';
import {useGameStore} from '../../../state/GameStore';
import {FONT} from './constants';

const BOSS_TYPES = new Set(['archGoat', 'infernoGoat', 'voidGoat', 'ironGoat']);
const BOSS_DISPLAY_NAMES: Record<string, string> = {
  infernoGoat: 'INFERNO GOAT',
  voidGoat: 'VOID GOAT',
  ironGoat: 'IRON GOAT',
  archGoat: 'ARCH GOAT',
};

// Module-level phase tracking
let bossPhase2Triggered = false;
let bossBarFlashTimer = 0;

export function resetBossPhase(): void {
  bossPhase2Triggered = false;
  bossBarFlashTimer = 0;
}

export interface BossBarControls {
  container: StackPanel;
  nameText: TextBlock;
  barInner: Rectangle;
  hpText: TextBlock;
}

export function createBossBar(gui: AdvancedDynamicTexture): BossBarControls {
  const container = new StackPanel('bossPanel');
  container.width = '50%';
  container.height = '50px';
  container.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
  container.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
  container.top = 70;
  container.isVisible = false;
  gui.addControl(container);

  const nameText = new TextBlock('bossName', 'BOSS');
  nameText.fontFamily = FONT;
  nameText.fontSize = 14;
  nameText.fontWeight = 'bold';
  nameText.color = '#cc0000';
  nameText.height = '20px';
  nameText.shadowColor = 'rgba(255, 0, 0, 0.5)';
  nameText.shadowBlur = 6;
  container.addControl(nameText);

  const bossBarOuter = new Rectangle('bossBarOuter');
  bossBarOuter.width = 1;
  bossBarOuter.height = '12px';
  bossBarOuter.background = '#1a0505';
  bossBarOuter.thickness = 1;
  bossBarOuter.color = 'rgba(204, 0, 0, 0.4)';
  container.addControl(bossBarOuter);

  const barInner = new Rectangle('bossBarInner');
  barInner.width = 1;
  barInner.height = 1;
  barInner.background = '#cc0000';
  barInner.thickness = 0;
  barInner.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  bossBarOuter.addControl(barInner);

  const hpText = new TextBlock('bossHp', '');
  hpText.fontFamily = FONT;
  hpText.fontSize = 10;
  hpText.color = '#887766';
  hpText.height = '14px';
  container.addControl(hpText);

  return {container, nameText, barInner, hpText};
}

export function updateBossBar(
  controls: BossBarControls,
  state: ReturnType<typeof useGameStore.getState>,
): void {
  if (state.stage.encounterType !== 'boss') {
    controls.container.isVisible = false;
    bossPhase2Triggered = false;
    return;
  }

  const boss = world.entities.find(e => e.enemy && BOSS_TYPES.has(e.type ?? ''));
  if (!boss?.enemy) {
    controls.container.isVisible = false;
    return;
  }

  controls.container.isVisible = true;
  const {hp, maxHp} = boss.enemy;
  const ratio = maxHp > 0 ? hp / maxHp : 0;
  const name = BOSS_DISPLAY_NAMES[boss.type ?? ''] ?? 'BOSS';

  if (ratio <= 0.5 && !bossPhase2Triggered) {
    bossPhase2Triggered = true;
    bossBarFlashTimer = 30;
    GameState.set({screenShake: 8});
  }

  let barColor: string;
  if (bossBarFlashTimer > 0) {
    bossBarFlashTimer--;
    const pulse = Math.sin(bossBarFlashTimer * 0.6) * 0.5 + 0.5;
    barColor = pulse > 0.5 ? '#ffffff' : '#ff4400';
    controls.nameText.text = `⚡ ${name} — PHASE 2 ⚡`;
  } else {
    barColor = ratio > 0.5 ? '#cc0000' : ratio > 0.25 ? '#ff6600' : '#ff2200';
    controls.nameText.text = ratio <= 0.5 ? `${name} — ENRAGED` : name;
  }

  controls.barInner.width = ratio;
  controls.barInner.background = barColor;
  controls.hpText.text = `${Math.ceil(hp)} / ${maxHp}`;
}
