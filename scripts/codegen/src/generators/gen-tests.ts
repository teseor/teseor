import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { Spec as SpecSchema } from "../core/schema.ts";
import type { GeneratorContext, GeneratorReport } from "../generator-registry.ts";
import { registerGenerator } from "../generator-registry.ts";
import { flattenSpec } from "../lib/flatten.ts";
import { pascalCase } from "../lib/pascal-case.ts";
import type { Spec } from "./gen-contract.ts";
import { renderReactFixtureFile } from "./gen-tests/per-spec/react-fixture.ts";
import { renderSpecFile } from "./gen-tests/per-spec/spec-file.ts";
import { renderVueFixtureFile } from "./gen-tests/per-spec/vue-fixture.ts";
import { renderContractHarness } from "./gen-tests/workspace/contract-harness.ts";
import { renderReactBarrel } from "./gen-tests/workspace/react-barrel.ts";
import { renderVueBarrel } from "./gen-tests/workspace/vue-barrel.ts";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
const SPECS_DIR = resolve(REPO_ROOT, "specs");
const FIXTURES_DIR = resolve(REPO_ROOT, "apps", "harness", "src", "fixtures");
const TESTS_DIR = resolve(REPO_ROOT, "tests", "contract");

async function loadSpec(name: string): Promise<Spec> {
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

/** Filter to atomic specs only — composite contract tests need per-instance
 *  ID normalization (anchor-name and popoverId differ across frameworks) and
 *  a richer harness; both are out of scope for the byte-equal DOM comparison
 *  this gen-tests emitter targets. Composites are exercised via component
 *  tests instead. */
async function listAtomicSpecNames(): Promise<string[]> {
  const names = await listSpecNames();
  const out: string[] = [];
  for (const name of names) {
    const spec = await loadSpec(name);
    if (spec.kind !== "composite") out.push(name);
  }
  return out;
}

async function emitReactFixtures(spec: Spec): Promise<string> {
  const content = renderReactFixtureFile(spec);
  const outPath = resolve(FIXTURES_DIR, `${pascalCase(spec.name)}.react.tsx`);
  await mkdir(FIXTURES_DIR, { recursive: true });
  await writeFile(outPath, content, "utf8");
  return outPath;
}

async function emitVueFixtures(spec: Spec): Promise<string> {
  const content = renderVueFixtureFile(spec);
  const outPath = resolve(FIXTURES_DIR, `${pascalCase(spec.name)}.vue.ts`);
  await mkdir(FIXTURES_DIR, { recursive: true });
  await writeFile(outPath, content, "utf8");
  return outPath;
}

async function emitReactBarrel(names: string[]): Promise<string> {
  const content = renderReactBarrel(names);
  const outPath = resolve(FIXTURES_DIR, "index.react.ts");
  await mkdir(FIXTURES_DIR, { recursive: true });
  await writeFile(outPath, content, "utf8");
  return outPath;
}

async function emitVueBarrel(names: string[]): Promise<string> {
  const content = renderVueBarrel(names);
  const outPath = resolve(FIXTURES_DIR, "index.vue.ts");
  await mkdir(FIXTURES_DIR, { recursive: true });
  await writeFile(outPath, content, "utf8");
  return outPath;
}

async function emitSpec(spec: Spec): Promise<string> {
  const content = renderSpecFile(spec);
  const outPath = resolve(TESTS_DIR, `${spec.name}.spec.ts`);
  await mkdir(TESTS_DIR, { recursive: true });
  await writeFile(outPath, content, "utf8");
  return outPath;
}

async function emitContractHarness(): Promise<string> {
  const content = renderContractHarness();
  const outPath = resolve(TESTS_DIR, "_contract.ts");
  await mkdir(TESTS_DIR, { recursive: true });
  await writeFile(outPath, content, "utf8");
  return outPath;
}

async function testsGenerator(ctx: GeneratorContext): Promise<GeneratorReport> {
  const requested = ctx.positionals[0];
  const atomicNames = await listAtomicSpecNames();
  const targets = requested ? [requested] : atomicNames;

  const filesWritten: string[] = [];
  const notes: string[] = [];

  for (const name of targets) {
    const spec = await loadSpec(name);
    if (spec.kind === "composite") {
      // Contract tests for composites need per-instance ID normalization
      // (useId-derived anchor names differ per render). Tracked in #662.
      notes.push(`tests: ${name} skipped (composite contract tests land with #662)`);
      continue;
    }

    const reactPath = await emitReactFixtures(spec);
    filesWritten.push(reactPath);
    notes.push(`tests: ${name} react fixtures -> ${reactPath.replace(`${REPO_ROOT}/`, "")}`);

    const vuePath = await emitVueFixtures(spec);
    filesWritten.push(vuePath);
    notes.push(`tests: ${name} vue fixtures -> ${vuePath.replace(`${REPO_ROOT}/`, "")}`);

    const specPath = await emitSpec(spec);
    filesWritten.push(specPath);
    notes.push(`tests: ${name} spec -> ${specPath.replace(`${REPO_ROOT}/`, "")}`);
  }

  const harnessPath = await emitContractHarness();
  filesWritten.push(harnessPath);
  notes.push(`tests: contract harness -> ${harnessPath.replace(`${REPO_ROOT}/`, "")}`);

  const reactBarrelPath = await emitReactBarrel(atomicNames);
  filesWritten.push(reactBarrelPath);
  notes.push(`tests: react barrel -> ${reactBarrelPath.replace(`${REPO_ROOT}/`, "")}`);

  const vueBarrelPath = await emitVueBarrel(atomicNames);
  filesWritten.push(vueBarrelPath);
  notes.push(`tests: vue barrel -> ${vueBarrelPath.replace(`${REPO_ROOT}/`, "")}`);

  return { filesWritten, notes };
}

registerGenerator("tests", testsGenerator);

export {
  renderContractHarness,
  renderReactBarrel,
  renderReactFixtureFile,
  renderSpecFile,
  renderVueBarrel,
  renderVueFixtureFile,
};
