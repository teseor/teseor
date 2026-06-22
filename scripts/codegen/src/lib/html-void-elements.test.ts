import { describe, expect, it } from "vitest";
import {
  HTML_VOID_ELEMENTS,
  isVoidElement,
  specVoidStatus,
  voidTagsInMap,
} from "./html-void-elements.ts";

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

describe("specVoidStatus", () => {
  it("returns 'never' when no element or elementByProp is set", () => {
    expect(specVoidStatus({})).toBe("never");
  });

  it("returns 'all' when spec.element is void", () => {
    expect(specVoidStatus({ element: "hr" })).toBe("all");
    expect(specVoidStatus({ element: "img" })).toBe("all");
  });

  it("returns 'never' when spec.element is non-void", () => {
    expect(specVoidStatus({ element: "div" })).toBe("never");
  });

  it("returns 'all' when every elementByProp.map value is void", () => {
    expect(specVoidStatus({ elementByProp: { prop: "kind", map: { a: "hr", b: "br" } } })).toBe(
      "all",
    );
  });

  it("returns 'never' when every elementByProp.map value is non-void", () => {
    expect(
      specVoidStatus({ elementByProp: { prop: "level", map: { "1": "h1", "2": "h2" } } }),
    ).toBe("never");
  });

  it("returns 'mixed' when elementByProp.map has both void and non-void values", () => {
    expect(
      specVoidStatus({
        elementByProp: { prop: "orientation", map: { horizontal: "hr", vertical: "div" } },
      }),
    ).toBe("mixed");
  });

  it("returns 'never' on an empty elementByProp.map", () => {
    expect(specVoidStatus({ elementByProp: { prop: "x", map: {} } })).toBe("never");
  });
});

describe("voidTagsInMap", () => {
  it("returns the distinct void tags from the map, preserving order", () => {
    expect(voidTagsInMap({ a: "hr", b: "div", c: "br", d: "hr" })).toEqual(["hr", "br"]);
  });

  it("returns an empty array when the map has no void values", () => {
    expect(voidTagsInMap({ "1": "h1", "2": "h2" })).toEqual([]);
  });
});
