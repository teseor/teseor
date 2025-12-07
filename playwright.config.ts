import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './packages/css/src',
  testMatch: ['**/*.visual.spec.ts', '**/grid-alignment.spec.ts'],

  snapshotPathTemplate: '{testDir}/{testFileDir}/{arg}{ext}',

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // For local dev, start docs server first: pnpm --filter docs dev
  // For CI, uncomment webServer below
  // webServer: {
  //   command: 'pnpm --filter docs dev',
  //   url: 'http://localhost:5173',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120000,
  // },
});
