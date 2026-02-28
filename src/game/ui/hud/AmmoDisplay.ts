/**
 * HUD Ammo Display — ammo count, weapon name, reload bar.
 */
import {Rectangle, TextBlock, StackPanel, Control} from '@babylonjs/gui';
import type {AdvancedDynamicTexture} from '@babylonjs/gui';
import type {Entity, WeaponId} from '../../entities/components';
import {weapons} from '../../weapons/weapons';
import {getGameTime} from '../../systems/GameClock';
import {FONT} from './constants';

export interface AmmoDisplayControls {
  ammoText: TextBlock;
  weaponNameText: TextBlock;
  reloadBarInner: Rectangle;
  ammoContainer: StackPanel;
  reloadContainer: StackPanel;
}

export function createAmmoDisplay(gui: AdvancedDynamicTexture): AmmoDisplayControls {
  const ammoContainer = new StackPanel('ammoPanel');
  ammoContainer.width = '200px';
  ammoContainer.height = '70px';
  ammoContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
  ammoContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
  ammoContainer.left = -20;
  ammoContainer.top = -20;
  ammoContainer.background = 'rgba(10, 5, 5, 0.75)';
  gui.addControl(ammoContainer);

  const ammoText = new TextBlock('ammoText', '30/30 | 120');
  ammoText.fontFamily = FONT;
  ammoText.fontSize = 22;
  ammoText.color = '#ffffff';
  ammoText.fontWeight = 'bold';
  ammoText.height = '36px';
  ammoText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
  ammoText.paddingRight = 10;
  ammoContainer.addControl(ammoText);

  const weaponNameText = new TextBlock('weaponName', 'HELL PISTOL');
  weaponNameText.fontFamily = FONT;
  weaponNameText.fontSize = 10;
  weaponNameText.color = '#cc0000';
  weaponNameText.height = '16px';
  weaponNameText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
  weaponNameText.paddingRight = 10;
  ammoContainer.addControl(weaponNameText);

  const reloadContainer = new StackPanel('reloadPanel');
  reloadContainer.width = '200px';
  reloadContainer.height = '70px';
  reloadContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
  reloadContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
  reloadContainer.left = -20;
  reloadContainer.top = -20;
  reloadContainer.background = 'rgba(10, 5, 5, 0.75)';
  reloadContainer.isVisible = false;
  gui.addControl(reloadContainer);

  const reloadText = new TextBlock('reloadText', 'RELOADING');
  reloadText.fontFamily = FONT;
  reloadText.fontSize = 18;
  reloadText.color = '#ffaa00';
  reloadText.fontWeight = 'bold';
  reloadText.height = '32px';
  reloadText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
  reloadText.paddingRight = 10;
  reloadContainer.addControl(reloadText);

  const reloadBarOuter = new Rectangle('reloadBarOuter');
  reloadBarOuter.width = '150px';
  reloadBarOuter.height = '8px';
  reloadBarOuter.background = '#1a0505';
  reloadBarOuter.thickness = 1;
  reloadBarOuter.color = 'rgba(255, 170, 0, 0.3)';
  reloadBarOuter.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
  reloadBarOuter.paddingRight = 10;
  reloadContainer.addControl(reloadBarOuter);

  const reloadBarInner = new Rectangle('reloadBarInner');
  reloadBarInner.width = 0;
  reloadBarInner.height = 1;
  reloadBarInner.background = '#ffaa00';
  reloadBarInner.thickness = 0;
  reloadBarInner.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  reloadBarOuter.addControl(reloadBarInner);

  return {ammoText, weaponNameText, reloadBarInner, ammoContainer, reloadContainer};
}

export function updateAmmoDisplay(controls: AmmoDisplayControls, player: Entity): void {
  const currentWeapon: WeaponId = player.player?.currentWeapon ?? 'hellPistol';
  const weaponDef = weapons[currentWeapon];
  const isReloading = player.player?.isReloading ?? false;
  const reloadStart = player.player?.reloadStart ?? 0;
  const reloadTime = weaponDef?.reloadTime ?? 1500;

  if (isReloading) {
    controls.ammoContainer.isVisible = false;
    controls.reloadContainer.isVisible = true;
    const progress = Math.min(1, (getGameTime() - reloadStart) / reloadTime);
    controls.reloadBarInner.width = progress;
  } else {
    controls.ammoContainer.isVisible = true;
    controls.reloadContainer.isVisible = false;
    const ammoData = player.ammo?.[currentWeapon];
    const current = ammoData?.current ?? 0;
    const mag = ammoData?.magSize ?? weaponDef?.magSize ?? 0;
    const reserve = ammoData?.reserve ?? 0;
    controls.ammoText.text = `${current}/${mag} | ${reserve}`;

    const ammoRatio = mag > 0 ? current / mag : 1;
    if (current === 0) {
      const flash = Math.sin(getGameTime() * 0.03) > 0;
      controls.ammoText.color = flash ? '#ff2200' : '#880000';
    } else if (ammoRatio <= 0.25) {
      const pulse = 0.6 + Math.sin(getGameTime() * 0.015) * 0.4;
      const r = Math.round(255 * pulse);
      controls.ammoText.color = `rgb(${r}, ${Math.round(80 * pulse)}, 0)`;
    } else {
      controls.ammoText.color = '#ffffff';
    }
  }

  controls.weaponNameText.text = weaponDef?.name?.toUpperCase() ?? 'UNKNOWN';
}
