import { defineConfig, devices } from "@playwright/test";

const HARNESS_PORT = 5188;
export const DOCS_PROD_PORT = 5189;
export const DOCS_DEV_PORT = 5190;

const DESKTOP = devices["Desktop Chrome"];

export default defineConfig({
  testDir: "tests",
  testMatch: /.*\.spec\.ts$/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["list"], ["github"]] : "list",
  snapshotPathTemplate: "{testDir}/{testFileDir}/{testFileName}-snapshots/{arg}{ext}",
  use: {
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
      command: `pnpm --filter @teseor/docs run build && pnpm --filter @teseor/docs exec astro preview --port ${DOCS_PROD_PORT} --host 127.0.0.1`,
      url: `http://127.0.0.1:${DOCS_PROD_PORT}`,
      reuseExistingServer: !process.env.CI,
      stdout: "pipe",
      stderr: "pipe",
      timeout: 180000,
    },
    {
      // Dev-mode docs smoke. The prod-build smoke catches what ships; this
      // catches dev-only hydration regressions where Vite serves a different
      // React runtime to the browser (cf. #791 — production React DOM bundle
      // leaks into the optimizer's direct-import path).
      // The dev toolbar is opted out because its own optimize-deps chunks
      // emit transient `504 Outdated Optimize Dep` responses when Vite
      // re-prebundles mid-session (cosmetic for humans, false-positive for the
      // smoke).
      command: `pnpm --filter @teseor/docs exec astro dev --port ${DOCS_DEV_PORT} --host 127.0.0.1`,
      env: { ASTRO_DISABLE_DEV_TOOLBAR: "1" },
      url: `http://127.0.0.1:${DOCS_DEV_PORT}`,
      reuseExistingServer: !process.env.CI,
      stdout: "pipe",
      stderr: "pipe",
      timeout: 180000,
    },
  ],
  projects: [
    {
      name: "chromium",
      testIgnore: /docs\//,
      use: { ...DESKTOP, baseURL: `http://127.0.0.1:${HARNESS_PORT}` },
    },
    {
      name: "docs-prod",
      testMatch: /docs\/.*\.spec\.ts$/,
      use: { ...DESKTOP, baseURL: `http://127.0.0.1:${DOCS_PROD_PORT}` },
    },
    {
      name: "docs-dev",
      testMatch: /docs\/.*\.spec\.ts$/,
      use: { ...DESKTOP, baseURL: `http://127.0.0.1:${DOCS_DEV_PORT}` },
    },
  ],
});
