import { describe, expect, it } from "vitest";
import { findCastViolations } from "./no-as-unknown-cast.ts";

describe("findCastViolations", () => {
  it("flags `as unknown as Spec`", () => {
    const issues = findCastViolations("return flattenSpec(parsed) as unknown as Spec;");
    expect(issues).toEqual([{ line: 1, target: "Spec", kind: "double" }]);
  });

  it("flags `as unknown as DocsSpec`", () => {
    const issues = findCastViolations("const x = raw as unknown as DocsSpec;");
    expect(issues).toEqual([{ line: 1, target: "DocsSpec", kind: "double" }]);
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
    expect(findCastViolations(source)).toEqual([{ line: 3, target: "DocsSpec", kind: "double" }]);
  });

  it("reports every cast on a single line", () => {
    const source = "[x as unknown as Spec, y as unknown as DocsSpec];";
    expect(findCastViolations(source)).toHaveLength(2);
  });

  it("is whitespace-tolerant (newlines / multiple spaces inside the cast)", () => {
    const source = "const s = raw  as   unknown   as   Spec;";
    expect(findCastViolations(source)).toEqual([{ line: 1, target: "Spec", kind: "double" }]);
  });

  it("flags the bare cast `as Spec`", () => {
    const issues = findCastViolations("const x = { kind: 'atomic' } as Spec;");
    expect(issues).toEqual([{ line: 1, target: "Spec", kind: "bare" }]);
  });

  it("flags the bare cast `as Vocabulary`", () => {
    const issues = findCastViolations("const v = raw as Vocabulary;");
    expect(issues[0]?.target).toBe("Vocabulary");
  });

  it("flags any bare `as *Schema` cast", () => {
    const issues = findCastViolations("const s = raw as ButtonSchema;");
    expect(issues[0]?.target).toBe("ButtonSchema");
  });

  it("ignores bare casts to computed-aggregate types (FlatSpec / DocsSpec)", () => {
    const source = [
      "return flattenSpec(parsed) as DocsSpec;",
      "const flat = result as FlatSpec;",
    ].join("\n");
    expect(findCastViolations(source)).toEqual([]);
  });

  it("allows narrow indexed access `as Spec['events']`", () => {
    const source = [
      `const events = raw as Spec["events"];`,
      `const inner = data as DocsSpec[K];`,
    ].join("\n");
    expect(findCastViolations(source)).toEqual([]);
  });

  it("ignores `as const` / lowercase identifiers", () => {
    const source = ["const enum1 = { a: 1 } as const;", "const v = x as helper;"].join("\n");
    expect(findCastViolations(source)).toEqual([]);
  });

  it("ignores import-alias forms (`import { Spec as SpecSchema }`, export-from)", () => {
    const source = [
      `import { Spec as SpecSchema } from "../src/schema.ts";`,
      `export { ButtonSpec as ButtonFixture } from "./fixtures.ts";`,
    ].join("\n");
    expect(findCastViolations(source)).toEqual([]);
  });
});
