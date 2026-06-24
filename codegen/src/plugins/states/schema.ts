import { z } from "zod";

// Shorthand `"open"` sugars to `{ to: "open" }`; long form unlocks `after:`,
// `when:`, and `emits:`. Semantic checks reject shorthand when any of those
// are needed.
const transitionTarget = z.union([
  z.string().min(1),
  z.strictObject({
    to: z.string().min(1),
    after: z.string().min(1).optional(),
    when: z.string().min(1).optional(),
    emits: z.record(z.string(), z.record(z.string(), z.unknown())).optional(),
  }),
]);

export const stateDef = z.strictObject({
  on: z.record(z.string(), transitionTarget).default({}),
});
