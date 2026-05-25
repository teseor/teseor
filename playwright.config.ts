import { defineConfig, devices } from "@playwright/test";

const HARNESS_PORT = 5188;
export const DOCS_PORT = 5189;

export default defineConfig({
  testDir: "tests",
  testMatch: /.*\.spec\.ts$/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["list"], ["github"]] : "list",
  snapshotPathTemplate: "{testDir}/{testFileDir}/{testFileName}-snapshots/{arg}{ext}",
  use: {
    baseURL: `http://127.0.0.1:${HARNESS_PORT}`,
    trace: "on-first-retry",
  },
  webServer: [
    {
      command: "pnpm --filter @teseor/harness run dev",
      url: `http://127.0.0.1:${HARNESS_PORT}`,
      reuseExistingServer: !process.env.CI,
      stdout: "pipe",
      stderr: "pipe",
    },
    {
      // Production build + preview, not dev. Tests the user-shipping artifact;
      // sidesteps Vite optimize-deps thrash that would generate false-positive
      // 504 errors on a cold dev server.
      command: `pnpm --filter @teseor/docs run build && pnpm --filter @teseor/docs exec astro preview --port ${DOCS_PORT} --host 127.0.0.1`,
      url: `http://127.0.0.1:${DOCS_PORT}`,
      reuseExistingServer: !process.env.CI,
      stdout: "pipe",
      stderr: "pipe",
      timeout: 180000,
    },
  ],
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
