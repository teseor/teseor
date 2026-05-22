import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import type { GeneratorContext, GeneratorReport } from "../registry.ts";
import { registerGenerator } from "../registry.ts";
import type { Spec } from "./gen-contract.ts";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
const SPECS_DIR = resolve(REPO_ROOT, "specs");
const DOCS_PAGES_DIR = resolve(REPO_ROOT, "apps", "docs", "src", "pages", "components");

/** Spec fields the docs page reads beyond the shared generator subset. */
type DocsSpec = Spec & {
  states?: string[];
  tokens?: Record<string, { fallback?: string; desc?: string }>;
  a11y?: { role?: string; keyboard?: Record<string, string> };
};

function pascalCase(name: string): string {
  return name
    .split(/[-_\s]+/)
    .map((part) => (part.length === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join("");
}

/** Escape text for HTML content; `{}` are escaped because Astro reads them as expressions. */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/{/g, "&lbrace;")
    .replace(/}/g, "&rbrace;");
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

/** A JS-expression rendering of a value — for `prop={expr}` and responsive objects. */
function jsLiteral(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "boolean" || typeof value === "number") return String(value);
  if (typeof value === "object") {
    const entries = Object.entries(value).map(([k, v]) => `${k}: ${jsLiteral(v)}`);
    return `{ ${entries.join(", ")} }`;
  }
  return JSON.stringify(String(value));
}

/** A JSX attribute for one example prop: `key="str"`, bare `key`, or `key={expr}`. */
function attr(key: string, value: unknown): string {
  if (typeof value === "string") return `${key}="${value}"`;
  if (value === true) return key;
  return `${key}={${jsLiteral(value)}}`;
}

function tableRows(rows: string[][]): string {
  return rows
    .map((cells) => `        <tr>${cells.map((c) => `<td>${c}</td>`).join("")}</tr>`)
    .join("\n");
}

function section(title: string, body: string): string {
  return `    <section class="t-stack" data-gap="3">\n      <h2>${title}</h2>\n${body}\n    </section>`;
}

function renderExamples(spec: DocsSpec, Name: string): string {
  if (!spec.examples || spec.examples.length === 0) return "";
  const blocks = spec.examples.map((example) => {
    const props = example.props ?? {};
    const rendered = Object.entries(props)
      .filter(([key]) => spec.props?.[key]?.slot !== true && props[key] !== false)
      .map(([key, value]) => attr(key, value));
    const open = [Name, ...rendered].join(" ");
    const code = Object.entries(props)
      .map(([key, value]) => attr(key, value))
      .join(" ");
    return [
      `      <div class="t-stack" data-gap="2">`,
      `        <h3>${esc(example.id ?? "example")}</h3>`,
      `        <div class="t-cluster" data-gap="3">`,
      `          <${open}>${Name}</${Name}>`,
      `        </div>`,
      `        <code>${esc(code)}</code>`,
      `      </div>`,
    ].join("\n");
  });
  return section("Examples", blocks.join("\n"));
}

function renderTable(headers: string[], rows: string[][]): string {
  const head = headers.map((h) => `<th>${h}</th>`).join("");
  return [
    `      <table>`,
    `        <thead><tr>${head}</tr></thead>`,
    `        <tbody>`,
    tableRows(rows),
    `        </tbody>`,
    `      </table>`,
  ].join("\n");
}

function renderProps(spec: DocsSpec): string {
  if (!spec.props || Object.keys(spec.props).length === 0) return "";
  const rows = Object.entries(spec.props).map(([name, def]) => {
    const type = [def.type, def.slot ? "slot" : "", def.responsive ? "responsive" : ""]
      .filter(Boolean)
      .join(", ");
    return [
      `<code>${esc(name)}</code>`,
      `<code>${esc(type)}</code>`,
      `<code>${esc(formatValue(def.default))}</code>`,
      esc(def.description ?? ""),
    ];
  });
  return section("Props", renderTable(["Prop", "Type", "Default", "Description"], rows));
}

function renderNamed(
  title: string,
  entries: Record<string, { description?: string }> | undefined,
): string {
  if (!entries || Object.keys(entries).length === 0) return "";
  const rows = Object.entries(entries).map(([name, def]) => [
    `<code>${esc(name)}</code>`,
    esc(def.description ?? ""),
  ]);
  return section(title, renderTable(["Name", "Description"], rows));
}

function renderStates(spec: DocsSpec): string {
  if (!spec.states || spec.states.length === 0) return "";
  const items = spec.states.map((state) => `        <li><code>${esc(state)}</code></li>`);
  return section("States", `      <ul>\n${items.join("\n")}\n      </ul>`);
}

function renderTokens(spec: DocsSpec): string {
  if (!spec.tokens || Object.keys(spec.tokens).length === 0) return "";
  const rows = Object.entries(spec.tokens).map(([name, def]) => [
    `<code>--t-${esc(spec.name)}-${esc(name)}</code>`,
    `<code>${esc(def.fallback ?? "")}</code>`,
    esc(def.desc ?? ""),
  ]);
  return section("Tokens", renderTable(["Token", "Fallback", "Description"], rows));
}

function renderA11y(spec: DocsSpec): string {
  if (!spec.a11y) return "";
  const lines: string[] = [];
  if (spec.a11y.role) {
    lines.push(`      <p>Role: <code>${esc(spec.a11y.role)}</code></p>`);
  }
  const keyboard = spec.a11y.keyboard ?? {};
  if (Object.keys(keyboard).length > 0) {
    const rows = Object.entries(keyboard).map(([key, action]) => [
      `<code>${esc(key)}</code>`,
      esc(action),
    ]);
    lines.push(renderTable(["Key", "Action"], rows));
  }
  if (lines.length === 0) return "";
  return section("Accessibility", lines.join("\n"));
}

function renderConstraints(spec: DocsSpec): string {
  if (!spec.constraints || spec.constraints.length === 0) return "";
  const items = spec.constraints
    .filter((c) => typeof c.reason === "string")
    .map((c) => `        <li>${esc(c.reason ?? "")}</li>`);
  if (items.length === 0) return "";
  return section("Constraints", `      <ul>\n${items.join("\n")}\n      </ul>`);
}

/** Render the full `.astro` docs page for one component spec. */
function renderDocsPage(spec: DocsSpec): string {
  const Name = pascalCase(spec.name);
  const hasExamples = (spec.examples?.length ?? 0) > 0;
  const sections = [
    renderExamples(spec, Name),
    renderProps(spec),
    renderNamed("Variants", spec.variants),
    renderNamed("Intents", spec.intents),
    renderNamed("Sizes", spec.sizes),
    renderStates(spec),
    renderTokens(spec),
    renderA11y(spec),
    renderConstraints(spec),
  ].filter((part) => part.length > 0);

  const imports = [
    ...(hasExamples ? [`import { ${Name} } from "@teseor/react";`] : []),
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
  const parsed = parseYaml(raw) as DocsSpec;
  if (parsed.name !== name) {
    throw new Error(`spec name "${parsed.name}" in ${name}.yaml does not match file basename`);
  }
  return parsed;
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
