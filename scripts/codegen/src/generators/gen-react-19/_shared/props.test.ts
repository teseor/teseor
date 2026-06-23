import { describe, expect, test } from "vitest";
import type { Spec, SpecProp } from "../../gen-contract.ts";
import {
  renderCanonicalProp,
  renderDestructure,
  renderOwnProps,
  renderPropLine,
  renderPropsTypeIntersection,
} from "./props.ts";

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

describe("renderPropLine", () => {
  test("emits a single `name?: type;` line for plain scalar props", () => {
    const out = renderPropLine("disabled", prop({ type: "boolean" }), {}, "Button");
    expect(out).toEqual(["  disabled?: boolean;"]);
  });

  test("expands a `pattern: controllable` boolean into a triple", () => {
    const out = renderPropLine(
      "open",
      prop({ type: "boolean", pattern: "controllable" }),
      {},
      "Tooltip",
    );
    expect(out).toContain("  open?: boolean;");
    expect(out).toContain("  defaultOpen?: boolean;");
    expect(out).toContain("  onOpenChange?: (open: boolean) => void;");
  });

  test("wraps the type in `Responsive<…>` when responsive is true", () => {
    const out = renderPropLine("size", prop({ type: "string", responsive: true }), {}, "Button");
    expect(out).toEqual(["  size?: Responsive<string>;"]);
  });

  test("prepends a JSDoc line when a description is present", () => {
    const out = renderPropLine(
      "disabled",
      prop({ type: "boolean", description: "Whether the control is inert." }),
      {},
      "Button",
    );
    expect(out[0]).toBe("  /** Whether the control is inert. */");
  });
});

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

describe("renderOwnProps", () => {
  test("emits a minimal `{Name}OwnProps` block with children + ref", () => {
    const out = renderOwnProps(atomicSpec(), "Button", false, {});
    expect(out).toContain("type ButtonOwnProps = {");
    expect(out).toContain("  children?: ReactNode;");
    expect(out).toContain(`  ref?: Ref<HTMLElementTagNameMap["div"]>;`);
  });

  test("widens the ref to `Ref<HTMLElement>` when an `as` prop is declared", () => {
    const spec = atomicSpec({ props: { as: prop({ type: "string" }) } });
    const out = renderOwnProps(spec, "Button", false, {});
    expect(out).toContain("  ref?: Ref<HTMLElement>;");
  });

  test("uses the spec's `root` tag for the typed ref slot", () => {
    const out = renderOwnProps(
      atomicSpec({ root: { kind: "static", tag: "button" } }),
      "Button",
      false,
      {},
    );
    expect(out).toContain(`  ref?: Ref<HTMLElementTagNameMap["button"]>;`);
  });

  test("includes variant / intent / size lines when those facets exist", () => {
    const spec = atomicSpec({
      variants: { solid: { description: "" } },
      intents: { primary: { description: "" } },
      sizes: { md: { description: "" } },
    });
    const out = renderOwnProps(spec, "Button", false, {});
    expect(out).toContain("  variant?: ButtonVariant;");
    expect(out).toContain("  intent?: ButtonIntent;");
    expect(out).toContain("  size?: ButtonSize;");
  });

  test("wraps the size type in `Responsive<…>` when sizeIsResponsive is true", () => {
    const spec = atomicSpec({ sizes: { md: { description: "" } } });
    const out = renderOwnProps(spec, "Button", true, {});
    expect(out).toContain("  size?: Responsive<ButtonSize>;");
  });
});

describe("renderDestructure", () => {
  test("collapses to a one-liner under the 100-col line width", () => {
    const out = renderDestructure(atomicSpec());
    expect(out).toBe("  const { children, ref, className, ...rest } = props;");
  });

  test("breaks across multiple lines when the names exceed the width", () => {
    const spec = atomicSpec({
      props: {
        prop1234567890: prop({ type: "string" }),
        anotherLongPropName: prop({ type: "string" }),
        yetAnotherLongOne: prop({ type: "string" }),
        andOneMore: prop({ type: "string" }),
        almostThere: prop({ type: "string" }),
      },
    });
    const out = renderDestructure(spec);
    expect(out.startsWith("  const {\n")).toBe(true);
    expect(out).toContain("  } = props;");
    expect(out).toContain("    ...rest");
  });
});

describe("renderPropsTypeIntersection", () => {
  test("collapses to a one-liner under the 100-col line width", () => {
    const out = renderPropsTypeIntersection("X", "div");
    expect(out).toBe(
      `export type XProps = Readonly<XOwnProps & Omit<ComponentProps<"div">, keyof XOwnProps>>;`,
    );
  });

  test("breaks the intersection across lines when the one-liner exceeds the width", () => {
    const out = renderPropsTypeIntersection("VeryLongComponentName", "button");
    expect(out.startsWith("export type VeryLongComponentNameProps = Readonly<\n")).toBe(true);
    expect(out).toContain(">;");
  });
});
