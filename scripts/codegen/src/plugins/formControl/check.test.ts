import { describe, expect, test } from "vitest";
import type { Vocabulary } from "../../lib/vocabulary.ts";
import { Spec } from "../../schema.ts";
import { checkFormControl } from "./check.ts";

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

function makeFormControl(overrides: Partial<Record<string, unknown>> = {}): Spec {
  return Spec.parse({
    name: "input",
    kind: "atomic",
    element: "input",
    rootClass: "t-input",
    formControl: true,
    examples: [{ id: "default" }],
    ...overrides,
  });
}

describe("checkFormControl", () => {
  test("accepts a minimal form-control spec on <input>", () => {
    expect(checkFormControl(makeFormControl(), vocabulary)).toEqual([]);
  });

  test("accepts a form-control on <textarea>", () => {
    const spec = makeFormControl({ element: "textarea", rootClass: "t-textarea" });
    expect(checkFormControl(spec, vocabulary)).toEqual([]);
  });

  test("accepts a form-control on <select>", () => {
    const spec = makeFormControl({ element: "select", rootClass: "t-select" });
    expect(checkFormControl(spec, vocabulary)).toEqual([]);
  });

  test("ignores specs without formControl: true", () => {
    const spec = Spec.parse({
      name: "button",
      kind: "atomic",
      element: "button",
      rootClass: "t-button",
      examples: [{ id: "default" }],
    });
    expect(checkFormControl(spec, vocabulary)).toEqual([]);
  });

  test("flags a form-control whose root is not in the allowed elements set", () => {
    const spec = makeFormControl({ element: "div", rootClass: "t-input" });
    const issues = checkFormControl(spec, vocabulary);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe("element");
    expect(issues[0]?.message).toMatch(/requires <div> to be one of/);
  });

  test("flags a form-control with redeclared shared props", () => {
    const spec = makeFormControl({
      props: {
        name: { type: "string", description: "Override.", responsive: false },
        required: { type: "boolean", description: "Override.", responsive: false },
      },
    });
    const issues = checkFormControl(spec, vocabulary);
    expect(issues).toHaveLength(2);
    expect(issues.map((i) => i.path).sort()).toEqual(["props.name", "props.required"]);
    for (const issue of issues) {
      expect(issue.message).toMatch(/part of the shared form-control contract/);
    }
  });

  test("flags a form-control whose elementByProp map mixes non-allowed tags", () => {
    const spec = Spec.parse({
      name: "input",
      kind: "atomic",
      formControl: true,
      rootClass: "t-input",
      examples: [{ id: "default" }],
      elementByProp: {
        prop: "as",
        map: { single: "input", multi: "div" },
      },
      props: {
        as: {
          type: "string",
          description: "Render mode.",
          responsive: false,
          values: ["single", "multi"],
        },
      },
    });
    const issues = checkFormControl(spec, vocabulary);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe("elementByProp.map");
    expect(issues[0]?.message).toMatch(/requires <div> to be one of/);
  });

  test("allows per-spec props that don't collide with the shared contract", () => {
    const spec = makeFormControl({
      props: {
        type: {
          type: "string",
          description: "Input type.",
          responsive: false,
          values: ["text", "email"],
        },
      },
    });
    expect(checkFormControl(spec, vocabulary)).toEqual([]);
  });
});
