import { describe, expect, test } from "vitest";
import { Spec } from "../../schema.ts";
import { checkVoidElementConstraints } from "./check.ts";

function makeSpec(s: unknown): Spec {
  return Spec.parse(s);
}

function makeVoid(tag: string, props: Record<string, unknown> = {}): Spec {
  return makeSpec({
    name: "divider",
    kind: "atomic",
    root: { kind: "static", tag },
    rootClass: "t-divider",
    props,
  });
}

describe("checkVoidElementConstraints", () => {
  test("ignores non-void elements", () => {
    const spec = makeVoid("div", {
      content: { slot: true, type: "string", responsive: false, description: "Body." },
      loading: { type: "boolean", responsive: false, description: "Loading." },
      as: {
        type: "string",
        values: ["div", "span"],
        responsive: false,
        description: "Polymorphic.",
      },
      disabled: { type: "boolean", responsive: false, description: "Disabled." },
    });
    expect(checkVoidElementConstraints(spec)).toEqual([]);
  });

  test("ignores a void element with no offending props", () => {
    expect(checkVoidElementConstraints(makeVoid("hr"))).toEqual([]);
  });

  test("flags slot props on a void element (one issue per slot)", () => {
    const spec = makeVoid("hr", {
      leading: { slot: true, type: "string", responsive: false, description: "Leading slot." },
      trailing: { slot: true, type: "string", responsive: false, description: "Trailing slot." },
    });
    const issues = checkVoidElementConstraints(spec);
    expect(issues.map((i) => i.path)).toEqual(["props.leading", "props.trailing"]);
    expect(issues[0]?.message).toMatch(/<hr> cannot host slot props/);
  });

  test("flags `loading` on a void element", () => {
    const spec = makeVoid("img", {
      loading: { type: "boolean", responsive: false, description: "Loading." },
    });
    const issues = checkVoidElementConstraints(spec);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe("props.loading");
    expect(issues[0]?.message).toMatch(/<img> cannot render a loading spinner/);
  });

  test("flags `as` on a void element", () => {
    const spec = makeVoid("hr", {
      as: { type: "string", values: ["hr", "div"], responsive: false, description: "Polymorphic." },
    });
    const issues = checkVoidElementConstraints(spec);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe("props.as");
    expect(issues[0]?.message).toMatch(/<hr> cannot declare `as`/);
  });

  test("flags `disabled` on a non-form-control void element", () => {
    const spec = makeVoid("img", {
      disabled: { type: "boolean", responsive: false, description: "Disabled." },
    });
    const issues = checkVoidElementConstraints(spec);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe("props.disabled");
    expect(issues[0]?.message).toMatch(/<img> ignores `disabled`/);
  });

  test("accepts `disabled` on <input> (form-control void)", () => {
    const spec = makeVoid("input", {
      disabled: { type: "boolean", responsive: false, description: "Disabled." },
    });
    expect(checkVoidElementConstraints(spec)).toEqual([]);
  });

  test("the schema rejects upper/mixed-case root tags (`INPUT`, `Input`)", () => {
    // The `root.tag` regex (`^[a-z][a-z0-9-]*$`) enforces lowercase at the
    // schema layer, so the void-element check never sees a case-variant tag.
    // `checkVoidElementConstraints` still lowercases defensively, but a spec
    // can no longer construct an uppercase tag to exercise it.
    for (const tag of ["INPUT", "Input"]) {
      const result = Spec.safeParse({
        name: "divider",
        kind: "atomic",
        root: { kind: "static", tag },
        rootClass: "t-divider",
      });
      expect(result.success).toBe(false);
    }
  });

  test("walks composite parts", () => {
    const spec = makeSpec({
      name: "field",
      kind: "composite",
      parts: {
        separator: {
          root: { kind: "static", tag: "hr" },
          props: {
            loading: { type: "boolean", description: "Loading." },
          },
        },
      },
    });
    const issues = checkVoidElementConstraints(spec);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe("parts.separator.props.loading");
  });
});
