import { describe, expect, test } from "vitest";
import type { Spec } from "../../gen-contract.ts";
import { renderExamples } from "./examples.ts";

function atomicSpec(overrides: Partial<Spec> = {}): Spec {
  return {
    name: "widget",
    kind: "atomic",
    props: {},
    tokens: {},
    visualStates: {},
    ...overrides,
  };
}

describe("renderExamples", () => {
  test("returns empty string when no examples are defined", () => {
    expect(renderExamples(atomicSpec(), "Widget", { isComposite: false })).toBe("");
  });

  test("returns empty string when examples is an empty array", () => {
    expect(renderExamples(atomicSpec({ examples: [] }), "Widget", { isComposite: false })).toBe("");
  });

  test("renders an atomic example with attrs and a code block", () => {
    const spec = atomicSpec({
      examples: [{ id: "default", props: { variant: "solid", disabled: true } }],
    });
    const rendered = renderExamples(spec, "Widget", { isComposite: false });
    expect(rendered).toContain("<h2>Examples</h2>");
    expect(rendered).toContain("<h3>default</h3>");
    expect(rendered).toContain('<Widget variant="solid" disabled>Widget</Widget>');
    expect(rendered).toContain("<Codeblock>");
  });

  test("drops `false` props from both the rendered tag and the source code", () => {
    const spec = atomicSpec({
      examples: [{ id: "off", props: { variant: "solid", disabled: false } }],
    });
    const rendered = renderExamples(spec, "Widget", { isComposite: false });
    expect(rendered).not.toContain("disabled");
  });

  test("drops slot props from the rendered attrs but keeps them in source for atomic specs", () => {
    const spec = atomicSpec({
      props: {
        text: { type: "string", description: "", slot: true, __part: "" },
      },
      examples: [{ id: "slot", props: { text: "Hello" } }],
    });
    const rendered = renderExamples(spec, "Widget", { isComposite: false });
    expect(rendered).toContain("<Widget>Widget</Widget>");
    expect(rendered).toContain('&lt;Widget text="Hello"&gt;Widget&lt;/Widget&gt;');
  });

  test("wraps composite examples with a Button trigger and hydrates client:visible", () => {
    const spec: Spec = {
      name: "tooltip",
      kind: "composite",
      props: {},
      tokens: {},
      visualStates: {},
      examples: [{ id: "default", props: { text: "Hi" } }],
    };
    const rendered = renderExamples(spec, "Tooltip", { isComposite: true });
    expect(rendered).toContain('<Tooltip text="Hi" client:visible>');
    expect(rendered).toContain('<Button variant="solid" intent="primary">Trigger</Button>');
    expect(rendered).toContain("</Tooltip>");
  });

  test("renders the example id as the heading", () => {
    const spec = atomicSpec({ examples: [{ id: "named", props: { variant: "solid" } }] });
    const rendered = renderExamples(spec, "Widget", { isComposite: false });
    expect(rendered).toContain("<h3>named</h3>");
  });

  test("renders a self-closing tag for atomic void elements in both preview and source", () => {
    const spec = atomicSpec({
      name: "image",
      element: "img",
      examples: [{ id: "cover", props: { src: "/x.jpg", alt: "x" } }],
    });
    const rendered = renderExamples(spec, "Image", { isComposite: false });
    expect(rendered).toContain('<Image src="/x.jpg" alt="x" />');
    expect(rendered).toContain('&lt;Image src="/x.jpg" alt="x" /&gt;');
    expect(rendered).not.toContain('<Image src="/x.jpg" alt="x">Image</Image>');
  });
});
