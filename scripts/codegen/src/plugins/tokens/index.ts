import { z } from "zod";
import type { SubstratePlugin } from "../../core/plugin.ts";
import { tokenEntry } from "./schema.ts";

export const tokensPlugin: SubstratePlugin = {
  name: "tokens",
  schema: {
    atomic: {
      tokens: z.record(z.string(), tokenEntry).optional(),
      privateTokens: z.array(z.string()).optional(),
    },
    part: {
      tokens: z.record(z.string(), tokenEntry).optional(),
      privateTokens: z.array(z.string()).optional(),
    },
  },
  emit: {},
};
