import type { Spec } from "../../gen-contract.ts";
import { quote } from "./type-printer.ts";

/** Emit the entries of the `attrs` computed object for the spec's a11y
 *  block: a static `role` (overridden to `"none"` when `decorativeProp` is
 *  true, or when `labelProp` is unset), an `aria-{name}` per entry in
 *  `ariaProps`, `aria-label` from `labelProp` when set, and `aria-hidden`
 *  driven by either `decorativeProp` (true) or `labelProp` (undefined). */
export function renderA11yAttrEntries(
  role: string | undefined,
  ariaProps: readonly string[],
  decorativeProp: string | undefined,
  labelProp?: string,
): string {
  return [
    role !== undefined && decorativeProp !== undefined
      ? `  role: ${decorativeProp} ? "none" : ${quote(role)},`
      : role !== undefined && labelProp !== undefined
        ? `  role: ${labelProp} === undefined ? "none" : ${quote(role)},`
        : role !== undefined
          ? `  role: ${quote(role)},`
          : null,
    ...ariaProps.map((name) => `  "aria-${name}": ${name},`),
    labelProp !== undefined ? `  "aria-label": ${labelProp},` : null,
    decorativeProp !== undefined
      ? `  "aria-hidden": ${decorativeProp} ? "true" : undefined,`
      : null,
    labelProp !== undefined
      ? `  "aria-hidden": ${labelProp} === undefined ? "true" : undefined,`
      : null,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

/** Emit the entries of the `attrs` computed object for an atomic wrapper.
 *  Combines variant/intent data-attrs, responsive data-attr spreads, per-prop
 *  `data-*` for non-responsive string-enum state props, the loading flag,
 *  per-prop `data-*` flags for boolean state props, and the disabled/aria-
 *  disabled pair (whose shape depends on whether the element is polymorphic
 *  via `as`). */
export function renderAttrEntries(
  spec: Spec,
  responsiveProps: string[],
  hasLoading: boolean,
  hasDisabled: boolean,
  hasAs: boolean,
  booleanStateProps: string[],
  stringEnumStateProps: string[],
): string {
  return [
    spec.variants ? `  "data-variant": variant,` : null,
    spec.intents ? `  "data-intent": intent,` : null,
    ...responsiveProps.map((name) => `  ...responsiveDataAttrs(${quote(name)}, ${name}),`),
    ...stringEnumStateProps.map((name) => `  "data-${name}": ${name},`),
    hasLoading ? `  "data-loading": loading ? "true" : undefined,` : null,
    ...booleanStateProps.map((name) => `  "data-${name}": ${name} ? "true" : undefined,`),
    hasDisabled && hasAs ? `  disabled: isButton.value ? inactive.value : undefined,` : null,
    hasDisabled && hasAs
      ? `  "aria-disabled": !isButton.value && inactive.value ? "true" : undefined,`
      : null,
    hasDisabled && !hasAs ? `  disabled: inactive.value,` : null,
    hasLoading ? `  "aria-busy": loading ? "true" : undefined,` : null,
  ]
    .filter((l): l is string => l !== null)
    .join("\n");
}
