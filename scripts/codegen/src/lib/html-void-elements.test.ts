import { describe, expect, it } from "vitest";
import { HTML_VOID_ELEMENTS, isVoidElement } from "./html-void-elements.ts";

describe("isVoidElement", () => {
  it("returns true for the canonical void tags", () => {
    for (const tag of ["hr", "img", "input", "br", "wbr", "meta", "link"]) {
      expect(isVoidElement(tag)).toBe(true);
    }
  });

  it("returns false for typical container elements", () => {
    for (const tag of ["div", "span", "button", "a", "p", "section"]) {
      expect(isVoidElement(tag)).toBe(false);
    }
  });

  it("is case-insensitive", () => {
    expect(isVoidElement("HR")).toBe(true);
    expect(isVoidElement("Img")).toBe(true);
    expect(isVoidElement("DIV")).toBe(false);
  });
});

describe("HTML_VOID_ELEMENTS", () => {
  it("contains exactly the 14 WHATWG void elements", () => {
    expect(HTML_VOID_ELEMENTS.size).toBe(14);
  });
});
