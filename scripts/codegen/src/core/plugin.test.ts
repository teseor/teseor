import { describe, expectTypeOf, it } from "vitest";
import type { SubstratePlugin } from "./plugin.ts";

describe("SubstratePlugin", () => {
  it("requires name and emit", () => {
    expectTypeOf<SubstratePlugin>().toHaveProperty("name");
    expectTypeOf<SubstratePlugin>().toHaveProperty("emit");
  });
});
