// Enforces the dogfood rule: apps/docs/ is built only with the Teseor design
// system — t-* classes, no custom CSS. A missing piece is a DS gap to fill,
// not a one-off style.
//
// A file can opt out by carrying `dogfood-allow: <reason>` at the top — used
// for the layout shell while DS layout primitives (Sidebar, etc.) are still
// being authored. The marker logs the gap rather than hiding it.
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { REPO_ROOT } from "../../lib/paths.ts";
import type { ViolationDetail, WorkspaceCheck } from "../registry.ts";

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

function checkDocsApp(): ViolationDetail[] {
  const docsSrc = resolve(REPO_ROOT, "apps/docs/src");
  const out: ViolationDetail[] = [];
  for (const file of walk(docsSrc)) {
    const rel = relative(REPO_ROOT, file);
    if (file.endsWith(".css")) {
      out.push({ file: rel, message: "custom CSS file — the docs style with @teseor/css only" });
      continue;
    }
    const text = readFileSync(file, "utf8");
    if (readExemptReason(text) !== undefined) continue;
    if (/<style[\s>]/.test(text)) {
      out.push({ file: rel, message: "contains a <style> block — no custom CSS" });
    }
    if (/\bstyle\s*=\s*["{]/.test(text)) {
      out.push({ file: rel, message: "contains an inline style attribute — no custom CSS" });
    }
    for (const match of text.matchAll(/\bclass(?:Name)?\s*=\s*"([^"]*)"/g)) {
      const foreign = (match[1] ?? "")
        .split(/\s+/)
        .filter((token) => token && !token.startsWith("t-"));
      if (foreign.length > 0) {
        out.push({
          file: rel,
          message: `non-DS class(es) [${foreign.join(", ")}] — only t-* classes allowed`,
        });
      }
    }
  }
  return out;
}

export const rule: WorkspaceCheck = {
  kind: "workspace",
  triggers: ["apps/docs/**"],
  run: checkDocsApp,
  hint: "A missing piece is a DS gap to fill, not a one-off style. Add `dogfood-allow: <reason>` at the top of the file to log the gap.",
};
