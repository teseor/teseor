import { describe, expect, test } from "vitest";
import { attr, jsLiteral } from "./jsx-printer.ts";

describe("jsLiteral", () => {
  test("formats null and undefined as null", () => {
    expect(jsLiteral(null)).toBe("null");
    expect(jsLiteral(undefined)).toBe("null");
  });

  test("formats strings as JSON-quoted", () => {
    expect(jsLiteral("hello")).toBe('"hello"');
    expect(jsLiteral('with "quote"')).toBe('"with \\"quote\\""');
  });

  test("formats numbers and booleans bare", () => {
    expect(jsLiteral(42)).toBe("42");
    expect(jsLiteral(true)).toBe("true");
    expect(jsLiteral(false)).toBe("false");
  });

  test("formats objects as inline `{ key: value }`", () => {
    expect(jsLiteral({ a: 1, b: "x" })).toBe('{ a: 1, b: "x" }');
  });

  test("formats nested objects recursively", () => {
    expect(jsLiteral({ md: { sm: 1, lg: 2 } })).toBe("{ md: { sm: 1, lg: 2 } }");
  });
});

describe("attr", () => {
  test('emits `key="str"` for string values', () => {
    expect(attr("variant", "solid")).toBe('variant="solid"');
  });

  test("emits bare `key` for `true`", () => {
    expect(attr("disabled", true)).toBe("disabled");
  });

  test("emits `key={expr}` for non-string, non-true values", () => {
    expect(attr("count", 3)).toBe("count={3}");
    expect(attr("hidden", false)).toBe("hidden={false}");
    expect(attr("gap", { md: 4 })).toBe("gap={{ md: 4 }}");
  });
});
