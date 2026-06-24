import { describe, expect, test } from "vitest";
import type { Spec, SpecProp } from "../../gen-contract.ts";
import { renderCanonicalProp, renderPropsBlock, renderPropsType } from "./props.ts";

function prop(overrides: Partial<SpecProp> & { type: SpecProp["type"] }): SpecProp {
  return { description: "", __part: "", ...overrides };
}

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

describe("renderCanonicalProp", () => {
  test("emits a JSDoc + prop line when a description is present", () => {
    const out = renderCanonicalProp("variant", "ButtonVariant", { variant: "Visual style." });
    expect(out).toEqual(["  /** Visual style. */", "  variant?: ButtonVariant;"]);
  });

  test("omits the JSDoc line when no description is provided", () => {
    const out = renderCanonicalProp("variant", "ButtonVariant", {});
    expect(out).toEqual(["  variant?: ButtonVariant;"]);
  });
});

describe("renderPropsType", () => {
  test("emits an empty `{Name}Props` body when there are no props", () => {
    const out = renderPropsType(atomicSpec(), "Button", false, {});
    expect(out).toBe("type ButtonProps = {\n};");
  });

  test("includes variant / intent / size lines when those facets exist", () => {
    const spec = atomicSpec({
      variants: { solid: { description: "" } },
      intents: { primary: { description: "" } },
      sizes: { md: { description: "" } },
    });
    const out = renderPropsType(spec, "Button", false, {});
    expect(out).toContain("  variant?: ButtonVariant;");
    expect(out).toContain("  intent?: ButtonIntent;");
    expect(out).toContain("  size?: ButtonSize;");
  });

  test("wraps the size type in `Responsive<…>` when sizeIsResponsive is true", () => {
    const spec = atomicSpec({ sizes: { md: { description: "" } } });
    const out = renderPropsType(spec, "Button", true, {});
    expect(out).toContain("  size?: Responsive<ButtonSize>;");
  });
});

describe("renderPropsBlock", () => {
  test("collapses to a bare `defineProps<…>()` when there are no props", () => {
    const out = renderPropsBlock(atomicSpec(), "Button");
    expect(out).toBe("defineProps<ButtonProps>();");
  });

  test("emits a destructure block with enum prop names first", () => {
    const spec = atomicSpec({
      variants: { solid: { description: "" } },
      props: { open: prop({ type: "boolean" }) },
    });
    const out = renderPropsBlock(spec, "Tooltip");
    expect(out).toContain("  variant,");
    expect(out).toContain("  open,");
    expect(out).toContain("} = defineProps<TooltipProps>();");
  });

  test("inlines string defaults as quoted literals", () => {
    const spec = atomicSpec({ props: { as: prop({ type: "string", default: "button" }) } });
    const out = renderPropsBlock(spec, "Button");
    expect(out).toContain(`  as = "button",`);
  });
});
