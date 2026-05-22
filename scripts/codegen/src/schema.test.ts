import { describe, expect, test } from "vitest";
import { Spec } from "./schema.ts";

function minimalAtomic() {
  return {
    name: "button",
    kind: "atomic" as const,
    element: "button",
    rootClass: "t-button",
    props: { loading: { type: "boolean", description: "Loading." } },
  };
}

describe("Spec schema — shape layer", () => {
  test("accepts a minimal atomic spec", () => {
    expect(Spec.safeParse(minimalAtomic()).success).toBe(true);
  });

  test("rejects a missing `kind:`", () => {
    const input = minimalAtomic() as Record<string, unknown>;
    delete input.kind;
    expect(Spec.safeParse(input).success).toBe(false);
  });

  test("rejects an unknown root field", () => {
    const result = Spec.safeParse({ ...minimalAtomic(), unknownField: true });
    expect(result.success).toBe(false);
  });

  test("rejects an unknown field on a nested block", () => {
    const result = Spec.safeParse({
      ...minimalAtomic(),
      a11y: { role: "button", typoField: "x" },
    });
    expect(result.success).toBe(false);
  });

  test("rejects an unknown kind value", () => {
    const result = Spec.safeParse({ ...minimalAtomic(), kind: "wizardry" });
    expect(result.success).toBe(false);
  });

  test("rejects a list-shaped `states:` (the pre-v0.3 form)", () => {
    const result = Spec.safeParse({
      ...minimalAtomic(),
      states: ["hover", "focus"],
    });
    expect(result.success).toBe(false);
  });

  test("accepts a map-shaped `states:`", () => {
    const result = Spec.safeParse({
      ...minimalAtomic(),
      states: { hover: { description: "Pointer over." } },
    });
    expect(result.success).toBe(true);
  });

  test("rejects `parts:` on an atomic spec", () => {
    const result = Spec.safeParse({
      ...minimalAtomic(),
      parts: { root: { element: "div" } },
    });
    expect(result.success).toBe(false);
  });

  test("requires `parts:` on a composite spec", () => {
    const result = Spec.safeParse({
      name: "popover",
      kind: "composite",
    });
    expect(result.success).toBe(false);
  });

  test("accepts a composite spec with nested parts (recursive `ComponentNode`)", () => {
    const result = Spec.safeParse({
      name: "popover",
      kind: "composite",
      parts: {
        root: {
          parts: {
            inner: { element: "div", rootClass: "t-popover__inner" },
          },
        },
        content: {
          element: "div",
          rootClass: "t-popover__content",
          motion: { enters: ["open"], exits: ["close"] },
        },
      },
    });
    expect(result.success).toBe(true);
  });

  test("rejects a token name without the `--` prefix", () => {
    const result = Spec.safeParse({
      ...minimalAtomic(),
      tokens: { bg: { fallback: "accent", desc: "Background." } },
    });
    expect(result.success).toBe(false);
  });

  test("rejects a non-canonical prop `type:`", () => {
    const result = Spec.safeParse({
      ...minimalAtomic(),
      props: { loading: { type: "bool", description: "Loading." } },
    });
    expect(result.success).toBe(false);
  });

  test("rejects an empty description", () => {
    const input = minimalAtomic();
    input.props.loading.description = "";
    expect(Spec.safeParse(input).success).toBe(false);
  });
});
