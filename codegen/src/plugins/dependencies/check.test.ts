import { describe, expect, test } from "vitest";
import { checkDependencyCycles } from "./check.ts";

describe("checkDependencyCycles", () => {
  test("flags a direct A → A cycle", () => {
    const issues = checkDependencyCycles({ depsByName: new Map([["a", ["a"]]]) });
    expect(issues).toHaveLength(1);
  });

  test("flags an indirect A → B → A cycle", () => {
    const issues = checkDependencyCycles({
      depsByName: new Map([
        ["a", ["b"]],
        ["b", ["a"]],
      ]),
    });
    expect(issues.length).toBeGreaterThanOrEqual(1);
  });

  test("passes an acyclic graph", () => {
    expect(
      checkDependencyCycles({
        depsByName: new Map([
          ["a", ["b", "c"]],
          ["b", ["c"]],
          ["c", []],
        ]),
      }),
    ).toEqual([]);
  });
});
