import { describe, expect, test } from "vitest";
import {
  assertUniqueFixtureIds,
  cellToProps,
  collectConstraints,
  collectCoverageDimensions,
  coverageFixtures,
  declaredValues,
  type TestsSpec,
} from "./coverage.ts";

type SpecOverrides = Omit<Partial<TestsSpec>, "name"> & { name?: string };

function spec(overrides: SpecOverrides = {}): TestsSpec {
  return {
    name: "x",
    kind: "atomic",
    rootClass: "t-x",
    props: {},
    tokens: {},
    visualStates: {},
    ...overrides,
  };
}

const variantDef = { description: "" };
const intentDef = { description: "" };
const sizeDef = { description: "" };
const stateDef = { description: "", __part: "" };

describe("declaredValues", () => {
  test("returns variant keys", () => {
    expect(
      declaredValues(spec({ variants: { solid: variantDef, outline: variantDef } }), "variant"),
    ).toEqual(["solid", "outline"]);
  });

  test("returns intent keys", () => {
    expect(
      declaredValues(spec({ intents: { danger: intentDef, neutral: intentDef } }), "intent"),
    ).toEqual(["danger", "neutral"]);
  });

  test("returns size keys", () => {
    expect(declaredValues(spec({ sizes: { sm: sizeDef, md: sizeDef } }), "size")).toEqual([
      "sm",
      "md",
    ]);
  });

  test("returns visualStates keys", () => {
    expect(
      declaredValues(
        spec({ visualStates: { disabled: stateDef, loading: stateDef } }),
        "visualStates",
      ),
    ).toEqual(["disabled", "loading"]);
  });

  test("falls back to a prop's declared `values`", () => {
    expect(
      declaredValues(
        spec({
          props: {
            shape: {
              type: "string",
              description: "Shape.",
              values: ["pill", "square"],
              __part: "",
            },
          },
        }),
        "shape",
      ),
    ).toEqual(["pill", "square"]);
  });

  test("returns empty list for unknown dimensions", () => {
    expect(declaredValues(spec(), "nope")).toEqual([]);
  });
});

describe("collectCoverageDimensions", () => {
  test("`true` declaration expands to all declared values", () => {
    const dims = collectCoverageDimensions(
      spec({
        variants: { solid: variantDef, outline: variantDef },
        coverage: { variant: true },
      }),
    );
    expect(dims).toEqual([{ name: "variant", values: ["solid", "outline"] }]);
  });

  test("array declaration intersects with declared values", () => {
    const dims = collectCoverageDimensions(
      spec({
        variants: { solid: variantDef, outline: variantDef, ghost: variantDef },
        coverage: { variant: ["solid", "ghost", "nope"] },
      }),
    );
    expect(dims).toEqual([{ name: "variant", values: ["solid", "ghost"] }]);
  });

  test("skips dimensions with no declared values", () => {
    expect(collectCoverageDimensions(spec({ coverage: { variant: true } }))).toEqual([]);
  });

  test("returns empty list when there is no coverage block", () => {
    expect(collectCoverageDimensions(spec())).toEqual([]);
  });
});

describe("collectConstraints", () => {
  test("clones `when` / `forbid` to fresh objects", () => {
    const when = { variant: "link" };
    const forbid = { intent: "danger" };
    const out = collectConstraints(spec({ constraints: [{ when, forbid, reason: "n/a" }] }));
    expect(out).toEqual([{ when: { variant: "link" }, forbid: { intent: "danger" } }]);
    expect(out[0]?.when).not.toBe(when);
    expect(out[0]?.forbid).not.toBe(forbid);
  });

  test("treats missing `when` / `forbid` as empty objects", () => {
    const out = collectConstraints(
      spec({ constraints: [{ when: {}, forbid: {}, reason: "n/a" }] }),
    );
    expect(out).toEqual([{ when: {}, forbid: {} }]);
  });

  test("returns empty list when there are no constraints", () => {
    expect(collectConstraints(spec())).toEqual([]);
  });
});

describe("cellToProps", () => {
  test("non-`states` cells pass through as `{ dim: value }`", () => {
    expect(cellToProps({ variant: "solid", size: "md" })).toEqual({
      variant: "solid",
      size: "md",
    });
  });

  test("`states` cells flip into the matching boolean prop", () => {
    expect(cellToProps({ states: "loading" })).toEqual({ loading: true });
  });

  test("mixes states with regular dimensions", () => {
    expect(cellToProps({ variant: "solid", states: "disabled" })).toEqual({
      variant: "solid",
      disabled: true,
    });
  });
});

describe("coverageFixtures", () => {
  test("returns empty list when no dimensions are declared", () => {
    expect(coverageFixtures(spec())).toEqual([]);
  });

  test("emits one fixture per pairwise cell with translated props", () => {
    const fixtures = coverageFixtures(
      spec({
        variants: { solid: variantDef, outline: variantDef },
        sizes: { sm: sizeDef, md: sizeDef },
        coverage: { variant: true, size: true },
      }),
    );
    expect(fixtures.length).toBeGreaterThan(0);
    for (const f of fixtures) {
      expect(typeof f.id).toBe("string");
      expect(typeof f.props.variant).toBe("string");
      expect(typeof f.props.size).toBe("string");
    }
  });

  test("translates `states` dimensions into boolean props", () => {
    const fixtures = coverageFixtures(
      spec({
        visualStates: { disabled: stateDef, loading: stateDef },
        coverage: { states: true },
      }),
    );
    const flags = fixtures.flatMap((f) => Object.keys(f.props));
    expect(flags).toEqual(expect.arrayContaining(["disabled", "loading"]));
  });
});

describe("assertUniqueFixtureIds", () => {
  test("passes when every id is unique", () => {
    expect(() => assertUniqueFixtureIds(["a", "b", "c"], spec())).not.toThrow();
  });

  test("throws and lists every duplicate", () => {
    expect(() => assertUniqueFixtureIds(["a", "b", "a", "c", "b"], spec({ name: "btn" }))).toThrow(
      /duplicate fixture id\(s\) in spec "btn": a, b/,
    );
  });
});
