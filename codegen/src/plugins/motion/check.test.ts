import { describe, expect, test } from "vitest";
import { Spec } from "../../core/schema.ts";
import { checkMotion } from "./check.ts";

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

function makeSpec(s: unknown): Spec {
  return Spec.parse(s);
}

describe("checkMotion", () => {
  test("flags `enters` without `exits` on the atomic root", () => {
    const spec = makeButton({ motion: { enters: ["open"] } });
    const issues = checkMotion(spec);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toMatch(/enters is declared without motion.exits/);
  });

  test("walks into composite parts", () => {
    const spec = makeSpec({
      name: "popover",
      kind: "composite",
      parts: {
        root: {},
        content: { motion: { exits: ["close"] } },
      },
    });
    const issues = checkMotion(spec);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe("parts.content.motion");
  });

  test("accepts a symmetric declaration", () => {
    const spec = makeButton({ motion: { enters: ["open"], exits: ["close"] } });
    expect(checkMotion(spec)).toEqual([]);
  });
});
