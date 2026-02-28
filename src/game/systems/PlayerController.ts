/**
 * PlayerController — camera, keyboard/mouse/touch input, autoplay AI governor,
 * sprint, and jump physics.
 */

import {
  UniversalCamera,
  Vector3,
} from '@babylonjs/core';
import React, {useEffect} from 'react';
import {useScene} from 'reactylon';
import type {Entity, WeaponId} from '../entities/components';
import {world} from '../entities/world';
import type {LevelData} from '../GameEngine';
import {CELL_SIZE} from '../levels/LevelGenerator';
import {GameState} from '../../state/GameState';
import {useGameStore, getLevelBonuses} from '../../state/GameStore';
import {AIGovernor} from './AIGovernor';
import {getSpeedMultiplier} from './PowerUpSystem';
import {
  tryShoot,
  tryReload,
  switchWeapon,
} from '../weapons/WeaponSystem';
import {createMuzzleFlash} from '../rendering/Particles';
import {setSprinting} from '../rendering/PostProcessing';
import {triggerLandingDip} from '../ui/WeaponViewModel';
import {TouchControls, touchInput, resetTouchInput, isTouchDevice} from '../ui/TouchControls';

/** WeakMap to store cleanup callbacks on cameras (avoids `as any` casts). */
const cameraCleanups = new WeakMap<UniversalCamera, () => void>();

export const PlayerController = ({level}: {level: LevelData}) => {
  const scene = useScene();
  const autoplay = useGameStore(s => s.autoplay);

  useEffect(() => {
    // Create camera imperatively to avoid Reactylon reconciler race condition.
    const camera = new UniversalCamera(
      'playerCam',
      new Vector3(0, 2, 0),
      scene,
    );
    scene.activeCamera = camera;

    let governor: AIGovernor | null = null;

    // Wait for the player entity to be spawned by GameEngine's init effect
    const waitForPlayer = scene.onBeforeRenderObservable.add(() => {
      const playerEntity = world.entities.find(
        (e: Entity) => e.type === 'player',
      );
      if (!playerEntity?.position) return;
      scene.onBeforeRenderObservable.remove(waitForPlayer);

      // Camera setup (shared between manual and autoplay)
      camera.position = playerEntity.position.clone();
      camera.minZ = 0.1;
      camera.checkCollisions = !autoplay;
      camera.applyGravity = !autoplay;
      camera.ellipsoid = new Vector3(0.5, 1, 0.5);
      camera.speed = 0.3;
      // Map sensitivity (0.1-1.0) -> angularSensibility (4000-800, inverse)
      const sens = useGameStore.getState().mouseSensitivity;
      camera.angularSensibility = 4000 - sens * 3200;
      camera.inertia = 0.7;

      scene.gravity = new Vector3(0, -9.81 / 60, 0);
      scene.collisionsEnabled = true;

      // Sprint and jump state (manual mode only)
      let isSprinting = false;
      let jumpVelocity = 0;
      let isGrounded = true;
      const JUMP_FORCE = 0.22;
      const GROUND_Y = camera.position.y; // baseline floor Y
      let touchControls: TouchControls | null = null;
      const isTouch = isTouchDevice();

      // --- Autoplay: create Yuka AI governor ---
      if (autoplay) {
        governor = new AIGovernor(
          camera,
          scene,
          playerEntity,
          level.grid,
          CELL_SIZE,
        );

        // Expose governor on window for debug overlay access (dev only)
        if (typeof window !== 'undefined' && __DEV__) {
          (window as any).__aiGovernor = governor;
        }
      } else if (isTouch) {
        // --- Touch device: create virtual controls overlay ---
        touchControls = new TouchControls(scene);
        // No pointer lock on touch -- camera look handled by touch drag
      } else {
        // --- Desktop: attach keyboard/mouse controls ---
        camera.attachControl(true);

        const canvas = scene.getEngine().getRenderingCanvas();
        if (canvas) {
          canvas.addEventListener('click', () => {
            const gs = GameState.get();
            if (gs.screen === 'playing') {
              canvas.requestPointerLock?.();
            }
          });
        }
      }

      // Sync camera to ECS each frame
      let lastGovTime = performance.now();
      const syncLoop = () => {
        if (!playerEntity.position) return;

        if (autoplay && governor) {
          const now = performance.now();
          const dt = now - lastGovTime;
          lastGovTime = now;
          governor.update(dt);
        }

        // Camera position -> player entity position
        playerEntity.position = camera.position.clone();

        // Manual mode: sprint speed with level bonus + jump physics
        if (!autoplay) {
          const bonuses = getLevelBonuses(useGameStore.getState().leveling.level);
          const baseSpeed = isSprinting ? 0.45 : 0.3;
          camera.speed = baseSpeed * bonuses.speedMult * getSpeedMultiplier();

          // Jump physics: apply velocity and detect landing
          if (jumpVelocity !== 0) {
            camera.cameraDirection.y += jumpVelocity;
            jumpVelocity -= 0.012; // gravity acceleration per frame
            // Detect landing: camera stops falling when gravity collision kicks in
            if (jumpVelocity < 0 && camera.position.y <= GROUND_Y + 0.1) {
              // Landing impact -- shake proportional to fall speed
              const impactForce = Math.abs(jumpVelocity);
              if (impactForce > 0.04) {
                GameState.set({screenShake: Math.min(15, impactForce * 80)});
                triggerLandingDip(Math.min(1, impactForce * 5));
              }
              jumpVelocity = 0;
              isGrounded = true;
            }
          }
        }

        // --- Touch input processing ---
        if (isTouch && touchControls && !autoplay) {
          const gs = GameState.get();
          if (gs.screen === 'playing') {
            touchControls.update();

            // NaN guard: corrupt touch coords could freeze player movement
            if (Number.isNaN(touchInput.moveX)) touchInput.moveX = 0;
            if (Number.isNaN(touchInput.moveZ)) touchInput.moveZ = 0;

            // Movement: feed joystick into cameraDirection so Babylon's
            // collision pipeline handles wall clipping (same as keyboard mode)
            if (Math.abs(touchInput.moveX) > 0.05 || Math.abs(touchInput.moveZ) > 0.05) {
              const forward = camera.getForwardRay().direction;
              forward.y = 0;
              forward.normalize();
              const right = Vector3.Cross(Vector3.Up(), forward).normalize();
              const moveSpeed = 0.15;
              const move = forward.scale(touchInput.moveZ * moveSpeed)
                .add(right.scale(-touchInput.moveX * moveSpeed));
              camera.cameraDirection.addInPlace(move);
            }

            // Look: apply touch drag to camera rotation
            if (touchInput.lookDeltaX !== 0 || touchInput.lookDeltaY !== 0) {
              camera.rotation.y += touchInput.lookDeltaX;
              camera.rotation.x += touchInput.lookDeltaY;
              // Clamp vertical look
              camera.rotation.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, camera.rotation.x));
            }

            // Fire
            if (touchInput.fire) {
              const fired = tryShoot(scene, playerEntity);
              if (fired && scene.activeCamera) {
                const dir = scene.activeCamera.getForwardRay().direction;
                createMuzzleFlash(camera.position.add(dir.scale(0.5)), dir, scene);
                camera.rotation.x -= 0.02;
              }
            }

            // Reload
            if (touchInput.reload) {
              tryReload(playerEntity);
            }

            // Weapon switch
            if (touchInput.weaponSwitch > 0) {
              const weaponMap: Record<number, WeaponId> = {
                1: 'hellPistol', 2: 'brimShotgun',
                3: 'hellfireCannon', 4: 'goatsBane',
              };
              const wid = weaponMap[touchInput.weaponSwitch];
              if (wid) switchWeapon(playerEntity, wid);
            }

            // Jump
            if (touchInput.jump && isGrounded) {
              jumpVelocity = JUMP_FORCE;
              isGrounded = false;
            }

            // Pause
            if (touchInput.pause) {
              useGameStore.getState().patch({screen: 'paused'});
            }

            resetTouchInput();
          }
        }

        // Bounds checking
        if (camera.position.y < -10) {
          camera.position = new Vector3(
            playerEntity.position.x,
            2,
            playerEntity.position.z,
          );
        }
      };

      // Manual-mode shooting with muzzle flash + recoil kick (desktop only)
      const handlePointerDown = () => {
        if (autoplay || isTouch) return;
        const gs = GameState.get();
        if (gs.screen !== 'playing') return;
        const fired = tryShoot(scene, playerEntity);
        if (fired && scene.activeCamera) {
          const dir = scene.activeCamera.getForwardRay().direction;
          createMuzzleFlash(
            camera.position.add(dir.scale(0.5)),
            dir,
            scene,
          );
          // Recoil kick: slight upward camera rotation
          camera.rotation.x -= 0.02;
        }
      };

      // Manual-mode keyboard input
      const handleKeyDown = (e: KeyboardEvent) => {
        if (autoplay) return;
        const gs = GameState.get();
        if (gs.screen !== 'playing') return;

        switch (e.key) {
          case 'r':
          case 'R':
            tryReload(playerEntity);
            break;
          case '1':
            switchWeapon(playerEntity, 'hellPistol');
            break;
          case '2':
            switchWeapon(playerEntity, 'brimShotgun');
            break;
          case '3':
            switchWeapon(playerEntity, 'hellfireCannon');
            break;
          case '4':
            switchWeapon(playerEntity, 'goatsBane');
            break;
          case 'Shift':
            isSprinting = true;
            setSprinting(true);
            break;
          case ' ':
            // Jump: apply upward velocity if grounded
            if (isGrounded) {
              jumpVelocity = JUMP_FORCE;
              isGrounded = false;
            }
            e.preventDefault(); // prevent page scroll
            break;
        }
      };

      const handleKeyUp = (e: KeyboardEvent) => {
        if (e.key === 'Shift') {
          isSprinting = false;
          setSprinting(false);
        }
      };

      scene.onBeforeRenderObservable.add(syncLoop);
      scene.onPointerDown = handlePointerDown;

      if (typeof window !== 'undefined') {
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
      }

      cameraCleanups.set(camera, () => {
        scene.onBeforeRenderObservable.removeCallback(syncLoop);
        scene.onPointerDown = undefined;
        if (typeof window !== 'undefined') {
          window.removeEventListener('keydown', handleKeyDown);
          window.removeEventListener('keyup', handleKeyUp);
          delete (window as any).__aiGovernor;
        }
        if (governor) {
          governor.dispose();
        }
        if (touchControls) {
          touchControls.dispose();
        }
      });
    });

    return () => {
      scene.onBeforeRenderObservable.remove(waitForPlayer);
      const cleanup = cameraCleanups.get(camera);
      if (cleanup) {
        cleanup();
        cameraCleanups.delete(camera);
      }
      camera.detachControl();
      camera.dispose();
    };
  }, [scene, autoplay, level]);

  return null;
};
