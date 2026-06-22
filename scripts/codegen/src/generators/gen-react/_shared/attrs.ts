import type { Spec } from "../../gen-contract.ts";
import { quote } from "./type-printer.ts";

/** Emit the JSX-attribute lines for variant/intent data-attrs, responsive
 *  data-attr spreads, the `data-loading` flag, and per-prop `data-*` flags
 *  for boolean state props — slotted into the wrapper root in the order
 *  defined by the spec. */
export function renderDataAttrs(
  spec: Spec,
  responsiveProps: string[],
  hasLoading: boolean,
  booleanStateProps: string[],
): string {
  return [
    spec.variants ? `      data-variant={variant}` : null,
    spec.intents ? `      data-intent={intent}` : null,
    ...responsiveProps.map((name) => `      {...responsiveDataAttrs(${quote(name)}, ${name})}`),
    hasLoading ? `      data-loading={loading === true ? "true" : undefined}` : null,
    ...booleanStateProps.map(
      (name) => `      data-${name}={${name} === true ? "true" : undefined}`,
    ),
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

/** Emit the JSX-attribute lines for the disabled / aria-disabled / aria-busy
 *  state attrs. The disabled pair branches on whether the element is
 *  polymorphic via `as` — buttons get `disabled`, anything else gets
 *  `aria-disabled`. */
export function renderStateAttrs(
  hasAs: boolean,
  hasDisabled: boolean,
  hasLoading: boolean,
): string {
  return [
    hasDisabled && hasAs ? `      disabled={isButton ? inactive : undefined}` : null,
    hasDisabled && hasAs
      ? `      aria-disabled={!isButton && inactive ? "true" : undefined}`
      : null,
    hasDisabled && !hasAs ? `      disabled={inactive}` : null,
    hasLoading ? `      aria-busy={loading === true ? "true" : undefined}` : null,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}
