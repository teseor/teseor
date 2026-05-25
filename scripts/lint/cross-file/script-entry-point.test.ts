import { describe, expect, it } from "vitest";
import { extractInvocations, isImportOnly } from "./script-entry-point.ts";

describe("extractInvocations", () => {
  it("extracts a plain `node scripts/<path>` invocation", () => {
    expect(extractInvocations("run: node scripts/repo/audit-overrides.ts")).toEqual([
      "scripts/repo/audit-overrides.ts",
    ]);
  });

  it("strips trailing punctuation from quoted commands", () => {
    expect(extractInvocations('"node scripts/lint/run.ts --all"')).toEqual(["scripts/lint/run.ts"]);
  });

  it("ignores `scripts/` substrings not preceded by `node`", () => {
    expect(extractInvocations('"Bash(node scripts/foo.ts:*)" "see scripts/bar.ts"')).toEqual([
      "scripts/foo.ts",
    ]);
  });

  it("returns multiple distinct invocations from one source", () => {
    const source = `
      run: node scripts/hooks/commit-msg.js {1}
      run: node scripts/lint/run.ts --all
    `;
    expect(extractInvocations(source).sort()).toEqual([
      "scripts/hooks/commit-msg.js",
      "scripts/lint/run.ts",
    ]);
  });

  it("deduplicates repeated invocations", () => {
    const source = "node scripts/a.ts; node scripts/a.ts";
    expect(extractInvocations(source)).toEqual(["scripts/a.ts"]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(extractInvocations('"permissions": { "allow": ["Bash(git status:*)"] }')).toEqual([]);
  });
});

describe("isImportOnly", () => {
  it("flags a file that only exports a `rule` object", () => {
    const source = [
      'import { readFileSync } from "node:fs";',
      'import type { WorkspaceCheck } from "../registry.ts";',
      "function check() { return []; }",
      'export const rule: WorkspaceCheck = { kind: "workspace", triggers: [], run: check };',
    ].join("\n");
    expect(isImportOnly(source)).toBe(true);
  });

  it("accepts a top-level `main();` call", () => {
    const source = [
      'import { foo } from "./foo.ts";',
      "function main() { foo(); }",
      "main();",
    ].join("\n");
    expect(isImportOnly(source)).toBe(false);
  });

  it("accepts a top-level `main().catch(...)` chain", () => {
    const source = [
      "async function main() {}",
      "main().catch((err) => { process.exit(1); });",
    ].join("\n");
    expect(isImportOnly(source)).toBe(false);
  });

  it("accepts an entry-point guard via `process.argv`", () => {
    const source = [
      'import { fileURLToPath } from "node:url";',
      "function main() {}",
      "if (process.argv[1] === fileURLToPath(import.meta.url)) {",
      "  main();",
      "}",
    ].join("\n");
    expect(isImportOnly(source)).toBe(false);
  });

  it("accepts direct `process.argv` parsing at top level", () => {
    const source = [
      'const mode = process.argv.find((a) => a.startsWith("--mode="));',
      "function run() {}",
    ].join("\n");
    expect(isImportOnly(source)).toBe(false);
  });

  it("accepts top-level `await`", () => {
    const source = ['import { read } from "./read.ts";', "await read();"].join("\n");
    expect(isImportOnly(source)).toBe(false);
  });

  it("ignores a `main()` reference inside a comment", () => {
    const source = [
      "// call main() to start",
      "function main() {}",
      "export const rule = { run: main };",
    ].join("\n");
    expect(isImportOnly(source)).toBe(true);
  });

  it("ignores a `main()` reference inside a block comment", () => {
    const source = [
      "/*",
      " * main();",
      " */",
      "function main() {}",
      "export const rule = { run: main };",
    ].join("\n");
    expect(isImportOnly(source)).toBe(true);
  });

  it("flags an import-only file even when comments mention `process.argv`", () => {
    const source = [
      "/**",
      " * Lint rule. Files matching this shape have no `process.argv` reference",
      " * and no `import.meta` — they would silently no-op as a CLI.",
      " */",
      "// inline comment also mentions process.argv and import.meta.url",
      'import type { WorkspaceCheck } from "../registry.ts";',
      "function check() { return []; }",
      'export const rule: WorkspaceCheck = { kind: "workspace", triggers: [], run: check };',
    ].join("\n");
    expect(isImportOnly(source)).toBe(true);
  });

  it("flags an import-only file even when trailing inline comments mention `process.argv`", () => {
    const source = [
      'import type { WorkspaceCheck } from "../registry.ts"; // see process.argv usage elsewhere',
      "function check() { return []; } // also: import.meta",
      'export const rule: WorkspaceCheck = { kind: "workspace", triggers: [], run: check };',
    ].join("\n");
    expect(isImportOnly(source)).toBe(true);
  });

  it("does not treat `if (...)` as a top-level call", () => {
    const source = ["function main() {}", "if (false) { main(); }"].join("\n");
    // Heuristic: `if` is a keyword, not a call. The `main()` inside the
    // block is indented — not at column 0. Conservatively flagged as
    // import-only, but in practice every CLI we have pairs `if (process.argv...)`
    // with the `process.argv` literal that already triggers the early return.
    expect(isImportOnly(source)).toBe(true);
  });
});
