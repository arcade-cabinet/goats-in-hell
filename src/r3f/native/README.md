# Native Canvas (react-native-wgpu)

Experimental native mobile rendering for Goats in Hell using react-native-wgpu
and React Three Fiber. Web + WebXR remains the primary platform.

## Prerequisites

1. Install native rendering dependencies:

```bash
npm install react-native-wgpu @react-three/fiber @react-three/rapier three
npm install --save-dev @types/three
```

2. iOS setup (CocoaPods):

```bash
cd ios && pod install && cd ..
```

3. Android: react-native-wgpu requires Android NDK and CMake. Follow the
   [react-native-wgpu README](https://github.com/nicegoodthings/react-native-wgpu)
   for Android-specific configuration.

## Enabling the Native Canvas

Once dependencies are installed:

1. Open `src/r3f/native/NativeCanvas.tsx`
2. Uncomment the import lines for `Canvas`, `THREE`, `Physics`, and `R3FScene`
3. Replace the placeholder `div` with the commented-out Canvas implementation
4. For WebGPU rendering, use the async `gl` prop shown in the JSDoc comment

## Known Issues

- **GLB loading on native**: Metro's asset pipeline resolves `require()` to
  numeric IDs on native. Babylon's loader expected URI strings. With R3F/drei
  the `useGLTF` hook handles this, but custom loaders may need
  `Asset.fromModule()` resolution (see `AssetLoader.ts` for the pattern).

- **Audio on native**: Web Audio API is not available on native. Use
  `expo-av` or `react-native-sound` as a fallback for the AudioSystem.

- **Touch input**: Pointer lock is unavailable on mobile. The game needs
  virtual joystick / touch controls (see `src/game/ui/TouchControls.ts`
  for the existing Babylon.js implementation that will need porting).

- **Shader compatibility**: Custom GLSL shaders may need adjustments for
  mobile GPU capabilities. Stick to Three.js built-in materials where
  possible.

## Asset Loading

Metro is already configured to handle 3D asset extensions. In
`metro.config.js`:

```js
config.resolver.assetExts.push('glb', 'gltf', 'ogg', 'wasm');
```

On native, `require('./model.glb')` returns a numeric asset ID. Use
`expo-asset`'s `Asset.fromModule()` to resolve to a local URI before
passing to Three.js loaders.

## Performance Targets

| Platform          | Target FPS | Notes                              |
|-------------------|------------|------------------------------------|
| iOS (iPhone 12+)  | 30+        | Reduce shadow map size, LOD bias   |
| iOS (iPad Pro)    | 60         | Full quality                       |
| Android (mid-tier)| 30+        | Disable post-processing            |
| Android (flagship)| 60         | Full quality                       |
| Web (desktop)     | 60         | Primary platform, full quality     |

### Mobile Optimization Checklist

- [ ] Reduce shadow map resolution (1024 instead of 2048)
- [ ] Lower particle count by 50%
- [ ] Disable post-processing bloom on low-end devices
- [ ] Use compressed textures (KTX2/Basis) for mobile
- [ ] Implement LOD system for enemy meshes
- [ ] Cap draw calls under 100 per frame

## Testing

### iOS Simulator

```bash
npx react-native run-ios
# or with Expo
npx expo run:ios
```

### Android Emulator

```bash
npx react-native run-android
# or with Expo
npx expo run:android
```

### On-device

For accurate GPU performance testing, always test on physical devices.
Simulators/emulators do not reflect real GPU performance.
