import { z } from "zod";
import type { SubstratePlugin } from "../../core/plugin.ts";
import { checkExamplesReferences, checkVariantChoiceKeys } from "./check.ts";
import { intentEntry, sizeEntry, variantEntry, visualStateEntry } from "./schema.ts";

export const variantsPlugin: SubstratePlugin = {
  name: "variants",
  schema: {
    atomic: {
      variants: z.record(z.string(), variantEntry).optional(),
      intents: z.record(z.string(), intentEntry).optional(),
      sizes: z.record(z.string(), sizeEntry).optional(),
      visualStates: z.record(z.string(), visualStateEntry).optional(),
    },
    part: {
      variants: z.record(z.string(), variantEntry).optional(),
      intents: z.record(z.string(), intentEntry).optional(),
      sizes: z.record(z.string(), sizeEntry).optional(),
      visualStates: z.record(z.string(), visualStateEntry).optional(),
    },
  },
  check: (spec) => [...checkExamplesReferences(spec), ...checkVariantChoiceKeys(spec)],
  emit: {},
};
