import { describe, expect, it } from "vitest";
import { rule } from "./codegen-top-level-orphans.ts";

describe("codegen-top-level-orphans", () => {
  it("is a workspace check", () => {
    expect(rule.kind).toBe("workspace");
  });

  it("reports clean against the current tree", () => {
    expect(rule.run()).toEqual([]);
  });

  it("triggers on codegen/src/*.ts", () => {
    expect(rule.triggers).toContain("codegen/src/*.ts");
  });
});
