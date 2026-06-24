import { z } from "zod";

const polymorphicFlag = z.literal("asChild").optional();

const rootStatic = z.strictObject({
  kind: z.literal("static"),
  tag: z.string().regex(/^[a-z][a-z0-9-]*$/),
  polymorphic: polymorphicFlag,
});

const rootByProp = z.strictObject({
  kind: z.literal("byProp"),
  prop: z.string().min(1),
  map: z.record(z.string().min(1), z.string().min(1)),
  polymorphic: polymorphicFlag,
});

export const rootFragment = z.discriminatedUnion("kind", [rootStatic, rootByProp]);
