// Diff-resolution helpers against the PR base.
import { execSync } from "node:child_process";

const DEFAULT_BASE = "main";

/** Resolve `baseInput` — tries the bare name, then `origin/<base>`. Throws
 *  loud when neither resolves; silent skip would defeat the guardrail. */
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

/** Files changed against the PR base (three-dot diff, GitHub-equivalent).
 *  Base precedence: `BASE_REF` env > `GITHUB_BASE_REF` env > `main`. */
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
