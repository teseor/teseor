import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { Spec as SpecSchema } from "../core/schema.ts";
import type { GeneratorContext, GeneratorReport } from "../generator-registry.ts";
import { registerGenerator } from "../generator-registry.ts";
import { type Breakpoint, loadBreakpoints } from "../lib/breakpoints.ts";
import { type FlatProp, type FlatSpec, flattenSpec } from "../lib/flatten.ts";
import { pascalCase } from "../lib/pascal-case.ts";
import { renderContract } from "./gen-contract/per-spec.ts";
import { renderBarrel } from "./gen-contract/workspace/barrel.ts";
import { renderReadme } from "./gen-contract/workspace/readme.ts";
import { renderResponsiveModule } from "./gen-contract/workspace/responsive-module.ts";

/** Re-exported for downstream generators that imported the old atomic-only
 *  shape. The flat shape is a superset; existing usages still resolve. */
export type Spec = FlatSpec;
export type SpecProp = FlatProp;

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
const SPECS_DIR = resolve(REPO_ROOT, "specs");
const CONTRACT_SRC_DIR = resolve(REPO_ROOT, "packages", "contract", "src");

async function loadFlatSpec(name: string): Promise<FlatSpec> {
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
  return flattenSpec(result.data);
}

async function listSpecNames(): Promise<string[]> {
  const entries = await readdir(SPECS_DIR);
  return entries
    .filter((f) => f.endsWith(".yaml") && !f.startsWith("_"))
    .map((f) => f.slice(0, -5))
    .sort();
}

async function emitContract(name: string): Promise<string> {
  const spec = await loadFlatSpec(name);
  const content = renderContract(spec);
  const outPath = resolve(CONTRACT_SRC_DIR, `${pascalCase(name)}.ts`);
  await mkdir(CONTRACT_SRC_DIR, { recursive: true });
  await writeFile(outPath, content, "utf8");
  return outPath;
}

async function emitResponsiveModule(breakpoints: Breakpoint[]): Promise<string> {
  const content = renderResponsiveModule(breakpoints);
  const outPath = resolve(CONTRACT_SRC_DIR, "_responsive.ts");
  await mkdir(CONTRACT_SRC_DIR, { recursive: true });
  await writeFile(outPath, content, "utf8");
  return outPath;
}

async function emitReadme(specs: FlatSpec[]): Promise<string> {
  const content = renderReadme(specs);
  const outPath = resolve(REPO_ROOT, "packages", "contract", "README.md");
  await writeFile(outPath, content, "utf8");
  return outPath;
}

async function emitBarrel(specs: FlatSpec[]): Promise<string> {
  const content = renderBarrel(specs);
  const outPath = resolve(CONTRACT_SRC_DIR, "index.ts");
  await mkdir(CONTRACT_SRC_DIR, { recursive: true });
  await writeFile(outPath, content, "utf8");
  return outPath;
}

async function contractGenerator(ctx: GeneratorContext): Promise<GeneratorReport> {
  const requested = ctx.positionals[0];
  const allNames = await listSpecNames();
  const targets = requested ? [requested] : allNames;

  const filesWritten: string[] = [];
  const notes: string[] = [];
  for (const name of targets) {
    const path = await emitContract(name);
    filesWritten.push(path);
    notes.push(`contract: ${name} -> ${path.replace(`${REPO_ROOT}/`, "")}`);
  }

  const breakpoints = await loadBreakpoints();
  const responsivePath = await emitResponsiveModule(breakpoints);
  filesWritten.push(responsivePath);
  notes.push(`contract: responsive module -> ${responsivePath.replace(`${REPO_ROOT}/`, "")}`);

  const allSpecs = await Promise.all(allNames.map(loadFlatSpec));
  const readmePath = await emitReadme(allSpecs);
  filesWritten.push(readmePath);
  notes.push(`contract: readme -> ${readmePath.replace(`${REPO_ROOT}/`, "")}`);

  const barrelPath = await emitBarrel(allSpecs);
  filesWritten.push(barrelPath);
  notes.push(`contract: barrel -> ${barrelPath.replace(`${REPO_ROOT}/`, "")}`);

  return { filesWritten, notes };
}

registerGenerator("contract", contractGenerator);

export { loadFlatSpec, renderBarrel, renderContract, renderResponsiveModule };
