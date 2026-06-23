import { z } from "zod";
import type { SubstratePlugin } from "../../core/plugin.ts";
import { stateEntry } from "./schema.ts";

export const latchPlugin: SubstratePlugin = {
  name: "latch",
  schema: {
    atomic: { state: z.record(z.string().min(1), stateEntry).optional() },
  },
};
