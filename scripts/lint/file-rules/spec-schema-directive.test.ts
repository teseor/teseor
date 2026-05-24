import { describe, expect, it } from "vitest";
import { hasDirective, rule } from "./spec-schema-directive.ts";

describe("hasDirective", () => {
  it("accepts the canonical directive", () => {
    const source = "# yaml-language-server: $schema=../schemas/spec.schema.json\nname: button\n";
    expect(hasDirective(source)).toBe(true);
  });

  it("accepts any schema URL after the prefix", () => {
    expect(hasDirective("# yaml-language-server: $schema=./other.schema.json\nname: x\n")).toBe(
      true,
    );
  });

  it("rejects when the first line is anything else", () => {
    expect(hasDirective("name: button\nkind: atomic\n")).toBe(false);
  });

  it("rejects when the directive appears below the first line", () => {
    const source = "\n# yaml-language-server: $schema=../schemas/spec.schema.json\nname: x\n";
    expect(hasDirective(source)).toBe(false);
  });

  it("rejects an empty file", () => {
    expect(hasDirective("")).toBe(false);
  });
});

describe("rule.accepts", () => {
  const accepts = rule.accepts ?? (() => true);

  it("scans component spec files", () => {
    expect(accepts("specs/button.yaml")).toBe(true);
    expect(accepts("specs/modal.yaml")).toBe(true);
  });

  it("exempts `_breakpoints.yaml` and `_vocabulary.yaml`", () => {
    expect(accepts("specs/_breakpoints.yaml")).toBe(false);
    expect(accepts("specs/_vocabulary.yaml")).toBe(false);
  });
});

describe("rule.run", () => {
  it("returns no violations when the directive is present", () => {
    const source = "# yaml-language-server: $schema=../schemas/spec.schema.json\nname: x\n";
    expect(rule.run("specs/button.yaml", source)).toEqual([]);
  });

  it("flags line 1 when the directive is missing", () => {
    const violations = rule.run("specs/button.yaml", "name: x\nkind: atomic\n");
    expect(violations).toHaveLength(1);
    expect(violations[0]?.line).toBe(1);
  });
});
