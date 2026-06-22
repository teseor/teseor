import { pascalCase } from "../../../lib/pascal-case.ts";
import { itemTypeName } from "../../../lib/repeating-naming.ts";
import { esc, formatValue } from "../../../lib/text-escape.ts";
import type { Spec } from "../../gen-contract.ts";
import { renderTable, section } from "./table-printer.ts";

/** Spec fields the docs page reads beyond the shared generator subset. */
export type DocsSpec = Spec & {
  visualStates?: Record<string, { description?: string }>;
  tokens?: Record<string, { fallback?: string; desc?: string }>;
  a11y?: { role?: string; keyboard?: Record<string, string> };
  // Size of `packages/css/dist/components/<name>.css` injected by gen-docs.ts
  // after build:css. Absent when dist hasn't been built yet.
  bundleSizes?: { raw: number; gzip: number; brotli: number };
  // Semantic tokens the component references whose forced-colors literal
  // differs from the default branch. Injected by gen-docs.ts. Absent when the
  // component references no remapped semantic token (scale-only or no CSS).
  forcedColors?: Array<{ token: string; default: string; forced: string }>;
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

/** True when any part of the composite declares an `overlay:` block. */
export function hasOverlayPart(spec: DocsSpec): boolean {
  if (spec.kind !== "composite") return false;
  const visit = (
    parts: Record<string, { overlay?: unknown; parts?: typeof parts }> | undefined,
  ): boolean => {
    if (!parts) return false;
    for (const part of Object.values(parts)) {
      if (part.overlay !== undefined) return true;
      if (part.parts && visit(part.parts)) return true;
    }
    return false;
  };
  return visit(
    (spec as { parts?: Record<string, { overlay?: unknown; parts?: unknown }> })
      .parts as Parameters<typeof visit>[0],
  );
}

export function renderProps(spec: DocsSpec): string {
  const hasRepeating =
    spec.kind === "composite" && Array.isArray(spec.repeating) && spec.repeating.length > 0;
  const exposesAsChildOnly =
    (spec.kind === "composite" && hasFromChildrenPart(spec)) ||
    (spec.kind === "atomic" && spec.polymorphic === "asChild");
  if ((!spec.props || Object.keys(spec.props).length === 0) && !hasRepeating && !exposesAsChildOnly)
    return "";
  // `pattern: controllable` expands to a triple (`name`, `defaultName`,
  // `onNameChange`) in every emitted wrapper / contract. The docs table
  // mirrors that expansion so the documented API matches the consumer's
  // type-completed surface.
  const responsiveMark = (responsive: boolean | undefined) => (responsive ? "✓" : "");
  const rows: string[][] = [];
  for (const [name, def] of Object.entries(spec.props)) {
    if (def.pattern === "controllable" && def.type === "boolean") {
      const PName = pascalCase(name);
      rows.push([
        `<Code>${esc(name)}</Code>`,
        `<Code>boolean, controllable</Code>`,
        responsiveMark(def.responsive),
        `<Code>${esc(formatValue(def.default))}</Code>`,
        esc(def.description ?? ""),
      ]);
      rows.push([
        `<Code>default${esc(PName)}</Code>`,
        `<Code>boolean</Code>`,
        "",
        `<Code>${esc(formatValue(def.default))}</Code>`,
        `Initial open state (uncontrolled).`,
      ]);
      rows.push([
        `<Code>on${esc(PName)}Change</Code>`,
        `<Code>(${esc(name)}: boolean) =&gt; void</Code>`,
        "",
        `<Code>null</Code>`,
        `Fires when the open state changes.`,
      ]);
      continue;
    }
    const type = [def.type, def.slot ? "slot" : ""].filter(Boolean).join(", ");
    // When this prop controls the root tag via `elementByProp`, append the
    // value→tag mapping to its description so the docs page documents the
    // runtime tag switch.
    const isElementByPropControl = spec.kind === "atomic" && spec.elementByProp?.prop === name;
    const tagMapHint = isElementByPropControl
      ? ` Renders as ${Object.entries(spec.elementByProp?.map ?? {})
          .map(([v, tag]) => `<Code>&lt;${esc(tag)}&gt;</Code> for <Code>${esc(v)}</Code>`)
          .join(", ")}.`
      : "";
    rows.push([
      `<Code>${esc(name)}</Code>`,
      `<Code>${esc(type)}</Code>`,
      responsiveMark(def.responsive),
      `<Code>${esc(formatValue(def.default))}</Code>`,
      esc(def.description ?? "") + tagMapHint,
    ]);
  }
  // Two paths surface an emitted `asChild` prop the spec doesn't declare:
  // composite specs with a `fromChildren` part (Tooltip, Modal) and atomic
  // specs that opt in via `polymorphic: 'asChild'`. Either way the flag is
  // generator-emitted, so the docs append it here.
  const exposesAsChild =
    (spec.kind === "composite" && hasFromChildrenPart(spec)) ||
    (spec.kind === "atomic" && spec.polymorphic === "asChild");
  if (exposesAsChild) {
    rows.push([
      `<Code>asChild</Code>`,
      `<Code>boolean</Code>`,
      "",
      `<Code>false</Code>`,
      `Render the trigger directly on the consumer's child element (cloneElement) instead of wrapping in a &lt;span&gt;. Single-child invariant; the child receives the wrapper's &lt;code&gt;style&lt;/code&gt;, &lt;code&gt;data-state&lt;/code&gt;, event handlers, and any ARIA attributes the component applies (component-specific). Not compatible with Astro slots — use the default wrapper there.`,
    ]);
  }
  // `ref` is emitted by the composite-overlay generators (React: ref prop +
  // mergeRefs; Vue: defineExpose({ contentRef })). The gate matches the
  // generator's: `kind === "composite"` plus an `overlay:` block on a part.
  if (spec.kind === "composite" && hasOverlayPart(spec)) {
    rows.push([
      `<Code>ref</Code>`,
      `<Code>Ref&lt;HTMLElement&gt;</Code>`,
      "",
      `<Code>null</Code>`,
      `Forwarded ref to the popover content element. React: pass a callback ref or RefObject as the <Code>ref</Code> prop. Vue: read it through the parent template ref — <Code>${esc(spec.name)}Ref.value?.contentRef.value</Code> (exposed via <Code>defineExpose</Code>).`,
    ]);
  }
  // Repeating parts synthesize an array prop on the parent. Parts
  // sharing the same `groupKey:` merge into one row + one Item section below.
  if (spec.kind === "composite" && spec.repeating) {
    const Name = pascalCase(spec.name);
    const groups = groupRepeating(spec.repeating);
    for (const [propName, group] of groups) {
      const first = group[0];
      if (!first) continue;
      const ItemName = itemTypeName(Name, first);
      const partLabel =
        group.length === 1
          ? `<Code>${esc(first.partName)}</Code>`
          : group.map((g) => `<Code>${esc(g.partName)}</Code>`).join(" + ");
      rows.push([
        `<Code>${esc(propName)}</Code>`,
        `<Code>ReadonlyArray&lt;${esc(ItemName)}&gt;</Code>`,
        "",
        `<Code>[]</Code>`,
        `Items rendered by the repeating ${partLabel} part${group.length > 1 ? "s" : ""}. See <Code>${esc(ItemName)}</Code> for the item shape.`,
      ]);
    }
  }
  return section(
    "Props",
    renderTable(["Prop", "Type", "Responsive", "Default", "Description"], rows),
  );
}

export function renderRepeatingItems(spec: DocsSpec): string {
  if (spec.kind !== "composite" || !spec.repeating || spec.repeating.length === 0) return "";
  const Name = pascalCase(spec.name);
  const groups = groupRepeating(spec.repeating);
  const blocks: string[] = [];
  for (const [, group] of groups) {
    const first = group[0];
    if (!first) continue;
    const ItemName = itemTypeName(Name, first);
    const rows: string[][] = [
      [`<Code>id</Code>`, `<Code>string</Code>`, "—", `Stable item identity (required).`],
    ];
    const seen = new Set<string>();
    for (const part of group) {
      for (const [name, def] of Object.entries(part.itemProps)) {
        if (seen.has(name)) continue;
        seen.add(name);
        const type = [def.type, def.slot ? "slot" : ""].filter(Boolean).join(", ");
        rows.push([
          `<Code>${esc(name)}</Code>`,
          `<Code>${esc(type)}</Code>`,
          `<Code>${esc(formatValue(def.default))}</Code>`,
          esc(def.description ?? ""),
        ]);
      }
    }
    blocks.push(section(ItemName, renderTable(["Field", "Type", "Default", "Description"], rows)));
  }
  return blocks.join("\n");
}

function groupRepeating(
  repeating: NonNullable<DocsSpec["repeating"]>,
): Map<string, NonNullable<DocsSpec["repeating"]>> {
  const out = new Map<string, NonNullable<DocsSpec["repeating"]>>();
  for (const r of repeating) {
    const g = out.get(r.propName) ?? [];
    g.push(r);
    out.set(r.propName, g);
  }
  return out;
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
  if (!spec.visualStates || Object.keys(spec.visualStates).length === 0) return "";
  const rows = Object.entries(spec.visualStates).map(([name, def]) => [
    `<Code>${esc(name)}</Code>`,
    esc(def.description ?? ""),
  ]);
  return section("States", renderTable(["State", "Description"], rows));
}

type PartWithStates = {
  states?: Record<
    string,
    {
      on?: Record<
        string,
        string | { to: string; after?: string; when?: string; emits?: Record<string, unknown> }
      >;
    }
  >;
  parts?: Record<string, PartWithStates>;
};

function collectStatePartsByName(
  parts: Record<string, PartWithStates> | undefined,
): Array<[string, PartWithStates]> {
  if (!parts) return [];
  const out: Array<[string, PartWithStates]> = [];
  for (const [name, part] of Object.entries(parts)) {
    if (part.states && Object.keys(part.states).length > 0) out.push([name, part]);
    if (part.parts) out.push(...collectStatePartsByName(part.parts));
  }
  return out;
}

/**
 * Per-part transition table for every part with a `states:` block. The
 * part's first state is the initial — same contract as the runtime.
 * Columns: From state, Source (the `<part>.<event>` / `key.<name>` /
 * `outside.<event>` key), To state, Conditions (`after`, `when`). One
 * table per part; the part name labels each block.
 */
export function renderStateMachineDiagrams(spec: DocsSpec): string {
  if (spec.kind !== "composite") return "";
  const stateParts = collectStatePartsByName(
    (spec as { parts?: Record<string, PartWithStates> }).parts,
  );
  if (stateParts.length === 0) return "";

  const blocks: string[] = [];
  for (const [partName, part] of stateParts) {
    const states = part.states ?? {};
    const stateNames = Object.keys(states);
    const initial = stateNames[0];
    if (!initial) continue;

    const rows: string[][] = [];
    for (const [stateName, stateDef] of Object.entries(states)) {
      const on = stateDef.on ?? {};
      for (const [sourceKey, target] of Object.entries(on)) {
        const to = typeof target === "string" ? target : target.to;
        const conditions: string[] = [];
        if (typeof target === "object") {
          if (target.after !== undefined)
            conditions.push(`after <Code>${esc(target.after)}</Code>`);
          if (target.when !== undefined) conditions.push(`when <Code>${esc(target.when)}</Code>`);
        }
        rows.push([
          `<Code>${esc(stateName)}</Code>`,
          `<Code>${esc(sourceKey)}</Code>`,
          `<Code>${esc(to)}</Code>`,
          conditions.length > 0 ? conditions.join(", ") : "",
        ]);
      }
    }

    blocks.push(
      [
        `      <h3>Part: <Code>${esc(partName)}</Code> <span class="t-text-muted">(initial: <Code>${esc(initial)}</Code>)</span></h3>`,
        renderTable(["From", "On", "To", "Conditions"], rows),
      ].join("\n"),
    );
  }

  return section("State machine", blocks.join("\n"));
}

export function renderTokens(spec: DocsSpec): string {
  if (!spec.tokens || Object.keys(spec.tokens).length === 0) return "";
  const rows = Object.entries(spec.tokens).map(([name, def]) => [
    // Composite parts with same-named tokens are namespaced as
    // `partName.tokenName` in the flat map (see flattenSpec); the public
    // CSS slot uses `-` as the separator.
    `<Code>--t-${esc(spec.name)}-${esc(name.replace(/\./g, "-"))}</Code>`,
    `<Code>${esc(def.fallback ?? "")}</Code>`,
    esc(def.desc ?? ""),
  ]);
  return section("Tokens", renderTable(["Token", "Fallback", "Description"], rows));
}

export function renderA11y(spec: DocsSpec): string {
  const role = spec.a11y?.role;
  const ariaProps = spec.a11y?.ariaProps ?? [];
  const decorativeProp = spec.a11y?.decorativeProp;
  const declaredKeyboard: Array<[string, string]> = Object.entries(spec.a11y?.keyboard ?? {});
  // Spec-declared rows win when the key collides — a spec that goes out of its
  // way to redeclare `Escape` or `Outside pointer-down` keeps its wording, and
  // the universal contract only fills in keys the spec didn't speak to.
  const declaredKeys = new Set(declaredKeyboard.map(([key]) => key));
  const overlayKeyboard = hasOverlayPart(spec)
    ? OVERLAY_KEYBOARD_ROWS.filter(([key]) => !declaredKeys.has(key))
    : [];
  const keyboard = [...declaredKeyboard, ...overlayKeyboard];
  if (!role && keyboard.length === 0 && ariaProps.length === 0 && !decorativeProp) return "";
  const lines: string[] = [];
  if (role) {
    lines.push(`      <p>Role: <Code>${esc(role)}</Code></p>`);
  }
  for (const propName of ariaProps) {
    lines.push(
      `      <p>Forwards <Code>aria-${esc(propName)}</Code> from the <Code>${esc(propName)}</Code> prop.</p>`,
    );
  }
  if (decorativeProp) {
    lines.push(
      `      <p>Set <Code>${esc(decorativeProp)}</Code> to remove the element from the accessibility tree (<Code>role="none"</Code> + <Code>aria-hidden="true"</Code>).</p>`,
    );
  }
  if (keyboard.length > 0) {
    // Header is `Interaction`, not `Key` — overlay specs inject a
    // pointer-down row alongside the keyboard rows and `Key` would mis-label it.
    const rows = keyboard.map(([key, action]) => [`<Code>${esc(key)}</Code>`, esc(action)]);
    lines.push(renderTable(["Interaction", "Action"], rows));
  }
  return section("Accessibility", lines.join("\n"));
}

export function renderForcedColors(spec: DocsSpec): string {
  if (!spec.forcedColors || spec.forcedColors.length === 0) return "";
  const rows = spec.forcedColors.map(({ token, default: def, forced }) => [
    `<Code>${esc(token)}</Code>`,
    `<Code>${esc(def)}</Code>`,
    `<Code>${esc(forced)}</Code>`,
  ]);
  const intro =
    "      <p>In Windows High Contrast mode, the component remaps these semantic tokens to CSS system colors. Custom-property inheritance carries the values to every reference in the subtree.</p>";
  return section(
    "Forced colors",
    [intro, renderTable(["Token", "Default", "Forced-colors"], rows)].join("\n"),
  );
}

export function renderConstraints(spec: DocsSpec): string {
  if (!spec.constraints || spec.constraints.length === 0) return "";
  const items = spec.constraints
    .filter((c) => typeof c.reason === "string")
    .map((c) => `        <li>${esc(c.reason ?? "")}</li>`);
  if (items.length === 0) return "";
  return section("Constraints", `      <ul>\n${items.join("\n")}\n      </ul>`);
}
