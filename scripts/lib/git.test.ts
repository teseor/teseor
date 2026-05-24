import { execSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { getChangedFiles, resolveBase } from "./git.ts";

function makeRepo(): string {
  const dir = mkdtempSync(resolve(tmpdir(), "teseor-lib-git-"));
  execSync("git init -q -b main", { cwd: dir });
  execSync("git config user.email test@example.com", { cwd: dir });
  execSync("git config user.name test", { cwd: dir });
  writeFileSync(resolve(dir, "a.txt"), "a\n");
  execSync("git add a.txt && git commit -q -m base", { cwd: dir });
  return dir;
}

const previousBase = process.env.BASE_REF;
afterEach(() => {
  if (previousBase === undefined) delete process.env.BASE_REF;
  else process.env.BASE_REF = previousBase;
});

describe("resolveBase", () => {
  it("returns the bare name when it resolves locally", () => {
    const repo = makeRepo();
    expect(resolveBase("main", repo)).toBe("main");
  });

  it("throws a descriptive error when the ref does not exist", () => {
    const repo = makeRepo();
    expect(() => resolveBase("nope-branch-xyz", repo)).toThrow(/not found/);
  });
});

describe("getChangedFiles", () => {
  it("returns files changed against the resolved base", () => {
    const repo = makeRepo();
    execSync("git checkout -q -b feature", { cwd: repo });
    writeFileSync(resolve(repo, "b.txt"), "b\n");
    execSync("git add b.txt && git commit -q -m feat", { cwd: repo });
    process.env.BASE_REF = "main";
    expect(getChangedFiles(repo)).toEqual(["b.txt"]);
  });

  it("returns an empty list when the branch matches base", () => {
    const repo = makeRepo();
    process.env.BASE_REF = "main";
    expect(getChangedFiles(repo)).toEqual([]);
  });
});
