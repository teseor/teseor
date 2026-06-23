import { describe, expect, test } from "vitest";
import { Spec } from "../../schema.ts";
import { checkExamplesReferences, checkVariantChoiceKeys } from "./check.ts";

function makeButton(overrides: Partial<Spec> = {}): Spec {
  return Spec.parse({
    name: "button",
    kind: "atomic",
    root: { kind: "static", tag: "button" },
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
