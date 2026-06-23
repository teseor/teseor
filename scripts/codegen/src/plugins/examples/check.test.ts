import { describe, expect, test } from "vitest";
import { Spec } from "../../schema.ts";
import { checkExamplesPresent } from "./check.ts";

function makeButton(overrides: Partial<Spec> = {}): Spec {
  return Spec.parse({
    name: "button",
    kind: "atomic",
    element: "button",
    rootClass: "t-button",
    tokens: {
      bg: { fallback: "--t-accent", desc: "Background." },
      fg: { fallback: "--t-on-accent", desc: "Foreground." },
    },
    ...overrides,
  });
}

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
