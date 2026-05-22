#!/usr/bin/env node
// Enforces the reduced-motion mechanism: every `transition` and `animation`
// duration in component CSS multiplies by `var(--t-motion-scale)`, so the
// `prefers-reduced-motion` kill switch (scale -> 0) reaches every animation.
import { readdirSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import postcss from "postcss";

const MOTION_PROPS = new Set([
  "transition",
  "animation",
  "transition-duration",
  "animation-duration",
]);
const SCALE = "var(--t-motion-scale)";
const SKIP = new Set(["none", "inherit", "initial", "unset", "revert", "revert-layer", ""]);

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

/**
 * Motion declarations whose duration is not gated by `var(--t-motion-scale)`.
 * A `transition` / `animation` value that is a lone `--_*` token is followed
 * into that token's declarations, since a `[data-*]` modifier reassigns the
 * var rather than declaring the property.
 */
export function findUnscaledMotion(css: string): string[] {
  const violations: string[] = [];
  const root = postcss.parse(css);

  const customs = new Map<string, string[]>();
  root.walkDecls(/^--_/, (decl) => {
    const list = customs.get(decl.prop) ?? [];
    list.push(decl.value);
    customs.set(decl.prop, list);
  });

  function check(prop: string, value: string, seen: Set<string>): void {
    for (const segment of splitTopLevel(value, ",")) {
      const trimmed = segment.trim();
      if (SKIP.has(trimmed)) {
        continue;
      }
      const loneVar = trimmed.match(/^var\(\s*(--_[\w-]+)\s*\)$/);
      if (loneVar?.[1] !== undefined) {
        const name = loneVar[1];
        if (seen.has(name)) {
          continue;
        }
        seen.add(name);
        for (const target of customs.get(name) ?? []) {
          check(prop, target, seen);
        }
        continue;
      }
      if (!trimmed.includes(SCALE)) {
        violations.push(`\`${prop}: … ${trimmed} …\` — duration is not multiplied by ${SCALE}`);
      }
    }
  }

  root.walkDecls((decl) => {
    if (MOTION_PROPS.has(decl.prop)) {
      check(decl.prop, decl.value, new Set());
    }
  });

  return violations;
}

function main(): void {
  const repoRoot = resolve(import.meta.dirname, "..");
  const componentsDir = resolve(repoRoot, "packages/css/src/components");
  const violations: string[] = [];
  let count = 0;

  for (const entry of readdirSync(componentsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }
    const file = resolve(componentsDir, entry.name, `${entry.name}.css`);
    const rel = relative(repoRoot, file);
    for (const violation of findUnscaledMotion(readFileSync(file, "utf8"))) {
      violations.push(`${rel}: ${violation}`);
    }
    count += 1;
  }

  if (violations.length > 0) {
    console.error(`Unscaled motion (the reduced-motion kill switch will not reach it):
${violations.map((v) => `  - ${v}`).join("\n")}`);
    process.exit(1);
  }
  console.log(`check-motion-scale: ${count} components gate motion on --t-motion-scale`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
