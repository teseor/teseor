import { describe, expect, it } from "vitest";
import { computeAnalysis, emitSlot } from "./orchestrator.ts";
import type { SubstratePlugin } from "./plugin.ts";

const fakeSpec = { kind: "atomic", name: "x" } as never;

describe("orchestrator", () => {
  it("append joins lines from multiple plugins in registry order", () => {
    const plugins: SubstratePlugin[] = [
      {
        name: "a",
        schema: {},
        emit: {
          "react.module.imports": () => ({
            kind: "append",
            slot: "react.module.imports",
            lines: ["import a;"],
          }),
        },
      },
      {
        name: "b",
        schema: {},
        emit: {
          "react.module.imports": () => ({
            kind: "append",
            slot: "react.module.imports",
            lines: ["import b;"],
          }),
        },
      },
    ];
    const a = computeAnalysis(fakeSpec, plugins);
    expect(emitSlot(fakeSpec, a, "react", "react.module.imports", plugins)).toBe(
      "import a;\nimport b;",
    );
  });

  it("exclusive rejects multiple claimants", () => {
    const plugins: SubstratePlugin[] = [
      {
        name: "a",
        schema: {},
        emit: {
          "react.root.tag": () => ({
            kind: "exclusive",
            slot: "react.root.tag",
            value: "div",
          }),
        },
      },
      {
        name: "b",
        schema: {},
        emit: {
          "react.root.tag": () => ({
            kind: "exclusive",
            slot: "react.root.tag",
            value: "span",
          }),
        },
      },
    ];
    const a = computeAnalysis(fakeSpec, plugins);
    expect(() => emitSlot(fakeSpec, a, "react", "react.root.tag", plugins)).toThrow(
      /claimed by 2 plugins/,
    );
  });
});
