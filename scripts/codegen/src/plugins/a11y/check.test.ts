import { describe, expect, test } from "vitest";
import { Spec } from "../../schema.ts";
import { checkA11yRefs } from "./check.ts";

function makeSpec(s: unknown): Spec {
  return Spec.parse(s);
}

describe("checkA11yRefs", () => {
  function dividerSpec(overrides: Record<string, unknown> = {}): Spec {
    return makeSpec({
      name: "divider",
      kind: "atomic",
      rootClass: "t-divider",
      element: "div",
      props: {
        orientation: {
          type: "string",
          values: ["horizontal", "vertical"],
          responsive: false,
          description: "Axis.",
        },
        decorative: {
          type: "boolean",
          responsive: false,
          description: "Decorative.",
        },
      },
      a11y: {
        role: "separator",
        ariaProps: ["orientation"],
        decorativeProp: "decorative",
      },
      ...overrides,
    });
  }

  test("passes when ariaProps + decorativeProp reference matching props", () => {
    expect(checkA11yRefs(dividerSpec())).toEqual([]);
  });

  test("rejects when ariaProps references an undeclared prop", () => {
    const spec = dividerSpec({
      a11y: { role: "separator", ariaProps: ["bogus"], decorativeProp: "decorative" },
    });
    const issues = checkA11yRefs(spec);
    expect(issues.some((i) => i.path === "a11y.ariaProps")).toBe(true);
    expect(issues.find((i) => i.path === "a11y.ariaProps")?.message).toMatch(/not declared/);
  });

  test("rejects when ariaProps references a boolean prop", () => {
    const spec = dividerSpec({
      a11y: { ariaProps: ["decorative"], decorativeProp: "decorative" },
    });
    const issues = checkA11yRefs(spec);
    expect(issues.some((i) => i.message.includes("type: 'string'"))).toBe(true);
  });

  test("rejects when ariaProps references a responsive prop", () => {
    const spec = dividerSpec({
      props: {
        orientation: {
          type: "string",
          values: ["horizontal", "vertical"],
          responsive: true,
          description: "Axis.",
        },
        decorative: {
          type: "boolean",
          responsive: false,
          description: "Decorative.",
        },
      },
    });
    const issues = checkA11yRefs(spec);
    expect(issues.some((i) => i.message.includes("non-responsive"))).toBe(true);
  });

  test("rejects when decorativeProp references an undeclared prop", () => {
    const spec = dividerSpec({
      a11y: { role: "separator", ariaProps: ["orientation"], decorativeProp: "bogus" },
    });
    const issues = checkA11yRefs(spec);
    expect(issues.some((i) => i.path === "a11y.decorativeProp")).toBe(true);
  });

  test("rejects when decorativeProp references a string prop", () => {
    const spec = dividerSpec({
      a11y: { ariaProps: ["orientation"], decorativeProp: "orientation" },
    });
    const issues = checkA11yRefs(spec);
    expect(issues.some((i) => i.message.includes("type: 'boolean'"))).toBe(true);
  });

  test("passes when only role is declared", () => {
    const spec = dividerSpec({ a11y: { role: "separator" } });
    expect(checkA11yRefs(spec)).toEqual([]);
  });

  function dotSpec(overrides: Record<string, unknown> = {}): Spec {
    return makeSpec({
      name: "dot",
      kind: "atomic",
      rootClass: "t-dot",
      element: "span",
      props: {
        label: {
          type: "string",
          responsive: false,
          description: "Accessible name when meaningful.",
        },
      },
      a11y: {
        role: "img",
        labelProp: "label",
      },
      ...overrides,
    });
  }

  test("passes when labelProp references a non-responsive string prop", () => {
    expect(checkA11yRefs(dotSpec())).toEqual([]);
  });

  test("rejects when labelProp references an undeclared prop", () => {
    const spec = dotSpec({ a11y: { role: "img", labelProp: "bogus" } });
    const issues = checkA11yRefs(spec);
    expect(issues.some((i) => i.path === "a11y.labelProp")).toBe(true);
    expect(issues.find((i) => i.path === "a11y.labelProp")?.message).toMatch(/not declared/);
  });

  test("rejects when labelProp references a boolean prop", () => {
    const spec = dotSpec({
      props: {
        label: {
          type: "boolean",
          responsive: false,
          description: "Wrong type.",
        },
      },
    });
    const issues = checkA11yRefs(spec);
    expect(issues.some((i) => i.message.includes("type: 'string'"))).toBe(true);
  });

  test("rejects when labelProp references a responsive prop", () => {
    const spec = dotSpec({
      props: {
        label: {
          type: "string",
          responsive: true,
          description: "Should be non-responsive.",
        },
      },
    });
    const issues = checkA11yRefs(spec);
    expect(issues.some((i) => i.message.includes("non-responsive"))).toBe(true);
  });

  test("rejects when both decorativeProp and labelProp are declared", () => {
    const spec = dotSpec({
      props: {
        label: { type: "string", responsive: false, description: "Accessible name." },
        decorative: { type: "boolean", responsive: false, description: "Decorative." },
      },
      a11y: { role: "img", labelProp: "label", decorativeProp: "decorative" },
    });
    const issues = checkA11yRefs(spec);
    expect(issues.some((i) => i.message.includes("mutually exclusive"))).toBe(true);
  });
});
