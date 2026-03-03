const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('expo/metro-config').MetroConfig}
 */
const config = getDefaultConfig(__dirname);

// Register physics WASM and WebGPU shader file extensions as bundled assets.
// GLB/GLTF and OGG are now served from public/ as static files (not bundled).
config.resolver.assetExts.push('wasm', 'wgsl');

// ── WebGPU Resolution ──────────────────────────────────────────
// react-native-wgpu provides a W3C-compliant WebGPU surface on native,
// so Three.js and R3F should use their web/WebGPU code paths on native too.

// Map bare 'three' imports to 'three/webgpu' for the WebGPU renderer + TSL
const threeWebGPU = path.resolve(__dirname, 'node_modules/three/src/Three.WebGPU.js');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Redirect 'three' → 'three/webgpu' on native (not sub-paths like 'three/examples/...')
  if (moduleName === 'three' && platform !== 'web') {
    try {
      return context.resolveRequest(context, threeWebGPU, platform);
    } catch {
      // Fall back to standard 'three' if WebGPU entry point is missing
      return context.resolveRequest(context, moduleName, platform);
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
