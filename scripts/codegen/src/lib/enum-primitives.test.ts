import { describe, expect, it } from "vitest";
import { renderEnumType } from "./enum-primitives.ts";

describe("renderEnumType", () => {
  it("emits a string union for a list of values", () => {
    expect(renderEnumType("Button", "Variant", ["solid", "outline", "ghost"])).toBe(
      'type ButtonVariant = "solid" | "outline" | "ghost";\n',
    );
  });

  it("returns empty string for empty value lists", () => {
    expect(renderEnumType("Button", "Variant", [])).toBe("");
  });

  it("handles single-value enums", () => {
    expect(renderEnumType("Tooltip", "Side", ["top"])).toBe('type TooltipSide = "top";\n');
  });

  it("escapes embedded quotes and backslashes in values", () => {
    expect(renderEnumType("X", "Y", ['a"b', "c\\d"])).toBe('type XY = "a\\"b" | "c\\\\d";\n');
  });
});
