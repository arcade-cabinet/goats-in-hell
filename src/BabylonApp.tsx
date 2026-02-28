import {Color4} from '@babylonjs/core';
import type {Scene as BabylonScene} from '@babylonjs/core';
import React from 'react';
import {Scene} from 'reactylon';
import {EngineWrapper} from './EngineWrapper';
import {GameEngine} from './game/GameEngine';

/**
 * Legacy Babylon.js engine path — kept during migration.
 * Access via ?engine=babylon URL param.
 */
export default function BabylonApp() {
  return (
    <EngineWrapper camera={undefined}>
      <Scene
        onSceneReady={(scene: BabylonScene) => {
          scene.clearColor = new Color4(0.05, 0.01, 0.02, 1);
        }}>
        <GameEngine />
      </Scene>
    </EngineWrapper>
  );
}
