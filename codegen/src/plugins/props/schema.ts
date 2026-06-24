import { z } from "zod";

const tokenName = z.string().regex(/^--[A-Za-z0-9_-]+$/);

const propValueEntry = z.strictObject({
  description: z.string().min(1),
  tokens: z.record(z.string(), tokenName).optional(),
});

const propEntryInput = z.strictObject({
  type: z.enum(["string", "boolean", "number"]).optional(),
  default: z.unknown().optional(),
  description: z.string().min(1).optional(),
  responsive: z.boolean().optional(),
  slot: z.boolean().optional(),
  values: z.union([z.array(z.string()), z.record(z.string(), propValueEntry)]).optional(),
  pattern: z.literal("controllable").optional(),
});

export const propEntry = propEntryInput
  .superRefine((data, ctx) => {
    const valuesIsRecord = data.values !== undefined && !Array.isArray(data.values);
    if (valuesIsRecord) {
      if (data.type !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "`type:` must be omitted when `values:` is a record — the TS type is the union of value keys, not bare string",
          path: ["type"],
        });
      }
    } else {
      if (data.type === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "`type:` is required when `values:` is absent or an array",
          path: ["type"],
        });
      }
      if (data.description === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "`description:` is required when `values:` is absent or an array",
          path: ["description"],
        });
      }
    }
  })
  .transform((data) => {
    let valueKeys: string[] | undefined;
    let valueDocs: Record<string, z.infer<typeof propValueEntry>> | undefined;
    if (Array.isArray(data.values)) {
      valueKeys = data.values;
    } else if (data.values !== undefined) {
      valueKeys = Object.keys(data.values);
      valueDocs = data.values;
    }
    return {
      type: data.type ?? ("string" as const),
      default: data.default,
      description: data.description,
      responsive: data.responsive,
      slot: data.slot,
      values: valueKeys,
      valueDocs,
      pattern: data.pattern,
    };
  });
