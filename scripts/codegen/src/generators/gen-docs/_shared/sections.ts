import { pascalCase } from "../../../lib/pascal-case.ts";
import { esc, formatValue } from "../../../lib/text-escape.ts";
import type { Spec } from "../../gen-contract.ts";
import { renderTable, section } from "./table-printer.ts";

/** Spec fields the docs page reads beyond the shared generator subset. */
export type DocsSpec = Spec & {
  states?: Record<string, { description?: string }>;
  tokens?: Record<string, { fallback?: string; desc?: string }>;
  a11y?: { role?: string; keyboard?: Record<string, string> };
};

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
    // `ref` is also generator-emitted on composite-overlay specs; mirrored here so it appears in the public props table.
    rows.push([
      `<code>ref</code>`,
      `<code>Ref&lt;HTMLElement&gt;</code>`,
      `<code>null</code>`,
      `Forwarded ref to the popover content element. React: pass a callback ref or RefObject as the <code>ref</code> prop. Vue: read it through the parent template ref — <code>tooltipRef.value?.contentRef.value</code> (exposed via <code>defineExpose</code>).`,
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
    `<code>${esc(name)}</code>`,
    esc(def.description ?? ""),
  ]);
  return section(title, renderTable(["Name", "Description"], rows));
}

export function renderStates(spec: DocsSpec): string {
  if (!spec.states || Object.keys(spec.states).length === 0) return "";
  const rows = Object.entries(spec.states).map(([name, def]) => [
    `<code>${esc(name)}</code>`,
    esc(def.description ?? ""),
  ]);
  return section("States", renderTable(["State", "Description"], rows));
}

export function renderTokens(spec: DocsSpec): string {
  if (!spec.tokens || Object.keys(spec.tokens).length === 0) return "";
  const rows = Object.entries(spec.tokens).map(([name, def]) => [
    `<code>--t-${esc(spec.name)}-${esc(name)}</code>`,
    `<code>${esc(def.fallback ?? "")}</code>`,
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

export function renderConstraints(spec: DocsSpec): string {
  if (!spec.constraints || spec.constraints.length === 0) return "";
  const items = spec.constraints
    .filter((c) => typeof c.reason === "string")
    .map((c) => `        <li>${esc(c.reason ?? "")}</li>`);
  if (items.length === 0) return "";
  return section("Constraints", `      <ul>\n${items.join("\n")}\n      </ul>`);
}
