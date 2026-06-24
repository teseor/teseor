import { z } from "zod";

export const imperativePropsRecord = z
  .record(
    z.string().regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, "must be a valid JS identifier"),
    z.strictObject({
      type: z.literal("boolean"),
      description: z.string().optional(),
    }),
  )
  .optional();
