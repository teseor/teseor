import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { flattenSpec } from "../lib/flatten.ts";
import type { GeneratorContext, GeneratorReport } from "../registry.ts";
import { registerGenerator } from "../registry.ts";
import { Spec as SpecSchema } from "../schema.ts";
import type { DocsSpec } from "./gen-docs/_shared/sections.ts";
import { renderAtomicDocsPage } from "./gen-docs/kinds/atomic.ts";
import { renderCompositeOverlayDocsPage } from "./gen-docs/kinds/composite-overlay.ts";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
const SPECS_DIR = resolve(REPO_ROOT, "specs");
const DOCS_PAGES_DIR = resolve(REPO_ROOT, "apps", "docs", "src", "pages", "components");

/** Dispatch to the kind-specific renderer for the spec's `kind:` field. */
function renderDocsPage(spec: DocsSpec): string {
  if (spec.kind === "composite") return renderCompositeOverlayDocsPage(spec);
  return renderAtomicDocsPage(spec);
}

async function loadSpec(name: string): Promise<DocsSpec> {
  const raw = await readFile(resolve(SPECS_DIR, `${name}.yaml`), "utf8");
  const parsed = parseYaml(raw);
  const result = SpecSchema.safeParse(parsed);
  if (!result.success) {
    const messages = result.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`spec ${name}.yaml failed schema validation:\n${messages}`);
  }
  if (result.data.name !== name) {
    throw new Error(`spec name "${result.data.name}" in ${name}.yaml does not match file basename`);
  }
  return flattenSpec(result.data) as DocsSpec;
}

async function listSpecNames(): Promise<string[]> {
  const entries = await readdir(SPECS_DIR);
  return entries
    .filter((f) => f.endsWith(".yaml") && !f.startsWith("_"))
    .map((f) => f.slice(0, -5))
    .sort();
}

async function docsGenerator(ctx: GeneratorContext): Promise<GeneratorReport> {
  const requested = ctx.positionals[0];
  const targets = requested ? [requested] : await listSpecNames();
  const filesWritten: string[] = [];
  const notes: string[] = [];

  await mkdir(DOCS_PAGES_DIR, { recursive: true });
  for (const name of targets) {
    const spec = await loadSpec(name);
    const outPath = resolve(DOCS_PAGES_DIR, `${name}.astro`);
    await writeFile(outPath, renderDocsPage(spec), "utf8");
    filesWritten.push(outPath);
    notes.push(`docs: ${name} -> ${outPath.replace(`${REPO_ROOT}/`, "")}`);
  }
  return { filesWritten, notes };
}

registerGenerator("docs", docsGenerator);

export type { DocsSpec };
export { renderDocsPage };
