import { z } from "zod";
import type { SubstratePlugin } from "../../core/plugin.ts";

export const htmlAttrsPlugin: SubstratePlugin = {
  name: "htmlAttrs",
  schema: {
    atomic: { htmlAttrs: z.record(z.string().min(1), z.string()).optional() },
  },
};
