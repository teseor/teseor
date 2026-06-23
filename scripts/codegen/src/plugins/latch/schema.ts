import { z } from "zod";

export const stateEntry = z.strictObject({
  type: z.literal("boolean"),
  initial: z.boolean(),
});
