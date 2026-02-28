const { getDefaultConfig } = require('expo/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('expo/metro-config').MetroConfig}
 */
const config = getDefaultConfig(__dirname);

// Register 3D model, audio, and physics WASM file extensions as static assets
config.resolver.assetExts.push('glb', 'ogg', 'wasm');

module.exports = config;
