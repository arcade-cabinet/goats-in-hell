/**
 * Babylon.js GUI screen overlays — replaces React Native DeathScreen, VictoryScreen,
 * PauseMenu, BossIntroScreen, GameCompleteScreen, and AutoplayOverlay.
 *
 * Uses AdvancedDynamicTexture in fullscreen mode for all overlay screens.
 * Shows/hides based on the current game screen state.
 */
import {Scene} from '@babylonjs/core';
import {
  AdvancedDynamicTexture,
  TextBlock,
  Rectangle,
  StackPanel,
  Button,
  Control,
} from '@babylonjs/gui';

import {useGameStore, DIFFICULTY_PRESETS, generateSeedPhrase} from '../../state/GameStore';
import type {GameScreen} from '../../state/GameStore';
import {playSound} from '../systems/AudioSystem';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FONT = 'Courier, monospace';

const BOSS_DISPLAY_NAMES: Record<string, string> = {
  infernoGoat: 'INFERNO GOAT',
  voidGoat: 'VOID GOAT',
  ironGoat: 'IRON GOAT',
  archGoat: 'ARCH GOAT',
};

const BOSS_TAUNTS: Record<string, string> = {
  infernoGoat: 'The flames hunger for your flesh...',
  voidGoat: 'Step into the nothing...',
  ironGoat: 'Your weapons are useless here...',
  archGoat: 'Kneel before the horned throne...',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(startTime: number): string {
  const elapsed = Date.now() - startTime;
  const totalSec = Math.floor(elapsed / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return min > 0 ? `${min}m ${sec}s` : `${sec}s`;
}

function makeText(
  name: string,
  text: string,
  fontSize: number,
  color: string,
  opts?: {bold?: boolean; height?: string; shadow?: boolean},
): TextBlock {
  const tb = new TextBlock(name, text);
  tb.fontFamily = FONT;
  tb.fontSize = fontSize;
  tb.color = color;
  if (opts?.bold) tb.fontWeight = 'bold';
  if (opts?.height) tb.height = opts.height;
  if (opts?.shadow) {
    tb.shadowColor = color.replace(/[^,]+\)/, '0.5)').replace('#', 'rgba(');
    tb.shadowBlur = 8;
  }
  return tb;
}

function makeButton(
  name: string,
  label: string,
  fontSize: number,
  color: string,
  bgColor: string,
  borderColor: string,
  width: string,
  height: string,
  onClick: () => void,
): Button {
  const btn = Button.CreateSimpleButton(name, label);
  btn.width = width;
  btn.height = height;
  btn.color = color;
  btn.background = bgColor;
  btn.thickness = 2;
  btn.cornerRadius = 0;
  btn.fontFamily = FONT;
  btn.fontSize = fontSize;
  btn.hoverCursor = 'pointer';

  // Find the textblock inside the button and make it bold
  const textBlock = btn.children[0] as TextBlock;
  if (textBlock) {
    textBlock.fontWeight = 'bold';
    textBlock.fontFamily = FONT;
  }

  btn.onPointerClickObservable.add(onClick);
  return btn;
}

function makeStatRow(
  parent: StackPanel,
  label: string,
  value: string,
  valueColor = '#ccbbaa',
  index: number = 0,
): void {
  const row = new StackPanel(`statRow-${index}`);
  row.isVertical = false;
  row.height = '26px';
  row.width = 1;
  parent.addControl(row);

  const labelText = new TextBlock(`statLabel-${index}`, label);
  labelText.fontFamily = FONT;
  labelText.fontSize = 11;
  labelText.color = '#887766';
  labelText.width = 0.55;
  labelText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  labelText.paddingLeft = 10;
  row.addControl(labelText);

  const valueText = new TextBlock(`statValue-${index}`, value);
  valueText.fontFamily = FONT;
  valueText.fontSize = 15;
  valueText.fontWeight = 'bold';
  valueText.color = valueColor;
  valueText.width = 0.45;
  valueText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
  valueText.paddingRight = 10;
  row.addControl(valueText);

  // Separator
  const sep = new Rectangle(`statSep-${index}`);
  sep.width = 0.9;
  sep.height = '1px';
  sep.background = 'rgba(204, 0, 0, 0.08)';
  sep.thickness = 0;
  parent.addControl(sep);
}

// ---------------------------------------------------------------------------
// BabylonScreens class
// ---------------------------------------------------------------------------

export class BabylonScreens {
  private gui: AdvancedDynamicTexture;
  private currentScreen: GameScreen | null = null;

  // Fade transition
  private fadeRect: Rectangle;
  private fadeAlpha = 0;
  private fadeDir: 'in' | 'out' | 'none' = 'none'; // in = black→clear, out = clear→black
  private pendingScreen: GameScreen | null = null;

  constructor(scene: Scene) {
    this.gui = AdvancedDynamicTexture.CreateFullscreenUI('Screens', true, scene);
    this.gui.idealHeight = 900;
    this.gui.renderAtIdealSize = true;
    this.gui.rootContainer.isVisible = false;

    // Full-screen fade overlay — hellfire themed, not plain black
    this.fadeRect = new Rectangle('screenFade');
    this.fadeRect.width = 1;
    this.fadeRect.height = 1;
    this.fadeRect.background = '#1a0000'; // deep blood red
    this.fadeRect.thickness = 0;
    this.fadeRect.alpha = 0;
    this.fadeRect.isVisible = false;
    this.fadeRect.isPointerBlocker = false;
    this.fadeRect.zIndex = 100;
  }

  update(): void {
    const screen = useGameStore.getState().screen;

    // Animate fade
    if (this.fadeDir === 'out') {
      this.fadeAlpha = Math.min(1, this.fadeAlpha + 0.06);
      this.fadeRect.alpha = this.fadeAlpha;
      this.fadeRect.isVisible = true;
      if (this.fadeAlpha >= 1 && this.pendingScreen) {
        // Fully black — switch screen content
        this.rebuildScreen(this.pendingScreen);
        this.pendingScreen = null;
        this.fadeDir = 'in';
      }
      return;
    }
    if (this.fadeDir === 'in') {
      this.fadeAlpha = Math.max(0, this.fadeAlpha - 0.04);
      this.fadeRect.alpha = this.fadeAlpha;
      if (this.fadeAlpha <= 0) {
        this.fadeRect.isVisible = false;
        this.fadeDir = 'none';
      }
      return;
    }

    // Only show for specific screens
    const overlayScreens: GameScreen[] = ['dead', 'victory', 'paused', 'bossIntro', 'gameComplete', 'loading'];
    const shouldShow = overlayScreens.includes(screen);

    if (!shouldShow) {
      if (this.currentScreen !== null) {
        // Transitioning away from an overlay — fade out then clear
        this.currentScreen = null;
        this.gui.rootContainer.clearControls();
        this.gui.rootContainer.isVisible = false;
      }
      return;
    }

    // If screen changed, start fade transition
    if (screen !== this.currentScreen) {
      // Thematic fade color based on destination screen
      this.fadeRect.background = this.getTransitionColor(screen);

      if (this.currentScreen === null) {
        // First overlay — fade in
        this.rebuildScreen(screen);
        this.fadeAlpha = 1;
        this.fadeDir = 'in';
        this.fadeRect.alpha = 1;
        this.fadeRect.isVisible = true;
        this.gui.rootContainer.addControl(this.fadeRect);
      } else {
        // Switching between overlays — fade out, switch, fade in
        this.pendingScreen = screen;
        this.fadeDir = 'out';
        this.fadeAlpha = 0;
        // Ensure fadeRect is on top
        this.gui.rootContainer.removeControl(this.fadeRect);
        this.gui.rootContainer.addControl(this.fadeRect);
      }
    }
  }

  /** Returns a thematic fade color per screen type. */
  private getTransitionColor(screen: GameScreen): string {
    switch (screen) {
      case 'dead': return '#2a0000';        // blood red darkness
      case 'victory': return '#1a0800';     // smoldering ember
      case 'bossIntro': return '#0a0018';   // void purple
      case 'gameComplete': return '#1a1000'; // golden hellfire
      case 'paused': return '#0a0a0a';       // dim smoke
      case 'loading': return '#0a0000';     // deep darkness
      default: return '#1a0000';
    }
  }

  private rebuildScreen(screen: GameScreen): void {
    this.gui.rootContainer.clearControls();
    this.currentScreen = screen;
    this.buildScreen(screen);
    this.gui.rootContainer.isVisible = true;
    // Re-add fade rect on top
    this.gui.rootContainer.addControl(this.fadeRect);

    // Play screen-appropriate audio sting
    switch (screen) {
      case 'dead': playSound('death_sting'); break;
      case 'victory': playSound('victory_sting'); break;
      case 'gameComplete': playSound('game_complete'); break;
    }
  }

  private buildScreen(screen: GameScreen): void {
    switch (screen) {
      case 'dead':
        this.buildDeathScreen();
        break;
      case 'victory':
        this.buildVictoryScreen();
        break;
      case 'paused':
        this.buildPauseScreen();
        break;
      case 'bossIntro':
        this.buildBossIntroScreen();
        break;
      case 'gameComplete':
        this.buildGameCompleteScreen();
        break;
      case 'loading':
        this.buildLoadingScreen();
        break;
    }
  }

  // =========================================================================
  // Death Screen
  // =========================================================================

  private buildDeathScreen(): void {
    const state = useGameStore.getState();
    const isPermadeath = state.nightmareFlags.permadeath || state.nightmareFlags.ultraNightmare;

    // Dark red overlay
    const overlay = new Rectangle('deathOverlay');
    overlay.width = 1;
    overlay.height = 1;
    overlay.background = 'rgba(40, 0, 0, 0.92)';
    overlay.thickness = 0;
    this.gui.addControl(overlay);

    // Content panel
    const panel = new StackPanel('deathContent');
    panel.width = '400px';
    panel.adaptHeightToChildren = true;
    this.gui.addControl(panel);

    // Title
    const title = makeText('deathTitle', 'YOU DIED', 52, '#cc0000', {bold: true, height: '70px', shadow: true});
    panel.addControl(title);

    // Subtitle
    const sub = makeText('deathSub', 'The goats have claimed your soul...', 13, '#884433', {height: '24px'});
    panel.addControl(sub);

    // Spacer
    const spacer = new Rectangle('sp1');
    spacer.height = '20px';
    spacer.thickness = 0;
    spacer.background = 'transparent';
    panel.addControl(spacer);

    // Stats
    const statsPanel = new StackPanel('deathStats');
    statsPanel.width = '320px';
    statsPanel.adaptHeightToChildren = true;
    statsPanel.background = 'rgba(10, 5, 5, 0.6)';
    panel.addControl(statsPanel);

    const divTop = new Rectangle('divTop');
    divTop.width = 0.9;
    divTop.height = '1px';
    divTop.background = 'rgba(204, 0, 0, 0.2)';
    divTop.thickness = 0;
    statsPanel.addControl(divTop);

    makeStatRow(statsPanel, 'SCORE', state.score.toLocaleString(), '#ccbbaa', 0);
    makeStatRow(statsPanel, 'TOTAL KILLS', `${state.totalKills}`, '#ccbbaa', 1);
    makeStatRow(statsPanel, 'FLOOR REACHED', `${state.stage.floor}`, '#ccbbaa', 2);
    makeStatRow(statsPanel, 'TIME SURVIVED', formatTime(state.startTime), '#ccbbaa', 3);
    makeStatRow(statsPanel, 'LEVEL REACHED', `${state.leveling.level}`, '#aa88ff', 4);

    const divBot = new Rectangle('divBot');
    divBot.width = 0.9;
    divBot.height = '1px';
    divBot.background = 'rgba(204, 0, 0, 0.2)';
    divBot.thickness = 0;
    statsPanel.addControl(divBot);

    // Spacer
    const spacer2 = new Rectangle('sp2');
    spacer2.height = '24px';
    spacer2.thickness = 0;
    spacer2.background = 'transparent';
    panel.addControl(spacer2);

    // Buttons
    if (!isPermadeath) {
      const retryBtn = makeButton(
        'retryBtn', 'TRY AGAIN', 20, '#cc0000', 'rgba(204, 0, 0, 0.1)', '#cc0000',
        '260px', '50px',
        () => {
          const s = useGameStore.getState();
          s.startNewGame(s.difficulty, s.nightmareFlags, s.seed);
        },
      );
      panel.addControl(retryBtn);
    } else {
      const permaText = makeText('permaText', 'PERMADEATH — NO SECOND CHANCES', 13, '#880000', {bold: true, height: '30px'});
      panel.addControl(permaText);
    }

    const spacer3 = new Rectangle('sp3');
    spacer3.height = '10px';
    spacer3.thickness = 0;
    spacer3.background = 'transparent';
    panel.addControl(spacer3);

    const quitBtn = makeButton(
      'quitBtn', 'QUIT TO MENU', 13, '#776655', 'transparent', '#554433',
      '200px', '40px',
      () => useGameStore.getState().resetToMenu(),
    );
    panel.addControl(quitBtn);
  }

  // =========================================================================
  // Victory Screen
  // =========================================================================

  private buildVictoryScreen(): void {
    const state = useGameStore.getState();
    const elapsed = Date.now() - state.startTime;
    const FAST_CLEAR_TIME = 60000;
    const FAST_CLEAR_BONUS = 500;
    const isFastClear = elapsed < FAST_CLEAR_TIME;

    // Dark overlay
    const overlay = new Rectangle('vicOverlay');
    overlay.width = 1;
    overlay.height = 1;
    overlay.background = 'rgba(0, 10, 5, 0.88)';
    overlay.thickness = 0;
    this.gui.addControl(overlay);

    const panel = new StackPanel('vicContent');
    panel.width = '400px';
    panel.adaptHeightToChildren = true;
    this.gui.addControl(panel);

    // Title
    const title = makeText('vicTitle', 'FLOOR CLEARED', 36, '#44ff44', {bold: true, height: '50px', shadow: true});
    panel.addControl(title);

    // Floor number
    const floorText = makeText('vicFloor', `Floor ${state.stage.floor} Complete`, 14, '#448844', {height: '24px'});
    panel.addControl(floorText);

    // Fast clear bonus
    if (isFastClear) {
      const bonusText = makeText('vicBonus', `FAST CLEAR +${FAST_CLEAR_BONUS}`, 14, '#ffcc00', {bold: true, height: '24px'});
      panel.addControl(bonusText);
    }

    // Spacer
    const spacer = new Rectangle('vsp1');
    spacer.height = '20px';
    spacer.thickness = 0;
    spacer.background = 'transparent';
    panel.addControl(spacer);

    // Stats
    const statsPanel = new StackPanel('vicStats');
    statsPanel.width = '280px';
    statsPanel.adaptHeightToChildren = true;
    statsPanel.background = 'rgba(0, 10, 5, 0.5)';
    panel.addControl(statsPanel);

    makeStatRow(statsPanel, 'KILLS', `${state.kills}`, '#ccbbaa', 0);
    makeStatRow(statsPanel, 'SCORE', state.score.toLocaleString(), '#ffcc00', 1);
    makeStatRow(statsPanel, 'TIME', formatTime(state.startTime), '#ccbbaa', 2);

    const spacer2 = new Rectangle('vsp2');
    spacer2.height = '24px';
    spacer2.thickness = 0;
    spacer2.background = 'transparent';
    panel.addControl(spacer2);

    // Descend button
    const descendBtn = makeButton(
      'descendBtn', 'DESCEND DEEPER', 18, '#44ff44', 'rgba(68, 255, 68, 0.08)', '#44ff44',
      '260px', '50px',
      () => {
        const s = useGameStore.getState();
        const bonus = isFastClear ? FAST_CLEAR_BONUS : 0;
        if (bonus > 0) {
          s.patch({score: s.score + bonus});
        }
        s.advanceStage();
        const nextScreen = useGameStore.getState().screen;
        // Don't override if advanceStage() set gameComplete or bossIntro
        if (nextScreen !== 'bossIntro' && nextScreen !== 'gameComplete') {
          s.patch({screen: 'playing', startTime: Date.now()});
        }
      },
    );
    panel.addControl(descendBtn);
  }

  // =========================================================================
  // Pause Screen
  // =========================================================================

  private buildPauseScreen(): void {
    const overlay = new Rectangle('pauseOverlay');
    overlay.width = 1;
    overlay.height = 1;
    overlay.background = 'rgba(0, 0, 0, 0.8)';
    overlay.thickness = 0;
    this.gui.addControl(overlay);

    const panel = new StackPanel('pauseContent');
    panel.width = '340px';
    panel.adaptHeightToChildren = true;
    this.gui.addControl(panel);

    const title = makeText('pauseTitle', 'PAUSED', 40, '#cc0000', {bold: true, height: '60px'});
    panel.addControl(title);

    const spacer = new Rectangle('psp1');
    spacer.height = '20px';
    spacer.thickness = 0;
    spacer.background = 'transparent';
    panel.addControl(spacer);

    // Controls reference
    const controls = [
      ['WASD', 'Move'],
      ['MOUSE', 'Look'],
      ['CLICK', 'Fire'],
      ['R', 'Reload'],
      ['1-4', 'Switch Weapon'],
      ['SHIFT', 'Sprint'],
      ['ESC', 'Resume'],
    ];

    const controlsPanel = new StackPanel('controlsPanel');
    controlsPanel.width = '260px';
    controlsPanel.adaptHeightToChildren = true;
    controlsPanel.background = 'rgba(10, 5, 5, 0.5)';
    panel.addControl(controlsPanel);

    const controlsTitle = makeText('ctrlTitle', 'CONTROLS', 11, '#887766', {bold: true, height: '24px'});
    controlsPanel.addControl(controlsTitle);

    controls.forEach(([key, desc], i) => {
      const row = new StackPanel(`ctrl-${i}`);
      row.isVertical = false;
      row.height = '22px';
      row.width = 1;
      controlsPanel.addControl(row);

      const keyText = new TextBlock(`ctrlKey-${i}`, key);
      keyText.fontFamily = FONT;
      keyText.fontSize = 11;
      keyText.fontWeight = 'bold';
      keyText.color = '#cc0000';
      keyText.width = 0.4;
      keyText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
      keyText.paddingRight = 10;
      row.addControl(keyText);

      const descText = new TextBlock(`ctrlDesc-${i}`, desc);
      descText.fontFamily = FONT;
      descText.fontSize = 11;
      descText.color = '#887766';
      descText.width = 0.6;
      descText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
      row.addControl(descText);
    });

    const spacer2 = new Rectangle('psp2');
    spacer2.height = '24px';
    spacer2.thickness = 0;
    spacer2.background = 'transparent';
    panel.addControl(spacer2);

    const resumeBtn = makeButton(
      'resumeBtn', 'RESUME', 18, '#cc0000', 'rgba(204, 0, 0, 0.08)', '#cc0000',
      '200px', '44px',
      () => useGameStore.getState().patch({screen: 'playing'}),
    );
    panel.addControl(resumeBtn);

    const spacer3 = new Rectangle('psp3');
    spacer3.height = '10px';
    spacer3.thickness = 0;
    spacer3.background = 'transparent';
    panel.addControl(spacer3);

    const quitBtn = makeButton(
      'pauseQuitBtn', 'QUIT TO MENU', 13, '#776655', 'transparent', '#554433',
      '200px', '36px',
      () => useGameStore.getState().resetToMenu(),
    );
    panel.addControl(quitBtn);
  }

  // =========================================================================
  // Boss Intro Screen
  // =========================================================================

  private buildBossIntroScreen(): void {
    const state = useGameStore.getState();
    const bossId = state.stage.bossId ?? 'archGoat';
    const bossName = BOSS_DISPLAY_NAMES[bossId] ?? 'UNKNOWN HORROR';
    const taunt = BOSS_TAUNTS[bossId] ?? 'Prepare yourself...';

    const overlay = new Rectangle('bossOverlay');
    overlay.width = 1;
    overlay.height = 1;
    overlay.background = 'rgba(20, 0, 0, 0.9)';
    overlay.thickness = 0;
    this.gui.addControl(overlay);

    const panel = new StackPanel('bossContent');
    panel.width = '400px';
    panel.adaptHeightToChildren = true;
    this.gui.addControl(panel);

    const warningText = makeText('bossWarn', 'WARNING', 14, '#ff6600', {bold: true, height: '24px'});
    panel.addControl(warningText);

    const spacer = new Rectangle('bsp1');
    spacer.height = '16px';
    spacer.thickness = 0;
    spacer.background = 'transparent';
    panel.addControl(spacer);

    const name = makeText('bossNameBig', bossName, 44, '#cc0000', {bold: true, height: '60px', shadow: true});
    panel.addControl(name);

    const tauntText = makeText('bossTaunt', `"${taunt}"`, 13, '#884433', {height: '24px'});
    panel.addControl(tauntText);

    const spacer2 = new Rectangle('bsp2');
    spacer2.height = '10px';
    spacer2.thickness = 0;
    spacer2.background = 'transparent';
    panel.addControl(spacer2);

    const floorText = makeText('bossFloor', `Floor ${state.stage.floor}`, 12, '#665544', {height: '20px'});
    panel.addControl(floorText);

    const spacer3 = new Rectangle('bsp3');
    spacer3.height = '30px';
    spacer3.thickness = 0;
    spacer3.background = 'transparent';
    panel.addControl(spacer3);

    const fightBtn = makeButton(
      'fightBtn', 'FIGHT', 22, '#cc0000', 'rgba(204, 0, 0, 0.1)', '#cc0000',
      '200px', '54px',
      () => useGameStore.getState().patch({screen: 'playing', startTime: Date.now()}),
    );
    panel.addControl(fightBtn);
  }

  // =========================================================================
  // Game Complete Screen
  // =========================================================================

  private buildGameCompleteScreen(): void {
    const state = useGameStore.getState();
    const diffLabel = DIFFICULTY_PRESETS[state.difficulty].label;
    const isNightmare = state.nightmareFlags.nightmare || state.nightmareFlags.ultraNightmare;

    const overlay = new Rectangle('gcOverlay');
    overlay.width = 1;
    overlay.height = 1;
    overlay.background = 'rgba(0, 8, 20, 0.95)';
    overlay.thickness = 0;
    this.gui.addControl(overlay);

    const panel = new StackPanel('gcContent');
    panel.width = '400px';
    panel.adaptHeightToChildren = true;
    this.gui.addControl(panel);

    const title = makeText('gcTitle', 'YOU ESCAPED', 44, '#ffcc33', {bold: true, height: '60px', shadow: true});
    panel.addControl(title);

    const sub = makeText('gcSub', 'The gates of Hell close behind you...', 13, '#887744', {height: '24px'});
    panel.addControl(sub);

    const spacer = new Rectangle('gcsp1');
    spacer.height = '20px';
    spacer.thickness = 0;
    spacer.background = 'transparent';
    panel.addControl(spacer);

    const statsPanel = new StackPanel('gcStats');
    statsPanel.width = '320px';
    statsPanel.adaptHeightToChildren = true;
    statsPanel.background = 'rgba(10, 15, 25, 0.5)';
    panel.addControl(statsPanel);

    makeStatRow(statsPanel, 'FINAL SCORE', state.score.toLocaleString(), '#ffcc33', 0);
    makeStatRow(statsPanel, 'TOTAL KILLS', `${state.totalKills}`, '#ccbbaa', 1);
    makeStatRow(statsPanel, 'FLOORS CLEARED', `${state.stage.floor}`, '#ccbbaa', 2);
    makeStatRow(statsPanel, 'LEVEL REACHED', `${state.leveling.level}`, '#aa88ff', 3);
    makeStatRow(statsPanel, 'PLAYTIME', formatTime(state.startTime), '#ccbbaa', 4);
    makeStatRow(statsPanel, 'DIFFICULTY', diffLabel.toUpperCase(), '#ccbbaa', 5);
    makeStatRow(statsPanel, 'BOSSES SLAIN', `${state.bossesDefeated.length}`, '#ffcc33', 6);

    if (isNightmare) {
      const modeLabel = state.nightmareFlags.ultraNightmare ? 'ULTRA NIGHTMARE' : 'NIGHTMARE';
      makeStatRow(statsPanel, 'MODE', modeLabel, '#ff4444', 7);
    }

    const spacer2 = new Rectangle('gcsp2');
    spacer2.height = '24px';
    spacer2.thickness = 0;
    spacer2.background = 'transparent';
    panel.addControl(spacer2);

    const returnBtn = makeButton(
      'returnBtn', 'RETURN TO THE SURFACE', 16, '#ffcc33', 'rgba(255, 200, 50, 0.06)', '#ffcc33',
      '320px', '50px',
      () => useGameStore.getState().resetToMenu(),
    );
    panel.addControl(returnBtn);
  }

  // =========================================================================
  // =========================================================================
  // Loading Screen
  // =========================================================================

  private buildLoadingScreen(): void {
    // Background
    const bg = new Rectangle('loadBg');
    bg.width = 1;
    bg.height = 1;
    bg.background = '#0a0000';
    bg.thickness = 0;
    this.gui.rootContainer.addControl(bg);

    const panel = new StackPanel('loadPanel');
    panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    panel.width = '400px';
    this.gui.rootContainer.addControl(panel);

    // Title
    panel.addControl(
      makeText('loadTitle', 'DESCENDING INTO HELL...', 28, '#cc3300', {bold: true, height: '60px'}),
    );

    // Progress bar container
    const barBg = new Rectangle('loadBarBg');
    barBg.width = '300px';
    barBg.height = '20px';
    barBg.background = '#1a0000';
    barBg.thickness = 1;
    barBg.color = '#660000';
    barBg.cornerRadius = 0;
    panel.addControl(barBg);

    // Animated progress bar fill
    const barFill = new Rectangle('loadBarFill');
    barFill.width = 0;
    barFill.height = 1;
    barFill.background = '#cc3300';
    barFill.thickness = 0;
    barFill.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    barBg.addControl(barFill);

    // Subtle animation: pulse the bar width
    let phase = 0;
    const scene = this.gui.getScene();
    if (scene) {
      const obs = scene.onBeforeRenderObservable.add(() => {
        phase += 0.03;
        const progress = Math.min(1, 0.3 + Math.sin(phase) * 0.15 + phase * 0.05);
        barFill.width = progress;
        if (progress >= 1) {
          scene.onBeforeRenderObservable.remove(obs);
        }
      });
    }

    // Flavor text
    panel.addControl(
      makeText('loadFlavor', 'Forging instruments of damnation...', 12, '#664422', {height: '40px'}),
    );
  }

  // =========================================================================
  // Disposal
  // =========================================================================

  dispose(): void {
    this.gui.dispose();
  }
}
