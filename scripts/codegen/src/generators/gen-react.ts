import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { computeAnalysis } from "../core/orchestrator.ts";
import type { GeneratorContext, GeneratorReport } from "../generator-registry.ts";
import { registerGenerator } from "../generator-registry.ts";
import { type Breakpoint, loadBreakpoints } from "../lib/breakpoints.ts";
import { flattenSpec } from "../lib/flatten.ts";
import { pascalCase } from "../lib/pascal-case.ts";
import { loadVocabulary } from "../lib/vocabulary.ts";
import { Spec as SpecSchema } from "../schema.ts";
import type { Spec } from "./gen-contract.ts";
import { renderCssShim } from "./gen-react-19/_shared/css-shim.ts";
import { renderAtomicReactWrapper } from "./gen-react-19/kinds/atomic.ts";
import { renderCompositeListReactWrapper } from "./gen-react-19/kinds/composite-list.ts";
import { renderCompositeOverlayReactWrapper } from "./gen-react-19/kinds/composite-overlay.ts";
import { renderBarrel } from "./gen-react-19/workspace/barrel.ts";
import { renderReadme } from "./gen-react-19/workspace/readme.ts";
import { renderRuntime } from "./gen-react-19/workspace/runtime.ts";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
const SPECS_DIR = resolve(REPO_ROOT, "specs");
const REACT_SRC_DIR = resolve(REPO_ROOT, "packages", "react", "src");

/** Dispatch to the kind-specific renderer for the spec's `kind:` field.
 *  Composite specs split by shape: overlay-anchor (Tooltip / Modal) vs
 *  repeating-list. Analysis is pre-computed from the raw schema spec (before
 *  flattening) and threaded in so the atomic kind generator avoids re-deriving it. */
function renderWrapper(
  spec: Spec,
  propDescriptions: Record<string, string>,
  analysis?: ReturnType<typeof computeAnalysis>,
): string {
  if (spec.kind === "composite") {
    if (spec.repeating && spec.repeating.length > 0) return renderCompositeListReactWrapper(spec);
    return renderCompositeOverlayReactWrapper(spec, propDescriptions);
  }
  return renderAtomicReactWrapper(spec, propDescriptions, analysis);
}

async function loadSpec(
  name: string,
): Promise<{ flat: Spec; analysis: ReturnType<typeof computeAnalysis> }> {
  const path = resolve(SPECS_DIR, `${name}.yaml`);
  const raw = await readFile(path, "utf8");
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
  const analysis = computeAnalysis(result.data);
  return { flat: flattenSpec(result.data), analysis };
}

async function listSpecNames(): Promise<string[]> {
  const entries = await readdir(SPECS_DIR);
  return entries
    .filter((f) => f.endsWith(".yaml") && !f.startsWith("_"))
    .map((f) => f.slice(0, -5))
    .sort();
}

async function emitWrapper(
  name: string,
  propDescriptions: Record<string, string>,
): Promise<string> {
  const { flat, analysis } = await loadSpec(name);
  const content = renderWrapper(flat, propDescriptions, analysis);
  const outPath = resolve(REACT_SRC_DIR, `${pascalCase(name)}.tsx`);
  await mkdir(REACT_SRC_DIR, { recursive: true });
  await writeFile(outPath, content, "utf8");
  return outPath;
}

async function emitBarrel(names: string[]): Promise<string> {
  const content = renderBarrel(names);
  const outPath = resolve(REACT_SRC_DIR, `index.ts`);
  await mkdir(REACT_SRC_DIR, { recursive: true });
  await writeFile(outPath, content, "utf8");
  return outPath;
}

async function emitRuntime(breakpoints: Breakpoint[]): Promise<string> {
  const content = renderRuntime(breakpoints);
  const outPath = resolve(REACT_SRC_DIR, `_runtime.ts`);
  await mkdir(REACT_SRC_DIR, { recursive: true });
  await writeFile(outPath, content, "utf8");
  return outPath;
}

async function emitCssShim(): Promise<string> {
  const content = renderCssShim();
  const outPath = resolve(REACT_SRC_DIR, `_css.d.ts`);
  await mkdir(REACT_SRC_DIR, { recursive: true });
  await writeFile(outPath, content, "utf8");
  return outPath;
}

async function emitReadme(specs: Spec[]): Promise<string> {
  const content = renderReadme(specs);
  const outPath = resolve(REPO_ROOT, "packages", "react", "README.md");
  await writeFile(outPath, content, "utf8");
  return outPath;
}

async function reactGenerator(ctx: GeneratorContext): Promise<GeneratorReport> {
  const requested = ctx.positionals[0];
  const allNames = await listSpecNames();
  const targets = requested ? [requested] : allNames;
  const breakpoints = await loadBreakpoints();
  const vocabulary = await loadVocabulary();
  const propDescriptions = vocabulary.propDescriptions ?? {};

  const filesWritten: string[] = [];
  const notes: string[] = [];
  for (const name of targets) {
    const path = await emitWrapper(name, propDescriptions);
    filesWritten.push(path);
    notes.push(`react: ${name} -> ${path.replace(`${REPO_ROOT}/`, "")}`);
  }

  const runtimePath = await emitRuntime(breakpoints);
  filesWritten.push(runtimePath);
  notes.push(`react: runtime -> ${runtimePath.replace(`${REPO_ROOT}/`, "")}`);

  const cssShimPath = await emitCssShim();
  filesWritten.push(cssShimPath);
  notes.push(`react: css-shim -> ${cssShimPath.replace(`${REPO_ROOT}/`, "")}`);

  const barrelPath = await emitBarrel(allNames);
  filesWritten.push(barrelPath);
  notes.push(`react: barrel -> ${barrelPath.replace(`${REPO_ROOT}/`, "")}`);

  const allSpecResults = await Promise.all(allNames.map(loadSpec));
  const readmePath = await emitReadme(allSpecResults.map((r) => r.flat));
  filesWritten.push(readmePath);
  notes.push(`react: readme -> ${readmePath.replace(`${REPO_ROOT}/`, "")}`);

  return { filesWritten, notes };
}

registerGenerator("react", reactGenerator);

export { renderBarrel, renderCssShim, renderReadme, renderRuntime, renderWrapper };
