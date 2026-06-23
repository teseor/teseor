import { z } from "zod";
import type { SubstratePlugin } from "../../core/plugin.ts";

export const rootElementStaticPlugin: SubstratePlugin = {
  name: "rootElementStatic",
  schema: {
    atomic: { element: z.string().optional() },
    part: { element: z.string().optional() },
  },
  emit: {},
};
