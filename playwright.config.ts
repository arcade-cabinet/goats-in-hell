import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/screenshots',
  timeout: 10 * 60 * 1000, // 10 minutes per test (full playthrough)
  use: {
    baseURL: 'http://localhost:8085',
    viewport: { width: 1280, height: 720 },
    screenshot: 'off', // we take manual screenshots at key moments
    video: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            // Enable software WebGL so THREE.WebGPURenderer forceWebGL fallback works
            // in headless Chromium (no GPU hardware available in CI/e2e environments).
            '--enable-webgl',
            '--ignore-gpu-blocklist',
            '--use-angle=swiftshader-webgl',
            '--disable-gpu-sandbox',
            '--enable-unsafe-webgpu', // allow WebGPU in headless if available
          ],
        },
      },
    },
  ],
  // Don't start a web server — run `pnpm web:start` separately
  webServer: undefined,
});
