/**
 * GameDevBridge -- exposes `window.__game` for agentic control.
 *
 * Install once via installGameDevBridge(). Then from Playwright:
 *
 *   // Read full state snapshot
 *   const s = await page.evaluate(() => window.__game.snapshot());
 *
 *   // Jump to any circle/floor
 *   await page.evaluate(() => window.__game.jumpTo(3));
 *
 *   // Teleport player to grid coord
 *   await page.evaluate(() => window.__game.teleport(10, 15));
 *
 *   // Check what's loaded
 *   const assets = await page.evaluate(() => window.__game.assets());
 *
 *   // Force-fire the weapon
 *   await page.evaluate(() => window.__game.fire());
 *
 *   // Toggle wireframe on all level meshes
 *   await page.evaluate(() => window.__game.wireframe(true));
 *
 * All mutations are synchronous — Zustand patch runs on the React scheduler,
 * Three.js changes take effect next frame.
 */
import * as THREE from 'three/webgpu';
import { CELL_SIZE } from '../../constants';
import { isPlayerEntity } from '../../game/entities/TypedEntityGuards';
import { world } from '../../game/entities/world';
import { ENEMY_MODEL_ASSETS } from '../../game/systems/AssetRegistry';
import { useGameStore } from '../../state/GameStore';
import { getModelLoadState } from '../systems/ModelLoader';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GameSnapshot {
  screen: string;
  circle: number;
  floor: number;
  encounterType: string;
  kills: number;
  score: number;
  enemiesAlive: number;
  entities: EntitySnap[];
  models: { loaded: string[]; loading: string[]; failed: string[] };
  player: PlayerSnap | null;
  timestamp: number;
}

export interface PlayerSnap {
  worldX: number;
  worldY: number;
  worldZ: number;
  gridX: number;
  gridZ: number;
  hp: number;
  maxHp: number;
}

export interface EntitySnap {
  id: string;
  type: string;
  gridX: number;
  gridZ: number;
  worldX: number;
  worldZ: number;
  hp: number | null;
  modelKey: string | null;
  modelLoaded: boolean;
  isFallback: boolean;
}

export interface MeshInfo {
  name: string;
  objectType: string;
  /** World-space center from bounding box */
  worldX: number;
  worldY: number;
  worldZ: number;
  /** Bounding box dimensions */
  sizeX: number;
  sizeY: number;
  sizeZ: number;
  /** Parent chain up to scene root */
  parentChain: string[];
  /** Material type + color (hex) + opacity */
  material: string;
}

export interface SceneNodeInfo {
  name: string;
  type: string;
  childCount: number;
  worldX: number;
  worldY: number;
  worldZ: number;
}

export interface GameDevAPI {
  /** Full state snapshot — use this from Playwright to get structured data. */
  snapshot: () => GameSnapshot;
  /** Jump player to a specific circle (1-9). Resets floor to 1. */
  jumpTo: (circleNumber: number) => void;
  /** Teleport player to a grid coordinate (changes ECS position). */
  teleport: (gridX: number, gridZ: number) => void;
  /** Teleport player to exact world coordinates. */
  fly: (worldX: number, worldY: number, worldZ: number) => void;
  /** Rotate camera to look at a world position (yaw only). */
  lookAt: (worldX: number, worldZ: number) => void;
  /** List all model asset keys and their load state. */
  assets: () => { loaded: string[]; loading: string[]; failed: string[] };
  /** Toggle wireframe mode on all Three.js meshes in the scene. */
  wireframe: (on: boolean) => void;
  /** Set ambient light intensity (default 0.5). */
  setAmbient: (intensity: number) => void;
  /** Force-fire the player's weapon (sets firePressed in store). */
  fire: () => void;
  /** Advance to next stage (same as clicking DESCEND DEEPER). */
  advance: () => void;
  /** Set enemy count to zero — forces floor clear. */
  clearEnemies: () => void;
  /** Set player HP directly. */
  setHp: (hp: number) => void;
  /** Log all entity positions and model status to console. */
  dumpEntities: () => void;
  /** Log all loaded/failed model keys to console. */
  dumpAssets: () => void;
  /**
   * Inspect all Mesh objects within `radius` world units of (worldX, worldZ).
   * Returns name, material color/opacity, bounding box size, and parent chain.
   * Use this to identify any visible object in the scene.
   */
  inspect: (worldX: number, worldZ: number, radius?: number) => MeshInfo[];
  /**
   * Dump a flat list of all named Three.js objects in the scene graph.
   * Useful for discovering what groups/meshes are present.
   */
  sceneGraph: (nameFilter?: string) => SceneNodeInfo[];
  /**
   * List every Mesh in the scene with position + material — no filter.
   * Returns sorted by distance from the player (or origin if no player).
   */
  dumpMeshes: () => MeshInfo[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toGrid(w: number): number {
  return Math.round(w / CELL_SIZE);
}

function modelKeyForType(type: string): string | null {
  const k = `enemy-${type}` as keyof typeof ENEMY_MODEL_ASSETS;
  return ENEMY_MODEL_ASSETS[k] != null ? `enemy-${type}` : null;
}

function getPlayerEntity() {
  const e = world.entities.find((e) => e.type === 'player');
  return e && isPlayerEntity(e) ? e : null;
}

function buildSnapshot(): GameSnapshot {
  const s = useGameStore.getState();
  const modelState = getModelLoadState();
  const playerEntity = getPlayerEntity();

  const entities: EntitySnap[] = [];
  let enemiesAlive = 0;

  for (const e of world.entities) {
    if (!e.position) continue;
    const type = e.type ?? 'unknown';
    const isEnemy = !!e.enemy;
    const isPlayer = !!e.player;
    if (!isEnemy && !isPlayer) continue;

    if (isEnemy) enemiesAlive++;

    const mk = isEnemy ? modelKeyForType(type) : null;
    const loaded = mk != null && modelState.loaded.includes(mk);
    const failed = mk != null && modelState.failed.includes(mk);

    entities.push({
      id: e.id ?? '?',
      type,
      gridX: toGrid(e.position.x),
      gridZ: toGrid(e.position.z),
      worldX: Math.round(e.position.x * 10) / 10,
      worldZ: Math.round(e.position.z * 10) / 10,
      hp: e.enemy?.hp ?? e.player?.hp ?? null,
      modelKey: mk,
      modelLoaded: loaded,
      isFallback: mk != null && !loaded && !failed,
    });
  }

  const player: PlayerSnap | null = playerEntity
    ? {
        worldX: Math.round(playerEntity.position.x * 10) / 10,
        worldY: Math.round(playerEntity.position.y * 10) / 10,
        worldZ: Math.round(playerEntity.position.z * 10) / 10,
        gridX: toGrid(playerEntity.position.x),
        gridZ: toGrid(playerEntity.position.z),
        hp: playerEntity.player.hp,
        maxHp: playerEntity.player.maxHp,
      }
    : null;

  return {
    screen: s.screen,
    circle: s.circleNumber,
    floor: s.stage.floor,
    encounterType: s.stage.encounterType,
    kills: s.kills,
    score: s.score,
    enemiesAlive,
    entities,
    models: modelState,
    player,
    timestamp: Date.now(),
  };
}

// ---------------------------------------------------------------------------
// Wireframe toggle — walks the Three.js scene graph
// ---------------------------------------------------------------------------

let sceneRef: THREE.Scene | null = null;

export function setSceneForDevBridge(scene: THREE.Scene) {
  sceneRef = scene;
}

function setWireframe(on: boolean) {
  if (!sceneRef) {
    console.warn('[DevBridge] scene not set yet — call setSceneForDevBridge() first');
    return;
  }
  sceneRef.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const m of mats) {
        if (m && 'wireframe' in m) {
          (m as THREE.MeshStandardMaterial).wireframe = on;
        }
      }
    }
  });
}

// Ambient light ref — set by DynamicLighting
let ambientLightRef: THREE.AmbientLight | null = null;

export function setAmbientLightForDevBridge(light: THREE.AmbientLight) {
  ambientLightRef = light;
}

// Camera ref — set by PlayerController for lookAt support
let cameraRef: THREE.Camera | null = null;

export function setCameraForDevBridge(camera: THREE.Camera) {
  cameraRef = camera;
}

// ---------------------------------------------------------------------------
// Scene inspection helpers
// ---------------------------------------------------------------------------

const _inspectBox = new THREE.Box3();
const _inspectCenter = new THREE.Vector3();
const _inspectSize = new THREE.Vector3();

function materialSummary(mat: THREE.Material | THREE.Material[]): string {
  const mats = Array.isArray(mat) ? mat : [mat];
  return mats
    .map((m) => {
      const color =
        'color' in m && m.color instanceof THREE.Color
          ? `#${(m.color as THREE.Color).getHexString()}`
          : 'n/a';
      const opacity = `opacity:${m.opacity.toFixed(2)}`;
      const transparent = m.transparent ? ' transparent' : '';
      return `${m.type} ${color} ${opacity}${transparent}`;
    })
    .join(' | ');
}

function parentChain(obj: THREE.Object3D): string[] {
  const chain: string[] = [];
  let cur = obj.parent;
  while (cur && !(cur instanceof THREE.Scene)) {
    if (cur.name) chain.unshift(cur.name);
    cur = cur.parent;
  }
  return chain;
}

function meshToInfo(mesh: THREE.Mesh): MeshInfo {
  _inspectBox.setFromObject(mesh);
  _inspectBox.getCenter(_inspectCenter);
  _inspectBox.getSize(_inspectSize);
  return {
    name: mesh.name || '(unnamed)',
    objectType: mesh.type,
    worldX: Math.round(_inspectCenter.x * 100) / 100,
    worldY: Math.round(_inspectCenter.y * 100) / 100,
    worldZ: Math.round(_inspectCenter.z * 100) / 100,
    sizeX: Math.round(_inspectSize.x * 100) / 100,
    sizeY: Math.round(_inspectSize.y * 100) / 100,
    sizeZ: Math.round(_inspectSize.z * 100) / 100,
    parentChain: parentChain(mesh),
    material: materialSummary(mesh.material),
  };
}

function inspectAt(worldX: number, worldZ: number, radius = 2): MeshInfo[] {
  if (!sceneRef) return [];
  const results: MeshInfo[] = [];
  sceneRef.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    _inspectBox.setFromObject(obj);
    _inspectBox.getCenter(_inspectCenter);
    const dx = _inspectCenter.x - worldX;
    const dz = _inspectCenter.z - worldZ;
    if (Math.sqrt(dx * dx + dz * dz) <= radius) {
      results.push(meshToInfo(obj));
    }
  });
  results.sort((a, b) => {
    const da = Math.sqrt((a.worldX - worldX) ** 2 + (a.worldZ - worldZ) ** 2);
    const db = Math.sqrt((b.worldX - worldX) ** 2 + (b.worldZ - worldZ) ** 2);
    return da - db;
  });
  return results;
}

function dumpAllMeshes(): MeshInfo[] {
  if (!sceneRef) return [];
  const player = getPlayerEntity();
  const ox = player?.position.x ?? 0;
  const oz = player?.position.z ?? 0;
  const results: MeshInfo[] = [];
  sceneRef.traverse((obj) => {
    if (obj instanceof THREE.Mesh) results.push(meshToInfo(obj));
  });
  results.sort((a, b) => {
    const da = Math.sqrt((a.worldX - ox) ** 2 + (a.worldZ - oz) ** 2);
    const db = Math.sqrt((b.worldX - ox) ** 2 + (b.worldZ - oz) ** 2);
    return da - db;
  });
  return results;
}

function dumpSceneGraph(nameFilter?: string): SceneNodeInfo[] {
  if (!sceneRef) return [];
  const results: SceneNodeInfo[] = [];
  sceneRef.traverse((obj) => {
    if (nameFilter && !obj.name.includes(nameFilter)) return;
    const wp = new THREE.Vector3();
    obj.getWorldPosition(wp);
    results.push({
      name: obj.name || '(unnamed)',
      type: obj.type,
      childCount: obj.children.length,
      worldX: Math.round(wp.x * 10) / 10,
      worldY: Math.round(wp.y * 10) / 10,
      worldZ: Math.round(wp.z * 10) / 10,
    });
  });
  return results;
}

// ---------------------------------------------------------------------------
// Install
// ---------------------------------------------------------------------------

export function installGameDevBridge(): void {
  if (typeof window === 'undefined') return;

  const api: GameDevAPI = {
    snapshot: buildSnapshot,

    jumpTo: (circleNumber: number) => {
      const s = useGameStore.getState();
      s.setCircleNumber(Math.max(1, Math.min(9, circleNumber)));
      s.patch({
        screen: 'playing',
        kills: 0,
        stage: {
          ...s.stage,
          floor: 1,
          stageNumber: 1,
          encounterType: 'explore',
          bossId: null,
          enemiesRemaining: 0,
        },
      });
      console.log(`[DevBridge] Jumped to circle ${circleNumber}`);
    },

    teleport: (gridX: number, gridZ: number) => {
      const player = getPlayerEntity();
      if (!player?.position) {
        console.warn('[DevBridge] No player entity found');
        return;
      }
      player.position.x = gridX * CELL_SIZE;
      player.position.z = gridZ * CELL_SIZE;
      console.log(`[DevBridge] Teleported player to grid (${gridX}, ${gridZ})`);
    },

    fly: (worldX: number, worldY: number, worldZ: number) => {
      const player = getPlayerEntity();
      if (!player?.position) {
        console.warn('[DevBridge] No player entity found');
        return;
      }
      player.position.x = worldX;
      player.position.y = worldY;
      player.position.z = worldZ;
      console.log(`[DevBridge] Flew player to world (${worldX}, ${worldY}, ${worldZ})`);
    },

    lookAt: (worldX: number, worldZ: number) => {
      if (!cameraRef) {
        console.warn('[DevBridge] Camera not registered — call setCameraForDevBridge() first');
        return;
      }
      const from = new THREE.Vector3();
      cameraRef.getWorldPosition(from);
      const target = new THREE.Vector3(worldX, from.y, worldZ);
      const dir = target.sub(from).normalize();
      const yaw = Math.atan2(dir.x, dir.z);
      cameraRef.rotation.set(0, yaw, 0, 'YXZ');
      console.log(`[DevBridge] Camera facing (${worldX}, ${worldZ})`);
    },

    assets: getModelLoadState,

    wireframe: setWireframe,

    setAmbient: (intensity: number) => {
      if (ambientLightRef) {
        ambientLightRef.intensity = intensity;
        console.log(`[DevBridge] Ambient intensity → ${intensity}`);
      } else {
        console.warn('[DevBridge] Ambient light not yet registered');
      }
    },

    fire: () => {
      useGameStore.getState().patch({ gunFlash: 1 });
    },

    advance: () => {
      const s = useGameStore.getState();
      const prevScreen = s.screen;
      s.advanceStage();
      const next = useGameStore.getState().screen;
      if (next !== 'bossIntro' && next !== 'gameComplete' && prevScreen !== 'playing') {
        s.patch({ screen: 'playing', startTime: Date.now() });
      }
      console.log(`[DevBridge] Advanced stage — screen: ${useGameStore.getState().screen}`);
    },

    clearEnemies: () => {
      for (const e of world.entities) {
        if (e.enemy) {
          e.enemy.hp = 0;
        }
      }
      useGameStore.getState().patch({
        stage: { ...useGameStore.getState().stage, enemiesRemaining: 0 },
      });
      console.log('[DevBridge] Cleared all enemy HP');
    },

    setHp: (hp: number) => {
      const player = getPlayerEntity();
      if (player) {
        player.player.hp = hp;
        console.log(`[DevBridge] Player HP → ${hp}`);
      }
    },

    dumpEntities: () => {
      const snap = buildSnapshot();
      console.table(snap.entities);
    },

    dumpAssets: () => {
      const state = getModelLoadState();
      console.log('[DevBridge] LOADED:', state.loaded.join(', '));
      console.log('[DevBridge] LOADING:', state.loading.join(', '));
      console.log('[DevBridge] FAILED:', state.failed.join(', '));
    },

    inspect: (worldX: number, worldZ: number, radius = 2) => {
      const results = inspectAt(worldX, worldZ, radius);
      console.table(results);
      return results;
    },

    sceneGraph: (nameFilter?: string) => {
      const results = dumpSceneGraph(nameFilter);
      console.table(results);
      return results;
    },

    dumpMeshes: () => {
      const results = dumpAllMeshes();
      console.table(results);
      return results;
    },
  };

  // Expose to Playwright
  (window as unknown as { __game: GameDevAPI }).__game = api;

  console.log(
    '[DevBridge] Installed window.__game — available commands:\n' +
      '  snapshot()  jumpTo(n)  teleport(gx,gz)  fly(wx,wy,wz)  lookAt(wx,wz)\n' +
      '  assets()  wireframe(on)  setAmbient(v)  advance()  clearEnemies()\n' +
      '  setHp(hp)  dumpEntities()  dumpAssets()\n' +
      '  inspect(wx,wz,radius?)  sceneGraph(nameFilter?)  dumpMeshes()',
  );
}
