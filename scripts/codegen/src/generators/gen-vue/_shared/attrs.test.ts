import { describe, expect, test } from "vitest";
import type { Spec } from "../../gen-contract.ts";
import { renderA11yAttrEntries, renderAttrEntries } from "./attrs.ts";

function atomicSpec(overrides: Partial<Spec> = {}): Spec {
  return {
    name: "button",
    kind: "atomic",
    props: {},
    tokens: {},
    visualStates: {},
    ...overrides,
  };
}

describe("renderAttrEntries", () => {
  test("emits variant / intent data-attrs when those facets exist", () => {
    const spec = atomicSpec({
      variants: { solid: { description: "" } },
      intents: { primary: { description: "" } },
    });
    const out = renderAttrEntries(spec, [], false, false, false, [], []);
    expect(out).toContain(`"data-variant": variant,`);
    expect(out).toContain(`"data-intent": intent,`);
  });

  test("spreads `responsiveDataAttrs(name, name)` per responsive prop", () => {
    const out = renderAttrEntries(atomicSpec(), ["size"], false, false, false, [], []);
    expect(out).toContain(`...responsiveDataAttrs("size", size),`);
  });

  test("emits both `disabled` and `aria-disabled` branches when `as` is present", () => {
    const out = renderAttrEntries(atomicSpec(), [], false, true, true, [], []);
    expect(out).toContain("isButton.value ? inactive.value : undefined,");
    expect(out).toContain(`"aria-disabled": !isButton.value && inactive.value`);
  });

  test("falls back to the bare `disabled: inactive.value` line without `as`", () => {
    const out = renderAttrEntries(atomicSpec(), [], false, true, false, [], []);
    expect(out).toContain("disabled: inactive.value,");
    expect(out).not.toContain("isButton.value");
  });

  test("includes the loading + aria-busy pair when hasLoading is true", () => {
    const out = renderAttrEntries(atomicSpec(), [], true, false, false, [], []);
    expect(out).toContain(`"data-loading": loading ? "true" : undefined,`);
    expect(out).toContain(`"aria-busy": loading ? "true" : undefined,`);
  });

  test("emits a `data-{name}` entry for each boolean state prop", () => {
    const out = renderAttrEntries(
      atomicSpec(),
      [],
      false,
      false,
      false,
      ["decorative", "compact"],
      [],
    );
    expect(out).toContain(`"data-decorative": decorative ? "true" : undefined,`);
    expect(out).toContain(`"data-compact": compact ? "true" : undefined,`);
  });

  test("emits a bare `data-{name}: {name}` entry for each non-responsive string-enum prop", () => {
    const out = renderAttrEntries(
      atomicSpec(),
      [],
      false,
      false,
      false,
      [],
      ["resize", "appearance"],
    );
    expect(out).toContain(`"data-resize": resize,`);
    expect(out).toContain(`"data-appearance": appearance,`);
  });
});

describe("renderA11yAttrEntries", () => {
  test("emits a static role when only role is set", () => {
    expect(renderA11yAttrEntries("separator", [], undefined)).toBe(`  role: "separator",`);
  });

  test('emits "aria-{prop}": prop per entry in ariaProps', () => {
    const out = renderA11yAttrEntries("separator", ["orientation"], undefined);
    expect(out).toContain(`"aria-orientation": orientation,`);
  });

  test("toggles role to none and adds aria-hidden when decorativeProp is set", () => {
    const out = renderA11yAttrEntries("separator", [], "decorative");
    expect(out).toContain(`role: decorative ? "none" : "separator",`);
    expect(out).toContain(`"aria-hidden": decorative ? "true" : undefined,`);
  });

  test("emits only aria-hidden when decorativeProp is set without a role", () => {
    const out = renderA11yAttrEntries(undefined, [], "decorative");
    expect(out).not.toContain(`role:`);
    expect(out).toContain(`"aria-hidden": decorative ? "true" : undefined,`);
  });

  test("renders an empty string when nothing is declared", () => {
    expect(renderA11yAttrEntries(undefined, [], undefined)).toBe("");
  });

  test("with labelProp set, emits aria-label entry and conditional aria-hidden", () => {
    const out = renderA11yAttrEntries(undefined, [], undefined, "label");
    expect(out).toContain(`"aria-label": label,`);
    expect(out).toContain(`"aria-hidden": label === undefined ? "true" : undefined,`);
    expect(out).not.toContain(`role:`);
  });

  test("with labelProp + base role, role toggles to none when label is unset", () => {
    const out = renderA11yAttrEntries("img", [], undefined, "label");
    expect(out).toContain(`role: label === undefined ? "none" : "img",`);
    expect(out).toContain(`"aria-label": label,`);
    expect(out).toContain(`"aria-hidden": label === undefined ? "true" : undefined,`);
  });
});
