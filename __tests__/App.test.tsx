/**
 * @format
 */

import React from 'react';
import 'react-native';

// Note: import explicitly to use the types shipped with jest.
import {it, expect, jest} from '@jest/globals';

// Mock Babylon.js and Reactylon — these require WebGL/native bindings
// unavailable in jsdom test environment.
jest.mock('@babylonjs/core', () => ({}));
jest.mock('@babylonjs/gui', () => ({}));
jest.mock('@babylonjs/loaders', () => ({}));
jest.mock('@babylonjs/havok', () => ({}));
jest.mock('reactylon', () => ({
  Scene: () => null,
  useScene: () => ({}),
}));

// Note: test renderer must be required after react-native.
import renderer from 'react-test-renderer';
import App from '../src/App';

it('renders without crashing', () => {
  const tree = renderer.create(<App />);
  expect(tree.toJSON()).toBeTruthy();
});
