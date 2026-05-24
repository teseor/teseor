import { describe, expect, it } from "vitest";
import { findTypeofViolations } from "./check-no-document-typeof.ts";

describe("findTypeofViolations", () => {
  it("flags `typeof document !== 'undefined'`", () => {
    const issues = findTypeofViolations("return typeof document !== 'undefined' ? <X /> : null;");
    expect(issues).toEqual([{ line: 1, expression: `typeof document !== 'undefined'` }]);
  });

  it("flags `typeof document === 'undefined'` (inverted)", () => {
    const issues = findTypeofViolations("if (typeof document === 'undefined') return null;");
    expect(issues[0]?.expression).toBe(`typeof document === 'undefined'`);
  });

  it("flags `typeof window !== 'undefined'`", () => {
    const issues = findTypeofViolations("if (typeof window !== 'undefined') doThing();");
    expect(issues[0]?.expression).toBe(`typeof window !== 'undefined'`);
  });

  it("accepts double-quoted form", () => {
    const issues = findTypeofViolations(`return typeof document !== "undefined" ? <X /> : null;`);
    expect(issues).toHaveLength(1);
  });

  it("tolerates extra whitespace", () => {
    const issues = findTypeofViolations(`if ( typeof   document  !==  "undefined" ) return;`);
    expect(issues).toHaveLength(1);
  });

  it("does not flag unrelated typeof checks (function / number / etc.)", () => {
    const source = [
      `if (typeof callback === "function") callback();`,
      `if (typeof n === "number") use(n);`,
      `if (typeof input !== "string") throw new Error("bad");`,
    ].join("\n");
    expect(findTypeofViolations(source)).toEqual([]);
  });

  it("does not flag `typeof window.matchMedia`", () => {
    // Used legitimately inside `_runtime.ts` to feature-detect matchMedia.
    const source = `if (typeof window.matchMedia !== "function") return "base";`;
    expect(findTypeofViolations(source)).toEqual([]);
  });

  it("reports the line number of the violation", () => {
    const source = [
      `// preamble`,
      ``,
      `  return typeof document !== "undefined" ? createPortal(x, document.body) : null;`,
    ].join("\n");
    expect(findTypeofViolations(source)).toEqual([
      { line: 3, expression: `typeof document !== "undefined"` },
    ]);
  });

  it("reports every gate on a single line", () => {
    const source = `if (typeof document !== "undefined" && typeof window !== "undefined") {}`;
    expect(findTypeofViolations(source)).toHaveLength(2);
  });
});
