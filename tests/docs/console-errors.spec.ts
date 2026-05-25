// CI gate for the docs site: load every generated component page in a real
// browser, fail on any `console.error`, uncaught error, or non-OK HTTP
// response. Catches hydration crashes, broken React islands, SSR mismatches,
// missing imports, and 404s — without per-component assertions.
// Runs under two Playwright projects: `docs-prod` against the built artifact
// (`astro build` + `astro preview`, the surface that ships) and `docs-dev`
// against `astro dev` (catches dev-only hydration regressions — cf. #791).
import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const SPECS_DIR = resolve(fileURLToPath(import.meta.url), "..", "..", "..", "specs");

// Derived from `specs/*.yaml` so new components are covered automatically.
// Mirrors `listSpecNames()` in `scripts/codegen/src/generators/*` — underscore-
// prefixed specs (`_breakpoints.yaml`, `_vocabulary.yaml`) are config, not
// components.
const PAGES = readdirSync(SPECS_DIR)
  .filter((f) => f.endsWith(".yaml") && !f.startsWith("_"))
  .map((f) => `/components/${f.slice(0, -".yaml".length)}`)
  .sort();

for (const path of PAGES) {
  test(`docs ${path} loads without console errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(`console.error: ${msg.text()}`);
    });
    // Subresource health: JS / CSS chunks, images, fetch calls. A 404 on a
    // hydration chunk can render a blank island without ever emitting a
    // `console.error`, so the document-level `response.ok()` check below is
    // not enough on its own.
    page.on("response", (resp) => {
      if (resp.status() < 400) return;
      // `504 Outdated Optimize Dep` is Vite's signal that a pre-bundled chunk
      // hash was invalidated mid-session by a re-optimize pass. Browsers retry
      // with the fresh hash, so it's transient — not a regression.
      if (resp.status() === 504 && resp.statusText() === "Outdated Optimize Dep") return;
      errors.push(`response ${resp.status()}: ${resp.url()}`);
    });
    page.on("requestfailed", (req) => {
      errors.push(`requestfailed: ${req.url()} (${req.failure()?.errorText ?? "unknown"})`);
    });
    const response = await page.goto(path);
    expect(response?.ok(), `${path} returned HTTP ${response?.status()}`).toBe(true);
    await page.waitForLoadState("networkidle");
    expect(errors, errors.join("\n---\n")).toEqual([]);
  });
}
