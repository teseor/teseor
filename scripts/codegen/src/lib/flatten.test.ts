import { describe, expect, test } from "vitest";
import type { Spec } from "../schema.ts";
import { flattenSpec } from "./flatten.ts";

describe("flattenSpec — composite token namespacing (#694)", () => {
  test("keeps the bare key when only one part uses a token name", () => {
    // Tooltip-shape: `content` declares `bg`, `trigger` declares none. Flat
    // key stays `bg` so the public slot `--t-tooltip-bg` is not renamed.
    const spec: Spec = {
      name: "tooltip",
      kind: "composite",
      parts: {
        trigger: { fromChildren: true, rootClass: "t-tooltip-trigger" },
        content: {
          element: "div",
          rootClass: "t-tooltip",
          tokens: {
            bg: { fallback: "--t-neutral-90", desc: "Background." },
          },
        },
      },
    } as Spec;
    const flat = flattenSpec(spec);
    expect(Object.keys(flat.tokens)).toEqual(["bg"]);
    expect(flat.tokens.bg?.__part).toBe("content");
  });

  test("namespaces by part when two parts share a token name", () => {
    // Two parts declare `bg`. Auto-resolution emits `header.bg` and `body.bg`
    // (no manual qualification, no throw).
    const spec: Spec = {
      name: "modal",
      kind: "composite",
      parts: {
        header: {
          element: "header",
          rootClass: "t-modal-header",
          tokens: {
            bg: { fallback: "--t-bg", desc: "Header fill." },
          },
        },
        body: {
          element: "div",
          rootClass: "t-modal-body",
          tokens: {
            bg: { fallback: "--t-surface", desc: "Body fill." },
          },
        },
      },
    } as Spec;
    const flat = flattenSpec(spec);
    expect(Object.keys(flat.tokens).sort()).toEqual(["body.bg", "header.bg"]);
    expect(flat.tokens["header.bg"]?.__part).toBe("header");
    expect(flat.tokens["body.bg"]?.__part).toBe("body");
  });

  test("nested parts namespace by full dotted path", () => {
    // Two different nested parts both literally named `inner`, each declaring
    // `bg`. Local-name-only namespacing would collide as `inner.bg`; full-path
    // namespacing yields `header.inner.bg` and `body.inner.bg`.
    const spec: Spec = {
      name: "card",
      kind: "composite",
      parts: {
        header: {
          element: "header",
          rootClass: "t-card-header",
          parts: {
            inner: {
              element: "div",
              rootClass: "t-card-header-inner",
              tokens: { bg: { fallback: "--t-bg", desc: "Header inner fill." } },
            },
          },
        },
        body: {
          element: "div",
          rootClass: "t-card-body",
          parts: {
            inner: {
              element: "div",
              rootClass: "t-card-body-inner",
              tokens: { bg: { fallback: "--t-surface", desc: "Body inner fill." } },
            },
          },
        },
      },
    } as Spec;
    const flat = flattenSpec(spec);
    expect(Object.keys(flat.tokens).sort()).toEqual(["body.inner.bg", "header.inner.bg"]);
  });

  test("mixed — collision token namespaces, distinct token stays bare", () => {
    const spec: Spec = {
      name: "card",
      kind: "composite",
      parts: {
        header: {
          element: "header",
          rootClass: "t-card-header",
          tokens: {
            bg: { fallback: "--t-bg", desc: "Header fill." },
            pad: { fallback: "--t-space-3", desc: "Header padding." },
          },
        },
        body: {
          element: "div",
          rootClass: "t-card-body",
          tokens: {
            bg: { fallback: "--t-surface", desc: "Body fill." },
            gap: { fallback: "--t-space-4", desc: "Body gap." },
          },
        },
      },
    } as Spec;
    const flat = flattenSpec(spec);
    expect(Object.keys(flat.tokens).sort()).toEqual(["body.bg", "gap", "header.bg", "pad"]);
  });
});

describe("flattenSpec — repeating parts (#687, RFC-0005)", () => {
  test("pushes a repeating part into `repeating[]` with the plural-default propName", () => {
    const spec: Spec = {
      name: "pagination",
      kind: "composite",
      parts: {
        root: { element: "nav", rootClass: "t-pagination" },
        page: {
          repeating: true,
          element: "a",
          rootClass: "t-pagination-page",
          props: {
            label: { type: "string", description: "Label." },
            current: { type: "boolean", description: "Active page." },
          },
        },
      },
    } as Spec;
    const flat = flattenSpec(spec);
    expect(flat.repeating).toHaveLength(1);
    expect(flat.repeating?.[0]).toMatchObject({
      partName: "page",
      propName: "pages",
      element: "a",
      rootClass: "t-pagination-page",
    });
    expect(Object.keys(flat.repeating?.[0]?.itemProps ?? {}).sort()).toEqual(["current", "label"]);
  });

  test("honors explicit `propName:` over the plural default", () => {
    const spec: Spec = {
      name: "menu",
      kind: "composite",
      parts: {
        root: { element: "ul", rootClass: "t-menu" },
        item: {
          repeating: true,
          propName: "entries",
          element: "li",
          props: { label: { type: "string", description: "Label." } },
        },
      },
    } as Spec;
    const flat = flattenSpec(spec);
    expect(flat.repeating?.[0]?.propName).toBe("entries");
  });

  test("repeating item props do NOT leak into the scalar flat.props map", () => {
    const spec: Spec = {
      name: "pagination",
      kind: "composite",
      parts: {
        root: { element: "nav", rootClass: "t-pagination" },
        page: {
          repeating: true,
          element: "a",
          props: { label: { type: "string", description: "Label." } },
        },
      },
    } as Spec;
    const flat = flattenSpec(spec);
    expect(Object.keys(flat.props)).not.toContain("label");
  });

  test("scalar props on a non-repeating sibling part still merge into flat.props", () => {
    const spec: Spec = {
      name: "pagination",
      kind: "composite",
      parts: {
        root: {
          element: "nav",
          rootClass: "t-pagination",
          props: { ariaLabel: { type: "string", description: "Group label." } },
        },
        page: {
          repeating: true,
          element: "a",
          props: { label: { type: "string", description: "Label." } },
        },
      },
    } as Spec;
    const flat = flattenSpec(spec);
    expect(Object.keys(flat.props)).toEqual(["ariaLabel"]);
  });

  test("multiple repeating siblings yield one entry per part", () => {
    const spec: Spec = {
      name: "split",
      kind: "composite",
      parts: {
        root: { element: "div" },
        primary: {
          repeating: true,
          element: "a",
          props: { label: { type: "string", description: "Primary label." } },
        },
        secondary: {
          repeating: true,
          element: "a",
          props: { label: { type: "string", description: "Secondary label." } },
        },
      },
    } as Spec;
    const flat = flattenSpec(spec);
    expect(flat.repeating?.map((r) => r.partName).sort()).toEqual(["primary", "secondary"]);
  });

  test("non-repeating composite specs leave `repeating` undefined", () => {
    const spec: Spec = {
      name: "tooltip",
      kind: "composite",
      parts: {
        trigger: { fromChildren: true, rootClass: "t-tooltip-trigger" },
        content: { element: "div", rootClass: "t-tooltip" },
      },
    } as Spec;
    const flat = flattenSpec(spec);
    expect(flat.repeating).toBeUndefined();
  });
});
