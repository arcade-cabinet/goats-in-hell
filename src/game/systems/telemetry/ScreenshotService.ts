export interface ScreenshotResult {
  /** Human-readable label for the event that triggered capture (e.g. "floor-clear"). */
  label: string;
  /** PNG data URL produced by canvas.toDataURL('image/png'). */
  dataUrl: string;
}

/**
 * ScreenshotService — lightweight canvas capture triggered by goal transitions.
 *
 * Goals call `request(label)` to flag that a screenshot should be taken.
 * A `useFrame` hook in R3FRoot calls `capture(canvas)` after the next render,
 * returns the data URL, and clears the pending flag.
 */
export class ScreenshotService {
  private pendingLabel: string | null = null;

  /** Returns true if a screenshot has been requested but not yet captured. */
  hasPending(): boolean {
    return this.pendingLabel !== null;
  }

  /**
   * Request a screenshot to be taken at the next render frame.
   * If a previous request is still pending, it is overwritten.
   */
  request(label: string): void {
    this.pendingLabel = label;
  }

  /**
   * Capture the current canvas state and return the result.
   * Always clears the pending flag, even if no canvas is available.
   * Returns null when there is no pending request or no canvas.
   */
  capture(canvas: HTMLCanvasElement | null): ScreenshotResult | null {
    const label = this.pendingLabel;
    this.pendingLabel = null;

    if (!label) return null;
    if (!canvas) return null;

    return { label, dataUrl: canvas.toDataURL('image/png') };
  }
}

/** Singleton for use across the application. */
export const screenshotService = new ScreenshotService();
