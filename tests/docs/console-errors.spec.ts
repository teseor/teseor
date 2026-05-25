// CI gate for the production docs site: load every generated component page
// in a real browser, fail on any `console.error`, uncaught error, or non-OK
// HTTP response. Catches hydration crashes, broken React islands, SSR
// mismatches, missing imports, and 404s — without per-component assertions.
// Runs against the built artifact (`astro build` + `astro preview`) — the
// surface that ships.
import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { DOCS_PORT } from "../../playwright.config.ts";

const DOCS_BASE = `http://127.0.0.1:${DOCS_PORT}`;
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
    const response = await page.goto(`${DOCS_BASE}${path}`);
    expect(response?.ok(), `${path} returned HTTP ${response?.status()}`).toBe(true);
    await page.waitForLoadState("networkidle");
    expect(errors, errors.join("\n---\n")).toEqual([]);
  });
}
