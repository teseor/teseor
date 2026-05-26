// Enforces the unit-derived spatial system (RFC-0003 / #803):
//   1. Every derived spatial token in tokens.css traces to `var(--t-unit)`.
//   2. Every sizing-property value in component CSS reads a token
//      (`var(--t-*)` or `var(--_*)`) or stays on a relative unit
//      (em / lh / %). Raw px / rem literals in sizing positions are rejected.
//
// Out of scope (Phase 2 / #804): text-size and leading. The rule deliberately
// does not constrain `font-size` / `line-height`.
import { readdirSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import postcss from "postcss";
import postcssEach from "postcss-each";
import { REPO_ROOT } from "../../lib/paths.ts";
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

/**
 * Sizing-property values must either reference a token (--t-* or --_*) or
 * use no absolute length. Returns true when the value is acceptable.
 *
 * Algorithm: if it contains var(--t-*) or var(--_*) anywhere, accept.
 * Otherwise, no Npx / Nrem literals may appear. Relative units (em, lh, %,
 * vh, vw, svh, lvh, dvh, cqi, cqb, fr, ch, ex) and keywords stay legal.
 */
export function isAcceptableSizingValue(value: string): boolean {
  if (/var\(\s*--t-[\w-]+/.test(value)) return true;
  if (/var\(\s*--_[\w-]+/.test(value)) return true;
  // No tokens — flag if any non-zero px / rem literal appears.
  // The regex looks for a number (int/decimal) followed by px or rem, with
  // a non-word boundary before it (so `1.25emm` won't trip).
  return !/(?:^|[\s,(/*+-])-?\d*\.?\d+(?:px|rem)\b/.test(value);
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
    if (/var\(\s*--t-unit\b/.test(decl.value)) return;
    out.push({
      file: "packages/css/src/tokens.css",
      line: decl.source?.start?.line,
      message: `\`${decl.prop}: ${decl.value}\` — derived spatial tokens must trace to \`var(--t-unit)\``,
    });
  });

  // (2) component CSS: sizing-property values use tokens or relative units.
  for (const { rel, css } of components) {
    const root = postcss([postcssEach()]).process(css, { from: undefined }).root;
    root.walkDecls((decl) => {
      if (!SIZING_PROPS.has(decl.prop)) return;
      if (isAcceptableSizingValue(decl.value)) return;
      out.push({
        file: rel,
        line: decl.source?.start?.line,
        message: `\`${decl.prop}: ${decl.value}\` — sizing values must read \`var(--t-*)\` / \`var(--_*)\` or stay on relative units (em, lh, %)`,
      });
    });
  }

  return out;
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
