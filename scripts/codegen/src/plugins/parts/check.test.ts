import { describe, expect, test } from "vitest";
import { Spec } from "../../schema.ts";
import { checkRepeatingParts } from "./check/index.ts";

/** Validates the literal at runtime via Zod. The lint rule
 *  `no-as-unknown-cast` forbids the bare schema-cast in test files (it
 *  hides drift); route every fixture through this helper so a renamed
 *  field, dropped block, or new required nesting fails at construction
 *  with a structural error rather than rolling through every check. */
function makeSpec(s: unknown): Spec {
  return Spec.parse(s);
}

describe("checkRepeatingParts", () => {
  test("non-repeating composite produces no issues", () => {
    const spec = makeSpec({
      name: "tooltip",
      kind: "composite",
      parts: {
        trigger: { fromChildren: true, rootClass: "t-tooltip-trigger" },
        content: { root: { kind: "static", tag: "div" }, rootClass: "t-tooltip" },
      },
    });
    expect(checkRepeatingParts(spec)).toEqual([]);
  });

  test("a valid repeating part produces no issues", () => {
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
    expect(checkRepeatingParts(spec)).toEqual([]);
  });

  test("rule 1 — `repeating: true` with `fromChildren: true`", () => {
    const spec = makeSpec({
      name: "pagination",
      kind: "composite",
      parts: {
        root: { root: { kind: "static", tag: "nav" } },
        page: {
          repeating: true,
          fromChildren: true,
          props: { label: { type: "string", description: "Label." } },
        },
      },
    });
    const issues = checkRepeatingParts(spec);
    expect(issues.map((i) => i.path)).toEqual(["parts.page"]);
    expect(issues[0]?.message).toMatch(/fromChildren/);
  });

  test("rule 2 — `repeating: true` with no props", () => {
    const spec = makeSpec({
      name: "pagination",
      kind: "composite",
      parts: {
        root: { root: { kind: "static", tag: "nav" } },
        page: { repeating: true, root: { kind: "static", tag: "a" } },
      },
    });
    const issues = checkRepeatingParts(spec);
    expect(issues.map((i) => i.path)).toEqual(["parts.page"]);
    expect(issues[0]?.message).toMatch(/props/);
  });

  test("rule 2 — `repeating: true` with an empty `props:` map", () => {
    const spec = makeSpec({
      name: "pagination",
      kind: "composite",
      parts: {
        root: { root: { kind: "static", tag: "nav" } },
        page: { repeating: true, root: { kind: "static", tag: "a" }, props: {} },
      },
    });
    const issues = checkRepeatingParts(spec);
    expect(issues.map((i) => i.path)).toEqual(["parts.page"]);
  });

  test("rule 3 — `repeating: true` with nested `parts:` (defer #835)", () => {
    const spec = makeSpec({
      name: "stepper",
      kind: "composite",
      parts: {
        root: { root: { kind: "static", tag: "ol" } },
        step: {
          repeating: true,
          root: { kind: "static", tag: "li" },
          props: { label: { type: "string", description: "Label." } },
          parts: {
            header: { root: { kind: "static", tag: "h3" }, rootClass: "t-stepper-header" },
          },
        },
      },
    });
    const issues = checkRepeatingParts(spec);
    expect(issues.map((i) => i.path)).toEqual(["parts.step"]);
    expect(issues[0]?.message).toMatch(/#835/);
  });

  test("rule 4 — repeating part nested inside another repeating part (defer #834)", () => {
    const spec = makeSpec({
      name: "tree",
      kind: "composite",
      parts: {
        root: { root: { kind: "static", tag: "ul" } },
        node: {
          repeating: true,
          root: { kind: "static", tag: "li" },
          props: { label: { type: "string", description: "Label." } },
          parts: {
            child: {
              repeating: true,
              root: { kind: "static", tag: "li" },
              props: { label: { type: "string", description: "Child label." } },
            },
          },
        },
      },
    });
    const issues = checkRepeatingParts(spec);
    // Both rule 3 (nested parts on repeating) and rule 4 (repeating inside
    // repeating) apply to this shape; both fire.
    const paths = issues.map((i) => i.path).sort();
    expect(paths).toContain("parts.node");
    expect(paths).toContain("parts.node.parts.child");
    expect(issues.some((i) => /#834/.test(i.message))).toBe(true);
  });

  test("rule 5 — two repeating siblings default to the same propName", () => {
    const spec = makeSpec({
      name: "split",
      kind: "composite",
      parts: {
        root: { root: { kind: "static", tag: "div" } },
        item: {
          repeating: true,
          root: { kind: "static", tag: "a" },
          props: { label: { type: "string", description: "Label." } },
        },
        // Both default to `items` by pluralizing.
        item2: {
          repeating: true,
          propName: "items",
          root: { kind: "static", tag: "a" },
          props: { label: { type: "string", description: "Label." } },
        },
      },
    });
    const issues = checkRepeatingParts(spec);
    expect(issues.some((i) => /propName/i.test(i.message))).toBe(true);
  });

  test("rule 5 — two repeating siblings with distinct propNames produce no collision", () => {
    const spec = makeSpec({
      name: "split",
      kind: "composite",
      parts: {
        root: { root: { kind: "static", tag: "div" } },
        primary: {
          repeating: true,
          root: { kind: "static", tag: "a" },
          props: { label: { type: "string", description: "Label." } },
        },
        secondary: {
          repeating: true,
          root: { kind: "static", tag: "a" },
          props: { label: { type: "string", description: "Label." } },
        },
      },
    });
    expect(checkRepeatingParts(spec)).toEqual([]);
  });

  test("rule 10 — hyphenated propName is not a valid JS identifier", () => {
    const spec = makeSpec({
      name: "pagination",
      kind: "composite",
      parts: {
        root: { root: { kind: "static", tag: "nav" }, rootClass: "t-pagination" },
        page: {
          repeating: true,
          propName: "page-items",
          root: { kind: "static", tag: "span" },
          props: { label: { type: "string", description: "Label." } },
        },
      },
    });
    const issues = checkRepeatingParts(spec);
    expect(issues.some((i) => /not a valid JS identifier/.test(i.message))).toBe(true);
  });

  test("rule 10 — reserved propName collides with codegen locals", () => {
    const reserved = [
      // wrapper-template conventions
      "ref",
      "className",
      "class",
      "children",
      "key",
      "style",
      "id",
      // template locals
      "props",
      "rest",
      "mergedClassName",
      // JS reserved words
      "default",
      "let",
      "class",
      "case",
      "return",
      "yield",
      "await",
    ];
    for (const name of reserved) {
      const spec = makeSpec({
        name: "x",
        kind: "composite",
        parts: {
          root: { root: { kind: "static", tag: "div" } },
          item: {
            repeating: true,
            propName: name,
            root: { kind: "static", tag: "span" },
            props: { label: { type: "string", description: "Label." } },
          },
        },
      });
      const issues = checkRepeatingParts(spec);
      expect(
        issues.some((i) => /collides with a codegen-reserved/.test(i.message)),
        `expected reserved-name rejection for '${name}'`,
      ).toBe(true);
    }
  });

  test("rule 10 — valid camelCase propName is accepted", () => {
    const spec = makeSpec({
      name: "pagination",
      kind: "composite",
      parts: {
        root: { root: { kind: "static", tag: "nav" }, rootClass: "t-pagination" },
        page: {
          repeating: true,
          propName: "pageItems",
          root: { kind: "static", tag: "span" },
          props: { label: { type: "string", description: "Label." } },
        },
      },
    });
    expect(checkRepeatingParts(spec)).toEqual([]);
  });

  test("group-level scalar props on the wrapper part are now accepted (rule 11 lifted)", () => {
    const spec = makeSpec({
      name: "radio",
      kind: "composite",
      parts: {
        group: {
          root: { kind: "static", tag: "div" },
          rootClass: "t-radio",
          props: { name: { type: "string", responsive: false, description: "HTML form name." } },
        },
        option: {
          repeating: true,
          root: { kind: "static", tag: "input" },
          props: { value: { type: "string", description: "Option value." } },
        },
      },
    });
    expect(checkRepeatingParts(spec)).toEqual([]);
  });

  test("rule 12 — `responsive: true` on a repeating item prop is rejected", () => {
    const spec = makeSpec({
      name: "pagination",
      kind: "composite",
      parts: {
        root: { root: { kind: "static", tag: "nav" } },
        page: {
          repeating: true,
          root: { kind: "static", tag: "span" },
          props: {
            label: {
              type: "string",
              slot: true,
              responsive: true,
              description: "Label.",
            },
          },
        },
      },
    });
    const issues = checkRepeatingParts(spec);
    expect(issues.map((i) => i.path)).toContain("parts.page.props.label");
    expect(
      issues.some((i) => /per-item responsive emission is not supported/.test(i.message)),
    ).toBe(true);
  });

  test("rule 13 — multiple non-repeating top-level parts are rejected", () => {
    const spec = makeSpec({
      name: "pagination",
      kind: "composite",
      parts: {
        root: { root: { kind: "static", tag: "nav" } },
        header: { root: { kind: "static", tag: "header" } },
        page: {
          repeating: true,
          root: { kind: "static", tag: "span" },
          props: { label: { type: "string", description: "Label." } },
        },
      },
    });
    const issues = checkRepeatingParts(spec);
    const wrapperRule = issues.filter((i) =>
      /must declare exactly one non-repeating wrapper part/.test(i.message),
    );
    expect(wrapperRule).toHaveLength(2);
    expect(wrapperRule.map((i) => i.path).sort()).toEqual(["parts.header", "parts.root"]);
  });

  test("rule 3 (generalized) — nested `parts:` under the NON-repeating wrapper is rejected", () => {
    const spec = makeSpec({
      name: "pagination",
      kind: "composite",
      parts: {
        root: {
          root: { kind: "static", tag: "nav" },
          parts: {
            header: { root: { kind: "static", tag: "header" }, rootClass: "t-pagination-header" },
          },
        },
        page: {
          repeating: true,
          root: { kind: "static", tag: "span" },
          props: { label: { type: "string", description: "Label." } },
        },
      },
    });
    const issues = checkRepeatingParts(spec);
    expect(issues.some((i) => i.path === "parts.root" && /#835/.test(i.message))).toBe(true);
  });

  test("rule 6 — `propName:` + `groupKey:` both set is rejected", () => {
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
        icon: {
          repeating: true,
          groupKey: "items",
          root: { kind: "static", tag: "span" },
          props: { icon: { type: "string", slot: true, description: "Icon." } },
        },
      },
    });
    const issues = checkRepeatingParts(spec);
    expect(issues.some((i) => i.path === "parts.tab" && /both/.test(i.message))).toBe(true);
  });

  test("rule 7 — two parts sharing groupKey declare the same per-item prop", () => {
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
        icon: {
          repeating: true,
          groupKey: "items",
          root: { kind: "static", tag: "span" },
          props: { label: { type: "string", slot: true, description: "Same name." } },
        },
      },
    });
    const issues = checkRepeatingParts(spec);
    expect(issues.some((i) => /share `groupKey: items`.*'label'/.test(i.message))).toBe(true);
  });

  test("rule 9 — a `groupKey:` value with only one referencing part is rejected", () => {
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
      },
    });
    const issues = checkRepeatingParts(spec);
    expect(issues.some((i) => i.path === "parts.tab" && /no sibling shares/.test(i.message))).toBe(
      true,
    );
  });

  test("rule 5 — two parts sharing `groupKey:` legitimately collapse to the same propName (no rule-5 issue)", () => {
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
        icon: {
          repeating: true,
          groupKey: "items",
          root: { kind: "static", tag: "span" },
          props: { icon: { type: "string", slot: true, description: "Icon." } },
        },
      },
    });
    const issues = checkRepeatingParts(spec);
    expect(issues.some((i) => /collapse to the same propName/.test(i.message))).toBe(false);
  });

  test("rule 15 — `groupKey:` on a non-repeating part is rejected", () => {
    const spec = makeSpec({
      name: "tabs",
      kind: "composite",
      parts: {
        list: { root: { kind: "static", tag: "div" }, groupKey: "items" },
        tab: {
          repeating: true,
          groupKey: "items",
          root: { kind: "static", tag: "button" },
          props: { label: { type: "string", slot: true, description: "Label." } },
        },
        icon: {
          repeating: true,
          groupKey: "items",
          root: { kind: "static", tag: "span" },
          props: { icon: { type: "string", slot: true, description: "Icon." } },
        },
      },
    });
    const issues = checkRepeatingParts(spec);
    expect(
      issues.some((i) => i.path === "parts.list" && /cannot declare `groupKey:`/.test(i.message)),
    ).toBe(true);
  });

  test("rule 10 — `groupKey:` value validated as a JS identifier (hyphen rejected)", () => {
    const spec = makeSpec({
      name: "tabs",
      kind: "composite",
      parts: {
        list: { root: { kind: "static", tag: "div" } },
        tab: {
          repeating: true,
          groupKey: "tab-items",
          root: { kind: "static", tag: "button" },
          props: { label: { type: "string", slot: true, description: "Label." } },
        },
        icon: {
          repeating: true,
          groupKey: "tab-items",
          root: { kind: "static", tag: "span" },
          props: { icon: { type: "string", slot: true, description: "Icon." } },
        },
      },
    });
    const issues = checkRepeatingParts(spec);
    expect(
      issues.some(
        (i) => /from groupKey/.test(i.message) && /not a valid JS identifier/.test(i.message),
      ),
    ).toBe(true);
  });

  test("rule 16 — a group prop that is both `slot: true` AND `responsive: true` emits BOTH issues", () => {
    const spec = makeSpec({
      name: "tabs",
      kind: "composite",
      parts: {
        list: {
          root: { kind: "static", tag: "div" },
          props: {
            label: {
              type: "string",
              slot: true,
              responsive: true,
              description: "Both forbidden shapes.",
            },
          },
        },
        tab: {
          repeating: true,
          groupKey: "items",
          root: { kind: "static", tag: "button" },
          props: { label: { type: "string", slot: true, description: "Tab label." } },
        },
        "tab-icon": {
          repeating: true,
          groupKey: "items",
          root: { kind: "static", tag: "span" },
          props: { icon: { type: "string", slot: true, description: "Icon." } },
        },
      },
    });
    const issues = checkRepeatingParts(spec);
    expect(
      issues.some((i) => /wrapper props flow through without responsive expansion/.test(i.message)),
    ).toBe(true);
    expect(
      issues.some((i) => /wrapper renders the repeating loop, not slot content/.test(i.message)),
    ).toBe(true);
  });

  test("rule 16 — `slot: true` on a group-level wrapper prop is rejected", () => {
    const spec = makeSpec({
      name: "tabs",
      kind: "composite",
      parts: {
        list: {
          root: { kind: "static", tag: "div" },
          props: {
            label: {
              type: "string",
              slot: true,
              description: "Wrapper has no slot body — should be rejected.",
            },
          },
        },
        tab: {
          repeating: true,
          groupKey: "items",
          root: { kind: "static", tag: "button" },
          props: { label: { type: "string", slot: true, description: "Tab label." } },
        },
        "tab-icon": {
          repeating: true,
          groupKey: "items",
          root: { kind: "static", tag: "span" },
          props: { icon: { type: "string", slot: true, description: "Icon." } },
        },
      },
    });
    const issues = checkRepeatingParts(spec);
    expect(
      issues.some((i) => /wrapper renders the repeating loop, not slot content/.test(i.message)),
    ).toBe(true);
  });

  test("rule 16 — `pattern: controllable` on a group-level wrapper prop is rejected", () => {
    const spec = makeSpec({
      name: "tabs",
      kind: "composite",
      parts: {
        list: {
          root: { kind: "static", tag: "div" },
          props: {
            value: {
              type: "boolean",
              pattern: "controllable",
              description: "Selection (controllable forbidden until events land).",
            },
          },
        },
        tab: {
          repeating: true,
          groupKey: "items",
          root: { kind: "static", tag: "button" },
          props: { label: { type: "string", slot: true, description: "Tab label." } },
        },
        "tab-icon": {
          repeating: true,
          groupKey: "items",
          root: { kind: "static", tag: "span" },
          props: { icon: { type: "string", slot: true, description: "Icon." } },
        },
      },
    });
    const issues = checkRepeatingParts(spec);
    expect(issues.some((i) => /default<Name>` \/ `on<Name>Change/.test(i.message))).toBe(true);
  });

  test("rule 16 — `responsive: true` on a group-level scalar wrapper prop is rejected", () => {
    const spec = makeSpec({
      name: "tabs",
      kind: "composite",
      parts: {
        list: {
          root: { kind: "static", tag: "div" },
          props: {
            label: {
              type: "string",
              responsive: true,
              description: "Accessible label (responsive forbidden).",
            },
          },
        },
        tab: {
          repeating: true,
          groupKey: "items",
          root: { kind: "static", tag: "button" },
          props: { label: { type: "string", slot: true, description: "Tab label." } },
        },
        "tab-icon": {
          repeating: true,
          groupKey: "items",
          root: { kind: "static", tag: "span" },
          props: { icon: { type: "string", slot: true, description: "Icon." } },
        },
      },
    });
    const issues = checkRepeatingParts(spec);
    expect(issues.map((i) => i.path)).toContain("parts.list.props.label");
    expect(
      issues.some((i) => /wrapper props flow through without responsive expansion/.test(i.message)),
    ).toBe(true);
  });

  test("rule 15 — `propName:` on a non-repeating part is rejected", () => {
    const spec = makeSpec({
      name: "pagination",
      kind: "composite",
      parts: {
        root: { root: { kind: "static", tag: "nav" }, propName: "navs" },
        page: {
          repeating: true,
          root: { kind: "static", tag: "span" },
          props: { label: { type: "string", description: "Label." } },
        },
      },
    });
    const issues = checkRepeatingParts(spec);
    expect(issues.map((i) => i.path)).toContain("parts.root");
    expect(
      issues.some((i) => /only consumed for parts with `repeating: true`/.test(i.message)),
    ).toBe(true);
  });

  test("rule 14 — item prop name with a hyphen is rejected", () => {
    const spec = makeSpec({
      name: "pagination",
      kind: "composite",
      parts: {
        root: { root: { kind: "static", tag: "nav" } },
        page: {
          repeating: true,
          root: { kind: "static", tag: "span" },
          props: {
            "aria-label": { type: "string", description: "Aria label (forbidden — hyphen)." },
          },
        },
      },
    });
    const issues = checkRepeatingParts(spec);
    expect(issues.map((i) => i.path)).toContain("parts.page.props.aria-label");
    expect(issues.some((i) => /not a valid JS identifier/.test(i.message))).toBe(true);
  });

  test("rule 13 — zero non-repeating parts in a list composite is rejected", () => {
    const spec = makeSpec({
      name: "only-repeating",
      kind: "composite",
      parts: {
        item: {
          repeating: true,
          root: { kind: "static", tag: "span" },
          props: { label: { type: "string", description: "Label." } },
        },
      },
    });
    const issues = checkRepeatingParts(spec);
    expect(issues.some((i) => /found 0/.test(i.message))).toBe(true);
  });

  test("rule 11 — non-repeating part WITHOUT scalar props is accepted (tokens/a11y still ok)", () => {
    const spec = makeSpec({
      name: "pagination",
      kind: "composite",
      parts: {
        root: {
          root: { kind: "static", tag: "nav" },
          rootClass: "t-pagination",
          a11y: { role: "navigation" },
          tokens: { gap: { fallback: "--t-space-2", desc: "Gap." } },
        },
        page: {
          repeating: true,
          root: { kind: "static", tag: "span" },
          props: { label: { type: "string", description: "Label." } },
        },
      },
    });
    expect(checkRepeatingParts(spec)).toEqual([]);
  });

  test("rule 8 — repeating part declares `props.id` (reserved)", () => {
    const spec = makeSpec({
      name: "pagination",
      kind: "composite",
      parts: {
        root: { root: { kind: "static", tag: "nav" } },
        page: {
          repeating: true,
          root: { kind: "static", tag: "a" },
          props: {
            id: { type: "string", description: "Author id (forbidden — reserved)." },
            label: { type: "string", description: "Label." },
          },
        },
      },
    });
    const issues = checkRepeatingParts(spec);
    expect(issues.map((i) => i.path)).toEqual(["parts.page.props.id"]);
    expect(issues[0]?.message).toMatch(/reserved/i);
  });
});
