import { describe, expect, test } from "vitest";
import { Spec } from "../../schema.ts";
import { checkAsIsConstrained, checkPolymorphicAtomic } from "./check.ts";

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
