import { describe, expect, test } from "vitest";
import type { SpecProp } from "../../gen-contract.ts";
import { mapPropType, quote, responsiveType, vuePropType } from "./type-printer.ts";

function prop(overrides: Partial<SpecProp> & { type: SpecProp["type"] }): SpecProp {
  return { description: "", __part: "", ...overrides };
}

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

describe("vuePropType", () => {
  test("atomic slot props collapse to `never`", () => {
    expect(vuePropType("icon", prop({ type: "string", slot: true }), "Button")).toBe("never");
  });

  test("composite-part slot props keep their scalar type", () => {
    expect(
      vuePropType("text", prop({ type: "string", slot: true, __part: "content" }), "Tooltip"),
    ).toBe("string");
  });

  test("enum-valued props widen to a per-component union name", () => {
    expect(
      vuePropType("placement", prop({ type: "string", values: ["top", "bottom"] }), "Tooltip"),
    ).toBe("TooltipPlacement");
  });

  test("plain scalar props map through `mapPropType`", () => {
    expect(vuePropType("open", prop({ type: "boolean" }), "Tooltip")).toBe("boolean");
  });
});
