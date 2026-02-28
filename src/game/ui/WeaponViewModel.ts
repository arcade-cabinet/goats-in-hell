/**
 * First-person weapon viewmodel — GLB models parented to the camera.
 *
 * Each weapon type loads a pre-cached GLB model from the asset pipeline.
 * The viewmodel bobs with player movement and kicks upward on fire.
 */
import {
  Color3,
  FreeCamera,
  Mesh,
  PBRMaterial,
  StandardMaterial,
  Scene,
  TransformNode,
  Vector3,
} from '@babylonjs/core';

import {world} from '../entities/world';
import {useGameStore} from '../../state/GameStore';
import {GameState} from '../../state/GameState';
import {getGameTime} from '../systems/GameClock';
import type {WeaponId} from '../entities/components';
import {weapons} from '../weapons/weapons';
import {loadWeaponModel, cloneModelHierarchy} from '../systems/AssetLoader';
import type {WeaponModelKey} from '../systems/AssetRegistry';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const BASE_POS = new Vector3(0.04, -0.15, 0.25);
const BOB_AMP = 0.012;
const BOB_FREQ = 0.007;

// Per-weapon recoil profiles
interface RecoilProfile {
  kickUp: number;      // upward position offset
  kickBack: number;    // backward (Z) offset multiplier
  kickRot: number;     // X-rotation multiplier (pitch-up)
  kickSide: number;    // random side-to-side kick
  decay: number;       // how fast recoil recovers (0-1, lower = slower)
  shake: number;       // camera-shake intensity on fire (0 = none)
}

const RECOIL_PROFILES: Record<WeaponId, RecoilProfile> = {
  hellPistol: {
    kickUp: 0.06,
    kickBack: 0.4,
    kickRot: 2.5,
    kickSide: 0.005,
    decay: 0.88,
    shake: 0,
  },
  brimShotgun: {
    kickUp: 0.14,
    kickBack: 0.8,
    kickRot: 4.5,
    kickSide: 0.015,
    decay: 0.82,
    shake: 4,
  },
  hellfireCannon: {
    kickUp: 0.18,
    kickBack: 1.0,
    kickRot: 5.0,
    kickSide: 0.008,
    decay: 0.78,
    shake: 6,
  },
  goatsBane: {
    kickUp: 0.22,
    kickBack: 1.2,
    kickRot: 6.0,
    kickSide: 0.02,
    decay: 0.75,
    shake: 10,
  },
};

// Idle sway — subtle figure-8 breathing pattern when standing still
const SWAY_AMP_X = 0.003;
const SWAY_AMP_Y = 0.002;
const SWAY_FREQ = 0.0012; // slow ~5s cycle
const SWAY_ROT_AMP = 0.008; // subtle Z-axis tilt

// Strafe tilt — weapon tilts opposite to lateral movement direction
const STRAFE_TILT_MAX = 0.07; // ~4 degrees max tilt
const STRAFE_TILT_LERP = 0.1; // smoothing factor

// Weapon switch animation
const SWITCH_LOWER_SPEED = 0.08; // frames to lower (0→1)
const SWITCH_RAISE_SPEED = 0.06; // frames to raise (1→0)
const SWITCH_DROP_DIST = 0.35; // how far below screen to drop

// Look momentum sway — weapon lags behind mouse movement
const LOOK_SWAY_STRENGTH = 0.15; // how much mouse velocity offsets weapon
const LOOK_SWAY_DECAY = 0.85;     // spring return speed

// Weapon inspect — idle fidget after not shooting
const INSPECT_DELAY = 300; // frames (~5s) before inspect starts
const INSPECT_CYCLE = 240; // frames per inspect cycle

// Per-weapon reload animation profiles
interface ReloadAnim {
  /** Return position offset [x, y, z] and rotation [rx, ry, rz] for given progress 0→1. */
  evaluate(t: number): {pos: [number, number, number]; rot: [number, number, number]};
}

const RELOAD_ANIMS: Record<WeaponId, ReloadAnim> = {
  // Pistol: quick mag drop + insert
  hellPistol: {
    evaluate(t: number) {
      if (t < 0.3) {
        // Phase 1: tilt down, drop mag
        const p = t / 0.3;
        return {pos: [0, -0.04 * p, 0], rot: [0.4 * p, 0, 0.05 * p]};
      } else if (t < 0.7) {
        // Phase 2: hold while inserting new mag
        const p = (t - 0.3) / 0.4;
        return {pos: [0, -0.04, 0.02 * Math.sin(p * Math.PI)], rot: [0.4, 0, 0.05]};
      } else {
        // Phase 3: snap back up
        const p = (t - 0.7) / 0.3;
        const ease = 1 - (1 - p) * (1 - p); // ease-out
        return {pos: [0, -0.04 * (1 - ease), 0], rot: [0.4 * (1 - ease), 0, 0.05 * (1 - ease)]};
      }
    },
  },
  // Shotgun: pump-action — tilt side, slide back then forward
  brimShotgun: {
    evaluate(t: number) {
      if (t < 0.25) {
        // Tilt sideways, pull back
        const p = t / 0.25;
        return {pos: [0.02 * p, -0.02 * p, -0.04 * p], rot: [0.3 * p, 0, -0.12 * p]};
      } else if (t < 0.55) {
        // Hold tilted, pump slide back
        const p = (t - 0.25) / 0.3;
        return {pos: [0.02, -0.02 - 0.02 * Math.sin(p * Math.PI), -0.04], rot: [0.3, 0, -0.12]};
      } else if (t < 0.8) {
        // Pump forward
        const p = (t - 0.55) / 0.25;
        return {pos: [0.02, -0.02, -0.04 + 0.06 * p], rot: [0.3 - 0.1 * p, 0, -0.12 + 0.06 * p]};
      } else {
        // Return to neutral
        const p = (t - 0.8) / 0.2;
        const ease = 1 - (1 - p) * (1 - p);
        return {pos: [0.02 * (1 - ease), -0.02 * (1 - ease), 0.02 * (1 - ease)], rot: [0.2 * (1 - ease), 0, -0.06 * (1 - ease)]};
      }
    },
  },
  // Cannon: barrel cool-down spin
  hellfireCannon: {
    evaluate(t: number) {
      const spin = t * Math.PI * 3; // 1.5 full rotations
      if (t < 0.2) {
        const p = t / 0.2;
        return {pos: [0, -0.03 * p, -0.02 * p], rot: [0.35 * p, 0, spin * 0.15]};
      } else if (t < 0.85) {
        // Spinning phase
        return {pos: [0, -0.03, -0.02], rot: [0.35, 0, spin * 0.15]};
      } else {
        // Settle back
        const p = (t - 0.85) / 0.15;
        const ease = 1 - (1 - p) * (1 - p);
        return {pos: [0, -0.03 * (1 - ease), -0.02 * (1 - ease)], rot: [0.35 * (1 - ease), 0, spin * 0.15 * (1 - ease)]};
      }
    },
  },
  // Launcher: open breech reload — tilt back, slam forward
  goatsBane: {
    evaluate(t: number) {
      if (t < 0.3) {
        // Tilt back and up to open breech
        const p = t / 0.3;
        const ease = p * p; // ease-in
        return {pos: [0, 0.03 * ease, -0.06 * ease], rot: [-0.5 * ease, 0.1 * ease, 0]};
      } else if (t < 0.6) {
        // Hold open, insert round (slight wobble)
        const p = (t - 0.3) / 0.3;
        const wobble = Math.sin(p * Math.PI * 2) * 0.01;
        return {pos: [wobble, 0.03, -0.06], rot: [-0.5, 0.1, wobble]};
      } else if (t < 0.85) {
        // Slam breech shut — fast forward motion
        const p = (t - 0.6) / 0.25;
        const ease = p * p * p; // ease-in (accelerate)
        return {pos: [0, 0.03 * (1 - ease), -0.06 + 0.08 * ease], rot: [-0.5 + 0.6 * ease, 0.1 * (1 - ease), 0]};
      } else {
        // Settle bounce
        const p = (t - 0.85) / 0.15;
        return {pos: [0, -0.02 * Math.sin(p * Math.PI), 0.02 * (1 - p)], rot: [0.1 * (1 - p), 0, 0]};
      }
    },
  },
};

// Landing dip
const LANDING_DIP_DECAY = 0.88;

// Module-level landing dip state (set externally, consumed by WeaponViewModel)
let landingDipAmount = 0;

/** Trigger a weapon dip on jump landing. Intensity 0-1. */
export function triggerLandingDip(intensity: number): void {
  landingDipAmount = intensity * 0.06;
}

/** Maps weapon IDs to their model registry key and emissive tint. */
const WEAPON_CONFIG: Record<WeaponId, {
  modelKey: WeaponModelKey;
  emissive: string;
  scale: number;
  offset: Vector3;
  rotation: Vector3;
}> = {
  hellPistol: {
    modelKey: 'weapon-pistol',
    emissive: '#992200',
    scale: 0.15,
    offset: new Vector3(0.0, -0.02, 0.0),
    rotation: new Vector3(-0.1, Math.PI, 0),
  },
  brimShotgun: {
    modelKey: 'weapon-shotgun',
    emissive: '#664400',
    scale: 0.13,
    offset: new Vector3(0.0, -0.03, -0.02),
    rotation: new Vector3(-0.1, Math.PI, 0),
  },
  hellfireCannon: {
    modelKey: 'weapon-cannon',
    emissive: '#884400',
    scale: 0.15,
    offset: new Vector3(0.0, -0.02, -0.02),
    rotation: new Vector3(-0.1, Math.PI, 0),
  },
  goatsBane: {
    modelKey: 'weapon-launcher',
    emissive: '#442200',
    scale: 0.16,
    offset: new Vector3(0.0, -0.04, -0.04),
    rotation: new Vector3(-0.1, Math.PI, 0),
  },
};

// ---------------------------------------------------------------------------
// Template cache — pre-loaded during loading phase
// ---------------------------------------------------------------------------

const templateCache = new Map<WeaponId, Mesh>();

/** Pre-load all weapon GLB models. Call during asset loading phase. */
export async function loadAllWeapons(scene: Scene): Promise<void> {
  const entries = Object.entries(WEAPON_CONFIG) as [WeaponId, typeof WEAPON_CONFIG[WeaponId]][];
  await Promise.all(
    entries.map(async ([weaponId, config]) => {
      const template = await loadWeaponModel(config.modelKey, scene);
      template.name = `weaponTemplate-${weaponId}`;
      templateCache.set(weaponId, template);
    }),
  );
}

/** Dispose all cached weapon templates. */
export function disposeWeaponCache(): void {
  for (const template of templateCache.values()) {
    template.getChildMeshes(false).forEach(m => m.dispose());
    template.dispose();
  }
  templateCache.clear();
}

// ---------------------------------------------------------------------------
// WeaponViewModel class
// ---------------------------------------------------------------------------

export class WeaponViewModel {
  private scene: Scene;
  private camera: FreeCamera | null = null;
  private root: TransformNode;
  private currentWeapon: WeaponId | null = null;
  private weaponMesh: Mesh | null = null;

  // Animation state
  private bobPhase = 0;
  private swayPhase = 0;
  private idleTime = 0; // frames spent idle (blends sway in/out)
  private kickOffset = 0;
  private kickSideOffset = 0;
  private strafeTilt = 0; // current Z-rotation from strafing
  private lastPlayerPos = Vector3.Zero();
  private lastFireTime = 0;

  // Look momentum sway
  private lookSwayX = 0; // current horizontal sway offset
  private lookSwayY = 0; // current vertical sway offset
  private lastCamRotX = 0; // camera pitch last frame
  private lastCamRotY = 0; // camera yaw last frame

  // Weapon inspect animation
  private idleFrames = 0; // frames since last fire/reload
  private inspectPhase = 0;

  // Weapon switch animation
  private switchState: 'idle' | 'lowering' | 'raising' = 'idle';
  private switchProgress = 0; // 0 = fully up, 1 = fully lowered
  private pendingWeapon: WeaponId | null = null;

  constructor(scene: Scene) {
    this.scene = scene;
    this.root = new TransformNode('vm-root', scene);
  }

  update(): void {
    if (!this.camera && this.scene.activeCamera) {
      this.camera = this.scene.activeCamera as FreeCamera;
      this.root.parent = this.camera;
      this.root.position = BASE_POS.clone();
    }
    if (!this.camera) return;

    const player = world.entities.find(e => e.type === 'player');
    if (!player?.player) return;

    const weaponId = player.player.currentWeapon;
    if (weaponId !== this.currentWeapon && this.switchState === 'idle') {
      if (this.currentWeapon === null) {
        // First weapon equip — instant, no animation
        this.instantSwap(weaponId);
      } else {
        // Start lowering animation, swap happens at the bottom
        this.pendingWeapon = weaponId;
        this.switchState = 'lowering';
      }
    }

    // Drive weapon switch animation
    this.updateSwitchAnimation();

    // Bob based on movement + strafe tilt tracking
    let isMoving = false;
    let lateralSpeed = 0;
    if (player.position) {
      const dx = player.position.x - this.lastPlayerPos.x;
      const dz = player.position.z - this.lastPlayerPos.z;
      const moved = Math.sqrt(dx * dx + dz * dz);
      if (moved > 0.001) {
        this.bobPhase += BOB_FREQ * 60;
        isMoving = true;

        // Project movement onto camera right vector to isolate lateral motion
        const yaw = this.camera!.rotation.y;
        const rightX = Math.cos(yaw);
        const rightZ = -Math.sin(yaw);
        lateralSpeed = dx * rightX + dz * rightZ;
      }
      this.lastPlayerPos = player.position.clone();
    }

    // Idle sway: ramp in when still, ramp out when moving
    if (isMoving) {
      this.idleTime = Math.max(0, this.idleTime - 3); // fast exit
    } else {
      this.idleTime = Math.min(60, this.idleTime + 1); // ~1s ramp-in
    }
    this.swayPhase += SWAY_FREQ * 60;
    const swayBlend = Math.min(1, this.idleTime / 30); // 0→1 over 0.5s
    const swayX = Math.sin(this.swayPhase) * SWAY_AMP_X * swayBlend;
    const swayY = Math.sin(this.swayPhase * 2) * SWAY_AMP_Y * swayBlend;
    const swayRot = Math.sin(this.swayPhase * 0.7) * SWAY_ROT_AMP * swayBlend;

    const bobY = Math.sin(this.bobPhase) * BOB_AMP;
    const bobX = Math.cos(this.bobPhase * 0.5) * BOB_AMP * 0.5;

    // Jump bob — weapon drops slightly during ascent, rises on descent
    let jumpBob = 0;
    if (this.camera) {
      const airborne = this.camera.position.y - 1.0; // 1.0 = GROUND_Y
      if (Math.abs(airborne) > 0.05) {
        jumpBob = -airborne * 0.04; // subtle drop during jump
      }
    }

    // Look momentum sway — weapon offsets opposite to mouse movement
    if (this.camera) {
      const dRotX = this.camera.rotation.x - this.lastCamRotX;
      const dRotY = this.camera.rotation.y - this.lastCamRotY;
      // Only apply if delta is small (avoid huge jumps from teleports/resets)
      if (Math.abs(dRotX) < 0.2 && Math.abs(dRotY) < 0.2) {
        this.lookSwayX -= dRotY * LOOK_SWAY_STRENGTH;
        this.lookSwayY -= dRotX * LOOK_SWAY_STRENGTH;
      }
      this.lastCamRotX = this.camera.rotation.x;
      this.lastCamRotY = this.camera.rotation.y;
    }
    // Spring return to center
    this.lookSwayX *= LOOK_SWAY_DECAY;
    this.lookSwayY *= LOOK_SWAY_DECAY;
    // Clamp to prevent extreme offsets
    this.lookSwayX = Math.max(-0.04, Math.min(0.04, this.lookSwayX));
    this.lookSwayY = Math.max(-0.03, Math.min(0.03, this.lookSwayY));

    // Per-weapon recoil kick
    const gunFlash = useGameStore.getState().gunFlash ?? 0;
    const recoil = this.currentWeapon
      ? RECOIL_PROFILES[this.currentWeapon]
      : RECOIL_PROFILES.hellPistol;
    if (gunFlash > 0.8 && getGameTime() - this.lastFireTime > 100) {
      this.kickOffset = recoil.kickUp;
      // Random lateral kick for weapon spread feel
      const rng = useGameStore.getState().rng;
      this.kickSideOffset = (rng() - 0.5) * 2 * recoil.kickSide;
      this.lastFireTime = getGameTime();
      this.idleFrames = 0; // reset inspect timer on fire
      // Screen shake for heavy weapons
      if (recoil.shake > 0) {
        GameState.set({screenShake: Math.max(GameState.get().screenShake, recoil.shake)});
      }
    }
    this.kickOffset *= recoil.decay;
    this.kickSideOffset *= recoil.decay;

    // Strafe tilt — weapon leans opposite to lateral movement
    const targetTilt = -Math.sign(lateralSpeed) * Math.min(Math.abs(lateralSpeed) * 2, 1) * STRAFE_TILT_MAX;
    this.strafeTilt += (targetTilt - this.strafeTilt) * STRAFE_TILT_LERP;

    // Landing dip — decays each frame
    landingDipAmount *= LANDING_DIP_DECAY;

    // Weapon inspect — idle fidget after not shooting for a while
    if (!player.player.isReloading && this.switchState === 'idle') {
      this.idleFrames++;
    } else {
      this.idleFrames = 0;
    }

    let inspectRotX = 0;
    let inspectRotY = 0;
    let inspectRotZ = 0;
    if (this.idleFrames > INSPECT_DELAY) {
      this.inspectPhase += 1;
      const t = this.inspectPhase / INSPECT_CYCLE;
      // Blend in over 30 frames
      const blend = Math.min(1, (this.idleFrames - INSPECT_DELAY) / 30);
      // Gentle tilting and rotation
      inspectRotX = Math.sin(t * Math.PI * 2) * 0.08 * blend;
      inspectRotY = Math.sin(t * Math.PI * 2 * 0.7) * 0.06 * blend;
      inspectRotZ = Math.cos(t * Math.PI * 2 * 1.3) * 0.04 * blend;
    } else {
      this.inspectPhase = 0;
    }

    // Smooth ease-in-out curve for switch animation
    const switchY = -this.switchProgress * this.switchProgress * SWITCH_DROP_DIST;

    this.root.position.x = BASE_POS.x + bobX + swayX + this.kickSideOffset + this.lookSwayX;
    this.root.position.y = BASE_POS.y + bobY + jumpBob + this.kickOffset + swayY + switchY - landingDipAmount + this.lookSwayY;
    this.root.position.z = BASE_POS.z - this.kickOffset * recoil.kickBack;

    if (player.player.isReloading) {
      // Per-weapon reload animation driven by reload progress
      const reloadStart = player.player.reloadStart ?? 0;
      const reloadTime = this.currentWeapon
        ? (weapons[this.currentWeapon]?.reloadTime ?? 1500)
        : 1500;
      const progress = Math.min(1, (getGameTime() - reloadStart) / reloadTime);
      const anim = this.currentWeapon ? RELOAD_ANIMS[this.currentWeapon] : RELOAD_ANIMS.hellPistol;
      const {pos, rot} = anim.evaluate(progress);
      this.root.position.x += pos[0];
      this.root.position.y += pos[1];
      this.root.position.z += pos[2];
      this.root.rotation.x = rot[0];
      this.root.rotation.y = rot[1];
      this.root.rotation.z = swayRot + this.strafeTilt + rot[2];
    } else {
      this.root.rotation.x = -this.kickOffset * recoil.kickRot + inspectRotX;
      this.root.rotation.y = inspectRotY;
      this.root.rotation.z = swayRot + this.strafeTilt + inspectRotZ;
    }
  }

  private updateSwitchAnimation(): void {
    if (this.switchState === 'lowering') {
      this.switchProgress = Math.min(1, this.switchProgress + SWITCH_LOWER_SPEED);
      if (this.switchProgress >= 1 && this.pendingWeapon) {
        // At the nadir — swap the model
        this.instantSwap(this.pendingWeapon);
        this.pendingWeapon = null;
        this.switchState = 'raising';
      }
    } else if (this.switchState === 'raising') {
      this.switchProgress = Math.max(0, this.switchProgress - SWITCH_RAISE_SPEED);
      if (this.switchProgress <= 0) {
        this.switchState = 'idle';
      }
    }
  }

  private instantSwap(weaponId: WeaponId): void {
    // Dispose old instance
    if (this.weaponMesh) {
      this.weaponMesh.getChildMeshes(false).forEach(m => m.dispose());
      this.weaponMesh.dispose();
    }

    const config = WEAPON_CONFIG[weaponId];
    const template = templateCache.get(weaponId);

    if (!template) {
      throw new Error(
        `Weapon template not loaded for "${weaponId}". ` +
        `Call loadAllWeapons() and wait for it to complete before switching weapons.`
      );
    }

    // Deep-clone template hierarchy (Mesh.clone is shallow — doesn't clone children)
    const clone = cloneModelHierarchy(template, `vm-${weaponId}`, this.scene);
    clone.scaling = new Vector3(config.scale, config.scale, config.scale);
    clone.position = config.offset.clone();
    clone.rotation = config.rotation.clone();

    // Apply emissive tint to all materials on the cloned model.
    // GLB imports as PBRMaterial; handle both PBR and Standard gracefully.
    const emissiveColor = Color3.FromHexString(config.emissive);
    for (const child of clone.getChildMeshes(false)) {
      if (child.material) {
        const mat = child.material;
        if (mat.getClassName() === 'PBRMaterial') {
          const pbr = mat as PBRMaterial;
          pbr.emissiveColor = emissiveColor;
          pbr.emissiveIntensity = 1.0;
        } else {
          const std = mat as StandardMaterial;
          std.maxSimultaneousLights = 8;
          std.emissiveColor = emissiveColor;
        }
      }
    }

    // Ensure weapon is never frustum-culled and renders on top of scene geometry
    clone.renderingGroupId = 1;
    clone.alwaysSelectAsActiveMesh = true;
    for (const child of clone.getChildMeshes(false)) {
      child.renderingGroupId = 1;
      child.alwaysSelectAsActiveMesh = true;
    }

    clone.parent = this.root;
    this.weaponMesh = clone;
    this.currentWeapon = weaponId;
  }

  dispose(): void {
    if (this.weaponMesh) {
      this.weaponMesh.getChildMeshes(false).forEach(m => m.dispose());
      this.weaponMesh.dispose();
    }
    this.root.dispose();
  }
}
