// Mirrors the CI `changeset` gate (.github/workflows/ci.yml).
// Blocks `git push` when packages/ has changed against origin/main without
// an added .changeset/*.md.
import { execSync } from "node:child_process";
import type { DiffAwareCheck, ViolationDetail } from "../registry.ts";

function checkChangeset(changed: readonly string[]): ViolationDetail[] {
  try {
    execSync("git fetch --quiet origin main", { stdio: "ignore" });
  } catch {
    // Offline / no remote — skip rather than block.
    return [];
  }
  if (!changed.some((f) => f.startsWith("packages/"))) return [];
  if (changed.some((f) => /^\.changeset\/.+\.md$/.test(f))) return [];
  return [{ message: "packages/ changed but no .changeset/*.md added" }];
}

export const rule: DiffAwareCheck = {
  kind: "diff-aware",
  triggers: ["packages/**"],
  run: checkChangeset,
  hint: "Add a changeset with: pnpm changeset",
};
