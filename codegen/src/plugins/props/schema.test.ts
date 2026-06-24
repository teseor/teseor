import { describe, expect, test } from "vitest";
import { propEntry } from "./schema.ts";

describe("propEntry — array-form values", () => {
  test("accepts `type: string` with array values + description", () => {
    const result = propEntry.safeParse({
      type: "string",
      values: ["solid", "outline"],
      description: "Visual weight.",
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.type).toBe("string");
    expect(result.data.values).toEqual(["solid", "outline"]);
    expect(result.data.valueDocs).toBeUndefined();
  });

  test("accepts `type: boolean` without values", () => {
    const result = propEntry.safeParse({
      type: "boolean",
      description: "Disables the control.",
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.type).toBe("boolean");
    expect(result.data.values).toBeUndefined();
    expect(result.data.valueDocs).toBeUndefined();
  });

  test("accepts `type: number` without values", () => {
    const result = propEntry.safeParse({
      type: "number",
      description: "Numeric input.",
    });
    expect(result.success).toBe(true);
  });

  test("rejects array values without `type:`", () => {
    const result = propEntry.safeParse({
      values: ["a", "b"],
      description: "missing type",
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues.some((i) => i.path.includes("type"))).toBe(true);
  });

  test("rejects `type:` without description", () => {
    const result = propEntry.safeParse({
      type: "string",
      values: ["a", "b"],
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues.some((i) => i.path.includes("description"))).toBe(true);
  });
});

describe("propEntry — record-form values", () => {
  test("accepts record values with per-entry description only", () => {
    const result = propEntry.safeParse({
      default: "solid",
      values: {
        solid: { description: "Filled background." },
        outline: { description: "Transparent with border." },
      },
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.values).toEqual(["solid", "outline"]);
    expect(result.data.valueDocs).toEqual({
      solid: { description: "Filled background." },
      outline: { description: "Transparent with border." },
    });
  });

  test("accepts per-entry tokens with valid CSS variable names", () => {
    const result = propEntry.safeParse({
      default: "neutral",
      values: {
        neutral: {
          description: "Default semantic color.",
          tokens: { bg: "--t-surface-muted", fg: "--t-on-surface" },
        },
        primary: {
          description: "Accent color.",
          tokens: { bg: "--t-accent", fg: "--t-on-accent" },
        },
      },
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.valueDocs?.neutral?.tokens).toEqual({
      bg: "--t-surface-muted",
      fg: "--t-on-surface",
    });
  });

  test("auto-derives `type: 'string'` on the normalized output", () => {
    const result = propEntry.safeParse({
      values: { sm: { description: "Small." } },
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.type).toBe("string");
  });

  test("accepts `responsive: true` alongside record values", () => {
    const result = propEntry.safeParse({
      default: "md",
      responsive: true,
      values: {
        sm: { description: "Small." },
        md: { description: "Medium." },
        lg: { description: "Large." },
      },
    });
    expect(result.success).toBe(true);
  });

  test("rejects `type:` when values is a record", () => {
    const result = propEntry.safeParse({
      type: "string",
      values: { a: { description: "A." } },
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues.some((i) => i.path.includes("type"))).toBe(true);
  });

  test("rejects per-entry description that is empty", () => {
    const result = propEntry.safeParse({
      values: { a: { description: "" } },
    });
    expect(result.success).toBe(false);
  });

  test("rejects per-entry tokens with invalid CSS-variable names", () => {
    const result = propEntry.safeParse({
      values: {
        a: { description: "A.", tokens: { bg: "not-a-css-var" } },
      },
    });
    expect(result.success).toBe(false);
  });

  test("rejects extra fields inside a value entry (strictObject)", () => {
    const result = propEntry.safeParse({
      values: { a: { description: "A.", unknown: true } },
    });
    expect(result.success).toBe(false);
  });
});

describe("propEntry — shared fields pass through", () => {
  test("preserves `default`, `responsive`, `slot`, `pattern` on legacy shape", () => {
    const result = propEntry.safeParse({
      type: "boolean",
      default: false,
      responsive: false,
      pattern: "controllable",
      description: "Open state.",
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.default).toBe(false);
    expect(result.data.responsive).toBe(false);
    expect(result.data.pattern).toBe("controllable");
  });

  test("rejects an unknown top-level field", () => {
    const result = propEntry.safeParse({
      type: "string",
      description: "x",
      unknown: true,
    });
    expect(result.success).toBe(false);
  });
});
