/**
 * 3D Damage Numbers — billboard text planes that float up from enemies.
 *
 * Uses MeshBuilder.CreatePlane + DynamicTexture for crisp text rendering.
 * Planes use billboardMode = ALL so they always face the camera.
 * Each number floats upward and fades out over its lifetime.
 */
import {
  DynamicTexture,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
} from '@babylonjs/core';
import {consumeDamageEvents} from '../systems/damageEvents';
import type {DamageEvent} from '../systems/damageEvents';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const FLOAT_SPEED = 2.0;       // units per second upward
const LIFETIME_MS = 1200;      // matches damageEvents MAX_AGE
const PLANE_SIZE = 0.8;        // world units
const BIG_PLANE_SIZE = 1.2;    // for high damage numbers
const BIG_THRESHOLD = 30;      // damage >= this gets big style
const TEXTURE_SIZE = 128;      // dynamic texture resolution

// ---------------------------------------------------------------------------
// Active floating number
// ---------------------------------------------------------------------------

interface FloatingNumber {
  event: DamageEvent;
  mesh: Mesh;
  material: StandardMaterial;
  startY: number;
}

// ---------------------------------------------------------------------------
// DamageNumbers3D class
// ---------------------------------------------------------------------------

export class DamageNumbers3D {
  private scene: Scene;
  private active: FloatingNumber[] = [];
  private processed = new Set<number>(); // event IDs already spawned

  constructor(scene: Scene) {
    this.scene = scene;
  }

  update(): void {
    const events = consumeDamageEvents();
    const now = Date.now();

    // Spawn new damage numbers for events we haven't processed
    for (const ev of events) {
      if (this.processed.has(ev.id)) continue;
      this.processed.add(ev.id);
      this.spawnNumber(ev);
    }

    // Update existing floating numbers
    for (let i = this.active.length - 1; i >= 0; i--) {
      const fn = this.active[i];
      const age = now - fn.event.time;
      const progress = age / LIFETIME_MS;

      if (progress >= 1) {
        // Expired — dispose
        fn.mesh.dispose();
        fn.material.dispose();
        this.active.splice(i, 1);
        this.processed.delete(fn.event.id);
        continue;
      }

      // Float upward
      fn.mesh.position.y = fn.startY + progress * FLOAT_SPEED;

      // Fade out
      fn.material.alpha = 1 - progress;
    }

    // Safety: prune processed set for old IDs
    if (this.processed.size > 200) {
      const activeIds = new Set(events.map(e => e.id));
      for (const id of this.processed) {
        if (!activeIds.has(id)) this.processed.delete(id);
      }
    }
  }

  private spawnNumber(ev: DamageEvent): void {
    const isBig = ev.amount >= BIG_THRESHOLD;
    const size = isBig ? BIG_PLANE_SIZE : PLANE_SIZE;

    // Create a plane mesh with billboard mode
    const plane = MeshBuilder.CreatePlane(
      `dmg-${ev.id}`,
      {size},
      this.scene,
    );
    plane.billboardMode = Mesh.BILLBOARDMODE_ALL;
    plane.isPickable = false;

    // Slight random offset so overlapping numbers don't stack perfectly
    const offsetX = (Math.random() - 0.5) * 0.6;
    const offsetZ = (Math.random() - 0.5) * 0.6;
    plane.position = new Vector3(
      ev.position.x + offsetX,
      ev.position.y + 1.5,
      ev.position.z + offsetZ,
    );

    // Create dynamic texture for the text
    const texture = new DynamicTexture(
      `dmgTex-${ev.id}`,
      TEXTURE_SIZE,
      this.scene,
      false,
    );
    texture.hasAlpha = true;

    // Draw the number using the underlying 2D canvas context
    const ctx = texture.getContext() as unknown as CanvasRenderingContext2D;
    ctx.clearRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);

    const fontSize = isBig ? 72 : 56;
    ctx.font = `bold ${fontSize}px Courier`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillText(`${ev.amount}`, TEXTURE_SIZE / 2 + 2, TEXTURE_SIZE / 2 + 2);

    // Main text
    ctx.fillStyle = isBig ? '#ff4400' : '#ffcc00';
    ctx.fillText(`${ev.amount}`, TEXTURE_SIZE / 2, TEXTURE_SIZE / 2);

    texture.update();

    // Material
    const mat = new StandardMaterial(`dmgMat-${ev.id}`, this.scene);
    mat.diffuseTexture = texture;
    mat.emissiveTexture = texture;
    mat.useAlphaFromDiffuseTexture = true;
    mat.disableLighting = true;
    mat.backFaceCulling = false;
    plane.material = mat;

    this.active.push({
      event: ev,
      mesh: plane,
      material: mat,
      startY: plane.position.y,
    });
  }

  dispose(): void {
    for (const fn of this.active) {
      fn.mesh.dispose();
      fn.material.dispose();
    }
    this.active.length = 0;
    this.processed.clear();
  }
}
