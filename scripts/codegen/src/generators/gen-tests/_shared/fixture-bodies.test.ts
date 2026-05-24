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
  states: {},
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
