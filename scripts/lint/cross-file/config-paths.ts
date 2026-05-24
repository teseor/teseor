// Asserts every `scripts/<path>` reference in a tracked config file points
// at a file that exists. After the scripts/ reorg in #644:
//
//   - `.claude/settings.json` still pointed at the old
//     `scripts/check-comments.js`; the broken stop-hook fired every Claude
//     session until it was found by accident.
//   - `.github/workflows/sync-labels.yml` ran `node scripts/lint/cross-file/label-sync.ts`
//     directly, but the registry-runner reorg made that file export-only —
//     the workflow step silently succeeded without running the check.
//
// Both classes of bug are stale references in config files that the source-
// tree lints can't see. This check moves that detection to commit time.
//
// Scope: `.claude/settings.json` and `.github/workflows/*.yml`. Both expose
// `scripts/<path>` strings (hook commands, workflow `run:` lines, permission
// patterns). The check is a substring scan — robust against the surface-
// specific quoting / wrapping variations.
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { lsFiles } from "../../lib/enumerate.ts";
import { REPO_ROOT } from "../../lib/paths.ts";
import type { ViolationDetail, WorkspaceCheck } from "../registry.ts";

const CONFIG_FILES = [".claude/settings.json"] as const;
const WORKFLOW_PATHSPEC = ".github/workflows/*.yml";

const TRIGGERS = [...CONFIG_FILES, WORKFLOW_PATHSPEC] as const;

/** Extract every `scripts/<path>` substring from a config-file body. The
 *  surfaces we scan mix hook command strings, `permissions.allow` patterns
 *  like `Bash(node scripts/foo.ts:*)`, workflow `run:` lines, and free-form
 *  description text — a substring scan is more robust than a structured
 *  walk.
 *
 *  Each match is the bare path (no leading prefix); trailing punctuation
 *  (`)`, `*`, `:`, `,`, `"`) is stripped so `Bash(node scripts/foo.ts:*)`
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

function listConfigFiles(): string[] {
  const out: string[] = [];
  for (const rel of CONFIG_FILES) {
    if (existsSync(resolve(REPO_ROOT, rel))) out.push(rel);
  }
  out.push(...lsFiles([WORKFLOW_PATHSPEC], REPO_ROOT));
  return out;
}

function checkConfigPaths(): ViolationDetail[] {
  const out: ViolationDetail[] = [];
  for (const rel of listConfigFiles()) {
    let source: string;
    try {
      source = readFileSync(resolve(REPO_ROOT, rel), "utf8");
    } catch {
      continue;
    }
    for (const ref of extractScriptPaths(source)) {
      const target = resolve(REPO_ROOT, ref);
      try {
        statSync(target);
      } catch {
        out.push({ file: rel, message: `\`${ref}\` does not exist on disk` });
      }
    }
  }
  return out;
}

export const rule: WorkspaceCheck = {
  kind: "workspace",
  triggers: TRIGGERS,
  run: checkConfigPaths,
  hint:
    "After a scripts/ rename, sweep every config that references scripts/ paths:\n" +
    "  - `.claude/settings.json` (hooks, permissions)\n" +
    "  - `.github/workflows/*.yml` (run lines, path triggers)\n" +
    "Broken hook paths fire silently per Claude session; broken workflow steps\n" +
    "succeed silently in CI. Both classes of bug now surface at commit time.",
};
