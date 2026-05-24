import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { findDanglingPaths } from "./doc-paths.ts";

const REPO_ROOT = resolve(import.meta.dirname, "..", "..", "..");
const FAKE_DOC = resolve(REPO_ROOT, "docs", "architecture", "codegen-pipeline.md");

describe("findDanglingPaths", () => {
  it("flags a path-shaped backtick reference that does not resolve", () => {
    const issues = findDanglingPaths("See `packages/nonexistent/foo.ts` for details.", FAKE_DOC);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.reference).toBe("packages/nonexistent/foo.ts");
  });

  it("accepts a path-shaped reference that resolves from repo root", () => {
    expect(findDanglingPaths("Open `scripts/lint/cross-file/doc-paths.ts`.", FAKE_DOC)).toEqual([]);
  });

  it("accepts a reference resolved relative to the doc's parent directory", () => {
    // FAKE_DOC sits in an architecture/ directory; `./themes.md` resolves
    // via the parent-directory probe to the sibling themes file.
    expect(findDanglingPaths("See `./themes.md`.", FAKE_DOC)).toEqual([]);
  });

  it("accepts a reference resolved relative to docs/", () => {
    expect(findDanglingPaths("See `architecture/themes.md`.", FAKE_DOC)).toEqual([]);
  });

  it("skips basename-only references (too ambiguous to resolve)", () => {
    // `tokens.css` exists at packages/css/src/tokens.css and dist/tokens.css;
    // a basename alone is intentionally not flagged.
    expect(findDanglingPaths("Edit `tokens.css` to add the token.", FAKE_DOC)).toEqual([]);
  });

  it("ignores non-path backtick spans (CSS tokens, class names, commands)", () => {
    const source = "Read `--t-button-bg` and `pnpm lint:spec` and `.t-button__icon`.";
    expect(findDanglingPaths(source, FAKE_DOC)).toEqual([]);
  });

  it("ignores npm package specifiers", () => {
    expect(findDanglingPaths("Use `@vitejs/plugin-react` here.", FAKE_DOC)).toEqual([]);
  });

  it("ignores absolute / URL-route paths", () => {
    expect(findDanglingPaths("Visit `/react/button` to load.", FAKE_DOC)).toEqual([]);
  });

  it("strips trailing line-number / anchor suffixes", () => {
    expect(
      findDanglingPaths("See `specs/button.yaml#L42` and `specs/button.yaml:5`.", FAKE_DOC),
    ).toEqual([]);
  });

  it("skips backtick spans inside fenced code blocks", () => {
    const source = ["Before.", "```", "`packages/nope/x.ts`", "```", "After."].join("\n");
    expect(findDanglingPaths(source, FAKE_DOC)).toEqual([]);
  });

  it("honors the allowlist for forward-references", () => {
    const issues = findDanglingPaths("Built into `dist/teseor.css`.", FAKE_DOC, ["dist/"]);
    expect(issues).toEqual([]);
  });

  it("flags a path that is NOT in the allowlist", () => {
    const issues = findDanglingPaths("See `packages/imaginary/x.ts`.", FAKE_DOC, ["dist/"]);
    expect(issues).toHaveLength(1);
  });
});
