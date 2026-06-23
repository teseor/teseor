import { describe, expect, test } from "vitest";
import { Spec } from "../../schema.ts";
import { checkConstraintsAgainstCoverage, checkConstraintsAgainstExamples } from "./check.ts";

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
