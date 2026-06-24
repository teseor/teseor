import { z } from "zod";

export const tokenName = z.string().regex(/^--[A-Za-z0-9_-]+$/);

// Permissive: token-shape resolution is a semantic check, not a schema gate —
// some fallbacks are literal CSS values (`stretch`, `flex-start`, `none`).
const fallbackValue = z.string().min(1);

export const tokenEntry = z.strictObject({
  fallback: fallbackValue,
  desc: z.string().min(1),
});
