/** A JS-expression rendering of a value — for `prop={expr}` and responsive objects. */
export function jsLiteral(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "boolean" || typeof value === "number") return String(value);
  if (typeof value === "object") {
    const entries = Object.entries(value).map(([k, v]) => `${k}: ${jsLiteral(v)}`);
    return `{ ${entries.join(", ")} }`;
  }
  return JSON.stringify(String(value));
}

/** A JSX attribute for one example prop: `key="str"`, bare `key`, or `key={expr}`.
 * String values are routed through a JSX expression when they contain markup-
 * sensitive characters, so the emitted Astro page stays valid for any spec
 * input. Plain strings keep the readable `key="value"` shape. */
export function attr(key: string, value: unknown): string {
  if (typeof value === "string") {
    if (/[<>&"{}]/.test(value)) return `${key}={${JSON.stringify(value)}}`;
    return `${key}="${value}"`;
  }
  if (value === true) return key;
  return `${key}={${jsLiteral(value)}}`;
}
