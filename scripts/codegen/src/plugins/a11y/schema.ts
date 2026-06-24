import { z } from "zod";

export const a11yKeyboard = z.record(z.string(), z.string());

export const a11yBlock = z.strictObject({
  role: z.string().optional(),
  keyboard: a11yKeyboard.optional(),
  states: z.record(z.string(), z.string()).optional(),
  /** Forwards a declared prop's runtime value as an `aria-{prop}` attribute on
   *  the root element. Names are bare prop names (e.g. `orientation`);
   *  generators emit `aria-orientation={orientation}`. The prop must be
   *  declared, `type: string`, and `responsive: false`. */
  ariaProps: z.array(z.string().min(1)).optional(),
  /** Names a declared `type: boolean` prop. When that prop is `true` at
   *  runtime the root emits `role="none"` (overriding any static `role`) and
   *  `aria-hidden="true"`, removing the element from the accessibility tree. */
  decorativeProp: z.string().min(1).optional(),
  /** Names a declared `type: string`, non-responsive prop. The root is
   *  decorative by default (`aria-hidden="true"` and, if `role` is set,
   *  role overridden to `"none"`). When the prop has a value at runtime
   *  the root emits `aria-label={prop}` and the decorative attrs drop.
   *  Mutually exclusive with `decorativeProp`. */
  labelProp: z.string().min(1).optional(),
});
