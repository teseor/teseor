// Enforces the transitionable-property allow-list — only transform-equivalent
// properties are transitionable; transitioning layout properties (width,
// height, padding, margin, top, left, …) causes reflows. A bare `all` or an
// omitted property both default to "everything", which would include layout.
import { readdirSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import postcss from "postcss";
import { REPO_ROOT } from "../../lib/paths.ts";
import type { ViolationDetail, WorkspaceCheck } from "../registry.ts";

const ALLOW = new Set([
  "transform",
  "opacity",
  "filter",
  "background-color",
  "color",
  "border-color",
  "box-shadow",
  "outline-color",
  // Discrete-value transitions — paired with `allow-discrete` to animate
  // popover entry/exit via the Popover API + @starting-style pattern.
  "display",
  "overlay",
]);

const CSS_WIDE = new Set(["none", "inherit", "initial", "unset", "revert", "revert-layer", ""]);

// Tokens that may appear in a `transition` layer; the property is the first
// non-time, non-easing token. We match a duration / delay — `200ms`, `0.2s`,
// `.2s` (leading-zero omitted), and `calc(…)` — plus the standard easing
// keywords, so we can skip them when scanning for the property. Negative
// values are accepted because `transition-delay` legitimately allows them.
const TIME_RE = /^-?(?:\d*\.?\d+)(?:ms|s)$|^calc\(.*\)$/;
const EASING = new Set([
  "linear",
  "ease",
  "ease-in",
  "ease-out",
  "ease-in-out",
  "step-start",
  "step-end",
]);

/** Splits on `sep` at paren depth 0, so commas inside `calc()` / `var()` stay put. */
function splitTopLevel(value: string, sep: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of value) {
    if (char === "(") {
      depth += 1;
    } else if (char === ")") {
      depth -= 1;
    }
    if (char === sep && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts;
}

/** Tokens at paren depth 0 (so `cubic-bezier(0,1,0,1)` stays as one token). */
function tokens(value: string): string[] {
  return splitTopLevel(value, " ")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

function isTimeOrEasing(token: string): boolean {
  if (TIME_RE.test(token)) return true;
  if (EASING.has(token)) return true;
  // Functional easings (`cubic-bezier(...)`, `steps(...)`, `linear(...)`) or
  // var() references that may resolve to a time / easing — treat as non-prop.
  if (/^(?:cubic-bezier|steps|linear)\(/.test(token)) return true;
  if (token.startsWith("var(")) return true;
  return false;
}

/**
 * Returns the property name inside a single `transition: <layer>` segment, or
 * `"all"` if the segment omits a property (which CSS resolves to `all`).
 */
function extractLayerProperty(layer: string): string {
  for (const tok of tokens(layer)) {
    if (isTimeOrEasing(tok)) continue;
    return tok;
  }
  return "all";
}

/** Property names referenced by a `transition` / `transition-property` value. */
function transitionedProperties(prop: string, value: string): string[] {
  const layers = splitTopLevel(value, ",").map((s) => s.trim());
  if (prop === "transition-property") return layers;
  // `transition: …` shorthand — each comma-separated layer is one transition.
  return layers.map(extractLayerProperty);
}

/** Properties whose transition target is outside the allow-list. */
export function findDisallowedTransitions(css: string): string[] {
  const violations: string[] = [];
  const root = postcss.parse(css);

  const customs = new Map<string, string[]>();
  root.walkDecls(/^--_/, (decl) => {
    const list = customs.get(decl.prop) ?? [];
    list.push(decl.value);
    customs.set(decl.prop, list);
  });

  function checkValue(prop: string, value: string, seen: Set<string>): void {
    if (CSS_WIDE.has(value.trim())) return;
    const loneVar = value.trim().match(/^var\(\s*(--_[\w-]+)\s*\)$/);
    if (loneVar?.[1] !== undefined) {
      const name = loneVar[1];
      if (seen.has(name)) return;
      seen.add(name);
      for (const target of customs.get(name) ?? []) {
        checkValue(prop, target, seen);
      }
      return;
    }
    for (const transitioned of transitionedProperties(prop, value)) {
      const name = transitioned.trim();
      if (CSS_WIDE.has(name)) continue;
      if (ALLOW.has(name)) continue;
      violations.push(`\`${prop}\` transitions \`${name}\` — not in the allow-list`);
    }
  }

  root.walkDecls((decl) => {
    if (decl.prop === "transition" || decl.prop === "transition-property") {
      checkValue(decl.prop, decl.value, new Set());
    }
  });

  return violations;
}

function checkComponentsDir(): ViolationDetail[] {
  const componentsDir = resolve(REPO_ROOT, "packages/css/src/components");
  const out: ViolationDetail[] = [];
  for (const entry of readdirSync(componentsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const file = resolve(componentsDir, entry.name, `${entry.name}.css`);
    const rel = relative(REPO_ROOT, file);
    for (const message of findDisallowedTransitions(readFileSync(file, "utf8"))) {
      out.push({ file: rel, message });
    }
  }
  return out;
}

export const rule: WorkspaceCheck = {
  kind: "workspace",
  triggers: ["packages/css/src/components/**/*.css"],
  run: checkComponentsDir,
  hint: "Only transform-equivalent properties may transition; layout properties trigger reflows.",
};
