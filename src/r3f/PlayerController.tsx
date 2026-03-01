/**
 * PlayerController — R3F FPS camera, movement, pointer lock, jump physics.
 *
 * Reads from InputManager (single code path for all input modes).
 * Uses Rapier KinematicCharacterController for collision-based movement.
 * Syncs camera position ↔ Miniplex ECS player entity each frame.
 */

import { useFrame, useThree } from '@react-three/fiber';
import type { RapierRigidBody } from '@react-three/rapier';
import { CapsuleCollider, RigidBody, useRapier } from '@react-three/rapier';
import { useCallback, useEffect, useRef } from 'react';
import * as THREE from 'three/webgpu';
import type { Entity, WeaponId } from '../game/entities/components';
import { world } from '../game/entities/world';
import { getLevelBonuses, useGameStore } from '../state/GameStore';
import { playSound } from './audio/AudioSystem';
import { inputManager } from './input/InputManager';
import { GamepadProvider } from './input/providers/GamepadProvider';
import { KeyboardMouseProvider } from './input/providers/KeyboardMouseProvider';
import { getScreenShakeOffset } from './systems/ScreenShake';
import { getProjectilePool } from './weapons/Projectile';
import { switchWeapon, tryReload, tryShoot, updateReload } from './weapons/WeaponSystem';

// Movement constants (matching existing Babylon.js values)
const WALK_SPEED = 6; // units/sec (Babylon 0.3 * 60fps ≈ 18, but Rapier uses real units)
const SPRINT_MULT = 1.5; // 0.45 / 0.3
const JUMP_FORCE = 8; // impulse (tuned to match 0.22/frame at 60fps)
const GRAVITY = 20; // m/s² (slightly above 9.81 for snappy game feel)
const PLAYER_HEIGHT = 1.6; // eye height
const PLAYER_RADIUS = 0.4;
const LOOK_CLAMP = Math.PI / 2.5; // max vertical look angle

// Weapon slot mapping: number key 1-4 → WeaponId
const WEAPON_SLOTS: Record<number, WeaponId> = {
  1: 'hellPistol',
  2: 'brimShotgun',
  3: 'hellfireCannon',
  4: 'goatsBane',
};

// Euler for camera rotation (yaw = y, pitch = x)
const _euler = new THREE.Euler(0, 0, 0, 'YXZ');
const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _moveDir = new THREE.Vector3();
const _yAxis = new THREE.Vector3(0, 1, 0);

interface PlayerControllerProps {
  /** Spawn position in Three.js world coordinates (Z already negated). */
  spawnPosition?: [number, number, number];
}

export function PlayerController({ spawnPosition = [0, PLAYER_HEIGHT, 0] }: PlayerControllerProps) {
  const { camera, gl } = useThree();
  const { world: rapierWorld } = useRapier();
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const yawRef = useRef(0);
  const pitchRef = useRef(0);
  const jumpVelocityRef = useRef(0);
  const isGroundedRef = useRef(true);
  const pointerLockedRef = useRef(false);
  const characterControllerRef = useRef<ReturnType<
    typeof rapierWorld.createCharacterController
  > | null>(null);
  const footstepTimerRef = useRef(0);

  // Teleport player to spawn position when it changes (floor transitions)
  useEffect(() => {
    const rb = rigidBodyRef.current;
    if (rb) {
      rb.setNextKinematicTranslation({
        x: spawnPosition[0],
        y: spawnPosition[1],
        z: spawnPosition[2],
      });
    }
    // Also reset camera and look direction
    camera.position.set(spawnPosition[0], spawnPosition[1] + PLAYER_HEIGHT * 0.5, spawnPosition[2]);
    yawRef.current = 0;
    pitchRef.current = 0;
    jumpVelocityRef.current = 0;
    isGroundedRef.current = true;
  }, [spawnPosition, camera]);

  // Create Rapier character controller once
  useEffect(() => {
    const controller = rapierWorld.createCharacterController(0.01); // skin width
    controller.enableAutostep(0.3, 0.2, true); // step up small ledges
    controller.enableSnapToGround(0.3); // snap to ground on slopes
    controller.setApplyImpulsesToDynamicBodies(true);
    characterControllerRef.current = controller;

    return () => {
      rapierWorld.removeCharacterController(controller);
      characterControllerRef.current = null;
    };
  }, [rapierWorld]);

  // Register input providers once on mount
  const autoplay = useGameStore((s) => s.autoplay);
  useEffect(() => {
    // AI provider is registered by R3FRoot (needs level data).
    // Here we only register manual-play providers.
    if (autoplay) return;

    const kbm = new KeyboardMouseProvider();
    const gp = new GamepadProvider();
    inputManager.register(kbm);
    inputManager.register(gp);
    return () => {
      inputManager.unregister(kbm);
      inputManager.unregister(gp);
      kbm.dispose();
      gp.dispose();
    };
  }, [autoplay]);

  // Pointer lock management
  const requestPointerLock = useCallback(() => {
    const screen = useGameStore.getState().screen;
    if (screen === 'playing') {
      gl.domElement.requestPointerLock();
    }
  }, [gl]);

  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener('click', requestPointerLock);

    const onLockChange = () => {
      pointerLockedRef.current = document.pointerLockElement === canvas;
    };
    document.addEventListener('pointerlockchange', onLockChange);

    return () => {
      canvas.removeEventListener('click', requestPointerLock);
      document.removeEventListener('pointerlockchange', onLockChange);
      if (document.pointerLockElement === canvas) {
        document.exitPointerLock();
      }
    };
  }, [gl, requestPointerLock]);

  // Main game loop
  useFrame((_state, delta) => {
    const screen = useGameStore.getState().screen;
    if (screen !== 'playing') return;

    const rb = rigidBodyRef.current;
    const controller = characterControllerRef.current;
    if (!rb || !controller) return;

    // Clamp delta to avoid physics explosion on tab-away
    const dt = Math.min(delta, 0.1);

    // Poll all input providers
    const input = inputManager.poll(dt);

    // --- Look ---
    yawRef.current -= input.lookDeltaX;
    pitchRef.current -= input.lookDeltaY;
    pitchRef.current = Math.max(-LOOK_CLAMP, Math.min(LOOK_CLAMP, pitchRef.current));

    _euler.set(pitchRef.current, yawRef.current, 0);
    camera.quaternion.setFromEuler(_euler);

    // --- Movement ---
    // Forward/right vectors from yaw only (no pitch in movement)
    _forward.set(0, 0, -1).applyAxisAngle(_yAxis, yawRef.current);
    _right.set(1, 0, 0).applyAxisAngle(_yAxis, yawRef.current);

    const bonuses = getLevelBonuses(useGameStore.getState().leveling.level);
    const speedMult = input.sprint ? SPRINT_MULT : 1;
    const speed = WALK_SPEED * speedMult * bonuses.speedMult;

    _moveDir.set(0, 0, 0);
    _moveDir.addScaledVector(_forward, input.moveZ);
    _moveDir.addScaledVector(_right, input.moveX);
    if (_moveDir.lengthSq() > 0) _moveDir.normalize();
    _moveDir.multiplyScalar(speed * dt);

    // --- Jump / Gravity ---
    if (input.jump && isGroundedRef.current) {
      jumpVelocityRef.current = JUMP_FORCE;
      isGroundedRef.current = false;
    }

    jumpVelocityRef.current -= GRAVITY * dt;
    _moveDir.y = jumpVelocityRef.current * dt;

    // --- Character controller movement ---
    const collider = rb.collider(0);
    if (collider) {
      controller.computeColliderMovement(collider, _moveDir);
      const corrected = controller.computedMovement();
      const pos = rb.translation();
      rb.setNextKinematicTranslation({
        x: pos.x + corrected.x,
        y: pos.y + corrected.y,
        z: pos.z + corrected.z,
      });

      // Ground detection
      if (controller.computedGrounded()) {
        isGroundedRef.current = true;
        if (jumpVelocityRef.current < 0) jumpVelocityRef.current = 0;
      }
    }

    // --- Sync camera to rigid body position ---
    const bodyPos = rb.translation();
    const camX = bodyPos.x;
    const camY = bodyPos.y + PLAYER_HEIGHT * 0.5;
    const camZ = bodyPos.z;
    camera.position.set(camX, camY, camZ);

    // --- Screen shake (visual-only, applied AFTER storing base position) ---
    const shakeOffset = getScreenShakeOffset(dt);
    camera.position.x += shakeOffset.x;
    camera.position.y += shakeOffset.y;

    // --- Footstep audio ---
    const isMoving = _moveDir.x * _moveDir.x + _moveDir.z * _moveDir.z > 0.0001;
    if (isMoving && isGroundedRef.current) {
      footstepTimerRef.current -= dt;
      if (footstepTimerRef.current <= 0) {
        playSound('footstep');
        footstepTimerRef.current = input.sprint ? 0.3 : 0.4;
      }
    } else {
      footstepTimerRef.current = 0;
    }

    // --- Sync to ECS player entity (use unshaken base position) ---
    const playerEntity = world.entities.find((e: Entity) => e.type === 'player');
    if (playerEntity?.position) {
      // Convert Three.js camera position → Babylon/level coords (negate Z)
      // so all ECS positions share the same coordinate convention as the grid
      playerEntity.position.x = camX;
      playerEntity.position.y = camY;
      playerEntity.position.z = -camZ;
    }

    // --- Bounds check ---
    if (bodyPos.y < -10) {
      rb.setNextKinematicTranslation({ x: bodyPos.x, y: PLAYER_HEIGHT, z: bodyPos.z });
    }

    // --- Weapon handling ---
    if (playerEntity) {
      // Advance reload timer every frame
      const reloadSound = updateReload(playerEntity, dt);
      if (reloadSound) playSound(reloadSound);

      // Fire
      if (input.fire) {
        const pool = getProjectilePool();
        if (pool) {
          const shootSound = tryShoot(
            playerEntity,
            pool,
            input.aimOrigin,
            input.aimDirection,
            camera,
          );
          if (shootSound) playSound(shootSound);
        }
      }

      // Reload
      if (input.reload) {
        const reloadStartSound = tryReload(playerEntity);
        if (reloadStartSound) playSound(reloadStartSound);
      }

      // Weapon slot selection (keys 1-4)
      if (input.weaponSlot > 0) {
        const slotWeapon = WEAPON_SLOTS[input.weaponSlot];
        if (slotWeapon) {
          const switchSound = switchWeapon(playerEntity, slotWeapon);
          if (switchSound) playSound(switchSound);
        }
      }

      // Weapon cycle (scroll wheel / bumpers)
      if (input.weaponCycle !== 0 && playerEntity.player) {
        const owned = playerEntity.player.weapons;
        if (owned.length > 1) {
          const currentIdx = owned.indexOf(playerEntity.player.currentWeapon);
          const nextIdx =
            currentIdx === -1 ? 0 : (currentIdx + input.weaponCycle + owned.length) % owned.length;
          const cycleSound = switchWeapon(playerEntity, owned[nextIdx]);
          if (cycleSound) playSound(cycleSound);
        }
      }
    }

    // Post-frame: clear accumulated deltas
    inputManager.postFrame();
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="kinematicPosition"
      colliders={false}
      position={spawnPosition}
    >
      <CapsuleCollider args={[PLAYER_HEIGHT * 0.4, PLAYER_RADIUS]} />
    </RigidBody>
  );
}
