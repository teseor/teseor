import { describe, expect, it } from "vitest";
import { emptyAnalysis, mergeAnalysis } from "./analysis.ts";

describe("SpecAnalysis", () => {
  it("emptyAnalysis has empty sets and false flags", () => {
    const a = emptyAnalysis();
    expect(a.ariaPropNames.size).toBe(0);
    expect(a.hasAs).toBe(false);
    expect(a.voidStatus).toBe("none");
  });

  it("merging empty fragment is identity", () => {
    const a = emptyAnalysis();
    const merged = mergeAnalysis(a, {});
    expect(merged).toEqual(a);
  });

  it("merging unions sets and ORs flags", () => {
    const a = emptyAnalysis();
    const merged = mergeAnalysis(a, {
      ariaPropNames: new Set(["foo"]),
      hasAs: true,
    });
    expect(merged.ariaPropNames.has("foo")).toBe(true);
    expect(merged.hasAs).toBe(true);
  });
});
