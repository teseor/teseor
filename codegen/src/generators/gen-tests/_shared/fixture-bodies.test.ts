import { describe, expect, test } from "vitest";
import type { FlatSpec } from "../../../lib/flatten.ts";
import { renderReactFixtureBody, renderVueFixtureBody } from "./fixture-bodies.ts";

const subject: FlatSpec = {
  name: "button",
  kind: "atomic",
  rootClass: "t-button",
  props: {
    variant: { type: "string", description: "Variant.", __part: "" },
    icon: { type: "string", description: "Icon slot.", slot: true, __part: "" },
    disabled: { type: "boolean", description: "Disabled flag.", __part: "" },
  },
  tokens: {},
  visualStates: {},
};

describe("renderReactFixtureBody", () => {
  test("renders regular props as JSX attributes and {LABEL} as the child", () => {
    expect(renderReactFixtureBody(subject, "Button", { variant: "solid" })).toBe(
      '<Button variant="solid">{LABEL}</Button>',
    );
  });

  test("threads slot props through the SLOT() helper", () => {
    expect(renderReactFixtureBody(subject, "Button", { icon: "star" })).toBe(
      '<Button icon={SLOT("star")}>{LABEL}</Button>',
    );
  });

  test("emits bare boolean attribute for `true` values", () => {
    expect(renderReactFixtureBody(subject, "Button", { disabled: true })).toBe(
      "<Button disabled>{LABEL}</Button>",
    );
  });
});

describe("renderVueFixtureBody", () => {
  test("renders props object plus default LABEL slot", () => {
    expect(renderVueFixtureBody(subject, "Button", { variant: "solid" })).toBe(
      'h(Button, { "variant": "solid" }, { default: LABEL })',
    );
  });

  test("renders an empty props object when there are no regular props", () => {
    expect(renderVueFixtureBody(subject, "Button", {})).toBe("h(Button, {}, { default: LABEL })");
  });

  test("routes slot props through SLOT() under their own slot name", () => {
    expect(renderVueFixtureBody(subject, "Button", { icon: "star" })).toBe(
      'h(Button, {}, { default: LABEL, icon: SLOT("star") })',
    );
  });
});

describe("defaultChildren", () => {
  const select: FlatSpec = {
    name: "select",
    kind: "atomic",
    root: { kind: "static", tag: "select" },
    rootClass: "t-select",
    defaultChildren: [
      { tag: "option", attrs: { value: "us" }, text: "United States" },
      { tag: "option", attrs: { value: "br" }, text: "Brazil" },
    ],
    props: {},
    tokens: {},
    visualStates: {},
  };

  test("React: emits each child as JSX inside the wrapper instead of {LABEL}", () => {
    expect(renderReactFixtureBody(select, "Select", {})).toBe(
      '<Select><option value="us">United States</option><option value="br">Brazil</option></Select>',
    );
  });

  test("Vue: emits an inline default slot returning the children array", () => {
    expect(renderVueFixtureBody(select, "Select", {})).toBe(
      'h(Select, {}, { default: () => [h("option", { "value": "us" }, "United States"), h("option", { "value": "br" }, "Brazil")] })',
    );
  });
});

describe("void atomic specs", () => {
  const image: FlatSpec = {
    name: "image",
    kind: "atomic",
    root: { kind: "static", tag: "img" },
    rootClass: "t-image",
    props: {},
    tokens: {},
    visualStates: {},
  };

  test("React: emits a self-closing tag without {LABEL}", () => {
    expect(renderReactFixtureBody(image, "Image", { src: "/a.jpg", alt: "x" })).toBe(
      '<Image src="/a.jpg" alt="x" />',
    );
  });

  test("Vue: omits the slots arg entirely when no slot props are present", () => {
    expect(renderVueFixtureBody(image, "Image", { src: "/a.jpg", alt: "x" })).toBe(
      'h(Image, { "src": "/a.jpg", "alt": "x" })',
    );
  });
});
