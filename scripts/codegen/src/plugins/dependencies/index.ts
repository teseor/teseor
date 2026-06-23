import { z } from "zod";
import type { SubstratePlugin } from "../../core/plugin.ts";

export const dependenciesPlugin: SubstratePlugin = {
  name: "dependencies",
  schema: {
    atomic: { dependencies: z.array(z.string()).optional() },
    composite: { dependencies: z.array(z.string()).optional() },
  },
  emit: {},
};
