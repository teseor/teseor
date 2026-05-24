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

  test("quotes object keys that are not valid JS identifiers", () => {
    // Responsive breakpoint names like `2xl` from `_breakpoints.yaml` would
    // otherwise emit `{ 2xl: 4 }` — a syntax error in JS / TS / JSX.
    expect(jsLiteral({ base: 1, "2xl": 4 })).toBe('{ base: 1, "2xl": 4 }');
    expect(jsLiteral({ "data-x": "v" })).toBe('{ "data-x": "v" }');
  });

  test("formats arrays as bracketed lists", () => {
    expect(jsLiteral([1, 2, 3])).toBe("[1, 2, 3]");
    expect(jsLiteral(["a", "b"])).toBe('["a", "b"]');
    expect(jsLiteral([{ id: 1 }, { id: 2 }])).toBe("[{ id: 1 }, { id: 2 }]");
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

  test("routes strings with markup-sensitive chars through a JSX expression", () => {
    // `<>`, `&`, `"`, `{`, `}` would otherwise produce invalid Astro output.
    expect(attr("title", '<b>"hi"</b>')).toBe('title={"<b>\\"hi\\"</b>"}');
    expect(attr("class", "a & b")).toBe('class={"a & b"}');
    expect(attr("data", "{x}")).toBe('data={"{x}"}');
  });
});
