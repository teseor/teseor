// CI gate for vertical-rhythm at composition. Asserts that `<main>` on each
// component docs page lands on the `--t-unit` grid. Per-element drift inside
// `main` is absorbed by the page composition — the only thing the system
// can actually enforce is the outer container's height.
import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const SPECS_DIR = resolve(fileURLToPath(import.meta.url), "..", "..", "..", "specs");

const PAGES = readdirSync(SPECS_DIR)
  .filter((f) => f.endsWith(".yaml") && !f.startsWith("_"))
  .map((f) => `/components/${f.slice(0, -".yaml".length)}`)
  .sort();

for (const path of PAGES) {
  test(`grid-rhythm ${path}`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.ok(), `${path} returned HTTP ${response?.status()}`).toBe(true);
    await page.waitForLoadState("networkidle");

    const result = await page.evaluate(() => {
      const probe = document.createElement("div");
      probe.style.cssText =
        "position:absolute;left:-9999px;top:0;width:var(--t-unit);height:0;visibility:hidden";
      document.body.appendChild(probe);
      const unit = probe.getBoundingClientRect().width;
      probe.remove();

      const main = document.querySelector("main");
      const height = main?.getBoundingClientRect().height ?? 0;
      const remainder = height % unit;
      const offBy = Math.min(remainder, unit - remainder);
      return {
        unit,
        height: Math.round(height * 100) / 100,
        offBy: Math.round(offBy * 100) / 100,
      };
    });

    expect(
      result.offBy,
      `main height ${result.height}px is off-grid by ${result.offBy}px (unit=${result.unit}px)`,
    ).toBeLessThan(0.01);
  });
}
