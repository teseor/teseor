import { describe, expect, test } from "vitest";
import { levenshtein, suggest } from "./core/check-utils.ts";

describe("levenshtein + suggest", () => {
  test("levenshtein is symmetric and zero for equal strings", () => {
    expect(levenshtein("danger", "danger")).toBe(0);
    expect(levenshtein("danger", "destructive")).toBe(levenshtein("destructive", "danger"));
  });

  test("suggest finds a close-by name", () => {
    expect(suggest("dissabled", ["disabled", "loading"])).toBe("disabled");
  });

  test("suggest returns undefined when nothing is within range", () => {
    expect(suggest("destructive", ["danger", "success"], 3)).toBeUndefined();
  });
});
