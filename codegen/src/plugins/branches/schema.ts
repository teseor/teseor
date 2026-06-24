import { z } from "zod";

type WhenClause =
  | { propTruthy: string }
  | { propFalsy: string }
  | { stateTruthy: string }
  | { stateFalsy: string }
  | { all: WhenClause[] }
  | { any: WhenClause[] };

const whenClause: z.ZodType<WhenClause> = z.lazy(() =>
  z.union([
    z.strictObject({ propTruthy: z.string().min(1) }),
    z.strictObject({ propFalsy: z.string().min(1) }),
    z.strictObject({ stateTruthy: z.string().min(1) }),
    z.strictObject({ stateFalsy: z.string().min(1) }),
    z.strictObject({ all: z.array(whenClause).min(1) }),
    z.strictObject({ any: z.array(whenClause).min(1) }),
  ]),
);

const branchAttrValue = z.union([
  z.strictObject({ prop: z.string().min(1) }),
  z.strictObject({
    setState: z.strictObject({ name: z.string().min(1), to: z.boolean() }),
  }),
]);

const branchTextClause = z.union([
  z.strictObject({ prop: z.string().min(1) }),
  z.strictObject({
    compute: z.string().min(1),
    from: z.array(z.string().min(1)).min(1),
  }),
]);

export const branchEntry = z.strictObject({
  when: whenClause.optional(),
  element: z.string().min(1),
  attrs: z.record(z.string().min(1), branchAttrValue).optional(),
  text: branchTextClause.optional(),
});
