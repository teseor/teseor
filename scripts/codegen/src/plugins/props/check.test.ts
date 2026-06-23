import { describe, expect, test } from "vitest";
import { Spec } from "../../schema.ts";
import { checkResponsiveExplicit } from "./check.ts";

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
