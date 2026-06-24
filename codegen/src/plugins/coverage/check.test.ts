import { describe, expect, test } from "vitest";
import { Spec } from "../../core/schema.ts";
import { checkCoverageShape } from "./check.ts";

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

describe("checkCoverageShape", () => {
  test("flags a coverage dimension the spec does not declare", () => {
    const spec = makeButton({ coverage: { density: true } });
    const issues = checkCoverageShape(spec);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toMatch(/not declared on the spec/);
  });

  test("flags a list dimension referencing an unknown value", () => {
    const spec = makeButton({
      visualStates: { disabled: { description: "Disabled." } },
      coverage: { visualStates: ["disabled", "loading"] },
    });
    const issues = checkCoverageShape(spec);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toMatch(/'loading' is not a declared value of 'visualStates'/);
  });

  test("passes a `true` dimension that exists on the spec", () => {
    const spec = makeButton({ coverage: { variant: true, intent: true } });
    expect(checkCoverageShape(spec)).toEqual([]);
  });
});
