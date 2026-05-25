// CI gate for the production docs site: load every generated component page
// in a real browser, fail on any `console.error` or uncaught error. Catches
// hydration crashes, broken React islands, SSR mismatches, and missing
// imports — without per-component assertions. Runs against the built artifact
// (`astro build` + `astro preview`) — the surface that ships.
import { expect, test } from "@playwright/test";
import { DOCS_PORT } from "../../playwright.config.ts";

const DOCS_BASE = `http://127.0.0.1:${DOCS_PORT}`;

const PAGES = [
  "/components/button",
  "/components/cluster",
  "/components/code",
  "/components/codeblock",
  "/components/modal",
  "/components/stack",
  "/components/tooltip",
] as const;

for (const path of PAGES) {
  test(`docs ${path} loads without console errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(`console.error: ${msg.text()}`);
    });
    await page.goto(`${DOCS_BASE}${path}`);
    await page.waitForLoadState("networkidle");
    expect(errors, errors.join("\n---\n")).toEqual([]);
  });
}
