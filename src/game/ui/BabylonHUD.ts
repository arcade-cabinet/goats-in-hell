/**
 * Babylon.js GUI HUD — replaces the React Native HUD overlay.
 *
 * Uses AdvancedDynamicTexture for all screen-space UI elements:
 * health bar, ammo, crosshair, floor info, score, weapon slots, XP bar,
 * wave info, boss health bar, minimap, low-HP vignette.
 */
import {Scene} from '@babylonjs/core';
import {
  AdvancedDynamicTexture,
  TextBlock,
  Rectangle,
  StackPanel,
  Control,
  Ellipse,
  Image as GuiImage,
} from '@babylonjs/gui';

import {world} from '../entities/world';
import {weapons} from '../weapons/weapons';
import {getThemeForFloor} from '../levels/FloorThemes';
import {getWaveInfo} from '../systems/WaveSystem';
import {getActiveLevel} from '../levels/activeLevelRef';
import {CELL_SIZE, MapCell} from '../levels/LevelGenerator';
import {useGameStore, DIFFICULTY_PRESETS, getLevelBonuses} from '../../state/GameStore';
import {GameState} from '../../state/GameState';
import type {Entity, WeaponId} from '../entities/components';
import {getGameTime} from '../systems/GameClock';
import {getAnnouncement} from '../systems/KillStreakSystem';
import {getActiveBuffs} from '../systems/PowerUpSystem';
import {getHeadshotTimer, tickHeadshotTimer} from '../weapons/WeaponSystem';
import {getLoreEntries} from '../rendering/LoreMessages';
import {getSecretNotifyTimer, tickSecretTimer} from '../systems/SecretRoomSystem';
import {Vector3} from '@babylonjs/core';

// ---------------------------------------------------------------------------
// Damage direction indicator — module-level state
// ---------------------------------------------------------------------------

/** Directions: 0=front, 1=right, 2=back, 3=left. Intensity decays each frame. */
const damageIndicators = [0, 0, 0, 0]; // front, right, back, left
const INDICATOR_DECAY = 0.97;

/**
 * Register a damage hit from a world-space source position.
 * Call this from any system that damages the player.
 */
export function registerDamageDirection(sourcePos: Vector3): void {
  // We need the camera to compute relative direction — defer to update if unavailable
  pendingDamageSources.push(sourcePos.clone());
}

const pendingDamageSources: Vector3[] = [];

// ---------------------------------------------------------------------------
// Blood splatter callback — set by HUD, called by combat/hazard systems
// ---------------------------------------------------------------------------

let bloodSplatterCallback: ((intensity: number) => void) | null = null;

/** Trigger blood splatter effect from any system. Intensity 0-1. */
export function triggerBloodSplatter(intensity: number): void {
  if (bloodSplatterCallback) bloodSplatterCallback(intensity);
}

/** Reset damage indicators between floors. */
export function resetDamageIndicators(): void {
  damageIndicators[0] = damageIndicators[1] = damageIndicators[2] = damageIndicators[3] = 0;
  pendingDamageSources.length = 0;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FONT = 'Courier, monospace';
const BOSS_TYPES = new Set(['archGoat', 'infernoGoat', 'voidGoat', 'ironGoat']);
const BOSS_DISPLAY_NAMES: Record<string, string> = {
  infernoGoat: 'INFERNO GOAT',
  voidGoat: 'VOID GOAT',
  ironGoat: 'IRON GOAT',
  archGoat: 'ARCH GOAT',
};

// Boss phase transition tracking
let bossPhase2Triggered = false;
let bossBarFlashTimer = 0; // frames of flash remaining

/** Reset boss phase tracking (call on floor transition). */
export function resetBossPhase(): void {
  bossPhase2Triggered = false;
  bossBarFlashTimer = 0;
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function getPlayer(): Entity | undefined {
  return world.entities.find(e => e.type === 'player');
}

function getHealthColor(ratio: number): string {
  if (ratio > 0.6) return '#44ff44';
  if (ratio > 0.35) return '#ffcc00';
  if (ratio > 0.15) return '#ff6600';
  return '#ff2200';
}

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// BabylonHUD class
// ---------------------------------------------------------------------------

export class BabylonHUD {
  private gui: AdvancedDynamicTexture;

  // Health bar
  private healthBarInner!: Rectangle;
  private healthLabel!: TextBlock;
  private healthValueText!: TextBlock;

  // Ammo
  private ammoText!: TextBlock;
  private weaponNameText!: TextBlock;
  private reloadBarOuter!: Rectangle;
  private reloadBarInner!: Rectangle;
  private reloadText!: TextBlock;
  private ammoContainer!: StackPanel;
  private reloadContainer!: StackPanel;

  // Crosshair arms
  private crosshairTop!: Rectangle;
  private crosshairBottom!: Rectangle;
  private crosshairLeft!: Rectangle;
  private crosshairRight!: Rectangle;
  private crosshairDot!: Ellipse;

  // Floor / encounter
  private floorText!: TextBlock;
  private themeText!: TextBlock;
  private encounterText!: TextBlock;
  private waveText!: TextBlock;

  // Score / kills / time
  private scoreText!: TextBlock;
  private killsText!: TextBlock;
  private timeText!: TextBlock;

  // Level / XP
  private levelText!: TextBlock;
  private xpBarInner!: Rectangle;
  private xpText!: TextBlock;

  // Difficulty tags
  private diffText!: TextBlock;
  private nightmareText!: TextBlock;

  // Weapon slots
  private weaponSlots!: Rectangle[];

  // Boss health bar
  private bossContainer!: StackPanel;
  private bossNameText!: TextBlock;
  private bossBarInner!: Rectangle;
  private bossHpText!: TextBlock;

  // Low HP vignette
  private vignette!: Rectangle;

  // Minimap
  private minimapContainer!: Rectangle;
  private minimapImage!: GuiImage;
  private minimapCanvas: HTMLCanvasElement | null = null;
  private minimapCtx: CanvasRenderingContext2D | null = null;
  private minimapLastUpdate = 0;

  // Autoplay debug panel
  private autoplayContainer!: StackPanel;
  private autoplayStateText!: TextBlock;
  private autoplayTargetText!: TextBlock;
  private autoplayWeaponText!: TextBlock;
  private autoplaySteerText!: TextBlock;
  private autoplayStateColors: Record<string, string> = {};

  // Level-up notification
  private levelUpText!: TextBlock;
  private levelUpTimer = 0;
  private lastLevel = 1;

  // Kill confirmation / streak
  private killText!: TextBlock;
  private killTimer = 0;
  private streakText!: TextBlock;
  private streakTimer = 0;
  private lastKills = 0;
  private streakCount = 0;
  private lastKillTime = 0;

  // Headshot notification
  private headshotText!: TextBlock;

  // Active power-up buff icons
  private buffTexts: TextBlock[] = [];

  // Weapon pickup notification
  private weaponPickupText!: TextBlock;
  private weaponPickupTimer = 0;
  private lastWeaponCount = 1;

  // Animated score
  private displayScore = 0;
  private targetScore = 0;

  // Tutorial hints
  private tutorialText!: TextBlock;
  private tutorialTimer = 0;
  private shownHints: Set<string> = new Set();
  private tutorialFrameCount = 0;

  // Floor announcement (centered, fades out)
  private floorAnnounceText!: TextBlock;
  private floorAnnounceSubText!: TextBlock;
  private floorAnnounceTimer = 0;
  private lastAnnouncedFloor = 0;

  // Damage direction indicators (front, right, back, left)
  private damageArcs: Rectangle[] = [];

  // Lore proximity overlay
  private loreOverlay!: Rectangle;
  private loreHeaderText!: TextBlock;
  private loreBodyText!: TextBlock;
  private lorePromptText!: TextBlock;
  private loreVisible = false;

  // Secret room notification
  private secretText!: TextBlock;

  // Blood splatter overlay
  private bloodSplatter!: Rectangle;
  private bloodAlpha = 0;

  constructor(scene: Scene) {
    this.gui = AdvancedDynamicTexture.CreateFullscreenUI('HUD', true, scene);
    this.gui.idealHeight = 900;
    this.gui.renderAtIdealSize = true;

    this.createVignette();
    this.createHealthBar();
    this.createAmmoDisplay();
    this.createCrosshair();
    this.createFloorInfo();
    this.createScoreDisplay();
    this.createLevelXP();
    this.createDiffTags();
    this.createWeaponSlots();
    this.createBossBar();
    this.createMinimap();
    this.createAutoplayPanel();
    this.createLevelUpNotification();
    this.createKillFeedback();
    this.createWeaponPickupNotification();
    this.createTutorialHints();
    this.createDamageDirectionIndicators();
    this.createFloorAnnouncement();
    this.createHeadshotNotification();
    this.createLoreOverlay();
    this.createSecretNotification();
    this.createBloodSplatter();

    // Register blood splatter callback so combat systems can trigger it
    bloodSplatterCallback = (intensity: number) => this.triggerBloodSplatter(intensity);
  }

  // =========================================================================
  // Construction
  // =========================================================================

  private createVignette(): void {
    this.vignette = new Rectangle('vignette');
    this.vignette.width = 1;
    this.vignette.height = 1;
    this.vignette.thickness = 40;
    this.vignette.color = 'rgba(200, 0, 0, 0.25)';
    this.vignette.background = 'transparent';
    this.vignette.isVisible = false;
    this.gui.addControl(this.vignette);
  }

  private createHealthBar(): void {
    const panel = new StackPanel('healthPanel');
    panel.width = '240px';
    panel.height = '60px';
    panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    panel.left = 20;
    panel.top = -20;
    panel.background = 'rgba(10, 5, 5, 0.75)';
    this.gui.addControl(panel);

    // Bar outline
    const barOuter = new Rectangle('hpBarOuter');
    barOuter.width = '210px';
    barOuter.height = '16px';
    barOuter.background = '#1a0505';
    barOuter.thickness = 1;
    barOuter.color = 'rgba(204, 0, 0, 0.25)';
    barOuter.paddingTop = 8;
    panel.addControl(barOuter);

    this.healthBarInner = new Rectangle('hpBarInner');
    this.healthBarInner.width = 1;
    this.healthBarInner.height = 1;
    this.healthBarInner.background = '#44ff44';
    this.healthBarInner.thickness = 0;
    this.healthBarInner.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    barOuter.addControl(this.healthBarInner);

    // Tick marks
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

    // HP text row
    const textRow = new StackPanel('hpTextRow');
    textRow.isVertical = false;
    textRow.height = '24px';
    textRow.paddingTop = 4;
    panel.addControl(textRow);

    this.healthLabel = new TextBlock('hpLabel', 'HP');
    this.healthLabel.fontFamily = FONT;
    this.healthLabel.fontSize = 12;
    this.healthLabel.color = '#44ff44';
    this.healthLabel.fontWeight = 'bold';
    this.healthLabel.width = '40px';
    this.healthLabel.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.healthLabel.paddingLeft = 6;
    textRow.addControl(this.healthLabel);

    this.healthValueText = new TextBlock('hpValue', '100/100');
    this.healthValueText.fontFamily = FONT;
    this.healthValueText.fontSize = 16;
    this.healthValueText.color = '#ccbbaa';
    this.healthValueText.fontWeight = 'bold';
    this.healthValueText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    textRow.addControl(this.healthValueText);
  }

  private createAmmoDisplay(): void {
    // Ammo container
    this.ammoContainer = new StackPanel('ammoPanel');
    this.ammoContainer.width = '200px';
    this.ammoContainer.height = '70px';
    this.ammoContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.ammoContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    this.ammoContainer.left = -20;
    this.ammoContainer.top = -20;
    this.ammoContainer.background = 'rgba(10, 5, 5, 0.75)';
    this.gui.addControl(this.ammoContainer);

    this.ammoText = new TextBlock('ammoText', '30/30 | 120');
    this.ammoText.fontFamily = FONT;
    this.ammoText.fontSize = 22;
    this.ammoText.color = '#ffffff';
    this.ammoText.fontWeight = 'bold';
    this.ammoText.height = '36px';
    this.ammoText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.ammoText.paddingRight = 10;
    this.ammoContainer.addControl(this.ammoText);

    this.weaponNameText = new TextBlock('weaponName', 'HELL PISTOL');
    this.weaponNameText.fontFamily = FONT;
    this.weaponNameText.fontSize = 10;
    this.weaponNameText.color = '#cc0000';
    this.weaponNameText.height = '16px';
    this.weaponNameText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.weaponNameText.paddingRight = 10;
    this.ammoContainer.addControl(this.weaponNameText);

    // Reload overlay (shown instead of ammo when reloading)
    this.reloadContainer = new StackPanel('reloadPanel');
    this.reloadContainer.width = '200px';
    this.reloadContainer.height = '70px';
    this.reloadContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.reloadContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    this.reloadContainer.left = -20;
    this.reloadContainer.top = -20;
    this.reloadContainer.background = 'rgba(10, 5, 5, 0.75)';
    this.reloadContainer.isVisible = false;
    this.gui.addControl(this.reloadContainer);

    this.reloadText = new TextBlock('reloadText', 'RELOADING');
    this.reloadText.fontFamily = FONT;
    this.reloadText.fontSize = 18;
    this.reloadText.color = '#ffaa00';
    this.reloadText.fontWeight = 'bold';
    this.reloadText.height = '32px';
    this.reloadText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.reloadText.paddingRight = 10;
    this.reloadContainer.addControl(this.reloadText);

    this.reloadBarOuter = new Rectangle('reloadBarOuter');
    this.reloadBarOuter.width = '150px';
    this.reloadBarOuter.height = '8px';
    this.reloadBarOuter.background = '#1a0505';
    this.reloadBarOuter.thickness = 1;
    this.reloadBarOuter.color = 'rgba(255, 170, 0, 0.3)';
    this.reloadBarOuter.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.reloadBarOuter.paddingRight = 10;
    this.reloadContainer.addControl(this.reloadBarOuter);

    this.reloadBarInner = new Rectangle('reloadBarInner');
    this.reloadBarInner.width = 0;
    this.reloadBarInner.height = 1;
    this.reloadBarInner.background = '#ffaa00';
    this.reloadBarInner.thickness = 0;
    this.reloadBarInner.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.reloadBarOuter.addControl(this.reloadBarInner);
  }

  private createCrosshair(): void {
    const color = 'rgba(255, 80, 60, 0.75)';
    const length = 14;
    const thick = 2;
    const gap = 5;

    // Top arm
    this.crosshairTop = new Rectangle('xhTop');
    this.crosshairTop.width = `${thick}px`;
    this.crosshairTop.height = `${length}px`;
    this.crosshairTop.background = color;
    this.crosshairTop.thickness = 0;
    this.crosshairTop.top = -(gap + length / 2);
    this.gui.addControl(this.crosshairTop);

    // Bottom arm
    this.crosshairBottom = new Rectangle('xhBot');
    this.crosshairBottom.width = `${thick}px`;
    this.crosshairBottom.height = `${length}px`;
    this.crosshairBottom.background = color;
    this.crosshairBottom.thickness = 0;
    this.crosshairBottom.top = gap + length / 2;
    this.gui.addControl(this.crosshairBottom);

    // Left arm
    this.crosshairLeft = new Rectangle('xhLeft');
    this.crosshairLeft.width = `${length}px`;
    this.crosshairLeft.height = `${thick}px`;
    this.crosshairLeft.background = color;
    this.crosshairLeft.thickness = 0;
    this.crosshairLeft.left = -(gap + length / 2);
    this.gui.addControl(this.crosshairLeft);

    // Right arm
    this.crosshairRight = new Rectangle('xhRight');
    this.crosshairRight.width = `${length}px`;
    this.crosshairRight.height = `${thick}px`;
    this.crosshairRight.background = color;
    this.crosshairRight.thickness = 0;
    this.crosshairRight.left = gap + length / 2;
    this.gui.addControl(this.crosshairRight);

    // Center dot
    this.crosshairDot = new Ellipse('xhDot');
    this.crosshairDot.width = '2px';
    this.crosshairDot.height = '2px';
    this.crosshairDot.background = color;
    this.crosshairDot.thickness = 0;
    this.gui.addControl(this.crosshairDot);
  }

  private createFloorInfo(): void {
    const panel = new StackPanel('floorPanel');
    panel.width = '180px';
    panel.adaptHeightToChildren = true;
    panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    panel.left = 20;
    panel.top = 16;
    panel.background = 'rgba(10, 5, 5, 0.75)';
    panel.paddingLeft = 12;
    panel.paddingRight = 12;
    panel.paddingTop = 6;
    panel.paddingBottom = 6;
    this.gui.addControl(panel);

    this.floorText = new TextBlock('floorNum', 'FL 1');
    this.floorText.fontFamily = FONT;
    this.floorText.fontSize = 20;
    this.floorText.fontWeight = 'bold';
    this.floorText.color = '#cc0000';
    this.floorText.height = '24px';
    this.floorText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    panel.addControl(this.floorText);

    this.themeText = new TextBlock('themeName', '');
    this.themeText.fontFamily = FONT;
    this.themeText.fontSize = 9;
    this.themeText.color = '#884433';
    this.themeText.height = '14px';
    this.themeText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    panel.addControl(this.themeText);

    this.encounterText = new TextBlock('encounter', '');
    this.encounterText.fontFamily = FONT;
    this.encounterText.fontSize = 9;
    this.encounterText.fontWeight = 'bold';
    this.encounterText.color = '#ffaa00';
    this.encounterText.height = '14px';
    this.encounterText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    panel.addControl(this.encounterText);

    this.waveText = new TextBlock('waveInfo', '');
    this.waveText.fontFamily = FONT;
    this.waveText.fontSize = 10;
    this.waveText.fontWeight = 'bold';
    this.waveText.color = '#ff6644';
    this.waveText.height = '14px';
    this.waveText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    panel.addControl(this.waveText);
  }

  private createScoreDisplay(): void {
    const panel = new StackPanel('scorePanel');
    panel.width = '260px';
    panel.height = '56px';
    panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    panel.top = 16;
    this.gui.addControl(panel);

    this.scoreText = new TextBlock('score', '0');
    this.scoreText.fontFamily = FONT;
    this.scoreText.fontSize = 28;
    this.scoreText.fontWeight = 'bold';
    this.scoreText.color = '#ffffff';
    this.scoreText.height = '36px';
    this.scoreText.shadowColor = 'rgba(255, 0, 0, 0.6)';
    this.scoreText.shadowBlur = 8;
    panel.addControl(this.scoreText);

    const statsRow = new StackPanel('statsRow');
    statsRow.isVertical = false;
    statsRow.height = '18px';
    panel.addControl(statsRow);

    this.killsText = new TextBlock('kills', 'KILLS 0');
    this.killsText.fontFamily = FONT;
    this.killsText.fontSize = 12;
    this.killsText.color = '#cc4444';
    this.killsText.width = '100px';
    statsRow.addControl(this.killsText);

    const sep = new TextBlock('sep', '|');
    sep.fontFamily = FONT;
    sep.fontSize = 12;
    sep.color = '#443322';
    sep.width = '20px';
    statsRow.addControl(sep);

    this.timeText = new TextBlock('time', '0:00');
    this.timeText.fontFamily = FONT;
    this.timeText.fontSize = 12;
    this.timeText.color = '#887766';
    this.timeText.width = '80px';
    statsRow.addControl(this.timeText);
  }

  private createLevelXP(): void {
    const panel = new StackPanel('lvlPanel');
    panel.isVertical = false;
    panel.width = '180px';
    panel.height = '24px';
    panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    panel.left = 20;
    panel.top = 90;
    panel.background = 'rgba(10, 5, 5, 0.75)';
    this.gui.addControl(panel);

    this.levelText = new TextBlock('lvlText', 'LV 1');
    this.levelText.fontFamily = FONT;
    this.levelText.fontSize = 12;
    this.levelText.fontWeight = 'bold';
    this.levelText.color = '#aa88ff';
    this.levelText.width = '50px';
    this.levelText.paddingLeft = 6;
    panel.addControl(this.levelText);

    const xpOuter = new Rectangle('xpOuter');
    xpOuter.width = '60px';
    xpOuter.height = '8px';
    xpOuter.background = '#1a0520';
    xpOuter.thickness = 1;
    xpOuter.color = 'rgba(100, 50, 200, 0.25)';
    panel.addControl(xpOuter);

    this.xpBarInner = new Rectangle('xpInner');
    this.xpBarInner.width = 0;
    this.xpBarInner.height = 1;
    this.xpBarInner.background = '#8855cc';
    this.xpBarInner.thickness = 0;
    this.xpBarInner.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    xpOuter.addControl(this.xpBarInner);

    this.xpText = new TextBlock('xpText', '0/100');
    this.xpText.fontFamily = FONT;
    this.xpText.fontSize = 8;
    this.xpText.color = '#665588';
    this.xpText.width = '60px';
    this.xpText.paddingLeft = 4;
    panel.addControl(this.xpText);
  }

  private createDiffTags(): void {
    const row = new StackPanel('diffRow');
    row.isVertical = false;
    row.width = '180px';
    row.height = '16px';
    row.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    row.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    row.left = 20;
    row.top = 118;
    this.gui.addControl(row);

    this.diffText = new TextBlock('diffTag', 'CONDEMNED');
    this.diffText.fontFamily = FONT;
    this.diffText.fontSize = 8;
    this.diffText.fontWeight = 'bold';
    this.diffText.color = '#887766';
    this.diffText.width = '80px';
    this.diffText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    row.addControl(this.diffText);

    this.nightmareText = new TextBlock('nightTag', '');
    this.nightmareText.fontFamily = FONT;
    this.nightmareText.fontSize = 8;
    this.nightmareText.fontWeight = 'bold';
    this.nightmareText.color = '#ff6600';
    this.nightmareText.width = '80px';
    this.nightmareText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    row.addControl(this.nightmareText);
  }

  private createWeaponSlots(): void {
    const row = new StackPanel('weaponRow');
    row.isVertical = false;
    row.width = '130px';
    row.height = '30px';
    row.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    row.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    row.left = -20;
    row.top = 16;
    this.gui.addControl(row);

    this.weaponSlots = [];
    for (let i = 0; i < 4; i++) {
      const slot = new Rectangle(`wSlot${i}`);
      slot.width = '28px';
      slot.height = '28px';
      slot.thickness = 1;
      slot.color = 'rgba(204, 0, 0, 0.3)';
      slot.background = 'rgba(10, 5, 5, 0.6)';
      row.addControl(slot);

      const label = new TextBlock(`wLabel${i}`, `${i + 1}`);
      label.fontFamily = FONT;
      label.fontSize = 12;
      label.fontWeight = 'bold';
      label.color = '#887766';
      slot.addControl(label);

      this.weaponSlots.push(slot);
    }
  }

  private createBossBar(): void {
    this.bossContainer = new StackPanel('bossPanel');
    this.bossContainer.width = '50%';
    this.bossContainer.height = '50px';
    this.bossContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.bossContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.bossContainer.top = 70;
    this.bossContainer.isVisible = false;
    this.gui.addControl(this.bossContainer);

    this.bossNameText = new TextBlock('bossName', 'BOSS');
    this.bossNameText.fontFamily = FONT;
    this.bossNameText.fontSize = 14;
    this.bossNameText.fontWeight = 'bold';
    this.bossNameText.color = '#cc0000';
    this.bossNameText.height = '20px';
    this.bossNameText.shadowColor = 'rgba(255, 0, 0, 0.5)';
    this.bossNameText.shadowBlur = 6;
    this.bossContainer.addControl(this.bossNameText);

    const bossBarOuter = new Rectangle('bossBarOuter');
    bossBarOuter.width = 1;
    bossBarOuter.height = '12px';
    bossBarOuter.background = '#1a0505';
    bossBarOuter.thickness = 1;
    bossBarOuter.color = 'rgba(204, 0, 0, 0.4)';
    this.bossContainer.addControl(bossBarOuter);

    this.bossBarInner = new Rectangle('bossBarInner');
    this.bossBarInner.width = 1;
    this.bossBarInner.height = 1;
    this.bossBarInner.background = '#cc0000';
    this.bossBarInner.thickness = 0;
    this.bossBarInner.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    bossBarOuter.addControl(this.bossBarInner);

    this.bossHpText = new TextBlock('bossHp', '');
    this.bossHpText.fontFamily = FONT;
    this.bossHpText.fontSize = 10;
    this.bossHpText.color = '#887766';
    this.bossHpText.height = '14px';
    this.bossContainer.addControl(this.bossHpText);
  }

  private createMinimap(): void {
    this.minimapContainer = new Rectangle('minimap');
    this.minimapContainer.width = '130px';
    this.minimapContainer.height = '130px';
    this.minimapContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.minimapContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    this.minimapContainer.left = -20;
    this.minimapContainer.top = -80;
    this.minimapContainer.thickness = 1;
    this.minimapContainer.color = 'rgba(204, 0, 0, 0.3)';
    this.minimapContainer.background = 'rgba(0, 0, 0, 0.7)';
    this.minimapContainer.isVisible = false;
    this.gui.addControl(this.minimapContainer);

    // Image control inside minimap container
    this.minimapImage = new GuiImage('minimapImg', '');
    this.minimapImage.width = 1;
    this.minimapImage.height = 1;
    this.minimapImage.stretch = GuiImage.STRETCH_UNIFORM;
    this.minimapContainer.addControl(this.minimapImage);

    // Offscreen canvas for minimap rendering
    if (typeof document !== 'undefined') {
      this.minimapCanvas = document.createElement('canvas');
      this.minimapCanvas.width = 128;
      this.minimapCanvas.height = 128;
      this.minimapCtx = this.minimapCanvas.getContext('2d');
    }
  }

  private createLevelUpNotification(): void {
    this.levelUpText = new TextBlock('levelUp', '');
    this.levelUpText.fontFamily = FONT;
    this.levelUpText.fontSize = 28;
    this.levelUpText.fontWeight = 'bold';
    this.levelUpText.color = '#aa88ff';
    this.levelUpText.shadowColor = 'rgba(100, 50, 200, 0.6)';
    this.levelUpText.shadowBlur = 10;
    this.levelUpText.top = 80;
    this.levelUpText.isVisible = false;
    this.gui.addControl(this.levelUpText);
  }

  private createKillFeedback(): void {
    // Kill confirmation near crosshair
    this.killText = new TextBlock('killConfirm', '');
    this.killText.fontFamily = FONT;
    this.killText.fontSize = 16;
    this.killText.fontWeight = 'bold';
    this.killText.color = '#ffcc00';
    this.killText.top = 30;
    this.killText.isVisible = false;
    this.gui.addControl(this.killText);

    // Streak announcements
    this.streakText = new TextBlock('streak', '');
    this.streakText.fontFamily = FONT;
    this.streakText.fontSize = 24;
    this.streakText.fontWeight = 'bold';
    this.streakText.color = '#ff6600';
    this.streakText.shadowColor = 'rgba(255, 100, 0, 0.6)';
    this.streakText.shadowBlur = 10;
    this.streakText.top = 110;
    this.streakText.isVisible = false;
    this.gui.addControl(this.streakText);

    // Pre-allocate buff display text blocks (up to 3)
    for (let i = 0; i < 3; i++) {
      const bt = new TextBlock(`buff-${i}`, '');
      bt.fontFamily = FONT;
      bt.fontSize = 14;
      bt.fontWeight = 'bold';
      bt.color = '#ffffff';
      bt.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
      bt.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
      bt.left = 10;
      bt.top = 200 + i * 22;
      bt.isVisible = false;
      this.gui.addControl(bt);
      this.buffTexts.push(bt);
    }
  }

  private createWeaponPickupNotification(): void {
    this.weaponPickupText = new TextBlock('weaponPickup', '');
    this.weaponPickupText.fontFamily = FONT;
    this.weaponPickupText.fontSize = 22;
    this.weaponPickupText.fontWeight = 'bold';
    this.weaponPickupText.color = '#ff8800';
    this.weaponPickupText.shadowColor = 'rgba(255, 136, 0, 0.6)';
    this.weaponPickupText.shadowBlur = 10;
    this.weaponPickupText.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.weaponPickupText.top = -60;
    this.weaponPickupText.isVisible = false;
    this.gui.addControl(this.weaponPickupText);
  }

  private createTutorialHints(): void {
    // Load previously shown hints from localStorage
    try {
      const stored = localStorage.getItem('goats-in-hell-hints');
      if (stored) this.shownHints = new Set(JSON.parse(stored));
    } catch { /* ignore */ }

    this.tutorialText = new TextBlock('tutorial', '');
    this.tutorialText.fontFamily = FONT;
    this.tutorialText.fontSize = 20;
    this.tutorialText.fontWeight = 'bold';
    this.tutorialText.color = '#aaccff';
    this.tutorialText.shadowColor = 'rgba(50, 100, 200, 0.6)';
    this.tutorialText.shadowBlur = 8;
    this.tutorialText.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.tutorialText.top = 60;
    this.tutorialText.isVisible = false;
    this.gui.addControl(this.tutorialText);
  }

  private showHint(id: string, message: string): void {
    if (this.shownHints.has(id)) return;
    if (this.tutorialTimer > 0) return; // another hint still showing

    this.shownHints.add(id);
    try {
      localStorage.setItem(
        'goats-in-hell-hints',
        JSON.stringify([...this.shownHints]),
      );
    } catch { /* ignore */ }

    this.tutorialText.text = message;
    this.tutorialText.isVisible = true;
    this.tutorialText.alpha = 1;
    this.tutorialTimer = 180; // ~3 seconds at 60fps
  }

  private createAutoplayPanel(): void {
    const STATE_COLORS: Record<string, string> = {
      hunt: '#ff4444',
      heal: '#44ff44',
      flee: '#ffaa00',
      explore: '#4488ff',
    };

    this.autoplayContainer = new StackPanel('autoplayPanel');
    this.autoplayContainer.width = '180px';
    this.autoplayContainer.adaptHeightToChildren = true;
    this.autoplayContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.autoplayContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.autoplayContainer.left = -20;
    this.autoplayContainer.top = 52;
    this.autoplayContainer.background = 'rgba(0, 0, 0, 0.85)';
    this.autoplayContainer.isVisible = false;
    this.gui.addControl(this.autoplayContainer);

    // Header
    const header = new TextBlock('apHeader', 'AUTOPLAY');
    header.fontFamily = FONT;
    header.fontSize = 11;
    header.fontWeight = 'bold';
    header.color = '#44ff44';
    header.height = '18px';
    this.autoplayContainer.addControl(header);

    const divider = new Rectangle('apDiv');
    divider.width = 0.9;
    divider.height = '1px';
    divider.background = 'rgba(68, 255, 68, 0.15)';
    divider.thickness = 0;
    this.autoplayContainer.addControl(divider);

    // Rows
    const makeRow = (name: string, label: string): TextBlock => {
      const row = new StackPanel(`ap-${name}`);
      row.isVertical = false;
      row.height = '16px';
      row.width = 1;
      this.autoplayContainer.addControl(row);

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

    this.autoplayStateText = makeRow('state', 'STATE');
    this.autoplayTargetText = makeRow('target', 'TARGET');
    this.autoplayWeaponText = makeRow('weapon', 'WEAPON');
    this.autoplaySteerText = makeRow('steer', 'STEER');

    this.autoplayStateColors = STATE_COLORS;
  }

  // =========================================================================
  // Per-frame update
  // =========================================================================

  update(): void {
    const storeState = useGameStore.getState();
    if (storeState.screen !== 'playing') {
      this.gui.rootContainer.isVisible = false;
      return;
    }
    this.gui.rootContainer.isVisible = true;

    const player = getPlayer();
    if (!player) return;

    this.updateHealth(player);
    this.updateAmmo(player);
    this.updateCrosshair(storeState.hitMarker ?? 0);
    this.updateFloorInfo(storeState);
    this.updateScore(storeState);
    this.updateLevelXP(storeState);
    this.updateDiffTags(storeState);
    this.updateWeaponSlots(player);
    this.updateBossBar(storeState);
    this.updateMinimapVisibility(storeState);
    this.updateAutoplay(storeState);
    this.updateLevelUpNotification(storeState);
    this.updateKillFeedback(storeState);
    this.updateWeaponPickup(player);
    this.updateTutorialHints(player, storeState);
    this.updateBuffIcons();
    this.updateDamageDirection();
    this.updateFloorAnnouncement(storeState);
    this.updateHeadshotNotification();
    this.updateLoreOverlay(player);
    this.updateSecretNotification();
    this.updateBloodSplatter();
  }

  private updateHealth(player: Entity): void {
    const hp = player.player?.hp ?? 0;
    const maxHp = player.player?.maxHp ?? 100;
    const ratio = maxHp > 0 ? hp / maxHp : 0;
    const color = getHealthColor(ratio);

    this.healthBarInner.width = ratio;
    this.healthBarInner.background = color;
    this.healthLabel.color = color;
    this.healthValueText.text = `${hp}/${maxHp}`;

    // Low HP blood vignette — intensifies as health drops
    const isLow = ratio < 0.5;
    this.vignette.isVisible = isLow;
    if (isLow) {
      // Intensity ramps: 0.5 HP ratio → mild, 0.1 → extreme
      const severity = 1 - ratio / 0.5; // 0 at 50% HP, 1 at 0% HP
      const pulse = severity * (0.25 + Math.sin(getGameTime() * 0.01) * 0.12);
      const thickness = Math.round(30 + severity * 60);
      this.vignette.thickness = thickness;
      this.vignette.color = `rgba(180, 0, 0, ${pulse.toFixed(2)})`;
    }
  }

  private updateAmmo(player: Entity): void {
    const currentWeapon: WeaponId = player.player?.currentWeapon ?? 'hellPistol';
    const weaponDef = weapons[currentWeapon];
    const isReloading = player.player?.isReloading ?? false;
    const reloadStart = player.player?.reloadStart ?? 0;
    const reloadTime = weaponDef?.reloadTime ?? 1500;

    if (isReloading) {
      this.ammoContainer.isVisible = false;
      this.reloadContainer.isVisible = true;
      const progress = Math.min(1, (getGameTime() - reloadStart) / reloadTime);
      this.reloadBarInner.width = progress;
    } else {
      this.ammoContainer.isVisible = true;
      this.reloadContainer.isVisible = false;
      const ammoData = player.ammo?.[currentWeapon];
      const current = ammoData?.current ?? 0;
      const mag = ammoData?.magSize ?? weaponDef?.magSize ?? 0;
      const reserve = ammoData?.reserve ?? 0;
      this.ammoText.text = `${current}/${mag} | ${reserve}`;
    }

    this.weaponNameText.text = weaponDef?.name?.toUpperCase() ?? 'UNKNOWN';
  }

  private updateCrosshair(hitMarker: number): void {
    const hit = hitMarker > 0;
    const color = hit ? '#ffffff' : 'rgba(255, 80, 60, 0.75)';
    this.crosshairTop.background = color;
    this.crosshairBottom.background = color;
    this.crosshairLeft.background = color;
    this.crosshairRight.background = color;
    this.crosshairDot.background = color;
    this.crosshairDot.width = hit ? '4px' : '2px';
    this.crosshairDot.height = hit ? '4px' : '2px';

    // Crosshair spread on hit — arms push outward then snap back
    const spread = hit ? hitMarker * 8 : 0; // hitMarker decays 1→0
    const baseGap = 5;
    const baseLen = 14;
    this.crosshairTop.top = -(baseGap + baseLen / 2 + spread);
    this.crosshairBottom.top = baseGap + baseLen / 2 + spread;
    this.crosshairLeft.left = -(baseGap + baseLen / 2 + spread);
    this.crosshairRight.left = baseGap + baseLen / 2 + spread;
  }

  private updateFloorInfo(state: ReturnType<typeof useGameStore.getState>): void {
    const floor = state.stage.floor;
    const encounterType = state.stage.encounterType;
    const theme = getThemeForFloor(floor);

    this.floorText.text = `FL ${floor}`;
    this.themeText.text = theme.displayName;

    if (encounterType === 'arena') {
      this.encounterText.text = 'ARENA';
      this.encounterText.isVisible = true;
      const waveInfo = getWaveInfo();
      let waveStr = `WAVE ${waveInfo.wave}`;
      if (waveInfo.multiplier > 1) waveStr += ` x${waveInfo.multiplier.toFixed(1)}`;
      this.waveText.text = waveStr;
      this.waveText.isVisible = true;
    } else if (encounterType === 'boss') {
      this.encounterText.text = 'BOSS';
      this.encounterText.isVisible = true;
      this.waveText.isVisible = false;
    } else {
      this.encounterText.isVisible = false;
      this.waveText.isVisible = false;
    }
  }

  private updateScore(state: ReturnType<typeof useGameStore.getState>): void {
    // Animated score
    this.targetScore = state.score;
    if (this.displayScore !== this.targetScore) {
      const diff = this.targetScore - this.displayScore;
      const step = Math.max(1, Math.ceil(Math.abs(diff) / 8));
      this.displayScore += diff > 0 ? Math.min(step, diff) : Math.max(-step, diff);
    }
    this.scoreText.text = this.displayScore.toLocaleString();
    this.killsText.text = `KILLS ${state.kills}`;
    this.timeText.text = formatTime(Date.now() - state.startTime);
  }

  private updateLevelXP(state: ReturnType<typeof useGameStore.getState>): void {
    const lv = state.leveling;
    this.levelText.text = `LV ${lv.level}`;
    this.xpBarInner.width = lv.xpToNext > 0 ? lv.xp / lv.xpToNext : 0;
    this.xpText.text = `${lv.xp}/${lv.xpToNext}`;
  }

  private updateDiffTags(state: ReturnType<typeof useGameStore.getState>): void {
    this.diffText.text = DIFFICULTY_PRESETS[state.difficulty].label.toUpperCase();
    if (state.difficulty === 'hard') {
      this.diffText.color = '#cc4400';
    } else {
      this.diffText.color = '#887766';
    }

    if (state.nightmareFlags.ultraNightmare) {
      this.nightmareText.text = 'ULTRA NIGHTMARE';
      this.nightmareText.color = '#ff0000';
    } else if (state.nightmareFlags.nightmare) {
      this.nightmareText.text = 'NIGHTMARE';
      this.nightmareText.color = '#ff6600';
    } else if (state.nightmareFlags.permadeath) {
      this.nightmareText.text = 'PERMADEATH';
      this.nightmareText.color = '#880000';
    } else {
      this.nightmareText.text = '';
    }
  }

  private updateWeaponSlots(player: Entity): void {
    const WEAPON_IDS: WeaponId[] = ['hellPistol', 'brimShotgun', 'hellfireCannon', 'goatsBane'];
    const currentWeapon = player.player?.currentWeapon ?? 'hellPistol';
    const ownedWeapons = player.player?.weapons ?? ['hellPistol'];

    for (let i = 0; i < 4; i++) {
      const slot = this.weaponSlots[i];
      const wid = WEAPON_IDS[i];
      const owned = ownedWeapons.includes(wid);
      const active = currentWeapon === wid;

      if (active) {
        slot.color = '#cc0000';
        slot.background = 'rgba(204, 0, 0, 0.15)';
      } else {
        slot.color = 'rgba(204, 0, 0, 0.3)';
        slot.background = 'rgba(10, 5, 5, 0.6)';
      }
      slot.alpha = owned ? 1 : 0.3;
    }
  }

  private updateBossBar(state: ReturnType<typeof useGameStore.getState>): void {
    if (state.stage.encounterType !== 'boss') {
      this.bossContainer.isVisible = false;
      bossPhase2Triggered = false;
      return;
    }

    const boss = world.entities.find(e => e.enemy && BOSS_TYPES.has(e.type ?? ''));
    if (!boss?.enemy) {
      this.bossContainer.isVisible = false;
      return;
    }

    this.bossContainer.isVisible = true;
    const {hp, maxHp} = boss.enemy;
    const ratio = maxHp > 0 ? hp / maxHp : 0;
    const name = BOSS_DISPLAY_NAMES[boss.type ?? ''] ?? 'BOSS';

    // Phase 2 transition: flash when boss drops below 50%
    if (ratio <= 0.5 && !bossPhase2Triggered) {
      bossPhase2Triggered = true;
      bossBarFlashTimer = 30; // 0.5s flash at 60fps
      GameState.set({screenShake: 8});
    }

    // Bar color: normal → phase2 orange → critical red, with flash overlay
    let barColor: string;
    if (bossBarFlashTimer > 0) {
      bossBarFlashTimer--;
      // Pulsing white-red flash
      const pulse = Math.sin(bossBarFlashTimer * 0.6) * 0.5 + 0.5;
      barColor = pulse > 0.5 ? '#ffffff' : '#ff4400';
      this.bossNameText.text = `⚡ ${name} — PHASE 2 ⚡`;
    } else {
      barColor = ratio > 0.5 ? '#cc0000' : ratio > 0.25 ? '#ff6600' : '#ff2200';
      this.bossNameText.text = ratio <= 0.5 ? `${name} — ENRAGED` : name;
    }

    this.bossBarInner.width = ratio;
    this.bossBarInner.background = barColor;
    this.bossHpText.text = `${Math.ceil(hp)} / ${maxHp}`;
  }

  private updateMinimapVisibility(state: ReturnType<typeof useGameStore.getState>): void {
    const show = state.stage.encounterType === 'explore';
    this.minimapContainer.isVisible = show;
    if (!show || !this.minimapCanvas || !this.minimapCtx) return;

    // Throttle: update every 6 frames
    this.minimapLastUpdate++;
    if (this.minimapLastUpdate < 6) return;
    this.minimapLastUpdate = 0;

    const level = getActiveLevel();
    if (!level) return;

    const ctx = this.minimapCtx;
    const size = 128;
    const {grid, width, depth} = level;
    const cellPx = size / Math.max(width, depth);

    // Clear
    ctx.fillStyle = '#0a0505';
    ctx.fillRect(0, 0, size, size);

    // Draw walls
    for (let z = 0; z < depth; z++) {
      for (let x = 0; x < width; x++) {
        const cell = grid[z][x];
        if (cell === 0) continue; // MapCell.EMPTY
        switch (cell) {
          case 1: ctx.fillStyle = '#443333'; break; // stone
          case 2: ctx.fillStyle = '#553322'; break; // flesh
          case 3: ctx.fillStyle = '#553300'; break; // lava wall
          case 4: ctx.fillStyle = '#222233'; break; // obsidian
          case 5: ctx.fillStyle = '#885522'; break; // door
          case 6: ctx.fillStyle = '#ff4400'; break; // lava floor hazard
          case 7: ctx.fillStyle = '#556677'; break; // raised platform
          case 8: ctx.fillStyle = '#667755'; break; // ramp
          case 9: { // secret wall — subtle shimmer hint
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

    // Draw enemies as red dots
    ctx.fillStyle = '#ff2200';
    for (const e of world.entities) {
      if (!e.enemy || !e.position) continue;
      const ex = (e.position.x / CELL_SIZE) * cellPx;
      const ez = (e.position.z / CELL_SIZE) * cellPx;
      ctx.beginPath();
      ctx.arc(ex, ez, Math.max(1.5, cellPx * 0.4), 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw pickups as colored dots
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

    // Draw player as white arrow
    const player = getPlayer();
    if (player?.position) {
      const ppx = (player.position.x / CELL_SIZE) * cellPx;
      const ppz = (player.position.z / CELL_SIZE) * cellPx;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ppx, ppz, Math.max(2, cellPx * 0.6), 0, Math.PI * 2);
      ctx.fill();
    }

    // Update GUI image
    this.minimapImage.source = this.minimapCanvas.toDataURL();
  }

  private updateKillFeedback(state: ReturnType<typeof useGameStore.getState>): void {
    const kills = state.kills;
    const now = getGameTime();

    // Detect new kills
    if (kills > this.lastKills) {
      const killsDelta = kills - this.lastKills;
      this.lastKills = kills;

      // Kill confirmation
      const scoreGain = killsDelta * 100; // approximate
      this.killText.text = `+${scoreGain}`;
      this.killText.isVisible = true;
      this.killTimer = 60;

    }

    // Kill streak announcements from KillStreakSystem
    const announcement = getAnnouncement();
    if (announcement) {
      this.streakText.text = announcement.label;
      this.streakText.color = announcement.color;
      this.streakText.shadowColor = announcement.color + '99';
      this.streakText.isVisible = true;
      // Scale text: start large and shrink to normal
      const scale = 1.0 + (1.0 - announcement.progress) * 0.5;
      this.streakText.fontSize = Math.round(28 * scale);
      this.streakText.alpha = 1.0 - announcement.progress * 0.3;
    } else {
      this.streakText.isVisible = false;
    }

    // Fade kill confirmation
    if (this.killTimer > 0) {
      this.killTimer--;
      this.killText.alpha = Math.min(1, this.killTimer / 20);
      // Float upward
      this.killText.top = 30 - (60 - this.killTimer) * 0.3;
      if (this.killTimer <= 0) this.killText.isVisible = false;
    }
  }

  private updateLevelUpNotification(state: ReturnType<typeof useGameStore.getState>): void {
    const currentLevel = state.leveling.level;

    // Detect level-up
    if (currentLevel > this.lastLevel) {
      this.lastLevel = currentLevel;
      const bonuses = getLevelBonuses(currentLevel);
      this.levelUpText.text = `LEVEL ${currentLevel}  +${Math.round((bonuses.damageMult - 1) * 100)}% DMG  +${bonuses.maxHpBonus} HP`;
      this.levelUpText.isVisible = true;
      this.levelUpTimer = 120; // ~2 seconds at 60fps
    }

    // Fade out
    if (this.levelUpTimer > 0) {
      this.levelUpTimer--;
      this.levelUpText.alpha = Math.min(1, this.levelUpTimer / 30);
      if (this.levelUpTimer <= 0) {
        this.levelUpText.isVisible = false;
      }
    }
  }

  private updateBuffIcons(): void {
    const buffs = getActiveBuffs();
    for (let i = 0; i < this.buffTexts.length; i++) {
      const bt = this.buffTexts[i];
      if (i < buffs.length) {
        const buff = buffs[i];
        const remaining = Math.ceil((1 - buff.progress) * (buff.type === 'hellSpeed' ? 8 : buff.type === 'quadDamage' ? 10 : 30));
        const shieldInfo = buff.shieldFraction !== undefined
          ? ` [${Math.round(buff.shieldFraction * 100)}%]`
          : '';
        bt.text = `${buff.label} ${remaining}s${shieldInfo}`;
        bt.color = buff.color;
        bt.isVisible = true;
        // Flash when about to expire (<3s)
        if (buff.progress > 0.7) {
          bt.alpha = 0.5 + Math.sin(getGameTime() * 0.01) * 0.5;
        } else {
          bt.alpha = 1;
        }
      } else {
        bt.isVisible = false;
      }
    }
  }

  private updateAutoplay(state: ReturnType<typeof useGameStore.getState>): void {
    if (!state.autoplay) {
      this.autoplayContainer.isVisible = false;
      return;
    }

    this.autoplayContainer.isVisible = true;
    const gov = typeof window !== 'undefined' ? (window as any).__aiGovernor : null;
    if (gov?.getDebugInfo) {
      const info = gov.getDebugInfo();
      const stateColors = this.autoplayStateColors;
      this.autoplayStateText.text = info.state?.toUpperCase() ?? '...';
      this.autoplayStateText.color = stateColors[info.state] ?? '#888888';
      this.autoplayTargetText.text = `${info.targetType} (${info.targetDist}u)`;
      this.autoplayWeaponText.text = info.weapon ?? '...';
      this.autoplaySteerText.text = info.steering ?? '...';
    }
  }

  private updateWeaponPickup(player: Entity): void {
    if (!player.player) return;

    const weaponCount = player.player.weapons.length;
    if (weaponCount > this.lastWeaponCount) {
      // New weapon acquired — show the latest one
      const newWeapon = player.player.weapons[weaponCount - 1];
      const weaponName = weapons[newWeapon]?.name ?? newWeapon;
      this.weaponPickupText.text = `NEW WEAPON: ${weaponName.toUpperCase()}`;
      this.weaponPickupText.isVisible = true;
      this.weaponPickupText.alpha = 1;
      this.weaponPickupTimer = 180; // ~3 seconds
    }
    this.lastWeaponCount = weaponCount;

    // Fade out
    if (this.weaponPickupTimer > 0) {
      this.weaponPickupTimer--;
      this.weaponPickupText.alpha = Math.min(1, this.weaponPickupTimer / 30);
      if (this.weaponPickupTimer <= 0) this.weaponPickupText.isVisible = false;
    }
  }

  private updateTutorialHints(
    player: Entity,
    state: ReturnType<typeof useGameStore.getState>,
  ): void {
    this.tutorialFrameCount++;

    // Fade active hint
    if (this.tutorialTimer > 0) {
      this.tutorialTimer--;
      this.tutorialText.alpha = Math.min(1, this.tutorialTimer / 30);
      if (this.tutorialTimer <= 0) this.tutorialText.isVisible = false;
    }

    // Show movement hint early on
    if (this.tutorialFrameCount === 60) {
      this.showHint('move', 'WASD to move  |  Mouse to look');
    }

    // Show shoot hint when an enemy is nearby
    if (this.tutorialFrameCount > 180 && !this.shownHints.has('shoot')) {
      const hasNearEnemy = world.entities.some(e => {
        if (!e.enemy || !e.position || !player.position) return false;
        return e.position.subtract(player.position).length() < 15;
      });
      if (hasNearEnemy) {
        this.showHint('shoot', 'Click to SHOOT');
      }
    }

    // Show reload hint when ammo is low
    if (!this.shownHints.has('reload') && player.player && player.ammo) {
      const wep = player.player.currentWeapon;
      const ammoInfo = player.ammo[wep];
      if (ammoInfo && ammoInfo.current <= 1 && ammoInfo.current < ammoInfo.magSize) {
        this.showHint('reload', 'R to RELOAD');
      }
    }

    // Show weapon switch hint when player has multiple weapons
    if (!this.shownHints.has('switch') && player.player) {
      if (player.player.weapons.length > 1) {
        this.showHint('switch', 'TAB or 1-4 to switch weapons');
      }
    }

    // Show sprint hint later
    if (this.tutorialFrameCount === 600 && !this.shownHints.has('sprint')) {
      this.showHint('sprint', 'Hold SHIFT to sprint');
    }
  }

  // =========================================================================
  // Damage direction indicators
  // =========================================================================

  private createDamageDirectionIndicators(): void {
    // 4 thin red gradient bars at screen edges: top (front), right, bottom (back), left
    const configs = [
      {name: 'dmgTop', hAlign: Control.HORIZONTAL_ALIGNMENT_CENTER, vAlign: Control.VERTICAL_ALIGNMENT_TOP, w: '40%', h: '6px', rot: 0},
      {name: 'dmgRight', hAlign: Control.HORIZONTAL_ALIGNMENT_RIGHT, vAlign: Control.VERTICAL_ALIGNMENT_CENTER, w: '6px', h: '40%', rot: 0},
      {name: 'dmgBottom', hAlign: Control.HORIZONTAL_ALIGNMENT_CENTER, vAlign: Control.VERTICAL_ALIGNMENT_BOTTOM, w: '40%', h: '6px', rot: 0},
      {name: 'dmgLeft', hAlign: Control.HORIZONTAL_ALIGNMENT_LEFT, vAlign: Control.VERTICAL_ALIGNMENT_CENTER, w: '6px', h: '40%', rot: 0},
    ];
    for (const cfg of configs) {
      const bar = new Rectangle(cfg.name);
      bar.width = cfg.w;
      bar.height = cfg.h;
      bar.horizontalAlignment = cfg.hAlign;
      bar.verticalAlignment = cfg.vAlign;
      bar.background = 'rgba(255, 0, 0, 0.7)';
      bar.thickness = 0;
      bar.cornerRadius = 3;
      bar.alpha = 0;
      bar.isHitTestVisible = false;
      this.gui.addControl(bar);
      this.damageArcs.push(bar);
    }
  }

  private updateDamageDirection(): void {
    const scene = this.gui.getScene();
    if (!scene?.activeCamera) return;

    const cam = scene.activeCamera as import('@babylonjs/core').FreeCamera;
    const camYaw = cam.rotation.y;

    // Process pending damage sources → convert to directional indicators
    while (pendingDamageSources.length > 0) {
      const src = pendingDamageSources.pop()!;
      const dx = src.x - cam.position.x;
      const dz = src.z - cam.position.z;

      // Angle from camera forward to damage source
      const sourceAngle = Math.atan2(dx, dz);
      let relAngle = sourceAngle - camYaw;

      // Normalize to [-PI, PI]
      while (relAngle > Math.PI) relAngle -= Math.PI * 2;
      while (relAngle < -Math.PI) relAngle += Math.PI * 2;

      // Map angle to quadrant: front=0, right=1, back=2, left=3
      if (relAngle >= -Math.PI / 4 && relAngle < Math.PI / 4) {
        damageIndicators[0] = Math.max(damageIndicators[0], 1); // front
      } else if (relAngle >= Math.PI / 4 && relAngle < 3 * Math.PI / 4) {
        damageIndicators[1] = Math.max(damageIndicators[1], 1); // right
      } else if (relAngle >= -3 * Math.PI / 4 && relAngle < -Math.PI / 4) {
        damageIndicators[3] = Math.max(damageIndicators[3], 1); // left
      } else {
        damageIndicators[2] = Math.max(damageIndicators[2], 1); // back
      }
    }

    // Update visual + decay
    for (let i = 0; i < 4; i++) {
      this.damageArcs[i].alpha = damageIndicators[i];
      damageIndicators[i] *= INDICATOR_DECAY;
      if (damageIndicators[i] < 0.01) damageIndicators[i] = 0;
    }
  }

  // =========================================================================
  // Headshot notification
  // =========================================================================

  private createHeadshotNotification(): void {
    this.headshotText = new TextBlock('headshotNotif', 'HEADSHOT!');
    this.headshotText.fontFamily = FONT;
    this.headshotText.fontSize = 22;
    this.headshotText.fontWeight = 'bold';
    this.headshotText.color = '#ffdd00';
    this.headshotText.shadowColor = 'rgba(255, 100, 0, 0.8)';
    this.headshotText.shadowBlur = 10;
    this.headshotText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.headshotText.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.headshotText.top = -70;
    this.headshotText.alpha = 0;
    this.headshotText.isHitTestVisible = false;
    this.gui.addControl(this.headshotText);
  }

  private updateHeadshotNotification(): void {
    const timer = getHeadshotTimer();
    tickHeadshotTimer();
    if (timer > 0) {
      // Fade in quickly, hold, fade out
      const alpha = timer > 70 ? (90 - timer) / 20 : timer / 30;
      this.headshotText.alpha = Math.min(1, alpha);
      // Slight scale pulse on fresh headshot
      const scale = timer > 75 ? 1 + (90 - timer) * 0.02 : 1;
      this.headshotText.fontSize = Math.round(22 * scale);
    } else {
      this.headshotText.alpha = 0;
    }
  }

  // =========================================================================
  // Floor announcement
  // =========================================================================

  private createFloorAnnouncement(): void {
    // Large centered floor number
    this.floorAnnounceText = new TextBlock('floorAnnounce', '');
    this.floorAnnounceText.fontFamily = FONT;
    this.floorAnnounceText.fontSize = 48;
    this.floorAnnounceText.fontWeight = 'bold';
    this.floorAnnounceText.color = '#cc0000';
    this.floorAnnounceText.shadowColor = 'rgba(0, 0, 0, 0.8)';
    this.floorAnnounceText.shadowBlur = 12;
    this.floorAnnounceText.shadowOffsetX = 2;
    this.floorAnnounceText.shadowOffsetY = 2;
    this.floorAnnounceText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.floorAnnounceText.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.floorAnnounceText.top = -30;
    this.floorAnnounceText.alpha = 0;
    this.floorAnnounceText.isHitTestVisible = false;
    this.gui.addControl(this.floorAnnounceText);

    // Theme name subtitle
    this.floorAnnounceSubText = new TextBlock('floorAnnounceSub', '');
    this.floorAnnounceSubText.fontFamily = FONT;
    this.floorAnnounceSubText.fontSize = 18;
    this.floorAnnounceSubText.color = '#884433';
    this.floorAnnounceSubText.shadowColor = 'rgba(0, 0, 0, 0.6)';
    this.floorAnnounceSubText.shadowBlur = 8;
    this.floorAnnounceSubText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.floorAnnounceSubText.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.floorAnnounceSubText.top = 20;
    this.floorAnnounceSubText.alpha = 0;
    this.floorAnnounceSubText.isHitTestVisible = false;
    this.gui.addControl(this.floorAnnounceSubText);
  }

  private updateFloorAnnouncement(state: ReturnType<typeof useGameStore.getState>): void {
    const floor = state.stage.floor;
    if (floor !== this.lastAnnouncedFloor && state.screen === 'playing') {
      this.lastAnnouncedFloor = floor;
      const theme = getThemeForFloor(floor);
      const encounter = state.stage.encounterType;

      let title: string;
      if (encounter === 'boss') {
        title = `BOSS FIGHT`;
      } else if (encounter === 'arena') {
        title = `ARENA — FLOOR ${floor}`;
      } else {
        title = `FLOOR ${floor}`;
      }

      this.floorAnnounceText.text = title;
      this.floorAnnounceSubText.text = theme.displayName;
      this.floorAnnounceTimer = 180; // ~3 seconds at 60fps
    }

    if (this.floorAnnounceTimer > 0) {
      this.floorAnnounceTimer--;
      // Fade in for 30 frames, hold, fade out for 40 frames
      let alpha: number;
      if (this.floorAnnounceTimer > 150) {
        alpha = (180 - this.floorAnnounceTimer) / 30; // fade in
      } else if (this.floorAnnounceTimer > 40) {
        alpha = 1; // hold
      } else {
        alpha = this.floorAnnounceTimer / 40; // fade out
      }
      this.floorAnnounceText.alpha = alpha;
      this.floorAnnounceSubText.alpha = alpha * 0.8;
    } else {
      this.floorAnnounceText.alpha = 0;
      this.floorAnnounceSubText.alpha = 0;
    }
  }

  // =========================================================================
  // Lore proximity overlay
  // =========================================================================

  private createLoreOverlay(): void {
    // Semi-transparent background panel
    this.loreOverlay = new Rectangle('loreOverlay');
    this.loreOverlay.width = '500px';
    this.loreOverlay.height = '200px';
    this.loreOverlay.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.loreOverlay.top = 80;
    this.loreOverlay.thickness = 1;
    this.loreOverlay.color = 'rgba(180, 40, 0, 0.6)';
    this.loreOverlay.background = 'rgba(10, 0, 0, 0.85)';
    this.loreOverlay.cornerRadius = 4;
    this.loreOverlay.isVisible = false;
    this.gui.addControl(this.loreOverlay);

    // Header — the wall inscription text
    this.loreHeaderText = new TextBlock('loreHeader', '');
    this.loreHeaderText.fontFamily = FONT;
    this.loreHeaderText.fontSize = 22;
    this.loreHeaderText.color = '#cc3300';
    this.loreHeaderText.textWrapping = true;
    this.loreHeaderText.top = -50;
    this.loreHeaderText.heightInPixels = 40;
    this.loreOverlay.addControl(this.loreHeaderText);

    // Body — extended lore narrative
    this.loreBodyText = new TextBlock('loreBody', '');
    this.loreBodyText.fontFamily = FONT;
    this.loreBodyText.fontSize = 14;
    this.loreBodyText.color = '#aa8866';
    this.loreBodyText.textWrapping = true;
    this.loreBodyText.top = 15;
    this.loreBodyText.heightInPixels = 100;
    this.loreBodyText.paddingLeftInPixels = 20;
    this.loreBodyText.paddingRightInPixels = 20;
    this.loreOverlay.addControl(this.loreBodyText);

    // Prompt hint near crosshair
    this.lorePromptText = new TextBlock('lorePrompt', '');
    this.lorePromptText.fontFamily = FONT;
    this.lorePromptText.fontSize = 12;
    this.lorePromptText.color = 'rgba(200, 150, 100, 0.8)';
    this.lorePromptText.top = 40;
    this.lorePromptText.isVisible = false;
    this.gui.addControl(this.lorePromptText);
  }

  private updateLoreOverlay(player: Entity): void {
    const entries = getLoreEntries();
    if (entries.length === 0 || !player.position) {
      this.loreOverlay.isVisible = false;
      this.lorePromptText.isVisible = false;
      this.loreVisible = false;
      return;
    }

    // Find closest lore entry
    let closest: (typeof entries)[number] | null = null;
    let closestDist = Infinity;
    for (const entry of entries) {
      const dist = Vector3.Distance(player.position, entry.position);
      if (dist < closestDist) {
        closestDist = dist;
        closest = entry;
      }
    }

    const PROXIMITY = 3.5;
    const SHOW_PROMPT = 5.0;

    if (closest && closestDist < SHOW_PROMPT) {
      // Show approach prompt
      this.lorePromptText.isVisible = true;
      this.lorePromptText.text = closestDist < PROXIMITY ? '[ READING... ]' : '[ APPROACH TO READ ]';
      this.lorePromptText.alpha = Math.min(1, (SHOW_PROMPT - closestDist) / (SHOW_PROMPT - PROXIMITY));
    } else {
      this.lorePromptText.isVisible = false;
    }

    if (closest && closestDist < PROXIMITY) {
      if (!this.loreVisible) {
        this.loreVisible = true;
        this.loreHeaderText.text = `"${closest.text}"`;
        this.loreBodyText.text = closest.extendedText;
      }
      // Fade in
      const alpha = Math.min(1, (PROXIMITY - closestDist) / 1.5);
      this.loreOverlay.isVisible = true;
      this.loreOverlay.alpha = alpha;
    } else {
      this.loreOverlay.isVisible = false;
      this.loreVisible = false;
    }
  }

  // =========================================================================
  // Secret room notification
  // =========================================================================

  private createSecretNotification(): void {
    this.secretText = new TextBlock('secretText', 'SECRET FOUND!');
    this.secretText.fontFamily = FONT;
    this.secretText.fontSize = 32;
    this.secretText.color = '#ffdd00';
    this.secretText.outlineWidth = 2;
    this.secretText.outlineColor = '#884400';
    this.secretText.shadowColor = '#ff8800';
    this.secretText.shadowOffsetX = 0;
    this.secretText.shadowOffsetY = 0;
    this.secretText.shadowBlur = 12;
    this.secretText.top = -120;
    this.secretText.alpha = 0;
    this.gui.addControl(this.secretText);
  }

  private updateSecretNotification(): void {
    const timer = getSecretNotifyTimer();
    tickSecretTimer();

    if (timer > 0) {
      // Fade in fast, hold, fade out
      let alpha: number;
      if (timer > 100) {
        alpha = (120 - timer) / 20; // fade in
      } else if (timer > 30) {
        alpha = 1; // hold
      } else {
        alpha = timer / 30; // fade out
      }
      this.secretText.alpha = alpha;

      // Slight scale pulse
      const pulse = 1 + 0.05 * Math.sin(timer * 0.15);
      this.secretText.scaleX = pulse;
      this.secretText.scaleY = pulse;
    } else {
      this.secretText.alpha = 0;
    }
  }

  // =========================================================================
  // Blood splatter overlay
  // =========================================================================

  private createBloodSplatter(): void {
    this.bloodSplatter = new Rectangle('bloodSplatter');
    this.bloodSplatter.width = 1;
    this.bloodSplatter.height = 1;
    this.bloodSplatter.thickness = 0;
    this.bloodSplatter.background = 'rgba(120, 0, 0, 0)';
    this.bloodSplatter.isVisible = false;
    this.bloodSplatter.isHitTestVisible = false;
    this.gui.addControl(this.bloodSplatter);
  }

  /** Trigger blood splatter effect. Intensity 0-1 based on damage severity. */
  triggerBloodSplatter(intensity: number): void {
    this.bloodAlpha = Math.min(0.5, intensity * 0.5);
    this.bloodSplatter.isVisible = true;
  }

  private updateBloodSplatter(): void {
    if (this.bloodAlpha > 0.01) {
      this.bloodAlpha *= 0.96; // decay
      this.bloodSplatter.background = `rgba(120, 0, 0, ${this.bloodAlpha.toFixed(3)})`;
      this.bloodSplatter.isVisible = true;
    } else {
      this.bloodSplatter.isVisible = false;
      this.bloodAlpha = 0;
    }
  }

  // =========================================================================
  // Disposal
  // =========================================================================

  dispose(): void {
    this.gui.dispose();
  }
}
