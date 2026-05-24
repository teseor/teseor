// Diff-resolution helpers used by every check that needs to know what
// changed relative to the PR base. Centralized because the same `BASE_REF
// / GITHUB_BASE_REF / origin/main` precedence and three-dot diff semantics
// used to be copy-pasted across check scripts — and at least one copy
// silently fell back to "no diff" when the base wasn't found.
import { execSync } from "node:child_process";

const DEFAULT_BASE = "main";

/** Resolve a base ref against the local repo. Tries the bare name first
 *  (local pre-push: `main` is a real branch), then `origin/<base>` (CI:
 *  shallow checkouts only populate `refs/remotes/origin/*`). Fails loud —
 *  silently skipping the entire check defeats the guardrail in any CI that
 *  didn't `fetch-depth: 0`. */
export function resolveBase(baseInput: string, cwd: string): string {
  for (const candidate of [baseInput, `origin/${baseInput}`]) {
    try {
      execSync(`git rev-parse --verify ${candidate}^{commit}`, {
        cwd,
        stdio: "ignore",
      });
      return candidate;
    } catch {
      // Try next candidate.
    }
  }
  throw new Error(
    `base ref '${baseInput}' not found locally or as 'origin/${baseInput}'. ` +
      `CI must check out with 'fetch-depth: 0' and run 'git fetch origin ${baseInput}' before lint. ` +
      `Locally, ensure '${baseInput}' exists as a branch or as a remote-tracking ref.`,
  );
}

/** The diff scope between the PR base and HEAD. GitHub provides
 *  `GITHUB_BASE_REF` in PR contexts; locally the override is `BASE_REF`;
 *  otherwise `main`. Three-dot syntax is the PR-equivalent diff (excludes
 *  commits added to base after the branch point), matching what reviewers
 *  see on GitHub. */
export function getChangedFiles(cwd: string): string[] {
  const baseInput = process.env.BASE_REF ?? process.env.GITHUB_BASE_REF ?? DEFAULT_BASE;
  const base = resolveBase(baseInput, cwd);
  const output = execSync(`git diff --name-only ${base}...HEAD`, {
    cwd,
    encoding: "utf8",
  });
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}
