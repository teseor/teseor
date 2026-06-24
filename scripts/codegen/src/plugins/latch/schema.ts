import { z } from "zod";

export const latchEntry = z.strictObject({
  type: z.literal("boolean"),
  initial: z.boolean(),
});
