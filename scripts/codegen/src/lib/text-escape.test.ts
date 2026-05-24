import { describe, expect, it } from "vitest";
import { esc, formatValue } from "./text-escape.ts";

describe("esc", () => {
  it("escapes HTML special chars", () => {
    expect(esc("<div>")).toBe("&lt;div&gt;");
  });

  it("escapes Astro-sensitive braces", () => {
    expect(esc("a {b} c")).toBe("a &lbrace;b&rbrace; c");
  });

  it("escapes ampersands first", () => {
    expect(esc("a & b")).toBe("a &amp; b");
  });

  it("escapes combinations correctly", () => {
    expect(esc("<a>&</a>")).toBe("&lt;a&gt;&amp;&lt;/a&gt;");
  });
});

describe("formatValue", () => {
  it("renders null", () => {
    expect(formatValue(null)).toBe("null");
  });

  it("renders undefined as null", () => {
    expect(formatValue(undefined)).toBe("null");
  });

  it("renders booleans as literals", () => {
    expect(formatValue(true)).toBe("true");
    expect(formatValue(false)).toBe("false");
  });

  it("renders numbers as strings", () => {
    expect(formatValue(42)).toBe("42");
  });
});
