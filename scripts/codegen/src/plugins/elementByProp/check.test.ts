import { describe, expect, test } from "vitest";
import { Spec } from "../../schema.ts";
import { checkElementByProp } from "./check.ts";

function makeSpec(s: unknown): Spec {
  return Spec.parse(s);
}

describe("checkElementByProp", () => {
  function headingSpec(overrides: Record<string, unknown> = {}): Spec {
    return makeSpec({
      name: "heading",
      kind: "atomic",
      rootClass: "t-heading",
      elementByProp: {
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
    expect(checkElementByProp(headingSpec())).toEqual([]);
  });

  test("rejects `elementByProp` siblinged with `element`", () => {
    const spec = headingSpec({ element: "h1" });
    const issues = checkElementByProp(spec);
    expect(issues.some((i) => i.path === "elementByProp")).toBe(true);
    expect(issues.find((i) => i.path === "elementByProp")?.message).toMatch(/mutually exclusive/);
  });

  test("rejects when the controlling prop is missing", () => {
    const spec = makeSpec({
      name: "heading",
      kind: "atomic",
      elementByProp: { prop: "level", map: { "1": "h1" } },
      props: { other: { type: "string", description: "x." } },
    });
    const issues = checkElementByProp(spec);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe("elementByProp.prop");
    expect(issues[0]?.message).toMatch(/not declared/);
  });

  test("rejects when the controlling prop is boolean (v1 is string-only)", () => {
    const spec = makeSpec({
      name: "list",
      kind: "atomic",
      elementByProp: { prop: "ordered", map: { true: "ol", false: "ul" } },
      props: { ordered: { type: "boolean", description: "Ordered." } },
    });
    const issues = checkElementByProp(spec);
    expect(issues.some((i) => i.path === "elementByProp.prop")).toBe(true);
  });

  test("rejects when a prop value is missing from the map", () => {
    const spec = makeSpec({
      name: "heading",
      kind: "atomic",
      elementByProp: { prop: "level", map: { "1": "h1" } },
      props: {
        level: { type: "string", values: ["1", "2"], description: "Level." },
      },
    });
    const issues = checkElementByProp(spec);
    expect(issues.some((i) => i.message.includes("[2] are not in the map"))).toBe(true);
  });

  test("rejects when a map key is missing from the prop values", () => {
    const spec = makeSpec({
      name: "heading",
      kind: "atomic",
      elementByProp: { prop: "level", map: { "1": "h1", "9": "h9" } },
      props: {
        level: { type: "string", values: ["1"], description: "Level." },
      },
    });
    const issues = checkElementByProp(spec);
    expect(issues.some((i) => i.message.includes("[9] are not declared"))).toBe(true);
  });

  test("walks composite parts", () => {
    const spec = makeSpec({
      name: "field",
      kind: "composite",
      parts: {
        title: {
          elementByProp: { prop: "level", map: { "1": "h1" } },
          props: {
            level: { type: "string", values: ["1", "2"], description: "Level." },
          },
        },
      },
    });
    const issues = checkElementByProp(spec);
    expect(issues.some((i) => i.path === "parts.title.elementByProp.map")).toBe(true);
  });
});
