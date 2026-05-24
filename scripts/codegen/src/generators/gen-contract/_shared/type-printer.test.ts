import { describe, expect, test } from "vitest";
import { mapPropType, quote, responsiveType } from "./type-printer.ts";

describe("quote", () => {
  test("wraps a plain string in double quotes", () => {
    expect(quote("solid")).toBe('"solid"');
  });

  test("escapes embedded double quotes", () => {
    expect(quote('with "quote"')).toBe('"with \\"quote\\""');
  });

  test("escapes backslashes before quotes", () => {
    expect(quote("a\\b")).toBe('"a\\\\b"');
  });

  test("handles the empty string", () => {
    expect(quote("")).toBe('""');
  });
});

describe("mapPropType", () => {
  test("maps spec primitives to their TS counterpart", () => {
    expect(mapPropType("boolean")).toBe("boolean");
    expect(mapPropType("string")).toBe("string");
    expect(mapPropType("number")).toBe("number");
  });

  test("falls back to `unknown` for anything else", () => {
    expect(mapPropType("date")).toBe("unknown");
    expect(mapPropType("")).toBe("unknown");
  });
});

describe("responsiveType", () => {
  test("wraps a base type in `Responsive<…>`", () => {
    expect(responsiveType("boolean")).toBe("Responsive<boolean>");
    expect(responsiveType("ButtonVariant")).toBe("Responsive<ButtonVariant>");
  });
});
