import { describe, expect, test } from "vitest";
import type { FlatSpec } from "../../../lib/flatten.ts";
import { hasSlotProps, jsLiteral, jsxAttr, quote, splitProps } from "./printers.ts";

type SpecOverrides = Omit<Partial<FlatSpec>, "name"> & { name?: string };

function spec(overrides: SpecOverrides = {}): FlatSpec {
  return {
    name: "button",
    kind: "atomic",
    rootClass: "t-button",
    props: {},
    tokens: {},
    states: {},
    ...overrides,
  };
}

describe("quote", () => {
  test("wraps a plain string in double quotes", () => {
    expect(quote("primary")).toBe('"primary"');
  });

  test("escapes embedded double quotes", () => {
    expect(quote('say "hi"')).toBe('"say \\"hi\\""');
  });

  test("escapes backslashes before quotes", () => {
    expect(quote("a\\b")).toBe('"a\\\\b"');
  });
});

describe("jsLiteral", () => {
  test("renders primitives", () => {
    expect(jsLiteral(null)).toBe("null");
    expect(jsLiteral("x")).toBe('"x"');
    expect(jsLiteral(true)).toBe("true");
    expect(jsLiteral(42)).toBe("42");
  });

  test("renders arrays recursively", () => {
    expect(jsLiteral(["a", 1, true])).toBe('["a", 1, true]');
  });

  test("renders object entries with quoted keys", () => {
    expect(jsLiteral({ size: "lg", on: true })).toBe('{ "size": "lg", "on": true }');
  });

  test("returns `undefined` for unsupported values", () => {
    expect(jsLiteral(undefined)).toBe("undefined");
  });
});

describe("jsxAttr", () => {
  test("strings render as quoted attributes", () => {
    expect(jsxAttr("variant", "solid")).toBe(' variant="solid"');
  });

  test("true booleans render as the bare attribute name", () => {
    expect(jsxAttr("disabled", true)).toBe(" disabled");
  });

  test("false booleans render as `={false}`", () => {
    expect(jsxAttr("disabled", false)).toBe(" disabled={false}");
  });

  test("numbers render inside braces", () => {
    expect(jsxAttr("count", 3)).toBe(" count={3}");
  });

  test("objects fall back to jsLiteral inside braces", () => {
    expect(jsxAttr("style", { color: "red" })).toBe(' style={{ "color": "red" }}');
  });
});

describe("splitProps", () => {
  const subject = spec({
    props: {
      label: { type: "string", description: "Label.", __part: "" },
      icon: { type: "string", description: "Icon.", slot: true, __part: "" },
    },
  });

  test("separates slot-typed entries from regular props", () => {
    const { regular, slots } = splitProps(subject, { label: "Go", icon: "star" });
    expect(regular).toEqual([["label", "Go"]]);
    expect(slots).toEqual([["icon", "star"]]);
  });

  test("treats props without a spec entry as regular", () => {
    const { regular, slots } = splitProps(subject, { mystery: 1 });
    expect(regular).toEqual([["mystery", 1]]);
    expect(slots).toEqual([]);
  });
});

describe("hasSlotProps", () => {
  test("returns true when any prop declares `slot: true`", () => {
    expect(
      hasSlotProps(
        spec({
          props: { icon: { type: "string", description: "Icon.", slot: true, __part: "" } },
        }),
      ),
    ).toBe(true);
  });

  test("returns false when no prop is a slot", () => {
    expect(
      hasSlotProps(
        spec({ props: { label: { type: "string", description: "Label.", __part: "" } } }),
      ),
    ).toBe(false);
  });

  test("returns false for specs without props", () => {
    expect(hasSlotProps(spec())).toBe(false);
  });
});
