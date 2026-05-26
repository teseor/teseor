import { describe, expect, test } from "vitest";
import type { TokenDictionary } from "./lib/token-dictionary.ts";
import type { Vocabulary } from "./lib/vocabulary.ts";
import type { Spec } from "./schema.ts";
import {
  checkAsIsConstrained,
  checkConstraintsAgainstCoverage,
  checkConstraintsAgainstExamples,
  checkCoverageShape,
  checkCssImportAllowlist,
  checkDependencyCycles,
  checkExamplesPresent,
  checkExamplesReferences,
  checkInteractionEventVocabulary,
  checkInteractionRefs,
  checkMotionSymmetry,
  checkOverlayEscapeRules,
  checkPrivateTokens,
  checkRepeatingParts,
  checkResponsiveExplicit,
  checkTokenContract,
  checkTokenFallbacks,
  checkTokenNames,
  checkVariantChoiceKeys,
  checkVocabulary,
  checkVoidElementConstraints,
  levenshtein,
  suggest,
} from "./semantic-checks.ts";

const tokenDictionary: TokenDictionary = {
  canonical: new Set(["bg", "fg", "pad", "pad-x", "pad-y", "gap", "radius", "dur", "ease"]),
  synonyms: new Map([
    ["background", "bg"],
    ["color", "fg"],
    ["paddingX", "pad-x"],
    ["borderRadius", "radius"],
  ]),
};

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

describe("checkTokenFallbacks", () => {
  const tokensCss = new Set(["--t-accent", "--t-on-accent", "--t-bg", "--t-space-3", "--t-row-3"]);

  test("passes a fallback that resolves to a known token", () => {
    const spec = makeButton({
      tokens: { bg: { fallback: "--t-accent", desc: "Background." } },
    });
    expect(checkTokenFallbacks(spec, tokensCss)).toEqual([]);
  });

  test("flags a fallback that points to a non-existent token", () => {
    const spec = makeButton({
      tokens: { bg: { fallback: "--t-acent", desc: "Background typo." } },
    });
    const issues = checkTokenFallbacks(spec, tokensCss);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toMatch(/--t-acent.*not a token/);
  });

  test("allows literal CSS values (non-token fallbacks)", () => {
    const spec = makeButton({
      tokens: { align: { fallback: "stretch", desc: "Alignment default." } },
    });
    expect(checkTokenFallbacks(spec, tokensCss)).toEqual([]);
  });

  test("flags a `--*` custom property that isn't a known token (missing `t-` prefix)", () => {
    const spec = makeButton({
      tokens: { bg: { fallback: "--acent", desc: "Background, mis-prefixed." } },
    });
    const issues = checkTokenFallbacks(spec, tokensCss);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toMatch(/--acent.*not a token/);
  });

  test("allows the component's own override slot as a fallback", () => {
    const spec = makeButton({
      tokens: { custom: { fallback: "--t-button-other", desc: "Self-referential." } },
    });
    expect(checkTokenFallbacks(spec, tokensCss)).toEqual([]);
  });

  test("flags an intent-token override pointing to a non-existent token", () => {
    const spec = makeButton({
      intents: {
        primary: {
          description: "Primary.",
          tokens: { bg: "--t-acent" },
        },
      },
    });
    const issues = checkTokenFallbacks(spec, tokensCss);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe("intents.primary.tokens.bg");
  });

  test("flags a size-token override pointing to a non-existent token", () => {
    const spec = makeButton({
      sizes: {
        sm: {
          description: "Small.",
          tokens: { height: "--t-row-99" },
        },
      },
    });
    const issues = checkTokenFallbacks(spec, tokensCss);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe("sizes.sm.tokens.height");
  });

  test("walks composite parts", () => {
    const spec: Spec = {
      name: "tooltip",
      kind: "composite",
      parts: {
        content: {
          element: "div",
          rootClass: "t-tooltip",
          tokens: {
            bg: { fallback: "--t-acent", desc: "Bad ref." },
            fg: { fallback: "--t-bg", desc: "Good ref." },
          },
        },
      },
    } as Spec;
    const issues = checkTokenFallbacks(spec, tokensCss);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe("parts.content.tokens.bg.fallback");
  });
});

describe("checkPrivateTokens", () => {
  test("passes when every --_* slot is enumerated", () => {
    const spec = makeButton({
      privateTokens: ["--_h", "--_bg", "--_fg"],
    });
    const css = `.t-button { --_h: 1rem; --_bg: red; --_fg: white; }`;
    expect(checkPrivateTokens(spec, css)).toEqual([]);
  });

  test("flags a slot declared in CSS but not listed", () => {
    const spec = makeButton({ privateTokens: ["--_h"] });
    const css = `.t-button { --_h: 1rem; --_bg: red; }`;
    const issues = checkPrivateTokens(spec, css);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toMatch(/declares '--_bg'/);
  });

  test("flags a slot listed but not declared in CSS", () => {
    const spec = makeButton({ privateTokens: ["--_h", "--_unused"] });
    const css = `.t-button { --_h: 1rem; }`;
    const issues = checkPrivateTokens(spec, css);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toMatch(/'--_unused'.*never declared/);
  });

  test("walks composite parts (per-rootClass)", () => {
    const spec: Spec = {
      name: "tooltip",
      kind: "composite",
      parts: {
        trigger: {
          fromChildren: true,
          rootClass: "t-tooltip-trigger",
          privateTokens: ["--_anchor"],
        },
        content: {
          element: "div",
          rootClass: "t-tooltip",
          privateTokens: ["--_bg", "--_fg"],
        },
      },
    } as Spec;
    const css = `.t-tooltip-trigger { --_anchor: none; } .t-tooltip { --_bg: red; --_fg: white; }`;
    expect(checkPrivateTokens(spec, css)).toEqual([]);
  });

  test("ignores --_* references on the RHS (only the declaration LHS counts)", () => {
    const spec = makeButton({ privateTokens: ["--_h"] });
    const css = `.t-button { --_h: 1rem; block-size: var(--_h); }`;
    expect(checkPrivateTokens(spec, css)).toEqual([]);
  });

  test("attributes slots declared inside @media blocks to the enclosing root rule", () => {
    // Responsive modifiers nest a rule inside `@media` inside `.t-button`.
    // rootRule must climb past the atrule so the slot decl attributes back to
    // `.t-button`, not to the inner `&:where(...)` selector.
    const spec = makeButton({ privateTokens: ["--_h", "--_bp-only"] });
    const css = `.t-button {
      --_h: 1rem;
      @media (min-width: 48rem) {
        &:where([data-size-md="sm"]) {
          --_bp-only: 0.5rem;
        }
      }
    }`;
    expect(checkPrivateTokens(spec, css)).toEqual([]);
  });
});

describe("checkTokenNames", () => {
  test("passes canonical token names", () => {
    const spec = makeButton({
      tokens: {
        bg: { fallback: "--t-accent", desc: "Background." },
        fg: { fallback: "--t-on-accent", desc: "Foreground." },
        "pad-x": { fallback: "--t-space-4", desc: "Inline padding." },
      },
    });
    expect(checkTokenNames(spec, tokenDictionary)).toEqual([]);
  });

  test("passes component-specific names that are not close to a canonical", () => {
    const spec = makeButton({
      tokens: {
        bg: { fallback: "--t-accent", desc: "Background." },
        "arrow-bg": { fallback: "--t-neutral-90", desc: "Arrow fill." },
        anchor: { fallback: "none", desc: "Anchor name." },
      },
    });
    expect(checkTokenNames(spec, tokenDictionary)).toEqual([]);
  });

  test("rejects a synonym with a 'use canonical X' hint", () => {
    const spec = makeButton({
      tokens: {
        background: { fallback: "--t-accent", desc: "Background." },
      },
    });
    const issues = checkTokenNames(spec, tokenDictionary);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toMatch(/use canonical 'bg' instead of 'background'/);
    expect(issues[0]?.path).toBe("tokens.background");
  });

  test("rejects a close typo of a canonical name", () => {
    const spec = makeButton({
      tokens: {
        bgg: { fallback: "--t-accent", desc: "Background typo." },
      },
    });
    const issues = checkTokenNames(spec, tokenDictionary);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toMatch(/looks like a typo of canonical token 'bg'/);
  });

  test("walks composite parts", () => {
    const spec: Spec = {
      name: "tooltip",
      kind: "composite",
      parts: {
        content: {
          element: "div",
          rootClass: "t-tooltip",
          tokens: {
            background: { fallback: "--t-neutral-90", desc: "Bad longhand." },
            "arrow-bg": { fallback: "--t-neutral-90", desc: "Arrow fill." },
          },
        },
      },
    } as Spec;
    const issues = checkTokenNames(spec, tokenDictionary);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe("parts.content.tokens.background");
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

describe("checkVoidElementConstraints", () => {
  function makeVoid(element: string, props: Record<string, unknown> = {}): Spec {
    return {
      name: "divider",
      kind: "atomic",
      element,
      rootClass: "t-divider",
      props,
    } as Spec;
  }

  test("ignores non-void elements", () => {
    const spec = makeVoid("div", {
      content: { slot: true, type: "string", responsive: false, description: "Body." },
      loading: { type: "boolean", responsive: false, description: "Loading." },
      as: {
        type: "string",
        values: ["div", "span"],
        responsive: false,
        description: "Polymorphic.",
      },
      disabled: { type: "boolean", responsive: false, description: "Disabled." },
    });
    expect(checkVoidElementConstraints(spec)).toEqual([]);
  });

  test("ignores a void element with no offending props", () => {
    expect(checkVoidElementConstraints(makeVoid("hr"))).toEqual([]);
  });

  test("flags slot props on a void element (one issue per slot)", () => {
    const spec = makeVoid("hr", {
      leading: { slot: true, type: "string", responsive: false, description: "Leading slot." },
      trailing: { slot: true, type: "string", responsive: false, description: "Trailing slot." },
    });
    const issues = checkVoidElementConstraints(spec);
    expect(issues.map((i) => i.path)).toEqual(["props.leading", "props.trailing"]);
    expect(issues[0]?.message).toMatch(/<hr> cannot host slot props/);
  });

  test("flags `loading` on a void element", () => {
    const spec = makeVoid("img", {
      loading: { type: "boolean", responsive: false, description: "Loading." },
    });
    const issues = checkVoidElementConstraints(spec);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe("props.loading");
    expect(issues[0]?.message).toMatch(/<img> cannot render a loading spinner/);
  });

  test("flags `as` on a void element", () => {
    const spec = makeVoid("hr", {
      as: { type: "string", values: ["hr", "div"], responsive: false, description: "Polymorphic." },
    });
    const issues = checkVoidElementConstraints(spec);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe("props.as");
    expect(issues[0]?.message).toMatch(/<hr> cannot declare `as`/);
  });

  test("flags `disabled` on a non-form-control void element", () => {
    const spec = makeVoid("img", {
      disabled: { type: "boolean", responsive: false, description: "Disabled." },
    });
    const issues = checkVoidElementConstraints(spec);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe("props.disabled");
    expect(issues[0]?.message).toMatch(/<img> ignores `disabled`/);
  });

  test("accepts `disabled` on <input> (form-control void)", () => {
    const spec = makeVoid("input", {
      disabled: { type: "boolean", responsive: false, description: "Disabled." },
    });
    expect(checkVoidElementConstraints(spec)).toEqual([]);
  });

  test("accepts `disabled` on case-variant form-control voids (`INPUT`, `Input`)", () => {
    // `isVoidElement` lowercases its input; the FORM_CONTROL_VOIDS membership
    // check must do the same so an upper/mixed-case spec doesn't get the
    // `<INPUT> ignores disabled` false positive.
    for (const element of ["INPUT", "Input"]) {
      const spec = makeVoid(element, {
        disabled: { type: "boolean", responsive: false, description: "Disabled." },
      });
      expect(checkVoidElementConstraints(spec)).toEqual([]);
    }
  });

  test("walks composite parts", () => {
    const spec: Spec = {
      name: "field",
      kind: "composite",
      parts: {
        separator: {
          element: "hr",
          props: {
            loading: { type: "boolean", description: "Loading." },
          },
        },
      },
    } as Spec;
    const issues = checkVoidElementConstraints(spec);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe("parts.separator.props.loading");
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

describe("checkOverlayEscapeRules", () => {
  /** Tooltip-shaped overlay fixture — composite with an `overlay:` block.
   *  The check only fires for specs with an overlay block (overlays go through
   *  `useOverlay`, where the dismissable-layer ownership applies). */
  function makeOverlay(overrides: Partial<Extract<Spec, { kind: "composite" }>> = {}): Spec {
    return {
      name: "tooltip",
      kind: "composite",
      overlay: {
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
    expect(checkOverlayEscapeRules(makeOverlay())).toEqual([]);
  });

  test("ignores specs without an overlay block (non-overlay)", () => {
    // Non-overlay specs don't go through useOverlay; the dismissable-layer
    // ownership rationale doesn't apply, so the check stays quiet.
    const spec = makeButton({
      interactions: [{ on: { event: "keydown", key: "Escape", target: "document" }, do: "close" }],
    });
    expect(checkOverlayEscapeRules(spec)).toEqual([]);
  });

  test("ignores keydown:Escape rules targeting a part (not document/window)", () => {
    const spec = makeOverlay({
      interactions: [{ on: { event: "keydown", key: "Escape", target: "trigger" }, do: "close" }],
    });
    expect(checkOverlayEscapeRules(spec)).toEqual([]);
  });

  test("ignores keydown rules with a different key on document", () => {
    const spec = makeOverlay({
      interactions: [{ on: { event: "keydown", key: "Enter", target: "document" }, do: "open" }],
    });
    expect(checkOverlayEscapeRules(spec)).toEqual([]);
  });

  test("ignores non-keydown rules on document", () => {
    const spec = makeOverlay({
      interactions: [{ on: { event: "pointerdown", target: "document" }, do: "close" }],
    });
    expect(checkOverlayEscapeRules(spec)).toEqual([]);
  });

  test("flags keydown:Escape on document", () => {
    const spec = makeOverlay({
      interactions: [{ on: { event: "keydown", key: "Escape", target: "document" }, do: "close" }],
    });
    const issues = checkOverlayEscapeRules(spec);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe("interactions[0]");
    expect(issues[0]?.message).toMatch(/useDismissableLayer/);
    expect(issues[0]?.message).toMatch(/document/);
  });

  test("flags keydown:Escape on window", () => {
    const spec = makeOverlay({
      interactions: [{ on: { event: "keydown", key: "Escape", target: "window" }, do: "close" }],
    });
    const issues = checkOverlayEscapeRules(spec);
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
    expect(checkOverlayEscapeRules(spec).map((i) => i.path)).toEqual([
      "interactions[0]",
      "interactions[2]",
    ]);
  });
});

describe("checkInteractionEventVocabulary", () => {
  function makeOverlay(overrides: Partial<Extract<Spec, { kind: "composite" }>> = {}): Spec {
    return {
      name: "tooltip",
      kind: "composite",
      parts: { trigger: { fromChildren: true }, content: { element: "div" } },
      ...overrides,
    } as Spec;
  }

  test("passes for a known React event on `target: trigger`", () => {
    const spec = makeOverlay({
      interactions: [{ on: { event: "pointerenter", target: "trigger" }, do: "open" }],
    });
    expect(checkInteractionEventVocabulary(spec)).toEqual([]);
  });

  test("flags a typo with a suggestion and the supported list", () => {
    const spec = makeOverlay({
      interactions: [{ on: { event: "pointerentr", target: "trigger" }, do: "open" }],
    });
    const issues = checkInteractionEventVocabulary(spec);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe("interactions[0].on.event");
    expect(issues[0]?.message).toMatch(/'pointerentr' is not a supported React event/);
    expect(issues[0]?.message).toMatch(/Did you mean 'pointerenter'\?/);
    expect(issues[0]?.message).toMatch(/Supported:.*pointerenter/);
  });

  test("flags an unrelated name without a suggestion", () => {
    // `mouseover` is conceptually adjacent but lexically far from any vocab
    // entry — Levenshtein > 3 → no `Did you mean` fragment.
    const spec = makeOverlay({
      interactions: [{ on: { event: "mouseover", target: "trigger" }, do: "open" }],
    });
    const issues = checkInteractionEventVocabulary(spec);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toMatch(/'mouseover' is not a supported React event/);
    expect(issues[0]?.message).not.toMatch(/Did you mean/);
    expect(issues[0]?.message).toMatch(/Supported:.*pointerenter/);
  });

  test("ignores rules targeting `document` (native listener, any event name)", () => {
    const spec = makeOverlay({
      interactions: [{ on: { event: "wheel", target: "document" }, do: "close" }],
    });
    expect(checkInteractionEventVocabulary(spec)).toEqual([]);
  });

  test("ignores rules targeting `window` (native listener, any event name)", () => {
    const spec = makeOverlay({
      interactions: [{ on: { event: "scroll", target: "window" }, do: "close" }],
    });
    expect(checkInteractionEventVocabulary(spec)).toEqual([]);
  });

  test("flags each offending rule on `trigger` independently", () => {
    const spec = makeOverlay({
      interactions: [
        { on: { event: "mouseover", target: "trigger" }, do: "open" },
        { on: { event: "pointerenter", target: "trigger" }, do: "open" },
        { on: { event: "dragstart", target: "trigger" }, do: "close" },
      ],
    });
    expect(checkInteractionEventVocabulary(spec).map((i) => i.path)).toEqual([
      "interactions[0].on.event",
      "interactions[2].on.event",
    ]);
  });
});

describe("checkExamplesPresent", () => {
  test("flags a spec with no `examples:` block", () => {
    const issues = checkExamplesPresent(makeButton());
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe("examples");
  });

  test("flags a spec with an empty examples list", () => {
    const issues = checkExamplesPresent(makeButton({ examples: [] }));
    expect(issues).toHaveLength(1);
  });

  test("passes when at least one example is declared", () => {
    const issues = checkExamplesPresent(
      makeButton({ examples: [{ id: "default", props: { intent: "primary" } }] }),
    );
    expect(issues).toEqual([]);
  });
});

describe("checkRepeatingParts (RFC-0005)", () => {
  test("non-repeating composite produces no issues", () => {
    const spec: Spec = {
      name: "tooltip",
      kind: "composite",
      parts: {
        trigger: { fromChildren: true, rootClass: "t-tooltip-trigger" },
        content: { element: "div", rootClass: "t-tooltip" },
      },
    } as Spec;
    expect(checkRepeatingParts(spec)).toEqual([]);
  });

  test("a valid repeating part produces no issues", () => {
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
    expect(checkRepeatingParts(spec)).toEqual([]);
  });

  test("rule 1 — `repeating: true` with `fromChildren: true`", () => {
    const spec: Spec = {
      name: "pagination",
      kind: "composite",
      parts: {
        page: {
          repeating: true,
          fromChildren: true,
          props: { label: { type: "string", description: "Label." } },
        },
      },
    } as Spec;
    const issues = checkRepeatingParts(spec);
    expect(issues.map((i) => i.path)).toEqual(["parts.page"]);
    expect(issues[0]?.message).toMatch(/fromChildren/);
  });

  test("rule 2 — `repeating: true` with no props", () => {
    const spec: Spec = {
      name: "pagination",
      kind: "composite",
      parts: {
        page: { repeating: true, element: "a" },
      },
    } as Spec;
    const issues = checkRepeatingParts(spec);
    expect(issues.map((i) => i.path)).toEqual(["parts.page"]);
    expect(issues[0]?.message).toMatch(/props/);
  });

  test("rule 2 — `repeating: true` with an empty `props:` map", () => {
    const spec: Spec = {
      name: "pagination",
      kind: "composite",
      parts: {
        page: { repeating: true, element: "a", props: {} },
      },
    } as Spec;
    const issues = checkRepeatingParts(spec);
    expect(issues.map((i) => i.path)).toEqual(["parts.page"]);
  });

  test("rule 3 — `repeating: true` with nested `parts:` (defer #835)", () => {
    const spec: Spec = {
      name: "stepper",
      kind: "composite",
      parts: {
        step: {
          repeating: true,
          element: "li",
          props: { label: { type: "string", description: "Label." } },
          parts: {
            header: { element: "h3", rootClass: "t-stepper-header" },
          },
        },
      },
    } as Spec;
    const issues = checkRepeatingParts(spec);
    expect(issues.map((i) => i.path)).toEqual(["parts.step"]);
    expect(issues[0]?.message).toMatch(/#835/);
  });

  test("rule 4 — repeating part nested inside another repeating part (defer #834)", () => {
    const spec: Spec = {
      name: "tree",
      kind: "composite",
      parts: {
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
    } as Spec;
    const issues = checkRepeatingParts(spec);
    // Both rule 3 (nested parts on repeating) and rule 4 (repeating inside
    // repeating) apply to this shape; both fire.
    const paths = issues.map((i) => i.path).sort();
    expect(paths).toContain("parts.node");
    expect(paths).toContain("parts.node.parts.child");
    expect(issues.some((i) => /#834/.test(i.message))).toBe(true);
  });

  test("rule 5 — two repeating siblings default to the same propName", () => {
    const spec: Spec = {
      name: "split",
      kind: "composite",
      parts: {
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
    } as Spec;
    const issues = checkRepeatingParts(spec);
    expect(issues.some((i) => /propName/i.test(i.message))).toBe(true);
  });

  test("rule 5 — two repeating siblings with distinct propNames produce no collision", () => {
    const spec: Spec = {
      name: "split",
      kind: "composite",
      parts: {
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
    } as Spec;
    expect(checkRepeatingParts(spec)).toEqual([]);
  });

  test("rule 8 — repeating part declares `props.id` (reserved)", () => {
    const spec: Spec = {
      name: "pagination",
      kind: "composite",
      parts: {
        page: {
          repeating: true,
          element: "a",
          props: {
            id: { type: "string", description: "Author id (forbidden — reserved)." },
            label: { type: "string", description: "Label." },
          },
        },
      },
    } as Spec;
    const issues = checkRepeatingParts(spec);
    expect(issues.map((i) => i.path)).toEqual(["parts.page.props.id"]);
    expect(issues[0]?.message).toMatch(/reserved/i);
  });
});
