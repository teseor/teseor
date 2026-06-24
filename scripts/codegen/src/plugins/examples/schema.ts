import { z } from "zod";

export const exampleEntry = z.strictObject({
  id: z.string().min(1),
  props: z.record(z.string(), z.unknown()).optional(),
});
