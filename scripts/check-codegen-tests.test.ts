import { describe, expect, test } from "vitest";
import { pickBaseInput } from "./check-codegen-tests.ts";

describe("pickBaseInput", () => {
  test("falls back to main when BASE_REF is an empty string", () => {
    expect(pickBaseInput({ BASE_REF: "", GITHUB_BASE_REF: "" })).toBe("main");
  });

  test("prefers a non-empty BASE_REF over GITHUB_BASE_REF", () => {
    expect(pickBaseInput({ BASE_REF: "release", GITHUB_BASE_REF: "main" })).toBe("release");
  });
});
