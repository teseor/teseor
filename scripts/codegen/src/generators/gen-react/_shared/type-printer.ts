import { pascalCase } from "../../../lib/pascal-case.ts";
import type { SpecProp } from "../../gen-contract.ts";

/** Wraps a string value as a double-quoted TS string literal, escaping
 *  backslashes and embedded quotes. Used to print enum members in unions. */
export function quote(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/** Maps a spec primitive `type` to its TypeScript counterpart. Unknown types
 *  fall back to `unknown` so the wrapper still compiles. */
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

/** Wraps a base TS type in the `Responsive<…>` helper emitted by the
 *  per-package `_runtime.ts` (T or breakpoint-keyed Partial). */
export function responsiveType(baseType: string): string {
  return `Responsive<${baseType}>`;
}

/** React-specific TS prop type: atomic-root slots collapse to `ReactNode`
 *  (those accept renderable content), composite-part slots keep their
 *  declared scalar type, enum-valued props widen to the per-component union.
 *  `__part` is "" / undefined for atomic-root, the part name for composite. */
export function reactPropType(propName: string, propDef: SpecProp, Name: string): string {
  // Atomic-root slots (Button's iconStart/iconEnd) accept renderable content
  // → ReactNode. Composite-part slots (Tooltip's text on the content part)
  // are scalar body content → use the declared type. The `__part` marker
  // (set by flattenSpec) is "" for atomic-root, the part name for composite.
  if (propDef.slot === true) {
    // `__part` is "" / undefined for atomic-root props, the part name for
    // composite. Tests that bypass flatten see `undefined`; treat both as
    // the atomic-root case.
    return !propDef.__part ? "ReactNode" : mapPropType(propDef.type);
  }
  if (propDef.values && propDef.values.length > 0) return `${Name}${pascalCase(propName)}`;
  return mapPropType(propDef.type);
}
