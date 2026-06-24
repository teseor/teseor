import { z } from "zod";

export const constraintEntry = z.strictObject({
  when: z.record(z.string(), z.unknown()),
  forbid: z.record(z.string(), z.unknown()),
  reason: z.string().min(1),
});
