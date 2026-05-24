import type { Spec } from "../../gen-contract.ts";
import { quote } from "./type-printer.ts";

/** Emit the entries of the `attrs` computed object for an atomic wrapper.
 *  Combines variant/intent data-attrs, responsive data-attr spreads, the
 *  loading flag, and the disabled/aria-disabled pair (whose shape depends on
 *  whether the element is polymorphic via `as`). */
export function renderAttrEntries(
  spec: Spec,
  responsiveProps: string[],
  hasLoading: boolean,
  hasDisabled: boolean,
  hasAs: boolean,
): string {
  return [
    spec.variants ? `  "data-variant": variant,` : null,
    spec.intents ? `  "data-intent": intent,` : null,
    ...responsiveProps.map((name) => `  ...responsiveDataAttrs(${quote(name)}, ${name}),`),
    hasLoading ? `  "data-loading": loading ? "true" : undefined,` : null,
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
