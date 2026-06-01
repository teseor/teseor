import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { brotliCompressSync, gzipSync } from "node:zlib";
import { parse as parseYaml } from "yaml";
import {
  buildForcedColorsTokenMap,
  buildTokenMap,
} from "../../../../packages/css/postcss-teseor-floor.ts";
import { flattenSpec } from "../lib/flatten.ts";
import type { GeneratorContext, GeneratorReport } from "../registry.ts";
import { registerGenerator } from "../registry.ts";
import { Spec as SpecSchema } from "../schema.ts";
import type { DocsSpec } from "./gen-docs/_shared/sections.ts";
import { renderAtomicDocsPage } from "./gen-docs/kinds/atomic.ts";
import { renderCompositeListDocsPage } from "./gen-docs/kinds/composite-list.ts";
import { renderCompositeOverlayDocsPage } from "./gen-docs/kinds/composite-overlay.ts";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
const SPECS_DIR = resolve(REPO_ROOT, "specs");
const DOCS_PAGES_DIR = resolve(REPO_ROOT, "apps", "docs", "src", "pages", "components");
const CSS_COMPONENTS_DIST = resolve(REPO_ROOT, "packages", "css", "dist", "components");
const CSS_COMPONENTS_SRC = resolve(REPO_ROOT, "packages", "css", "src", "components");
const TOKENS_CSS = resolve(REPO_ROOT, "packages", "css", "src", "tokens.css");

async function readBundleSizes(name: string): Promise<DocsSpec["bundleSizes"]> {
  // ENOENT: build:css not run / spec has no CSS — omit silently. Anything else fails loud.
  try {
    const text = await readFile(resolve(CSS_COMPONENTS_DIST, `${name}.css`), "utf8");
    const buf = Buffer.from(text, "utf8");
    return {
      raw: buf.byteLength,
      gzip: gzipSync(buf).byteLength,
      brotli: brotliCompressSync(buf).byteLength,
    };
  } catch (err) {
    if (err instanceof Error && "code" in err && err.code === "ENOENT") return undefined;
    throw err;
  }
}

const TOKEN_REF = /--t-[\w-]+/g;

async function readForcedColors(
  name: string,
  tokens: Map<string, string>,
  fcTokens: Map<string, string>,
): Promise<DocsSpec["forcedColors"]> {
  // ENOENT: spec has no CSS — omit silently. Anything else fails loud.
  let css: string;
  try {
    css = await readFile(resolve(CSS_COMPONENTS_SRC, name, `${name}.css`), "utf8");
  } catch (err) {
    if (err instanceof Error && "code" in err && err.code === "ENOENT") return undefined;
    throw err;
  }
  const referenced = new Set<string>();
  for (const match of css.matchAll(TOKEN_REF)) referenced.add(match[0]);
  const entries: NonNullable<DocsSpec["forcedColors"]> = [];
  for (const token of [...referenced].sort()) {
    const def = tokens.get(token);
    const forced = fcTokens.get(token);
    if (def !== undefined && forced !== undefined && def !== forced) {
      entries.push({ token, default: def, forced });
    }
  }
  return entries.length > 0 ? entries : undefined;
}

/** Dispatch to the kind-specific renderer for the spec's `kind:` field.
 *  Composite specs split by shape: overlay-anchor (Tooltip / Modal) vs
 *  repeating-list. */
function renderDocsPage(spec: DocsSpec): string {
  if (spec.kind === "composite") {
    if (spec.repeating && spec.repeating.length > 0) return renderCompositeListDocsPage(spec);
    return renderCompositeOverlayDocsPage(spec);
  }
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

  const tokensCss = await readFile(TOKENS_CSS, "utf8");
  const tokens = buildTokenMap(tokensCss);
  const fcTokens = buildForcedColorsTokenMap(tokensCss);

  await mkdir(DOCS_PAGES_DIR, { recursive: true });
  for (const name of targets) {
    const spec = await loadSpec(name);
    spec.bundleSizes = await readBundleSizes(name);
    spec.forcedColors = await readForcedColors(name, tokens, fcTokens);
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
