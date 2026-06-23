import { describe, expect, test } from "vitest";
import type { Vocabulary } from "./lib/vocabulary.ts";
import { Spec } from "./schema.ts";
import {
  checkConstraintsAgainstCoverage,
  checkConstraintsAgainstExamples,
  checkRepeatingParts,
  checkStateMachines,
  levenshtein,
  suggest,
} from "./semantic-checks.ts";

const vocabulary: Vocabulary = {
  components: ["Button", "Stack"],
  props: ["size", "variant", "intent", "disabled", "loading"],
  propDescriptions: {},
  variants: ["solid", "outline", "ghost", "link"],
  intents: ["primary", "neutral", "danger", "success", "warning"],
  sizes: ["sm", "md", "lg"],
  sizeMap: { sm: 2, md: 4, lg: 6 },
  states: ["disabled", "loading", "error", "success"],
  parts: [],
  events: {
    verbs: {
      dismiss: "Surface closed.",
      change: "Value changed.",
      select: "User chose an item.",
      add: "Item added.",
      reach: "Sentinel reached.",
      activate: "Primary action.",
    },
    synonyms: {
      close: "dismiss",
      update: "change",
      press: "activate",
      open: "—",
    },
    pattern: "^([a-z]+|[a-z]+([A-Z][a-zA-Z0-9]+)+)$",
    builtins: {
      File: "DOM File.",
      Date: "ECMAScript Date.",
    },
  },
  dom_events: {
    click: "Pointer click.",
    pointerenter: "Pointer entered.",
    pointerleave: "Pointer left.",
    focusin: "Focus moved in.",
    focusout: "Focus moved out.",
  },
  keys: {
    escape: "Escape key.",
    enter: "Enter key.",
    tab: "Tab key.",
  },
  formControl: {
    elements: ["input", "textarea", "select"],
    props: {
      name: { type: "string", description: "HTML form field name." },
      form: { type: "string", description: "Form id association." },
      required: { type: "boolean", description: "Required field." },
      readOnly: { type: "boolean", description: "Read-only field." },
      disabled: { type: "boolean", description: "Disabled field." },
    },
  },
};

function makeButton(overrides: Partial<Spec> = {}): Spec {
  return Spec.parse({
    name: "button",
    kind: "atomic",
    element: "button",
    rootClass: "t-button",
    variants: { solid: { description: "Filled." }, outline: { description: "Outlined." } },
    intents: {
      primary: { description: "Primary." },
      danger: { description: "Danger." },
    },
    sizes: { sm: { description: "Small." }, md: { description: "Medium." } },
    tokens: {
      bg: { fallback: "--t-accent", desc: "Background." },
      fg: { fallback: "--t-on-accent", desc: "Foreground." },
    },
    ...overrides,
  });
}

/** Validates the literal at runtime via Zod. The lint rule
 *  `no-as-unknown-cast` forbids the bare schema-cast in test files (it
 *  hides drift); route every fixture through this helper so a renamed
 *  field, dropped block, or new required nesting fails at construction
 *  with a structural error rather than rolling through every check. */
function makeSpec(s: unknown): Spec {
  return Spec.parse(s);
}

describe("levenshtein + suggest", () => {
  test("levenshtein is symmetric and zero for equal strings", () => {
    expect(levenshtein("danger", "danger")).toBe(0);
    expect(levenshtein("danger", "destructive")).toBe(levenshtein("destructive", "danger"));
  });

  test("suggest finds a close-by name", () => {
    expect(suggest("dissabled", ["disabled", "loading"])).toBe("disabled");
  });

  test("suggest returns undefined when nothing is within range", () => {
    expect(suggest("destructive", ["danger", "success"], 3)).toBeUndefined();
  });
});

describe("checkConstraintsAgainstExamples", () => {
  test("flags an example that matches `when:` and uses a `forbid:` value", () => {
    const spec = makeButton({
      constraints: [
        {
          when: { variant: "outline" },
          forbid: { intent: ["danger"] },
          reason: "Outline-danger has no surface to apply to.",
        },
      ],
      examples: [{ id: "outline-danger", props: { variant: "outline", intent: "danger" } }],
    });
    const issues = checkConstraintsAgainstExamples(spec);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe("examples.outline-danger");
  });

  test("passes a constraint whose `when:` does not match", () => {
    const spec = makeButton({
      constraints: [
        {
          when: { variant: "outline" },
          forbid: { intent: ["danger"] },
          reason: "n/a",
        },
      ],
      examples: [{ id: "solid-danger", props: { variant: "solid", intent: "danger" } }],
    });
    expect(checkConstraintsAgainstExamples(spec)).toEqual([]);
  });
});

describe("checkConstraintsAgainstCoverage", () => {
  test("prunes constraint-violating cells (coverage expansion drops them)", () => {
    const spec = makeButton({
      constraints: [
        {
          when: { variant: "outline" },
          forbid: { intent: ["danger"] },
          reason: "No surface.",
        },
      ],
      coverage: { variant: true, intent: true },
    });
    // Constraints prune the cell set before expansion. The check walks the
    // pruned set; the violating cell (outline × danger) is excluded, so the
    // check is silent.
    expect(checkConstraintsAgainstCoverage(spec)).toEqual([]);
  });

  test("does not flag a coverage block that constraints leave alone", () => {
    const spec = makeButton({
      constraints: [
        {
          when: { variant: "outline" },
          forbid: { intent: ["danger"] },
          reason: "n/a",
        },
      ],
      coverage: { variant: ["solid"], intent: true },
    });
    expect(checkConstraintsAgainstCoverage(spec)).toEqual([]);
  });
});

describe("checkRepeatingParts", () => {
  test("non-repeating composite produces no issues", () => {
    const spec = makeSpec({
      name: "tooltip",
      kind: "composite",
      parts: {
        trigger: { fromChildren: true, rootClass: "t-tooltip-trigger" },
        content: { element: "div", rootClass: "t-tooltip" },
      },
    });
    expect(checkRepeatingParts(spec)).toEqual([]);
  });

  test("a valid repeating part produces no issues", () => {
    const spec = makeSpec({
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
    });
    expect(checkRepeatingParts(spec)).toEqual([]);
  });

  test("rule 1 — `repeating: true` with `fromChildren: true`", () => {
    const spec = makeSpec({
      name: "pagination",
      kind: "composite",
      parts: {
        root: { element: "nav" },
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
        root: { element: "nav" },
        page: { repeating: true, element: "a" },
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
        root: { element: "nav" },
        page: { repeating: true, element: "a", props: {} },
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
        root: { element: "ol" },
        step: {
          repeating: true,
          element: "li",
          props: { label: { type: "string", description: "Label." } },
          parts: {
            header: { element: "h3", rootClass: "t-stepper-header" },
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
        root: { element: "ul" },
        node: {
          repeating: true,
          element: "li",
          props: { label: { type: "string", description: "Label." } },
          parts: {
            child: {
              repeating: true,
              element: "li",
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
        root: { element: "div" },
        item: {
          repeating: true,
          element: "a",
          props: { label: { type: "string", description: "Label." } },
        },
        // Both default to `items` by pluralizing.
        item2: {
          repeating: true,
          propName: "items",
          element: "a",
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
        root: { element: "div" },
        primary: {
          repeating: true,
          element: "a",
          props: { label: { type: "string", description: "Label." } },
        },
        secondary: {
          repeating: true,
          element: "a",
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
        root: { element: "nav", rootClass: "t-pagination" },
        page: {
          repeating: true,
          propName: "page-items",
          element: "span",
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
          root: { element: "div" },
          item: {
            repeating: true,
            propName: name,
            element: "span",
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
        root: { element: "nav", rootClass: "t-pagination" },
        page: {
          repeating: true,
          propName: "pageItems",
          element: "span",
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
          element: "div",
          rootClass: "t-radio",
          props: { name: { type: "string", responsive: false, description: "HTML form name." } },
        },
        option: {
          repeating: true,
          element: "input",
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
        root: { element: "nav" },
        page: {
          repeating: true,
          element: "span",
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
        root: { element: "nav" },
        header: { element: "header" },
        page: {
          repeating: true,
          element: "span",
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
          element: "nav",
          parts: { header: { element: "header", rootClass: "t-pagination-header" } },
        },
        page: {
          repeating: true,
          element: "span",
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
        list: { element: "div" },
        tab: {
          repeating: true,
          propName: "override",
          groupKey: "items",
          element: "button",
          props: { label: { type: "string", slot: true, description: "Label." } },
        },
        icon: {
          repeating: true,
          groupKey: "items",
          element: "span",
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
        list: { element: "div" },
        tab: {
          repeating: true,
          groupKey: "items",
          element: "button",
          props: { label: { type: "string", slot: true, description: "Label." } },
        },
        icon: {
          repeating: true,
          groupKey: "items",
          element: "span",
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
        list: { element: "div" },
        tab: {
          repeating: true,
          groupKey: "items",
          element: "button",
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
        list: { element: "div" },
        tab: {
          repeating: true,
          groupKey: "items",
          element: "button",
          props: { label: { type: "string", slot: true, description: "Label." } },
        },
        icon: {
          repeating: true,
          groupKey: "items",
          element: "span",
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
        list: { element: "div", groupKey: "items" },
        tab: {
          repeating: true,
          groupKey: "items",
          element: "button",
          props: { label: { type: "string", slot: true, description: "Label." } },
        },
        icon: {
          repeating: true,
          groupKey: "items",
          element: "span",
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
        list: { element: "div" },
        tab: {
          repeating: true,
          groupKey: "tab-items",
          element: "button",
          props: { label: { type: "string", slot: true, description: "Label." } },
        },
        icon: {
          repeating: true,
          groupKey: "tab-items",
          element: "span",
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
          element: "div",
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
          element: "button",
          props: { label: { type: "string", slot: true, description: "Tab label." } },
        },
        "tab-icon": {
          repeating: true,
          groupKey: "items",
          element: "span",
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
          element: "div",
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
          element: "button",
          props: { label: { type: "string", slot: true, description: "Tab label." } },
        },
        "tab-icon": {
          repeating: true,
          groupKey: "items",
          element: "span",
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
          element: "div",
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
          element: "button",
          props: { label: { type: "string", slot: true, description: "Tab label." } },
        },
        "tab-icon": {
          repeating: true,
          groupKey: "items",
          element: "span",
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
          element: "div",
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
          element: "button",
          props: { label: { type: "string", slot: true, description: "Tab label." } },
        },
        "tab-icon": {
          repeating: true,
          groupKey: "items",
          element: "span",
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
        root: { element: "nav", propName: "navs" },
        page: {
          repeating: true,
          element: "span",
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
        root: { element: "nav" },
        page: {
          repeating: true,
          element: "span",
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
          element: "span",
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
          element: "nav",
          rootClass: "t-pagination",
          a11y: { role: "navigation" },
          tokens: { gap: { fallback: "--t-space-2", desc: "Gap." } },
        },
        page: {
          repeating: true,
          element: "span",
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
        root: { element: "nav" },
        page: {
          repeating: true,
          element: "a",
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

describe("checkStateMachines (RFC-0007)", () => {
  const baseOverlay = {
    anchor: "trigger",
    anchorVar: "--t-modal-anchor",
    mode: "manual" as const,
    modal: false,
  };
  const baseEvents = {
    dismiss: {
      description: "Closed.",
      payload: { reason: { type: "enum", values: ["outside", "escape", "button"] } },
    },
  };

  function modalSpec(contentExtras: Record<string, unknown> = {}): Spec {
    return makeSpec({
      name: "modal",
      kind: "composite",
      events: baseEvents,
      parts: {
        trigger: {
          fromChildren: true,
          props: {
            open: {
              type: "boolean",
              default: false,
              pattern: "controllable",
              responsive: false,
              description: "Open state.",
            },
          },
        },
        content: {
          element: "div",
          overlay: baseOverlay,
          ...contentExtras,
        },
      },
    });
  }

  test("rule 1 — empty states: rejected", () => {
    const spec = modalSpec({ states: {} });
    const issues = checkStateMachines(spec, vocabulary);
    expect(issues.some((i) => /\bis empty\b/.test(i.message))).toBe(true);
  });

  test("rule 2 — transition `to:` must resolve in the same part's states map", () => {
    const spec = modalSpec({
      states: {
        closed: { on: { "trigger.click": "open" } },
        open: { on: { "trigger.click": { to: "missing" } } },
      },
    });
    const issues = checkStateMachines(spec, vocabulary);
    expect(issues.some((i) => /target 'missing'/.test(i.message))).toBe(true);
  });

  test("rule 3 — source prefix must match a part in the spec", () => {
    const spec = modalSpec({
      states: {
        closed: { on: { "ghost.click": "open" } },
        open: {},
      },
    });
    const issues = checkStateMachines(spec, vocabulary);
    expect(issues.some((i) => /source prefix 'ghost'/.test(i.message))).toBe(true);
  });

  test("rule 3 — key.<name> must match key vocabulary", () => {
    const spec = modalSpec({
      states: {
        closed: { on: { "key.bogus": "open" } },
        open: {},
      },
    });
    const issues = checkStateMachines(spec, vocabulary);
    expect(issues.some((i) => /key name 'bogus'/.test(i.message))).toBe(true);
  });

  test("rule 3 — DOM event must match dom_events vocabulary", () => {
    const spec = modalSpec({
      states: {
        closed: { on: { "trigger.tappp": "open" } },
        open: {},
      },
    });
    const issues = checkStateMachines(spec, vocabulary);
    expect(issues.some((i) => /DOM event 'tappp'/.test(i.message))).toBe(true);
  });

  test("rule 3a — duplicate part names across the parts tree are rejected", () => {
    const spec = makeSpec({
      name: "card",
      kind: "composite",
      parts: {
        header: {
          element: "header",
          parts: {
            inner: { element: "div" },
          },
        },
        body: {
          element: "div",
          parts: {
            inner: { element: "div" },
          },
        },
      },
    });
    const issues = checkStateMachines(spec, vocabulary);
    expect(issues.some((i) => /part name 'inner'/.test(i.message))).toBe(true);
  });

  test("rule 5 — `emits:` must reference a declared root event", () => {
    const spec = modalSpec({
      states: {
        closed: {
          on: {
            "trigger.click": { to: "open", emits: { ghostEvent: { reason: "button" } } },
          },
        },
        open: {},
      },
    });
    const issues = checkStateMachines(spec, vocabulary);
    expect(issues.some((i) => /'ghostEvent' is not declared in root/.test(i.message))).toBe(true);
  });

  test("rule 5 — emits payload literal must match declared enum values", () => {
    const spec = modalSpec({
      states: {
        closed: {
          on: {
            "trigger.click": { to: "open", emits: { dismiss: { reason: "swipe" } } },
          },
        },
        open: {},
      },
    });
    const issues = checkStateMachines(spec, vocabulary);
    expect(issues.some((i) => /value 'swipe' is not in the declared enum/.test(i.message))).toBe(
      true,
    );
  });

  test("rule 6 — overlay anchor must name a sibling part with fromChildren: true", () => {
    const spec = makeSpec({
      name: "modal",
      kind: "composite",
      parts: {
        trigger: {},
        content: { element: "div", overlay: baseOverlay },
      },
    });
    const issues = checkStateMachines(spec, vocabulary);
    expect(
      issues.some((i) =>
        /must declare `fromChildren: true` to serve as an overlay anchor/.test(i.message),
      ),
    ).toBe(true);
  });

  test("rule 6 — overlay anchor must point at an existing sibling", () => {
    const spec = makeSpec({
      name: "modal",
      kind: "composite",
      parts: {
        content: { element: "div", overlay: baseOverlay },
      },
    });
    const issues = checkStateMachines(spec, vocabulary);
    expect(issues.some((i) => /is not a sibling part of 'content'/.test(i.message))).toBe(true);
  });

  test("rule 7 — outside.* sources only on overlay parts", () => {
    const spec = makeSpec({
      name: "modal",
      kind: "composite",
      parts: {
        trigger: {
          fromChildren: true,
          states: {
            closed: { on: { "outside.click": "open" } },
            open: {},
          },
        },
        content: { element: "div", overlay: baseOverlay },
      },
    });
    const issues = checkStateMachines(spec, vocabulary);
    expect(issues.some((i) => /only valid on parts that declare `overlay:`/.test(i.message))).toBe(
      true,
    );
  });

  test("rule 9 — controllable boolean prop must mirror a declared state name", () => {
    const spec = modalSpec({
      props: {
        active: {
          type: "boolean",
          default: false,
          pattern: "controllable",
          responsive: false,
          description: "Active.",
        },
      },
      states: {
        closed: { on: { "trigger.click": "open" } },
        open: { on: { "trigger.click": "closed" } },
      },
    });
    const issues = checkStateMachines(spec, vocabulary);
    expect(issues.some((i) => /'active' must mirror a state name/.test(i.message))).toBe(true);
  });

  test("rule 10 — when: must use the `[!]<part>.<bool-prop>` grammar", () => {
    const spec = modalSpec({
      states: {
        closed: {
          on: { "trigger.click": { to: "open", when: "open && enabled" } },
        },
        open: {},
      },
    });
    const issues = checkStateMachines(spec, vocabulary);
    expect(issues.some((i) => /does not match the supported grammar/.test(i.message))).toBe(true);
  });

  test("rule 10 — when: must reference a boolean prop on the named part", () => {
    const spec = modalSpec({
      states: {
        closed: {
          on: { "trigger.click": { to: "open", when: "!trigger.title" } },
        },
        open: {},
      },
    });
    // The fixture's trigger declares `open: boolean` (controllable) but no
    // `title` prop — the guard reference should fail to resolve.
    const issues = checkStateMachines(spec, vocabulary);
    expect(issues.some((i) => /references prop 'title'/.test(i.message))).toBe(true);
  });

  test("after: must reference a declared `type: number` prop on the same part", () => {
    const spec = modalSpec({
      states: {
        closed: {
          on: { "trigger.click": { to: "open", after: "missingDelay" } },
        },
        open: {},
      },
    });
    const issues = checkStateMachines(spec, vocabulary);
    expect(issues.some((i) => /'missingDelay'.*reference a prop/.test(i.message))).toBe(true);
  });

  test("accepts a fully-wired modal spec", () => {
    const spec = makeSpec({
      name: "modal",
      kind: "composite",
      events: baseEvents,
      parts: {
        trigger: {
          fromChildren: true,
          props: {
            open: {
              type: "boolean",
              default: false,
              pattern: "controllable",
              responsive: false,
              description: "Open.",
            },
          },
        },
        content: {
          element: "div",
          overlay: { ...baseOverlay, modal: true },
          states: {
            closed: { on: { "trigger.click": "open" } },
            open: {
              on: {
                "trigger.click": { to: "closed", emits: { dismiss: { reason: "button" } } },
                "key.escape": { to: "closed", emits: { dismiss: { reason: "escape" } } },
                "outside.click": { to: "closed", emits: { dismiss: { reason: "outside" } } },
              },
            },
          },
        },
      },
    });
    expect(checkStateMachines(spec, vocabulary)).toEqual([]);
  });
});
