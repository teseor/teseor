import { z } from "zod";

export const motionFragment = z.strictObject({
  transitions: z.array(z.string()).optional(),
  enters: z.array(z.string()).optional(),
  exits: z.array(z.string()).optional(),
});
