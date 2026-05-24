import { describe, expect, it } from "vitest";
import {
  extractRecursiveTargets,
  findDeadAggregators,
  workspacePatterns,
} from "./script-aggregators.ts";

describe("extractRecursiveTargets", () => {
  it("pulls the script name from a recursive aggregator", () => {
    expect(extractRecursiveTargets("pnpm -r --if-present run test")).toEqual(["test"]);
  });

  it("finds an aggregator inside a compound command", () => {
    expect(extractRecursiveTargets("tsc --noEmit && pnpm -r --if-present run typecheck")).toEqual([
      "typecheck",
    ]);
  });

  it("ignores filter-targeted, non-recursive invocations", () => {
    expect(extractRecursiveTargets("pnpm --filter @teseor/css run build")).toEqual([]);
  });
});

describe("findDeadAggregators", () => {
  it("flags an aggregator no workspace package implements", () => {
    const dead = findDeadAggregators(
      { "test:unit": "pnpm -r --if-present run test:unit" },
      new Set(["test", "build"]),
    );
    expect(dead).toHaveLength(1);
    expect(dead[0]).toContain("test:unit");
  });

  it("passes an aggregator an implementer provides", () => {
    const dead = findDeadAggregators({ test: "pnpm -r --if-present run test" }, new Set(["test"]));
    expect(dead).toEqual([]);
  });
});

describe("workspacePatterns", () => {
  it("reads the packages globs and stops at the next top-level key", () => {
    const yaml =
      "packages:\n  - 'packages/*'\n  - 'apps/*'\n  - 'scripts/codegen'\nallowBuilds:\n  esbuild: false\n";
    expect(workspacePatterns(yaml)).toEqual(["packages/*", "apps/*", "scripts/codegen"]);
  });
});
