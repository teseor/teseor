import { describe, expect, it } from "vitest";
import { type Constraint, coverageFixtureId, type Dimension, expandPairwise } from "./pairwise.ts";

function uniquePairs(cells: readonly Record<string, string>[], dimNames: string[]): Set<string> {
  const pairs = new Set<string>();
  for (const cell of cells) {
    for (let i = 0; i < dimNames.length; i += 1) {
      for (let j = i + 1; j < dimNames.length; j += 1) {
        const a = dimNames[i];
        const b = dimNames[j];
        if (a === undefined || b === undefined) continue;
        pairs.add(`${a}=${cell[a]}|${b}=${cell[b]}`);
      }
    }
  }
  return pairs;
}

describe("expandPairwise", () => {
  it("returns an empty array for zero dimensions", () => {
    expect(expandPairwise([])).toEqual([]);
  });

  it("returns the cartesian for a single dimension (no pairs to cover)", () => {
    const dims: Dimension[] = [{ name: "variant", values: ["solid", "outline"] }];
    expect(expandPairwise(dims)).toEqual([{ variant: "outline" }, { variant: "solid" }]);
  });

  it("covers every pair across the dimensions", () => {
    const dims: Dimension[] = [
      { name: "variant", values: ["solid", "outline", "ghost", "link"] },
      { name: "intent", values: ["primary", "neutral", "danger", "success", "warning"] },
      { name: "size", values: ["sm", "md", "lg"] },
    ];
    const cells = expandPairwise(dims);
    // 4×5 + 4×3 + 5×3 = 47 pairs to cover.
    const covered = uniquePairs(cells, ["variant", "intent", "size"]);
    expect(covered.size).toBe(47);
    // Pairwise should land well under cartesian (60).
    expect(cells.length).toBeLessThanOrEqual(20);
    expect(cells.length).toBeGreaterThanOrEqual(15);
  });

  it("is deterministic across runs (same input → same output)", () => {
    const dims: Dimension[] = [
      { name: "variant", values: ["solid", "outline", "ghost"] },
      { name: "intent", values: ["primary", "neutral", "danger"] },
    ];
    const a = expandPairwise(dims);
    const b = expandPairwise(dims);
    expect(a).toEqual(b);
  });

  it("excludes pairs forbidden by a constraint", () => {
    const dims: Dimension[] = [
      { name: "variant", values: ["solid", "outline", "ghost", "link"] },
      { name: "intent", values: ["primary", "neutral", "danger", "warning", "success"] },
      { name: "size", values: ["sm", "md", "lg"] },
    ];
    const constraints: Constraint[] = [
      {
        when: { variant: "link" },
        forbid: { intent: ["danger", "warning", "success"] },
      },
    ];
    const cells = expandPairwise(dims, constraints);
    // No cell should pair `variant=link` with a forbidden intent.
    for (const cell of cells) {
      if (cell.variant === "link") {
        expect(["danger", "warning", "success"]).not.toContain(cell.intent);
      }
    }
  });

  it("still covers every reachable pair under a constraint", () => {
    const dims: Dimension[] = [
      { name: "variant", values: ["solid", "outline", "ghost", "link"] },
      { name: "intent", values: ["primary", "neutral", "danger", "warning", "success"] },
    ];
    const constraints: Constraint[] = [
      {
        when: { variant: "link" },
        forbid: { intent: ["danger", "warning", "success"] },
      },
    ];
    const cells = expandPairwise(dims, constraints);
    // Reachable pairs: 4×5 - 3 (link × danger/warning/success) = 17.
    const covered = uniquePairs(cells, ["variant", "intent"]);
    expect(covered.size).toBe(17);
  });

  it("returns sorted cells for output stability", () => {
    const dims: Dimension[] = [
      { name: "variant", values: ["b", "a"] },
      { name: "size", values: ["md", "sm"] },
    ];
    const cells = expandPairwise(dims);
    const keys = cells.map((c) => `${c.size}:${c.variant}`);
    const sorted = [...keys].sort();
    expect(keys).toEqual(sorted);
  });
});

describe("coverageFixtureId", () => {
  it("composes the id from dimension values in declaration order", () => {
    const dims: Dimension[] = [
      { name: "variant", values: ["solid"] },
      { name: "intent", values: ["primary"] },
      { name: "size", values: ["md"] },
    ];
    expect(coverageFixtureId({ variant: "solid", intent: "primary", size: "md" }, dims)).toBe(
      "cov-solid-primary-md",
    );
  });
});
