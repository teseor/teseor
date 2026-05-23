#!/usr/bin/env node
// Enforces the dogfood rule: apps/docs/ is built only with the Teseor design
// system — t-* classes, no custom CSS. A missing piece is a DS gap to fill,
// not a one-off style.
//
// A file can opt out by carrying `dogfood-allow: <reason>` at the top — used
// for the layout shell while DS layout primitives (Sidebar, etc.) are still
// being authored. The marker logs the gap rather than hiding it.
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

// Anchored to the first ~10 lines (frontmatter area) so a `dogfood-allow:`
// buried mid-file can't silently exempt a violation. The reason captures up
// to the first newline / `*` / `-` so the message stays single-line.
function readExemptReason(text: string): string | undefined {
  const head = text.split("\n", 10).join("\n");
  const match = head.match(/dogfood-allow:\s*([^\n*-]+)/);
  return match?.[1]?.trim();
}

const violations: string[] = [];
const exempted: { rel: string; reason: string }[] = [];

for (const file of walk(docsSrc)) {
  const rel = relative(repoRoot, file);
  if (file.endsWith(".css")) {
    violations.push(`${rel}: custom CSS file — the docs style with @teseor/css only`);
    continue;
  }
  const text = readFileSync(file, "utf8");
  const exemptReason = readExemptReason(text);
  if (exemptReason !== undefined) {
    exempted.push({ rel, reason: exemptReason });
    continue;
  }
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

if (exempted.length > 0) {
  console.log("check-dogfood: apps/docs/ uses the design system only");
  console.log(
    `  exempted (gaps to fill — see \`dogfood-allow:\` markers):\n${exempted
      .map((e) => `    - ${e.rel}${e.reason ? ` — ${e.reason}` : ""}`)
      .join("\n")}`,
  );
} else {
  console.log("check-dogfood: apps/docs/ uses the design system only");
}
