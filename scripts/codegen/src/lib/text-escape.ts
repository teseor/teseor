/** Escape text for HTML content; `{}` are escaped because Astro reads them as expressions. */
export function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/{/g, "&lbrace;")
    .replace(/}/g, "&rbrace;");
}

/** Format any value as a string for display (null, boolean, number, object). */
export function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}
