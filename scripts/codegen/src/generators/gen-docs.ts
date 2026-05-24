import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { flattenSpec } from "../lib/flatten.ts";
import { pascalCase } from "../lib/pascal-case.ts";
import { esc } from "../lib/text-escape.ts";
import type { GeneratorContext, GeneratorReport } from "../registry.ts";
import { registerGenerator } from "../registry.ts";
import { Spec as SpecSchema } from "../schema.ts";
import { renderExamples } from "./gen-docs/_shared/examples.ts";
import type { DocsSpec } from "./gen-docs/_shared/sections.ts";
import {
  renderA11y,
  renderConstraints,
  renderNamed,
  renderProps,
  renderStates,
  renderTokens,
} from "./gen-docs/_shared/sections.ts";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
const SPECS_DIR = resolve(REPO_ROOT, "specs");
const DOCS_PAGES_DIR = resolve(REPO_ROOT, "apps", "docs", "src", "pages", "components");

/** Render the full `.astro` docs page for one component spec. */
function renderDocsPage(spec: DocsSpec): string {
  const Name = pascalCase(spec.name);
  const hasExamples = (spec.examples?.length ?? 0) > 0;
  const isComposite = spec.kind === "composite";
  const sections = [
    renderExamples(spec, Name, { isComposite }),
    renderProps(spec),
    renderNamed("Variants", spec.variants),
    renderNamed("Intents", spec.intents),
    renderNamed("Sizes", spec.sizes),
    renderStates(spec),
    renderTokens(spec),
    renderA11y(spec),
    renderConstraints(spec),
  ].filter((part) => part.length > 0);

  const importNames = isComposite ? [Name, "Button"] : [Name];
  const imports = [
    ...(hasExamples ? [`import { ${importNames.join(", ")} } from "@teseor/react";`] : []),
    `import Base from "../../layouts/Base.astro";`,
  ];
  const intro = spec.description ? `    <p>${esc(spec.description)}</p>\n` : "";

  return [
    "---",
    ...imports,
    "---",
    "",
    `<Base title="${Name} — Teseor">`,
    `  <main class="t-stack" data-gap="6">`,
    `    <h1>${Name}</h1>`,
    `${intro}${sections.join("\n")}`,
    "  </main>",
    "</Base>",
    "",
  ].join("\n");
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
