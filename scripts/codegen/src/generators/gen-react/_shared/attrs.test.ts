import { describe, expect, test } from "vitest";
import type { Spec } from "../../gen-contract.ts";
import { renderA11yAttrs, renderDataAttrs, renderStateAttrs } from "./attrs.ts";

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

describe("renderDataAttrs", () => {
  test("emits variant / intent data-attrs when those facets exist", () => {
    const spec = atomicSpec({
      variants: { solid: { description: "" } },
      intents: { primary: { description: "" } },
    });
    const out = renderDataAttrs(spec, [], false, [], []);
    expect(out).toContain("data-variant={variant}");
    expect(out).toContain("data-intent={intent}");
  });

  test("spreads `responsiveDataAttrs(name, name)` per responsive prop", () => {
    const out = renderDataAttrs(atomicSpec(), ["size"], false, [], []);
    expect(out).toContain(`{...responsiveDataAttrs("size", size)}`);
  });

  test("emits the `data-loading` line when hasLoading is true", () => {
    const out = renderDataAttrs(atomicSpec(), [], true, [], []);
    expect(out).toContain(`data-loading={loading === true ? "true" : undefined}`);
  });

  test("emits a `data-{name}` flag for each boolean state prop", () => {
    const out = renderDataAttrs(atomicSpec(), [], false, ["decorative", "compact"], []);
    expect(out).toContain(`data-decorative={decorative === true ? "true" : undefined}`);
    expect(out).toContain(`data-compact={compact === true ? "true" : undefined}`);
  });

  test("emits a bare `data-{name}={name}` for each non-responsive string-enum state prop", () => {
    const out = renderDataAttrs(atomicSpec(), [], false, [], ["resize", "appearance"]);
    expect(out).toContain(`data-resize={resize}`);
    expect(out).toContain(`data-appearance={appearance}`);
  });

  test("renders an empty string when no attrs are needed", () => {
    expect(renderDataAttrs(atomicSpec(), [], false, [], [])).toBe("");
  });
});

describe("renderStateAttrs", () => {
  test("emits both `disabled` and `aria-disabled` branches when `as` is present", () => {
    const out = renderStateAttrs(true, true, false);
    expect(out).toContain("disabled={isButton ? inactive : undefined}");
    expect(out).toContain(`aria-disabled={!isButton && inactive ? "true" : undefined}`);
  });

  test("falls back to the bare `disabled={inactive}` line without `as`", () => {
    const out = renderStateAttrs(false, true, false);
    expect(out).toContain("disabled={inactive}");
    expect(out).not.toContain("isButton");
  });

  test("includes the aria-busy line when hasLoading is true", () => {
    const out = renderStateAttrs(false, false, true);
    expect(out).toContain(`aria-busy={loading === true ? "true" : undefined}`);
  });

  test("renders an empty string when there is no disabled or loading state", () => {
    expect(renderStateAttrs(false, false, false)).toBe("");
  });
});

describe("renderA11yAttrs", () => {
  test("emits a static role when only role is set", () => {
    expect(renderA11yAttrs("separator", [], undefined)).toBe(`      role="separator"`);
  });

  test("emits aria-{prop}={prop} per entry in ariaProps", () => {
    const out = renderA11yAttrs("separator", ["orientation"], undefined);
    expect(out).toContain(`aria-orientation={orientation}`);
  });

  test("toggles role to none and adds aria-hidden when decorativeProp is set", () => {
    const out = renderA11yAttrs("separator", [], "decorative");
    expect(out).toContain(`role={decorative === true ? "none" : "separator"}`);
    expect(out).toContain(`aria-hidden={decorative === true ? "true" : undefined}`);
  });

  test("emits only aria-hidden when decorativeProp is set without a role", () => {
    const out = renderA11yAttrs(undefined, [], "decorative");
    expect(out).not.toContain(`role=`);
    expect(out).toContain(`aria-hidden={decorative === true ? "true" : undefined}`);
  });

  test("renders an empty string when nothing is declared", () => {
    expect(renderA11yAttrs(undefined, [], undefined)).toBe("");
  });

  test("with labelProp set, emits aria-label and conditional aria-hidden", () => {
    const out = renderA11yAttrs(undefined, [], undefined, "label");
    expect(out).toContain(`aria-label={label}`);
    expect(out).toContain(`aria-hidden={label === undefined ? "true" : undefined}`);
    expect(out).not.toContain(`role=`);
  });

  test("with labelProp + base role, role toggles to none when label is unset", () => {
    const out = renderA11yAttrs("img", [], undefined, "label");
    expect(out).toContain(`role={label === undefined ? "none" : "img"}`);
    expect(out).toContain(`aria-label={label}`);
    expect(out).toContain(`aria-hidden={label === undefined ? "true" : undefined}`);
  });
});
