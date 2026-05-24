import { describe, expect, test } from "vitest";
import type { FlatSpec } from "../../../lib/flatten.ts";
import { renderReactFixtureFile } from "./react-fixture.ts";

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

describe("renderReactFixtureFile", () => {
  test("imports the PascalCased component from @teseor/react", () => {
    const out = renderReactFixtureFile(spec({ examples: [{ id: "default" }] }));
    expect(out).toContain('import { Button } from "@teseor/react";');
  });

  test("emits one fixture entry per example, keyed by id", () => {
    const out = renderReactFixtureFile(
      spec({
        examples: [
          { id: "default", props: {} },
          { id: "primary", props: { variant: "solid" } },
        ],
      }),
    );
    expect(out).toContain('"default": () => <Button>{LABEL}</Button>');
    expect(out).toContain('"primary": () => <Button variant="solid">{LABEL}</Button>');
  });

  test("declares the SLOT helper only when a slot prop exists", () => {
    const withSlot = renderReactFixtureFile(
      spec({
        props: { icon: { type: "string", description: "Icon.", slot: true, __part: "" } },
        examples: [{ id: "i", props: { icon: "star" } }],
      }),
    );
    expect(withSlot).toContain("const SLOT = (name: string): ReactNode");

    const noSlot = renderReactFixtureFile(spec({ examples: [{ id: "x" }] }));
    expect(noSlot).not.toContain("const SLOT");
  });
});
