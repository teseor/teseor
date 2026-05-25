import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const REPO_ROOT = resolve(import.meta.dirname, "..", "..", "..");
const SIZE_LIMIT_PATH = resolve(REPO_ROOT, ".size-limit.json");

type Entry = { name: string; path: string; limit?: string };

async function readSizeLimit(): Promise<Entry[]> {
  return JSON.parse(await readFile(SIZE_LIMIT_PATH, "utf8"));
}

describe("gen-size-limit", () => {
  test("emits bundle entries first, then per-component entries in spec order", async () => {
    const entries = await readSizeLimit();
    const bundleNames = entries
      .filter((e) => !e.path.startsWith("packages/css/dist/components/"))
      .map((e) => e.name);
    expect(bundleNames).toEqual([
      "@teseor/css (full bundle)",
      "@teseor/css/tokens.css",
      "@teseor/css/utilities.css",
      "@teseor/css/tailwind.css",
    ]);
  });

  test("includes one entry per non-underscore spec under specs/", async () => {
    const entries = await readSizeLimit();
    const componentNames = entries
      .filter((e) => e.path.startsWith("packages/css/dist/components/"))
      .map((e) => e.name);
    expect(componentNames).toEqual([
      "@teseor/css/components/button.css",
      "@teseor/css/components/cluster.css",
      "@teseor/css/components/modal.css",
      "@teseor/css/components/stack.css",
      "@teseor/css/components/tooltip.css",
    ]);
  });

  test("every entry has a matching dist path under packages/css/dist", async () => {
    const entries = await readSizeLimit();
    for (const entry of entries) {
      expect(entry.path.startsWith("packages/css/dist/")).toBe(true);
    }
  });
});
