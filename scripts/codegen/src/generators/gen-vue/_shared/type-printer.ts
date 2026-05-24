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

/** Vue-specific TS prop type: atomic-slot props collapse to `never` (those
 *  flow as `<slot name="…" />`, not props), composite-part slots keep their
 *  scalar type, enum-valued props widen to the per-component union. */
export function vuePropType(propName: string, propDef: SpecProp, Name: string): string {
  // Atomic slots flow via `<slot name="…" />` (prop unsettable → `never`).
  // Composite-part slots are inline scalars — keep the declared type.
  if (propDef.slot === true) return !propDef.__part ? "never" : mapPropType(propDef.type);
  if (propDef.values && propDef.values.length > 0) return `${Name}${pascalCase(propName)}`;
  return mapPropType(propDef.type);
}
