import { describe, expect, test } from "vitest";
import type { FlatSpec } from "../../../lib/flatten.ts";
import { renderVueFixtureFile } from "./vue-fixture.ts";

type SpecOverrides = Omit<Partial<FlatSpec>, "name"> & { name?: string };

function spec(overrides: SpecOverrides = {}): FlatSpec {
  return {
    name: "button",
    kind: "atomic",
    rootClass: "t-button",
    props: {},
    tokens: {},
    states: {},
    ...overrides,
  };
}

describe("renderVueFixtureFile", () => {
  test("imports `h` from vue and the PascalCased component from @teseor/vue", () => {
    const out = renderVueFixtureFile(spec({ examples: [{ id: "default" }] }));
    expect(out).toContain('import { h, type VNode } from "vue";');
    expect(out).toContain('import { Button } from "@teseor/vue";');
  });

  test("emits one fixture entry per example, keyed by id", () => {
    const out = renderVueFixtureFile(
      spec({
        examples: [{ id: "default" }, { id: "primary", props: { variant: "solid" } }],
      }),
    );
    expect(out).toContain('"default": () => h(Button, {}, { default: LABEL })');
    expect(out).toContain('"primary": () => h(Button, { "variant": "solid" }, { default: LABEL })');
  });

  test("declares the SLOT helper only when a slot prop exists", () => {
    const withSlot = renderVueFixtureFile(
      spec({
        props: { icon: { type: "string", description: "Icon.", slot: true, __part: "" } },
        examples: [{ id: "i", props: { icon: "star" } }],
      }),
    );
    expect(withSlot).toContain('const SLOT = (name: string) => () => h("span",');

    const noSlot = renderVueFixtureFile(spec({ examples: [{ id: "x" }] }));
    expect(noSlot).not.toContain("const SLOT");
  });
});
