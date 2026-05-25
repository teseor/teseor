import { readdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { GeneratorContext, GeneratorReport } from "../registry.ts";
import { registerGenerator } from "../registry.ts";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
const SPECS_DIR = resolve(REPO_ROOT, "specs");
const OUTPUT_PATH = resolve(REPO_ROOT, ".size-limit.json");

// Bundle-level entries are not per-component and live outside the spec list.
// Their `path` references the dist output of `@teseor/css`.
const BUNDLE_ENTRIES: Array<Record<string, string>> = [
  {
    name: "@teseor/css (full bundle)",
    path: "packages/css/dist/teseor.css",
    limit: "8 kB",
  },
  {
    name: "@teseor/css/tokens.css",
    path: "packages/css/dist/tokens.css",
    limit: "4 kB",
  },
  {
    name: "@teseor/css/utilities.css",
    path: "packages/css/dist/utilities.css",
    limit: "2 kB",
  },
  {
    name: "@teseor/css/tailwind.css",
    path: "packages/css/dist/tailwind.css",
    limit: "6 kB",
  },
];

async function listSpecNames(): Promise<string[]> {
  const entries = await readdir(SPECS_DIR);
  return entries
    .filter((f) => f.endsWith(".yaml") && !f.startsWith("_"))
    .map((f) => f.slice(0, -5))
    .sort();
}

async function sizeLimitGenerator(_ctx: GeneratorContext): Promise<GeneratorReport> {
  const componentNames = await listSpecNames();
  const componentEntries = componentNames.map((name) => ({
    name: `@teseor/css/components/${name}.css`,
    path: `packages/css/dist/components/${name}.css`,
  }));
  const config = [...BUNDLE_ENTRIES, ...componentEntries];
  await writeFile(OUTPUT_PATH, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  return {
    filesWritten: [OUTPUT_PATH],
    notes: [`size-limit: ${componentEntries.length} component entries emitted`],
  };
}

registerGenerator("size-limit", sizeLimitGenerator);
