import { describe, expect, test } from "vitest";
import type { Vocabulary } from "./lib/vocabulary.ts";
import { Spec } from "./schema.ts";
import {
  checkAsIsConstrained,
  checkConstraintsAgainstCoverage,
  checkConstraintsAgainstExamples,
  checkElementByProp,
  checkEvents,
  checkEventsRuntimeSupport,
  checkFormControl,
  checkImperativeProps,
  checkPolymorphicAtomic,
  checkRepeatingParts,
  checkResponsiveExplicit,
  checkStateMachines,
  checkVocabulary,
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

describe("checkVocabulary", () => {
  test("flags an unknown variant with a suggestion", () => {
    const spec = makeButton({
      variants: { destructive: { description: "Bad." } },
    });
    const issues = checkVocabulary(spec, vocabulary);
    expect(issues.map((i) => i.message)).toEqual(
      expect.arrayContaining([expect.stringMatching(/'destructive' is not a canonical variant/)]),
    );
  });

  test("does not flag a component-specific prop name (`iconStart`)", () => {
    const spec = makeButton({
      props: { iconStart: { type: "string", slot: true, description: "Start icon." } },
    });
    expect(checkVocabulary(spec, vocabulary)).toEqual([]);
  });

  test("flags a typo of a canonical prop name", () => {
    const spec = makeButton({
      props: { loadng: { type: "boolean", description: "Loading." } },
    });
    const issues = checkVocabulary(spec, vocabulary);
    expect(issues[0]?.message).toMatch(/typo of the canonical prop 'loading'/);
  });
});

describe("checkResponsiveExplicit", () => {
  test("flags a non-slot prop that omits `responsive:`", () => {
    const spec = makeButton({
      props: { loading: { type: "boolean", description: "Loading." } },
    });
    const issues = checkResponsiveExplicit(spec);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe("props.loading.responsive");
  });

  test("accepts `responsive: false`", () => {
    const spec = makeButton({
      props: {
        loading: { type: "boolean", responsive: false, description: "Loading." },
      },
    });
    expect(checkResponsiveExplicit(spec)).toEqual([]);
  });

  test("accepts `responsive: true`", () => {
    const spec = makeButton({
      props: {
        block: { type: "boolean", responsive: true, description: "Block layout." },
      },
    });
    expect(checkResponsiveExplicit(spec)).toEqual([]);
  });

  test("exempts a slot prop", () => {
    const spec = makeButton({
      props: {
        iconStart: { type: "string", slot: true, description: "Start icon." },
      },
    });
    expect(checkResponsiveExplicit(spec)).toEqual([]);
  });

  test("walks composite parts", () => {
    const spec = makeSpec({
      name: "popover",
      kind: "composite",
      parts: {
        content: {
          props: { open: { type: "boolean", description: "Open." } },
        },
      },
    });
    const issues = checkResponsiveExplicit(spec);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe("parts.content.props.open.responsive");
  });
});

describe("checkAsIsConstrained", () => {
  test("flags an `as` prop that omits `values:`", () => {
    const spec = makeButton({
      props: {
        as: { type: "string", responsive: false, description: "Polymorphic root." },
      },
    });
    const issues = checkAsIsConstrained(spec);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe("props.as.values");
  });

  test("accepts `as` with a closed values: list that includes the fallback element", () => {
    const spec = makeButton({
      props: {
        as: {
          type: "string",
          values: ["button", "a"],
          default: "button",
          responsive: false,
          description: "Polymorphic root.",
        },
      },
    });
    expect(checkAsIsConstrained(spec)).toEqual([]);
  });

  test("flags `values:` that omits the fallback element", () => {
    const spec = makeButton({
      props: {
        as: {
          type: "string",
          values: ["a", "span"],
          responsive: false,
          description: "Polymorphic root.",
        },
      },
    });
    const issues = checkAsIsConstrained(spec);
    expect(issues.some((i) => i.message.includes("'button'"))).toBe(true);
  });

  test("flags a `default:` that is not in `values:`", () => {
    const spec = makeButton({
      props: {
        as: {
          type: "string",
          values: ["button", "a"],
          default: "div",
          responsive: false,
          description: "Polymorphic root.",
        },
      },
    });
    const issues = checkAsIsConstrained(spec);
    expect(issues.some((i) => i.path === "props.as.default")).toBe(true);
  });

  test("flags `as` declared as a non-string type", () => {
    const spec = makeButton({
      props: {
        as: { type: "boolean", responsive: false, description: "Bogus." },
      },
    });
    const issues = checkAsIsConstrained(spec);
    expect(issues.some((i) => i.path === "props.as.type")).toBe(true);
  });

  test("walks composite parts", () => {
    const spec = makeSpec({
      name: "popover",
      kind: "composite",
      parts: {
        trigger: {
          props: { as: { type: "string", description: "Polymorphic trigger." } },
        },
      },
    });
    const issues = checkAsIsConstrained(spec);
    expect(issues.some((i) => i.path === "parts.trigger.props.as.values")).toBe(true);
  });
});

describe("checkElementByProp", () => {
  function headingSpec(overrides: Record<string, unknown> = {}): Spec {
    return makeSpec({
      name: "heading",
      kind: "atomic",
      rootClass: "t-heading",
      elementByProp: {
        prop: "level",
        map: { "1": "h1", "2": "h2", "3": "h3" },
      },
      props: {
        level: {
          type: "string",
          values: ["1", "2", "3"],
          description: "Heading level.",
        },
      },
      ...overrides,
    });
  }

  test("passes when prop type + values match the map keys", () => {
    expect(checkElementByProp(headingSpec())).toEqual([]);
  });

  test("rejects `elementByProp` siblinged with `element`", () => {
    const spec = headingSpec({ element: "h1" });
    const issues = checkElementByProp(spec);
    expect(issues.some((i) => i.path === "elementByProp")).toBe(true);
    expect(issues.find((i) => i.path === "elementByProp")?.message).toMatch(/mutually exclusive/);
  });

  test("rejects when the controlling prop is missing", () => {
    const spec = makeSpec({
      name: "heading",
      kind: "atomic",
      elementByProp: { prop: "level", map: { "1": "h1" } },
      props: { other: { type: "string", description: "x." } },
    });
    const issues = checkElementByProp(spec);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe("elementByProp.prop");
    expect(issues[0]?.message).toMatch(/not declared/);
  });

  test("rejects when the controlling prop is boolean (v1 is string-only)", () => {
    const spec = makeSpec({
      name: "list",
      kind: "atomic",
      elementByProp: { prop: "ordered", map: { true: "ol", false: "ul" } },
      props: { ordered: { type: "boolean", description: "Ordered." } },
    });
    const issues = checkElementByProp(spec);
    expect(issues.some((i) => i.path === "elementByProp.prop")).toBe(true);
  });

  test("rejects when a prop value is missing from the map", () => {
    const spec = makeSpec({
      name: "heading",
      kind: "atomic",
      elementByProp: { prop: "level", map: { "1": "h1" } },
      props: {
        level: { type: "string", values: ["1", "2"], description: "Level." },
      },
    });
    const issues = checkElementByProp(spec);
    expect(issues.some((i) => i.message.includes("[2] are not in the map"))).toBe(true);
  });

  test("rejects when a map key is missing from the prop values", () => {
    const spec = makeSpec({
      name: "heading",
      kind: "atomic",
      elementByProp: { prop: "level", map: { "1": "h1", "9": "h9" } },
      props: {
        level: { type: "string", values: ["1"], description: "Level." },
      },
    });
    const issues = checkElementByProp(spec);
    expect(issues.some((i) => i.message.includes("[9] are not declared"))).toBe(true);
  });

  test("walks composite parts", () => {
    const spec = makeSpec({
      name: "field",
      kind: "composite",
      parts: {
        title: {
          elementByProp: { prop: "level", map: { "1": "h1" } },
          props: {
            level: { type: "string", values: ["1", "2"], description: "Level." },
          },
        },
      },
    });
    const issues = checkElementByProp(spec);
    expect(issues.some((i) => i.path === "parts.title.elementByProp.map")).toBe(true);
  });
});

describe("checkPolymorphicAtomic", () => {
  test("passes when polymorphic is unset", () => {
    const spec = makeSpec({
      name: "divider",
      kind: "atomic",
      element: "div",
    });
    expect(checkPolymorphicAtomic(spec)).toEqual([]);
  });

  test("passes when polymorphic is set on a child-bearing element with no `as` prop", () => {
    const spec = makeSpec({
      name: "divider",
      kind: "atomic",
      element: "div",
      polymorphic: "asChild",
    });
    expect(checkPolymorphicAtomic(spec)).toEqual([]);
  });

  test("rejects polymorphic + sibling `as` prop", () => {
    const spec = makeSpec({
      name: "divider",
      kind: "atomic",
      element: "div",
      polymorphic: "asChild",
      props: {
        as: {
          type: "string",
          values: ["div", "span"],
          description: "Polymorphic.",
        },
      },
    });
    const issues = checkPolymorphicAtomic(spec);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe("polymorphic");
    expect(issues[0]?.message).toMatch(/mutually exclusive/);
  });

  test("rejects polymorphic + declared `asChild` prop (would emit twice)", () => {
    const spec = makeSpec({
      name: "divider",
      kind: "atomic",
      element: "div",
      polymorphic: "asChild",
      props: {
        asChild: { type: "boolean", description: "Manually declared." },
      },
    });
    const issues = checkPolymorphicAtomic(spec);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe("props.asChild");
  });

  test("rejects polymorphic on a void-element root", () => {
    const spec = makeSpec({
      name: "divider",
      kind: "atomic",
      element: "hr",
      polymorphic: "asChild",
    });
    const issues = checkPolymorphicAtomic(spec);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe("polymorphic");
    expect(issues[0]?.message).toMatch(/void element/);
  });

  test("ignores composite specs (polymorphic is atomic-only)", () => {
    const spec = makeSpec({
      name: "tooltip",
      kind: "composite",
      parts: {
        trigger: {
          element: "span",
        },
      },
    });
    expect(checkPolymorphicAtomic(spec)).toEqual([]);
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

describe("checkEvents", () => {
  function makeEvents(events: Record<string, unknown>, extra: Partial<Spec> = {}): Spec {
    return makeButton({
      events: events as Spec["events"],
      ...extra,
    });
  }

  test("returns no issues when events: is absent", () => {
    expect(checkEvents(makeButton(), vocabulary)).toEqual([]);
  });

  test("returns no issues for a declared event with a registered verb", () => {
    const spec = makeEvents({
      dismiss: { description: "Closed.", payload: {} },
    });
    expect(checkEvents(spec, vocabulary)).toEqual([]);
  });

  test("E1: rejects an event name that doesn't match the vocab pattern", () => {
    const spec = makeEvents({
      sort_change: { description: "x", payload: {} },
    });
    const issues = checkEvents(spec, vocabulary);
    expect(issues.map((i) => i.path)).toEqual(["events.sort_change"]);
    expect(issues[0]?.message).toMatch(/valid event name/);
  });

  test("E1: rejects PascalCase event names", () => {
    const spec = makeEvents({
      Dismiss: { description: "x", payload: {} },
    });
    const issues = checkEvents(spec, vocabulary);
    expect(issues.map((i) => i.path)).toEqual(["events.Dismiss"]);
  });

  test("E2: rejects an unregistered verb with a Levenshtein suggestion", () => {
    const spec = makeEvents({
      activatee: { description: "x", payload: {} },
    });
    const issues = checkEvents(spec, vocabulary);
    expect(issues.map((i) => i.path)).toEqual(["events.activatee"]);
    expect(issues[0]?.message).toMatch(/not registered/);
    expect(issues[0]?.message).toMatch(/'activate'/);
  });

  test("E2: extracts the last camelCase token as the verb", () => {
    const spec = makeEvents({
      rowMutate: { description: "x", payload: {} },
    });
    const issues = checkEvents(spec, vocabulary);
    expect(issues[0]?.message).toMatch(/'mutate' is not registered/);
  });

  test("E3: rejects a synonym with the canonical suggestion", () => {
    const spec = makeEvents({
      close: { description: "x", payload: {} },
    });
    const issues = checkEvents(spec, vocabulary);
    expect(issues.map((i) => i.path)).toEqual(["events.close"]);
    expect(issues[0]?.message).toMatch(/synonym for 'dismiss'/);
  });

  test("E3: synonym in subject+verb form is detected by the last token", () => {
    const spec = makeEvents({
      modalClose: { description: "x", payload: {} },
    });
    const issues = checkEvents(spec, vocabulary);
    expect(issues[0]?.message).toMatch(/'close' is registered as a synonym/);
  });

  test("E4: routes the open synonym to pattern: controllable", () => {
    const spec = makeEvents({
      open: { description: "x", payload: {} },
    });
    const issues = checkEvents(spec, vocabulary);
    expect(issues.map((i) => i.path)).toEqual(["events.open"]);
    expect(issues[0]?.message).toMatch(/pattern: "controllable"/);
  });

  test("E5: rejects a generic ref not declared on the spec", () => {
    const spec = makeEvents({
      select: {
        description: "x",
        payload: { item: { type: "generic", ref: "Item" } },
      },
    });
    const issues = checkEvents(spec, vocabulary);
    expect(issues.map((i) => i.path)).toEqual(["events.select.payload.item"]);
    expect(issues[0]?.message).toMatch(/generic 'Item'/);
  });

  test("E5: accepts a generic ref that is declared", () => {
    const spec = makeEvents(
      {
        select: {
          description: "x",
          payload: { item: { type: "generic", ref: "Item" } },
        },
      },
      { generics: [{ name: "Item", description: "Item shape." }] },
    );
    expect(checkEvents(spec, vocabulary)).toEqual([]);
  });

  test("E5: walks generic refs inside array.of", () => {
    const spec = makeEvents({
      select: {
        description: "x",
        payload: {
          items: { type: "array", of: { type: "generic", ref: "Row" } },
        },
      },
    });
    const issues = checkEvents(spec, vocabulary);
    expect(issues.map((i) => i.path)).toEqual(["events.select.payload.items.of"]);
  });

  test("E6: rejects an unregistered builtin name", () => {
    const spec = makeEvents({
      add: {
        description: "x",
        payload: { entry: { type: "builtin", name: "Blob" } },
      },
    });
    const issues = checkEvents(spec, vocabulary);
    expect(issues.map((i) => i.path)).toEqual(["events.add.payload.entry"]);
    expect(issues[0]?.message).toMatch(/built-in type 'Blob'/);
  });

  test("E6: accepts a registered builtin name", () => {
    const spec = makeEvents({
      add: {
        description: "x",
        payload: { file: { type: "builtin", name: "File" } },
      },
    });
    expect(checkEvents(spec, vocabulary)).toEqual([]);
  });

  test("E8: rejects an event name that collides with a controllable callback", () => {
    const spec = makeEvents(
      { valueChange: { description: "x", payload: {} } },
      {
        props: {
          value: {
            type: "string",
            description: "Value.",
            pattern: "controllable",
          },
        },
      },
    );
    const issues = checkEvents(spec, vocabulary);
    expect(issues.some((i) => /onValueChange/.test(i.message))).toBe(true);
  });

  test("E8: composite spec checks controllable props across all parts", () => {
    const spec = makeSpec({
      name: "combobox",
      kind: "composite",
      events: { openChange: { description: "x", payload: {} } },
      parts: {
        root: {
          element: "div",
          props: {
            open: {
              type: "boolean",
              description: "Open state.",
              pattern: "controllable",
            },
          },
        },
      },
    });
    const issues = checkEvents(spec, vocabulary);
    expect(issues.some((i) => /onOpenChange/.test(i.message))).toBe(true);
  });

  test("verb-registered check is mutually exclusive with synonym check", () => {
    // 'close' is a synonym; the verb-not-registered message should NOT also fire.
    const spec = makeEvents({
      close: { description: "x", payload: {} },
    });
    const issues = checkEvents(spec, vocabulary);
    expect(issues.length).toBe(1);
    expect(issues[0]?.message).not.toMatch(/not registered/);
  });

  test("rejects verbs that collide with Object.prototype method names", () => {
    // `in` operator would treat `toString` / `valueOf` / `hasOwnProperty`
    // as registered via inheritance — Object.hasOwn keeps the vocab closed.
    const spec = makeEvents({
      toString: { description: "x", payload: {} },
      valueOf: { description: "x", payload: {} },
      hasOwnProperty: { description: "x", payload: {} },
    });
    const issues = checkEvents(spec, vocabulary);
    expect(issues.length).toBe(3);
    for (const verb of ["toString", "valueOf", "hasOwnProperty"]) {
      expect(issues.some((i) => i.message.includes(`'${verb}'`))).toBe(true);
    }
  });

  test("rejects payload builtin names that collide with Object.prototype", () => {
    const spec = makeEvents({
      add: {
        description: "x",
        payload: { thing: { type: "builtin", name: "toString" } },
      },
    });
    const issues = checkEvents(spec, vocabulary);
    expect(issues.some((i) => /built-in type 'toString'/.test(i.message))).toBe(true);
  });

  test("rejects payload field names that are not valid JS identifiers", () => {
    const spec = makeEvents({
      dismiss: {
        description: "x",
        payload: { "error-code": { type: "string" } },
      },
    });
    const issues = checkEvents(spec, vocabulary);
    expect(issues.map((i) => i.path)).toEqual(["events.dismiss.payload.error-code"]);
    expect(issues[0]?.message).toMatch(/valid payload field name/);
  });

  test("rejects payload field named 'type' (channel discriminator collision)", () => {
    const spec = makeEvents({
      dismiss: {
        description: "x",
        payload: { type: { type: "string" } },
      },
    });
    const issues = checkEvents(spec, vocabulary);
    expect(issues.map((i) => i.path)).toEqual(["events.dismiss.payload.type"]);
    expect(issues[0]?.message).toMatch(/reserved as the channel discriminator/);
  });

  test("rejects generic names that shadow the Array codegen helper", () => {
    const spec = makeButton({ generics: [{ name: "Array", description: "x" }] });
    const issues = checkEvents(spec, vocabulary);
    expect(issues.map((i) => i.path)).toEqual(["generics.Array"]);
    expect(issues[0]?.message).toMatch(/reserved/);
  });

  test("rejects generic names that collide with vocab builtins", () => {
    const spec = makeButton({ generics: [{ name: "File", description: "x" }] });
    const issues = checkEvents(spec, vocabulary);
    expect(issues.map((i) => i.path)).toEqual(["generics.File"]);
  });

  test("rejects duplicate generic names within a spec", () => {
    const spec = makeButton({
      generics: [
        { name: "Item", description: "x" },
        { name: "Item", description: "y" },
      ],
    });
    const issues = checkEvents(spec, vocabulary);
    expect(issues.some((i) => i.path === "generics.Item" && /more than once/.test(i.message))).toBe(
      true,
    );
  });

  test("accepts non-reserved generic names alongside events", () => {
    const spec = makeButton({
      generics: [{ name: "Item", description: "x" }],
      events: {
        select: {
          description: "x",
          payload: { item: { type: "generic", ref: "Item" } },
        },
      },
    });
    expect(checkEvents(spec, vocabulary)).toEqual([]);
  });

  test("rejects each codegen-emitted helper as a generic name", () => {
    for (const reserved of ["Record", "Partial", "ReadonlyArray", "Responsive"]) {
      const spec = makeButton({ generics: [{ name: reserved, description: "x" }] });
      const issues = checkEvents(spec, vocabulary);
      expect(issues.map((i) => i.path)).toEqual([`generics.${reserved}`]);
    }
  });

  test("rejects a per-event handler name that collides with a declared prop", () => {
    const spec = makeEvents(
      { dismiss: { description: "x", payload: {} } },
      {
        props: {
          onDismiss: { type: "string", description: "Existing prop." },
        },
      },
    );
    const issues = checkEvents(spec, vocabulary);
    expect(issues.some((i) => /'onDismiss' prop/.test(i.message))).toBe(true);
  });

  test("rejects a declared prop named 'onEvent' when events: is non-empty", () => {
    const spec = makeEvents(
      { dismiss: { description: "x", payload: {} } },
      {
        props: {
          onEvent: { type: "string", description: "Existing prop." },
        },
      },
    );
    const issues = checkEvents(spec, vocabulary);
    expect(issues.some((i) => i.path === "props.onEvent")).toBe(true);
  });

  test("does not flag 'onEvent' as a prop when no events are declared", () => {
    const spec = makeButton({
      props: {
        onEvent: { type: "string", description: "Existing prop." },
      },
    });
    expect(checkEvents(spec, vocabulary)).toEqual([]);
  });

  test("composite spec collision check walks parts for prop names", () => {
    const spec = makeSpec({
      name: "modal",
      kind: "composite",
      events: { dismiss: { description: "x", payload: {} } },
      parts: {
        root: {
          element: "div",
          props: {
            onDismiss: { type: "string", description: "x" },
          },
        },
      },
    });
    const issues = checkEvents(spec, vocabulary);
    expect(issues.some((i) => /'onDismiss' prop/.test(i.message))).toBe(true);
  });

  test("handler-collision check ignores repeating part item props", () => {
    // `onDismiss` lives inside the generated <Spec>Item type, not on root
    // Props, so it should not trigger a false handler collision.
    const spec = makeSpec({
      name: "modal",
      kind: "composite",
      events: { dismiss: { description: "x", payload: {} } },
      parts: {
        root: { element: "div" },
        row: {
          element: "div",
          repeating: true,
          props: {
            onDismiss: { type: "string", description: "Item-level prop." },
          },
        },
      },
    });
    const issues = checkEvents(spec, vocabulary);
    expect(issues.some((i) => /'onDismiss' prop/.test(i.message))).toBe(false);
  });

  test("rejects a generic that shadows a spec-local emitted alias (<Spec>Variant)", () => {
    const spec = makeButton({ generics: [{ name: "ButtonVariant", description: "x" }] });
    const issues = checkEvents(spec, vocabulary);
    expect(issues.map((i) => i.path)).toEqual(["generics.ButtonVariant"]);
  });

  test("rejects a generic that shadows a per-prop enum alias", () => {
    const spec = makeButton({
      props: {
        align: {
          type: "string",
          description: "Alignment.",
          values: ["start", "end"],
        },
      },
      generics: [{ name: "ButtonAlign", description: "x" }],
    });
    const issues = checkEvents(spec, vocabulary);
    expect(issues.map((i) => i.path)).toEqual(["generics.ButtonAlign"]);
  });

  test("does NOT reserve per-prop enum alias names for repeating item props", () => {
    // Repeating-item props with `values` are rendered inline inside the
    // generated <Spec>Item type; no <Spec><Prop> alias is ever emitted, so
    // a generic of that name is safe.
    const spec = makeSpec({
      name: "tablist",
      kind: "composite",
      generics: [{ name: "TablistDirection", description: "x" }],
      parts: {
        root: { element: "div" },
        tab: {
          element: "button",
          repeating: true,
          props: {
            direction: {
              type: "string",
              description: "Per-item direction.",
              values: ["asc", "desc"],
            },
          },
        },
      },
    });
    expect(checkEvents(spec, vocabulary)).toEqual([]);
  });

  test("rejects a generic that shadows a repeating item type alias", () => {
    const spec = makeSpec({
      name: "tablist",
      kind: "composite",
      generics: [{ name: "TablistItem", description: "x" }],
      parts: {
        root: { element: "div" },
        tab: {
          element: "button",
          repeating: true,
          groupKey: "items",
          props: { label: { type: "string", slot: true, description: "Tab label." } },
        },
      },
    });
    const issues = checkEvents(spec, vocabulary);
    expect(issues.some((i) => i.path === "generics.TablistItem")).toBe(true);
  });
});

describe("checkEventsRuntimeSupport", () => {
  const overlayPart = {
    anchor: "trigger",
    anchorVar: "--t-modal-anchor",
    mode: "manual" as const,
    modal: false,
  };
  const overlayParts = (anchorVar = "--t-modal-anchor") => ({
    trigger: { fromChildren: true },
    content: { element: "div", overlay: { ...overlayPart, anchorVar } },
  });

  test("returns no issues when events: is absent", () => {
    expect(checkEventsRuntimeSupport(makeButton())).toEqual([]);
  });

  test("accepts 'dismiss' on a composite-overlay spec", () => {
    const spec = makeSpec({
      name: "modal",
      kind: "composite",
      parts: overlayParts(),
      events: {
        dismiss: {
          description: "Closed.",
          payload: { reason: { type: "enum", values: ["outside", "escape", "button"] } },
        },
      },
    });
    expect(checkEventsRuntimeSupport(spec)).toEqual([]);
  });

  test("rejects non-dismiss events on a composite-overlay spec until their runtime ships", () => {
    const spec = makeSpec({
      name: "combobox",
      kind: "composite",
      parts: overlayParts("--t-combobox-anchor"),
      events: {
        select: { description: "Selected.", payload: { value: { type: "string" } } },
      },
    });
    const issues = checkEventsRuntimeSupport(spec);
    expect(issues.map((i) => i.path)).toEqual(["events.select"]);
    expect(issues[0]?.message).toMatch(/no wrapper-runtime source/);
  });

  test("rejects any events declaration on an atomic spec", () => {
    const spec = makeButton({
      events: {
        dismiss: { description: "x", payload: {} },
      } as Spec["events"],
    });
    const issues = checkEventsRuntimeSupport(spec);
    expect(issues.map((i) => i.path)).toEqual(["events.dismiss"]);
    expect(issues[0]?.message).toMatch(/not supported on this spec shape/);
  });

  test("rejects events on a composite-list spec (no overlay block)", () => {
    const spec = makeSpec({
      name: "pagination",
      kind: "composite",
      parts: {
        nav: { element: "nav" },
        page: {
          element: "a",
          repeating: true,
          props: { label: { type: "string", slot: true, description: "Page label." } },
        },
      },
      events: {
        pageChange: { description: "x", payload: { page: { type: "number" } } },
      },
    });
    const issues = checkEventsRuntimeSupport(spec);
    expect(issues.map((i) => i.path)).toEqual(["events.pageChange"]);
    expect(issues[0]?.message).toMatch(/not supported on this spec shape/);
  });

  test("flags every unsupported event when multiple are declared", () => {
    const spec = makeSpec({
      name: "combobox",
      kind: "composite",
      parts: overlayParts("--t-combobox-anchor"),
      events: {
        dismiss: {
          description: "Closed.",
          payload: { reason: { type: "enum", values: ["outside", "escape", "button"] } },
        },
        select: { description: "Selected.", payload: { value: { type: "string" } } },
        inputChange: { description: "Input changed.", payload: { value: { type: "string" } } },
      },
    });
    const issues = checkEventsRuntimeSupport(spec);
    expect(issues.map((i) => i.path).sort()).toEqual(["events.inputChange", "events.select"]);
  });

  test("rejects dismiss whose reason values diverge from the runtime contract", () => {
    const spec = makeSpec({
      name: "modal",
      kind: "composite",
      parts: overlayParts(),
      events: {
        dismiss: {
          description: "Closed.",
          payload: { reason: { type: "enum", values: ["outside", "escape"] } },
        },
      },
    });
    const issues = checkEventsRuntimeSupport(spec);
    expect(issues.map((i) => i.path)).toEqual(["events.dismiss.payload.reason"]);
    expect(issues[0]?.message).toMatch(/match the wrapper-runtime contract exactly/);
  });

  test("rejects dismiss with a missing or non-enum reason field", () => {
    const missing = makeSpec({
      name: "modal",
      kind: "composite",
      parts: overlayParts(),
      events: { dismiss: { description: "Closed.", payload: {} } },
    });
    const wrongType = makeSpec({
      name: "modal",
      kind: "composite",
      parts: overlayParts(),
      events: {
        dismiss: { description: "Closed.", payload: { reason: { type: "string" } } },
      },
    });
    for (const spec of [missing, wrongType]) {
      const issues = checkEventsRuntimeSupport(spec);
      expect(issues.map((i) => i.path)).toEqual(["events.dismiss.payload.reason"]);
      expect(issues[0]?.message).toMatch(/type 'enum'/);
      expect(issues[0]?.message).toMatch(/must declare a 'reason' field/);
    }
  });

  test("rejects events: + generics: until composite-overlay wrappers support generic parameters", () => {
    const spec = makeSpec({
      name: "modal",
      kind: "composite",
      parts: overlayParts(),
      generics: [{ name: "Item", description: "Item shape." }],
      events: {
        dismiss: {
          description: "Closed.",
          payload: { reason: { type: "enum", values: ["outside", "escape", "button"] } },
        },
      },
    });
    const issues = checkEventsRuntimeSupport(spec);
    expect(issues.some((i) => i.path === "generics")).toBe(true);
    const generic = issues.find((i) => i.path === "generics");
    expect(generic?.message).toMatch(/do not declare generic type parameters/);
  });

  test("accepts generics: alone (no events:)", () => {
    const spec = makeSpec({
      name: "modal",
      kind: "composite",
      parts: overlayParts(),
      generics: [{ name: "Item", description: "Item shape." }],
    });
    expect(checkEventsRuntimeSupport(spec)).toEqual([]);
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

describe("checkFormControl", () => {
  function makeFormControl(overrides: Partial<Record<string, unknown>> = {}): Spec {
    return Spec.parse({
      name: "input",
      kind: "atomic",
      element: "input",
      rootClass: "t-input",
      formControl: true,
      examples: [{ id: "default" }],
      ...overrides,
    });
  }

  test("accepts a minimal form-control spec on <input>", () => {
    expect(checkFormControl(makeFormControl(), vocabulary)).toEqual([]);
  });

  test("accepts a form-control on <textarea>", () => {
    const spec = makeFormControl({ element: "textarea", rootClass: "t-textarea" });
    expect(checkFormControl(spec, vocabulary)).toEqual([]);
  });

  test("accepts a form-control on <select>", () => {
    const spec = makeFormControl({ element: "select", rootClass: "t-select" });
    expect(checkFormControl(spec, vocabulary)).toEqual([]);
  });

  test("ignores specs without formControl: true", () => {
    const spec = Spec.parse({
      name: "button",
      kind: "atomic",
      element: "button",
      rootClass: "t-button",
      examples: [{ id: "default" }],
    });
    expect(checkFormControl(spec, vocabulary)).toEqual([]);
  });

  test("flags a form-control whose root is not in the allowed elements set", () => {
    const spec = makeFormControl({ element: "div", rootClass: "t-input" });
    const issues = checkFormControl(spec, vocabulary);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe("element");
    expect(issues[0]?.message).toMatch(/requires <div> to be one of/);
  });

  test("flags a form-control with redeclared shared props", () => {
    const spec = makeFormControl({
      props: {
        name: { type: "string", description: "Override.", responsive: false },
        required: { type: "boolean", description: "Override.", responsive: false },
      },
    });
    const issues = checkFormControl(spec, vocabulary);
    expect(issues).toHaveLength(2);
    expect(issues.map((i) => i.path).sort()).toEqual(["props.name", "props.required"]);
    for (const issue of issues) {
      expect(issue.message).toMatch(/part of the shared form-control contract/);
    }
  });

  test("flags a form-control whose elementByProp map mixes non-allowed tags", () => {
    const spec = Spec.parse({
      name: "input",
      kind: "atomic",
      formControl: true,
      rootClass: "t-input",
      examples: [{ id: "default" }],
      elementByProp: {
        prop: "as",
        map: { single: "input", multi: "div" },
      },
      props: {
        as: {
          type: "string",
          description: "Render mode.",
          responsive: false,
          values: ["single", "multi"],
        },
      },
    });
    const issues = checkFormControl(spec, vocabulary);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe("elementByProp.map");
    expect(issues[0]?.message).toMatch(/requires <div> to be one of/);
  });

  test("allows per-spec props that don't collide with the shared contract", () => {
    const spec = makeFormControl({
      props: {
        type: {
          type: "string",
          description: "Input type.",
          responsive: false,
          values: ["text", "email"],
        },
      },
    });
    expect(checkFormControl(spec, vocabulary)).toEqual([]);
  });
});

describe("checkImperativeProps", () => {
  function makeCheckbox(overrides: Partial<Record<string, unknown>> = {}): Spec {
    return Spec.parse({
      name: "checkbox",
      kind: "atomic",
      element: "input",
      rootClass: "t-checkbox",
      formControl: true,
      htmlAttrs: { type: "checkbox" },
      imperativeProps: { indeterminate: { type: "boolean" } },
      examples: [{ id: "default" }],
      ...overrides,
    });
  }

  test("accepts a minimal imperativeProps declaration", () => {
    expect(checkImperativeProps(makeCheckbox(), vocabulary)).toEqual([]);
  });

  test("ignores specs without imperativeProps", () => {
    const spec = Spec.parse({
      name: "switch",
      kind: "atomic",
      element: "input",
      rootClass: "t-switch",
      formControl: true,
      htmlAttrs: { type: "checkbox" },
      examples: [{ id: "default" }],
    });
    expect(checkImperativeProps(spec, vocabulary)).toEqual([]);
  });

  test("flags collision with a declared spec prop", () => {
    const spec = makeCheckbox({
      props: {
        indeterminate: {
          type: "boolean",
          description: "Overridden.",
          responsive: false,
        },
      },
    });
    const issues = checkImperativeProps(spec, vocabulary);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe("imperativeProps.indeterminate");
    expect(issues[0]?.message).toMatch(/already declared in props/);
  });

  test("flags collision with the formControl shared contract", () => {
    const spec = makeCheckbox({
      imperativeProps: { required: { type: "boolean" } },
    });
    const issues = checkImperativeProps(spec, vocabulary);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe("imperativeProps.required");
    expect(issues[0]?.message).toMatch(/part of the formControl shared contract/);
  });

  test("flags collision with reserved wrapper-template names", () => {
    const spec = makeCheckbox({
      imperativeProps: { children: { type: "boolean" } },
    });
    const issues = checkImperativeProps(spec, vocabulary);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe("imperativeProps.children");
    expect(issues[0]?.message).toMatch(/reserved by the wrapper template/);
  });
});
