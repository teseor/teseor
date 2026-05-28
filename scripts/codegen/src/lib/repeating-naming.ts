import type { FlatRepeatingPart } from "./flatten.ts";
import { pascalCase } from "./pascal-case.ts";

/**
 * Derives the TS item-type name for a repeating part (RFC-0005). Shared across
 * all four generators (contract / react / vue / docs) so the names match.
 *
 * The convention avoids collision between grouped and ungrouped repeating
 * parts in the same spec — earlier iterations singularized the groupKey
 * (`"pages"` → `"Page"`) which collided with an ungrouped `partName: "page"`.
 *
 *   Ungrouped: `<Name><PascalCase(partName)>Item`         e.g. `PaginationPageItem`
 *   Grouped:   `<Name><PascalCase(groupKey)>Item`         e.g. `XxxPagesItem`
 *   Grouped, "items"-shaped groupKey: `<Name>Item`        e.g. `TablistItem`
 *
 * The "items"-shaped special case (singularized form ≡ "item") keeps the
 * common case readable; other plural groupKeys take the doubled-suffix form
 * (`PagesItem`, `TabsItem`) which is mildly redundant but unambiguous.
 */
export function itemTypeName(componentName: string, part: FlatRepeatingPart): string {
  if (typeof part.groupKey === "string") {
    // Only the literal "items" (case-insensitive) takes the collapsed form.
    // Earlier the rule matched any groupKey whose naive singular was "item",
    // which collapsed both `groupKey: "items"` AND `groupKey: "item"` to the
    // same `<Name>Item` — a collision when both appeared in one spec.
    if (part.groupKey.toLowerCase() === "items") return `${componentName}Item`;
    return `${componentName}${pascalCase(part.groupKey)}Item`;
  }
  return `${componentName}${pascalCase(part.partName)}Item`;
}
