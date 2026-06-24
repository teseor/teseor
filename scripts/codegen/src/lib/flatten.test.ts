import { describe, expect, test } from "vitest";
import { Spec } from "../core/schema.ts";
import { flattenSpec } from "./flatten.ts";

/** Validates the literal at runtime via Zod. The lint rule
 *  `no-as-unknown-cast` forbids the bare schema-cast in test files; route
 *  every fixture through this helper so drift fails at construction. */
function makeSpec(s: unknown): Spec {
  return Spec.parse(s);
}

describe("flattenSpec — composite token namespacing (#694)", () => {
  test("keeps the bare key when only one part uses a token name", () => {
    // Tooltip-shape: `content` declares `bg`, `trigger` declares none. Flat
    // key stays `bg` so the public slot `--t-tooltip-bg` is not renamed.
    const spec = makeSpec({
      name: "tooltip",
      kind: "composite",
      parts: {
        trigger: { fromChildren: true, rootClass: "t-tooltip-trigger" },
        content: {
          root: { kind: "static", tag: "div" },
          rootClass: "t-tooltip",
          tokens: {
            bg: { fallback: "--t-neutral-90", desc: "Background." },
          },
        },
      },
    });
    const flat = flattenSpec(spec);
    expect(Object.keys(flat.tokens)).toEqual(["bg"]);
    expect(flat.tokens.bg?.__part).toBe("content");
  });

  test("namespaces by part when two parts share a token name", () => {
    // Two parts declare `bg`. Auto-resolution emits `header.bg` and `body.bg`
    // (no manual qualification, no throw).
    const spec = makeSpec({
      name: "modal",
      kind: "composite",
      parts: {
        header: {
          root: { kind: "static", tag: "header" },
          rootClass: "t-modal-header",
          tokens: {
            bg: { fallback: "--t-bg", desc: "Header fill." },
          },
        },
        body: {
          root: { kind: "static", tag: "div" },
          rootClass: "t-modal-body",
          tokens: {
            bg: { fallback: "--t-surface", desc: "Body fill." },
          },
        },
      },
    });
    const flat = flattenSpec(spec);
    expect(Object.keys(flat.tokens).sort()).toEqual(["body.bg", "header.bg"]);
    expect(flat.tokens["header.bg"]?.__part).toBe("header");
    expect(flat.tokens["body.bg"]?.__part).toBe("body");
  });

  test("nested parts namespace by full dotted path", () => {
    // Two different nested parts both literally named `inner`, each declaring
    // `bg`. Local-name-only namespacing would collide as `inner.bg`; full-path
    // namespacing yields `header.inner.bg` and `body.inner.bg`.
    const spec = makeSpec({
      name: "card",
      kind: "composite",
      parts: {
        header: {
          root: { kind: "static", tag: "header" },
          rootClass: "t-card-header",
          parts: {
            inner: {
              root: { kind: "static", tag: "div" },
              rootClass: "t-card-header-inner",
              tokens: { bg: { fallback: "--t-bg", desc: "Header inner fill." } },
            },
          },
        },
        body: {
          root: { kind: "static", tag: "div" },
          rootClass: "t-card-body",
          parts: {
            inner: {
              root: { kind: "static", tag: "div" },
              rootClass: "t-card-body-inner",
              tokens: { bg: { fallback: "--t-surface", desc: "Body inner fill." } },
            },
          },
        },
      },
    });
    const flat = flattenSpec(spec);
    expect(Object.keys(flat.tokens).sort()).toEqual(["body.inner.bg", "header.inner.bg"]);
  });

  test("mixed — collision token namespaces, distinct token stays bare", () => {
    const spec = makeSpec({
      name: "card",
      kind: "composite",
      parts: {
        header: {
          root: { kind: "static", tag: "header" },
          rootClass: "t-card-header",
          tokens: {
            bg: { fallback: "--t-bg", desc: "Header fill." },
            pad: { fallback: "--t-space-3", desc: "Header padding." },
          },
        },
        body: {
          root: { kind: "static", tag: "div" },
          rootClass: "t-card-body",
          tokens: {
            bg: { fallback: "--t-surface", desc: "Body fill." },
            gap: { fallback: "--t-space-4", desc: "Body gap." },
          },
        },
      },
    });
    const flat = flattenSpec(spec);
    expect(Object.keys(flat.tokens).sort()).toEqual(["body.bg", "gap", "header.bg", "pad"]);
  });
});

describe("flattenSpec — repeating parts (#687, RFC-0005)", () => {
  test("pushes a repeating part into `repeating[]` with the plural-default propName", () => {
    const spec = makeSpec({
      name: "pagination",
      kind: "composite",
      parts: {
        root: { root: { kind: "static", tag: "nav" }, rootClass: "t-pagination" },
        page: {
          repeating: true,
          root: { kind: "static", tag: "a" },
          rootClass: "t-pagination-page",
          props: {
            label: { type: "string", description: "Label." },
            current: { type: "boolean", description: "Active page." },
          },
        },
      },
    });
    const flat = flattenSpec(spec);
    expect(flat.repeating).toHaveLength(1);
    expect(flat.repeating?.[0]).toMatchObject({
      partName: "page",
      propName: "pages",
      root: { kind: "static", tag: "a" },
      rootClass: "t-pagination-page",
    });
    expect(Object.keys(flat.repeating?.[0]?.itemProps ?? {}).sort()).toEqual(["current", "label"]);
  });

  test("honors explicit `propName:` over the plural default", () => {
    const spec = makeSpec({
      name: "menu",
      kind: "composite",
      parts: {
        root: { root: { kind: "static", tag: "ul" }, rootClass: "t-menu" },
        item: {
          repeating: true,
          propName: "entries",
          root: { kind: "static", tag: "li" },
          props: { label: { type: "string", description: "Label." } },
        },
      },
    });
    const flat = flattenSpec(spec);
    expect(flat.repeating?.[0]?.propName).toBe("entries");
  });

  test("repeating item props do NOT leak into the scalar flat.props map", () => {
    const spec = makeSpec({
      name: "pagination",
      kind: "composite",
      parts: {
        root: { root: { kind: "static", tag: "nav" }, rootClass: "t-pagination" },
        page: {
          repeating: true,
          root: { kind: "static", tag: "a" },
          props: { label: { type: "string", description: "Label." } },
        },
      },
    });
    const flat = flattenSpec(spec);
    expect(Object.keys(flat.props)).not.toContain("label");
  });

  test("scalar props on a non-repeating sibling part still merge into flat.props", () => {
    const spec = makeSpec({
      name: "pagination",
      kind: "composite",
      parts: {
        root: {
          root: { kind: "static", tag: "nav" },
          rootClass: "t-pagination",
          props: { ariaLabel: { type: "string", description: "Group label." } },
        },
        page: {
          repeating: true,
          root: { kind: "static", tag: "a" },
          props: { label: { type: "string", description: "Label." } },
        },
      },
    });
    const flat = flattenSpec(spec);
    expect(Object.keys(flat.props)).toEqual(["ariaLabel"]);
  });

  test("multiple repeating siblings yield one entry per part", () => {
    const spec = makeSpec({
      name: "split",
      kind: "composite",
      parts: {
        root: { root: { kind: "static", tag: "div" } },
        primary: {
          repeating: true,
          root: { kind: "static", tag: "a" },
          props: { label: { type: "string", description: "Primary label." } },
        },
        secondary: {
          repeating: true,
          root: { kind: "static", tag: "a" },
          props: { label: { type: "string", description: "Secondary label." } },
        },
      },
    });
    const flat = flattenSpec(spec);
    expect(flat.repeating?.map((r) => r.partName).sort()).toEqual(["primary", "secondary"]);
  });

  test("propName derives from groupKey when set", () => {
    const spec = makeSpec({
      name: "tabs",
      kind: "composite",
      parts: {
        list: { root: { kind: "static", tag: "div" } },
        tab: {
          repeating: true,
          groupKey: "items",
          root: { kind: "static", tag: "button" },
          props: { label: { type: "string", slot: true, description: "Label." } },
        },
        "tab-icon": {
          repeating: true,
          groupKey: "items",
          root: { kind: "static", tag: "span" },
          props: { icon: { type: "string", slot: true, description: "Icon." } },
        },
      },
    });
    const flat = flattenSpec(spec);
    expect(flat.repeating).toHaveLength(2);
    expect(flat.repeating?.[0]?.propName).toBe("items");
    expect(flat.repeating?.[1]?.propName).toBe("items");
    expect(flat.repeating?.[0]?.groupKey).toBe("items");
    expect(flat.repeating?.[1]?.groupKey).toBe("items");
  });

  test("explicit propName wins over groupKey when both are set (rule 6 catches at validation)", () => {
    // Schema accepts this shape; semantic-check rule 6 rejects it. Flatten
    // is downstream of semantic-checks but still produces a defensible result
    // if it ever sees the input — precedence is `propName` > `groupKey`.
    const spec = makeSpec({
      name: "tabs",
      kind: "composite",
      parts: {
        list: { root: { kind: "static", tag: "div" } },
        tab: {
          repeating: true,
          propName: "override",
          groupKey: "items",
          root: { kind: "static", tag: "button" },
          props: { label: { type: "string", slot: true, description: "Label." } },
        },
      },
    });
    const flat = flattenSpec(spec);
    expect(flat.repeating?.[0]?.propName).toBe("override");
  });

  test("groupKey is undefined on the FlatRepeatingPart when not set", () => {
    const spec = makeSpec({
      name: "pagination",
      kind: "composite",
      parts: {
        root: { root: { kind: "static", tag: "nav" } },
        page: {
          repeating: true,
          root: { kind: "static", tag: "span" },
          props: { label: { type: "string", slot: true, description: "Label." } },
        },
      },
    });
    const flat = flattenSpec(spec);
    expect(flat.repeating?.[0]?.groupKey).toBeUndefined();
  });

  test("non-repeating composite specs leave `repeating` undefined", () => {
    const spec = makeSpec({
      name: "tooltip",
      kind: "composite",
      parts: {
        trigger: { fromChildren: true, rootClass: "t-tooltip-trigger" },
        content: { root: { kind: "static", tag: "div" }, rootClass: "t-tooltip" },
      },
    });
    const flat = flattenSpec(spec);
    expect(flat.repeating).toBeUndefined();
  });
});

describe("flattenSpec — formControl flag (#693)", () => {
  test("passes `formControl: true` through to the flat spec", () => {
    const spec = makeSpec({
      name: "input",
      kind: "atomic",
      root: { kind: "static", tag: "input" },
      rootClass: "t-input",
      formControl: true,
      examples: [{ id: "default" }],
    });
    const flat = flattenSpec(spec);
    expect(flat.formControl).toBe(true);
  });

  test("leaves `formControl` undefined when the spec doesn't opt in", () => {
    const spec = makeSpec({
      name: "button",
      kind: "atomic",
      root: { kind: "static", tag: "button" },
      rootClass: "t-button",
      examples: [{ id: "default" }],
    });
    const flat = flattenSpec(spec);
    expect(flat.formControl).toBeUndefined();
  });
});
