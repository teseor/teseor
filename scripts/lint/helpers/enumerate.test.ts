import { execSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { lsFiles } from "./enumerate.ts";

// Under lefthook pre-push, vitest inherits GIT_DIR / GIT_WORK_TREE / GIT_INDEX_FILE
// from the hook context. git honors those env vars over per-call `cwd`, so the
// temp-repo setup below would otherwise leak into the parent worktree's .git.
delete process.env.GIT_DIR;
delete process.env.GIT_WORK_TREE;
delete process.env.GIT_INDEX_FILE;

function makeRepo(layout: Record<string, string>): string {
  const dir = mkdtempSync(resolve(tmpdir(), "teseor-lib-enum-"));
  execSync("git init -q -b main", { cwd: dir });
  execSync("git config user.email test@example.com", { cwd: dir });
  execSync("git config user.name test", { cwd: dir });
  for (const [path, content] of Object.entries(layout)) {
    const full = resolve(dir, path);
    mkdirSync(resolve(full, ".."), { recursive: true });
    writeFileSync(full, content);
  }
  execSync("git add -A && git commit -q -m base", { cwd: dir });
  return dir;
}

describe("lsFiles", () => {
  it("matches files at any depth via `**` (the `:(glob)` magic)", () => {
    const repo = makeRepo({
      "a/x.tsx": "",
      "a/b/y.tsx": "",
      "a/b/c/z.tsx": "",
    });
    const files = lsFiles(["a/**/*.tsx"], repo);
    expect(files.sort()).toEqual(["a/b/c/z.tsx", "a/b/y.tsx", "a/x.tsx"]);
  });

  it("returns an empty list when nothing matches", () => {
    const repo = makeRepo({ "a/x.ts": "" });
    expect(lsFiles(["packages/**/*.tsx"], repo)).toEqual([]);
  });

  it("accepts multiple pathspecs and unions the result", () => {
    const repo = makeRepo({
      "src/a.ts": "",
      "src/b.tsx": "",
      "tests/c.ts": "",
    });
    const files = lsFiles(["src/**/*.ts", "src/**/*.tsx"], repo);
    expect(files.sort()).toEqual(["src/a.ts", "src/b.tsx"]);
  });

  it("passes through pathspecs that already carry magic syntax", () => {
    const repo = makeRepo({ "a.ts": "" });
    // `:(exclude)` is a different magic; passing through unchanged is the test.
    expect(() => lsFiles([":(exclude)does-not-exist"], repo)).not.toThrow();
  });
});
