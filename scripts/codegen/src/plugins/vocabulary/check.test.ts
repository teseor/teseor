import { describe, expect, test } from "vitest";
import type { Vocabulary } from "../../lib/vocabulary.ts";
import { Spec } from "../../schema.ts";
import { checkVocabulary } from "./check.ts";

const vocabulary: Vocabulary = {
  components: ["Button", "Stack"],
  props: ["size", "variant", "intent", "disabled", "loading"],
  propDescriptions: {},
  variants: ["solid", "outline", "ghost", "link"],
  intents: ["primary", "neutral", "danger", "success", "warning"],
  sizes: ["sm", "md", "lg"],
  sizeMap: {},
  states: ["disabled", "loading", "error", "success"],
  parts: [],
  events: { verbs: {}, synonyms: {}, pattern: "", builtins: {} },
  dom_events: {},
  keys: {},
  formControl: { elements: [], props: {} },
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
