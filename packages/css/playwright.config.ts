import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src',
  testMatch: ['**/*.visual.spec.ts', '**/grid-alignment.spec.ts'],
  snapshotPathTemplate: 'src/{testFileDir}/{arg}{ext}',

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    viewport: { width: 800, height: 600 },
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
