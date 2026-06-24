import { z } from "zod";
import type { SubstratePlugin } from "../../core/plugin.ts";
import { childSpec } from "./schema.ts";

export const defaultChildrenPlugin: SubstratePlugin = {
  name: "defaultChildren",
  schema: {
    atomic: { defaultChildren: z.array(childSpec).optional() },
  },
};
