import { z } from "zod";
import type { SubstratePlugin } from "../../core/plugin.ts";

export const formControlPlugin: SubstratePlugin = {
  name: "formControl",
  schema: {
    atomic: { formControl: z.boolean().optional() },
  },
  emit: {},
};
