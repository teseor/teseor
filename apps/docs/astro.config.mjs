import react from "@astrojs/react";
import { defineConfig } from "astro/config";

// React integration renders @teseor/react components to static HTML at build
// time — zero client JS unless a client:* directive opts in.
export default defineConfig({
  site: "https://teseor.dev",
  integrations: [react()],
  // Astro's dev toolbar emits transient `504 Outdated Optimize Dep` errors when
  // Vite re-optimizes deps mid-session (toolbar's own chunks). Cosmetic for
  // humans, but they trip the Playwright dev-mode smoke (`docs-dev`). The flag
  // lets that webServer opt out without affecting interactive `pnpm dev`.
  devToolbar: {
    enabled: process.env.ASTRO_DISABLE_DEV_TOOLBAR !== "1",
  },
  vite: {
    // @teseor/react publishes raw .tsx via `exports: "./src/*"`, so its imports
    // of `react`/`react-dom` originate from workspace source rather than a
    // pre-bundled dependency. Without explicit inclusion, Vite serves the React
    // CJS entries via the direct-import path, which leaks the production
    // runtime into `astro dev` and breaks hydration with `jsxDEV is not a
    // function`. Forcing pre-bundling routes them through esbuild with the
    // dev-mode `process.env.NODE_ENV` substitution applied.
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
      ],
    },
  },
});
