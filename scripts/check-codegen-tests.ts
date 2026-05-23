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
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// `dirname` first so the `..` is taken from the script's directory (`scripts/`),
// not the file path. Equivalent to the old `resolve(file, "..", "..")` but
// reads as "scripts/'s parent" — unambiguous if the script ever moves.
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

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

/** Resolve the base ref against the local repo. Tries the bare name first
 *  (local pre-push: `main` is a real branch) then `origin/<base>` (CI:
 *  shallow checkouts only populate `refs/remotes/origin/*`). Failing loud
 *  is mandatory — a missing base ref used to silently skip the entire
 *  check, defeating the guardrail in any CI that didn't `fetch-depth: 0`. */
function resolveBase(baseInput: string): string {
  for (const candidate of [baseInput, `origin/${baseInput}`]) {
    try {
      execSync(`git rev-parse --verify ${candidate}^{commit}`, {
        cwd: REPO_ROOT,
        stdio: "ignore",
      });
      return candidate;
    } catch {
      // Try next candidate.
    }
  }
  process.stderr.write(
    `check-codegen-tests: base ref '${baseInput}' not found locally or as 'origin/${baseInput}'.\n` +
      `CI must check out with 'fetch-depth: 0' and run 'git fetch origin ${baseInput}' before lint.\n` +
      `Locally, ensure '${baseInput}' exists as a branch or as a remote-tracking ref.\n`,
  );
  process.exit(1);
}

/** The diff scope we check against. In CI, GitHub provides the PR base via
 *  `GITHUB_BASE_REF`; locally we fall back to `main`. Three-dot syntax is
 *  the PR-equivalent diff (excludes commits added to base after the branch
 *  point), matching what reviewers see on GitHub. */
function getChangedFiles(): string[] {
  const baseInput = process.env.BASE_REF ?? process.env.GITHUB_BASE_REF ?? "main";
  const base = resolveBase(baseInput);
  const output = execSync(`git diff --name-only ${base}...HEAD`, {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function main(): void {
  const changed = getChangedFiles();
  if (changed.length === 0) {
    process.stdout.write("check-codegen-tests: no files changed against base — ok\n");
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
