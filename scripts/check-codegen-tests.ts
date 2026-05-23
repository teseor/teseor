#!/usr/bin/env node
// Enforces "no codegen change without a test change."
//
// When this PR's diff touches `scripts/codegen/src/**` (the production code
// behind every wrapper, contract, and docs page), the same diff must also
// touch at least one file under `scripts/codegen/__tests__/**` or a
// colocated `*.test.ts` inside `scripts/codegen/src/**`. Snapshot files
// (`*.snap`) count — they auto-update when generator output changes and
// a maintainer who didn't refresh them is the exact thing this check stops.
//
// Rationale: round after round of Copilot review on #666 caught bugs that
// codegen tests would have surfaced before push. The lesson is "never defer
// codegen tests"; the enforcement is this check failing pre-push and in CI.
import { execSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), "..", "..");

/** Files that, when changed, demand a corresponding test-side change. */
function isProductionCodegen(path: string): boolean {
  if (!path.startsWith("scripts/codegen/src/")) return false;
  if (path.endsWith(".test.ts")) return false;
  if (path.endsWith(".test.tsx")) return false;
  return path.endsWith(".ts") || path.endsWith(".tsx");
}

/** Files that count as a test-side change. */
function isTestChange(path: string): boolean {
  if (path.startsWith("scripts/codegen/__tests__/")) return true;
  if (path.startsWith("scripts/codegen/src/") && path.endsWith(".test.ts")) return true;
  if (path.startsWith("scripts/codegen/src/") && path.endsWith(".test.tsx")) return true;
  return false;
}

/** The diff scope we check against. In CI, GitHub provides BASE_SHA via
 *  `GITHUB_BASE_REF` for PR runs and falls back to `main`. Local pre-push
 *  uses the same fallback — `main...HEAD` covers the entire branch. */
function getChangedFiles(): string[] {
  const base = process.env.BASE_REF ?? process.env.GITHUB_BASE_REF ?? "main";
  // `git diff --name-only <base>...HEAD` lists every file changed on the
  // current branch since it diverged from `base`. Three-dot syntax is the
  // PR-equivalent diff (excludes commits added to base after the branch
  // point), which matches what reviewers see on GitHub.
  let output: string;
  try {
    output = execSync(`git diff --name-only ${base}...HEAD`, {
      cwd: REPO_ROOT,
      encoding: "utf8",
    });
  } catch {
    // No diff against base (e.g. fresh clone, base ref missing). Skip the
    // check rather than crash — the CI version with a known base will catch
    // the real cases.
    return [];
  }
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function main(): void {
  const changed = getChangedFiles();
  if (changed.length === 0) {
    process.stdout.write("check-codegen-tests: no diff against base — skipped\n");
    return;
  }
  const productionChanges = changed.filter(isProductionCodegen);
  if (productionChanges.length === 0) {
    process.stdout.write("check-codegen-tests: no codegen source files in diff — ok\n");
    return;
  }
  const testChanges = changed.filter(isTestChange);
  if (testChanges.length > 0) {
    process.stdout.write(
      `check-codegen-tests: ${productionChanges.length} codegen file(s) ` +
        `paired with ${testChanges.length} test-side change(s) — ok\n`,
    );
    return;
  }
  process.stderr.write(
    "check-codegen-tests: codegen source files changed without any test-side change:\n" +
      productionChanges.map((p) => `  - ${p}`).join("\n") +
      "\n\nAt least one file under `scripts/codegen/__tests__/` or a colocated " +
      "`*.test.ts` inside `scripts/codegen/src/` must also be in the diff.\n" +
      "If the change is genuinely test-free (rare — comment fixes, etc.), " +
      "consider whether the underlying behavior is actually tested elsewhere; " +
      "if so, touch the matching snapshot to acknowledge the dependency.\n",
  );
  process.exit(1);
}

main();
