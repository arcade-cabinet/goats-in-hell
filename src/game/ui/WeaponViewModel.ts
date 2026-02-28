/**
 * First-person weapon viewmodel — GLB models parented to the camera.
 *
 * Each weapon type loads a pre-cached GLB model from the asset pipeline.
 * The viewmodel bobs with player movement and kicks upward on fire.
 */
import {
  Camera,
  Color3,
  Mesh,
  PBRMaterial,
  StandardMaterial,
  Scene,
  TransformNode,
  Vector3,
} from '@babylonjs/core';

import {world} from '../entities/world';
import {useGameStore} from '../../state/GameStore';
import {getGameTime} from '../systems/GameClock';
import type {WeaponId} from '../entities/components';
import {loadWeaponModel, cloneModelHierarchy} from '../systems/AssetLoader';
import type {WeaponModelKey} from '../systems/AssetRegistry';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const BASE_POS = new Vector3(0.04, -0.15, 0.25);
const BOB_AMP = 0.012;
const BOB_FREQ = 0.007;
const KICK_AMOUNT = 0.08;
const KICK_DECAY = 0.88;

// Idle sway — subtle figure-8 breathing pattern when standing still
const SWAY_AMP_X = 0.003;
const SWAY_AMP_Y = 0.002;
const SWAY_FREQ = 0.0012; // slow ~5s cycle
const SWAY_ROT_AMP = 0.008; // subtle Z-axis tilt

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
  private camera: Camera | null = null;
  private root: TransformNode;
  private currentWeapon: WeaponId | null = null;
  private weaponMesh: Mesh | null = null;

  // Animation state
  private bobPhase = 0;
  private swayPhase = 0;
  private idleTime = 0; // frames spent idle (blends sway in/out)
  private kickOffset = 0;
  private lastPlayerPos = Vector3.Zero();
  private lastFireTime = 0;

  constructor(scene: Scene) {
    this.scene = scene;
    this.root = new TransformNode('vm-root', scene);
  }

  update(): void {
    if (!this.camera && this.scene.activeCamera) {
      this.camera = this.scene.activeCamera;
      this.root.parent = this.camera;
      this.root.position = BASE_POS.clone();
    }
    if (!this.camera) return;

    const player = world.entities.find(e => e.type === 'player');
    if (!player?.player) return;

    const weaponId = player.player.currentWeapon;
    if (weaponId !== this.currentWeapon) {
      this.switchWeapon(weaponId);
    }

    // Bob based on movement + idle sway tracking
    let isMoving = false;
    if (player.position) {
      const moved = Vector3.Distance(player.position, this.lastPlayerPos);
      if (moved > 0.001) {
        this.bobPhase += BOB_FREQ * 60;
        isMoving = true;
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

    // Fire kick
    const gunFlash = useGameStore.getState().gunFlash ?? 0;
    if (gunFlash > 0.8 && getGameTime() - this.lastFireTime > 100) {
      this.kickOffset = KICK_AMOUNT;
      this.lastFireTime = getGameTime();
    }
    this.kickOffset *= KICK_DECAY;

    this.root.position.x = BASE_POS.x + bobX + swayX;
    this.root.position.y = BASE_POS.y + bobY + jumpBob + this.kickOffset + swayY;
    this.root.position.z = BASE_POS.z - this.kickOffset * 0.5;

    if (player.player.isReloading) {
      this.root.rotation.x = 0.5;
    } else {
      this.root.rotation.x = -this.kickOffset * 3;
    }
    this.root.rotation.z = swayRot;
  }

  private switchWeapon(weaponId: WeaponId): void {
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
