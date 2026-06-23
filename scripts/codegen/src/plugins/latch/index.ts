import { z } from "zod";
import type { SubstratePlugin } from "../../core/plugin.ts";
import { latchEntry } from "./schema.ts";

export const latchPlugin: SubstratePlugin = {
  name: "latch",
  schema: {
    atomic: { latch: z.record(z.string().min(1), latchEntry).optional() },
  },
};
