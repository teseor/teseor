import { describe, expect, test } from "vitest";
import type { Spec } from "../../gen-contract.ts";
import { renderAttrEntries } from "./attrs.ts";

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
    const out = renderAttrEntries(spec, [], false, false, false);
    expect(out).toContain(`"data-variant": variant,`);
    expect(out).toContain(`"data-intent": intent,`);
  });

  test("spreads `responsiveDataAttrs(name, name)` per responsive prop", () => {
    const out = renderAttrEntries(atomicSpec(), ["size"], false, false, false);
    expect(out).toContain(`...responsiveDataAttrs("size", size),`);
  });

  test("emits both `disabled` and `aria-disabled` branches when `as` is present", () => {
    const out = renderAttrEntries(atomicSpec(), [], false, true, true);
    expect(out).toContain("isButton.value ? inactive.value : undefined,");
    expect(out).toContain(`"aria-disabled": !isButton.value && inactive.value`);
  });

  test("falls back to the bare `disabled: inactive.value` line without `as`", () => {
    const out = renderAttrEntries(atomicSpec(), [], false, true, false);
    expect(out).toContain("disabled: inactive.value,");
    expect(out).not.toContain("isButton.value");
  });

  test("includes the loading + aria-busy pair when hasLoading is true", () => {
    const out = renderAttrEntries(atomicSpec(), [], true, false, false);
    expect(out).toContain(`"data-loading": loading ? "true" : undefined,`);
    expect(out).toContain(`"aria-busy": loading ? "true" : undefined,`);
  });
});
