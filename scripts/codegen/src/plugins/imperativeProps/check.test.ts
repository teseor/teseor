import { describe, expect, test } from "vitest";
import type { Vocabulary } from "../../lib/vocabulary.ts";
import { Spec } from "../../schema.ts";
import { checkImperativeProps } from "./check.ts";

const vocabulary: Vocabulary = {
  components: [],
  props: [],
  propDescriptions: {},
  variants: [],
  intents: [],
  sizes: [],
  sizeMap: {},
  states: [],
  parts: [],
  events: { verbs: {}, synonyms: {}, pattern: "", builtins: {} },
  dom_events: {},
  keys: {},
  formControl: {
    elements: ["input", "textarea", "select"],
    props: {
      name: { type: "string", description: "HTML form field name." },
      form: { type: "string", description: "Form id association." },
      required: { type: "boolean", description: "Required field." },
      readOnly: { type: "boolean", description: "Read-only field." },
      disabled: { type: "boolean", description: "Disabled field." },
    },
  },
};

function makeCheckbox(overrides: Partial<Record<string, unknown>> = {}): Spec {
  return Spec.parse({
    name: "checkbox",
    kind: "atomic",
    element: "input",
    rootClass: "t-checkbox",
    formControl: true,
    htmlAttrs: { type: "checkbox" },
    imperativeProps: { indeterminate: { type: "boolean" } },
    examples: [{ id: "default" }],
    ...overrides,
  });
}

describe("checkImperativeProps", () => {
  test("accepts a minimal imperativeProps declaration", () => {
    expect(checkImperativeProps(makeCheckbox(), vocabulary)).toEqual([]);
  });

  test("ignores specs without imperativeProps", () => {
    const spec = Spec.parse({
      name: "switch",
      kind: "atomic",
      element: "input",
      rootClass: "t-switch",
      formControl: true,
      htmlAttrs: { type: "checkbox" },
      examples: [{ id: "default" }],
    });
    expect(checkImperativeProps(spec, vocabulary)).toEqual([]);
  });

  test("flags collision with a declared spec prop", () => {
    const spec = makeCheckbox({
      props: {
        indeterminate: {
          type: "boolean",
          description: "Overridden.",
          responsive: false,
        },
      },
    });
    const issues = checkImperativeProps(spec, vocabulary);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe("imperativeProps.indeterminate");
    expect(issues[0]?.message).toMatch(/already declared in props/);
  });

  test("flags collision with the formControl shared contract", () => {
    const spec = makeCheckbox({
      imperativeProps: { required: { type: "boolean" } },
    });
    const issues = checkImperativeProps(spec, vocabulary);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe("imperativeProps.required");
    expect(issues[0]?.message).toMatch(/part of the formControl shared contract/);
  });

  test("flags collision with reserved wrapper-template names", () => {
    const spec = makeCheckbox({
      imperativeProps: { children: { type: "boolean" } },
    });
    const issues = checkImperativeProps(spec, vocabulary);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe("imperativeProps.children");
    expect(issues[0]?.message).toMatch(/reserved by the wrapper template/);
  });
});
