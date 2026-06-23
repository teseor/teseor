import { describe, expect, it } from "vitest";
import { z } from "zod";
import { Spec as SpecSchema } from "../schema.ts";
import type { SubstratePlugin } from "./plugin.ts";
import { composeFragments } from "./schema.ts";

// ---------------------------------------------------------------------------
// composeFragments — collision detection
// ---------------------------------------------------------------------------

describe("composeFragments collision detection", () => {
  it("produces no collisions in the real plugin registry for each scope", () => {
    for (const scope of ["atomic", "composite", "part"] as const) {
      expect(() => composeFragments(scope)).not.toThrow();
    }
  });

  it("throws when two plugins register the same field at the same scope", () => {
    const pluginA: SubstratePlugin = {
      name: "pluginA",
      schema: { atomic: { foo: z.string() } },
    };
    const pluginB: SubstratePlugin = {
      name: "pluginB",
      schema: { atomic: { foo: z.number() } },
    };
    expect(() => composeFragments("atomic", [pluginA, pluginB])).toThrow(
      /Schema collision.*pluginB.*foo.*atomic/,
    );
  });
});

// ---------------------------------------------------------------------------
// composeFragments — produces correct field sets
// ---------------------------------------------------------------------------

describe("composeFragments field sets", () => {
  it("includes element from rootElementStatic in atomic scope", () => {
    const fields = composeFragments("atomic");
    expect(Object.hasOwn(fields, "element")).toBe(true);
  });

  it("includes motion in composite scope", () => {
    const fields = composeFragments("composite");
    expect(Object.hasOwn(fields, "motion")).toBe(true);
  });

  it("includes overlay in part scope", () => {
    const fields = composeFragments("part");
    expect(Object.hasOwn(fields, "overlay")).toBe(true);
  });

  it("includes states in part scope", () => {
    const fields = composeFragments("part");
    expect(Object.hasOwn(fields, "states")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Composed atomicSpec — real-spec parse round-trips
// ---------------------------------------------------------------------------

describe("composed atomicSpec parses real specs", () => {
  it("parses a minimal atomic spec (heading)", () => {
    const result = SpecSchema.safeParse({
      name: "heading",
      kind: "atomic",
      elementByProp: {
        prop: "level",
        map: { "1": "h1", "2": "h2", "3": "h3" },
      },
      rootClass: "t-heading",
      cssFile: "components/heading/heading.css",
      polymorphic: "asChild",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.kind).toBe("atomic");
      expect(result.data.name).toBe("heading");
    }
  });

  it("parses a full atomic spec with variants, intents, tokens, and motion", () => {
    const result = SpecSchema.safeParse({
      name: "button",
      kind: "atomic",
      element: "button",
      rootClass: "t-button",
      cssFile: "components/button/button.css",
      variants: {
        solid: { description: "Filled background." },
        outline: { description: "Transparent background." },
      },
      intents: {
        primary: {
          description: "Primary intent.",
          tokens: { bg: "--t-accent", fg: "--t-on-accent" },
        },
      },
      props: {
        disabled: {
          type: "boolean",
          default: false,
          description: "Disables the button.",
          responsive: false,
        },
      },
      tokens: {
        bg: { fallback: "--t-surface", desc: "Background fill." },
      },
      motion: { transitions: ["opacity"] },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.kind).toBe("atomic");
    }
  });

  it("parses an atomic spec with branches and latch state", () => {
    const result = SpecSchema.safeParse({
      name: "checkbox",
      kind: "atomic",
      element: "input",
      rootClass: "t-checkbox",
      latch: { checked: { type: "boolean", initial: false } },
      branches: [
        {
          element: "input",
          attrs: { checked: { prop: "checked" } },
        },
      ],
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Composed compositeSpec — real-spec parse round-trips
// ---------------------------------------------------------------------------

describe("composed compositeSpec parses real specs", () => {
  it("parses a minimal composite spec", () => {
    const result = SpecSchema.safeParse({
      name: "modal",
      kind: "composite",
      cssFile: "components/modal/modal.css",
      parts: {
        trigger: { fromChildren: true, rootClass: "t-modal-trigger" },
        content: { element: "div", rootClass: "t-modal" },
      },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.kind).toBe("composite");
      expect(result.data.name).toBe("modal");
    }
  });

  it("parses a composite spec with nested parts", () => {
    const result = SpecSchema.safeParse({
      name: "tablist",
      kind: "composite",
      cssFile: "components/tablist/tablist.css",
      parts: {
        root: {
          element: "div",
          rootClass: "t-tablist",
          parts: {
            tab: { element: "button", rootClass: "t-tab" },
          },
        },
      },
    });
    expect(result.success).toBe(true);
  });

  it("parses a composite spec with motion on a part (not at root)", () => {
    const result = SpecSchema.safeParse({
      name: "tooltip",
      kind: "composite",
      cssFile: "components/tooltip/tooltip.css",
      parts: {
        trigger: { fromChildren: true, rootClass: "t-tooltip-trigger" },
        content: {
          element: "div",
          rootClass: "t-tooltip",
          motion: { transitions: ["opacity", "transform"] },
        },
      },
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Strict-object behavior — unknown fields are rejected
// ---------------------------------------------------------------------------

describe("strict-object behavior", () => {
  it("rejects unknown fields on an atomic spec", () => {
    const result = SpecSchema.safeParse({
      name: "button",
      kind: "atomic",
      unknownField: "should-fail",
    });
    expect(result.success).toBe(false);
  });

  it("rejects unknown fields on a composite spec", () => {
    const result = SpecSchema.safeParse({
      name: "modal",
      kind: "composite",
      parts: {},
      unknownField: "should-fail",
    });
    expect(result.success).toBe(false);
  });

  it("rejects unknown fields on a composite part", () => {
    const result = SpecSchema.safeParse({
      name: "modal",
      kind: "composite",
      parts: {
        content: {
          element: "div",
          unknownPartField: "should-fail",
        },
      },
    });
    expect(result.success).toBe(false);
  });

  it("rejects a spec with no kind field", () => {
    const result = SpecSchema.safeParse({ name: "button", element: "button" });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Union error behavior
// ---------------------------------------------------------------------------

describe("Spec union error behavior", () => {
  it("rejects an invalid kind value", () => {
    const result = SpecSchema.safeParse({ kind: "invalid", name: "x" });
    expect(result.success).toBe(false);
    if (!result.success) {
      // z.union lists both branches; at least one issue is produced
      expect(result.error.issues.length).toBeGreaterThanOrEqual(1);
    }
  });
});
