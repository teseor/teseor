import { pascalCase } from "../../../lib/pascal-case.ts";
import { esc, formatValue } from "../../../lib/text-escape.ts";
import type { Spec } from "../../gen-contract.ts";
import { renderTable, section } from "./table-printer.ts";

/** Spec fields the docs page reads beyond the shared generator subset. */
export type DocsSpec = Spec & {
  states?: Record<string, { description?: string }>;
  tokens?: Record<string, { fallback?: string; desc?: string }>;
  a11y?: { role?: string; keyboard?: Record<string, string> };
  // Size of `packages/css/dist/components/<name>.css` injected by gen-docs.ts
  // after build:css. Absent when dist hasn't been built yet.
  bundleSizes?: { raw: number; gzip: number; brotli: number };
};

function formatKb(bytes: number): string {
  return `${(bytes / 1024).toFixed(2)} KB`;
}

const REPO_BLOB_URL = "https://github.com/teseor/teseor/blob/main";

export function renderBundleSize(spec: DocsSpec): string {
  if (!spec.bundleSizes) return "";
  const { raw, gzip, brotli } = spec.bundleSizes;
  // URL path segments need `encodeURIComponent`, not the HTML-escape `esc`.
  const urlName = encodeURIComponent(spec.name);
  const source = `${REPO_BLOB_URL}/packages/css/src/components/${urlName}/${urlName}.css`;
  const rows = [
    [
      `<a href="${source}"><Code>@teseor/css/components/${esc(spec.name)}.css</Code></a>`,
      formatKb(raw),
      formatKb(gzip),
      formatKb(brotli),
    ],
  ];
  return section("Bundle size", renderTable(["Artifact", "Raw", "Gzip", "Brotli"], rows));
}

// Universal overlay dismissal contract, wired in `useOverlay` via
// `useDismissableLayer` for every spec with an `overlay:` block (PR #698).
// Injected here so individual specs don't redeclare the rows in their
// `a11y.keyboard` block and drift from the runtime contract.
const OVERLAY_KEYBOARD_ROWS: Array<[string, string]> = [
  ["Escape", "Closes the overlay. Topmost-wins when multiple overlays are open."],
  ["Outside pointer-down", "Pressing outside the content closes the overlay."],
];

/** True when any part of the composite is rendered from the consumer's children. */
export function hasFromChildrenPart(spec: DocsSpec): boolean {
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

export function renderProps(spec: DocsSpec): string {
  if (!spec.props || Object.keys(spec.props).length === 0) return "";
  // `pattern: controllable` expands to a triple (`name`, `defaultName`,
  // `onNameChange`) in every emitted wrapper / contract. The docs table
  // mirrors that expansion so the documented API matches the consumer's
  // type-completed surface.
  const rows: string[][] = [];
  for (const [name, def] of Object.entries(spec.props)) {
    if (def.pattern === "controllable" && def.type === "boolean") {
      const PName = pascalCase(name);
      rows.push([
        `<Code>${esc(name)}</Code>`,
        `<Code>boolean, controllable</Code>`,
        `<Code>${esc(formatValue(def.default))}</Code>`,
        esc(def.description ?? ""),
      ]);
      rows.push([
        `<Code>default${esc(PName)}</Code>`,
        `<Code>boolean</Code>`,
        `<Code>${esc(formatValue(def.default))}</Code>`,
        `Initial open state (uncontrolled).`,
      ]);
      rows.push([
        `<Code>on${esc(PName)}Change</Code>`,
        `<Code>(${esc(name)}: boolean) =&gt; void</Code>`,
        `<Code>null</Code>`,
        `Fires when the open state changes.`,
      ]);
      continue;
    }
    const type = [def.type, def.slot ? "slot" : "", def.responsive ? "responsive" : ""]
      .filter(Boolean)
      .join(", ");
    rows.push([
      `<Code>${esc(name)}</Code>`,
      `<Code>${esc(type)}</Code>`,
      `<Code>${esc(formatValue(def.default))}</Code>`,
      esc(def.description ?? ""),
    ]);
  }
  // Composite components with a `fromChildren` part automatically expose
  // `asChild` to opt out of the default `<span>` wrapper. The flag isn't a
  // spec prop — it's emitted by the generator — so the docs append it here.
  if (spec.kind === "composite" && hasFromChildrenPart(spec)) {
    rows.push([
      `<Code>asChild</Code>`,
      `<Code>boolean</Code>`,
      `<Code>false</Code>`,
      `Render the trigger directly on the consumer's child element (cloneElement) instead of wrapping in a &lt;span&gt;. Single-child invariant; the child receives the wrapper's &lt;code&gt;style&lt;/code&gt;, &lt;code&gt;data-state&lt;/code&gt;, event handlers, and any ARIA attributes the component applies (component-specific). Not compatible with Astro slots — use the default wrapper there.`,
    ]);
  }
  // `ref` is emitted by the composite-overlay generators (React: ref prop +
  // mergeRefs; Vue: defineExpose({ contentRef })). The gate matches the
  // generator's: `kind === "composite"` plus an `overlay:` block.
  if (spec.kind === "composite" && spec.overlay) {
    rows.push([
      `<Code>ref</Code>`,
      `<Code>Ref&lt;HTMLElement&gt;</Code>`,
      `<Code>null</Code>`,
      `Forwarded ref to the popover content element. React: pass a callback ref or RefObject as the <Code>ref</Code> prop. Vue: read it through the parent template ref — <Code>${esc(spec.name)}Ref.value?.contentRef.value</Code> (exposed via <Code>defineExpose</Code>).`,
    ]);
  }
  return section("Props", renderTable(["Prop", "Type", "Default", "Description"], rows));
}

export function renderNamed(
  title: string,
  entries: Record<string, { description?: string }> | undefined,
): string {
  if (!entries || Object.keys(entries).length === 0) return "";
  const rows = Object.entries(entries).map(([name, def]) => [
    `<Code>${esc(name)}</Code>`,
    esc(def.description ?? ""),
  ]);
  return section(title, renderTable(["Name", "Description"], rows));
}

export function renderStates(spec: DocsSpec): string {
  if (!spec.states || Object.keys(spec.states).length === 0) return "";
  const rows = Object.entries(spec.states).map(([name, def]) => [
    `<Code>${esc(name)}</Code>`,
    esc(def.description ?? ""),
  ]);
  return section("States", renderTable(["State", "Description"], rows));
}

export function renderTokens(spec: DocsSpec): string {
  if (!spec.tokens || Object.keys(spec.tokens).length === 0) return "";
  const rows = Object.entries(spec.tokens).map(([name, def]) => [
    `<Code>--t-${esc(spec.name)}-${esc(name)}</Code>`,
    `<Code>${esc(def.fallback ?? "")}</Code>`,
    esc(def.desc ?? ""),
  ]);
  return section("Tokens", renderTable(["Token", "Fallback", "Description"], rows));
}

export function renderA11y(spec: DocsSpec): string {
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
    lines.push(`      <p>Role: <Code>${esc(role)}</Code></p>`);
  }
  if (keyboard.length > 0) {
    // Header is `Interaction`, not `Key` — overlay specs inject a
    // pointer-down row alongside the keyboard rows and `Key` would mis-label it.
    const rows = keyboard.map(([key, action]) => [`<Code>${esc(key)}</Code>`, esc(action)]);
    lines.push(renderTable(["Interaction", "Action"], rows));
  }
  return section("Accessibility", lines.join("\n"));
}

export function renderConstraints(spec: DocsSpec): string {
  if (!spec.constraints || spec.constraints.length === 0) return "";
  const items = spec.constraints
    .filter((c) => typeof c.reason === "string")
    .map((c) => `        <li>${esc(c.reason ?? "")}</li>`);
  if (items.length === 0) return "";
  return section("Constraints", `      <ul>\n${items.join("\n")}\n      </ul>`);
}
