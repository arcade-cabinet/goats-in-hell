/**
 * HUD Weapon Slots — 4 weapon slot icons with active highlight.
 */
import {Rectangle, TextBlock, StackPanel, Control} from '@babylonjs/gui';
import type {AdvancedDynamicTexture} from '@babylonjs/gui';
import type {Entity, WeaponId} from '../../entities/components';
import {FONT} from './constants';

const WEAPON_IDS: WeaponId[] = ['hellPistol', 'brimShotgun', 'hellfireCannon', 'goatsBane'];

export interface WeaponSlotsControls {
  slots: Rectangle[];
}

export function createWeaponSlots(gui: AdvancedDynamicTexture): WeaponSlotsControls {
  const row = new StackPanel('weaponRow');
  row.isVertical = false;
  row.width = '130px';
  row.height = '30px';
  row.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
  row.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
  row.left = -20;
  row.top = 16;
  gui.addControl(row);

  const slots: Rectangle[] = [];
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

    slots.push(slot);
  }

  return {slots};
}

export function updateWeaponSlots(controls: WeaponSlotsControls, player: Entity): void {
  const currentWeapon = player.player?.currentWeapon ?? 'hellPistol';
  const ownedWeapons = player.player?.weapons ?? ['hellPistol'];

  for (let i = 0; i < 4; i++) {
    const slot = controls.slots[i];
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
