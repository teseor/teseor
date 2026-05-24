import { describe, expect, it } from "vitest";
import { extractScriptPaths } from "./config-paths.ts";

describe("extractScriptPaths", () => {
  it("extracts a plain `scripts/<path>` substring", () => {
    expect(extractScriptPaths('  "command": "node scripts/hooks/commit-msg.js"')).toEqual([
      "scripts/hooks/commit-msg.js",
    ]);
  });

  it("strips trailing `:*` from Bash() permission patterns", () => {
    expect(extractScriptPaths('"Bash(node scripts/lint/run.ts:*)"')).toEqual([
      "scripts/lint/run.ts",
    ]);
  });

  it("strips trailing `)` and `*`", () => {
    expect(extractScriptPaths('"Bash(node scripts/foo.ts*)"')).toEqual(["scripts/foo.ts"]);
  });

  it("returns multiple distinct refs from one source", () => {
    const source = `
      "command": "node scripts/lint/file-rules/comments.js",
      "Bash(node scripts/lint/run.ts:*)"
    `;
    expect(extractScriptPaths(source).sort()).toEqual([
      "scripts/lint/file-rules/comments.js",
      "scripts/lint/run.ts",
    ]);
  });

  it("deduplicates repeated refs", () => {
    const source = "scripts/a.ts scripts/a.ts scripts/b.ts";
    expect(extractScriptPaths(source).sort()).toEqual(["scripts/a.ts", "scripts/b.ts"]);
  });

  it("ignores the bare `scripts/` prefix without a path", () => {
    // "scripts/" with no trailing segment shouldn't surface as a violation candidate.
    expect(extractScriptPaths("see scripts/ for layout")).toEqual([]);
  });

  it("captures nested paths", () => {
    expect(extractScriptPaths("node scripts/lint/cross-file/dogfood.ts")).toEqual([
      "scripts/lint/cross-file/dogfood.ts",
    ]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(extractScriptPaths('"permissions": { "allow": ["Bash(git status:*)"] }')).toEqual([]);
  });
});
