import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { flattenSpec } from "../lib/flatten.ts";
import type { GeneratorContext, GeneratorReport } from "../registry.ts";
import { registerGenerator } from "../registry.ts";
import { Spec as SpecSchema } from "../schema.ts";
import type { Spec } from "./gen-contract.ts";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
const SPECS_DIR = resolve(REPO_ROOT, "specs");
const DOCS_PAGES_DIR = resolve(REPO_ROOT, "apps", "docs", "src", "pages", "components");

/** Spec fields the docs page reads beyond the shared generator subset. */
type DocsSpec = Spec & {
  states?: Record<string, { description?: string }>;
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
  const isComposite = spec.kind === "composite";
  // Composite components with a `fromChildren` part don't render an element
  // themselves; the docs example wraps a Button as the trigger so the
  // composite has a real child to decorate (Tooltip + Popover pattern).
  // For composite specs, slot props (e.g. Tooltip's `text`) render as
  // attributes since they're string content, not child elements.
  const trigger = isComposite ? `<Button variant="solid" intent="primary">Trigger</Button>` : null;
  const blocks = spec.examples.map((example) => {
    const props = example.props ?? {};
    // Attrs applied to the rendered example — drop `false` props and (for
    // atomic specs) drop slot props since those become children, not attrs.
    const renderedAttrs = Object.entries(props)
      .filter(([key]) => {
        if (props[key] === false) return false;
        if (isComposite) return true;
        return spec.props?.[key]?.slot !== true;
      })
      .map(([key, value]) => attr(key, value));
    const renderedOpenTag = [Name, ...renderedAttrs].join(" ");
    // Source code shown to the consumer: the full JSX they'd paste, including
    // slot props (slot values surface in the code block even when the rendered
    // example needs them as children — the consumer can pattern-match).
    const sourceAttrs = Object.entries(props)
      .filter(([, value]) => value !== false)
      .map(([key, value]) => attr(key, value));
    const sourceOpenTag = [Name, ...sourceAttrs].join(" ");
    const sourceLines =
      isComposite && trigger
        ? [`<${sourceOpenTag}>`, `  ${trigger}`, `</${Name}>`]
        : [`<${sourceOpenTag}>${Name}</${Name}>`];
    const source = sourceLines.join("\n");
    if (isComposite && trigger) {
      // Composite components carry runtime behavior (state machine, event
      // handlers, popover toggling) so the Astro island needs to hydrate.
      // `client:visible` defers JS to first viewport entry — cheap and
      // matches the "no flash until visible" UX of the docs site.
      return [
        `      <div class="t-stack" data-gap="2">`,
        `        <h3>${esc(example.id ?? "example")}</h3>`,
        `        <div class="t-cluster" data-gap="3">`,
        `          <${renderedOpenTag} client:visible>`,
        `            ${trigger}`,
        `          </${Name}>`,
        `        </div>`,
        `        <pre><code>${esc(source)}</code></pre>`,
        `      </div>`,
      ].join("\n");
    }
    return [
      `      <div class="t-stack" data-gap="2">`,
      `        <h3>${esc(example.id ?? "example")}</h3>`,
      `        <div class="t-cluster" data-gap="3">`,
      `          <${renderedOpenTag}>${Name}</${Name}>`,
      `        </div>`,
      `        <pre><code>${esc(source)}</code></pre>`,
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

function pascalCaseLocal(name: string): string {
  return name
    .split(/[-_\s]+/)
    .map((part) => (part.length === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join("");
}

function renderProps(spec: DocsSpec): string {
  if (!spec.props || Object.keys(spec.props).length === 0) return "";
  // `pattern: controllable` expands to a triple (`name`, `defaultName`,
  // `onNameChange`) in every emitted wrapper / contract. The docs table
  // mirrors that expansion so the documented API matches the consumer's
  // type-completed surface.
  const rows: string[][] = [];
  for (const [name, def] of Object.entries(spec.props)) {
    if (def.pattern === "controllable" && def.type === "boolean") {
      const PName = pascalCaseLocal(name);
      rows.push([
        `<code>${esc(name)}</code>`,
        `<code>boolean, controllable</code>`,
        `<code>${esc(formatValue(def.default))}</code>`,
        esc(def.description ?? ""),
      ]);
      rows.push([
        `<code>default${esc(PName)}</code>`,
        `<code>boolean</code>`,
        `<code>${esc(formatValue(def.default))}</code>`,
        `Initial open state (uncontrolled).`,
      ]);
      rows.push([
        `<code>on${esc(PName)}Change</code>`,
        `<code>(${esc(name)}: boolean) =&gt; void</code>`,
        `<code>null</code>`,
        `Fires when the open state changes.`,
      ]);
      continue;
    }
    const type = [def.type, def.slot ? "slot" : "", def.responsive ? "responsive" : ""]
      .filter(Boolean)
      .join(", ");
    rows.push([
      `<code>${esc(name)}</code>`,
      `<code>${esc(type)}</code>`,
      `<code>${esc(formatValue(def.default))}</code>`,
      esc(def.description ?? ""),
    ]);
  }
  // Composite components with a `fromChildren` part automatically expose
  // `asChild` to opt out of the default `<span>` wrapper. The flag isn't a
  // spec prop — it's emitted by the generator — so the docs append it here.
  if (spec.kind === "composite" && hasFromChildrenPart(spec)) {
    rows.push([
      `<code>asChild</code>`,
      `<code>boolean</code>`,
      `<code>false</code>`,
      `Render the trigger directly on the consumer's child element (cloneElement) instead of wrapping in a &lt;span&gt;. Single-child invariant; the child receives the wrapper's &lt;code&gt;style&lt;/code&gt;, &lt;code&gt;data-state&lt;/code&gt;, event handlers, and any ARIA attributes the component applies (component-specific). Not compatible with Astro slots — use the default wrapper there.`,
    ]);
  }
  return section("Props", renderTable(["Prop", "Type", "Default", "Description"], rows));
}

/** True when any part of the composite is rendered from the consumer's children. */
function hasFromChildrenPart(spec: DocsSpec): boolean {
  if (spec.kind !== "composite") return false;
  const visit = (
    parts: Record<string, { fromChildren?: boolean; parts?: typeof parts }> | undefined,
  ): boolean => {
    if (!parts) return false;
    for (const part of Object.values(parts)) {
      if (part.fromChildren === true) return true;
      if (part.parts && visit(part.parts)) return true;
    }
    return false;
  };
  return visit(
    (spec as { parts?: Record<string, { fromChildren?: boolean; parts?: unknown }> })
      .parts as Parameters<typeof visit>[0],
  );
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
  if (!spec.states || Object.keys(spec.states).length === 0) return "";
  const rows = Object.entries(spec.states).map(([name, def]) => [
    `<code>${esc(name)}</code>`,
    esc(def.description ?? ""),
  ]);
  return section("States", renderTable(["State", "Description"], rows));
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

// Universal overlay dismissal contract, wired in `useOverlay` via
// `useDismissableLayer` for every spec with an `overlay:` block (PR #698).
// Injected here so individual specs don't redeclare the rows in their
// `a11y.keyboard` block and drift from the runtime contract.
const OVERLAY_KEYBOARD_ROWS: Array<[string, string]> = [
  ["Escape", "Closes the overlay. Topmost-wins when multiple overlays are open."],
  ["Outside pointer-down", "Pressing outside the content closes the overlay."],
];

function renderA11y(spec: DocsSpec): string {
  const role = spec.a11y?.role;
  const declaredKeyboard: Array<[string, string]> = Object.entries(spec.a11y?.keyboard ?? {});
  // Spec-declared rows win when the key collides — a spec that goes out of its
  // way to redeclare `Escape` or `Outside pointer-down` keeps its wording, and
  // the universal contract only fills in keys the spec didn't speak to.
  const declaredKeys = new Set(declaredKeyboard.map(([key]) => key));
  const overlayKeyboard = spec.overlay
    ? OVERLAY_KEYBOARD_ROWS.filter(([key]) => !declaredKeys.has(key))
    : [];
  const keyboard = [...declaredKeyboard, ...overlayKeyboard];
  if (!role && keyboard.length === 0) return "";
  const lines: string[] = [];
  if (role) {
    lines.push(`      <p>Role: <code>${esc(role)}</code></p>`);
  }
  if (keyboard.length > 0) {
    // Header is `Interaction`, not `Key` — overlay specs inject a
    // pointer-down row alongside the keyboard rows and `Key` would mis-label it.
    const rows = keyboard.map(([key, action]) => [`<code>${esc(key)}</code>`, esc(action)]);
    lines.push(renderTable(["Interaction", "Action"], rows));
  }
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

  const isComposite = spec.kind === "composite";
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
