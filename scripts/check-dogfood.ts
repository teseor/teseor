#!/usr/bin/env node
// Enforces the dogfood rule: apps/docs/ is built only with the Teseor design
// system — t-* classes, no custom CSS. A missing piece is a DS gap to fill,
// not a one-off style.
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "..");
const docsSrc = resolve(repoRoot, "apps/docs/src");

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full));
    } else {
      out.push(full);
    }
  }
  return out;
}

const violations: string[] = [];

for (const file of walk(docsSrc)) {
  const rel = relative(repoRoot, file);
  if (file.endsWith(".css")) {
    violations.push(`${rel}: custom CSS file — the docs style with @teseor/css only`);
    continue;
  }
  const text = readFileSync(file, "utf8");
  if (/<style[\s>]/.test(text)) {
    violations.push(`${rel}: contains a <style> block — no custom CSS`);
  }
  if (/\bstyle\s*=\s*["{]/.test(text)) {
    violations.push(`${rel}: contains an inline style attribute — no custom CSS`);
  }
  for (const match of text.matchAll(/\bclass(?:Name)?\s*=\s*"([^"]*)"/g)) {
    const foreign = (match[1] ?? "")
      .split(/\s+/)
      .filter((token) => token && !token.startsWith("t-"));
    if (foreign.length > 0) {
      violations.push(
        `${rel}: non-DS class(es) [${foreign.join(", ")}] — only t-* classes allowed`,
      );
    }
  }
}

if (violations.length > 0) {
  console.error(
    `Dogfood rule violations in apps/docs/ — the docs build with the design system only:\n${violations
      .map((v) => `  - ${v}`)
      .join("\n")}\nA missing piece is a DS gap to fill, not a one-off style.`,
  );
  process.exit(1);
}

console.log("check-dogfood: apps/docs/ uses the design system only");
