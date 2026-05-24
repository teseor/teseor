// Every `scripts/<path>` reference in `.claude/settings.json` and
// `.github/workflows/*.yml` must point at a file that exists. Substring
// scan — the surfaces mix hook commands, workflow `run:` lines, and
// permission patterns.
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { lsFiles } from "../../lib/enumerate.ts";
import { REPO_ROOT } from "../../lib/paths.ts";
import type { ViolationDetail, WorkspaceCheck } from "../registry.ts";

const CONFIG_FILES = [".claude/settings.json"] as const;
const WORKFLOW_PATHSPEC = ".github/workflows/*.yml";

const TRIGGERS = [...CONFIG_FILES, WORKFLOW_PATHSPEC] as const;

/** `scripts/<path>` substrings, with trailing wildcard/quoting punctuation
 *  stripped so `Bash(node scripts/foo.ts:*)` contributes `scripts/foo.ts`. */
export function extractScriptPaths(source: string): string[] {
  const out = new Set<string>();
  for (const match of source.matchAll(/scripts\/[\w./-]+/g)) {
    const raw = match[0] ?? "";
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
  hint: "Update `.claude/settings.json` and `.github/workflows/*.yml` after every scripts/ rename.",
};
