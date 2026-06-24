import { z } from "zod";

// The part declaring `overlay:` is the floating element by definition;
// `anchor:` names a sibling part that wraps the consumer's children.
export const overlayBlock = z.strictObject({
  anchor: z.string().min(1),
  anchorVar: z.string().regex(/^--[A-Za-z0-9_-]+$/),
  mode: z.enum(["auto", "manual", "hint"]).default("manual"),
  modal: z.boolean().default(false),
});
