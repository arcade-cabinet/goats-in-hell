/**
 * EnemyColliders — Rapier physics colliders for enemy entities.
 *
 * Since @react-three/rapier components (<RigidBody>, <CapsuleCollider>)
 * don't conflict with Reactylon's JSX augmentation, this component uses
 * declarative JSX for the physics bodies.
 *
 * Each active enemy gets a kinematic rigid body with a capsule collider.
 * Position is synced from the ECS entity each frame (with Z negation for
 * coordinate system conversion).
 *
 * Capsule dimensions match the existing Havok colliders:
 *   - halfHeight: 0.5 (total capsule segment = 1.0)
 *   - radius: 0.4
 */

import React, {useState, useRef, useCallback} from 'react';
import {useFrame} from '@react-three/fiber';
import {RigidBody, CapsuleCollider} from '@react-three/rapier';
import type {RapierRigidBody} from '@react-three/rapier';
import {world} from '../../game/entities/world';
import type {EntityType} from '../../game/entities/components';

// Enemy entity types that should have colliders
const ENEMY_TYPES = new Set<EntityType>([
  'goat', 'hellgoat', 'fireGoat', 'shadowGoat', 'goatKnight',
  'archGoat', 'infernoGoat', 'voidGoat', 'ironGoat',
]);

// Capsule dimensions matching Havok colliders
const CAPSULE_HALF_HEIGHT = 0.5;
const CAPSULE_RADIUS = 0.4;

interface ActiveEnemy {
  id: string;
  type: EntityType;
}

/**
 * Manages Rapier rigid bodies for all enemy entities.
 * Tracks enemy spawn/despawn via React state, renders a
 * kinematic RigidBody + CapsuleCollider per active enemy.
 */
export function EnemyColliders() {
  const [activeEnemies, setActiveEnemies] = useState<ActiveEnemy[]>([]);
  const prevIdsRef = useRef<Set<string>>(new Set());

  useFrame(() => {
    // Collect current enemy IDs from ECS world
    const currentIds = new Set<string>();
    const currentEnemies: ActiveEnemy[] = [];

    for (const entity of world.entities) {
      if (!entity.enemy || !entity.id || !entity.type) continue;
      if (!ENEMY_TYPES.has(entity.type)) continue;
      currentIds.add(entity.id);
      currentEnemies.push({id: entity.id, type: entity.type});
    }

    // Only update React state if the set of IDs changed
    const prevIds = prevIdsRef.current;
    if (currentIds.size !== prevIds.size || !setsEqual(currentIds, prevIds)) {
      prevIdsRef.current = currentIds;
      setActiveEnemies(currentEnemies);
    }
  });

  return (
    <>
      {activeEnemies.map((enemy) => (
        <EnemyRigidBody key={enemy.id} enemyId={enemy.id} />
      ))}
    </>
  );
}

/**
 * Individual enemy rigid body — kinematic position type.
 * Syncs position from ECS entity each frame.
 */
function EnemyRigidBody({enemyId}: {enemyId: string}) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);

  useFrame(() => {
    const rb = rigidBodyRef.current;
    if (!rb) return;

    // Find the matching ECS entity
    const entity = world.entities.find((e) => e.id === enemyId);
    if (!entity?.position) return;

    // Sync position — negate Z for coordinate system conversion
    // Offset y upward so capsule base sits at floor level
    rb.setNextKinematicTranslation({
      x: entity.position.x,
      y: entity.position.y + CAPSULE_HALF_HEIGHT + CAPSULE_RADIUS,
      z: -entity.position.z,
    });
  });

  // Provide initial position callback to avoid starting at origin
  const getInitialPosition = useCallback((): [number, number, number] => {
    const entity = world.entities.find((e) => e.id === enemyId);
    if (entity?.position) {
      return [
        entity.position.x,
        entity.position.y + CAPSULE_HALF_HEIGHT + CAPSULE_RADIUS,
        -entity.position.z,
      ];
    }
    return [0, CAPSULE_HALF_HEIGHT + CAPSULE_RADIUS, 0];
  }, [enemyId]);

  const initialPos = getInitialPosition();

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="kinematicPosition"
      colliders={false}
      position={initialPos}
      userData={{entityId: enemyId}}
      name={`collider-enemy-${enemyId}`}
    >
      <CapsuleCollider args={[CAPSULE_HALF_HEIGHT, CAPSULE_RADIUS]} />
    </RigidBody>
  );
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  for (const val of a) {
    if (!b.has(val)) return false;
  }
  return true;
}
