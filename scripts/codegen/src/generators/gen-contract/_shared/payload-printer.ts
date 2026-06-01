import type { PayloadEntry } from "../../../schema.ts";
import { quote } from "./type-printer.ts";

/**
 * Maps a `PayloadEntry` to a TypeScript type string. `nullable: true`
 * unions the entry with `null`. Recursive on `array.of`.
 */
export function payloadEntryToTS(entry: PayloadEntry): string {
  const base = renderBase(entry);
  return entry.nullable === true ? `${base} | null` : base;
}

function renderBase(entry: PayloadEntry): string {
  switch (entry.type) {
    case "string":
      return "string";
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "enum":
      return entry.values.map(quote).join(" | ");
    case "generic":
      return entry.ref;
    case "builtin":
      return entry.name;
    case "array":
      return `Array<${payloadEntryToTS(entry.of)}>`;
  }
}

/**
 * Renders an event's payload as an inline object-literal type body, e.g.
 * `reason: "outside" | "escape"; depth: number | null`. Returns an empty
 * string for an empty payload — the caller decides whether to emit `{}` or
 * a parameterless form. Every field is required (the schema has no
 * optional-field marker); `nullable: true` produces `T | null`, not `T?`.
 */
export function renderPayloadFields(payload: Record<string, PayloadEntry>): string {
  return Object.entries(payload)
    .map(([field, entry]) => `${field}: ${payloadEntryToTS(entry)}`)
    .join("; ");
}
