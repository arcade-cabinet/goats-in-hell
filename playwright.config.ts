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
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Don't start a web server — run `pnpm web:start` separately
  webServer: undefined,
});
