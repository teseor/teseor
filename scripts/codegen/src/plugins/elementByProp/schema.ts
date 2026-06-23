import { z } from "zod";

export const elementByPropBlock = z.strictObject({
  prop: z.string().min(1),
  map: z.record(z.string().min(1), z.string().min(1)),
});
