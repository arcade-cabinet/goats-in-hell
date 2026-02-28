const { getDefaultConfig } = require('expo/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('expo/metro-config').MetroConfig}
 */
const config = getDefaultConfig(__dirname);

// Register 3D model, audio, physics WASM, and WebGPU shader file extensions as static assets
config.resolver.assetExts.push('glb', 'gltf', 'ogg', 'wasm', 'wgsl');

module.exports = config;
