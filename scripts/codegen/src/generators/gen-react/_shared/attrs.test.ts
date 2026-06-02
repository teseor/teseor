import { describe, expect, test } from "vitest";
import type { Spec } from "../../gen-contract.ts";
import { renderDataAttrs, renderStateAttrs } from "./attrs.ts";

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
    const out = renderDataAttrs(spec, [], false);
    expect(out).toContain("data-variant={variant}");
    expect(out).toContain("data-intent={intent}");
  });

  test("spreads `responsiveDataAttrs(name, name)` per responsive prop", () => {
    const out = renderDataAttrs(atomicSpec(), ["size"], false);
    expect(out).toContain(`{...responsiveDataAttrs("size", size)}`);
  });

  test("emits the `data-loading` line when hasLoading is true", () => {
    const out = renderDataAttrs(atomicSpec(), [], true);
    expect(out).toContain(`data-loading={loading === true ? "true" : undefined}`);
  });

  test("renders an empty string when no attrs are needed", () => {
    expect(renderDataAttrs(atomicSpec(), [], false)).toBe("");
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
