import { describe, expectTypeOf, it } from "vitest";
import type { SubstratePlugin } from "./plugin.ts";

describe("SubstratePlugin", () => {
  it("requires name and schema", () => {
    expectTypeOf<SubstratePlugin>().toHaveProperty("name");
    expectTypeOf<SubstratePlugin>().toHaveProperty("schema");
  });
});
