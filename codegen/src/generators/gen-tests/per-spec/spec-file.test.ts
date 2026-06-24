import { describe, expect, test } from "vitest";
import type { FlatSpec } from "../../../lib/flatten.ts";
import { renderSpecFile } from "./spec-file.ts";

type SpecOverrides = Omit<Partial<FlatSpec>, "name"> & { name?: string };

function spec(overrides: SpecOverrides = {}): FlatSpec {
  return {
    name: "button",
    kind: "atomic",
    rootClass: "t-button",
    props: {},
    tokens: {},
    visualStates: {},
    ...overrides,
  };
}

describe("renderSpecFile", () => {
  test("uses spec.rootClass when set", () => {
    const out = renderSpecFile(spec({ rootClass: "t-btn", examples: [{ id: "default" }] }));
    expect(out).toContain('rootClass: "t-btn"');
  });

  test("falls back to `t-<name>` when rootClass is missing", () => {
    const out = renderSpecFile(
      spec({ name: "switch", rootClass: undefined, examples: [{ id: "default" }] }),
    );
    expect(out).toContain('rootClass: "t-switch"');
  });

  test("lists each example id verbatim under fixtureIds", () => {
    const out = renderSpecFile(
      spec({
        examples: [{ id: "default" }, { id: "primary" }],
      }),
    );
    expect(out).toContain('"default"');
    expect(out).toContain('"primary"');
  });

  test("throws when example ids collide", () => {
    expect(() => renderSpecFile(spec({ examples: [{ id: "x" }, { id: "x" }] }))).toThrow(
      /duplicate fixture id\(s\)/,
    );
  });
});
