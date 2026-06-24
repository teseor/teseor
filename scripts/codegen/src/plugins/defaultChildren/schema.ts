import { z } from "zod";

export const childSpec = z.strictObject({
  tag: z.string().regex(/^[a-z][a-z0-9-]*$/, "must be a lowercase HTML tag name"),
  attrs: z.record(z.string().min(1), z.union([z.string(), z.number(), z.boolean()])).optional(),
  text: z.string().optional(),
});
