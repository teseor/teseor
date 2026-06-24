// Enforces that `codegen/src/*.ts` (top-level files only) contains only the
// documented entry points. New top-level files are usually orphans that
// should live under a subfolder (`core/`, `lib/`, `plugins/`, `generators/`).
//
// When a real new entry point shows up, add it to ALLOWED below in the same
// commit that adds the file.
import { lsFiles } from "../helpers/enumerate.ts";
import { REPO_ROOT } from "../helpers/paths.ts";
import type { ViolationDetail, WorkspaceCheck } from "../registry.ts";

const TRIGGERS = ["codegen/src/*.ts"] as const;

const ALLOWED = new Set([
  "codegen/src/cli.ts",
  "codegen/src/generator-registry.ts",
  "codegen/src/semantic-checks.ts",
  "codegen/src/validate-spec.ts",
]);

function checkTopLevelOrphans(): ViolationDetail[] {
  const out: ViolationDetail[] = [];
  for (const rel of lsFiles(TRIGGERS, REPO_ROOT)) {
    if (ALLOWED.has(rel)) continue;
    out.push({
      file: rel,
      message: `top-level codegen file is not a documented entry point — nest under core/, lib/, plugins/, or generators/, or add the path to ALLOWED in scripts/lint/cross-file/codegen-top-level-orphans.ts.`,
    });
  }
  return out;
}

export const rule: WorkspaceCheck = {
  kind: "workspace",
  triggers: TRIGGERS,
  run: checkTopLevelOrphans,
  hint:
    "codegen/src/ has four documented entry points (cli.ts, generator-registry.ts, semantic-checks.ts, validate-spec.ts).\n" +
    "Everything else belongs under a subfolder by role: core/ for orchestration, lib/ for pure helpers, plugins/ for substrate plugins, generators/ for per-target string assembly.",
};
