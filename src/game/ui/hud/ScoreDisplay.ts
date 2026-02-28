/**
 * HUD Score Display — score with interpolation, kills, time, XP bar, level-up toast,
 * floor info, difficulty tags.
 */
import {Rectangle, TextBlock, StackPanel, Control} from '@babylonjs/gui';
import type {AdvancedDynamicTexture} from '@babylonjs/gui';
import {getThemeForFloor} from '../../levels/FloorThemes';
import {getWaveInfo} from '../../systems/WaveSystem';
import {useGameStore, DIFFICULTY_PRESETS, getLevelBonuses} from '../../../state/GameStore';
import {FONT} from './constants';

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export interface ScoreDisplayControls {
  scoreText: TextBlock;
  killsText: TextBlock;
  timeText: TextBlock;
  floorText: TextBlock;
  themeText: TextBlock;
  encounterText: TextBlock;
  waveText: TextBlock;
  levelText: TextBlock;
  xpBarInner: Rectangle;
  xpText: TextBlock;
  diffText: TextBlock;
  nightmareText: TextBlock;
  levelUpText: TextBlock;
  displayScore: number;
  targetScore: number;
  levelUpTimer: number;
  lastLevel: number;
}

export function createScoreDisplay(gui: AdvancedDynamicTexture): ScoreDisplayControls {
  // Score panel (center top)
  const scorePanel = new StackPanel('scorePanel');
  scorePanel.width = '260px';
  scorePanel.height = '56px';
  scorePanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
  scorePanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
  scorePanel.top = 16;
  gui.addControl(scorePanel);

  const scoreText = new TextBlock('score', '0');
  scoreText.fontFamily = FONT;
  scoreText.fontSize = 28;
  scoreText.fontWeight = 'bold';
  scoreText.color = '#ffffff';
  scoreText.height = '36px';
  scoreText.shadowColor = 'rgba(255, 0, 0, 0.6)';
  scoreText.shadowBlur = 8;
  scorePanel.addControl(scoreText);

  const statsRow = new StackPanel('statsRow');
  statsRow.isVertical = false;
  statsRow.height = '18px';
  scorePanel.addControl(statsRow);

  const killsText = new TextBlock('kills', 'KILLS 0');
  killsText.fontFamily = FONT;
  killsText.fontSize = 12;
  killsText.color = '#cc4444';
  killsText.width = '100px';
  statsRow.addControl(killsText);

  const sep = new TextBlock('sep', '|');
  sep.fontFamily = FONT;
  sep.fontSize = 12;
  sep.color = '#443322';
  sep.width = '20px';
  statsRow.addControl(sep);

  const timeText = new TextBlock('time', '0:00');
  timeText.fontFamily = FONT;
  timeText.fontSize = 12;
  timeText.color = '#887766';
  timeText.width = '80px';
  statsRow.addControl(timeText);

  // Floor info panel (top-left)
  const floorPanel = new StackPanel('floorPanel');
  floorPanel.width = '180px';
  floorPanel.adaptHeightToChildren = true;
  floorPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  floorPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
  floorPanel.left = 20;
  floorPanel.top = 16;
  floorPanel.background = 'rgba(10, 5, 5, 0.75)';
  floorPanel.paddingLeft = 12;
  floorPanel.paddingRight = 12;
  floorPanel.paddingTop = 6;
  floorPanel.paddingBottom = 6;
  gui.addControl(floorPanel);

  const floorText = new TextBlock('floorNum', 'FL 1');
  floorText.fontFamily = FONT;
  floorText.fontSize = 20;
  floorText.fontWeight = 'bold';
  floorText.color = '#cc0000';
  floorText.height = '24px';
  floorText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  floorPanel.addControl(floorText);

  const themeText = new TextBlock('themeName', '');
  themeText.fontFamily = FONT;
  themeText.fontSize = 9;
  themeText.color = '#884433';
  themeText.height = '14px';
  themeText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  floorPanel.addControl(themeText);

  const encounterText = new TextBlock('encounter', '');
  encounterText.fontFamily = FONT;
  encounterText.fontSize = 9;
  encounterText.fontWeight = 'bold';
  encounterText.color = '#ffaa00';
  encounterText.height = '14px';
  encounterText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  floorPanel.addControl(encounterText);

  const waveText = new TextBlock('waveInfo', '');
  waveText.fontFamily = FONT;
  waveText.fontSize = 10;
  waveText.fontWeight = 'bold';
  waveText.color = '#ff6644';
  waveText.height = '14px';
  waveText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  floorPanel.addControl(waveText);

  // Level / XP panel
  const lvlPanel = new StackPanel('lvlPanel');
  lvlPanel.isVertical = false;
  lvlPanel.width = '180px';
  lvlPanel.height = '24px';
  lvlPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  lvlPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
  lvlPanel.left = 20;
  lvlPanel.top = 90;
  lvlPanel.background = 'rgba(10, 5, 5, 0.75)';
  gui.addControl(lvlPanel);

  const levelText = new TextBlock('lvlText', 'LV 1');
  levelText.fontFamily = FONT;
  levelText.fontSize = 12;
  levelText.fontWeight = 'bold';
  levelText.color = '#aa88ff';
  levelText.width = '50px';
  levelText.paddingLeft = 6;
  lvlPanel.addControl(levelText);

  const xpOuter = new Rectangle('xpOuter');
  xpOuter.width = '60px';
  xpOuter.height = '8px';
  xpOuter.background = '#1a0520';
  xpOuter.thickness = 1;
  xpOuter.color = 'rgba(100, 50, 200, 0.25)';
  lvlPanel.addControl(xpOuter);

  const xpBarInner = new Rectangle('xpInner');
  xpBarInner.width = 0;
  xpBarInner.height = 1;
  xpBarInner.background = '#8855cc';
  xpBarInner.thickness = 0;
  xpBarInner.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  xpOuter.addControl(xpBarInner);

  const xpText = new TextBlock('xpText', '0/100');
  xpText.fontFamily = FONT;
  xpText.fontSize = 8;
  xpText.color = '#665588';
  xpText.width = '60px';
  xpText.paddingLeft = 4;
  lvlPanel.addControl(xpText);

  // Difficulty tags
  const diffRow = new StackPanel('diffRow');
  diffRow.isVertical = false;
  diffRow.width = '180px';
  diffRow.height = '16px';
  diffRow.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  diffRow.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
  diffRow.left = 20;
  diffRow.top = 118;
  gui.addControl(diffRow);

  const diffText = new TextBlock('diffTag', 'CONDEMNED');
  diffText.fontFamily = FONT;
  diffText.fontSize = 8;
  diffText.fontWeight = 'bold';
  diffText.color = '#887766';
  diffText.width = '80px';
  diffText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  diffRow.addControl(diffText);

  const nightmareText = new TextBlock('nightTag', '');
  nightmareText.fontFamily = FONT;
  nightmareText.fontSize = 8;
  nightmareText.fontWeight = 'bold';
  nightmareText.color = '#ff6600';
  nightmareText.width = '80px';
  nightmareText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  diffRow.addControl(nightmareText);

  // Level-up notification
  const levelUpText = new TextBlock('levelUp', '');
  levelUpText.fontFamily = FONT;
  levelUpText.fontSize = 28;
  levelUpText.fontWeight = 'bold';
  levelUpText.color = '#aa88ff';
  levelUpText.shadowColor = 'rgba(100, 50, 200, 0.6)';
  levelUpText.shadowBlur = 10;
  levelUpText.top = 80;
  levelUpText.isVisible = false;
  gui.addControl(levelUpText);

  return {
    scoreText, killsText, timeText,
    floorText, themeText, encounterText, waveText,
    levelText, xpBarInner, xpText,
    diffText, nightmareText,
    levelUpText,
    displayScore: 0, targetScore: 0,
    levelUpTimer: 0, lastLevel: 1,
  };
}

export function updateScoreDisplay(
  controls: ScoreDisplayControls,
  state: ReturnType<typeof useGameStore.getState>,
): ScoreDisplayControls {
  // Animated score
  controls.targetScore = state.score;
  if (controls.displayScore !== controls.targetScore) {
    const diff = controls.targetScore - controls.displayScore;
    const step = Math.max(1, Math.ceil(Math.abs(diff) / 8));
    controls.displayScore += diff > 0 ? Math.min(step, diff) : Math.max(-step, diff);
  }
  controls.scoreText.text = controls.displayScore.toLocaleString();
  controls.killsText.text = `KILLS ${state.kills}`;
  controls.timeText.text = formatTime(Date.now() - state.startTime);

  // Floor info
  const floor = state.stage.floor;
  const encounterType = state.stage.encounterType;
  const theme = getThemeForFloor(floor);

  controls.floorText.text = `FL ${floor}`;
  controls.themeText.text = theme.displayName;

  if (encounterType === 'arena') {
    controls.encounterText.text = 'ARENA';
    controls.encounterText.isVisible = true;
    const waveInfo = getWaveInfo();
    let waveStr = `WAVE ${waveInfo.wave}`;
    if (waveInfo.multiplier > 1) waveStr += ` x${waveInfo.multiplier.toFixed(1)}`;
    controls.waveText.text = waveStr;
    controls.waveText.isVisible = true;
  } else if (encounterType === 'boss') {
    controls.encounterText.text = 'BOSS';
    controls.encounterText.isVisible = true;
    controls.waveText.isVisible = false;
  } else {
    controls.encounterText.isVisible = false;
    controls.waveText.isVisible = false;
  }

  // Level / XP
  const lv = state.leveling;
  controls.levelText.text = `LV ${lv.level}`;
  controls.xpBarInner.width = lv.xpToNext > 0 ? lv.xp / lv.xpToNext : 0;
  controls.xpText.text = `${lv.xp}/${lv.xpToNext}`;

  // Difficulty tags
  controls.diffText.text = DIFFICULTY_PRESETS[state.difficulty].label.toUpperCase();
  controls.diffText.color = state.difficulty === 'hard' ? '#cc4400' : '#887766';

  if (state.nightmareFlags.ultraNightmare) {
    controls.nightmareText.text = 'ULTRA NIGHTMARE';
    controls.nightmareText.color = '#ff0000';
  } else if (state.nightmareFlags.nightmare) {
    controls.nightmareText.text = 'NIGHTMARE';
    controls.nightmareText.color = '#ff6600';
  } else if (state.nightmareFlags.permadeath) {
    controls.nightmareText.text = 'PERMADEATH';
    controls.nightmareText.color = '#880000';
  } else {
    controls.nightmareText.text = '';
  }

  // Level-up notification
  const currentLevel = lv.level;
  if (currentLevel > controls.lastLevel) {
    controls.lastLevel = currentLevel;
    const bonuses = getLevelBonuses(currentLevel);
    controls.levelUpText.text = `LEVEL ${currentLevel}  +${Math.round((bonuses.damageMult - 1) * 100)}% DMG  +${bonuses.maxHpBonus} HP`;
    controls.levelUpText.isVisible = true;
    controls.levelUpTimer = 120;
  }
  if (controls.levelUpTimer > 0) {
    controls.levelUpTimer--;
    controls.levelUpText.alpha = Math.min(1, controls.levelUpTimer / 30);
    if (controls.levelUpTimer <= 0) controls.levelUpText.isVisible = false;
  }

  return controls;
}
