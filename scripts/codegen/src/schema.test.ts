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

  test("accepts a literal CSS value as fallback (for non-themed primitives)", () => {
    // The schema is permissive — semantic-checks.checkTokenFallbacks gates
    // token-shaped values against tokens.css. Layout primitives like Stack
    // use literal fallbacks (`stretch`, `flex-start`) where the default
    // isn't a theme token.
    const result = Spec.safeParse({
      ...minimalAtomic(),
      tokens: { align: { fallback: "stretch", desc: "Alignment default." } },
    });
    expect(result.success).toBe(true);
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

  test("overlay.modal defaults to false when omitted", () => {
    const result = Spec.safeParse({
      name: "tooltip",
      kind: "composite",
      parts: { trigger: { fromChildren: true }, content: { element: "div" } },
      overlay: {
        anchor: "trigger",
        floating: "content",
        mode: "manual",
        anchorVar: "--t-tooltip-anchor",
      },
    });
    if (!result.success) throw result.error;
    expect(result.data.overlay?.modal).toBe(false);
  });

  test("overlay.modal accepts true", () => {
    const result = Spec.safeParse({
      name: "dialog",
      kind: "composite",
      parts: { trigger: { fromChildren: true }, content: { element: "div" } },
      overlay: {
        anchor: "trigger",
        floating: "content",
        mode: "manual",
        anchorVar: "--t-dialog-anchor",
        modal: true,
      },
    });
    if (!result.success) throw result.error;
    expect(result.data.overlay?.modal).toBe(true);
  });

  test("overlay.modal rejects non-boolean", () => {
    const result = Spec.safeParse({
      name: "dialog",
      kind: "composite",
      parts: { trigger: { fromChildren: true }, content: { element: "div" } },
      overlay: {
        anchor: "trigger",
        floating: "content",
        mode: "manual",
        anchorVar: "--t-dialog-anchor",
        modal: "yes",
      },
    });
    expect(result.success).toBe(false);
  });

  test("accepts `repeating: true` on a part", () => {
    const result = Spec.safeParse({
      name: "pagination",
      kind: "composite",
      parts: {
        page: {
          repeating: true,
          element: "a",
          props: { label: { type: "string", description: "Label." } },
        },
      },
    });
    expect(result.success).toBe(true);
  });

  test("accepts `repeating: true` with explicit `propName:`", () => {
    const result = Spec.safeParse({
      name: "pagination",
      kind: "composite",
      parts: {
        page: {
          repeating: true,
          propName: "pages",
          element: "a",
          props: { label: { type: "string", description: "Label." } },
        },
      },
    });
    expect(result.success).toBe(true);
  });

  test("rejects non-boolean `repeating:`", () => {
    const result = Spec.safeParse({
      name: "pagination",
      kind: "composite",
      parts: {
        page: {
          repeating: "yes",
          element: "a",
          props: { label: { type: "string", description: "Label." } },
        },
      },
    });
    expect(result.success).toBe(false);
  });

  test("rejects non-string `propName:`", () => {
    const result = Spec.safeParse({
      name: "pagination",
      kind: "composite",
      parts: {
        page: {
          repeating: true,
          propName: 42,
          element: "a",
          props: { label: { type: "string", description: "Label." } },
        },
      },
    });
    expect(result.success).toBe(false);
  });

  test("rejects `groupKey:` in phase 1 (lands with phase 2)", () => {
    const result = Spec.safeParse({
      name: "tabs",
      kind: "composite",
      parts: {
        tab: {
          repeating: true,
          groupKey: "items",
          element: "button",
          props: { label: { type: "string", description: "Label." } },
        },
      },
    });
    expect(result.success).toBe(false);
  });
});
