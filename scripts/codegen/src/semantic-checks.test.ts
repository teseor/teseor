import { describe, expect, test } from "vitest";
import type { Vocabulary } from "./lib/vocabulary.ts";
import type { Spec } from "./schema.ts";
import {
  checkAsIsConstrained,
  checkConstraintsAgainstCoverage,
  checkConstraintsAgainstExamples,
  checkCoverageShape,
  checkCssImportAllowlist,
  checkDependencyCycles,
  checkExamplesReferences,
  checkInteractionRefs,
  checkMotionSymmetry,
  checkOverlayDismissalRules,
  checkResponsiveExplicit,
  checkTokenContract,
  checkVariantChoiceKeys,
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
  events: [],
};

function makeButton(overrides: Partial<Spec> = {}): Spec {
  return {
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
  } as Spec;
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

describe("checkTokenContract", () => {
  test("returns no issues when both directions agree", () => {
    const css = `.t-button { background: var(--t-button-bg, var(--t-accent)); color: var(--t-button-fg, var(--t-on-accent)); }`;
    expect(checkTokenContract(makeButton(), css)).toEqual([]);
  });

  test("flags a spec token that is never read in the CSS", () => {
    const css = `.t-button { background: var(--t-button-bg, var(--t-accent)); }`;
    const issues = checkTokenContract(makeButton(), css);
    expect(issues.map((i) => i.path)).toEqual(["tokens.fg"]);
  });

  test("flags a CSS slot that is missing from spec.tokens", () => {
    const css = `.t-button {
      background: var(--t-button-bg, var(--t-accent));
      color: var(--t-button-fg, var(--t-on-accent));
      padding-inline: var(--t-button-pad-x, var(--t-space-4));
    }`;
    const issues = checkTokenContract(makeButton(), css);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toMatch(/pad-x/);
  });

  test("flags spec tokens declared without a CSS file", () => {
    const issues = checkTokenContract(makeButton(), undefined);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toMatch(/missing or unreadable/);
  });

  test("treats a spec name with regex metacharacters as a literal", () => {
    const spec = { ...makeButton(), name: "a.b" } as Spec;
    const css = `.t-a-b { background: var(--t-a-b-bg, var(--t-accent)); color: var(--t-a-b-fg, var(--t-on-accent)); }`;
    // Without escaping, `.` would match any character and the contract check
    // would pass against `.t-a-b` despite the literal slot being `--t-a.b-*`.
    const issues = checkTokenContract(spec, css);
    expect(issues.length).toBeGreaterThan(0);
  });

  test("matches a slot key that contains an underscore", () => {
    const spec = makeButton({
      tokens: {
        font_size: { fallback: "--t-text-base", desc: "Font size." },
      },
    });
    const css = `.t-button { font-size: var(--t-button-font_size, var(--t-text-base)); }`;
    expect(checkTokenContract(spec, css)).toEqual([]);
  });
});

describe("checkExamplesReferences", () => {
  test("accepts examples that reference declared values", () => {
    const spec = makeButton({
      examples: [{ id: "solid-primary", props: { variant: "solid", intent: "primary" } }],
    });
    expect(checkExamplesReferences(spec)).toEqual([]);
  });

  test("flags an example using an unknown variant", () => {
    const spec = makeButton({
      examples: [{ id: "ghost-primary", props: { variant: "ghost", intent: "primary" } }],
    });
    const issues = checkExamplesReferences(spec);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toMatch(/'ghost' is not a declared variant/);
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

describe("checkCoverageShape", () => {
  test("flags a coverage dimension the spec does not declare", () => {
    const spec = makeButton({ coverage: { density: true } });
    const issues = checkCoverageShape(spec);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toMatch(/not declared on the spec/);
  });

  test("flags a list dimension referencing an unknown value", () => {
    const spec = makeButton({
      states: { disabled: { description: "Disabled." } },
      coverage: { states: ["disabled", "loading"] },
    });
    const issues = checkCoverageShape(spec);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toMatch(/'loading' is not a declared value of 'states'/);
  });

  test("passes a `true` dimension that exists on the spec", () => {
    const spec = makeButton({ coverage: { variant: true, intent: true } });
    expect(checkCoverageShape(spec)).toEqual([]);
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

describe("checkMotionSymmetry", () => {
  test("flags `enters` without `exits` on the atomic root", () => {
    const spec = makeButton({ motion: { enters: ["open"] } });
    const issues = checkMotionSymmetry(spec);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toMatch(/enters is declared without motion.exits/);
  });

  test("walks into composite parts", () => {
    const spec: Spec = {
      name: "popover",
      kind: "composite",
      parts: {
        root: {},
        content: { motion: { exits: ["close"] } },
      },
    };
    const issues = checkMotionSymmetry(spec);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe("parts.content.motion");
  });

  test("accepts a symmetric declaration", () => {
    const spec = makeButton({ motion: { enters: ["open"], exits: ["close"] } });
    expect(checkMotionSymmetry(spec)).toEqual([]);
  });
});

describe("checkDependencyCycles", () => {
  test("flags a direct A → A cycle", () => {
    const issues = checkDependencyCycles({ depsByName: new Map([["a", ["a"]]]) });
    expect(issues).toHaveLength(1);
  });

  test("flags an indirect A → B → A cycle", () => {
    const issues = checkDependencyCycles({
      depsByName: new Map([
        ["a", ["b"]],
        ["b", ["a"]],
      ]),
    });
    expect(issues.length).toBeGreaterThanOrEqual(1);
  });

  test("passes an acyclic graph", () => {
    expect(
      checkDependencyCycles({
        depsByName: new Map([
          ["a", ["b", "c"]],
          ["b", ["c"]],
          ["c", []],
        ]),
      }),
    ).toEqual([]);
  });
});

describe("checkCssImportAllowlist", () => {
  test("flags an @import target that is not declared", () => {
    const spec = makeButton({ dependencies: [] });
    const css = `@import "../icon/icon.css";\n.t-button {}`;
    const issues = checkCssImportAllowlist(spec, css);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toMatch(/'icon' but it is not listed/);
  });

  test("accepts a declared dependency", () => {
    const spec = makeButton({ dependencies: ["icon"] });
    const css = `@import "../icon/icon.css";\n.t-button {}`;
    expect(checkCssImportAllowlist(spec, css)).toEqual([]);
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
    const spec: Spec = {
      name: "popover",
      kind: "composite",
      parts: {
        content: {
          props: { open: { type: "boolean", description: "Open." } },
        },
      },
    };
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
    const spec: Spec = {
      name: "popover",
      kind: "composite",
      parts: {
        trigger: {
          props: { as: { type: "string", description: "Polymorphic trigger." } },
        },
      },
    };
    const issues = checkAsIsConstrained(spec);
    expect(issues.some((i) => i.path === "parts.trigger.props.as.values")).toBe(true);
  });
});

describe("checkVariantChoiceKeys", () => {
  test("passes when keys are equal", () => {
    const spec = makeButton({
      guidance: {
        variantChoice: {
          solid: "The default.",
          outline: "Secondary.",
        },
      },
    });
    expect(checkVariantChoiceKeys(spec)).toEqual([]);
  });

  test("flags a missing variant", () => {
    const spec = makeButton({
      guidance: { variantChoice: { solid: "The default." } },
    });
    const issues = checkVariantChoiceKeys(spec);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toMatch(/variant 'outline' has no entry/);
  });

  test("flags an orphan guidance key", () => {
    const spec = makeButton({
      guidance: {
        variantChoice: {
          solid: "The default.",
          outline: "Secondary.",
          extra: "Bogus.",
        },
      },
    });
    const issues = checkVariantChoiceKeys(spec);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe("guidance.variantChoice.extra");
  });
});

describe("checkInteractionRefs", () => {
  function makeOverlay(overrides: Partial<Spec> = {}): Spec {
    return {
      name: "tooltip",
      kind: "composite",
      parts: {
        tooltip: {
          props: {
            openDelay: { type: "number", responsive: false, description: "Open delay." },
            closeDelay: { type: "number", responsive: false, description: "Close delay." },
          },
        },
      },
      ...overrides,
    } as Spec;
  }

  test("passes when `delay` names a declared numeric prop", () => {
    const spec = makeOverlay({
      interactions: [
        { on: { event: "pointerenter", target: "trigger" }, do: "open", delay: "openDelay" },
      ],
    });
    expect(checkInteractionRefs(spec)).toEqual([]);
  });

  test("flags `delay` referencing an undeclared prop", () => {
    const spec = makeOverlay({
      interactions: [
        { on: { event: "pointerenter", target: "trigger" }, do: "open", delay: "ghostDelay" },
      ],
    });
    const issues = checkInteractionRefs(spec);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe("interactions[0].delay");
    expect(issues[0]?.message).toMatch(/'ghostDelay' is not a declared numeric prop/);
  });

  test("flags `delay` referencing a non-numeric prop", () => {
    const spec = makeOverlay({
      parts: {
        tooltip: {
          props: {
            label: { type: "string", responsive: false, description: "Label." },
          },
        },
      },
      interactions: [
        { on: { event: "pointerenter", target: "trigger" }, do: "open", delay: "label" },
      ],
    });
    const issues = checkInteractionRefs(spec);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe("interactions[0].delay");
  });

  test("accepts `when: open` (canonical state)", () => {
    const spec = makeOverlay({
      interactions: [
        { on: { event: "keydown", target: "document", key: "Escape" }, do: "close", when: "open" },
      ],
    });
    expect(checkInteractionRefs(spec)).toEqual([]);
  });

  test("flags unknown `when` state", () => {
    const spec = makeOverlay({
      interactions: [
        {
          on: { event: "keydown", target: "document", key: "Escape" },
          do: "close",
          when: "closed",
        },
      ],
    });
    const issues = checkInteractionRefs(spec);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe("interactions[0].when");
    expect(issues[0]?.message).toMatch(/'closed' is not a known state/);
  });

  test("walks atomic-spec props for delay refs", () => {
    const spec = makeButton({
      props: {
        openDelay: { type: "number", responsive: false, description: "Delay." },
      },
      interactions: [{ on: { event: "click", target: "trigger" }, do: "open", delay: "openDelay" }],
    });
    expect(checkInteractionRefs(spec)).toEqual([]);
  });

  test("walks nested composite parts for delay refs", () => {
    const spec: Spec = {
      name: "menu",
      kind: "composite",
      parts: {
        root: {
          parts: {
            inner: {
              props: {
                hoverDelay: { type: "number", responsive: false, description: "Delay." },
              },
            },
          },
        },
      },
      interactions: [
        { on: { event: "pointerenter", target: "trigger" }, do: "open", delay: "hoverDelay" },
      ],
    } as Spec;
    expect(checkInteractionRefs(spec)).toEqual([]);
  });
});

describe("checkOverlayDismissalRules", () => {
  /** Tooltip-shaped overlay fixture — composite with a `popover:` block.
   *  The check only fires for specs with a popover block (overlays go through
   *  `useOverlay`, where the dismissable-layer ownership applies). */
  function makeOverlay(overrides: Partial<Extract<Spec, { kind: "composite" }>> = {}): Spec {
    return {
      name: "tooltip",
      kind: "composite",
      popover: {
        anchor: "trigger",
        floating: "content",
        mode: "manual",
        anchorVar: "--t-tooltip-anchor",
      },
      parts: { trigger: { fromChildren: true }, content: { element: "div" } },
      ...overrides,
    } as Spec;
  }

  test("returns no issues when no interactions are declared", () => {
    expect(checkOverlayDismissalRules(makeOverlay())).toEqual([]);
  });

  test("ignores specs without a popover block (non-overlay)", () => {
    // Non-overlay specs don't go through useOverlay; the dismissable-layer
    // ownership rationale doesn't apply, so the check stays quiet.
    const spec = makeButton({
      interactions: [{ on: { event: "keydown", key: "Escape", target: "document" }, do: "close" }],
    });
    expect(checkOverlayDismissalRules(spec)).toEqual([]);
  });

  test("ignores keydown:Escape rules targeting a part (not document/window)", () => {
    const spec = makeOverlay({
      interactions: [{ on: { event: "keydown", key: "Escape", target: "trigger" }, do: "close" }],
    });
    expect(checkOverlayDismissalRules(spec)).toEqual([]);
  });

  test("ignores keydown rules with a different key on document", () => {
    const spec = makeOverlay({
      interactions: [{ on: { event: "keydown", key: "Enter", target: "document" }, do: "open" }],
    });
    expect(checkOverlayDismissalRules(spec)).toEqual([]);
  });

  test("ignores non-keydown rules on document", () => {
    const spec = makeOverlay({
      interactions: [{ on: { event: "pointerdown", target: "document" }, do: "close" }],
    });
    expect(checkOverlayDismissalRules(spec)).toEqual([]);
  });

  test("flags keydown:Escape on document", () => {
    const spec = makeOverlay({
      interactions: [{ on: { event: "keydown", key: "Escape", target: "document" }, do: "close" }],
    });
    const issues = checkOverlayDismissalRules(spec);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe("interactions[0]");
    expect(issues[0]?.message).toMatch(/useDismissableLayer/);
    expect(issues[0]?.message).toMatch(/document/);
  });

  test("flags keydown:Escape on window", () => {
    const spec = makeOverlay({
      interactions: [{ on: { event: "keydown", key: "Escape", target: "window" }, do: "close" }],
    });
    const issues = checkOverlayDismissalRules(spec);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toMatch(/window/);
  });

  test("flags each offending rule independently", () => {
    const spec = makeOverlay({
      interactions: [
        { on: { event: "keydown", key: "Escape", target: "document" }, do: "close" },
        { on: { event: "pointerenter", target: "trigger" }, do: "open" },
        { on: { event: "keydown", key: "Escape", target: "window" }, do: "close" },
      ],
    });
    expect(checkOverlayDismissalRules(spec).map((i) => i.path)).toEqual([
      "interactions[0]",
      "interactions[2]",
    ]);
  });
});
