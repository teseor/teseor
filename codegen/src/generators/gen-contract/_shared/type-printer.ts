/** Wraps a string value as a double-quoted TS string literal, escaping
 *  backslashes and embedded quotes. Used to print enum members in unions. */
export function quote(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/** Maps a spec primitive `type` to its TypeScript counterpart. Unknown types
 *  fall back to `unknown` so the contract still compiles. */
export function mapPropType(specType: string): string {
  switch (specType) {
    case "boolean":
      return "boolean";
    case "string":
      return "string";
    case "number":
      return "number";
    default:
      return "unknown";
  }
}

/** Wraps a base TS type in the `Responsive<…>` helper emitted by
 *  `renderResponsiveModule` (T or breakpoint-keyed Partial). */
export function responsiveType(baseType: string): string {
  return `Responsive<${baseType}>`;
}
