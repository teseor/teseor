import { z } from "zod";

// Closed payload vocabulary — no raw TS fragments, no `unknown`/`any`, so the
// generated contract can't be widened past the schema's reach.
export type PayloadEntry =
  | { type: "string"; nullable?: boolean }
  | { type: "number"; nullable?: boolean }
  | { type: "boolean"; nullable?: boolean }
  | { type: "enum"; values: string[]; nullable?: boolean }
  | { type: "generic"; ref: string; nullable?: boolean }
  | { type: "builtin"; name: string; nullable?: boolean }
  | { type: "array"; of: PayloadEntry; nullable?: boolean };

export const payloadEntry: z.ZodType<PayloadEntry> = z.lazy(() =>
  z.discriminatedUnion("type", [
    z.strictObject({ type: z.literal("string"), nullable: z.boolean().optional() }),
    z.strictObject({ type: z.literal("number"), nullable: z.boolean().optional() }),
    z.strictObject({ type: z.literal("boolean"), nullable: z.boolean().optional() }),
    z.strictObject({
      type: z.literal("enum"),
      values: z.array(z.string()).min(1),
      nullable: z.boolean().optional(),
    }),
    z.strictObject({
      type: z.literal("generic"),
      ref: z.string().min(1),
      nullable: z.boolean().optional(),
    }),
    z.strictObject({
      type: z.literal("builtin"),
      name: z.string().min(1),
      nullable: z.boolean().optional(),
    }),
    z.strictObject({
      type: z.literal("array"),
      of: payloadEntry,
      nullable: z.boolean().optional(),
    }),
  ]),
);

export const eventEntry = z.strictObject({
  description: z.string().min(1),
  payload: z.record(z.string(), payloadEntry).default({}),
});

export const genericEntry = z.strictObject({
  name: z.string().regex(/^[A-Z][A-Za-z0-9]*$/),
  description: z.string().min(1),
});
