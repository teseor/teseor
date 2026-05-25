import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const REPO_ROOT = resolve(import.meta.dirname, "..", "..", "..");
const SIZE_LIMIT_PATH = resolve(REPO_ROOT, ".size-limit.json");
const SPECS_DIR = resolve(REPO_ROOT, "specs");

type Entry = { name: string; path: string; limit?: string };

const COMPONENT_PATH_PREFIX = "packages/css/dist/components/";

async function readSizeLimit(): Promise<Entry[]> {
  return JSON.parse(await readFile(SIZE_LIMIT_PATH, "utf8"));
}

async function listSpecNames(): Promise<string[]> {
  const entries = await readdir(SPECS_DIR);
  return entries
    .filter((f) => f.endsWith(".yaml") && !f.startsWith("_"))
    .map((f) => f.slice(0, -5))
    .sort();
}

describe("gen-size-limit", () => {
  test("emits the fixed bundle entries before any component entry", async () => {
    const entries = await readSizeLimit();
    const firstComponentIdx = entries.findIndex((e) => e.path.startsWith(COMPONENT_PATH_PREFIX));
    const bundleSlice = firstComponentIdx === -1 ? entries : entries.slice(0, firstComponentIdx);
    expect(bundleSlice.map((e) => e.name)).toEqual([
      "@teseor/css (full bundle)",
      "@teseor/css/tokens.css",
      "@teseor/css/utilities.css",
      "@teseor/css/tailwind.css",
    ]);
  });

  test("emits one component entry per non-underscore spec, alphabetical", async () => {
    const entries = await readSizeLimit();
    const specNames = await listSpecNames();
    const componentEntries = entries.filter((e) => e.path.startsWith(COMPONENT_PATH_PREFIX));
    const expected = specNames.map((name) => ({
      name: `@teseor/css/components/${name}.css`,
      path: `${COMPONENT_PATH_PREFIX}${name}.css`,
    }));
    expect(componentEntries).toEqual(expected);
  });

  test("every entry resolves under packages/css/dist", async () => {
    const entries = await readSizeLimit();
    for (const entry of entries) {
      expect(entry.path.startsWith("packages/css/dist/")).toBe(true);
    }
  });
});
