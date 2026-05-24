import { describe, expect, it } from "vitest";
import type { FlatSpec } from "./flatten.ts";
import {
  reactJsDocFlavor,
  renderComponentJsDoc,
  renderExampleBlock,
  renderExampleProps,
  vueJsDocFlavor,
} from "./jsdoc-shape.ts";

function makeSpec(overrides: Partial<FlatSpec> = {}): FlatSpec {
  return {
    name: "button",
    kind: "atomic",
    props: {},
    tokens: {},
    states: {},
    ...overrides,
  };
}

describe("renderExampleProps", () => {
  it("returns empty string when props is undefined", () => {
    expect(renderExampleProps(undefined, reactJsDocFlavor)).toBe("");
  });

  it("returns empty string when props is empty", () => {
    expect(renderExampleProps({}, reactJsDocFlavor)).toBe("");
  });

  it("renders string props as quoted attributes (React)", () => {
    expect(renderExampleProps({ variant: "solid" }, reactJsDocFlavor)).toBe(' variant="solid"');
  });

  it("renders boolean true as bare attribute (React)", () => {
    expect(renderExampleProps({ disabled: true }, reactJsDocFlavor)).toBe(" disabled");
  });

  it("renders numbers via JSX expression syntax (React)", () => {
    expect(renderExampleProps({ count: 3 }, reactJsDocFlavor)).toBe(" count={3}");
  });

  it("renders objects via JSX expression syntax (React)", () => {
    expect(renderExampleProps({ data: { a: 1 } }, reactJsDocFlavor)).toBe(' data={{"a":1}}');
  });

  it("renders boolean false via expression syntax (React)", () => {
    // Only `true` triggers the bare-attribute shorthand; `false` flows through.
    expect(renderExampleProps({ disabled: false }, reactJsDocFlavor)).toBe(" disabled={false}");
  });

  it("renders numbers via bound-prop syntax (Vue)", () => {
    expect(renderExampleProps({ count: 3 }, vueJsDocFlavor)).toBe(" :count='3'");
  });

  it("renders objects via bound-prop syntax (Vue) using single-quoted outer", () => {
    // Outer is single-quoted because `JSON.stringify` produces double quotes
    // inside; double-quoting both layers would break the HTML attribute.
    expect(renderExampleProps({ data: { a: 1 } }, vueJsDocFlavor)).toBe(" :data='{\"a\":1}'");
  });

  it("joins multiple props in declaration order", () => {
    expect(
      renderExampleProps({ variant: "solid", disabled: true, count: 3 }, reactJsDocFlavor),
    ).toBe(' variant="solid" disabled count={3}');
  });
});

describe("renderExampleBlock", () => {
  it("renders a tsx-fenced block for React", () => {
    expect(
      renderExampleBlock(
        { id: "default", props: { variant: "solid" } },
        "Button",
        reactJsDocFlavor,
      ),
    ).toEqual([
      " * @example Default",
      " * ```tsx",
      ' * <Button variant="solid">Label</Button>',
      " * ```",
    ]);
  });

  it("renders a vue-fenced block for Vue", () => {
    expect(
      renderExampleBlock({ id: "default", props: { variant: "solid" } }, "Button", vueJsDocFlavor),
    ).toEqual([
      " * @example Default",
      " * ```vue",
      ' * <Button variant="solid">Label</Button>',
      " * ```",
    ]);
  });

  it("title-cases multi-segment ids", () => {
    expect(renderExampleBlock({ id: "with-icon" }, "Button", reactJsDocFlavor)[0]).toBe(
      " * @example With Icon",
    );
  });

  it("omits the title when example has no id", () => {
    expect(renderExampleBlock({}, "Button", reactJsDocFlavor)[0]).toBe(" * @example");
  });
});

describe("renderComponentJsDoc", () => {
  it("renders a block with description and examples (React, trailing newline)", () => {
    const spec = makeSpec({
      description: "A button.",
      examples: [
        { id: "default", props: { variant: "solid" } },
        { id: "ghost", props: { variant: "ghost" } },
      ],
    });
    expect(renderComponentJsDoc(spec, "Button", reactJsDocFlavor)).toBe(
      [
        "/**",
        " * A button.",
        " *",
        " * @example Default",
        " * ```tsx",
        ' * <Button variant="solid">Label</Button>',
        " * ```",
        " *",
        " * @example Ghost",
        " * ```tsx",
        ' * <Button variant="ghost">Label</Button>',
        " * ```",
        " */",
      ].join("\n") + "\n",
    );
  });

  it("renders a block with description and examples (Vue, no trailing newline)", () => {
    const spec = makeSpec({
      description: "A button.",
      examples: [{ id: "default", props: { variant: "solid" } }],
    });
    expect(renderComponentJsDoc(spec, "Button", vueJsDocFlavor)).toBe(
      [
        "/**",
        " * A button.",
        " *",
        " * @example Default",
        " * ```vue",
        ' * <Button variant="solid">Label</Button>',
        " * ```",
        " */",
      ].join("\n"),
    );
  });

  it("renders a block with no description (skips the description line)", () => {
    const spec = makeSpec({
      examples: [{ id: "default", props: { variant: "solid" } }],
    });
    expect(renderComponentJsDoc(spec, "Button", reactJsDocFlavor)).toBe(
      [
        "/**",
        " * @example Default",
        " * ```tsx",
        ' * <Button variant="solid">Label</Button>',
        " * ```",
        " */",
      ].join("\n") + "\n",
    );
  });

  it("renders an empty block when there is no description and no examples", () => {
    expect(renderComponentJsDoc(makeSpec(), "Button", reactJsDocFlavor)).toBe(
      ["/**", " */"].join("\n") + "\n",
    );
  });

  it("caps the number of examples at three", () => {
    const spec = makeSpec({
      examples: [{ id: "one" }, { id: "two" }, { id: "three" }, { id: "four" }, { id: "five" }],
    });
    const out = renderComponentJsDoc(spec, "Button", reactJsDocFlavor);
    expect(out).toContain("@example One");
    expect(out).toContain("@example Two");
    expect(out).toContain("@example Three");
    expect(out).not.toContain("@example Four");
    expect(out).not.toContain("@example Five");
  });
});
