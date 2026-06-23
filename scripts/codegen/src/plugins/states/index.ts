import { z } from "zod";
import type { SubstratePlugin } from "../../core/plugin.ts";
import { stateDef } from "./schema.ts";

export const statesPlugin: SubstratePlugin = {
  name: "states",
  schema: {
    part: { states: z.record(z.string(), stateDef).optional() },
  },
  emit: {},
};
