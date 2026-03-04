/**
 * ScreenshotService — unit tests for screenshot request/capture lifecycle.
 */
import { ScreenshotService } from '../telemetry/ScreenshotService';

describe('ScreenshotService', () => {
  it('starts with no pending screenshot', () => {
    const svc = new ScreenshotService();
    expect(svc.hasPending()).toBe(false);
  });

  it('request() sets pending flag', () => {
    const svc = new ScreenshotService();
    svc.request('floor-clear');
    expect(svc.hasPending()).toBe(true);
  });

  it('capture() with mock canvas returns data URL and clears pending', () => {
    const svc = new ScreenshotService();
    svc.request('boss-dead');

    const mockCanvas = {
      toDataURL: jest.fn().mockReturnValue('data:image/png;base64,FAKE'),
    } as unknown as HTMLCanvasElement;

    const result = svc.capture(mockCanvas);
    expect(result).toEqual({ label: 'boss-dead', dataUrl: 'data:image/png;base64,FAKE' });
    expect(svc.hasPending()).toBe(false);
    expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/png');
  });

  it('capture() without canvas returns null', () => {
    const svc = new ScreenshotService();
    svc.request('floor-clear');
    const result = svc.capture(null);
    expect(result).toBeNull();
    expect(svc.hasPending()).toBe(false); // pending cleared even without canvas
  });

  it('capture() when no pending returns null', () => {
    const svc = new ScreenshotService();
    const mockCanvas = {
      toDataURL: jest.fn().mockReturnValue('data:image/png;base64,X'),
    } as unknown as HTMLCanvasElement;
    const result = svc.capture(mockCanvas);
    expect(result).toBeNull();
  });
});
