function quote(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/**
 * Emit a TypeScript string-union type alias for an enum-shaped prop, e.g.
 * `type ButtonVariant = "solid" | "outline";`. Returns empty string when
 * `values` is empty so callers can concatenate unconditionally.
 */
export function renderEnumType(Name: string, kind: string, values: string[]): string {
  if (values.length === 0) return "";
  return `type ${Name}${kind} = ${values.map(quote).join(" | ")};\n`;
}
