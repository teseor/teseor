import { describe, expect, it } from "vitest";
import { computeAnalysis } from "./orchestrator.ts";
import type { SubstratePlugin } from "./plugin.ts";

const fakeSpec = { kind: "atomic", name: "x" } as never;

describe("orchestrator", () => {
  it("merges analysis fragments from multiple plugins in registry order", () => {
    const plugins: SubstratePlugin[] = [
      {
        name: "a",
        schema: {},
        analyze: () => ({ hasAs: true }),
      },
      {
        name: "b",
        schema: {},
        analyze: () => ({ hasPolymorphic: true }),
      },
    ];
    const result = computeAnalysis(fakeSpec, plugins);
    expect(result.hasAs).toBe(true);
    expect(result.hasPolymorphic).toBe(true);
  });
});
