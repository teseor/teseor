import { describe, expect, test } from "vitest";
import { Spec } from "../../core/schema.ts";
import { checkRoot } from "./check.ts";

/** Validates the literal at runtime via Zod. The lint rule
 *  `no-as-unknown-cast` forbids the bare schema-cast in test files (it
 *  hides drift); route every fixture through this helper so a renamed
 *  field, dropped block, or new required nesting fails at construction
 *  with a structural error rather than rolling through every check. */
function makeSpec(s: unknown): Spec {
  return Spec.parse(s);
}

describe("checkRoot — byProp branch", () => {
  function headingSpec(overrides: Record<string, unknown> = {}): Spec {
    return makeSpec({
      name: "heading",
      kind: "atomic",
      rootClass: "t-heading",
      root: {
        kind: "byProp",
        prop: "level",
        map: { "1": "h1", "2": "h2", "3": "h3" },
      },
      props: {
        level: {
          type: "string",
          values: ["1", "2", "3"],
          description: "Heading level.",
        },
      },
      ...overrides,
    });
  }

  test("passes when prop type + values match the map keys", () => {
    expect(checkRoot(headingSpec())).toEqual([]);
  });

  test("rejects when the controlling prop is missing", () => {
    const spec = makeSpec({
      name: "heading",
      kind: "atomic",
      root: { kind: "byProp", prop: "level", map: { "1": "h1" } },
      props: { other: { type: "string", description: "x." } },
    });
    const issues = checkRoot(spec);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe("root.prop");
    expect(issues[0]?.message).toMatch(/not declared/);
  });

  test("rejects when the controlling prop is boolean (v1 is string-only)", () => {
    const spec = makeSpec({
      name: "list",
      kind: "atomic",
      root: { kind: "byProp", prop: "ordered", map: { true: "ol", false: "ul" } },
      props: { ordered: { type: "boolean", description: "Ordered." } },
    });
    const issues = checkRoot(spec);
    expect(issues.some((i) => i.path === "root.prop")).toBe(true);
  });

  test("rejects when a prop value is missing from the map", () => {
    const spec = makeSpec({
      name: "heading",
      kind: "atomic",
      root: { kind: "byProp", prop: "level", map: { "1": "h1" } },
      props: {
        level: { type: "string", values: ["1", "2"], description: "Level." },
      },
    });
    const issues = checkRoot(spec);
    expect(issues.some((i) => i.message.includes("[2] are not in the map"))).toBe(true);
  });

  test("rejects when a map key is missing from the prop values", () => {
    const spec = makeSpec({
      name: "heading",
      kind: "atomic",
      root: { kind: "byProp", prop: "level", map: { "1": "h1", "9": "h9" } },
      props: {
        level: { type: "string", values: ["1"], description: "Level." },
      },
    });
    const issues = checkRoot(spec);
    expect(issues.some((i) => i.message.includes("[9] are not declared"))).toBe(true);
  });

  test("walks composite parts", () => {
    const spec = makeSpec({
      name: "field",
      kind: "composite",
      parts: {
        title: {
          root: { kind: "byProp", prop: "level", map: { "1": "h1" } },
          props: {
            level: { type: "string", values: ["1", "2"], description: "Level." },
          },
        },
      },
    });
    const issues = checkRoot(spec);
    expect(issues.some((i) => i.path === "parts.title.root.map")).toBe(true);
  });
});

describe("checkRoot — `as`-constrained", () => {
  function makeButton(overrides: Record<string, unknown> = {}): Spec {
    return makeSpec({
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

  test("flags an `as` prop that omits `values:`", () => {
    const spec = makeButton({
      props: {
        as: { type: "string", responsive: false, description: "Polymorphic root." },
      },
    });
    const issues = checkRoot(spec);
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
    expect(checkRoot(spec)).toEqual([]);
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
    const issues = checkRoot(spec);
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
    const issues = checkRoot(spec);
    expect(issues.some((i) => i.path === "props.as.default")).toBe(true);
  });

  test("flags `as` declared as a non-string type", () => {
    const spec = makeButton({
      props: {
        as: { type: "boolean", responsive: false, description: "Bogus." },
      },
    });
    const issues = checkRoot(spec);
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
    const issues = checkRoot(spec);
    expect(issues.some((i) => i.path === "parts.trigger.props.as.values")).toBe(true);
  });
});

describe("checkRoot — polymorphic atomic", () => {
  test("passes when polymorphic is unset", () => {
    const spec = makeSpec({
      name: "divider",
      kind: "atomic",
      root: { kind: "static", tag: "div" },
    });
    expect(checkRoot(spec)).toEqual([]);
  });

  test("passes when polymorphic is set on a child-bearing element with no `as` prop", () => {
    const spec = makeSpec({
      name: "divider",
      kind: "atomic",
      root: { kind: "static", tag: "div", polymorphic: "asChild" },
    });
    expect(checkRoot(spec)).toEqual([]);
  });

  test("rejects polymorphic + sibling free `as` prop", () => {
    const spec = makeSpec({
      name: "divider",
      kind: "atomic",
      root: { kind: "static", tag: "div", polymorphic: "asChild" },
      props: {
        as: {
          type: "string",
          values: ["div", "span"],
          description: "Polymorphic.",
        },
      },
    });
    const issues = checkRoot(spec);
    expect(issues.some((i) => i.path === "root.polymorphic")).toBe(true);
    expect(issues.find((i) => i.path === "root.polymorphic")?.message).toMatch(
      /mutually exclusive/,
    );
  });

  test("allows polymorphic + `as` when `as` is the byProp control", () => {
    const spec = makeSpec({
      name: "text",
      kind: "atomic",
      root: { kind: "byProp", prop: "as", map: { p: "p", span: "span" }, polymorphic: "asChild" },
      props: {
        as: {
          type: "string",
          values: ["p", "span"],
          description: "Element selector.",
        },
      },
    });
    expect(checkRoot(spec)).toEqual([]);
  });

  test("rejects polymorphic + declared `asChild` prop (would emit twice)", () => {
    const spec = makeSpec({
      name: "divider",
      kind: "atomic",
      root: { kind: "static", tag: "div", polymorphic: "asChild" },
      props: {
        asChild: { type: "boolean", description: "Manually declared." },
      },
    });
    const issues = checkRoot(spec);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe("props.asChild");
  });

  test("rejects polymorphic on a void-element root", () => {
    const spec = makeSpec({
      name: "divider",
      kind: "atomic",
      root: { kind: "static", tag: "hr", polymorphic: "asChild" },
    });
    const issues = checkRoot(spec);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe("root.polymorphic");
    expect(issues[0]?.message).toMatch(/void element/);
  });

  test("ignores composite specs (polymorphic is atomic-only)", () => {
    const spec = makeSpec({
      name: "tooltip",
      kind: "composite",
      parts: {
        trigger: {
          root: { kind: "static", tag: "span" },
        },
      },
    });
    expect(checkRoot(spec)).toEqual([]);
  });
});
