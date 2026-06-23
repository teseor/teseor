import { z } from "zod";

export const propEntry = z.strictObject({
  type: z.enum(["string", "boolean", "number"]),
  default: z.unknown().optional(),
  description: z.string().min(1),
  responsive: z.boolean().optional(),
  slot: z.boolean().optional(),
  values: z.array(z.string()).optional(),
  pattern: z.literal("controllable").optional(),
});
