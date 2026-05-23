import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { flattenSpec } from "../lib/flatten.ts";
import {
  type Cell,
  coverageFixtureId,
  type Dimension,
  expandPairwise,
  type Constraint as PairwiseConstraint,
} from "../pairwise.ts";
import type { GeneratorContext, GeneratorReport } from "../registry.ts";
import { registerGenerator } from "../registry.ts";
import { Spec as SpecSchema } from "../schema.ts";
import type { Spec, SpecProp } from "./gen-contract.ts";

/** Spec fields gen-tests reads beyond gen-contract's loose Spec type. */
type TestsSpec = Spec & {
  states?: Record<string, { description?: string }>;
  coverage?: Record<string, true | readonly string[]>;
};

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
const SPECS_DIR = resolve(REPO_ROOT, "specs");
const FIXTURES_DIR = resolve(REPO_ROOT, "apps", "harness", "src", "fixtures");
const TESTS_DIR = resolve(REPO_ROOT, "tests", "contract");

function pascalCase(name: string): string {
  return name
    .split(/[-_\s]+/)
    .map((part) => (part.length === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join("");
}

function quote(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function jsLiteral(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string") return quote(value);
  if (typeof value === "boolean" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return `[${value.map(jsLiteral).join(", ")}]`;
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).map(
      ([k, v]) => `${quote(k)}: ${jsLiteral(v)}`,
    );
    return `{ ${entries.join(", ")} }`;
  }
  return "undefined";
}

function jsxAttr(name: string, value: unknown): string {
  if (typeof value === "string") return ` ${name}=${quote(value)}`;
  if (typeof value === "boolean") return value ? ` ${name}` : ` ${name}={false}`;
  if (typeof value === "number") return ` ${name}={${value}}`;
  return ` ${name}={${jsLiteral(value)}}`;
}

function splitProps(
  spec: Spec,
  exampleProps: Record<string, unknown>,
): { regular: Array<[string, unknown]>; slots: Array<[string, string]> } {
  const regular: Array<[string, unknown]> = [];
  const slots: Array<[string, string]> = [];
  const specProps = spec.props ?? {};
  for (const [name, value] of Object.entries(exampleProps)) {
    const def: SpecProp | undefined = specProps[name];
    if (def?.slot === true) {
      slots.push([name, String(value)]);
    } else {
      regular.push([name, value]);
    }
  }
  return { regular, slots };
}

function renderReactFixtureBody(
  spec: Spec,
  Name: string,
  exampleProps: Record<string, unknown>,
): string {
  const { regular, slots } = splitProps(spec, exampleProps);
  const attrString = regular.map(([n, v]) => jsxAttr(n, v)).join("");
  const slotAttrs = slots.map(([n, v]) => ` ${n}={SLOT(${quote(v)})}`).join("");
  return `<${Name}${attrString}${slotAttrs}>{LABEL}</${Name}>`;
}

function renderVueFixtureBody(
  spec: Spec,
  Name: string,
  exampleProps: Record<string, unknown>,
): string {
  const { regular, slots } = splitProps(spec, exampleProps);
  const propEntries = regular.map(([n, v]) => `${quote(n)}: ${jsLiteral(v)}`);
  const propsObj = propEntries.length === 0 ? "{}" : `{ ${propEntries.join(", ")} }`;
  const slotEntries = ["default: LABEL", ...slots.map(([n, v]) => `${n}: SLOT(${quote(v)})`)];
  const slotsObj = `{ ${slotEntries.join(", ")} }`;
  return `h(${Name}, ${propsObj}, ${slotsObj})`;
}

function hasSlotProps(spec: Spec): boolean {
  return Object.values(spec.props ?? {}).some((def) => def.slot === true);
}

// ── Coverage expansion (pairwise) ───────────────────────────────────────────

function declaredValues(spec: TestsSpec, dimName: string): readonly string[] {
  switch (dimName) {
    case "variant":
      return Object.keys(spec.variants ?? {});
    case "intent":
      return Object.keys(spec.intents ?? {});
    case "size":
      return Object.keys(spec.sizes ?? {});
    case "states":
      return Object.keys(spec.states ?? {});
    default: {
      const def = spec.props?.[dimName];
      return def?.values ?? [];
    }
  }
}

function collectCoverageDimensions(spec: TestsSpec): Dimension[] {
  const coverage = spec.coverage;
  if (!coverage) return [];
  const out: Dimension[] = [];
  for (const [name, declaration] of Object.entries(coverage)) {
    const declared = declaredValues(spec, name);
    if (declared.length === 0) continue;
    const values =
      declaration === true ? declared : declaration.filter((v) => declared.includes(v));
    if (values.length === 0) continue;
    out.push({ name, values });
  }
  return out;
}

/** Preserves boolean / number values verbatim — needed for constraints like
 * `when: { loading: true }` that wouldn't match if we string-coerced. */
function collectConstraints(spec: TestsSpec): PairwiseConstraint[] {
  return (spec.constraints ?? []).map((c) => ({
    when: { ...(c.when ?? {}) },
    forbid: { ...(c.forbid ?? {}) },
  }));
}

/** Translate a pairwise cell into a fixture props object. `states` cells
 * (e.g. `disabled`) map to the matching boolean prop (`disabled: true`); the
 * rest pass through as `{ <dim>: <value> }`. */
function cellToProps(cell: Cell): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  for (const [dim, value] of Object.entries(cell)) {
    if (dim === "states") props[value] = true;
    else props[dim] = value;
  }
  return props;
}

type CoverageFixture = { id: string; props: Record<string, unknown> };

function coverageFixtures(spec: TestsSpec): CoverageFixture[] {
  const dimensions = collectCoverageDimensions(spec);
  if (dimensions.length === 0) return [];
  const constraints = collectConstraints(spec);
  // Pairwise evaluates constraints against the *translated* cell so a
  // constraint referencing `loading: true` matches a cell that translated a
  // `states: "loading"` dimension into `{ loading: true }`.
  const cells = expandPairwise(dimensions, constraints, cellToProps);
  return cells.map((cell) => ({
    id: coverageFixtureId(cell, dimensions),
    props: cellToProps(cell),
  }));
}

/** Throws if any fixture ID collides — examples may share an ID with each
 * other or with a coverage cell; the rendered fixtures map keyed by ID would
 * silently overwrite the loser. */
function assertUniqueFixtureIds(ids: readonly string[], spec: TestsSpec): void {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) dupes.add(id);
    seen.add(id);
  }
  if (dupes.size > 0) {
    throw new Error(
      `gen-tests: duplicate fixture id(s) in spec "${spec.name}": ${[...dupes].join(", ")}`,
    );
  }
}

function renderReactFixtureFile(spec: Spec): string {
  const Name = pascalCase(spec.name);
  const examples = spec.examples ?? [];
  const coverage = coverageFixtures(spec as TestsSpec);
  const exampleEntries = examples
    .filter((e): e is { id: string; props?: Record<string, unknown> } => typeof e.id === "string")
    .map((e) => `  ${quote(e.id)}: () => ${renderReactFixtureBody(spec, Name, e.props ?? {})},`);
  const coverageEntries = coverage.map(
    (m) => `  ${quote(m.id)}: () => ${renderReactFixtureBody(spec, Name, m.props)},`,
  );
  const entries = [...exampleEntries, ...coverageEntries].join("\n");
  const slotHelper = hasSlotProps(spec)
    ? `const SLOT = (name: string): ReactNode => <span data-fixture-slot={name} />;\n`
    : "";
  return `// AUTOGENERATED by gen-tests. Do not edit.
// Source: specs/${spec.name}.yaml

import { ${Name} } from "@teseor/react";
import type { ReactNode } from "react";

${slotHelper}const LABEL = "Label";

export const fixtures: Record<string, () => ReactNode> = {
${entries}
};
`;
}

function renderVueFixtureFile(spec: Spec): string {
  const Name = pascalCase(spec.name);
  const examples = spec.examples ?? [];
  const coverage = coverageFixtures(spec as TestsSpec);
  const exampleEntries = examples
    .filter((e): e is { id: string; props?: Record<string, unknown> } => typeof e.id === "string")
    .map((e) => `  ${quote(e.id)}: () => ${renderVueFixtureBody(spec, Name, e.props ?? {})},`);
  const coverageEntries = coverage.map(
    (m) => `  ${quote(m.id)}: () => ${renderVueFixtureBody(spec, Name, m.props)},`,
  );
  const entries = [...exampleEntries, ...coverageEntries].join("\n");
  const slotHelper = hasSlotProps(spec)
    ? `const SLOT = (name: string) => () => h("span", { "data-fixture-slot": name });\n`
    : "";
  return `// AUTOGENERATED by gen-tests. Do not edit.
// Source: specs/${spec.name}.yaml

import { h, type VNode } from "vue";
import { ${Name} } from "@teseor/vue";

${slotHelper}const LABEL = () => "Label";

export const fixtures: Record<string, () => VNode> = {
${entries}
};
`;
}

function renderReactBarrel(names: string[]): string {
  const imports = names
    .map((n) => `import { fixtures as ${n}Fixtures } from "./${pascalCase(n)}.react.tsx";`)
    .join("\n");
  const entries = names.map((n) => `  ${n}: ${n}Fixtures,`).join("\n");
  return `// AUTOGENERATED by gen-tests. Do not edit.

import type { ReactNode } from "react";
${imports}

export const reactFixtures: Record<string, Record<string, () => ReactNode>> = {
${entries}
};
`;
}

function renderVueBarrel(names: string[]): string {
  const imports = names
    .map((n) => `import { fixtures as ${n}Fixtures } from "./${pascalCase(n)}.vue.ts";`)
    .join("\n");
  const entries = names.map((n) => `  ${n}: ${n}Fixtures,`).join("\n");
  return `// AUTOGENERATED by gen-tests. Do not edit.

import type { VNode } from "vue";
${imports}

export const vueFixtures: Record<string, Record<string, () => VNode>> = {
${entries}
};
`;
}

function renderContractHarness(): string {
  return `// AUTOGENERATED by gen-tests. Do not edit.

import { expect, test, type Page } from "@playwright/test";

type ContractTestOptions = {
  component: string;
  rootClass: string;
  fixtureIds: readonly string[];
};

async function capture(
  page: Page,
  component: string,
  rootClass: string,
  framework: "react" | "vue",
  fixture: string,
): Promise<string> {
  await page.goto(\`/\${framework}/\${component}?fixture=\${fixture}\`);
  await page.locator(\`.\${rootClass}\`).first().waitFor({ state: "attached" });
  return page.evaluate((selector) => {
    function canon(el: Element): string {
      const tag = el.tagName.toLowerCase();
      const attrs = Array.from(el.attributes)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((a) => {
          const v = a.value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
          return \`\${a.name}="\${v}"\`;
        })
        .join(" ");
      const open = attrs ? \`<\${tag} \${attrs}>\` : \`<\${tag}>\`;
      const close = \`</\${tag}>\`;
      const children = Array.from(el.childNodes)
        .map((node) => {
          if (node.nodeType === 1) return canon(node as Element);
          if (node.nodeType === 3) {
            const text = node.textContent ?? "";
            return text.trim() === "" ? "" : text;
          }
          return "";
        })
        .join("");
      return \`\${open}\${children}\${close}\`;
    }
    const root = document.querySelector(selector);
    if (!root) throw new Error(\`harness: selector "\${selector}" not found\`);
    return canon(root);
  }, \`.\${rootClass}\`);
}

export function defineContractTests(options: ContractTestOptions): void {
  const { component, rootClass, fixtureIds } = options;

  for (const id of fixtureIds) {
    test(\`\${component} "\${id}" — React and Vue render identical DOM\`, async ({ page }) => {
      const reactHtml = await capture(page, component, rootClass, "react", id);
      const vueHtml = await capture(page, component, rootClass, "vue", id);
      expect(vueHtml).toBe(reactHtml);
    });
  }

  test(\`\${component} — combined DOM snapshot\`, async ({ page }) => {
    const sections: string[] = [];
    for (const id of fixtureIds) {
      const reactHtml = await capture(page, component, rootClass, "react", id);
      sections.push(\`<!-- \${id} -->\\n\${reactHtml}\`);
    }
    expect(\`\${sections.join("\\n\\n")}\\n\`).toMatchSnapshot(\`\${component}.html\`);
  });
}
`;
}

function renderSpecFile(spec: Spec): string {
  const rootClass = spec.rootClass ?? `t-${spec.name}`;
  const exampleIds = (spec.examples ?? [])
    .map((e) => e.id)
    .filter((id): id is string => typeof id === "string");
  const coverageIds = coverageFixtures(spec as TestsSpec).map((m) => m.id);
  const allIds = [...exampleIds, ...coverageIds];
  assertUniqueFixtureIds(allIds, spec as TestsSpec);
  const idList = allIds.map((id) => `    ${quote(id)},`).join("\n");
  return `// AUTOGENERATED by gen-tests. Do not edit.
// Source: specs/${spec.name}.yaml

import { defineContractTests } from "./_contract.ts";

defineContractTests({
  component: ${quote(spec.name)},
  rootClass: ${quote(rootClass)},
  fixtureIds: [
${idList}
  ],
});
`;
}

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
