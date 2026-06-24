// Enforces the unit-derived spatial system (see #803):
//   1. Every derived spatial token in tokens.css traces to `var(--t-unit)`.
//   2. Every sizing-property value in component CSS contains no raw `px` /
//      `rem` literal outside of `var(...)` fallback positions. The rule
//      transitively follows every `var(--_*)` reference, so a literal hidden
//      in a private slot (including a modifier-reassigned slot) is still
//      caught. All other unit types — keywords (`auto`, `none`, `fit-content`,
//      …), zero, percentages, em / lh / fr / ch / ex, and viewport / container
//      units (`vh`, `vw`, `sv*`, `lv*`, `dv*`, `cq*`) — are allowed; the rule
//      treats them as relative or context-bound rather than as drift.
//
// Out of scope (see #804): text-size and leading. The rule deliberately
// does not constrain `font-size` / `line-height`.
import { readdirSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import postcss from "postcss";
import postcssEach from "postcss-each";
import { REPO_ROOT } from "../helpers/paths.ts";
import type { ViolationDetail, WorkspaceCheck } from "../registry.ts";

const SIZING_PROPS = new Set([
  // padding
  "padding",
  "padding-block",
  "padding-inline",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "padding-block-start",
  "padding-block-end",
  "padding-inline-start",
  "padding-inline-end",
  // margin
  "margin",
  "margin-block",
  "margin-inline",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "margin-block-start",
  "margin-block-end",
  "margin-inline-start",
  "margin-inline-end",
  // gap
  "gap",
  "row-gap",
  "column-gap",
  // sizing
  "height",
  "width",
  "block-size",
  "inline-size",
  "min-height",
  "max-height",
  "min-width",
  "max-width",
  "min-block-size",
  "max-block-size",
  "min-inline-size",
  "max-inline-size",
  // position offsets
  "top",
  "right",
  "bottom",
  "left",
  "inset",
  "inset-block",
  "inset-inline",
  "inset-block-start",
  "inset-block-end",
  "inset-inline-start",
  "inset-inline-end",
]);

// Tokens.css declarations that must derive from --t-unit. The literal-OK set
// catches deliberate non-grid constants (`0`, `9999px` for `--t-radius-full`).
const DERIVED_TOKEN_PREFIXES = ["--t-space-", "--t-row-", "--t-touch-"];
const DERIVED_RADIUS = new Set([
  "--t-radius-sm",
  "--t-radius-md",
  "--t-radius-lg",
  "--t-radius-xl",
]);

function isDerivedSpatialToken(prop: string): boolean {
  if (DERIVED_RADIUS.has(prop)) return true;
  return DERIVED_TOKEN_PREFIXES.some((p) => prop.startsWith(p));
}

/** Strip every `var(...)` call (including its fallback) from a CSS value.
 *  Balanced-paren aware so nested `var(var(...))` is removed as a unit. */
function stripVarCalls(value: string): string {
  let out = "";
  let i = 0;
  while (i < value.length) {
    if (value.startsWith("var(", i)) {
      let depth = 1;
      let j = i + 4;
      while (j < value.length && depth > 0) {
        if (value[j] === "(") depth++;
        else if (value[j] === ")") depth--;
        j++;
      }
      i = j;
    } else {
      out += value[i];
      i++;
    }
  }
  return out;
}

/**
 * Sizing-property values must not contain raw absolute lengths *outside* of
 * `var()` fallback positions. `var(--t-x, 20rem)` is the project's idiomatic
 * floor pattern (allowed); `calc(var(--t-space-2) + 1rem)` and
 * `var(--t-space-2) 8px` keep failing because the literal sits at the
 * top level (or inside a `calc()`), not inside a `var()`. Relative units
 * (em, lh, %, vh, vw, svh, lvh, dvh, cqi, cqb, fr, ch, ex) and keywords
 * stay legal.
 */
export function isAcceptableSizingValue(value: string): boolean {
  // Strip `var(...)` calls first so fallback literals don't trigger the check.
  // Any px / rem literal (including `0px`) in the residue fails — convention
  // is bare `0`. Preceded by a value-boundary character so `1.25emm` won't
  // trip and `--_foopx` (custom-property name) won't either.
  const residue = stripVarCalls(value);
  return !/(?:^|[\s,(/*+-])-?\d*\.?\d+(?:px|rem)\b/.test(residue);
}

export function findRhythmViolations(
  tokensCss: string,
  components: ReadonlyArray<{ name: string; rel: string; css: string }>,
): ViolationDetail[] {
  const out: ViolationDetail[] = [];

  // (1) tokens.css: every derived spatial token traces to var(--t-unit).
  const tokensRoot = postcss.parse(tokensCss);
  tokensRoot.walkDecls((decl) => {
    if (!isDerivedSpatialToken(decl.prop)) return;
    // `0` is the only literal that's legitimately equivalent to a zero-unit
    // derivation — covers `--t-space-0`.
    if (decl.value.trim() === "0") return;
    // Match the var(...) shape with a precise terminator so `var(--t-unit-foo)`
    // does not falsely satisfy a `--t-unit` trace. Mirrors motion-scale.ts.
    if (/var\(\s*--t-unit\s*[,)]/.test(decl.value)) return;
    out.push({
      file: "packages/css/src/tokens.css",
      line: decl.source?.start?.line,
      message: `\`${decl.prop}: ${decl.value}\` — derived spatial tokens must trace to \`var(--t-unit)\``,
    });
  });

  // (2) component CSS: sizing-property values use tokens or relative units.
  //     The check follows `var(--_*)` references transitively (motion-scale
  //     pattern) so a slot reassigned to a literal — e.g. `--_pad-x: 13px` in
  //     a [data-size="lg"] modifier — fails even though the use site reads a
  //     legitimate `var(--_pad-x)`.
  for (const { rel, css } of components) {
    const root = postcss([postcssEach()]).process(css, { from: undefined }).root;
    const slotValues = new Map<string, string[]>();
    root.walkDecls(/^--_/, (decl) => {
      const list = slotValues.get(decl.prop) ?? [];
      list.push(decl.value);
      slotValues.set(decl.prop, list);
    });

    root.walkDecls((decl) => {
      if (!SIZING_PROPS.has(decl.prop)) return;
      if (isAcceptableSizingValueDeep(decl.value, slotValues, new Set())) return;
      out.push({
        file: rel,
        line: decl.source?.start?.line,
        message: `\`${decl.prop}: ${decl.value}\` — sizing values must read \`var(--t-*)\` / \`var(--_*)\` or stay on relative units (em, lh, %, vh / vw / sv* / lv* / dv* / cq*, fr, ch, ex). Raw px / rem rejected (in the value or in any --_* slot it traces through).`,
      });
    });
  }

  return out;
}

/**
 * Like `isAcceptableSizingValue` but follows every `var(--_*)` reference into
 * the file's own `--_*` declarations. A slot is acceptable only if EVERY
 * declared value (across modifiers, states, breakpoints) is itself acceptable.
 * `seen` guards against cycles in slot graphs.
 */
function isAcceptableSizingValueDeep(
  value: string,
  slotValues: ReadonlyMap<string, readonly string[]>,
  seen: Set<string>,
): boolean {
  if (!isAcceptableSizingValue(value)) return false;
  for (const match of value.matchAll(/var\(\s*(--_[\w-]+)\s*[,)]/g)) {
    const name = match[1];
    if (name === undefined || seen.has(name)) continue;
    seen.add(name);
    for (const slotValue of slotValues.get(name) ?? []) {
      if (!isAcceptableSizingValueDeep(slotValue, slotValues, seen)) return false;
    }
  }
  return true;
}

function runRule(): ViolationDetail[] {
  const tokensFile = resolve(REPO_ROOT, "packages/css/src/tokens.css");
  const componentsDir = resolve(REPO_ROOT, "packages/css/src/components");
  const components: { name: string; rel: string; css: string }[] = [];
  for (const entry of readdirSync(componentsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const file = resolve(componentsDir, entry.name, `${entry.name}.css`);
    components.push({
      name: entry.name,
      rel: relative(REPO_ROOT, file),
      css: readFileSync(file, "utf8"),
    });
  }
  return findRhythmViolations(readFileSync(tokensFile, "utf8"), components);
}

export const rule: WorkspaceCheck = {
  kind: "workspace",
  triggers: ["packages/css/src/tokens.css", "packages/css/src/components/**/*.css"],
  run: runRule,
  hint: "Derive spatial tokens from --t-unit; route sizing values through --t-* or --_* tokens.",
};
