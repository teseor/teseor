import { z } from "zod";
import type { SubstratePlugin } from "../../core/plugin.ts";
import { eventEntry, genericEntry } from "./schema.ts";

export const eventsPlugin: SubstratePlugin = {
  name: "events",
  schema: {
    atomic: {
      events: z.record(z.string(), eventEntry).optional(),
      generics: z.array(genericEntry).optional(),
    },
    composite: {
      events: z.record(z.string(), eventEntry).optional(),
      generics: z.array(genericEntry).optional(),
    },
  },
};
