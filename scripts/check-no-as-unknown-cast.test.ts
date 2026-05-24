import { describe, expect, it } from "vitest";
import { findCastViolations } from "./check-no-as-unknown-cast.ts";

describe("findCastViolations", () => {
  it("flags `as unknown as Spec`", () => {
    const issues = findCastViolations("return flattenSpec(parsed) as unknown as Spec;");
    expect(issues).toEqual([{ line: 1, target: "Spec" }]);
  });

  it("flags `as unknown as DocsSpec`", () => {
    const issues = findCastViolations("const x = raw as unknown as DocsSpec;");
    expect(issues).toEqual([{ line: 1, target: "DocsSpec" }]);
  });

  it("flags `as unknown as FlatSpec`", () => {
    const issues = findCastViolations("return r as unknown as FlatSpec;");
    expect(issues[0]?.target).toBe("FlatSpec");
  });

  it("flags `as unknown as Vocabulary`", () => {
    const issues = findCastViolations("const v = data as unknown as Vocabulary;");
    expect(issues[0]?.target).toBe("Vocabulary");
  });

  it("flags any custom *Schema suffix", () => {
    const issues = findCastViolations("const s = raw as unknown as ButtonSchema;");
    expect(issues[0]?.target).toBe("ButtonSchema");
  });

  it("ignores DOM-internal casts (HTMLElement, Ref, plain shapes)", () => {
    const source = [
      "const proto = HTMLElement.prototype as unknown as { showPopover?: () => void };",
      "const ref = api.contentRef as unknown as Ref<HTMLElement | null>;",
      "delete (window as unknown as { __teseor_warned?: Set<string> }).__teseor_warned;",
      "expect(resolveResponsive(null as unknown as undefined, 'base')).toBeUndefined();",
    ].join("\n");
    expect(findCastViolations(source)).toEqual([]);
  });

  it("reports the line number of the violation", () => {
    const source = ["// preamble", "", "  return x as unknown as DocsSpec;"].join("\n");
    expect(findCastViolations(source)).toEqual([{ line: 3, target: "DocsSpec" }]);
  });

  it("reports every cast on a single line", () => {
    const source = "[x as unknown as Spec, y as unknown as DocsSpec];";
    expect(findCastViolations(source)).toHaveLength(2);
  });

  it("is whitespace-tolerant (newlines / multiple spaces inside the cast)", () => {
    const source = "const s = raw  as   unknown   as   Spec;";
    expect(findCastViolations(source)).toEqual([{ line: 1, target: "Spec" }]);
  });
});
