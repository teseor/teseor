/** A JS-expression rendering of a value — for `prop={expr}` and responsive objects.
 * Arrays render as `[a, b, …]`; objects render as `{ key: value, … }` with
 * non-identifier keys quoted (e.g. responsive breakpoints like `2xl`). */
export function jsLiteral(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "boolean" || typeof value === "number") return String(value);
  if (Array.isArray(value)) {
    return `[${value.map((v) => jsLiteral(v)).join(", ")}]`;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value).map(([k, v]) => `${formatKey(k)}: ${jsLiteral(v)}`);
    return `{ ${entries.join(", ")} }`;
  }
  return JSON.stringify(String(value));
}

/** Identifier names safe to render unquoted as object keys in JS / TS / JSX. */
const JS_IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

function formatKey(key: string): string {
  return JS_IDENTIFIER.test(key) ? key : JSON.stringify(key);
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
