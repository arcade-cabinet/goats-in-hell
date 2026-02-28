/**
 * HUD Damage Direction Indicators + Blood Splatter.
 */
import {Rectangle, Control} from '@babylonjs/gui';
import type {AdvancedDynamicTexture} from '@babylonjs/gui';
import {Vector3} from '@babylonjs/core';
import type {FreeCamera} from '@babylonjs/core';

// Module-level state
const damageIndicators = [0, 0, 0, 0]; // front, right, back, left
const INDICATOR_DECAY = 0.97;
const pendingDamageSources: Vector3[] = [];

export function registerDamageDirection(sourcePos: Vector3): void {
  pendingDamageSources.push(sourcePos.clone());
}

export function resetDamageIndicators(): void {
  damageIndicators[0] = damageIndicators[1] = damageIndicators[2] = damageIndicators[3] = 0;
  pendingDamageSources.length = 0;
}

let bloodSplatterCallback: ((intensity: number) => void) | null = null;

export function triggerBloodSplatter(intensity: number): void {
  if (bloodSplatterCallback) bloodSplatterCallback(intensity);
}

export interface DamageIndicatorControls {
  arcs: Rectangle[];
  bloodSplatter: Rectangle;
  bloodAlpha: number;
}

export function createDamageIndicators(gui: AdvancedDynamicTexture): DamageIndicatorControls {
  const arcs: Rectangle[] = [];
  const configs = [
    {name: 'dmgTop', hAlign: Control.HORIZONTAL_ALIGNMENT_CENTER, vAlign: Control.VERTICAL_ALIGNMENT_TOP, w: '40%', h: '6px'},
    {name: 'dmgRight', hAlign: Control.HORIZONTAL_ALIGNMENT_RIGHT, vAlign: Control.VERTICAL_ALIGNMENT_CENTER, w: '6px', h: '40%'},
    {name: 'dmgBottom', hAlign: Control.HORIZONTAL_ALIGNMENT_CENTER, vAlign: Control.VERTICAL_ALIGNMENT_BOTTOM, w: '40%', h: '6px'},
    {name: 'dmgLeft', hAlign: Control.HORIZONTAL_ALIGNMENT_LEFT, vAlign: Control.VERTICAL_ALIGNMENT_CENTER, w: '6px', h: '40%'},
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
    gui.addControl(bar);
    arcs.push(bar);
  }

  // Blood splatter overlay
  const bloodSplatter = new Rectangle('bloodSplatter');
  bloodSplatter.width = 1;
  bloodSplatter.height = 1;
  bloodSplatter.thickness = 0;
  bloodSplatter.background = 'rgba(120, 0, 0, 0)';
  bloodSplatter.isVisible = false;
  bloodSplatter.isHitTestVisible = false;
  gui.addControl(bloodSplatter);

  // Register splatter callback
  bloodSplatterCallback = (intensity: number) => {
    controls.bloodAlpha = Math.min(0.5, intensity * 0.5);
    controls.bloodSplatter.isVisible = true;
  };

  const controls: DamageIndicatorControls = {arcs, bloodSplatter, bloodAlpha: 0};
  return controls;
}

export function updateDamageIndicators(
  controls: DamageIndicatorControls,
  scene: {activeCamera: any},
): number {
  if (!scene?.activeCamera) return controls.bloodAlpha;

  const cam = scene.activeCamera as FreeCamera;
  const camYaw = cam.rotation.y;

  while (pendingDamageSources.length > 0) {
    const src = pendingDamageSources.pop()!;
    const dx = src.x - cam.position.x;
    const dz = src.z - cam.position.z;
    const sourceAngle = Math.atan2(dx, dz);
    let relAngle = sourceAngle - camYaw;
    while (relAngle > Math.PI) relAngle -= Math.PI * 2;
    while (relAngle < -Math.PI) relAngle += Math.PI * 2;

    if (relAngle >= -Math.PI / 4 && relAngle < Math.PI / 4) {
      damageIndicators[0] = Math.max(damageIndicators[0], 1);
    } else if (relAngle >= Math.PI / 4 && relAngle < 3 * Math.PI / 4) {
      damageIndicators[1] = Math.max(damageIndicators[1], 1);
    } else if (relAngle >= -3 * Math.PI / 4 && relAngle < -Math.PI / 4) {
      damageIndicators[3] = Math.max(damageIndicators[3], 1);
    } else {
      damageIndicators[2] = Math.max(damageIndicators[2], 1);
    }
  }

  for (let i = 0; i < 4; i++) {
    controls.arcs[i].alpha = damageIndicators[i];
    damageIndicators[i] *= INDICATOR_DECAY;
    if (damageIndicators[i] < 0.01) damageIndicators[i] = 0;
  }

  // Blood splatter decay
  if (controls.bloodAlpha > 0.01) {
    controls.bloodAlpha *= 0.96;
    controls.bloodSplatter.background = `rgba(120, 0, 0, ${controls.bloodAlpha.toFixed(3)})`;
    controls.bloodSplatter.isVisible = true;
  } else {
    controls.bloodSplatter.isVisible = false;
    controls.bloodAlpha = 0;
  }

  return controls.bloodAlpha;
}
