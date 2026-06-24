import { z } from "zod";

const tokenName = z.string().regex(/^--[A-Za-z0-9_-]+$/);

export const variantEntry = z.strictObject({
  description: z.string().min(1),
});

export const intentEntry = z.strictObject({
  description: z.string().min(1),
  tokens: z.record(z.string(), tokenName).optional(),
});

export const sizeEntry = z.strictObject({
  description: z.string().min(1),
  tokens: z.record(z.string(), tokenName).optional(),
});

export const visualStateEntry = z.strictObject({
  description: z.string().min(1),
});
