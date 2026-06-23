import { z } from "zod";
import type { SubstratePlugin } from "../../core/plugin.ts";
import { checkExamplesPresent } from "./check.ts";
import { exampleEntry } from "./schema.ts";

export const examplesPlugin: SubstratePlugin = {
  name: "examples",
  schema: {
    atomic: { examples: z.array(exampleEntry).optional() },
    composite: { examples: z.array(exampleEntry).optional() },
  },
  check: (spec) => checkExamplesPresent(spec),
  emit: {},
};
