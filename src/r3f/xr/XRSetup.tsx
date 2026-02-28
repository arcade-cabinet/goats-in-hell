/**
 * XRSetup — WebXR/VR integration for the R3F game engine.
 *
 * Creates the XR store singleton, provides the <XR> context wrapper,
 * and exports an EnterVRButton for the HTML overlay UI.
 *
 * Uses @react-three/xr v6 API:
 *   - createXRStore() for the module-level store singleton
 *   - <XR store={xrStore}> as the context wrapper
 *   - <XROrigin> for tracking space origin
 *   - useXRSessionModeSupported() to check VR availability
 */

import { createXRStore, useXRSessionModeSupported, XR, XROrigin } from '@react-three/xr';
import type React from 'react';

// ---------------------------------------------------------------------------
// XR Store singleton
// ---------------------------------------------------------------------------

/**
 * Module-level XR store. Shared across the app so that EnterVRButton,
 * XRControllerProvider, and any other XR-aware code can access it.
 */
export const xrStore = createXRStore({
  // Disable the automatic offer-session browser prompt — we control entry
  // via the EnterVRButton component.
  offerSession: false,
  // Emulate a Meta Quest 3 in development when WebXR is not natively available.
  // Disabled in production to avoid shipping the emulator bundle.
  emulate: process.env.NODE_ENV !== 'production' ? 'metaQuest3' : undefined,
});

// ---------------------------------------------------------------------------
// XRSetup component (3D context — lives inside <Canvas>)
// ---------------------------------------------------------------------------

interface XRSetupProps {
  children?: React.ReactNode;
}

/**
 * Wraps children in the <XR> context and places the XROrigin for
 * tracking-space positioning.
 *
 * Usage:
 * ```tsx
 * <Canvas>
 *   <XRSetup>
 *     <PlayerController />
 *     <LevelMeshes />
 *   </XRSetup>
 * </Canvas>
 * ```
 */
export function XRSetup({ children }: XRSetupProps) {
  return (
    <XR store={xrStore}>
      {/* XROrigin sets the player's feet position in the tracking space.
          Position can be overridden by the player controller for teleportation. */}
      <XROrigin />

      {children}
    </XR>
  );
}

// ---------------------------------------------------------------------------
// EnterVRButton component (HTML overlay — lives outside <Canvas>)
// ---------------------------------------------------------------------------

const BUTTON_STYLES: React.CSSProperties = {
  position: 'fixed',
  bottom: 24,
  right: 24,
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '12px 20px',
  border: '2px solid rgba(255, 255, 255, 0.3)',
  borderRadius: 8,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  color: '#ffffff',
  fontSize: 16,
  fontWeight: 600,
  fontFamily: 'system-ui, -apple-system, sans-serif',
  cursor: 'pointer',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  transition: 'background-color 0.2s, border-color 0.2s',
};

/**
 * SVG VR goggles icon for the Enter VR button.
 */
function VRIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* VR headset outline */}
      <rect x="2" y="7" width="20" height="10" rx="3" />
      {/* Left lens */}
      <circle cx="8" cy="12" r="2" />
      {/* Right lens */}
      <circle cx="16" cy="12" r="2" />
      {/* Nose bridge */}
      <path d="M10 12h4" />
    </svg>
  );
}

/**
 * HTML button that enters VR mode when clicked.
 * Only renders when the browser supports immersive-vr sessions.
 *
 * Place this OUTSIDE the <Canvas> in your React tree:
 * ```tsx
 * <div>
 *   <R3FApp>...</R3FApp>
 *   <EnterVRButton />
 * </div>
 * ```
 */
export function EnterVRButton() {
  // useXRSessionModeSupported returns true/false/undefined.
  // undefined means the check is still pending.
  const vrSupported = useXRSessionModeSupported('immersive-vr');

  // Don't render if VR is not supported or check is still pending
  if (!vrSupported) return null;

  const handleClick = () => {
    xrStore.enterVR();
  };

  return (
    <button
      type="button"
      style={BUTTON_STYLES}
      onClick={handleClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
      }}
      aria-label="Enter VR mode"
    >
      <VRIcon />
      Enter VR
    </button>
  );
}
