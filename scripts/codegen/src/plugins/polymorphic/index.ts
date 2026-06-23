import { z } from "zod";
import type { SubstratePlugin } from "../../core/plugin.ts";
import { analyzePolymorphic } from "./analyze.ts";
import { checkAsIsConstrained, checkPolymorphicAtomic } from "./check.ts";

export const polymorphicPlugin: SubstratePlugin = {
  name: "polymorphic",
  schema: {
    atomic: { polymorphic: z.enum(["asChild"]).optional() },
  },
  analyze: (spec) => analyzePolymorphic(spec),
  check: (spec) => [...checkAsIsConstrained(spec), ...checkPolymorphicAtomic(spec)],
  emit: {},
};
