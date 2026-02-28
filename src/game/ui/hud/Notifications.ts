/**
 * HUD Notifications — kill streaks, headshot, env kills, weapon pickup,
 * floor stats, tutorial hints, floor announcement, lore overlay, secret
 * notification, save toast.
 */
import {Rectangle, TextBlock, StackPanel, Control} from '@babylonjs/gui';
import type {AdvancedDynamicTexture} from '@babylonjs/gui';
import {Vector3} from '@babylonjs/core';
import type {Entity} from '../../entities/components';
import {world} from '../../entities/world';
import {weapons} from '../../weapons/weapons';
import {getGameTime} from '../../systems/GameClock';
import {getAnnouncement} from '../../systems/KillStreakSystem';
import {getActiveBuffs} from '../../systems/PowerUpSystem';
import {getHeadshotTimer, tickHeadshotTimer} from '../../weapons/WeaponSystem';
import {getLoreEntries} from '../../rendering/LoreMessages';
import {getSecretNotifyTimer, tickSecretTimer} from '../../systems/SecretRoomSystem';
import {getThemeForFloor} from '../../levels/FloorThemes';
import {useGameStore} from '../../../state/GameStore';
import {FONT} from './constants';

// ---------------------------------------------------------------------------
// Module-level state for notifications triggered externally
// ---------------------------------------------------------------------------

const ENV_KILL_MESSAGES: Record<string, string[]> = {
  void: ['VOID CLAIMED', 'INTO THE ABYSS', 'CONSUMED BY DARKNESS'],
  lava: ['LAVA BATH', 'SMELTED', 'MAGMA DIP'],
  barrel: ['BARREL BLAST', 'CHAIN REACTION', 'KABLOOM'],
};

let envKillMessage = '';
let envKillTimer = 0;
const ENV_KILL_DURATION = 90;

export function triggerEnvKill(type: 'void' | 'lava' | 'barrel'): void {
  const msgs = ENV_KILL_MESSAGES[type] ?? ['ENVIRONMENTAL KILL'];
  envKillMessage = msgs[Math.floor(Math.random() * msgs.length)];
  envKillTimer = ENV_KILL_DURATION;
}

interface FloorStats {
  kills: number;
  accuracy: number;
  secrets: number;
  timeSeconds: number;
}

let floorStatsData: FloorStats | null = null;
let floorStatsTimer = 0;
const FLOOR_STATS_DURATION = 100;

export function showFloorStats(stats: FloorStats): void {
  floorStatsData = stats;
  floorStatsTimer = FLOOR_STATS_DURATION;
}

export function isFloorStatsActive(): boolean {
  return floorStatsTimer > 0;
}

let saveToastTimer = 0;
const SAVE_TOAST_DURATION = 120;

export function showSaveToast(): void {
  saveToastTimer = SAVE_TOAST_DURATION;
}

// ---------------------------------------------------------------------------
// Controls interface
// ---------------------------------------------------------------------------

export interface NotificationControls {
  // Kill feedback
  killText: TextBlock;
  killTimer: number;
  streakText: TextBlock;
  lastKills: number;
  // Buff icons
  buffTexts: TextBlock[];
  // Weapon pickup
  weaponPickupText: TextBlock;
  weaponPickupTimer: number;
  lastWeaponCount: number;
  // Tutorial
  tutorialText: TextBlock;
  tutorialTimer: number;
  shownHints: Set<string>;
  tutorialFrameCount: number;
  // Floor announcement
  floorAnnounceText: TextBlock;
  floorAnnounceSubText: TextBlock;
  floorAnnounceTimer: number;
  lastAnnouncedFloor: number;
  // Headshot
  headshotText: TextBlock;
  // Lore
  loreOverlay: Rectangle;
  loreHeaderText: TextBlock;
  loreBodyText: TextBlock;
  lorePromptText: TextBlock;
  loreVisible: boolean;
  // Secret
  secretText: TextBlock;
  // Env kill
  envKillText: TextBlock;
  // Floor stats
  floorStatsPanel: Rectangle;
  floorStatsTexts: TextBlock[];
  // Save toast
  saveToastText: TextBlock;
}

export function createNotifications(gui: AdvancedDynamicTexture): NotificationControls {
  // Kill confirmation
  const killText = new TextBlock('killConfirm', '');
  killText.fontFamily = FONT;
  killText.fontSize = 16;
  killText.fontWeight = 'bold';
  killText.color = '#ffcc00';
  killText.top = 30;
  killText.isVisible = false;
  gui.addControl(killText);

  // Streak
  const streakText = new TextBlock('streak', '');
  streakText.fontFamily = FONT;
  streakText.fontSize = 24;
  streakText.fontWeight = 'bold';
  streakText.color = '#ff6600';
  streakText.shadowColor = 'rgba(255, 100, 0, 0.6)';
  streakText.shadowBlur = 10;
  streakText.top = 110;
  streakText.isVisible = false;
  gui.addControl(streakText);

  // Buff display (up to 3)
  const buffTexts: TextBlock[] = [];
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
    gui.addControl(bt);
    buffTexts.push(bt);
  }

  // Weapon pickup
  const weaponPickupText = new TextBlock('weaponPickup', '');
  weaponPickupText.fontFamily = FONT;
  weaponPickupText.fontSize = 22;
  weaponPickupText.fontWeight = 'bold';
  weaponPickupText.color = '#ff8800';
  weaponPickupText.shadowColor = 'rgba(255, 136, 0, 0.6)';
  weaponPickupText.shadowBlur = 10;
  weaponPickupText.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
  weaponPickupText.top = -60;
  weaponPickupText.isVisible = false;
  gui.addControl(weaponPickupText);

  // Tutorial hints
  let shownHints = new Set<string>();
  try {
    const stored = localStorage.getItem('goats-in-hell-hints');
    if (stored) shownHints = new Set(JSON.parse(stored));
  } catch { /* ignore */ }

  const tutorialText = new TextBlock('tutorial', '');
  tutorialText.fontFamily = FONT;
  tutorialText.fontSize = 20;
  tutorialText.fontWeight = 'bold';
  tutorialText.color = '#aaccff';
  tutorialText.shadowColor = 'rgba(50, 100, 200, 0.6)';
  tutorialText.shadowBlur = 8;
  tutorialText.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
  tutorialText.top = 60;
  tutorialText.isVisible = false;
  gui.addControl(tutorialText);

  // Floor announcement
  const floorAnnounceText = new TextBlock('floorAnnounce', '');
  floorAnnounceText.fontFamily = FONT;
  floorAnnounceText.fontSize = 48;
  floorAnnounceText.fontWeight = 'bold';
  floorAnnounceText.color = '#cc0000';
  floorAnnounceText.shadowColor = 'rgba(0, 0, 0, 0.8)';
  floorAnnounceText.shadowBlur = 12;
  floorAnnounceText.shadowOffsetX = 2;
  floorAnnounceText.shadowOffsetY = 2;
  floorAnnounceText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
  floorAnnounceText.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
  floorAnnounceText.top = -30;
  floorAnnounceText.alpha = 0;
  floorAnnounceText.isHitTestVisible = false;
  gui.addControl(floorAnnounceText);

  const floorAnnounceSubText = new TextBlock('floorAnnounceSub', '');
  floorAnnounceSubText.fontFamily = FONT;
  floorAnnounceSubText.fontSize = 18;
  floorAnnounceSubText.color = '#884433';
  floorAnnounceSubText.shadowColor = 'rgba(0, 0, 0, 0.6)';
  floorAnnounceSubText.shadowBlur = 8;
  floorAnnounceSubText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
  floorAnnounceSubText.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
  floorAnnounceSubText.top = 20;
  floorAnnounceSubText.alpha = 0;
  floorAnnounceSubText.isHitTestVisible = false;
  gui.addControl(floorAnnounceSubText);

  // Headshot
  const headshotText = new TextBlock('headshotNotif', 'HEADSHOT!');
  headshotText.fontFamily = FONT;
  headshotText.fontSize = 22;
  headshotText.fontWeight = 'bold';
  headshotText.color = '#ffdd00';
  headshotText.shadowColor = 'rgba(255, 100, 0, 0.8)';
  headshotText.shadowBlur = 10;
  headshotText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
  headshotText.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
  headshotText.top = -70;
  headshotText.alpha = 0;
  headshotText.isHitTestVisible = false;
  gui.addControl(headshotText);

  // Lore overlay
  const loreOverlay = new Rectangle('loreOverlay');
  loreOverlay.width = '500px';
  loreOverlay.height = '200px';
  loreOverlay.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
  loreOverlay.top = 80;
  loreOverlay.thickness = 1;
  loreOverlay.color = 'rgba(180, 40, 0, 0.6)';
  loreOverlay.background = 'rgba(10, 0, 0, 0.85)';
  loreOverlay.cornerRadius = 4;
  loreOverlay.isVisible = false;
  gui.addControl(loreOverlay);

  const loreHeaderText = new TextBlock('loreHeader', '');
  loreHeaderText.fontFamily = FONT;
  loreHeaderText.fontSize = 22;
  loreHeaderText.color = '#cc3300';
  loreHeaderText.textWrapping = true;
  loreHeaderText.top = -50;
  loreHeaderText.heightInPixels = 40;
  loreOverlay.addControl(loreHeaderText);

  const loreBodyText = new TextBlock('loreBody', '');
  loreBodyText.fontFamily = FONT;
  loreBodyText.fontSize = 14;
  loreBodyText.color = '#aa8866';
  loreBodyText.textWrapping = true;
  loreBodyText.top = 15;
  loreBodyText.heightInPixels = 100;
  loreBodyText.paddingLeftInPixels = 20;
  loreBodyText.paddingRightInPixels = 20;
  loreOverlay.addControl(loreBodyText);

  const lorePromptText = new TextBlock('lorePrompt', '');
  lorePromptText.fontFamily = FONT;
  lorePromptText.fontSize = 12;
  lorePromptText.color = 'rgba(200, 150, 100, 0.8)';
  lorePromptText.top = 40;
  lorePromptText.isVisible = false;
  gui.addControl(lorePromptText);

  // Secret notification
  const secretText = new TextBlock('secretText', 'SECRET FOUND!');
  secretText.fontFamily = FONT;
  secretText.fontSize = 32;
  secretText.color = '#ffdd00';
  secretText.outlineWidth = 2;
  secretText.outlineColor = '#884400';
  secretText.shadowColor = '#ff8800';
  secretText.shadowOffsetX = 0;
  secretText.shadowOffsetY = 0;
  secretText.shadowBlur = 12;
  secretText.top = -120;
  secretText.alpha = 0;
  gui.addControl(secretText);

  // Env kill message
  const envKillText = new TextBlock('envKill', '');
  envKillText.color = '#ff6633';
  envKillText.fontSize = 20;
  envKillText.fontWeight = 'bold';
  envKillText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
  envKillText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
  envKillText.top = 60;
  envKillText.outlineWidth = 2;
  envKillText.outlineColor = '#000000';
  envKillText.isVisible = false;
  gui.addControl(envKillText);

  // Floor stats panel
  const floorStatsPanel = new Rectangle('floorStats');
  floorStatsPanel.width = '280px';
  floorStatsPanel.height = '120px';
  floorStatsPanel.background = 'rgba(0, 0, 0, 0.7)';
  floorStatsPanel.thickness = 1;
  floorStatsPanel.color = 'rgba(255, 100, 50, 0.6)';
  floorStatsPanel.cornerRadius = 4;
  floorStatsPanel.top = -60;
  floorStatsPanel.isVisible = false;
  floorStatsPanel.isHitTestVisible = false;
  gui.addControl(floorStatsPanel);

  const floorStatsTexts: TextBlock[] = [];
  const header = new TextBlock('fsHeader', 'FLOOR CLEARED');
  header.color = '#ff6633';
  header.fontSize = 16;
  header.fontWeight = 'bold';
  header.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
  header.top = -42;
  floorStatsPanel.addControl(header);
  floorStatsTexts.push(header);

  const lineNames = ['fsKills', 'fsAccuracy', 'fsSecrets', 'fsTime'];
  for (let i = 0; i < 4; i++) {
    const line = new TextBlock(lineNames[i], '');
    line.color = '#cccccc';
    line.fontSize = 13;
    line.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    line.top = -20 + i * 18;
    floorStatsPanel.addControl(line);
    floorStatsTexts.push(line);
  }

  // Save toast
  const saveToastText = new TextBlock('saveToast', 'GAME SAVED');
  saveToastText.fontFamily = FONT;
  saveToastText.fontSize = 14;
  saveToastText.fontWeight = 'bold';
  saveToastText.color = '#44cc44';
  saveToastText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
  saveToastText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
  saveToastText.top = 46;
  saveToastText.isVisible = false;
  gui.addControl(saveToastText);

  return {
    killText, killTimer: 0, streakText, lastKills: 0,
    buffTexts,
    weaponPickupText, weaponPickupTimer: 0, lastWeaponCount: 1,
    tutorialText, tutorialTimer: 0, shownHints, tutorialFrameCount: 0,
    floorAnnounceText, floorAnnounceSubText, floorAnnounceTimer: 0, lastAnnouncedFloor: 0,
    headshotText,
    loreOverlay, loreHeaderText, loreBodyText, lorePromptText, loreVisible: false,
    secretText,
    envKillText,
    floorStatsPanel, floorStatsTexts,
    saveToastText,
  };
}

// ---------------------------------------------------------------------------
// Per-frame updates
// ---------------------------------------------------------------------------

function showHint(controls: NotificationControls, id: string, message: string): void {
  if (controls.shownHints.has(id)) return;
  if (controls.tutorialTimer > 0) return;

  controls.shownHints.add(id);
  try {
    localStorage.setItem(
      'goats-in-hell-hints',
      JSON.stringify([...controls.shownHints]),
    );
  } catch { /* ignore */ }

  controls.tutorialText.text = message;
  controls.tutorialText.isVisible = true;
  controls.tutorialText.alpha = 1;
  controls.tutorialTimer = 180;
}

export function updateNotifications(
  controls: NotificationControls,
  player: Entity,
  state: ReturnType<typeof useGameStore.getState>,
): NotificationControls {
  // Kill feedback
  const kills = state.kills;
  if (kills > controls.lastKills) {
    const killsDelta = kills - controls.lastKills;
    controls.lastKills = kills;
    const scoreGain = killsDelta * 100;
    controls.killText.text = `+${scoreGain}`;
    controls.killText.isVisible = true;
    controls.killTimer = 60;
  }

  const announcement = getAnnouncement();
  if (announcement) {
    controls.streakText.text = announcement.label;
    controls.streakText.color = announcement.color;
    controls.streakText.shadowColor = announcement.color + '99';
    controls.streakText.isVisible = true;
    const scale = 1.0 + (1.0 - announcement.progress) * 0.5;
    controls.streakText.fontSize = Math.round(28 * scale);
    controls.streakText.alpha = 1.0 - announcement.progress * 0.3;
  } else {
    controls.streakText.isVisible = false;
  }

  if (controls.killTimer > 0) {
    controls.killTimer--;
    controls.killText.alpha = Math.min(1, controls.killTimer / 20);
    controls.killText.top = 30 - (60 - controls.killTimer) * 0.3;
    if (controls.killTimer <= 0) controls.killText.isVisible = false;
  }

  // Buff icons
  const buffs = getActiveBuffs();
  for (let i = 0; i < controls.buffTexts.length; i++) {
    const bt = controls.buffTexts[i];
    if (i < buffs.length) {
      const buff = buffs[i];
      const remaining = Math.ceil((1 - buff.progress) * (buff.type === 'hellSpeed' ? 8 : buff.type === 'quadDamage' ? 10 : 30));
      const shieldInfo = buff.shieldFraction !== undefined
        ? ` [${Math.round(buff.shieldFraction * 100)}%]`
        : '';
      bt.text = `${buff.label} ${remaining}s${shieldInfo}`;
      bt.color = buff.color;
      bt.isVisible = true;
      bt.alpha = buff.progress > 0.7 ? 0.5 + Math.sin(getGameTime() * 0.01) * 0.5 : 1;
    } else {
      bt.isVisible = false;
    }
  }

  // Weapon pickup
  if (player.player) {
    const weaponCount = player.player.weapons.length;
    if (weaponCount > controls.lastWeaponCount) {
      const newWeapon = player.player.weapons[weaponCount - 1];
      const weaponName = weapons[newWeapon]?.name ?? newWeapon;
      controls.weaponPickupText.text = `NEW WEAPON: ${weaponName.toUpperCase()}`;
      controls.weaponPickupText.isVisible = true;
      controls.weaponPickupText.alpha = 1;
      controls.weaponPickupTimer = 180;
    }
    controls.lastWeaponCount = weaponCount;
  }
  if (controls.weaponPickupTimer > 0) {
    controls.weaponPickupTimer--;
    controls.weaponPickupText.alpha = Math.min(1, controls.weaponPickupTimer / 30);
    if (controls.weaponPickupTimer <= 0) controls.weaponPickupText.isVisible = false;
  }

  // Tutorial hints
  controls.tutorialFrameCount++;
  if (controls.tutorialTimer > 0) {
    controls.tutorialTimer--;
    controls.tutorialText.alpha = Math.min(1, controls.tutorialTimer / 30);
    if (controls.tutorialTimer <= 0) controls.tutorialText.isVisible = false;
  }
  if (controls.tutorialFrameCount === 60) {
    showHint(controls, 'move', 'WASD to move  |  Mouse to look');
  }
  if (controls.tutorialFrameCount > 180 && !controls.shownHints.has('shoot')) {
    const hasNearEnemy = world.entities.some(e => {
      if (!e.enemy || !e.position || !player.position) return false;
      return e.position.subtract(player.position).length() < 15;
    });
    if (hasNearEnemy) showHint(controls, 'shoot', 'Click to SHOOT');
  }
  if (!controls.shownHints.has('reload') && player.player && player.ammo) {
    const wep = player.player.currentWeapon;
    const ammoInfo = player.ammo[wep];
    if (ammoInfo && ammoInfo.current <= 1 && ammoInfo.current < ammoInfo.magSize) {
      showHint(controls, 'reload', 'R to RELOAD');
    }
  }
  if (!controls.shownHints.has('switch') && player.player && player.player.weapons.length > 1) {
    showHint(controls, 'switch', 'TAB or 1-4 to switch weapons');
  }
  if (controls.tutorialFrameCount === 600 && !controls.shownHints.has('sprint')) {
    showHint(controls, 'sprint', 'Hold SHIFT to sprint');
  }

  // Floor announcement
  const floor = state.stage.floor;
  if (floor !== controls.lastAnnouncedFloor && state.screen === 'playing') {
    controls.lastAnnouncedFloor = floor;
    const theme = getThemeForFloor(floor);
    const encounter = state.stage.encounterType;
    let title: string;
    if (encounter === 'boss') title = 'BOSS FIGHT';
    else if (encounter === 'arena') title = `ARENA — FLOOR ${floor}`;
    else title = `FLOOR ${floor}`;
    controls.floorAnnounceText.text = title;
    controls.floorAnnounceSubText.text = theme.displayName;
    controls.floorAnnounceTimer = 180;
  }
  if (controls.floorAnnounceTimer > 0) {
    controls.floorAnnounceTimer--;
    let alpha: number;
    if (controls.floorAnnounceTimer > 150) alpha = (180 - controls.floorAnnounceTimer) / 30;
    else if (controls.floorAnnounceTimer > 40) alpha = 1;
    else alpha = controls.floorAnnounceTimer / 40;
    controls.floorAnnounceText.alpha = alpha;
    controls.floorAnnounceSubText.alpha = alpha * 0.8;
  } else {
    controls.floorAnnounceText.alpha = 0;
    controls.floorAnnounceSubText.alpha = 0;
  }

  // Headshot
  const hsTimer = getHeadshotTimer();
  tickHeadshotTimer();
  if (hsTimer > 0) {
    const alpha = hsTimer > 70 ? (90 - hsTimer) / 20 : hsTimer / 30;
    controls.headshotText.alpha = Math.min(1, alpha);
    const scale = hsTimer > 75 ? 1 + (90 - hsTimer) * 0.02 : 1;
    controls.headshotText.fontSize = Math.round(22 * scale);
  } else {
    controls.headshotText.alpha = 0;
  }

  // Lore overlay
  const entries = getLoreEntries();
  if (entries.length === 0 || !player.position) {
    controls.loreOverlay.isVisible = false;
    controls.lorePromptText.isVisible = false;
    controls.loreVisible = false;
  } else {
    let closest: (typeof entries)[number] | null = null;
    let closestDist = Infinity;
    for (const entry of entries) {
      const dist = Vector3.Distance(player.position, entry.position);
      if (dist < closestDist) { closestDist = dist; closest = entry; }
    }
    const PROXIMITY = 3.5;
    const SHOW_PROMPT = 5.0;
    if (closest && closestDist < SHOW_PROMPT) {
      controls.lorePromptText.isVisible = true;
      controls.lorePromptText.text = closestDist < PROXIMITY ? '[ READING... ]' : '[ APPROACH TO READ ]';
      controls.lorePromptText.alpha = Math.min(1, (SHOW_PROMPT - closestDist) / (SHOW_PROMPT - PROXIMITY));
    } else {
      controls.lorePromptText.isVisible = false;
    }
    if (closest && closestDist < PROXIMITY) {
      if (!controls.loreVisible) {
        controls.loreVisible = true;
        controls.loreHeaderText.text = `"${closest.text}"`;
        controls.loreBodyText.text = closest.extendedText;
      }
      const alpha = Math.min(1, (PROXIMITY - closestDist) / 1.5);
      controls.loreOverlay.isVisible = true;
      controls.loreOverlay.alpha = alpha;
    } else {
      controls.loreOverlay.isVisible = false;
      controls.loreVisible = false;
    }
  }

  // Secret notification
  const secTimer = getSecretNotifyTimer();
  tickSecretTimer();
  if (secTimer > 0) {
    let alpha: number;
    if (secTimer > 100) alpha = (120 - secTimer) / 20;
    else if (secTimer > 30) alpha = 1;
    else alpha = secTimer / 30;
    controls.secretText.alpha = alpha;
    const pulse = 1 + 0.05 * Math.sin(secTimer * 0.15);
    controls.secretText.scaleX = pulse;
    controls.secretText.scaleY = pulse;
  } else {
    controls.secretText.alpha = 0;
  }

  // Env kill message
  if (envKillTimer > 0) {
    envKillTimer--;
    controls.envKillText.text = envKillMessage;
    controls.envKillText.isVisible = true;
    const fadeIn = Math.min(1, (ENV_KILL_DURATION - envKillTimer) / 10);
    const fadeOut = Math.min(1, envKillTimer / 20);
    controls.envKillText.alpha = Math.min(fadeIn, fadeOut);
    controls.envKillText.top = 60 - (1 - fadeIn) * 15;
  } else {
    controls.envKillText.isVisible = false;
  }

  // Floor stats
  if (floorStatsTimer > 0 && floorStatsData) {
    floorStatsTimer--;
    controls.floorStatsPanel.isVisible = true;
    const fadeIn = Math.min(1, (FLOOR_STATS_DURATION - floorStatsTimer) / 15);
    const fadeOut = Math.min(1, floorStatsTimer / 20);
    controls.floorStatsPanel.alpha = Math.min(fadeIn, fadeOut);
    const s = floorStatsData;
    controls.floorStatsTexts[1].text = `KILLS: ${s.kills}`;
    controls.floorStatsTexts[2].text = `ACCURACY: ${s.accuracy}%`;
    controls.floorStatsTexts[3].text = `SECRETS: ${s.secrets}`;
    controls.floorStatsTexts[4].text = `TIME: ${s.timeSeconds}s`;
  } else {
    controls.floorStatsPanel.isVisible = false;
  }

  // Save toast
  if (saveToastTimer > 0) {
    saveToastTimer--;
    controls.saveToastText.isVisible = true;
    const fadeIn = Math.min(1, (SAVE_TOAST_DURATION - saveToastTimer) / 15);
    const fadeOut = Math.min(1, saveToastTimer / 30);
    controls.saveToastText.alpha = Math.min(fadeIn, fadeOut);
  } else {
    controls.saveToastText.isVisible = false;
  }

  return controls;
}
