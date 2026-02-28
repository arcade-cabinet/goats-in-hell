/**
 * Babylon.js GUI HUD — thin orchestrator.
 *
 * Creates AdvancedDynamicTexture, delegates to submodules in hud/ for
 * each HUD component, and dispatches per-frame updates.
 */
import {Scene} from '@babylonjs/core';
import {AdvancedDynamicTexture} from '@babylonjs/gui';

import {world} from '../entities/world';
import type {Entity} from '../entities/components';
import {useGameStore, registerOnSave} from '../../state/GameStore';

// HUD submodules
import {createHealthBar, updateHealthBar} from './hud/HealthBar';
import type {HealthBarControls} from './hud/HealthBar';
import {createAmmoDisplay, updateAmmoDisplay} from './hud/AmmoDisplay';
import type {AmmoDisplayControls} from './hud/AmmoDisplay';
import {createCrosshair, updateCrosshair} from './hud/Crosshair';
import type {CrosshairControls} from './hud/Crosshair';
import {createMinimap, updateMinimap} from './hud/Minimap';
import type {MinimapControls} from './hud/Minimap';
import {createScoreDisplay, updateScoreDisplay} from './hud/ScoreDisplay';
import type {ScoreDisplayControls} from './hud/ScoreDisplay';
import {createBossBar, updateBossBar} from './hud/BossBar';
import type {BossBarControls} from './hud/BossBar';
import {createNotifications, updateNotifications, showSaveToast as showSaveToastImpl} from './hud/Notifications';
import type {NotificationControls} from './hud/Notifications';
import {createDamageIndicators, updateDamageIndicators} from './hud/DamageIndicators';
import type {DamageIndicatorControls} from './hud/DamageIndicators';
import {createWeaponSlots, updateWeaponSlots} from './hud/WeaponSlots';
import type {WeaponSlotsControls} from './hud/WeaponSlots';
import {createDebugOverlay, updateDebugOverlay} from './hud/DebugOverlay';
import type {DebugOverlayControls} from './hud/DebugOverlay';

// Re-export public module-level APIs so existing imports from 'BabylonHUD' still work
export {resetBossPhase} from './hud/BossBar';
export {registerDamageDirection, triggerBloodSplatter, resetDamageIndicators} from './hud/DamageIndicators';
export {triggerEnvKill, showFloorStats, isFloorStatsActive, showSaveToast} from './hud/Notifications';

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function getPlayer(): Entity | undefined {
  return world.entities.find(e => e.type === 'player');
}

// ---------------------------------------------------------------------------
// BabylonHUD class
// ---------------------------------------------------------------------------

export class BabylonHUD {
  private gui: AdvancedDynamicTexture;

  private healthBar: HealthBarControls;
  private ammoDisplay: AmmoDisplayControls;
  private crosshair: CrosshairControls;
  private minimap: MinimapControls;
  private scoreDisplay: ScoreDisplayControls;
  private bossBar: BossBarControls;
  private notifications: NotificationControls;
  private damageIndicators: DamageIndicatorControls;
  private weaponSlots: WeaponSlotsControls;
  private debugOverlay: DebugOverlayControls;

  constructor(scene: Scene) {
    this.gui = AdvancedDynamicTexture.CreateFullscreenUI('HUD', true, scene);
    this.gui.idealHeight = 900;
    this.gui.renderAtIdealSize = true;

    // Create all HUD components (order matters for z-layering)
    this.healthBar = createHealthBar(this.gui);
    this.ammoDisplay = createAmmoDisplay(this.gui);
    this.crosshair = createCrosshair(this.gui);
    this.scoreDisplay = createScoreDisplay(this.gui);
    this.bossBar = createBossBar(this.gui);
    this.minimap = createMinimap(this.gui);
    this.weaponSlots = createWeaponSlots(this.gui);
    this.debugOverlay = createDebugOverlay(this.gui);
    this.notifications = createNotifications(this.gui);
    this.damageIndicators = createDamageIndicators(this.gui);

    // Register save callback to show "Game Saved" toast
    registerOnSave(() => showSaveToastImpl());
  }

  update(): void {
    const storeState = useGameStore.getState();
    if (storeState.screen !== 'playing') {
      this.gui.rootContainer.isVisible = false;
      return;
    }
    this.gui.rootContainer.isVisible = true;

    const player = getPlayer();
    if (!player) return;

    updateHealthBar(this.healthBar, player);
    updateAmmoDisplay(this.ammoDisplay, player);
    this.crosshair.currentGap = updateCrosshair(this.crosshair, storeState.hitMarker ?? 0, player);
    this.scoreDisplay = updateScoreDisplay(this.scoreDisplay, storeState);
    updateBossBar(this.bossBar, storeState);
    this.minimap.lastUpdate = updateMinimap(this.minimap, storeState.stage.encounterType);
    updateWeaponSlots(this.weaponSlots, player);
    updateDebugOverlay(this.debugOverlay, storeState);
    this.notifications = updateNotifications(this.notifications, player, storeState);
    this.damageIndicators.bloodAlpha = updateDamageIndicators(this.damageIndicators, this.gui.getScene()!);
  }

  dispose(): void {
    this.gui.dispose();
  }
}
