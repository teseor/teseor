// Asserts every `scripts/<path>` reference in `.claude/settings.json` points
// at a file that exists. After the scripts/ reorg in #644, a stop-hook still
// pointed at the old `scripts/check-comments.js` path; the broken hook fired
// for every Claude session until it was found by accident. This check moves
// that detection to commit time.
//
// Scope: `.claude/settings.json` only — `.claude/settings.local.json` is
// gitignored (per-clone), `.claude/handover.md` is gitignored, and
// `.claude/commands/*.md` doesn't currently reference repo paths. Add
// pathspecs above as those grow.
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { REPO_ROOT } from "../../lib/paths.ts";
import type { ViolationDetail, WorkspaceCheck } from "../registry.ts";

const SETTINGS_PATH = ".claude/settings.json";

/** Extract every `scripts/<path>` substring from a `.claude/settings.json`
 *  body. The settings file mixes hook command strings, `permissions.allow`
 *  patterns like `Bash(node scripts/foo.ts:*)`, and free-form description
 *  text — a substring scan is more robust than a structured walk.
 *
 *  Each match is the bare path (no leading prefix); trailing punctuation
 *  (`)`, `*`, `:`, `,`, `"`, whitespace) is stripped so `Bash(node scripts/foo.ts:*)`
 *  contributes `scripts/foo.ts`. */
export function extractScriptPaths(source: string): string[] {
  const out = new Set<string>();
  for (const match of source.matchAll(/scripts\/[\w./-]+/g)) {
    const raw = match[0] ?? "";
    // Strip trailing extension-less wildcards / quoting.
    const trimmed = raw.replace(/[.,)*:"]+$/, "");
    if (trimmed.length > "scripts/".length) out.add(trimmed);
  }
  return [...out];
}

function checkClaudeConfig(): ViolationDetail[] {
  const settingsAbs = resolve(REPO_ROOT, SETTINGS_PATH);
  if (!existsSync(settingsAbs)) return [];
  const source = readFileSync(settingsAbs, "utf8");
  const out: ViolationDetail[] = [];
  for (const ref of extractScriptPaths(source)) {
    const target = resolve(REPO_ROOT, ref);
    try {
      statSync(target);
    } catch {
      out.push({ file: SETTINGS_PATH, message: `\`${ref}\` does not exist on disk` });
    }
  }
  return out;
}

export const rule: WorkspaceCheck = {
  kind: "workspace",
  triggers: [".claude/settings.json"],
  run: checkClaudeConfig,
  hint:
    "After a scripts/ rename, update `.claude/settings.json` to match. Broken hook\n" +
    "paths fire silently per Claude session — every Stop / PreToolUse / etc. wastes\n" +
    "tokens reading the error stack before useful work begins.",
};
