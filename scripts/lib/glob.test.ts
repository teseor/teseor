import { describe, expect, it } from "vitest";
import { globMatch } from "./glob.ts";

describe("globMatch", () => {
  it("matches a literal path", () => {
    expect(globMatch("package.json", "package.json")).toBe(true);
    expect(globMatch("package.json", "other.json")).toBe(false);
  });

  it("`*` matches one path segment", () => {
    expect(globMatch("packages/*/package.json", "packages/react/package.json")).toBe(true);
    expect(globMatch("packages/*/package.json", "packages/react/src/package.json")).toBe(false);
  });

  it("`**` matches across multiple segments", () => {
    expect(globMatch("packages/**/*.ts", "packages/a/b/c.ts")).toBe(true);
    expect(globMatch("packages/**/*.ts", "packages/a.ts")).toBe(true);
    expect(globMatch("packages/**/*.ts", "other/a.ts")).toBe(false);
  });

  it("expands `{a,b}` alternation (the bug that motivated this lib)", () => {
    // The inline runner version escaped `{`/`}` before substituting brace
    // alternation, so every pattern with braces silently never matched.
    expect(globMatch("**/*.{ts,tsx}", "src/a.ts")).toBe(true);
    expect(globMatch("**/*.{ts,tsx}", "src/a.tsx")).toBe(true);
    expect(globMatch("**/*.{ts,tsx}", "src/a.js")).toBe(false);
  });

  it("expands `{a,b}` in the head of the pattern", () => {
    expect(globMatch("{packages,apps}/*/package.json", "packages/react/package.json")).toBe(true);
    expect(globMatch("{packages,apps}/*/package.json", "apps/docs/package.json")).toBe(true);
    expect(globMatch("{packages,apps}/*/package.json", "scripts/package.json")).toBe(false);
  });

  it("matches the runner's actual external-check trigger patterns", () => {
    // Spot-check the patterns shipped in `scripts/lint/registry.ts` so a
    // regression on the brace-expansion bug surfaces here, not at runtime.
    expect(globMatch("**/*.{ts,tsx,js,mjs,cjs,json}", "packages/react/src/Modal.tsx")).toBe(true);
    expect(globMatch("**/*.{ts,tsx,js,mjs,cjs,json}", "package.json")).toBe(true);
    expect(globMatch("packages/**/*.css", "packages/css/src/components/button.css")).toBe(true);
    expect(globMatch("apps/docs/**", "apps/docs/src/pages/index.astro")).toBe(true);
  });

  it("does not allow `*` to cross `/`", () => {
    expect(globMatch("packages/*", "packages/react/Button.tsx")).toBe(false);
    expect(globMatch("packages/*", "packages/react")).toBe(true);
  });

  it("escapes regex-special punctuation in the literal portion", () => {
    expect(globMatch("a.b.c", "a.b.c")).toBe(true);
    expect(globMatch("a.b.c", "aXbXc")).toBe(false);
  });

  it("returns false for partial matches", () => {
    // Anchored — the pattern must consume the entire path.
    expect(globMatch("packages/react", "packages/react/Button.tsx")).toBe(false);
  });
});
