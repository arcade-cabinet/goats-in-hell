/**
 * DamageNumbers — floating damage text that rises and fades out.
 *
 * Uses canvas-rendered text on Three.js Sprites to avoid font loading.
 * Module-level spawn function + React component for the render tree.
 */

import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three/webgpu';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DamageNumber {
  sprite: THREE.Sprite;
  canvas: HTMLCanvasElement;
  age: number;
  startY: number;
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const LIFETIME = 0.8; // seconds
const FLOAT_SPEED = 2; // units/sec upward
const MAX_ACTIVE = 30;

const activeNumbers: DamageNumber[] = [];
let sceneRef: THREE.Scene | null = null;

// ---------------------------------------------------------------------------
// Canvas pool — reuse canvases to prevent DOM element memory leaks
// ---------------------------------------------------------------------------

const canvasPool: HTMLCanvasElement[] = [];

function acquireCanvas(): HTMLCanvasElement {
  if (canvasPool.length > 0) return canvasPool.pop()!;
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 64;
  return canvas;
}

function releaseCanvas(canvas: HTMLCanvasElement): void {
  // Cap pool size to prevent unbounded growth
  if (canvasPool.length < MAX_ACTIVE) {
    canvasPool.push(canvas);
  }
}

// ---------------------------------------------------------------------------
// Canvas texture helper
// ---------------------------------------------------------------------------

function createTextTexture(
  text: string,
  color: string,
): { texture: THREE.CanvasTexture; canvas: HTMLCanvasElement } {
  const canvas = acquireCanvas();
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.warn('[DamageNumbers] getContext("2d") returned null — damage number will be blank');
    return { texture: new THREE.CanvasTexture(canvas), canvas };
  }

  ctx.clearRect(0, 0, 128, 64);
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Black outline for readability
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 4;
  ctx.strokeText(text, 64, 32);

  // Colored fill
  ctx.fillStyle = color;
  ctx.fillText(text, 64, 32);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return { texture, canvas };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Spawn a floating damage number at a world position.
 *
 * @param damage   The damage value to display.
 * @param position World-space position {x, y, z}.
 * @param isCrit   If true, renders in yellow instead of red.
 */
export function spawnDamageNumber(
  damage: number,
  position: { x: number; y: number; z: number },
  isCrit?: boolean,
): void {
  if (!sceneRef) return;
  if (activeNumbers.length >= MAX_ACTIVE) return;

  const color = isCrit ? '#ffff00' : '#ff3333';
  const text = String(Math.round(damage));
  const { texture, canvas } = createTextTexture(text, color);

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 1,
    depthTest: false,
  });

  const sprite = new THREE.Sprite(material);
  sprite.position.set(position.x, position.y + 0.5, position.z);
  sprite.scale.set(1, 0.5, 1); // wide aspect to match 128x64 canvas

  sceneRef.add(sprite);

  activeNumbers.push({
    sprite,
    canvas,
    age: 0,
    startY: position.y + 0.5,
  });
}

// ---------------------------------------------------------------------------
// React component
// ---------------------------------------------------------------------------

export function DamageNumbers(): null {
  const scene = useThree((s) => s.scene);
  const initializedRef = useRef(false);

  // Set scene ref on first render
  if (!initializedRef.current) {
    sceneRef = scene;
    initializedRef.current = true;
  }

  useFrame((_state, delta) => {
    const dt = Math.min(delta, 0.1);

    for (let i = activeNumbers.length - 1; i >= 0; i--) {
      const dn = activeNumbers[i];
      dn.age += dt;

      if (dn.age >= LIFETIME) {
        // Remove expired number and return canvas to pool
        scene.remove(dn.sprite);
        const mat = dn.sprite.material as THREE.SpriteMaterial;
        mat.map?.dispose();
        mat.dispose();
        releaseCanvas(dn.canvas);
        activeNumbers.splice(i, 1);
        continue;
      }

      // Float upward
      dn.sprite.position.y = dn.startY + FLOAT_SPEED * dn.age;

      // Fade out
      const t = dn.age / LIFETIME;
      const mat = dn.sprite.material as THREE.SpriteMaterial;
      mat.opacity = 1 - t;

      // Scale down slightly as it fades
      const scale = 1 - t * 0.3;
      dn.sprite.scale.set(scale, scale * 0.5, scale);
    }
  });

  return null;
}

/**
 * Clear all active damage numbers. Call on level transitions.
 */
export function clearDamageNumbers(): void {
  for (const dn of activeNumbers) {
    const parent = dn.sprite.parent;
    if (parent) parent.remove(dn.sprite);
    const mat = dn.sprite.material as THREE.SpriteMaterial;
    mat.map?.dispose();
    mat.dispose();
    releaseCanvas(dn.canvas);
  }
  activeNumbers.length = 0;
}

/**
 * Clear the scene ref. Call on full teardown to prevent stale references.
 */
export function clearDamageNumbersSceneRef(): void {
  sceneRef = null;
}
